/* ============================================================
   Калорийка — MVP
   Состояние + хранилище + утилиты
   ============================================================ */

const KEY = 'kalorika.v1';

const defaultState = () => ({
  onboarded:false,
  profile:{
    name:'', sex:'f', age:28, height:168, weight:64.8, goal:'lose',
    activity:1.375, targetKcal:1780, p:140, f:70, c:210,
    autoTargets:true, restDefault:90, subtractWorkout:true,
  },
  schedule:{...DEFAULT_SCHEDULE},
  programs: JSON.parse(JSON.stringify(PROGRAMS)),   // копия шаблонов, дальше правится пользователем
  food:{},          // 'YYYY-MM-DD' -> [entry]
  weights:[],       // [{date,kg}]
  workouts:[],      // завершённые тренировки
  session:null,     // активная сессия
  draft:null,       // черновик блюда перед сохранением
  draftProg:null,   // черновик программы в редакторе
  ui:{diaryDate:null, addTab:'manual', addMeal:'lunch', addCat:'freq', bcError:null, bcCode:null,
      obStep:1, keepDemo:false},
});

let S;

/* Слияние сохранения с дефолтами: новые поля должны появляться у старых сохранений */
function mergeState(obj){
  const d = defaultState();
  /* Значения по умолчанию запоминаем до слияния — Object.assign затрёт ссылки */
  const dProfile = d.profile, dUi = d.ui, dSchedule = d.schedule;
  const merged = Object.assign(d, obj);
  merged.profile  = Object.assign(dProfile,  obj.profile  || {});
  merged.ui       = Object.assign(dUi,       obj.ui       || {});
  merged.schedule = Object.assign(dSchedule, obj.schedule || {});
  return merged;
}

/* Похоже ли это на наше сохранение — чтобы не затереть данные чужим файлом */
function looksLikeState(o){
  return !!o && typeof o === 'object'
    && typeof o.profile === 'object' && o.profile !== null
    && typeof o.food === 'object'    && o.food !== null
    && Array.isArray(o.workouts);
}

function load(){
  try{
    const raw = localStorage.getItem(KEY);
    if(!raw) return seed(defaultState());
    return mergeState(JSON.parse(raw));
  }catch(e){ return seed(defaultState()); }
}
function save(){ localStorage.setItem(KEY, JSON.stringify(S)); }
function reset(){ localStorage.removeItem(KEY); S = seed(defaultState()); save(); location.hash='#/onboarding'; render(); }

/* ---------- Даты ---------- */
const DOW = ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'];
const DOW_FULL = ['воскресенье','понедельник','вторник','среда','четверг','пятница','суббота'];
const MONTHS = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
const MONTHS_SHORT = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];

const iso = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const today = () => iso(new Date());
const parseISO = s => { const [y,m,d]=s.split('-').map(Number); return new Date(y,m-1,d); };
const addDays = (s,n) => { const d=parseISO(s); d.setDate(d.getDate()+n); return iso(d); };
function weekOf(dateStr){
  const d = parseISO(dateStr);
  const shift = (d.getDay()+6)%7;           // понедельник — первый
  const mon = addDays(dateStr, -shift);
  return Array.from({length:7},(_,i)=>addDays(mon,i));
}
const humanDate = s => { const d=parseISO(s); return `${cap(DOW_FULL[d.getDay()])}, ${d.getDate()} ${MONTHS[d.getMonth()]}`; };
const shortDate = s => { const d=parseISO(s); return `${d.getDate()} ${MONTHS[d.getMonth()]}`; };
const cap = s => s.charAt(0).toUpperCase()+s.slice(1);
const mmss = sec => `${Math.floor(sec/60)}:${String(Math.max(0,sec%60)).padStart(2,'0')}`;

/* ---------- Мелочи ---------- */
const $ = sel => document.querySelector(sel);
const uid = () => Math.random().toString(36).slice(2,10);
const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
const round = (v,n=0) => { const k=10**n; return Math.round(v*k)/k; };
const esc = s => String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

function toast(msg){
  const old = $('.toast'); if(old) old.remove();
  const el = document.createElement('div');
  el.className='toast'; el.textContent=msg;
  document.querySelector('.phone').appendChild(el);
  setTimeout(()=>el.remove(), 2200);
}

/* ---------- Расчёт норм (Миффлин — Сан-Жеор) ---------- */
function calcTargets(p){
  const s = p.sex==='m' ? 5 : -161;
  const bmr = 10*p.weight + 6.25*p.height - 5*p.age + s;
  let kcal = bmr * p.activity;
  if(p.goal==='lose') kcal *= 0.82;
  if(p.goal==='gain') kcal *= 1.12;
  kcal = Math.round(kcal/10)*10;
  const prot = Math.round(p.weight * (p.goal==='gain'?2.0:1.9) /5)*5;
  const fat  = Math.round(p.weight * 0.9 /5)*5;
  const carb = Math.round(Math.max(50,(kcal - prot*4 - fat*9)/4)/5)*5;
  return {targetKcal:kcal, p:prot, f:fat, c:carb};
}

/* ---------- Питание ---------- */
const dayFood = d => S.food[d] || [];
function dayTotals(d){
  return dayFood(d).reduce((a,e)=>({
    kcal:a.kcal+e.kcal, p:a.p+e.p, f:a.f+e.f, c:a.c+e.c
  }),{kcal:0,p:0,f:0,c:0});
}
const dayBurn = d => S.workouts.filter(w=>w.date===d).reduce((a,w)=>a+w.kcal,0);

/* Ингредиент — либо ссылка на базу (id), либо свой продукт (custom) */
function ingInfo(i){
  return i.id ? FOOD_BY_ID[i.id] : i.custom;
}
function foodFromIngredients(ing){
  return ing.reduce((a,i)=>{
    const f = ingInfo(i); if(!f) return a;
    const k = i.g/100;
    return {kcal:a.kcal+f.kcal*k, p:a.p+f.p*k, f:a.f+f.f*k, c:a.c+f.c*k};
  },{kcal:0,p:0,f:0,c:0});
}

/* ---------- Тренировки ---------- */
const progById = id => (S.programs||[]).find(p=>p.id===id) || null;
const progList = () => S.programs || [];

function bestSet(exName){
  let best = null;
  S.workouts.forEach(w=>(w.exercises||[]).forEach(e=>{
    if(e.name!==exName) return;
    e.sets.forEach(st=>{
      if(st.status==='skipped') return;
      if(!best || st.w>best.w || (st.w===best.w && st.r>best.r)) best={w:st.w,r:st.r,date:w.date};
    });
  }));
  return best;
}
const tonnage = ex => ex.reduce((a,e)=>a+e.sets.reduce((b,s)=>b+(s.status&&s.status!=='skipped'?s.w*s.r:0),0),0);

function estKcal(type, minutes, weight){
  const met = type==='cardio' ? MET.run : MET.strength;
  const kg = weight || (S && S.profile ? S.profile.weight : 65);
  return Math.round(met * kg * (minutes/60));
}

/* ---------- Демо-наполнение при первом запуске ---------- */
function seed(s){
  const t = today();
  s.food[t] = [
    mkEntry('breakfast','Овсянка с ягодами',[{id:'oat',g:250},{id:'berries',g:60},{id:'honey',g:15}],'08:40'),
    mkEntry('lunch','Куриный суп с лапшой',[{id:'chicken',g:90},{id:'noodles',g:70},{id:'carrot',g:40},{id:'potato',g:80}],'13:15'),
    mkEntry('snack','Йогурт и грецкий орех',[{id:'yogurt',g:180},{id:'walnut',g:20}],'16:30'),
  ];
  for(let i=1;i<=12;i++){
    const d = addDays(t,-i);
    const v = (i%3-1)*15;   // лёгкий разброс по дням
    s.food[d] = [
      mkEntry('breakfast','Овсянка с ягодами',[{id:'oat',g:300},{id:'berries',g:80},{id:'honey',g:20},{id:'walnut',g:15}],'08:30'),
      mkEntry('lunch','Курица с гречкой',[{id:'chicken',g:180+v},{id:'buckwheat',g:220},{id:'oliveoil',g:10}],'13:00'),
      mkEntry('dinner','Творог с бананом и хлебом',[{id:'cottage',g:200},{id:'banana',g:120},{id:'bread',g:60-v}],'19:30'),
    ];
  }
  s.weights = Array.from({length:12},(_,i)=>({
    date: addDays(t,-(11-i)*7),
    kg: round(67.2 - i*0.2 - (i>6?0.15*(i-6):0), 1)
  }));
  const hist = [
    {off:-1, pid:'p1'}, {off:-3, pid:'p2'}, {off:-5, pid:'p4'}, {off:-6, pid:'p3'},
    {off:-8, pid:'p1'}, {off:-10,pid:'p2'},
  ];
  s.workouts = hist.map(h=>{
    const p = PROGRAM_BY_ID[h.pid];
    const date = addDays(t,h.off);
    if(p.type==='cardio'){
      return {id:uid(),date,programId:p.id,name:'Пробежка вдоль набережной',type:'cardio',
        durationSec:38*60,kcal:385,cardio:{km:6.4,pace:'5:56',pulse:148},exercises:[]};
    }
    const ex = p.ex.map(e=>({
      name:e.name, target:{sets:e.sets,reps:e.reps,w:e.w},
      sets: Array.from({length:e.sets},(_,i)=>({w:e.w, r:parseInt(e.reps)||10, status:i===e.sets-1?'changed':'done'}))
    }));
    return {id:uid(),date,programId:p.id,name:p.name,type:'strength',
      durationSec:52*60, kcal:estKcal('strength',52,s.profile.weight), exercises:ex, tonnage:tonnage(ex)};
  });
  return s;
}
function mkEntry(meal,name,ing,time){
  const m = foodFromIngredients(ing);
  return {id:uid(), meal, name, time, ing,
    kcal:Math.round(m.kcal), p:round(m.p,1), f:round(m.f,1), c:round(m.c,1)};
}

/* ============================================================
   Роутер
   ============================================================ */
const ICONS = {
  home:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/></svg>',
  diary:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h3"/></svg>',
  sport:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 9v6M8 6v12M12 9v6M16 4v16M20 9v6"/></svg>',
  chart:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l5-6 4 4 6-8 3 3"/></svg>',
  cam:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3l1.5-2h7L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.2"/></svg>',
};

const TABS = [
  {r:'#/today',    ic:'home',  t:'Сегодня'},
  {r:'#/diary',    ic:'diary', t:'Дневник'},
  {r:'#/add',      ic:'cam',   t:'',      fab:true},
  {r:'#/sport',    ic:'sport', t:'Спорт'},
  {r:'#/progress', ic:'chart', t:'Прогресс'},
];

function renderTabs(route){
  const hide = ['#/onboarding','#/session','#/add','#/portion','#/summary','#/pedit'].some(r=>route.startsWith(r));
  const tb = $('#tabbar');
  tb.classList.toggle('hidden', hide);
  document.body.classList.toggle('no-tabs', hide);
  if(hide){ tb.innerHTML=''; return; }
  tb.innerHTML = TABS.map(t=>{
    if(t.fab) return `<button data-go="${t.r}"><span class="fab">${ICONS[t.ic]}</span></button>`;
    const on = route.startsWith(t.r) ? 'on':'';
    return `<button class="${on}" data-go="${t.r}">${ICONS[t.ic]}<span>${t.t}</span></button>`;
  }).join('');
}

function go(hash){ location.hash = hash; }

window.addEventListener('hashchange', render);

function render(){
  let route = location.hash || (S.onboarded ? '#/today' : '#/onboarding');
  if(!S.onboarded && !route.startsWith('#/onboarding')) route = '#/onboarding';
  if(route==='#') route = '#/today';

  const [path, query] = route.slice(2).split('?');
  const q = Object.fromEntries(new URLSearchParams(query||''));
  const seg = path.split('/');

  document.body.classList.toggle('dark-screen', seg[0]==='session' || seg[0]==='add');

  const views = {
    onboarding: vOnboarding, today: vToday, diary: vDiary, add: vAdd,
    portion: vPortion, sport: vSport, program: vProgram, session: vSession,
    summary: vSummary, progress: vProgress, profile: vProfile,
    programs: vPrograms, pedit: vPedit, ex: vExercise,
  };
  if(!(seg[0]==='add' && S.ui.addTab==='barcode')) SCANNER.stop();
  const view = views[seg[0]] || vToday;
  $('#app').innerHTML = `<div class="screen">${view(seg, q)}</div>`;
  $('#app').scrollTop = 0;
  renderTabs('#/'+path);
  bind();
  POST[seg[0]] && POST[seg[0]](seg, q);
  if(seg[0]==='session') startTicker(); else stopTicker();
}

