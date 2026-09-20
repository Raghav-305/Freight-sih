from __future__ import annotations

import logging
from typing import Any

from ml.inference.counterfactual import (
    explain_risk,
    explain_charter,
    simulate_risk_what_if,
    simulate_charter_what_if,
)
from backend.app.schemas.counterfactual import (
    RiskCounterfactualRequest,
    RiskCounterfactualResponse,
    RiskCounterfactualItem,
    CharterCounterfactualRequest,
    CharterCounterfactualResponse,
    CharterSensitivityItem,
    CustomRiskWhatIfRequest,
    CustomRiskWhatIfResponse,
    CustomCharterWhatIfRequest,
    CustomCharterWhatIfResponse,
)

logger = logging.getLogger("freight.counterfactual")


class CounterfactualService:
    def explain_risk(self, request: RiskCounterfactualRequest) -> RiskCounterfactualResponse:
        logger.info(
            "Computing risk counterfactuals for route %s (%s -> %s, date: %s)",
            request.route_id, request.origin_country, request.destination_port, request.date
        )
        raw = explain_risk(
            route_id=request.route_id,
            origin_country=request.origin_country,
            destination_port=request.destination_port,
            date=request.date,
        )

        items = [
            RiskCounterfactualItem(
                factor=cf["factor"],
                current_score=cf["current_score"],
                if_resolved_overall_becomes=cf["if_resolved_overall_becomes"],
                overall_drops_by=cf["overall_drops_by"],
            )
            for cf in raw["counterfactuals"]
        ]

        biggest = raw["biggest_lever"]
        top_drop = items[0].overall_drops_by if items else 0.0
        new_score = items[0].if_resolved_overall_becomes if items else raw["baseline"]["overall"]

        summary = (
            f"Primary risk lever is '{biggest.upper()}'. Resolving this factor to baseline (10.0) drops "
            f"overall route risk from {raw['baseline']['overall']} down to {new_score} (-{top_drop} pts)."
        )
        logger.info("Risk counterfactuals computed: biggest lever=%s, max drop=%s pts", biggest, top_drop)

        return RiskCounterfactualResponse(
            baseline=raw["baseline"],
            biggest_lever=biggest,
            counterfactuals=items,
            summary_insight=summary,
        )

    def explain_charter(self, request: CharterCounterfactualRequest) -> CharterCounterfactualResponse:
        logger.info(
            "Computing charter cost sensitivity for %s -> %s (%s, cargo: %s MT, delivery: %s)",
            request.origin_port, request.destination_port, request.vessel_class,
            request.cargo_quantity_mt, request.delivery_date
        )
        raw = explain_charter(
            origin_port=request.origin_port,
            destination_port=request.destination_port,
            vessel_class=request.vessel_class,
            cargo_quantity_mt=request.cargo_quantity_mt,
            delivery_date=request.delivery_date,
        )

        items = [
            CharterSensitivityItem(
                lever=s["lever"],
                change=s["change"],
                new_cost_usd=float(s["new_cost_usd"]),
                saving_usd=float(s["saving_usd"]),
                mix_changed=bool(s["mix_changed"]),
            )
            for s in raw["cost_sensitivity"]
        ]

        biggest = raw["biggest_lever"]
        max_saving = max((item.saving_usd for item in items if item.lever == biggest), default=0.0)

        summary = (
            f"The single most impactful cost lever is '{biggest.replace('_', ' ').upper()}', "
            f"unlocking up to ${max_saving:,.0f} in capital savings under tested market shifts."
        )
        logger.info("Charter sensitivity computed: biggest lever=%s, max saving=$%s", biggest, max_saving)

        return CharterCounterfactualResponse(
            baseline=raw["baseline"],
            biggest_lever=biggest,
            cost_sensitivity=items,
            note=raw["note"],
            summary_insight=summary,
        )

    def simulate_risk(self, request: CustomRiskWhatIfRequest) -> CustomRiskWhatIfResponse:
        logger.info(
            "Running custom risk simulation for route %s (%s -> %s) with overrides: %s",
            request.route_id, request.origin_country, request.destination_port, request.overrides
        )
        raw = simulate_risk_what_if(
            route_id=request.route_id,
            origin_country=request.origin_country,
            destination_port=request.destination_port,
            date=request.date,
            overrides=request.overrides,
        )
        logger.info("Risk simulation result: delta=%s (%s)", raw["overall_delta"], raw["impact_direction"])
        return CustomRiskWhatIfResponse(**raw)

    def simulate_charter(self, request: CustomCharterWhatIfRequest) -> CustomCharterWhatIfResponse:
        logger.info(
            "Running custom charter simulation (bunker: %s%%, congestion: %sd, spot: %s%%)",
            request.bunker_pct_change, request.congestion_days_delta, request.spot_rate_pct_change
        )
        raw = simulate_charter_what_if(
            origin_port=request.origin_port,
            destination_port=request.destination_port,
            vessel_class=request.vessel_class,
            cargo_quantity_mt=request.cargo_quantity_mt,
            delivery_date=request.delivery_date,
            bunker_pct_change=request.bunker_pct_change,
            congestion_days_delta=request.congestion_days_delta,
            spot_rate_pct_change=request.spot_rate_pct_change,
        )
        logger.info("Charter simulation result: saving=$%s, mix_changed=%s", raw["saving_usd"], raw["mix_changed"])
        return CustomCharterWhatIfResponse(**raw)


counterfactual_service = CounterfactualService()
