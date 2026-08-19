const http=require('http'),fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json'};
http.createServer((req,res)=>{
  let p=decodeURIComponent(req.url.split('?')[0]);
  if(p==='/')p='/index.html';
  const f=path.join(root,p);
  fs.readFile(f,(e,d)=>{
    if(e){res.writeHead(404);return res.end('404');}
    res.writeHead(200,{'Content-Type':types[path.extname(f)]||'application/octet-stream','Cache-Control':'no-store'});
    res.end(d);
  });
}).listen(4321,()=>console.log('http://localhost:4321'));
