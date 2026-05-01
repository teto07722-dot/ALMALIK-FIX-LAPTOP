/* ═══════════════════════════════════
ALMALIK — pages.js  (no nested backticks)
═══════════════════════════════════ */

// ═══ DEVICES PAGE ════════════════
function rDevPage() {
var addBtn = can(‘add’) ? ‘<button class="abtn" onclick="openAddDev()">+ جهاز</button>’ : ‘’;
return ‘<div class="tbar">’
+ ‘<div class="sw"><span class="si-ico">🔍</span>’
+ ‘<input class="si-inp" type="search" id="searchField" placeholder="بحث..." value="' + esc(SQ) + '" oninput="handleSearch(this.value)" autocomplete="off"></div>’
+ ‘<div class="fbs">’
+ ‘<button class="fb ' + (devFlt==='all'?'active':'') + '" onclick="devFlt=\'all\';rPage()">الكل</button>’
+ ‘<button class="fb ' + (devFlt==='near'?'active':'') + '" onclick="devFlt=\'near\';rPage()" style="color:var(--cy)">🟢 قريب</button>’
+ ‘<button class="fb ' + (devFlt==='pending'?'active':'') + '" onclick="devFlt=\'pending\';rPage()">معلق</button>’
+ ‘<button class="fb ' + (devFlt==='done'?'active':'') + '" onclick="devFlt=\'done\';rPage()">✅</button>’
+ ‘<button class="fb ' + (devFlt==='crit'?'active':'') + '" onclick="devFlt=\'crit\';rPage()" style="color:var(--rd)">🚨</button>’
+ ‘</div>’ + addBtn + ‘</div>’
+ ‘<div id="pageResults">’ + rDevResults() + ‘</div>’;
}

function rDevResults() {
var devs = Object.values(DB.devices || {});
if (amod !== ‘all’)           devs = devs.filter(function(d){ return d.modelId === amod; });
if      (devFlt === ‘done’)   devs = devs.filter(function(d){ return d.done || devSt(d) === ‘done’; });
else if (devFlt === ‘pending’)devs = devs.filter(function(d){ return !d.done && devSt(d) !== ‘done’; });
else if (devFlt === ‘crit’)   devs = devs.filter(function(d){ var g=(d.parts||[]).filter(function(p){return p.status===‘good’;}).length; return g<=1&&!d.done&&(d.parts||[]).length>0; });
else if (devFlt === ‘near’)   devs = devs.filter(function(d){ var p=d.parts||[],g=p.filter(function(x){return x.status===‘good’;}).length; return p.length>1&&g/p.length>=0.7&&!d.done; });
if (SQ) devs = devs.filter(function(d){
var m=DB.models[d.modelId]||{brand:’’,name:’’};
return [m.brand+’ ‘+m.name, d.name||’’, d.notes||’’].concat((d.parts||[]).map(function(p){return p.name;})).join(’ ’).toLowerCase().indexOf(SQ) >= 0;
});
devs.sort(function(a,b){ var o={broken:0,partial:1,done:2}; var va=o[devSt(a)]; if(va===undefined)va=1; var vb=o[devSt(b)]; if(vb===undefined)vb=1; return va-vb; });

var byM = {};
devs.forEach(function(d){ if(!byM[d.modelId]) byM[d.modelId]=[]; byM[d.modelId].push(d); });
var modelParts = {};
Object.values(DB.parts||{}).filter(function(p){return p.modelId;}).forEach(function(p){
if(!modelParts[p.modelId]) modelParts[p.modelId]=[];
modelParts[p.modelId].push(p);
});

if (!Object.keys(byM).length) return ‘<div class="empty"><div class="ei">💻</div><h3>لا توجد أجهزة</h3><p>أضف موديلاً ثم أضف جهازاً</p></div>’;

var html = ‘’;
Object.keys(byM).forEach(function(mid) {
var mdevs = byM[mid];
var m = DB.models[mid] || {brand:’?’, name:’?’, size:’’, ver:’’};
var dc = mdevs.filter(function(d){return d.done||devSt(d)===‘done’;}).length;
var pct = mdevs.length ? Math.round(dc/mdevs.length*100) : 0;
var col = pct===100?‘var(–gn)’:pct>50?‘var(–cy)’:‘var(–yw)’;
var mps = modelParts[mid] || [];

```
html += '<div class="sh">'
  + '<span class="st">💻 ' + m.brand + ' ' + m.name + (m.size?' ('+m.size+'")':'') + '</span>'
  + (m.ver ? '<span class="bdg">'+m.ver+'</span>' : '')
  + '<span class="bdg">'+mdevs.length+'</span>'
  + '<span class="bdg g">'+dc+' منجز</span>'
  + '<span class="pct-l">'+pct+'%</span>'
  + (can('add') ? '<button class="btn bg" style="font-size:10px;padding:4px 8px" onclick="openAddDev(\''+mid+'\')">+ جهاز</button>' : '')
  + (can('parts') ? '<button class="btn bpu" style="font-size:10px;padding:4px 8px" onclick="openAddModelPart(\''+mid+'\')">+ قطعة</button>' : '')
  + '</div>';
html += '<div class="sp"><div class="spf" style="width:'+pct+'%;background:'+col+'"></div></div>';

if (mps.length) {
  html += '<div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:10px">';
  mps.forEach(function(p) {
    var bc = p.qty===0?'rgba(255,68,102,.4)':p.qty<=1?'rgba(255,68,102,.3)':p.qty<=(p.minQty||2)?'rgba(255,187,0,.3)':'var(--br2)';
    var b2 = p.qty===0?'r':p.qty<=1?'r':p.qty<=(p.minQty||2)?'y':'g';
    html += '<div style="background:var(--b2);border:1px solid '+bc+';border-radius:7px;padding:5px 9px;font-size:11px;display:flex;align-items:center;gap:6px">'
      + '<span>'+(CI[p.category]||'📦')+'</span>'
      + '<span style="font-weight:600">'+hl(p.name)+'</span>'
      + '<span class="bdg '+b2+'">'+p.qty+'</span>'
      + (p.sellPrice ? '<span style="color:var(--gn);font-size:10px;font-family:var(--mo)">'+IQD(p.sellPrice)+'</span>' : '')
      + (can('parts') ? '<button class="btn bpk" style="padding:2px 6px;font-size:9px" onclick="openWD(\''+p.id+'\')">سحب</button>' : '')
      + '</div>';
  });
  html += '</div>';
}

html += '<div class="grid">';
mdevs.forEach(function(d){ html += rDCard(d); });
html += '</div>';
```

});
return html;
}

