/* Прогон одного фото по всем моделям, зрячим к картинкам.
   Запуск: node .claude/test-vision.js путь/к/фото.jpg */
const fs=require('fs'), http=require('http'), path=require('path');

const file=process.argv[2];
if(!file || !fs.existsSync(file)){ console.error('укажите файл: node .claude/test-vision.js фото.jpg'); process.exit(1); }

const root=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(root,'providers.js'),'utf8');
const block=src.slice(src.indexOf('function recognitionPrompt'), src.indexOf('/* ---------- Драйверы'));
const ctx=new Function('class ProviderError extends Error{};'+fs.readFileSync(path.join(root,'data.js'),'utf8')+'\n'+block+'\nreturn {recognitionPrompt,parseRecognition,FOOD_BY_ID};')();
const FOOD_BY_ID=ctx.FOOD_BY_ID;

const secret=fs.readFileSync(process.env.HOME+'/.gigachat_proxy_token','utf8').trim();
const mime={'.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.heic':'image/heic','.webp':'image/webp'}[path.extname(file).toLowerCase()]||'image/jpeg';
const image=fs.readFileSync(file).toString('base64');

function ask(model){
  return new Promise(res=>{
    const body=JSON.stringify({prompt:ctx.recognitionPrompt(), image, mime, model});
    const req=http.request({host:'localhost',port:4322,path:'/recognize',method:'POST',
      headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(body),'X-Proxy-Token':secret}},
      r=>{let o='';r.on('data',c=>o+=c);r.on('end',()=>{try{res(JSON.parse(o))}catch(e){res({error:o.slice(0,200)})}})});
    req.on('error',e=>res({error:e.message}));
    req.end(body);
  });
}

(async()=>{
  console.log('файл:', path.basename(file), '|', Math.round(fs.statSync(file).size/1024), 'КБ\n');
  for(const model of ['GigaChat-2-Pro','GigaChat-2-Max','GigaChat-3-Ultra']){
    const r=await ask(model);
    console.log('─'.repeat(70));
    console.log(model, r.usage?`| ${r.usage.total_tokens} токенов | ${(r.ms/1000).toFixed(1)} с`:'');
    if(r.error){ console.log('  ОШИБКА:', r.error); continue; }
    try{
      const d=ctx.parseRecognition(r.text);
      const total=d.ing.reduce((a,i)=>{const f=i.id?FOOD_BY_ID[i.id]:i.custom;return a+f.kcal*i.g/100},0);
      console.log(`  блюдо: ${d.name} (уверенность ${Math.round((d.confidence||0)*100)}%)`);
      console.log(`  итого: ${Math.round(total)} ккал, ${d.ing.reduce((a,i)=>a+i.g,0)} г`);
      d.ing.forEach(i=>{
        const f=i.id?FOOD_BY_ID[i.id]:i.custom;
        console.log(`    ${i.g} г  ${f.name}${i.id?'':'  (оценка модели)'}`);
      });
    }catch(e){
      console.log('  не разобрали:', e.message);
      console.log('  сырой ответ:', (r.text||'').slice(0,400));
    }
  }
})();
