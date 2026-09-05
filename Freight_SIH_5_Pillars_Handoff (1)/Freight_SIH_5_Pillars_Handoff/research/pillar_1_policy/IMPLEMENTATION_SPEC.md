## Backend contracts

POST /api/scenarios/evaluate
{
  "scenario_type":"IMPORT|COASTAL",
  "costs":{"commodity":0,"freight":0,"insurance":0,"port":0,"handling":0,"inland":0,"other":0},
  "gcv_kcal_per_kg":null,
  "quality":{"ash_pct":null,"moisture_pct":null},
  "metadata":{"currency":"USD","observed_at":"ISO-8601"}
}

POST /api/scenarios/compare
POST /api/blends/evaluate
POST /api/scenarios/sensitivity

Response must include:
result, assumptions, input_provenance, warnings, model_or_formula_version

## Integration tasks for Raghav
1. Add scenario schema/service/router
2. Keep existing forecasting model independent
3. Add Scenario Comparator tab
4. Add "Assumptions" drawer
5. Add sensitivity heatmap only after baseline formulas pass tests
