
var HAS_GAS=(typeof google!=='undefined'&&google.script&&google.script.run);
var A={classes:[],rubric:[],config:null,curDetail:null,cls:{dash:'',submit:'',comment:'',roster:'',review:'',inquiry:'',fitness:'',reading:''}};

function go(name){
  setTimeout(paintBadges,0);                       // [0.58.0] 화면을 옮길 때마다 다시 센다
  document.querySelectorAll('.scr').forEach(function(s){s.classList.remove('on')});
  document.getElementById('s-'+name).classList.add('on');
  document.querySelectorAll('.side button').forEach(function(b){b.classList.toggle('on',b.dataset.t===name)});
  if(name==='dash')loadDash();
  if(name==='comment')loadCommentList();
  if(name==='detail')loadRoster();
  if(name==='report')renderRptPal();
  if(name==='submit')loadSubmissions();
  if(name==='fitness'){loadFitStatus();ftTimer(true);} else ftTimer(false);   // [0.46.0] 탭을 벗어나면 폴링 중단
  if(name==='reading')loadReadingStatus();
  if(name==='wstats')loadWStats();
  if(name==='greet')loadGreet();
  if(name==='review')loadReview();
  if(name==='inquiry')loadInquiry();
  if(name==='settings'){loadSettings();loadMasterStatus();loadWsTrigger();loadPhrases();}
  if(name==='notice'){loadNotices();ntBar();}
  if(name==='tools'){loadAIStatus();loadDemoStamp();rtShow();}
}
var NTSTAT={};
function loadNotices(){
  call('adminGetSaveStamps',[],function(s){if(s)showSaved('saved-notice',s.notice,false);});
  call('adminNoticeStats',[],function(st){NTSTAT=st||{};renderNoticeStats();});
  call('adminGetNotices',[],function(list){var html='';
    (list||[]).forEach(function(n){
      html+='<div class="card" data-nid="'+(n.공지ID||'')+'"><div class="row" style="justify-content:space-between"><b>'+esc(n.제목)+'</b><span class="muted" style="font-size:12px">'+(n.등록일시||'')+'</span></div>'
        +'<p style="margin:8px 0 10px;white-space:pre-wrap">'+esc(n.내용)+'</p>'
        +'<div class="ntstat" style="margin-bottom:10px"></div>'
        +'<button class="btn danger sm" onclick="delNotice('+n.row+')">삭제</button></div>';});
    document.getElementById('nt-list').innerHTML=html||'<p class="muted">등록된 공지가 없습니다.</p>';
    renderNoticeStats();});
}
/* 공지별 읽음 현황 + 안 읽은 학생 명단 */
function renderNoticeStats(){
  document.querySelectorAll('#nt-list .card').forEach(function(c){
    var id=c.getAttribute('data-nid'), box=c.querySelector('.ntstat');
    if(!box)return;
    var s=NTSTAT[id];
    if(!s){box.innerHTML='<span class="muted" style="font-size:12px">읽음 집계 준비 중</span>';return;}
    var pct=s.전체?Math.round(s.읽음/s.전체*100):0;
    box.innerHTML='<span class="pill ok">읽음 '+s.읽음+'</span> '
      +'<span class="pill '+(s.미읽음명단.length?'no':'wait')+'">안 읽음 '+s.미읽음명단.length+'</span> '
      +'<span class="muted" style="font-size:12px">전체 '+s.전체+'명 · '+pct+'%</span>'
      +(s.미읽음명단.length?' <button class="btn sec sm" onclick="toggleUnread(this)">명단 보기</button>'
        +'<div class="unread" style="display:none;margin-top:8px;background:var(--bg);border-radius:10px;padding:9px 11px;font-size:12.5px">'
        +s.미읽음명단.map(function(u){return u.학번+' '+esc(u.이름)+(u.반?'('+u.반+'반)':'');}).join(' · ')+'</div>':'');
  });
}
function toggleUnread(btn){
  var d=btn.parentNode.querySelector('.unread');
  if(!d)return;
  var open=d.style.display!=='none';
  d.style.display=open?'none':'block';
  btn.textContent=open?'명단 보기':'명단 숨기기';
}
/* ---- 공지 작성 도구: 번호·체크·기호 삽입 + 들여쓰기 ---- */
var NT_NUM=['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟'];
var NT_CHK=['☑️','✅','✔️','🟢','🔲','⭕','❌','⚠️'];
var NT_MARK=['📢','📌','🗓️','⏰','💪','🏃','🔥','⭐','👉','•','※','－'];
function ntBar(){
  var mk=function(id,arr){
    var el=document.getElementById(id); if(!el)return;
    el.innerHTML=arr.map(function(c){
      return '<button type="button" class="ntbtn" onclick="ntIns(&quot;'+c+' &quot;)">'+c+'</button>';}).join('');
  };
  mk('bar-num',NT_NUM); mk('bar-chk',NT_CHK); mk('bar-mark',NT_MARK);
  var st=document.getElementById('bar-stk');
  if(st)st.innerHTML=STK.map(function(s){
    return '<button type="button" class="ntbtn stkbtn" title="'+s.n+'" onclick="ntIns(&quot;:'+s.k+': &quot;)">'
      +'<img src="'+STK_BASE+'st-'+s.k+'.png" alt="'+s.n+'"></button>';}).join('');
}
/* [0.53.0] 아무 입력칸의 커서 위치에 넣기 (문의 답변 등) */
function insAt(id,txt){
  var t=document.getElementById(id); if(!t)return;
  var s0=t.selectionStart||t.value.length, e0=t.selectionEnd||s0;
  t.value=t.value.slice(0,s0)+txt+t.value.slice(e0);
  t.focus(); t.selectionStart=t.selectionEnd=s0+txt.length;
}
/* 커서 위치에 넣기 */
function ntIns(txt){
  var t=document.getElementById('nt-body');
  var s=t.selectionStart, e=t.selectionEnd;
  t.value=t.value.slice(0,s)+txt+t.value.slice(e);
  var p=s+txt.length; t.focus(); t.setSelectionRange(p,p);
}
/* 커서가 있는 줄(또는 선택 범위의 모든 줄)에 들여쓰기 적용 */
function ntIndent(dir){
  /* dir: 1=들여쓰기 5칸, -1=내어쓰기 5칸, 0=모두 지우기 (선택한 줄 전체에 적용) */
  var t=document.getElementById('nt-body'), v=t.value, N=String.fromCharCode(10), SP='     ';   // 5칸
  var s=t.selectionStart, e=t.selectionEnd;
  var ls=v.lastIndexOf(N,s-1)+1;
  var le=v.indexOf(N,e); if(le<0)le=v.length;
  var body=v.slice(ls,le).split(N).map(function(line){
    if(dir===0) return line.replace(/^[ 　	]+/,'');
    if(dir>0)   return SP+line;
    var m=line.match(/^[ 　	]+/);                 // 앞쪽 공백에서 5칸만 덜어냄
    if(!m) return line;
    return m[0].slice(0,Math.max(0,m[0].length-5))+line.slice(m[0].length);
  }).join(N);
  t.value=v.slice(0,ls)+body+v.slice(le);
  t.focus(); t.setSelectionRange(ls, ls+body.length);   // 연속으로 누를 수 있게 선택 유지
}

/* 학생 앱에서 보이는 모습 그대로 미리보기 */
function ntPreview(){
  var t=(document.getElementById('nt-title').value||'').trim();
  var b=document.getElementById('nt-body').value||'';
  if(!t&&!b){toast('제목이나 내용을 입력하세요');return;}
  var box=document.getElementById('nt-prev');
  box.innerHTML='<div class="phone"><div class="ph-bar"></div><div class="ph-in">'
    +'<div class="ph-h">공지사항</div>'
    +'<div class="ph-card"><div class="ph-row"><b>'+esc(t||'(제목 없음)')+'</b>'
    +'<span class="ph-new">새 공지</span></div>'
    +'<div class="ph-date">'+new Date().toISOString().slice(0,10)+'</div>'
    +'<div class="ph-body">'+emoHtml(b)+'</div></div></div></div>';
  box.style.display='block';
}
function ntPreviewClose(){document.getElementById('nt-prev').style.display='none';}

function addNotice(){var t=document.getElementById('nt-title').value.trim();if(!t){toast('제목을 입력하세요');return;}
  call('adminAddNotice',[t,document.getElementById('nt-body').value],function(r){toast('공지 등록됨');
    document.getElementById('nt-title').value='';document.getElementById('nt-body').value='';
    showSaved('saved-notice',r&&r.savedAt,true);loadNotices();});}
function delNotice(row){call('adminDeleteNotice',[row],function(){toast('삭제됨');loadNotices();});}
function toast(m){var t=document.getElementById('toast');t.textContent=m;t.classList.add('on');setTimeout(function(){t.classList.remove('on')},2000);}
function call(fn,args,cb){
  if(!HAS_GAS){cb&&cb(mock(fn,args));return;}
  var r=google.script.run.withSuccessHandler(function(x){cb&&cb(x)}).withFailureHandler(function(e){toast('오류: '+e.message)});
  r[fn].apply(r,args||[]);
}
function run(fn,msg){call(fn,[],function(){toast(msg);if(fn==='setupAllSheets_')initClasses();});}

/* ---- 대시보드 ---- */
/* 반 선택 팔레트 (드롭다운 대체). A.cls[키]에 현재 선택 반을 보관 */
var PALS=[{id:'pal-dash',key:'dash',cb:'loadDash'},
          {id:'pal-submit',key:'submit',cb:'loadSubmissions'},
          {id:'pal-comment',key:'comment',cb:'loadCommentList'},
          {id:'pal-roster',key:'roster',cb:'loadRoster'},
          {id:'pal-review',key:'review',cb:'loadReview'},
          {id:'pal-inquiry',key:'inquiry',cb:'loadInquiry'},
          {id:'pal-fitness',key:'fitness',cb:'loadFitStatus'},
          {id:'pal-reading',key:'reading',cb:'loadReadingStatus'},
];
function renderPal(p){
  var box=document.getElementById(p.id);if(!box)return;
  var cur=A.cls[p.key]||'';
  var html='<button class="'+(cur===''?'on':'')+'" onclick="pickClass(&quot;'+p.key+'&quot;,&quot;&quot;)">전체 반</button>';
  (A.classes||[]).forEach(function(c){
    html+='<button class="'+(String(cur)===String(c)?'on':'')+'" onclick="pickClass(&quot;'+p.key+'&quot;,&quot;'+c+'&quot;)">'+c+'반</button>';});
  box.innerHTML=html;
}
function renderAllPals(){PALS.forEach(renderPal);}
function pickClass(key,c){
  A.cls[key]=c;
  PALS.forEach(function(p){if(p.key===key){renderPal(p);window[p.cb]();}});
}
/* 각 화면이 현재 선택된 반을 읽어가는 창구 */
function clsOf(key){return A.cls[key]||'';}

function initClasses(){
  call('adminGetClasses',[],function(cs){A.classes=cs||[];renderAllPals();});
}
function loadDash(){
  var cls=clsOf('dash');
  call('adminGetClassSummary',[cls],function(d){
    if(!d)return;A.config=d.config;applyBrand(d.config);setVerFoot(d.config);
    document.getElementById('dash-sub').textContent=(d.config.학교명||'')+' · '+(d.config.평가명||'')+' '+(d.config.학년도||'');
    var done=d.학생.filter(function(s){return s.성취율>=100}).length;
    document.getElementById('dash-stats').innerHTML=
      st('학생 수',d.학생수)+st('평균 성취율',d.평균성취율+'%')
      +st('점수 산출',d.학생.length+'명')+st('반',cls?cls+'반':'전체');
    var body='';d.학생.forEach(function(s){
      body+='<tr><td class="name">'+s.이름+'</td><td>'+s.학번+'</td>'
        +s.주차현황.map(function(w){return '<td>'+pill(w)+'</td>'}).join('')
        +'<td><b>'+s.성취율+'%</b></td><td><b style="color:var(--primary-dark)">'+s.점수+'</b></td>'
        +'<td><span class="link" onclick="openDetail(\''+s.학번+'\')">상세</span></td></tr>';
    });
    document.getElementById('dash-body').innerHTML=body||'<tr><td colspan="9" class="muted" style="padding:24px">명단이 없습니다. 운영 도구에서 시트 생성 후 명단을 입력하세요.</td></tr>';
  });
}
function pill(state){var m={'달성':'ok','진행':'go','미달':'no','예정':'wait'};return '<span class="pill '+(m[state]||'wait')+'">'+state+'</span>';}
function st(l,v){return '<div class="stat"><div class="v">'+v+'</div><div class="l">'+l+'</div></div>';}

/* ---- 학생 상세 ---- */
function openDetail(sid){go('detail');A.curDetail=sid;renderRoster();call('adminGetStudentDetail',[sid],function(d){
  A.curDetail=d;document.getElementById('detail-empty').style.display='none';
  var b=document.getElementById('detail-body');b.style.display='block';
  var sc=d.점수;
  var ex=d.운동기록.map(function(r){return '<div style="border-bottom:1px solid var(--divider);padding:8px 0">'
    +'<div class="row" style="justify-content:space-between">'
    +'<span>'+r.날짜+' · '+r.종류+' '+pnPill(r.파트너)+' <span class="muted">'+(r.내용||'')+'</span></span>'
    +(r.사진?'<span class="link" onclick="lbOpen(&quot;&quot;,&quot;'+esc(r.사진)+'&quot;)">📷 사진</span>':'')+'</div>'
    +(r.성찰?'<div style="background:var(--primary-tint);border-radius:10px;padding:7px 11px;font-size:13px;margin-top:6px">✍️ '+esc(r.성찰)+'</div>':'')
    +'</div>'}).join('')||'<p class="muted">기록 없음</p>';
  var inb=d.인바디.length?'<table><thead><tr><th>측정일</th><th>주차</th><th>체중</th><th>체지방률</th><th>근육량</th><th>내장</th></tr></thead><tbody>'
    +d.인바디.map(function(r){return '<tr><td>'+r.측정일+'</td><td>'+r.주차+'</td><td>'+r.체중+'</td><td>'+r.체지방률+'</td><td>'+r.근육량+'</td><td>'+r.내장지방+'</td></tr>'}).join('')+'</tbody></table>':'<p class="muted">측정 없음</p>';
  var rf=d.성찰.map(function(r){return '<div style="border-bottom:1px solid var(--divider);padding:10px 0"><b>'+r.주차+'주차</b> <span class="muted">'+r.작성일+'</span><p style="margin:6px 0">'+esc(r.내용)+'</p>'
    +(r.교사코멘트?'<div style="background:var(--primary-tint);border-radius:10px;padding:8px 12px;font-size:13px">💬 '+esc(r.교사코멘트)+'</div>':'')+'</div>'}).join('')||'<p class="muted">성찰 없음</p>';
  b.innerHTML='<div class="card"><div class="row" style="justify-content:space-between"><div><h3 style="margin:0">'+d.학생.이름+' <span class="muted">'+d.학생.학번+' · '+(d.학생.반||'')+'반</span></h3></div><span class="badge">성취율 '+sc.성취율+'%</span></div></div>'
    +'<div class="two"><div class="card"><h3 style="margin-top:0">운동 인증 내역</h3>'+ex+'</div>'
    +'<div class="card"><h3 style="margin-top:0">점수</h3>'
      +'<p>운동 달성률 <b>'+sc.운동달성률+'%</b> · 정시성 <b>'+sc.정시성+'%</b></p>'
      +'<p style="font-size:22px;font-weight:800">최종 성취율 '+sc.성취율+'% → <span style="color:var(--primary-dark)">'+sc.점수+' / '+sc.급간배점+'점</span></p>'
      +'<label>수동 보정 점수(선택)</label><div class="row"><input id="override" placeholder="'+sc.점수+'" style="flex:1"><button class="btn sm" onclick="toast(\'보정 저장은 다음 버전에서 지원\')">저장</button></div></div></div>'
    +'<div class="card"><h3 style="margin-top:0">체력측정 <span class="muted" style="font-size:12px">6회차 · PAPS 자동판정</span></h3><div class="tbl-wrap">'+renderFitAdmin(d.체력)+'</div></div>'
    +'<div class="card"><h3 style="margin-top:0">인바디 추이 <span class="muted" style="font-size:12px">(구버전 사진 기록)</span></h3><div class="tbl-wrap">'+inb+'</div></div>'
    +'<div class="card"><h3 style="margin-top:0">성찰일지</h3>'+rf+'</div>';
});}

/* ---- 4주 종합 보고서 (A4 2쪽 · 개인/학급/학년) ---- */
var RPT={scope:'class', value:''};
function renderRptPal(){
  var el=document.getElementById('pal-rpt'); if(!el)return;
  var html='<button class="'+(RPT.scope==='all'?'on':'')+'" onclick="rptScope(&quot;all&quot;,&quot;&quot;)">학년 전체</button>';
  (A.classes||[]).forEach(function(c){
    html+='<button class="'+(RPT.scope==='class'&&String(RPT.value)===String(c)?'on':'')
      +'" onclick="rptScope(&quot;class&quot;,&quot;'+c+'&quot;)">'+c+'반</button>';});
  el.innerHTML=html;
}
function rptScope(sc,v){RPT.scope=sc;RPT.value=v;renderRptPal();
  document.getElementById('rpt-sid').value='';
  toast(sc==='all'?'학년 전체':v+'반'+' 선택됨');}
function rptByStudent(){
  var sid=document.getElementById('rpt-sid').value.trim();
  if(!sid){toast('학번을 입력하세요');return;}
  RPT.scope='student';RPT.value=sid;renderRptPal();openReport();
}
function openReport(){
  toast('보고서를 만드는 중…');
  call('adminGetReport',[RPT.scope,RPT.value],function(d){
    if(!d||!d.학생||!d.학생.length){toast('해당하는 학생이 없습니다');return;}
    var w=window.open('','_blank');
    if(!w){toast('팝업이 차단됐어요. 팝업 허용 후 다시 눌러주세요');return;}
    w.document.write(reportHtml(d));
    w.document.close();
  });
}

/* 보고서 HTML (인쇄·PDF 저장용) */
function reportHtml(d){
  var css=''
   +'@page{size:A4 portrait;margin:0}'
   +'*{box-sizing:border-box;margin:0;padding:0}'
   +'body{font-family:Pretendard,-apple-system,"Malgun Gothic",sans-serif;color:#17211b;background:#dfe4de;'
   +'-webkit-print-color-adjust:exact;print-color-adjust:exact}'
   +'.pg{width:210mm;height:297mm;background:#fff;padding:12mm 13mm 14mm;margin:8px auto;position:relative;'
   +'overflow:hidden;page-break-after:always;box-shadow:0 6px 26px rgba(0,0,0,.13)}'
   +'.pg:last-child{page-break-after:auto}'
   +'.hd{display:flex;justify-content:space-between;align-items:center;border-bottom:2.5px solid #5FAE00;padding-bottom:9px}'
   +'.hd .t{font-size:20px;font-weight:800}.hd .s{font-size:11px;color:#5b6b60;margin-top:2px}'
   +'.hd .who{text-align:right;font-size:12px;color:#2b3a30}.hd .who b{font-size:17px}'
   +'h2{font-size:13.5px;font-weight:800;color:#4A8A00;margin:13px 0 7px;display:flex;align-items:center;gap:6px}'
   +'h2::before{content:"";width:4px;height:14px;background:#5FAE00;border-radius:2px}'
   +'table{width:100%;border-collapse:collapse;font-size:11px}'
   +'th,td{border:1px solid #e6ebe6;padding:5px 6px;text-align:center}'
   +'th{background:#EDFAD6;color:#4A8A00;font-weight:800}'
   +'td.l{text-align:left}.ok{color:#4A8A00;font-weight:800}.no{color:#c0392b}'
   +'.stat{display:flex;gap:8px;margin:8px 0 2px}'
   +'.stat div{flex:1;background:#f6f8f5;border:1px solid #e6ebe6;border-radius:9px;padding:8px 6px;text-align:center}'
   +'.stat b{display:block;font-size:19px;color:#4A8A00}.stat span{font-size:10px;color:#5b6b60}'
   +'.rf{border:1px solid #e6ebe6;border-radius:9px;padding:8px 10px;margin-bottom:6px}'
   +'.rf .w{font-size:11px;font-weight:800;color:#4A8A00}'
   +'.rf p{font-size:10.8px;line-height:1.55;margin-top:3px;white-space:pre-wrap}'
   +'.rf .c{background:#EDFAD6;border-radius:7px;padding:5px 8px;margin-top:5px;font-size:10.5px}'
   +'.ft{position:absolute;left:13mm;right:13mm;bottom:7mm;border-top:1px solid #f0f3f0;padding-top:5px;'
   +'font-size:9.5px;color:#8a978c;display:flex;justify-content:space-between}'
   +'.sign{margin-top:10px;border:1px dashed #c3ccc3;border-radius:9px;padding:9px 11px;font-size:10.5px;color:#5b6b60}'
   +'@media print{body{background:#fff}.pg{box-shadow:none;margin:0}.noprint{display:none}}'
   +'.noprint{position:fixed;top:12px;right:12px;z-index:9;display:flex;gap:8px}'
   +'.noprint button{height:38px;padding:0 16px;border:none;border-radius:10px;background:#5FAE00;color:#fff;'
   +'font-family:inherit;font-weight:700;font-size:14px;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.18)}'
   +'.noprint button.sec{background:#fff;color:#2b3a30;border:1.5px solid #dfe5df}';

  var body='<div class="noprint"><button onclick="window.print()">🖨️ 인쇄 · PDF 저장</button>'
    +'<button class="sec" onclick="window.close()">닫기</button></div>';

  d.학생.forEach(function(s){ body+=reportPages(d,s); });

  return '<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8">'
    +'<title>'+esc(d.평가명||'운동처방일지')+' 보고서</title>'
    +'<link href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css" rel="stylesheet">'
    +'<style>'+css+'</style></head><body>'+body+'</body></html>';
}

