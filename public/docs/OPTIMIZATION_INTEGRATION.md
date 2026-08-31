# Optimization Integration

The optimization layer should consume cargo demand, freight forecast, vessel availability, port constraints, risk, bunker, congestion and contract options. It should return spot %, short-term %, multi-voyage %, COA %, expected cost, baseline cost, expected saving, risk, recommended strategy and fixing window.

MILP/LP logic belongs in `optimization/contract_optimizer.py`; vessel feasibility belongs in `optimization/vessel_selection.py`. The frontend only submits inputs and displays outputs.