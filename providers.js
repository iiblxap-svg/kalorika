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
function recognitionPrompt(){
  return `Определи блюдо на фотографии и его состав для дневника питания.

Верни ТОЛЬКО JSON, без markdown-обёртки и без пояснений:
{"dish":"название блюда","emoji":"один эмодзи","confidence":0.0-1.0,
 "items":[{"name":"продукт","grams":<число>,"per100":{"kcal":N,"p":N,"f":N,"c":N}}]}

Правила:
- Разбей блюдо на отдельные продукты. Вес каждого оцени в граммах по виду порции на фото.
- per100 — калорийность и БЖУ на 100 г этого продукта в готовом виде.
- Названия продуктов простые и русские: «Куриная грудка», «Рис отварной», «Соус томатный».
- Не считай итог по блюду — приложение посчитает само.
- Если на фото не еда, верни {"dish":null,"items":[]}.`;
}

/* Разбор и валидация ответа драйвера → черновик для экрана правки порции */
function parseRecognition(raw){
  let d = raw;
  if(typeof d === 'string'){
    const m = d.match(/\{[\s\S]*\}/);          // вырезаем JSON из возможной обёртки
    if(!m) throw new ProviderError('Ответ не содержит JSON');
    try{ d = JSON.parse(m[0]); }
    catch(e){ throw new ProviderError('JSON не разобрался: '+e.message); }
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

/* Уменьшаем картинку перед отправкой: меньше трафика и меньше токенов.
   1024 px по длинной стороне модели достаточно, а стоит заметно дешевле оригинала. */
function downscaleImage(file, maxSide = 1024, quality = 0.85){
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

/* ---------- Драйверы распознавания ---------- */
const FOOD_VISION_DRIVERS = {
  /* Заглушка по умолчанию: честно говорит, что не подключено. */
  none: {
    label:'не подключено',
    available:false,
    async recognize(){ throw new ProviderNotConfigured('Распознавание по фото'); }
  },

  /* GigaChat через собственный прокси. Ключ и обновление токена — на стороне прокси,
     браузер о них не знает. Адрес прокси настраивается в профиле. */
  gigachat: {
    label:'GigaChat',
    available:true,
    async recognize(file){
      if(!AI.endpoint) throw new ProviderNotConfigured('Распознавание по фото');
      const img = await downscaleImage(file);

      let res;
      try{
        res = await fetch(AI.endpoint.replace(/\/$/,'') + '/recognize', {
          method:'POST',
          headers:{'Content-Type':'application/json'},
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
const PROXY_KEY = 'kalorika.proxy';

const AI = {
  vision:'gigachat',       // ключ из FOOD_VISION_DRIVERS
  barcode:'openfoodfacts', // ключ из BARCODE_DRIVERS

  /* Адрес прокси хранится отдельно от дневника: он про устройство, а не про данные */
  get endpoint(){ try{ return localStorage.getItem(PROXY_KEY) || ''; }catch(e){ return ''; } },
  set endpoint(v){ try{ v ? localStorage.setItem(PROXY_KEY, v) : localStorage.removeItem(PROXY_KEY); }catch(e){} },

  get visionDriver(){  return FOOD_VISION_DRIVERS[this.vision]  || FOOD_VISION_DRIVERS.none; },
  get barcodeDriver(){ return BARCODE_DRIVERS[this.barcode]     || BARCODE_DRIVERS.mock; },

  /* Драйвер есть — мало. Без адреса прокси он всё равно не работает. */
  visionAvailable(){  return !!this.visionDriver.available && !!this.endpoint; },
  barcodeAvailable(){ return !!this.barcodeDriver.available; },

  recognizeFood(file){ return this.visionDriver.recognize(file); },
  lookupBarcode(code){ return this.barcodeDriver.lookup(code); },
};
