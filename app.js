const SHEET_ID = '1Ym3DmIw7gwF0I6hMk9b1GRxRZzVNVVoHhQvQd4hMhkY';
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`;
const GIDS = { jobs: 423951101, time: 1419771717, invoices: 310085797, clients: 1839494336, dashboard: 1598520406 };
// Set this after deploying Google Apps Script web app endpoint
const DEFAULT_SYNC_ENDPOINT = '';
const DEFAULT_SYNC_TOKEN = '';


const fallback = {
  alerts:[
    'Bishop Consulting website revision is overdue by 2 days',
    'Invoice INV-241 is 16 days overdue (Riverstone Dental)',
    '3 inquiries pending response > 24h'
  ],
  billQueue:[
    'Summit Homes — Brand refresh sprint (12.5h)',
    'Riverstone Dental — Landing page edits (8h)',
    'A1A Consulting — Proposal prep + revisions (6.5h)'
  ],
  jobs:[
    ['7808','Website Refresh','Summit Homes','Jon','Production','Mar 12','Mar 22','10d','At Risk','$3,125'],
    ['7807','Brand Kit Update','Riverstone Dental','Joy','Review','Mar 10','Mar 21','11d','On Track','$2,240'],
    ['7806','Speakeasy Promo Assets','Giuseppe\'s','Jon','Delivered','Mar 8','Mar 19','11d','Ready to Bill','$1,860'],
    ['7805','Investor Deck Revisions','PickleOps','Joy','Client Feedback','Mar 15','Mar 25','10d','Waiting','$1,350'],
    ['7804','Automation Setup','DE Project','Jon','Implementation','Mar 16','Mar 27','11d','On Track','$875']
  ],
  kpis:[
    ['Active Jobs',12],['Due This Week',5],['Overdue',2],['New Inquiries',4],['Unread Alerts',3],
    ['Revenue Ready', '$9,450'],['Billed (MTD)','$18,200'],['Overdue Invoices',3],['Jon Hours MTD',96],['Joy Hours MTD',74]
  ],
  revenue:{ready:'$9,450',billed:'$18,200',outstanding:'$6,780'},
  capacity:{jon:'82%',joy:'74%',turnaround:'4.2 days'}
};

let currentModel = structuredClone(fallback);
let clientMaster = [];
let nextJobNumber = 7804;
let clientsUI = { sortBy: 'client', search: '', showInactive: true, showArchived: false };
let jobsUI = { owner: 'all', status: 'all', due: 'all', activeOnly: true };

function parseCSV(text){
  const rows=[]; let row=[]; let cell=''; let inQ=false;
  for(let i=0;i<text.length;i++){
    const ch=text[i], nx=text[i+1];
    if(ch==='"'){ if(inQ && nx==='"'){ cell+='"'; i++; } else inQ=!inQ; }
    else if(ch===',' && !inQ){ row.push(cell.trim()); cell=''; }
    else if((ch==='\n' || ch==='\r') && !inQ){ if(ch==='\r' && nx==='\n') i++; row.push(cell.trim()); if(row.some(v=>v!=='')) rows.push(row); row=[]; cell=''; }
    else cell+=ch;
  }
  if(cell.length || row.length){ row.push(cell.trim()); if(row.some(v=>v!=='')) rows.push(row); }
  return rows;
}

function rowsToObjects(matrix){
  if(!matrix.length) return [];
  const h=matrix[0].map(x=>x.toLowerCase());
  return matrix.slice(1).filter(r=>r.some(Boolean)).map(r=>{ const o={}; h.forEach((k,i)=>o[k]=r[i]||''); return o; });
}

const money = s => Number(String(s||'').replace(/[^\d.-]/g,'')) || 0;
const hours = s => Number(String(s||'').replace(/[^\d.-]/g,'')) || 0;
const fmtMoney = n => `$${Number(n||0).toLocaleString()}`;

async function fetchTab(gid){
  const url=`https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${gid}`;
  const res=await fetch(url,{cache:'no-store'});
  if(!res.ok) throw new Error(`HTTP ${res.status}`);
  const txt=await res.text();
  if(/<!doctype html>|<html/i.test(txt)) throw new Error('Sheet not publicly readable yet');
  return rowsToObjects(parseCSV(txt));
}

async function fetchMatrix(gid){
  const url=`https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${gid}`;
  const res=await fetch(url,{cache:'no-store'});
  if(!res.ok) throw new Error(`HTTP ${res.status}`);
  const txt=await res.text();
  if(/<!doctype html>|<html/i.test(txt)) throw new Error('Sheet not publicly readable yet');
  return parseCSV(txt);
}

function getNextJobNumber(){
  const local = Number(localStorage.getItem('gdpNextJobNumber') || nextJobNumber);
  return Number.isFinite(local) && local > 0 ? local : 7804;
}
function setNextJobNumber(v){
  nextJobNumber = Number(v) || nextJobNumber;
  localStorage.setItem('gdpNextJobNumber', String(nextJobNumber));
  const badge = document.getElementById('nextJobBadge');
  if (badge) badge.textContent = `Next Job #${nextJobNumber}`;
}

