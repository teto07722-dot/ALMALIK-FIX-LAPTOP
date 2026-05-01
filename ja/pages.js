/* ═══════════════════════════════════
   ALMALIK — pages.js
   Page renderers for each section
   ═══════════════════════════════════ */

// ═══════════════════════════════════
// DEVICES PAGE
// ═══════════════════════════════════
function rDevPage() {
  return `
    <div class="tbar">
      <div class="sw">
        <span class="si-ico">🔍</span>
        <input class="si-inp" type="search" id="searchField" placeholder="بحث بالموديل أو القطعة..." value="${esc(SQ)}" oninput="handleSearch(this.value)" autocomplete="off">
      </div>
      <div class="fbs">
        <button class="fb ${devFlt==='all'?'active':''}"   onclick="devFlt='all';rPage()">الكل</button>
        <button class="fb ${devFlt==='near'?'active':''}"  onclick="devFlt='near';rPage()" style="color:var(--cy)">🟢 قريب</button>
        <button class="fb ${devFlt==='pending'?'active':''}" onclick="devFlt='pending';rPage()">معلق</button>
        <button class="fb ${devFlt==='done'?'active':''}"  onclick="devFlt='done';rPage()">✅</button>
        <button class="fb ${devFlt==='crit'?'active':''}"  onclick="devFlt='crit';rPage()" style="color:var(--rd)">🚨</button>
      </div>
      ${can('add') ? `<button class="abtn" onclick="openAddDev()">+ جهاز</button>` : ''}
    </div>
    <div id="pageResults">${rDevResults()}</div>`;
}
function rDevResults() {
  let devs = Object.values(DB.devices||{});
  if (amod !== 'all')         devs = devs.filter(d => d.modelId === amod);
  if (devFlt === 'done')      devs = devs.filter(d => d.done || devSt(d) === 'done');
  else if (devFlt === 'pending') devs = devs.filter(d => !d.done && devSt(d) !== 'done');
  else if (devFlt === 'crit') devs = devs.filter(d => { const g=(d.parts||[]).filter(p=>p.status==='good').length; return g<=1&&!d.done&&(d.parts||[]).length>0; });
  else if (devFlt === 'near') devs = devs.filter(d => { const p=d.parts||[],g=p.filter(x=>x.status==='good').length; return p.length>1&&g/p.length>=0.7&&!d.done; });
  if (SQ) devs = devs.filter(d => { const m=DB.models[d.modelId]||{brand:'',name:''}; return [m.brand+' '+m.name, d.name, d.notes, ...(d.parts||[]).map(p=>p.name)].join(' ').toLowerCase().includes(SQ); });
  devs.sort((a,b) => { const o={broken:0,partial:1,done:2}; return (o[devSt(a)]??1)-(o[devSt(b)]??1); });
  const byM = {}; devs.forEach(d => (byM[d.modelId]=byM[d.modelId]||[]).push(d));
  const modelParts = {}; Object.values(DB.parts||{}).filter(p=>p.modelId).forEach(p=>(modelParts[p.modelId]=modelParts[p.modelId]||[]).push(p));
  if (!Object.keys(byM).length) return `<div class="empty"><div class="ei">💻</div><h3>لا توجد أجهزة</h3><p>أضف موديلاً ثم أضف جهازاً</p></div>`;
  return Object.entries(byM).map(([mid, mdevs]) => {
    const m = DB.models[mid]||{brand:'?',name:'?',size:'',ver:''};
    const dc = mdevs.filter(d=>d.done||devSt(d)==='done').length;
    const pct = mdevs.length ? Math.round(dc/mdevs.length*100) : 0;
    const col = pct===100?'var(--gn)':pct>50?'var(--cy)':'var(--yw)';
    const mps = modelParts[mid]||[];
    return `
      <div class="sh">
        <span class="st">💻 ${m.brand} ${m.name}${m.size?' ('+m.size+'")':''}</span>
        ${m.ver?`<span class="bdg">${m.ver}</span>`:''}
        <span class="bdg">${mdevs.length}</span>
        <span class="bdg g">${dc} منجز</span>
        <span class="pct-l">${pct}%</span>
        ${can('add')?`<button class="btn bg" style="font-size:10px;padding:4px 8px" onclick="openAddDev('${mid}')">+ جهاز</button>`:''}
        ${can('parts')?`<button class="btn bpu" style="font-size:10px;padding:4px 8px" onclick="openAddModelPart('${mid}')">+ قطعة</button>`:''}
      </div>
      <div class="sp"><div class="spf" style="width:${pct}%;background:${col}"></div></div>
      ${mps.length ? `<div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:10px">
        ${mps.map(p=>`<div style="background:var(--b2);border:1px solid ${p.qty===0?'rgba(255,68,102,.4)':p.qty<=1?'rgba(255,68,102,.3)':p.qty<=(p.minQty||2)?'rgba(255,187,0,.3)':'var(--br2)'};border-radius:7px;padding:5px 9px;font-size:11px;display:flex;align-items:center;gap:6px">
          <span>${CI[p.category]||'📦'}</span><span style="font-weight:600">${hl(p.name)}</span>
          <span class="bdg ${p.qty===0?'r':p.qty<=1?'r':p.qty<=(p.minQty||2)?'y':'g'}">${p.qty}</span>
          ${p.sellPrice?`<span style="color:var(--gn);font-size:10px;font-family:var(--mo)">${IQD(p.sellPrice)}</span>`:''}
          ${can('parts')?`<button class="btn bpk" style="padding:2px 6px;font-size:9px" onclick="openWD('${p.id}')">سحب</button>`:''}
        </div>`).join('')}
      </div>` : ''}
      <div class="grid">${mdevs.map(d=>rDCard(d)).join('')}</div>`;
  }).join('');
}
function rDCard(d) {
  const m = DB.models[d.modelId]||{brand:'',name:''};
  const st = d.done ? 'done' : devSt(d);
  const sL = {done:'✅ منجز', partial:'⚠️ جزئي', broken:'❌ تالف'}[st]||st;
  const parts = d.parts||[];
  const good = parts.filter(p=>p.status==='good'), bad = parts.filter(p=>p.status==='bad'), used = parts.filter(p=>p.status==='used');
  const tot = parts.length, pct = tot ? Math.round(good.length/tot*100) : 0;
  const col = pct===100?'var(--gn)':pct>50?'var(--cy)':'var(--yw)';
  const isCrit = good.length===1&&!d.done&&tot>0;
  const isNear = !d.done&&tot>1&&good.length/tot>=0.7&&!isCrit;
  const tech   = d.techId ? Object.values(DB.users||{}).find(u=>u.username===d.techId) : null;
  const pt = (p,cl) => `<span class="pt ${cl}" onclick="${can('edit')?`cyclePart('${d.id}','${esc(p.name)}')`:''}" title="${p.name}"><span class="pd"></span>${hl(p.name)}</span>`;
  return `<div class="dc ${d.done?'done':isCrit?'crit':isNear?'near':pct<30&&tot>2&&!d.done?'warn':''}">
    <div class="dct">
      <div class="dcid">#${d.id.slice(-4)}</div>
      <div class="dcn">${hl(d.name||m.brand+' '+m.name)}</div>
      <span class="stb ${isCrit?'crit':isNear?'near':st}">${isCrit?'🚨 حرج':isNear?'🟢 قريب':sL}</span>
    </div>
    <div class="dcb">
      ${tech?`<div class="tr"><span class="tdot"></span>فني: ${tech.fullname}</div>`:''}
      ${d.notes?`<div class="nr">📝 ${hl(d.notes.split('\n')[0])}</div>`:''}
      <div class="pb-wrap">
        <div class="pb"><div class="pbf" style="width:${pct}%;background:${col}"></div></div>
        <div class="pbl"><span>${good.length}/${tot} سليمة</span><span>${pct}%</span></div>
      </div>
      ${good.length?`<div class="psec"><div class="plbl">✅ سليمة (${good.length})</div><div class="pgrid">${good.map(p=>pt(p,'good')).join('')}</div></div>`:''}
      ${bad.length ?`<div class="psec"><div class="plbl">❌ تالفة (${bad.length})</div><div class="pgrid">${bad.map(p=>pt(p,'bad')).join('')}</div></div>`:''}
      ${used.length?`<div class="psec"><div class="plbl">🔧 مستخدمة (${used.length})</div><div class="pgrid">${used.map(p=>pt(p,'used')).join('')}</div></div>`:''}
    </div>
    <div class="dca">
      ${can('edit')?`<button class="btn bw" onclick="openTrans('${d.id}')">🔧 استخدم</button>`:''}
      ${can('acc') ?`<button class="btn bpk" onclick="openSellFromDev('${d.id}')">💰 بيع</button>`:''}
      ${can('edit')?`<button class="btn ${d.done?'bg':'bs'}" onclick="toggleDone('${d.id}')">${d.done?'↩':'✅'}</button>`:''}
      ${can('edit')?`<button class="btn bg" onclick="openEditDev('${d.id}')">✏️</button>`:''}
      ${can('delete')?`<button class="btn bd" onclick="delDev('${d.id}')">🗑</button>`:''}
    </div>
  </div>`;
}