function rDCard(d) {
var m = DB.models[d.modelId] || {brand:’’, name:’’};
var st = d.done ? ‘done’ : devSt(d);
var sLMap = {done:‘✅ منجز’, partial:‘⚠️ جزئي’, broken:‘❌ تالف’};
var sL = sLMap[st] || st;
var parts = d.parts || [];
var good = parts.filter(function(p){return p.status===‘good’;});
var bad  = parts.filter(function(p){return p.status===‘bad’;});
var used = parts.filter(function(p){return p.status===‘used’;});
var tot = parts.length, pct = tot ? Math.round(good.length/tot*100) : 0;
var col = pct===100?‘var(–gn)’:pct>50?‘var(–cy)’:‘var(–yw)’;
var isCrit = good.length===1 && !d.done && tot>0;
var isNear = !d.done && tot>1 && good.length/tot>=0.7 && !isCrit;
var tech = d.techId ? Object.values(DB.users||{}).find(function(u){return u.username===d.techId;}) : null;
var cardCls = d.done?‘done’:isCrit?‘crit’:isNear?‘near’:(pct<30&&tot>2&&!d.done?‘warn’:’’);
var stbLbl  = isCrit?‘🚨 حرج’:isNear?‘🟢 قريب’:sL;
var stbCls  = isCrit?‘crit’:isNear?‘near’:st;

function pt(p, cl) {
var oc = can(‘edit’) ? ‘cyclePart('’ + d.id + ‘','’ + p.name.replace(/\/g,’\\’).replace(/’/g,”\’”) + ‘')’ : ‘’;
return ‘<span class="pt '+cl+'" onclick="'+oc+'" title="'+esc(p.name)+'"><span class="pd"></span>’+hl(p.name)+’</span>’;
}

var html = ‘<div class="dc '+cardCls+'">’;
html += ‘<div class="dct"><div class="dcid">#’+d.id.slice(-4)+’</div><div class="dcn">’+hl(d.name||m.brand+’ ‘+m.name)+’</div><span class="stb '+stbCls+'">’+stbLbl+’</span></div>’;
html += ‘<div class="dcb">’;
if (tech) html += ‘<div class="tr"><span class="tdot"></span>فني: ‘+tech.fullname+’</div>’;
if (d.notes) html += ‘<div class="nr">📝 ‘+hl(d.notes.split(’\n’)[0])+’</div>’;
html += ‘<div class="pb-wrap"><div class="pb"><div class="pbf" style="width:'+pct+'%;background:'+col+'"></div></div><div class="pbl"><span>’+good.length+’/’+tot+’ سليمة</span><span>’+pct+’%</span></div></div>’;
if (good.length) { html += ‘<div class="psec"><div class="plbl">✅ سليمة (’+good.length+’)</div><div class="pgrid">’; good.forEach(function(p){html+=pt(p,‘good’);}); html += ‘</div></div>’; }
if (bad.length)  { html += ‘<div class="psec"><div class="plbl">❌ تالفة (’+bad.length+’)</div><div class="pgrid">’;  bad.forEach(function(p){html+=pt(p,‘bad’);});  html += ‘</div></div>’; }
if (used.length) { html += ‘<div class="psec"><div class="plbl">🔧 مستخدمة (’+used.length+’)</div><div class="pgrid">’; used.forEach(function(p){html+=pt(p,‘used’);}); html += ‘</div></div>’; }
html += ‘</div>’;
html += ‘<div class="dca">’;
if (can(‘edit’))   html += ‘<button class="btn bw" onclick="openTrans(\''+d.id+'\')">🔧 استخدم</button>’;
if (can(‘acc’))    html += ‘<button class="btn bpk" onclick="openSellFromDev(\''+d.id+'\')">💰 بيع</button>’;
if (can(‘edit’))   html += ‘<button class="btn '+(d.done?'bg':'bs')+'" onclick="toggleDone(\''+d.id+'\')">’+(d.done?‘↩’:‘✅’)+’</button>’;
if (can(‘edit’))   html += ‘<button class="btn bg" onclick="openEditDev(\''+d.id+'\')">✏️</button>’;
if (can(‘delete’)) html += ‘<button class="btn bd" onclick="delDev(\''+d.id+'\')">🗑</button>’;
html += ‘</div></div>’;
return html;
}