function renderClientsTable(){
  const body = document.getElementById('clientsBody');
  if (!body) return;
  body.innerHTML = '';

  const rows = clientMaster
    .filter(c => {
      const s = String(c.status || 'Active').toLowerCase();
      if (!clientsUI.showInactive && s === 'inactive') return false;
      if (!clientsUI.showArchived && s === 'archived') return false;
      return true;
    })
    .filter(c => {
      const hay = `${c.client || ''} ${c['primary contact'] || ''} ${c.email || ''} ${c.phone || ''} ${c.tags || ''}`.toLowerCase();
      return hay.includes((clientsUI.search || '').toLowerCase());
    })
    .sort((a,b) => {
      // Active first, then Inactive, then Archived
      const rank = s => {
        const v = String(s || 'Active').toLowerCase();
        if (v === 'active') return 0;
        if (v === 'inactive') return 1;
        if (v === 'archived') return 2;
        return 3;
      };
      const sa = rank(a.status), sb = rank(b.status);
      if (sa !== sb) return sa - sb;

      const key = clientsUI.sortBy;
      if (key === 'outstanding') return (Number(b.outstanding)||0) - (Number(a.outstanding)||0);
      if (key === 'last activity') {
        const ad = new Date(a['last activity'] || '1970-01-01').getTime();
        const bd = new Date(b['last activity'] || '1970-01-01').getTime();
        return bd - ad;
      }
      const av = String(a[key] || a.client || '').toLowerCase();
      const bv = String(b[key] || b.client || '').toLowerCase();
      return av.localeCompare(bv);
    });

  rows.forEach((c, idx) => {
    const tr = document.createElement('tr');
    const rawStatus = String(c.status || 'Active').toLowerCase();
    const status = rawStatus === 'archived' ? 'Archived' : (rawStatus === 'inactive' ? 'Inactive' : 'Active');
    const pillClass = status==='Active' ? 'ok' : (status==='Inactive' ? 'warn' : 'danger');
    tr.innerHTML = `
      <td>${c.client || '—'}</td>
      <td>${c['primary contact'] || '—'}</td>
      <td>${c.email || '—'}</td>
      <td>${c.phone || '—'}</td>
      <td>${c.tags || '—'}</td>
      <td>${c['last activity'] || '—'}</td>
      <td>${fmtMoney(c.outstanding || 0)}</td>
      <td><span class="pill ${pillClass}">${status}</span></td>
      <td>
        <button class="tiny-btn" data-action="toggle" data-client="${(c.client||'').replace(/"/g,'&quot;')}">${status==='Active'?'Set Inactive':'Set Active'}</button>
        <button class="tiny-btn" data-action="archive" data-client="${(c.client||'').replace(/"/g,'&quot;')}">${status==='Archived'?'Unarchive':'Archive'}</button>
      </td>`;
    body.appendChild(tr);
  });

  body.querySelectorAll('button[data-action="toggle"]').forEach(btn => {
    btn.onclick = () => {
      const name = btn.dataset.client;
      const rec = clientMaster.find(x => (x.client||'') === name);
      if (!rec) return;
      const next = (String(rec.status||'Active').toLowerCase()==='inactive') ? 'Active' : 'Inactive';
      rec.status = next;
      touchClientActivity(name);
      queueAction('set_client_status', { client: name, status: next });
      renderClientsTable();
    };
  });

  body.querySelectorAll('button[data-action="archive"]').forEach(btn => {
    btn.onclick = () => {
      const name = btn.dataset.client;
      const rec = clientMaster.find(x => (x.client||'') === name);
      if (!rec) return;
      const next = (String(rec.status || 'Active').toLowerCase() === 'archived') ? 'Inactive' : 'Archived';
      rec.status = next;
      touchClientActivity(name);
      queueAction('set_client_status', { client: name, status: next });
      renderClientsTable();
    };
  });
}