// ═══════════════════════════════════
// REPAIRS PAGE
// ═══════════════════════════════════
function rRepPage() {
  const cnt = s => Object.values(DB.repairs||{}).filter(r=>r.status===s).length;
  return `
    <div class="tbar">
      <div class="sw">
        <span class="si-ico">🔍</span>
        <input class="si-inp" type="search" id="searchField" placeholder="بحث بالاسم أو الجهاز..." value="${esc(SQ)}" oninput="handleSearch(this.value)" autocomplete="off">
      </div>
      <div class="fbs">
        <button class="fb ${repFlt==='all'?'active':''}"       onclick="repFlt='all';rPage()">الكل</button>
        <button class="fb ${repFlt==='new'?'active':''}"       onclick="repFlt='new';rPage()">🆕 (${cnt('new')})</button>
        <button class="fb ${repFlt==='inprog'?'active':''}"    onclick="repFlt='inprog';rPage()">🔧 (${cnt('inprog')})</button>
        <button class="fb ${repFlt==='waiting'?'active':''}"   onclick="repFlt='waiting';rPage()">⏳ (${cnt('waiting')})</button>
        <button class="fb ${repFlt==='done'?'active':''}"      onclick="repFlt='done';rPage()">✅ (${cnt('done')})</button>
        <button class="fb ${repFlt==='cancelled'?'active':''}" onclick="repFlt='cancelled';rPage()">❌</button>
      </div>
      ${can('repairs') ? `<button class="abtn gn" onclick="openNewRepair()">+ صيانة</button>` : ''}
    </div>
    <div id="pageResults">${rRepResults()}</div>`;
}
function rRepResults() {
  let reps = Object.values(DB.repairs||{});
  if (repFlt !== 'all') reps = reps.filter(r=>r.status===repFlt);
  if (SQ) reps = reps.filter(r => [r.customerName,r.customerPhone,r.deviceBrand,r.deviceModel,...(r.symptoms||[])].join(' ').toLowerCase().includes(SQ));
  reps.sort((a,b) => { const o={new:0,inprog:1,waiting:2,done:3,cancelled:4}; return (o[a.status]??5)-(o[b.status]??5)||(b.createdAt-a.createdAt); });
  if (!reps.length) return `<div class="empty"><div class="ei">🔧</div><h3>لا توجد صيانات</h3></div>`;
  return reps.map(r => rRepCard(r)).join('');
}
function rRepCard(r) {
  const stL={new:'🆕 جديدة',inprog:'🔧 نشطة',waiting:'⏳ انتظار',done:'✅ مكتملة',cancelled:'❌ ملغاة'};
  const stC={new:'rss-new',inprog:'rss-inprog',waiting:'rss-waiting',done:'rss-done',cancelled:'rss-cancelled'};
  const tech = r.techId ? Object.values(DB.users||{}).find(u=>u.username===r.techId) : null;
  const prog = r.progress||0;
  const isLate = r.eta && Date.now() > new Date(r.eta).getTime() && r.status!=='done' && r.status!=='cancelled';
  return `<div class="rc ${r.status||'new'}">
    <div class="rct">
      <span class="rcnum">#${r.id.slice(-5).toUpperCase()}</span>
      <span class="rcn">${hl(r.customerName||'')}</span>
      <span class="rcph">${r.customerPhone||''}</span>
      ${r.priority&&r.priority!=='normal'?`<span style="font-size:11px">${r.priority==='urgent'?'🔴 عاجل':'⭐ VIP'}</span>`:''}
      <span class="rsstb ${stC[r.status]||'rss-new'}">${stL[r.status]||r.status}</span>
    </div>
    <div class="rcb">
      <div class="rci">
        <div class="rcf"><div class="lbl">الجهاز</div><div class="val">${(r.deviceBrand||'')+' '+(r.deviceModel||'')}</div></div>
        <div class="rcf"><div class="lbl">الفني</div><div class="val">${tech?tech.fullname:'غير محدد'}</div></div>
        <div class="rcf"><div class="lbl">الأعراض</div><div class="val" style="font-size:11px;color:var(--tx2)">${(r.symptoms||[]).slice(0,2).join('، ')}</div></div>
        <div class="rcf"><div class="lbl">السعر</div><div class="val" style="color:var(--gn)">${r.agreedPrice?IQD(r.agreedPrice):'لم يُحدد'}</div></div>
        ${r.eta?`<div class="rcf"><div class="lbl">الموعد</div><div class="val" style="color:${isLate?'var(--rd)':'var(--tx)'}">${r.eta}${isLate?' ⚠️':''}</div></div>`:''}
        ${r.faultConfirmed?`<div class="rcf"><div class="lbl">العطل</div><div class="val">${r.faultConfirmed}</div></div>`:''}
      </div>
      ${prog>0||r.status==='inprog'?`<div>
        <div class="rprog"><div class="rprogf" style="width:${prog}%;background:${prog===100?'var(--gn)':prog>60?'var(--cy)':'var(--yw)'}"></div></div>
        <div class="rprog-lbl"><span>${r.progressNotes||'جاري العمل...'}</span><span>${prog}%</span></div>
      </div>`:''}
    </div>
    <div class="rca">
      ${r.status==='new'&&can('repairs') ?`<button class="btn bp" onclick="startRepair('${r.id}')">▶️ بدء</button>`:''}
      ${r.status!=='new'&&can('repairs') ?`<button class="btn bw" onclick="openRepProg('${r.id}')">📝 تحديث</button>`:''}
      ${r.status==='done'&&!r.paid&&can('acc')?`<button class="btn bs" onclick="markPaid('${r.id}')">💰 قبض</button>`:''}
      ${r.paid?`<span style="font-size:11px;color:var(--gn)">✅ مقبوض</span>`:''}
      <button class="btn bpu" onclick="showQR('${r.id}')">📲 QR</button>
      <button class="btn bg" onclick="openEditRepair('${r.id}')">✏️</button>
      ${can('delete')?`<button class="btn bd" onclick="delRepair('${r.id}')">🗑</button>`:''}
    </div>
  </div>`;
}