// ═══ REPAIRS PAGE ═════════════════
function rRepPage() {
function cnt(s){return Object.values(DB.repairs||{}).filter(function(r){return r.status===s;}).length;}
return ‘<div class="tbar">’
+ ‘<div class="sw"><span class="si-ico">🔍</span>’
+ ‘<input class="si-inp" type="search" id="searchField" placeholder="بحث بالاسم أو الجهاز..." value="' + esc(SQ) + '" oninput="handleSearch(this.value)" autocomplete="off"></div>’
+ ‘<div class="fbs">’
+ ‘<button class="fb '+(repFlt==='all'?'active':'')+'" onclick="repFlt=\'all\';rPage()">الكل</button>’
+ ‘<button class="fb '+(repFlt==='new'?'active':'')+'" onclick="repFlt=\'new\';rPage()">🆕 (’+cnt(‘new’)+’)</button>’
+ ‘<button class="fb '+(repFlt==='inprog'?'active':'')+'" onclick="repFlt=\'inprog\';rPage()">🔧 (’+cnt(‘inprog’)+’)</button>’
+ ‘<button class="fb '+(repFlt==='waiting'?'active':'')+'" onclick="repFlt=\'waiting\';rPage()">⏳ (’+cnt(‘waiting’)+’)</button>’
+ ‘<button class="fb '+(repFlt==='done'?'active':'')+'" onclick="repFlt=\'done\';rPage()">✅ (’+cnt(‘done’)+’)</button>’
+ ‘<button class="fb '+(repFlt==='cancelled'?'active':'')+'" onclick="repFlt=\'cancelled\';rPage()">❌</button>’
+ ‘</div>’
+ (can(‘repairs’) ? ‘<button class="abtn gn" onclick="openNewRepair()">+ صيانة</button>’ : ‘’)
+ ‘</div><div id="pageResults">’+rRepResults()+’</div>’;
}