/* Делегирование кликов */
function bind(){
  document.querySelectorAll('[data-go]').forEach(el=>{
    el.onclick = () => go(el.dataset.go);
  });
  document.querySelectorAll('[data-act]').forEach(el=>{
    el.onclick = e => { e.stopPropagation(); ACTIONS[el.dataset.act]?.(el.dataset, el); };
  });
}
const ACTIONS = {};

/* ============================================================
   Онбординг
   ============================================================ */
function vOnboarding(){
  if(S.ui.obStep === 2) return vOnboardingSport();
  const p = S.profile;
  const t = calcTargets(p);
  return `
  <h1>Настроим цель</h1>
  <p class="sub">Посчитаем норму калорий и БЖУ. Всё можно поменять потом.</p>

  <div class="card">
    <label class="field"><span>Имя</span>
      <input id="ob-name" value="${esc(p.name)}" placeholder="Как к вам обращаться"></label>
    <div class="grid2">
      <label class="field"><span>Возраст</span><input id="ob-age" type="number" value="${p.age}"></label>
      <label class="field"><span>Пол</span>
        <select id="ob-sex">
          <option value="f" ${p.sex==='f'?'selected':''}>Женский</option>
          <option value="m" ${p.sex==='m'?'selected':''}>Мужской</option>
        </select></label>
    </div>
    <div class="grid2">
      <label class="field"><span>Рост, см</span><input id="ob-height" type="number" value="${p.height}"></label>
      <label class="field"><span>Вес, кг</span><input id="ob-weight" type="number" step="0.1" value="${p.weight}"></label>
    </div>
  </div>

  <h2>Цель</h2>
  <div class="chips" id="ob-goal">
    ${[['lose','Снизить вес'],['keep','Удержать'],['gain','Набрать массу']]
      .map(([v,n])=>`<button class="chip ${p.goal===v?'on':''}" data-v="${v}">${n}</button>`).join('')}
  </div>

  <h2>Активность</h2>
  <div class="chips" id="ob-act">
    ${[[1.2,'低 Сидячая'],[1.375,'1–3 трен/нед'],[1.55,'3–5 трен/нед'],[1.725,'6–7 трен/нед']]
      .map(([v,n])=>`<button class="chip ${p.activity==v?'on':''}" data-v="${v}">${n.replace('低 ','')}</button>`).join('')}
  </div>

  <div class="card dark" style="margin-top:20px">
    <div class="tiny" style="color:var(--ink-3)">Ваша норма</div>
    <div style="font-size:34px;font-weight:700;margin:4px 0 2px" class="num" id="ob-kcal">${t.targetKcal} <span style="font-size:15px;color:var(--ink-3);font-weight:500">ккал/день</span></div>
    <div class="macros" id="ob-macros">${macroBoxes(t, {p:0,f:0,c:0}, true)}</div>
  </div>

  <div class="sticky-cta">
    <button class="btn btn-primary" data-act="obNext">Далее — тренировки</button>
  </div>`;
}

/* ============================================================
   Онбординг, шаг 2: тренировки
   ============================================================ */
const WEEK_ORDER = [1,2,3,4,5,6,0];

/* Раскладка по умолчанию: сначала силовые по очереди, лишние дни — кардио */
function autoSchedule(n){
  const dayPresets = {2:[1,4], 3:[1,3,5], 4:[1,2,4,6], 5:[1,2,3,5,6]};
  const days = dayPresets[n] || dayPresets[3];
  const strength = progList().filter(p=>p.type!=='cardio').map(p=>p.id);
  const cardio = (progList().find(p=>p.type==='cardio')||{}).id || null;
  const sched = {0:null,1:null,2:null,3:null,4:null,5:null,6:null};
  days.forEach((d,i)=>{ sched[d] = i < strength.length ? strength[i] : cardio; });
  return sched;
}

function vOnboardingSport(){
  const count = WEEK_ORDER.filter(d=>S.schedule[d]).length;

  return `
  <button class="link" data-act="obBack" style="margin:6px 0 0">‹ Назад к параметрам</button>
  <h1>Тренировки</h1>
  <p class="sub">Расставим план на неделю. Дальше он правится в любой момент.</p>

  <h2 style="margin-top:8px">Сколько раз в неделю</h2>
  <div class="chips" id="ob-freq">
    ${[2,3,4,5].map(n=>`<button class="chip ${count===n?'on':''}" data-v="${n}">${n} ${plural(n,'раз','раза','раз')}</button>`).join('')}
  </div>

  <div class="row-head"><h2>План недели</h2>
    <span class="tiny">${count?`${count} ${plural(count,'тренировка','тренировки','тренировок')}`:'все дни свободны'}</span></div>
  <div class="card">
    ${WEEK_ORDER.map(d=>`
      <label class="field" style="margin-bottom:10px"><span>${cap(DOW_FULL[d])}</span>
        <select data-obsched="${d}">
          <option value="">Отдых</option>
          ${progList().map(pr=>`<option value="${pr.id}" ${S.schedule[d]===pr.id?'selected':''}>${pr.emoji} ${pr.name}</option>`).join('')}
        </select></label>`).join('')}
  </div>

  <h2>Мелочи</h2>
  <div class="card">
    <label class="field"><span>Отдых между подходами, сек</span>
      <input id="ob-rest" type="number" step="15" value="${S.profile.restDefault}"></label>
    <label style="display:flex;align-items:center;gap:10px;margin:0">
      <input type="checkbox" id="ob-demo" ${S.ui.keepDemo?'checked':''} style="width:auto">
      <span style="font-size:15px">Оставить демо-историю</span></label>
    <p class="tiny" style="margin:8px 0 0">Сейчас в приложении лежат придуманные записи за две недели — чтобы графики
      не пустовали. Для реального дневника их лучше стереть: иначе стрик, проценты и рекорды будут врать.</p>
  </div>

  <div class="sticky-cta">
    <button class="btn btn-primary" data-act="obDone">Готово</button>
    <button class="btn btn-ghost" style="margin-top:8px" data-act="obSkip">Пропустить — настрою потом</button>
  </div>
  <div style="height:10px"></div>`;
}

ACTIONS.obNext = () => {
  const p = S.profile;
  p.name   = $('#ob-name').value.trim() || 'Друг';
  p.age    = clamp(+$('#ob-age').value||28, 10, 100);
  p.sex    = $('#ob-sex').value;
  p.height = clamp(+$('#ob-height').value||168, 100, 230);
  p.weight = clamp(+$('#ob-weight').value||64, 30, 250);
  Object.assign(p, calcTargets(p));
  S.ui.obStep = 2; save(); render();
};

/* Демо-история мешает реальному дневнику — по умолчанию стираем */
function wipeDemo(){
  S.food = {}; S.workouts = []; S.weights = [{date:today(), kg:S.profile.weight}];
}
function finishOnboarding(){
  if(!S.ui.keepDemo) wipeDemo();
  else if(!S.weights.length) S.weights.push({date:today(), kg:S.profile.weight});
  S.onboarded = true; S.ui.obStep = 1; save(); go('#/today');
}

ACTIONS.obBack = () => { S.ui.obStep = 1; save(); render(); };
ACTIONS.obDone = () => {
  S.profile.restDefault = clamp(+($('#ob-rest')?.value)||90, 15, 600);
  finishOnboarding();
  toast('Готово. План недели можно менять в «Спорт».');
};
ACTIONS.obSkip = () => {
  WEEK_ORDER.forEach(d=>{ S.schedule[d] = null; });
  finishOnboarding();
  toast('Тренировки отключены. Включить — в «Спорт» → «Программы».');
};

/* Локальные хендлеры онбординга навешиваются после рендера */
function bindOnboarding(){
  if(S.ui.obStep === 2) return bindOnboardingSport();
  const upd = () => {
    const p = {...S.profile,
      age:+$('#ob-age').value||28, sex:$('#ob-sex').value,
      height:+$('#ob-height').value||168, weight:+$('#ob-weight').value||64};
    const t = calcTargets(p);
    $('#ob-kcal').innerHTML = `${t.targetKcal} <span style="font-size:15px;color:var(--ink-3);font-weight:500">ккал/день</span>`;
    $('#ob-macros').innerHTML = macroBoxes(t,{p:0,f:0,c:0},true);
    S.profile.goal = S.profile.goal; // цель ставится ниже
  };
  ['ob-age','ob-sex','ob-height','ob-weight'].forEach(id=>{
    const el = $('#'+id); if(el) el.oninput = el.onchange = upd;
  });
  const pick = (wrap, key, num) => {
    const w = $('#'+wrap); if(!w) return;
    w.querySelectorAll('.chip').forEach(b=>b.onclick=()=>{
      w.querySelectorAll('.chip').forEach(x=>x.classList.remove('on'));
      b.classList.add('on');
      S.profile[key] = num ? +b.dataset.v : b.dataset.v;
      upd();
    });
  };
  pick('ob-goal','goal',false);
  pick('ob-act','activity',true);
}

function bindOnboardingSport(){
  const freq = $('#ob-freq');
  if(freq) freq.querySelectorAll('.chip').forEach(b=>b.onclick=()=>{
    S.schedule = autoSchedule(+b.dataset.v); save(); render();
  });
  document.querySelectorAll('[data-obsched]').forEach(sel=>{
    sel.onchange = () => { S.schedule[sel.dataset.obsched] = sel.value || null; save(); render(); };
  });
  const demo = $('#ob-demo');
  if(demo) demo.onchange = () => { S.ui.keepDemo = demo.checked; save(); };
}

/* ============================================================
   Общие компоненты
   ============================================================ */
function ring(pct, size=120, stroke=11, color='var(--accent)', track='rgba(255,255,255,.13)'){
  const r = (size-stroke)/2, c = 2*Math.PI*r;
  const off = c * (1 - clamp(pct,0,1));
  return `<svg width="${size}" height="${size}">
    <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${track}" stroke-width="${stroke}"/>
    <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}"
      stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${off}"
      style="transition:stroke-dashoffset .5s ease"/>
  </svg>`;
}

function macroBoxes(target, cur, plain){
  const rows = [
    ['Белки', cur.p, target.p, 'var(--blue)'],
    ['Жиры',  cur.f, target.f, 'var(--yellow)'],
    ['Углеводы', cur.c, target.c, 'var(--green)'],
  ];
  return rows.map(([n,v,t,col])=>`
    <div class="macro">
      <div class="n">${n}</div>
      <div class="v num">${plain?t:Math.round(v)}<span>${plain?' г':' / '+t+' г'}</span></div>
      ${plain?'':`<div class="bar"><i style="width:${clamp(v/t,0,1)*100}%;background:${col}"></i></div>`}
    </div>`).join('');
}

function kcalHero(date){
  const tot = dayTotals(date), burn = dayBurn(date), p = S.profile;
  const budget = p.targetKcal + (p.subtractWorkout ? burn : 0);
  const left = Math.round(budget - tot.kcal);
  const pct = tot.kcal/budget;
  const hint = tot.kcal === 0
    ? `День начался. Записывайте приёмы — остаток пересчитается сам.`
    : left < 0
      ? `Перебор на ${-left} ккал. Завтра выровняется.`
      : left < budget*0.18
        ? `Осталось немного — лёгкий ужин будет в самый раз.`
        : `Идёте ровно. Хватит на полноценный ужин.`;
  return `
  <div class="card dark">
    <div class="ring-card">
      <div class="ring">
        ${ring(pct)}
        <div class="val"><b class="num">${Math.abs(left)}</b><small>${left<0?'перебор':'осталось'}</small></div>
      </div>
      <div style="flex:1">
        <p class="eaten">Съедено сегодня</p>
        <p class="eaten-big num">${Math.round(tot.kcal)} <span>/ ${budget}</span></p>
        <p class="hint-accent">${hint}</p>
        ${burn&&p.subtractWorkout?`<p class="tiny" style="margin-top:8px">+${burn} ккал за тренировку (оценка)</p>`:''}
      </div>
    </div>
    <div class="macros">${macroBoxes(p, tot)}</div>
  </div>`;
}

const MEAL_NAME = Object.fromEntries(MEALS.map(m=>[m.id,m.name]));

function foodItem(e){
  return `<div class="item clickable" data-act="delFood" data-id="${e.id}" data-date="${e.date||''}">
    <div class="thumb">${e.emoji||'🍽'}</div>
    <div class="body"><b>${esc(e.name)}</b><small>${MEAL_NAME[e.meal]} · ${e.time}</small></div>
    <div class="right"><b class="num">${e.kcal}</b><small>ккал</small></div>
  </div>`;
}

