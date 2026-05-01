/* ═══════════════════════════════════
   ALMALIK — auth.js
   Login, logout, permissions
   ═══════════════════════════════════ */

function can(p) {
  if (!CU) return false;
  if (CU.role === 'admin') return true;
  return !!(CU.perms && CU.perms[p]);
}

function doLogin() {
  const un = document.getElementById('lu').value.trim();
  const pw = document.getElementById('lp').value;
  const u  = Object.values(DB.users || {}).find(x => x.username === un && x.password === pw);
  if (!u) { document.getElementById('lerr').style.display = 'block'; return; }
  document.getElementById('lerr').style.display = 'none';
  CU = u; lsSaveCU(u); showApp();
}

function doLogout() {
  CU = null; localStorage.removeItem('am4cu');
  document.getElementById('lu').value = '';
  document.getElementById('lp').value = '';
  document.getElementById('LS').style.display = 'flex';
  document.getElementById('MH').style.display = 'none';
  document.getElementById('AW').style.display = 'none';
  document.getElementById('MN').style.display = 'none';
  closeSB();
}

function showApp() {
  document.getElementById('LS').style.display = 'none';
  document.getElementById('MH').style.display = 'flex';
  document.getElementById('AW').style.display = 'flex';
  document.getElementById('MN').style.display = 'flex';
  const isA = CU.role === 'admin';
  document.getElementById('upill').innerHTML =
    `<div class="uav" style="background:${isA?'rgba(0,212,255,.15)':'rgba(0,255,136,.1)'};color:${isA?'var(--cy)':'var(--gn)'}">${(CU.fullname||'?')[0]}</div>
     <span style="font-size:11px">${CU.fullname}</span>`;
  document.getElementById('ni-users').style.display = isA ? 'flex' : 'none';
  document.getElementById('sbam').style.display = can('add') ? 'block' : 'none';
  checkMob();
  showTab('devices');
  render();
}

// ── USERS CRUD ──────────────────────────────────────
function openAddUser() {
  editUserId = null;
  document.getElementById('userMT').textContent = 'مستخدم جديد';
  ['fUN','fUP','fUF'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('fUR').value = 'tech';
  ['pAdd','pEdit','pParts','pRepairs'].forEach(id => document.getElementById(id).checked = true);
  ['pDel','pAcc','pExp'].forEach(id => document.getElementById(id).checked = false);
  document.getElementById('pUI').style.display = 'block';
  document.getElementById('userModal').style.display = 'flex';
  setTimeout(() => document.getElementById('fUN').focus(), 200);
}
function openEditUser(un) {
  const u = (DB.users||{})[un]; if (!u) return;
  editUserId = un;
  document.getElementById('userMT').textContent = 'تعديل المستخدم';
  document.getElementById('fUN').value = u.username;
  document.getElementById('fUP').value = u.password;
  document.getElementById('fUF').value = u.fullname;
  document.getElementById('fUR').value = u.role;
  const p = u.perms || {};
  document.getElementById('pAdd').checked     = !!p.add;
  document.getElementById('pEdit').checked    = !!p.edit;
  document.getElementById('pDel').checked     = !!p.delete;
  document.getElementById('pParts').checked   = !!p.parts;
  document.getElementById('pRepairs').checked = !!p.repairs;
  document.getElementById('pAcc').checked     = !!p.acc;
  document.getElementById('pExp').checked     = !!p.export;
  togglePUI();
  document.getElementById('userModal').style.display = 'flex';
}
function togglePUI() { document.getElementById('pUI').style.display = document.getElementById('fUR').value === 'tech' ? 'block' : 'none'; }

async function saveUser() {
  const un   = document.getElementById('fUN').value.trim();
  const pw   = document.getElementById('fUP').value;
  const full = document.getElementById('fUF').value.trim();
  const role = document.getElementById('fUR').value;
  if (!un || !pw || !full) return toast('أكمل جميع الحقول', 'e');
  if (!editUserId && (DB.users||{})[un]) return toast('اسم المستخدم موجود مسبقاً', 'e');
  const perms = {
    add: document.getElementById('pAdd').checked,
    edit: document.getElementById('pEdit').checked,
    delete: document.getElementById('pDel').checked,
    parts: document.getElementById('pParts').checked,
    repairs: document.getElementById('pRepairs').checked,
    acc: document.getElementById('pAcc').checked,
    export: document.getElementById('pExp').checked
  };
  const key = editUserId || un;
  DB.users[key] = { username:un, password:pw, fullname:full, role, perms };
  lsSave(); cm('userModal'); render(); await p2FB();
  toast(editUserId ? 'تم التحديث' : 'تم إضافة المستخدم', 's');
}
async function delUser(un) {
  if (un === 'admin') return toast('لا يمكن حذف الأدمن', 'e');
  if (!confirm(`حذف المستخدم ${un}؟`)) return;
  delete DB.users[un]; lsSave(); render(); await p2FB(); toast('تم الحذف', 'i');
}

/* ═══════════════════════════════════
   ALMALIK — app.js
   Tabs, render master, layout helpers
   ═══════════════════════════════════ */

// ── STATE ──────────────────────────
let tab = 'devices', amod = 'all', devFlt = 'all', repFlt = 'all';
let editDevId = null, transDevId = null, editPartId = null;
let editUserId = null, editRepairId = null, progRepairId = null;
let sellDevId = null, wdPartId = null;
let searchTimer = null;

// ── TABS ──────────────────────────
function showTab(t) {
  tab = t; SQ = ''; devFlt = 'all'; repFlt = 'all';
  ['devices','repairs','parts','sales','accounting','alerts','users'].forEach(x => {
    const n = document.getElementById('ni-'+x);
    const m = document.getElementById('mn-'+x);
    if (n) n.classList.toggle('active', x === t);
    if (m) m.classList.toggle('active', x === t);
  });
  if (window.innerWidth <= 720) closeSB();
  rPage();
}

// ── SEARCH (no keyboard dismiss) ──
function handleSearch(val) {
  SQ = val.toLowerCase();
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    // Only update results div, not the toolbar
    const res = document.getElementById('pageResults');
    if (res) {
      res.innerHTML = getPageResults();
      rHeader(); // update counts
    }
  }, 300);
}