function touchClientActivity(clientName){
  const rec = clientMaster.find(c => String(c.client||'').trim().toLowerCase() === String(clientName||'').trim().toLowerCase());
  if (rec) rec['last activity'] = new Date().toISOString().slice(0,10);
}

function bindClientsControls(){
  const search = document.getElementById('clientSearch');
  const sort = document.getElementById('clientSort');
  const showInactive = document.getElementById('showInactive');
  const showArchived = document.getElementById('showArchived');
  if (!search || search.dataset.bound) return;
  search.dataset.bound = '1';
  search.oninput = () => { clientsUI.search = search.value || ''; renderClientsTable(); };
  sort.onchange = () => { clientsUI.sortBy = sort.value; renderClientsTable(); };
  showInactive.onchange = () => { clientsUI.showInactive = !!showInactive.checked; renderClientsTable(); };
  showArchived.onchange = () => { clientsUI.showArchived = !!showArchived.checked; renderClientsTable(); };
}

function bindJobsControls(){
  const owner = document.getElementById('jobOwnerFilter');
  const status = document.getElementById('jobStatusFilter');
  const due = document.getElementById('jobDueFilter');
  const activeOnly = document.getElementById('jobActiveOnly');
  if (!owner || owner.dataset.bound) return;
  owner.dataset.bound = '1';
  owner.onchange = () => { jobsUI.owner = owner.value; render(currentModel); };
  status.onchange = () => { jobsUI.status = status.value; render(currentModel); };
  due.onchange = () => { jobsUI.due = due.value; render(currentModel); };
  activeOnly.onchange = () => { jobsUI.activeOnly = !!activeOnly.checked; render(currentModel); };
}

