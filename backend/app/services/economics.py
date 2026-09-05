"""
Pillar 1 -- Policy alignment & coastal/import economics.

Implements the formulas:
  LandedCostPerTonne = sum(cost components)
  EnergyGJPerTonne    = GCV_kcal_per_kg * 0.004184
  CostPerGJ           = LandedCostPerTonne / EnergyGJPerTonne
  BlendCost/GCV/Ash   = weighted average by import_fraction

Every response carries `assumptions` and `warnings` explicitly.
"""
from __future__ import annotations

from backend.app.schemas.scenarios import BlendRequest, ScenarioRequest, SensitivityRequest

KCAL_PER_KG_TO_GJ_PER_TONNE = 0.004184
COST_FIELDS = ("commodity", "freight", "insurance", "port", "handling", "inland", "other")


def evaluate_scenario(req: ScenarioRequest) -> dict:
    costs = req.costs.model_dump()
    landed_cost_per_tonne = sum(costs[f] for f in COST_FIELDS)

    result = {
        "label": req.label,
        "scenario_type": req.scenario_type,
        "landed_cost_per_tonne": round(landed_cost_per_tonne, 4),
        "currency": req.metadata.currency,
    }
    warnings = []

    if req.gcv_kcal_per_kg is not None:
        energy_gj_per_tonne = req.gcv_kcal_per_kg * KCAL_PER_KG_TO_GJ_PER_TONNE
        result["energy_gj_per_tonne"] = round(energy_gj_per_tonne, 6)
        result["cost_per_gj"] = round(landed_cost_per_tonne / energy_gj_per_tonne, 4)
    else:
        warnings.append("GCV not supplied: cost_per_gj disabled (definition-of-done rule).")

    assumptions = {
        "cost_components_included": [f for f in COST_FIELDS if costs[f]],
        "cost_components_missing_or_zero": [f for f in COST_FIELDS if not costs[f]],
        "energy_conversion_factor": "1 kcal/kg = 0.004184 GJ/tonne",
        "observed_at": req.metadata.observed_at,
    }

    return {
        "result": result,
        "assumptions": assumptions,
        "input_provenance": {"source_type": "USER_INPUT", "observed_at": req.metadata.observed_at},
        "warnings": warnings,
        "model_or_formula_version": "economics-v1",
    }


def compare_scenarios(scenarios: list[ScenarioRequest]) -> dict:
    evaluated = [evaluate_scenario(s) for s in scenarios]
    has_gcv_everywhere = all("cost_per_gj" in e["result"] for e in evaluated)
    rank_metric = "cost_per_gj" if has_gcv_everywhere else "landed_cost_per_tonne"
    ranked = sorted(evaluated, key=lambda e: e["result"][rank_metric])
    for i, e in enumerate(ranked):
        e["result"]["rank"] = i + 1
        e["result"]["ranked_by"] = rank_metric
    return {
        "result": ranked,
        "assumptions": {
            "ranking_metric": rank_metric,
            "ranking_visible": True,
            "note": "No scenario is labelled 'best' silently -- ranked_by is always shown next to rank.",
        },
        "warnings": [] if has_gcv_everywhere else [
            "Not all scenarios supplied GCV; ranked by landed_cost_per_tonne instead of cost_per_gj."
        ],
        "model_or_formula_version": "economics-v1",
    }


def evaluate_blend(req: BlendRequest) -> dict:
    dom = evaluate_scenario(req.domestic)["result"]["landed_cost_per_tonne"]
    imp = evaluate_scenario(req.imported)["result"]["landed_cost_per_tonne"]
    x = req.import_fraction

    blend_cost = x * imp + (1 - x) * dom
    blend_gcv = x * req.imported_gcv_kcal_per_kg + (1 - x) * req.domestic_gcv_kcal_per_kg
    blend_energy_gj = blend_gcv * KCAL_PER_KG_TO_GJ_PER_TONNE

    result = {
        "import_fraction": x,
        "domestic_fraction": round(1 - x, 6),
        "blend_landed_cost_per_tonne": round(blend_cost, 4),
        "blend_gcv_kcal_per_kg": round(blend_gcv, 2),
        "blend_energy_gj_per_tonne": round(blend_energy_gj, 6),
        "blend_cost_per_gj": round(blend_cost / blend_energy_gj, 4),
    }
    if req.domestic_ash_pct is not None and req.imported_ash_pct is not None:
        result["blend_ash_pct"] = round(x * req.imported_ash_pct + (1 - x) * req.domestic_ash_pct, 3)

    return {
        "result": result,
        "assumptions": {
            "blend_model": "linear weighted average on cost, GCV and ash by import_fraction",
            "energy_conversion_factor": "1 kcal/kg = 0.004184 GJ/tonne",
        },
        "warnings": [],
        "model_or_formula_version": "economics-v1",
    }


def sensitivity_grid(req: SensitivityRequest) -> dict:
    base = evaluate_scenario(req.scenario)["result"]
    base_landed = base["landed_cost_per_tonne"]
    rows = []

    def add_row(factor, shock_pct, new_landed, note=""):
        rows.append({
            "factor": factor,
            "shock_pct": shock_pct,
            "landed_cost_per_tonne": round(new_landed, 4),
            "delta_vs_base": round(new_landed - base_landed, 4),
            "note": note,
        })

    add_row("BASE", 0, base_landed)

    for shock in (-0.10, 0.10):
        shocked = dict(req.scenario.costs.model_dump())
        shocked["freight"] *= (1 + shock)
        add_row("FREIGHT", shock * 100, sum(shocked[f] for f in COST_FIELDS))

    for shock in (-0.05, 0.05):
        add_row("FX", shock * 100, base_landed * (1 + shock), "Applied to whole landed cost as an FX proxy.")

    for shock in (-0.20, 0.20):
        shocked = dict(req.scenario.costs.model_dump())
        shocked["port"] *= (1 + shock)
        add_row("PORT_COST", shock * 100, sum(shocked[f] for f in COST_FIELDS))

    gcv_rows = []
    if req.scenario.gcv_kcal_per_kg:
        for shock in (-0.05, 0.05):
            new_gcv = req.scenario.gcv_kcal_per_kg * (1 + shock)
            new_gj = new_gcv * KCAL_PER_KG_TO_GJ_PER_TONNE
            gcv_rows.append({
                "factor": "GCV", "shock_pct": shock * 100,
                "cost_per_gj": round(base_landed / new_gj, 4),
                "delta_vs_base_cost_per_gj": round(base_landed / new_gj - base["cost_per_gj"], 4),
            })

    waiting_rows = []
    if req.daily_charter_hire_rate:
        for label, days in (("P50", req.waiting_days_p50), ("P90", req.waiting_days_p90)):
            if days is not None:
                waiting_rows.append({
                    "scenario": label,
                    "waiting_days": days,
                    "expected_delay_exposure_usd": round(days * req.daily_charter_hire_rate, 2),
                })

    return {
        "result": {"cost_rows": rows, "gcv_rows": gcv_rows, "waiting_day_rows": waiting_rows},
        "assumptions": {
            "grid_definition": "Freight +-10%, FX +-5% (proxy), Port +-20%, GCV +-5%, Waiting 0/P50/P90",
            "cross_product": False,
        },
        "warnings": [] if req.scenario.gcv_kcal_per_kg else ["GCV not supplied: GCV sensitivity rows omitted."],
        "model_or_formula_version": "economics-v1",
    }