function getPageResults() {
  if (tab === 'devices')  return rDevResults();
  if (tab === 'repairs')  return rRepResults();
  if (tab === 'parts')    return rPartsResults();
  if (tab === 'sales')    return rSalesResults();
  return '';
}

// ── RENDER ─────────────────────────
function render() { rHeader(); rSidebar(); rPage(); }

function rHeader() {
  const devs = Object.values(DB.devices || {});
  const reps = Object.values(DB.repairs || {});
  const repAct = reps.filter(r => r.status === 'inprog' || r.status === 'new').length;
  const todaySales = Object.values(DB.sales || {}).filter(s => isToday(s.date)).reduce((a,s) => a + s.price, 0);
  document.getElementById('hstats').innerHTML = `
    <div class="hst"><div class="v" style="color:var(--cy)">${devs.length}</div><div class="l">أجهزة</div></div>
    <div class="hst"><div class="v" style="color:var(--yw)">${repAct}</div><div class="l">صيانة</div></div>
    <div class="hst"><div class="v" style="color:var(--gn);font-size:10px">${IQD(todaySales)}</div><div class="l">اليوم</div></div>`;

  const al = getAlerts();
  const nb = document.getElementById('nbdg');
  if (nb) { nb.style.display = al.length ? 'flex' : 'none'; nb.textContent = al.length; }

  const S = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  S('nc-d', devs.length);
  S('nc-r', reps.length);
  S('nc-p', Object.values(DB.parts||{}).length);
  S('nc-s', Object.values(DB.sales||{}).length);
  const na = document.getElementById('nc-a');
  if (na) { na.textContent = al.length; na.style.background = al.length ? 'var(--rd3)' : ''; na.style.color = al.length ? 'var(--rd)' : ''; }
}

function rSidebar() {
  const devs = Object.values(DB.devices || {});
  const grp = {}, dn = {};
  devs.forEach(d => { grp[d.modelId] = (grp[d.modelId]||0) + 1; });
  devs.forEach(d => { if (d.done || devSt(d) === 'done') dn[d.modelId] = (dn[d.modelId]||0) + 1; });
  document.getElementById('ML').innerHTML =
    `<div class="mi ${amod==='all'?'active':''}" onclick="setAM('all')">
       <div class="mi-i"><div class="mi-n">🗂 كل المخزن</div></div>
       <span class="mi-c">${devs.length}</span>
     </div>` +
    Object.values(DB.models||{}).map(m => {
      const cnt = grp[m.id]||0, dc = dn[m.id]||0;
      const pct = cnt ? Math.round(dc/cnt*100) : 0;
      const col = pct===100 ? 'var(--gn)' : pct>50 ? 'var(--cy)' : 'var(--yw)';
      return `<div class="mi ${amod===m.id?'active':''}" onclick="setAM('${m.id}')">
        <div class="mi-i">
          <div class="mi-n">${m.brand} ${m.name}</div>
          <div class="mi-s">${m.size?m.size+'"':''} ${m.ver||''}</div>
          <div class="mbar"><div class="mbar-f" style="width:${pct}%;background:${col}"></div></div>
        </div>
        <span class="mi-c">${cnt}</span>
      </div>`;
    }).join('');
}

