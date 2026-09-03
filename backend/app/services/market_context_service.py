from __future__ import annotations

from functools import lru_cache
from pathlib import Path

import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parents[3]


@lru_cache(maxsize=1)
def _load_csv(filename: str, folder: str) -> pd.DataFrame:
    path = PROJECT_ROOT / "data" / "raw" / folder / filename
    if not path.exists():
        raise FileNotFoundError(f"Market context dataset not found: {path}")
    return pd.read_csv(path)


def _as_of_date(value: str | None) -> pd.Timestamp:
    return pd.to_datetime(value) if value else pd.Timestamp.max


class MarketContextService:
    def get_context(
        self,
        origin: str = "Australia",
        destination: str = "Dhamra",
        vessel_class: str = "Panamax",
        as_of_date: str | None = None,
    ) -> dict:
        cutoff = _as_of_date(as_of_date)

        ffa = _load_csv("ffa_prices.csv", "ffa").copy()
        ffa["date"] = pd.to_datetime(ffa["date"])
        route_key = f"{origin}-{destination}"
        ffa_rows = ffa[
            ffa["route"].astype(str).str.casefold().eq(route_key.casefold())
            & ffa["vessel_class"].astype(str).str.casefold().eq(vessel_class.casefold())
            & (ffa["date"] <= cutoff)
        ].sort_values("date")
        ffa_latest = ffa_rows.groupby("period", as_index=False).tail(1)

        imports = _load_csv("coal_imports.csv", "commodities").copy()
        imports["month_date"] = pd.to_datetime(imports["month"], format="%Y-%m")
        import_rows = imports[
            imports["origin_country"].astype(str).str.casefold().eq(origin.casefold())
            & (imports["month_date"] <= cutoff)
        ].sort_values("month_date")
        import_summary = None
        if not import_rows.empty:
            row = import_rows.iloc[-1]
            import_summary = {
                "origin_country": str(row["origin_country"]),
                "quantity_mt": round(float(row["quantity_mt"]), 2),
                "value_usd": round(float(row["value_usd"]), 2),
                "month": str(row["month"]),
            }

        events = _load_csv("events.csv", "risk_events").copy()
        events["start_date"] = pd.to_datetime(events["start"])
        events["end_date"] = pd.to_datetime(events["end"])
        destination_events = events[
            events["region"].astype(str).str.casefold().str.contains(destination.casefold(), regex=False)
            | events["region"].astype(str).str.casefold().eq("global")
        ]
        active_events = destination_events[
            (destination_events["start_date"] <= cutoff)
            & (destination_events["end_date"] >= cutoff)
        ]

        fixtures = _load_csv("fixtures.csv", "fixtures").copy()
        fixtures["fixture_date"] = pd.to_datetime(fixtures["Date"])
        fixture_rows = fixtures[
            fixtures["Destination"].astype(str).str.casefold().eq(destination.casefold())
            & (fixtures["DWT"] >= 0)
            & (fixtures["fixture_date"] <= cutoff)
        ]
        fixture_summary = {
            "fixture_count": int(len(fixture_rows)),
            "average_rate": round(float(fixture_rows["Rate"].mean()), 2) if not fixture_rows.empty else None,
            "average_quantity_mt": round(float(fixture_rows["Quantity"].mean()), 2) if not fixture_rows.empty else None,
            "latest_fixture_date": fixture_rows["fixture_date"].max().date().isoformat() if not fixture_rows.empty else None,
        }

        return {
            "origin": origin,
            "destination": destination,
            "vessel_class": vessel_class,
            "as_of_date": as_of_date,
            "ffa": [
                {"period": str(row["period"]), "price": round(float(row["price"]), 2)}
                for _, row in ffa_latest.iterrows()
            ],
            "import_summary": import_summary,
            "active_events": [
                {
                    "event_id": str(row["event_id"]),
                    "event_type": str(row["event_type"]),
                    "region": str(row["region"]),
                    "severity": str(row["severity"]),
                    "start": str(row["start"]),
                    "end": str(row["end"]),
                }
                for _, row in active_events.iterrows()
            ],
            "fixtures": fixture_summary,
        }


market_context_service = MarketContextService()
