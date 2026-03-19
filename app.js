const data={
  kpis:[
    ['Active Jobs',12],['Due This Week',5],['Overdue',2],['New Inquiries',4],['Unread Alerts',3],
    ['Revenue Ready', '$9,450'],['Billed (MTD)','$18,200'],['Overdue Invoices',3],['Jon Hours MTD',96],['Joy Hours MTD',74]
  ],
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
  revenue:{ready:'$9,450',billed:'$18,200',outstanding:'$6,780'},
  capacity:{jon:'82%',joy:'74%',turnaround:'4.2 days'}
};

const kpis=document.getElementById('kpis');
data.kpis.forEach(([label,val])=>{const d=document.createElement('div');d.className='kpi';d.innerHTML=`<label>${label}</label><strong>${val}</strong>`;kpis.appendChild(d);});

const alerts=document.getElementById('alerts');
data.alerts.forEach((x,i)=>{const li=document.createElement('li');li.innerHTML=`${x} <span class="pill ${i===0?'danger':'warn'}">${i===0?'High':'Med'}</span>`;alerts.appendChild(li);});

const bq=document.getElementById('billQueue');
data.billQueue.forEach(x=>{const li=document.createElement('li');li.innerHTML=`${x} <span class="pill ok">Bill It</span>`;bq.appendChild(li);});

const tb=document.getElementById('jobs');
data.jobs.forEach(r=>{const tr=document.createElement('tr');const status = r[5]==='At Risk'?'danger':(r[5]==='Ready to Bill'?'ok':'warn');tr.innerHTML=`<td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td>${r[4]}</td><td><span class="pill ${status}">${r[5]}</span></td><td>${r[6]}</td>`;tb.appendChild(tr);});

document.getElementById('revReady').textContent=data.revenue.ready;
document.getElementById('revBilled').textContent=data.revenue.billed;
document.getElementById('revOutstanding').textContent=data.revenue.outstanding;
document.getElementById('capJon').textContent=data.capacity.jon;
document.getElementById('capJoy').textContent=data.capacity.joy;
document.getElementById('turnaround').textContent=data.capacity.turnaround;
