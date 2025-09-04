(function(){
  const CSV_URL = './data/schedule.csv';
  const canonicalStages = [
    'Eden Field Main Stage','Eden Hall','Mike Compton Dance Hall','Big Barn','Sunshine Stage',
    'Ship Deck','Out & About','Lounging','Brookside','U-LEAF'
  ];
  const dayOrder = ['Thursday','Friday','Saturday','Sunday'];

  let rows = [];
  let state = { day:'', stage:'', q:'' };

  function $(sel, ctx=document){ return ctx.querySelector(sel); }
  function $all(sel, ctx=document){ return Array.from(ctx.querySelectorAll(sel)); }

  function parseTimeToMinutes(str){
    if(!str) return 0;
    const m = String(str).trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if(!m) return 0;
    let h = parseInt(m[1],10), min = parseInt(m[2],10);
    const mer = m[3].toUpperCase();
    if(mer==='PM' && h!==12) h+=12;
    if(mer==='AM' && h===12) h=0;
    return h*60+min;
  }

  function getURLState(){
    const p = new URLSearchParams(location.search);
    return { day: p.get('day')||'', stage: p.get('stage')||'', q: p.get('q')||'' };
  }
  function setURL(){
    const p = new URLSearchParams();
    if(state.day) p.set('day', state.day);
    if(state.stage) p.set('stage', state.stage);
    if(state.q) p.set('q', state.q);
    history.replaceState(null, '', location.pathname + (p.toString()?`?${p.toString()}`:''));
  }

  function uniqueOrdered(values, refOrder){
    const seen=new Set(), out=[];
    const idx = new Map(refOrder.map((v,i)=>[v,i]));
    values.slice().sort((a,b)=>{
      const ia = idx.has(a)?idx.get(a):1e9;
      const ib = idx.has(b)?idx.get(b):1e9;
      return ia!==ib? ia-ib : a.localeCompare(b);
    }).forEach(v=>{ if(!seen.has(v)){seen.add(v); out.push(v);} });
    return out;
  }

  function buildControls(){
    const days = uniqueOrdered(rows.map(r=>r.day), dayOrder);
    const tabs = $all('.tab');
    tabs.forEach(btn=>{
      const d = btn.getAttribute('data-day');
      btn.classList.toggle('is-active', state.day? state.day===d : d===days[0]);
      btn.addEventListener('click', ()=>{
        state.day = d;
        setURL(); render();
        tabs.forEach(el=>el.classList.toggle('is-active', el===btn));
      });
    });
    if(!state.day) state.day = days[0] || '';

    const stageSel = $('#stageSelect');
    const stages = uniqueOrdered(rows.map(r=>r.stage).filter(Boolean), canonicalStages);
    stageSel.innerHTML = `<option value="">All Stages</option>` + stages.map(s=>`<option value="${s}">${s}</option>`).join('');
    stageSel.value = state.stage || '';
    stageSel.addEventListener('change', ()=>{ state.stage = stageSel.value; setURL(); render(); });

    const search = $('#searchInput');
    search.value = state.q || '';
    search.addEventListener('input', ()=>{ state.q = search.value.trim(); setURL(); render(); });
  }

  function applyFilters(all){
    return all.filter(r=>{
      if(state.day && r.day!==state.day) return false;
      if(state.stage && r.stage!==state.stage) return false;
      if(state.q){
        const q = state.q.toLowerCase();
        const hay = `${r.title||''} ${r.stage||''}`.toLowerCase();
        if(!hay.includes(q)) return false;
      }
      return true;
    });
  }

  function render(){
    const mount = $('#schedule'); mount.innerHTML='';
    const filtered = applyFilters(rows);
    const byDay = new Map();
    filtered.forEach(r=>{
      if(!byDay.has(r.day)) byDay.set(r.day, []);
      byDay.get(r.day).push(r);
    });
    const orderedDays = uniqueOrdered(Array.from(byDay.keys()), dayOrder);
    if(!orderedDays.length){ mount.innerHTML = `<p>No events match your filters.</p>`; return; }

    orderedDays.forEach(day=>{
      const events = byDay.get(day).slice().sort((a,b)=>parseTimeToMinutes(a.start_time)-parseTimeToMinutes(b.start_time));
      const wrap = document.createElement('div'); wrap.className='day-block';
      const title = document.createElement('h2'); title.className='day-title';
      const sample = events.find(e=>e.date); const pill = sample? `<span class="pill">${sample.date}</span>`:``;
      title.innerHTML = `${day} ${pill}`;
      const grid = document.createElement('div'); grid.className='grid';
      events.forEach(ev=>{
        const card = document.createElement('article'); card.className='card';
        card.innerHTML = `
          <div class="meta">
            <span class="time">${ev.start_time}–${ev.end_time}</span>
            <span class="stage">• ${ev.stage}</span>
          </div>
          <div class="title">${escapeHtml(ev.title||'')}</div>
          <div class="badges">
            <span class="badge ${ev.category==='Activity'?'badge--activity':'badge--performance'}">${ev.category}</span>
          </div>`;
        grid.appendChild(card);
      });
      wrap.appendChild(title); wrap.appendChild(grid); mount.appendChild(wrap);
    });
  }

  function escapeHtml(str){
    return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[s]));
  }

  async function loadCSV(){
    return new Promise((resolve,reject)=>{
      Papa.parse(CSV_URL,{download:true,header:true,skipEmptyLines:true,
        complete:res=>resolve(res.data), error:err=>reject(err)});
    });
  }
  function coerceRow(r){
    return {
      id:r.id||'', day:r.day||'', date:r.date||'',
      start_time:r.start_time||'', end_time:r.end_time||'',
      stage:r.stage||'', title:r.title||'', category:r.category||'Performance'
    };
  }
  async function init(){
    state = Object.assign(state, getURLState());
    try{
      const data = await loadCSV();
      rows = data.map(coerceRow).filter(r=>r.day && r.start_time && r.end_time && r.title);
      buildControls(); render();
    }catch(e){
      console.error(e); $('#schedule').innerHTML = `<p>Failed to load schedule.csv</p>`;
    }
  }
  window.init = init;
})();