function render(model){
  const kpis=document.getElementById('kpis'); kpis.innerHTML='';
  model.kpis.forEach(([label,val])=>{const d=document.createElement('div');d.className='kpi';d.innerHTML=`<label>${label}</label><strong>${val}</strong>`;kpis.appendChild(d);});

  const alerts=document.getElementById('alerts'); alerts.innerHTML='';
  model.alerts.forEach((x,i)=>{const li=document.createElement('li');li.innerHTML=`${x} <span class="pill ${i===0?'danger':'warn'}">${i===0?'High':'Med'}</span>`;alerts.appendChild(li);});

  const bq=document.getElementById('billQueue'); bq.innerHTML='';
  model.billQueue.forEach(x=>{const li=document.createElement('li');li.innerHTML=`${x} <span class="pill ok">Bill It</span>`;bq.appendChild(li);});

  const tb=document.getElementById('jobs'); tb.innerHTML='';
  const now = Date.now();
  const in7 = now + (7 * 24 * 60 * 60 * 1000);
  const activeStages = ['lead','active','in progress','production','review','client feedback','implementation'];

  const filteredJobs = model.jobs.filter(r => {
    const owner = r[3] || '';
    const status = r[8] || '';
    const stage = String(r[4] || '').toLowerCase();
    const due = new Date(r[6]);

    if (jobsUI.owner !== 'all' && owner !== jobsUI.owner) return false;
    if (jobsUI.status !== 'all' && status !== jobsUI.status) return false;

    if (jobsUI.activeOnly && !activeStages.some(s => stage.includes(s))) return false;

    if (jobsUI.due === 'week') {
      if (Number.isNaN(due.getTime()) || due.getTime() < now || due.getTime() > in7) return false;
    }
    if (jobsUI.due === 'overdue') {
      if (Number.isNaN(due.getTime()) || due.getTime() >= now) return false;
    }
    return true;
  });

  filteredJobs.forEach(r=>{
    const tr=document.createElement('tr');
    const statusClass = r[8]==='At Risk'?'danger':(r[8]==='Ready to Bill'?'ok':'warn');
    tr.innerHTML=`<td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td>${r[4]}</td><td>${r[5]}</td><td>${r[6]}</td><td>${r[7]}</td><td><span class="pill ${statusClass}">${r[8]}</span></td><td>${r[9]}</td><td><button class="tiny-btn log-time-inline" data-job="${String(r[0]).replace(/"/g,'&quot;')}" data-project="${String(r[1]).replace(/"/g,'&quot;')}" data-client="${String(r[2]).replace(/"/g,'&quot;')}" data-person="${String(r[3]).replace(/"/g,'&quot;')}">Log Time</button></td>`;
    tb.appendChild(tr);
  });

  tb.querySelectorAll('.log-time-inline').forEach(btn => {
    btn.onclick = () => {
      openLogTimeForm({
        jobNumber: btn.dataset.job,
        project: btn.dataset.project,
        client: btn.dataset.client,
        person: btn.dataset.person
      });
    };
  });

  document.getElementById('revReady').textContent=model.revenue.ready;
  document.getElementById('revBilled').textContent=model.revenue.billed;
  document.getElementById('revOutstanding').textContent=model.revenue.outstanding;
  document.getElementById('capJon').textContent=model.capacity.jon;
  document.getElementById('capJoy').textContent=model.capacity.joy;
  document.getElementById('turnaround').textContent=model.capacity.turnaround;
  setNextJobNumber(getNextJobNumber());

  bindJobsControls();
  bindClientsControls();
  renderClientsTable();
}