function rRepResults() {
var reps = Object.values(DB.repairs||{});
if (repFlt !== ‘all’) reps = reps.filter(function(r){return r.status===repFlt;});
if (SQ) reps = reps.filter(function(r){return [r.customerName,r.customerPhone,r.deviceBrand,r.deviceModel].concat(r.symptoms||[]).join(’ ‘).toLowerCase().indexOf(SQ)>=0;});
reps.sort(function(a,b){var o={new:0,inprog:1,waiting:2,done:3,cancelled:4};var va=o[a.status];if(va===undefined)va=5;var vb=o[b.status];if(vb===undefined)vb=5;return va-vb||(b.createdAt-a.createdAt);});
if (!reps.length) return ‘<div class="empty"><div class="ei">🔧</div><h3>لا توجد صيانات</h3></div>’;
return reps.map(rRepCard).join(’’);
}

function rRepCard(r) {
var stL={new:‘🆕 جديدة’,inprog:‘🔧 نشطة’,waiting:‘⏳ انتظار’,done:‘✅ مكتملة’,cancelled:‘❌ ملغاة’};
var stC={new:‘rss-new’,inprog:‘rss-inprog’,waiting:‘rss-waiting’,done:‘rss-done’,cancelled:‘rss-cancelled’};
var tech = r.techId ? Object.values(DB.users||{}).find(function(u){return u.username===r.techId;}) : null;
var prog = r.progress||0;
var isLate = r.eta && Date.now()>new Date(r.eta).getTime() && r.status!==‘done’ && r.status!==‘cancelled’;
var progCol = prog===100?‘var(–gn)’:prog>60?‘var(–cy)’:‘var(–yw)’;
var html = ‘<div class="rc '+(r.status||'new')+'">’;
html += ‘<div class="rct">’
+ ‘<span class="rcnum">#’+r.id.slice(-5).toUpperCase()+’</span>’
+ ‘<span class="rcn">’+hl(r.customerName||’’)+’</span>’
+ ‘<span class="rcph">’+(r.customerPhone||’’)+’</span>’
+ (r.priority===‘urgent’?’<span style="font-size:11px">🔴 عاجل</span>’:r.priority===‘vip’?’<span style="font-size:11px">⭐ VIP</span>’:’’)
+ ‘<span class="rsstb '+(stC[r.status]||'rss-new')+'">’+(stL[r.status]||r.status)+’</span>’
+ ‘</div>’;
html += ‘<div class="rcb"><div class="rci">’
+ ‘<div class="rcf"><div class="lbl">الجهاز</div><div class="val">’+(r.deviceBrand||’’)+’ ‘+(r.deviceModel||’’)+’</div></div>’
+ ‘<div class="rcf"><div class="lbl">الفني</div><div class="val">’+(tech?tech.fullname:‘غير محدد’)+’</div></div>’
+ ‘<div class="rcf"><div class="lbl">الأعراض</div><div class="val" style="font-size:11px;color:var(--tx2)">’+(r.symptoms||[]).slice(0,2).join(’، ‘)+’</div></div>’
+ ‘<div class="rcf"><div class="lbl">السعر</div><div class="val" style="color:var(--gn)">’+(r.agreedPrice?IQD(r.agreedPrice):‘لم يُحدد’)+’</div></div>’
+ (r.eta?’<div class="rcf"><div class="lbl">الموعد</div><div class="val" style="color:'+(isLate?'var(--rd)':'var(--tx)')+'">’+r.eta+(isLate?’ ⚠️’:’’)+’</div></div>’:’’)
+ (r.faultConfirmed?’<div class="rcf"><div class="lbl">العطل</div><div class="val">’+r.faultConfirmed+’</div></div>’:’’)
+ ‘</div>’;
if (prog>0||r.status===‘inprog’) {
html += ‘<div><div class="rprog"><div class="rprogf" style="width:'+prog+'%;background:'+progCol+'"></div></div>’
+ ‘<div class="rprog-lbl"><span>’+(r.progressNotes||‘جاري العمل…’)+’</span><span>’+prog+’%</span></div></div>’;
}
html += ‘</div><div class="rca">’;
if (r.status===‘new’&&can(‘repairs’))         html += ‘<button class="btn bp" onclick="startRepair(\''+r.id+'\')">▶️ بدء</button>’;
if (r.status!==‘new’&&can(‘repairs’))         html += ‘<button class="btn bw" onclick="openRepProg(\''+r.id+'\')">📝 تحديث</button>’;
if (r.status===‘done’&&!r.paid&&can(‘acc’))   html += ‘<button class="btn bs" onclick="markPaid(\''+r.id+'\')">💰 قبض</button>’;
if (r.paid) html += ‘<span style="font-size:11px;color:var(--gn)">✅ مقبوض</span>’;
html += ‘<button class="btn bpu" onclick="showQR(\''+r.id+'\')">📲 QR</button>’;
html += ‘<button class="btn bg" onclick="openEditRepair(\''+r.id+'\')">✏️</button>’;
if (can(‘delete’)) html += ‘<button class="btn bd" onclick="delRepair(\''+r.id+'\')">🗑</button>’;
html += ‘</div></div>’;
return html;
}