/* ============================================================
   Экран: Сегодня
   ============================================================ */
function vToday(){
  const d = today(), p = S.profile;
  const pid = S.schedule[parseISO(d).getDay()];
  const prog = pid ? progById(pid) : null;
  const doneToday = S.workouts.find(w=>w.date===d);
  const list = dayFood(d);

  return `
  <div style="display:flex;align-items:center;justify-content:space-between">
    <div><h1>Привет, ${esc(p.name||'Друг')}</h1>
    <p class="sub" style="margin:0">${humanDate(d)}</p></div>
    <button class="iconbtn" style="border-color:var(--line);color:var(--ink);background:var(--surface)" data-go="#/profile">${(p.name||'A')[0].toUpperCase()}</button>
  </div>

  <div style="height:16px"></div>
  ${kcalHero(d)}

  ${prog ? (doneToday ? `
    <div class="item">
      <div class="thumb lime">✓</div>
      <div class="body"><b>${esc(doneToday.name)}</b><small>Готово · ${Math.round(doneToday.durationSec/60)} мин · ${doneToday.kcal} ккал</small></div>
    </div>` : `
    <div class="item">
      <div class="thumb lime">${prog.emoji}</div>
      <div class="body"><b>${esc(prog.name)}</b>
        <small>${prog.type==='cardio'?`${prog.cardio.targetKm} км · ~${prog.est} мин`:`${prog.ex.length} упражнений · ~${prog.est} мин`}</small></div>
      <button class="btn btn-dark btn-sm" data-go="#/program/${prog.id}">Начать</button>
    </div>`) : `
    <div class="item">
      <div class="thumb">😴</div>
      <div class="body"><b>Сегодня отдых</b><small>По плану тренировки нет</small></div>
      <button class="btn btn-ghost btn-sm" data-go="#/sport">План</button>
    </div>`}

  <div class="row-head"><h2>Приёмы пищи</h2>
    <button class="link" data-go="#/diary">Весь день</button></div>
  ${list.length ? list.map(foodItem).join('') : `<div class="empty">Пока пусто. Добавьте первый приём пищи.</div>`}
  <button class="add-slot" data-go="#/add">+ Добавить приём пищи</button>
  `;
}

ACTIONS.delFood = (ds) => {
  const date = ds.date || today();
  if(!confirm('Удалить запись?')) return;
  S.food[date] = dayFood(date).filter(e=>e.id!==ds.id);
  save(); render(); toast('Удалено');
};

/* ============================================================
   Экран: Дневник питания
   ============================================================ */
function vDiary(){
  const d = S.ui.diaryDate || today();
  const days = weekOf(d);
  const tot = dayTotals(d), burn = dayBurn(d), p = S.profile;
  const budget = p.targetKcal + (p.subtractWorkout?burn:0);

  const meals = MEALS.map(m=>{
    const items = dayFood(d).filter(e=>e.meal===m.id);
    const sum = items.reduce((a,e)=>a+e.kcal,0);
    return `
      <div class="meal-head"><b>${m.name}</b><small class="num">${sum} ккал</small></div>
      ${items.map(e=>`
        <div class="item clickable" data-act="delFood" data-id="${e.id}" data-date="${d}">
          <div class="thumb">${e.emoji||'🍽'}</div>
          <div class="body"><b>${esc(e.name)}</b><small>Б ${round(e.p)} · Ж ${round(e.f)} · У ${round(e.c)}</small></div>
          <div class="right"><b class="num">${e.kcal}</b></div>
        </div>`).join('')}
      <button class="add-slot" data-go="#/add?meal=${m.id}&date=${d}">+ Добавить</button>`;
  }).join('');

  return `
  <h1>Дневник питания</h1>
  <div style="height:14px"></div>
  <div class="week">
    ${days.map(x=>{
      const dd = parseISO(x);
      return `<div class="day ${x===d?'on':''} ${dayFood(x).length?'has':''}" data-act="pickDay" data-d="${x}">
        <small>${DOW[dd.getDay()]}</small><b class="num">${dd.getDate()}</b></div>`;
    }).join('')}
  </div>

  <div class="card">
    <div style="display:flex;justify-content:space-between;align-items:flex-start">
      <div><div class="tiny">Итого за день</div>
        <div style="font-size:28px;font-weight:700" class="num">${Math.round(tot.kcal)} ккал</div></div>
      <div style="text-align:right"><div class="tiny">Потрачено</div>
        <div style="font-size:20px;font-weight:700" class="num">${burn}</div>
        <div class="tiny">тренировка</div></div>
    </div>
    <div class="bar light" style="height:6px;margin-top:12px">
      <i style="width:${clamp(tot.kcal/budget,0,1)*100}%;background:${tot.kcal>budget?'var(--red)':'var(--accent)'}"></i>
    </div>
    <div class="tiny" style="margin-top:8px">Норма ${budget} ккал · Б ${Math.round(tot.p)}/${p.p} · Ж ${Math.round(tot.f)}/${p.f} · У ${Math.round(tot.c)}/${p.c}</div>
  </div>

  ${meals}
  <div style="height:20px"></div>`;
}
ACTIONS.pickDay = ds => { S.ui.diaryDate = ds.d; save(); render(); };

/* ============================================================
   Экран: Добавить еду (фото / штрихкод / вручную)
   ============================================================ */
function vAdd(seg, q){
  if(q.meal) S.ui.addMeal = q.meal;
  if(q.date) S.ui.diaryDate = q.date;
  const tab = S.ui.addTab;

  return `
  <div class="sess-top">
    <button class="iconbtn" data-act="back">‹</button>
    <div class="mid"><b>Добавить приём пищи</b><small>${MEAL_NAME[S.ui.addMeal]}</small></div>
    <div style="width:44px"></div>
  </div>

  <div class="seg" id="add-tabs">
    ${[['manual','Поиск'],['barcode','Штрихкод'],['photo','Фото']]
      .map(([v,n])=>{
        const off = v==='photo' && !AI.visionAvailable();
        return `<button class="${tab===v?'on':''}" data-v="${v}"
          style="${off?'opacity:.45':''}">${n}</button>`;
      }).join('')}
  </div>

  ${tab==='photo' ? photoTab() : tab==='barcode' ? barcodeTab() : manualTab()}

  <div style="height:20px"></div>
  <div class="chips" style="justify-content:center">
    ${MEALS.map(m=>`<button class="chip ${S.ui.addMeal===m.id?'on':''}" data-act="setMeal" data-m="${m.id}">${m.name}</button>`).join('')}
  </div>
  <div style="height:20px"></div>`;
}

function photoTab(){
  if(AI.visionAvailable()) return `
  <div class="cam">
    <div class="dropzone" id="dz">
      <div style="font-size:30px">🖼</div>
      <div>Перетащите фото блюда<br>или нажмите, чтобы выбрать</div>
    </div>
    <input type="file" id="file" accept="image/*" hidden>
    <p class="tiny" style="margin:14px 0 0;color:var(--ink-3)">Наведите камеру так, чтобы тарелка попала целиком</p>
    <div class="shutter" id="shutter"></div>
  </div>`;

  return `
  <div class="card">
    <div style="font-size:34px;text-align:center;margin-bottom:6px">📷</div>
    <h3 style="text-align:center;margin-bottom:8px">Распознавание пока не подключено</h3>
    <p class="muted" style="font-size:14px;line-height:1.45;margin:0 0 14px;text-align:center">
      Укажите адрес прокси в профиле — или добавьте блюдо по штрихкоду и через поиск.</p>
    <div class="btn-row" style="margin-bottom:8px">
      <button class="btn btn-ghost btn-sm" style="flex:1" data-act="addTabTo" data-v="barcode">Штрихкод</button>
      <button class="btn btn-dark btn-sm" style="flex:1" data-act="addTabTo" data-v="manual">Ввести вручную</button>
    </div>
    <button class="btn btn-ghost btn-sm" style="width:100%" data-go="#/profile">Настроить распознавание</button>
  </div>`;
}

function barcodeTab(){
  return `
  ${SCANNER.supported ? `
  <div class="card" style="padding:0;overflow:hidden">
    <video id="cam" playsinline muted style="width:100%;height:230px;object-fit:cover;background:#000;display:none"></video>
    <div style="padding:14px">
      <button class="btn btn-dark" data-act="scanStart" id="scan-btn">Сканировать камерой</button>
    </div>
  </div>` : `
  <div class="card flat">
    <p class="muted" style="margin:0;font-size:14px;line-height:1.45">
      Этот браузер не умеет читать штрихкоды камерой — Safari на iOS в их числе.
      Введите цифры под кодом руками, это те же 13 символов.</p>
  </div>`}

  <div class="card">
    <label class="field"><span>Код с упаковки</span>
      <input id="bc" inputmode="numeric" placeholder="4600000000000" value="${esc(S.ui.bcCode||'')}"></label>
    <button class="btn btn-dark" data-act="scanBarcode">Найти продукт</button>
  </div>

  ${S.ui.bcError ? `
  <div class="card flat">
    <b style="font-size:15px">${esc(S.ui.bcError)}</b>
    <p class="muted" style="font-size:14px;line-height:1.45;margin:8px 0 12px">
      Российские товары в открытой базе есть не все. Соберите продукт из ингредиентов — потом он попадёт в «Часто».</p>
    <button class="btn btn-dark btn-sm" style="width:100%" data-act="addTabTo" data-v="manual">Ввести вручную</button>
  </div>` : ''}
  <p class="tiny" style="text-align:center">Источник: ${AI.barcodeDriver.label}${
    AI.barcode==='openfoodfacts' ? ' — открытая база, покрытие российских товаров неровное' : ''}.</p>`;
}

function manualTab(){
  const freq = frequentFoods();
  if(S.ui.addCat==='freq' && !freq.length) S.ui.addCat = 'all';
  return `
  <div class="card">
    <input id="q" placeholder="Поиск — курица, борщ, творог…" autocomplete="off">
  </div>
  <div class="chips scroll" id="cats" style="margin-bottom:12px">
    ${freq.length?`<button class="chip ${S.ui.addCat==='freq'?'on':''}" data-c="freq">⭐ Часто</button>`:''}
    <button class="chip ${S.ui.addCat==='all'?'on':''}" data-c="all">Все</button>
    ${CATS.map(c=>`<button class="chip ${S.ui.addCat===c.id?'on':''}" data-c="${c.id}">${c.emoji} ${c.name}</button>`).join('')}
  </div>
  <div id="results">${foodResults('')}</div>`;
}

/* Что пользователь ест чаще всего — по всей истории дневника */
function frequentFoods(){
  const by = {};
  Object.values(S.food).flat().forEach(e=>{
    const k = e.name;
    if(!by[k]) by[k] = {name:e.name, emoji:e.emoji, ing:e.ing, kcal:e.kcal, n:0};
    by[k].n++;
  });
  return Object.values(by).filter(x=>x.ing && x.ing.length).sort((a,b)=>b.n-a.n).slice(0,10);
}

function foodResults(term){
  const t = term.trim().toLowerCase();

  if(!t && S.ui.addCat==='freq'){
    const list = frequentFoods();
    if(!list.length) return `<div class="empty">Пока нет истории</div>`;
    return list.map((x,i)=>`
      <div class="item clickable" data-act="pickFreq" data-i="${i}">
        <div class="thumb">${x.emoji||'🍽'}</div>
        <div class="body"><b>${esc(x.name)}</b><small>записано ${x.n} ${plural(x.n,'раз','раза','раз')}</small></div>
        <div class="right"><b class="num">${x.kcal}</b><small>ккал</small></div>
      </div>`).join('');
  }

  let list = FOODS;
  if(t) list = FOODS.filter(f=>foodMatches(f.name, t));
  else if(S.ui.addCat!=='all') list = FOODS.filter(f=>f.cat===S.ui.addCat);

  if(!list.length) return `<div class="empty">Ничего не нашлось</div>`;
  const shown = list.slice(0,80);
  return shown.map(f=>`
    <div class="item clickable" data-act="pickFood" data-id="${f.id}">
      <div class="thumb">${CAT_BY_ID[f.cat]?.emoji || '🥗'}</div>
      <div class="body"><b>${esc(f.name)}</b><small>Б ${f.p} · Ж ${f.f} · У ${f.c} на 100 г</small></div>
      <div class="right"><b class="num">${f.kcal}</b><small>ккал/100</small></div>
    </div>`).join('') + (list.length > shown.length
      ? `<p class="tiny" style="text-align:center;padding:10px">Показано ${shown.length} из ${list.length} — уточните запрос</p>` : '');
}

