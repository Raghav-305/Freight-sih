(function(){
'use strict';
const API=(window.__HATCHABLE__&&window.__HATCHABLE__.api)||'/api';
const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
const fmt=(n)=>typeof n==='number'?n.toLocaleString(undefined,{maximumFractionDigits:2}):n;
const state={route:location.hash.slice(1)||'/'};

// ---- API boundary --------------------------------------------------------
async function api(path, opts={}){
  const qs = opts.query ? '?'+new URLSearchParams(opts.query).toString() : '';
  const res = await fetch(API+path+qs, {
    method: opts.method || (opts.body ? 'POST' : 'GET'),
    headers: {'Content-Type':'application/json'},
    body: opts.body!==undefined ? JSON.stringify(opts.body) : undefined,
  });
  let json = {};
  try { json = await res.json(); } catch(e) {}
  if (!res.ok) throw new Error(json.error || json.reason || ('Request failed: '+res.status));
  return json;
}

// ---- Shell / design system (unchanged look) ------------------------------
const nav=[['/','Dashboard'],['/market','Market Intelligence'],['/forecast','Route Forecast'],['/vessels','Vessel Intelligence'],['/ports','Port Intelligence'],['/charter','Charter Strategy'],['/what-if','What-If Simulator'],['/risk','Risk & Alerts'],['/data-quality','Data Quality'],['/models','Model Performance'],['/history','Run History'],['/settings','System / Settings']];

function metric(label,value,meta='Live'){return `<div class="panel p-4"><div class="text-[11px] font-semibold uppercase tracking-[.12em] text-[#697067]">${label}</div><div class="mt-2 text-2xl font-semibold tracking-tight">${value}</div><div class="mt-1 text-xs text-[#73786f]">${meta}</div></div>`}
function badge(v){let cls=v==='PASS'||v==='HEALTHY'||v==='true'||v===true?'#5d755e':v==='WARNING'||v==='MEDIUM'?'#9a7b3d':v==='CRITICAL'||v==='HIGH'||v==='FAIL'||v===false?'#9a5f58':'#657066';const label=v===true?'PASS':v===false?'FAIL':v;return `<span style="display:inline-flex;align-items:center;padding:4px 8px;border-radius:3px;background:${cls}18;color:${cls};font-weight:700;font-size:11px;letter-spacing:.04em">${esc(label)}</span>`}
function layout(content){return `<div class="min-h-screen grid grid-cols-[248px_1fr] lg:grid-cols-[260px_1fr]"><aside class="border-r border-[#ddd7ca] bg-[#fbf8f0] min-h-screen"><div class="p-5 border-b border-[#ddd7ca]"><div class="text-[11px] uppercase tracking-[.16em] font-bold text-[#5e6650]">Government Decision Support</div><div class="mt-2 text-lg font-semibold leading-tight">Freight Chartering Intelligence Platform</div><div class="mt-1 text-xs leading-5 muted">AI-Assisted Maritime Procurement Decision Support</div></div><nav class="py-3">${nav.map(([href,label])=>`<a href="#${href}" class="block px-5 py-2.5 text-sm ${state.route===href?'nav-active font-semibold':'text-[#343a35] hover:bg-[#f0ece2]'}">${label}</a>`).join('')}</nav><div class="m-4 p-3 border border-[#ddd7ca] bg-white text-xs leading-5"><div class="font-semibold">Review status</div><div class="mt-1 text-[#697067]">Recommendations are AI-assisted outputs. Final procurement / chartering decisions remain subject to authorized human review.</div></div></aside><main class="min-w-0"><header class="h-[74px] bg-white border-b border-[#ddd7ca] px-6 flex items-center justify-between gap-4"><div><div class="font-semibold">${pageTitle(state.route)}</div><div class="text-xs muted">Operational intelligence workspace</div></div><div class="flex items-center gap-3 text-xs"><span class="px-2.5 py-1 border border-[#ddd7ca] rounded-sm">SIMULATED BACKEND</span><span id="clock" class="text-[#697067]"></span></div></header><div class="mx-6 mt-4 border border-[#d9cfb5] bg-[#eee9dc] px-4 py-2.5 text-xs text-[#554e40]"><strong>SIMULATED DATA</strong> &mdash; every number on this page comes from a live API call driven by deterministic formulas (see <code>lib/sim.js</code>), not a trained model yet. Change the inputs and re-run &mdash; the outputs will change too. Every run is logged; see <a class="underline font-semibold" href="#/history">Run History</a>.</div><section class="p-6">${content}</section><footer class="px-6 py-4 border-t border-[#ddd7ca] text-xs muted bg-white">Backend: simulated (lib/sim.js) &middot; System v0.2 &middot; Decision-support system &mdash; recommendations require authorized review.</footer></main></div>`}
function pageTitle(r){return ({'/':'Freight Chartering Intelligence','/market':'Market Intelligence','/forecast':'Route Forecast','/vessels':'Vessel Intelligence','/ports':'Port Intelligence','/charter':'Charter Strategy','/what-if':'What-If Simulator','/risk':'Risk & Alerts','/data-quality':'Data Quality','/models':'Model Performance','/history':'Run History','/settings':'System / Settings'}[r]||'Page Not Found')}
function heading(title,sub=''){return `<div class="mb-6"><h1 class="text-2xl font-semibold tracking-tight">${title}</h1>${sub?`<p class="mt-1 text-sm muted">${sub}</p>`:''}</div>`}
function table(headers,rows){return `<div class="panel scroll-x"><table class="min-w-full text-sm"><thead class="bg-[#f4f0e7] border-b border-[#ddd7ca]"><tr>${headers.map(h=>`<th class="px-3 py-3 text-left text-[11px] uppercase tracking-[.08em] font-semibold muted whitespace-nowrap">${h}</th>`).join('')}</tr></thead><tbody>${rows.length?rows.map((r)=>`<tr class="border-b border-[#eee9df] last:border-0">${r.map((c,j)=>`<td class="px-3 py-3 whitespace-nowrap ${j===0?'font-medium':''}">${c}</td>`).join('')}</tr>`).join(''):`<tr><td class="px-3 py-6 text-center muted" colspan="${headers.length}">No data yet</td></tr>`}</tbody></table></div>`}
function spark(points){const pts=points&&points.length>1?points:[0,1,0,1,0,1];const min=Math.min(...pts),max=Math.max(...pts)||1;const norm=pts.map((v,i)=>`${(i/(pts.length-1)*280).toFixed(1)},${(64-((v-min)/((max-min)||1))*56).toFixed(1)}`).join(' ');return `<svg viewBox="0 0 280 72" class="w-full h-20"><polyline fill="none" stroke="#5e6650" stroke-width="2" points="${norm}"/><line x1="0" y1="64" x2="280" y2="64" stroke="#ddd7ca"/></svg>`}
function errorPanel(msg){return `<div class="panel p-5 text-sm" style="border-color:#e0c9c5"><div class="font-semibold" style="color:#9a5f58">Request failed</div><div class="mt-2 muted">${esc(msg)}</div></div>`}
function loadingPanel(msg='Loading live data…'){return `<div class="panel p-8 text-sm muted text-center">${esc(msg)}</div>`}

function mount(html){document.getElementById('root').innerHTML=html;const clock=document.getElementById('clock');if(clock)clock.textContent='Loaded '+new Date().toLocaleString();}

// ---- Form field helpers ---------------------------------------------------
function field(name,label,value,type='text'){return `<label class="text-sm block">${label}<input name="${name}" type="${type}" value="${esc(value)}" class="mt-1 w-full border border-[#d8d1c4] p-2.5 bg-white"/></label>`}
function selectField(name,label,options,value){return `<label class="text-sm block">${label}<select name="${name}" class="mt-1 w-full border border-[#d8d1c4] bg-white p-2.5">${options.map(o=>`<option ${o===value?'selected':''}>${o}</option>`).join('')}</select></label>`}
function formData(form){const fd=new FormData(form);return Object.fromEntries(fd.entries());}

// ==== DASHBOARD =============================================================
async function dashboard(){
  const [market, forecast, charter] = await Promise.all([
    api('/market'),
    api('/forecast', {method:'POST', body:{origin:'Gladstone',destination:'Dhamra',vessel_type:'Panamax',cargo_type:'Coal',cargo_quantity:80000}}),
    api('/charter', {method:'POST', body:{cargo_quantity:480000,origin:'Australia',destination:'Dhamra',vessel_type:'Panamax',risk_tolerance:'medium'}}),
  ]);
  const rec=`<div class="panel p-5"><div class="flex items-center justify-between"><div><div class="text-[11px] uppercase tracking-[.14em] font-semibold text-[#5e6650]">AI-assisted chartering recommendation</div><div class="mt-2 text-xl font-semibold">${charter.allocation.spot_pct<30?'MOSTLY COVERED':'PARTIAL COVER'}</div></div>${badge(charter.risk)}</div><div class="grid grid-cols-2 xl:grid-cols-4 gap-4 mt-5 text-sm"><div><div class="muted text-xs">Recommended vessel</div><div class="font-semibold mt-1">${charter.inputs.vessel_type.toUpperCase()}</div></div><div><div class="muted text-xs">Recommended strategy</div><div class="font-semibold mt-1">${charter.recommended_strategy}</div></div><div><div class="muted text-xs">Coverage</div><div class="font-semibold mt-1">${100-charter.allocation.spot_pct}%</div></div><div><div class="muted text-xs">Fixing window</div><div class="font-semibold mt-1">${charter.fixing_window.start} to ${charter.fixing_window.end}</div></div></div><div class="grid grid-cols-2 xl:grid-cols-4 gap-4 mt-4 text-sm"><div><div class="muted text-xs">Expected cost</div><div class="font-semibold mt-1">$${(charter.expected_cost/1e6).toFixed(2)}M</div></div><div><div class="muted text-xs">Baseline cost</div><div class="font-semibold mt-1">$${(charter.baseline_cost/1e6).toFixed(2)}M</div></div><div><div class="muted text-xs">Expected saving</div><div class="font-semibold mt-1">$${(charter.expected_saving/1e3).toFixed(0)}K</div></div><div><div class="muted text-xs">30D forecast</div><div class="font-semibold mt-1">$${charter.forecast_30d.p50}/MT</div></div></div><div class="mt-3 text-xs muted">Go to <a class="underline" href="#/charter">Charter Strategy</a> to change cargo, route or risk tolerance and re-run this.</div></div>`;
  return layout(heading('Freight Chartering Intelligence','Current market conditions, forecast signals and chartering recommendations \u2014 all computed live from the inputs below')+
    `<div class="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-3">${metric('BDI',market.indices.bdi)}${metric('BPI',market.indices.bpi)}${metric('BSI',market.indices.bsi)}${metric('Current Freight','$'+market.route_freight+'/MT')}${metric('30D Forecast','$'+forecast.forecast['30d'].p50+'/MT')}${metric('Confidence',(forecast.confidence*100).toFixed(0)+'%')}${metric('Expected Saving','$'+(charter.expected_saving/1e3).toFixed(0)+'K')}${metric('Risk',charter.risk)}</div>`+
    `<div class="grid xl:grid-cols-[1.6fr_1fr] gap-5 mt-5"><div class="panel p-5"><div class="font-semibold">Bunker &amp; Coal reference</div><div class="text-xs muted mt-1">From /api/market</div><div class="mt-4 grid grid-cols-2 gap-4 text-sm"><div><div class="muted text-xs">Bunker</div><div class="font-semibold mt-1">$${market.bunker}/MT</div></div><div><div class="muted text-xs">Coal</div><div class="font-semibold mt-1">$${market.coal}/MT</div></div></div></div><div class="panel p-5"><div class="text-xs muted uppercase tracking-[.1em]">Route forecast &middot; Gladstone &rarr; Dhamra</div><div class="grid grid-cols-4 gap-2 mt-4 text-xs">${Object.entries(forecast.forecast).map(([k,v])=>`<div><div class="muted">${k.toUpperCase()}</div><div class="font-semibold mt-1">$${v.p50}</div></div>`).join('')}</div><div class="mt-4">${spark(Object.values(forecast.forecast).map(v=>v.p50))}</div></div></div>`+
    `<div class="mt-5">${rec}</div>`+
    `<div class="panel p-5 mt-5"><div class="font-semibold">Forecast drivers (SHAP-style, from /api/forecast)</div><div class="grid md:grid-cols-2 gap-2 mt-4 text-sm text-[#4e564f]">${forecast.shap.map(s=>`<div>${s.direction==='positive'?'&#8593;':'&#8595;'} ${esc(s.feature)} (impact ${s.impact})</div>`).join('')}</div></div>`);
}

// ==== MARKET ================================================================
async function market(){
  const m = await api('/market');
  return layout(heading('Market Intelligence','Dry bulk indices, route freight, bunker and commodity signals \u2014 from /api/market')+
    `<div class="grid md:grid-cols-3 xl:grid-cols-6 gap-3">${metric('BDI',m.indices.bdi)}${metric('BPI',m.indices.bpi)}${metric('BSI',m.indices.bsi)}${metric('Route Freight','$'+m.route_freight+'/MT')}${metric('Bunker','$'+m.bunker+'/MT')}${metric('Coal','$'+m.coal+'/MT')}</div>`+
    `<div class="panel p-5 mt-5 text-xs muted">Last updated: ${m.updated_at}</div>`);
}

// ==== FORECAST ===============================================================
let forecastInputs={origin:'Gladstone',destination:'Dhamra',vessel_type:'Panamax',cargo_type:'Coal',cargo_quantity:80000,laycan_start:'2026-10-10',laycan_end:'2026-10-20'};
let forecastResult=null, forecastError=null;
async function forecast(){
  const formHtml=`<div class="panel p-5"><form id="forecast-form"><div class="grid md:grid-cols-3 lg:grid-cols-7 gap-4">${selectField('origin','Origin',['Gladstone','Hay Point','Newcastle'],forecastInputs.origin)}${selectField('destination','Destination',['Dhamra','Paradip','Visakhapatnam','Gangavaram','Gopalpur','Haldia'],forecastInputs.destination)}${selectField('vessel_type','Vessel class',['Panamax','Supramax','Capesize','Handysize'],forecastInputs.vessel_type)}${selectField('cargo_type','Cargo type',['Coal','Iron ore','Grain'],forecastInputs.cargo_type)}${field('cargo_quantity','Quantity (MT)',forecastInputs.cargo_quantity,'number')}${field('laycan_start','Laycan start',forecastInputs.laycan_start,'date')}${field('laycan_end','Laycan end',forecastInputs.laycan_end,'date')}</div><button type="submit" class="mt-5 px-4 py-2.5 bg-[#2b302c] text-white text-sm font-semibold rounded-sm">Generate Forecast</button></form></div>`;
  let resultHtml='';
  if(forecastError) resultHtml=errorPanel(forecastError);
  else if(forecastResult){
    const r=forecastResult;
    const chart=`<div class="panel p-5 mt-5"><div class="font-semibold">Model forecast (P50 by horizon)</div><div class="mt-4">${spark(Object.values(r.forecast).map(v=>v.p50))}</div></div>`;
    const explain=`<div class="panel p-5 mt-5"><div class="font-semibold">Why did the forecast move? (SHAP-style contributions)</div><div class="grid md:grid-cols-2 gap-6 mt-4">${r.shap.map(x=>`<div class="mt-1"><div class="flex justify-between text-sm"><span>${esc(x.feature)}</span><span>${x.direction==='positive'?'+':'-'}${x.impact}</span></div><div class="mt-1 h-2 bg-[#eee9df]"><div style="width:${x.impact*100}%;height:100%;background:${x.direction==='positive'?'#5e6650':'#9a7b3d'}"></div></div></div>`).join('')}</div><div class="mt-4 text-xs muted">${esc(r.note)}</div></div>`;
    resultHtml=`<div class="grid lg:grid-cols-2 gap-5 mt-5"><div class="panel p-5"><div class="grid grid-cols-4 gap-3">${metric('Current Freight','$'+r.current_freight+'/MT')}${metric('7D','$'+r.forecast['7d'].p50)}${metric('30D','$'+r.forecast['30d'].p50)}${metric('90D','$'+r.forecast['90d'].p50)}</div><div class="grid grid-cols-3 gap-3 mt-3">${Object.entries(r.forecast).map(([k,v])=>metric(k.toUpperCase()+' P10/P50/P90',`${v.p10} / ${v.p50} / ${v.p90}`,'')).join('')}</div></div><div class="panel p-5 text-sm"><div class="font-semibold">Model metadata</div><div class="mt-3 space-y-2">${[['Confidence',r.confidence],['Model Version',r.model_version],['Dataset Version',r.dataset_version],['Feature Version',r.feature_version]].map(x=>`<div class="flex justify-between border-b border-[#eee9df] pb-2"><span class="muted">${x[0]}</span><span class="font-medium">${x[1]}</span></div>`).join('')}</div></div></div>${chart}${explain}`;
  } else resultHtml=loadingPanel('Fill the form and click Generate Forecast.');
  return layout(heading('Route Forecast','Generate a probabilistic route freight forecast for a specific cargo and laycan \u2014 POSTs to /api/forecast')+formHtml+resultHtml);
}
function wireForecast(){
  const f=document.getElementById('forecast-form');
  if(!f) return;
  f.addEventListener('submit', async (e)=>{
    e.preventDefault();
    forecastInputs={...forecastInputs, ...formData(f)};
    forecastInputs.cargo_quantity=Number(forecastInputs.cargo_quantity);
    forecastError=null;
    mount(layout(heading('Route Forecast','Generating…')+loadingPanel('Calling /api/forecast…')));
    try{ forecastResult=await api('/forecast',{method:'POST',body:forecastInputs}); }
    catch(err){ forecastError=err.message; }
    renderRoute();
  });
}

// ==== VESSELS ================================================================
let vesselsQuery={destination:'Dhamra',cargo_quantity:80000,freight_rate:19.4};
let vesselsResult=null, vesselsError=null;
async function vessels(){
  if(!vesselsResult && !vesselsError){
    try{ vesselsResult=await api('/vessels',{query:vesselsQuery}); } catch(err){ vesselsError=err.message; }
  }
  const formHtml=`<div class="panel p-5"><form id="vessels-form"><div class="grid md:grid-cols-3 gap-4">${selectField('destination','Destination port',['Dhamra','Paradip','Visakhapatnam','Gangavaram','Gopalpur','Haldia'],vesselsQuery.destination)}${field('cargo_quantity','Cargo quantity (MT)',vesselsQuery.cargo_quantity,'number')}${field('freight_rate','Assumed freight rate ($/MT)',vesselsQuery.freight_rate,'number')}</div><button type="submit" class="mt-5 px-4 py-2.5 bg-[#2b302c] text-white text-sm font-semibold rounded-sm">Assess Vessels</button></form></div>`;
  let body='';
  if(vesselsError) body=errorPanel(vesselsError);
  else if(vesselsResult){
    body=`<div class="mt-5">${table(['Rank','Vessel Class','Feasible','Capacity (MT)','Draft (m)','Port Compatibility','Freight Cost','Fuel Cost','Waiting Cost','Voyage Cost','Risk','Economic Score','Recommendation'],vesselsResult.vessels.map(r=>[r.rank,r.vessel_class,badge(r.feasible),fmt(r.capacity_mt),r.draft_m,r.port_compatibility,'$'+fmt(r.freight_cost),'$'+fmt(r.fuel_cost),'$'+fmt(r.waiting_cost),'$'+fmt(r.voyage_cost),badge(r.risk),r.economic_score,r.recommendation]))}</div>`;
  }
  return layout(heading('Vessel Intelligence','Assess physical and economic suitability before charter selection \u2014 GET /api/vessels, ranked live against reference_vessels + reference_ports')+formHtml+body);
}
function wireVessels(){
  const f=document.getElementById('vessels-form');
  if(!f) return;
  f.addEventListener('submit', async (e)=>{
    e.preventDefault();
    vesselsQuery={...vesselsQuery, ...formData(f)};
    vesselsError=null; vesselsResult=null;
    mount(layout(heading('Vessel Intelligence','Loading…')+loadingPanel('Calling /api/vessels…')));
    try{ vesselsResult=await api('/vessels',{query:vesselsQuery}); } catch(err){ vesselsError=err.message; }
    renderRoute();
  });
}

// ==== PORTS ==================================================================
let portCheckInputs={port:'Dhamra',vessel_type:'Panamax',cargo_quantity:80000};
let portCheckResult=null, portCheckError=null, portsData=null;
async function ports(){
  if(!portsData) portsData = await api('/ports');
  const listHtml = table(['Port','Queue','Average Wait','P90 Wait','Berth Utilization','Draft Limit','Risk'],portsData.ports.map(r=>[r.name,r.queue,r.average_wait_days+' d',r.p90_wait_days+' d',r.berth_utilization+'%',r.draft_limit_m+' m',badge(r.risk)]));
  const checkForm=`<div class="panel p-5"><div class="font-semibold mb-3">Port feasibility check</div><form id="port-check-form"><div class="grid md:grid-cols-3 gap-4">${selectField('port','Port',portsData.ports.map(p=>p.name),portCheckInputs.port)}${selectField('vessel_type','Vessel class',['Panamax','Supramax','Capesize','Handysize'],portCheckInputs.vessel_type)}${field('cargo_quantity','Cargo quantity (MT)',portCheckInputs.cargo_quantity,'number')}</div><button type="submit" class="mt-5 px-4 py-2.5 bg-[#2b302c] text-white text-sm font-semibold rounded-sm">Check Port Feasibility</button></form></div>`;
  let checkResult='';
  if(portCheckError) checkResult=errorPanel(portCheckError);
  else if(portCheckResult){
    const r=portCheckResult;
    checkResult=`<div class="panel p-5 mt-5"><div class="font-semibold">${r.port} &middot; ${r.vessel_type} &middot; ${badge(r.feasible)}</div><div class="grid md:grid-cols-4 gap-3 mt-4 text-sm">${Object.entries(r.constraints).map(([k,v])=>`<div class="border border-[#ddd7ca] p-3 flex justify-between"><span class="capitalize">${k}</span>${badge(v)}</div>`).join('')}</div><div class="mt-4 text-sm muted">Congestion: ${r.congestion_days} days &middot; Current queue: ${r.current_queue} vessels</div></div>`;
  }
  return layout(heading('Port Intelligence','Maritime port conditions, constraints and congestion indicators \u2014 GET /api/ports, POST /api/port/check')+
    `<div class="grid xl:grid-cols-1 gap-5">${listHtml}</div>`+
    `<div class="mt-5">${checkForm}${checkResult}</div>`);
}
function wirePorts(){
  const f=document.getElementById('port-check-form');
  if(!f) return;
  f.addEventListener('submit', async (e)=>{
    e.preventDefault();
    portCheckInputs={...portCheckInputs, ...formData(f)};
    portCheckInputs.cargo_quantity=Number(portCheckInputs.cargo_quantity);
    portCheckError=null;
    mount(layout(heading('Port Intelligence','Checking…')+loadingPanel('Calling /api/port/check…')));
    try{ portCheckResult=await api('/port/check',{method:'POST',body:portCheckInputs}); } catch(err){ portCheckError=err.message; }
    renderRoute();
  });
}

// ==== CHARTER ================================================================
let charterInputs={cargo_quantity:480000,origin:'Australia',destination:'Dhamra',vessel_type:'Panamax',cargo_type:'Coal',period_start:'2026-10-01',period_end:'2027-03-31',risk_tolerance:'medium'};
let charterResult=null, charterError=null;
async function charter(){
  if(!charterResult && !charterError){
    try{ charterResult=await api('/charter',{method:'POST',body:charterInputs}); } catch(err){ charterError=err.message; }
  }
  const formHtml=`<div class="panel p-5"><form id="charter-form"><div class="grid md:grid-cols-4 gap-4">${field('cargo_quantity','Cargo Requirement (MT)',charterInputs.cargo_quantity,'number')}${selectField('origin','Origin',['Australia','Gladstone','Hay Point','Newcastle'],charterInputs.origin)}${selectField('destination','Destination',['Dhamra','Paradip','Visakhapatnam'],charterInputs.destination)}${selectField('vessel_type','Vessel class',['Panamax','Supramax','Capesize','Handysize'],charterInputs.vessel_type)}${field('period_start','Period start',charterInputs.period_start,'date')}${field('period_end','Period end',charterInputs.period_end,'date')}${selectField('risk_tolerance','Risk tolerance',['low','medium','high'],charterInputs.risk_tolerance)}</div><button type="submit" class="mt-5 px-4 py-2.5 bg-[#2b302c] text-white text-sm font-semibold rounded-sm">Recompute Strategy</button></form></div>`;
  let resultHtml='';
  if(charterError) resultHtml=errorPanel(charterError);
  else if(charterResult){
    const r=charterResult;
    resultHtml=`<div class="panel p-5 mt-5"><div class="text-[11px] uppercase tracking-[.14em] font-semibold text-[#5e6650]">AI-assisted optimization output</div><div class="mt-2 text-xl font-semibold">${r.recommended_strategy}</div><div class="grid md:grid-cols-3 gap-4 mt-5 text-sm"><div class="border border-[#ddd7ca] p-4"><div class="text-xl font-semibold">${r.allocation.contracted_now_pct}%</div><div class="text-xs muted mt-1">Contracted now</div></div><div class="border border-[#ddd7ca] p-4"><div class="text-xl font-semibold">${r.allocation.contract_later_pct}%</div><div class="text-xs muted mt-1">Contract later</div></div><div class="border border-[#ddd7ca] p-4"><div class="text-xl font-semibold">${r.allocation.spot_pct}%</div><div class="text-xs muted mt-1">Spot</div></div></div><div class="grid md:grid-cols-4 gap-4 mt-4 text-sm">${metric('Expected Cost','$'+(r.expected_cost/1e6).toFixed(2)+'M')}${metric('Baseline','$'+(r.baseline_cost/1e6).toFixed(2)+'M')}${metric('Expected Saving','$'+(r.expected_saving/1e3).toFixed(0)+'K')}${metric('Risk',r.risk)}</div><div class="mt-4 text-xs muted">Fixing window: ${r.fixing_window.start} to ${r.fixing_window.end}</div></div>`;
  }
  return layout(heading('Charter Strategy','Compare procurement allocations and inspect the optimization output \u2014 POSTs to /api/charter')+formHtml+resultHtml);
}
function wireCharter(){
  const f=document.getElementById('charter-form');
  if(!f) return;
  f.addEventListener('submit', async (e)=>{
    e.preventDefault();
    charterInputs={...charterInputs, ...formData(f)};
    charterInputs.cargo_quantity=Number(charterInputs.cargo_quantity);
    charterError=null;
    mount(layout(heading('Charter Strategy','Recomputing…')+loadingPanel('Calling /api/charter…')));
    try{ charterResult=await api('/charter',{method:'POST',body:charterInputs}); } catch(err){ charterError=err.message; }
    renderRoute();
  });
}

// ==== WHAT-IF ================================================================
let whatifInputs={baseline_cargo_quantity:400000,cargo_quantity:500000,origin:'Australia',destination:'Indonesia',vessel_type:'Panamax',baseline_coverage:60,coverage:60,market_adj_pct:8,bunker_adj_pct:5,congestion_adj_days:0.5};
let whatifResult=null, whatifError=null;
async function whatif(){
  const formHtml=`<div class="panel p-5"><form id="whatif-form"><div class="grid md:grid-cols-3 lg:grid-cols-6 gap-4">${field('baseline_cargo_quantity','Baseline Cargo (MT)',whatifInputs.baseline_cargo_quantity,'number')}${field('cargo_quantity','Scenario Cargo (MT)',whatifInputs.cargo_quantity,'number')}${selectField('origin','Origin',['Australia','Gladstone','Hay Point'],whatifInputs.origin)}${selectField('destination','Destination',['Indonesia','Dhamra','Paradip'],whatifInputs.destination)}${selectField('vessel_type','Vessel Class',['Panamax','Supramax','Capesize','Handysize'],whatifInputs.vessel_type)}${field('coverage','Scenario Coverage (%)',whatifInputs.coverage,'number')}</div><div class="grid md:grid-cols-3 gap-4 mt-4">${field('market_adj_pct','Market assumption (% freight change)',whatifInputs.market_adj_pct,'number')}${field('bunker_adj_pct','Bunker assumption (% change)',whatifInputs.bunker_adj_pct,'number')}${field('congestion_adj_days','Congestion assumption (+days)',whatifInputs.congestion_adj_days,'number')}</div><button type="submit" class="mt-5 px-4 py-2.5 bg-[#2b302c] text-white text-sm font-semibold">Recalculate Scenario</button></form></div>`;
  let resultHtml='';
  if(whatifError) resultHtml=errorPanel(whatifError);
  else if(whatifResult){
    const r=whatifResult;
    const col=(label,d)=>`<div class="panel p-5"><div class="text-xs uppercase tracking-[.12em] muted">${label}</div><div class="mt-4 space-y-3 text-sm">${[['Freight','$'+d.freight+'/MT'],['30D Forecast','$'+d.forecast_30d+'/MT'],['Expected Cost','$'+(d.expected_cost/1e6).toFixed(2)+'M'],['Risk',d.risk],['Congestion',d.congestion_days+' d'],['Waiting',d.waiting_days+' d'],['Coverage',d.coverage+'%'],['Spot Exposure',d.spot_exposure_pct+'%']].map(x=>`<div class="flex justify-between border-b border-[#eee9df] pb-2"><span class="muted">${x[0]}</span><span class="font-medium">${x[1]}</span></div>`).join('')}</div></div>`;
    resultHtml=`<div class="grid md:grid-cols-2 gap-5 mt-5">${col('BASELINE',r.baseline)}${col('SCENARIO',r.scenario)}</div><div class="panel p-5 mt-5"><div class="font-semibold">Decision Impact</div><p class="mt-2 text-sm muted">${esc(r.decision_impact)}</p><div class="mt-3 text-xs muted">Recommended contract strategy for scenario: ${r.contract_strategy}</div></div>`;
  }
  return layout(heading('What-If Simulator','Change assumptions and compare baseline versus scenario outcomes \u2014 POSTs to /api/what-if')+formHtml+resultHtml);
}
function wireWhatif(){
  const f=document.getElementById('whatif-form');
  if(!f) return;
  f.addEventListener('submit', async (e)=>{
    e.preventDefault();
    whatifInputs={...whatifInputs, ...formData(f)};
    ['baseline_cargo_quantity','cargo_quantity','baseline_coverage','coverage','market_adj_pct','bunker_adj_pct','congestion_adj_days'].forEach(k=>whatifInputs[k]=Number(whatifInputs[k]));
    whatifError=null;
    mount(layout(heading('What-If Simulator','Recalculating…')+loadingPanel('Calling /api/what-if…')));
    try{ whatifResult=await api('/what-if',{method:'POST',body:whatifInputs}); } catch(err){ whatifError=err.message; }
    renderRoute();
  });
}

// ==== RISK ===================================================================
async function risk(){
  const r = await api('/risk');
  const rows=Object.entries(r.scores);
  return layout(heading('Risk & Alerts','Market, port, weather, geopolitical, supply and contract risk assessment \u2014 GET /api/risk')+
    `<div class="grid md:grid-cols-3 xl:grid-cols-6 gap-3">${rows.map(([k,v])=>metric(k[0].toUpperCase()+k.slice(1),v+'/100')).join('')}</div>`+
    `<div class="grid xl:grid-cols-2 gap-5 mt-5"><div class="panel p-5"><div class="font-semibold">Risk profile</div><div class="mt-5 space-y-4">${rows.map(([k,v])=>`<div><div class="flex justify-between text-sm"><span class="capitalize">${k}</span><span class="font-semibold">${v}</span></div><div class="mt-1 h-2 bg-[#eee9df]"><div style="width:${v}%;height:100%;background:${v>60?'#9a5f58':v>45?'#9a7b3d':'#5d755e'}"></div></div></div>`).join('')}</div></div><div class="panel p-5"><div class="font-semibold">Event-driven alerts</div>${r.events.map(ev=>`<div class="mt-4 border-l-4 border-[#9a5f58] pl-4"><div class="font-semibold">${esc(ev.type)} &middot; ${ev.severity}</div><div class="text-sm mt-1">Affected: ${ev.affected_routes.join(', ')}</div><div class="text-sm mt-1">Expected impact: +${ev.expected_impact_days} days loading</div><div class="text-xs muted mt-2">Region: ${esc(ev.region)} &middot; ${ev.start} - ${ev.end} &middot; Source: ${esc(ev.source)}</div></div>`).join('')}</div></div>`);
}

// ==== DATA QUALITY ===========================================================
async function dataquality(){
  const d = await api('/data-quality');
  return layout(heading('Data Quality','Pipeline health and dataset readiness for decision support \u2014 GET /api/data-quality')+
    table(['Dataset','Missing %','Duplicates %','Invalid values','Rows (live)','Last updated','Quality status'],
      d.datasets.map(r=>[r.name,r.missing_pct+'%',r.duplicates_pct+'%',r.invalid_values,r.row_count!==undefined?r.row_count:'—',r.last_updated?new Date(r.last_updated).toLocaleString():'demo',badge(r.status)])));
}

// ==== MODELS =================================================================
async function models(){
  const m = await api('/models');
  return layout(heading('Model Performance','Model registry and status \u2014 GET /api/models')+
    table(['Model','30D MAE','Status'],m.models.map(r=>[r.name,r.mae_30d??'—',r.status==='Recommended'?badge('HEALTHY'):r.status==='Baseline'?badge('MEDIUM'):badge('WARNING')])));
}

// ==== HISTORY (new) ==========================================================
let historyType='';
async function history(){
  const h = await api('/history', {query: historyType?{type:historyType}:{}});
  const types=['','forecast','vessel_recommend','port_check','charter','contract_optimize','what_if'];
  const filterHtml=`<div class="panel p-4 flex items-center gap-3 text-sm"><span class="muted">Filter by type:</span><select id="history-filter" class="border border-[#d8d1c4] bg-white p-2">${types.map(t=>`<option value="${t}" ${t===historyType?'selected':''}>${t||'All'}</option>`).join('')}</select></div>`;
  const rows=h.runs.map(r=>[r.id,r.run_type,new Date(r.created_at).toLocaleString(),`<details><summary class="cursor-pointer underline text-xs">inputs</summary><pre class="text-[11px] whitespace-pre-wrap mt-1">${esc(JSON.stringify(r.inputs,null,2))}</pre></details>`,`<details><summary class="cursor-pointer underline text-xs">outputs</summary><pre class="text-[11px] whitespace-pre-wrap mt-1 max-w-md">${esc(JSON.stringify(r.outputs,null,2))}</pre></details>`]);
  return layout(heading('Run History','Every scenario run through this UI is logged to the scenario_runs table \u2014 GET /api/history. Use this to verify end-to-end that a UI action really reached the database.')+
    filterHtml+`<div class="mt-4">${table(['ID','Type','Timestamp','Inputs','Outputs'],rows)}</div>`);
}
function wireHistory(){
  const sel=document.getElementById('history-filter');
  if(!sel) return;
  sel.addEventListener('change', async ()=>{
    historyType=sel.value;
    mount(layout(heading('Run History','Loading…')+loadingPanel()));
    await renderRoute();
  });
}

// ==== SETTINGS ===============================================================
async function settings(){
  let health=null, healthError=null;
  try{ health=await api('/health'); } catch(e){ healthError=e.message; }
  return layout(heading('System / Settings','Administrative configuration and live health check')+
    `<div class="grid lg:grid-cols-2 gap-5">${[['API Configuration',[['API Base URL',API],['Backend mode','simulated (lib/sim.js)']]],['System Health',health?[['Status',health.status],['Database',health.database],['Checked at',new Date(health.timestamp).toLocaleString()]]:[['Status','error'],['Detail',healthError]]]].map(sec=>`<div class="panel p-5"><div class="font-semibold">${sec[0]}</div><div class="mt-4 space-y-3 text-sm">${sec[1].map(x=>`<div class="flex justify-between border-b border-[#eee9df] pb-2"><span class="muted">${x[0]}</span><span class="font-medium">${esc(x[1])}</span></div>`).join('')}</div></div>`).join('')}</div>`+
    `<div class="panel p-5 mt-5 text-sm"><div class="font-semibold">How to go live with real models</div><p class="mt-2 muted leading-6">See <a class="underline" href="/docs/ML_TEAM_README.md">ML_TEAM_README.md</a> and the project root <a class="underline" href="/README.md">README.md</a> for exactly where to plug in real forecasting, congestion, vessel and optimization services without touching this frontend.</p></div>`);
}

function notFound(){return layout(heading('Page Not Found','The requested route does not exist in this decision-support application.')+`<a href="#/" class="inline-block mt-3 px-4 py-2.5 bg-[#2b302c] text-white text-sm">Return to Dashboard</a>`)}

// ---- Router ---------------------------------------------------------------
const routes={
  '/': {build:dashboard, wire:null},
  '/market': {build:market, wire:null},
  '/forecast': {build:forecast, wire:wireForecast},
  '/vessels': {build:vessels, wire:wireVessels},
  '/ports': {build:ports, wire:wirePorts},
  '/charter': {build:charter, wire:wireCharter},
  '/what-if': {build:whatif, wire:wireWhatif},
  '/risk': {build:risk, wire:null},
  '/data-quality': {build:dataquality, wire:null},
  '/models': {build:models, wire:null},
  '/history': {build:history, wire:wireHistory},
  '/settings': {build:settings, wire:null},
};

async function renderRoute(){
  const r=routes[state.route];
  if(!r){ mount(notFound()); return; }
  mount(layout(heading(pageTitle(state.route),'Loading…')+loadingPanel()));
  try{
    const html=await r.build();
    mount(html);
    if(r.wire) r.wire();
  }catch(err){
    mount(layout(heading(pageTitle(state.route),'')+errorPanel(err.message)));
  }
}

window.addEventListener('hashchange',()=>{state.route=location.hash.slice(1)||'/';renderRoute();});
renderRoute();
})();