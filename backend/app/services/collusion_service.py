from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any, Optional

import pandas as pd

from backend.app.database.session import SessionLocal
from backend.app.database.models import AuditLogRecord
from backend.app.schemas.collusion import (
    BidScoreResponse,
    TenderScoreResponse,
    ScoredBidItem,
    BidExplainResponse,
    ShapContributionItem,
    TenderSummary,
    TenderListResponse,
    CollusionPerformanceResponse,
    CustomBidSimRequest,
    CustomBidSimResponse,
)
from ml.inference import bid_anomaly_detection as detector
from ml.explainability import explain_bid_anomaly as explainer

logger = logging.getLogger("freight.collusion")


def _get_project_root() -> Path:
    return Path(__file__).resolve().parents[3]


class CollusionService:
    def __init__(self) -> None:
        self._data_cache: Optional[pd.DataFrame] = None
        self._artifact_cache: Optional[dict[str, Any]] = None

    def _get_artifact(self) -> dict[str, Any]:
        if self._artifact_cache is None:
            self._artifact_cache = detector._load_artifact()
        return self._artifact_cache

    def _get_data(self) -> pd.DataFrame:
        if self._data_cache is None:
            csv_path = (
                _get_project_root()
                / "data"
                / "raw"
                / "collusion"
                / "bid_tender_records_synthetic.csv"
            )
            if csv_path.exists():
                self._data_cache = pd.read_csv(csv_path, parse_dates=["tender_date"])
            else:
                self._data_cache = pd.DataFrame()
        return self._data_cache

    def list_tenders(self, limit: int = 50, status_filter: Optional[str] = None) -> TenderListResponse:
        data = self._get_data()
        if data.empty:
            return TenderListResponse(total_tenders=0, flagged_tenders=0, clean_tenders=0, tenders=[])

        grouped = data.groupby("tender_id")
        tenders: list[TenderSummary] = []
        total_flagged = 0

        for tender_id, group in grouped:
            first = group.iloc[0]
            flagged_count = int(group["synthetic_anomaly_ground_truth"].sum())
            if flagged_count > 0:
                total_flagged += 1

            status = "FLAGGED" if flagged_count > 0 else "NORMAL"
            if status_filter and status != status_filter.upper():
                continue

            quotes = group["quoted_freight_usd_mt"]
            tenders.append(
                TenderSummary(
                    tender_id=str(tender_id),
                    tender_date=str(first["tender_date"]).split(" ")[0],
                    origin=str(first["origin"]),
                    destination_port=str(first["destination_port"]),
                    cargo_type=str(first["cargo_type"]),
                    vessel_class=str(first["vessel_class"]),
                    route_id=str(first["route_id"]),
                    total_bids=len(group),
                    min_quoted_freight=float(quotes.min()),
                    max_quoted_freight=float(quotes.max()),
                    predicted_fair_value=float(first["predicted_fair_value_usd_mt"]),
                    bid_spread_pct=float(first["bid_spread_pct"]),
                    flagged_count=flagged_count,
                    status=status,
                )
            )

        # Prioritize flagged tenders so reviewers and evaluators see anomalies first
        tenders.sort(key=lambda t: (t.flagged_count > 0, t.tender_date), reverse=True)

        return TenderListResponse(
            total_tenders=len(grouped),
            flagged_tenders=total_flagged,
            clean_tenders=len(grouped) - total_flagged,
            tenders=tenders[:limit],
        )

    def get_tender(self, tender_id: str, threshold: float = 0.5) -> TenderScoreResponse:
        data = self._get_data()
        group = data[data["tender_id"] == tender_id]
        if group.empty:
            raise ValueError(f"Tender '{tender_id}' not found.")

        artifact = self._get_artifact()
        scored_bids: list[ScoredBidItem] = []
        max_prob = 0.0
        riskiest_broker = None
        flagged_count = 0

        first = group.iloc[0]

        for _, row in group.iterrows():
            res = detector.score_bid(row, threshold=threshold, artifact=artifact)
            prob = res["anomaly_probability"]
            is_flagged = res["flagged"]
            if is_flagged:
                flagged_count += 1
            if prob > max_prob:
                max_prob = prob
                riskiest_broker = str(row["broker_id"])

            scored_bids.append(
                ScoredBidItem(
                    tender_id=str(row["tender_id"]),
                    broker_id=str(row["broker_id"]),
                    quoted_freight_usd_mt=float(row["quoted_freight_usd_mt"]),
                    market_freight_usd_mt=float(row["market_freight_usd_mt"]),
                    predicted_fair_value_usd_mt=float(row["predicted_fair_value_usd_mt"]),
                    bid_deviation_pct=float(row["bid_deviation_pct"]),
                    bid_rank=int(row["bid_rank"]),
                    winner=int(row["winner"]),
                    anomaly_probability=prob,
                    flagged=is_flagged,
                    fair_value_band_breach=int(row["fair_value_band_breach"]),
                    high_positive_deviation_flag=int(row["high_positive_deviation_flag"]),
                    origin=str(row["origin"]),
                    destination_port=str(row["destination_port"]),
                    vessel_class=str(row["vessel_class"]),
                )
            )

        scored_bids.sort(key=lambda b: b.quoted_freight_usd_mt)

        return TenderScoreResponse(
            tender_id=tender_id,
            tender_date=str(first["tender_date"]).split(" ")[0],
            origin=str(first["origin"]),
            destination_port=str(first["destination_port"]),
            cargo_type=str(first["cargo_type"]),
            vessel_class=str(first["vessel_class"]),
            total_bids=len(scored_bids),
            flagged_count=flagged_count,
            highest_anomaly_probability=round(max_prob, 4),
            highest_risk_broker=riskiest_broker,
            tender_status="ANOMALOUS_FLAGGED" if flagged_count > 0 else "CLEAN",
            threshold_used=threshold,
            bids=scored_bids,
            audit_logged=False,
        )

    def score_tender(
        self, tender_id: str, custom_bids: Optional[list[dict[str, Any]]] = None, threshold: float = 0.5
    ) -> TenderScoreResponse:
        artifact = self._get_artifact()
        scored_bids: list[ScoredBidItem] = []
        max_prob = 0.0
        riskiest_broker = None
        flagged_count = 0

        if custom_bids:
            df = pd.DataFrame(custom_bids)
            first = custom_bids[0]
            origin = first.get("origin")
            dest = first.get("destination_port")
            cargo = first.get("cargo_type")
            vclass = first.get("vessel_class")
            tdate = first.get("tender_date")

            for _, row in df.iterrows():
                res = detector.score_bid(row, threshold=threshold, artifact=artifact)
                prob = res["anomaly_probability"]
                is_flagged = res["flagged"]
                if is_flagged:
                    flagged_count += 1
                if prob > max_prob:
                    max_prob = prob
                    riskiest_broker = str(row.get("broker_id"))

                scored_bids.append(
                    ScoredBidItem(
                        tender_id=str(row.get("tender_id", tender_id)),
                        broker_id=str(row.get("broker_id")),
                        quoted_freight_usd_mt=float(row.get("quoted_freight_usd_mt", 0.0)),
                        market_freight_usd_mt=float(row.get("market_freight_usd_mt", 0.0)),
                        predicted_fair_value_usd_mt=float(row.get("predicted_fair_value_usd_mt", 0.0)),
                        bid_deviation_pct=float(row.get("bid_deviation_pct", 0.0)),
                        bid_rank=int(row.get("bid_rank", 1)),
                        winner=int(row.get("winner", 0)),
                        anomaly_probability=prob,
                        flagged=is_flagged,
                        fair_value_band_breach=int(row.get("fair_value_band_breach", 0)),
                        high_positive_deviation_flag=int(row.get("high_positive_deviation_flag", 0)),
                        origin=str(row.get("origin", "")),
                        destination_port=str(row.get("destination_port", "")),
                        vessel_class=str(row.get("vessel_class", "")),
                    )
                )
        else:
            return self.get_tender(tender_id, threshold=threshold)

        # Log flagged collusion event to audit log for CVC governance
        audit_logged = False
        if flagged_count > 0:
            try:
                with SessionLocal() as db:
                    audit_record = AuditLogRecord(
                        action="BID_COLLUSION_FLAGGED",
                        user_id="anti_collusion_engine",
                        entity_id=tender_id,
                        details={
                            "tender_id": tender_id,
                            "flagged_count": flagged_count,
                            "total_bids": len(scored_bids),
                            "highest_risk_broker": riskiest_broker,
                            "highest_probability": max_prob,
                        },
                    )
                    db.add(audit_record)
                    db.commit()
                    audit_logged = True
            except Exception as e:
                logger.warning("Could not persist audit log for tender %s: %s", tender_id, e)

        return TenderScoreResponse(
            tender_id=tender_id,
            tender_date=tdate,
            origin=origin,
            destination_port=dest,
            cargo_type=cargo,
            vessel_class=vclass,
            total_bids=len(scored_bids),
            flagged_count=flagged_count,
            highest_anomaly_probability=round(max_prob, 4),
            highest_risk_broker=riskiest_broker,
            tender_status="ANOMALOUS_FLAGGED" if flagged_count > 0 else "CLEAN",
            threshold_used=threshold,
            bids=scored_bids,
            audit_logged=audit_logged,
        )

    def explain_bid(self, tender_id: str, broker_id: str, top_n: int = 5) -> BidExplainResponse:
        data = self._get_data()
        matching = data[(data["tender_id"] == tender_id) & (data["broker_id"] == broker_id)]
        if matching.empty:
            raise ValueError(f"Bid for broker '{broker_id}' in tender '{tender_id}' not found.")

        row = matching.iloc[0]
        artifact = self._get_artifact()
        res = explainer.explain_bid(row, top_n=top_n, artifact=artifact)

        suspicious = [
            ShapContributionItem(
                feature=item["feature"],
                label=item["label"],
                log_odds_contribution=item["log_odds_contribution"],
            )
            for item in res["toward_suspicious"]
        ]
        normal = [
            ShapContributionItem(
                feature=item["feature"],
                label=item["label"],
                log_odds_contribution=item["log_odds_contribution"],
            )
            for item in res["toward_normal"]
        ]

        return BidExplainResponse(
            tender_id=tender_id,
            broker_id=broker_id,
            probability=res["probability"],
            baseline_probability=res["baseline_probability"],
            toward_suspicious=suspicious,
            toward_normal=normal,
            narrative=res["narrative"],
        )

    def simulate_bid(self, req: CustomBidSimRequest) -> CustomBidSimResponse:
        artifact = self._get_artifact()
        fair_val = req.predicted_fair_value_usd_mt
        dev_pct = round((req.quoted_freight_usd_mt - fair_val) / fair_val * 100.0, 2)
        lower_band = round(fair_val * 0.92, 2)
        upper_band = round(fair_val * 1.08, 2)

        is_breach = 1 if (req.quoted_freight_usd_mt > upper_band or req.quoted_freight_usd_mt < lower_band) else 0
        is_high_dev = 1 if dev_pct > 10.0 else 0

        sim_row = pd.Series({
            "tender_id": req.tender_id,
            "broker_id": req.broker_id,
            "origin": req.origin,
            "destination_port": req.destination_port,
            "cargo_type": req.cargo_type,
            "vessel_class": req.vessel_class,
            "route_id": req.route_id,
            "quantity_mt": req.quantity_mt,
            "quoted_freight_usd_mt": req.quoted_freight_usd_mt,
            "bid_rank": 1,
            "winner": 1,
            "contract_duration_days": req.contract_duration_days,
            "market_freight_usd_mt": req.market_freight_usd_mt,
            "predicted_fair_value_usd_mt": req.predicted_fair_value_usd_mt,
            "fair_value_lower_usd_mt": lower_band,
            "fair_value_upper_usd_mt": upper_band,
            "bid_deviation_pct": dev_pct,
            "bunker_price_usd_mt": req.bunker_price_usd_mt,
            "congestion_index": req.congestion_index,
            "predicted_waiting_hours": req.predicted_waiting_hours,
            "broker_historical_bid_count": req.broker_historical_bid_count,
            "broker_historical_premium_pct": req.broker_historical_premium_pct,
            "vessel_historical_bid_count": req.vessel_historical_bid_count,
            "broker_vessel_historical_frequency": req.broker_vessel_historical_frequency,
            "bid_spread_pct": abs(dev_pct),
            "fair_value_band_breach": is_breach,
            "high_positive_deviation_flag": is_high_dev,
        })

        res = detector.score_bid(sim_row, threshold=req.threshold, artifact=artifact)
        expl_res = explainer.explain_bid(sim_row, top_n=5, artifact=artifact)

        suspicious = [
            ShapContributionItem(
                feature=item["feature"],
                label=item["label"],
                log_odds_contribution=item["log_odds_contribution"],
            )
            for item in expl_res["toward_suspicious"]
        ]

        return CustomBidSimResponse(
            tender_id=req.tender_id,
            broker_id=req.broker_id,
            anomaly_probability=res["anomaly_probability"],
            flagged=res["flagged"],
            deviation_pct=dev_pct,
            fair_value_band_breach=bool(is_breach),
            high_positive_deviation_flag=bool(is_high_dev),
            narrative=expl_res["narrative"],
            top_suspicious_features=suspicious,
        )

    def get_performance(self) -> CollusionPerformanceResponse:
        root = _get_project_root()
        metadata_path = root / "ml" / "models" / "collusion_detection" / "bid_anomaly_detection_v1" / "metadata.json"
        metadata = {}
        if metadata_path.exists():
            with open(metadata_path, "r", encoding="utf-8") as f:
                metadata = json.load(f)

        report_path = root / "ml" / "evaluation" / "bid_anomaly_performance_report.json"
        report_data = {}
        if report_path.exists():
            with open(report_path, "r", encoding="utf-8") as f:
                report_data = json.load(f)

        imp_path = root / "ml" / "evaluation" / "bid_anomaly_feature_importance.csv"
        features: list[dict[str, Any]] = []
        if imp_path.exists():
            imp_df = pd.read_csv(imp_path)
            features = imp_df.head(10).to_dict(orient="records")

        test_metrics = report_data.get("test", {}).get("model", metadata.get("test_metrics", {}))
        naive = report_data.get("test", {}).get("naive_baseline", metadata.get("naive_baseline_comparison", {}))

        return CollusionPerformanceResponse(
            model_version=metadata.get("model_version", "bid_anomaly_detection_v1"),
            training_date=metadata.get("training_date", "2026-09-21"),
            dataset_version=metadata.get("dataset_version", "bid_tender_records_synthetic_v1"),
            test_metrics=test_metrics,
            naive_baseline=naive,
            feature_importance=features,
        )


collusion_service = CollusionService()