ACTIONS.back = () => history.length>1 ? history.back() : go('#/today');
ACTIONS.setMeal = ds => { S.ui.addMeal = ds.m; save(); render(); };
ACTIONS.pickFood = ds => {
  const f = FOOD_BY_ID[ds.id];
  S.draft = {name:f.name, emoji:CAT_BY_ID[f.cat]?.emoji||'🥗', ing:[{id:f.id, g:100}], photo:null};
  save(); go('#/portion');
};
ACTIONS.pickFreq = ds => {
  const x = frequentFoods()[+ds.i]; if(!x) return;
  S.draft = {name:x.name, emoji:x.emoji, ing:x.ing.map(i=>({...i})), photo:null};
  save(); go('#/portion');
};
ACTIONS.addTabTo = ds => { SCANNER.stop(); S.ui.addTab = ds.v; S.ui.bcError = null; save(); render(); };
ACTIONS.scanStart = async () => {
  const v = $('#cam'), btn = $('#scan-btn');
  if(SCANNER.stream){ SCANNER.stop(); v.style.display='none'; btn.textContent='Сканировать камерой'; return; }
  try{
    v.style.display='block'; btn.textContent='Остановить';
    await SCANNER.start(v, code => {
      v.style.display='none'; btn.textContent='Сканировать камерой';
      const inp = $('#bc'); if(inp) inp.value = code;
      if(navigator.vibrate) navigator.vibrate(60);
      ACTIONS.scanBarcode();
    });
  }catch(e){
    v.style.display='none'; btn.textContent='Сканировать камерой';
    toast(e.name==='NotAllowedError' ? 'Доступ к камере запрещён' : e.message);
  }
};
ACTIONS.scanBarcode = async () => {
  const code = ($('#bc').value||'').trim();
  if(!/^\d{6,14}$/.test(code)) return toast('Код — от 6 до 14 цифр');
  toast('Ищем продукт…');
  try{
    SCANNER.stop();
    S.draft = await AI.lookupBarcode(code);
    S.ui.bcError = null; S.ui.bcCode = null;
    save(); go('#/portion');
  }catch(e){
    S.ui.bcError = e.message; S.ui.bcCode = code; save(); render();
  }
};

function bindAdd(){
  const tabs = $('#add-tabs');
  if(tabs) tabs.querySelectorAll('button').forEach(b=>b.onclick=()=>{
    S.ui.addTab = b.dataset.v; save(); render();
  });
  const q = $('#q');
  if(q){ q.oninput = () => { $('#results').innerHTML = foodResults(q.value); bind(); }; }
  const cats = $('#cats');
  if(cats) cats.querySelectorAll('.chip').forEach(b=>b.onclick=()=>{
    S.ui.addCat = b.dataset.c; save();
    cats.querySelectorAll('.chip').forEach(x=>x.classList.remove('on'));
    b.classList.add('on');
    if(q) q.value='';
    $('#results').innerHTML = foodResults(''); bind();
  });
  const dz = $('#dz'), file = $('#file'), sh = $('#shutter');
  if(dz){
    dz.onclick = () => file.click();
    file.onchange = () => {
      const f = file.files[0]; if(!f) return;
      const rd = new FileReader();
      rd.onload = () => { dz.style.backgroundImage=`url(${rd.result})`; dz.classList.add('filled'); dz.innerHTML=''; recognize(f, rd.result); };
      rd.readAsDataURL(f);
    };
    dz.ondragover = e => { e.preventDefault(); dz.classList.add('filled'); };
    dz.ondrop = e => { e.preventDefault(); file.files = e.dataTransfer.files; file.onchange(); };
    sh.onclick = () => file.click();
  }
}

async function recognize(file, photo){
  toast('Распознаём блюдо…');
  try{
    const draft = await AI.recognizeFood(file);
    draft.photo = photo;
    S.draft = draft; save(); go('#/portion');
  }catch(e){
    toast(e.name==='ProviderNotConfigured' ? 'Распознавание не подключено' : e.message);
  }
}

/* ============================================================
   Экран: Результат и правка порции
   ============================================================ */
function vPortion(){
  const d = S.draft;
  if(!d) return `<div class="empty">Нет черновика</div><button class="btn btn-dark" data-go="#/add">К добавлению</button>`;
  const m = foodFromIngredients(d.ing);
  const grams = d.ing.reduce((a,i)=>a+i.g,0);

  return `
  <div class="sess-top" style="color:var(--ink)">
    <button class="iconbtn" style="border-color:var(--line);color:var(--ink)" data-act="back">‹</button>
    <div class="mid"><b>Результат</b><small class="muted">поправьте вес — пересчитаем</small></div>
    <div style="width:44px"></div>
  </div>

  ${d.photo?`<div style="height:150px;border-radius:var(--r-lg);background:url(${d.photo}) center/cover;margin-bottom:14px"></div>`:''}
  <h1>${d.emoji} ${esc(d.name)}</h1>
  <p class="sub">Порция ${grams} г · ${d.ing.length} ${plural(d.ing.length,'ингредиент','ингредиента','ингредиентов')}${
    typeof d.confidence === 'number' ? ` · уверенность ${Math.round(d.confidence*100)}%` : ''}</p>
  ${d.meta ? `<p class="tiny" style="margin:-12px 0 14px">${esc(d.meta.model||'')}${
    d.meta.ms?` · ${(d.meta.ms/1000).toFixed(1)} с`:''}${d.meta.tokens?` · ${d.meta.tokens} токенов`:''}</p>` : ''}

  <div class="hero">
    <div class="kcal">
      <div class="n num" id="p-kcal">${Math.round(m.kcal)}<small>ккал в порции</small></div>
      <ul id="p-macros">
        <li><span><i style="background:var(--blue)"></i>Белки</span><b class="num">${round(m.p,1)} г</b></li>
        <li><span><i style="background:var(--yellow)"></i>Жиры</span><b class="num">${round(m.f,1)} г</b></li>
        <li><span><i style="background:var(--green)"></i>Углеводы</span><b class="num">${round(m.c,1)} г</b></li>
      </ul>
    </div>
  </div>

  <h2>Ингредиенты</h2>
  <div id="ings">${d.ing.map((i,idx)=>{
    const f = ingInfo(i);
    return `<div class="ing">
      <div class="b"><b>${esc(f.name)}</b>${f.fromModel?'<span class="tag warn" style="margin-left:6px;font-size:10px;padding:2px 7px">оценка</span>':''}
        <small class="num" data-kcal="${idx}">${Math.round(f.kcal*i.g/100)} ккал</small></div>
      <div class="stepper">
        <button data-act="gram" data-i="${idx}" data-d="-10">−</button>
        <input class="num" type="number" data-g="${idx}" value="${i.g}">
        <button data-act="gram" data-i="${idx}" data-d="10">+</button>
      </div>
      <button class="skip" data-act="delIng" data-i="${idx}" style="color:var(--ink-3);background:none;border:0;font-size:18px;cursor:pointer">×</button>
    </div>`;
  }).join('')}</div>

  ${d.ing.some(i=>i.custom && i.custom.fromModel) ? `<p class="tiny" style="margin:2px 0 10px">
    Помеченные «оценка» продукты модель посчитала сама — их нет в базе. Числа приблизительные.</p>` : ''}

  <select id="add-ing" style="margin-bottom:10px">
    <option value="">+ Добавить ингредиент</option>
    ${FOODS.map(f=>`<option value="${f.id}">${f.name}</option>`).join('')}
  </select>

  <div class="sticky-cta">
    <div class="btn-row">
      <select id="p-meal" style="flex:0 0 42%;border-radius:100px;padding:16px">
        ${MEALS.map(x=>`<option value="${x.id}" ${S.ui.addMeal===x.id?'selected':''}>${x.name}</option>`).join('')}
      </select>
      <button class="btn btn-dark" style="font-size:14px;flex:1;min-width:0" data-act="saveFood">В дневник · <span class="num" id="p-btn">${Math.round(m.kcal)}</span> ккал</button>
    </div>
  </div>
  <div style="height:10px"></div>`;
}

function plural(n,a,b,c){ n=Math.abs(n)%100; const n1=n%10;
  if(n>10&&n<20) return c; if(n1>1&&n1<5) return b; if(n1===1) return a; return c; }

function repaintPortion(){
  const d = S.draft, m = foodFromIngredients(d.ing);
  $('#p-kcal').innerHTML = `${Math.round(m.kcal)}<small>ккал в порции</small>`;
  $('#p-btn').textContent = Math.round(m.kcal);
  $('#p-macros').innerHTML = `
    <li><span><i style="background:var(--blue)"></i>Белки</span><b class="num">${round(m.p,1)} г</b></li>
    <li><span><i style="background:var(--yellow)"></i>Жиры</span><b class="num">${round(m.f,1)} г</b></li>
    <li><span><i style="background:var(--green)"></i>Углеводы</span><b class="num">${round(m.c,1)} г</b></li>`;
  d.ing.forEach((i,idx)=>{
    const f = ingInfo(i);
    const el = document.querySelector(`[data-kcal="${idx}"]`);
    if(el) el.textContent = `${Math.round(f.kcal*i.g/100)} ккал`;
    const inp = document.querySelector(`[data-g="${idx}"]`);
    if(inp && +inp.value!==i.g) inp.value = i.g;
  });
}

ACTIONS.gram = ds => {
  const i = +ds.i;
  S.draft.ing[i].g = clamp(S.draft.ing[i].g + (+ds.d), 0, 3000);
  save(); repaintPortion();
};
ACTIONS.delIng = ds => {
  S.draft.ing.splice(+ds.i,1);
  if(!S.draft.ing.length) return (go('#/add'), toast('Ингредиентов не осталось'));
  save(); render();
};
ACTIONS.saveFood = () => {
  const d = S.draft, date = S.ui.diaryDate || today();
  const meal = $('#p-meal').value;
  const m = foodFromIngredients(d.ing);
  const now = new Date();
  const e = {id:uid(), meal, name:d.name, emoji:d.emoji, ing:d.ing,
    time:`${now.getHours()}:${String(now.getMinutes()).padStart(2,'0')}`,
    kcal:Math.round(m.kcal), p:round(m.p,1), f:round(m.f,1), c:round(m.c,1)};
  (S.food[date] = S.food[date]||[]).push(e);
  S.draft = null; save(); go('#/diary'); toast(`${e.name} · ${e.kcal} ккал добавлено`);
};

function bindPortion(){
  document.querySelectorAll('[data-g]').forEach(inp=>{
    inp.oninput = () => { S.draft.ing[+inp.dataset.g].g = clamp(+inp.value||0,0,3000); save(); repaintPortion(); };
  });
  const sel = $('#add-ing');
  if(sel) sel.onchange = () => {
    if(!sel.value) return;
    S.draft.ing.push({id:sel.value, g:100}); save(); render();
  };
}

/* ============================================================
   Экран: Спорт (план недели + история)
   ============================================================ */
