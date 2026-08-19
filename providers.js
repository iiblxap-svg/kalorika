/* ============================================================
   Провайдеры внешних данных.
   Каркас: единый контракт + сменные драйверы.
   Экраны приложения не знают, кто именно отвечает.
   ============================================================ */

/* ---------- Ошибки ---------- */
class ProviderNotConfigured extends Error {
  constructor(what){ super(`${what}: провайдер не подключён`); this.name='ProviderNotConfigured'; }
}
class ProviderError extends Error {
  constructor(msg){ super(msg); this.name='ProviderError'; }
}

/* ============================================================
   КОНТРАКТ РАСПОЗНАВАНИЯ ЕДЫ

   Драйвер обязан вернуть объект такой формы:

   {
     dish:  "Паста болоньезе",         // название блюда
     emoji: "🍝",                       // необязательно
     confidence: 0.82,                  // необязательно, 0..1
     items: [
       { id: "spaghetti", grams: 180 },                  // продукт из нашей базы
       { name: "Соус песто", grams: 30,                  // либо свой продукт
         per100: { kcal: 450, p: 4, f: 45, c: 6 } }
     ]
   }

   Калории драйвер НЕ возвращает — приложение считает их само.
   Модель ошибается в арифметике, а база нет.
   ============================================================ */

/* Промпт намеренно без каталога продуктов: 383 позиции — это лишние 3,5 тысячи
   токенов в каждом запросе. Модель называет продукты словами, а сопоставляем
   мы сами через findFoodByName() — там же, где живёт поиск по базе. */
/* ОСТОРОЖНО: промпт крайне чувствителен к формулировкам.
   Замеряно на фото бледной гречки под соусом, по 5 прогонов на модель:
     - этот текст ............................ гречка 5/5 на Max и Ultra
     - он же плюс фраза «похоже на плов» ..... гречка 0/5: слово подсказывает рис
     - «какая крупа? гречка, рис, перловка?» . гречка 0/5: список сам даёт ответ
     - короткий «шаг 1 одним словом» ......... гречка 0/5, выдаёт лапшу
   Не переписывать без прогона .claude/test-vision.js. Не называть в промпте
   ни блюд, ни круп — любое упоминание модель принимает за подсказку. */
function recognitionPrompt(){
  return `Посмотри на фотографию еды.

Шаг 1. Ответь на вопрос: какая именно крупа, макароны или основа на фото? Назови её точно.
Шаг 2. Перечисли, что ещё видно на тарелке. Только видимое, ничего не додумывай.
Шаг 3. Последней строкой выдай JSON без markdown:
{"dish":"название","emoji":"эмодзи","confidence":0.0-1.0,
 "items":[{"name":"продукт","grams":<число>,"per100":{"kcal":N,"p":N,"f":N,"c":N}}]}

Вес компонентов оцени в граммах по виду порции. per100 — на 100 г готового продукта.
Названия простые и русские, обязательно в готовом виде: отварная, жареные, запечённое,
тушёный. Сухую крупу и сырое мясо не указывай — на фото приготовленная еда.
Итог не считай.
confidence — насколько уверен в определении блюда.
Если на фото не еда, верни {"dish":null,"items":[]}.`;
}

/* Вытаскиваем JSON из ответа: перед ним рассуждения, вокруг бывает ```json,
   а после — пояснения. Считаем скобки, чтобы не поймать лишнего. */
