import { getPort, getVessel, checkVesselFeasibility, logRun, round } from '../../lib/sim.js';

export const access = 'public';
export const methods = ['POST'];

export default async function (req, res) {
  const b = req.body || {};
  const portName = b.port || 'Dhamra';
  const vesselType = b.vessel_type || 'Panamax';
  const cargo_quantity = Number(b.cargo_quantity) || 80000;

  const port = await getPort(portName);
  if (!port) {
    const out = { mode: 'simulated', port: portName, feasible: false, error: `No reference data for port "${portName}". Add it to reference_ports.` };
    await logRun('port_check', b, out);
    return res.status(404).json(out);
  }

  const vessel = await getVessel(vesselType);
  if (!vessel) {
    const out = { mode: 'simulated', port: port.name, feasible: false, error: `Unknown vessel class "${vesselType}".` };
    await logRun('port_check', b, out);
    return res.status(404).json(out);
  }

  const { checks, feasible } = checkVesselFeasibility(vessel, port, cargo_quantity);
  const congestion_days = round(Number(port.base_wait_days) * (0.8 + cargo_quantity / (Number(vessel.dwt_mt) * 3)), 2);

  const out = {
    mode: 'simulated',
    port: port.name,
    vessel_type: vessel.vessel_class,
    feasible,
    constraints: checks,
    port_limits: {
      draft_limit_m: Number(port.draft_limit_m),
      loa_limit_m: Number(port.loa_limit_m),
      beam_limit_m: Number(port.beam_limit_m),
      dwt_limit_mt: Number(port.dwt_limit_mt),
    },
    vessel_specs: {
      draft_m: Number(vessel.draft_m),
      loa_m: Number(vessel.loa_m),
      beam_m: Number(vessel.beam_m),
      dwt_mt: Number(vessel.dwt_mt),
    },
    congestion_days,
    current_queue: port.base_queue,
  };

  await logRun('port_check', { port: portName, vessel_type: vesselType, cargo_quantity }, out);
  res.json(out);
}