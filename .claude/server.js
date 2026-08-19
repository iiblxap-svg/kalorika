/* Статика приложения + проброс на прокси GigaChat, чтобы в разработке
   всё жило на одном origin и не упиралось в CORS и порты. */
const http=require('http'),fs=require('fs'),path=require('path'),os=require('os');
const root=path.join(__dirname,'..');
const PROXY_PORT=process.env.PROXY_PORT||4322;
/* Секрет прокси подставляем на сервере: в разработке приложению его знать незачем */
const tokenFile=path.join(os.homedir(),'.gigachat_proxy_token');
const PROXY_SECRET=fs.existsSync(tokenFile)?fs.readFileSync(tokenFile,'utf8').trim():'';

const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.cer':'application/x-x509-ca-cert'};

http.createServer((req,res)=>{
  /* /giga/* → локальный прокси GigaChat */
  if(req.url.startsWith('/giga/')){
    const chunks=[];
    req.on('data',c=>chunks.push(c));
    req.on('end',()=>{
      const body=Buffer.concat(chunks);
      const p=http.request({host:'127.0.0.1',port:PROXY_PORT,path:req.url.slice(5),method:req.method,
        headers:Object.assign({'Content-Type':req.headers['content-type']||'application/json','Content-Length':body.length},
          PROXY_SECRET?{'X-Proxy-Token':PROXY_SECRET}:{})},
        r=>{res.writeHead(r.statusCode,{'Content-Type':r.headers['content-type']||'application/json'});r.pipe(res);});
      p.on('error',e=>{res.writeHead(502,{'Content-Type':'application/json; charset=utf-8'});
        res.end(JSON.stringify({error:'прокси GigaChat не запущен: '+e.message}));});
      if(body.length) p.write(body);
      p.end();
    });
    return;
  }

  let p=decodeURIComponent(req.url.split('?')[0]);
  if(p==='/')p='/index.html';
  const f=path.join(root,p);
  fs.readFile(f,(e,d)=>{
    if(e){res.writeHead(404);return res.end('404');}
    res.writeHead(200,{'Content-Type':types[path.extname(f)]||'application/octet-stream','Cache-Control':'no-store'});
    res.end(d);
  });
}).listen(4321,()=>console.log('приложение http://localhost:4321  (/giga/* → прокси :'+PROXY_PORT+')'));