function vSport(){
  const t = today(), days = weekOf(t);
  const planned = days.filter(d=>S.schedule[parseISO(d).getDay()]).length;
  const done = days.filter(d=>S.workouts.some(w=>w.date===d)).length;
  const week = S.workouts.filter(w=>days.includes(w.date));
  const ton = week.reduce((a,w)=>a+(w.tonnage||0),0);
  const kcal = week.reduce((a,w)=>a+w.kcal,0);

  return `
  <h1>Тренировки</h1>
  <div style="height:14px"></div>

  <div class="card dark">
    <div style="display:flex;justify-content:space-between;align-items:center">
      <span class="tiny" style="color:var(--ink-3)">Эта неделя</span>
      <span class="tag">План ${done} из ${planned}</span>
    </div>
    <div class="chartbars">
      ${days.map(d=>{
        const w = S.workouts.find(x=>x.date===d);
        const h = w ? clamp((w.tonnage? w.tonnage/6000 : 0.55),0.22,1)*100 : 14;
        return `<div class="b ${w?'':'mute'}" style="height:${h}%"></div>`;
      }).join('')}
    </div>
    <div class="chartlabels">${days.map(d=>`<span>${DOW[parseISO(d).getDay()]}</span>`).join('')}</div>
    <div style="display:flex;gap:20px;margin-top:16px">
      <div><div style="font-size:24px;font-weight:700" class="num">${done}</div><div class="tiny">тренировки</div></div>
      <div><div style="font-size:24px;font-weight:700" class="num">${round(ton/1000,1)} т</div><div class="tiny">тоннаж</div></div>
      <div><div style="font-size:24px;font-weight:700" class="num">${kcal}</div><div class="tiny">ккал</div></div>
    </div>
  </div>

  <div class="row-head"><h2>План недели</h2>
    <button class="link" data-go="#/programs">Программы</button></div>
  ${days.map(d=>{
    const dd = parseISO(d), pid = S.schedule[dd.getDay()];
    const p = pid?progById(pid):null;
    const w = S.workouts.find(x=>x.date===d);
    if(!p) return `<div class="item" style="opacity:.55"><div class="thumb">—</div>
      <div class="body"><b>${cap(DOW_FULL[dd.getDay()])}</b><small>Отдых</small></div></div>`;
    return `<div class="item">
      <div class="thumb ${w?'lime':''}">${w?'✓':p.emoji}</div>
      <div class="body"><b>${esc(p.name)}</b><small>${cap(DOW_FULL[dd.getDay()])} · ~${p.est} мин</small></div>
      ${d===today() && !w
        ? `<button class="btn btn-dark btn-sm" data-go="#/program/${p.id}">Начать</button>`
        : `<button class="btn btn-ghost btn-sm" data-go="#/program/${p.id}">Смотреть</button>`}
    </div>`;
  }).join('')}

  <div class="row-head"><h2>История</h2></div>
  ${S.workouts.length? S.workouts.slice().sort((a,b)=>b.date<a.date?-1:1).slice(0,12).map(w=>`
    <div class="card tight">
      <div style="display:flex;align-items:center;gap:12px">
        <div class="thumb ${w.type==='cardio'?'yellow':'lime'}" style="width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center">${w.type==='cardio'?'🏃':'🏋️'}</div>
        <div style="flex:1"><b>${esc(w.name)}</b><br><small class="tiny">${shortDate(w.date)} · ${Math.round(w.durationSec/60)} мин</small></div>
        <div style="text-align:right"><b class="num" style="font-size:17px">${w.kcal}</b><br><small class="tiny">ккал</small></div>
      </div>
      <div class="grid3" style="margin-top:10px">
        ${w.type==='cardio'
          ? `<div class="card flat tight" style="margin:0"><b class="num">${w.cardio.km} км</b><div class="tiny">дистанция</div></div>
             <div class="card flat tight" style="margin:0"><b class="num">${w.cardio.pace}</b><div class="tiny">темп</div></div>
             <div class="card flat tight" style="margin:0"><b class="num">${w.cardio.pulse}</b><div class="tiny">пульс</div></div>`
          : `<div class="card flat tight" style="margin:0"><b class="num">${round(w.tonnage/1000,1)} т</b><div class="tiny">тоннаж</div></div>
             <div class="card flat tight" style="margin:0"><b class="num">${w.exercises.reduce((a,e)=>a+e.sets.filter(s=>s.status&&s.status!=='skipped').length,0)}</b><div class="tiny">подходов</div></div>
             <div class="card flat tight" style="margin:0"><b class="num">${w.exercises.length}</b><div class="tiny">упражнений</div></div>`}
      </div>
    </div>`).join('') : `<div class="empty">История пуста</div>`}
  <div style="height:20px"></div>`;
}

/* ============================================================
   Экран: Превью программы (что ждёт на тренировке)
   ============================================================ */
function vProgram(seg){
  const p = progById(seg[1]);
  if(!p) return `<div class="empty">Программа не найдена</div>`;
  const last = S.workouts.filter(w=>w.programId===p.id).sort((a,b)=>b.date<a.date?-1:1)[0];

  if(p.type==='cardio') return `
    <div class="sess-top" style="color:var(--ink)">
      <button class="iconbtn" style="border-color:var(--line);color:var(--ink)" data-act="back">‹</button>
      <div class="mid"><b>${esc(p.name)}</b><small class="muted">кардио</small></div>
      <div style="width:44px"></div>
    </div>
    <h1>${p.emoji} ${esc(p.name)}</h1>
    <p class="sub">Цель: ${p.cardio.targetKm} км за ~${p.cardio.targetMin} мин</p>
    ${last?`<div class="card"><div class="tiny">Прошлый раз · ${shortDate(last.date)}</div>
      <div class="grid3" style="margin-top:10px">
        <div><b class="num" style="font-size:19px">${last.cardio.km} км</b><div class="tiny">дистанция</div></div>
        <div><b class="num" style="font-size:19px">${last.cardio.pace}</b><div class="tiny">темп</div></div>
        <div><b class="num" style="font-size:19px">${last.cardio.pulse}</b><div class="tiny">пульс</div></div>
      </div></div>`:''}
    <div class="card"><p class="muted" style="margin:0;font-size:14px">Расход считается по формуле MET × вес × время. Это оценка, без пульсометра точнее не получится.</p></div>
    <div class="sticky-cta"><button class="btn btn-primary" data-act="startSession" data-p="${p.id}">Начать пробежку</button></div>`;

  return `
  <div class="sess-top" style="color:var(--ink)">
    <button class="iconbtn" style="border-color:var(--line);color:var(--ink)" data-act="back">‹</button>
    <div class="mid"><b>Что ждёт сегодня</b><small class="muted">${p.ex.length} упражнений · ~${p.est} мин</small></div>
    <div style="width:44px"></div>
  </div>
  <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px">
    <div><h1>${p.emoji} ${esc(p.name)}</h1>
      <p class="sub" style="margin:0">Отдых ${p.rest} сек · тоннаж прошлой ${last&&last.tonnage?round(last.tonnage/1000,1)+' т':'—'}</p></div>
    <button class="btn btn-ghost btn-sm" style="margin-top:10px" data-go="#/pedit/${p.id}">Править</button>
  </div>
  <div style="height:16px"></div>

  <div class="card">
    ${p.ex.map((e,i)=>{
      const best = bestSet(e.name);
      return `<div class="exlist-row" style="cursor:pointer" data-go="#/ex/${encodeURIComponent(e.name)}">
        <div class="n num">${i+1}</div>
        <div class="b"><b>${esc(e.name)}</b>
          <small>${e.sets} × ${e.reps} повт${best&&best.w>0?` · рекорд ${best.w} кг × ${best.r}`:''}</small></div>
        <div class="w num">${e.w?e.w+' кг':'—'} ›</div>
      </div>`;
    }).join('')}
  </div>

  <div class="card flat">
    <b style="font-size:15px">Как отмечать</b>
    <p class="muted" style="font-size:14px;line-height:1.45;margin:8px 0 0">
      Галочка — подход выполнен как задумано. Поменяли вес или повторы перед галочкой — подход отметится как
      <span class="tag warn">с изменениями</span>, план и факт сохранятся отдельно.
      Крестик — пропуск. Таймер отдыха стартует сам.</p>
  </div>

  <div class="sticky-cta"><button class="btn btn-primary" data-act="startSession" data-p="${p.id}">Начать тренировку</button></div>
  <div style="height:10px"></div>`;
}

ACTIONS.startSession = ds => {
  const p = progById(ds.p);
  const now = Date.now();
  if(p.type==='cardio'){
    S.session = {programId:p.id, name:'Пробежка вдоль набережной', type:'cardio',
      startedAt:now, paused:false, pausedAt:0, pausedAccum:0,
      cardio:{km:0, pulse:0}};
  } else {
    S.session = {programId:p.id, name:p.name, type:'strength',
      startedAt:now, paused:false, pausedAt:0, pausedAccum:0,
      exIndex:0, restUntil:null, restTotal:p.rest,
      exercises: p.ex.map(e=>({
        name:e.name, plan:{sets:e.sets, reps:e.reps, w:e.w},
        sets: Array.from({length:e.sets},()=>({
          w:e.w, r:parseInt(e.reps)||10,
          planW:e.w, planR:parseInt(e.reps)||10, status:null
        }))
      }))
    };
  }
  save(); go('#/session');
};

/* ---------- Часы сессии ---------- */
let ticker = null;
function startTicker(){ stopTicker(); ticker = setInterval(tick, 250); tick(); }
function stopTicker(){ if(ticker) clearInterval(ticker); ticker=null; }
function elapsedSec(s){
  if(!s) return 0;
  const now = Date.now();
  const paused = s.paused ? now - s.pausedAt : 0;
  return Math.floor((now - s.startedAt - s.pausedAccum - paused)/1000);
}
function tick(){
  const s = S.session; if(!s) return;
  if(s.restUntil && Date.now() >= s.restUntil){
    s.restUntil = null; save();
    if(navigator.vibrate) navigator.vibrate([120,60,120]);
    toast('Отдых окончен — следующий подход');
  }
  const el = $('#sess-clock'); if(el) el.textContent = mmss(elapsedSec(s));
  const slot = $('#rest-slot');
  if(slot && s.type==='strength'){
    const html = restCard(s);
    if(slot.dataset.h !== html){ slot.dataset.h = html; slot.innerHTML = html; bind(); }
  }
  if(s.type==='cardio'){
    const c = $('#cardio-clock'); if(c) c.textContent = mmss(elapsedSec(s));
    const k = $('#cardio-kcal'); if(k) k.textContent = estKcal('cardio', elapsedSec(s)/60);
    const pc = $('#cardio-pace'); if(pc) pc.textContent = paceOf(s.cardio.km, elapsedSec(s));
  }
}

/* ============================================================
   Экран: Активная сессия
   ============================================================ */
function vSession(){
  const s = S.session;
  if(!s) return `<div class="empty">Активной тренировки нет</div><button class="btn btn-dark" data-go="#/sport">К плану</button>`;
  return s.type==='cardio' ? cardioSession(s) : strengthSession(s);
}

function sessTop(s, sub){
  return `<div class="sess-top">
    <button class="iconbtn" data-act="quitSession">‹</button>
    <div class="mid"><b>${esc(s.name)}</b><small><span id="sess-clock" class="num">${mmss(elapsedSec(s))}</span> · ${sub}</small></div>
    <button class="iconbtn" data-act="togglePause">${s.paused?'▶':'❚❚'}</button>
  </div>`;
}

function restCard(s){
  const ex = s.exercises[s.exIndex];
  const done = ex.sets.filter(x=>x.status && x.status!=='skipped').length;
  const rem = s.restUntil ? Math.max(0, Math.ceil((s.restUntil - Date.now())/1000)) : 0;

  if(rem > 0){
    const pct = rem / s.restTotal;
    return `<div class="rest-card">
      <div class="rest-ring">${ring(pct,92,8,'var(--dark)','var(--line)')}
        <div class="v num">${mmss(rem)}</div></div>
      <div style="flex:1">
        <h3>Отдых</h3>
        <p>Следующий подход — ${done+1} из ${ex.sets.length}.</p>
        <div class="btn-row">
          <button class="btn btn-ghost btn-sm" data-act="restPlus">+30 секунд</button>
          <button class="btn btn-dark btn-sm" data-act="restSkip">Пропустить</button>
        </div>
      </div>
    </div>`;
  }
  return `<div class="rest-card">
    <div class="rest-ring">${ring(done/ex.sets.length,92,8,'var(--dark)','var(--line)')}
      <div class="v num">${done}/${ex.sets.length}</div></div>
    <div style="flex:1">
      <h3>Подходов сделано</h3>
      <p>Отметьте подход — таймер отдыха запустится сам.</p>
      <button class="btn btn-ghost btn-sm" data-act="restStart">Отдых ${s.restTotal} сек</button>
    </div>
  </div>`;
}

function strengthSession(s){
  const ex = s.exercises[s.exIndex];
  const next = s.exercises[s.exIndex+1];
  const best = bestSet(ex.name);
  const ton = ex.sets.reduce((a,x)=>a+(x.status&&x.status!=='skipped'?x.w*x.r:0),0);
  const allMarked = ex.sets.every(x=>x.status);
  const isLast = s.exIndex === s.exercises.length-1;

  return `
  ${sessTop(s, `упражнение ${s.exIndex+1} из ${s.exercises.length}`)}
  <div id="rest-slot">${restCard(s)}</div>

  <div class="ex-card">
    <h3 style="cursor:pointer" data-go="#/ex/${encodeURIComponent(ex.name)}">${esc(ex.name)} <span style="color:var(--ink-3);font-weight:400">›</span></h3>
    <p class="goal">Цель: ${ex.plan.sets} подхода × ${ex.plan.reps} · ${best&&best.w>0?`рекорд ${best.w} кг × ${best.r}`:'свой вес'}</p>
    ${ex.sets.map((x,i)=>`
      <div class="set ${x.status||''}">
        <div class="idx num">${i+1}</div>
        <input class="num" type="number" step="0.5" data-set="${i}" data-k="w" value="${x.w}">
        <span class="u">кг</span><span class="x">×</span>
        <input class="num" type="number" data-set="${i}" data-k="r" value="${x.r}">
        <span class="u">повт</span>
        <span class="sp"></span>
        ${x.status==='changed'?`<span class="tag warn" style="margin-right:6px">изм.</span>`:''}
        <button class="skip" data-act="skipSet" data-i="${i}" title="Пропустить">✕</button>
        <button class="check" data-act="markSet" data-i="${i}">✓</button>
      </div>`).join('')}
    <div class="btn-row" style="margin:2px 0 12px">
      <button class="btn btn-ghost-dark btn-sm" style="flex:1" data-act="addSet">+ подход</button>
      <button class="btn btn-ghost-dark btn-sm" style="flex:1" data-act="delSet">− подход</button>
    </div>
    <textarea id="ex-note" rows="2" placeholder="Заметка: техника, самочувствие, что поменять"
      style="background:#22221E;border-color:var(--line-dark);color:#fff;font-size:14px;margin-bottom:12px">${esc(ex.note||'')}</textarea>
    <div class="ex-foot"><span style="color:var(--ink-3)">Тоннаж упражнения</span><b class="num">${ton} кг</b></div>
  </div>

  <div class="upnext">
    <div><small>Далее</small><b>${next?esc(next.name):'Завершение'}</b></div>
    <div><small>Ккал (оценка)</small><b class="num">${estKcal('strength', elapsedSec(s)/60)}</b></div>
  </div>

  <div class="btn-row" style="margin-bottom:10px">
    ${s.exIndex>0?`<button class="btn btn-ghost-dark btn-sm" style="flex:1" data-act="prevEx">Назад</button>`:''}
    <button class="btn btn-primary" data-act="nextEx" style="flex:2">
      ${isLast?'Завершить тренировку':'Следующее упражнение'}</button>
  </div>
  <div style="height:20px"></div>`;
}

