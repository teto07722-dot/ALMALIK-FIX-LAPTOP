/* ═══════════════════════════════════
   ALMALIK — actions.js
   CRUD: Devices, Parts, Repairs,
         Sales, Export/Import
   ═══════════════════════════════════ */

// ═══════════════════════════════════
// MODELS
// ═══════════════════════════════════
function openAddModel() {
  if (!can('add')) { toast('غير مصرح', 'e'); return; }
  ['fMVer','fMCustom'].forEach(id => { const el=document.getElementById(id); if(el) el.value=''; });
  document.getElementById('fMSize').value = '15.6';
  updateModelOptions();
  document.getElementById('modModal').style.display = 'flex';
}
async function saveMod() {
  const brand  = document.getElementById('fBrand').value;
  const custom = document.getElementById('fMCustom').value.trim();
  const selNm  = document.getElementById('fMName').value;
  const name   = custom || selNm;
  const size   = document.getElementById('fMSize').value;
  const ver    = document.getElementById('fMVer').value.trim();
  if (!name || name === 'اختر الموديل...') return toast('اختر أو أدخل اسم الموديل', 'e');
  const id = uid();
  DB.models[id] = { id, name, brand, size, ver };
  lsSave(); cm('modModal'); render(); await p2FB();
  toast(`تم إضافة ${brand} ${name} ${size}"`, 's');
}

// ═══════════════════════════════════
// DEVICES
// ═══════════════════════════════════
function openAddDev(mid) {
  if (!can('add')) { toast('غير مصرح', 'e'); return; }
  editDevId = null;
  document.getElementById('devMT').textContent = 'إضافة جهاز جديد';
  ['fDN','fDNotes'].forEach(id => document.getElementById(id).value = '');
  fillMS(mid || (amod!=='all' ? amod : ''));
  fillTS('');
  document.getElementById('PE').innerHTML = '';
  ['الشاشة','البورد الأم','الرام','الهارد/SSD','البطارية'].forEach(p => addPR(p,'good'));
  document.getElementById('devModal').style.display = 'flex';
  setTimeout(() => document.getElementById('fDN').focus(), 200);
}
function openEditDev(id) {
  if (!can('edit')) { toast('غير مصرح', 'e'); return; }
  const d = DB.devices[id]; if (!d) return;
  editDevId = id;
  document.getElementById('devMT').textContent = 'تعديل الجهاز';
  document.getElementById('fDN').value    = d.name  || '';
  document.getElementById('fDNotes').value= d.notes || '';
  fillMS(d.modelId); fillTS(d.techId||'');
  document.getElementById('PE').innerHTML = '';
  (d.parts||[]).forEach(p => addPR(p.name, p.status));
  document.getElementById('devModal').style.display = 'flex';
}
function fillMS(sel) {
  const el = document.getElementById('fMod');
  el.innerHTML = Object.values(DB.models||{}).map(m => `<option value="${m.id}" ${m.id===sel?'selected':''}>${m.brand} ${m.name} ${m.size?'('+m.size+'")':''}</option>`).join('');
  if (!Object.values(DB.models||{}).length) el.innerHTML = '<option value="">— أضف موديلاً أولاً —</option>';
}
function fillTS(sel) {
  const el = document.getElementById('fTech');
  el.innerHTML = `<option value="">— بدون تعيين —</option>` +
    Object.values(DB.users||{}).filter(u=>u.role==='tech').map(u => `<option value="${u.username}" ${u.username===sel?'selected':''}>${u.fullname}</option>`).join('');
}
function addPR(name='', status='good') {
  const pe = document.getElementById('PE'); const id = uid();
  const div = document.createElement('div'); div.className = 'prow'; div.id = 'pr_'+id;
  div.innerHTML = `<input type="text" value="${esc(name)}" placeholder="القطعة" list="cp_${id}" style="flex:1;min-width:0">
    <datalist id="cp_${id}">${CP.map(p=>`<option value="${p}">`).join('')}</datalist>
    <select>
      <option value="good" ${status==='good'?'selected':''}>✅ سليمة</option>
      <option value="bad"  ${status==='bad' ?'selected':''}>❌ تالفة</option>
      <option value="used" ${status==='used'?'selected':''}>🔧 مستخدمة</option>
    </select>
    <button class="rmb" onclick="document.getElementById('pr_${id}').remove()">×</button>`;
  pe.appendChild(div);
}
async function saveDev() {
  const modelId = document.getElementById('fMod').value;
  const name    = document.getElementById('fDN').value.trim();
  const notes   = document.getElementById('fDNotes').value.trim();
  const techId  = document.getElementById('fTech').value;
  if (!modelId) return toast('اختر الموديل', 'e');
  const parts = [];
  document.querySelectorAll('#PE .prow').forEach(row => {
    const n = row.querySelector('input').value.trim();
    const s = row.querySelector('select').value;
    if (n) parts.push({ name:n, status:s });
  });
  const now = Date.now();
  if (editDevId) {
    Object.assign(DB.devices[editDevId], { modelId, name, notes, techId, parts, updatedAt:now });
    toast('تم التحديث', 's');
  } else {
    const id = uid();
    DB.devices[id] = { id, modelId, name, notes, techId, parts, done:false, createdAt:now, updatedAt:now, by:CU.username };
    toast('تم الإضافة ✅', 's');
  }
  lsSave(); cm('devModal'); render(); await p2FB();
}
async function delDev(id) {
  if (!can('delete')) { toast('غير مصرح','e'); return; }
  if (!confirm('حذف هذا الجهاز نهائياً؟')) return;
  delete DB.devices[id]; lsSave(); render(); await p2FB(); toast('تم الحذف','i');
}
async function toggleDone(id) {
  if (!can('edit')) { toast('غير مصرح','e'); return; }
  const d = DB.devices[id]; if (!d) return;
  d.done = !d.done; d.updatedAt = Date.now();
  lsSave(); render(); await p2FB(); toast(d.done?'✅ منجز':'↩ إلغاء الإنجاز','i');
}
async function cyclePart(devId, partName) {
  if (!can('edit')) { toast('غير مصرح','e'); return; }
  const d = DB.devices[devId]; if (!d) return;
  const p = d.parts.find(x=>x.name===partName); if (!p) return;
  const cy = { good:'bad', bad:'used', used:'good' };
  p.status = cy[p.status]||'good'; d.updatedAt = Date.now();
  lsSave(); render(); p2FB();
}