// ═══ PARTS PAGE ═══════════════════
function rPartsPage() {
return ‘<div class="tbar">’
+ ‘<div class="sw"><span class="si-ico">🔍</span>’
+ ‘<input class="si-inp" type="search" id="searchField" placeholder="بحث في القطع..." value="'+esc(SQ)+'" oninput="handleSearch(this.value)" autocomplete="off"></div>’
+ (can(‘parts’) ? ‘<button class="abtn" onclick="openAddPart()">+ قطعة</button>’ : ‘’)
+ ‘</div><div id="pageResults">’+rPartsResults()+’</div>’;
}

function rPartsResults() {
var parts = Object.values(DB.parts||{}).filter(function(p){return !p.modelId;});
if (SQ) parts = parts.filter(function(p){return [p.name,p.category,p.compat||’’].join(’ ‘).toLowerCase().indexOf(SQ)>=0;});
var byC={};
parts.forEach(function(p){if(!byC[p.category])byC[p.category]=[];byC[p.category].push(p);});
if (!parts.length) return ‘<div class="empty"><div class="ei">🔩</div><h3>لا توجد قطع غيار</h3><p>اضغط + قطعة للإضافة</p></div>’;
var html=’’;
Object.keys(byC).forEach(function(cat){
html+=’<div class="sh"><span class="st">’+(CI[cat]||‘📦’)+’ ‘+cat+’</span><span class="bdg c">’+byC[cat].length+’</span></div><div class="grid2">’;
byC[cat].forEach(function(p){html+=rPCard(p);});
html+=’</div>’;
});
return html;
}

function rPCard(p) {
var pct=p.qty>0&&p.minQty?Math.min(100,Math.round(p.qty/(p.minQty*4)*100)):p.qty>0?80:0;
var col=p.qty===0?‘var(–rd)’:p.qty<=1?‘var(–rd)’:p.qty<=(p.minQty||2)?‘var(–yw)’:‘var(–gn)’;
var cls=p.qty===0?‘empty’:p.qty<=(p.minQty||2)?‘low’:’’;
var st=p.qty===0?‘⛔ نفدت’:p.qty<=1?‘⚠️ آخر قطعة’:p.qty<=(p.minQty||2)?‘⚠️ منخفض’:‘✅ متوفر’;
var html=’<div class="pc '+cls+'">’
+’<div class="pct2"><div class="pico">’+(CI[p.category]||‘📦’)+’</div>’
+’<div class="pinfo"><div class="pname">’+hl(p.name)+’</div>’
+’<div class="pcat">’+p.category+(p.compat?’ • ‘+p.compat:’’)+’</div>’
+(p.sellPrice?’<div style="font-size:10px;color:var(--gn)">بيع: ‘+IQD(p.sellPrice)+’</div>’:’’)
+’</div><div class="pqty"><div class="pqnum" style="color:'+col+'">’+p.qty+’</div><div class="pqunit">قطعة</div></div></div>’
+’<div class="pcb"><div class="psbar"><div class="psbf" style="width:'+pct+'%;background:'+col+'"></div></div>’
+’<div class="pcmeta"><span>حد: ‘+(p.minQty||2)+’</span><span>’+st+’</span></div></div>’
+’<div class="pca">’;
if(can(‘parts’))  html+=’<button class="btn bw" onclick="openWD(\''+p.id+'\')">📤 سحب/بيع</button>’;
if(can(‘parts’))  html+=’<button class="btn bs" onclick="addStock(\''+p.id+'\')">➕</button>’;
if(can(‘parts’))  html+=’<button class="btn bg" onclick="openEditPart(\''+p.id+'\')">✏️</button>’;
if(can(‘delete’)) html+=’<button class="btn bd" onclick="delPart(\''+p.id+'\')">🗑</button>’;
html+=’</div></div>’;
return html;
}

