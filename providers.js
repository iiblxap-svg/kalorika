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

/* Список продуктов для промпта — чтобы модель выбирала из наших id */
function foodCatalogForPrompt(){
  return FOODS.map(f=>`${f.id} — ${f.name}`).join('\n');
}

/* Общий промпт. Один на всех провайдеров — иначе сравнение бессмысленно. */
function recognitionPrompt(){
  return `Ты определяешь состав блюда по фотографии для дневника питания.

Верни ТОЛЬКО JSON, без markdown-обёртки и без пояснений:
{"dish":"название блюда","emoji":"один эмодзи","confidence":0.0-1.0,
 "items":[{"id":"<id из списка>","grams":<число>}]}

Если продукта нет в списке ниже, вместо "id" передай:
{"name":"название","grams":<число>,"per100":{"kcal":N,"p":N,"f":N,"c":N}}

Правила:
- Оценивай вес каждого компонента в граммах по виду порции на фото.
- Не считай калории — их посчитает приложение.
- Названия блюда и продуктов — на русском.
- Если на фото не еда, верни {"dish":null,"items":[]}.

Доступные id продуктов:
${foodCatalogForPrompt()}`;
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

  const ing = d.items.map(it=>{
    const g = Math.round(+it.grams || 0);
    if(g <= 0) return null;
    if(it.id && FOOD_BY_ID[it.id]) return {id:it.id, g};
    if(it.name && it.per100){
      const p = it.per100;
      return {g, custom:{
        name:String(it.name).slice(0,60),
        kcal:+p.kcal||0, p:+p.p||0, f:+p.f||0, c:+p.c||0
      }};
    }
    return null;
  }).filter(Boolean);

  if(!ing.length) throw new ProviderError('Ингредиенты не распознались');

  return {
    name: String(d.dish).slice(0,80),
    emoji: d.emoji || '🍽',
    confidence: typeof d.confidence==='number' ? d.confidence : null,
    ing, photo:null,
  };
}

/* ---------- Драйверы распознавания ---------- */
const FOOD_VISION_DRIVERS = {
  /* Заглушка по умолчанию: честно говорит, что не подключено. */
  none: {
    label:'не подключено',
    available:false,
    async recognize(){ throw new ProviderNotConfigured('Распознавание по фото'); }
  },

  /* Шаблон для реального драйвера. Прокси прячет ключ, клиент его не видит.
     Раскомментировать и указать URL, когда прокси будет поднят.

  proxy: {
    label:'через прокси',
    available:true,
    async recognize(file){
      const body = new FormData();
      body.append('image', file);
      body.append('prompt', recognitionPrompt());
      const res = await fetch(AI.endpoint, {method:'POST', body});
      if(!res.ok) throw new ProviderError(`Прокси ответил ${res.status}`);
      return parseRecognition(await res.text());
    }
  },
  */
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
const AI = {
  vision:'none',        // ключ из FOOD_VISION_DRIVERS
  barcode:'openfoodfacts', // ключ из BARCODE_DRIVERS
  endpoint:null,        // URL прокси, когда появится

  get visionDriver(){  return FOOD_VISION_DRIVERS[this.vision]  || FOOD_VISION_DRIVERS.none; },
  get barcodeDriver(){ return BARCODE_DRIVERS[this.barcode]     || BARCODE_DRIVERS.mock; },

  visionAvailable(){  return !!this.visionDriver.available; },
  barcodeAvailable(){ return !!this.barcodeDriver.available; },

  recognizeFood(file){ return this.visionDriver.recognize(file); },
  lookupBarcode(code){ return this.barcodeDriver.lookup(code); },
};