// ── TRANSFER ──────────────────────
function openTrans(id) {
  if (!can('edit')) { toast('غير مصرح','e'); return; }
  transDevId = id; const d = DB.devices[id]; if (!d) return;
  const g = (d.parts||[]).filter(p=>p.status==='good');
  if (!g.length) return toast('لا توجد قطع سليمة','e');
  document.getElementById('TP').innerHTML = g.map((p,i)=>
    `<div class="ti" onclick="this.querySelector('input').click()">
       <input type="checkbox" id="tp_${i}" data-part="${esc(p.name)}">
       <label for="tp_${i}">🟢 ${p.name}</label>
     </div>`).join('');
  document.getElementById('fTN').value = '';
  document.getElementById('transModal').style.display = 'flex';
}
async function confirmTrans() {
  const d = DB.devices[transDevId]; if (!d) return;
  const note = document.getElementById('fTN').value.trim();
  let cnt = 0;
  document.querySelectorAll('#TP input:checked').forEach(cb => {
    const p = d.parts.find(x=>x.name===cb.dataset.part&&x.status==='good');
    if (p) { p.status='used'; cnt++; }
  });
  if (!cnt) return toast('اختر قطعة واحدة على الأقل','e');
  if (note) d.notes = (d.notes?d.notes+'\n':'') + `🔧 ${note}`;
  if (!d.parts.some(p=>p.status==='good')) d.done = true;
  d.updatedAt = Date.now();
  lsSave(); cm('transModal'); render(); await p2FB();
  toast(`تم تحديد ${cnt} قطعة كمستخدمة`,'s');
}