// ═══ SALES PAGE ═══════════════════
function rSalesPage() {
var total=Object.values(DB.sales||{}).reduce(function(a,s){return a+(s.price||0);},0);
return ‘<div class="tbar">’
+’<div class="sw"><span class="si-ico">🔍</span>’
+’<input class="si-inp" type="search" id="searchField" placeholder="بحث في المبيعات..." value="'+esc(SQ)+'" oninput="handleSearch(this.value)" autocomplete="off"></div>’
+’<span class="bdg p" style="padding:7px 11px;align-self:center">إجمالي: ‘+IQD(total)+’</span></div>’
+’<div id="pageResults">’+rSalesResults()+’</div>’;
}

function rSalesResults() {
var sales=Object.values(DB.sales||{}).sort(function(a,b){return b.date-a.date;});
if(SQ) sales=sales.filter(function(s){return [s.itemName,s.note,s.by].join(’ ‘).toLowerCase().indexOf(SQ)>=0;});
if(!sales.length) return ‘<div class="empty"><div class="ei">💰</div><h3>لا توجد مبيعات بعد</h3></div>’;
return sales.map(function(s){
return ‘<div class="log-item">’
+’<div class="log-dt">’+fmtD(s.date)+’</div>’
+’<div class="log-ico">’+(s.type===‘repair’?‘🔧’:(CI[s.partCat]||‘📦’))+’</div>’
+’<div class="log-body"><div class="log-title">’+hl(s.itemName||’’)+’</div>’
+’<div class="log-sub">’+(s.note||’’)+’ • ‘+(s.by||’’)+’</div></div>’
+’<div class="log-amt" style="color:var(--gn)">’+IQD(s.price||0)+’</div></div>’;
}).join(’’);
}

// ═══ ACCOUNTING PAGE ══════════════
function rAccPage() {
var sales=Object.values(DB.sales||{});
function sum(arr){return arr.reduce(function(a,s){return a+(s.price||0);},0);}
var html=’<div class="sh"><span class="st">📊 الحسابات</span></div><div class="acc-sum">’
+’<div class="acc-card"><div class="av" style="color:var(--gn)">’+IQD(sum(sales.filter(function(s){return isToday(s.date);})))+’</div><div class="al">مبيعات اليوم</div></div>’
+’<div class="acc-card"><div class="av" style="color:var(--cy)">’+IQD(sum(sales.filter(function(s){return isThisWeek(s.date);})))+’</div><div class="al">هذا الأسبوع</div></div>’
+’<div class="acc-card"><div class="av" style="color:var(--yw)">’+IQD(sum(sales.filter(function(s){return isThisMonth(s.date);})))+’</div><div class="al">هذا الشهر</div></div>’
+’<div class="acc-card"><div class="av" style="color:var(--pu)">’+IQD(sum(sales))+’</div><div class="al">الإجمالي الكلي</div></div>’
+’<div class="acc-card"><div class="av" style="color:var(--gn)">’+IQD(sum(sales.filter(function(s){return s.type===‘repair’;})))+’</div><div class="al">إيراد صيانات</div></div>’
+’<div class="acc-card"><div class="av" style="color:var(--cy)">’+IQD(sum(sales.filter(function(s){return s.type!==‘repair’;})))+’</div><div class="al">إيراد قطع</div></div>’
+’</div><div class="sh"><span class="st">سجل المبيعات</span><span class="bdg">’+sales.length+’</span></div>’;
if(!sales.length){html+=’<div class="empty"><h3>لا توجد مبيعات</h3></div>’;return html;}
sales.sort(function(a,b){return b.date-a.date;}).forEach(function(s){
html+=’<div class="log-item"><div class="log-dt">’+fmtD(s.date)+’</div>’
+’<div class="log-ico">’+(s.type===‘repair’?‘🔧’:(CI[s.partCat]||‘📦’))+’</div>’
+’<div class="log-body"><div class="log-title">’+(s.itemName||’’)+’</div>’
+’<div class="log-sub">’+(s.note||’’)+’ • ‘+(s.by||’—’)+’</div></div>’
+’<div class="log-amt" style="color:var(--gn)">’+IQD(s.price||0)+’</div></div>’;
});
return html;
}