function cardioSession(s){
  const sec = elapsedSec(s);
  return `
  ${sessTop(s, 'кардио')}
  <div class="rest-card" style="flex-direction:column;align-items:stretch;text-align:center">
    <div class="num" id="cardio-clock" style="font-size:56px;font-weight:700;letter-spacing:-.02em">${mmss(sec)}</div>
    <p style="margin:0 0 14px">${s.paused?'Пауза':'Идёт пробежка'}</p>
    <div class="grid2">
      <label class="field" style="margin:0"><span>Дистанция, км</span>
        <input class="num" type="number" step="0.1" id="c-km" value="${s.cardio.km||''}" placeholder="0.0"></label>
      <label class="field" style="margin:0"><span>Средний пульс</span>
        <input class="num" type="number" id="c-pulse" value="${s.cardio.pulse||''}" placeholder="—"></label>
    </div>
  </div>
  <div class="upnext">
    <div><small>Ккал (оценка)</small><b class="num" id="cardio-kcal">${estKcal('cardio', sec/60)}</b></div>
    <div><small>Темп</small><b class="num" id="cardio-pace">${paceOf(s.cardio.km, sec)}</b></div>
  </div>
  <button class="btn btn-primary" data-act="finishSession">Завершить пробежку</button>
  <div style="height:20px"></div>`;
}
function paceOf(km, sec){ if(!km||km<=0) return '—'; return `${mmss(Math.round(sec/km))}`; }

/* ---------- Действия сессии ---------- */
ACTIONS.markSet = ds => {
  const s = S.session, ex = s.exercises[s.exIndex], i = +ds.i, x = ex.sets[i];
  if(x.status){ x.status = null; save(); render(); return; }
  x.status = (x.w !== x.planW || x.r !== x.planR) ? 'changed' : 'done';
  const left = ex.sets.some(y=>!y.status);
  if(left){ s.restUntil = Date.now() + s.restTotal*1000; }
  save(); render();
  toast(x.status==='changed' ? `Подход ${i+1}: ${x.w} кг × ${x.r} (план ${x.planW}×${x.planR})` : `Подход ${i+1} засчитан`);
};
ACTIONS.skipSet = ds => {
  const x = S.session.exercises[S.session.exIndex].sets[+ds.i];
  x.status = x.status==='skipped' ? null : 'skipped';
  save(); render();
};
ACTIONS.addSet = () => {
  const ex = S.session.exercises[S.session.exIndex];
  const lastSet = ex.sets[ex.sets.length-1] || {w:0, r:10};
  ex.sets.push({w:lastSet.w, r:lastSet.r, planW:lastSet.w, planR:lastSet.r, status:null});
  save(); render();
};
ACTIONS.delSet = () => {
  const ex = S.session.exercises[S.session.exIndex];
  if(ex.sets.length <= 1) return toast('Последний подход не удалить');
  ex.sets.pop(); save(); render();
};
ACTIONS.restPlus  = () => { const s=S.session; s.restUntil=(s.restUntil||Date.now())+30000; s.restTotal+=30; save(); tick(); };
ACTIONS.restSkip  = () => { S.session.restUntil=null; save(); render(); };
ACTIONS.restStart = () => { const s=S.session; s.restUntil=Date.now()+s.restTotal*1000; save(); render(); };
ACTIONS.prevEx    = () => { S.session.exIndex--; S.session.restUntil=null; save(); render(); };
ACTIONS.nextEx    = () => {
  const s = S.session;
  if(s.exIndex === s.exercises.length-1) return ACTIONS.finishSession();
  s.exIndex++; s.restUntil = null; save(); render(); $('#app').scrollTop = 0;
};
ACTIONS.togglePause = () => {
  const s = S.session, now = Date.now();
  if(s.paused){
    const d = now - s.pausedAt;
    s.pausedAccum += d;
    if(s.restUntil) s.restUntil += d;
    s.paused = false;
  } else { s.paused = true; s.pausedAt = now; }
  save(); render();
};
ACTIONS.quitSession = () => {
  if(confirm('Выйти? Прогресс тренировки не сохранится.')){ S.session=null; save(); go('#/sport'); }
};
ACTIONS.finishSession = () => {
  const s = S.session, sec = elapsedSec(s);
  let w;
  if(s.type==='cardio'){
    const km = +($('#c-km')?.value||s.cardio.km||0);
    const pulse = +($('#c-pulse')?.value||s.cardio.pulse||0);
    w = {id:uid(), date:today(), programId:s.programId, name:s.name, type:'cardio',
      durationSec:sec, kcal:estKcal('cardio', sec/60),
      cardio:{km:round(km,1), pace:paceOf(km,sec), pulse}, exercises:[]};
  } else {
    const ex = s.exercises.map(e=>({name:e.name, plan:e.plan, note:e.note||'',
      sets:e.sets.map(x=>({w:x.w,r:x.r,planW:x.planW,planR:x.planR,status:x.status||'skipped'}))}));
    w = {id:uid(), date:today(), programId:s.programId, name:s.name, type:'strength',
      durationSec:sec, kcal:estKcal('strength', sec/60), exercises:ex, tonnage:tonnage(ex)};
  }
  S.workouts.push(w); S.session=null; save(); go('#/summary?id='+w.id);
};

function bindSession(){
  document.querySelectorAll('[data-set]').forEach(inp=>{
    inp.oninput = () => {
      const x = S.session.exercises[S.session.exIndex].sets[+inp.dataset.set];
      x[inp.dataset.k] = +inp.value||0;
      if(x.status) x.status = (x.w!==x.planW||x.r!==x.planR)?'changed':'done';
      save();
    };
  });
  const note = $('#ex-note');
  if(note) note.oninput = () => { S.session.exercises[S.session.exIndex].note = note.value; save(); };
  const km = $('#c-km'), pulse = $('#c-pulse');
  if(km) km.oninput = () => { S.session.cardio.km = +km.value||0; save(); };
  if(pulse) pulse.oninput = () => { S.session.cardio.pulse = +pulse.value||0; save(); };
}

/* ============================================================
   Экран: Итог тренировки
   ============================================================ */
function vSummary(seg,q){
  const w = S.workouts.find(x=>x.id===q.id) || S.workouts[S.workouts.length-1];
  if(!w) return `<div class="empty">Нет данных</div>`;
  const changed = (w.exercises||[]).reduce((a,e)=>a+e.sets.filter(s=>s.status==='changed').length,0);
  const skipped = (w.exercises||[]).reduce((a,e)=>a+e.sets.filter(s=>s.status==='skipped').length,0);
  const prs = (w.exercises||[]).filter(e=>{
    const mx = Math.max(...e.sets.filter(s=>s.status!=='skipped').map(s=>s.w), 0);
    const prev = bestSetBefore(e.name, w.date);
    return mx>0 && (!prev || mx>prev.w);
  });

  return `
  <div style="text-align:center;padding-top:20px">
    <div style="font-size:56px">🎉</div>
    <h1 style="text-align:center">Тренировка закрыта</h1>
    <p class="sub" style="text-align:center">${esc(w.name)} · ${shortDate(w.date)}</p>
  </div>

  <div class="statgrid">
    <div class="stat dark"><div class="big num">${Math.round(w.durationSec/60)}</div><div class="cap">минут в зале</div></div>
    <div class="stat"><div class="big num">${w.kcal}</div><div class="cap">ккал (оценка)</div></div>
    ${w.type==='cardio'
      ? `<div class="stat"><div class="big num">${w.cardio.km}</div><div class="cap">км</div></div>
         <div class="stat"><div class="big num">${w.cardio.pace}</div><div class="cap">средний темп</div></div>`
      : `<div class="stat"><div class="big num">${round(w.tonnage/1000,1)}</div><div class="cap">тонн поднято</div></div>
         <div class="stat"><div class="big num">${w.exercises.reduce((a,e)=>a+e.sets.filter(s=>s.status!=='skipped').length,0)}</div><div class="cap">подходов выполнено</div></div>`}
  </div>

  ${w.type!=='cardio'?`
  <div class="card" style="margin-top:12px">
    <div class="progline"><div class="t"><b>Как задумано</b><span class="num">${w.exercises.reduce((a,e)=>a+e.sets.filter(s=>s.status==='done').length,0)} подх.</span></div></div>
    <div class="progline"><div class="t"><b>С изменениями</b><span class="num">${changed} подх.</span></div></div>
    <div class="progline"><div class="t"><b>Пропущено</b><span class="num">${skipped} подх.</span></div></div>
  </div>`:''}

  ${prs.length?`<div class="card dark">
    <div class="tag">Новые рекорды</div>
    ${prs.map(e=>`<div style="display:flex;justify-content:space-between;margin-top:10px">
      <span>${esc(e.name)}</span><b class="num">${Math.max(...e.sets.map(s=>s.w))} кг</b></div>`).join('')}
  </div>`:''}

  <div class="sticky-cta"><button class="btn btn-primary" data-go="#/today">Готово</button></div>`;
}
function bestSetBefore(name, date){
  let best=null;
  S.workouts.filter(w=>w.date<date).forEach(w=>(w.exercises||[]).forEach(e=>{
    if(e.name!==name) return;
    e.sets.forEach(s=>{ if(s.status==='skipped')return; if(!best||s.w>best.w) best={w:s.w,r:s.r}; });
  }));
  return best;
}

/* ============================================================
   Экран: Прогресс
   ============================================================ */