// ── SELL FROM DEVICE ──────────────
function openSellFromDev(id) {
  if (!can('acc')) { toast('غير مصرح','e'); return; }
  sellDevId = id; const d = DB.devices[id]; if (!d) return;
  const m = DB.models[d.modelId]||{brand:'',name:''};
  document.getElementById('sdpInfo').innerHTML = `<b>جهاز:</b> ${d.name||m.brand+' '+m.name}`;
  const g = (d.parts||[]).filter(p=>p.status==='good');
  if (!g.length) return toast('لا توجد قطع سليمة للبيع','e');
  document.getElementById('fSDP').innerHTML = g.map(p=>`<option value="${esc(p.name)}">${p.name}</option>`).join('');
  document.getElementById('fSDPrice').value = '';
  document.getElementById('fSDNote').value  = '';
  document.getElementById('sellDevModal').style.display = 'flex';
}
async function confirmSellFromDev() {
  const d = DB.devices[sellDevId]; if (!d) return;
  const partName = document.getElementById('fSDP').value;
  const price    = parseInt(document.getElementById('fSDPrice').value)||0;
  const note     = document.getElementById('fSDNote').value.trim();
  if (!price||price<=0) return toast('أدخل سعر البيع','e');
  const part = d.parts.find(p=>p.name===partName&&p.status==='good');
  if (!part) return toast('القطعة غير متوفرة','e');
  part.status = 'used'; d.updatedAt = Date.now();
  const sid = uid();
  DB.sales[sid] = { id:sid, type:'devpart', itemName:partName, partCat:'أخرى', price, note:`من جهاز: ${d.name||''}${note?' — '+note:''}`, by:CU.fullname, date:Date.now() };
  lsSave(); cm('sellDevModal'); render(); await p2FB();
  toast(`💰 تم بيع ${partName} بـ ${IQD(price)}`,'s');
}

// ═══════════════════════════════════
// PARTS
// ═══════════════════════════════════
function openAddPart() {
  if (!can('parts')) { toast('غير مصرح','e'); return; }
  editPartId = null;
  document.getElementById('partMT').textContent = 'إضافة قطعة غيار';
  ['fPN','fPComp','fPNotes'].forEach(id => document.getElementById(id).value = '');
  ['fPBuy','fPSell'].forEach(id => document.getElementById(id).value = '0');
  document.getElementById('fPQ').value   = 1;
  document.getElementById('fPMin').value = 2;
  document.getElementById('partModal').dataset.mid = '';
  document.getElementById('partModal').style.display = 'flex';
  setTimeout(() => document.getElementById('fPN').focus(), 200);
}
function openAddModelPart(mid) { openAddPart(); document.getElementById('partModal').dataset.mid = mid; }
function openEditPart(id) {
  if (!can('parts')) { toast('غير مصرح','e'); return; }
  const p = DB.parts[id]; if (!p) return;
  editPartId = id;
  document.getElementById('partMT').textContent = 'تعديل القطعة';
  document.getElementById('fPN').value    = p.name     || '';
  document.getElementById('fPCat').value  = p.category || 'أخرى';
  document.getElementById('fPQ').value    = p.qty      || 0;
  document.getElementById('fPMin').value  = p.minQty   || 2;
  document.getElementById('fPBuy').value  = p.buyPrice || 0;
  document.getElementById('fPSell').value = p.sellPrice|| 0;
  document.getElementById('fPComp').value = p.compat   || '';
  document.getElementById('fPNotes').value= p.notes    || '';
  document.getElementById('partModal').style.display = 'flex';
}
async function savePart() {
  const name     = document.getElementById('fPN').value.trim();
  const category = document.getElementById('fPCat').value;
  const qty      = parseInt(document.getElementById('fPQ').value)||0;
  const minQty   = parseInt(document.getElementById('fPMin').value)||2;
  const buyPrice = parseInt(document.getElementById('fPBuy').value)||0;
  const sellPrice= parseInt(document.getElementById('fPSell').value)||0;
  const compat   = document.getElementById('fPComp').value.trim();
  const notes    = document.getElementById('fPNotes').value.trim();
  if (!name) return toast('أدخل اسم القطعة','e');
  const now = Date.now();
  const mid = document.getElementById('partModal').dataset.mid || null;
  if (editPartId) {
    Object.assign(DB.parts[editPartId], { name,category,qty,minQty,buyPrice,sellPrice,compat,notes,updatedAt:now });
    toast('تم التحديث','s');
  } else {
    const id = uid();
    DB.parts[id] = { id,name,category,qty,minQty,buyPrice,sellPrice,compat,notes,modelId:mid||null,createdAt:now,updatedAt:now };
    toast('تم الإضافة','s');
  }
  lsSave(); cm('partModal'); document.getElementById('partModal').dataset.mid=''; render(); await p2FB();
}
async function delPart(id) {
  if (!can('delete')) { toast('غير مصرح','e'); return; }
  if (!confirm('حذف؟')) return; delete DB.parts[id]; lsSave(); render(); await p2FB(); toast('تم الحذف','i');
}
async function addStock(id) {
  if (!can('parts')) { toast('غير مصرح','e'); return; }
  const n = parseInt(prompt('كم قطعة تضيف؟','1')||'0');
  if (isNaN(n)||n<=0) return;
  DB.parts[id].qty += n; DB.parts[id].updatedAt = Date.now();
  lsSave(); render(); await p2FB(); toast(`تم إضافة ${n} قطعة`,'s');
}

