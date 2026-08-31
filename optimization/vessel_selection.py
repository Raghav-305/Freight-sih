def recommend_vessel(payload: dict) -> dict:
    return {
        "recommended_vessel": payload.get("vessel_type", "Panamax"),
        "feasible": True,
        "checked_constraints": [],
        "notes": "Replace with DWT, draft, LOA, beam and port compatibility checks.",
    }