// ═══════════════════════════════════
// PARTS PAGE
// ═══════════════════════════════════
function rPartsPage() {
  return `
    <div class="tbar">
      <div class="sw">
        <span class="si-ico">🔍</span>
        <input class="si-inp" type="search" id="searchField" placeholder="بحث في القطع..." value="${esc(SQ)}" oninput="handleSearch(this.value)" autocomplete="off">
      </div>
      ${can('parts') ? `<button class="abtn" onclick="openAddPart()">+ قطعة</button>` : ''}
    </div>
    <div id="pageResults">${rPartsResults()}</div>`;
}
function rPartsResults() {
  let parts = Object.values(DB.parts||{}).filter(p=>!p.modelId);
  if (SQ) parts = parts.filter(p => [p.name,p.category,p.compat].join(' ').toLowerCase().includes(SQ));
  const byC = {}; parts.forEach(p => (byC[p.category]=byC[p.category]||[]).push(p));
  if (!parts.length) return `<div class="empty"><div class="ei">🔩</div><h3>لا توجد قطع غيار مستقلة</h3><p>اضغط + قطعة للإضافة</p></div>`;
  return Object.entries(byC).map(([cat,cps]) => `
    <div class="sh"><span class="st">${CI[cat]||'📦'} ${cat}</span><span class="bdg c">${cps.length}</span></div>
    <div class="grid2">${cps.map(p => rPCard(p)).join('')}</div>`).join('');
}
function rPCard(p) {
  const pct = p.qty>0&&p.minQty ? Math.min(100,Math.round(p.qty/(p.minQty*4)*100)) : p.qty>0 ? 80 : 0;
  const col = p.qty===0?'var(--rd)':p.qty<=1?'var(--rd)':p.qty<=(p.minQty||2)?'var(--yw)':'var(--gn)';
  return `<div class="pc ${p.qty===0?'empty':p.qty<=(p.minQty||2)?'low':''}">
    <div class="pct2">
      <div class="pico">${CI[p.category]||'📦'}</div>
      <div class="pinfo">
        <div class="pname">${hl(p.name)}</div>
        <div class="pcat">${p.category}${p.compat?' • '+p.compat:''}</div>
        ${p.sellPrice?`<div style="font-size:10px;color:var(--gn)">بيع: ${IQD(p.sellPrice)}</div>`:''}
      </div>
      <div class="pqty"><div class="pqnum" style="color:${col}">${p.qty}</div><div class="pqunit">قطعة</div></div>
    </div>
    <div class="pcb">
      <div class="psbar"><div class="psbf" style="width:${pct}%;background:${col}"></div></div>
      <div class="pcmeta"><span>حد: ${p.minQty||2}</span><span>${p.qty===0?'⛔ نفدت':p.qty<=1?'⚠️ آخر قطعة':p.qty<=(p.minQty||2)?'⚠️ منخفض':'✅ متوفر'}</span></div>
    </div>
    <div class="pca">
      ${can('parts')?`<button class="btn bw" onclick="openWD('${p.id}')">📤 سحب/بيع</button>`:''}
      ${can('parts')?`<button class="btn bs" onclick="addStock('${p.id}')">➕</button>`:''}
      ${can('parts')?`<button class="btn bg" onclick="openEditPart('${p.id}')">✏️</button>`:''}
      ${can('delete')?`<button class="btn bd" onclick="delPart('${p.id}')">🗑</button>`:''}
    </div>
  </div>`;
}

