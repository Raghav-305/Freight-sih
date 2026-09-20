"""Counterfactual Explanations & Sensitivity Module (Layer 6).

Fills the "Why This? Explainability" slot in the freight chartering architecture.
Provides systematic perturbation search and what-if sensitivity analysis for:
1. Route Risk Engine decisions (identifying primary risk levers and resolution impact)
2. Charter Strategy HiGHS Linear Programming (evaluating bunker, congestion, and spot rate leverage)
"""

from __future__ import annotations

from typing import Any
from counterfactual_explanations.counterfactual_explainer import (
    explain_risk,
    explain_charter,
    simulate_risk_what_if,
    simulate_charter_what_if,
)

__all__ = [
    "explain_risk",
    "explain_charter",
    "simulate_risk_what_if",
    "simulate_charter_what_if",
]