/* 보고서 — 운동 파트너 통계 (혼자 / 친구와 횟수 + 친구별 함께한 횟수) */
function reportPartners(pn){
  pn=pn||{};
  var 목록=pn.목록||[];
  var sum='<p style="font-size:11px;margin:0 0 4px"><b>혼자 '+(pn.혼자||0)+'회</b> · <b>친구와 '+(pn.함께||0)+'회</b>'
    +(pn.미기재?' <span style="color:#8a978c">· 미기재 '+pn.미기재+'회</span>':'')+'</p>';
  if(!목록.length)return sum+'<p style="font-size:11px;color:#8a978c;margin:0">친구와 함께한 기록이 없습니다.</p>';
  return sum+'<p style="font-size:11px;margin:0;line-height:1.9">'
    +목록.map(function(p){
      return '<span style="background:#EEE9FA;color:#5B4B9E;border-radius:99px;padding:2px 9px;font-weight:700;margin-right:5px">'
        +esc(p.이름)+' '+p.횟수+'회</span>';}).join('')+'</p>';
}

function reportPages(d,s){
  var head=function(pageNo){
    return '<div class="hd"><div><div class="t">'+esc(d.평가명||'운동처방일지')+' 결과 보고서</div>'
      +'<div class="s">'+esc(d.학교||'')+' · '+esc(d.학년도||'')+'학년도 · '+esc(d.기간||'')+'</div></div>'
      +'<div class="who"><b>'+esc(s.이름||'')+'</b><br>'+esc(s.학번)+(s.반?' · '+esc(s.반)+'반':'')+'</div></div>';
  };
  var foot=function(no){
    return '<div class="ft"><span>'+esc(d.학교||'')+' 체육과</span>'
      +'<span>'+esc(s.학번)+' '+esc(s.이름||'')+' · '+no+' / 2</span>'
      +'<span>출력 '+esc(d.출력일||'')+'</span></div>';
  };

  /* ---- 1쪽: 운동 실천 ---- */
  var wk='<table><tr><th>주차</th><th>운동일수</th><th>유산소</th><th>근력</th><th>달린거리</th><th>운동시간</th><th>평균 자각도</th><th>목표</th></tr>';
  s.주차.forEach(function(w){
    wk+='<tr><td><b>'+w.주차+'주</b></td><td>'+w.운동일수+'일</td><td>'+w.유산소일수+'일</td><td>'+w.근력일수+'일</td>'
      +'<td>'+(w.거리||0)+'km</td><td>'+(w.시간||0)+'분</td><td>'+(w.자각도||'—')+'</td>'
      +'<td class="'+(w.달성?'ok':'no')+'">'+(w.달성?'달성':'미달')+'</td></tr>';
  });
  wk+='</table>';

  var sc=s.점수||{};
  var p1='<div class="pg">'+head(1)
    +'<div class="stat"><div><b>'+s.총운동일+'</b><span>총 운동일수</span></div>'
    +'<div><b>'+s.달성주차+'/'+d.총주차+'</b><span>목표 달성 주차</span></div>'
    +'<div><b>'+(s.총거리||0)+'</b><span>총 달린 거리(km)</span></div>'
    +'<div><b>'+(s.총시간||0)+'</b><span>총 운동시간(분)</span></div></div>'
    +'<h2>주차별 운동 실천</h2>'+wk
    +'<p style="font-size:10px;color:#8a978c;margin-top:5px">※ 주간 목표 = 주 '+d.목표일수+'일 이상 운동, 그중 유산소 '+d.유산소필수+'일 이상</p>'
    +'<h2>함께 운동한 친구</h2>'+reportPartners(s.파트너)
    +'<h2>성취율과 점수</h2>'
    +'<table><tr><th>운동 달성률</th><th>제출 정시성</th><th>최종 성취율</th><th>점수</th></tr>'
    +'<tr><td>'+(sc.운동달성률!=null?sc.운동달성률+'%':'—')+'</td><td>'+(sc.정시성!=null?sc.정시성+'%':'—')+'</td>'
    +'<td><b>'+(sc.성취율!=null?sc.성취율+'%':'—')+'</b></td>'
    +'<td class="ok"><b>'+(sc.점수!=null?sc.점수:'—')+' / '+(sc.급간배점||d.총점)+'점</b></td></tr></table>'
    +'<h2>주차별 성찰</h2>';
  if(s.성찰 && s.성찰.length){
    s.성찰.forEach(function(r){
      p1+='<div class="rf"><span class="w">'+esc(r.주차)+'주차</span> <span style="font-size:10px;color:#8a978c">'+esc(r.작성일||'')+'</span>'
        +'<p>'+esc(r.내용||'')+'</p>'
        +(r.교사코멘트?'<div class="c"><b>선생님</b> '+esc(r.교사코멘트)+'</div>':'')+'</div>';
    });
  } else p1+='<p style="font-size:11px;color:#8a978c">작성한 성찰이 없습니다.</p>';
  p1+=foot(1)+'</div>';

  /* ---- 2쪽: 체력 변화 ---- */
  var rows=[
    ['악력(높은 손)','악력최고','kg'],['팔굽혀펴기','팔굽혀펴기','회'],['앉았다 일어나기','앉았다일어나기','회'],
    ['앞으로 굽히기','앞으로굽히기최고','cm'],['뒤로 젖히기','뒤로젖히기최고','cm'],
    ['신장','신장','cm'],['체중','체중','kg'],['BMI','BMI',''],
    ['체지방률','체지방률','%'],['골격근량','골격근량','kg'],['내장비만','내장비만','lv'],['W.H.R.','WHR','']
  ];
  var val=function(rec,k){
    if(!rec||!rec.있음)return null;
    var j=rec.판정||{}, v=(j[k]!==undefined&&j[k]!=='')?j[k]:rec[k];
    return (v===''||v==null)?null:v;
  };
  var ft='<table><tr><th style="text-align:left">측정 항목</th>';
  s.체력.forEach(function(f){ ft+='<th>'+esc(f.회차)+'</th>'; });
  ft+='<th>변화</th></tr>';
  rows.forEach(function(r){
    ft+='<tr><td class="l">'+r[0]+(r[2]?' <span style="color:#8a978c">('+r[2]+')</span>':'')+'</td>';
    var first=null,last=null;
    s.체력.forEach(function(f){
      var v=val(f,r[1]);
      if(v!=null){ if(first===null)first=Number(v); last=Number(v); }
      ft+='<td>'+(v==null?'<span style="color:#c3ccc3">–</span>':v)+'</td>';
    });
    var diff=(first!=null&&last!=null)?Math.round((last-first)*100)/100:null;
    ft+='<td>'+(diff==null?'–':(diff>0?'<span class="ok">+'+diff+'</span>':(diff<0?'<span style="color:#2f8cf0">'+diff+'</span>':'0')))+'</td></tr>';
  });
  ft+='</table>';

  var last=null; s.체력.forEach(function(f){ if(f.있음)last=f; });
  var grade='';
  if(last&&last.판정){
    var j=last.판정, g=function(x){return x?x.등급+'등급 ('+x.라벨+')':'—';};
    grade='<table><tr><th>악력</th><th>팔굽혀펴기</th><th>앞으로 굽히기</th><th>BMI 진단</th><th>체지방률</th><th>골격근량</th></tr>'
      +'<tr><td>'+g(j.악력)+'</td><td>'+g(j.팔굽혀펴기)+'</td><td>'+g(j.앞으로굽히기)+'</td>'
      +'<td>'+esc(j.BMI진단||'—')+'</td><td>'+esc(j.체지방률진단||'—')+'</td>'
      +'<td>'+esc(j.골격근량?j.골격근량.라벨:'—')+'</td></tr></table>';
  }

  var p2='<div class="pg">'+head(2)
    +'<h2>체력측정 6회차 변화</h2>'+ft
    +'<p style="font-size:10px;color:#8a978c;margin-top:5px">※ 변화 = 마지막 측정값 − 첫 측정값</p>'
    +(grade?'<h2>최종 회차 판정 <span style="font-weight:600;color:#8a978c;font-size:11px">(PAPS 중3 여학생 기준)</span></h2>'+grade:'')
    +'<h2>종합 의견</h2>'
    +'<div class="sign" style="min-height:26mm">담당 교사 의견</div>'
    +'<h2>학생 소감</h2>'
    +'<div class="sign" style="min-height:30mm">4주 동안의 운동을 마치며 (감상문)</div>'
    +'<div class="sign" style="margin-top:12px;border-style:solid;display:flex;justify-content:space-between">'
    +'<span>학부모 확인 ______________ (인)</span><span>담당 교사 ______________ (인)</span></div>'
    +foot(2)+'</div>';

  return p1+p2;
}

function rptPreviewClose(){document.getElementById('rpt-prev').style.display='none';}
/* 미리보기를 화면 가로폭에 꽉 차게 맞춘다 (A4 폭 794px 기준 배율 계산) */
function fitReport(){
  var box=document.getElementById('rpt-box'), f=document.getElementById('rpt-frame');
  if(!box||!f)return;
  var W=794, avail=(box.clientWidth||box.offsetWidth)-2;   // 테두리 2px 여유
  if(avail<100)return;
  var s=avail/W;
  var pages=2, pageH=1123, gap=16;                 // A4 297mm ≈ 1123px + 페이지 간격
  var contentH=pages*pageH+gap*(pages+1);
  f.style.height=contentH+'px';
  f.style.transform='scale('+s.toFixed(4)+')';
  box.style.height=Math.ceil(contentH*s)+'px';
}
window.addEventListener('resize',function(){ if(document.getElementById('rpt-box'))fitReport(); });
/* 개인 보고서 미리보기 — 관리자 화면 안에서 축소해서 보여준다 */
function rptPreview(){
  var sid=document.getElementById('rpt-sid').value.trim();
  if(!sid){toast('학번을 입력하세요');return;}
  var box=document.getElementById('rpt-prev');
  box.style.display='block';
  box.innerHTML='<p class="muted">보고서를 만드는 중…</p>';
  call('adminGetReport',['student',sid],function(d){
    if(!d||!d.학생||!d.학생.length){box.innerHTML='<p class="muted">해당 학번의 학생을 찾을 수 없습니다.</p>';return;}
    var html=reportHtml(d).replace(/<div class="noprint">[\s\S]*?<\/div>/,'');
    box.innerHTML='<div class="row" style="justify-content:space-between;margin-bottom:8px">'
      +'<b>'+esc(d.학생[0].학번)+' '+esc(d.학생[0].이름||'')+' 미리보기</b>'
      +'<span><button class="btn sm" onclick="rptByStudent()">🖨️ 인쇄 · PDF</button> '
      +'<button class="btn sec sm" onclick="rptPreviewClose()">닫기</button></span></div>'
      +'<div class="rptbox" id="rpt-box"><iframe id="rpt-frame" scrolling="no"></iframe></div>';
    var f=document.getElementById('rpt-frame');
    f.contentDocument.open(); f.contentDocument.write(html); f.contentDocument.close();
    fitReport();
  });
}

/* [0.49.0] 학생 상세 — 명렬에서 검색하거나 버튼으로 고른다 */
var RS=[];
function loadRoster(){
  call('adminGetRosterList',[clsOf('roster')],function(list){RS=list||[];renderRoster();});
}
function renderRoster(){
  var box=document.getElementById('rs-list'); if(!box)return;
  var q=String((document.getElementById('rs-q')||{}).value||'').trim().toLowerCase();
  var list=RS.filter(function(s){
    if(!q)return true;
    return String(s.학번).indexOf(q)>=0 || String(s.이름||'').toLowerCase().indexOf(q)>=0;
  });
  box.innerHTML=list.map(function(s){
    var on=(A.curDetail===s.학번);
    return '<button class="rsbtn'+(on?' on':'')+'" onclick="openDetail(&quot;'+s.학번+'&quot;)">'
      +'<b>'+s.학번+'</b> '+esc(s.이름||'')+'</button>';
  }).join('') || '<p class="muted" style="font-size:13px;margin:10px 0 0">찾는 학생이 없습니다.</p>';
  var c=document.getElementById('rs-cnt');
  if(c)c.textContent=q?(list.length+'명 찾음 · 전체 '+RS.length+'명'):('전체 '+RS.length+'명');
}

