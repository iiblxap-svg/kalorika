/* ============================================================
   Локальный прокси к GigaChat.

   Зачем он вообще:
   - ключ авторизации не должен попадать в браузер;
   - access token живёт 30 минут, его надо обновлять;
   - эндпоинты Сбера подписаны корнем Минцифры, которого нет
     в обычных хранилищах доверия — подкладываем его явно.

   Ключ берётся из переменной GIGACHAT_KEY или из ~/.gigachat_key.
   В код и в репозиторий он не попадает.
   ============================================================ */

const http  = require('http');
const https = require('https');
const fs    = require('fs');
const path  = require('path');
const os    = require('os');
const crypto = require('crypto');

const PORT      = process.env.PORT || 4322;
const SCOPE     = process.env.GIGACHAT_SCOPE || 'GIGACHAT_API_PERS';
const OAUTH_URL = 'https://ngw.devices.sberbank.ru:9443/api/v2/oauth';
const API_HOST  = 'api.giga.chat';

/* Общий секрет. Пока прокси на localhost — не обязателен.
   Как только он смотрит наружу через туннель, без него любой желающий
   потратит ваши токены. Задаётся через PROXY_TOKEN или ~/.gigachat_proxy_token. */
function readProxyToken(){
  if(process.env.PROXY_TOKEN) return process.env.PROXY_TOKEN.trim();
  const f = path.join(os.homedir(), '.gigachat_proxy_token');
  if(fs.existsSync(f)) return fs.readFileSync(f, 'utf8').trim();
  return '';
}
const PROXY_TOKEN = readProxyToken();

/* Разрешённые источники запросов */
const ALLOWED_ORIGINS = [
  'http://localhost:4321',
  'http://127.0.0.1:4321',
  'https://iiblxap-svg.github.io',
];

/* ---------- Ключ ---------- */
function readKey(){
  if(process.env.GIGACHAT_KEY) return process.env.GIGACHAT_KEY.trim();
  const f = path.join(os.homedir(), '.gigachat_key');
  if(fs.existsSync(f)) return fs.readFileSync(f, 'utf8').trim();
  throw new Error('Ключ не найден: положите его в ~/.gigachat_key или в GIGACHAT_KEY');
}

/* ---------- Доверие только к корню Минцифры для этих хостов ---------- */
const CA = fs.readFileSync(path.join(__dirname, 'russian_trusted_root_ca.cer'));
const agent = new https.Agent({ ca: CA, keepAlive: true });

function request(url, opts = {}, body = null){
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request({
      hostname: u.hostname,
      port: u.port || 443,
      path: u.pathname + u.search,
      method: opts.method || 'GET',
      headers: opts.headers || {},
      agent,
    }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({
        status: res.statusCode,
        headers: res.headers,
        body: Buffer.concat(chunks),
      }));
    });
    req.on('error', reject);
    req.setTimeout(60000, () => req.destroy(new Error('таймаут запроса к GigaChat')));
    if(body) req.write(body);
    req.end();
  });
}

/* ---------- Access token с кэшем ---------- */
let tokenCache = { value: null, expiresAt: 0 };

async function getToken(){
  /* обновляем заранее, чтобы не словить протухание в середине запроса */
  if(tokenCache.value && Date.now() < tokenCache.expiresAt - 60_000) return tokenCache.value;

  const res = await request(OAUTH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
      'RqUID': crypto.randomUUID(),
      'Authorization': 'Basic ' + readKey(),
    },
  }, 'scope=' + encodeURIComponent(SCOPE));

  if(res.status !== 200){
    throw new Error(`OAuth вернул ${res.status}: ${res.body.toString().slice(0, 300)}`);
  }
  const j = JSON.parse(res.body.toString());
  tokenCache = { value: j.access_token, expiresAt: j.expires_at || (Date.now() + 30*60_000) };
  return tokenCache.value;
}

/* ---------- Вызов API с авторизацией ---------- */
async function api(method, pathname, headers = {}, body = null){
  const token = await getToken();
  return request(`https://${API_HOST}${pathname}`, {
    method,
    headers: Object.assign({
      'Authorization': 'Bearer ' + token,
      'Accept': 'application/json',
    }, headers),
  }, body);
}