function rPage() {
  const pg = document.getElementById('PC'); if (!pg) return;
  // Each page has a toolbar + a results div
  if (tab === 'devices')     pg.innerHTML = rDevPage();
  else if (tab === 'repairs')pg.innerHTML = rRepPage();
  else if (tab === 'parts')  pg.innerHTML = rPartsPage();
  else if (tab === 'sales')  pg.innerHTML = rSalesPage();
  else if (tab === 'accounting') pg.innerHTML = rAccPage();
  else if (tab === 'alerts') pg.innerHTML = rAlertsPage();
  else if (tab === 'users')  pg.innerHTML = rUsersPage();
  rHeader();
}

// ── LAYOUT HELPERS ─────────────────
function setAM(id) { amod = id; rSidebar(); rPage(); if (window.innerWidth <= 720) closeSB(); }
function toggleSB() { document.getElementById('SB').classList.toggle('open'); document.getElementById('ov').classList.toggle('open'); }
function closeSB()  { document.getElementById('SB').classList.remove('open'); document.getElementById('ov').classList.remove('open'); }
function checkMob() { const el = document.getElementById('mbtn'); if (el) el.style.display = window.innerWidth <= 720 ? 'flex' : 'none'; }
window.addEventListener('resize', () => { checkMob(); });

// Close modals on overlay click
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.mo').forEach(o => o.addEventListener('click', e => { if (e.target === o) o.style.display = 'none'; }));
});

// ── MODEL OPTIONS ──────────────────
function updateModelOptions() {
  const brand = document.getElementById('fBrand').value;
  const models = MODELS_DB[brand] || [];
  const sel = document.getElementById('fMName');
  sel.innerHTML = `<option value="">اختر الموديل...</option>` + models.map(m => `<option value="${m}">${m}</option>`).join('');
}

// ── ALERTS ENGINE ──────────────────
function getAlerts() {
  const A = [];
  Object.values(DB.devices||{}).forEach(d => {
    const p = d.parts||[], g = p.filter(x=>x.status==='good').length, tot = p.length;
    if (!d.done && tot > 0) {
      if (g === 1) A.push({ type:'crit', ico:'🚨', title:`${d.name||'جهاز'} — قطعة واحدة سليمة فقط!`, sub:mname(d.modelId), ts:d.updatedAt, devId:d.id });
      else if (tot>1 && g/tot >= 0.7) A.push({ type:'near', ico:'🟢', title:`${d.name||'جهاز'} — قريب من الاكتمال`, sub:`${g}/${tot} قطعة سليمة (${Math.round(g/tot*100)}%)`, ts:d.updatedAt, devId:d.id });
      else if (tot>2 && g/tot < 0.3) A.push({ type:'warn', ico:'⚠️', title:`${d.name||'جهاز'} — نسبة سليمة منخفضة`, sub:`${g}/${tot} (${Math.round(g/tot*100)}%)`, ts:d.updatedAt, devId:d.id });
    }
  });
  Object.values(DB.parts||{}).forEach(p => {
    if (p.qty === 0) A.push({ type:'crit', ico:'❌', title:`نفدت القطعة: ${p.name}`, sub:'الكمية: صفر', ts:p.updatedAt });
    else if (p.qty === 1) A.push({ type:'warn', ico:'📦', title:`آخر قطعة: ${p.name}`, sub:'قطعة واحدة متبقية فقط!', ts:p.updatedAt });
    else if (p.qty > 1 && p.qty <= (p.minQty||2)) A.push({ type:'warn', ico:'📦', title:`مخزون منخفض: ${p.name}`, sub:`الكمية ${p.qty} (الحد ${p.minQty||2})`, ts:p.updatedAt });
  });
  Object.values(DB.repairs||{}).forEach(r => {
    if (r.status==='new' && (Date.now()-r.createdAt) > 7200000) A.push({ type:'info', ico:'🔔', title:`صيانة تنتظر: ${r.customerName}`, sub:`${r.deviceBrand||''} ${r.deviceModel||''}`, ts:r.createdAt, repId:r.id });
    if (r.eta && r.status!=='done' && r.status!=='cancelled' && Date.now() > new Date(r.eta).getTime()) A.push({ type:'crit', ico:'⏰', title:`صيانة متأخرة: ${r.customerName}`, sub:`الموعد كان ${r.eta}`, ts:r.createdAt, repId:r.id });
  });
  return A.sort((a,b) => (b.ts||0) - (a.ts||0));
}