// ── WITHDRAW ──────────────────────
function toggleWDP() {
  const t = document.getElementById('fWType').value;
  document.getElementById('wdPR').style.display = t==='sell' ? 'block':'none';
  document.getElementById('wdCBtn').textContent = t==='sell' ? '💰 بيع':'🔧 سحب';
}
function openWD(id) {
  if (!can('parts')) { toast('غير مصرح','e'); return; }
  wdPartId = id; const p = DB.parts[id]; if (!p) return;
  document.getElementById('wdInfo').innerHTML = `<b>${p.name}</b> — ${p.category}<br>المتوفر: <b style="color:var(--cy)">${p.qty} قطعة</b>${p.sellPrice?` | بيع: <b style="color:var(--gn)">${IQD(p.sellPrice)}</b>`:''}`;
  document.getElementById('fWQ').value    = 1;
  document.getElementById('fWNote').value = '';
  document.getElementById('fWType').value = 'use';
  document.getElementById('fWPrice').value= p.sellPrice||0;
  toggleWDP();
  document.getElementById('wdModal').style.display = 'flex';
}
async function confirmWD() {
  const p = DB.parts[wdPartId]; if (!p) return;
  const qty   = parseInt(document.getElementById('fWQ').value)||0;
  const type  = document.getElementById('fWType').value;
  const price = parseInt(document.getElementById('fWPrice').value)||0;
  const note  = document.getElementById('fWNote').value.trim();
  if (qty <= 0)           return toast('أدخل كمية صحيحة','e');
  if (qty > p.qty)        return toast(`المتوفر فقط ${p.qty}`,'e');
  if (type==='sell'&&price<=0) return toast('أدخل سعر البيع','e');
  p.qty -= qty; p.updatedAt = Date.now();
  if (type === 'sell') {
    const sid = uid();
    DB.sales[sid] = { id:sid, type:'part', itemName:p.name+(qty>1?` (${qty} قطع)`:''), partCat:p.category, price:price*qty, note, by:CU.fullname, date:Date.now() };
    toast(`💰 تم بيع ${qty} ${p.name} بـ ${IQD(price*qty)}`,'s');
  } else { toast(`🔧 تم سحب ${qty} ${p.name}`,'i'); }
  lsSave(); cm('wdModal'); render(); await p2FB();
}