// ═══════════════════════════════════
// SALES PAGE
// ═══════════════════════════════════
function rSalesPage() {
  return `
    <div class="tbar">
      <div class="sw">
        <span class="si-ico">🔍</span>
        <input class="si-inp" type="search" id="searchField" placeholder="بحث في المبيعات..." value="${esc(SQ)}" oninput="handleSearch(this.value)" autocomplete="off">
      </div>
      <span class="bdg p" style="padding:7px 11px;align-self:center">إجمالي: ${IQD(Object.values(DB.sales||{}).reduce((a,s)=>a+s.price,0))}</span>
    </div>
    <div id="pageResults">${rSalesResults()}</div>`;
}
function rSalesResults() {
  let sales = Object.values(DB.sales||{}).sort((a,b)=>b.date-a.date);
  if (SQ) sales = sales.filter(s => [s.itemName,s.note,s.by].join(' ').toLowerCase().includes(SQ));
  if (!sales.length) return `<div class="empty"><div class="ei">💰</div><h3>لا توجد مبيعات بعد</h3></div>`;
  return sales.map(s=>`<div class="log-item">
    <div class="log-dt">${fmtD(s.date)}</div>
    <div class="log-ico">${s.type==='repair'?'🔧':CI[s.partCat]||'📦'}</div>
    <div class="log-body"><div class="log-title">${hl(s.itemName||'')}</div><div class="log-sub">${s.note||''} • ${s.by||''}</div></div>
    <div class="log-amt" style="color:var(--gn)">${IQD(s.price)}</div>
  </div>`).join('');
}