/* ---------- Загрузка файла: multipart собираем руками ---------- */
async function uploadImage(buf, mime){
  const B = '----giga' + crypto.randomBytes(12).toString('hex');
  const ext = (mime.split('/')[1] || 'jpg').replace('jpeg','jpg');
  const body = Buffer.concat([
    Buffer.from(`--${B}\r\nContent-Disposition: form-data; name="purpose"\r\n\r\ngeneral\r\n`),
    Buffer.from(`--${B}\r\nContent-Disposition: form-data; name="file"; filename="dish.${ext}"\r\n` +
                `Content-Type: ${mime}\r\n\r\n`),
    buf,
    Buffer.from(`\r\n--${B}--\r\n`),
  ]);
  const r = await api('POST', '/v1/files', {
    'Content-Type': `multipart/form-data; boundary=${B}`,
    'Content-Length': body.length,
  }, body);
  if(r.status !== 200) throw new Error(`Загрузка файла: ${r.status} ${r.body.toString().slice(0,200)}`);
  return JSON.parse(r.body.toString()).id;
}

/* ---------- HEIC ----------
   Модель принимает такой файл и молча выдумывает ответ вместо ошибки,
   поэтому конвертируем сами и никогда не отдаём HEIC дальше. */
const { execFileSync } = require('child_process');

function heicToJpeg(buf){
  const tmp = path.join(os.tmpdir(), `kal-${crypto.randomBytes(6).toString('hex')}`);
  const src = tmp + '.heic', dst = tmp + '.jpg';
  fs.writeFileSync(src, buf);
  const tools = [
    ['sips', ['-s','format','jpeg', src, '--out', dst]],          // macOS
    ['heif-convert', [src, dst]],                                  // libheif-examples
    ['magick', [src, dst]],                                        // ImageMagick 7
    ['convert', [src, dst]],                                       // ImageMagick 6
  ];
  try{
    for(const [bin, args] of tools){
      try{
        execFileSync(bin, args, {stdio:'ignore'});
        if(fs.existsSync(dst)) return fs.readFileSync(dst);
      }catch(e){ /* нет такого инструмента — пробуем следующий */ }
    }
    throw new Error('Не могу открыть HEIC: на сервере нет sips, heif-convert или ImageMagick');
  } finally {
    try{ fs.unlinkSync(src); }catch(e){}
    try{ fs.unlinkSync(dst); }catch(e){}
  }
}

/* ---------- Распознавание блюда ---------- */
const DEFAULT_MODEL = process.env.GIGACHAT_MODEL || 'GigaChat-2-Max';

async function recognize({prompt, image, mime, model}){
  if(!prompt || !image) throw new Error('нужны поля prompt и image');
  let buf = Buffer.from(image, 'base64');
  if(buf.length > 12 * 1024 * 1024) throw new Error('картинка больше 12 МБ');

  let type = (mime || 'image/jpeg').toLowerCase();
  if(type === 'image/heic' || type === 'image/heif'){
    buf = heicToJpeg(buf);
    type = 'image/jpeg';
  }
  if(!['image/jpeg','image/png','image/webp'].includes(type)){
    throw new Error(`Формат ${type} не поддерживается — нужен JPEG, PNG, WEBP или HEIC`);
  }

  const fileId = await uploadImage(buf, type);

  const r = await api('POST', '/v1/chat/completions', {'Content-Type':'application/json'},
    JSON.stringify({
      model: model || DEFAULT_MODEL,
      temperature: 0.1,        /* распознавание, а не сочинение */
      messages: [{ role:'user', content: prompt, attachments:[fileId] }],
    }));

  if(r.status !== 200) throw new Error(`Модель ответила ${r.status}: ${r.body.toString().slice(0,300)}`);
  const j = JSON.parse(r.body.toString());
  return {
    text: j.choices?.[0]?.message?.content || '',
    usage: j.usage || null,
    model: j.model || model || DEFAULT_MODEL,
    fileId,
  };
}