// ═══════════════════════════════════
// REPAIRS
// ═══════════════════════════════════
function fillRTech(sel) {
  const el = document.getElementById('fRTech');
  el.innerHTML = `<option value="">— بدون تعيين —</option>` +
    Object.values(DB.users||{}).filter(u=>u.role==='tech').map(u=>`<option value="${u.username}" ${u.username===sel?'selected':''}>${u.fullname}</option>`).join('');
}
function openNewRepair() {
  if (!can('repairs')) { toast('غير مصرح','e'); return; }
  editRepairId = null;
  document.getElementById('repMT').textContent = 'صيانة جديدة';
  ['fCN','fCP','fRModel','fRSymNotes','fRNotes'].forEach(id => document.getElementById(id).value='');
  document.getElementById('fRBrand').value = '';
  document.getElementById('fRPri').value   = 'normal';
  fillRTech('');
  document.getElementById('symList').innerHTML = SYMS.map(s=>
    `<span class="sym-opt" onclick="this.classList.toggle('sel')">${s}</span>`).join('');
  document.getElementById('repairModal').style.display = 'flex';
  setTimeout(() => document.getElementById('fCN').focus(), 200);
}
function openEditRepair(id) {
  const r = DB.repairs[id]; if (!r) return;
  editRepairId = id;
  document.getElementById('repMT').textContent = 'تعديل الصيانة';
  document.getElementById('fCN').value       = r.customerName||'';
  document.getElementById('fCP').value       = r.customerPhone||'';
  document.getElementById('fRBrand').value   = r.deviceBrand||'';
  document.getElementById('fRModel').value   = r.deviceModel||'';
  document.getElementById('fRSymNotes').value= r.symptomsNotes||'';
  document.getElementById('fRNotes').value   = r.notes||'';
  document.getElementById('fRPri').value     = r.priority||'normal';
  fillRTech(r.techId||'');
  document.getElementById('symList').innerHTML = SYMS.map(s=>
    `<span class="sym-opt ${(r.symptoms||[]).includes(s)?'sel':''}" onclick="this.classList.toggle('sel')">${s}</span>`).join('');
  document.getElementById('repairModal').style.display = 'flex';
}
async function saveRepair() {
  const cn = document.getElementById('fCN').value.trim();
  const cp = document.getElementById('fCP').value.trim();
  const rb = document.getElementById('fRBrand').value;
  const rm = document.getElementById('fRModel').value.trim();
  if (!cn) return toast('أدخل اسم الزبون','e');
  const syms   = [...document.querySelectorAll('#symList .sym-opt.sel')].map(el=>el.textContent);
  const now    = Date.now();
  const techId = document.getElementById('fRTech').value;
  if (editRepairId) {
    Object.assign(DB.repairs[editRepairId], { customerName:cn,customerPhone:cp,deviceBrand:rb,deviceModel:rm,symptoms:syms,symptomsNotes:document.getElementById('fRSymNotes').value,notes:document.getElementById('fRNotes').value,priority:document.getElementById('fRPri').value,techId,updatedAt:now });
    toast('تم التحديث','s');
  } else {
    const id = uid();
    DB.repairs[id] = { id,customerName:cn,customerPhone:cp,deviceBrand:rb,deviceModel:rm,symptoms:syms,symptomsNotes:document.getElementById('fRSymNotes').value,notes:document.getElementById('fRNotes').value,priority:document.getElementById('fRPri').value,techId,status:'new',progress:0,createdAt:now,updatedAt:now,by:CU.username };
    toast('✅ تم تسجيل الصيانة','s');
  }
  lsSave(); cm('repairModal'); render(); await p2FB();
}