// ═══════════════════════════════════
// ACCOUNTING PAGE
// ═══════════════════════════════════
function rAccPage() {
  const sales = Object.values(DB.sales||{});
  const sum = arr => arr.reduce((a,s) => a+(s.price||0), 0);
  return `<div class="sh"><span class="st">📊 الحسابات</span></div>
    <div class="acc-sum">
      <div class="acc-card"><div class="av" style="color:var(--gn)">${IQD(sum(sales.filter(s=>isToday(s.date))))}</div><div class="al">مبيعات اليوم</div></div>
      <div class="acc-card"><div class="av" style="color:var(--cy)">${IQD(sum(sales.filter(s=>isThisWeek(s.date))))}</div><div class="al">هذا الأسبوع</div></div>
      <div class="acc-card"><div class="av" style="color:var(--yw)">${IQD(sum(sales.filter(s=>isThisMonth(s.date))))}</div><div class="al">هذا الشهر</div></div>
      <div class="acc-card"><div class="av" style="color:var(--pu)">${IQD(sum(sales))}</div><div class="al">الإجمالي الكلي</div></div>
      <div class="acc-card"><div class="av" style="color:var(--gn)">${IQD(sum(sales.filter(s=>s.type==='repair')))}</div><div class="al">إيراد صيانات</div></div>
      <div class="acc-card"><div class="av" style="color:var(--cy)">${IQD(sum(sales.filter(s=>s.type!=='repair')))}</div><div class="al">إيراد قطع</div></div>
    </div>
    <div class="sh"><span class="st">سجل المبيعات</span><span class="bdg">${sales.length}</span></div>
    ${sales.sort((a,b)=>b.date-a.date).map(s=>`<div class="log-item">
      <div class="log-dt">${fmtD(s.date)}</div>
      <div class="log-ico">${s.type==='repair'?'🔧':CI[s.partCat]||'📦'}</div>
      <div class="log-body"><div class="log-title">${s.itemName||''}</div><div class="log-sub">${s.note||''} • ${s.by||'—'}</div></div>
      <div class="log-amt" style="color:var(--gn)">${IQD(s.price||0)}</div>
    </div>`).join('') || `<div class="empty"><h3>لا توجد مبيعات</h3></div>`}`;
}