function extractJson(text){
  const t = String(text).replace(/```json/gi, '```');
  const from = t.lastIndexOf('{"dish"') >= 0 ? t.lastIndexOf('{"dish"') : t.indexOf('{');
  if(from < 0) return null;

  const stack = [];
  let inStr = false, esc = false;
  for(let i = from; i < t.length; i++){
    const ch = t[i];
    if(esc){ esc = false; continue; }
    if(ch === '\\'){ esc = true; continue; }
    if(ch === '"'){ inStr = !inStr; continue; }
    if(inStr) continue;

    if(ch === '{' || ch === '[') stack.push(ch === '{' ? '}' : ']');
    else if(ch === '}' || ch === ']'){
      stack.pop();
      if(!stack.length) return t.slice(from, i + 1);
    }
  }

  /* Ответ оборвался: дозакрываем всё, что осталось открытым */
  if(stack.length){
    let tail = t.slice(from);
    if(inStr) tail += '"';
    tail = tail.replace(/,\s*$/, '').replace(/:\s*$/, ':0');
    while(stack.length) tail += stack.pop();
    return tail;
  }
  return null;
}

/* Разбор и валидация ответа драйвера → черновик для экрана правки порции */
function parseRecognition(raw){
  let d = raw;
  if(typeof d === 'string'){
    const json = extractJson(d);
    if(!json) throw new ProviderError('Ответ не содержит JSON');
    try{ d = JSON.parse(json); }
    catch(e){
      console.warn('Не разобрали ответ модели:', d);
      throw new ProviderError('Модель ответила неразборчиво');
    }
  }
  if(!d || typeof d !== 'object') throw new ProviderError('Пустой ответ');
  if(!d.dish || !Array.isArray(d.items) || !d.items.length)
    throw new ProviderError('На фото не распознана еда');

  let matched = 0;
  const ing = d.items.map(it=>{
    const g = Math.round(+it.grams || 0);
    if(g <= 0) return null;

    /* Драйвер может прислать готовый id — уважаем */
    if(it.id && FOOD_BY_ID[it.id]){ matched++; return {id:it.id, g}; }

    /* Сначала ищем в своей базе: её числа выверены и не меняются от запроса к запросу */
    const hit = findFoodByName(it.name);
    if(hit){ matched++; return {id:hit.id, g}; }

    /* Не нашли — берём оценку модели, помечая происхождение */
    const p = it.per100;
    if(it.name && p && (+p.kcal > 0)){
      return {g, custom:{
        name:String(it.name).slice(0,60),
        kcal:+p.kcal||0, p:+p.p||0, f:+p.f||0, c:+p.c||0,
        fromModel:true,
      }};
    }
    return null;
  }).filter(Boolean);

  if(!ing.length) throw new ProviderError('Ингредиенты не распознались');

  return {
    name: String(d.dish).slice(0,80),
    emoji: d.emoji || '🍽',
    confidence: typeof d.confidence==='number' ? d.confidence : null,
    matched, total: ing.length,
    ing, photo:null,
  };
}

/* Уменьшаем картинку перед отправкой, но умеренно: отличить гречку от риса
   можно только по форме зерна, а её убивает агрессивное сжатие. */
function downscaleImage(file, maxSide = 1536, quality = 0.92){
  return new Promise((resolve, reject) => {
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => {
      const k = Math.min(1, maxSide / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width  = Math.round(img.width  * k);
      c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve({
        base64: c.toDataURL('image/jpeg', quality).split(',')[1],
        mime:'image/jpeg', w:c.width, h:c.height,
      });
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new ProviderError('Не удалось прочитать изображение')); };
    img.src = url;
  });
}

/* Файл как есть, без пересжатия — запасной путь для форматов,
   которые браузер не умеет декодировать (HEIC в Chrome) */
function fileToBase64(file){
  return new Promise((resolve, reject) => {
    const rd = new FileReader();
    rd.onload  = () => resolve(String(rd.result).split(',')[1]);
    rd.onerror = () => reject(new ProviderError('Файл не прочитался'));
    rd.readAsDataURL(file);
  });
}

/* Что это за файл, если браузер не смог его открыть */
function guessMime(file){
  if(file.type) return file.type.toLowerCase();
  const ext = (file.name || '').toLowerCase().split('.').pop();
  return ({heic:'image/heic', heif:'image/heif', jpg:'image/jpeg', jpeg:'image/jpeg',
           png:'image/png', webp:'image/webp'})[ext] || 'application/octet-stream';
}

/* ---------- Драйверы распознавания ---------- */
const FOOD_VISION_DRIVERS = {
  /* Заглушка по умолчанию: честно говорит, что не подключено. */
  none: {
    label:'не подключено',
    available:false,
    async recognize(){ throw new ProviderNotConfigured('Распознавание по фото'); }
  },

  /* Прямой доступ из браузера по временному access token.
     Нужен только для проверки: токен живёт 30 минут, ключ никуда не уходит.
     Работает, если устройство доверяет корню Минцифры — иначе TLS не пройдёт. */
  'gigachat-direct': {
    label:'GigaChat напрямую',
    available:true,
    async recognize(file){
      const tok = AI.directToken;
      if(!tok) throw new ProviderNotConfigured('Распознавание по фото');
      const API = 'https://api.giga.chat';
      const auth = {'Authorization':'Bearer ' + tok};

      const img = await downscaleImage(file);
      const bin = Uint8Array.from(atob(img.base64), c => c.charCodeAt(0));

      let fileId;
      try{
        const fd = new FormData();
        fd.append('purpose', 'general');
        fd.append('file', new Blob([bin], {type:'image/jpeg'}), 'dish.jpg');
        const up = await fetch(API + '/v1/files', {method:'POST', headers:auth, body:fd});
        if(up.status === 401) throw new ProviderError('Токен протух — получите новый');
        if(!up.ok) throw new ProviderError(`Загрузка фото: ${up.status}`);
        fileId = (await up.json()).id;
      }catch(e){
        if(e instanceof ProviderError) throw e;
        throw new ProviderError('Не достучались до GigaChat. Устройство доверяет сертификату Минцифры?');
      }

      const t0 = Date.now();
      const r = await fetch(API + '/v1/chat/completions', {
        method:'POST',
        headers: Object.assign({'Content-Type':'application/json'}, auth),
        body: JSON.stringify({
          model: AI.model, temperature: 0.1,
          messages:[{role:'user', content: recognitionPrompt(), attachments:[fileId]}],
        }),
      });
      if(r.status === 401) throw new ProviderError('Токен протух — получите новый');
      if(!r.ok) throw new ProviderError(`Модель ответила ${r.status}`);
      const j = await r.json();

      const draft = parseRecognition(j.choices?.[0]?.message?.content || '');
      draft.meta = {model:j.model, ms:Date.now()-t0, tokens:j.usage?.total_tokens};
      return draft;
    }
  },

  /* GigaChat через собственный прокси. Ключ и обновление токена — на стороне прокси,
     браузер о них не знает. Адрес прокси настраивается в профиле. */
  gigachat: {
    label:'GigaChat',
    available:true,
    /* Модель изредка отдаёт битый JSON. Разбор строгий, поэтому один
       автоматический повтор — дешевле, чем ошибка в лицо пользователю. */
    async recognize(file){
      try{ return await this.once(file); }
      catch(e){
        if(e.name !== 'ProviderError' || !/неразборчиво|не содержит JSON/.test(e.message)) throw e;
        console.warn('Повтор запроса после неразборчивого ответа');
        return await this.once(file);
      }
    },
    async once(file){
      if(!AI.endpoint) throw new ProviderNotConfigured('Распознавание по фото');

      /* Обычный путь: ужимаем в браузере. Не вышло — Safari умеет HEIC, Chrome нет —
         отправляем оригинал, прокси сконвертирует. */
      let img;
      try{
        img = await downscaleImage(file);
      }catch(e){
        if(file.size > 12 * 1024 * 1024)
          throw new ProviderError('Файл больше 12 МБ, а сжать его браузер не смог');
        img = {base64: await fileToBase64(file), mime: guessMime(file)};
      }

      let res;
      try{
        const headers = {'Content-Type':'application/json'};
        if(AI.token) headers['X-Proxy-Token'] = AI.token;
        res = await fetch(AI.endpoint.replace(/\/$/,'') + '/recognize', {
          method:'POST',
          headers,
          body: JSON.stringify({prompt: recognitionPrompt(), image: img.base64, mime: img.mime}),
        });
      }catch(e){ throw new ProviderError('Прокси недоступен — проверьте адрес в профиле'); }

      if(!res.ok){
        let msg = `Прокси ответил ${res.status}`;
        try{ const j = await res.json(); if(j.error) msg = j.error; }catch(e){}
        throw new ProviderError(msg);
      }
      const j = await res.json();
      const draft = parseRecognition(j.text);
      draft.meta = {model:j.model, ms:j.ms, tokens:j.usage && j.usage.total_tokens};
      return draft;
    }
  },
};

/* ---------- Драйверы штрихкода ---------- */
const BARCODE_DRIVERS = {
  /* Open Food Facts — открытая база, без ключа и без лимитов.
     Российские товары в ней есть, но покрытие неровное. */
  openfoodfacts: {
    label:'Open Food Facts',
    available:true,
    async lookup(code){
      const fields = 'product_name,product_name_ru,generic_name,brands,nutriments,serving_quantity';
      let j;
      try{
        const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=${fields}`);
        j = await res.json();
      }catch(e){ throw new ProviderError('Нет сети — введите продукт вручную'); }

      if(j.status !== 1 || !j.product) throw new ProviderError('Такого кода нет в базе Open Food Facts');

      const pr = j.product, n = pr.nutriments || {};
      const name = pr.product_name_ru || pr.product_name || pr.generic_name || 'Продукт';
      const brand = (pr.brands||'').split(',')[0].trim();

      /* Часть товаров отдаёт только килоджоули */
      let kcal = +n['energy-kcal_100g'];
      if(!kcal && n['energy_100g']) kcal = +n['energy_100g'] / 4.184;
      if(!kcal) throw new ProviderError(`«${name}» найден, но без калорийности`);

      const g = Math.round(+pr.serving_quantity) || 100;

      return {
        name: brand ? `${name} (${brand})` : name,
        emoji:'📦', photo:null,
        ing:[{ g, custom:{
          name,
          kcal: round1(kcal),
          p: round1(+n.proteins_100g || 0),
          f: round1(+n.fat_100g || 0),
          c: round1(+n.carbohydrates_100g || 0),
        }}]
      };
    }
  },

  /* Локальная заглушка — работает офлайн, нужна для демо и тестов */
  mock: {
    label:'демо-база',
    available:true,
    async lookup(code){
      const sum = code.split('').reduce((a,ch)=>a + (+ch||0), 0);
      const f = FOODS[sum % FOODS.length];
      return {name:f.name, emoji:'📦', ing:[{id:f.id, g:100}], photo:null};
    }
  },
};

const round1 = v => Math.round(v*10)/10;

/* Сканирование камерой. BarcodeDetector есть в Chrome/Android,
   в Safari на iOS его нет — там остаётся ручной ввод кода. */
const SCANNER = {
  supported: typeof window !== 'undefined' && 'BarcodeDetector' in window,
  stream:null, timer:null,

  async start(video, onFound){
    if(!this.supported) throw new ProviderError('Камера-сканер не поддерживается этим браузером');
    const det = new BarcodeDetector({formats:['ean_13','ean_8','upc_a','upc_e','code_128']});
    this.stream = await navigator.mediaDevices.getUserMedia({
      video:{facingMode:'environment'}, audio:false
    });
    video.srcObject = this.stream;
    await video.play();

    this.timer = setInterval(async () => {
      try{
        const codes = await det.detect(video);
        if(codes.length){ const v = codes[0].rawValue; this.stop(); onFound(v); }
      }catch(e){ /* кадр не разобрался — ждём следующий */ }
    }, 250);
  },

  stop(){
    if(this.timer) clearInterval(this.timer); this.timer = null;
    if(this.stream){ this.stream.getTracks().forEach(t=>t.stop()); this.stream = null; }
  }
};

/* ---------- Фасад, которым пользуются экраны ---------- */
const PROXY_KEY       = 'kalorika.proxy';
const PROXY_TOKEN_KEY = 'kalorika.proxyToken';
const VISION_KEY      = 'kalorika.vision';
const GIGA_TOKEN_KEY  = 'kalorika.gigaToken';
const MODEL_KEY       = 'kalorika.model';

/* Приложение открыто с локального дев-сервера? Тогда прокси рядом, на /giga */
function isLocalDev(){
  return typeof location !== 'undefined'
    && ['localhost','127.0.0.1'].includes(location.hostname);
}

const ls = {
  get(k, def=''){ try{ return localStorage.getItem(k) || def; }catch(e){ return def; } },
  set(k, v){ try{ v ? localStorage.setItem(k, v) : localStorage.removeItem(k); }catch(e){} },
};

const AI = {
  barcode:'openfoodfacts', // ключ из BARCODE_DRIVERS

  /* Способ распознавания выбирается на устройстве: на Маке удобнее прокси,
     на телефоне для быстрой проверки — прямой токен.
     На localhost прокси проброшен дев-сервером — настраивать нечего. */
  get vision(){ return ls.get(VISION_KEY, isLocalDev() ? 'gigachat' : 'none'); },
  set vision(v){ ls.set(VISION_KEY, v); },

  get model(){ return ls.get(MODEL_KEY, 'GigaChat-3-Ultra'); },
  set model(v){ ls.set(MODEL_KEY, v); },

  get directToken(){ return ls.get(GIGA_TOKEN_KEY); },
  set directToken(v){ ls.set(GIGA_TOKEN_KEY, v && v.trim()); },

  /* Адрес прокси хранится отдельно от дневника: он про устройство, а не про данные */
  get endpoint(){
    const saved = ls.get(PROXY_KEY);
    if(saved) return saved;
    return isLocalDev() ? location.origin + '/giga' : '';
  },
  set endpoint(v){ try{ v ? localStorage.setItem(PROXY_KEY, v) : localStorage.removeItem(PROXY_KEY); }catch(e){} },

  /* Общий секрет прокси. Не даёт посторонним тратить ваши токены. */
  get token(){ try{ return localStorage.getItem(PROXY_TOKEN_KEY) || ''; }catch(e){ return ''; } },
  set token(v){ try{ v ? localStorage.setItem(PROXY_TOKEN_KEY, v) : localStorage.removeItem(PROXY_TOKEN_KEY); }catch(e){} },

  get visionDriver(){  return FOOD_VISION_DRIVERS[this.vision]  || FOOD_VISION_DRIVERS.none; },
  get barcodeDriver(){ return BARCODE_DRIVERS[this.barcode]     || BARCODE_DRIVERS.mock; },

  /* Драйвер есть — мало: прокси нужен адрес, прямому режиму — токен */
  visionAvailable(){
    if(!this.visionDriver.available) return false;
    if(this.vision === 'gigachat')        return !!this.endpoint;
    if(this.vision === 'gigachat-direct') return !!this.directToken;
    return false;
  },
  barcodeAvailable(){ return !!this.barcodeDriver.available; },

  recognizeFood(file){ return this.visionDriver.recognize(file); },
  lookupBarcode(code){ return this.barcodeDriver.lookup(code); },
};