function fromSheet(jobs, time, invoices, clients){
  // Build outstanding and activity maps from invoices/time logs
  const outstandingByClient = {};
  const lastActivityByClient = {};
  (invoices || []).forEach(inv => {
    const client = (inv['client'] || '').trim();
    if (!client) return;
    const st = (inv['status'] || '').toLowerCase();
    const amt = money(inv['amount']);
    if (st !== 'paid') outstandingByClient[client] = (outstandingByClient[client] || 0) + amt;
    const dt = new Date(inv['paid date'] || inv['issue date']);
    if (!Number.isNaN(dt.getTime())) {
      const cur = lastActivityByClient[client] ? new Date(lastActivityByClient[client]) : null;
      if (!cur || dt > cur) lastActivityByClient[client] = dt.toISOString().slice(0,10);
    }
  });
  (time || []).forEach(t => {
    const client = (t['client'] || '').trim();
    if (!client) return;
    const dt = new Date(t['date']);
    if (!Number.isNaN(dt.getTime())) {
      const cur = lastActivityByClient[client] ? new Date(lastActivityByClient[client]) : null;
      if (!cur || dt > cur) lastActivityByClient[client] = dt.toISOString().slice(0,10);
    }
  });

  clientMaster = (clients || []).map(c => {
    const client = c['client'] || c['name'] || '';
    return {
      client,
      'primary contact': c['primary contact'] || c['contact'] || '',
      status: c['status'] || 'Active',
      email: c['email'] || '',
      phone: c['phone'] || '',
      tags: c['tags'] || '',
      'last activity': c['last activity'] || lastActivityByClient[client] || '—',
      outstanding: Number(c['outstanding'] || outstandingByClient[client] || 0)
    };
  });
  const now = new Date();
  const thisMonth = now.getMonth(), thisYear = now.getFullYear();
  const activeStatuses = new Set(['active','in progress','production','review','client feedback','implementation']);
  const waitingStatuses = new Set(['waiting on client','waiting']);

  const activeJobs = jobs.filter(j=>activeStatuses.has((j['status']||'').toLowerCase())).length;
  const waiting = jobs.filter(j=>waitingStatuses.has((j['status']||'').toLowerCase())).length;

  let jonHours=0, joyHours=0, monthHours=0;
  time.forEach(t=>{
    const d=new Date(t['date']); if(Number.isNaN(d.getTime())) return;
    if(d.getMonth()===thisMonth && d.getFullYear()===thisYear){
      const h=hours(t['hours']); monthHours+=h;
      if((t['person']||'').toLowerCase()==='jon') jonHours+=h;
      if((t['person']||'').toLowerCase()==='joy') joyHours+=h;
    }
  });

  let draft=0,sent=0,overdue=0,billedMTD=0,outstanding=0,ready=0;
  invoices.forEach(inv=>{
    const st=(inv['status']||'').toLowerCase();
    const amt=money(inv['amount']);
    if(st==='draft') draft++;
    if(st==='sent') sent++;
    if(st==='overdue') overdue++;
    if(st!=='paid') outstanding+=amt;
    if(st==='draft' || st==='ready') ready+=amt;
    const pd=new Date(inv['paid date'] || inv['issue date']);
    if(st==='paid' && !Number.isNaN(pd.getTime()) && pd.getMonth()===thisMonth && pd.getFullYear()===thisYear) billedMTD+=amt;
  });

  const sortedJobs = [...jobs].sort((a,b)=>{
    const ja = Number(String(a['job id']||a['job #']||'').replace(/[^\d]/g,'')) || 0;
    const jb = Number(String(b['job id']||b['job #']||'').replace(/[^\d]/g,'')) || 0;
    return jb - ja; // highest/latest job number first
  });

  const jobsRows = sortedJobs.slice(0,12).map(j=>{
    const started = j['start date'] || '—';
    const due = j['due date'] || '—';
    let timeline = '—';
    const d = new Date(due);
    if (!Number.isNaN(d.getTime())) {
      const days = Math.ceil((d.getTime() - Date.now())/(1000*60*60*24));
      timeline = days < 0 ? `${Math.abs(days)}d late` : `${days}d left`;
    }
    const state = (j['status']||'').toLowerCase();
    const uiStatus = state.includes('risk') ? 'At Risk' : (state.includes('bill') ? 'Ready to Bill' : (state.includes('waiting') ? 'Waiting' : 'On Track'));
    return [
      j['job id'] || j['job #'] || '—',
      j['project'] || j['job'] || '—',
      j['client'] || '—',
      j['owner'] || '—',
      j['status'] || '—',
      started,
      due,
      timeline,
      uiStatus,
      j['billable amount'] || '$—'
    ];
  });

  return {
    alerts:[
      overdue? `${overdue} overdue invoice(s) need follow-up` : 'No overdue invoices flagged',
      waiting? `${waiting} job(s) waiting on client` : 'No jobs waiting on client',
      activeJobs? `${activeJobs} active job(s) in progress` : 'No active jobs in pipeline'
    ],
    billQueue: invoices.filter(i=>['draft','ready'].includes((i['status']||'').toLowerCase())).slice(0,5).map(i=>`${i['client']||'Client'} — ${i['invoice id']||'Draft'} (${i['amount']||'$0'})`),
    jobs: jobsRows.length?jobsRows:fallback.jobs,
    kpis:[
      ['Active Jobs',activeJobs], ['Waiting on Client',waiting], ['Hours This Month',monthHours.toFixed(1)], ['Invoices Draft',draft], ['Invoices Sent',sent],
      ['Invoices Overdue',overdue], ['Revenue Ready',fmtMoney(ready)], ['Billed (MTD)',fmtMoney(billedMTD)], ['Jon Hours MTD',jonHours.toFixed(1)], ['Joy Hours MTD',joyHours.toFixed(1)]
    ],
    revenue:{ ready:fmtMoney(ready), billed:fmtMoney(billedMTD), outstanding:fmtMoney(outstanding) },
    capacity:{ jon:`${Math.min(100,Math.round((jonHours/120)*100))}%`, joy:`${Math.min(100,Math.round((joyHours/120)*100))}%`, turnaround:'Live calc (phase 2)' }
  };
}