// ═══════════════════════════════════
// ALERTS PAGE
// ═══════════════════════════════════
function rAlertsPage() {
  const A = getAlerts();
  return `<div class="sh"><span class="st">🔔 التنبيهات</span><span class="bdg r">${A.length}</span></div>
    ${A.length===0 ? `<div class="empty"><div class="ei">✅</div><h3>كل شيء على ما يرام</h3></div>` :
      A.map(a=>`<div class="ai ${a.type==='crit'?'crit':a.type==='near'?'near':a.type==='info'?'info':''}">
        <div class="ai-ico">${a.ico}</div>
        <div class="ai-body"><div class="ai-title">${a.title}</div><div class="ai-sub">${a.sub}</div></div>
        ${a.devId?`<button class="btn bg" style="font-size:10px" onclick="amod='all';devFlt='all';showTab('devices')">عرض</button>`:''}
        ${a.repId?`<button class="btn bg" style="font-size:10px" onclick="showTab('repairs')">عرض</button>`:''}
      </div>`).join('')}`;
}

// ═══════════════════════════════════
// USERS PAGE
// ═══════════════════════════════════
function rUsersPage() {
  if (CU.role !== 'admin') return `<div class="empty"><h3>غير مصرح</h3></div>`;
  return `<div class="sh"><span class="st">👥 إدارة المستخدمين</span><span class="bdg">${Object.values(DB.users||{}).length}</span>
    <button class="abtn" style="margin-right:auto" onclick="openAddUser()">+ مستخدم</button></div>
    ${Object.values(DB.users||{}).map(u => {
      const isA = u.role==='admin', p = u.perms||{};
      return `<div class="uc">
        <div class="uav2" style="background:${isA?'rgba(0,212,255,.12)':'rgba(0,255,136,.1)'};color:${isA?'var(--cy)':'var(--gn)'}">${(u.fullname||'?')[0]}</div>
        <div class="ui">
          <div class="un">${u.fullname} <span class="chip ${isA?'adm':'tch'}">${isA?'أدمن':'فني'}</span></div>
          <div class="ur">@${u.username}</div>
          ${!isA?`<div class="uperm">
            <span class="ptg ${p.add?'pton':'ptoff'}">إضافة</span>
            <span class="ptg ${p.edit?'pton':'ptoff'}">تعديل</span>
            <span class="ptg ${p.delete?'pton':'ptoff'}">حذف</span>
            <span class="ptg ${p.parts?'pton':'ptoff'}">قطع</span>
            <span class="ptg ${p.repairs?'pton':'ptoff'}">صيانة</span>
            <span class="ptg ${p.acc?'pton':'ptoff'}">حسابات</span>
          </div>`:''}
        </div>
        <div style="display:flex;gap:4px">
          ${u.username!=='admin'?`<button class="btn bg" onclick="openEditUser('${u.username}')">✏️</button>`:''}
          ${u.username!=='admin'?`<button class="btn bd" onclick="delUser('${u.username}')">🗑</button>`:''}
        </div>
      </div>`;
    }).join('')}`;
}
