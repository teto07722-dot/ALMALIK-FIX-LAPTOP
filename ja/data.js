/* ═══════════════════════════════════
   ALMALIK — data.js
   DB state, local storage, constants
   ═══════════════════════════════════ */

// ── CONSTANTS ──────────────────────
const CP = [
  'الشاشة','البورد الأم','الرام','الهارد/SSD','البطارية',
  'الكيبورد','التشبيك Wifi','المبرد/فان','الشارج','الغطاء',
  'كرت الشاشة','البروسيسور','مكبر الصوت','كاميرا',
  'USB Port','DC Jack','Touch Pad','منفذ HDMI'
];

const CI = {
  شاشات:'🖥', بطاريات:'🔋', هاردات:'💾', رامات:'🧠',
  بورد:'⚡', كيبورد:'⌨️', شارج:'🔌', مبرد:'❄️', أخرى:'📦'
};

const SYMS = [
  'لا يعمل إطلاقاً','شاشة سوداء','يعمل بلا صورة','مشكلة صوت',
  'لا يشحن','يفصل فجأة','بطيء جداً','شاشة مكسورة','كيبورد تالف',
  'مشكلة واي فاي','يسخن كثيراً','برمجيات / ويندوز','فيروس / مالوير',
  'منفذ USB تالف','لا يكتشف الهارد','مروحة بصوت عالٍ','هينج مكسور'
];

const MODELS_DB = {
  HP: ['ProBook 430 G5','ProBook 430 G6','ProBook 430 G7','ProBook 440 G5','ProBook 440 G6','ProBook 440 G7','ProBook 450 G5','ProBook 450 G6','ProBook 450 G7','ProBook 450 G8','ProBook 450 G9','EliteBook 840 G5','EliteBook 840 G6','EliteBook 840 G7','EliteBook 850 G5','EliteBook 850 G6','HP 250 G7','HP 250 G8','HP 15-db','HP 15-dy','HP Pavilion 15','HP Envy x360'],
  Dell: ['Latitude 3410','Latitude 3420','Latitude 3510','Latitude 3520','Latitude 5410','Latitude 5420','Latitude 5510','Latitude 5520','Inspiron 15 3000','Inspiron 15 5000','Inspiron 14 5000','Vostro 3500','Vostro 3510','XPS 15 9500','XPS 13 9300'],
  Lenovo: ['ThinkPad E14 G1','ThinkPad E14 G2','ThinkPad E15 G1','ThinkPad E15 G2','ThinkPad E15 G3','ThinkPad T14 G1','ThinkPad T14 G2','IdeaPad 3 15','IdeaPad 5 15','IdeaPad S145','Yoga 7i'],
  Apple: ['MacBook Air M1','MacBook Air M2','MacBook Air M3','MacBook Pro 13" M1','MacBook Pro 14" M1 Pro','MacBook Pro 16" M1 Max','MacBook Pro 14" M3'],
  Asus: ['VivoBook 14','VivoBook 15','ZenBook 14','ZenBook 15','ExpertBook B1','TUF Gaming F15','TUF Gaming A15','ROG Strix G15'],
  Acer: ['Aspire 3 A315','Aspire 5 A515','Aspire 7','Swift 3','Swift 5','TravelMate P2','Nitro 5'],
  MSI: ['Modern 14','Modern 15','Prestige 14','GF63 Thin','Katana GF66','Raider GE76'],
  Samsung: ['Galaxy Book 2','Galaxy Book Pro 360','Galaxy Book Flex 2'],
  Toshiba: ['Satellite C50','Satellite L50','Dynabook Tecra A50'],
  Huawei: ['MateBook D14','MateBook D15','MateBook 14','MateBook X Pro'],
  أخرى: ['أدخل الموديل يدوياً']
};

const IQD = n => new Intl.NumberFormat('ar-IQ').format(Math.round(n || 0)) + ' د.ع';

// ── DB STATE ───────────────────────
let DB = {
  users:    { admin: { username:'admin', password:'admin123', fullname:'المدير', role:'admin', perms:{add:true,edit:true,delete:true,parts:true,acc:true,repairs:true,export:true} } },
  models:   {},
  devices:  {},
  parts:    {},
  sales:    {},
  repairs:  {}
};

let CU = null; // Current User

function ensureAdmin() {
  if (!DB.users) DB.users = {};
  if (!DB.users.admin) {
    DB.users.admin = { username:'admin', password:'admin123', fullname:'المدير', role:'admin', perms:{add:true,edit:true,delete:true,parts:true,acc:true,repairs:true,export:true} };
  }
}