function getQueue(){ try{return JSON.parse(localStorage.getItem('gdpQueue')||'[]');}catch{return [];} }
function setQueue(q){ localStorage.setItem('gdpQueue', JSON.stringify(q)); updateQueueStatus(); }
function getSyncEndpoint(){ return localStorage.getItem('gdpSyncEndpoint') || DEFAULT_SYNC_ENDPOINT; }
function setSyncEndpoint(url){ localStorage.setItem('gdpSyncEndpoint', url || ''); }
function getSyncToken(){ return localStorage.getItem('gdpSyncToken') || DEFAULT_SYNC_TOKEN; }
function setSyncToken(tok){ localStorage.setItem('gdpSyncToken', tok || ''); }
function updateQueueStatus(){
  const el = document.getElementById('queueStatus');
  if (!el) return;
  const q = getQueue();
  el.textContent = `Queue: ${q.length}`;
}

async function syncQueue(){
  const endpoint = getSyncEndpoint();
  if (!endpoint) {
    const input = prompt('Paste Apps Script Web App endpoint URL to enable sync:');
    if (!input) return;
    setSyncEndpoint(input.trim());
  }
  if (!getSyncToken()) {
    const tokenInput = prompt('Enter shared sync token:');
    if (!tokenInput) return;
    setSyncToken(tokenInput.trim());
  }

  const url = getSyncEndpoint();
  const q = getQueue();
  if (!q.length) { alert('Queue is empty.'); return; }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-GDP-SYNC-TOKEN': getSyncToken()
    },
    body: JSON.stringify({ sheetId: SHEET_ID, actions: q, syncToken: getSyncToken() })
  });
  if (!res.ok) throw new Error(`Sync failed: HTTP ${res.status}`);
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || 'Sync failed');
  setQueue([]);
  alert(`Synced ${json.applied || q.length} action(s) to sheet.`);
}

function queueAction(type,payload){
  const q=getQueue();
  q.unshift({ id:`Q-${Date.now()}`, type, payload, createdAt:new Date().toISOString(), status:'pending' });
  setQueue(q);
}

