/* ═══════════════════════════════════
   ALMALIK — firebase.js
   Firebase connection & sync
   ═══════════════════════════════════ */

let fbUnsub = null;
let fbIniting = false;

function getFBConfig() {
  try { const s = localStorage.getItem('lp_fb'); return s ? JSON.parse(s) : null; }
  catch(e) { return null; }
}
function isFBOK(c) {
  return c && c.apiKey && c.databaseURL &&
    !c.apiKey.includes('PASTE') && !c.apiKey.includes('AIzaSy...');
}

async function initFB() {
  if (fbIniting) return;
  fbIniting = true;
  const cfg = getFBConfig();
  if (!isFBOK(cfg)) { setSS('local', 'غير مُعدّ'); fbIniting = false; return; }
  setSS('syncing', 'جاري الاتصال...');
  // Wait up to 8s for module
  let t = 0;
  while (!window._FM && t < 40) { await sleep(200); t++; }
  if (!window._FM) {
    setSS('error', 'تعذّر تحميل Firebase');
    showFBStatus('error', '❌ تعذّر تحميل مكتبة Firebase — تحقق من الإنترنت');
    fbIniting = false; return;
  }
  try {
    const M = window._FM;
    const ex = M.getApps();
    const app = ex.length ? ex[0] : M.initializeApp(cfg);
    const db = M.getDatabase(app);
    window._db  = db;   window._ref    = M.ref;
    window._set = M.set; window._onVal = M.onValue;
    window._off = M.off; window._get   = M.get;
    window._fbOK = true;
    subFB();
  } catch(e) {
    console.error('Firebase init:', e);
    setSS('error', 'خطأ في الاتصال');
    showFBStatus('error', '❌ ' + e.message.slice(0, 60));
  }
  fbIniting = false;
}

function subFB() {
  if (!window._fbOK) return;
  if (fbUnsub) { try { fbUnsub(); } catch(e) {} fbUnsub = null; }
  setSS('syncing', 'يتزامن...');
  try {
    fbUnsub = window._onVal(window._ref(window._db, 'almalik'), snap => {
      const v = snap.val();
      if (v) {
        const adminBk = DB.users && DB.users.admin ? DB.users.admin : null;
        DB = { users:{}, models:{}, devices:{}, parts:{}, sales:{}, repairs:{}, ...v };
        if (adminBk && !DB.users.admin) DB.users.admin = adminBk;
        ensureAdmin();
        // Refresh current user permissions
        if (CU) {
          const fr = Object.values(DB.users).find(u => u.username === CU.username);
          if (fr) CU = fr;
        }
        lsSave(); render();
      }
      setSS('online', 'متصل ☁️');
    }, err => {
      console.error('FB listen:', err);
      setSS('error', 'انقطع الاتصال');
      setTimeout(() => { if (window._fbOK) subFB(); }, 5000);
    });
  } catch(e) { setSS('error', 'خطأ في الاستماع'); }
}

async function p2FB() {
  if (!window._fbOK || !navigator.onLine) {
    if (!navigator.onLine) toast('التغييرات محفوظة محلياً', 'w');
    return;
  }
  try {
    setSS('syncing', 'حفظ...');
    // Write main DB
    await window._set(window._ref(window._db, 'almalik'), DB);
    // Write public repair snapshots (readable without auth for customer tracking)
    const pub = {};
    Object.values(DB.repairs || {}).forEach(r => {
      pub[r.id] = {
        id: r.id,
        customerName: r.customerName || '',
        deviceBrand: r.deviceBrand || '',
        deviceModel: r.deviceModel || '',
        status: r.status || 'new',
        progress: r.progress || 0,
        progressNotes: r.progressNotes || '',
        agreedPrice: r.agreedPrice || 0,
        paid: r.paid || false,
        eta: r.eta || '',
        faultConfirmed: r.faultConfirmed || '',
        updatedAt: r.updatedAt || 0,
        createdAt: r.createdAt || 0,
      };
    });
    await window._set(window._ref(window._db, 'public_repairs'), pub);
    setSS('online', 'متصل ☁️');
  } catch(e) {
    console.error('Save error:', e);
    setSS('error', 'فشل الحفظ');
    toast('فشل الحفظ السحابي — محفوظ محلياً', 'w');
  }
}

// Fetch single repair for tracking (no auth)
async function fetchPublicRepair(id) {
  if (!window._FM || !isFBOK(getFBConfig())) return null;
  try {
    const M = window._FM;
    const ex = M.getApps();
    const app = ex.length ? ex[0] : M.initializeApp(getFBConfig());
    const db = M.getDatabase(app);
    // Try public path first
    let snap = await M.get(M.ref(db, `public_repairs/${id}`));
    if (snap.val()) return snap.val();
    // Fallback to full path
    snap = await M.get(M.ref(db, `almalik/repairs/${id}`));
    return snap.val();
  } catch(e) {
    console.warn('fetchPublicRepair:', e);
    return null;
  }
}

// Settings
function openSettings() {
  const c = getFBConfig();
  if (c) document.getElementById('fFB').value = JSON.stringify(c, null, 2);
  document.getElementById('fbStatus').style.display = 'none';
  document.getElementById('setModal').style.display = 'flex';
}
async function saveFBConf() {
  try {
    const c = JSON.parse(document.getElementById('fFB').value.trim());
    if (!c.apiKey || !c.databaseURL) throw new Error('apiKey أو databaseURL مفقود');
    if (c.apiKey.includes('PASTE') || c.apiKey.includes('AIzaSy...')) throw new Error('الصق الإعدادات الحقيقية');
    localStorage.setItem('lp_fb', JSON.stringify(c));
    showFBStatus('ok', '✅ تم الحفظ — جاري الاتصال...');
    window._fbOK = false; fbIniting = false;
    if (fbUnsub) { try { fbUnsub(); } catch(e) {} fbUnsub = null; }
    setTimeout(() => { cm('setModal'); initFB(); }, 800);
  } catch(e) { showFBStatus('error', '❌ ' + e.message); }
}
function clearFBConf() {
  if (!confirm('مسح إعداد Firebase؟')) return;
  localStorage.removeItem('lp_fb');
  if (fbUnsub) { try { fbUnsub(); } catch(e) {} fbUnsub = null; }
  window._fbOK = false; fbIniting = false;
  setSS('local', 'غير مُعدّ'); cm('setModal');
  toast('تم مسح الإعداد', 'i');
}

function setSS(cls, txt) {
  const d = document.getElementById('sd'), l = document.getElementById('sl');
  if (d) d.className = 'sd ' + cls;
  if (l) l.textContent = txt;
}
function showFBStatus(type, msg) {
  const el = document.getElementById('fbStatus'); if (!el) return;
  el.style.display = 'block';
  el.style.background = type === 'ok' ? 'var(--gn3)' : 'var(--rd3)';
  el.style.color = type === 'ok' ? 'var(--gn)' : 'var(--rd)';
  el.style.border = '1px solid ' + (type === 'ok' ? 'rgba(0,255,136,.3)' : 'rgba(255,68,102,.3)');
  el.textContent = msg;
}

// Online/offline
window.addEventListener('online',  () => { if (window._fbOK) subFB(); else initFB(); toast('عاد الاتصال', 'i'); });
window.addEventListener('offline', () => { setSS('offline', 'أوف لاين'); toast('أوف لاين', 'w'); });
