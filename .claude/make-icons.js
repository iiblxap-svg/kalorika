/* Генератор иконок: лаймовый фон + тёмные столбики (как таб «Спорт») */
const zlib = require('zlib'), fs = require('fs'), path = require('path');

function png(size, file){
  const W=size,H=size, bg=[0xCB,0xF2,0x3F], fg=[0x1B,0x1B,0x18];
  const px = Buffer.alloc(W*H*3);
  for(let i=0;i<W*H;i++){ px[i*3]=bg[0]; px[i*3+1]=bg[1]; px[i*3+2]=bg[2]; }

  const put=(x,y)=>{ if(x<0||y<0||x>=W||y>=H) return;
    const i=(y*W+x)*3; px[i]=fg[0]; px[i+1]=fg[1]; px[i+2]=fg[2]; };
  const rect=(x0,y0,w,h,r)=>{
    for(let y=y0;y<y0+h;y++) for(let x=x0;x<x0+w;x++){
      const dx=Math.min(x-x0, x0+w-1-x), dy=Math.min(y-y0, y0+h-1-y);
      if(dx<r && dy<r && (r-dx)**2+(r-dy)**2 > r*r) continue;   // скругление
      put(x,y);
    }
  };

  const u=size/24;                       // сетка 24×24 как в SVG-иконках
  const bars=[[4,9,6],[8,6,12],[12,9,6],[16,4,16],[20,9,6]];
  const bw=Math.round(1.8*u), r=Math.round(bw/2);
  bars.forEach(([cx,y,h])=>rect(Math.round(cx*u-bw/2), Math.round(y*u), bw, Math.round(h*u), r));

  const raw = Buffer.alloc(H*(W*3+1));
  for(let y=0;y<H;y++){ raw[y*(W*3+1)]=0; px.copy(raw, y*(W*3+1)+1, y*W*3, (y+1)*W*3); }

  const chunk=(type,data)=>{
    const len=Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td=Buffer.concat([Buffer.from(type), data]);
    const crc=Buffer.alloc(4); crc.writeUInt32BE(crc32(td)>>>0);
    return Buffer.concat([len,td,crc]);
  };
  const ihdr=Buffer.alloc(13);
  ihdr.writeUInt32BE(W,0); ihdr.writeUInt32BE(H,4);
  ihdr[8]=8; ihdr[9]=2; ihdr[10]=0; ihdr[11]=0; ihdr[12]=0;

  fs.writeFileSync(file, Buffer.concat([
    Buffer.from([0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, {level:9})),
    chunk('IEND', Buffer.alloc(0)),
  ]));
  console.log(file, size);
}

let TBL=null;
function crc32(buf){
  if(!TBL){ TBL=[]; for(let n=0;n<256;n++){ let c=n;
    for(let k=0;k<8;k++) c = c&1 ? 0xEDB88320^(c>>>1) : c>>>1; TBL[n]=c>>>0; } }
  let c=0xFFFFFFFF;
  for(const b of buf) c = TBL[(c^b)&0xFF] ^ (c>>>8);
  return (c^0xFFFFFFFF)>>>0;
}

const dir = path.join(__dirname,'..','icons');
png(192, path.join(dir,'icon-192.png'));
png(512, path.join(dir,'icon-512.png'));
png(180, path.join(dir,'apple-touch-icon.png'));