function vProgress(){
  const p = S.profile;
  const ws = S.weights.slice(-14);
  const cur = ws.length?ws[ws.length-1].kg:p.weight;
  const first = ws.length?ws[0].kg:cur;
  const delta = round(cur-first,1);

  /* стрик: подряд дни с записями еды, считая назад от сегодня */
  let streak = 0;
  for(let i=0;i<400;i++){ const d=addDays(today(),-i);
    if(dayFood(d).length) streak++; else { if(i>0) break; } }

  /* попадания в норму за 14 дней */
  let hit=0, tot=0, sum={p:0,f:0,c:0}, days7=0;
  for(let i=0;i<14;i++){
    const d = addDays(today(),-i); const t = dayTotals(d);
    if(!dayFood(d).length) continue;
    tot++;
    const budget = p.targetKcal + (p.subtractWorkout?dayBurn(d):0);
    if(Math.abs(t.kcal-budget)/budget <= 0.12) hit++;
    if(i<7){ days7++; sum.p+=t.p; sum.f+=t.f; sum.c+=t.c; }
  }
  const pctHit = tot?Math.round(hit/tot*100):0;
  const avg = k => days7?Math.round(sum[k]/days7):0;

  /* рекорды */
  const names = [...new Set(S.workouts.flatMap(w=>(w.exercises||[]).map(e=>e.name)))];
  const prs = names.map(n=>({n, b:bestSet(n)})).filter(x=>x.b&&x.b.w>0)
    .sort((a,b)=>b.b.w-a.b.w).slice(0,6);

  const min = Math.min(...ws.map(x=>x.kg)), max = Math.max(...ws.map(x=>x.kg));
  const span = Math.max(0.6, max-min);

  return `
  <h1>Прогресс</h1>
  <div style="height:14px"></div>

  <div class="card">
    <div style="display:flex;justify-content:space-between;align-items:flex-start">
      <div><div class="tiny">Вес сейчас</div>
        <div style="font-size:40px;font-weight:700;line-height:1" class="num">${cur} <span style="font-size:16px;color:var(--ink-3)">кг</span></div></div>
      <span class="pill num" style="${delta>0?'background:var(--red);color:#fff':''}">${delta>0?'+':''}${delta} кг</span>
    </div>
    <div class="chartbars on-light" style="margin-top:18px">
      ${ws.map(x=>`<div class="b mute" style="height:${clamp((x.kg-min)/span,0,1)*70+25}%;background:var(--dark)"></div>`).join('')}
    </div>
    <div class="chartlabels">
      ${ws.map((x,i)=>`<span>${i%3===0?MONTHS_SHORT[parseISO(x.date).getMonth()]:''}</span>`).join('')}
    </div>
    <div class="btn-row" style="margin-top:14px">
      <input class="num" id="w-new" type="number" step="0.1" placeholder="${cur}" style="flex:1">
      <button class="btn btn-dark btn-sm" data-act="addWeight">Записать вес</button>
    </div>
  </div>

  <div class="statgrid">
    <div class="stat dark"><div class="big num">${streak}</div><div class="cap">дней подряд с записями</div></div>
    <div class="stat"><div class="big num">${pctHit}%</div><div class="cap">попаданий в норму калорий</div></div>
  </div>

  <div class="card" style="margin-top:12px">
    <h3 style="margin-bottom:14px">Средние БЖУ за неделю</h3>
    ${[['Белки','p',p.p,'var(--blue)'],['Жиры','f',p.f,'var(--yellow)'],['Углеводы','c',p.c,'var(--green)']]
      .map(([n,k,t,col])=>`
      <div class="progline">
        <div class="t"><b>${n}</b><span class="num">${avg(k)} из ${t} г</span></div>
        <div class="bar light"><i style="width:${clamp(avg(k)/t,0,1)*100}%;background:${col}"></i></div>
      </div>`).join('')}
  </div>

  <div class="row-head"><h2>Рекорды</h2></div>
  ${prs.length? `<div class="card">${prs.map(x=>`
    <div class="exlist-row"><div class="b"><b>${esc(x.n)}</b><small>${shortDate(x.b.date)}</small></div>
      <div class="w num">${x.b.w} кг × ${x.b.r}</div></div>`).join('')}</div>`
    : `<div class="empty">Проведите первую тренировку</div>`}
  <div style="height:20px"></div>`;
}
ACTIONS.addWeight = () => {
  const v = +$('#w-new').value;
  if(!v || v<30 || v>250) return toast('Введите вес 30–250 кг');
  const d = today();
  const ex = S.weights.find(x=>x.date===d);
  if(ex) ex.kg = round(v,1); else S.weights.push({date:d, kg:round(v,1)});
  S.profile.weight = round(v,1);
  if(S.profile.autoTargets) Object.assign(S.profile, calcTargets(S.profile));
  save(); render(); toast('Вес записан');
};

/* ============================================================
   Экран: Профиль и настройки
   ============================================================ */
function vProfile(){
  const p = S.profile;
  return `
  <h1>Профиль</h1>
  <p class="sub">Цели, план тренировок и данные приложения</p>

  <div class="card">
    <label class="field"><span>Имя</span><input id="pf-name" value="${esc(p.name)}"></label>
    <div class="grid2">
      <label class="field"><span>Возраст</span><input id="pf-age" type="number" value="${p.age}"></label>
      <label class="field"><span>Пол</span><select id="pf-sex">
        <option value="f" ${p.sex==='f'?'selected':''}>Женский</option>
        <option value="m" ${p.sex==='m'?'selected':''}>Мужской</option></select></label>
    </div>
    <div class="grid2">
      <label class="field"><span>Рост, см</span><input id="pf-height" type="number" value="${p.height}"></label>
      <label class="field"><span>Вес, кг</span><input id="pf-weight" type="number" step="0.1" value="${p.weight}"></label>
    </div>
    <label class="field" style="margin:0"><span>Цель</span><select id="pf-goal">
      <option value="lose" ${p.goal==='lose'?'selected':''}>Снизить вес</option>
      <option value="keep" ${p.goal==='keep'?'selected':''}>Удержать</option>
      <option value="gain" ${p.goal==='gain'?'selected':''}>Набрать массу</option></select></label>
  </div>

  <h2>Нормы</h2>
  <div class="card">
    <label style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
      <input type="checkbox" id="pf-auto" ${p.autoTargets?'checked':''} style="width:auto">
      <span style="font-size:15px">Считать автоматически (Миффлин — Сан-Жеор)</span></label>
    <div class="grid2">
      <label class="field"><span>Калории</span><input id="pf-kcal" type="number" value="${p.targetKcal}" ${p.autoTargets?'disabled':''}></label>
      <label class="field"><span>Белки, г</span><input id="pf-p" type="number" value="${p.p}" ${p.autoTargets?'disabled':''}></label>
    </div>
    <div class="grid2">
      <label class="field"><span>Жиры, г</span><input id="pf-f" type="number" value="${p.f}" ${p.autoTargets?'disabled':''}></label>
      <label class="field" style="margin:0"><span>Углеводы, г</span><input id="pf-c" type="number" value="${p.c}" ${p.autoTargets?'disabled':''}></label>
    </div>
  </div>

  <h2>Тренировки</h2>
  <div class="card">
    <label class="field"><span>Отдых между подходами, сек</span>
      <input id="pf-rest" type="number" step="15" value="${p.restDefault}"></label>
    <label style="display:flex;align-items:center;gap:10px">
      <input type="checkbox" id="pf-sub" ${p.subtractWorkout?'checked':''} style="width:auto">
      <span style="font-size:15px">Добавлять сожжённое к дневной норме</span></label>
    <p class="tiny" style="margin:8px 0 0">Выключите, если дефицит уже заложен в норму — иначе калории учтутся дважды.</p>
  </div>

  <h2>План недели</h2>
  <div class="card">
    ${[1,2,3,4,5,6,0].map(d=>`
      <label class="field" style="margin-bottom:10px"><span>${cap(DOW_FULL[d])}</span>
        <select data-sched="${d}">
          <option value="">Отдых</option>
          ${progList().map(pr=>`<option value="${pr.id}" ${S.schedule[d]===pr.id?'selected':''}>${pr.emoji} ${pr.name}</option>`).join('')}
        </select></label>`).join('')}
  </div>

  <h2>Распознавание</h2>
  <div class="card">
    <label class="field"><span>Адрес прокси распознавания</span>
      <input id="pf-proxy" value="${esc(AI.endpoint)}" placeholder="http://localhost:4322" inputmode="url"></label>
    <div class="btn-row">
      <button class="btn btn-ghost btn-sm" style="flex:1" data-act="proxyCheck">Проверить</button>
      <button class="btn btn-dark btn-sm" style="flex:1" data-act="proxySave">Сохранить адрес</button>
    </div>
    <div id="proxy-status" class="tiny" style="margin-top:10px">
      Фото: ${AI.visionAvailable()?`подключено · ${esc(AI.visionDriver.label)}`:'адрес не задан'} ·
      штрихкод: ${esc(AI.barcodeDriver.label)}</div>
    <p class="tiny" style="margin:8px 0 0">Ключ GigaChat живёт на прокси, в приложение не попадает.
      Прокси на <code>localhost</code> виден только этому устройству — телефону нужен публичный https-адрес.</p>
  </div>

  <h2>Данные</h2>
  <div class="card">
    <button class="btn btn-ghost" data-act="exportData" style="margin-bottom:10px">Выгрузить JSON</button>
    <button class="btn btn-ghost" data-act="importPick" style="margin-bottom:10px">Загрузить из JSON</button>
    <input type="file" id="import-file" accept="application/json,.json" hidden>
    <button class="btn btn-ghost" data-act="resetData" style="color:var(--red)">Сбросить всё</button>
    <div style="border-top:1px solid var(--line);margin-top:14px;padding-top:12px">
      <div class="tiny">Данные привязаны к адресу</div>
      <div class="num" style="font-size:13px;font-weight:600;word-break:break-all">${esc(location.origin + location.pathname)}</div>
      <p class="tiny" style="margin:8px 0 0">По другому адресу приложение будет пустым — это не потеря,
        записи остаются на прежнем. Переносить через выгрузку и загрузку файла.
        Чистка данных сайта тоже стирает записи, поэтому выгрузку стоит делать регулярно.</p>
    </div>
  </div>

  <div class="sticky-cta"><button class="btn btn-primary" data-act="saveProfile">Сохранить</button></div>
  <div style="height:10px"></div>`;
}