// ── LOCAL STORAGE ──────────────────
function lsSave() {
  try { localStorage.setItem('am4', JSON.stringify(DB)); } catch(e) {}
}
function lsLoad() {
  try {
    const s = localStorage.getItem('am4');
    if (s) { const p = JSON.parse(s); DB = { users:{}, models:{}, devices:{}, parts:{}, sales:{}, repairs:{}, ...p }; ensureAdmin(); }
  } catch(e) {}
}
function lsSaveCU(u) {
  try { localStorage.setItem('am4cu', JSON.stringify({ username: u.username, password: u.password })); } catch(e) {}
}
function lsLoadCU() {
  try { const s = localStorage.getItem('am4cu'); return s ? JSON.parse(s) : null; } catch(e) { return null; } }

// ── DEMO DATA ──────────────────────
function loadDemo() {
  if (Object.values(DB.models || {}).length) return;
  const m1 = uid(), m2 = uid();
  DB.models = {
    [m1]: { id:m1, name:'ProBook 450 G7', brand:'HP', size:'15.6', ver:'G7 2020' },
    [m2]: { id:m2, name:'Latitude 5510',  brand:'Dell', size:'15', ver:'i5 Gen10' }
  };
  const d1 = uid(), d2 = uid();
  DB.devices = {
    [d1]: { id:d1, modelId:m1, name:'Unit-001', notes:'الشاشة تالفة', parts:[{name:'الشاشة',status:'bad'},{name:'البورد الأم',status:'good'},{name:'الرام',status:'good'},{name:'الهارد/SSD',status:'good'},{name:'البطارية',status:'good'}], done:false, createdAt:Date.now()-86400000, updatedAt:Date.now()-86400000 },
    [d2]: { id:d2, modelId:m2, name:'Unit-002', notes:'بورد تالف — قريب اكتمال', parts:[{name:'الشاشة',status:'good'},{name:'البورد الأم',status:'bad'},{name:'الرام',status:'good'},{name:'البطارية',status:'good'}], done:false, createdAt:Date.now()-40000000, updatedAt:Date.now()-40000000 }
  };
  const p1 = uid();
  DB.parts = { [p1]: { id:p1, name:'شاشة 15.6" FHD', category:'شاشات', qty:1, minQty:2, buyPrice:25000, sellPrice:55000, compat:'HP 450', createdAt:Date.now() } };
  const r1 = uid();
  DB.repairs = {
    [r1]: { id:r1, customerName:'أبو خالد العبيدي', customerPhone:'0771-234-5678', deviceBrand:'HP', deviceModel:'Pavilion 15', symptoms:['شاشة سوداء','يعمل بلا صورة'], status:'inprog', progress:40, agreedPrice:35000, faultEstimated:'مشكلة شاشة/كابل', faultConfirmed:'', progressNotes:'تم فحص الكابل — البورد قيد الاختبار', eta:'2026-05-20', priority:'urgent', createdAt:Date.now()-7200000, updatedAt:Date.now()-1800000, by:'admin' }
  };
  DB.users['tech01'] = { username:'tech01', password:'tech123', fullname:'أحمد الفني', role:'tech', perms:{add:true,edit:true,delete:false,parts:true,repairs:true,acc:false,export:false} };
  lsSave();
}

// ── HELPERS ────────────────────────
function uid()  { return Date.now().toString(36) + Math.random().toString(36).slice(2,7); }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function esc(s) { return (s||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;'); }
function ds()   { return new Date().toISOString().slice(0,10); }
function fmtD(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return `${d.getDate()}/${d.getMonth()+1}\n${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`;
}
function isToday(ts)     { const d=new Date(ts),n=new Date(); return d.getDate()===n.getDate()&&d.getMonth()===n.getMonth()&&d.getFullYear()===n.getFullYear(); }
function isThisWeek(ts)  { return ts > Date.now() - 7*86400000; }
function isThisMonth(ts) { const d=new Date(ts),n=new Date(); return d.getMonth()===n.getMonth()&&d.getFullYear()===n.getFullYear(); }
function mname(mid)      { const m=(DB.models||{})[mid]; return m ? `${m.brand} ${m.name}` : '?'; }
function devSt(d) {
  if (d.done) return 'done';
  const p = d.parts || [];
  const hg = p.some(x => x.status==='good');
  const hb = p.some(x => x.status==='bad' || x.status==='used');
  if (hg && !hb) return 'done';
  if (hg &&  hb) return 'partial';
  return 'broken';
}

// Search highlight
let SQ = '';
function hl(t) {
  if (!SQ || !t) return t || '';
  try { return t.replace(new RegExp(SQ.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'gi'), m => `<span class="hl">${m}</span>`); }
  catch(e) { return t; }
}

// Toast
function toast(msg, type='i') {
  const w = document.getElementById('TW'); if (!w) return;
  const el = document.createElement('div');
  el.className = `toast ${type}`; el.textContent = msg;
  w.appendChild(el); setTimeout(() => { try { el.remove(); } catch(e) {} }, 3500);
}
function cm(id) { const el = document.getElementById(id); if (el) el.style.display = 'none'; }