function _fillProgModal(r) {
  document.getElementById('rpInfo').innerHTML = `<b>${r.customerName}</b> — ${r.deviceBrand||''} ${r.deviceModel||''}<br><span style="color:var(--tx3);font-size:11px">${r.customerPhone||''}</span>`;
  document.getElementById('fRPrice').value    = r.agreedPrice||0;
  document.getElementById('fRETA').value      = r.eta||'';
  document.getElementById('fRFaultEst').value = r.faultEstimated||'';
  document.getElementById('fRFaultConf').value= r.faultConfirmed||'';
  document.getElementById('fRProg').value     = r.progress||0;
  document.getElementById('rpv').textContent  = (r.progress||0)+'%';
  document.getElementById('fRProgNotes').value= r.progressNotes||'';
  document.getElementById('fRStatus').value   = r.status||'inprog';
}
function startRepair(id)  { progRepairId=id; const r=DB.repairs[id]; if(!r)return; _fillProgModal(r); document.getElementById('fRStatus').value='inprog'; document.getElementById('repProgModal').style.display='flex'; }
function openRepProg(id)  { progRepairId=id; const r=DB.repairs[id]; if(!r)return; _fillProgModal(r); document.getElementById('repProgModal').style.display='flex'; }
async function saveRepairProg() {
  const r = DB.repairs[progRepairId]; if (!r) return;
  r.agreedPrice   = parseInt(document.getElementById('fRPrice').value)||0;
  r.eta           = document.getElementById('fRETA').value;
  r.faultEstimated= document.getElementById('fRFaultEst').value;
  r.faultConfirmed= document.getElementById('fRFaultConf').value;
  r.progress      = parseInt(document.getElementById('fRProg').value)||0;
  r.progressNotes = document.getElementById('fRProgNotes').value;
  r.status        = document.getElementById('fRStatus').value;
  r.updatedAt     = Date.now();
  lsSave(); cm('repProgModal'); render(); await p2FB(); toast('تم حفظ التحديث','s');
}
async function markPaid(id) {
  if (!can('acc')) { toast('غير مصرح','e'); return; }
  const r = DB.repairs[id]; if (!r) return;
  if (!r.agreedPrice||r.agreedPrice<=0) {
    const pr = parseInt(prompt('أدخل المبلغ المقبوض (IQD):','0')||'0');
    if (!pr||pr<=0) return toast('أدخل مبلغاً صحيحاً','e');
    r.agreedPrice = pr;
  }
  if (!confirm(`تأكيد استلام ${IQD(r.agreedPrice)} من ${r.customerName}؟`)) return;
  const sid = uid();
  DB.sales[sid] = { id:sid, type:'repair', itemName:`صيانة: ${r.deviceBrand||''} ${r.deviceModel||''} — ${r.customerName}`, partCat:null, price:r.agreedPrice, note:r.faultConfirmed||'', by:CU.fullname, date:Date.now() };
  r.paid = true; r.paidAt = Date.now();
  lsSave(); render(); await p2FB(); toast(`💰 تم تسجيل ${IQD(r.agreedPrice)}`,'s');
}
async function delRepair(id) {
  if (!can('delete')) { toast('غير مصرح','e'); return; }
  if (!confirm('حذف هذه الصيانة؟')) return; delete DB.repairs[id]; lsSave(); render(); await p2FB(); toast('تم الحذف','i');
}

// ── QR & TRACKING ─────────────────
function showQR(id) {
  const r = DB.repairs[id]; if (!r) return;
  const base = location.origin + location.pathname.replace(/\/[^/]*$/, '/');
  const url  = `${base}track.html?id=${id}`;
  document.getElementById('qrURL').textContent = url;
  const qrEl = document.getElementById('qrCanvas');
  if (qrEl) qrEl.innerHTML = '';
  document.getElementById('qrModal').style.display = 'flex';
  setTimeout(() => drawQR(url), 100);
}
function drawQR(text) {
  const el = document.getElementById('qrCanvas'); if (!el) return;
  el.innerHTML = '';
  el.style.cssText = 'background:#fff;padding:10px;border-radius:8px;display:inline-block;min-width:180px;min-height:180px;box-sizing:border-box;';
  if (window.QRCode) {
    try { new window.QRCode(el, { text, width:180, height:180, colorDark:'#000000', colorLight:'#ffffff', correctLevel:window.QRCode.CorrectLevel.M }); return; }
    catch(e) { console.warn('QR error:', e); }
  }
  el.innerHTML = `<div style="font-family:monospace;font-size:9px;word-break:break-all;color:#000;padding:4px;line-height:1.5">${text}</div>`;
}
function copyQRURL()  { const u=document.getElementById('qrURL').textContent; navigator.clipboard.writeText(u).then(()=>toast('تم نسخ الرابط','s')).catch(()=>{ prompt('الرابط:',u); }); }
function shareQRURL() { const u=document.getElementById('qrURL').textContent; if(navigator.share){navigator.share({title:'تتبع صيانتك — ALMALIK',url:u}).catch(()=>{});}else{copyQRURL();} }