ACTIONS.saveProfile = () => {
  const p = S.profile;
  p.name = $('#pf-name').value.trim() || p.name;
  p.age = clamp(+$('#pf-age').value||p.age,10,100);
  p.sex = $('#pf-sex').value;
  p.height = clamp(+$('#pf-height').value||p.height,100,230);
  p.weight = clamp(+$('#pf-weight').value||p.weight,30,250);
  p.goal = $('#pf-goal').value;
  p.autoTargets = $('#pf-auto').checked;
  p.restDefault = clamp(+$('#pf-rest').value||90,15,600);
  p.subtractWorkout = $('#pf-sub').checked;
  if(p.autoTargets) Object.assign(p, calcTargets(p));
  else {
    p.targetKcal = clamp(+$('#pf-kcal').value||p.targetKcal,800,6000);
    p.p = +$('#pf-p').value||p.p; p.f = +$('#pf-f').value||p.f; p.c = +$('#pf-c').value||p.c;
  }
  document.querySelectorAll('[data-sched]').forEach(s=>{ S.schedule[s.dataset.sched] = s.value||null; });
  save(); render(); toast('Сохранено');
};
ACTIONS.exportData = () => {
  const blob = new Blob([JSON.stringify(S,null,2)],{type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = `kalorika-${today()}.json`; a.click();
  toast('Файл выгружен');
};
ACTIONS.resetData = () => { if(confirm('Удалить все данные и начать заново?')) reset(); };
ACTIONS.importPick = () => $('#import-file')?.click();

ACTIONS.proxySave = () => {
  const v = ($('#pf-proxy').value || '').trim().replace(/\/$/,'');
  if(v && !/^https?:\/\//.test(v)) return toast('Адрес должен начинаться с http:// или https://');
  AI.endpoint = v;
  render(); toast(v ? 'Адрес сохранён' : 'Распознавание отключено');
};

ACTIONS.proxyCheck = async () => {
  const v = ($('#pf-proxy').value || '').trim().replace(/\/$/,'');
  const box = $('#proxy-status');
  if(!v) return toast('Введите адрес прокси');
  box.textContent = 'Проверяем…';
  try{
    const r = await fetch(v + '/health');
    const j = await r.json();
    box.innerHTML = j.ok
      ? `Прокси отвечает. Ключ ${j.hasKey?'на месте':'<b>не найден</b>'}, scope ${esc(j.scope||'—')}` +
        (j.tokenCached ? `, токен живёт ещё ${Math.round(j.tokenExpiresIn/60)} мин` : '')
      : 'Прокси ответил, но не готов';
  }catch(e){
    box.textContent = 'Не достучались. Прокси запущен? Адрес верный? '
      + (location.protocol === 'https:' && v.startsWith('http://')
         ? 'Страница по https не может ходить на http — нужен https-адрес прокси.' : '');
  }
};

function applyImport(text){
  let obj;
  try{ obj = JSON.parse(text); }
  catch(e){ return toast('Это не JSON — файл не читается'); }
  if(!looksLikeState(obj)) return toast('Файл не похож на выгрузку Калорийки');

  const days = Object.keys(obj.food || {}).length;
  const wk   = (obj.workouts || []).length;
  const name = (obj.profile && obj.profile.name) || 'без имени';
  const ok = confirm(
    `В файле: ${name}, дней питания ${days}, тренировок ${wk}.\n\n` +
    `Текущие данные будут заменены. Продолжить?`);
  if(!ok) return;

  S = mergeState(obj);
  S.session = null; S.draft = null; S.draftProg = null;   // черновики не переносим
  save(); go('#/today'); render();
  toast(`Загружено: ${days} дней питания, ${wk} тренировок`);
}

function bindProfile(){
  const file = $('#import-file');
  if(file) file.onchange = () => {
    const f = file.files[0]; if(!f) return;
    const rd = new FileReader();
    rd.onload = () => applyImport(rd.result);
    rd.onerror = () => toast('Файл не прочитался');
    rd.readAsText(f);
    file.value = '';
  };
  const auto = $('#pf-auto');
  if(auto) auto.onchange = () => {
    ['pf-kcal','pf-p','pf-f','pf-c'].forEach(id=>{ const e=$('#'+id); if(e) e.disabled = auto.checked; });
  };
}


/* ============================================================
   Экран: Мои программы
   ============================================================ */
function vPrograms(){
  return `
  <div class="sess-top" style="color:var(--ink)">
    <button class="iconbtn" style="border-color:var(--line);color:var(--ink)" data-act="back">‹</button>
    <div class="mid"><b>Программы</b><small class="muted">${progList().length} шт.</small></div>
    <div style="width:44px"></div>
  </div>

  ${progList().map(p=>{
    const used = Object.entries(S.schedule).filter(([,v])=>v===p.id).map(([d])=>DOW[d]);
    return `<div class="item clickable" data-go="#/pedit/${p.id}">
      <div class="thumb lime">${p.emoji}</div>
      <div class="body"><b>${esc(p.name)}</b>
        <small>${p.type==='cardio'?`кардио · ~${p.est} мин`:`${p.ex.length} упражнений · ~${p.est} мин`}${used.length?' · '+used.join(', '):''}</small></div>
      <div class="right"><span class="muted">›</span></div>
    </div>`;
  }).join('')}

  <button class="add-slot" data-go="#/pedit/new">+ Создать программу</button>
  <p class="tiny" style="margin-top:10px">Программы лежат в вашем устройстве и правятся как угодно.
    Изменения не трогают уже проведённые тренировки.</p>`;
}

/* ============================================================
   Экран: Редактор программы
   ============================================================ */
function vPedit(seg){
  const isNew = seg[1]==='new';
  if(!S.draftProg || S.draftProg.id !== (isNew?'__new__':seg[1])){
    const src = isNew
      ? {id:'__new__', name:'', emoji:'💪', type:'strength', est:45, rest:S.profile.restDefault, ex:[]}
      : JSON.parse(JSON.stringify(progById(seg[1])||{}));
    if(!src.id) return `<div class="empty">Программа не найдена</div>`;
    S.draftProg = src;
  }
  const d = S.draftProg;

  return `
  <div class="sess-top" style="color:var(--ink)">
    <button class="iconbtn" style="border-color:var(--line);color:var(--ink)" data-act="pedCancel">‹</button>
    <div class="mid"><b>${isNew?'Новая программа':'Правка программы'}</b>
      <small class="muted">${d.type==='cardio'?'кардио':'силовая'}</small></div>
    <div style="width:44px"></div>
  </div>

  <div class="card">
    <div style="display:flex;gap:10px">
      <label class="field" style="flex:0 0 76px"><span>Значок</span>
        <input id="pe-emoji" value="${esc(d.emoji)}" maxlength="2" style="text-align:center;font-size:22px"></label>
      <label class="field" style="flex:1"><span>Название</span>
        <input id="pe-name" value="${esc(d.name)}" placeholder="Например, «Грудь и трицепс»"></label>
    </div>
    <div class="grid2">
      <label class="field"><span>Тип</span>
        <select id="pe-type">
          <option value="strength" ${d.type==='strength'?'selected':''}>Силовая</option>
          <option value="cardio"   ${d.type==='cardio'?'selected':''}>Кардио</option>
        </select></label>
      <label class="field"><span>Длительность, мин</span>
        <input id="pe-est" type="number" value="${d.est}"></label>
    </div>
    ${d.type==='strength'
      ? `<label class="field" style="margin:0"><span>Отдых между подходами, сек</span>
           <input id="pe-rest" type="number" step="15" value="${d.rest}"></label>`
      : `<div class="grid2" style="margin:0">
           <label class="field" style="margin:0"><span>Цель, км</span>
             <input id="pe-km" type="number" step="0.5" value="${d.cardio?.targetKm||5}"></label>
           <label class="field" style="margin:0"><span>Цель, мин</span>
             <input id="pe-min" type="number" value="${d.cardio?.targetMin||30}"></label>
         </div>`}
  </div>

  ${d.type==='strength' ? `
  <div class="row-head"><h2>Упражнения</h2><span class="tiny">${d.ex.length}</span></div>
  ${d.ex.length ? d.ex.map((e,i)=>`
    <div class="card tight">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
        <input data-ex="${i}" data-k="name" value="${esc(e.name)}" placeholder="Название упражнения"
          style="flex:1;padding:10px 12px;font-size:15px;font-weight:600">
        <button class="minibtn" data-act="pedMove" data-i="${i}" data-d="-1">↑</button>
        <button class="minibtn" data-act="pedMove" data-i="${i}" data-d="1">↓</button>
        <button class="minibtn danger" data-act="pedDelEx" data-i="${i}">✕</button>
      </div>
      <div class="grid3">
        <label class="field" style="margin:0"><span>Подходы</span>
          <input data-ex="${i}" data-k="sets" type="number" value="${e.sets}" style="padding:10px"></label>
        <label class="field" style="margin:0"><span>Повторы</span>
          <input data-ex="${i}" data-k="reps" value="${esc(e.reps)}" style="padding:10px"></label>
        <label class="field" style="margin:0"><span>Вес, кг</span>
          <input data-ex="${i}" data-k="w" type="number" step="0.5" value="${e.w}" style="padding:10px"></label>
      </div>
    </div>`).join('') : `<div class="empty">Пока пусто</div>`}
  <button class="add-slot" data-act="pedAddEx">+ Добавить упражнение</button>` : ''}

  ${!isNew ? `<button class="btn btn-ghost" style="color:var(--red);margin-top:8px" data-act="pedDelete">Удалить программу</button>` : ''}

  <div class="sticky-cta">
    <button class="btn btn-primary" data-act="pedSave">Сохранить</button>
  </div>
  <div style="height:10px"></div>`;
}

ACTIONS.pedCancel = () => { S.draftProg = null; save(); go('#/programs'); };
ACTIONS.pedAddEx  = () => { S.draftProg.ex.push({name:'', sets:3, reps:'10', w:0}); save(); render(); };
ACTIONS.pedDelEx  = ds => { S.draftProg.ex.splice(+ds.i,1); save(); render(); };
ACTIONS.pedMove   = ds => {
  const i = +ds.i, j = i + (+ds.d), ex = S.draftProg.ex;
  if(j<0 || j>=ex.length) return;
  [ex[i], ex[j]] = [ex[j], ex[i]]; save(); render();
};
ACTIONS.pedDelete = () => {
  const d = S.draftProg;
  if(!confirm(`Удалить «${d.name}»? Проведённые тренировки останутся в истории.`)) return;
  S.programs = S.programs.filter(p=>p.id!==d.id);
  Object.keys(S.schedule).forEach(k=>{ if(S.schedule[k]===d.id) S.schedule[k]=null; });
  S.draftProg = null; save(); go('#/programs'); toast('Программа удалена');
};
ACTIONS.pedSave = () => {
  const d = S.draftProg;
  d.name = (d.name||'').trim();
  if(!d.name) return toast('Дайте программе название');
  if(d.type==='strength'){
    d.ex = d.ex.filter(e=>(e.name||'').trim());
    if(!d.ex.length) return toast('Добавьте хотя бы одно упражнение');
    delete d.cardio;
  } else {
    d.ex = [];
    d.cardio = Object.assign({kind:'run', met:MET.run}, d.cardio);
  }
  if(d.id==='__new__') d.id = 'u'+uid();
  const i = S.programs.findIndex(p=>p.id===d.id);
  if(i>=0) S.programs[i] = d; else S.programs.push(d);
  S.draftProg = null; save(); go('#/programs'); toast('Сохранено');
};

function bindPedit(){
  const d = S.draftProg; if(!d) return;
  const set = (id, key, num) => {
    const el = $('#'+id); if(!el) return;
    el.oninput = el.onchange = () => { d[key] = num ? (+el.value||0) : el.value; save(); };
  };
  set('pe-name','name'); set('pe-emoji','emoji'); set('pe-est','est',true); set('pe-rest','rest',true);
  const type = $('#pe-type');
  if(type) type.onchange = () => { d.type = type.value; save(); render(); };
  ['pe-km','pe-min'].forEach(id=>{
    const el = $('#'+id); if(!el) return;
    el.oninput = () => {
      d.cardio = d.cardio || {kind:'run', met:MET.run};
      d.cardio[id==='pe-km'?'targetKm':'targetMin'] = +el.value||0; save();
    };
  });
  document.querySelectorAll('[data-ex]').forEach(inp=>{
    inp.oninput = () => {
      const e = d.ex[+inp.dataset.ex], k = inp.dataset.k;
      e[k] = (k==='sets'||k==='w') ? (+inp.value||0) : inp.value;
      save();
    };
  });
}

/* ============================================================
   Экран: История упражнения
   ============================================================ */
function vExercise(seg){
  const name = decodeURIComponent(seg[1]||'');
  const rows = [];
  S.workouts.slice().sort((a,b)=>a.date<b.date?-1:1).forEach(w=>{
    (w.exercises||[]).forEach(e=>{
      if(e.name !== name) return;
      const done = e.sets.filter(x=>x.status!=='skipped');
      if(!done.length) return;
      rows.push({
        date:w.date,
        max:Math.max(...done.map(x=>x.w)),
        vol:done.reduce((a,x)=>a+x.w*x.r,0),
        sets:done.length,
        changed:e.sets.filter(x=>x.status==='changed').length,
      });
    });
  });

  if(!rows.length) return `
    <div class="sess-top" style="color:var(--ink)">
      <button class="iconbtn" style="border-color:var(--line);color:var(--ink)" data-act="back">‹</button>
      <div class="mid"><b>${esc(name)}</b></div><div style="width:44px"></div>
    </div>
    <div class="empty">Ещё ни одной записи по этому упражнению</div>`;

  const last = rows[rows.length-1];
  const best = rows.reduce((a,r)=>r.max>a.max?r:a, rows[0]);
  const maxV = Math.max(...rows.map(r=>r.max));
  const minV = Math.min(...rows.map(r=>r.max));
  const flat = maxV === minV;                     // вес не менялся — рисуем ровный ряд
  const span = Math.max(1, maxV-minV);

  return `
  <div class="sess-top" style="color:var(--ink)">
    <button class="iconbtn" style="border-color:var(--line);color:var(--ink)" data-act="back">‹</button>
    <div class="mid"><b>${esc(name)}</b><small class="muted">${rows.length} ${plural(rows.length,'тренировка','тренировки','тренировок')}</small></div>
    <div style="width:44px"></div>
  </div>

  <div class="statgrid">
    <div class="stat dark"><div class="big num">${best.max}</div><div class="cap">рекорд, кг · ${shortDate(best.date)}</div></div>
    <div class="stat"><div class="big num">${last.max}</div><div class="cap">последний раз, кг</div></div>
  </div>

  <div class="card" style="margin-top:12px">
    <h3 style="margin-bottom:10px">Рабочий вес</h3>
    <div class="chartbars on-light">
      ${rows.slice(-14).map(r=>`<div class="b" style="height:${flat?60:((r.max-minV)/span)*70+25}%;background:${!flat&&r.max>=maxV?'var(--accent)':'var(--dark)'}"></div>`).join('')}
    </div>
    <div class="chartlabels">
      ${rows.slice(-14).map((r,i,a)=>`<span>${i===0||i===a.length-1?parseISO(r.date).getDate():''}</span>`).join('')}
    </div>
  </div>

  <div class="row-head"><h2>По тренировкам</h2></div>
  <div class="card">
    ${rows.slice().reverse().map(r=>`
      <div class="exlist-row">
        <div class="b"><b>${shortDate(r.date)}</b>
          <small>${r.sets} ${plural(r.sets,'подход','подхода','подходов')} · ${r.vol} кг тоннаж${r.changed?` · ${r.changed} с изменениями`:''}</small></div>
        <div class="w num">${r.max} кг</div>
      </div>`).join('')}
  </div>
  <div style="height:20px"></div>`;
}

/* ============================================================
   Старт
   ============================================================ */
const POST = {onboarding:bindOnboarding, add:bindAdd, portion:bindPortion,
              session:bindSession, profile:bindProfile, pedit:bindPedit};

function clock(){
  const d = new Date();
  const el = $('#clock'); if(el) el.textContent = `${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`;
}
setInterval(clock, 10000); clock();

/* Регистрация service worker — офлайн и установка на домашний экран */
if('serviceWorker' in navigator && location.protocol !== 'file:'){
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(()=>{}));
}

/* Инициализация состояния — после объявления всех хелперов */
S = load(); save();

/* Возврат к активной сессии после перезагрузки */
if(S.session && !location.hash) location.hash = '#/session';
render();