function openLogTimeForm(prefill = {}){
  const modal=document.getElementById('modal');
  const form=document.getElementById('modalForm');
  const title=document.getElementById('modalTitle');
  const note=document.getElementById('modalNote');
  modal.classList.remove('hidden');
  title.textContent='Log Time';
  form.innerHTML=`
    <label>Date<input name="date" type="date" required value="${new Date().toISOString().slice(0,10)}"></label>
    <label>Client<input name="client" required value="${prefill.client || ''}"></label>
    <label>Project<input name="project" required value="${prefill.project || ''}"></label>
    <label>Person<select name="person"><option ${prefill.person==='Jon'?'selected':''}>Jon</option><option ${prefill.person==='Joy'?'selected':''}>Joy</option></select></label>
    <label>Hours<input name="hours" type="number" step="0.25" min="0" required></label>
    <label>Billable<select name="billable"><option>Yes</option><option>No</option></select></label>
    <label class="full">Description<textarea name="description">${prefill.jobNumber ? `Job #${prefill.jobNumber} — ` : ''}${prefill.project || ''}</textarea></label>
    <button class="submit" type="submit">Log Time</button>
  `;
  form.onsubmit=(e)=>{
    e.preventDefault();
    const d=Object.fromEntries(new FormData(form).entries());
    queueAction('log_time',d);
    touchClientActivity(d.client);
    const h=Number(d.hours||0);
    currentModel.kpis[2][1]=(Number(currentModel.kpis[2][1]||0)+h).toFixed(1);
    if(d.person==='Jon') currentModel.kpis[8][1]=(Number(currentModel.kpis[8][1]||0)+h).toFixed(1);
    if(d.person==='Joy') currentModel.kpis[9][1]=(Number(currentModel.kpis[9][1]||0)+h).toFixed(1);
    render(currentModel);
    note.innerHTML=`Logged locally. Next: sync to sheet → <a href="${SHEET_URL}" target="_blank" rel="noopener">Open Sheet</a>`;
  };
}

function wireUI(){
  const modal=document.getElementById('modal');
  const form=document.getElementById('modalForm');
  const title=document.getElementById('modalTitle');
  const note=document.getElementById('modalNote');
  const close=()=>{ modal.classList.add('hidden'); form.innerHTML=''; note.textContent=''; };
  document.getElementById('modalClose').onclick=close;
  modal.addEventListener('click',e=>{ if(e.target===modal) close(); });

  document.getElementById('btnNewJob').onclick=()=>{
    modal.classList.remove('hidden');
    title.textContent='Create New Job';
    const jobNo = getNextJobNumber();
    form.innerHTML=`
      <label>Job #<input name="jobNumber" required readonly value="${jobNo}"></label>
      <label>Client<input name="client" required></label>
      <label>Project<input name="project" required></label>
      <label>Owner<select name="owner"><option>Jon</option><option>Joy</option></select></label>
      <label>Due Date<input name="due" type="date"></label>
      <label class="full">Notes<textarea name="notes"></textarea></label>
      <button class="submit" type="submit">Save Job</button>
    `;
    form.onsubmit=(e)=>{
      e.preventDefault();
      const d=Object.fromEntries(new FormData(form).entries());
      queueAction('new_job',d);
      const started = new Date().toISOString().slice(0,10);
      currentModel.jobs.unshift([String(d.jobNumber),d.project,d.client,d.owner,'Lead',started,d.due||'—','new','On Track','$—']);
      currentModel.kpis[0][1]=Number(currentModel.kpis[0][1]||0)+1;
      setNextJobNumber(Number(d.jobNumber) + 1);
      render(currentModel);
      note.innerHTML=`Saved Job #${d.jobNumber}. Next number is ${getNextJobNumber()}. Sync to sheet → <a href="${SHEET_URL}" target="_blank" rel="noopener">Open Sheet</a>`;
    };
  };

  document.getElementById('btnLogTime').onclick=()=> openLogTimeForm();

  document.getElementById('btnBillIt').onclick=()=>{
    modal.classList.remove('hidden');
    title.textContent='Bill It — Invoice Draft';
    form.innerHTML=`
      <label>Client<input name="client" required></label>
      <label>Project<input name="project" required></label>
      <label>Hours<input name="hours" type="number" step="0.25" min="0" required></label>
      <label>Rate<input name="rate" type="number" step="1" min="0" required value="100"></label>
      <label>Issue Date<input name="issue" type="date" required value="${new Date().toISOString().slice(0,10)}"></label>
      <label>Due Date<input name="due" type="date"></label>
      <label class="full">Description<textarea name="description" placeholder="Design, revision, strategy, delivery…"></textarea></label>
      <button class="submit" type="submit">Create Draft</button>
    `;
    form.onsubmit=(e)=>{
      e.preventDefault();
      const d=Object.fromEntries(new FormData(form).entries());
      const amount=(Number(d.hours||0)*Number(d.rate||0));
      queueAction('bill_it',{...d, amount});
      touchClientActivity(d.client);
      const rec = clientMaster.find(c => String(c.client||'').trim().toLowerCase() === String(d.client||'').trim().toLowerCase());
      if (rec) rec.outstanding = Number(rec.outstanding || 0) + amount;
      currentModel.billQueue.unshift(`${d.client} — ${d.project} (${fmtMoney(amount)})`);
      currentModel.revenue.ready=fmtMoney(money(currentModel.revenue.ready)+amount);
      render(currentModel);
      note.innerHTML=`Invoice draft queued (${fmtMoney(amount)}). Next: finalize in sheet/docs. <a href="${SHEET_URL}" target="_blank" rel="noopener">Open Sheet</a>`;
    };
  };

  document.getElementById('btnAddClient').onclick=()=>{
    modal.classList.remove('hidden');
    title.textContent='Add Client';
    form.innerHTML=`
      <label>Client Name<input name="client" required></label>
      <label>Primary Contact<input name="contact"></label>
      <label>Email<input name="email" type="email"></label>
      <label>Phone<input name="phone"></label>
      <label>Tags (industry/type)<input name="tags" placeholder="Restaurant, Healthcare, Real Estate"></label>
      <label>Status<select name="status"><option>Active</option><option>Inactive</option></select></label>
      <label>Default Rate<input name="rate" type="number" step="1" value="100"></label>
      <button class="submit" type="submit">Save Client</button>
    `;
    form.onsubmit=(e)=>{
      e.preventDefault();
      const d=Object.fromEntries(new FormData(form).entries());
      const nameNorm = (d.client || '').trim().toLowerCase();
      const emailNorm = (d.email || '').trim().toLowerCase();
      const dup = clientMaster.find(c =>
        ((c.client || '').trim().toLowerCase() === nameNorm) ||
        (emailNorm && (c.email || '').trim().toLowerCase() === emailNorm)
      );
      if (dup) {
        note.innerHTML = `Possible duplicate detected: <strong>${dup.client}</strong>. Please confirm before adding.`;
        return;
      }

      queueAction('add_client',d);
      clientMaster.unshift({
        client:d.client,
        'primary contact': d.contact || '',
        status:d.status,
        email:d.email || '',
        phone:d.phone || '',
        tags: d.tags || '',
        'last activity': new Date().toISOString().slice(0,10),
        outstanding: 0
      });
      renderClientsTable();
      note.innerHTML=`Client \"${d.client}\" saved to list (${d.status}). Sync pending → <a href="${SHEET_URL}" target="_blank" rel="noopener">Open Sheet</a>`;
      setTimeout(()=>{ close(); }, 650);
    };
  };

  document.getElementById('btnSyncQueue').onclick=async ()=>{
    try { await syncQueue(); }
    catch (err) { alert(err.message || 'Sync failed.'); }
  };
}

(async function init(){
  const ds = document.getElementById('dataSource');
  try{
    const [jobs,time,invoices,clients,dashboardMatrix] = await Promise.all([
      fetchTab(GIDS.jobs), fetchTab(GIDS.time), fetchTab(GIDS.invoices), fetchTab(GIDS.clients), fetchMatrix(GIDS.dashboard)
    ]);
    // Pull next open job number from Dashboard settings if present
    for (const row of dashboardMatrix) {
      if ((row[3] || '').toLowerCase().includes('next open job number')) {
        const n = Number(row[4]);
        if (Number.isFinite(n) && n > 0) setNextJobNumber(n);
      }
    }
    currentModel = fromSheet(jobs,time,invoices,clients);
    render(currentModel);
    ds.textContent='Live data connected'; ds.style.color='#246b45';
  }catch(e){
    currentModel = structuredClone(fallback);
    render(currentModel);
    ds.textContent='Using demo data (share sheet publicly to connect live)'; ds.style.color='#9a6a10';
  }
  wireUI();
  updateQueueStatus();
})();