// ═══════════════════════════════════
// EXPORT / IMPORT
// ═══════════════════════════════════
function openExport() {
  if (!can('export') && CU.role!=='admin') { toast('غير مصرح','e'); return; }
  document.getElementById('expModal').style.display = 'flex';
}
function expJSON() {
  dl(new Blob([JSON.stringify(DB,null,2)],{type:'application/json'}),`almalik-backup-${ds()}.json`);
  cm('expModal');
}
function expCSV() {
  const rows = [['الموديل','الاسم','الفني','الحالة','سليمة','تالفة','ملاحظات']];
  Object.values(DB.devices||{}).forEach(d => {
    const m = (DB.models||{})[d.modelId]||{brand:'?',name:'?'};
    const g = (d.parts||[]).filter(p=>p.status==='good').map(p=>p.name).join('،');
    const b = (d.parts||[]).filter(p=>p.status==='bad').map(p=>p.name).join('،');
    const tech = d.techId ? Object.values(DB.users||{}).find(u=>u.username===d.techId) : null;
    rows.push([`${m.brand} ${m.name}`, d.name||'', tech?tech.fullname:'', d.done?'منجز':'معلق', g, b, (d.notes||'').replace(/\n/g,' ')]);
  });
  dl(new Blob(['\uFEFF'+rows.map(r=>r.map(v=>`"${v}"`).join(',')).join('\n')],{type:'text/csv;charset=utf-8'}),`almalik-${ds()}.csv`);
  cm('expModal');
}
function expPrint() {
  cm('expModal');
  const w = window.open('','_blank');
  const reps = Object.values(DB.repairs||{}), sales = Object.values(DB.sales||{});
  w.document.write(`<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>ALMALIK تقرير</title><style>body{font-family:Arial;padding:20px;font-size:12px}h1,h2{color:#1d4ed8;margin-bottom:8px}table{width:100%;border-collapse:collapse;margin-bottom:16px;font-size:11px}th,td{border:1px solid #e5e7eb;padding:5px 8px;text-align:right}th{background:#eff6ff;font-weight:700}@media print{button{display:none}}</style></head><body>
    <h1>📋 ALMALIK — تقرير شامل</h1>
    <p>${new Date().toLocaleDateString('ar-SA')} | أجهزة: ${Object.values(DB.devices||{}).length} | صيانات: ${reps.length} | مبيعات: ${IQD(sales.reduce((a,s)=>a+s.price,0))}</p>
    <h2>الأجهزة</h2><table><tr><th>الموديل</th><th>الاسم</th><th>الحالة</th><th>سليمة</th><th>تالفة</th></tr>${Object.values(DB.devices||{}).map(d=>{const m=(DB.models||{})[d.modelId]||{brand:'?',name:'?'};const g=(d.parts||[]).filter(p=>p.status==='good').map(p=>p.name).join('، ');const b=(d.parts||[]).filter(p=>p.status==='bad').map(p=>p.name).join('، ');return`<tr><td>${m.brand} ${m.name}</td><td>${d.name}</td><td>${d.done?'✅':'⏳'}</td><td style="color:green">${g}</td><td style="color:red">${b}</td></tr>`;}).join('')}</table>
    <h2>صيانات الزبائن</h2><table><tr><th>#</th><th>الزبون</th><th>الجهاز</th><th>الحالة</th><th>السعر</th></tr>${reps.map(r=>`<tr><td>#${r.id.slice(-5)}</td><td>${r.customerName}</td><td>${r.deviceBrand||''} ${r.deviceModel||''}</td><td>${{new:'جديدة',inprog:'نشطة',done:'مكتملة',cancelled:'ملغاة',waiting:'انتظار'}[r.status]||''}</td><td>${r.agreedPrice?IQD(r.agreedPrice):''}</td></tr>`).join('')}</table>
    <h2>إجمالي: ${IQD(sales.reduce((a,s)=>a+s.price,0))}</h2>
    <button onclick="window.print()" style="background:#1d4ed8;color:#fff;border:none;padding:9px 18px;border-radius:6px;cursor:pointer">🖨️ طباعة</button></body></html>`);
  w.document.close();
}
function handleImp(e) {
  const f = e.target.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = async ev => {
    try {
      const imp = JSON.parse(ev.target.result);
      if (!confirm('استيراد البيانات؟ ستُستبدل البيانات الحالية.')) return;
      const adminBk = DB.users.admin;
      DB = { users:{admin:adminBk}, models:{}, devices:{}, parts:{}, sales:{}, repairs:{}, ...imp };
      lsSave(); render(); await p2FB(); toast('تم الاستيراد بنجاح','s'); cm('expModal');
    } catch(e) { toast('ملف غير صالح','e'); }
  };
  r.readAsText(f); e.target.value = '';
}
function dl(blob, name) { const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),5000); }
