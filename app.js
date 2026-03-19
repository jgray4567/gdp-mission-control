const SHEET_ID = '1Ym3DmIw7gwF0I6hMk9b1GRxRZzVNVVoHhQvQd4hMhkY';
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`;
const GIDS = { jobs: 423951101, time: 1419771717, invoices: 310085797 };

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
    ['Website Refresh','Summit Homes','Jon','Production','Mar 22','At Risk','$3,125'],
    ['Brand Kit Update','Riverstone Dental','Joy','Review','Mar 21','On Track','$2,240'],
    ['Speakeasy Promo Assets','Giuseppe\'s','Jon','Delivered','Mar 19','Ready to Bill','$1,860'],
    ['Investor Deck Revisions','PickleOps','Joy','Client Feedback','Mar 25','Waiting','$1,350'],
    ['Automation Setup','DE Project','Jon','Implementation','Mar 27','On Track','$875']
  ],
  kpis:[
    ['Active Jobs',12],['Due This Week',5],['Overdue',2],['New Inquiries',4],['Unread Alerts',3],
    ['Revenue Ready', '$9,450'],['Billed (MTD)','$18,200'],['Overdue Invoices',3],['Jon Hours MTD',96],['Joy Hours MTD',74]
  ],
  revenue:{ready:'$9,450',billed:'$18,200',outstanding:'$6,780'},
  capacity:{jon:'82%',joy:'74%',turnaround:'4.2 days'}
};

let currentModel = structuredClone(fallback);

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

function render(model){
  const kpis=document.getElementById('kpis'); kpis.innerHTML='';
  model.kpis.forEach(([label,val])=>{const d=document.createElement('div');d.className='kpi';d.innerHTML=`<label>${label}</label><strong>${val}</strong>`;kpis.appendChild(d);});

  const alerts=document.getElementById('alerts'); alerts.innerHTML='';
  model.alerts.forEach((x,i)=>{const li=document.createElement('li');li.innerHTML=`${x} <span class="pill ${i===0?'danger':'warn'}">${i===0?'High':'Med'}</span>`;alerts.appendChild(li);});

  const bq=document.getElementById('billQueue'); bq.innerHTML='';
  model.billQueue.forEach(x=>{const li=document.createElement('li');li.innerHTML=`${x} <span class="pill ok">Bill It</span>`;bq.appendChild(li);});

  const tb=document.getElementById('jobs'); tb.innerHTML='';
  model.jobs.forEach(r=>{
    const tr=document.createElement('tr');
    const status = r[5]==='At Risk'?'danger':(r[5]==='Ready to Bill'?'ok':'warn');
    tr.innerHTML=`<td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td>${r[4]}</td><td><span class="pill ${status}">${r[5]}</span></td><td>${r[6]}</td>`;
    tb.appendChild(tr);
  });

  document.getElementById('revReady').textContent=model.revenue.ready;
  document.getElementById('revBilled').textContent=model.revenue.billed;
  document.getElementById('revOutstanding').textContent=model.revenue.outstanding;
  document.getElementById('capJon').textContent=model.capacity.jon;
  document.getElementById('capJoy').textContent=model.capacity.joy;
  document.getElementById('turnaround').textContent=model.capacity.turnaround;
}

function fromSheet(jobs, time, invoices){
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

  const jobsRows = jobs.slice(0,8).map(j=>[
    j['project']||j['job']||'—', j['client']||'—', j['owner']||'—', j['status']||'—', j['due date']||'—',
    (j['status']||'').toLowerCase().includes('risk') ? 'At Risk' : ((j['status']||'').toLowerCase().includes('bill') ? 'Ready to Bill' : 'On Track'),
    j['billable amount'] || '$—'
  ]);

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
function setQueue(q){ localStorage.setItem('gdpQueue', JSON.stringify(q)); }

function queueAction(type,payload){
  const q=getQueue();
  q.unshift({ id:`Q-${Date.now()}`, type, payload, createdAt:new Date().toISOString(), status:'pending' });
  setQueue(q);
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
    form.innerHTML=`
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
      currentModel.jobs.unshift([d.project,d.client,d.owner,'Lead',d.due||'—','On Track','$—']);
      currentModel.kpis[0][1]=Number(currentModel.kpis[0][1]||0)+1;
      render(currentModel);
      note.innerHTML=`Saved to local queue. Next: sync to sheet → <a href="${SHEET_URL}" target="_blank" rel="noopener">Open Sheet</a>`;
    };
  };

  document.getElementById('btnLogTime').onclick=()=>{
    modal.classList.remove('hidden');
    title.textContent='Log Time';
    form.innerHTML=`
      <label>Date<input name="date" type="date" required value="${new Date().toISOString().slice(0,10)}"></label>
      <label>Client<input name="client" required></label>
      <label>Project<input name="project" required></label>
      <label>Person<select name="person"><option>Jon</option><option>Joy</option></select></label>
      <label>Hours<input name="hours" type="number" step="0.25" min="0" required></label>
      <label>Billable<select name="billable"><option>Yes</option><option>No</option></select></label>
      <label class="full">Description<textarea name="description"></textarea></label>
      <button class="submit" type="submit">Log Time</button>
    `;
    form.onsubmit=(e)=>{
      e.preventDefault();
      const d=Object.fromEntries(new FormData(form).entries());
      queueAction('log_time',d);
      const h=Number(d.hours||0);
      currentModel.kpis[2][1]=(Number(currentModel.kpis[2][1]||0)+h).toFixed(1);
      if(d.person==='Jon') currentModel.kpis[8][1]=(Number(currentModel.kpis[8][1]||0)+h).toFixed(1);
      if(d.person==='Joy') currentModel.kpis[9][1]=(Number(currentModel.kpis[9][1]||0)+h).toFixed(1);
      render(currentModel);
      note.innerHTML=`Logged locally. Next: sync to sheet → <a href="${SHEET_URL}" target="_blank" rel="noopener">Open Sheet</a>`;
    };
  };

  document.getElementById('btnBillIt').onclick=()=>{
    modal.classList.remove('hidden');
    title.textContent='Bill It — Invoice Draft';
    form.innerHTML=`
      <label>Client<input name="client" required></label>
      <label>Project<input name="project" required></label>
      <label>Hours<input name="hours" type="number" step="0.25" min="0" required></label>
      <label>Rate<input name="rate" type="number" step="1" min="0" required></label>
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
      currentModel.billQueue.unshift(`${d.client} — ${d.project} (${fmtMoney(amount)})`);
      currentModel.revenue.ready=fmtMoney(money(currentModel.revenue.ready)+amount);
      render(currentModel);
      note.innerHTML=`Invoice draft queued (${fmtMoney(amount)}). Next: finalize in sheet/docs. <a href="${SHEET_URL}" target="_blank" rel="noopener">Open Sheet</a>`;
    };
  };
}

(async function init(){
  const ds = document.getElementById('dataSource');
  try{
    const [jobs,time,invoices] = await Promise.all([fetchTab(GIDS.jobs), fetchTab(GIDS.time), fetchTab(GIDS.invoices)]);
    currentModel = fromSheet(jobs,time,invoices);
    render(currentModel);
    ds.textContent='Live data connected'; ds.style.color='#246b45';
  }catch(e){
    currentModel = structuredClone(fallback);
    render(currentModel);
    ds.textContent='Using demo data (share sheet publicly to connect live)'; ds.style.color='#9a6a10';
  }
  wireUI();
})();