/* ---------- HTTP-сервер ---------- */
function cors(req, res){
  const origin = req.headers.origin;
  if(origin && ALLOWED_ORIGINS.includes(origin)){
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Proxy-Token');
}
const json = (res, code, obj) => {
  res.writeHead(code, {'Content-Type':'application/json; charset=utf-8'});
  res.end(JSON.stringify(obj));
};
const readBody = req => new Promise(r => {
  const c = []; req.on('data', x => c.push(x)); req.on('end', () => r(Buffer.concat(c)));
});

const server = http.createServer(async (req, res) => {
  cors(req, res);
  if(req.method === 'OPTIONS') return res.writeHead(204).end();

  const url = new URL(req.url, 'http://localhost');

  try{
    if(url.pathname === '/health'){
      const hasKey = !!(process.env.GIGACHAT_KEY || fs.existsSync(path.join(os.homedir(), '.gigachat_key')));
      return json(res, 200, {
        ok: true, hasKey, scope: SCOPE, tokenRequired: !!PROXY_TOKEN,
        tokenCached: !!tokenCache.value,
        tokenExpiresIn: tokenCache.value ? Math.max(0, Math.round((tokenCache.expiresAt - Date.now())/1000)) : 0,
      });
    }

    /* Временный токен для проверки «браузер ходит в GigaChat напрямую».
       Живёт 30 минут, ключ при этом наружу не уходит. Закрыт тем же секретом. */
    if(url.pathname === '/token'){
      if(PROXY_TOKEN && req.headers['x-proxy-token'] !== PROXY_TOKEN
         && url.searchParams.get('t') !== PROXY_TOKEN){
        return json(res, 401, {error:'нужен секрет прокси'});
      }
      const t = await getToken();
      return json(res, 200, {access_token: t, expires_in: Math.round((tokenCache.expiresAt - Date.now())/1000)});
    }

    if(url.pathname === '/models'){
      const r = await api('GET', '/v1/models');
      res.writeHead(r.status, {'Content-Type':'application/json; charset=utf-8'});
      return res.end(r.body);
    }

    if(url.pathname === '/recognize' && req.method === 'POST'){
      if(PROXY_TOKEN && req.headers['x-proxy-token'] !== PROXY_TOKEN){
        console.log('отклонён запрос без верного секрета');
        return json(res, 401, {error:'Неверный секрет прокси — проверьте настройку в профиле'});
      }
      const body = await readBody(req);
      if(body.length > 20 * 1024 * 1024) return json(res, 413, {error:'запрос слишком большой'});
      let payload;
      try{ payload = JSON.parse(body.toString()); }
      catch(e){ return json(res, 400, {error:'тело должно быть JSON'}); }
      const t0 = Date.now();
      const out = await recognize(payload);
      out.ms = Date.now() - t0;
      console.log(`распознано за ${out.ms} мс, токенов ${out.usage?.total_tokens ?? '?'}, модель ${out.model}`);
      return json(res, 200, out);
    }

    /* Служебный проброс для изучения API — только с локальной машины */
    if(url.pathname.startsWith('/raw/')){
      const local = ['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress);
      if(!local) return json(res, 403, {error:'только с локальной машины'});
      const body = req.method === 'POST' ? await readBody(req) : null;
      const r = await api(req.method, '/' + url.pathname.slice(5) + url.search,
        req.headers['content-type'] ? {'Content-Type': req.headers['content-type']} : {}, body);
      res.writeHead(r.status, {'Content-Type': r.headers['content-type'] || 'application/json'});
      return res.end(r.body);
    }

    return json(res, 404, {error:'нет такого пути'});
  }catch(e){
    return json(res, 502, {error: e.message});
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`прокси GigaChat: http://localhost:${PORT}`);
  console.log(`  /health    — состояние и наличие ключа`);
  console.log(`  /models    — список моделей аккаунта`);
  console.log(`  /recognize — распознавание блюда`);
  console.log(PROXY_TOKEN
    ? '  защита: включена, /recognize требует заголовок X-Proxy-Token'
    : '  ВНИМАНИЕ: секрет не задан. Наружу такой прокси выставлять нельзя.');
});