/* [0.49.0] 2026년 8월 14일 금요일 18:01 형식 */
var WD_K=['일','월','화','수','목','금','토'];
function fmtKDT(v,withTime){
  if(v===null||v===undefined||v==='')return '';
  var d=(v instanceof Date)?v:new Date(v);
  if(isNaN(d.getTime()))d=new Date(String(v).replace(/-/g,'/'));
  if(isNaN(d.getTime()))return String(v);
  var s=d.getFullYear()+'년 '+(d.getMonth()+1)+'월 '+d.getDate()+'일 '+WD_K[d.getDay()]+'요일';
  if(withTime)s+=' '+('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2);
  return s;
}
function n_(v){var x=Number(v);return (v===''||v===null||v===undefined||isNaN(x))?null:x;}
function r1_(x){return Math.round(x*100)/100;}
/* [0.49.0] 유산소 — 학생이 적은 값과 사진에서 읽은 값을 나란히, 다르면 차이까지 */
function cardioCompare(r){
  if(r.종류!=='유산소')return '';
  var sk=n_(r.거리), sm=n_(r.시간), ak=n_(r.분석거리), am=n_(r.분석시간);
  if(ak===null&&am===null)
    return '<div class="cmp"><span class="cl">사진 분석</span><span class="muted">분석 기록 없음 (직접 입력했거나 예전 기록)</span></div>';
  var dk=(sk!==null&&ak!==null)?r1_(sk-ak):null;
  var dm=(sm!==null&&am!==null)?r1_(sm-am):null;
  var same=((dk===null||dk===0)&&(dm===null||dm===0));
  var diff='';
  if(!same){
    var ps=[];
    if(dk!==null&&dk!==0)ps.push((dk>0?'+':'')+dk+'km');
    if(dm!==null&&dm!==0)ps.push((dm>0?'+':'')+dm+'분');
    diff='<div class="cmp"><span class="cl">차이</span>'
        +'<span class="pill no">'+ps.join(' · ')+'</span> '
        +'<span class="muted" style="font-size:11.5px">학생이 적은 값이 사진보다 '
        +((dk!==null&&dk>0)||(dm!==null&&dm>0)?'큽니다':'작습니다')+'</span></div>';
  }
  return '<div class="cmpbox">'
    +'<div class="cmp"><span class="cl">학생 입력</span><b>'
      +(sk!==null?sk+'km':'-')+' · '+(sm!==null?sm+'분':'-')+'</b></div>'
    +'<div class="cmp"><span class="cl">사진 분석</span><b>'
      +(ak!==null?ak+'km':'-')+' · '+(am!==null?am+'분':'-')+'</b></div>'
    +(same?'<div class="cmp"><span class="cl">차이</span><span class="pill ok">일치</span></div>':diff)
    +'</div>';
}

/* ---- 제출 현황 (날짜별 → 학생 → 아코디언) ---- */
var SB={data:[],date:null,open:{}};
/* 드라이브 링크에서 파일ID를 뽑아 썸네일 주소로 바꾼다(선생님 계정에서 바로 보임) */
function driveThumb(url){
  var m=String(url||'').match(/[-\w]{25,}/);
  return m?('https://drive.google.com/thumbnail?id='+m[0]+'&sz=w640'):'';
}
function loadSubmissions(){
  var cls=clsOf('submit');
  document.getElementById('sb-body').innerHTML='<div class="card"><p class="muted">불러오는 중…</p></div>';
  call('adminGetSubmissions',[cls],function(list){
    SB.data=list||[];SB.open={};
    if(!SB.data.length){document.getElementById('sb-dates').innerHTML='';
      document.getElementById('sb-count').textContent='';
      document.getElementById('sb-body').innerHTML='<div class="card"><p class="muted">제출된 인증 기록이 없습니다.</p></div>';return;}
    var keep=null;SB.data.forEach(function(d){if(d.날짜===SB.date)keep=d.날짜;});
    SB.date=keep||SB.data[0].날짜;
    renderSbDates();renderSbBody();
  });
}
function renderSbDates(){
  var html='';
  SB.data.forEach(function(d){
    html+='<button class="btn '+(SB.date===d.날짜?'':'sec')+' sm" onclick="selSbDate(&quot;'+d.날짜+'&quot;)">'
      +d.날짜.slice(5).replace('-','/')+'('+d.요일+') <b>'+d.인원+'명</b></button>';});
  document.getElementById('sb-dates').innerHTML=html;
  document.getElementById('sb-count').textContent='총 '+SB.data.length+'일 제출 기록';
}
function selSbDate(d){SB.date=d;SB.open={};renderSbDates();renderSbBody();}
function toggleSb(sid){SB.open[sid]=!SB.open[sid];renderSbBody();}
function renderSbBody(){
  var day=null;SB.data.forEach(function(d){if(d.날짜===SB.date)day=d;});
  if(!day){document.getElementById('sb-body').innerHTML='';return;}
  var html='<div class="card"><div class="row" style="justify-content:space-between;margin-bottom:12px">'
    +'<h3 style="margin:0">'+fmtKDT(day.날짜)+' <span class="muted" style="font-size:13px">'+day.인원+'명 제출</span></h3>'
    +'<span><span class="pill ok">유산소 '+day.유산소인원+'</span> <span class="pill go">근력 '+day.근력인원+'</span></span></div>';
  day.학생.forEach(function(s){
    var opened=!!SB.open[s.학번];
    html+='<div style="border-top:1px solid var(--divider)">'
      +'<div class="row" style="justify-content:space-between;padding:10px 2px;cursor:pointer" onclick="toggleSb(&quot;'+s.학번+'&quot;)">'
      +'<span><b>'+s.학번+' '+esc(s.이름)+'</b> <span class="muted">'+(s.반?s.반+'반':'')+'</span>'
      +(s.확인필요?' <span class="pill no">⚠️ 확인 필요</span>':'')+'</span>'
      +'<span>'+(s.유산소?'<span class="pill ok">유산소 '+s.유산소+'</span> ':'')
      +(s.근력?'<span class="pill go">근력 '+s.근력+'</span> ':'')
      +'<span class="muted">'+(opened?'▲':'▼')+'</span></span></div>';
    if(opened){
      html+='<div style="background:var(--bg);border-radius:12px;padding:12px 14px;margin:0 0 10px">';
      s.기록.forEach(function(r){
        var thumb=driveThumb(r.사진);
        var sub=(r.종류==='유산소'&&(r.거리||r.시간))?((r.거리?r.거리+'km ':'')+(r.시간?r.시간+'분':'')):(r.내용||'');
        html+='<div style="padding:8px 0">'
          +'<div class="row" style="justify-content:space-between"><span><span class="pill '+(r.종류==='유산소'?'ok':'go')+'">'+r.종류+'</span> '+pnPill(r.파트너)+' '+esc(sub)+'</span>'
          +'<span class="muted" style="font-size:11.5px">'+esc(fmtKDT(r.입력시각,true))+' 제출</span></div>'
          +(r.내용&&r.종류==='유산소'?'<div class="muted" style="font-size:12px;margin-top:3px">'+esc(r.내용)+'</div>':'')
          +cardioCompare(r)
          +(r.검사?'<div style="margin-top:6px;font-size:12px">'+chkBadge(r)+' <span class="muted">'+esc(r.검사메모||'')+'</span></div>':'')
          +(r.검사==='예외요청'&&(!r.교사확인||r.교사확인==='대기')
             ?'<div class="row" style="gap:6px;margin-top:6px"><button class="btn sm" onclick="reviewPhoto('+r.행+',&quot;승인&quot;)">승인</button>'
              +'<button class="btn danger sm" onclick="reviewPhoto('+r.행+',&quot;반려&quot;)">반려</button></div>':'')
          +(r.성찰?'<div style="background:var(--primary-tint);border-radius:10px;padding:7px 11px;font-size:13px;margin-top:6px">✍️ '+esc(r.성찰)+'</div>':'')
          +(thumb
             ?'<img class="subthumb" src="'+thumb+'" alt="인증 사진" loading="lazy" style="max-width:300px;width:100%;border-radius:10px;margin-top:8px;border:1px solid var(--line)" onclick="lbOpen(&quot;&quot;,&quot;'+esc(r.사진)+'&quot;)" onerror="this.replaceWith(Object.assign(document.createElement(&quot;span&quot;),{className:&quot;link&quot;,textContent:&quot;📷 사진 열기&quot;}))">'
             :'<div style="margin-top:8px"><span class="pill wait">사진 없음</span></div>')
          +'</div>';});
      html+='</div>';
    }
    html+='</div>';
  });
  document.getElementById('sb-body').innerHTML=html+'</div>';
}

function chkBadge(r){
  if(r.교사확인==='승인')return '<span class="pill ok">✅ 김진호 선생님 승인</span>';
  if(r.교사확인==='반려')return '<span class="pill no">⛔ 반려</span>';
  if(r.검사==='통과')return '<span class="pill ok">타임마크 확인</span>';
  if(r.검사==='예외요청')return '<span class="pill go">🙋 확인 요청</span>';
  return '<span class="pill wait">미검사</span>';
}
function reviewPhoto(row,decision){
  call('adminReviewPhoto',[row,decision],function(r){
    if(r&&r.ok===false){toast(r.msg||'처리 실패');return;}
    toast(decision+' 처리했습니다'+(decision==='반려'?' · 주간 달성에서 제외됩니다':''));
    loadSubmissions();
  });
}

/* ---- 체력측정 표 (6회차 × 항목) ---- */
var ADMIN_FIT_ROWS=[
  ['악력(높은 손)','악력최고','악력'],['팔굽혀펴기','팔굽혀펴기','팔굽혀펴기'],
  ['앉았다일어나기','앉았다일어나기',null],['앞으로굽히기','앞으로굽히기최고','앞으로굽히기'],
  ['뒤로젖히기','뒤로젖히기최고',null],['BMI','BMI',null],['체중','체중',null],
  ['체지방률','체지방률',null],['골격근량','골격근량',null],['내장비만','내장비만',null],['WHR','WHR',null]];
function fitCell(rec,key,gkey){
  if(!rec||!rec.있음)return '<span class="muted">–</span>';
  var j=rec.판정||{};
  var v=(j[key]!==undefined&&j[key]!=='')?j[key]:rec[key];
  if(v===''||v===null||v===undefined)return '<span class="muted">–</span>';
  var g=gkey&&j[gkey]?j[gkey]:null;
  var extra='';
  if(g)extra='<br><span class="pill '+(g.등급<=2?'ok':g.등급===3?'go':'no')+'">'+g.등급+'등급</span>';
  else if(key==='BMI'&&j.BMI진단)extra='<br><span class="muted" style="font-size:11px">'+j.BMI진단+'</span>';
  else if(key==='체지방률'&&j.체지방률진단)extra='<br><span class="muted" style="font-size:11px">'+j.체지방률진단+'</span>';
  else if(key==='골격근량'&&j.골격근량)extra='<br><span class="muted" style="font-size:11px">'+j.골격근량.라벨+'</span>';
  else if(key==='내장비만'&&j.내장비만진단)extra='<br><span class="muted" style="font-size:11px">'+j.내장비만진단+'</span>';
  else if(key==='WHR'&&j.WHR진단)extra='<br><span class="muted" style="font-size:11px">'+j.WHR진단+'</span>';
  return '<b>'+v+'</b>'+extra;
}
function renderFitAdmin(fit){
  if(!fit||!fit.기록)return '<p class="muted">측정 없음</p>';
  var any=false;fit.기록.forEach(function(r){if(r.있음)any=true;});
  if(!any)return '<p class="muted">아직 체력측정 기록이 없습니다.</p>';
  var html='<table><thead><tr><th style="text-align:left">항목</th>'
    +fit.회차목록.map(function(r){return '<th>'+r+'</th>';}).join('')+'</tr></thead><tbody>';
  ADMIN_FIT_ROWS.forEach(function(row){
    html+='<tr><td class="name">'+row[0]+'</td>';
    fit.회차목록.forEach(function(rd){
      var rec=null;fit.기록.forEach(function(x){if(x.회차===rd)rec=x;});
      html+='<td>'+fitCell(rec,row[1],row[2])+'</td>';});
    html+='</tr>';});
  return html+'</tbody></table>';
}

/* ---- 성찰 피드백 ---- */
var CM={pending:false,total:0,none:0,has:{}};
function renderCmFilter(){
  var el=document.getElementById('pal-cmfilter');if(!el)return;
  el.innerHTML='<button class="'+(CM.pending?'':'on')+'" onclick="cmFilter(false)">전체</button>'
    +'<button class="'+(CM.pending?'on':'')+'" onclick="cmFilter(true)">미답변</button>';
}
function cmFilter(v){CM.pending=v;renderCmFilter();loadCommentList();}

function loadCommentList(){
  renderCmFilter();
  var cls=clsOf('comment');
  document.getElementById('cm-list').innerHTML='<p class="muted">불러오는 중…</p>';
  call('adminGetReflections',[cls,CM.pending],function(d){
    if(!d){document.getElementById('cm-list').innerHTML='<p class="muted">불러오지 못했습니다.</p>';return;}
    CM.total=d.전체수; CM.none=d.미작성수; CM.has={}; cmCount();
    var html='';
    (d.목록||[]).forEach(function(r){
      var id='cm'+r.row, has=!!(r.교사코멘트||'').trim();
      CM.has[id]=has;
      var arg='&quot;'+r.학번+'&quot;,'+r.주차+',&quot;'+id+'&quot;';
      html+='<div class="card">'
        +'<div class="row" style="justify-content:space-between;align-items:center">'
        +'<b>'+esc(r.학번)+' '+esc(r.이름)+' <span class="muted">'+(r.반?r.반+'반':'')+'</span> '
        +'<span class="pill ok">'+esc(r.주차)+'주차</span> '
        +'<span class="pill wait" id="bg-'+id+'" style="'+(has?'':'display:none')+'">💬 피드백 있음</span></b>'
        +'<span class="muted" style="font-size:12px">작성 '+esc(r.작성일||'')+'</span></div>'
        +wkBox(r.주간)
        +'<p style="margin:9px 0 12px;white-space:pre-wrap;line-height:1.65">'+esc(r.내용)+'</p>'
        +'<label style="margin-bottom:5px">김진호 선생님 피드백</label>'
        +'<div class="stkpick" id="p-'+id+'"></div>'
        +'<div class="cmedit">'
        +'<textarea id="'+id+'" rows="4" oninput="cmBubble(&quot;'+id+'&quot;)" placeholder="칭찬 한마디나 다음 주 조언을 적어주세요">'+esc(r.교사코멘트||'')+'</textarea>'
        +'<div class="bubwrap" id="b-'+id+'"></div></div>'
        +'<div class="row" style="margin-top:10px;justify-content:space-between">'
        +'<span><button class="btn sm" id="sv-'+id+'" onclick="saveComment('+arg+')">'+(has?'수정 저장':'피드백 저장')+'</button> '
        +'<button class="btn sec sm" onclick="quickComment(&quot;'+id+'&quot;)">👍 칭찬 넣기</button> '
        +'<button class="btn danger sm" id="dl-'+id+'" style="'+(has?'':'display:none')+'" onclick="delComment('+arg+')">🗑 삭제</button></span>'
        +'<span class="savedat" id="s-'+id+'" style="margin:0">'
        +(has?'마지막 저장 · '+esc(r.코멘트일||''):'')+'</span></div>'
        +'</div>';
    });
    document.getElementById('cm-list').innerHTML=html
      ||'<div class="card"><p class="muted">'+(CM.pending?'답변할 성찰이 없습니다 🎉':'아직 제출된 성찰이 없습니다.')+'</p></div>';
    (d.목록||[]).forEach(function(r){
      var id='cm'+r.row;
      CM_SEL[id]=r.스티커||'';
      renderStickers(id); cmBubble(id);
    });
  });
}
/* [0.50.0] 그 주에 어떻게 운동했는지 — 학생 성찰 위에 붙인다 */
function minTxt(v){
  var n=Number(v); if(!isFinite(n)||n<=0)return '';
  var m=Math.floor(n), s=Math.round((n-m)*60);
  if(s>=60){m++;s=0;}
  return m+'분'+(s?' '+s+'초':'');
}
function wkBox(k){
  if(!k)return '';
  var head='<div class="wkhd"><b>'+fmtKDT(k.시작일)+' ~ '+fmtKDT(k.종료일)+'</b>'
    +(k.달성?'<span class="pill ok">주간 목표 달성</span>':'<span class="pill wait">미달 · '+(k.운동일수||0)+'일</span>')+'</div>';
  var stat='<div class="wkst">'
    +'<div><b>'+(k.운동일수||0)+'일</b><span>운동</span></div>'
    +'<div><b>'+(k.유산소일수||0)+'</b><span>유산소</span></div>'
    +'<div><b>'+(k.근력일수||0)+'</b><span>근력</span></div>'
    +'<div><b>'+(k.총거리||0)+'km</b><span>거리</span></div>'
    +'<div><b>'+(minTxt(k.총시간)||'0분')+'</b><span>시간</span></div></div>';
  var rows=(k.기록||[]).map(function(r){
    var amt='';
    if(r.종류==='유산소'){
      var ps=[];
      if(r.거리)ps.push('<b>'+r.거리+'km</b>');
      if(r.시간)ps.push('<b>'+minTxt(r.시간)+'</b>');
      amt=ps.join(' · ');
    } else amt=esc(r.내용||'');
    return '<div class="wkr"><span class="wkd">'+esc(String(r.날짜||'').slice(5))+' ('+esc(r.요일||'')+')</span>'
      +'<span class="pill '+(r.종류==='유산소'?'ok':'go')+'">'+esc(r.종류)+'</span>'
      +'<span class="wka">'+amt+'</span>'
      +(r.성찰?'<span class="wkm">✍️ '+esc(r.성찰)+'</span>':'')+'</div>';
  }).join('');
  return '<div class="wkbox">'+head+stat
    +(rows||'<p class="muted" style="font-size:12.5px;margin:8px 0 0">이 주에는 인증된 운동이 없습니다.</p>')
    +'</div>';
}

function cmCount(){
  var el=document.getElementById('cm-count');
  if(el)el.textContent='전체 '+CM.total+'편 · 미답변 '+CM.none+'편';
}
/* 카드를 '코멘트 있음/없음' 상태로 전환 — 버튼 라벨·삭제버튼·배지·카운트 */
function setCmMode(id,has){
  if(CM.has[id]!==has){ CM.none+=(has?-1:1); if(CM.none<0)CM.none=0; cmCount(); }
  CM.has[id]=has;
  var sv=document.getElementById('sv-'+id), dl=document.getElementById('dl-'+id), bg=document.getElementById('bg-'+id);
  if(sv)sv.textContent=has?'수정 저장':'피드백 저장';
  if(dl)dl.style.display=has?'':'none';
  if(bg)bg.style.display=has?'':'none';
}
/* 선생님 캐릭터 스티커 */
var STK=[{k:'verygood',n:'Very Good'},{k:'good',n:'좋다!'},{k:'nice',n:'Nice'},
         {k:'peace',n:'평화'},{k:'regret',n:'아쉬움'},{k:'frustration',n:'좌절'},
         {k:'sob',n:'꺼이꺼이'},{k:'wail',n:'대성통곡'},{k:'no',n:'안돼'}];   // [0.55.0] 9종
var CM_SEL={};                       // 카드별 선택한 스티커
var STK_BASE='https://arete929.github.io/grofit/';
function renderStickers(id){
  var el=document.getElementById('p-'+id); if(!el)return;
  var cur=CM_SEL[id]||'';
  el.innerHTML='<span class="stklab">말하는 캐릭터</span>'
    +STK.map(function(s){
      return '<button type="button" class="stk'+(cur===s.k?' on':'')+'" title="'+s.n+'" '
        +'onclick="pickStk(&quot;'+id+'&quot;,&quot;'+s.k+'&quot;)"><img src="'+STK_BASE+'st-'+s.k+'.png" alt="'+s.n+'"></button>';
    }).join('')
    +'<span class="stkhint">'+(cur?'다시 누르면 해제':'고르면 캐릭터가 말풍선으로 말해요')+'</span>';
}
/* [0.52.0] 말하는 캐릭터 고르기 — 같은 걸 다시 누르면 해제 */
function pickStk(id,k){
  CM_SEL[id]=(CM_SEL[id]===k)?'':k;
  renderStickers(id); cmBubble(id);
}
/* 운동 파트너 배지 — 저장값은 '혼자' 또는 '이름1, 이름2' */
function pnPill(v){
  var s=String(v||'').trim(); if(!s)return '';
  if(s==='혼자')return '<span class="pill wait">🧍 혼자</span>';
  return '<span class="pill pn">👥 '+esc(s)+'</span>';
}
/* 커서 위치에 이모티콘 넣기 (본문에 :키: 로 저장되고 화면에선 그림으로 보임) */
function insStk(id,k){
  var t=document.getElementById(id), tok=':'+k+':';
  var s=t.selectionStart, e=t.selectionEnd;
  t.value=t.value.slice(0,s)+tok+t.value.slice(e);
  var p=s+tok.length; t.focus(); t.setSelectionRange(p,p);
  cmBubble(id);
}
/* :키: → 그림으로 바꿔 그리기 */
function emoHtml(s){
  return esc(s).replace(/:(verygood|good|nice|peace|regret|frustration|sob|wail|no):/g,function(m,k){
    return '<img class="emo" src="'+STK_BASE+'st-'+k+'.png" alt="">';});
}
/* 학생 화면에서 보일 말풍선 미리보기 */
function cmBubble(id){
  var box=document.getElementById('b-'+id); if(!box)return;
  var txt=(document.getElementById(id).value||'').trim();
  if(!txt){box.innerHTML='<div class="bubph">왼쪽에 피드백을 쓰면<br>학생 앱에서 보일 모습이 여기에 나타납니다</div>';return;}
  box.innerHTML=comicHTML(txt,CM_SEL[id]||'')
    +'<div class="bub-cap">학생 앱에서 이렇게 보입니다</div>';
}

/* [0.52.0] 캐릭터 + 말풍선(꼬리 달린) — 학생 앱과 같은 모양 */
function comicHTML(txt,stk){
  var ch=stk?('<img class="cmc-ch" src="'+STK_BASE+'st-'+stk+'.png" alt="">'):'';
  return '<div class="cmc'+(stk?'':' nochar')+'">'+ch
    +'<div class="cmc-say">'+emoHtml(txt)
    +'<span class="cmc-who">김진호 선생님</span></div></div>';
}

var CM_PRAISE=['꾸준히 실천한 게 눈에 보여요. 이 페이스 좋습니다!',
  '스스로 돌아본 점이 훌륭해요. 다음 주도 기대할게요.',
  '기록이 정직하고 성실합니다. 잘하고 있어요!',
  '힘든 순간을 이겨낸 게 대단해요. 계속 이어가 봅시다.'];
function quickComment(id){
  var t=document.getElementById(id);
  t.value=CM_PRAISE[Math.floor(Math.random()*CM_PRAISE.length)];
  t.focus();
}
function saveComment(sid,week,id){
  var v=document.getElementById(id).value.trim();
  if(!v){toast('피드백을 입력하세요 (지우려면 🗑 삭제)');return;}
  var edit=!!CM.has[id];
  call('adminSaveComment',[sid,week,v,CM_SEL[id]||''],function(r){
    if(!r||r.ok===false){toast((r&&r.msg)||'저장 실패');return;}
    toast('✅ '+sid+' '+week+'주차 피드백 '+(edit?'수정':'저장'));
    setCmMode(id,true); cmBubble(id);
    var el=document.getElementById('s-'+id);
    if(el){el.className='savedat just';el.style.margin='0';el.textContent='✅ 저장됨 · '+(r.savedAt||'');}
  });
}
/* 저장된 코멘트 삭제 — 학생 앱 말풍선도 사라진다 */
async function delComment(sid,week,id){
  if(!(await askP(sid+' '+week+'주차 피드백을 삭제할까요?\n학생 앱에서도 사라집니다.')))return;
  call('adminDeleteComment',[sid,week],function(r){
    if(!r||r.ok===false){toast((r&&r.msg)||'삭제 실패');return;}
    toast('🗑 '+sid+' '+week+'주차 피드백 삭제');
    var t=document.getElementById(id); if(t)t.value='';
    cmBubble(id);
    setCmMode(id,false);
    var el=document.getElementById('s-'+id);
    if(el){el.className='savedat just';el.style.margin='0';el.textContent='🗑 삭제됨 · '+(r.savedAt||'');}
  });
}

/* ---- 설정 ---- */
function loadSettings(){
  call('getPublicConfig',[],function(c){if(!c)return;A.config=c;applyBrand(c);
    setv('cf-appname',c.앱_제목);setv('cf-subtitle',c.평가명);setv('cf-school',c.학교명);
    setv('cf-start',c.기간_시작일);setv('cf-end',c.기간_종료일);setv('cf-weeks',c.총_주차수);setv('cf-goal',c.주간_목표일수);
    setv('cf-cardio',c.유산소_최소일수);setv('cf-deadline',c.제출_마감일);
    setv('cf-wex',c.배점_운동달성_비율);setv('cf-wsub',c.배점_제출정시_비율);setv('cf-total',c.배점_총점);
    A.rubric=c.급간||[];renderRub();updatePreview();
    A.theme=c.테마||'5';renderThemes(A.theme);renderBrand();
    A.themeOpt=c.학생_테마선택||'on';renderThemeOpt();
    A.photoChk=c.근력사진_검사||'code';renderPhotoChk();
    document.getElementById('cf-appname').oninput=updatePreview;
    document.getElementById('cf-subtitle').oninput=updatePreview;
    loadSaveStamps();
  });
}
function updatePreview(){document.getElementById('cf-preview').textContent=(val('cf-appname')||'혜원핏')+' ; '+(val('cf-subtitle')||'운동처방일지');}
var THEME_LIST=[{n:'1',name:'핑크'},{n:'2',name:'핑크 반전'},{n:'3',name:'퍼시안블루'},{n:'4',name:'퍼시안 반전'},{n:'5',name:'나이트키위'},{n:'6',name:'키위 반전'}];
var THEME_BASE='https://arete929.github.io/grofit/';
function renderThemes(cur){
  var el=document.getElementById('theme-grid');if(!el)return;
  el.innerHTML=THEME_LIST.map(function(t){var on=String(cur)===t.n;
    return '<button onclick="selectTheme(\''+t.n+'\')" style="border:'+(on?'2px solid var(--primary)':'1px solid var(--line2)')+';border-radius:12px;padding:8px 8px 6px;background:#fff;cursor:pointer;width:98px;text-align:center">'
      +'<img src="'+THEME_BASE+'theme'+t.n+'.png" width="74" height="74" style="border-radius:12px;display:block;margin:0 auto 6px" alt="테마'+t.n+'">'
      +'<div style="font-size:12px;font-weight:700">'+(on?'✅ ':'')+t.name+'</div></button>';}).join('');
}
var PHOTO_MODES=[{v:'code',n:'사진 코드'},{v:'date',n:'날짜만'},{v:'off',n:'끄기'}];
function renderPhotoChk(){
  var el=document.getElementById('pal-photochk');if(!el)return;
  var cur=A.photoChk||'code';
  el.innerHTML=PHOTO_MODES.map(function(m){
    return '<button class="'+(cur===m.v?'on':'')+'" onclick="setPhotoChk(&quot;'+m.v+'&quot;)">'+m.n+'</button>';}).join('');
}
function setPhotoChk(v){
  call('adminSaveConfig',[{'근력사진_검사':v}],function(r){
    A.photoChk=v;renderPhotoChk();
    toast(v==='off'?'검사를 껐습니다 (사진 아무거나 제출 가능)'
        :(v==='code'?'사진 코드 — 코드·날짜 확인 + 재사용 자동 차단':'날짜만 — 촬영 날짜만 대조합니다'));
    showSaved('saved-photochk',r&&r.savedAt,true);});
}
function renderThemeOpt(){
  var el=document.getElementById('pal-themeopt');if(!el)return;
  var on=(A.themeOpt!=='off');
  el.innerHTML='<button class="'+(on?'on':'')+'" onclick="setThemeOpt(&quot;on&quot;)">허용</button>'
    +'<button class="'+(!on?'on':'')+'" onclick="setThemeOpt(&quot;off&quot;)">잠금</button>';
}
function setThemeOpt(v){
  call('adminSaveConfig',[{'학생_테마선택':v}],function(r){
    A.themeOpt=v;renderThemeOpt();
    toast(v==='on'?'학생이 테마를 고를 수 있습니다':'학교 지정 테마로 통일됩니다');
    showSaved('saved-themeopt',r&&r.savedAt,true);});
}
function selectTheme(n){call('adminSaveConfig',[{'테마':n}],function(r){
  var nm=(THEME_LIST.filter(function(x){return x.n===String(n);})[0]||{}).name||('테마 '+n);
  toast('🎨 '+nm+' 로 바꿨습니다 · 학생앱에도 반영됩니다');A.theme=n;renderThemes(n);renderBrand();
  showSaved('saved-config',r&&r.savedAt,true);});}
/* 설명서 주소는 학생앱 URL(설정 학생앱_URL) 옆에 함께 배포되어 있다 */
function setGuideLinks(base){
  var b=String(base||'https://arete929.github.io/grofit/');
  if(b.slice(-1)!=='/')b+='/';
  var g=document.getElementById('lk-guide'),p=document.getElementById('lk-guidepdf');
  if(g)g.href=b+'help.html';        /* [v0.53.0] 최신 웹 설명서 */
  if(p)p.href=b+'guide.pdf';
}
function applyBrand(c){ if(c&&c.앱_제목)A.brandName=c.앱_제목; if(c&&c.테마)A.theme=c.테마; renderBrand(); }
/* 사이드바 제목 = 선택한 테마의 실제 로고 + 앱 이름 */
function renderBrand(){
  var t=String(A.theme||'5');
  document.getElementById('brand-box').innerHTML=
    '<h1 style="margin:0;display:flex;align-items:center;gap:9px">'
    +'<img class="side-logo" id="brand-logo" title="눌러서 테마 고르기" style="cursor:pointer" '
    +'onclick="event.stopPropagation();toggleThemePop()" '
    +'src="'+THEME_BASE+'theme'+t+'.png?v='+encodeURIComponent(A.logoVer||'1')+'" alt="">'
    +'<span onclick="editBrand()" title="눌러서 앱 제목 수정" style="cursor:pointer">'+esc(A.brandName||'혜원핏')+'</span></h1>'
    +'<div class="thpop hidden" id="thpop" onclick="event.stopPropagation()"></div>';
}
/* [0.63.0] 로고를 누르면 열리는 테마 판 — 고르면 바로 바뀌고 학생앱에도 반영된다 */
function toggleThemePop(){
  var p=document.getElementById('thpop'); if(!p)return;
  if(!p.classList.contains('hidden')){ p.classList.add('hidden'); return; }
  var cur=String(A.theme||'5');
  p.innerHTML='<div class="thh">테마 고르기</div>'
    +'<div class="thg">'+THEME_LIST.map(function(x){
      return '<button type="button" class="'+(cur===x.n?'on':'')+'" title="'+esc(x.name)+'" onclick="pickTheme(&quot;'+x.n+'&quot;)">'
        +'<img src="'+THEME_BASE+'theme'+x.n+'.png" alt="'+esc(x.name)+'"><span>'+esc(x.name)+'</span></button>';}).join('')+'</div>'
    +'<div class="thf">학생앱에도 함께 바뀝니다</div>';
  p.classList.remove('hidden');
}
function pickTheme(n){
  document.getElementById('thpop').classList.add('hidden');
  selectTheme(n);
}
document.addEventListener('click',function(){
  var p=document.getElementById('thpop'); if(p&&!p.classList.contains('hidden'))p.classList.add('hidden');
});
function editBrand(){
  var box=document.getElementById('brand-box');box.innerHTML='';
  var inp=document.createElement('input');inp.id='brand-in';inp.value=A.brandName||'혜원핏';
  inp.style.cssText='width:108px;font-size:14px;padding:5px 7px;border-radius:8px;border:1.5px solid var(--primary);background:#fff;color:#17211b';
  var ok=document.createElement('button');ok.className='btn sm';ok.textContent='✔';ok.style.cssText='height:30px;padding:0 9px;margin-left:4px';ok.onclick=saveBrand;
  var no=document.createElement('button');no.className='btn sec sm';no.textContent='✕';no.style.cssText='height:30px;padding:0 9px;margin-left:2px';no.onclick=renderBrand;
  box.appendChild(inp);box.appendChild(ok);box.appendChild(no);inp.focus();inp.select();
  inp.addEventListener('keydown',function(e){if(e.key==='Enter')saveBrand();if(e.key==='Escape')renderBrand();});
}
function saveBrand(){
  var v=document.getElementById('brand-in').value.trim();if(!v){toast('이름을 입력하세요');return;}
  call('adminSaveConfig',[{'앱_제목':v}],function(r){A.brandName=v;renderBrand();
    var cf=document.getElementById('cf-appname');if(cf)cf.value=v;
    toast('앱 제목 저장 · 학생앱에도 반영됩니다');showSaved('saved-config',r&&r.savedAt,true);});
}
function saveConfig(){
  call('adminSaveConfig',[{'앱_제목':val('cf-appname'),'평가명':val('cf-subtitle'),'학교명':val('cf-school'),
    '기간_시작일':val('cf-start'),'기간_종료일':val('cf-end'),'총_주차수':val('cf-weeks'),'주간_목표일수':val('cf-goal'),
    '유산소_최소일수':val('cf-cardio'),'제출_마감일':val('cf-deadline'),'배점_운동달성_비율':val('cf-wex'),
    '배점_제출정시_비율':val('cf-wsub'),'배점_총점':val('cf-total')}],function(r){toast('설정 저장 완료 · 학생앱에도 반영됩니다');
    applyBrand({앱_제목:val('cf-appname')});showSaved('saved-config',r&&r.savedAt,true);});
}
/* 저장시각 표시 — just=방금 저장(강조) */
function showSaved(id,at,just){
  var el=document.getElementById(id); if(!el||!at)return;
  el.textContent=(just?'✅ 저장됨 · ':'마지막 저장 · ')+at;
  el.className='savedat'+(just?' just':'');
}
/* 화면 진입 시 각 저장 단위의 마지막 저장시각 복원 */
function loadSaveStamps(){
  call('adminGetSaveStamps',[],function(s){ if(!s)return;
    showSaved('saved-config',s.config,false); showSaved('saved-rubric',s.rubric,false); });
}
function renderRub(){var html='';A.rubric.forEach(function(b,i){
  html+='<div class="rubrow"><input value="'+b.min+'" onchange="A.rubric['+i+'].min=this.value"><input value="'+b.score+'" onchange="A.rubric['+i+'].score=this.value"><button class="btn danger sm" onclick="delRub('+i+')">−</button></div>';});
  document.getElementById('rub-list').innerHTML=html;}
function addRubRow(){A.rubric.push({min:0,score:0});renderRub();}
function delRub(i){A.rubric.splice(i,1);renderRub();}
async function resetRubric(){
  if(!(await askP('급간표를 2학기 평가기준표(40점 만점 · 작성률 5%마다 2점 · 기본 6점)로 덮어씁니다. 진행할까요?')))return;
  call('adminResetRubricToOfficial',[],function(r){
    toast('평가기준표대로 채웠습니다');showSaved('saved-rubric',r&&r.savedAt,true);loadSettings();});
}
function saveRubric(){call('adminSaveRubric',[A.rubric],function(r){toast('급간표 저장 완료');showSaved('saved-rubric',r&&r.savedAt,true);});}

/* ---- 도구 ---- */
/* 마지막으로 테스트 기록을 넣은 시각 (새로고침해도 보이게 서버에서 복원) */
function loadDemoStamp(){
  call('adminGetSaveStamps',[],function(s){
    if(!s||!s.demo)return;
    var el=document.getElementById('saved-demo');if(!el)return;
    el.className='savedat';el.style.textAlign='left';
    el.innerHTML='마지막 실행 · '+s.demo+(s.demo상세?'<br><span style="color:var(--muted2)">'+esc(s.demo상세)+'</span>':'');
  });
}
async function seedDemo(){
  var sid=document.getElementById('demo-sid').value.trim()||'3277';
  if(!(await askP(sid+' 학생의 기존 기록을 지우고 테스트 기록을 채웁니다. 기간 시작일도 임시로 바뀝니다. 진행할까요?')))return;
  toast('테스트 기록 생성 중…');
  call('seedDemoStudent',[sid],function(r){
    if(!r||r.ok===false){toast('실패했습니다 — 다시 시도해 주세요');return;}
    toast('✅ '+r.sid+' 테스트 기록 생성 완료');
    var el=document.getElementById('saved-demo');
    el.className='savedat just';el.style.textAlign='left';
    el.innerHTML='✅ 넣음 · '+(r.savedAt||'')+'<br><span style="color:var(--muted2);font-weight:400">'
      +'운동 '+r.운동+'건 · 체력측정 '+(r.체력||0)+'회 · 성찰 '+(r.성찰||0)+'편 · 기간 '+r.기간+'</span>';
    loadDash();
  });
}
async function clearDemo(){
  var sid=document.getElementById('demo-sid').value.trim()||'3277';
  if(!(await askP(sid+' 학생의 기록을 모두 지우고 기간 설정을 되돌립니다. 진행할까요?')))return;
  call('clearDemoStudent',[sid],function(r){
    if(!r||r.ok===false){toast('실패했습니다');return;}
    toast('🧹 삭제 완료');
    var el=document.getElementById('saved-demo');
    el.className='savedat just';el.style.textAlign='left';
    el.innerHTML='🧹 지움 · '+(r.savedAt||'')+'<br><span style="color:var(--muted2);font-weight:400">'
      +r.removed+'건 삭제 · 기간 복원 '+r.기간복원+'</span>';
    loadDash();
  });
}
function loadMasterStatus(keepJust){
  call('getMasterStatus',[],function(s){var el=document.getElementById('master-status');if(!el)return;
    if(s&&s.hasCode){el.innerHTML='<b style="color:var(--primary-dark)">✅ 마스터코드 설정됨</b> · 현재값: <b>'+esc(s.code)+'</b>'
      +'<br>저장 시각: <b>'+(s.savedAt||'-')+'</b> <span class="muted">(KST)</span>'
      +'<br><span class="muted">학생앱에서 아무 학번 + 위 코드로 로그인 가능</span>';}
    else{el.innerHTML='<b style="color:var(--muted2)">미설정</b> <span class="muted">— 마스터코드를 입력하고 저장하세요.</span>';}
    if(!keepJust)showSaved('saved-master',s&&s.savedAt,false);
  });
}
function saveMaster(){var v=document.getElementById('master-in').value.trim();if(!v){toast('마스터코드를 입력하세요');return;}
  call('setMasterCode',[v],function(r){toast('마스터코드 저장 완료');document.getElementById('master-in').value='';
    showSaved('saved-master',r&&r.savedAt,true);loadMasterStatus(true);});}
function clearMaster(){call('clearMasterCode',[],function(){toast('마스터코드 삭제됨');
  var el=document.getElementById('saved-master');if(el){el.textContent='';el.className='savedat';}loadMasterStatus();});}
var AI_LABELS={gemini:'Gemini',openai:'OpenAI(GPT)',anthropic:'Claude'};
var AI_PH={gemini:'AIza...',openai:'sk-...',anthropic:'sk-ant-...'};
function loadAIStatus(){
  call('getAIStatus',[],function(s){ if(!s)return; A.ai=s; renderAI(); });
}
function renderAI(){
  var s=A.ai; if(!s)return;
  var pick='';Object.keys(AI_LABELS).forEach(function(prov){
    pick+='<button class="btn '+(s.active===prov?'':'sec')+' sm" onclick="pickProvider(\''+prov+'\')">'+(s.active===prov?'● ':'')+AI_LABELS[prov]+'</button>';});
  document.getElementById('ai-provider-pick').innerHTML='<span class="muted" style="align-self:center">활성:</span>'+pick;
  var html='';Object.keys(AI_LABELS).forEach(function(prov){
    var d=s.providers[prov]||{};var active=(s.active===prov);
    html+='<div class="card" style="'+(active?'border:2px solid var(--primary)':'')+'">'
      +'<div class="row" style="justify-content:space-between"><b>'+AI_LABELS[prov]+(active?' <span class="badge">사용 중</span>':'')+'</b></div>'
      +'<div class="row" style="margin:10px 0"><input id="k-'+prov+'" placeholder="'+AI_PH[prov]+' (새 키 입력 시에만)" style="flex:2;min-width:160px">'
      +'<input id="m-'+prov+'" value="'+esc(d.model||'')+'" placeholder="모델" style="flex:1;min-width:110px"></div>'
      +'<div class="row"><button class="btn sm" onclick="saveAIKey(\''+prov+'\')">키 저장</button>'
      +'<button class="btn sec sm" onclick="saveAIModel(\''+prov+'\')">모델 저장</button>'
      +'<button class="btn sec sm" onclick="testAIProv(\''+prov+'\')">🔌 테스트</button></div>'
      +'<div id="st-'+prov+'" style="background:var(--bg);border-radius:10px;padding:10px 12px;font-size:13px;margin-top:10px">'+aiStatusLine(d)+'</div>'
      +'</div>';
  });
  document.getElementById('ai-panels').innerHTML=html;
}
function aiStatusLine(d){
  if(d&&d.hasKey)return '<b style="color:var(--primary-dark)">✅ 키 저장됨</b> <span class="muted">('+esc(d.masked)+')</span>'
    +'<br>저장 시각: <b>'+(d.savedAt||'-')+'</b> <span class="muted">(KST)</span> · 모델: <b>'+esc(d.model)+'</b>';
  return '<b style="color:var(--danger)">❌ 키 없음</b> <span class="muted">— 키를 입력하고 저장하세요.</span>';
}
function pickProvider(prov){call('setAIProvider',[prov],function(){toast(AI_LABELS[prov]+' 활성화');A.ai.active=prov;renderAI();});}
function saveAIKey(prov){var k=document.getElementById('k-'+prov).value.trim();if(!k){toast('키를 입력하세요');return;}
  call('setAIKey',[prov,k],function(r){toast(AI_LABELS[prov]+' 키 저장 · '+((r&&r.savedAt)||''));document.getElementById('k-'+prov).value='';loadAIStatus();});}
function saveAIModel(prov){var m=document.getElementById('m-'+prov).value.trim();
  call('setAIModel',[prov,m],function(){toast(AI_LABELS[prov]+' 모델 저장');loadAIStatus();});}
function testAIProv(prov){var el=document.getElementById('st-'+prov);el.innerHTML='🔌 연결 테스트 중…';
  call('testAI',[prov],function(r){
    if(r&&r.ok){el.innerHTML='<b style="color:var(--primary-dark)">✅ 연결 정상</b> <span class="muted">('+r.ms+'ms)</span>'
      +'<br>모델: <b>'+esc(r.model)+'</b> · 응답: "'+esc(r.reply)+'"'
      +'<br>테스트 시각: <b>'+(r.testedAt||'')+'</b> <span class="muted">(KST)</span>';toast(AI_LABELS[prov]+' 정상');}
    else{el.innerHTML='<b style="color:var(--danger)">❌ 실패</b><br>'+esc((r&&r.msg)||'알 수 없는 오류')
      +'<br><span class="muted">↑ 이 메시지로 한도·결제 상태를 확인하세요 (insufficient_quota, credit balance, billing 등)</span>';toast('연결 실패');}
  });
}
function loadFiles(){var sid=document.getElementById('file-sid').value.trim();
  call('adminGetFiles',[sid],function(list){var html='';(list||[]).forEach(function(f){
    html+='<div class="row" style="justify-content:space-between;border-bottom:1px solid var(--divider);padding:8px 0"><span>'+f.name+' <span class="muted">'+f.date+'</span></span><a class="link" href="'+f.url+'" target="_blank">열기</a></div>';});
  document.getElementById('file-list').innerHTML=html||'<p class="muted">파일이 없습니다.</p>';});}
function exportCsv(){
  var rows=[['이름','학번','1주','2주','3주','4주','성취율','점수']];
  document.querySelectorAll('#dash-body tr').forEach(function(tr){
    var t=[];tr.querySelectorAll('td').forEach(function(td,i){if(i<8)t.push(td.innerText.trim())});if(t.length)rows.push(t);});
  var csv=rows.map(function(r){return r.join(',')}).join('\n');
  var a=document.createElement('a');a.href='data:text/csv;charset=utf-8,﻿'+encodeURIComponent(csv);a.download='운동처방일지_현황.csv';a.click();
}

/* ---- 공용 ---- */
function val(id){return document.getElementById(id).value.trim();}
function setv(id,v){document.getElementById(id).value=(v==null?'':v);}
/* [0.65.0] 앱 안 확인창.
   브라우저 기본 confirm 은 앱스 스크립트 주소(n-…googleusercontent.com)가 앞에 붙어 보기 나쁘다.
   askP(글)      → 확인이면 true, 취소면 false
   askTextP(글, 처음값) → 적은 글, 취소면 null */
function dlgOpen_(msg, withInput, val){
  return new Promise(function(done){
    var d=document.getElementById('dlg');
    document.getElementById('dlg-msg').textContent=String(msg||'');
    var inp=document.getElementById('dlg-inp');
    inp.classList.toggle('hidden', !withInput);
    if(withInput) inp.value=String(val==null?'':val);
    var ok=document.getElementById('dlg-ok'), no=document.getElementById('dlg-no');
    var close=function(v){ d.classList.add('hidden'); ok.onclick=null; no.onclick=null; d.onclick=null; inp.onkeydown=null; done(v); };
    ok.onclick=function(){ close(withInput?inp.value:true); };
    no.onclick=function(){ close(withInput?null:false); };
    d.onclick=function(e){ if(e.target===d)close(withInput?null:false); };
    if(withInput) inp.onkeydown=function(e){ if(e.key==='Enter')ok.onclick(); };
    d.classList.remove('hidden');
    setTimeout(function(){ (withInput?inp:ok).focus(); if(withInput&&inp.select)inp.select(); },30);
  });
}
function askP(msg){ return dlgOpen_(msg,false); }
function askTextP(msg,val){ return dlgOpen_(msg,true,val); }
function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');}
/* [0.64.2] 속성(value / title / data-t)에 넣을 때는 따옴표까지 감싸야 한다.
   페이스 13'19" 처럼 큰따옴표가 든 글이 그 자리에서 잘려 나갔다. */
function escA(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}

function mock(fn,args){
  if(fn==='getPublicConfig')return{학생_테마선택:'on',근력사진_검사:'code',앱_제목:'혜원핏',학교명:'혜원여자중학교',평가명:'운동처방일지',학년도:'2026',기간_시작일:'2026-07-20',기간_종료일:'2026-08-16',제출_마감일:'2026-08-16',학생앱_URL:'https://arete929.github.io/grofit/',테마:'5',
    총_주차수:4,주간_목표일수:3,유산소_최소일수:2,배점_총점:20,배점_운동달성_비율:70,배점_제출정시_비율:30,
    급간:[{min:90,score:20},{min:75,score:17},{min:60,score:14},{min:40,score:10},{min:0,score:6}],version:'0.4.0',배포시각:'2026.07.15 12:00',시트URL:'#',학생URL:'#'};
  if(fn==='adminGetClasses')return['1','2','3','4','5'];
  if(fn==='getAIStatus')return{active:'gemini',providers:{
    gemini:{label:'Gemini',hasKey:true,masked:'AIzaSy…4bXq',savedAt:'2026-07-15 10:12:33',model:'gemini-2.0-flash'},
    openai:{label:'OpenAI(GPT)',hasKey:false,masked:'',savedAt:'',model:'gpt-4o-mini'},
    anthropic:{label:'Claude',hasKey:false,masked:'',savedAt:'',model:'claude-opus-4-8'}}};
  if(fn==='testAI')return{ok:true,provider:args[0],model:'gemini-2.0-flash',ms:412,reply:'연결 정상',testedAt:'2026-07-15 10:13:02'};
  if(fn==='setAIKey')return{ok:true,savedAt:'2026-07-15 10:12:33'};
  if(fn==='setAIProvider'||fn==='setAIModel')return{ok:true};
  if(fn==='getMasterStatus')return{hasCode:true,code:'grofit2026',savedAt:'2026-07-15 12:30'};
  if(fn==='setMasterCode')return{ok:true,savedAt:'2026-07-15 12:30'};
  if(fn==='clearMasterCode')return{ok:true};
  if(fn==='adminGetNotices')return[{row:3,공지ID:'N1',등록일시:'2026-07-15',제목:'1주차 시작 안내',내용:'이번 주부터 시작합니다.\n주 3일 이상, 유산소 2일 필수예요!'}];
  if(fn==='adminNoticeStats')return{N1:{전체:30,읽음:23,미읽음명단:[{학번:'3277',이름:'김체육',반:'2'},{학번:'3205',이름:'김수아',반:'2'}]}};
  if(fn==='adminAddNotice'||fn==='adminDeleteNotice')return{ok:true,savedAt:'2026-07-15 12:30:00'};
  if(fn==='adminReviewPhoto')return{ok:true,savedAt:'2026.08.13 20:10:00'};
  if(fn==='adminSaveComment')return{ok:true,savedAt:'2026.08.14 17:42:00',코멘트일:'2026-08-14'};
  if(fn==='adminDeleteComment')return{ok:true,savedAt:'2026.08.14 17:40:00'};
  if(fn==='adminGetReflections')return{전체수:3,미작성수:1,목록:[
    {row:2,학번:'3277',이름:'김체육',반:'2',주차:3,작성일:'2026-08-09',내용:'체지방률이 조금 줄어든 걸 보고 신기했다.',교사코멘트:'',코멘트일:''},
    {row:3,학번:'3277',이름:'김체육',반:'2',주차:2,작성일:'2026-08-02',내용:'지난주보다 덜 힘들었다.',교사코멘트:'자세를 스스로 점검한 점이 훌륭해요.',코멘트일:'2026-08-03',스티커:'verygood'}]};
  if(fn==='adminGetReport')return{학교:'혜원여자중학교',학년도:'2026',평가명:'운동처방일지',기간:'2026-07-20 ~ 2026-08-16',
    총주차:4,목표일수:3,유산소필수:2,총점:40,출력일:'2026년 8월 14일',
    학생:[{학번:args[1]||'3277',이름:'김체육',반:'2',
      주차:[{주차:1,운동일수:3,유산소일수:2,근력일수:1,달성:true,거리:6.0,시간:53,자각도:3.2,만족:{}},
            {주차:2,운동일수:4,유산소일수:3,근력일수:1,달성:true,거리:10.6,시간:90,자각도:3.0,만족:{}},
            {주차:3,운동일수:3,유산소일수:2,근력일수:1,달성:true,거리:6.9,시간:58,자각도:2.7,만족:{}},
            {주차:4,운동일수:3,유산소일수:2,근력일수:1,달성:true,거리:7.8,시간:64,자각도:2.5,만족:{}}],
      총운동일:13,총거리:31.3,총시간:265,달성주차:4,
      파트너:{혼자:6,함께:7,미기재:0,목록:[{이름:'김서연',횟수:5},{이름:'박지우',횟수:3}]},
      체력:['방학 전','개학 후','1주차','2주차','3주차','4주차'].map(function(r,i){return {회차:r,있음:true,측정일:'2026-0'+(7+(i>2?1:0))+'-'+(10+i*3),
        신장:158,체중:53.4-i*0.5,체지방률:29.8-i*0.9,골격근량:17+i*0.25,내장비만:7-Math.floor(i/2),WHR:0.77,
        판정:{악력최고:19.8+i*1.9,팔굽혀펴기:10+i*3,앉았다일어나기:24+i*2,앞으로굽히기최고:6.5+i*1.4,뒤로젖히기최고:38+i,
          BMI:21.4-i*0.2,BMI진단:'정상',체지방률진단:'과체중',골격근량:{라벨:'표준'},
          악력:{등급:3,라벨:'보통'},팔굽혀펴기:{등급:3,라벨:'보통'},앞으로굽히기:{등급:3,라벨:'보통'}}};}),
      성찰:[{주차:1,작성일:'2026-07-26',내용:'첫 주라 숨이 많이 찼다. 그래도 3일을 채웠다.',교사코멘트:'첫 주부터 꾸준했어요!'},
            {주차:2,작성일:'2026-08-02',내용:'지난주보다 덜 힘들었다.',교사코멘트:''}],
      점수:{운동달성률:100,정시성:100,성취율:100,점수:40,급간배점:40}}]};
  if(fn==='getMyPartners')return[{이름:'김서연',횟수:5},{이름:'박지우',횟수:3}];
  if(fn==='seedDemoStudent')return{ok:true,sid:args[0],운동:13,체력:6,성찰:4,기간:'2026-07-20 ~ 2026-08-16',savedAt:'2026.08.14 01:20:00'};
  if(fn==='clearDemoStudent')return{ok:true,removed:22,기간복원:'2026-08-24'};
  if(fn==='adminGetSubmissions')return[
    {날짜:'2026-08-12',요일:'수',인원:2,유산소인원:2,근력인원:1,학생:[
      {학번:'3277',이름:'김체육',반:'2',유산소:1,근력:1,기록:[
        {종류:'유산소',거리:3.2,시간:28,내용:'페이스 8분45초 · 240kcal',사진:'https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz123456/view',성찰:'20분 넘으니 리듬이 잡혔다.',입력시각:'2026-08-12 19:20:11'},
        {종류:'근력',내용:'스쿼트 3세트×15, 런지 3세트×12',사진:'',성찰:'',입력시각:'2026-08-12 19:25:03'}]},
      {학번:'3205',이름:'김수아',반:'2',유산소:1,근력:0,기록:[
        {종류:'유산소',거리:2.6,시간:24,내용:'',사진:'',성찰:'가볍게 걸었다',입력시각:'2026-08-12 20:02:40'}]}]},
    {날짜:'2026-08-11',요일:'화',인원:1,유산소인원:0,근력인원:1,학생:[
      {학번:'3277',이름:'김체육',반:'2',유산소:0,근력:1,기록:[
        {종류:'근력',내용:'플랭크 3세트×60초',사진:'',성찰:'',입력시각:'2026-08-11 18:40:00'}]}]}];
  if(fn==='getFitness')return{회차목록:['방학 전','개학 후','1주차','2주차','3주차','4주차'],기록:[]};
  if(fn==='adminGetSaveStamps')return{config:'2026.07.15 12:30:00',rubric:'2026.07.15 12:31:10',notice:'',demo:'2026.08.14 01:20:00',demo상세:'3277 · 운동 13건 · 체력측정 6회 · 성찰 4편'};
  if(fn==='adminSaveConfig'||fn==='adminSaveRubric'||fn==='adminResetRubricToOfficial')return{ok:true,savedAt:'2026.07.15 12:32:40'};
  if(fn==='adminGetClassSummary')return{config:mock('getPublicConfig'),학생수:3,평균성취율:71,학생:[
    {학번:'30101',이름:'김민준',반:'1',주차현황:['달성','달성','진행','예정'],성취율:79,점수:17},
    {학번:'30102',이름:'이서연',반:'1',주차현황:['달성','미달','달성','예정'],성취율:64,점수:14},
    {학번:'30103',이름:'박도윤',반:'1',주차현황:['진행','달성','달성','예정'],성취율:71,점수:14}]};
  if(fn==='adminGetStudentDetail')return{학생:{학번:args[0],이름:'김민준',반:'1'},
    점수:{운동달성률:75,정시성:100,성취율:79,점수:17,급간배점:20},
    운동기록:[{날짜:'2026-07-21',주차:1,종류:'유산소',내용:'3.2km 28분',사진:'#'},{날짜:'2026-07-22',주차:1,종류:'근력',내용:'스쿼트 3세트×15',사진:'#'}],
    인바디:[{측정일:'2026-07-20',주차:1,체중:64,체지방률:20,근육량:28,내장지방:5},{측정일:'2026-07-27',주차:2,체중:63,체지방률:19,근육량:28.5,내장지방:5}],
    성찰:[{주차:1,작성일:'2026-07-26',내용:'첫 주라 힘들었지만 뿌듯했다.',교사코멘트:'꾸준함이 좋아요!'}],
    체력:{회차목록:['방학 전','개학 후','1주차','2주차','3주차','4주차'],기록:[
      {회차:'방학 전',있음:true,악력최고:22.4,팔굽혀펴기:16,BMI:21.2,판정:{악력최고:22.4,악력:{등급:3,라벨:'보통'},팔굽혀펴기:{등급:3,라벨:'보통'},BMI:21.2,BMI진단:'정상'}},
      {회차:'개학 후',있음:false},{회차:'1주차',있음:false},{회차:'2주차',있음:false},{회차:'3주차',있음:false},{회차:'4주차',있음:false}]}};
  return {ok:true};
}

/* ---- 초기화 ---- */
/* GAS 웹앱은 샌드박스 iframe이라 target="_blank"가 무시된다 → window.open으로 진짜 새 탭 */
function openNewTab(url,label){
  if(!url||url==='#'||url.slice(-1)==='#'){toast((label||'주소')+' 준비 중입니다 (새로고침 후 다시)');return false;}
  var w=window.open(url,'_blank');
  if(!w)toast('팝업이 차단됐어요. 브라우저에서 팝업 허용 후 다시 눌러주세요.');
  return false;
}
function openStudentMobile(url){
  if(!url||url==='#'||url.slice(-1)==='#'){toast('학생앱 URL이 아직 없습니다 (새로고침 후 다시)');return false;}
  window.open(url,'grofit_student','width=390,height=844,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes');
  return false;
}
function setVerFoot(c){if(!c)return;var el=document.getElementById('ver');
  el.innerHTML='v'+(c.version||'')+(c.배포시각?'<br><span style="color:#5c6a5f">'+c.배포시각+' 배포</span>':'');
  var s=document.getElementById('lk-sheet'),t=document.getElementById('lk-student');
  if(s&&c.시트URL)s.href=c.시트URL;
  A.studentUrl=c.학생앱_URL||c.학생URL||'';
  if(t&&A.studentUrl)t.href=A.studentUrl;
  setGuideLinks(A.studentUrl);
  var q=document.getElementById('qr-img'),qu=document.getElementById('qr-url');
  if(q&&A.studentUrl)q.src='https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data='+encodeURIComponent(A.studentUrl);
  if(qu&&A.studentUrl)qu.textContent=A.studentUrl;}
function copyStudentUrl(){var u=A.studentUrl||'';if(!u){toast('주소가 없습니다');return;}
  navigator.clipboard.writeText(u).then(function(){toast('학생앱 주소 복사됨');}).catch(function(){toast('복사 실패 — 아래 주소를 길게 눌러 복사하세요');});}
/* [0.58.0] 사이드바 배지 — 아직 처리 안 한 수 */
function paintBadges(){
  call('adminBadgeCounts',[],function(r){
    if(!r||!r.ok)return;
    var n=r.n||{};
    [['rv-badge',n.검토],['dr-badge',n.일간],['cm-badge',n.주간],['iq-badge',n.문의],['ft-badge',n.체력]]
      .forEach(function(p){
        var b=document.getElementById(p[0]); if(!b)return;
        var v=Number(p[1])||0;
        b.textContent=v; b.classList.toggle('hidden',v===0);
      });
  });
}
(function(){
  renderBrand();                                   // 로고 먼저 그려두고
  initClasses();loadDash();paintBadges();loadPhrases();
  setInterval(paintBadges,120000);                 // 2분마다 다시 센다
  call('getPublicConfig',[],function(c){setVerFoot(c);applyBrand(c);});   // 테마·앱이름 오면 갱신
})();

/* ═══════════ 검토 — 학생이 낸 기록을 보고 인정 여부를 정한다 ═══════════
   0.54.0. 학생 제출은 '검토'로 쌓이고, 여기서 '인정'이 되어야 주간 달성에 들어간다. */
var RV = { 주차:0, 종류:'', 상태:'검토', rows:[], sel:{}, why:{}, cm:{} };   // [0.52.0] cm = 카드별 코멘트 초안

function rvPals(){
  var wk = Number((A.config&&A.config['총_주차수'])||4);
  var h='<button class="'+(RV.주차===0?'on':'')+'" onclick="rvSet(&quot;주차&quot;,0)">전체</button>';
  for(var i=1;i<=wk;i++) h+='<button class="'+(RV.주차===i?'on':'')+'" onclick="rvSet(&quot;주차&quot;,'+i+')">'+i+'주차</button>';
  document.getElementById('rv-week').innerHTML=h;

  var K=[['','전체'],['유산소','유산소'],['근력','근력']], h2='';
  K.forEach(function(k){ h2+='<button class="'+(RV.종류===k[0]?'on':'')+'" onclick="rvSet(&quot;종류&quot;,&quot;'+k[0]+'&quot;)">'+k[1]+'</button>'; });
  document.getElementById('rv-kind').innerHTML=h2;

  var S=[['검토','검토 대기'],['인정','인정됨'],['미인정','미인정'],['전체','전체']], h3='';
  S.forEach(function(k){ h3+='<button class="'+(RV.상태===k[0]?'on':'')+'" onclick="rvSet(&quot;상태&quot;,&quot;'+k[0]+'&quot;)">'+k[1]+'</button>'; });
  document.getElementById('rv-state').innerHTML=h3;
}
function rvSet(k,v){ RV[k]=v; rvPals(); loadReview(); }

/* ═══════ [0.46.0] 체력측정 입력 현황 — 15초 폴링 ═══════ */
var FT={auto:true,tm:null,prev:null,prevCls:null,first:true};
function ftTimer(on){
  if(FT.tm){clearInterval(FT.tm);FT.tm=null;}
  if(on&&FT.auto)FT.tm=setInterval(function(){loadFitStatus(true);},15000);
  ftAutoPal();
}
function ftAutoPal(){
  var b=document.getElementById('ft-auto'); if(!b)return;
  b.innerHTML='<button class="'+(FT.auto?'on':'')+'" onclick="ftSetAuto(true)">⏱ 자동 15초</button>'
    +'<button class="'+(FT.auto?'':'on')+'" onclick="ftSetAuto(false)">자동 끄기</button>';
}
function ftSetAuto(v){FT.auto=v;ftTimer(document.getElementById('s-fitness').classList.contains('on'));}
function ftNow(){var d=new Date();var z=function(n){return (n<10?'0':'')+n;};return z(d.getHours())+':'+z(d.getMinutes())+':'+z(d.getSeconds());}
function loadFitStatus(quiet){
  var cls=clsOf('fitness');
  if(FT.prevCls!==cls){FT.prev=null;FT.prevCls=cls;}          // 반을 바꾸면 «새로 저장» 비교 기준을 새로 잡는다
  if(!quiet&&!FT.prev)document.getElementById('ft-body').innerHTML='<tr><td colspan="9" class="muted">불러오는 중…</td></tr>';
  call('adminFitnessStatus',[cls,null],function(r){
    if(!r||!r.ok){if(!quiet)toast('체력 현황을 불러오지 못했습니다');return;}
    renderFitStatus(r);
    document.getElementById('ft-upd').textContent='갱신 '+ftNow()+(FT.auto?' · 15초마다 자동':'');
  });
}
function renderFitStatus(r){
  var rounds=r.회차||[], rows=r.rows||[];
  /* 머리글 */
  document.getElementById('ft-head').innerHTML='<tr><th style="text-align:left">이름</th><th>학번</th>'
    +rounds.map(function(x){return '<th>'+esc(x)+'</th>';}).join('')+'<th>남은 회차</th></tr>';
  /* 통계 */
  var miss=r.회차별_미입력||{};
  var worst=rounds.slice().sort(function(a,b){return (miss[b]||0)-(miss[a]||0);})[0];
  document.getElementById('ft-stats').innerHTML=
    '<div class="stat"><div class="v">'+r.인원+'</div><div class="l">'+esc(r.학급)+(r.학급==='전체'?'':'반')+' 인원</div></div>'
    +'<div class="stat"><div class="v" style="color:var(--primary-dark)">'+r.완료+'</div><div class="l">6회차 모두 입력</div></div>'
    +'<div class="stat"><div class="v" style="color:var(--danger)">'+r.미완료+'</div><div class="l">아직 빠진 회차 있음</div></div>'
    +'<div class="stat"><div class="v">'+(worst?(miss[worst]||0):0)+'</div><div class="l">'+(worst?esc(worst)+' 미입력':'')+'</div></div>';
  /* 최근 저장 피드 */
  var feed=(r.최근||[]).map(function(x){
    return '<span class="ftf"><span class="t">'+esc(String(x.시각||'').slice(5,16))+'</span><b>'+esc(x.이름)+'</b>'+esc(x.학번)+' · '+esc(x.회차)+'</span>';}).join('');
  document.getElementById('ft-feed').innerHTML=feed||'<span class="muted" style="font-size:12.5px">아직 저장된 기록이 없습니다</span>';
  /* 표 + 바뀐 줄 감지 */
  var next={}, changed=[];
  var h='';
  rows.forEach(function(x){
    var key=(x.있음||[]).map(function(b){return b?'1':'0';}).join('');
    next[x.학번]=key;
    var isNew=!!(FT.prev&&FT.prev[x.학번]!==undefined&&FT.prev[x.학번]!==key);
    if(isNew){var idx=-1;(x.있음||[]).forEach(function(b,i){if(b&&FT.prev[x.학번].charAt(i)==='0')idx=i;});
      changed.push(x.이름+'('+x.학번+') '+(idx>=0?rounds[idx]:''));}
    h+='<tr'+(isNew?' class="ft-new"':'')+'><td class="name">'+esc(x.이름)+'</td><td>'+esc(x.학번)+'</td>';
    (x.있음||[]).forEach(function(b,i){
      var d=(x.측정일||[])[i]||'', t=(x.입력시각||[])[i]||'';
      h+='<td>'+(b?'<span class="ftc" title="'+esc(t)+'">✓ '+esc(d.slice(5).replace('-','/'))+'</span>':'<span class="ftc no">–</span>')+'</td>';});
    h+='<td>'+(x.빠짐&&x.빠짐.length?'<span class="muted" style="font-size:12px">'+esc(x.빠짐.join(' · '))+'</span>':'<b style="color:var(--primary-dark)">완료 🎉</b>')+'</td></tr>';
  });
  document.getElementById('ft-body').innerHTML=h||'<tr><td colspan="9" class="muted">명렬표에 학생이 없습니다</td></tr>';
  if(changed.length)toast('🆕 새로 저장: '+changed.slice(0,3).join(', ')+(changed.length>3?' 외 '+(changed.length-3)+'명':''));
  FT.prev=next;
  FT.last=r; renderFtRound();
}
/* [0.52.0] 회차 칩 → 그 회차 입력자·미입력자 (반 팔레트로 고른 반 기준) */
function renderFtRound(){
  var r=FT.last; if(!r)return;
  var rounds=r.회차||[];
  if(FT.round===undefined||rounds.indexOf(FT.round)<0)FT.round=rounds[Math.min(rounds.length-1,1)]||rounds[0];
  var pal=document.getElementById('ft-round'); if(pal)pal.innerHTML=rounds.map(function(x){return '<button class="'+(FT.round===x?'on':'')+'" onclick="FT.round=&quot;'+esc(x)+'&quot;;renderFtRound()">'+esc(x)+'</button>';}).join('');
  var i=rounds.indexOf(FT.round), yes=[], no=[];
  (r.rows||[]).forEach(function(x){ ((x.있음||[])[i]?yes:no).push(x); });
  var chip=function(x,cls){return '<span class="'+cls+'">'+esc(x.학번)+' '+esc(x.이름)+'</span>';};
  document.getElementById('ft-round-box').innerHTML=
    '<div class="row" style="justify-content:space-between"><b style="color:var(--primary-dark)">✓ 입력 '+yes.length+'명</b><span class="muted" style="font-size:12px">'+esc(r.학급)+(r.학급==='전체'?'':'반')+' · '+esc(FT.round)+'</span></div>'
    +'<div class="ftlist">'+(yes.length?yes.map(function(x){return chip(x,'');}).join(''):'<span class="muted" style="border:0;background:none">아직 없음</span>')+'</div>'
    +'<div style="margin-top:10px"><b style="color:var(--danger)">– 미입력 '+no.length+'명</b></div>'
    +'<div class="ftlist">'+(no.length?no.map(function(x){return chip(x,'no');}).join(''):'<span style="border:0;background:none;color:var(--primary-dark)">모두 입력 🎉</span>')+'</div>';
}

/* ═══════ [0.50.0] 주간 통계 ═══════ */
var WS={week:0,data:null};
function wsWeeks(){return Number((A.config||{}).총_주차수)||4;}
function wsCurWeek(){
  var c=A.config||{}; if(!c.기간_시작일)return 1;
  var d=Math.floor((new Date()-new Date(c.기간_시작일))/86400000);
  return Math.max(1,Math.min(wsWeeks(),Math.floor(d/7)+1));
}
function wsPal(){
  var box=document.getElementById('pal-wsweek'); if(!box)return;
  if(!WS.week)WS.week=wsCurWeek();
  var h='';
  for(var w=1;w<=wsWeeks();w++)h+='<button class="'+(WS.week===w?'on':'')+'" onclick="wsPick('+w+')">'+w+'주차</button>';
  box.innerHTML=h;
}
function wsPick(w){WS.week=w;wsPal();loadWStats();}
function loadWStats(){
  wsPal();
  document.getElementById('ws-body').innerHTML='<tr><td colspan="20" class="muted">계산하는 중…</td></tr>';
  call('adminWeeklyStats',[WS.week],function(r){
    if(!r||!r.ok){toast('주간 통계를 불러오지 못했습니다');return;}
    WS.data=r; renderWStats(r);
    document.getElementById('ws-upd').textContent='계산 '+ftNow()+' · '+esc(r.기준);
    showSaved('saved-wstats',r.마지막자동저장,false);
  });
  loadWsSaved();
}
function wsPct(n,d){return d?Math.round(n*1000/d)/10:0;}
function renderWStats(r){
  var t=r.전체;
  document.getElementById('ws-range').textContent=r.주차+'주차 · '+r.기간.s+' ~ '+r.기간.e;
  document.getElementById('ws-stats').innerHTML=
    st('제출한 학생',t.제출자+' <span style="font-size:13px;color:var(--muted)">/ '+t.인원+' · '+t.제출률+'%</span>')
   +st('주 목표 채움',t.목표달성자+' <span style="font-size:13px;color:var(--muted)">/ '+t.인원+' · '+t.달성률+'%</span>')
   +st('유산소 2일↑ / 근력 2일↑',t.유산소2일+' <span style="font-size:13px;color:var(--muted)">/</span> '+t.근력2일)
   +st('검토 대기 · 초과',t.검토대기+' <span style="font-size:13px;color:var(--muted)">건 · 초과 '+t.초과건수+'건</span>');
  var head='<tr><th class="grp" rowspan="2" style="text-align:left">반</th><th class="grp" rowspan="2">인원</th>'
    +'<th class="grp" colspan="2">제출</th><th class="grp" colspan="2">목표 채움</th>'
    +'<th class="grp" colspan="5">유산소</th><th class="grp" colspan="5">근력</th>'
    +'<th class="grp" colspan="5">운동 일수(명)</th><th class="grp" rowspan="2">성찰</th><th class="grp" rowspan="2">검토<br>대기</th><th class="grp" colspan="2">초과</th></tr>'
    +'<tr><th>명</th><th>%</th><th>명</th><th>%</th>'
    +'<th>건</th><th>1일↑</th><th>2일↑</th><th>평균km</th><th>평균분</th>'
    +'<th>건</th><th>1일↑</th><th>2일↑</th><th>필수3종</th><th>선택도</th>'
    +'<th>0</th><th>1</th><th>2</th><th>3</th><th>4+</th><th>건</th><th>명</th></tr>';
  document.getElementById('ws-head').innerHTML=head;
  var row=function(lab,o,all){
    return '<tr'+(all?' class="all"':'')+'><td class="name">'+lab+'</td><td>'+o.인원+'</td>'
      +'<td>'+o.제출자+'</td><td>'+o.제출률+'%</td><td>'+o.목표달성자+'</td><td>'+o.달성률+'%</td>'
      +'<td>'+o.유산소건수+'</td><td>'+o.유산소1일+'</td><td>'+o.유산소2일+'</td><td>'+o.평균거리+'</td><td>'+o.평균시간+'</td>'
      +'<td>'+o.근력건수+'</td><td>'+o.근력1일+'</td><td>'+o.근력2일+'</td><td>'+o.필수3종완료+'</td><td>'+o.선택까지+'</td>'
      +o.일수.map(function(n){return '<td>'+n+'</td>';}).join('')
      +'<td>'+o.성찰제출+'</td><td>'+o.검토대기+'</td><td>'+o.초과건수+'</td><td>'+o.초과학생+'</td></tr>';
  };
  var b=row('전체',t,true);
  (r.반목록||[]).forEach(function(c){b+=row(c+'반',r.반별[c],false);});
  document.getElementById('ws-body').innerHTML=b;
  var n='';
  (r.반목록||[]).forEach(function(c){
    var L=r.반별[c].미제출자||[];
    n+='<div class="wsnone"><b>'+c+'반 · '+L.length+'명</b>'
      +(L.length?L.map(function(x){return '<span>'+esc(x.학번)+' '+esc(x.이름)+'</span>';}).join(''):'<span style="color:var(--primary-dark)">모두 제출 🎉</span>')+'</div>';
  });
  document.getElementById('ws-none').innerHTML=n||'<p class="muted">명렬표에 학생이 없습니다</p>';
  renderWsMore(r);
}
/* [0.51.0] 얼마나 했나 — 유산소 양 · 필수 종목별 · 선택 TOP */
function wsMin(m){m=Number(m)||0;return m>=60?(Math.floor(m/60)+'시간 '+(m%60)+'분'):(m+'분');}
function wsSec(sc){sc=Number(sc)||0;if(sc>=3600)return Math.floor(sc/3600)+'시간 '+Math.floor(sc%3600/60)+'분';if(sc>=60)return Math.floor(sc/60)+'분'+(sc%60?' '+(sc%60)+'초':'');return sc+'초';}
function wsNum(n){return Number(n||0).toLocaleString('ko-KR');}
function renderWsMore(r){
  var rows=[['전체',r.전체,true]].concat((r.반목록||[]).map(function(c){return [c+'반',r.반별[c],false];}));
  // 유산소
  document.getElementById('ws-cardio').innerHTML=rows.map(function(x){var o=x[1];
    return '<tr'+(x[2]?' class="all"':'')+'><td class="name">'+x[0]+'</td><td>'+o.유산소건수+'</td><td>'+o.총거리+' km</td><td>'+wsMin(o.총시간)+'</td>'
      +'<td>'+o.평균거리+' km · '+o.평균시간+'분</td><td>'+o.인당거리+' km · '+wsMin(o.인당시간)+'</td><td>'+o.인당운동횟수+'회</td>'
      +'<td>'+(o.최장거리?(o.최장거리.km+' km<span class="sub">'+esc(o.최장거리.학번)+' '+esc(o.최장거리.이름)+'</span>'):'–')+'</td>'
      +'<td>'+(o.최장시간?(wsMin(o.최장시간.min)+'<span class="sub">'+esc(o.최장시간.학번)+' '+esc(o.최장시간.이름)+'</span>'):'–')+'</td></tr>';
  }).join('');
  // 필수 종목별
  var P=['상체','하체','코어'], req=r.필수운동||[];
  document.getElementById('ws-req-lab').textContent=r.주차+'주차 필수 — '+(req.length?req.join(' · '):'');
  var head='<tr><th class="grp" rowspan="2" style="text-align:left">반</th>';
  P.forEach(function(k,i){head+='<th class="grp" colspan="4">'+k+(req[i]?' · '+esc(req[i]):'')+'</th>';});
  head+='</tr><tr>'; P.forEach(function(){head+='<th>건</th><th>학생</th><th>한 번 평균</th><th>총 수행</th>';}); head+='</tr>';
  document.getElementById('ws-req-head').innerHTML=head;
  document.getElementById('ws-req').innerHTML=rows.map(function(x){var o=x[1];
    var h='<tr'+(x[2]?' class="all"':'')+'><td class="name">'+x[0]+'</td>';
    P.forEach(function(k){var p=(o.종목||{})[k];
      if(!p){h+='<td>0</td><td>0</td><td>–</td><td>–</td>';return;}
      var avg=p.방식==='time'?(p.평균세트+'세트 × '+wsSec(p.평균초)):(p.평균세트+'세트 × '+p.평균횟수+'회');
      var tot=p.방식==='time'?wsSec(p.총초):(wsNum(p.총횟수)+'회');
      h+='<td>'+p.건수+'</td><td>'+p.학생수+'</td><td>'+avg+(p.종목?'<span class="sub">'+esc(p.종목)+'</span>':'')+'</td><td><b>'+tot+'</b></td>';
    });
    return h+'</tr>';
  }).join('');
  // 선택 TOP
  var op='';
  rows.forEach(function(x){var L=x[1].선택TOP||[];
    op+='<div class="wsopt"><span style="border:0;background:none;padding-left:0;font-weight:800">'+x[0]+'</span>'
      +(L.length?L.map(function(t){return '<span>'+esc(t.종목)+'<b>'+t.건수+'</b></span>';}).join(''):'<span class="muted" style="border:0;background:none">없음</span>')+'</div>';
  });
  document.getElementById('ws-opt').innerHTML=op;
}
/* ── 카드뉴스 ── */
function wsCardOpen(){
  if(!WS.data){toast('먼저 통계를 불러오세요');return;}
  document.getElementById('wcm').classList.remove('hidden');
  document.getElementById('wc-out').classList.add('hidden');
  document.getElementById('wc-wk').textContent=WS.data.주차+'주차 · '+WS.data.기간.s+' ~ '+WS.data.기간.e;
  wsCardDraw();
}
function wsCardClose(){document.getElementById('wcm').classList.add('hidden');}
function wsCardHTML(r,names){
  var t=r.전체, c=A.config||{};
  var fmtD=function(d){var p=String(d).split('-');return p.length===3?(Number(p[1])+'/'+Number(p[2])):d;};
  var dl=r.기준&&r.기준.indexOf('이전 입력')>=0?r.기준.replace(' 이전 입력',' 기준'):(r.시각.slice(0,16)+' 기준');
  var h='<div class="top"><div class="brand"><div class="logo">HF</div><div><b>혜원핏 주간 결산</b>'
    +'<span>3학년 · '+esc(c.평가명||'운동처방일지').replace(/^\d{4}학년도\s*\d학년\s*\d학기\s*/,'')+' · '+fmtD(r.기간.s)+' ~ '+fmtD(r.기간.e)+'</span></div></div>'
    +'<div class="wk"><b>'+r.주차+'주차</b><span>'+esc(dl)+'</span></div></div>';
  h+='<div class="hero"><div><div class="t">이번 주 운동한 학생</div><div class="n">'+t.제출자+'<small>/ '+t.인원+'명</small></div></div>'
    +'<div class="r">주 '+(c.주간_목표일수||4)+'일 목표 달성 <b style="font-size:40px">'+t.목표달성자+'명</b><br>유산소 '+(c.유산소_최소일수||2)+'일 · 근력 '+(c.근력_최소일수||2)+'일 채운 사람</div></div>';
  // 유산소 · 근력
  var P=['상체','하체','코어'], req=r.필수운동||[], ex='';
  P.forEach(function(k,i){var p=(t.종목||{})[k]; var nm=(p&&p.종목)||req[i]||k;
    var v=!p?'–':(p.방식==='time'?('총 '+wsSec(p.총초)):(wsNum(p.총횟수)+'회'));
    ex+='<div><span>'+esc(nm)+'</span><b>'+v+'</b></div>';});
  var anyP=P.map(function(k){return (t.종목||{})[k];}).filter(Boolean);
  var avgTxt=anyP.length?('한 번에 평균 <b>'+(Math.round(anyP.reduce(function(a,p){return a+p.평균세트;},0)/anyP.length*10)/10)+'세트</b>'):'';
  h+='<div class="grid"><div class="box"><h3>🏃 유산소 — 우리 학년이 함께 달린 거리</h3><div class="big">'+wsNum(t.총거리)+'<small>km</small></div>'
    +'<div class="sub">총 <b>'+t.유산소건수+'회</b> · 한 번에 평균 <b>'+t.평균거리+'km · '+t.평균시간+'분</b><br>1인당 이번 주 <b>'+t.인당거리+'km · '+wsMin(t.인당시간)+'</b>'
    +(names&&t.최장거리?('<br>최장 거리 <b>'+esc(t.최장거리.이름)+' '+t.최장거리.km+'km</b>'):'')+'</div></div>'
    +'<div class="box"><h3>💪 근력 — 필수 3종 총 수행량</h3><div class="ex">'+ex+'</div><div class="sub">'+avgTxt+(avgTxt?' · ':'')+'총 '+t.근력건수+'회 제출</div></div></div>';
  // 반별 참여율 · 일수 분포
  var cls=(r.반목록||[]).map(function(cc){return {c:cc,p:r.반별[cc].제출률};}).sort(function(a,b){return b.p-a.p;});
  var bars=cls.map(function(x,i){return '<div class="bar'+(i===0&&x.p>0?' win':'')+'"><span>'+x.c+'반</span><i><em style="width:'+x.p+'%"></em></i><b>'+x.p+'%</b></div>';}).join('');
  var lab=['0일','1일','2일','3일','4일+'], mx=Math.max.apply(null,t.일수.concat([1]));
  var dist=[4,3,2,1,0].map(function(i){return '<div class="bar"><span>'+lab[i]+'</span><i><em style="width:'+Math.round(t.일수[i]*100/mx)+'%"></em></i><b>'+t.일수[i]+'명</b></div>';}).join('');
  h+='<div class="grid"><div class="box"><h3>🏆 반별 참여율</h3><div class="bars">'+bars+'</div></div>'
    +'<div class="box"><h3>📈 운동 일수 분포</h3><div class="bars">'+dist+'</div></div></div>';
  var none=t.일수[0];
  h+='<p class="msg">'+(none?('아직 시작 못 한 <b>'+none+'명</b>, '+(r.다음주필수?(r.주차+1)+'주차부터':'남은 기간')+' 같이 가자 🙌 &nbsp; '):'')+'성찰 쓴 사람 <b>'+t.성찰제출+'명</b></p>';
  var nx=r.다음주필수;
  h+='<div class="foot"><div class="l">'+(nx?'다음 주 필수 운동<b>'+(r.주차+1)+'주차 · 상체 · 하체 · 코어</b>':'4주 완주<b>수고했어요! 감상문으로 마무리 🎉</b>')+'</div>'
    +'<div class="r">'+(nx?nx.map(function(n){return '<span>'+esc(n)+'</span>';}).join(''):'')+'</div></div>';
  return h;
}
function wsCardDraw(){
  var names=document.getElementById('wc-names').checked;
  var el=document.getElementById('wc'); el.innerHTML=wsCardHTML(WS.data,names);
  var stage=document.getElementById('wc-stage');
  var k=Math.min((stage.clientWidth-4)/1080, 0.62);
  el.style.transform='scale('+k+')'; stage.style.height=Math.ceil(1350*k)+'px';
  document.getElementById('wc-out').classList.add('hidden');
}
function wsCardImage(){
  if(typeof html2canvas==='undefined'){toast('이미지 도구를 못 불러왔습니다 · 새로고침 후 다시');return;}
  var src=document.getElementById('wc'), clone=src.cloneNode(true);
  clone.id='wc-clone'; clone.style.cssText='position:fixed;left:-12000px;top:0;transform:none';
  document.body.appendChild(clone);
  toast('이미지를 만드는 중…');
  html2canvas(clone,{scale:1,width:1080,height:1350,backgroundColor:'#0E120C',useCORS:true,logging:false}).then(function(cv){
    clone.remove();
    var img=document.getElementById('wc-img'); img.src=cv.toDataURL('image/png');
    document.getElementById('wc-out').classList.remove('hidden');
    img.scrollIntoView({behavior:'smooth',block:'start'});
  }).catch(function(e){clone.remove();toast('이미지 변환 실패: '+e.message);});
}
async function wsSnapshot(){
  if(!(await askP(WS.week+'주차 통계를 «주간통계» 시트에 지금 저장할까요?'+String.fromCharCode(10)+'(마감이 지난 주차면 22:00 이전 입력 기준, 아니면 지금 기준)')))return;
  call('snapshotWeeklyStats',[WS.week],function(r){
    if(!r||!r.ok){toast('저장하지 못했습니다');return;}
    toast('✅ 저장됨 · '+r.행+'행 · '+r.기준);
    showSaved('saved-wstats',r.savedAt,true);
    loadWsSaved();
  });
}
function loadWsSaved(){
  call('adminWeeklyStatsSaved',[WS.week],function(r){
    var box=document.getElementById('ws-saved'); if(!box)return;
    var rows=((r&&r.rows)||[]).filter(function(x){return String(x['반'])==='전체';});
    if(!rows.length){box.innerHTML='<tr><td colspan="8" class="muted">이 주차에 저장된 스냅샷이 아직 없습니다</td></tr>';return;}
    box.innerHTML=rows.map(function(x){
      return '<tr><td>'+esc(x['스냅샷시각'])+'</td><td>'+esc(x['주차'])+'주</td><td style="font-size:11.5px">'+esc(x['기준'])+'</td>'
        +'<td>'+esc(x['제출자'])+'/'+esc(x['인원'])+' <span class="muted">('+esc(x['제출률'])+'%)</span></td>'
        +'<td>'+esc(x['목표달성자'])+' <span class="muted">('+esc(x['달성률'])+'%)</span></td>'
        +'<td>'+esc(x['유산소2일↑'])+'</td><td>'+esc(x['근력2일↑'])+'</td><td>'+esc(x['성찰제출'])+'</td></tr>';
    }).join('');
  });
}
/* 설정 탭 — 자동 저장 트리거 */
function loadWsTrigger(){
  call('weeklyTriggerStatus',[],function(r){
    var el=document.getElementById('wstrig-status'); if(!el)return;
    if(!r||!r.ok){el.textContent='상태를 확인하지 못했습니다';return;}
    el.innerHTML=r.installed
      ?'<b style="color:var(--primary-dark)">✅ 켜져 있음</b> · 매주 일요일 22시대에 자동 저장'+(r.lastRun?(' · 마지막 저장 '+esc(r.lastRun)):' · 아직 저장된 적 없음')
      :'<b style="color:var(--muted2)">꺼져 있음</b> <span class="muted">— «자동 저장 켜기»를 한 번 누르면 계속 돕니다.</span>';
    showSaved('saved-wstrig',r.savedAt,false);
  });
}
function wsTrigger(on){
  call(on==='on'?'installWeeklyStatsTrigger':'removeWeeklyStatsTrigger',[],function(r){
    if(!r||!r.ok){toast('처리하지 못했습니다');return;}
    toast(on==='on'?'⏰ 자동 저장을 켰습니다':'자동 저장을 껐습니다');
    if(r.savedAt)showSaved('saved-wstrig',r.savedAt,true);
    loadWsTrigger();
  });
}

/* ═══════ [0.47.0] 읽을거리 읽음 현황 ═══════ */
function loadReadingStatus(){
  document.getElementById('rg-body').innerHTML='<tr><td colspan="10" class="muted">불러오는 중…</td></tr>';
  call('adminReadingStatus',[clsOf('reading')],function(r){
    if(!r||!r.ok){toast('읽음 현황을 불러오지 못했습니다');return;}
    var W=r.주차||[1,2,3,4], K=r.종류||['마음','지식'], rows=r.rows||[], g=r.집계||{};
    var head='<tr><th style="text-align:left">이름</th><th>학번</th>';
    W.forEach(function(w){K.forEach(function(k){head+='<th>'+w+'주 '+(k==='마음'?'♥':'📖')+'</th>';});});
    head+='<th>읽은 수</th></tr>';
    document.getElementById('rg-head').innerHTML=head;
    var st='';
    W.forEach(function(w){st+='<div class="stat"><div class="v">'+(g[w+'-마음']||0)+' <span style="font-size:13px;color:var(--muted)">/ '+(g[w+'-지식']||0)+'</span></div><div class="l">'+w+'주차 ♥마음 / 📖지식 읽은 인원 (총 '+r.인원+')</div></div>';});
    document.getElementById('rg-stats').innerHTML=st;
    var h='';
    rows.forEach(function(x){
      h+='<tr><td class="name">'+esc(x.이름)+'</td><td>'+esc(x.학번)+'</td>';
      W.forEach(function(w){K.forEach(function(k){var at=(x.읽음||{})[w+'-'+k]||'';
        h+='<td>'+(at?'<span class="ftc" title="'+esc(at)+'"'+(k==='마음'?' style="background:#fbe9f2;color:#a4437a"':'')+'>✓</span>':'<span class="ftc no">–</span>')+'</td>';});});
      h+='<td><b>'+x.읽은수+'</b><span class="muted" style="font-size:11px"> / '+(W.length*K.length)+'</span></td></tr>';
    });
    document.getElementById('rg-body').innerHTML=h||'<tr><td colspan="10" class="muted">명렬표에 학생이 없습니다</td></tr>';
    document.getElementById('rg-upd').textContent='갱신 '+ftNow();
  });
}

function loadReview(){
  rvPals();
  var body=document.getElementById('rv-body');
  body.innerHTML='<div class="card"><p class="muted">불러오는 중…</p></div>';
  RV.sel={}; RV.why={}; rvBar();
  call('adminReviewList',[{주차:RV.주차,학급:clsOf('review'),종류:RV.종류,상태:RV.상태}],function(r){
    if(!r||!r.ok){ body.innerHTML='<div class="card"><p class="muted">'+esc((r&&r.msg)||'불러오지 못했습니다')+'</p></div>'; return; }
    RV.rows=r.rows||[];
    document.getElementById('rv-cnt').textContent=RV.rows.length+'건';
    renderReview();
    rvBadge();
  });
}

function rvBadge(){
  call('adminReviewStats',[],function(r){
    var b=document.getElementById('rv-badge'); if(!b||!r||!r.ok)return;
    var n=Number((r.상태||{})['검토'])||0;
    b.textContent=n; b.classList.toggle('hidden',n===0);
  });
}

function renderReview(){
  var body=document.getElementById('rv-body');
  if(!RV.rows.length){ body.innerHTML='<div class="card"><p class="muted">해당 조건에 기록이 없습니다.</p></div>'; return; }
  var h='';
  RV.rows.forEach(function(x,i){
    var warn=(x.경고||[]);
    var dup=!!(x.중복사진||x.중복코드);
    var pick=RV.sel[x.row]||'';
    var cls='rvcard'+(dup?' dup':(warn.length?' warn':''))+(pick==='인정'?' done-ok':(pick==='미인정'?' done-no':''));

    var ph = x.fileId
      ? '<img class="rvph" src="https://drive.google.com/thumbnail?id='+esc(x.fileId)+'&sz=w600" '
        +'onclick="rvZoom(&quot;'+esc(x.fileId)+'&quot;)" onerror="this.classList.add(&quot;none&quot;);this.removeAttribute(&quot;src&quot;);this.alt=&quot;사진을 열 수 없음&quot;">'
      : '<div class="rvph none">사진 없음</div>';

    var tags='<span class="rvtag '+(x.종류==='유산소'?'c':'s')+'">'+esc(x.종류)+'</span>'
      +'<span class="rvtag">'+esc(x.주차)+'주차</span>'
      +'<span class="rvtag">'+esc(x.상태)+'</span>'
      +(Number(x.초과일)>0?'<span class="rvwarn">⏰ '+Number(x.초과일)+'일 초과</span>':'')
      +(x.사진운동?'<span class="rvtag s">📷 '+esc(x.사진운동)+'</span>':'');   // [0.60.0]
    warn.forEach(function(w){ tags+='<span class="rvwarn">⚠ '+esc(w)+'</span>'; });

    var kv='';
    if(x.종류==='유산소'){
      kv+='<dt>학생 입력</dt><dd><b>'+esc(x.거리||'-')+'</b> km · <b>'+esc(x.시간||'-')+'</b> 분</dd>';
      if(x.분석거리) kv+='<dt>사진 분석</dt><dd>'+esc(x.분석거리)+' km · '+esc(x.분석시간||'-')+' 분'
        +(x.차이!==''&&x.차이!==0?' <b style="color:#c0392b">(차이 '+esc(x.차이)+'km)</b>':'')+'</dd>';
    }
    kv+='<dt>내용</dt><dd>'+esc(x.내용||'-')+'</dd>';
    kv+='<dt>성찰</dt><dd>'+esc(x.성찰||'—')+'</dd>';
    if(x.파트너) kv+='<dt>함께</dt><dd>'+esc(x.파트너)+'</dd>';
    if(x.사진코드) kv+='<dt>사진코드</dt><dd style="font-family:monospace">'+esc(x.사진코드)+'</dd>';
    if((x.같은사진||[]).length) kv+='<dt>같은 사진</dt><dd style="color:#c0392b">'+esc((x.같은사진||[]).join(' / '))+'</dd>';
    if(x.검사메모) kv+='<dt>메모</dt><dd class="muted" style="font-size:12px">'+esc(x.검사메모)+'</dd>';

    /* [0.52.0] 반영 시각 칩 — 인정 버튼 왼쪽(카드 머리 오른끝) */
    var done=x.검토일시?'<span class="rvdone'+(x.상태==='미인정'?' no':'')+'" id="rvdone-'+x.row+'">'+(x.상태==='미인정'?'✕':'✅')+' '+esc(x.검토일시)+'</span>'
                      :'<span class="rvdone hidden" id="rvdone-'+x.row+'"></span>';
    if(!RV.cm[x.row]) RV.cm[x.row]={t:x.코멘트||'',s:x.스티커||''};

    h+='<div class="'+cls+'" id="rvc-'+x.row+'">'
      +'<div>'+ph+'</div>'
      +'<div><div class="rvhd"><span class="who">'+esc(x.학번)+' '+esc(x.이름)+'</span> '
        +'<span class="muted">'+esc(x.날짜)+'</span> '+tags+done+'</div>'
        +'<dl class="rvkv">'+kv+'</dl>'+rvCmHTML(x)+'</div>'
      +'<div class="rvbtns">'
        +'<button class="'+(pick==='인정'?'on-ok':'')+'" onclick="rvPick('+x.row+',&quot;인정&quot;)">✅ 인정</button>'
        +'<button class="'+(pick==='미인정'?'on-no':'')+'" onclick="rvPick('+x.row+',&quot;미인정&quot;)">✕ 미인정</button>'
        +'<input placeholder="사유(선택) · 미인정이면 학생에게 개인 공지로 감" value="'+escA(RV.why[x.row]||'')+'" oninput="RV.why['+x.row+']=this.value">'
        +(phList('미인정').length?('<div class="whyex">'+phList('미인정').slice(0,5).map(function(p){
            return '<button type="button" title="'+escA(p.문구)+'" onclick="phWhy('+x.row+',this.dataset.t)" data-t="'+escA(p.문구)+'">'+esc(p.문구.slice(0,14))+'…</button>';}).join('')+'</div>'):'')
        +(x.종류==='근력'&&x.fileId?'<button class="rvcode" onclick="rvCode('+x.row+',this)">🔍 사진 코드 읽기</button>':'')
        +(x.fileId?'<a class="muted" style="font-size:11.5px;text-align:center;cursor:pointer" onclick="lbOpen(&quot;'+esc(x.fileId)+'&quot;,&quot;'+esc(x.사진||'')+'&quot;)">🔍 사진 크게</a>':'')
      +'</div></div>';
  });
  body.innerHTML=h;
  /* [0.62.0] 아직 피드백이 없는 카드는 초안을 미리 채워 둔다 */
  RV.rows.forEach(function(x){ if(!x.코멘트 && !x.스티커) dfFill(x.row,false); });
}
/* ═══════ [0.54.0] 오늘의 인사 ═══════ */
var GR={rows:[]};
var GR_EMO=['💪','🔥','🌤️','☔','🌙','🍀','👏','😊','🏃','🎉','☀️','❄️','🍂','⏰','📸','✨'];
function loadGreet(){
  document.getElementById('gr-body').innerHTML='<tr><td colspan="5" class="muted">불러오는 중…</td></tr>';
  call('adminGetGreetings',[],function(r){
    if(!r||!r.ok){toast('인사를 불러오지 못했습니다');return;}
    GR.rows=r.rows||[]; renderGreet(); showSaved('saved-greet',r.savedAt,false);
  });
}
function renderGreet(){
  document.getElementById('gr-body').innerHTML=GR.rows.map(function(x,i){
    var d=x.날짜.split('-');
    return '<tr class="'+(x.오늘?'today':(x.지남?'past':''))+'">'
      +'<td class="d">'+Number(d[1])+'/'+Number(d[2])+'('+esc(x.요일)+')'+(x.오늘?' <span class="muted">오늘</span>':'')+'</td>'
      +'<td class="muted">'+x.주차+'주 '+x.일째+'일</td>'
      +'<td><button type="button" class="em" onclick="grEmoOpen('+i+',this)">'+(x.이모지?grEmoHTML(x.이모지):'＋')+'</button></td>'
      +'<td><input class="msg" value="'+esc(x.문구)+'" placeholder="예: '+x.주차+'주차 '+x.일째+'일째 운동이다. 오늘도 힘내자!" oninput="GR.rows['+i+'].문구=this.value;grPreview()"></td>'
      +'<td><input type="checkbox" '+(x.사용?'checked':'')+' onchange="GR.rows['+i+'].사용=this.checked;grPreview()"></td></tr>';
  }).join('');
  grPreview();
}
function grEmoHTML(e){
  return /^(verygood|good|nice|peace|regret|frustration|sob|wail|no)$/.test(e)
    ? '<img src="'+STK_BASE+'st-'+e+'.png" alt="" style="width:26px;height:26px;object-fit:contain">' : esc(e);
}
var GR_I=-1;
function grEmoOpen(i,btn){
  GR_I=i;
  var p=document.getElementById('empal');
  if(!p){ p=document.createElement('div'); p.id='empal'; p.className='empal hidden'; document.body.appendChild(p); }
  p.innerHTML=STK.map(function(k){return '<button type="button" title="'+k.n+'" onclick="grEmoPick(&quot;'+k.k+'&quot;)"><img src="'+STK_BASE+'st-'+k.k+'.png" alt=""></button>';}).join('')
    +GR_EMO.map(function(e){return '<button type="button" onclick="grEmoPick(&quot;'+e+'&quot;)">'+e+'</button>';}).join('')
    +'<button type="button" style="width:100%;font-size:12px;font-weight:700" onclick="grEmoPick(&quot;&quot;)">지우기</button>';
  var r=btn.getBoundingClientRect();
  p.style.left=Math.min(r.left,window.innerWidth-262)+'px';
  p.style.top=Math.min(r.bottom+6,window.innerHeight-220)+'px';
  p.classList.remove('hidden');
}
function grEmoPick(e){
  if(GR_I>=0){ GR.rows[GR_I].이모지=e; renderGreet(); }
  document.getElementById('empal').classList.add('hidden');
}
document.addEventListener('click',function(ev){
  var p=document.getElementById('empal');
  if(p&&!p.classList.contains('hidden')&&!p.contains(ev.target)&&!(ev.target.classList&&ev.target.classList.contains('em')))p.classList.add('hidden');
});
function grPreview(){
  var t=GR.rows.filter(function(x){return x.오늘;})[0];
  var box=document.getElementById('gr-preview'), lab=document.getElementById('gr-today-date');
  if(lab)lab.textContent=t?(t.날짜+' · '+t.주차+'주차 '+t.일째+'일째'):'평가 기간이 아닙니다';
  if(!box)return;
  if(!t||!t.사용||!t.문구.trim()){ box.innerHTML='<p class="muted" style="font-size:13px;margin:0">오늘은 인사가 뜨지 않습니다(문구가 비었거나 «사용» 해제).</p>'; return; }
  box.innerHTML='<div class="grbar"><span class="em">'+(t.이모지?grEmoHTML(t.이모지):'👋')+'</span>'
    +'<span class="tx">'+esc(t.문구)+'</span><span class="x">✕</span></div>';
}
function grSave(){
  call('adminSaveGreetings',[GR.rows.map(function(x){return {날짜:x.날짜,이모지:x.이모지,문구:x.문구,사용:x.사용};})],function(r){
    if(!r||!r.ok){toast('저장 실패');return;}
    toast('✅ 인사 '+r.저장+'일 저장'); showSaved('saved-greet',r.savedAt,true);
  });
}
async function grSeed(){
  if(!(await askP('비어 있는 날에 «n주차 n일째 …» 기본 문장을 채울까요?\n\n이미 쓴 날은 그대로 둡니다.')))return;
  call('adminSeedGreetings',[],function(r){
    if(!r||!r.ok){toast('실패');return;}
    toast('✨ 기본 문장을 채웠습니다'); loadGreet();
  });
}

/* ═══════ [0.62.0] 피드백 초안 자동 작성 ═══════
   그 기록에 이미 있는 것(거리·시간·페이스·세트·파트너·초과일)과 학생이 쓴 성찰을 읽어
   두세 문장을 만든다. 선생님이 고쳐 쓰는 «밑글»이지 완성된 답이 아니다. */
function dfPace(x){
  var d=Number(x.거리)||0, m=Number(x.시간)||0;
  if(x.종류!=='유산소'||!d||!m) return null;
  var p=m/d; return {v:p, txt:Math.floor(p)+"'"+String(Math.round((p%1)*60)).padStart(2,'0')+'"'};
}
function dfPick(a){ return a[Math.floor(Math.random()*a.length)]; }
function draftFeedback(x){
  var s=String(x.성찰||''), bits=[], has=function(re){return re.test(s);};
  var d=Number(x.거리)||0, m=Number(x.시간)||0, p=dfPace(x);

  /* ① 기록을 짚어 준다 — 유산소는 «페이스»가 먼저다.
     같은 3km라도 8분대로 뛴 것과 15분대로 걸은 것은 다른 운동이다. */
  if(x.종류==='유산소'){
    var amt = d>=5 ? (d+'km') : (m>=30 ? (Math.round(m)+'분') : (d?(d+'km'):''));
    if(!p){
      bits.push(d||m ? (dfPick(['오늘도 나선 것부터가 잘한 거야.','움직인 게 제일 중요해.'])) : '기록을 올려 줘서 고마워.');
    }else if(p.v<3){                       // 사람이 낼 수 없는 속도
      bits.push('페이스가 '+p.txt+'로 나오는데, 거리와 시간을 다시 확인해 줄래?');
    }else if(p.v<5){                       // 5'00" 미만 — 아주 빠름
      bits.push('페이스 '+p.txt+'! 아주 빠르게 달렸구나. 대단하다.');
    }else if(p.v<6.5){                     // 달리기
      bits.push('페이스 '+p.txt+'면 제대로 달린 거야. '+(amt?amt+'를 그 속도로 갔다니 훌륭해.':'훌륭해.'));
    }else if(p.v<8){                       // 가벼운 달리기
      bits.push('페이스 '+p.txt+', 달리기 속도가 잘 나왔어.'+(amt?(' '+amt+'나 이어 간 것도 좋다.'):''));
    }else if(p.v<10){                      // 조깅
      bits.push('페이스 '+p.txt+'면 조깅으로 딱 좋은 속도야.'+(amt?(' '+amt+' 잘했어.'):''));
    }else if(p.v<12){                      // 가벼운 조깅 / 아주 빠른 걷기
      bits.push('페이스 '+p.txt+'는 가벼운 조깅 속도야. 숨이 조금 차는 정도면 딱 좋아.');
    }else if(p.v<15){                      // 빠르게 걷기
      bits.push('페이스 '+p.txt+'면 빠르게 걷기 정도야. 이 속도도 좋은 유산소란다.');
    }else if(p.v<=25){                     // 걷기 — 조금 더 권한다
      bits.push('페이스 '+p.txt+'는 걷기 속도야. 다음엔 중간중간 조금씩 뛰어 보자.');
    }else{
      bits.push('페이스가 '+p.txt+'로 나오는데, 시간은 «활성 시간»으로 적었는지 확인해 줄래?');
    }
    if(p && p.v>=3 && p.v<=25 && d>=5) bits.push(d+'km를 그 페이스로 간 게 오늘의 큰 성과야.');
  }else{
    var n=String(x.내용||'').split(',').filter(function(v){return v.indexOf('필수')>=0;}).length;
    bits.push(n>=3?'필수 세 가지를 빠짐없이 채운 게 좋았어.':'근력까지 챙긴 게 좋다.');
  }

  /* [0.64.1] ①-2 운동자각도(1~5) — 페이스와 함께 보면 «이 학생에게» 어땠는지가 보인다 */
  var rpe=Number(x.자각도)||0;
  if(rpe){
    if(rpe>=4 && p && p.v>=11) bits.push('힘들었다고 했으니, 네게는 충분히 센 운동이었어. 그거면 된 거야.');
    else if(rpe>=4) bits.push('자각도 '+rpe+'면 꽤 몰아붙였구나. 오늘은 푹 쉬어 주자.');
    else if(rpe<=2 && p && p.v<=9) bits.push('그 속도로 뛰고도 여유가 있었다니 체력이 붙었구나.');
    else if(rpe<=2) bits.push('아직 여유가 있었다면 다음엔 조금만 더 해 봐도 좋겠다.');
  }

  /* [0.64.1] ①-3 운동파트너 */
  var pn=String(x.파트너||'').trim();
  if(pn && pn!=='혼자'){
    var friend=pn.split(/[,·/]/)[0].trim();
    bits.push(dfPick([friend+'와 함께라 더 오래 갈 수 있었겠다.',
                      friend+'랑 같이 한 게 오늘의 힘이었겠구나.',
                      '친구와 같이 하면 빠지기 어려워서 좋아. '+friend+'에게도 고맙다고 전해 줘.']));
  }else if(pn==='혼자'){
    bits.push(dfPick(['혼자서 나선 게 제일 어려운 일인데, 그걸 해냈구나.','혼자 하는 날은 마음먹기가 반이야. 잘했어.']));
  }

  /* ② 학생이 쓴 성찰에 답한다 */
  var say=[];
  if(has(/근육통|아팠|아프|욱씬|쑤시|땡기/)) say.push('근육통이 있을 땐 무리하지 말고, 끝나고 스트레칭 꼭 하자.');
  if(has(/오랜만|처음|한동안|개월/)) say.push('오랜만인데 다시 나선 것 자체가 큰 걸음이야.');
  if(has(/힘들|지치|숨|헉헉/)) say.push('힘들었을 텐데 끝까지 해낸 게 멋지다.');
  if(has(/아쉽|못했|부족|느려/)) say.push('아쉬움이 남는다는 건 다음이 있다는 뜻이야.');
  if(has(/걸었|걷다|걸은|걷기/)) say.push('뛰다 걸어도 괜찮아. 시간을 채운 게 더 중요해.');
  if(has(/즐거|좋았|만족|뿌듯|재미/)) say.push('즐겁게 했다니 그게 제일 좋다.');
  if(has(/목표|다음엔|다음에|계획|해보겠|할 것이다|보여주겠/)) say.push('다음 목표까지 스스로 세운 게 훌륭해.');
  if(has(/준비운동|스트레칭|마무리/)) say.push('준비운동까지 챙기는 습관, 그대로 가자.');
  if(has(/친구|같이|함께|언니|동생/)) say.push('함께 하면 더 오래 갈 수 있어.');
  if(say.length) bits.splice(1,0,dfPick(say));      // 성찰에 답하는 말을 앞쪽에 둔다

  /* ③ 마무리 한 마디 */
  if(bits.length<2) bits.push(dfPick(['이대로 이어 가 보자.','내일도 같은 시간에 만나자!','꾸준함이 제일 큰 힘이야.']));
  if(Number(x.초과일)>0) bits.push('다음엔 그날 바로 올리면 더 좋아.');

  var out=bits.slice(0,3).join(' ');
  if(out.length>160) out=bits.slice(0,2).join(' ');
  return out;
}
/* 입력창에 초안을 넣는다. force=false 면 빈 칸일 때만 */
function dfFill(row,force){
  var x=(RV.rows||[]).filter(function(y){return y.row===row;})[0]; if(!x)return;
  var inp=document.getElementById('rvcmt-'+row); if(!inp)return;
  if(!force && String(inp.value||'').trim()) return;      // 이미 쓴 글은 건드리지 않는다
  var txt=draftFeedback(x);
  inp.value=txt; RV.cm[row]=RV.cm[row]||{t:'',s:''}; RV.cm[row].t=txt;
  if(force){ inp.focus(); inp.setSelectionRange(txt.length,txt.length); }
}

/* ═══════ [0.61.0] 피드백 예시 문구 ═══════ */
var PH={kinds:['칭찬','격려','확인','미인정'], kind:'칭찬', rows:[]};
function loadPhrases(){
  call('adminGetPhrases',[],function(r){
    /* [0.64.2] 시작하자마자 응답이 오면 PH 가 아직 안 만들어졌을 수 있다(아래에서 만든다) */
    if(!PH) PH={kinds:['칭찬','격려','확인','미인정'], kind:'칭찬', rows:[]};
    if(!r||!r.ok)return;
    PH.kinds=r.kinds||PH.kinds; PH.rows=r.rows||[];
    renderPhKind(); showSaved('saved-phrase',r.savedAt,false);
    if(typeof RV!=='undefined'&&RV&&RV.rows&&RV.rows.length&&typeof renderReview==='function')renderReview();
  });
}
function renderPhKind(){
  var box=document.getElementById('ph-kind'); if(!box)return;
  box.innerHTML=PH.kinds.map(function(k){
    var n=PH.rows.filter(function(x){return x.구분===k;}).length;
    return '<button class="'+(PH.kind===k?'on':'')+'" onclick="phPick(&quot;'+k+'&quot;)">'+k+' '+n+'</button>';}).join('');
  var ta=document.getElementById('ph-text');
  if(ta)ta.value=PH.rows.filter(function(x){return x.구분===PH.kind;}).map(function(x){return x.문구;}).join('\n');
  var c=document.getElementById('ph-cnt'); if(c)c.textContent='전체 '+PH.rows.length+'개';
}
function phPick(k){ phPull(); PH.kind=k; renderPhKind(); }
/* 지금 칸에 적힌 것을 그 구분의 목록으로 거둬들인다 */
function phPull(){
  var ta=document.getElementById('ph-text'); if(!ta)return;
  var lines=ta.value.split('\n').map(function(x){return x.trim();}).filter(Boolean);
  PH.rows=PH.rows.filter(function(x){return x.구분!==PH.kind;})
    .concat(lines.map(function(x){return {구분:PH.kind,문구:x,사용:true};}));
}
function phSave(){
  phPull();
  call('adminSavePhrases',[PH.rows.map(function(x){return {구분:x.구분,문구:x.문구,사용:x.사용!==false};})],function(r){
    if(!r||!r.ok){toast('저장 실패');return;}
    toast('💬 예시 문구 '+r.저장+'개 저장'); showSaved('saved-phrase',r.savedAt,true);
    loadPhrases();
  });
}
async function phSeed(){
  if(!(await askP('기본 문구를 채울까요?\n\n이미 적어 둔 문구는 그대로 둡니다.')))return;
  call('adminSeedPhrases',[],function(r){ if(!r||!r.ok){toast('실패');return;} toast('✨ 기본 문구를 채웠습니다'); loadPhrases(); });
}
/* 카드에서 쓸 목록 (구분별, 사용중인 것만) */
function phList(kind){
  return (PH.rows||[]).filter(function(x){return x.구분===kind && x.사용!==false;});
}
function phFill(row,txt,name){
  var t2=String(txt).replace(/\{이름\}/g, String(name||'').replace(/^\S*\s*/,'')||name||'');
  var inp=document.getElementById('rvcmt-'+row); if(!inp)return;
  inp.value=t2; RV.cm[row]=RV.cm[row]||{t:'',s:''}; RV.cm[row].t=t2; inp.focus();
  call('bumpPhraseUse',[txt],function(){});
}
function phWhy(row,txt){
  var c=document.getElementById('rvc-'+row); if(!c)return;
  var inp=c.querySelector('.rvbtns input'); if(!inp)return;
  inp.value=txt; RV.why[row]=txt; inp.focus();
  call('bumpPhraseUse',[txt],function(){});
}

/* [0.52.0] 하루 기록 코멘트 — 진호 스티커 + 한 줄. 저장하면 그 학생 개인 공지로 바로 간다 */
/* [0.61.0] 빠른 단추는 «설정 → 피드백 예시 문구» 목록에서 나온다 */
function rvCmHTML(x){
  var c=RV.cm[x.row]||{t:'',s:''};
  var stks='<button type="button" class="one'+(c.s?' on':'')+'" id="stkone-'+x.row+'" title="눌러서 캐릭터 고르기" onclick="stkPalOpen('+x.row+',this,event)">'
    +(c.s?'<img src="'+STK_BASE+'st-'+c.s+'.png" alt="">':'<span class="ph">＋<br>캐릭터</span>')+'</button>';
  var quick=['칭찬','격려','확인'].map(function(k){
    return phList(k).slice(0,6).map(function(p){
      return '<button type="button" class="q'+k+'" title="'+k+'" onclick="phFill('+x.row+',this.dataset.t,&quot;'+escA(x.이름)+'&quot;)" data-t="'+escA(p.문구)+'">'+esc(p.문구)+'</button>';
    }).join('');
  }).join('');
  if(!quick) quick='<span class="muted" style="font-size:12px">설정 → «💬 피드백 예시 문구» 에서 문구를 만들어 두면 여기에 단추로 나옵니다</span>';
  return '<div class="rvcm" id="rvcm-'+x.row+'">'
    +'<div class="quick">'+quick+'</div>'
    +'<div class="row2"><span class="muted lab2">💬 피드백</span>'+stks
    +'<button type="button" class="dfbtn" title="기록과 성찰을 보고 초안을 다시 만듭니다" onclick="dfFill('+x.row+',true)">✨ 초안</button>'
    +'<input id="rvcmt-'+x.row+'" placeholder="학생에게 한 줄 (저장하면 개인 공지로 바로 감)" value="'+escA(c.t)+'" oninput="RV.cm['+x.row+'].t=this.value">'
    +'<button type="button" onclick="rvCmSave('+x.row+')">저장</button>'
    +(x.코멘트||x.스티커?'<button type="button" style="background:#fff;color:var(--danger);border:1px solid var(--line)" onclick="rvCmDel('+x.row+')">지우기</button>':'')+'</div>'
    +'<div class="cmprev" id="rvcmp-'+x.row+'">'+(x.코멘트일시?'✅ 저장됨 · '+esc(x.코멘트일시)+' · 학생에게 개인 공지로 갔습니다':'')+'</div>'
    +'</div>';
}
/* [0.54.1] 캐릭터 팔레트 — 한 개를 크게 보여 주고, 누르면 6종을 크게 펼친다 */
var STK_ROW=-1;
/* [0.57.3] 팔레트를 «버튼 바로 밑»에 붙인다 — 화면 좌표를 쓰지 않으므로 틀이 확대·축소돼도 어긋나지 않는다 */
function stkPalOpen(row,btn,ev){
  if(ev&&ev.stopPropagation)ev.stopPropagation();
  STK_ROW=row;
  var cur=(RV.cm[row]||{}).s||'';
  var p=document.getElementById('stkpal');
  if(!p){ p=document.createElement('div'); p.id='stkpal'; p.className='stkpal hidden'; }
  var wrap=btn.parentNode;
  if(!wrap.classList.contains('stkwrap')){                 // 버튼을 감싸는 자리를 만든다
    var w=document.createElement('span'); w.className='stkwrap';
    btn.parentNode.insertBefore(w,btn); w.appendChild(btn); wrap=w;
  }
  wrap.appendChild(p);
  p.innerHTML=STK.map(function(k){
      return '<button type="button" class="'+(cur===k.k?'on':'')+'" onclick="stkPalPick(&quot;'+k.k+'&quot;,event)">'
        +'<img src="'+STK_BASE+'st-'+k.k+'.png" alt="'+k.n+'"><span>'+k.n+'</span></button>';}).join('')
    +'<button type="button" class="none" onclick="stkPalPick(&quot;&quot;,event)">캐릭터 없이</button>';
  p.classList.remove('hidden');
}
function stkPalPick(k,ev){
  if(ev&&ev.stopPropagation)ev.stopPropagation();
  var row=STK_ROW;
  if(row>=0){
    RV.cm[row]=RV.cm[row]||{t:'',s:''};
    RV.cm[row].s=k;
    var b=document.getElementById('stkone-'+row);
    if(b){ b.classList.toggle('on',!!k);
      b.innerHTML=k?('<img src="'+STK_BASE+'st-'+k+'.png" alt="">'):'<span class="ph">＋<br>캐릭터</span>';
      var lab=b.nextElementSibling; if(lab&&lab.classList.contains('lab'))lab.textContent=k?'눌러서 바꾸기':'눌러서 고르기';
    }
  }
  var p=document.getElementById('stkpal'); if(p)p.classList.add('hidden');
}
document.addEventListener('click',function(ev){
  var p=document.getElementById('stkpal');
  if(p&&!p.classList.contains('hidden')&&!p.contains(ev.target)&&!ev.target.closest('button.one'))p.classList.add('hidden');
});
document.addEventListener('keydown',function(e){ if(e.key==='Escape'){var p=document.getElementById('stkpal'); if(p)p.classList.add('hidden');} });
function rvCmQuick(row,btn){
  var inp=document.getElementById('rvcmt-'+row); if(!inp)return;
  inp.value=btn.textContent; RV.cm[row]=RV.cm[row]||{t:'',s:''}; RV.cm[row].t=inp.value; inp.focus();
}
function rvCmSave(row){
  var c=RV.cm[row]||{t:'',s:''};
  if(!c.t.trim()&&!c.s){toast('피드백을 적거나 캐릭터를 고르세요');return;}
  var prev=document.getElementById('rvcmp-'+row); if(prev)prev.textContent='저장하는 중…';
  call('adminCommentExercise',[row,c.t.trim(),c.s],function(r){
    if(!r||!r.ok){toast((r&&r.msg)||'저장 실패');if(prev)prev.textContent='';return;}
    toast('💬 피드백 저장 · 학생에게 개인 공지로 갔습니다');
    if(prev)prev.innerHTML='✅ 저장됨 · '+esc(r.코멘트일시||r.savedAt)+' · 학생에게 개인 공지로 갔습니다';
    var x=RV.rows.filter(function(y){return y.row===row;})[0]; if(x){x.코멘트=c.t.trim();x.스티커=c.s;x.코멘트일시=r.코멘트일시||'';}
    paintBadges();
  });
}
async function rvCmDel(row){
  if(!(await askP('이 기록의 피드백을 지울까요? (이미 보낸 개인 공지는 그대로 남습니다)')))return;
  call('adminDeleteExerciseComment',[row],function(){
    RV.cm[row]={t:'',s:''}; var x=RV.rows.filter(function(y){return y.row===row;})[0]; if(x){x.코멘트='';x.스티커='';x.코멘트일시='';}
    renderReview();
    toast('피드백을 지웠습니다');
  });
}

function rvPick(row,v){
  RV.sel[row] = (RV.sel[row]===v) ? '' : v;   // 같은 걸 또 누르면 해제
  var c=document.getElementById('rvc-'+row);
  if(c){ c.classList.toggle('done-ok',RV.sel[row]==='인정'); c.classList.toggle('done-no',RV.sel[row]==='미인정');
    var b=c.querySelectorAll('.rvbtns button');
    b[0].className = RV.sel[row]==='인정' ? 'on-ok' : '';
    b[1].className = RV.sel[row]==='미인정' ? 'on-no' : '';
  }
  rvBar();
}
function rvAll(v){
  RV.rows.forEach(function(x){ RV.sel[x.row]= v||''; });
  renderReview(); rvBar();
}
function rvBar(){
  var ok=0,no=0;
  Object.keys(RV.sel).forEach(function(k){ if(RV.sel[k]==='인정')ok++; else if(RV.sel[k]==='미인정')no++; });
  var bar=document.getElementById('rv-bar');
  bar.classList.toggle('hidden',(ok+no)===0);
  document.getElementById('rv-sum').innerHTML='선택 <b>'+(ok+no)+'</b>건 — 인정 <b>'+ok+'</b> · 미인정 <b>'+no+'</b>';
}
async function rvApply(){
  var items=[];
  Object.keys(RV.sel).forEach(function(k){
    if(!RV.sel[k])return;
    items.push({row:Number(k), 판정:RV.sel[k], 사유:(RV.why[k]||'')});
  });
  if(!items.length){ toast('먼저 인정/미인정을 고르세요'); return; }
  if(!(await askP(items.length+'건을 반영할까요?\n\n인정한 것만 주간 달성에 들어갑니다.')))return;
  call('adminApplyReview',[items],function(r){
    if(!r||!r.ok){ toast((r&&r.msg)||'반영 실패'); return; }
    toast('✅ 인정 '+r.인정+' · 미인정 '+r.미인정+' 반영'+(typeof savedMsg==='function'?savedMsg(r):''));
    /* [0.52.0] 목록을 새로 읽지 않고 제자리 갱신 — 카드가 사라지지 않고 «✅ 시각» 칩이 붙는다 */
    (r.결과||[]).forEach(function(q){
      if(q.status!=='ok')return;
      var x=RV.rows.filter(function(y){return y.row===q.row;})[0]; if(x){x.상태=q.판정;x.검토일시=q.검토일시||'';}
      var chip=document.getElementById('rvdone-'+q.row);
      if(chip){ if(q.검토일시){chip.className='rvdone'+(q.판정==='미인정'?' no':'');chip.textContent=(q.판정==='미인정'?'✕ ':'✅ ')+q.검토일시;} else chip.className='rvdone hidden'; }
      var card=document.getElementById('rvc-'+q.row);
      if(card){ var tg=card.querySelectorAll('.rvtag'); if(tg[2])tg[2].textContent=q.판정; }
      RV.sel[q.row]='';
    });
    rvBar(); paintBadges();
  });
}
/* [0.52.0] 사진 팝업 — 새 탭 대신 화면 위에 크게 */
function fidOf(url){var m=String(url||'').match(/[-\w]{25,}/);return m?m[0]:'';}
function lbOpen(fid,url){
  fid=fid||fidOf(url); if(!fid&&!url)return;
  var img=document.getElementById('lb-img');
  img.src=fid?('https://drive.google.com/thumbnail?id='+fid+'&sz=w1600'):url;
  document.getElementById('lb-new').href=url||('https://drive.google.com/file/d/'+fid+'/view');
  document.getElementById('lb').classList.remove('hidden');
}
function lbClose(){document.getElementById('lb').classList.add('hidden');document.getElementById('lb-img').removeAttribute('src');}
document.addEventListener('keydown',function(e){if(e.key==='Escape'){var l=document.getElementById('lb');if(l&&!l.classList.contains('hidden'))lbClose();}});
function rvZoom(fid){lbOpen(fid,'');}


/* ── 검수 전용 토큰 ───────────────────────────────────── */
function rtShow(){
  var b=document.getElementById('rt-box'); b.textContent='불러오는 중…';
  call('adminGetReviewToken',[],function(r){
    if(!r||!r.ok){ b.textContent='불러오지 못했습니다'; return; }
    b.innerHTML='<div style="font-size:12px;color:var(--muted);margin-bottom:4px">웹앱 주소</div>'
      +'<div style="font-family:monospace;font-size:12px;word-break:break-all;margin-bottom:10px">'+esc(r.url)+'</div>'
      +'<div style="font-size:12px;color:var(--muted);margin-bottom:4px">검수 토큰</div>'
      +'<div style="font-family:monospace;font-size:12px;word-break:break-all;background:#f3f5f2;padding:8px 10px;border-radius:8px">'+esc(r.token)+'</div>'
      +(r.savedAt?'<div class="muted" style="font-size:11.5px;margin-top:6px">발급 · '+esc(r.savedAt)+'</div>':'');
  });
}
async function rtReset(){
  if(!(await askP('토큰을 새로 발급할까요?\n\n예전 토큰으로는 더 이상 열리지 않습니다.')))return;
  call('adminResetReviewToken',[],function(r){ toast('새 토큰이 발급되었습니다'); rtShow(); });
}


/* 근력 사진의 타임마크 코드를 AI 로 읽어 채운다 — 교사가 필요할 때만 */
function rvCode(row, btn){
  var old=btn.textContent;
  btn.disabled=true; btn.textContent='읽는 중…';
  call('adminReadPhotoCode',[row],function(r){
    btn.disabled=false;
    if(!r||!r.ok){ btn.textContent=old; toast((r&&r.msg)||'읽지 못했습니다'); return; }
    btn.textContent = r.사진코드 ? ('🔑 '+r.사진코드) : '코드 없음';
    var msg = r.사진코드 ? ('코드 '+r.사진코드) : '코드를 찾지 못했습니다';
    if(r.촬영날짜) msg += ' · 촬영 '+r.촬영날짜+(r.촬영시각?' '+r.촬영시각:'');
    if((r.중복||[]).length) msg += ' ⚠ 같은 코드: '+r.중복.join(', ');
    toast(msg);
    // 카드에 결과를 남겨 둔다
    var c=document.getElementById('rvc-'+row);
    if(c){
      var dl=c.querySelector('.rvkv');
      if(dl){
        var add='<dt>사진코드</dt><dd style="font-family:monospace">'+esc(r.사진코드||'—')
              +(r.통과?' <b style="color:var(--primary)">통과</b>':' <b style="color:#c0392b">미통과</b>')+'</dd>';
        if((r.중복||[]).length) add+='<dt>같은 코드</dt><dd style="color:#c0392b">'+esc(r.중복.join(' / '))+'</dd>';
        dl.insertAdjacentHTML('beforeend',add);
      }
      if((r.중복||[]).length) c.classList.add('dup');
    }
  });
}


/* ═══════ 문의 ═══════ */
var IQS='접수';
function iqPals(){
  var S=[['접수','답변 대기'],['답변완료','답변함'],['전체','전체']];
  document.getElementById('iq-state').innerHTML=S.map(function(k){
    return '<button class="'+(IQS===k[0]?'on':'')+'" onclick="IQS=&quot;'+k[0]+'&quot;;loadInquiry()">'+k[1]+'</button>';
  }).join('');
}
function loadInquiry(){
  iqPals();
  var body=document.getElementById('iq-body');
  body.innerHTML='<div class="card"><p class="muted">불러오는 중…</p></div>';
  call('adminInquiryList',[{상태:IQS,학급:clsOf('inquiry')}],function(r){
    if(!r||!r.ok){ body.innerHTML='<div class="card"><p class="muted">'+esc((r&&r.msg)||'불러오지 못했습니다')+'</p></div>'; return; }
    document.getElementById('iq-cnt').textContent=r.count+'건';
    var b=document.getElementById('iq-badge');
    if(b){ b.textContent=r.대기||0; b.classList.toggle('hidden',!(r.대기>0)); }
    var rows=r.rows||[];
    if(!rows.length){ body.innerHTML='<div class="card"><p class="muted">해당 조건에 문의가 없습니다.</p></div>'; return; }
    body.innerHTML=rows.map(function(x){
      var ph=(x.사진||[]).map(function(f){
        return '<img src="https://drive.google.com/thumbnail?id='+esc(f)+'&sz=w400" '
          +'onclick="window.open(&quot;https://drive.google.com/file/d/'+esc(f)+'/view&quot;,&quot;_blank&quot;,&quot;noopener&quot;)" '
          +'onerror="this.style.display=&quot;none&quot;">';
      }).join('');
      return '<div class="iqrow'+(x.상태==='접수'?' new':'')+'">'
        +'<div class="iqhd"><b>'+esc(x.이름)+'</b> <span class="muted">'+esc(x.학번)+'</span>'
        +'<span class="iqty'+(x.상태==='접수'?' on':'')+'">'+esc(x.유형)+'</span>'
        +(x.주차?'<span class="iqty">'+esc(x.주차)+'주차</span>':'')
        +'<span class="muted" style="margin-left:auto;font-size:12px">'+esc(x.접수일시)+'</span></div>'
        +'<div class="iqmsg">'+esc(x.내용)+'</div>'
        +(ph?'<div class="iqph">'+ph+'</div>':'')
        +(x.답변
          ? '<div class="iqdone"><b>답변함 · '+esc(x.답변일시)+'</b>'+emoHtml(x.답변)
            +'<div class="row" style="gap:6px;margin-top:8px"><button class="btn sec sm" onclick="iqEdit('+x.row+')">고치기</button>'
            +'<button class="btn danger sm" onclick="iqDel('+x.row+',&quot;'+esc(x.이름)+'&quot;)">🗑 삭제</button></div></div>'
          : '<div class="iqstk">'+STK.map(function(k){return '<button type="button" title="'+k.n+'" onclick="insAt(&quot;iqa-'+x.row+'&quot;,&quot;:'+k.k+': &quot;)"><img src="'+STK_BASE+'st-'+k.k+'.png" alt="'+k.n+'"></button>';}).join('')
            +'<span class="muted" style="font-size:11.5px">눌러서 답변에 진호 이모티콘 넣기</span></div>'
            +'<div class="iqans"><textarea id="iqa-'+x.row+'" placeholder="답변을 쓰면 학생 앱에 바로 보입니다 (:good: 처럼 이모티콘도 됩니다)"></textarea>'
            +'<button class="btn sm" onclick="iqReply('+x.row+')">답변</button>'
            +'<button class="btn danger sm" onclick="iqDel('+x.row+',&quot;'+esc(x.이름)+'&quot;)" title="이 문의를 지웁니다">🗑</button></div>')
        +'</div>';
    }).join('');
  });
}
function iqReply(row){
  var el=document.getElementById('iqa-'+row);
  var t=(el?el.value:'').trim();
  if(!t){ toast('답변을 써 주세요'); if(el)el.focus(); return; }
  call('adminReplyInquiry',[row,t],function(r){
    if(!r||!r.ok){ toast((r&&r.msg)||'저장 실패'); return; }
    toast('✅ 답변 저장'+(r.savedAt?' · '+r.savedAt:''));
    loadInquiry();
  });
}
/* [0.59.0] 문의 삭제 — 백업이 남으므로 되살릴 수 있다 */
async function iqDel(row,name){
  var N=String.fromCharCode(10);
  if(!(await askP((name||'')+' 학생의 이 문의를 지울까요?'+N+N
    +'· 딸린 사진도 함께 휴지통으로 갑니다'+N
    +'· 원본은 «_삭제백업» 시트에 남아 되살릴 수 있습니다')))return;
  call('adminDeleteInquiry',[row],function(r){
    if(!r||!r.ok){ toast((r&&r.msg)||'삭제 실패'); return; }
    toast('🗑 문의를 지웠습니다'+(r.사진?(' · 사진 '+r.사진+'장 휴지통'):''));
    loadInquiry(); paintBadges();
  });
}
async function iqEdit(row){
  var t=await askTextP('답변을 고쳐 주세요. (비우고 확인하면 «답변 대기»로 돌아갑니다)');
  if(t===null)return;
  call('adminReplyInquiry',[row,t],function(r){
    if(!r||!r.ok){ toast((r&&r.msg)||'저장 실패'); return; }
    toast(t.trim()?'✅ 답변 수정':'답변을 비웠습니다'); loadInquiry();
  });
}