// ═══ ALERTS PAGE ══════════════════
function rAlertsPage() {
var A=getAlerts();
var html=’<div class="sh"><span class="st">🔔 التنبيهات</span><span class="bdg r">’+A.length+’</span></div>’;
if(!A.length){html+=’<div class="empty"><div class="ei">✅</div><h3>كل شيء على ما يرام</h3></div>’;return html;}
A.forEach(function(a){
var cls=a.type===‘crit’?‘crit’:a.type===‘near’?‘near’:a.type===‘info’?‘info’:’’;
html+=’<div class="ai '+cls+'"><div class="ai-ico">’+a.ico+’</div>’
+’<div class="ai-body"><div class="ai-title">’+a.title+’</div><div class="ai-sub">’+a.sub+’</div></div>’
+(a.devId?’<button class="btn bg" style="font-size:10px" onclick="amod=\'all\';devFlt=\'all\';showTab(\'devices\')">عرض</button>’:’’)
+(a.repId?’<button class="btn bg" style="font-size:10px" onclick="showTab(\'repairs\')">عرض</button>’:’’)
+’</div>’;
});
return html;
}

// ═══ USERS PAGE ═══════════════════
function rUsersPage() {
if(!CU||CU.role!==‘admin’) return ‘<div class="empty"><h3>غير مصرح</h3></div>’;
var html=’<div class="sh"><span class="st">👥 إدارة المستخدمين</span><span class="bdg">’+Object.values(DB.users||{}).length+’</span>’
+’<button class="abtn" style="margin-right:auto" onclick="openAddUser()">+ مستخدم</button></div>’;
Object.values(DB.users||{}).forEach(function(u){
var isA=u.role===‘admin’, p=u.perms||{};
html+=’<div class="uc">’
+’<div class="uav2" style="background:'+(isA?'rgba(0,212,255,.12)':'rgba(0,255,136,.1)')+';color:'+(isA?'var(--cy)':'var(--gn)')+'">’+(u.fullname||’?’)[0]+’</div>’
+’<div class="ui"><div class="un">’+u.fullname+’ <span class="chip '+(isA?'adm':'tch')+'">’+(isA?‘أدمن’:‘فني’)+’</span></div>’
+’<div class="ur">@’+u.username+’</div>’;
if(!isA) html+=’<div class="uperm">’
+’<span class="ptg '+(p.add?'pton':'ptoff')+'">إضافة</span>’
+’<span class="ptg '+(p.edit?'pton':'ptoff')+'">تعديل</span>’
+’<span class="ptg '+(p.delete?'pton':'ptoff')+'">حذف</span>’
+’<span class="ptg '+(p.parts?'pton':'ptoff')+'">قطع</span>’
+’<span class="ptg '+(p.repairs?'pton':'ptoff')+'">صيانة</span>’
+’<span class="ptg '+(p.acc?'pton':'ptoff')+'">حسابات</span></div>’;
html+=’</div><div style="display:flex;gap:4px">’;
if(u.username!==‘admin’){
html+=’<button class="btn bg" onclick="openEditUser(\''+u.username+'\')">✏️</button>’;
html+=’<button class="btn bd" onclick="delUser(\''+u.username+'\')">🗑</button>’;
}
html+=’</div></div>’;
});
return html;
}