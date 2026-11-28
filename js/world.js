'use strict';
(function(){
const TAU=Math.PI*2;
const clamp=(x,a=0,b=1)=>x<a?a:x>b?b:x;
const lerp=(a,b,u)=>a+(b-a)*u;

/* ---------------- Gaslight palette, plus the interior's materials ---------------- */
const P={skyTop:'#060b17',skyBot:'#23314b',fog:'#120e0b',far:'#101a2c',stone:'#6c7486',stoneDark:'#3f4659',paper:'#dad4c1',ink:'#06080e',
  coat:'#272833',coat2:'#8c6b3b',hat:'#1b1c24',skin:'#e7d9c2',trouser:'#34374b',boot:'#121319',glass:'#121826',glow:'#ffb34b',glowDim:'#a9753b',
  dust:'#8e96a6',leaf:'#b1672b',scarfA:'#3f6b8b',scarfB:'#d9c9a1',case:'#6b4931',brass:'#d1a14b',grain:0.14,
  wood:'#5c3b24',woodDark:'#36210f',woodLight:'#8a5f3a',felt:'#4e2522',plaster:'#c9bd9c',rug:'#6e2b22',
  wallpapers:['#3c4a38','#55302c','#31444e','#4b4532','#4d3d2c','#3a4652']};
const FD='"IM Fell English SC","IM Fell English",Georgia,serif';
const FT='"Special Elite","Courier New",monospace';

function rgb(h){h=h.replace('#','');return[parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];}
function hexA(h,a){const[r,g,b]=rgb(h);return`rgba(${r},${g},${b},${a})`;}
function mix(a,b,u){const A=rgb(a),B=rgb(b);return'#'+A.map((v,i)=>Math.round(v+(B[i]-v)*u).toString(16).padStart(2,'0')).join('');}

/* ---------------- ink toolkit (same as the arrival scene) ---------------- */
let R=Math.random;
function mulberry(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const rr=(a,b)=>a+(b-a)*R();
function path(pts,o={}){
  const closed=o.closed!==false,smooth=o.smooth!==false,j=o.jit||0;
  const p=pts.map(([x,y])=>[x+(j?rr(-j,j):0),y+(j?rr(-j,j):0)]);const n=p.length,Q=new Path2D();
  if(!smooth){Q.moveTo(p[0][0],p[0][1]);for(let i=1;i<n;i++)Q.lineTo(p[i][0],p[i][1]);if(closed)Q.closePath();return Q;}
  const m=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2];
  if(closed){const s=m(p[n-1],p[0]);Q.moveTo(s[0],s[1]);for(let i=0;i<n;i++){const c=p[i],e=m(c,p[(i+1)%n]);Q.quadraticCurveTo(c[0],c[1],e[0],e[1]);}Q.closePath();}
  else{Q.moveTo(p[0][0],p[0][1]);for(let i=1;i<n-1;i++){const e=m(p[i],p[i+1]);Q.quadraticCurveTo(p[i][0],p[i][1],e[0],e[1]);}Q.lineTo(p[n-1][0],p[n-1][1]);}
  return Q;
}
function ell(cx,cy,rx,ry,n=18,j=0,rot=0){const pts=[];for(let i=0;i<n;i++){const a=i/n*TAU,k=1+(j?rr(-j,j):0),x=Math.cos(a)*rx*k,y=Math.sin(a)*ry*k;pts.push([cx+x*Math.cos(rot)-y*Math.sin(rot),cy+x*Math.sin(rot)+y*Math.cos(rot)]);}return pts;}
function box(x,y,w,h,j=1.5){return path([[x,y],[x+w,y],[x+w,y+h],[x,y+h]],{smooth:false,jit:j});}
function fill(ctx,p,c){ctx.fillStyle=c;ctx.fill(p);}
function ink(ctx,p,lw=4,c){ctx.save();ctx.strokeStyle=c||P.ink;ctx.lineJoin='round';ctx.lineCap='round';ctx.lineWidth=lw;ctx.stroke(p);ctx.globalAlpha=0.7;ctx.lineWidth=Math.max(1,lw*0.45);ctx.translate(rr(-1,1)*lw*0.4,rr(-1,1)*lw*0.4);ctx.stroke(p);ctx.restore();}
function line(ctx,pts,lw=3,c,a=1){const p=path(pts,{closed:false,smooth:pts.length>2});ctx.save();ctx.strokeStyle=c||P.ink;ctx.globalAlpha=a;ctx.lineWidth=lw;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke(p);ctx.restore();}
function hatch(ctx,p,o={}){
  const ang=o.ang??-0.8,gap=o.gap||7,lw=o.lw||1.4,c=o.c||P.ink,a=o.a??0.4;const W=ctx.canvas.width,H=ctx.canvas.height,L=Math.hypot(W,H);
  ctx.save();ctx.clip(p);if(o.clip2)ctx.clip(o.clip2);ctx.strokeStyle=c;ctx.globalAlpha=a;ctx.lineWidth=lw;ctx.lineCap='round';
  ctx.translate(W/2,H/2);ctx.rotate(ang);ctx.beginPath();for(let y=-L/2;y<L/2;y+=gap){const jj=rr(-gap*.2,gap*.2);ctx.moveTo(-L/2,y+jj);ctx.lineTo(L/2,y+jj+rr(-3,3));}ctx.stroke();ctx.restore();
}
function shade(ctx,p,x0,y0,x1,y1,a=0.45,c){ctx.save();ctx.clip(p);const g=ctx.createLinearGradient(x0,y0,x1,y1);g.addColorStop(0,hexA(c||P.ink,0));g.addColorStop(1,hexA(c||P.ink,a));ctx.fillStyle=g;ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);ctx.restore();}
function mottle(ctx,p,c,a,n,sz,bb){const W=ctx.canvas.width,H=ctx.canvas.height;const[x0,y0,w,h]=bb||[0,0,W,H];ctx.save();ctx.clip(p);ctx.fillStyle=c;for(let i=0;i<n;i++){ctx.globalAlpha=a*rr(0.3,1);ctx.fill(path(ell(x0+rr(0,w),y0+rr(0,h),sz*rr(.4,1.2),sz*rr(.3,1),9,0.25)));}ctx.restore();}
function dot(ctx,x,y,r,c){ctx.fillStyle=c;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();}
function txt(ctx,s,x,y,size,o={}){const font=o.font||FD,c=o.c||P.ink,align=o.align||'center',jit=o.jit||0;
  ctx.save();ctx.translate(x,y);ctx.rotate(o.rot||0);ctx.font=`${size}px ${font}`;if(o.maxW){const w0=ctx.measureText(s).width*(jit?1.04:1);if(w0>o.maxW){size=size*o.maxW/w0;ctx.font=`${size}px ${font}`;}}ctx.globalAlpha=o.a??1;ctx.fillStyle=c;ctx.textBaseline='alphabetic';
  if(!jit){ctx.textAlign=align;ctx.fillText(s,0,0);}else{const w=ctx.measureText(s).width;let cx=align==='center'?-w/2:align==='right'?-w:0;ctx.textAlign='left';for(const ch of s){const cw=ctx.measureText(ch).width;ctx.save();ctx.translate(cx+cw/2,rr(-jit,jit));ctx.rotate(rr(-1,1)*jit*0.012);ctx.fillText(ch,-cw/2,0);ctx.restore();cx+=cw;}}
  ctx.restore();}
function curl(ctx,x,y,a,r,lw=4,c){const cx=x+Math.cos(a+Math.PI/2)*r,cy=y+Math.sin(a+Math.PI/2)*r,t0=a-Math.PI/2;const pts=[];for(let i=0;i<=22;i++){const k=i/22,th=t0+k*TAU*1.15,rad=r*(1-k*0.85);pts.push([cx+Math.cos(th)*rad,cy+Math.sin(th)*rad]);}line(ctx,pts,lw,c);}
function spiral(ctx,cx,cy,r,lw,c,a=1,turns=1.6){const pts=[];for(let i=0;i<=30;i++){const k=i/30,th=k*TAU*turns,rad=r*k;pts.push([cx+Math.cos(th)*rad,cy+Math.sin(th)*rad]);}line(ctx,pts,lw,c,a);}
function crack(ctx,x,y,len,ang=Math.PI/2,lw=3){let px=x,py=y;const pts=[[px,py]];const n=Math.max(3,len/22|0);for(let i=0;i<n;i++){ang+=rr(-0.7,0.7);px+=Math.cos(ang)*len/n;py+=Math.sin(ang)*len/n;pts.push([px,py]);}const p=path(pts,{closed:false,smooth:false});ctx.save();ctx.strokeStyle=P.ink;ctx.lineWidth=lw;ctx.stroke(p);ctx.restore();}
function arch(cx,top,w,h){const r=w/2,p=new Path2D();p.moveTo(cx-r,top+h);p.lineTo(cx-r,top+r);p.arc(cx,top+r,r,Math.PI,0);p.lineTo(cx+r,top+h);p.closePath();return p;}
function panel(ctx,x,y,w,h,c){const o=box(x,y,w,h,1);fill(ctx,o,c||P.wood);const i=box(x+8,y+8,w-16,h-16,1);fill(ctx,i,mix(c||P.wood,P.ink,0.18));ctx.save();ctx.strokeStyle=hexA(P.paper,0.16);ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+8,y+h-8);ctx.lineTo(x+8,y+8);ctx.lineTo(x+w-8,y+8);ctx.stroke();ctx.restore();ink(ctx,i,2);ink(ctx,o,2.5);}

const GRAIN=document.createElement('canvas');GRAIN.width=GRAIN.height=256;
(()=>{const g=GRAIN.getContext('2d'),id=g.createImageData(256,256);R=mulberry(77);for(let i=0;i<id.data.length;i+=4){let v=222+R()*33;if(R()<0.004)v=170+R()*40;id.data[i]=v;id.data[i+1]=v*0.98;id.data[i+2]=v*0.94;id.data[i+3]=255;}g.putImageData(id,0,0);})();
function cv(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function tint(src,color){const c=cv(src.width,src.height),x=c.getContext('2d');x.drawImage(src,0,0);x.globalCompositeOperation='source-in';x.fillStyle=color;x.fillRect(0,0,c.width,c.height);return c;}

const TEXS=[];let renderer;
function T(w,h,fn,o={}){const c=cv(w,h),t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;if(o.repeat){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(o.repeat[0],o.repeat[1]);}
  t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());const e={c,t,fn,border:o.border??6,grain:o.grain!==false,seed:o.seed??(TEXS.length*7919+101),cut:o.cut};TEXS.push(e);t.userData={w,h};return t;}
function compose(e){const{c,fn,border,seed}=e,W=c.width,H=c.height;const a=cv(W,H),ac=a.getContext('2d');R=mulberry(seed);ac.save();fn(ac,W,H);ac.restore();
  const ctx=c.getContext('2d');ctx.clearRect(0,0,W,H);
  if(border>0){const s=tint(a,P.paper),n=border>4?16:10;for(let i=0;i<n;i++){const an=i/n*TAU;ctx.drawImage(s,Math.cos(an)*border,Math.sin(an)*border);}
    const s2=tint(a,mix(P.paper,P.ink,0.35));ctx.globalCompositeOperation='destination-over';for(let i=0;i<8;i++){const an=i/8*TAU;ctx.drawImage(s2,Math.cos(an)*(border+1.5),Math.sin(an)*(border+1.5));}ctx.globalCompositeOperation='source-over';
    // where two pieces join (a neck into a collar, an elbow) the paper margin would show as a white seam: cut it away
    if(e.cut){if(e.cut.t)ctx.clearRect(0,0,W,e.cut.t);if(e.cut.b!=null)ctx.clearRect(0,e.cut.b,W,H-e.cut.b);}}
  ctx.drawImage(a,0,0);
  if(e.grain){const m=cv(W,H);m.getContext('2d').drawImage(c,0,0);ctx.globalCompositeOperation='multiply';ctx.globalAlpha=Math.min(1,P.grain*1.6);ctx.fillStyle=ctx.createPattern(GRAIN,'repeat');ctx.fillRect(0,0,W,H);ctx.globalAlpha=1;ctx.globalCompositeOperation='destination-in';ctx.drawImage(m,0,0);ctx.globalCompositeOperation='source-over';}}

/* ================= CHARACTERS =================
   Character style rules (both figures):
   - Flat base colour, then a hard-edged shadow crescent on the side away from the light (cel()),
     hatched inside, and a thin warm gaslight rim on the lit edge. Light comes from upper right.
   - Heavy outer outline (5px double pass), thin inner detail (2px), dashed stitching on seams.
   - Period clothes, drawn as cut cloth: the Archivist wears a Chesterfield overcoat with a velvet
     collar, pinstripe trousers with turn-ups, and spats over boots; the attendant wears a 1910
     shirtwaist with a high lace collar, a cameo, and a Gibson-girl pompadour.
   - Signatures: round spectacles, the striped scarf, a quill in the hat, index cards in the pocket. */
const LX=0.86,LY=-0.5;
function moved(p,dx,dy){const q=new Path2D();q.addPath(p);q.addPath(p,new DOMMatrix([1,0,0,1,dx,dy]));return q;}
function cel(ctx,p,base,o={}){const s=o.s??9,r=o.r??3.5;fill(ctx,p,base);ctx.save();ctx.clip(p);
  const sh=moved(p,LX*s,LY*s);ctx.fillStyle=mix(base,o.to||P.ink,o.dark??0.42);ctx.fill(sh,'evenodd');
  if(o.hatch!==false){ctx.save();ctx.clip(sh,'evenodd');const W=ctx.canvas.width,H=ctx.canvas.height;ctx.strokeStyle=hexA(P.ink,o.ha??0.35);ctx.lineWidth=1.3;ctx.beginPath();for(let k=-H;k<W;k+=6){ctx.moveTo(k,0);ctx.lineTo(k+H*0.55,H);}ctx.stroke();ctx.restore();}
  if(o.rim!==false){ctx.fillStyle=hexA(P.glow,o.ra??0.5);ctx.fill(moved(p,-LX*r,-LY*r),'evenodd');}
  ctx.restore();}
function stitch(ctx,pts,c,a=0.55){ctx.save();ctx.setLineDash([5,4]);line(ctx,pts,1.6,c||P.paper,a);ctx.restore();}
function flecks(ctx,p,bb,n=120){ctx.save();ctx.clip(p);const[x0,y0,w,h]=bb;for(let i=0;i<n;i++){ctx.fillStyle=R()<0.5?hexA(P.paper,0.09):hexA(P.ink,0.18);ctx.fillRect(x0+rr(0,w),y0+rr(0,h),rr(1,2.5),rr(1,2.5));}ctx.restore();}
const SPAT=()=>mix(P.paper,P.stone,0.28),COLLAR=()=>mix(P.coat,P.ink,0.38),HAIR=()=>mix(P.paper,P.stone,0.25);

/* ---- the Archivist ---- */
function trousers(ctx,front){
  const tr=path(front?[[38,6],[66,6],[65,90],[63,176],[37,176],[36,90]]:[[40,6],[66,6],[64,90],[61,176],[39,176],[38,90]],{smooth:false,jit:1});
  cel(ctx,tr,P.trouser,{s:7});ctx.save();ctx.clip(tr);ctx.strokeStyle=hexA(P.paper,0.2);ctx.lineWidth=1.4;for(let x=34;x<72;x+=7){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+rr(-1.5,1.5),180);ctx.stroke();}ctx.restore();
  line(ctx,[[52,100],[51,170]],1.6,P.ink,0.45);ink(ctx,tr,4);
  const cf=box(36,170,29,14,0.8);cel(ctx,cf,P.trouser,{s:4,hatch:false});line(ctx,[[38,176],[63,176]],1.4,P.ink,0.6);ink(ctx,cf,2.5);}
function drawLeg(view){return ctx=>{
  trousers(ctx,view==='front');
  const bc=P.boot,sp=SPAT();
  if(view==='side'){
    const bt=path([[36,206],[92,208],[108,212],[116,204],[119,210],[112,224],[92,232],[40,234],[33,222]],{jit:0.8});cel(ctx,bt,bc,{s:5,ra:0.7});line(ctx,[[70,222],[104,214]],2.5,P.paper,0.35);ink(ctx,bt,4);
    const s=path([[37,182],[64,182],[68,200],[90,208],[92,216],[38,218],[34,200]],{smooth:false,jit:0.8});cel(ctx,s,sp,{s:5,hatch:false});
    for(const y of [190,199,208])dot(ctx,42,y,2.3,P.ink);line(ctx,[[40,216],[90,214]],1.4,P.ink,0.5);ink(ctx,s,3);
  }else if(view==='back'){
    const bt=path([[35,208],[67,208],[70,226],[64,234],[38,234],[32,226]],{jit:0.8});cel(ctx,bt,bc,{s:4,ra:0.7});ink(ctx,bt,3.5);
    const s=path([[37,182],[64,182],[68,214],[34,214]],{smooth:false,jit:0.8});cel(ctx,s,sp,{s:4,hatch:false});line(ctx,[[51,184],[51,212]],1.4,P.ink,0.5);ink(ctx,s,3);
  }else{
    const bt=path([[32,206],[70,206],[78,222],[72,236],[34,236],[28,224]],{jit:0.8});cel(ctx,bt,bc,{s:4,ra:0.7});dot(ctx,62,226,3,hexA(P.paper,0.5));ink(ctx,bt,3.5);
    const s=path([[37,182],[64,182],[70,212],[32,212]],{smooth:false,jit:0.8});cel(ctx,s,sp,{s:4,hatch:false});for(const y of [190,198,206])dot(ctx,62,y,2.2,P.ink);ink(ctx,s,3);
  }};}
function indexCards(ctx,x,y,n=3){for(let i=0;i<n;i++){ctx.save();ctx.translate(x+i*12,y);ctx.rotate(-0.3+i*0.22);const cd=box(-13,-36,28,40,1);fill(ctx,cd,P.paper);line(ctx,[[-9,-30],[11,-30]],1.6,P.scarfA,0.8);line(ctx,[[-9,-24],[11,-24]],1.1,P.ink,0.4);line(ctx,[[-9,-18],[8,-18]],1.1,P.ink,0.4);ink(ctx,cd,2);ctx.restore();}}
function keyRing(ctx,x,y){ctx.save();ctx.strokeStyle=P.brass;ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,y,9,0,TAU);ctx.stroke();ctx.restore();
  for(let i=0;i<3;i++){ctx.save();ctx.translate(x,y+7);ctx.rotate(-0.45+i*0.42);const k=path([[-2.5,0],[2.5,0],[2.5,26],[8,26],[8,31],[2.5,31],[2.5,35],[-2.5,35]],{smooth:false,jit:0.4});fill(ctx,k,P.brass);ink(ctx,k,1.6);ctx.restore();}}
function drawCoat(view){return ctx=>{
  const cc=P.coat;
  if(view==='side'){
    const c=path([[124,40],[104,52],[92,96],[90,190],[94,250],[96,300],[88,360],[70,420],[46,452],[46,452],[104,446],[160,452],[226,446],[226,446],[216,380],[210,320],[218,250],[226,170],[224,100],[210,56],[180,38]],{jit:1.2});
    cel(ctx,c,cc,{s:16,dark:0.5});flecks(ctx,c,[80,40,160,420],260);
    stitch(ctx,[[216,90],[212,200],[206,320],[214,440]]);stitch(ctx,[[96,300],[208,302]]);stitch(ctx,[[52,444],[104,440],[160,446],[220,440]]);
    line(ctx,[[98,330],[84,400],[68,446]],2.5,P.ink,0.8);line(ctx,[[204,64],[196,120],[190,168]],2.5,P.ink,0.8);
    const bp=path([[160,150],[196,148],[197,160],[161,162]],{smooth:false});fill(ctx,bp,mix(cc,P.ink,0.3));line(ctx,[[170,150],[168,124]],3,P.scarfB);line(ctx,[[180,150],[183,128]],3,P.brass);ink(ctx,bp,1.8);
    indexCards(ctx,148,318);const pk=path([[130,314],[206,310],[208,340],[132,344]],{smooth:false,jit:1});cel(ctx,pk,cc,{s:5,hatch:false});stitch(ctx,[[136,320],[202,316]]);ink(ctx,pk,2.5);
    for(const y of [120,180,240])dot(ctx,219,y,4,mix(cc,P.paper,0.3));
    const pt=box(102,200,30,28,1.5);fill(ctx,pt,P.coat2);stitch(ctx,[[106,204],[128,204],[128,224],[106,224],[106,204]],P.ink,0.5);ink(ctx,pt,2);
    ink(ctx,c,5);keyRing(ctx,108,330);
    const col=path([[146,50],[152,10],[172,4],[202,14],[218,58],[200,90],[184,64]],{jit:1});cel(ctx,col,COLLAR(),{s:6,hatch:false,ra:0.35});ink(ctx,col,3.5);
    
  }else{
    const c=path([[104,46],[74,60],[66,110],[70,200],[76,300],[66,380],[46,450],[46,450],[150,446],[254,450],[254,450],[234,380],[224,300],[230,200],[234,110],[226,60],[196,46]],{jit:1.2});
    cel(ctx,c,cc,{s:16,dark:0.5});flecks(ctx,c,[60,40,200,420],260);stitch(ctx,[[56,444],[150,440],[244,444]]);
    if(view==='back'){
      line(ctx,[[150,70],[151,292]],2,P.ink,0.6);line(ctx,[[150,370],[150,446]],2.5,P.ink,0.85);
      const bt=box(102,290,96,20,1.2);cel(ctx,bt,cc,{s:4,hatch:false});ink(ctx,bt,2.5);for(const x of [112,188])dot(ctx,x,300,5,mix(cc,P.paper,0.3));
      const pt=box(176,150,32,28,1.5);fill(ctx,pt,P.coat2);ink(ctx,pt,2);ink(ctx,c,5);
      const col=path([[104,60],[110,10],[150,4],[190,10],[196,60],[150,72]],{jit:1});cel(ctx,col,COLLAR(),{s:5,hatch:false,ra:0.35});ink(ctx,col,3.5);
    }else{
      // front: open below the waist to show trousers, lapels with a velvet collar, shirt and tie, the scarf ends
      const sc0=path([[110,70],[116,14],[134,30],[150,36],[166,30],[184,14],[190,70]],{smooth:false,jit:0.8});cel(ctx,sc0,COLLAR(),{s:5,hatch:false,ra:0.3});ink(ctx,sc0,3);
      const gap=path([[136,330],[164,330],[176,452],[124,452]],{smooth:false});fill(ctx,gap,mix(P.trouser,P.ink,0.35));
      line(ctx,[[150,120],[150,330]],2.2,P.ink,0.7);for(const y of [200,250,300])dot(ctx,158,y,5,mix(cc,P.paper,0.3));
      for(const sx of [-1,1]){const lp=path([[150+sx*4,64],[150+sx*40,58],[150+sx*46,82],[150+sx*30,96],[150+sx*8,170]],{smooth:false,jit:0.8});cel(ctx,lp,COLLAR(),{s:5,hatch:false,ra:0.3});ink(ctx,lp,2.5);}
      const sh=path([[140,58],[160,58],[156,110],[144,110]],{smooth:false});fill(ctx,sh,P.paper);const tie=path([[146,66],[154,66],[156,104],[150,112],[144,104]]);fill(ctx,tie,P.case);ink(ctx,tie,1.6);
      for(const sx of [-1,1]){const pk=path([[150+sx*32,318],[150+sx*84,314],[150+sx*86,340],[150+sx*34,344]],{smooth:false,jit:1});cel(ctx,pk,cc,{s:4,hatch:false});ink(ctx,pk,2.4);}
      indexCards(ctx,198,322);const bp=path([[96,150],[128,148],[128,160],[96,162]],{smooth:false});fill(ctx,bp,mix(cc,P.ink,0.3));line(ctx,[[104,150],[102,126]],3,P.scarfB);ink(ctx,bp,1.8);
      ink(ctx,c,5);keyRing(ctx,222,336);
      // scarf: around the neck, one long end down the chest
      const sc=path([[112,54],[188,54],[190,74],[170,80],[176,190],[160,196],[150,82],[112,74]],{jit:0.8});fill(ctx,sc,P.scarfA);ctx.save();ctx.clip(sc);ctx.fillStyle=P.scarfB;for(let y=60;y<200;y+=22)ctx.fillRect(100,y,100,9);ctx.restore();shade(ctx,sc,112,0,190,0,0.35);ink(ctx,sc,3);
      for(let i=0;i<5;i++)line(ctx,[[162+i*3,194],[160+i*4,208]],1.8,P.ink,0.9);
    }
  }};}
function spectacles(ctx,cx,cy,r){fill(ctx,path(ell(cx,cy,r-1,r-1,14,0)),hexA(P.paper,0.42));ctx.save();ctx.strokeStyle=hexA('#ffffff',0.75);ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(cx-r*0.5,cy-r*0.2);ctx.lineTo(cx-r*0.1,cy-r*0.6);ctx.moveTo(cx-r*0.45,cy+r*0.15);ctx.lineTo(cx-r*0.3,cy);ctx.stroke();ctx.strokeStyle=P.ink;ctx.lineWidth=4.5;ctx.beginPath();ctx.arc(cx,cy,r,0,TAU);ctx.stroke();ctx.strokeStyle=P.brass;ctx.lineWidth=1.4;ctx.beginPath();ctx.arc(cx,cy,r-2.5,-2.4,-0.6);ctx.stroke();ctx.restore();}
function drawHead(view){return ctx=>{
  const sk=P.skin,hc=HAIR();
  const neck=path(view==='side'?[[100,254],[100,200],[120,192],[126,254]]:[[96,254],[98,196],[122,196],[124,254]],{jit:0.8});cel(ctx,neck,sk,{s:6,hatch:false});ink(ctx,neck,3);
  if(view==='side'){
    const hair=path([[64,96],[58,124],[66,160],[86,176],[96,150],[92,108]],{jit:2});cel(ctx,hair,hc,{s:5,hatch:false,ra:0.3});for(let i=0;i<6;i++)curl(ctx,60+rr(-3,3),102+i*12,Math.PI+rr(-0.4,0.4),rr(4,8),2);ink(ctx,hair,2.6);
    const hd=path([[96,58],[130,50],[160,62],[178,92],[184,128],[176,160],[164,184],[138,196],[110,190],[92,170],[84,130],[86,90]],{jit:0.6});cel(ctx,hd,sk,{s:9});ink(ctx,hd,4.5);
    const ear=path(ell(104,134,11,17,10,0.05));cel(ctx,ear,sk,{s:3,hatch:false});ink(ctx,ear,2.4);curl(ctx,106,128,1.6,5,1.6,P.ink);
    const nose=path([[172,104],[198,120],[226,148],[234,160],[222,164],[196,158],[176,148]],{jit:0.5});cel(ctx,nose,sk,{s:4,hatch:false});ink(ctx,nose,3.4);dot(ctx,200,152,2,P.ink);
    fill(ctx,path(ell(160,110,22,18,12,0.05)),hexA(P.ink,0.25));dot(ctx,165,113,4.5,P.ink);dot(ctx,166.5,111.5,1.4,P.paper);
    line(ctx,[[138,80],[158,72],[180,76],[190,86]],5,hc);line(ctx,[[138,80],[158,72],[180,76],[190,86]],1.6,P.ink,0.7);
    spectacles(ctx,162,112,24);line(ctx,[[139,108],[108,120]],2.6);
    line(ctx,[[160,180],[176,184],[190,178]],2.6);line(ctx,[[150,150],[158,170]],1.6,P.ink,0.45);line(ctx,[[136,190],[152,196]],1.6,P.ink,0.4);
    for(let i=0;i<4;i++)line(ctx,[[104+i*14,64-i*3],[108+i*14,50-i*4]],1.6,hc,0.9);
  }else if(view==='front'){
    for(const sx of [-1,1]){const hair=path([[110+sx*44,92],[110+sx*64,110],[110+sx*66,150],[110+sx*52,170],[110+sx*44,140]],{jit:1.5});cel(ctx,hair,hc,{s:4,hatch:false,ra:0.3});ink(ctx,hair,2.6);}
    for(const sx of [-1,1]){const ear=path(ell(110+sx*58,136,10,16,10,0.05));cel(ctx,ear,sk,{s:3,hatch:false});ink(ctx,ear,2.4);}
    const hd=path([[110,52],[146,60],[166,94],[168,140],[156,176],[134,196],[110,200],[86,196],[64,176],[52,140],[54,94],[74,60]],{jit:0.6});cel(ctx,hd,sk,{s:9});ink(ctx,hd,4.5);
    for(const sx of [-1,1]){line(ctx,[[110+sx*12,86],[110+sx*28,80],[110+sx*44,86]],5,hc);line(ctx,[[110+sx*12,86],[110+sx*28,80],[110+sx*44,86]],1.5,P.ink,0.7);
      dot(ctx,110+sx*26,114,4.5,P.ink);dot(ctx,110+sx*26+1.5,112.5,1.4,P.paper);spectacles(ctx,110+sx*27,114,22);line(ctx,[[110+sx*49,112],[110+sx*58,124]],2.4);}
    line(ctx,[[104,112],[110,107],[116,112]],2.6);
    const nose=path([[106,116],[114,116],[121,158],[118,168],[110,171],[102,168],[99,158]],{smooth:false,jit:0.3});cel(ctx,nose,sk,{s:4,hatch:false});ink(ctx,nose,2.6);dot(ctx,106,166,1.8,P.ink);dot(ctx,114,166,1.8,P.ink);
    line(ctx,[[94,186],[110,190],[126,186]],2.6);line(ctx,[[84,150],[90,170]],1.5,P.ink,0.4);line(ctx,[[136,150],[130,170]],1.5,P.ink,0.4);
    for(let i=0;i<5;i++)line(ctx,[[90+i*10,60-Math.abs(i-2)*2],[92+i*10,46-Math.abs(i-2)*3]],1.6,hc,0.9);
  }else{
    for(const sx of [-1,1]){const ear=path(ell(110+sx*58,136,10,16,10,0.05));cel(ctx,ear,sk,{s:3,hatch:false});ink(ctx,ear,2.4);}
    const hd=path([[110,52],[146,60],[166,94],[168,140],[156,176],[134,196],[110,200],[86,196],[64,176],[52,140],[54,94],[74,60]],{jit:0.6});cel(ctx,hd,sk,{s:9});ink(ctx,hd,4.5);
    const hair=path([[54,112],[60,168],[84,194],[136,194],[160,168],[166,112],[150,128],[110,134],[70,128]],{jit:1.5});cel(ctx,hair,hc,{s:5,hatch:false,ra:0.3});for(let i=0;i<7;i++)curl(ctx,70+i*12,186+rr(-4,6),Math.PI/2+rr(-0.4,0.4),rr(4,7),1.8);ink(ctx,hair,2.6);
    line(ctx,[[52,120],[38,118]],2.6);line(ctx,[[168,120],[182,118]],2.6);
  }};}
function drawHat(ctx){
  const crown=path([[48,196],[56,130],[52,62],[46,30],[46,30],[78,14],[118,18],[134,30],[134,30],[128,62],[130,130],[138,196]],{jit:1.2});cel(ctx,crown,P.hat,{s:12,to:P.ink,dark:0.5,ra:0.45});
  line(ctx,[[60,70],[90,80],[122,66]],2,P.ink,0.8);line(ctx,[[64,118],[100,112]],1.6,P.paper,0.2);const pt=box(92,86,22,20,1.5);fill(ctx,pt,P.coat2);stitch(ctx,[[94,88],[112,88],[112,104],[94,104],[94,88]],P.ink,0.5);ink(ctx,crown,4.5);
  const band=path([[52,160],[134,160],[136,184],[50,184]],{smooth:false,jit:0.8});cel(ctx,band,P.scarfA,{s:4,hatch:false});ink(ctx,band,2.6);
  const q=path([[124,176],[134,130],[150,80],[166,40],[178,34],[174,62],[160,106],[142,150],[132,178]],{jit:0.4});fill(ctx,q,P.paper);for(let i=0;i<8;i++){const k=i/8,x=lerp(136,170,k),y=lerp(160,46,k);line(ctx,[[x,y],[x+9,y+5]],1.2,P.ink,0.45);}line(ctx,[[130,178],[152,110],[172,40]],1.8,P.ink,0.8);ink(ctx,q,2.4);
  const brim=path([[6,198],[40,190],[90,188],[150,190],[176,196],[174,208],[90,204],[8,210]],{jit:0.8});cel(ctx,brim,mix(P.hat,P.ink,0.2),{s:4,hatch:false,ra:0.4});ink(ctx,brim,4);}
// arms in two pieces: upper arm (shoulder to elbow) and forearm with hand
function drawUpperArm(patch){return ctx=>{const sl=path([[24,26],[28,12],[38,4],[52,4],[62,12],[66,26],[64,60],[63,123],[63,123],[27,124],[27,124],[26,60]],{jit:0.8});cel(ctx,sl,P.coat,{s:9,dark:0.5});flecks(ctx,sl,[20,0,50,120],40);
  if(patch){const ep=path(ell(44,104,14,14,10,0.08));fill(ctx,ep,P.coat2);stitch(ctx,[[34,98],[44,92],[54,98]],P.ink,0.5);ink(ctx,ep,1.8);}stitch(ctx,[[60,10],[58,110]]);ink(ctx,sl,4);}}
function drawForearm(grip){return ctx=>{const sl=path([[31,0],[64,0],[62,76],[34,78]],{smooth:false,jit:0.8});cel(ctx,sl,P.coat,{s:8,dark:0.5});flecks(ctx,sl,[26,0,44,80],30);ink(ctx,sl,4);
  const cf=path([[33,72],[63,72],[64,88],[32,88]],{smooth:false,jit:0.6});cel(ctx,cf,P.paper,{s:4,hatch:false,ra:0.3});dot(ctx,58,80,2.6,P.brass);ink(ctx,cf,2);
  const hand=grip?path([[34,86],[62,86],[68,98],[66,114],[58,120],[40,120],[32,110],[32,96]],{jit:0.5}):path([[36,86],[60,86],[68,100],[67,124],[61,128],[58,112],[54,132],[48,132],[46,112],[41,124],[34,118],[35,100]],{smooth:false,jit:0.5});
  cel(ctx,hand,P.skin,{s:4,hatch:false});if(grip){for(let k=0;k<3;k++)line(ctx,[[40+k*8,104],[42+k*8,116]],1.4,P.ink,0.6);}ink(ctx,hand,2.6);}}
function drawScarf(ctx){
  const s=path([[212,10],[170,16],[130,26],[90,22],[50,34],[20,44],[16,64],[50,56],[90,46],[130,52],[170,40],[212,34]],{jit:0.8});fill(ctx,s,P.scarfA);
  ctx.save();ctx.clip(s);ctx.fillStyle=P.scarfB;for(let x=4;x<220;x+=30){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+12,0);ctx.lineTo(x+6,100);ctx.lineTo(x-6,100);ctx.closePath();ctx.fill();}ctx.restore();
  shade(ctx,s,0,10,0,64,0.4);ink(ctx,s,3.2);for(let i=0;i<6;i++)line(ctx,[[19,46+i*3.4],[4,48+i*5]],1.8,P.ink,0.9);}
function drawCase(ctx){
  const hd=path([[70,44],[72,14],[80,8],[120,8],[128,14],[130,44],[118,44],[116,22],[84,22],[82,44]],{smooth:false,jit:0.6});fill(ctx,hd,mix(P.case,P.ink,0.4));ink(ctx,hd,2.6);
  const b=path([[12,40],[12,40],[188,40],[188,40],[192,160],[192,160],[8,162],[8,162]],{jit:1.5});cel(ctx,b,P.case,{s:10});stitch(ctx,[[18,50],[182,50],[184,152],[16,152],[18,50]],P.paper,0.4);
  for(const x of [46,136]){const st=box(x,38,18,126,1);fill(ctx,st,mix(P.case,P.ink,0.4));ink(ctx,st,1.8);const bk=box(x-3,90,24,18,1);cel(ctx,bk,P.brass,{s:3,hatch:false});ink(ctx,bk,1.8);}
  ctx.save();ctx.translate(100,98);ctx.rotate(-0.1);const sk=box(-28,-18,56,34,1.2);fill(ctx,sk,P.scarfB);txt(ctx,'LOST',0,8,20,{font:FT,maxW:48});ink(ctx,sk,1.8);ctx.restore();ink(ctx,b,4);}

/* ---- the attendant: a 1910 shirtwaist behind the counter ---- */
function drawAttBody(ctx,W,H){
  const bl=mix(mix(P.paper,P.scarfA,0.16),P.glowDim,0.08),sk=mix(P.scarfA,P.ink,0.55);
  const skirt=path([[70,226],[190,226],[198,H],[62,H]],{smooth:false,jit:0.8});cel(ctx,skirt,sk,{s:6});const belt=box(72,220,116,16,0.8);fill(ctx,belt,mix(sk,P.ink,0.3));const bk=box(118,220,24,16,0.6);cel(ctx,bk,P.brass,{s:3,hatch:false});ink(ctx,belt,2.2);ink(ctx,skirt,3.5);
  // long fitted sleeves (1910), shoulder to elbow; the elbows come forward onto the counter
  for(const sx of [-1,1]){const ua=path([[130+sx*44,66],[130+sx*64,72],[130+sx*76,96],[130+sx*76,132],[130+sx*62,140],[130+sx*54,112],[130+sx*44,86]],{jit:0.6});cel(ctx,ua,bl,{s:6,ha:0.16});ctx.save();ctx.clip(ua);for(let k=0;k<6;k++){ctx.strokeStyle=hexA(P.scarfA,0.28);ctx.lineWidth=2.2;ctx.beginPath();ctx.moveTo(130+sx*(48+k*6),70);ctx.lineTo(130+sx*(52+k*5),142);ctx.stroke();}ctx.restore();ink(ctx,ua,3);}
  const t=path([[82,78],[104,64],[156,64],[178,78],[182,150],[178,224],[82,224],[78,150]],{jit:0.6});cel(ctx,t,bl,{s:10,ha:0.16,dark:0.22});
  ctx.save();ctx.clip(t);for(let x=80;x<184;x+=7){ctx.fillStyle=hexA(P.scarfA,0.28);ctx.fillRect(x,60,2.2,170);}ctx.restore();
  {const pts=[[124,64],[136,64]];for(let k=0;k<6;k++)pts.push([140+(k%2?5:0)+k*1.2,72+k*9]);pts.push([130,126]);for(let k=5;k>=0;k--)pts.push([120-(k%2?5:0)-k*1.2,72+k*9]);const jab=path(pts,{jit:0.4});fill(ctx,jab,P.paper);for(let k=0;k<5;k++)line(ctx,[[122-k,78+k*9],[130,82+k*9],[138+k,78+k*9]],1.2,P.ink,0.35);ink(ctx,jab,2);}
  ink(ctx,t,3.5);
  const watch=path(ell(100,104,7,7,10,0.02));cel(ctx,watch,P.brass,{s:2,hatch:false});dot(ctx,100,104,3.5,P.paper);line(ctx,[[100,90],[100,97]],1.6,P.brass);ink(ctx,watch,1.5);
  // her left forearm lies across the ledger
  const fa=path([[60,128],[74,122],[112,136],[120,146],[104,150],[62,142]],{jit:0.6});cel(ctx,fa,bl,{s:5,ha:0.16});ink(ctx,fa,3);
  const cf=path([[104,136],[114,138],[110,150],[100,148]],{smooth:false});fill(ctx,cf,P.paper);ink(ctx,cf,1.4);
  const hd=path(ell(120,146,11,8,10,0.05));cel(ctx,hd,P.skin,{s:3,hatch:false});ink(ctx,hd,2.2);
  // a high boned collar that hugs the neck, lace at the top edge, a cameo at the throat
  const col=path([[116,34],[144,34],[147,64],[113,64]],{smooth:false,jit:0.5});cel(ctx,col,P.paper,{s:4,hatch:false,ra:0.3});for(const x of [122,130,138])line(ctx,[[x,38],[x,62]],1,P.ink,0.3);
  {const sc=[];for(let x=117;x<=143;x+=4)sc.push([x,x%8<4?38:41]);line(ctx,sc,1.2,P.ink,0.55);}ink(ctx,col,2.4);
  const cam=path(ell(130,58,7,9,10,0.02));fill(ctx,cam,P.brass);fill(ctx,path(ell(130,58,4.5,6.5,10,0.02)),mix(P.case,P.scarfB,0.45));dot(ctx,131,56,2,P.paper);ink(ctx,cam,1.5);}
function drawAttArm(ctx){const fa=path([[98,4],[116,14],[106,30],[52,48],[40,36]],{jit:0.6});cel(ctx,fa,mix(mix(P.paper,P.scarfA,0.16),P.glowDim,0.08),{s:5,ha:0.16});ctx.save();ctx.clip(fa);for(let k=0;k<8;k++){ctx.strokeStyle=hexA(P.scarfA,0.28);ctx.lineWidth=2.2;ctx.beginPath();ctx.moveTo(40+k*10,10);ctx.lineTo(56+k*10,54);ctx.stroke();}ctx.restore();ink(ctx,fa,3);
  const cf=path([[44,30],[56,28],[60,46],[48,50]],{smooth:false});fill(ctx,cf,P.paper);ink(ctx,cf,1.8);
  const hd=path(ell(32,44,12,9,10,0.05,-0.3));cel(ctx,hd,P.skin,{s:3,hatch:false});ink(ctx,hd,2.2);
  line(ctx,[[30,48],[12,22]],3.2,P.ink);line(ctx,[[30,48],[34,56]],1.6,P.brass);}
function drawAttHead(ctx,W,H){
  const sk=P.skin,hc=mix(P.case,P.leaf,0.45),hd=mix(hc,P.ink,0.35);
  const nk=path([[88,206],[90,166],[110,166],[112,206]],{smooth:false,jit:0.6});cel(ctx,nk,sk,{s:4,hatch:false});ink(ctx,nk,2.6);
  // the Gibson pompadour: a soft wide cloud swept up and back off the face, a knot on top
  const cloud=path([[56,132],[44,108],[42,78],[56,50],[80,32],[100,28],[120,32],[144,50],[158,78],[156,108],[144,132],[136,104],[100,90],[64,104]],{jit:1});
  cel(ctx,cloud,hc,{s:8,ra:0.4,ha:0.22});ctx.save();ctx.clip(cloud);for(let i=0;i<11;i++){const a=Math.PI*(0.08+i*0.084);const x0=100+Math.cos(a+Math.PI)*42,y0=120-Math.sin(a)*24;line(ctx,[[x0,y0],[100+Math.cos(a+Math.PI)*30,74-Math.sin(a)*20],[100+Math.cos(a+Math.PI)*12,40]],1.4,hd,0.6);}ctx.restore();ink(ctx,cloud,3);
  const knot=path(ell(100,26,20,12,12,0.06));cel(ctx,knot,hc,{s:4,hatch:false,ra:0.4});spiral(ctx,100,26,9,1.4,hd,0.7);ink(ctx,knot,2.6);
  line(ctx,[[146,64],[172,36]],3.2,P.scarfB);line(ctx,[[146,64],[144,68]],2.2,P.ink);line(ctx,[[172,36],[175,32]],2,P.ink);
  const f=path([[100,88],[124,94],[138,114],[136,144],[122,166],[100,174],[78,166],[64,144],[62,114],[76,94]],{jit:0.4});cel(ctx,f,sk,{s:7,ha:0.18});
  // the hair's front edge swept up from the forehead
  ctx.save();ctx.clip(f);const fr=path([[60,112],[70,92],[100,84],[130,92],[140,112],[124,100],[100,96],[76,100]],{jit:0.6});fill(ctx,fr,hc);ctx.restore();
  ink(ctx,f,3.4);
  for(const sx of [-1,1]){line(ctx,[[100+sx*10,108],[100+sx*19,104],[100+sx*28,107]],2.2);line(ctx,[[100+sx*11,122],[100+sx*25,122]],1.2,P.ink,0.5);fill(ctx,path(ell(100+sx*24,140,8,5,8,0.1)),hexA('#c0605a',0.18));}
  line(ctx,[[100,124],[102,142],[97,146]],1.6,P.ink,0.6);const lip=path([[91,154],[100,151],[109,154],[100,159]]);fill(ctx,lip,mix(P.skin,P.scarfA,0.2));ink(ctx,lip,1.3);}
function drawAttEyes(ctx){for(const x of [22,58]){fill(ctx,path(ell(x,12,5,6,10,0.02)),P.ink);dot(ctx,x+1.5,10,1.4,P.paper);}}

/* ================= THE ROOMS ================= */
function drawFloor(ctx,W,H){
  ctx.fillStyle=P.woodDark;ctx.fillRect(0,0,W,H);const rows=10,rh=H/rows;
  for(let r=0;r<rows;r++){let x=-rr(0,300);const y=r*rh;
    while(x<W){const w=rr(260,520),c=mix(P.wood,P.woodDark,rr(0,0.55));
      for(const ox of [0,W]){const bx=x+ox-(x+ox>W?W:0);ctx.fillStyle=c;ctx.fillRect(bx+1,y+1,w-2,rh-2);
        ctx.strokeStyle=hexA(P.ink,0.25);ctx.lineWidth=1;for(let k=0;k<3;k++){const gy=y+rr(6,rh-6);ctx.beginPath();ctx.moveTo(bx+4,gy);ctx.bezierCurveTo(bx+w*0.3,gy+rr(-3,3),bx+w*0.6,gy+rr(-3,3),bx+w-4,gy+rr(-2,2));ctx.stroke();}
        ctx.fillStyle=hexA(P.ink,0.7);ctx.fillRect(bx+w-2,y,3,rh);dot(ctx,bx+8,y+rh*0.3,2,P.ink);dot(ctx,bx+8,y+rh*0.7,2,P.ink);}
      x+=w;}
    ctx.fillStyle=hexA(P.ink,0.75);ctx.fillRect(0,y,W,2.5);}
  const g=ctx.createLinearGradient(0,0,W,0);for(let i=0;i<4;i++){ctx.fillStyle=hexA(P.paper,0.03);ctx.fillRect(rr(0,W),0,rr(40,120),H);}
}
function drawCut(ctx,W,H){ctx.fillStyle=P.ink;ctx.fillRect(0,0,W,H);ctx.fillStyle=P.wood;ctx.fillRect(0,0,W,20);for(let x=0;x<W;x+=64){ctx.fillStyle=hexA(P.ink,0.5);ctx.fillRect(x,0,2,20);}
  for(let x=40;x<W;x+=256){const j=box(x,22,44,H-30,1);fill(ctx,j,P.woodDark);hatch(ctx,j,{ang:0.8,gap:6,a:0.3,c:P.paper});ink(ctx,j,2);}line(ctx,[[0,20],[W,20]],3);ctx.fillStyle=P.plaster;ctx.fillRect(0,H-8,W,8);}
function drawSash(ctx,cx,top,w,h){
  const fr=box(cx-w/2-18,top-18,w+36,h+36,1.5);fill(ctx,fr,P.woodLight);shade(ctx,fr,0,top,0,top+h,0.4);ink(ctx,fr,3);
  const gl=box(cx-w/2,top,w,h,1);const g=ctx.createLinearGradient(0,top,0,top+h);g.addColorStop(0,P.skyTop);g.addColorStop(1,P.skyBot);ctx.fillStyle=g;ctx.fill(gl);
  ctx.save();ctx.clip(gl);
  ctx.fillStyle=mix(P.far,P.ink,0.3);ctx.beginPath();ctx.moveTo(cx-w/2,top+h);let x=cx-w/2;while(x<cx+w/2){const bw=rr(30,60),bh=rr(40,110);ctx.lineTo(x,top+h-bh);ctx.lineTo(x+bw*0.5,top+h-bh-rr(0,30));ctx.lineTo(x+bw,top+h-bh);x+=bw;}ctx.lineTo(cx+w/2,top+h);ctx.closePath();ctx.fill();
  const lx=cx+rr(-w*0.25,w*0.25),ly=top+h*0.62;const lg=ctx.createRadialGradient(lx,ly,0,lx,ly,36);lg.addColorStop(0,hexA(P.glow,0.9));lg.addColorStop(1,hexA(P.glow,0));ctx.fillStyle=lg;ctx.fillRect(lx-40,ly-40,80,80);
  for(let i=0;i<5;i++)if(R()<0.6){ctx.fillStyle=hexA(P.glowDim,0.8);ctx.fillRect(cx-w/2+rr(8,w-16),top+h-rr(20,60),6,9);}
  ctx.strokeStyle=hexA(P.paper,0.14);ctx.lineWidth=1.5;for(let i=0;i<40;i++){const rx=cx-w/2+rr(0,w),ry=top+rr(0,h);ctx.beginPath();ctx.moveTo(rx,ry);ctx.lineTo(rx-3,ry+rr(10,24));ctx.stroke();}
  ctx.restore();
  line(ctx,[[cx-w/2,top+h/2],[cx+w/2,top+h/2]],9,P.woodLight);line(ctx,[[cx,top],[cx,top+h]],5,P.woodLight);for(const k of [0.25,0.75])line(ctx,[[cx-w/2,top+h*k],[cx+w/2,top+h*k]],4,P.woodLight);
  ink(ctx,gl,3);const sill=box(cx-w/2-30,top+h+16,w+60,16,1);fill(ctx,sill,P.woodLight);ink(ctx,sill,2.5);
  for(const sx of [-1,1]){const x0=cx+sx*(w/2+22);const ty=top+h*0.55;const cur=path([[x0-sx*34,top-34],[x0+sx*44,top-34],[x0+sx*40,top+h*0.2],[x0+sx*30,ty],[x0+sx*38,top+h*0.8],[x0+sx*48,top+h+44],[x0-sx*8,top+h+44],[x0+sx*4,top+h*0.8],[x0+sx*2,ty],[x0-sx*14,top+h*0.3]],{smooth:false,jit:1.5});
    fill(ctx,cur,P.felt);hatch(ctx,cur,{ang:1.45,gap:7,a:0.35});shade(ctx,cur,x0+sx*40,0,x0-sx*40,0,0.4);ink(ctx,cur,3);const tb=box(x0+sx*16-14,ty-6,28,12,1);fill(ctx,tb,P.brass);ink(ctx,tb,1.5);}
  line(ctx,[[cx-w/2-80,top-36],[cx+w/2+80,top-36]],6,P.brass);
}
function drawBackWall(room){return(ctx,W,H)=>{
  if(room.cellar)return drawCellarWall(room)(ctx,W,H);
  const wp=P.wallpapers[room.wp];ctx.fillStyle=wp;ctx.fillRect(0,0,W,H);
  ctx.save();const motif=mix(wp,P.paper,0.2);for(let y=64,r=0;y<520;y+=66,r++)for(let x=(r%2)*44;x<W+44;x+=88){ctx.globalAlpha=0.55;const f=path([[x,y-16],[x+9,y-4],[x+5,y+10],[x,y+16],[x-5,y+10],[x-9,y-4]]);fill(ctx,f,motif);dot(ctx,x-14,y+12,3,motif);dot(ctx,x+14,y+12,3,motif);}ctx.restore();
  for(let i=0;i<10;i++){const x=rr(0,W),len=rr(60,260);const g=ctx.createLinearGradient(0,40,0,40+len);g.addColorStop(0,hexA(P.ink,rr(0.15,0.3)));g.addColorStop(1,hexA(P.ink,0));ctx.fillStyle=g;ctx.fillRect(x,40,rr(8,30),len);}
  const gb=ctx.createLinearGradient(0,0,0,H);gb.addColorStop(0,hexA(P.ink,0.45));gb.addColorStop(0.3,hexA(P.ink,0));ctx.fillStyle=gb;ctx.fillRect(0,0,W,H);
  ctx.fillStyle=P.woodDark;ctx.fillRect(0,0,W,40);for(let x=8;x<W;x+=24){ctx.fillStyle=hexA(P.paper,0.12);ctx.fillRect(x,28,12,8);}line(ctx,[[0,40],[W,40]],3);
  line(ctx,[[0,118],[W,118]],7,P.woodLight);line(ctx,[[0,122],[W,122]],2);
  if(room.win!=null)drawSash(ctx,room.win,210,150,250);
  if(room.peel){const px=room.peel,py=150;const pe=path([[px,py],[px+70,py],[px+40,py+60]],{smooth:false,jit:1});fill(ctx,pe,P.plaster);ctx.save();ctx.globalAlpha=0.6;fill(ctx,path([[px,py],[px+40,py+60],[px+8,py+46]],{smooth:false}),mix(wp,P.ink,0.3));ctx.restore();ink(ctx,pe,2);}
  ctx.fillStyle=P.woodLight;ctx.fillRect(0,516,W,14);line(ctx,[[0,516],[W,516]],2.5);line(ctx,[[0,530],[W,530]],2.5);
  ctx.fillStyle=P.wood;ctx.fillRect(0,530,W,120);for(let x=10;x<W-60;x+=124)panel(ctx,x,542,112,84,P.wood);
  ctx.fillStyle=P.woodDark;ctx.fillRect(0,632,W,18);line(ctx,[[0,632],[W,632]],2.5);
  for(const dr of room.doors||[])drawDoor(ctx,dr);
}}
function drawDoor(ctx,dr){{const dx=dr.x;const df=box(dx-86,196,172,454,1.5);fill(ctx,df,P.woodLight);ink(ctx,df,3);const d=box(dx-70,212,140,438,1);fill(ctx,d,P.wood);shade(ctx,d,dx-70,0,dx+70,0,0.35);
    const tr=box(dx-70,150,140,40,1);fill(ctx,tr,mix(P.glowDim,P.ink,0.35));for(let k=1;k<4;k++)line(ctx,[[dx-70+k*35,150],[dx-70+k*35,190]],2.5,P.woodLight);ink(ctx,tr,2.5);
    const fg=box(dx-52,236,104,140,1);fill(ctx,fg,mix(P.paper,P.glowDim,0.45));txt(ctx,dr.label,dx,300,20,{font:FT,c:P.ink,a:0.85,maxW:92});line(ctx,[[dx-30,316],[dx+30,316]],1.5,P.ink,0.5);txt(ctx,dr.sub,dx,338,14,{maxW:92,font:FT,c:P.ink,a:0.7});ink(ctx,fg,2.5);
    panel(ctx,dx-52,396,104,104,P.wood);panel(ctx,dx-52,510,104,116,P.wood);const kn=path(ell(dx+50,440,7,7,8,0.05));fill(ctx,kn,P.brass);ink(ctx,kn,1.6);ink(ctx,d,3);}}
function drawPartition(door){return(ctx,W,H)=>{
  const sh=path([[0,H],[0,H-140],[350,0],[W,0],[W,H]],{smooth:false,jit:1.5});const pc=mix(P.plaster,P.wood,0.25);fill(ctx,sh,pc);
  ctx.save();ctx.clip(sh);ctx.strokeStyle=hexA(P.ink,0.08);ctx.lineWidth=10;for(let x=0;x<W;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
  for(let i=0;i<8;i++){const x=rr(0,W),len=rr(60,300);const g=ctx.createLinearGradient(0,0,0,len);g.addColorStop(0,hexA(P.ink,0.2));g.addColorStop(1,hexA(P.ink,0));ctx.fillStyle=g;ctx.fillRect(x,0,rr(8,24),len);}
  ctx.fillStyle=P.woodLight;ctx.fillRect(0,516,W,14);ctx.fillStyle=P.wood;ctx.fillRect(0,530,W,120);for(let x=10;x<W-60;x+=124)panel(ctx,x,542,112,84,P.wood);ctx.fillStyle=P.woodDark;ctx.fillRect(0,632,W,18);
  const gb=ctx.createLinearGradient(0,0,0,H);gb.addColorStop(0,hexA(P.ink,0.4));gb.addColorStop(0.4,hexA(P.ink,0));ctx.fillStyle=gb;ctx.fillRect(0,0,W,H);
  ctx.restore();
  // the section cut: hatched poche along the top edge
  const cut=path([[0,H-140],[350,0],[W,0],[W,18],[362,18],[12,H-126],[0,H-126]],{smooth:false});fill(ctx,cut,mix(P.plaster,P.paper,0.4));hatch(ctx,cut,{ang:-0.8,gap:6,a:0.7,lw:1.6});
  ink(ctx,sh,4);
  if(door){const x0=400,x1=700,top=210;const fr=box(x0-26,top-34,x1-x0+52,H-top+34,1.5);fill(ctx,fr,P.woodLight);shade(ctx,fr,0,top-34,0,H,0.35);ink(ctx,fr,3);
    ctx.save();ctx.globalCompositeOperation='destination-out';ctx.fillRect(x0,top,x1-x0,H-top);ctx.restore();}
}}
function drawSign(text,size){return(ctx,W,H)=>{const b=box(6,6,W-12,H-12,1.5);fill(ctx,b,P.woodDark);ctx.save();ctx.strokeStyle=P.brass;ctx.lineWidth=2.5;ctx.strokeRect(18,16,W-36,H-32);ctx.restore();ctx.font=`${size}px ${FD}`;const fs=Math.min(size,size*(W-90)/ctx.measureText(text).width);txt(ctx,text,W/2,H/2+fs*0.34,fs,{c:P.brass});for(const sx of [-1,1])dot(ctx,W/2+sx*(W/2-30),H/2,4,P.brass);ink(ctx,b,3);}}
/* furniture and exhibits */
function vitrineFrame(ctx,felt,contents,label){
  for(const x of [40,260]){const l=box(x-8,170,16,90,1);fill(ctx,l,P.wood);ink(ctx,l,2.5);}const st=box(40,230,220,10,1);fill(ctx,st,P.woodDark);ink(ctx,st,2);
  const base=box(20,126,260,50,1);fill(ctx,base,P.wood);shade(ctx,base,0,126,0,176,0.35);ink(ctx,base,3);
  for(const x of [34,156]){const d=box(x,134,110,32,1);fill(ctx,d,mix(P.wood,P.woodLight,0.2));ink(ctx,d,2);dot(ctx,x+55,150,4,P.brass);}
  const gl=box(20,40,260,88,1);fill(ctx,gl,felt);ctx.save();ctx.clip(gl);contents(ctx);
  ctx.fillStyle='rgba(170,200,215,0.10)';ctx.fillRect(0,0,300,260);ctx.strokeStyle='rgba(255,255,255,0.22)';ctx.lineWidth=16;ctx.beginPath();ctx.moveTo(90,30);ctx.lineTo(50,140);ctx.moveTo(220,30);ctx.lineTo(196,140);ctx.stroke();ctx.restore();
  ink(ctx,gl,3);for(const b of [box(14,32,272,10,1),box(14,32,10,98,1),box(276,32,10,98,1)]){fill(ctx,b,P.woodLight);ink(ctx,b,2);}
  if(label){const lb=box(60,106,180,20,0.6);fill(ctx,lb,P.paper);txt(ctx,label,150,121,13,{font:FT,maxW:168});ink(ctx,lb,1.6);}
}
function drawVitrine(kind){return ctx=>{
  if(kind==='minerals')vitrineFrame(ctx,mix(P.felt,P.ink,0.2),c=>{
    for(let i=0;i<5;i++){const x=58+i*6,h=rr(26,40);const cr=path([[x-6,104],[x-5,104-h],[x,104-h-8],[x+5,104-h],[x+6,104]],{smooth:false});fill(c,cr,mix('#7a4a9a',P.paper,rr(0,0.3)));ink(c,cr,1.5);}
    const ag=ell(130,86,24,18,14,0.05);for(let k=0;k<5;k++){const p=path(ell(130,86,24-k*4,18-k*3.4,14,0.04));fill(c,p,k%2?mix('#b85a3a',P.paper,0.35):mix('#7a3a2a',P.paper,0.15));}ink(c,path(ag),2);
    for(let k=0;k<14;k++){const a=-Math.PI+k/13*Math.PI;line(c,[[196,100],[196+Math.cos(a)*28,100+Math.sin(a)*24]],2,P.paper,0.9);}dot(c,196,100,6,P.paper);
    for(const[x,y] of [[240,94],[86,62],[166,60],[226,62]]){const r=path(ell(x,y,rr(9,15),rr(7,11),9,0.2));fill(c,r,mix(P.stone,P.paper,rr(0,0.4)));ink(c,r,1.5);const t=box(x-8,y+10,16,8,0.4);fill(c,t,P.paper);}
    txt(c,'906',166,82,9,{font:FT,c:P.paper});
  },'MINERALS · N.S. · GESNER');
  if(kind==='insects')vitrineFrame(ctx,mix(P.paper,P.glowDim,0.35),c=>{
    for(const[x,y,r] of [[70,82,1],[150,78,-1],[228,84,1]]){const sl=path(ell(x,y,36,26,10,0.2));fill(c,sl,mix(P.stoneDark,P.stone,0.4));ink(c,sl,2);
      const w=path(ell(x,y,22,8,12,0.03,r*0.3));fill(c,w,mix(P.stone,P.paper,0.35));c.save();c.clip(w);for(let k=0;k<6;k++)line(c,[[x-22,y-6+k*2.5],[x+22,y-8+k*3]],1,P.ink,0.6);c.restore();ink(c,w,1.4);
      line(c,[[x+20,y-20],[x+20,y-2]],1.4,P.brass);dot(c,x+20,y-21,2.5,P.brass);const t=box(x-14,y+18,28,8,0.4);fill(c,t,P.paper);}
  },'FOSSIL INSECTS · DEVONIAN');
  if(kind==='trilobites')vitrineFrame(ctx,mix(P.felt,P.stoneDark,0.5),c=>{
    for(const[x,y,s] of [[74,84,1],[156,82,1.25],[232,86,0.85]]){const sl=box(x-36*s,y-30*s,72*s,60*s,2);fill(c,sl,mix(P.stoneDark,P.ink,0.2));ink(c,sl,1.8);
      const tc=mix(P.stone,P.paper,0.3);const cep=path([[x-20*s,y-6*s],[x-14*s,y-18*s],[x,y-22*s],[x+14*s,y-18*s],[x+20*s,y-6*s],[x+24*s,y+10*s],[x+12*s,y-4*s],[x-12*s,y-4*s],[x-24*s,y+10*s]]);fill(c,cep,tc);ink(c,cep,1.4);
      for(let k=0;k<6;k++){line(c,[[x-12*s+k*0.6*s,y-2*s+k*3.6*s],[x+12*s-k*0.6*s,y-2*s+k*3.6*s]],1.6,tc);}line(c,[[x,y-2*s],[x,y+20*s]],3*s,tc);line(c,[[x-10*s,y-3*s],[x-11*s,y+18*s]],1,P.ink,0.6);line(c,[[x+10*s,y-3*s],[x+11*s,y+18*s]],1,P.ink,0.6);}
  },'PARADOXIDES · CAMBRIAN');
};}
function drawCabinet(kind){return(ctx,W,H)=>{
  const cr=box(0,0,W,34,1.5);fill(ctx,cr,P.woodDark);ink(ctx,cr,3);
  const body=box(12,30,W-24,H-52,1.5);fill(ctx,body,P.wood);shade(ctx,body,0,30,0,H,0.3);ink(ctx,body,3);
  const gl=box(32,50,W-64,370,1);fill(ctx,gl,mix(P.woodDark,P.ink,0.35));ctx.save();ctx.clip(gl);
  for(const y of [160,272,384]){ctx.fillStyle=P.woodLight;ctx.fillRect(32,y,W-64,8);}
  if(kind==='rocks'){for(const y of [160,272,384])for(let x=50;x<W-60;x+=rr(30,44)){const r=path(ell(x+10,y-12,rr(9,15),rr(7,13),9,0.2));fill(ctx,r,mix(P.stone,R()<0.3?'#7a4a9a':P.paper,rr(0,0.35)));ink(ctx,r,1.5);const t=box(x+2,y-4,18,7,0.4);fill(ctx,t,P.paper);}}
  if(kind==='birds'){
    // passenger pigeon: slim, long pointed tail, rosy breast
    ctx.save();ctx.translate(140,150);line(ctx,[[-40,6],[40,6]],4,P.woodLight);const pg=path([[-30,-24],[-18,-36],[-6,-34],[0,-24],[14,-18],[60,-6],[64,-2],[14,-2],[-10,2],[-26,-6]]);fill(ctx,pg,mix('#7b8794',P.paper,0.15));
    const br=path([[-26,-20],[-6,-22],[4,-8],[-12,0],[-26,-6]]);fill(ctx,br,mix('#b06a52',P.paper,0.15));dot(ctx,-20,-30,2.5,P.glow);line(ctx,[[-32,-28],[-40,-26]],2.5);ink(ctx,pg,2);line(ctx,[[-10,2],[-12,6]],1.5);ctx.restore();
    // Labrador duck: black body, white head and neck with a black crown stripe
    ctx.save();ctx.translate(130,262);line(ctx,[[-44,6],[44,6]],4,P.woodLight);const dk=path([[-20,-34],[-6,-38],[2,-30],[4,-18],[30,-16],[50,-8],[40,2],[-6,2],[-16,-10],[-14,-24]]);fill(ctx,dk,mix(P.ink,P.stoneDark,0.3));
    const hd=path([[-20,-34],[-6,-38],[2,-30],[4,-18],[-12,-14],[-16,-24]]);fill(ctx,hd,P.paper);line(ctx,[[-16,-36],[0,-34]],3,P.ink);const wg=path(ell(18,-12,12,5,8,0.05));fill(ctx,wg,P.paper);
    const bl=path([[-20,-30],[-34,-26],[-20,-24]]);fill(ctx,bl,mix(P.stone,P.ink,0.4));dot(ctx,-10,-30,2,P.ink);ink(ctx,dk,2);ctx.restore();
    for(let i=0;i<4;i++){ctx.save();ctx.translate(70+i*50,372);const sb=path(ell(0,-12,14,9,10,0.1));fill(ctx,sb,mix(P.case,P.paper,rr(0,0.4)));const hd2=path(ell(-10,-20,6,6,8,0.05));fill(ctx,hd2,mix(P.case,P.ink,0.2));line(ctx,[[-16,-20],[-22,-19]],1.6);ink(ctx,sb,1.6);ctx.restore();}
    for(const[x,y] of [[118,158],[110,270]]){const t=box(x,y,46,10,0.4);fill(ctx,t,P.paper);}
  }
  ctx.fillStyle='rgba(170,200,215,0.08)';ctx.fillRect(0,0,W,H);ctx.strokeStyle='rgba(255,255,255,0.16)';ctx.lineWidth=18;ctx.beginPath();ctx.moveTo(W*0.6,40);ctx.lineTo(W*0.3,430);ctx.stroke();ctx.restore();
  line(ctx,[[W/2,50],[W/2,420]],6,P.woodLight);ink(ctx,gl,3);
  panel(ctx,32,436,W/2-38,86,P.wood);panel(ctx,W/2+6,436,W/2-38,86,P.wood);dot(ctx,W/2,476,4,P.brass);
  for(const x of [16,W-36]){const f=box(x,H-24,20,22,1);fill(ctx,f,P.woodDark);ink(ctx,f,2);}
}}
function drawPortrait(ctx,W,H){
  const fr=box(6,6,W-12,H-12,1.5);fill(ctx,fr,P.brass);shade(ctx,fr,0,0,W,H,0.45);hatch(ctx,fr,{ang:0.8,gap:5,a:0.25});ink(ctx,fr,3);
  const cv2=box(30,30,W-60,H-84,1);const g=ctx.createRadialGradient(W/2,90,10,W/2,120,180);g.addColorStop(0,mix(P.case,P.glowDim,0.3));g.addColorStop(1,mix(P.woodDark,P.ink,0.5));ctx.fillStyle=g;ctx.fill(cv2);ctx.save();ctx.clip(cv2);
  const coat=path([[40,H-50],[50,180],[80,160],[140,160],[170,180],[180,H-50]]);fill(ctx,coat,mix(P.ink,P.coat,0.5));
  const shirt=path([[92,162],[110,196],[128,162],[122,152],[98,152]]);fill(ctx,shirt,mix(P.paper,P.glowDim,0.15));const cr=path(ell(110,166,14,8,10,0.1));fill(ctx,cr,mix(P.paper,P.glowDim,0.2));
  const face=path(ell(110,112,30,38,16,0.04));fill(ctx,face,mix(P.skin,P.glowDim,0.3));shade(ctx,face,140,0,80,0,0.35);
  const hair=path([[78,104],[80,78],[96,68],[124,68],[140,80],[142,104],[134,90],[112,82],[88,92]]);fill(ctx,hair,mix(P.case,P.ink,0.55));
  for(const sx of [-1,1]){const wh=path([[110+sx*28,100],[110+sx*31,128],[110+sx*22,142],[110+sx*24,118]]);fill(ctx,wh,mix(P.case,P.ink,0.5));}
  dot(ctx,100,110,2.6,P.ink);dot(ctx,120,110,2.6,P.ink);line(ctx,[[110,112],[112,126],[106,128]],1.6,P.ink,0.6);line(ctx,[[102,136],[118,136]],1.8,P.ink,0.7);
  ctx.strokeStyle=hexA(P.ink,0.25);ctx.lineWidth=0.8;for(let i=0;i<30;i++){const x=rr(30,W-30),y=rr(30,H-54);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+rr(-12,12),y+rr(-12,12));ctx.stroke();}
  ctx.restore();ink(ctx,cv2,2.5);
  const pl=box(W/2-60,H-46,120,24,1);fill(ctx,pl,mix(P.brass,P.paper,0.2));txt(ctx,'ABRAHAM GESNER',W/2,H-29,14,{c:P.ink,maxW:108});ink(ctx,pl,1.8);
}
function drawFernSlab(ctx,W,H){
  const fr=box(6,6,W-12,H-52,1.5);fill(ctx,fr,P.wood);ink(ctx,fr,3);
  const sl=path([[26,30],[120,22],[230,34],[W-26,26],[W-22,120],[W-30,H-66],[200,H-60],[90,H-70],[24,H-64],[30,140]],{smooth:false,jit:2});fill(ctx,sl,mix(P.stoneDark,P.ink,0.3));mottle(ctx,sl,P.stone,0.15,20,20);
  const fc=mix(P.paper,P.stone,0.45);
  for(const[x0,y0,a,len] of [[70,H-80,-1.2,150],[190,H-76,-1.45,140]]){const pts=[];for(let i=0;i<=12;i++){const k=i/12;pts.push([x0+Math.cos(a+k*0.35)*len*k,y0+Math.sin(a+k*0.35)*len*k]);}line(ctx,pts,2.5,fc);
    for(let i=1;i<12;i++){const[x,y]=pts[i];const s=(1-i/12)*16+4;for(const sx of [-1,1]){ctx.save();ctx.translate(x,y);ctx.rotate(a+sx*1.2);const pn=path(ell(s*0.6,0,s*0.6,s*0.22,8,0.05));fill(ctx,pn,fc);ctx.restore();}}}
  for(let i=0;i<4;i++){const x=270+i*16;line(ctx,[[x,H-70],[x+rr(-8,8),50]],5,mix(fc,P.stoneDark,0.3));}
  const cal=box(300,60,26,110,1);fill(ctx,cal,mix(fc,P.stoneDark,0.2));for(let y=62;y<170;y+=6)line(ctx,[[302,y],[324,y]],1,P.ink,0.4);line(ctx,[[300,100],[326,100]],2.5,P.ink,0.7);
  ink(ctx,sl,3);
  const lb=box(W/2-150,H-42,300,32,1);fill(ctx,lb,P.paper);txt(ctx,'FERN LEDGES, LANCASTER · C. F. HARTT',W/2,H-20,15,{font:FT,maxW:284});ink(ctx,lb,2);
}
function drawLampPed(ctx,W,H){
  const base=box(30,H-24,80,22,1);fill(ctx,base,P.woodDark);ink(ctx,base,2.5);const sh=path([[50,H-24],[54,150],[86,150],[90,H-24]],{smooth:false,jit:1});fill(ctx,sh,P.wood);shade(ctx,sh,86,0,50,0,0.45);for(let k=0;k<3;k++)line(ctx,[[60+k*10,154],[58+k*12,H-28]],1.4,P.ink,0.4);ink(ctx,sh,2.5);
  const top=box(28,138,84,14,1);fill(ctx,top,P.woodDark);ink(ctx,top,2.5);
  const ft=path(ell(70,112,30,22,16,0.03));fill(ctx,ft,mix(P.glowDim,P.paper,0.35));ctx.save();ctx.globalAlpha=0.5;fill(ctx,path([[42,116],[98,116],[94,128],[46,128]]),mix(P.glow,P.case,0.4));ctx.restore();ink(ctx,ft,2.5);
  const ftb=box(52,128,36,10,1);fill(ctx,ftb,P.brass);ink(ctx,ftb,2);const col=box(56,84,28,10,1);fill(ctx,col,P.brass);ink(ctx,col,2);
  const ch=path([[60,84],[56,62],[50,52],[56,40],[62,10],[78,10],[84,40],[90,52],[84,62],[80,84]],{jit:0.4});ctx.save();ctx.globalAlpha=0.35;fill(ctx,ch,P.paper);ctx.restore();
  const fl=path([[64,72],[70,50],[76,72],[70,78]]);fill(ctx,fl,P.glow);ink(ctx,ch,2);
}
function drawDesk(ctx,W,H){
  const top=box(0,64,W,22,1.5);const front=box(14,84,W-28,H-90,1.5);fill(ctx,front,P.wood);shade(ctx,front,0,84,0,H,0.4);ink(ctx,front,3);
  for(let i=0;i<3;i++)panel(ctx,34+i*((W-68)/3),110,(W-68)/3-14,H-140,P.wood);
  fill(ctx,top,P.woodLight);ink(ctx,top,3);
  ctx.save();ctx.translate(196,62);const bk=path([[-56,0],[-50,-16],[0,-10],[50,-16],[56,0]],{smooth:false,jit:0.8});fill(ctx,bk,P.paper);line(ctx,[[0,-10],[0,0]],2);for(let k=0;k<3;k++){line(ctx,[[-44,-10+k*3.5],[-8,-6+k*3.5]],1,P.ink,0.5);line(ctx,[[8,-6+k*3.5],[44,-10+k*3.5]],1,P.ink,0.5);}ink(ctx,bk,2);ctx.restore();
  const iw=box(238,46,20,18,1);fill(ctx,iw,P.ink);ink(ctx,iw,1.5);line(ctx,[[252,48],[270,18]],2.5,P.paper);
  const bell=new Path2D();bell.arc(320,62,16,Math.PI,0);bell.closePath();fill(ctx,bell,P.brass);ink(ctx,bell,2);dot(ctx,320,44,4,P.brass);
  ctx.save();ctx.translate(374,48);ctx.rotate(-0.06);const sg=box(-38,-15,76,30,1);fill(ctx,sg,P.paper);txt(ctx,'INQUIRIES',0,5,13,{font:FT,maxW:66});ink(ctx,sg,1.8);ctx.restore();
}

function drawNotice(ctx,W,H){
  const fr=box(6,6,W-12,H-12,1.5);fill(ctx,fr,P.wood);ink(ctx,fr,3);const ck=box(22,22,W-44,H-44,1);fill(ctx,ck,mix(P.coat2,P.case,0.4));mottle(ctx,ck,P.ink,0.2,40,4);ink(ctx,ck,2);
  ctx.save();ctx.translate(W/2,104);ctx.rotate(-0.02);const n=box(-86,-74,172,150,1.5);fill(ctx,n,P.paper);
  ['NATURAL HISTORY','SOCIETY','OF NEW BRUNSWICK'].forEach((l,i)=>txt(ctx,l,0,-44+i*22,i===1?18:15,{c:P.ink}));line(ctx,[[-60,14],[60,14]],1.5);txt(ctx,'MUSEUM',0,42,24,{c:P.ink});txt(ctx,'Founded 1862',0,64,13,{font:FT,c:P.ink,a:0.8});ink(ctx,n,2);dot(ctx,0,-68,4,P.scarfA);ctx.restore();
  for(const[x,y,r] of [[70,226,0.12],[176,236,-0.08]]){ctx.save();ctx.translate(x,y);ctx.rotate(r);const s=box(-40,-28,80,56,1);fill(ctx,s,mix(P.paper,P.glowDim,0.2));for(let k=0;k<4;k++)line(ctx,[[-30,-14+k*10],[rr(10,30),-14+k*10]],1.4,P.ink,0.5);ink(ctx,s,1.8);dot(ctx,0,-24,3.5,P.brass);ctx.restore();}
}
function drawLectern(ctx,W,H){
  const ft=box(20,H-18,100,16,1);fill(ctx,ft,P.woodDark);ink(ctx,ft,2.5);const post=box(60,110,20,H-128,1);fill(ctx,post,P.wood);shade(ctx,post,80,0,60,0,0.4);ink(ctx,post,2.5);
  const tp=path([[10,104],[130,80],[134,96],[14,120]],{smooth:false,jit:0.8});fill(ctx,tp,P.woodLight);ink(ctx,tp,2.5);
  const bk=path([[18,98],[70,74],[124,80],[124,86],[70,82],[18,104]],{smooth:false,jit:0.6});fill(ctx,bk,P.paper);line(ctx,[[70,76],[70,82]],1.6);for(let k=0;k<3;k++){line(ctx,[[28,96-k*4],[62,82-k*4]],1,P.ink,0.5);line(ctx,[[80,80-k*2],[116,82-k*2]],1,P.ink,0.5);}ink(ctx,bk,2);
  line(ctx,[[120,86],[126,140],[118,150]],1.2,P.ink,0.8);line(ctx,[[118,150],[106,170]],2.5,P.paper);
}
function drawCaribou(ctx,W,H){
  const pl=box(30,H-80,W-60,76,1.5);fill(ctx,pl,P.wood);shade(ctx,pl,0,H-80,0,H,0.4);ink(ctx,pl,3);const pq=box(W/2-100,H-60,200,32,1);fill(ctx,pq,P.brass);txt(ctx,'WOODLAND CARIBOU',W/2,H-45,14,{maxW:184});txt(ctx,'RANGIFER TARANDUS',W/2,H-33,10,{font:FT,maxW:184});ink(ctx,pq,1.8);
  const fur=mix(P.case,P.stone,0.25),furD=mix(P.case,P.ink,0.35),pale=mix(P.paper,P.case,0.15);const gy=H-80;
  for(const[x,lean,dark] of [[200,0.05,1],[352,-0.04,1],[222,-0.02,0],[372,0.05,0]]){const lg=path([[x-10,250],[x+10,250],[x+8+lean*60,gy-26],[x+14+lean*60,gy-4],[x-10+lean*60,gy-4],[x-6+lean*60,gy-26]],{smooth:false,jit:1});fill(ctx,lg,dark?furD:fur);ink(ctx,lg,2.5);const hf=box(x-12+lean*60,gy-10,26,10,1);fill(ctx,hf,P.ink);}
  const body=path([[170,214],[200,184],[290,176],[370,182],[410,206],[408,250],[380,270],[300,274],[210,270],[176,250]]);fill(ctx,body,fur);fill(ctx,path([[200,262],[300,272],[380,266],[372,250],[300,256],[210,250]]),pale);shade(ctx,body,0,180,0,274,0.35);hatch(ctx,body,{ang:1.3,gap:7,a:0.25});ink(ctx,body,3.5);
  const neck=path([[176,240],[150,200],[128,150],[150,126],[176,150],[206,190]]);fill(ctx,neck,pale);hatch(ctx,neck,{ang:1.0,gap:6,a:0.2});
  for(let k=0;k<6;k++)line(ctx,[[150+k*6,200+k*6],[140+k*6,226+k*4]],2,P.paper,0.9);ink(ctx,neck,3);
  const head=path([[150,130],[132,120],[96,138],[76,150],[80,164],[112,164],[136,160],[158,150]]);fill(ctx,head,furD);shade(ctx,head,80,0,150,0,0.3);ink(ctx,head,3);dot(ctx,120,140,3.5,P.ink);dot(ctx,84,154,3,P.ink);
  const ear=path([[150,128],[170,112],[160,132]],{smooth:false});fill(ctx,ear,furD);ink(ctx,ear,2);
  // caribou antlers: long beams sweeping back and up, then forward, with flattened tops and a shovel over the face
  const ant=mix(P.paper,P.case,0.3);const antP=[];
  const beam=(dx,w)=>{const b=[[144+dx,122],[160+dx,98],[190+dx,74],[204+dx,48],[196+dx,30],[180+dx,24]];antP.push({b,w});
    for(const[a,c] of [[[160+dx,98],[146+dx,76]],[[190+dx,74],[220+dx,66]],[[204+dx,48],[228+dx,40]]])antP.push({b:[a,c],w:w*0.7});
    antP.push({palm:[[166+dx,26],[176+dx,14],[186+dx,22],[196+dx,10],[204+dx,24],[198+dx,36],[178+dx,34]]});};
  beam(14,8);beam(0,10);
  for(const p of antP){if(p.b){line(ctx,p.b,p.w+4,P.ink);}}for(const p of antP){if(p.b)line(ctx,p.b,p.w,ant);else{const q=path(p.palm);fill(ctx,q,ant);ink(ctx,q,2);}}
  const sv=path([[138,120],[118,98],[96,92],[90,104],[104,108],[118,118]]);fill(ctx,sv,ant);ink(ctx,sv,2.5);
  const tl=path([[404,206],[420,200],[416,214]],{smooth:false});fill(ctx,tl,pale);ink(ctx,tl,2);
}
function drawMoose(ctx,W,H){
  const sh=path([[40,40],[W-40,40],[W-30,140],[W/2,H-14],[30,140]],{jit:1.5});fill(ctx,sh,P.wood);shade(ctx,sh,0,40,0,H,0.4);ink(ctx,sh,3);
  // bull moose: wide flat (palmate) antlers with points along the edge, long head, heavy overhanging nose
  const ac=mix(P.paper,P.case,0.3),cx=W/2;
  for(const sx of [-1,1]){const pts=[[cx+sx*24,74],[cx+sx*52,72]];for(let i=0;i<6;i++){const a=-0.15-i*0.27;pts.push([cx+sx*(52+Math.cos(a)*44+8),80+Math.sin(a)*52-(i%2?0:10)]);}pts.push([cx+sx*56,40],[cx+sx*44,62],[cx+sx*28,70]);
    const pal=path(pts,{smooth:false,jit:1});fill(ctx,pal,ac);hatch(ctx,pal,{ang:0.5,gap:6,a:0.2});ink(ctx,pal,2.5);}
  const hd=path([[cx-26,66],[cx+26,66],[cx+24,120],[cx+26,160],[cx+32,182],[cx+18,196],[cx-18,196],[cx-32,182],[cx-26,160],[cx-24,120]]);fill(ctx,hd,mix(P.case,P.ink,0.4));shade(ctx,hd,cx+30,0,cx-30,0,0.35);hatch(ctx,hd,{ang:1.4,gap:6,a:0.2});ink(ctx,hd,3);
  for(const sx of [-1,1]){const ear=path([[cx+sx*24,74],[cx+sx*46,82],[cx+sx*30,90]],{smooth:false});fill(ctx,ear,mix(P.case,P.ink,0.4));ink(ctx,ear,2);}
  dot(ctx,cx-16,100,3.5,P.glowDim);dot(ctx,cx+16,100,3.5,P.glowDim);dot(ctx,cx-10,186,3.5,P.ink);dot(ctx,cx+10,186,3.5,P.ink);line(ctx,[[cx-12,166],[cx+12,166]],1.6,P.ink,0.5);
}
function drawMothTable(ctx,W,H){
  const top=path(ell(W/2,130,70,10,16,0.02));const leg=box(W/2-8,136,16,H-160,1);fill(ctx,leg,P.wood);ink(ctx,leg,2);const ft=box(W/2-40,H-24,80,18,1);fill(ctx,ft,P.woodDark);ink(ctx,ft,2);fill(ctx,top,P.woodLight);ink(ctx,top,2.5);
  const tin=box(40,70,52,56,1);fill(ctx,tin,P.scarfA);const lb=box(44,84,44,26,0.6);fill(ctx,lb,P.paper);txt(ctx,'NAPH-',66,96,9,{font:FT});txt(ctx,'THALENE',66,106,9,{font:FT});ink(ctx,tin,2);
  const jar=path([[106,128],[104,70],[112,60],[140,60],[148,70],[146,128]],{smooth:false,jit:0.6});ctx.save();ctx.globalAlpha=0.35;fill(ctx,jar,P.paper);ctx.restore();for(let i=0;i<9;i++)dot(ctx,114+(i%3)*12,120-(i/3|0)*12,5,P.paper);ink(ctx,jar,2);const lid=box(108,52,36,10,1);fill(ctx,lid,P.brass);ink(ctx,lid,1.6);
}
function drawBench(ctx,W,H){for(const x of [24,W-40]){const l=box(x,6,16,H-10,1);fill(ctx,l,P.woodDark);ink(ctx,l,2.5);}
  const bk=box(20,4,W-40,56,1.5);fill(ctx,bk,P.wood);for(let x=34;x<W-60;x+=58)panel(ctx,x,12,48,40,P.wood);ink(ctx,bk,2.5);
  const st=box(10,60,W-20,16,1);fill(ctx,st,P.woodLight);ink(ctx,st,2.5);const ap=box(16,76,W-32,12,1);fill(ctx,ap,P.woodDark);ink(ctx,ap,2);
  const cu=box(30,52,W-60,10,1);fill(ctx,cu,P.felt);ink(ctx,cu,2);}
function drawStand(ctx,W,H){const u=[[30,10,-0.1],[56,24,0.12]];for(const[x,y,r] of u){ctx.save();ctx.translate(x,y);ctx.rotate(r);line(ctx,[[0,0],[0,90]],3,P.ink);const c=path([[-12,30],[0,20],[12,30],[6,90],[-6,90]]);fill(ctx,c,P.coat);ink(ctx,c,2);curl(ctx,0,0,-Math.PI/2,6,3,P.ink);ctx.restore();}
  const pot=path([[14,90],[76,90],[70,H-6],[20,H-6]],{smooth:false,jit:1});fill(ctx,pot,mix(P.scarfA,P.ink,0.3));for(let y=104;y<H-10;y+=18)line(ctx,[[18,y],[72,y]],2,P.brass,0.8);ink(ctx,pot,2.5);}
function drawRug(ctx,W,H){const b=box(10,10,W-20,H-20,2);fill(ctx,b,P.rug);ctx.save();ctx.strokeStyle=mix(P.scarfB,P.rug,0.4);ctx.lineWidth=14;ctx.strokeRect(34,34,W-68,H-68);ctx.strokeStyle=mix(P.ink,P.rug,0.3);ctx.lineWidth=5;ctx.strokeRect(54,54,W-108,H-108);ctx.restore();
  const md=path([[W/2,H/2-90],[W/2+130,H/2],[W/2,H/2+90],[W/2-130,H/2]],{smooth:false});fill(ctx,md,mix(P.scarfA,P.rug,0.35));ink(ctx,md,2);const md2=path([[W/2,H/2-44],[W/2+64,H/2],[W/2,H/2+44],[W/2-64,H/2]],{smooth:false});fill(ctx,md2,mix(P.scarfB,P.rug,0.5));ink(ctx,md2,2);
  mottle(ctx,b,P.paper,0.08,20,40);for(let x=14;x<W-14;x+=8){line(ctx,[[x,10],[x,0]],1.5,P.scarfB,0.7);line(ctx,[[x,H-10],[x,H]],1.5,P.scarfB,0.7);}ink(ctx,b,2);}
function drawClock(ctx,W,H){const cs=path([[20,10],[W-20,10],[W-12,40],[W-12,H-30],[W/2,H-6],[12,H-30],[12,40]],{jit:1});fill(ctx,cs,P.wood);shade(ctx,cs,W,0,0,0,0.4);ink(ctx,cs,3);
  const d=path(ell(W/2,70,40,40,20,0.01));fill(ctx,d,P.paper);for(let i=0;i<12;i++){const a=i/12*TAU;line(ctx,[[W/2+Math.cos(a)*32,70+Math.sin(a)*32],[W/2+Math.cos(a)*37,70+Math.sin(a)*37]],i%3?1.6:3);}
  const ha=-Math.PI/2+(9+5/60)/12*TAU,ma=-Math.PI/2+5/60*TAU;line(ctx,[[W/2,70],[W/2+Math.cos(ha)*20,70+Math.sin(ha)*20]],3.5);line(ctx,[[W/2,70],[W/2+Math.cos(ma)*30,70+Math.sin(ma)*30]],2.2);ink(ctx,d,2.5);
  const pw=box(W/2-24,124,48,H-170,1);fill(ctx,pw,mix(P.glass,P.woodDark,0.5));ink(ctx,pw,2);}
function drawPendulum(ctx,W,H){line(ctx,[[W/2,0],[W/2,H-24]],3,P.brass);const b=path(ell(W/2,H-14,12,12,12,0.02));fill(ctx,b,P.brass);ink(ctx,b,2);}
function drawSconce(ctx,W,H){
  const pl=path(ell(70,176,16,26,12,0.04));fill(ctx,pl,P.brass);shade(ctx,pl,86,0,54,0,0.4);ink(ctx,pl,2.5);
  line(ctx,[[70,168],[78,140],[70,112],[70,96]],7,P.brass);curl(ctx,78,140,0.4,10,3,P.brass);line(ctx,[[62,150],[50,150]],4,P.brass);dot(ctx,48,150,5,P.brass);
  const cup=box(58,90,24,10,1);fill(ctx,cup,P.brass);ink(ctx,cup,2);
  const sh=path([[44,30],[96,30],[90,56],[80,86],[60,86],[50,56]],{jit:0.6});ctx.save();ctx.globalAlpha=0.8;fill(ctx,sh,mix(P.paper,P.glow,0.35));ctx.restore();
  const fl=path([[64,80],[70,56],[76,80],[70,86]]);fill(ctx,fl,P.glow);line(ctx,[[46,40],[94,40]],1.6,P.ink,0.5);ink(ctx,sh,2.5);}
function drawGlow(ctx,W,H){const g=ctx.createRadialGradient(W/2,H/2,0,W/2,H/2,W/2);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(0.25,'rgba(255,255,255,0.45)');g.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);}
function drawMoth(ctx){const wc=mix(P.paper,P.stone,0.3);for(const sx of [-1,1]){const w=path([[60,44],[60+sx*50,14],[60+sx*56,44],[60+sx*40,74],[60,56]]);fill(ctx,w,wc);dot(ctx,60+sx*34,40,6,P.ink);dot(ctx,60+sx*34,40,2.5,wc);ink(ctx,w,2.5);}const b=path(ell(60,48,6,22,8,0.05));fill(ctx,b,mix(P.stoneDark,P.ink,0.3));ink(ctx,b,2);}
function drawBlob(ctx,W,H){const g=ctx.createRadialGradient(W/2,H/2,0,W/2,H/2,W/2);g.addColorStop(0,'rgba(0,0,0,0.6)');g.addColorStop(1,'rgba(0,0,0,0)');ctx.save();ctx.scale(1,H/W);ctx.fillStyle=g;ctx.fillRect(0,0,W,W);ctx.restore();}

/* ---- Mr. Harrow, the Curator (invented): a standing paper rig in the same cel style.
   1910 office dress: a long brown frock coat, a tan waistcoat with a watch chain, a wing collar and bow tie,
   striped trousers. White side whiskers, a bald crown, pince-nez on a ribbon. He holds a letter. */
const HAR={coat:()=>mix(P.case,P.ink,0.5),vest:()=>mix(P.coat2,P.case,0.25),trou:()=>mix(P.stone,P.ink,0.45),hair:()=>mix(P.paper,'#ffffff',0.25)};
const flipX=(pts,W)=>pts.map(([x,y])=>[W-x,y]);
function drawHarBody(ctx,W,H){
  const tc=HAR.trou();
  for(const sx of [0,1]){const leg=path(sx?flipX([[86,300],[118,300],[116,448],[88,448]],240):[[86,300],[118,300],[116,448],[88,448]],{smooth:false,jit:0.8});cel(ctx,leg,tc,{s:6});ctx.save();ctx.clip(leg);ctx.strokeStyle=hexA(P.paper,0.16);ctx.lineWidth=1.3;for(let x=80;x<160;x+=7){ctx.beginPath();ctx.moveTo(x,300);ctx.lineTo(x,450);ctx.stroke();}ctx.restore();ink(ctx,leg,3.5);
    const bt=path(sx?flipX([[82,444],[118,444],[122,462],[116,474],[76,474],[72,462]],240):[[82,444],[118,444],[122,462],[116,474],[76,474],[72,462]],{jit:0.6});cel(ctx,bt,P.boot,{s:4,ra:0.7});ink(ctx,bt,3);}
  const vest=path([[98,88],[142,88],[150,214],[120,232],[90,214]],{smooth:false,jit:0.6});cel(ctx,vest,HAR.vest(),{s:6,ha:0.25});for(const y of [118,142,166,190])dot(ctx,120,y,3.5,mix(P.brass,P.ink,0.2));
  line(ctx,[[104,170],[112,182],[124,184],[136,176]],2.2,P.brass);dot(ctx,104,170,3,P.brass);const fob=path(ell(138,178,5,6,8,0.03));cel(ctx,fob,P.brass,{s:2,hatch:false});ink(ctx,fob,1.4);ink(ctx,vest,3);
  const cc=HAR.coat(),panelL=[[118,66],[84,72],[62,94],[56,160],[52,250],[58,336],[100,342],[104,240],[100,150],[96,100]];
  for(const sx of [0,1]){const pts=sx?flipX(panelL,240):panelL;const pn=path(pts,{jit:1});cel(ctx,pn,cc,{s:12,dark:0.5});flecks(ctx,pn,sx?[136,66,110,280]:[50,66,70,280],110);ink(ctx,pn,4.5);
    const lp=path(sx?flipX([[118,64],[96,68],[86,94],[102,134],[108,96]],240):[[118,64],[96,68],[86,94],[102,134],[108,96]],{smooth:false,jit:0.6});cel(ctx,lp,mix(cc,P.ink,0.3),{s:4,hatch:false,ra:0.3});ink(ctx,lp,2.4);}
  stitch(ctx,[[60,328],[98,334]],P.paper,0.4);stitch(ctx,[[180,328],[142,334]],P.paper,0.4);
  // the left arm hangs at his side (screen left); the right arm is its own piece, so he can gesture
  const arm=path([[64,92],[50,108],[42,200],[44,266],[66,268],[72,200],[78,118]],{jit:0.8});cel(ctx,arm,cc,{s:8,dark:0.5});ink(ctx,arm,3.5);
  const cf=path([[44,262],[66,262],[68,276],[42,276]],{smooth:false});fill(ctx,cf,P.paper);ink(ctx,cf,1.6);const hd=path(ell(55,288,12,14,10,0.06));cel(ctx,hd,P.skin,{s:3,hatch:false});ink(ctx,hd,2.2);
  const sh=path([[104,62],[136,62],[128,98],[112,98]],{smooth:false});fill(ctx,sh,P.paper);for(const sx of [-1,1]){const w=path([[120+sx*4,62],[120+sx*16,58],[120+sx*12,70]],{smooth:false});fill(ctx,w,P.paper);ink(ctx,w,1.4);}
  const bow=path([[106,66],[120,72],[134,66],[134,80],[120,74],[106,80]],{smooth:false});fill(ctx,bow,P.ink);ink(ctx,sh,1.6);}
function drawHarArm(ctx){const sl=path([[24,4],[58,4],[62,60],[58,178],[26,180],[20,60]],{jit:0.7});cel(ctx,sl,HAR.coat(),{s:8,dark:0.5});flecks(ctx,sl,[18,0,46,180],30);ink(ctx,sl,3.5);
  const cf=path([[26,174],[58,174],[60,188],[24,188]],{smooth:false});fill(ctx,cf,P.paper);ink(ctx,cf,1.6);
  ctx.save();ctx.translate(58,200);ctx.rotate(-0.25);const lt=box(-6,-14,40,28,1);fill(ctx,lt,P.paper);for(let k=0;k<3;k++)line(ctx,[[0,-6+k*7],[26,-6+k*7]],1.1,P.ink,0.5);ink(ctx,lt,1.8);ctx.restore();
  const hd=path(ell(42,198,12,12,10,0.06));cel(ctx,hd,P.skin,{s:3,hatch:false});ink(ctx,hd,2.2);}
function drawHarHead(ctx){
  const sk=P.skin,hc=HAR.hair();
  const nk=path([[80,214],[82,166],[118,166],[120,214]],{smooth:false,jit:0.6});cel(ctx,nk,sk,{s:4,hatch:false});ink(ctx,nk,2.6);
  const f=path([[100,56],[132,64],[148,96],[148,140],[136,170],[100,186],[64,170],[52,140],[52,96],[68,64]],{jit:0.5});cel(ctx,f,sk,{s:8,ha:0.2});ink(ctx,f,3.6);
  line(ctx,[[82,72],[100,68],[118,72]],1.4,P.ink,0.3);
  for(const sx of [0,1]){const t=(pts)=>sx?flipX(pts,200):pts;
    const tuft=path(t([[54,88],[38,100],[34,128],[46,142],[56,120]]),{jit:1.2});cel(ctx,tuft,hc,{s:4,hatch:false,ra:0.3});ink(ctx,tuft,2.4);
    const chop=path(t([[54,118],[46,150],[56,180],[80,186],[76,152],[64,126]]),{jit:1});cel(ctx,chop,hc,{s:4,hatch:false,ra:0.3});for(let k=0;k<4;k++)line(ctx,t([[58+k*4,140+k*8],[66+k*4,150+k*8]]),1.2,P.stone,0.6);ink(ctx,chop,2.4);
    line(ctx,t([[70,98],[84,92],[96,98]]),5,hc);line(ctx,t([[70,98],[84,92],[96,98]]),1.3,P.ink,0.6);}
  const nose=path([[96,110],[104,110],[110,138],[100,146],[90,138]],{smooth:false,jit:0.3});cel(ctx,nose,sk,{s:3,hatch:false});ink(ctx,nose,2.2);
  const mo=path([[74,152],[100,144],[126,152],[120,164],[100,158],[80,164]],{jit:0.6});cel(ctx,mo,hc,{s:3,hatch:false,ra:0.3});ink(ctx,mo,2.2);line(ctx,[[92,174],[108,174]],1.6,P.ink,0.5);
  for(const x of [84,116]){fill(ctx,path(ell(x,114,13,12,12,0.02)),hexA(P.paper,0.3));ctx.save();ctx.strokeStyle=P.ink;ctx.lineWidth=2.6;ctx.beginPath();ctx.arc(x,114,13,0,TAU);ctx.stroke();ctx.restore();}
  line(ctx,[[97,112],[103,112]],2.2);line(ctx,[[129,114],[150,112],[160,150],[158,214]],1.4,P.ink,0.7);}
function drawHarEyes(ctx){for(const x of [24,56]){fill(ctx,path(ell(x,12,4.5,5,10,0.02)),P.ink);dot(ctx,x+1.4,10,1.3,P.paper);}}

/* ---- the people of Saint John (invented): Percy Gage, who sells comet pills; Mrs. Hanlon, the landlady; the folk in
   King Square. Same cel style and frames as Mr. Harrow: a body is 240 x 480 (shoulders at y 62, boots at 474), a head
   200 x 220 (the face centred at x 100; the neck tucks under the collar), an arm 96 x 220 pinned at the top. A person is
   drawn from a description o: clothes and colours, a hat, something in the hand. 1910 dress throughout. */
function plaid(ctx,p,c){ctx.save();ctx.clip(p);const W=ctx.canvas.width,H=ctx.canvas.height;ctx.strokeStyle=hexA(c,0.55);ctx.lineWidth=2.4;
  ctx.beginPath();for(let x=0;x<W;x+=16){ctx.moveTo(x,0);ctx.lineTo(x,H);}for(let y=0;y<H;y+=16){ctx.moveTo(0,y);ctx.lineTo(W,y);}ctx.stroke();
  ctx.strokeStyle=hexA(c,0.28);ctx.lineWidth=1;ctx.beginPath();for(let x=8;x<W;x+=16){ctx.moveTo(x,0);ctx.lineTo(x,H);}for(let y=8;y<H;y+=16){ctx.moveTo(0,y);ctx.lineTo(W,y);}ctx.stroke();ctx.restore();}
function personLegs(ctx,o){
  if(o.lower==='skirt'){const sk=path([[72,196],[168,196],[184,300],[204,458],[36,458],[56,300]],{jit:1});cel(ctx,sk,o.skirt,{s:12,dark:0.45});
    ctx.save();ctx.clip(sk);for(const x of [84,108,132,156])line(ctx,[[x+6,210],[x-(120-x)*0.18,456]],1.6,P.ink,0.3);ctx.restore();flecks(ctx,sk,[36,196,170,262],80);ink(ctx,sk,4.5);
    for(const sx of [0,1]){const bt=path(sx?flipX([[84,452],[114,452],[118,466],[112,476],[78,476],[76,464]],240):[[84,452],[114,452],[118,466],[112,476],[78,476],[76,464]],{jit:0.6});cel(ctx,bt,P.boot,{s:4,ra:0.7});ink(ctx,bt,3);}
    return;}
  const knee=o.lower==='knickers';
  for(const sx of [0,1]){const F=pts=>sx?flipX(pts,240):pts;
    const leg=path(F([[86,296],[118,296],[116,knee?392:448],[88,knee?392:448]]),{smooth:false,jit:0.8});cel(ctx,leg,o.trou,{s:6});if(o.check)plaid(ctx,leg,o.check);ink(ctx,leg,3.5);
    if(knee){const st=path(F([[90,388],[114,388],[113,448],[91,448]]),{smooth:false,jit:0.6});cel(ctx,st,o.sock||mix(P.stone,P.ink,0.55),{s:4,hatch:false});ink(ctx,st,2.6);
      const cf=path(F([[86,382],[120,382],[119,396],[87,396]]),{smooth:false});fill(ctx,cf,mix(o.trou,P.ink,0.3));ink(ctx,cf,2);}
    const bt=path(F([[82,444],[118,444],[122,462],[116,474],[76,474],[72,462]]),{jit:0.6});cel(ctx,bt,P.boot,{s:4,ra:0.7});ink(ctx,bt,3);}}
function personTorso(ctx,o){
  if(o.blouse&&!o.coat){// a shirtwaist with a high collar, over the skirt
    const bd=path([[80,70],[120,64],[160,70],[172,124],[162,204],[78,204],[68,124]],{jit:0.8});cel(ctx,bd,o.blouse,{s:7,ha:0.2});
    if(o.stripe){ctx.save();ctx.clip(bd);for(let x=60;x<180;x+=10)line(ctx,[[x,64],[x,206]],2,o.stripe,0.5);ctx.restore();}ink(ctx,bd,4);
    const wb=path([[78,196],[162,196],[164,212],[76,212]],{smooth:false});fill(ctx,wb,mix(o.skirt,P.ink,0.3));ink(ctx,wb,2.2);
    const col=path([[106,56],[134,56],[132,84],[108,84]],{smooth:false});fill(ctx,col,P.paper);ink(ctx,col,1.8);
    if(o.cameo){const cm=path(ell(120,94,6,7,10,0.02));fill(ctx,cm,P.brass);ink(ctx,cm,1.4);}
    if(o.shawl){const sh=path([[66,84],[120,72],[174,84],[168,150],[120,196],[72,150]],{jit:1});cel(ctx,sh,o.shawl,{s:8,ha:0.3});for(let x=78;x<168;x+=12)line(ctx,[[x,150+Math.abs(120-x)*-0.4],[x-2,166+Math.abs(120-x)*-0.4]],1.4,P.ink,0.4);ink(ctx,sh,3.2);}
    return;}
  if(o.vest){const vest=path([[98,88],[142,88],[150,214],[120,232],[90,214]],{smooth:false,jit:0.6});cel(ctx,vest,o.vest,{s:6,ha:0.25});for(const y of [118,142,166,190])dot(ctx,120,y,3.5,mix(P.brass,P.ink,0.2));
    if(o.chain){line(ctx,[[104,170],[112,182],[124,184],[136,176]],2.2,P.brass);const fob=path(ell(138,178,5,6,8,0.03));cel(ctx,fob,P.brass,{s:2,hatch:false});ink(ctx,fob,1.4);}ink(ctx,vest,3);}
  else{const sh=path([[100,84],[140,84],[146,214],[94,214]],{smooth:false});fill(ctx,sh,o.shirt||mix(P.paper,P.stone,0.25));ink(ctx,sh,2);}
  const cc=o.coat,hem=o.hem||336,panelL=[[118,66],[84,72],[62,94],[56,160],[54,hem-80],[58,hem],[100,hem+6],[104,Math.min(240,hem-60)],[100,150],[96,100]];
  for(const sx of [0,1]){const pts=sx?flipX(panelL,240):panelL;const pn=path(pts,{jit:1});cel(ctx,pn,cc,{s:12,dark:0.5});if(o.check)plaid(ctx,pn,o.check);else flecks(ctx,pn,sx?[136,66,110,hem-60]:[50,66,70,hem-60],100);ink(ctx,pn,4.5);
    const lp=path(sx?flipX([[118,64],[96,68],[86,94],[102,134],[108,96]],240):[[118,64],[96,68],[86,94],[102,134],[108,96]],{smooth:false,jit:0.6});cel(ctx,lp,mix(cc,P.ink,0.3),{s:4,hatch:false,ra:0.3});ink(ctx,lp,2.4);}
  for(const y of [150,190,230])if(y<hem-30)dot(ctx,104,y,3.5,mix(cc,P.ink,0.5));
  if(o.lower!=='skirt'){const sc=path([[104,60],[136,60],[128,90],[112,90]],{smooth:false});fill(ctx,sc,P.paper);ink(ctx,sc,1.6);
    if(o.tie){const t=path([[114,70],[126,70],[128,110],[120,122],[112,110]],{smooth:false});fill(ctx,t,o.tie);ink(ctx,t,1.6);}
    if(o.scarf){const s=path([[96,62],[144,62],[140,84],[100,84]],{jit:0.6});fill(ctx,s,o.scarf);ink(ctx,s,2);line(ctx,[[132,80],[138,120]],8,o.scarf);}}
  else{const col=path([[106,56],[134,56],[132,80],[108,80]],{smooth:false});fill(ctx,col,P.paper);ink(ctx,col,1.8);}}
function personApron(ctx,c){const ap=path([[86,198],[154,198],[166,436],[74,436]],{jit:0.8});cel(ctx,ap,c,{s:6,hatch:false,ra:0.3});for(const x of [100,120,140])line(ctx,[[x,212],[x+(x-120)*0.1,430]],1.2,P.ink,0.2);ink(ctx,ap,3);
  const bib=path([[100,108],[140,108],[144,202],[96,202]],{smooth:false,jit:0.5});fill(ctx,bib,c);ink(ctx,bib,2.4);line(ctx,[[100,110],[94,70]],3,c);line(ctx,[[140,110],[146,70]],3,c);}
function hangingArm(ctx,o,sx){const F=pts=>sx?flipX(pts,240):pts,sl=o.coat||o.blouse;
  const arm=path(F([[64,92],[50,108],[42,200],[44,266],[66,268],[72,200],[78,118]]),{jit:0.8});cel(ctx,arm,sl,{s:8,dark:0.5});
  if(o.check)plaid(ctx,arm,o.check);else if(o.stripe&&!o.coat){ctx.save();ctx.clip(arm);for(let x=36;x<84;x+=10)line(ctx,F([[x,92],[x,270]]),2,o.stripe,0.5);ctx.restore();}ink(ctx,arm,3.5);
  const cf=path(F([[44,262],[66,262],[68,276],[42,276]]),{smooth:false});fill(ctx,cf,o.glove||P.paper);ink(ctx,cf,1.6);
  const [hx,hy]=F([[55,288]])[0];const hd=path(ell(hx,hy,12,14,10,0.06));cel(ctx,hd,o.glove||P.skin,{s:3,hatch:false});ink(ctx,hd,2.2);return[hx,hy];}
function holdItem(ctx,what,[hx,hy]){
  if(what==='papers'){ctx.save();ctx.translate(hx+2,hy+8);ctx.rotate(0.25);const pp=box(-10,-6,26,58,1);fill(ctx,pp,mix(P.paper,P.stone,0.15));for(let k=0;k<5;k++)line(ctx,[[-6,4+k*9],[12,4+k*9]],1.2,P.ink,0.45);ink(ctx,pp,2);ctx.restore();}
  if(what==='umbrella'){line(ctx,[[hx,hy-14],[hx-4,474]],5,P.ink);line(ctx,[[hx,hy-14],[hx,hy-30],[hx+10,hy-34],[hx+14,hy-24]],4,mix(P.woodDark,P.ink,0.2));
    const can=path([[hx-14,hy+40],[hx+8,hy+40],[hx+2,440],[hx-8,440]],{smooth:false,jit:0.6});fill(ctx,can,mix('#1d2230',P.ink,0.1));ink(ctx,can,2.4);}
  if(what==='basket'){const bk=path([[hx-26,hy+6],[hx+26,hy+6],[hx+20,hy+44],[hx-20,hy+44]],{smooth:false,jit:0.6});fill(ctx,bk,'#8a6a3a');hatch(ctx,bk,{ang:0.6,gap:6,a:0.4});hatch(ctx,bk,{ang:-0.6,gap:6,a:0.3});ink(ctx,bk,2.6);
    ctx.save();ctx.strokeStyle=P.ink;ctx.lineWidth=3;ctx.beginPath();ctx.arc(hx,hy+6,24,Math.PI,0);ctx.stroke();ctx.restore();}}
function newsBag(ctx){line(ctx,[[170,80],[78,250]],7,mix('#5a4a32',P.ink,0.2));
  const bg=path([[40,230],[112,230],[116,302],[36,302]],{jit:0.8});cel(ctx,bg,'#6a5838',{s:5,hatch:false,ra:0.3});ink(ctx,bg,3);
  for(let k=0;k<3;k++){const pp=box(46+k*18,212+k*2,30,26,1);fill(ctx,pp,mix(P.paper,P.stone,0.15-k*0.03));ink(ctx,pp,1.6);}
  txt(ctx,'STANDARD',76,272,13,{font:FT,c:P.paper,maxW:70});}
function drawPerson(o){return ctx=>{personLegs(ctx,o);personTorso(ctx,o);if(o.apron)personApron(ctx,o.apron);
  const h=hangingArm(ctx,o,0);if(o.both)hangingArm(ctx,o,1);if(o.hold)holdItem(ctx,o.hold,h);if(o.bag)newsBag(ctx);}}
function drawPersonHead(o){return ctx=>{const sk=o.skin||P.skin,hc=o.hairC||mix('#4a3326',P.ink,0.2),fw=o.fw||46,cx=100;
  const nk=path([[82,214],[84,166],[116,166],[118,214]],{smooth:false,jit:0.6});cel(ctx,nk,sk,{s:4,hatch:false});ink(ctx,nk,2.6);
  if(o.hair==='bun'){const bun=path(ell(cx,42,30,22,14,0.04));cel(ctx,bun,hc,{s:5,hatch:false,ra:0.3});for(let k=0;k<3;k++)line(ctx,[[cx-20+k*12,32],[cx-14+k*12,54]],1.2,P.ink,0.35);ink(ctx,bun,2.6);}
  if(o.hair==='pomp'){const pm=path(ell(cx,64,fw+16,34,18,0.04));cel(ctx,pm,hc,{s:6,ra:0.3});ink(ctx,pm,3);}
  for(const sx of [-1,1]){const e=path(ell(cx+sx*(fw+3),124,7,12,10,0.05));fill(ctx,e,mix(sk,P.ink,0.12));ink(ctx,e,2);}
  const f=path([[cx,62],[cx+fw*0.66,70],[cx+fw,100],[cx+fw,140],[cx+fw*0.74,170],[cx,186],[cx-fw*0.74,170],[cx-fw,140],[cx-fw,100],[cx-fw*0.66,70]],{jit:0.5});cel(ctx,f,sk,{s:8,ha:0.2});
  for(const sx of [-1,1])fill(ctx,path(ell(cx+sx*fw*0.55,150,9,6,10,0.05)),hexA('#c0504a',o.blush??0.16));ink(ctx,f,3.6);
  if(o.hair==='slick'||o.hair==='grey'){const c=o.hair==='grey'?mix(P.paper,P.stone,0.35):hc;const hr=path([[cx-fw-2,106],[cx-fw+6,72],[cx,56],[cx+fw-6,72],[cx+fw+2,106],[cx+fw-10,84],[cx+10,76],[cx-14,84],[cx-fw+10,90]],{jit:0.6});cel(ctx,hr,c,{s:4,hatch:false,ra:0.4});line(ctx,[[cx-14,62],[cx-16,82]],1.6,P.paper,0.3);ink(ctx,hr,2.6);}
  if(o.hair==='bun'||o.hair==='pomp'){const fr=path([[cx-fw-2,110],[cx-fw+4,74],[cx,58],[cx+fw-4,74],[cx+fw+2,110],[cx+fw-8,86],[cx,78],[cx-fw+8,86]],{jit:0.6});cel(ctx,fr,hc,{s:4,hatch:false,ra:0.4});for(let k=0;k<4;k++)line(ctx,[[cx-22+k*12,70],[cx-30+k*14,96]],1.2,P.ink,0.3);ink(ctx,fr,2.6);}
  const ey=o.up?106:118,lift=o.up?5:0;
  for(const sx of [-1,1]){const x=cx+sx*18;fill(ctx,path(ell(x,ey,5,5.5,10,0.02)),P.ink);dot(ctx,x+1.4,ey-(o.up?3:1.5),1.4,P.paper);line(ctx,[[x-9,ey-12-lift],[x+9,ey-14-lift]],2.6,o.brow||mix(hc,P.ink,0.3));}
  if(o.specs){for(const sx of [-1,1]){ctx.save();ctx.strokeStyle=P.ink;ctx.lineWidth=2.4;ctx.beginPath();ctx.arc(cx+sx*18,ey,11,0,TAU);ctx.stroke();ctx.restore();}line(ctx,[[cx-7,ey],[cx+7,ey]],2);}
  const nose=path([[cx-4,ey+2],[cx+4,ey+2],[cx+8,140],[cx,146],[cx-8,140]],{smooth:false,jit:0.3});cel(ctx,nose,sk,{s:3,hatch:false});ink(ctx,nose,2.2);
  if(o.must==='waxed'){const m=path([[cx-22,154],[cx,148],[cx+22,154],[cx+34,146],[cx+40,150],[cx+26,160],[cx,156],[cx-26,160],[cx-40,150],[cx-34,146]],{jit:0.4});fill(ctx,m,hc);ink(ctx,m,2);curl(ctx,cx+38,148,-1.2,5,2.4,hc);curl(ctx,cx-38,148,-1.9,5,2.4,hc);}
  if(o.must==='walrus'){const m=path([[cx-26,150],[cx,146],[cx+26,150],[cx+24,166],[cx+12,160],[cx,162],[cx-12,160],[cx-24,166]],{jit:0.8});fill(ctx,m,o.mustC||hc);for(let k=0;k<6;k++)line(ctx,[[cx-20+k*8,152],[cx-22+k*8,164]],1.2,P.ink,0.4);ink(ctx,m,2);}
  if(o.grin){const mo=path([[cx-18,162],[cx+18,162],[cx+12,172],[cx,176],[cx-12,172]],{smooth:false});fill(ctx,mo,P.ink);fill(ctx,path([[cx-14,163],[cx+14,163],[cx+12,168],[cx-12,168]],{smooth:false}),P.paper);}
  else if(o.up)fill(ctx,path(ell(cx,166,5,6,10,0.03)),P.ink);
  else if(!o.must)line(ctx,[[cx-10,164],[cx,166],[cx+10,164]],2.2,P.ink,0.8);
  if(o.hair==='bun'||o.hair==='grey')line(ctx,[[cx-12,180],[cx+12,180]],1.2,P.ink,0.2);
  const hat=o.hatC||P.hat;
  if(o.hat==='bowler'){const cr=path([[cx-34,66],[cx-30,32],[cx-16,18],[cx+16,18],[cx+30,32],[cx+34,66]],{jit:0.5});cel(ctx,cr,hat,{s:5,hatch:false,ra:0.45});line(ctx,[[cx-33,58],[cx+33,58]],5,mix(hat,P.ink,0.5));ink(ctx,cr,3);
    const br=path([[cx-54,70],[cx-46,62],[cx+46,62],[cx+54,70],[cx+46,76],[cx-46,76]],{jit:0.5});fill(ctx,br,hat);ink(ctx,br,2.6);}
  if(o.hat==='cap'){const cr=path([[cx-fw-4,82],[cx-fw+2,52],[cx,40],[cx+fw+10,52],[cx+fw+12,78]],{jit:0.6});cel(ctx,cr,hat,{s:5,ra:0.35});flecks(ctx,cr,[40,36,120,50],40);ink(ctx,cr,3);
    const pk=path([[cx-fw,80],[cx+fw+20,74],[cx+fw+26,86],[cx-fw+4,90]],{jit:0.5});fill(ctx,pk,mix(hat,P.ink,0.3));ink(ctx,pk,2.4);}
  if(o.hat==='wide'){const br=path(ell(cx,58,fw+50,16,20,0.03,-0.08));cel(ctx,br,hat,{s:4,hatch:false,ra:0.4});ink(ctx,br,3);
    const cr=path([[cx-34,58],[cx-30,26],[cx+30,24],[cx+34,56]],{jit:0.6});cel(ctx,cr,hat,{s:4,hatch:false});ink(ctx,cr,2.6);line(ctx,[[cx-34,50],[cx+34,48]],6,o.ribbon||'#7a2f3a');
    const fe=path([[cx+20,40],[cx+70,4],[cx+86,8],[cx+46,40]],{jit:1});fill(ctx,fe,o.feather||mix(P.paper,P.stone,0.2));for(let k=0;k<6;k++)line(ctx,[[cx+30+k*8,36-k*5],[cx+40+k*8,40-k*5]],1.2,P.ink,0.5);ink(ctx,fe,2);}
  if(o.hat==='bonnet'){const bn=path([[cx-fw-10,130],[cx-fw-6,70],[cx,46],[cx+fw+6,70],[cx+fw+10,130],[cx+fw-2,128],[cx+fw-6,80],[cx,66],[cx-fw+6,80],[cx-fw+2,128]],{jit:0.6});cel(ctx,bn,hat,{s:5,ra:0.3});ink(ctx,bn,3);line(ctx,[[cx-fw+2,128],[cx-20,190]],3,hat);line(ctx,[[cx+fw-2,128],[cx+20,190]],3,hat);}}}
function drawPersonArm(o){return ctx=>{const sl=path([[24,4],[58,4],[62,60],[58,178],[26,180],[20,60]],{jit:0.7});cel(ctx,sl,o.sleeve,{s:8,dark:0.5});
  if(o.check)plaid(ctx,sl,o.check);else if(o.stripe){ctx.save();ctx.clip(sl);for(let x=16;x<70;x+=10)line(ctx,[[x,0],[x,182]],2,o.stripe,0.5);ctx.restore();}ink(ctx,sl,3.5);
  const cf=path([[26,174],[58,174],[60,188],[24,188]],{smooth:false});fill(ctx,cf,P.paper);ink(ctx,cf,1.6);
  if(o.item==='pills'){ctx.save();ctx.translate(58,204);ctx.rotate(-0.18);const bx=box(-10,-26,50,40,1);cel(ctx,bx,'#a8402f',{s:3,hatch:false,ra:0.4});ink(ctx,bx,2.2);
    txt(ctx,'COMET',15,-10,11,{font:FT,c:P.paper,maxW:44});txt(ctx,'PILLS',15,4,11,{font:FT,c:P.paper,maxW:44});ctx.restore();}
  if(o.item==='ladle'){line(ctx,[[44,196],[70,120]],5,mix(P.stone,P.ink,0.3));const bw=path(ell(42,206,14,10,12,0.03));fill(ctx,bw,mix(P.stone,P.ink,0.35));ink(ctx,bw,2);}
  if(o.item==='paper'){ctx.save();ctx.translate(50,196);ctx.rotate(-0.4);const pp=box(-8,-34,34,64,1);fill(ctx,pp,mix(P.paper,P.stone,0.12));for(let k=0;k<6;k++)line(ctx,[[-4,-26+k*9],[22,-26+k*9]],1.2,P.ink,0.45);ink(ctx,pp,2);ctx.restore();}
  const hd=path(ell(42,198,12,12,10,0.06));cel(ctx,hd,P.skin,{s:3,hatch:false});ink(ctx,hd,2.2);}}
// who is who: Percy Gage in a loud check suit and a brown bowler; Mrs. Hanlon in a striped shirtwaist and an apron;
// the folk in King Square
const GAGE={body:{lower:'trousers',trou:'#8a7550',check:'#3a2414',coat:'#8a7550',hem:300,vest:'#a8402f',chain:true,tie:'#2c5a3c'},
  head:{hair:'slick',hairC:'#24160e',must:'waxed',grin:true,hat:'bowler',hatC:'#5a4128',blush:0.28},arm:{sleeve:'#8a7550',check:'#3a2414',item:'pills'}};
const HANLON={body:{lower:'skirt',skirt:'#3b3340',blouse:'#cfc6b4',stripe:'#5f7397',apron:'#e6dfcf'},
  head:{hair:'bun',hairC:'#9a5a36',fw:50,blush:0.3},arm:{sleeve:'#cfc6b4',stripe:'#5f7397',item:'ladle'}};
const FOLK=[
  {id:'newsboy',scale:0.74,body:{lower:'knickers',trou:'#4a4030',coat:'#5d4c34',hem:250,both:true,bag:true,scarf:'#7a3a2a'},head:{hair:'slick',hat:'cap',hatC:'#4a4438',fw:42,blush:0.3}},
  {id:'folk1',scale:0.96,body:{lower:'skirt',skirt:'#3a2f45',coat:'#58394a',hem:372,both:true,hold:'umbrella'},head:{hair:'pomp',hairC:'#3a2418',hat:'wide',hatC:'#2a2230',blush:0.24}},
  {id:'folk2',scale:1.0,body:{lower:'trousers',trou:'#2f3340',coat:'#3d4250',hem:330,shirt:'#c9c2b0',tie:'#6b2a2a',both:true,hold:'papers'},head:{hair:'slick',must:'walrus',hat:'bowler'}},
  {id:'folk3',scale:0.9,body:{lower:'skirt',skirt:'#2a2a30',blouse:'#4a4440',shawl:'#5a4a5a',both:true,hold:'basket'},head:{hair:'grey',hat:'bonnet',hatC:'#2b2630',specs:true,fw:44}},
  {id:'folk4',scale:1.02,body:{lower:'trousers',trou:'#3d3a30',coat:'#4b4a3a',hem:262,shirt:'#9a9280',both:true},head:{hair:'slick',hairC:'#2a1d14',must:'walrus',mustC:'#6a4a2a',hat:'cap',hatC:'#3a3a32'}},
  {id:'folk5',scale:0.98,body:{lower:'skirt',skirt:'#2e3a3a',coat:'#40565a',hem:380,both:true},head:{hair:'pomp',hairC:'#6a4228',hat:'wide',hatC:'#5a4a3a',feather:'#c9b98a',ribbon:'#2a4a3a',blush:0.22}}];

/* ---- office and basement furniture ---- */
function drawBigDesk(ctx,W,H){
  const front=box(14,84,W-28,H-90,1.5);fill(ctx,front,P.wood);shade(ctx,front,0,84,0,H,0.4);ink(ctx,front,3);
  panel(ctx,34,110,120,H-140,P.wood);panel(ctx,W-154,110,120,H-140,P.wood);const kh=box(170,110,W-340,60,1);fill(ctx,kh,mix(P.wood,P.ink,0.2));ink(ctx,kh,2);
  const top=box(0,64,W,22,1.5);fill(ctx,top,P.woodLight);ink(ctx,top,3);const bz=box(30,58,W-60,10,1);fill(ctx,bz,mix(P.green||'#3d5a3a','#3d5a3a',1));ink(ctx,bz,1.5);
  for(const[x,r] of [[110,-0.08],[150,0.12],[300,0.05]]){ctx.save();ctx.translate(x,56);ctx.rotate(r);const pp=box(-28,-6,56,8,0.6);fill(ctx,pp,P.paper);ink(ctx,pp,1.4);ctx.restore();}
  const iw=box(206,38,40,20,1);fill(ctx,iw,P.brass);ink(ctx,iw,1.8);dot(ctx,216,36,6,P.ink);dot(ctx,236,36,6,P.ink);line(ctx,[[230,36],[250,6]],2.4,P.paper);
  const tray=box(W-120,36,80,22,1);fill(ctx,tray,P.woodDark);ink(ctx,tray,2);for(let k=0;k<3;k++){const l=box(W-114+k*3,30-k*4,66,8,0.5);fill(ctx,l,P.paper);ink(ctx,l,1.2);}
  const pl=box(W/2-50,124,100,24,1);fill(ctx,pl,mix(P.brass,P.paper,0.2));txt(ctx,'CURATOR',W/2,141,14,{maxW:88});ink(ctx,pl,1.6);}
function drawMyDesk(ctx,W,H){
  const front=box(14,104,W-28,H-110,1.5);fill(ctx,front,P.wood);shade(ctx,front,0,104,0,H,0.4);ink(ctx,front,3);
  for(let i=0;i<3;i++){const d=box(W-150,124+i*58,120,48,1);fill(ctx,d,mix(P.wood,P.woodLight,0.15));ink(ctx,d,2);dot(ctx,W-90,148+i*58,4,P.brass);}
  panel(ctx,30,124,W-200,H-150,P.wood);
  const top=box(0,84,W,22,1.5);fill(ctx,top,P.woodLight);ink(ctx,top,3);
  // the stack: papers tied with tape, each sheet a little crooked
  for(let k=0;k<16;k++){ctx.save();ctx.translate(96+rr(-3,3),82-k*3.2);ctx.rotate(rr(-0.04,0.04));const sh=box(-56,-4,112,6,0.5);fill(ctx,sh,mix(P.paper,P.glowDim,rr(0,0.3)));ink(ctx,sh,1);ctx.restore();}
  line(ctx,[[96,30],[96,84]],3,P.red||'#a8432f');line(ctx,[[60,58],[132,58]],3,'#a8432f');
  const wt=path(ell(96,26,14,8,10,0.05));cel(ctx,wt,P.brass,{s:3,hatch:false});ink(ctx,wt,2);
  // a typewriter
  const tw=path([[190,82],[194,52],[270,52],[276,82]],{smooth:false,jit:0.5});fill(ctx,tw,P.ink);for(let r=0;r<3;r++)for(let k=0;k<7;k++)dot(ctx,202+k*10+r*2,60+r*7,2.4,P.paper);
  const roll=box(184,36,98,12,1);fill(ctx,roll,mix(P.ink,P.stone,0.3));ink(ctx,roll,1.6);const pg=box(208,8,52,30,0.6);fill(ctx,pg,P.paper);line(ctx,[[214,18],[250,18]],1,P.ink,0.5);ink(ctx,pg,1.4);ink(ctx,tw,2);
  // an oil lamp with a glass chimney
  const lb=path([[318,84],[310,70],[316,56],[338,56],[344,70],[336,84]],{jit:0.4});fill(ctx,lb,P.brass);ink(ctx,lb,2);const ch=path([[320,56],[318,30],[324,10],[330,10],[336,30],[334,56]],{jit:0.3});ctx.save();ctx.globalAlpha=0.35;fill(ctx,ch,P.paper);ctx.restore();fill(ctx,path([[322,48],[327,30],[332,48],[327,52]]),P.glow);ink(ctx,ch,1.8);}
function drawBookcase(ctx,W,H){
  const c=box(8,20,W-16,H-24,1.5);fill(ctx,c,P.woodDark);ink(ctx,c,3);const cr=box(0,4,W,24,1);fill(ctx,cr,P.wood);ink(ctx,cr,2.5);
  const cols=['#5b2a22','#2f4a5a','#4d5a2c','#6b4931','#3b3046','#7a5a2a','#283040'];
  for(let s=0;s<5;s++){const y0=40+s*94,y1=y0+84;let x=22;while(x<W-30){const w=rr(10,20),h=rr(56,80);if(R()<0.08){x+=w;continue;}const b=box(x,y1-h,w,h,0.6);fill(ctx,b,mix(cols[(R()*cols.length)|0],P.ink,rr(0,0.3)));line(ctx,[[x+2,y1-h+10],[x+w-2,y1-h+10]],1.4,P.brass,0.7);ink(ctx,b,1.2);x+=w+1;}
    const sh=box(14,y1,W-28,8,0.6);fill(ctx,sh,P.wood);ink(ctx,sh,1.6);}}
function drawFiling(ctx,W,H){const c=box(6,6,W-12,H-12,1.5);fill(ctx,c,P.wood);shade(ctx,c,W,0,0,0,0.35);ink(ctx,c,3);
  for(let r=0;r<6;r++)for(let k=0;k<3;k++){const d=box(18+k*((W-36)/3),18+r*((H-50)/6),(W-36)/3-6,(H-50)/6-6,0.6);fill(ctx,d,mix(P.wood,P.woodLight,0.25));ink(ctx,d,1.5);const cx=18+k*((W-36)/3)+((W-36)/3-6)/2,cy=18+r*((H-50)/6);const lb=box(cx-12,cy+6,24,10,0.4);fill(ctx,lb,P.paper);ink(ctx,lb,1);dot(ctx,cx,cy+26,3,P.brass);}}
function drawLetterRack(ctx,W,H){const c=box(6,6,W-12,H-12,1.5);fill(ctx,c,P.woodDark);ink(ctx,c,3);
  for(let r=0;r<3;r++)for(let k=0;k<4;k++){const x=18+k*48,y=18+r*56;const h=box(x,y,42,50,0.6);fill(ctx,h,mix(P.woodDark,P.ink,0.4));ink(ctx,h,1.4);if(R()<0.65){const l=box(x+4,y+18,34,30,0.5);fill(ctx,l,mix(P.paper,P.glowDim,rr(0,0.4)));ink(ctx,l,1.1);}}
  txt(ctx,'LETTERS',W/2,H-2,14,{font:FT,c:P.paper,maxW:W-30});}
function drawShelfUnit(name){return(ctx,W,H)=>{
  for(const x of [10,W-26]){const u=box(x,30,16,H-34,1);fill(ctx,u,P.woodDark);ink(ctx,u,2.5);}
  for(let s=0;s<4;s++){const y=150+s*118;const sh=box(6,y,W-12,12,0.8);fill(ctx,sh,P.wood);ink(ctx,sh,2);
    let x=30;while(x<W-80){const w=rr(56,70);const bx=box(x,y-82,w,82,0.8);fill(ctx,bx,mix('#7a6a52',P.ink,rr(0,0.25)));shade(ctx,bx,x+w,0,x,0,0.25);const lb=box(x+8,y-66,w-16,24,0.5);fill(ctx,lb,P.paper);line(ctx,[[x+12,y-58],[x+w-12,y-58]],1.2,P.ink,0.5);line(ctx,[[x+12,y-51],[x+w-24,y-51]],1.2,P.ink,0.4);ink(ctx,lb,1);ink(ctx,bx,1.8);x+=w+4;}}
  const pl=box(W/2-60,2,120,40,1);fill(ctx,pl,P.brass);txt(ctx,name,W/2,32,30,{maxW:104});ink(ctx,pl,2);}}
function drawSortTable(ctx,W,H){const top=box(0,60,W,18,1.5);for(const x of [16,W-34]){const l=box(x,76,18,H-80,1);fill(ctx,l,P.woodDark);ink(ctx,l,2);}fill(ctx,top,P.woodLight);ink(ctx,top,2.5);
  const b1=box(30,10,90,52,1);fill(ctx,b1,'#7a6a52');ink(ctx,b1,2);const lb=box(46,22,58,18,0.5);fill(ctx,lb,P.paper);ink(ctx,lb,1);
  for(let k=0;k<5;k++){ctx.save();ctx.translate(200+k*4,56-k*3);ctx.rotate(rr(-0.1,0.1));const p=box(-40,-4,80,6,0.5);fill(ctx,p,P.paper);ink(ctx,p,1);ctx.restore();}}
function drawStoneFloor(ctx,W,H){ctx.fillStyle=mix(P.stoneDark,P.ink,0.45);ctx.fillRect(0,0,W,H);
  for(let r=0;r<8;r++){let x=-rr(0,80);const y=r*H/8;while(x<W){const w=rr(90,170);const f=box(x+3,y+3,w-6,H/8-6,1.5);fill(ctx,f,mix(P.stoneDark,P.stone,rr(0,0.35)));mottle(ctx,f,P.ink,0.18,8,10,[x,y,w,H/8]);x+=w;}}}
function drawCellarWall(room){return(ctx,W,H)=>{
  ctx.fillStyle=mix(P.stoneDark,P.ink,0.5);ctx.fillRect(0,0,W,H);
  for(let r=0,y=0;y<H;r++){const h=rr(42,64);let x=-rr(0,60);while(x<W){const w=rr(70,140);const st=path([[x+3,y+3],[x+w-3,y+rr(1,5)],[x+w-rr(1,5),y+h-3],[x+rr(2,6),y+h-rr(1,5)]],{smooth:false,jit:2});fill(ctx,st,mix(P.stoneDark,P.stone,rr(0,0.4)));mottle(ctx,st,P.ink,0.2,6,10,[x,y,w,h]);ink(ctx,st,1.6);x+=w;}y+=h;}
  for(let i=0;i<9;i++){const x=rr(0,W),len=rr(80,260);const g=ctx.createLinearGradient(0,60,0,60+len);g.addColorStop(0,hexA(P.ink,0.4));g.addColorStop(1,hexA(P.ink,0));ctx.fillStyle=g;ctx.fillRect(x,60,rr(10,36),len);}
  const gb=ctx.createLinearGradient(0,0,0,H);gb.addColorStop(0,hexA(P.ink,0.55));gb.addColorStop(0.35,hexA(P.ink,0));ctx.fillStyle=gb;ctx.fillRect(0,0,W,H);
  line(ctx,[[0,64],[W,64]],16,mix(P.stoneDark,P.ink,0.6));line(ctx,[[0,58],[W,58]],2,P.paper,0.15);for(let x=60;x<W;x+=220){const br=box(x,52,14,26,1);fill(ctx,br,P.ink);}
  for(const dr of room.doors||[])drawDoor(ctx,dr);}}

/* ================= UNION STREET: the outside of No. 72 =================
   Drawn from the one photograph found: New Brunswick Museum 13305, "Natural History Society Building, Union Street,
   Saint John, 1900-1910" (reproduced on the Catherine Murdoch page of womenandmuseum.com). The photo shows four
   storeys: three of brick over a stone base, then a mansard roof with three pairs of dormer windows; a cornice under
   the roof; two arched openings on the ground floor; telegraph poles with crossarms; a lower, darker building on the
   left and an open lot on the right. The photo is small and sepia, so the colours, the sign board, the lamp by the
   door and the neighbours' details are guesses. The facade is drawn at 80 px a unit; px / 80 = world units. */
const BRICK='#6b3b2d',TRIM='#a59a84',BAYS=[120,320,550,780,980];
function bricks(ctx,p,base,[x0,y0,w,h]){fill(ctx,p,base);ctx.save();ctx.clip(p);
  for(let i=0;i<w*h/900;i++){ctx.fillStyle=R()<0.5?hexA(P.ink,0.14):hexA(P.paper,0.05);ctx.fillRect(x0+rr(0,w),y0+rr(0,h),rr(14,30),11);}
  ctx.fillStyle=hexA(P.ink,0.22);let row=0;for(let y=y0;y<y0+h;y+=13,row++){ctx.fillRect(x0,y,w,1.6);for(let x=x0+(row%2?17:0);x<x0+w;x+=34)ctx.fillRect(x,y,1.6,13);}
  ctx.restore();}
// one window: stone lintel (or an arched stone surround), glass, sash bars, sill. Lit ones glow amber behind a blind.
function stWin(ctx,cx,top,w,h,o={}){const trim=mix(TRIM,P.skyBot,0.3),ar=o.arch;
  if(ar){const s=arch(cx,top-16,w+32,h+16);fill(ctx,s,trim);ink(ctx,s,2.5);}
  else if(!o.plain){const li=box(cx-w/2-12,top-22,w+24,22,1);fill(ctx,li,trim);ink(ctx,li,2.5);}
  const gl=ar?arch(cx,top,w,h):box(cx-w/2,top,w,h,1);
  if(o.lit){const g=ctx.createLinearGradient(0,top,0,top+h);g.addColorStop(0,P.glow);g.addColorStop(1,P.glowDim);ctx.fillStyle=g;ctx.fill(gl);
    ctx.save();ctx.clip(gl);const bh=h*(o.blind??0.3);ctx.fillStyle=mix(P.paper,P.glowDim,0.45);ctx.fillRect(cx-w/2,top,w,bh);line(ctx,[[cx-w/2,top+bh],[cx+w/2,top+bh]],3,P.woodDark);dot(ctx,cx,top+bh+8,4,P.woodDark);ctx.restore();}
  else{const g=ctx.createLinearGradient(0,top,0,top+h);g.addColorStop(0,mix(P.glass,P.skyBot,0.55));g.addColorStop(1,P.glass);ctx.fillStyle=g;ctx.fill(gl);
    ctx.save();ctx.clip(gl);ctx.strokeStyle=hexA(P.paper,0.2);ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(cx+w*0.1,top);ctx.lineTo(cx-w/2,top+h*0.5);ctx.stroke();ctx.restore();}
  const bar=o.lit?mix(P.woodDark,P.ink,0.3):mix(P.woodLight,P.skyBot,0.45);
  line(ctx,[[cx-w/2,top+h*0.55],[cx+w/2,top+h*0.55]],6,bar);line(ctx,[[cx,top+(ar?w*0.5:0)],[cx,top+h]],4,bar);
  ink(ctx,gl,3);if(!o.plain){const si=box(cx-w/2-10,top+h,w+20,14,1);fill(ctx,si,trim);ink(ctx,si,2.5);}}
function lantern(ctx,x,y){const iron=P.boot;line(ctx,[[x+34,y+58],[x+34,y+20],[x,y+4]],5,iron);curl(ctx,x+20,y+12,0.3,8,3,iron);
  const cage=path([[x-18,y+8],[x+18,y+8],[x+13,y+58],[x-13,y+58]],{smooth:false,jit:0.5});const g=ctx.createLinearGradient(0,y+8,0,y+58);g.addColorStop(0,mix(P.glow,P.paper,0.4));g.addColorStop(1,P.glow);ctx.fillStyle=g;ctx.fill(cage);
  line(ctx,[[x,y+8],[x,y+58]],2,iron);ink(ctx,cage,3,iron);const cap=path([[x-24,y+10],[x,y-8],[x+24,y+10]],{smooth:false});fill(ctx,cap,iron);ink(ctx,cap,2,iron);dot(ctx,x,y+64,5,iron);}
function drawFacade72(ctx,W,H){// 1100 x 1300; the ground is the bottom edge
  const brick=mix(BRICK,P.skyBot,0.3),trim=mix(TRIM,P.skyBot,0.3),slate=mix(P.stoneDark,P.skyTop,0.35);
  for(const x of [130,930]){const c=box(x,24,60,90,1);bricks(ctx,c,mix(brick,P.ink,0.2),[x,24,60,90]);ink(ctx,c,3);const cap=box(x-8,16,76,14,1);fill(ctx,cap,trim);ink(ctx,cap,2.5);}
  // the mansard: slate in scalloped rows, with three dormers, each a pair of windows (as in the photo)
  const roof=path([[70,306],[1030,306],[1000,96],[100,96]],{smooth:false,jit:1});fill(ctx,roof,slate);
  ctx.save();ctx.clip(roof);ctx.strokeStyle=hexA(P.ink,0.4);ctx.lineWidth=1.6;for(let y=104,k=0;y<310;y+=16,k++)for(let x=60+(k%2)*12;x<1050;x+=24){ctx.beginPath();ctx.arc(x,y,12,0.1,Math.PI-0.1);ctx.stroke();}ctx.restore();
  shade(ctx,roof,0,96,0,306,0.35);ink(ctx,roof,4);const crest=box(94,84,912,14,1);fill(ctx,crest,mix(P.ink,slate,0.4));ink(ctx,crest,2.5);
  for(const cx of [270,550,830]){const d=path([[cx-92,300],[cx-92,152],[cx-104,152],[cx-104,134],[cx+104,134],[cx+104,152],[cx+92,152],[cx+92,300]],{smooth:false,jit:1});fill(ctx,d,trim);shade(ctx,d,cx-92,0,cx+92,0,0.3);ink(ctx,d,3);
    for(const dx of [-40,40])stWin(ctx,cx+dx,168,56,116,{plain:true});}
  // the cornice under the roof, on brackets
  const cor=box(26,300,1048,40,1);fill(ctx,cor,trim);shade(ctx,cor,0,300,0,340,0.45);ink(ctx,cor,3.5);
  for(let x=46;x<1060;x+=56){const b=box(x,330,16,24,1);fill(ctx,b,mix(trim,P.ink,0.2));ink(ctx,b,1.8);}
  // brick walls, darker toward the top; warm near the door lamp
  const wall=box(50,340,1000,900,1);bricks(ctx,wall,brick,[50,340,1000,900]);shade(ctx,wall,0,900,0,340,0.42);
  ctx.save();ctx.clip(wall);const lg=ctx.createRadialGradient(410,990,10,410,990,460);lg.addColorStop(0,hexA(P.glow,0.3));lg.addColorStop(1,hexA(P.glow,0));ctx.fillStyle=lg;ctx.fillRect(0,0,W,H);ctx.restore();ink(ctx,wall,4);
  // upper floors: five bays, the middle one a pair. One office upstairs is still lit.
  for(const[top,h,lit] of [[370,160,-1],[610,180,4]])for(let i=0;i<5;i++){if(i===2){for(const dx of [-38,38])stWin(ctx,BAYS[i]+dx,top,62,h);}else stWin(ctx,BAYS[i],top,96,h,{lit:i===lit,blind:0.45});}
  // the sign board (a guess: the photo is too small to read one) and the belt course
  const sb=box(250,812,600,46,1);fill(ctx,sb,P.woodDark);ctx.save();ctx.strokeStyle=P.brass;ctx.lineWidth=2;ctx.strokeRect(260,820,580,30);ctx.restore();
  txt(ctx,'NATURAL HISTORY SOCIETY · MUSEUM',550,845,26,{c:P.brass,maxW:540});ink(ctx,sb,3);
  const belt=box(44,862,1012,18,1);fill(ctx,belt,trim);ink(ctx,belt,2.5);
  // ground floor: a wide arched doorway (bay 1, closed), lit arched windows (the museum is open), and the opening
  // for the front door, which is its own cut-out (drawFrontDoor) so it can be clicked
  const ca=arch(120,930,190,370);fill(ctx,ca,trim);ink(ctx,ca,3);const cd=arch(120,946,158,354);fill(ctx,cd,mix(P.woodDark,P.skyBot,0.25));
  ctx.save();ctx.clip(cd);for(let x=44;x<200;x+=22)line(ctx,[[x,940],[x,1300]],2,P.ink,0.5);ctx.restore();line(ctx,[[120,1020],[120,1300]],3,P.ink,0.8);ink(ctx,cd,3);
  for(const i of [1,3,4])stWin(ctx,BAYS[i],940,100,250,{lit:true,arch:true,blind:0.22});
  fill(ctx,arch(550,880,230,420),P.ink);
  lantern(ctx,408,920);
  const base=box(40,1240,1020,60,1);fill(ctx,base,mix(P.stone,P.skyBot,0.3));let x=40;while(x<1060){line(ctx,[[x,1240],[x,1300]],2,P.ink,0.6);x+=rr(90,140);}ink(ctx,base,3);
  line(ctx,[[1036,344],[1036,1292]],7,mix(P.stoneDark,P.ink,0.3));}
// the front door: stone surround, a lit fanlight with the number, two panelled doors, two granite steps. 260 x 420.
function drawFrontDoor(ctx,W,H){const cx=W/2,trim=mix(TRIM,P.skyBot,0.25);
  const sur=arch(cx,4,248,H-28);fill(ctx,sur,trim);shade(ctx,sur,0,0,W,0,0.25);ink(ctx,sur,3.5);
  const op=arch(cx,22,206,H-46);fill(ctx,op,P.ink);
  const fan=arch(cx,26,198,99);const g=ctx.createRadialGradient(cx,125,4,cx,125,110);g.addColorStop(0,mix(P.glow,P.paper,0.35));g.addColorStop(1,P.glowDim);ctx.fillStyle=g;ctx.fill(fan);
  for(let k=1;k<6;k++){const a=Math.PI+k/6*Math.PI;line(ctx,[[cx,125],[cx+Math.cos(a)*99,125+Math.sin(a)*99]],3,P.woodDark);}
  txt(ctx,'72',cx,112,30,{c:P.woodDark});line(ctx,[[cx-99,125],[cx+99,125]],7,P.woodDark);ink(ctx,fan,2.5);
  for(const s of [-1,1]){const x0=s<0?cx-100:cx+2,d=box(x0,129,98,H-170,1);fill(ctx,d,P.wood);shade(ctx,d,cx+s*100,0,cx,0,0.35);
    for(const[py,ph] of [[146,120],[282,H-170-170]]){const pn=box(x0+14,py,70,ph,1);fill(ctx,pn,mix(P.wood,P.ink,0.18));ink(ctx,pn,2);}ink(ctx,d,3);dot(ctx,cx+s*14,262,6,P.brass);}
  const s1=box(cx-124,H-44,248,22,1),s2=box(cx-136,H-22,272,22,1);for(const s of [s1,s2]){fill(ctx,s,mix(P.stone,P.skyBot,0.25));ctx.save();ctx.clip(s);ctx.fillStyle=hexA(P.glow,0.16);ctx.fillRect(0,0,W,H);ctx.restore();ink(ctx,s,2.5);}}
// the neighbours (invented): v0 a darker, lower brick block with a shut shop, as on the left in the photo;
// v1 a clapboard house with a gable, the commonest kind of house in Saint John
function drawNeighbour(v){return(ctx,W,H)=>{
  if(v===0){const brick=mix('#4b3a33',P.skyBot,0.35),trim=mix(TRIM,P.skyBot,0.45);
    const wall=box(30,90,W-60,H-90,1);bricks(ctx,wall,brick,[30,90,W-60,H-90]);shade(ctx,wall,0,H,0,90,0.45);ink(ctx,wall,4);
    const cor=box(16,70,W-32,34,1);fill(ctx,cor,trim);shade(ctx,cor,0,70,0,104,0.5);ink(ctx,cor,3);
    for(const[top,lit] of [[170,-1],[440,1]])for(let i=0;i<4;i++)stWin(ctx,150+i*250,top,88,170,{lit:i===lit,blind:0.6});
    const sf=box(80,700,W-160,250,1);fill(ctx,sf,P.woodDark);ink(ctx,sf,3);const fasc=box(70,672,W-140,36,1);fill(ctx,fasc,mix(P.woodDark,P.skyBot,0.2));ink(ctx,fasc,2.5);
    for(const x of [110,620]){const gl=box(x,730,320,170,1);fill(ctx,gl,mix(P.glass,P.skyBot,0.3));ctx.save();ctx.clip(gl);ctx.strokeStyle=hexA(P.paper,0.15);ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(x+200,730);ctx.lineTo(x+60,900);ctx.stroke();ctx.restore();ink(ctx,gl,2.5);}
    const dr=box(468,730,114,H-730,1);fill(ctx,dr,mix(P.wood,P.ink,0.3));ink(ctx,dr,3);
    const st=box(30,H-50,W-60,50,1);fill(ctx,st,mix(P.stone,P.skyBot,0.4));ink(ctx,st,2.5);return;}
  const wood=mix(v===1?'#5d6a62':'#6d5b48',P.skyBot,0.4),trim=mix(P.paper,P.skyBot,0.45);
  const body=path([[40,H],[40,300],[W/2,60],[W-40,300],[W-40,H]],{smooth:false,jit:1});fill(ctx,body,wood);
  ctx.save();ctx.clip(body);for(let y=70;y<H;y+=18){line(ctx,[[0,y],[W,y+2]],2,P.ink,0.35);line(ctx,[[0,y+2],[W,y+4]],1.5,P.paper,0.06);}ctx.restore();
  shade(ctx,body,0,H,0,60,0.4);ink(ctx,body,4);const eave=path([[20,316],[W/2,44],[W-20,316]],{closed:false,smooth:false});line(ctx,[[20,316],[W/2,44],[W-20,316]],12,mix(P.ink,wood,0.3));
  stWin(ctx,W/2,170,80,110,{plain:true,lit:v===2});
  for(const[top,lit] of [[380,v===1?0:-1],[640,-1]])for(let i=0;i<3;i++)stWin(ctx,200+i*(W-400)/2,top,90,170,{plain:true,lit:i===lit,blind:0.5});
  for(let i=0;i<3;i++)for(const top of [380,640]){const cx=200+i*(W-400)/2;for(const s of [-1,1]){const sh=box(cx+s*72-17,top-6,34,182,1);fill(ctx,sh,mix(trim,P.ink,0.35));ink(ctx,sh,2);}}
  const dr=box(W/2-60,H-230,120,230,1);fill(ctx,dr,mix(P.wood,P.ink,0.25));ink(ctx,dr,3);const hood=box(W/2-80,H-250,160,22,1);fill(ctx,hood,trim);ink(ctx,hood,2.5);
  for(const x of [56,W-56])line(ctx,[[x,300],[x,H]],8,trim);}}
function drawPole(ctx,W,H){const wood=mix('#4a3b2c',P.skyBot,0.3),cx=W/2;
  const post=path([[cx-16,H],[cx-10,40],[cx+10,40],[cx+16,H]],{smooth:false,jit:0.8});fill(ctx,post,wood);hatch(ctx,post,{ang:1.5,gap:14,a:0.22});line(ctx,[[cx+5,H-20],[cx+4,60]],2,P.paper,0.12);ink(ctx,post,3);
  for(const[y,n] of [[110,4],[200,2]]){const arm=box(cx-n*21-14,y,n*42+28,14,1);fill(ctx,arm,wood);ink(ctx,arm,2.5);
    for(let i=0;i<n;i++){const x=cx-(n-1)*21+i*42;const ins=path([[x-7,y],[x-6,y-18],[x+6,y-18],[x+7,y]],{smooth:false});fill(ctx,ins,'#5f8f88');ink(ctx,ins,1.8);}}
  for(let y=360;y<H-40;y+=70)line(ctx,[[cx-12,y],[cx+12,y+4]],3,P.ink,0.7);}
function drawFence(ctx,W,H){const wood=mix('#5b4a38',P.skyBot,0.45);let x=4;let i=0;
  while(x<W-4){const w=rr(38,46),top=rr(6,22)+(i%7===3?28:0);if(!(i%9===5)){const b=path([[x,H-4],[x,top+8],[x+w/2,top],[x+w,top+8],[x+w,H-4]],{smooth:false,jit:0.8});fill(ctx,b,mix(wood,P.ink,rr(0,0.25)));hatch(ctx,b,{ang:1.52,gap:9,a:0.18});ink(ctx,b,2.2);}x+=w+2;i++;}
  line(ctx,[[0,60],[W,62]],8,mix(wood,P.ink,0.4));line(ctx,[[0,H-36],[W,H-34]],8,mix(wood,P.ink,0.4));}
function drawShed(ctx,W,H){const wood=mix('#4f4436',P.far,0.5);const b=path([[30,H],[30,140],[W/2,40],[W-30,140],[W-30,H]],{smooth:false,jit:1});fill(ctx,b,wood);
  ctx.save();ctx.clip(b);for(let x=30;x<W;x+=26)line(ctx,[[x,0],[x,H]],2,P.ink,0.4);ctx.restore();ink(ctx,b,3);const d=box(W/2-50,H-170,100,170,1);fill(ctx,d,mix(wood,P.ink,0.4));ink(ctx,d,2.5);}
function drawRoad(ctx,W,H){// packed earth and gravel; two worn wheel tracks; a puddle or two with the sky in them
  ctx.fillStyle=mix('#4c4338',P.skyBot,0.45);ctx.fillRect(0,0,W,H);
  for(let i=0;i<1400;i++){ctx.fillStyle=R()<0.5?hexA(P.ink,rr(0.15,0.4)):hexA(P.paper,rr(0.05,0.14));ctx.beginPath();ctx.arc(rr(0,W),rr(0,H),rr(1,3.4),0,TAU);ctx.fill();}
  for(const y of [H*0.3,H*0.42,H*0.68,H*0.8]){ctx.fillStyle=hexA(P.ink,0.16);ctx.fillRect(0,y-10,W,20);line(ctx,[[0,y-11],[W,y-11]],2,P.ink,0.22);}
  for(let i=0;i<2;i++){const x=rr(150,W-150),y=rr(H*0.25,H*0.85);const pd=path(ell(x,y,rr(50,90),rr(16,26),14,0.15));fill(ctx,pd,mix(P.glass,P.skyBot,0.5));ctx.save();ctx.clip(pd);ctx.globalAlpha=0.3;ctx.fillStyle=P.paper;ctx.fillRect(x-30,y-20,6,40);ctx.restore();ink(ctx,pd,2,mix(P.ink,P.glass,0.3));}}
function drawWalk(ctx,W,H){// the sidewalk: flagstones
  ctx.fillStyle=mix(P.stoneDark,P.ink,0.3);ctx.fillRect(0,0,W,H);const rows=2,rh=H/rows;
  for(let r=0;r<rows;r++){let x=0;const y=r*rh;while(x<W-40){let w=rr(150,260);if(x+w>W-60)w=W-x;const s=box(x+3,y+3,w-6,rh-6,1.2);fill(ctx,s,mix(mix(P.stone,P.stoneDark,rr(0,0.4)),P.skyBot,0.25));if(R()<0.3)crack(ctx,x+rr(10,w-10),y+5,rh*0.7,Math.PI/2+rr(-0.5,0.5),1.6);mottle(ctx,s,P.ink,0.08,3,20,[x,y,w,rh]);ink(ctx,s,2);x+=w;}}}
function drawCurb(ctx,W,H){ctx.fillStyle=mix(mix(P.stone,P.stoneDark,0.3),P.skyBot,0.2);ctx.fillRect(0,0,W,H);for(let x=0;x<W;x+=256)line(ctx,[[x,0],[x,H]],2,P.ink,0.6);ctx.fillStyle=hexA(P.paper,0.2);ctx.fillRect(0,0,W,4);ctx.fillStyle=hexA(P.ink,0.5);ctx.fillRect(0,H-6,W,6);}
function drawSideWall(ctx,W,H){// 720 x 970: the brick side over the lot, up to the cornice (the mansard is drawn on the front)
  const brick=mix(BRICK,P.ink,0.35);const wl=box(0,0,W,H,1);bricks(ctx,wl,brick,[0,0,W,H]);shade(ctx,wl,0,0,W,0,0.5);
  for(const top of [60,320,640])for(const cx of [200,520])stWin(ctx,cx,top,90,170,{});ink(ctx,wl,3);}
function drawSky(ctx,W,H){const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,P.skyTop);g.addColorStop(0.62,mix(P.skyTop,P.skyBot,0.55));g.addColorStop(1,P.skyBot);ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  for(let i=0;i<220;i++){const y=rr(0,H*0.6);dot(ctx,rr(0,W),y,rr(0.5,1.6),hexA(P.paper,rr(0.25,0.8)*(1-y/(H*0.7))));}}
function drawSkyline(ctx,W,H){// the town behind: roofs and chimneys, a few lit windows
  const shapes=[];let x=-20;
  while(x<W){const w=rr(70,200),h=rr(140,400),top=H-h,k=R();let pts;
    if(k<0.4)pts=[[x,H],[x,top],[x+w/2,top-rr(40,110)],[x+w,top],[x+w,H]];
    else if(k<0.7)pts=[[x,H],[x,top],[x+w,top],[x+w,H]];
    else pts=[[x,H],[x,top+24],[x+14,top],[x+w-14,top],[x+w,top+24],[x+w,H]];
    shapes.push({pts,x,w,top});if(R()<0.6){const cx=x+w*rr(0.15,0.75),ch=rr(30,80);shapes.push({pts:[[cx,top+14],[cx,top-ch],[cx+18,top-ch],[cx+18,top+14]],chim:true});}
    x+=w*rr(0.7,0.98);}
  const paths=shapes.map(s=>path(s.pts,{smooth:false,jit:1.5}));ctx.save();ctx.strokeStyle=mix(P.far,P.ink,0.55);ctx.lineWidth=6;ctx.lineJoin='round';for(const p of paths)ctx.stroke(p);ctx.restore();
  for(const p of paths)fill(ctx,p,P.far);
  for(const s of shapes){if(s.chim)continue;const n=(s.w/40|0);for(let i=0;i<n;i++)for(let j=0;j<4;j++)if(R()<0.12){const wx=s.x+12+i*36,wy=s.top+30+j*48;if(wy<H-20){ctx.fillStyle=hexA(P.glowDim,rr(0.5,0.95));ctx.fillRect(wx,wy,12,18);}}}}
function drawMoon(ctx,W,H){const m=path(ell(W/2,H/2,W*0.4,W*0.4,30,0.008));fill(ctx,m,'#efe4c4');hatch(ctx,m,{ang:0.7,gap:9,a:0.2,clip2:box(0,0,W*0.42,H,0)});ink(ctx,m,5);}
function drawMat(ctx,W,H){const b=box(6,6,W-12,H-12,1.5);fill(ctx,b,'#7a5a34');ctx.save();ctx.clip(b);for(let i=0;i<900;i++){ctx.strokeStyle=R()<0.5?hexA(P.ink,0.3):hexA(P.paper,0.12);ctx.lineWidth=1.4;const x=rr(0,W),y=rr(0,H);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+rr(-3,3),y+rr(4,8));ctx.stroke();}ctx.restore();
  ctx.save();ctx.strokeStyle=hexA(P.ink,0.5);ctx.lineWidth=10;ctx.strokeRect(26,22,W-52,H-44);ctx.restore();ink(ctx,b,3);}

/* ================= KING SQUARE, SYDNEY STREET AND THE OLD BURIAL GROUND =================
   King Square: set aside in 1785; its paths laid out in the 1840s in the pattern of the Union Jack; the two-storey
   bandstand, iron-framed with a copper roof, built in 1908 (architect Neil Brodie, for the City Cornet Band). Across
   Sydney Street, the Loyalist Burial Ground (1783; oldest stone 1784; closed to burials in 1848), which runs to Union
   Street. Mrs. Hanlon's boarding house on Sydney Street is invented, and so are the neighbours, the trees' places, the
   lamps and benches. Facades are drawn at 80 px a unit. Sources: docs/SOURCES.md ("Saint John in 1910"). */
const GRASS=()=>mix('#2f4430',P.skyBot,0.3),GRAVEL=()=>mix('#8a806a',P.skyBot,0.35);
function drawSquareGround(ctx,W,H){// 2048 x 600 = 34 x 10 units: grass, and the gravel paths of the Union Jack
  ctx.fillStyle=GRASS();ctx.fillRect(0,0,W,H);
  for(let i=0;i<2600;i++){ctx.strokeStyle=R()<0.5?hexA(P.ink,rr(0.15,0.35)):hexA('#9ab07a',rr(0.05,0.14));ctx.lineWidth=1.4;const x=rr(0,W),y=rr(0,H);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+rr(-2,2),y-rr(4,9));ctx.stroke();}
  const band=(pts,w)=>{ctx.save();ctx.strokeStyle=GRAVEL();ctx.lineWidth=w;ctx.lineCap='butt';ctx.beginPath();ctx.moveTo(...pts[0]);for(const p of pts.slice(1))ctx.lineTo(...p);ctx.stroke();
    ctx.strokeStyle=hexA(P.ink,0.35);ctx.lineWidth=w+6;ctx.globalCompositeOperation='destination-over';ctx.stroke();ctx.restore();};
  const cx=W*0.5,cy=H*0.5;
  band([[0,0],[W,H]],46);band([[0,H],[W,0]],46);band([[cx,0],[cx,H]],70);band([[0,cy],[W,cy]],70);// the Union Jack: the diagonals, then the cross
  ctx.save();ctx.globalCompositeOperation='source-atop';for(let i=0;i<1600;i++){ctx.fillStyle=R()<0.5?hexA(P.ink,0.18):hexA(P.paper,0.08);ctx.fillRect(rr(0,W),rr(0,H),rr(2,4),rr(2,4));}ctx.restore();
  const ring=path(ell(cx,cy,150,90,30,0.01));fill(ctx,ring,GRAVEL());ink(ctx,ring,3,hexA(P.ink,0.4));}
function drawSidewalkGround(ctx,W,H){// 1024 x 300: Sydney Street's packed earth, then the flagstones (the top quarter)
  drawRoad(ctx,W,H);ctx.fillStyle=mix(P.stoneDark,P.ink,0.3);ctx.fillRect(0,0,W,H*0.26);let x=0;while(x<W-30){const w=rr(110,180);const s=box(x+3,3,w-6,H*0.26-6,1.2);fill(ctx,s,mix(mix(P.stone,P.stoneDark,rr(0,0.4)),P.skyBot,0.25));ink(ctx,s,2);x+=w;}}
function drawElm(ctx,W,H){// 600 x 760: an elm, the street tree of 1910 Saint John
  const bark=mix('#3a2c22',P.skyBot,0.3),leaf=mix('#2e4a2c',P.skyBot,0.32);
  const tr=path([[W/2-26,H],[W/2-16,H-230],[W/2-70,H-420],[W/2-40,H-430],[W/2-4,H-300],[W/2+30,H-440],[W/2+60,H-430],[W/2+18,H-230],[W/2+28,H]],{jit:2});fill(ctx,tr,bark);hatch(ctx,tr,{ang:1.45,gap:9,a:0.3});ink(ctx,tr,4);
  const blobs=[];for(let i=0;i<34;i++){const a=rr(0,TAU),r=rr(0,1)**0.6;blobs.push([W/2+Math.cos(a)*r*230,250+Math.sin(a)*r*170,rr(50,90)]);}
  blobs.sort((a,b)=>a[1]-b[1]);for(const[x,y,s] of blobs){const b=path(ell(x,y,s,s*0.8,14,0.12));cel(ctx,b,mix(leaf,P.ink,rr(0,0.2)),{s:9,dark:0.4,ha:0.25,ra:0.12});}
  const all=new Path2D();for(const[x,y,s] of blobs)all.addPath(path(ell(x,y,s,s*0.8,14,0)));ctx.save();ctx.strokeStyle=hexA(P.ink,0.22);ctx.lineWidth=1.6;ctx.stroke(all);ctx.restore();}
function drawLampPost(ctx,W,H){// 120 x 460: a cast-iron gas lamp on a post
  const iron=mix(P.boot,P.skyBot,0.15),cx=W/2;const post=path([[cx-9,H-20],[cx-6,140],[cx+6,140],[cx+9,H-20]],{smooth:false,jit:0.4});fill(ctx,post,iron);line(ctx,[[cx+3,H-40],[cx+2,150]],2,P.paper,0.12);ink(ctx,post,2.6);
  const base=path([[cx-22,H],[cx-18,H-30],[cx-10,H-46],[cx+10,H-46],[cx+18,H-30],[cx+22,H]],{smooth:false});fill(ctx,base,iron);ink(ctx,base,2.6);
  line(ctx,[[cx-24,150],[cx+24,150]],4,iron);for(const sx of [-1,1])curl(ctx,cx+sx*20,150,sx<0?Math.PI:0,7,2.6,iron);
  const cage=path([[cx-30,62],[cx+30,62],[cx+20,136],[cx-20,136]],{smooth:false,jit:0.4});const g=ctx.createLinearGradient(0,62,0,136);g.addColorStop(0,mix(P.glow,P.paper,0.45));g.addColorStop(1,P.glow);ctx.fillStyle=g;ctx.fill(cage);
  for(const x of [cx-10,cx+10])line(ctx,[[x,62],[x*1+(x<cx?4:-4),136]],2,iron);ink(ctx,cage,3,iron);
  const cap=path([[cx-38,64],[cx,22],[cx+38,64]],{smooth:false});fill(ctx,cap,iron);ink(ctx,cap,2.4,iron);dot(ctx,cx,16,6,iron);}
function drawParkBench(ctx,W,H){// 300 x 150
  const wd=mix('#5a3f28',P.skyBot,0.3),iron=mix(P.boot,P.skyBot,0.15);
  for(const y of [30,52])line(ctx,[[22,y],[W-22,y]],14,wd);for(const y of [30,52])line(ctx,[[22,y-6],[W-22,y-6]],1.5,P.paper,0.1);
  line(ctx,[[18,88],[W-18,88]],16,wd);for(const x of [40,W-40]){line(ctx,[[x,20],[x,H-6]],7,iron);line(ctx,[[x-14,H-6],[x+14,H-6]],5,iron);curl(ctx,x+(x<W/2?-10:10),96,0,8,3,iron);}
  ctx.save();ctx.strokeStyle=hexA(P.ink,0.8);ctx.lineWidth=2;ctx.strokeRect(22,23,W-44,14);ctx.strokeRect(22,45,W-44,14);ctx.strokeRect(18,80,W-36,16);ctx.restore();}
function drawBandstand(ctx,W,H){// 1000 x 1000: the 1908 bandstand: a stone base with arches, an iron-railed upper deck on slim
  // iron columns, and a copper roof (two years old in 1910, so still copper-coloured, not yet green) with a finial
  const stone=mix('#7a7466',P.skyBot,0.35),iron=mix('#1e2a2a',P.skyBot,0.2),copper=mix('#9a5a34',P.skyBot,0.3),cx=W/2;
  const base=path([[150,H],[150,700],[850,700],[850,H]],{smooth:false,jit:1});fill(ctx,base,stone);ctx.save();ctx.clip(base);for(let y=712;y<H;y+=36){line(ctx,[[150,y],[850,y]],2,P.ink,0.4);for(let x=150+(y%72?0:40);x<850;x+=80)line(ctx,[[x,y],[x,y+36]],2,P.ink,0.4);}ctx.restore();
  for(const x of [250,410,590,750]){const a=arch(x,760,110,240);fill(ctx,a,mix(P.ink,P.skyBot,0.3));ink(ctx,a,3);}shade(ctx,base,0,700,0,H,0.3);ink(ctx,base,4);
  const deck=box(120,672,760,34,1);fill(ctx,deck,mix(stone,P.paper,0.15));ink(ctx,deck,3);
  // the rail and the columns of the upper deck, the bandsmen's stands behind
  for(let x=140;x<=860;x+=20)line(ctx,[[x,600],[x,672]],2.4,iron);line(ctx,[[130,600],[870,600]],7,iron);line(ctx,[[130,640],[870,640]],3,iron);
  for(const x of [150,330,500,670,850]){line(ctx,[[x,330],[x,672]],10,iron);for(const sx of [-1,1])curl(ctx,x+sx*16,350,sx<0?Math.PI:0,14,3,iron);}
  const frieze=box(120,300,760,40,1);fill(ctx,frieze,iron);ctx.save();ctx.clip(frieze);for(let x=130;x<880;x+=40)curl(ctx,x,320,0,10,2.4,mix(iron,P.paper,0.25));ctx.restore();ink(ctx,frieze,3);
  // the roof: a bell-shaped copper roof, ribbed, with a finial and a flag pole
  const roof=path([[90,304],[910,304],[820,250],[700,180],[580,120],[cx,96],[420,120],[300,180],[180,250]],{jit:1});cel(ctx,roof,copper,{s:16,dark:0.4,ha:0.25});
  ctx.save();ctx.clip(roof);for(const x of [180,300,420,cx,580,700,820])line(ctx,[[cx+(x-cx)*0.08,100],[x,304]],3,P.ink,0.4);ctx.restore();ink(ctx,roof,4);
  const fin=path([[cx-16,104],[cx,40],[cx+16,104]],{smooth:false});fill(ctx,fin,copper);ink(ctx,fin,2.4);line(ctx,[[cx,40],[cx,4]],4,iron);
  // the steps up
  for(let k=0;k<4;k++){const st=box(cx-70+k*0,H-12-k*14,140,14,1);fill(ctx,st,mix(stone,P.paper,0.1));ink(ctx,st,2);}}
function drawBoardingHouse(ctx,W,H){// 900 x 1150: a three-storey clapboard house with a bay window, ROOMS in the window
  const wood=mix('#6b6250',P.skyBot,0.4),trim=mix(P.paper,P.skyBot,0.45);
  const body=path([[30,H],[30,180],[W-30,180],[W-30,H]],{smooth:false,jit:1});fill(ctx,body,wood);
  ctx.save();ctx.clip(body);for(let y=190;y<H;y+=18){line(ctx,[[0,y],[W,y+2]],2,P.ink,0.35);line(ctx,[[0,y+2],[W,y+4]],1.5,P.paper,0.06);}ctx.restore();shade(ctx,body,0,H,0,180,0.38);ink(ctx,body,4);
  const cor=box(14,150,W-28,40,1);fill(ctx,cor,trim);shade(ctx,cor,0,150,0,190,0.45);ink(ctx,cor,3);
  const roof=path([[24,154],[60,40],[W-60,40],[W-24,154]],{smooth:false,jit:1});fill(ctx,roof,mix(P.stoneDark,P.skyTop,0.4));shade(ctx,roof,0,40,0,154,0.3);ink(ctx,roof,3.5);
  line(ctx,[[180,40],[180,0],[214,0],[214,40]],10,mix('#5a3a2a',P.skyBot,0.4));
  for(const[top,lit] of [[240,[0,0,1]],[520,[1,0,0]]])for(let i=0;i<3;i++)stWin(ctx,170+i*280,top,100,180,{plain:true,lit:!!lit[i],blind:0.45});
  // the bay window on the ground floor, ROOMS card in it
  const bay=box(80,790,300,250,1);fill(ctx,bay,trim);ink(ctx,bay,3);stWin(ctx,230,812,220,180,{plain:true,lit:true,blind:0.3});
  const card=box(200,920,60,34,0.6);fill(ctx,card,P.paper);ink(ctx,card,1.6);txt(ctx,'ROOMS',230,944,17,{font:FT,c:P.ink,maxW:52});
  for(const x of [40,W-40])line(ctx,[[x,190],[x,H]],8,trim);
  const step=box(500,H-40,250,40,1);fill(ctx,step,mix(P.stone,P.skyBot,0.3));ink(ctx,step,2.5);}
function drawBHDoor(ctx,W,H){// 200 x 330: the boarding house door: panels, a lit transom with the number, a brass knocker
  const trim=mix(P.paper,P.skyBot,0.4),cx=W/2;const fr=box(6,6,W-12,H-12,1);fill(ctx,fr,trim);ink(ctx,fr,3);
  const tr=box(24,22,W-48,46,1);const g=ctx.createLinearGradient(0,22,0,68);g.addColorStop(0,mix(P.glow,P.paper,0.3));g.addColorStop(1,P.glowDim);ctx.fillStyle=g;ctx.fill(tr);txt(ctx,'61',cx,58,26,{c:P.woodDark});ink(ctx,tr,2.4);
  const d=box(24,76,W-48,H-88,1);fill(ctx,d,mix('#2a3a4a',P.skyBot,0.2));shade(ctx,d,24,0,W-24,0,0.3);for(const[y,h] of [[96,90],[200,110]])for(const x of [36,cx+6]){const pn=box(x,y,58,h,1);fill(ctx,pn,mix('#2a3a4a',P.ink,0.2));ink(ctx,pn,2);}ink(ctx,d,3);
  dot(ctx,W-44,200,6,P.brass);const kn=path(ell(cx,160,10,12,10,0.04));ctx.save();ctx.strokeStyle=P.brass;ctx.lineWidth=4;ctx.stroke(kn);ctx.restore();}
function drawGraves(v){return(ctx,W,H)=>{// 480 x 260: a few old slate and sandstone stones, leaning, with lichen
  const slate=mix('#4a4e58',P.skyBot,0.35),sand=mix('#7a6e5a',P.skyBot,0.35);let x=20;R=mulberry(77+v*13);
  for(let i=0;i<3+v%2;i++){const w=rr(70,110),h=rr(120,200),c=R()<0.5?slate:sand,lean=rr(-0.12,0.12);ctx.save();ctx.translate(x+w/2,H-10);ctx.rotate(lean);
    const st=path([[-w/2,0],[-w/2,-h+w*0.3],[-w*0.3,-h+6],[0,-h],[w*0.3,-h+6],[w/2,-h+w*0.3],[w/2,0]],{jit:1});cel(ctx,st,c,{s:7,ha:0.25,ra:0.25});mottle(ctx,st,'#8a9a6a',0.25,6,10,[-w/2,-h,w,h]);
    for(let k=0;k<4;k++)line(ctx,[[-w*0.3,-h+40+k*16],[w*0.3,-h+40+k*16]],2,P.ink,0.35);ink(ctx,st,3);ctx.restore();x+=w+rr(14,40);}
  const gr=path([[0,H],[0,H-18],[W,H-14],[W,H]],{smooth:false});fill(ctx,gr,GRASS());}}
function drawRailing(ctx,W,H){// 512 x 120, repeats: a low iron railing with spear tops
  const iron=mix(P.boot,P.skyBot,0.2);line(ctx,[[0,30],[W,30]],6,iron);line(ctx,[[0,H-14],[W,H-14]],6,iron);
  for(let x=10;x<W;x+=26){line(ctx,[[x,18],[x,H-6]],4,iron);const t=path([[x-6,22],[x,4],[x+6,22]],{smooth:false});fill(ctx,t,iron);}}
function drawFingerpost(lines){return(ctx,W,H)=>{// 300 x 430: a wooden fingerpost; lines: [[text, dir], ...] dir 1 right, -1 left
  const wd=mix('#5a4630',P.skyBot,0.3),cx=W/2;const post=box(cx-10,40,20,H-40,1);fill(ctx,post,wd);hatch(ctx,post,{ang:1.5,gap:9,a:0.25});ink(ctx,post,2.6);
  lines.forEach(([t,d],i)=>{const y=60+i*62,x0=d>0?cx-20:cx+20,x1=d>0?W-10:10;const arm=path([[x0,y],[x1-d*22,y],[x1,y+22],[x1-d*22,y+44],[x0,y+44]],{smooth:false,jit:0.6});fill(ctx,arm,mix(P.paper,wd,0.25));ink(ctx,arm,2.6);
    txt(ctx,t,(x0+x1-d*18)/2,y+30,20,{font:FD,c:P.ink,maxW:Math.abs(x1-x0)-34});});}}
function drawSkyDay(ctx,W,H){// a foggy May morning: pale grey-blue, no stars
  const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#6f7a88');g.addColorStop(0.6,'#9aa2a8');g.addColorStop(1,'#b8bbb4');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  for(let i=0;i<14;i++){const y=rr(H*0.2,H*0.8),x=rr(0,W);const c=ctx.createRadialGradient(x,y,4,x,y,rr(80,200));c.addColorStop(0,'rgba(220,222,216,0.35)');c.addColorStop(1,'rgba(220,222,216,0)');ctx.fillStyle=c;ctx.fillRect(x-220,y-220,440,440);}}
/* ---- Mrs. Hanlon's boarding house, inside (invented): her kitchen, and your room at the back. 1910 furnishings. */
function drawStove(ctx,W,H){// 300 x 330: a black cast-iron kitchen range with a kettle and a pot
  const iron=mix(P.boot,P.ink,0.1),cx=W/2;const body=box(30,120,W-60,H-150,1.5);cel(ctx,body,iron,{s:6,hatch:false,ra:0.3,to:'#000000'});
  for(const x of [50,cx+6]){const d=box(x,170,W/2-64,100,1);fill(ctx,d,mix(iron,P.paper,0.08));ink(ctx,d,2);dot(ctx,x+(W/2-64)-12,220,5,P.brass);}
  const fire=box(60,276,W-120,22,1);fill(ctx,fire,hexA(P.glow,0.85));ink(ctx,fire,2);ink(ctx,body,3);
  const top=box(20,108,W-40,16,1);fill(ctx,top,mix(iron,P.paper,0.12));ink(ctx,top,2.4);for(const x of [40,W-40])line(ctx,[[x,H-30],[x,H]],8,iron);
  line(ctx,[[W-60,108],[W-60,0]],18,iron);
  const ket=path([[70,108],[74,76],[100,66],[126,76],[130,108]],{jit:0.6});cel(ctx,ket,mix(P.stone,P.ink,0.3),{s:4,hatch:false});ink(ctx,ket,2.4);line(ctx,[[126,84],[150,72]],5,mix(P.stone,P.ink,0.3));ctx.save();ctx.strokeStyle=P.ink;ctx.lineWidth=3;ctx.beginPath();ctx.arc(100,64,18,Math.PI,0);ctx.stroke();ctx.restore();
  const pot=box(150,80,70,30,1);fill(ctx,pot,mix(P.stone,P.ink,0.4));ink(ctx,pot,2.2);for(let k=0;k<3;k++)line(ctx,[[170+k*14,76],[166+k*14,50],[172+k*14,30]],2,P.paper,0.25);}
function drawKitchenTable(ctx,W,H){// 420 x 230: a scrubbed pine table, two chairs, a teapot and a loaf
  const pine=mix('#b8955a',P.ink,0.25),dark=mix(pine,P.ink,0.4);
  for(const x of [40,W-40]){const ch=path([[x-24,H],[x-24,40],[x+24,40],[x+24,H]],{smooth:false});ctx.save();ctx.lineWidth=7;ctx.strokeStyle=dark;ctx.stroke(ch);ctx.restore();line(ctx,[[x-24,130],[x+24,130]],7,dark);for(let k=0;k<3;k++)line(ctx,[[x-14+k*14,46],[x-14+k*14,128]],4,dark);}
  const top=box(70,110,W-140,22,1);fill(ctx,top,pine);ink(ctx,top,2.6);for(const x of [84,W-84])line(ctx,[[x,132],[x,H]],10,dark);
  const tp=path([[160,110],[164,84],[186,76],[208,84],[212,110]],{jit:0.5});cel(ctx,tp,mix('#3a5a7a',P.ink,0.2),{s:4,hatch:false});ink(ctx,tp,2.2);line(ctx,[[210,94],[226,84]],4,mix('#3a5a7a',P.ink,0.2));
  const lf=path(ell(270,98,34,16,14,0.06));cel(ctx,lf,'#b07a3a',{s:4,hatch:false});ink(ctx,lf,2.2);}
function drawDresser(ctx,W,H){// 300 x 430: a kitchen dresser with plates on the rack
  const wd=mix('#6a4a2a',P.ink,0.2);const top=box(20,20,W-40,240,1);fill(ctx,top,wd);ink(ctx,top,3);for(const y of [90,170])line(ctx,[[24,y],[W-24,y]],6,mix(wd,P.ink,0.3));
  for(const[y,n] of [[40,5],[120,5],[200,4]])for(let i=0;i<n;i++){const x=46+i*(W-92)/(n-1);const pl=path(ell(x,y+14,20,22,14,0.02));fill(ctx,pl,mix(P.paper,'#7a9ac0',0.18));ctx.save();ctx.strokeStyle=hexA('#3a5a8a',0.6);ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y+14,13,0,TAU);ctx.stroke();ctx.restore();ink(ctx,pl,1.8);}
  const base=box(10,260,W-20,H-270,1);fill(ctx,base,wd);for(const x of [24,W/2+4]){const d=box(x,280,W/2-34,H-300,1);fill(ctx,d,mix(wd,P.ink,0.15));ink(ctx,d,2);dot(ctx,x+(W/2-34)/2,300,5,P.brass);}ink(ctx,base,3);}
function drawBed(ctx,W,H){// 520 x 300: an iron bedstead with brass knobs, a patchwork quilt
  const iron=mix('#1e2430',P.ink,0.1);const quilt=path([[60,150],[470,150],[478,250],[52,250]],{jit:1});fill(ctx,quilt,'#7a3a32');
  ctx.save();ctx.clip(quilt);const cols=['#7a3a32','#3a5a6a','#8a7a4a','#5a3a5a','#c9c0a8'];for(let x=50;x<480;x+=40)for(let y=150;y<252;y+=34){ctx.fillStyle=cols[((x/40|0)+(y/34|0))%5];ctx.fillRect(x,y,40,34);}ctx.restore();stitch(ctx,[[60,184],[470,184]],P.paper,0.3);ink(ctx,quilt,3);
  const pil=path(ell(110,140,56,20,16,0.06));fill(ctx,pil,P.paper);ink(ctx,pil,2.4);
  for(const[x,h] of [[40,200],[490,140]]){line(ctx,[[x,H],[x,H-h]],9,iron);dot(ctx,x,H-h-8,10,P.brass);}
  ctx.save();ctx.strokeStyle=iron;ctx.lineWidth=6;for(let x=54;x<120;x+=16){ctx.beginPath();ctx.moveTo(x,H-60);ctx.lineTo(x,H-186);ctx.stroke();}ctx.restore();line(ctx,[[40,H-190],[120,H-190]],7,iron);line(ctx,[[40,H-60],[120,H-60]],7,iron);
  line(ctx,[[46,H-50],[494,H-50]],8,iron);}
function drawWashstand(ctx,W,H){// 200 x 300: a washstand with a jug and basin
  const wd=mix('#6a4a2a',P.ink,0.2);const top=box(16,110,W-32,16,1);fill(ctx,top,mix(P.paper,P.stone,0.3));ink(ctx,top,2.4);const b=box(24,126,W-48,H-130,1);fill(ctx,b,wd);ink(ctx,b,2.6);
  const bs=path([[44,110],[156,110],[140,82],[60,82]],{smooth:false,jit:0.4});fill(ctx,bs,mix(P.paper,'#7a9ac0',0.2));ink(ctx,bs,2.2);
  const jug=path([[80,96],[76,50],[90,30],[110,30],[124,50],[120,96]],{jit:0.4});cel(ctx,jug,mix(P.paper,'#7a9ac0',0.2),{s:4,hatch:false});ink(ctx,jug,2.2);line(ctx,[[118,44],[134,58],[120,80]],4,P.ink,0.7);}
function drawTrunk(ctx,W,H){// 230 x 150: Mr. Tull's trunk, E. T. on the lid
  const lea=mix('#4a3020',P.ink,0.1);const b=box(10,40,W-20,H-46,1.5);cel(ctx,b,lea,{s:6,ha:0.3});for(const x of [40,W-40])line(ctx,[[x,40],[x,H-6]],7,mix(P.brass,P.ink,0.3));
  const lid=path([[10,44],[14,16],[W-14,16],[W-10,44]],{smooth:false,jit:0.5});fill(ctx,lid,mix(lea,P.paper,0.06));ink(ctx,lid,2.6);ink(ctx,b,3);
  txt(ctx,'E. T.',W/2,36,18,{font:FD,c:mix(P.paper,P.brass,0.4)});const lk=box(W/2-10,46,20,20,1);fill(ctx,lk,P.brass);ink(ctx,lk,1.8);}
function drawNightTable(ctx,W,H){// 200 x 230: a small table with a candle and the morning paper
  const wd=mix('#6a4a2a',P.ink,0.2);const top=box(10,96,W-20,14,1);fill(ctx,top,wd);ink(ctx,top,2.4);for(const x of [24,W-24])line(ctx,[[x,110],[x,H]],8,wd);
  const pp=path([[40,96],[120,90],[132,96],[48,102]],{smooth:false});fill(ctx,pp,mix(P.paper,P.stone,0.15));ink(ctx,pp,1.6);txt(ctx,'The Standard',86,98,10,{c:P.ink,a:0.8,rot:-0.06});
  const cs=box(146,40,12,56,1);fill(ctx,cs,P.paper);ink(ctx,cs,1.8);const fl=path(ell(152,32,5,9,8,0.05));fill(ctx,fl,P.glow);dot(ctx,152,96,14,mix(P.brass,P.ink,0.2));}
/* ================= THE EVENING TRAIN, FROM OUTSIDE =================
   A 4-4-0 steam locomotive and tender with two wooden coaches, lit inside, crossing the dark country. Typical of a
   Canadian train of the period, not drawn from a particular engine. Side-on, facing right, 100 px a unit; y 0 is the
   rail. The wheels are their own pieces (they turn), the side rods are lines between the crank pins. */
const RAIL=()=>({body:mix('#1c2420',P.skyBot,0.1),black:mix('#0e1012',P.skyBot,0.08),red:mix('#6a1e16',P.skyBot,0.12),brass:mix(P.brass,P.skyBot,0.15),wood:mix('#4a2618',P.skyBot,0.15)});
function drawLoco(ctx,W,H){const c=RAIL(),U=cabU(0,4.2),pp=(pts,o)=>path(U(pts),o);// 760 x 420: x 0..7.6, y 0..4.2
  // frame and running board
  const fr=pp([[0.2,0.9],[6.9,0.9],[6.9,1.25],[0.2,1.25]],{smooth:false});fill(ctx,fr,c.black);ink(ctx,fr,2.6);
  // the cab, at the back
  const cab=pp([[0.1,1.2],[0.1,3.5],[0.05,3.62],[1.9,3.62],[1.85,3.5],[1.85,1.2]],{smooth:false,jit:0.6});cel(ctx,cab,c.wood,{s:8,ha:0.25});ink(ctx,cab,4);
  const cw=pp([[0.45,2.4],[1.45,2.4],[1.45,3.2],[0.45,3.2]],{smooth:false});const g=ctx.createLinearGradient(0,U([[0,3.2]])[0][1],0,U([[0,2.4]])[0][1]);g.addColorStop(0,P.glow);g.addColorStop(1,P.glowDim);ctx.fillStyle=g;ctx.fill(cw);ink(ctx,cw,2.4);
  const roof=pp([[0.0,3.62],[1.95,3.62],[1.9,3.78],[0.05,3.78]],{smooth:false});fill(ctx,roof,c.black);ink(ctx,roof,2.4);
  // the boiler, the firebox under the cab front, the smokebox at the front
  const bo=pp([[1.85,1.3],[1.85,2.75],[5.6,2.75],[5.6,1.3]],{smooth:false,jit:0.5});cel(ctx,bo,c.body,{s:10,dark:0.5});for(const x of [2.6,3.6,4.6])line(ctx,U([[x,1.3],[x,2.75]]),6,c.brass);ink(ctx,bo,4);
  const sb=pp([[5.6,1.25],[5.6,2.8],[6.55,2.8],[6.65,2.6],[6.65,1.25]],{smooth:false,jit:0.5});cel(ctx,sb,c.black,{s:6,hatch:false,ra:0.4});ink(ctx,sb,3.5);
  const stack=pp([[5.95,2.8],[5.9,3.55],[5.75,3.95],[6.45,3.95],[6.3,3.55],[6.25,2.8]],{smooth:false,jit:0.4});cel(ctx,stack,c.black,{s:4,hatch:false,ra:0.4});ink(ctx,stack,3);
  for(const[x,w] of [[3.1,0.5],[4.4,0.44]]){const dm=pp([[x-w/2,2.75],[x-w/2+0.06,3.18],[x,3.26],[x+w/2-0.06,3.18],[x+w/2,2.75]],{jit:0.3});cel(ctx,dm,c.brass,{s:4,hatch:false,ra:0.5});ink(ctx,dm,2.6);}
  const bell=pp([[3.68,2.75],[3.7,3.0],[3.84,3.08],[3.98,3.0],[4.0,2.75]]);fill(ctx,bell,c.brass);ink(ctx,bell,2);
  // the headlight: a big box lamp on the smokebox, lit
  const hl=pp([[6.05,2.82],[6.05,3.3],[6.62,3.3],[6.62,2.82]],{smooth:false});fill(ctx,hl,c.black);ink(ctx,hl,2.4);const lens=pp([[6.5,2.88],[6.5,3.24],[6.66,3.24],[6.66,2.88]],{smooth:false});fill(ctx,lens,mix(P.glow,P.paper,0.5));ink(ctx,lens,2);
  // the cylinder and the pilot (cowcatcher)
  const cy=pp([[5.3,0.95],[5.3,1.45],[6.25,1.45],[6.25,0.95]],{smooth:false});cel(ctx,cy,c.black,{s:4,hatch:false,ra:0.4});ink(ctx,cy,2.6);
  const pil=pp([[6.7,1.0],[7.55,0.12],[6.7,0.12]],{smooth:false});fill(ctx,pil,c.red);ctx.save();ctx.clip(pil);for(let x=6.7;x<7.6;x+=0.12)line(ctx,U([[x,1.0],[x,0.1]]),3,P.ink,0.6);ctx.restore();ink(ctx,pil,3);
  line(ctx,U([[0.2,1.25],[6.9,1.25]]),3,P.paper,0.12);}
function drawTender(ctx,W,H){const c=RAIL(),U=cabU(0,2.8),pp=(pts,o)=>path(U(pts),o);// 400 x 280: x 0..4, y 0..2.8
  const b=pp([[0.1,0.85],[0.1,2.3],[3.9,2.3],[3.9,0.85]],{smooth:false,jit:0.6});cel(ctx,b,c.body,{s:9,dark:0.5});ink(ctx,b,4);
  const coal=pp([[0.3,2.3],[0.6,2.62],[1.5,2.72],[2.6,2.64],[3.5,2.4],[3.7,2.3]],{jit:1.2});fill(ctx,coal,c.black);hatch(ctx,coal,{ang:0.6,gap:5,a:0.4,c:P.paper});ink(ctx,coal,2.4);
  line(ctx,U([[0.1,2.32],[3.9,2.32]]),5,c.brass);const fr=pp([[0.1,0.7],[3.9,0.7],[3.9,0.88],[0.1,0.88]],{smooth:false});fill(ctx,fr,c.black);ink(ctx,fr,2);}
function drawCoachOut(ctx,W,H){const c=RAIL(),U=cabU(0,3.4),pp=(pts,o)=>path(U(pts),o);// 1000 x 340: x 0..10, y 0..3.4
  const b=pp([[0.25,0.85],[0.25,2.72],[9.75,2.72],[9.75,0.85]],{smooth:false,jit:0.6});cel(ctx,b,c.wood,{s:9,dark:0.45,ha:0.25});
  ctx.save();ctx.clip(b);for(let x=0.3;x<9.8;x+=0.09)line(ctx,U([[x,0.85],[x,2.72]]),1.2,P.ink,0.25);ctx.restore();ink(ctx,b,4);
  for(let i=0;i<10;i++){const x=0.9+i*0.86;const w=pp([[x,1.7],[x,2.42],[x+0.52,2.42],[x+0.52,1.7]],{smooth:false});const gl=ctx.createLinearGradient(0,U([[0,2.42]])[0][1],0,U([[0,1.7]])[0][1]);gl.addColorStop(0,mix(P.glow,P.paper,0.3));gl.addColorStop(1,P.glow);ctx.fillStyle=gl;ctx.fill(w);
    ctx.save();ctx.clip(w);ctx.fillStyle=hexA(P.ink,0.35);if(i%3===1)ctx.fill(path(U([[x+0.1,1.7],[x+0.12,2.1],[x+0.22,2.18],[x+0.34,2.1],[x+0.36,1.7]])));ctx.restore();ink(ctx,w,2.4);}
  const roof=pp([[0.1,2.72],[0.3,3.0],[9.7,3.0],[9.9,2.72]],{smooth:false,jit:0.4});fill(ctx,roof,c.black);ink(ctx,roof,3);
  const cl=pp([[1.0,3.0],[1.0,3.3],[9.0,3.3],[9.0,3.0]],{smooth:false});fill(ctx,cl,c.black);for(let x=1.3;x<8.9;x+=0.6){const cw=pp([[x,3.06],[x,3.24],[x+0.3,3.24],[x+0.3,3.06]],{smooth:false});fill(ctx,cw,hexA(P.glow,0.8));}ink(ctx,cl,2.4);
  for(const x of [0.25,9.75])line(ctx,U([[x,0.9],[x,2.7]]),6,c.black);line(ctx,U([[0.25,1.0],[9.75,1.0]]),4,c.black);line(ctx,U([[0.25,1.65],[9.75,1.65]]),3,c.brass);}
function drawPuff(ctx,W,H){const g=ctx.createRadialGradient(W/2,H/2,4,W/2,H/2,W/2);g.addColorStop(0,'rgba(190,192,196,0.9)');g.addColorStop(0.6,'rgba(150,154,162,0.55)');g.addColorStop(1,'rgba(120,124,134,0)');ctx.fillStyle=g;
  for(let i=0;i<5;i++){ctx.beginPath();ctx.arc(W/2+rr(-20,20),H/2+rr(-16,16),rr(26,44),0,TAU);ctx.fill();}}
function drawTrack(ctx,W,H){// 1024 x 128, repeats along x: ballast, ties, two rails seen from the side and a little above
  ctx.fillStyle=mix('#2a2a2a',P.skyBot,0.3);ctx.fillRect(0,0,W,H);for(let i=0;i<900;i++){ctx.fillStyle=R()<0.5?hexA(P.ink,0.4):hexA(P.paper,0.1);ctx.fillRect(rr(0,W),rr(0,H),rr(2,5),rr(2,4));}
  for(let x=10;x<W;x+=48){const t=box(x,30,30,70,1);fill(ctx,t,mix('#3a2a20',P.skyBot,0.3));ink(ctx,t,1.6);}
  for(const y of [42,86]){line(ctx,[[0,y],[W,y]],7,mix('#5a5a60',P.skyBot,0.2));line(ctx,[[0,y-2],[W,y-2]],2,P.paper,0.35);}}
function drawSpruceBand(ctx,W,H){// 2048 x 300, repeats: a black row of spruce against the sky
  const c=mix(P.far,P.ink,0.6);for(let i=0;i<60;i++){const x=rr(0,W),h=rr(120,280),y=H;for(const ox of [0,-W,W]){const X=x+ox;if(X<-80||X>W+80)continue;const pts=[[X,y-h]];for(let k=1;k<=6;k++){const yy=y-h+k*h/6.2,w=k*h*0.06;pts.push([X+w,yy],[X+w*0.45,yy-h*0.025]);}pts.push([X+h*0.05,y],[X-h*0.05,y]);for(let k=6;k>=1;k--){const yy=y-h+k*h/6.2,w=k*h*0.06;pts.push([X-w*0.45,yy-h*0.025],[X-w,yy]);}fill(ctx,path(pts,{smooth:false}),c);}}
  ctx.fillStyle=c;ctx.fillRect(0,H-30,W,30);}

/* ================= THE OPENING: the evening train, and a cab to Union Street =================
   A wooden railway coach of the period: plush seats, mahogany panels, a brass luggage rack, a clerestory roof, roller
   blinds. Outside, the dark countryside and the telegraph line along the track. Then a hired cab (a closed
   four-wheeler, a horse and a cabman) from the Union Depot to the door. The details are typical of 1910, not drawn
   from a particular coach or cab. */
function drawCarWall(ctx,W,H){// 800 x 600 = 8 x 6 units: one bay of the coach, two windows (cut out: the country shows through)
  const mah=mix('#5a2a1c',P.ink,0.15),mahL=mix(mah,P.paper,0.12),brass=P.brass,WX=[200,600],WT=250,WB=440,WW=170;
  ctx.fillStyle=mah;ctx.fillRect(0,0,W,H);
  // the clerestory: a dark band of small windows under the roof
  ctx.fillStyle=mix(P.woodDark,P.ink,0.4);ctx.fillRect(0,0,W,78);for(let x=40;x<W;x+=120){const g=box(x,22,80,34,1);fill(ctx,g,mix(P.glass,P.skyBot,0.4));ink(ctx,g,2);}
  const cor=box(0,76,W,20,1);fill(ctx,cor,mahL);ink(ctx,cor,2);
  // the luggage rack: two brass rails with netting between, on brackets
  ctx.save();ctx.strokeStyle=hexA(P.paper,0.25);ctx.lineWidth=1.2;for(let x=0;x<W;x+=12){ctx.beginPath();ctx.moveTo(x,150);ctx.lineTo(x+10,186);ctx.stroke();ctx.beginPath();ctx.moveTo(x+10,150);ctx.lineTo(x,186);ctx.stroke();}ctx.restore();
  line(ctx,[[0,150],[W,150]],6,brass);line(ctx,[[0,188],[W,188]],5,brass);for(const x of [100,400,700]){line(ctx,[[x,120],[x,190]],5,brass);dot(ctx,x,120,5,brass);}
  // panels: upper (between rack and windows) and lower (under the sills)
  const panel2=(x,y,w,h)=>{const o=box(x,y,w,h,1);fill(ctx,o,mah);const i=box(x+10,y+10,w-20,h-20,1);fill(ctx,i,mix(mah,P.ink,0.2));line(ctx,[[x+10,y+h-10],[x+10,y+10],[x+w-10,y+10]],2,P.paper,0.12);ink(ctx,i,1.8);ink(ctx,o,2);};
  for(let x=10;x<W;x+=196)panel2(x,470,180,120);
  // pilasters between the windows, with a brass coat hook
  for(const x of [0,400,800]){const p=box(x-34,200,68,280,1);fill(ctx,p,mahL);ctx.save();ctx.clip(p);ctx.strokeStyle=hexA(P.ink,0.35);ctx.lineWidth=2;for(const dx of [-14,0,14]){ctx.beginPath();ctx.moveTo(x+dx,214);ctx.lineTo(x+dx,466);ctx.stroke();}ctx.restore();ink(ctx,p,2);
    curl(ctx,x,300,0.6,10,4,brass);dot(ctx,x,288,5,brass);}
  // the windows: frame, sill, roller blind half down
  for(const cx of WX){const fr=box(cx-WW/2-16,WT-16,WW+32,WB-WT+32,1);fill(ctx,fr,mahL);ink(ctx,fr,2.5);
    const sill=box(cx-WW/2-24,WB+8,WW+48,18,1);fill(ctx,sill,mahL);ink(ctx,sill,2);dot(ctx,cx,WB+4,5,brass);}
  // warm light from the ceiling lamps, falling down the wall
  const g=ctx.createLinearGradient(0,80,0,H);g.addColorStop(0,hexA(P.glow,0.22));g.addColorStop(0.5,hexA(P.glow,0.06));g.addColorStop(1,hexA(P.ink,0.35));ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  // cut the glass out, then hang the blinds back in
  ctx.save();ctx.globalCompositeOperation='destination-out';ctx.fillStyle='#000';for(const cx of WX)ctx.fillRect(cx-WW/2,WT,WW,WB-WT);ctx.restore();
  for(const cx of WX){const bl=box(cx-WW/2,WT,WW,46,1);fill(ctx,bl,mix(P.paper,'#b49a62',0.5));shade(ctx,bl,0,WT,0,WT+46,0.3);line(ctx,[[cx-WW/2,WT+46],[cx+WW/2,WT+46]],4,P.woodDark);line(ctx,[[cx-10,WT+46],[cx-10,WT+58],[cx+10,WT+58],[cx+10,WT+46]],2.5,P.woodDark);ink(ctx,bl,2);
    line(ctx,[[cx-WW/2,(WT+WB)/2+30],[cx+WW/2,(WT+WB)/2+30]],5,mahL);}}
function drawCountry(ctx,W,H){// 2048 x 512, tiles across: night sky, far hills, a river with the moon in it, spruce, a lit farmhouse
  const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,P.skyTop);g.addColorStop(0.55,mix(P.skyTop,P.skyBot,0.7));g.addColorStop(1,P.skyBot);ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  for(let i=0;i<160;i++){const y=rr(0,H*0.45);dot(ctx,rr(0,W),y,rr(0.6,1.6),hexA(P.paper,rr(0.2,0.7)));}
  const ridge=(base,amp,n1,n2,ph,c)=>{const pts=[[0,H]];for(let x=0;x<=W;x+=16)pts.push([x,base+Math.sin(x/W*TAU*n1+ph)*amp+Math.sin(x/W*TAU*n2+ph*2)*amp*0.35]);pts.push([W,H]);const p=path(pts,{smooth:false});fill(ctx,p,c);return p;};
  ridge(250,34,2,5,0.4,mix(P.far,P.skyBot,0.35));
  const river=box(0,330,W,50,0);fill(ctx,river,mix(P.skyBot,P.far,0.3));for(let i=0;i<40;i++){const x=rr(0,W);line(ctx,[[x,340+rr(0,32)],[x+rr(20,60),340+rr(0,32)]],2,P.paper,rr(0.1,0.3));}
  const near=ridge(372,10,3,7,1.3,mix(P.far,P.ink,0.45));
  const spruce=(x,y,h,c)=>{for(const ox of [0,-W,W]){const X=x+ox;if(X<-60||X>W+60)continue;const pts=[[X,y-h]];for(let k=1;k<=5;k++){const yy=y-h+k*h/5.2,w=k*h*0.075;pts.push([X+w,yy],[X+w*0.45,yy-h*0.03]);}pts.push([X+h*0.07,y],[X-h*0.07,y]);for(let k=5;k>=1;k--){const yy=y-h+k*h/5.2,w=k*h*0.075;pts.push([X-w*0.45,yy-h*0.03],[X-w,yy]);}fill(ctx,path(pts,{smooth:false}),c);}};
  for(let i=0;i<46;i++)spruce(rr(0,W),rr(372,400),rr(40,110),mix(P.far,P.ink,rr(0.5,0.75)));
  for(const fx of [520,1500]){const hs=path([[fx,384],[fx,330],[fx+40,300],[fx+80,330],[fx+80,384]],{smooth:false});fill(ctx,hs,mix(P.far,P.ink,0.4));ctx.fillStyle=hexA(P.glow,0.9);ctx.fillRect(fx+16,344,12,14);ctx.fillRect(fx+50,344,12,14);
    const gl=ctx.createRadialGradient(fx+40,350,2,fx+40,350,60);gl.addColorStop(0,hexA(P.glow,0.25));gl.addColorStop(1,hexA(P.glow,0));ctx.fillStyle=gl;ctx.fillRect(fx-30,290,140,120);}
  ctx.fillStyle=mix(P.far,P.ink,0.7);ctx.fillRect(0,400,W,H-400);}
function drawTrackPoles(ctx,W,H){// 1024 x 512, transparent: one pole of the telegraph line beside the track, and its wires
  const c=mix(P.far,P.ink,0.6);for(const[y,s] of [[96,26],[124,30],[150,30]])line(ctx,[[0,y],[W*0.25,y+s*0.8],[W*0.5,y],[W*0.75,y+s*0.8],[W,y]],2.5,c);
  const post=path([[500,H],[506,40],[518,40],[524,H]],{smooth:false});fill(ctx,post,c);for(const y of [92,146]){const a=box(452,y,120,10,1);fill(ctx,a,c);}
  for(const x of [462,492,532,562])dot(ctx,x,90,5,c);}
function drawCarFloor(ctx,W,H){// 1024 x 256: boards along the coach, a red runner down the aisle (lower half = nearer us)
  ctx.fillStyle=mix(P.woodDark,P.ink,0.2);ctx.fillRect(0,0,W,H);for(let y=0;y<H;y+=16){line(ctx,[[0,y],[W,y]],1.5,P.ink,0.5);}
  const run=box(-10,120,W+20,96,0);fill(ctx,run,mix(P.rug,P.ink,0.15));ctx.save();ctx.clip(run);ctx.strokeStyle=hexA(P.brass,0.5);ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,132);ctx.lineTo(W,132);ctx.moveTo(0,204);ctx.lineTo(W,204);ctx.stroke();ctx.restore();}
function drawSeatBack(ctx,W,H){// 300 x 300 at 200 px a unit: a plush seat seen side-on, facing right; its back on the left
  const plush=mix('#3b5a3e',P.ink,0.1),frame=mix('#5a2a1c',P.ink,0.2);
  const back=path([[44,36],[92,30],[100,60],[84,190],[44,196],[34,120]],{jit:0.8});fill(ctx,back,plush);ctx.save();ctx.clip(back);for(let y=60;y<190;y+=34)dot(ctx,66,y,4,mix(plush,P.ink,0.5));ctx.restore();shade(ctx,back,100,0,34,0,0.4);ink(ctx,back,3);
  const cush=path([[60,170],[262,168],[276,190],[264,206],[60,208]],{jit:0.8});fill(ctx,cush,plush);shade(ctx,cush,0,170,0,206,0.35);ink(ctx,cush,3);
  const rail=box(28,26,22,186,1);fill(ctx,rail,frame);ink(ctx,rail,2.5);
  for(const x of [80,240]){line(ctx,[[x,208],[x-6,H-6]],8,mix(P.boot,P.ink,0.2));}line(ctx,[[60,262],[246,262]],5,mix(P.boot,P.ink,0.2));}
function drawSeatEnd(ctx,W,H){// 300 x 230 at 200 px a unit: the carved end of the seat on the aisle side, with its armrest
  const wd=mix('#5a2a1c',P.paper,0.06);
  const p=path([[30,H],[30,70],[40,46],[200,40],[252,46],[270,66],[258,86],[236,80],[226,96],[232,H]],{jit:0.8});fill(ctx,p,wd);shade(ctx,p,270,0,30,0,0.35);
  const ov=path(ell(130,150,62,42,20,0.01));fill(ctx,ov,mix(wd,P.ink,0.22));line(ctx,[[90,150],[170,150]],2,P.paper,0.15);ink(ctx,ov,2);
  curl(ctx,252,64,0,13,4,mix(wd,P.ink,0.5));const arm=box(38,40,200,14,1);fill(ctx,arm,mix(wd,P.paper,0.12));ink(ctx,arm,2);ink(ctx,p,3.5);
  const foot=box(22,H-16,220,16,1);fill(ctx,foot,P.boot);ink(ctx,foot,2);}
// the cab: a brougham (a closed one-horse carriage, the usual hired cab), side-on, facing right, 100 px a unit.
// Cab frame: x 0 is the middle of the door, y 0 the road. Canvas x -2.0..3.3, y 0..4.7.
const CABC=()=>({body:mix('#2d1a20',P.skyBot,0.15),upper:mix('#151319',P.skyBot,0.15),lining:mix('#c09443',P.skyBot,0.3),iron:mix(P.boot,P.skyBot,0.12),leather:mix('#1d1715',P.skyBot,0.12)});
function cabU(x0,y1){return pts=>pts.map(([x,y])=>[(x-x0)*100,(y1-y)*100]);}
function drawCab(ctx,W,H){const c=CABC(),U=cabU(-2.0,4.7),pp=(pts,o)=>path(U(pts),o),pt=(x,y)=>U([[x,y]])[0];
  // the undercarriage: the perch from the back axle to the front, and the springs
  line(ctx,U([[-0.9,0.95],[0.2,0.88],[1.4,0.95],[2.3,1.12]]),10,c.iron);
  for(const[x0,x1,y] of [[-1.55,-0.25,1.02],[1.85,2.75,1.22]]){const sp=pp([[x0,y],[(x0+x1)/2,y+0.09],[x1,y],[(x0+x1)/2,y-0.09]]);fill(ctx,sp,c.iron);ink(ctx,sp,2.5);}
  const fb=pp([[1.75,1.3],[2.85,1.3],[2.85,1.42],[1.75,1.42]],{smooth:false});fill(ctx,fb,c.iron);ink(ctx,fb,2);// the front axle bed
  // the box: the cabman's seat, raised over the front wheels on its boot, with a footboard and a curved dashboard
  const boot=pp([[1.3,1.5],[2.28,1.62],[2.36,2.5],[1.4,2.55]],{jit:0.8});cel(ctx,boot,c.body,{s:8,ha:0.25});ctx.save();ctx.clip(boot);ctx.strokeStyle=c.lining;ctx.lineWidth=2;ctx.stroke(pp([[1.42,1.62],[2.2,1.72],[2.26,2.4],[1.5,2.44]]));ctx.restore();ink(ctx,boot,3.5);
  const seat=pp([[1.34,2.52],[2.42,2.5],[2.46,2.64],[1.36,2.68]],{jit:0.5});cel(ctx,seat,c.leather,{s:4,hatch:false});ink(ctx,seat,2.5);
  line(ctx,U([[1.38,2.6],[1.3,2.95],[1.48,3.0]]),6,c.iron);// the seat rail
  const foot=pp([[2.2,1.68],[2.98,1.86],[2.98,1.96],[2.2,1.8]],{smooth:false});fill(ctx,foot,c.leather);ink(ctx,foot,2.2);
  const dash=pp([[2.92,1.88],[3.04,1.9],[3.2,2.35],[3.24,2.72],[3.14,2.74],[3.06,2.38]],{jit:0.5});fill(ctx,dash,c.leather);hatch(ctx,dash,{ang:1.2,gap:7,a:0.25,c:P.paper});ink(ctx,dash,2.5);stitch(ctx,U([[3.0,1.95],[3.14,2.35],[3.18,2.68]]),c.lining,0.5);
  // the body: a curved bottom line, dropped at the door, rising at the front to clear the front wheel; a bowed glass front
  const b=pp([[-1.72,3.02],[0.2,3.08],[1.05,3.06],[1.28,2.92],[1.42,2.25],[1.38,1.62],[1.18,1.18],[0.72,0.88],[-0.4,0.8],[-1.15,0.94],[-1.66,1.3],[-1.84,2.1],[-1.82,2.8]],{jit:0.8});
  cel(ctx,b,c.body,{s:12,ha:0.22});
  ctx.save();ctx.clip(b);const up=pp([[-2,3.2],[1.5,3.2],[1.5,2.08],[-2,2.08]],{smooth:false});fill(ctx,up,c.upper);// the upper quarter is black
  ctx.strokeStyle=c.lining;ctx.lineWidth=2.4;ctx.stroke(pp([[-1.6,1.98],[-1.52,1.3],[-1.05,1.04],[-0.4,0.92],[0.65,0.99],[1.08,1.24],[1.26,1.66],[1.28,1.98]]));// coach lining
  const shine=ctx.createLinearGradient(...pt(1.2,3),...pt(-1.4,1));shine.addColorStop(0,hexA(P.glow,0.16));shine.addColorStop(0.5,hexA(P.glow,0));ctx.fillStyle=shine;ctx.fill(b);ctx.restore();
  // windows: the bowed front glass, the small back quarter, the door's dropped glass
  const fg=pp([[1.05,2.95],[1.24,2.88],[1.36,2.24],[1.08,2.22]],{smooth:false});fill(ctx,fg,mix(P.glass,P.skyBot,0.45));ink(ctx,fg,2.2);
  const qw=pp([[-1.58,2.86],[-0.72,2.9],[-0.72,2.2],[-1.58,2.2]],{jit:0.4});fill(ctx,qw,mix(P.glass,P.skyBot,0.4));ctx.save();ctx.clip(qw);ctx.strokeStyle=hexA(P.paper,0.22);ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(...pt(-0.9,2.9));ctx.lineTo(...pt(-1.3,2.2));ctx.stroke();ctx.restore();ink(ctx,qw,2.2);
  const door=pp([[-0.5,2.98],[0.52,2.98],[0.55,0.86],[-0.48,0.84]],{smooth:false,jit:0.5});ink(ctx,door,2.6);
  const dw=pp([[-0.36,2.86],[0.4,2.86],[0.4,2.18],[-0.36,2.18]],{jit:0.4});fill(ctx,dw,mix(P.glass,P.ink,0.3));ctx.save();ctx.clip(dw);const gl=pp([[-0.36,2.6],[0.4,2.6],[0.4,2.18],[-0.36,2.18]],{smooth:false});fill(ctx,gl,mix(P.glass,P.skyBot,0.5));line(ctx,U([[-0.36,2.6],[0.4,2.6]]),4,c.upper);ctx.restore();ink(ctx,dw,2.2);
  const hd=pt(0.42,1.82);line(ctx,[hd,[hd[0]-14,hd[1]+2]],5,P.brass);dot(ctx,hd[0],hd[1],4,P.brass);
  const rail=pp([[-1.8,3.02],[1.12,3.06],[1.14,3.14],[-1.8,3.12]],{smooth:false});fill(ctx,rail,c.iron);ink(ctx,rail,2);
  ink(ctx,b,4.5);
  // the step under the door, and the lamp on its bracket at the front corner
  line(ctx,U([[0.0,0.84],[0.06,0.55],[0.36,0.55]]),5,c.iron);
  line(ctx,U([[1.3,1.9],[1.46,1.98]]),4,c.iron);
  const lp=pp([[1.4,1.92],[1.62,1.92],[1.6,2.28],[1.42,2.28]],{smooth:false});const lg=ctx.createLinearGradient(0,pt(0,2.28)[1],0,pt(0,1.92)[1]);lg.addColorStop(0,mix(P.glow,P.paper,0.45));lg.addColorStop(1,P.glow);ctx.fillStyle=lg;ctx.fill(lp);ink(ctx,lp,2.4,c.iron);
  const lc=pp([[1.36,2.28],[1.51,2.42],[1.66,2.28]],{smooth:false});fill(ctx,lc,c.iron);ink(ctx,lc,2,c.iron);line(ctx,U([[1.51,2.42],[1.51,2.52]]),4,c.iron);}
// a wheel: an iron tyre, painted felloes and spokes picked out with a line, a brass hub cap. No paper margin: it would fill the gaps.
function drawCabWheel(n){return(ctx,W,H)=>{const c=CABC(),cx=W/2,r=W/2-3,red=mix('#5a2028',P.skyBot,0.2);
  for(let i=0;i<n;i++){const a=i/n*TAU,s=[[cx+Math.cos(a)*r*0.15,cx+Math.sin(a)*r*0.15],[cx+Math.cos(a)*r*0.84,cx+Math.sin(a)*r*0.84]];line(ctx,s,Math.max(5,r*0.075)+3,P.ink);line(ctx,s,Math.max(5,r*0.075),red);}
  ctx.save();ctx.lineWidth=r*0.13;ctx.strokeStyle=red;ctx.beginPath();ctx.arc(cx,cx,r*0.86,0,TAU);ctx.stroke();ctx.lineWidth=r*0.09;ctx.strokeStyle=c.iron;ctx.beginPath();ctx.arc(cx,cx,r*0.955,0,TAU);ctx.stroke();
  ctx.strokeStyle=hexA(P.glow,0.35);ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(cx,cx,r*0.97,-1.4,-0.2);ctx.stroke();
  ctx.strokeStyle=P.ink;ctx.lineWidth=3;for(const k of [1,0.91,0.8])ctx.beginPath(),ctx.arc(cx,cx,r*k,0,TAU),ctx.stroke();ctx.restore();
  const hub=path(ell(cx,cx,r*0.2,r*0.2,16,0.01));fill(ctx,hub,red);ink(ctx,hub,2.5);const cap=path(ell(cx,cx,r*0.1,r*0.1,12,0.01));fill(ctx,cap,P.brass);ink(ctx,cap,2);}}
// the shafts: a slim bent pole from the cab's front axle to the horse's shoulder, and the trace (the pulling strap)
// from the cab to the collar. One drawing; the far one is the same, darker. Canvas x 2.2..6.3, y 1.1..2.15 (cab frame).
function drawShaft(ctx,W,H){const c=CABC(),U=cabU(2.2,2.15);
  line(ctx,U([[2.95,1.5],[4.2,1.72],[5.35,1.86],[6.08,1.98]]),3.2,c.leather);// the trace
  const wood=mix('#3a2a1c',P.skyBot,0.2);const s=U([[2.3,1.2],[3.4,1.5],[4.6,1.74],[5.6,1.86],[6.12,1.92],[6.2,2.04]]);line(ctx,s,11,P.ink);line(ctx,s,7,wood);line(ctx,U([[3.4,1.53],[5.6,1.89]]),1.5,P.glow,0.35);
  const tip=U([[6.12,1.92]])[0];dot(ctx,tip[0],tip[1],6,P.brass);}
// the cabman: seated on the box, in a caped greatcoat and a bowler, reins in both hands. Body and head are two pieces.
// Body canvas x 1.3..2.7, y 2.4..3.9 (cab frame); head canvas x 1.55..2.3, y 3.4..4.3, pinned at the neck (1.9, 3.55).
function drawCabmanBody(ctx,W,H){const U=cabU(1.3,3.9),pp=(pts,o)=>path(U(pts),o),coat=mix('#3d4433',P.skyBot,0.22),cape=mix('#4a523e',P.skyBot,0.22);
  const lap=pp([[1.7,2.6],[2.52,2.66],[2.6,2.78],[2.5,2.86],[1.74,2.88]],{jit:0.6});cel(ctx,lap,coat,{s:6});ink(ctx,lap,3);
  const torso=pp([[1.62,2.62],[1.98,2.62],[2.08,3.0],[2.02,3.42],[1.88,3.52],[1.66,3.46],[1.58,3.0]],{jit:0.8});cel(ctx,torso,coat,{s:9,dark:0.5});flecks(ctx,torso,[20,30,60,100],70);for(const y of [2.8,3.0,3.2])dot(ctx,...U([[2.02,y]])[0],3,P.brass);ink(ctx,torso,4);
  // two short capes over the shoulders, the mark of a coachman's coat
  for(const[y0,y1,k] of [[3.5,3.12,0],[3.48,3.24,1]]){const cp=pp([[1.6,y0-0.02],[1.92,y0+0.02],[2.1,y1+0.12],[2.06,y1],[1.6,y1-0.02-k*0.04],[1.54,(y0+y1)/2]],{jit:0.6});cel(ctx,cp,k?coat:cape,{s:5,hatch:false});ink(ctx,cp,2.6);stitch(ctx,U([[1.6,y1+0.04],[2.02,y1+0.06]]),P.paper,0.35);}
  // the arm, forward to the reins; gloved hands
  const arm=pp([[1.86,3.3],[2.0,3.34],[2.16,3.0],[2.5,2.98],[2.52,3.1],[2.18,3.14],[2.06,3.36]],{jit:0.5});cel(ctx,arm,coat,{s:5});ink(ctx,arm,2.8);
  const hand=pp([[2.46,2.94],[2.6,2.96],[2.62,3.1],[2.48,3.12]]);fill(ctx,hand,mix(P.boot,P.skyBot,0.2));ink(ctx,hand,2);
  const muff=pp([[1.74,3.42],[2.0,3.46],[2.0,3.58],[1.76,3.56]]);fill(ctx,muff,mix('#7a3b2a',P.skyBot,0.2));ink(ctx,muff,2.2);}
function drawCabmanHead(ctx,W,H){const U=cabU(1.55,4.3),pp=(pts,o)=>path(U(pts),o),skin=mix(P.skin,'#c07a5a',0.25),hat=P.hat;
  const face=pp([[1.78,3.98],[1.98,4.02],[2.06,3.92],[2.12,3.82],[2.08,3.78],[2.07,3.7],[2.02,3.6],[1.9,3.56],[1.8,3.62],[1.74,3.8]],{jit:0.5});cel(ctx,face,skin,{s:4,ha:0.2});
  const ck=pp([[1.96,3.72],[2.03,3.74],[2.0,3.68]]);fill(ctx,ck,hexA('#c0504a',0.4));ink(ctx,face,3);
  const ear=pp([[1.8,3.82],[1.86,3.84],[1.86,3.74],[1.8,3.74]]);fill(ctx,ear,mix(skin,P.ink,0.15));ink(ctx,ear,1.8);
  const mu=pp([[1.98,3.7],[2.1,3.72],[2.08,3.64],[2.0,3.62]]);fill(ctx,mu,mix('#8a7a66',P.skyBot,0.1));ink(ctx,mu,1.6);
  dot(ctx,...U([[2.02,3.86]])[0],3,P.ink);line(ctx,U([[1.98,3.91],[2.06,3.9]]),2.2,P.ink);
  const side=pp([[1.76,3.9],[1.8,3.66],[1.84,3.7],[1.82,3.9]]);fill(ctx,side,mix('#8a7a66',P.skyBot,0.1));
  // the bowler: a round crown and a curled brim
  const crown=pp([[1.74,3.98],[1.76,4.12],[1.86,4.22],[1.98,4.22],[2.06,4.12],[2.08,3.98]]);cel(ctx,crown,hat,{s:4,hatch:false,ra:0.4});ink(ctx,crown,2.6);
  const brim=pp([[1.66,3.98],[1.72,3.95],[2.1,3.95],[2.18,3.99],[2.12,4.02],[1.7,4.02]]);fill(ctx,brim,hat);ink(ctx,brim,2.4);line(ctx,U([[1.77,4.03],[2.06,4.03]]),3,mix('#4a3f3a',P.skyBot,0.1));}
// the horse: a dark bay in harness, side-on, facing right. Horse frame: x 0 at the point of the buttock, y 0 the road;
// 100 px a unit; 2.55 units (about 1.55 m) at the withers. Pieces: the body with the neck (and the collar and harness),
// the head (pinned at the poll, so it nods), the tail, and legs in two parts each (forearm + cannon, gaskin + cannon).
const HORSE=()=>({bay:mix('#74401f',P.skyBot,0.18),black:mix('#17110e',P.skyBot,0.15),leather:mix('#1b1513',P.skyBot,0.12),hoof:mix('#2e2722',P.skyBot,0.15)});
function drawHorseBody(ctx,W,H){const h=HORSE(),U=cabU(-0.15,3.72),pp=(pts,o)=>path(U(pts),o),pt=(x,y)=>U([[x,y]])[0];
  const b=pp([[0.1,2.42],[0.5,2.57],[0.95,2.5],[1.4,2.44],[1.88,2.6],[2.15,2.88],[2.5,3.24],[2.84,3.56],[3.02,3.52],[3.1,3.16],[2.96,2.78],[2.82,2.36],[2.76,2.0],[2.64,1.68],[2.42,1.44],[2.06,1.32],[1.65,1.28],[1.1,1.36],[0.76,1.58],[0.62,1.54],[0.22,1.38],[0.04,1.72],[0.0,2.05],[0.03,2.3]],{jit:0.5});
  cel(ctx,b,h.bay,{s:13,dark:0.42});flecks(ctx,b,[0,0,W,H],110);
  // a few soft lines for the shoulder and the hip, no more
  ctx.save();ctx.clip(b);ctx.strokeStyle=hexA(P.ink,0.3);ctx.lineWidth=2;ctx.lineCap='round';
  for(const ln of [[[2.0,2.55],[2.25,2.1],[2.5,1.72]],[[0.62,2.5],[0.74,2.05],[0.66,1.66]]])ctx.stroke(path(U(ln),{closed:false}));ctx.restore();
  ink(ctx,b,4.5);
  // the mane along the crest
  const mane=pp([[1.86,2.62],[2.1,2.92],[2.46,3.3],[2.8,3.6],[2.92,3.6],[2.78,3.44],[2.66,3.38],[2.56,3.22],[2.42,3.16],[2.32,2.98],[2.18,2.9],[2.06,2.74]],{jit:1.2});fill(ctx,mane,h.black);hatch(ctx,mane,{ang:-0.8,gap:5,a:0.22,c:P.paper});ink(ctx,mane,2.4);
  // harness: the crupper along the back to the tail, the breeching round the quarters and its hip straps
  line(ctx,U([[0.12,2.44],[0.5,2.58],[0.95,2.52],[1.5,2.5]]),5,h.leather);
  line(ctx,U([[0.03,1.92],[0.4,1.86],[0.8,1.84],[1.2,1.84]]),8,h.leather);line(ctx,U([[0.56,2.56],[0.46,2.2],[0.4,1.88]]),5,h.leather);
  // the saddle pad and its band down to the tug (which carries the shaft) and round the belly
  line(ctx,U([[1.74,2.5],[1.76,1.86],[1.72,1.28]]),9,h.leather);
  const tug=pp([[1.67,1.97],[1.85,1.97],[1.85,1.77],[1.67,1.77]],{smooth:false});fill(ctx,tug,h.leather);ink(ctx,tug,2);dot(ctx,...pt(1.76,1.87),3.5,P.brass);
  const pad=pp([[1.5,2.42],[1.98,2.5],[2.0,2.7],[1.76,2.78],[1.5,2.66]],{jit:0.5});cel(ctx,pad,h.leather,{s:3,hatch:false,ra:0.3});ink(ctx,pad,2.4);
  const ter=pt(1.75,2.84);ctx.save();ctx.strokeStyle=P.brass;ctx.lineWidth=3.5;ctx.beginPath();ctx.arc(ter[0],ter[1],7,0,TAU);ctx.stroke();ctx.restore();
  // the collar: a thick padded ring round the base of the neck, the hames along its front, the trace hooked on
  const col=pp([[2.12,2.94],[2.28,3.1],[2.44,3.02],[2.68,2.6],[2.84,2.18],[2.84,1.9],[2.7,1.86],[2.64,2.14],[2.5,2.56],[2.3,2.86]],{jit:0.4});cel(ctx,col,h.leather,{s:6,hatch:false,ra:0.5});ink(ctx,col,3.2);
  line(ctx,U([[2.36,3.12],[2.6,2.7],[2.8,2.2],[2.8,1.88]]),5,P.brass);line(ctx,U([[2.36,3.12],[2.6,2.7],[2.8,2.2],[2.8,1.88]]),1.4,P.ink,0.5);dot(ctx,...pt(2.35,3.16),5,P.brass);
  const ht=pp([[2.66,2.06],[2.86,2.04],[2.86,1.94],[2.66,1.96]],{smooth:false});fill(ctx,ht,h.leather);ink(ctx,ht,1.8);}
function drawHorseHead(ctx,W,H){const h=HORSE(),U=cabU(2.75,4.0),pp=(pts,o)=>path(U(pts),o),pt=(x,y)=>U([[x,y]])[0];
  const ear2=pp([[2.86,3.58],[2.86,3.9],[2.97,3.62]],{smooth:false});fill(ctx,ear2,mix(h.bay,P.ink,0.4));ink(ctx,ear2,2);
  const hd=pp([[2.86,3.56],[3.02,3.6],[3.18,3.44],[3.36,3.12],[3.54,2.84],[3.62,2.72],[3.6,2.6],[3.48,2.56],[3.3,2.66],[3.12,2.82],[3.0,3.04],[2.9,3.3]],{jit:0.4});
  cel(ctx,hd,h.bay,{s:8,dark:0.42});flecks(ctx,hd,[0,0,W,H],40);
  ctx.save();ctx.clip(hd);const muz=pp([[3.34,3.0],[3.7,3.0],[3.7,2.5],[3.34,2.5]],{smooth:false});ctx.fillStyle=hexA(P.ink,0.3);ctx.fill(muz);
  ctx.strokeStyle=hexA(P.ink,0.45);ctx.lineWidth=2.2;ctx.stroke(path(U([[3.3,3.08],[3.1,3.0],[3.06,2.86],[3.2,2.76],[3.34,2.8]]),{closed:false}));ctx.restore();// the cheek
  const star=pp([[3.12,3.44],[3.2,3.48],[3.22,3.38],[3.15,3.36]]);fill(ctx,star,mix(P.paper,P.skyBot,0.2));
  ink(ctx,hd,4);
  const nos=pt(3.54,2.8);ctx.save();ctx.strokeStyle=P.ink;ctx.lineWidth=2.6;ctx.beginPath();ctx.arc(nos[0],nos[1],5.5,0.5,4.1);ctx.stroke();ctx.restore();line(ctx,U([[3.46,2.64],[3.6,2.66]]),2,P.ink);
  const fore=pp([[2.92,3.62],[3.06,3.6],[3.14,3.42],[3.0,3.48]]);fill(ctx,fore,h.black);ink(ctx,fore,1.8);
  const ear=pp([[2.92,3.56],[2.97,3.94],[3.08,3.6]],{smooth:false});fill(ctx,ear,h.bay);ctx.save();ctx.clip(ear);fill(ctx,pp([[2.97,3.9],[3.02,3.62],[2.95,3.62]],{smooth:false}),mix(h.bay,P.ink,0.4));ctx.restore();ink(ctx,ear,2.4);
  // the bridle: crownpiece and cheek strap, browband, noseband, throatlatch; a blinker beside the eye; the bit
  for(const ln of [[[2.97,3.6],[3.1,3.3],[3.26,2.96],[3.42,2.72]],[[2.99,3.52],[3.14,3.5]],[[3.26,3.0],[3.56,2.94]],[[2.96,3.48],[2.98,3.08]]])line(ctx,U(ln),4.5,h.leather);
  const eye=pt(3.14,3.32);fill(ctx,path(ell(eye[0]+4,eye[1],5,4,10,0)),P.ink);dot(ctx,eye[0]+5,eye[1]-1.5,1.5,P.paper);
  const bl=pp([[2.98,3.43],[3.12,3.44],[3.12,3.22],[2.98,3.22]],{jit:0.3});fill(ctx,bl,h.leather);ink(ctx,bl,2);dot(ctx,...pt(3.05,3.33),3.5,P.brass);
  const bit=pt(3.44,2.7);ctx.save();ctx.strokeStyle=P.brass;ctx.lineWidth=3.2;ctx.beginPath();ctx.arc(bit[0],bit[1],6.5,0,TAU);ctx.stroke();ctx.restore();}
function drawHorseTail(ctx,W,H){const h=HORSE(),U=cabU(-0.45,2.5),pp=(pts,o)=>path(U(pts),o);
  const t=pp([[0.12,2.44],[-0.02,2.34],[-0.16,2.0],[-0.26,1.5],[-0.24,1.1],[-0.12,1.0],[-0.06,1.12],[-0.02,1.5],[0.04,1.9],[0.16,2.3]],{jit:1.2});fill(ctx,t,h.black);hatch(ctx,t,{ang:1.38,gap:5,a:0.28,c:P.paper});ink(ctx,t,2.6);}
// legs, with muscle: a broad forearm (elbow to knee, 0.62) or gaskin (stifle to hock, 0.72, down and back with the point
// of the hock behind), then the cannon, the fetlock joint, a sloping pastern and the hoof
function drawHorseLeg(part){return(ctx,W,H)=>{const h=HORSE(),U=cabU(-0.35,0.08),pp=(pts,o)=>path(U(pts),o);
  const shapes={
    foreUp:[[-0.17,0.0],[0.16,0.0],[0.13,-0.28],[0.08,-0.54],[0.09,-0.66],[-0.09,-0.67],[-0.1,-0.5],[-0.15,-0.24]],
    foreLo:[[-0.08,0.03],[0.08,0.03],[0.07,-0.46],[0.1,-0.54],[0.15,-0.68],[0.06,-0.7],[-0.04,-0.6],[-0.07,-0.48]],
    hindUp:[[-0.14,0.03],[0.2,0.03],[0.16,-0.28],[0.04,-0.6],[-0.08,-0.76],[-0.25,-0.76],[-0.22,-0.56],[-0.18,-0.28]],
    hindLo:[[-0.08,0.03],[0.08,0.03],[0.08,-0.48],[0.11,-0.56],[0.16,-0.7],[0.06,-0.72],[-0.04,-0.62],[-0.07,-0.5]]}[part];
  const lo=part.endsWith('Lo'),l=pp(shapes,{jit:0.4});cel(ctx,l,lo?mix(h.bay,h.black,0.8):h.bay,{s:5,dark:0.45});
  if(!lo){ctx.save();ctx.clip(l);ctx.fillStyle=hexA(h.black,0.5);const g=ctx.createLinearGradient(0,U([[0,-0.3]])[0][1],0,U([[0,-0.7]])[0][1]);g.addColorStop(0,hexA(h.black,0));g.addColorStop(1,hexA(h.black,0.85));ctx.fillStyle=g;ctx.fill(l);ctx.restore();}// bay legs darken to black
  ink(ctx,l,3.2);
  if(lo){const hf=pp([[0.03,-0.68],[0.17,-0.68],[0.23,-0.86],[0.0,-0.86]],{smooth:false,jit:0.3});cel(ctx,hf,h.hoof,{s:3,hatch:false,ra:0.35});ink(ctx,hf,2.8);line(ctx,U([[0.04,-0.71],[0.18,-0.71]]),2,P.paper,0.25);}}}
// the whip, standing in its socket on the dashboard, the lash hanging in a loop. No paper margin: it is too thin.
function drawWhip(ctx,W,H){const U=cabU(2.6,4.6);const stick=U([[3.06,2.32],[2.96,3.3],[2.8,4.45]]);line(ctx,stick,5.5,P.ink);line(ctx,stick,3,mix('#7a5c38',P.skyBot,0.2));
  line(ctx,U([[2.8,4.45],[2.92,4.3],[3.1,3.86],[3.16,3.44],[3.1,3.16]]),1.8,P.ink,0.9);line(ctx,U([[3.04,2.2],[3.07,2.66]]),7,P.ink);}

/* ================= EXHIBITS: the facts ================= */
const ROOMS=[
  {name:'The Gesner Museum',score:'gesner',x0:-20,x1:-10,wp:0,sign:'THE GESNER MUSEUM · 1842',win:560,peel:840},
  {name:'Entrance Hall',score:'entrance',x0:-10,x1:0,wp:1,sign:'NATURAL HISTORY SOCIETY OF NEW BRUNSWICK',doors:[{x:800,label:'CURATOR',sub:'Private'}]},
  {name:'Fossils of Saint John',score:'fossils',x0:0,x1:10,wp:2,sign:'FOSSILS OF SAINT JOHN',win:760},
  {name:'Birds & Mammals',score:'birds',x0:10,x1:20,wp:3,sign:'BIRDS & MAMMALS',win:500,peel:120}];
const EXHIBITS=[
  {id:'gesner',room:0,no:'G-1',name:'Portrait of Abraham Gesner',at:[-17.2,-3.4],labelY:5.0,
   label:'ABRAHAM GESNER, M.D. (1797–1864). Founder of the Gesner Museum, Saint John, 1842.',
   body:['Gesner was a doctor and geologist from Nova Scotia. In 1838 New Brunswick made him its provincial geologist, and he travelled the province collecting rocks, minerals and fossils.','On 5 April 1842 he opened his collection to the public in Saint John. The museum you are standing in grew out of it.'],
   now:'Gesner could not repay the loans that paid for his museum, and his creditors took the collection in 1843. It passed to the Mechanics’ Institute, then in 1890 to the Natural History Society.'},
  {id:'minerals',room:0,no:'G-2',name:'Minerals from the Fundy shore',at:[-14.6,-0.2],labelY:3.0,
   label:'MINERALS FROM THE TRAP OF NOVA SCOTIA. Amethyst, agate and zeolites. Collected by Dr. Gesner.',
   body:['The dark volcanic rock along the Bay of Fundy shore of Nova Scotia is full of hollows lined with crystals. Gesner collected them on his travels.','His 1842 catalogue listed 1,263 rocks, minerals and fossils.']},
  {id:'mohs',room:0,no:'G-3',name:'Specimen No. 906',at:[-12.4,-3.2],labelY:5.6,
   label:'GESNER No. 906. “From the Collection of Mohs.”',
   body:['Gesner numbered his specimens. One old label says it came from the collection of Mohs.','Friedrich Mohs was a German mineralogist. He made the scratch test for hardness that geologists still use: talc is 1, diamond is 10.']},
  {id:'lamp',room:0,no:'G-4',name:'A kerosene lamp',at:[-18.2,2.6],labelY:3.4,
   label:'KEROSENE LAMP. The oil was first made by Dr. Gesner.',
   body:['In 1846 Gesner showed that he could make a clean-burning lamp oil from coal. He named it kerosene.','Lamps like this lit homes, shops and ships across North America before electric light.']},
  {id:'attendant',room:1,no:'H-1',name:'The attendant',at:[-5,-2.1],labelY:3.4,
   label:'INQUIRIES.',
   body:['“Good evening. You must be the new archivist. The Society moved everything into this building in 1906, and nobody has catalogued it properly since.”','“The keys are yours. Mind the moths in Birds & Mammals.”'],talk:true},
  {id:'notice',room:1,no:'H-2',name:'The Society’s notice board',at:[-8.2,-3.4],labelY:5.0,
   label:'NATURAL HISTORY SOCIETY OF NEW BRUNSWICK. Museum. Founded 1862.',
   body:['A group of Saint John naturalists formed the Society in 1862 to study the province’s rocks, plants and animals.','In 1906 the Society bought this building on Union Street and moved its collections in.'],
   now:'In 1929 the Society handed its collections to the province. They became the New Brunswick Museum, which opened on Douglas Avenue in the early 1930s.'},
  {id:'book',room:1,no:'H-3',name:'The visitors’ book',at:[-2.2,0.2],labelY:3.0,
   label:'VISITORS ARE ASKED TO SIGN THEIR NAMES.',
   body:['Visitors signed in at the door. Old visitors’ books are a primary source: they can show historians who came to a museum, where they came from, and when.']},
  {id:'fern',room:2,no:'F-1',name:'Plants from the Fern Ledges',at:[2.9,-3.4],labelY:5.4,
   label:'FOSSIL PLANTS, FERN LEDGES, LANCASTER. Collected by C. F. Hartt.',
   body:['The Fern Ledges are rocks on the shore at Lancaster, just west of Saint John harbour. They are full of fossil plants: fern-like fronds, strap-shaped leaves and the ribbed stems of giant horsetails.','Fred Hartt collected them in the 1860s. They were the first specimens the Society bought for its museum.']},
  {id:'insects',room:2,no:'F-2',name:'The oldest insects?',at:[5.2,0.2],labelY:3.0,
   label:'FOSSIL INSECTS, FERN LEDGES. DEVONIAN. The oldest insects known.',
   body:['Hartt also found wings of insects in the Fern Ledges rocks. Samuel Scudder of Boston described them in the 1860s, and the rocks were thought to be Devonian. That made these the oldest insects anyone had found.'],
   now:'The label is wrong. In 1914 Marie Stopes showed the plants are younger than Devonian. The rocks are about 315 million years old, from the Carboniferous. Older insects have since been found elsewhere.'},
  {id:'trilobites',room:2,no:'F-3',name:'Trilobites of Saint John',at:[8.2,2.9],labelY:3.0,
   label:'TRILOBITES (PARADOXIDES), CAMBRIAN ROCKS OF SAINT JOHN. G. F. Matthew.',
   body:['Trilobites were sea animals with hard, segmented shells. These lived over 500 million years ago, in the Cambrian.','George F. Matthew worked for the customs office in Saint John and studied fossils in his spare time. He described many Cambrian animals from the rocks around the city and was the Society’s curator for many years.']},
  {id:'caribou',room:3,no:'B-1',name:'Woodland caribou',at:[14.4,-1.2],labelY:4.6,
   label:'WOODLAND CARIBOU (RANGIFER TARANDUS). New Brunswick.',
   body:['In 1910 woodland caribou still lived in the forests of New Brunswick. Both males and females grow antlers.'],
   now:'Hunting and the loss of old forest drove them out. Caribou were gone from New Brunswick by the 1930s.'},
  {id:'birds',room:3,no:'B-2',name:'Two vanishing birds',at:[18.1,-3.2],labelY:5.6,
   label:'PASSENGER PIGEON (ECTOPISTES MIGRATORIUS). LABRADOR DUCK (CAMPTORHYNCHUS LABRADORIUS).',
   body:['Passenger pigeons once flew over North America in flocks of millions. By 1910 the last few lived in the Cincinnati Zoo. The very last one, Martha, died in 1914.','The Labrador duck wintered along the Atlantic coast, including the Bay of Fundy. No one has seen one alive since the 1870s. Museum specimens like this are all that is left.']},
  {id:'moths',room:3,no:'B-3',name:'A tin of naphthalene',at:[11.7,3.0],labelY:2.8,
   label:'NAPHTHALENE. Keep the cases closed.',
   body:['Clothes moths and carpet beetles eat feathers, fur and wool. In an old museum they are a curator’s worst enemy.','Curators fought back with naphthalene: mothballs. The smell was part of visiting a museum.']}
];

/* ================= AREAS: the galleries, the offices upstairs, the stacks in the basement =================
   Each area is a strip of 10-unit rooms like the galleries, built far apart on x so only one is ever in view.
   Doors in the back walls move the Archivist between them (with a short fade). The floor plans are invented. */
const OFFICE_ROOMS=[
  {name:'The Curator’s Office',x0:60,x1:70,wp:1,sign:'THE CURATOR',win:560},
  {name:'The Landing',x0:70,x1:80,wp:3,sign:'STAFF ONLY',doors:[{x:250,label:'GALLERIES',sub:'Stairs down'},{x:750,label:'STACKS',sub:'Basement'}]},
  {name:'Your Office',x0:80,x1:90,wp:2,sign:'ARCHIVES',win:720,peel:120}];
const BASE_ROOMS=[
  {name:'The Stacks',x0:120,x1:130,cellar:true,sign:'THE STACKS'},
  {name:'Foot of the Stairs',x0:130,x1:140,cellar:true,sign:'ARCHIVES · BASEMENT',doors:[{x:500,label:'OFFICES',sub:'Stairs up'}]}];
const LODGE_ROOMS=[
  {name:'Mrs. Hanlon’s kitchen',x0:400,x1:410,wp:4,win:300},
  {name:'Your room',x0:410,x1:420,wp:5,win:640}];
const AREAS={
  museum:{id:'museum',x0:-20,x1:20,parts:[-10,0,10],rooms:ROOMS,gas:[-19.1,-10.4,-6.3,-0.42,5.5,9.45]},
  office:{id:'office',x0:60,x1:90,parts:[70,80],rooms:OFFICE_ROOMS,gas:[60.9,69.55,74.8,80.45,89.1]},
  basement:{id:'basement',x0:120,x1:140,parts:[130],rooms:BASE_ROOMS,gas:[120.9,126.7,132.6,139.1]},
  // outdoors: no walls or gas sconces; a camera set further back and higher, so the building fits; a thinner, bluer fog
  street:{id:'street',x0:170,x1:230,parts:[],rooms:[{name:'Union Street',x0:170,x1:230}],gas:[],outdoor:true,
    cam:{h:8.6,back:21,look:7.4,ahead:2,m:14},fog:[32,95,mix(P.far,P.skyBot,0.4)],fogDay:[18,80,'#8f979c']},
  // the evening train, for the opening only (no doors lead here)
  train:{id:'train',x0:258,x1:282,parts:[],rooms:[{name:'The evening train',x0:258,x1:282}],gas:[],outdoor:true,
    cam:{h:2.7,back:6.4,look:1.25,ahead:0.4,m:6},fog:[20,60,P.fog]},
  // King Square, Sydney Street and the old burial ground (x 300..372): between the museum and your lodgings
  square:{id:'square',x0:300,x1:372,parts:[],rooms:[{name:'King Square',x0:300,x1:335},{name:'Sydney Street',x0:335,x1:349},{name:'The old burial ground',x0:349,x1:372}],gas:[],outdoor:true,
    cam:{h:7.4,back:17,look:4.6,ahead:2,m:12},fog:[26,90,mix(P.far,P.skyBot,0.4)],fogDay:[16,70,'#8f979c']},
  // the evening train seen from outside, for the opening only (no doors lead here)
  line:{id:'line',x0:430,x1:560,parts:[],rooms:[{name:'',x0:430,x1:560}],gas:[],outdoor:true,cam:{h:3.2,back:15,look:2.2,ahead:1,m:10},fog:[40,150,P.far]},
  // Mrs. Hanlon's boarding house on Sydney Street (x 400..420): her kitchen, and your room
  lodgings:{id:'lodgings',x0:400,x1:420,parts:[410],rooms:LODGE_ROOMS,gas:[400.9,409.1,410.9,419.1]}};
let AREA=AREAS.museum;
// where each door leads, and where the Archivist steps out
const F72_DOOR=190+550/80;// the museum's front door on Union Street (the facade's left edge + the door bay)
const BH_DOOR=337+625/80;// the boarding house door on Sydney Street
const DOORS={
  'to-street':{from:'museum',at:[-5,4.1],labelY:1.4,name:'the front door',verb:'Go out to Union Street',to:['street',F72_DOOR,-3.3],face:'front'},
  'to-museum':{from:'street',at:[F72_DOOR,-4.0],labelY:5.2,name:'the museum',verb:'Go in: the museum',to:['museum',-5,3.2],face:'back'},
  'to-offices':{from:'museum',at:[-2,-4.0],name:'the CURATOR door (stairs up)',to:['office',72.5,-3.5]},
  'to-galleries':{from:'office',at:[72.5,-4.0],name:'the stairs down to the galleries',to:['museum',-2,-3.5]},
  'to-stacks':{from:'office',at:[77.5,-4.0],name:'the STACKS door (basement)',to:['basement',135,-3.5]},
  'to-upstairs':{from:'basement',at:[135,-4.0],name:'the stairs up to the offices',to:['office',77.5,-3.5]},
  'to-square':{from:'street',at:[171.6,-2.9],labelY:4.6,name:'King Square',verb:'Walk to King Square',to:['square',369.6,-1.6],face:'front'},
  'to-union':{from:'square',at:[370.8,-1.4],labelY:4.6,name:'Union Street',verb:'Walk along Union Street to the museum',to:['street',172.6,-2.0],face:'front'},
  'to-lodgings':{from:'square',at:[BH_DOOR,-4.0],labelY:4.4,name:'Mrs. Hanlon’s boarding house',verb:'Go in: Mrs. Hanlon’s boarding house',to:['lodgings',405,3.2],face:'back'},
  'to-sydney':{from:'lodgings',at:[405,4.1],labelY:1.4,name:'the front door',verb:'Go out to Sydney Street',to:['square',BH_DOOR,-3.3],face:'front'}};
// everything else you can walk up to and use (exhibits are in EXHIBITS)
const THINGS=[
  ...Object.entries(DOORS).map(([id,d])=>({id,kind:'door',area:d.from,at:d.at,labelY:d.labelY??4.6,verb:d.verb||'Go through: '+d.name,door:d})),
  {id:'harrow',kind:'talk',area:'office',at:[67.6,-1.4],labelY:3.2,verb:'Talk to Mr. Harrow'},
  {id:'mydesk',kind:'desk',area:'office',at:[84,-1.3],labelY:2.6,verb:'Sit at your desk'},
  {id:'shelf-a-f',kind:'shelf',area:'basement',at:[122.4,-2.9],labelY:4.4,verb:'Look at shelf A – F',shelf:'a-f'},
  {id:'shelf-g-o',kind:'shelf',area:'basement',at:[125.2,-2.9],labelY:4.4,verb:'Look at shelf G – O',shelf:'g-o'},
  {id:'shelf-p-z',kind:'shelf',area:'basement',at:[128,-2.9],labelY:4.4,verb:'Look at shelf P – Z',shelf:'p-z'},
  {id:'hanlon',kind:'talk',area:'lodgings',at:[403.9,-0.6],labelY:3.4,verb:'Talk to Mrs. Hanlon'},
  {id:'bed',kind:'bed',area:'lodgings',at:[416.4,-2.6],labelY:2.6,verb:'Go to bed'},
  {id:'trunk',kind:'look',area:'lodgings',at:[418.4,0.3],labelY:1.8,verb:'Look at the old trunk'},
  {id:'paper',kind:'look',area:'lodgings',at:[413.6,-2.4],labelY:2.4,verb:'Read the Standard again'},
  {id:'closed',kind:'look',area:'square',at:[301.8,-1.4],labelY:4.6,verb:'Charlotte Street · the City Market'},
  {id:'gage',kind:'talk',area:'square',at:[0,0],labelY:3.6,verb:'Talk to the pill seller'},
  ...['newsboy','folk1','folk2','folk3','folk4','folk5'].map((id,i)=>({id,kind:'talk',area:'square',at:[0,0],labelY:i?3.4:2.8,verb:i?'Talk to a passer-by':'Talk to the newsboy',folk:i}))];
for(const e of EXHIBITS)e.area='museum';
// catalogue cards out in the town: the archivist catalogues everything. Real places; sources in docs/SOURCES.md.
const TOWN_CARDS=[
  {id:'bandstand',area:'square',place:'King Square',no:'T-1',name:'The bandstand',at:[317,-1.0],labelY:6.4,head:'Your index card',
   label:'BANDSTAND, KING SQUARE. Built 1908.',
   body:['Built in 1908 for the City Cornet Band, to a design by the Saint John architect Neil Brodie.','Two storeys: a stone base with arches, and an iron-framed deck for the band under a copper roof.'],
   now:'It still stands in King Square. Today it is called the King Edward VII Memorial Bandstand.'},
  {id:'jack',area:'square',place:'King Square',no:'T-2',name:'The paths of King Square',at:[309.6,1.4],labelY:1.2,head:'Your index card',
   label:'KING SQUARE. Set aside in 1785. Paths laid out in the 1840s.',
   body:['The square was set aside for the town in 1785 and named for King George III.','In the 1840s its paths were laid out in the pattern of the Union Jack, the British flag. You can only really see it from above.']},
  {id:'graves',area:'square',place:'The old burial ground',no:'T-3',name:'The Loyalist Burial Ground',at:[362,-1.9],labelY:2.4,head:'Your index card',
   label:'THE OLD BURIAL GROUND. 1783 – 1848.',
   body:['Set aside in 1783 by the Loyalists, who came to Saint John after the American Revolution.','The oldest stone still standing is from 1784, for Conradt Hendricks. No one has been buried here since 1848.']}];
for(const c of TOWN_CARDS)EXHIBITS.push(c);
const thing=id=>THINGS.find(t=>t.id===id);

/* ================= SCENE ================= */
const vp=document.getElementById('vp'),canvas=document.getElementById('c');
try{renderer=new THREE.WebGLRenderer({canvas,antialias:true});}catch(e){document.getElementById('loading').textContent='This sample needs WebGL to run.';return;}
renderer.outputEncoding=THREE.sRGBEncoding;renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));
const scene=new THREE.Scene();scene.background=new THREE.Color(0x07070a);scene.fog=new THREE.Fog(new THREE.Color(P.fog).convertSRGBToLinear(),16,42);
const camera=new THREE.PerspectiveCamera(40,16/9,0.1,220);// far enough for the street's sky when the camera looks up
function S(tex,ppu,ax,ay,o={}){const{w,h}=tex.userData,gw=w/ppu,gh=h/ppu,geo=new THREE.PlaneGeometry(gw,gh);geo.translate(gw/2-ax/ppu,ay/ppu-gh/2,0);
  const mat=new THREE.MeshBasicMaterial({map:tex,transparent:!o.opaque,alphaTest:o.opaque||o.add?0:0.05,side:THREE.DoubleSide,fog:o.fog!==false,depthWrite:!o.add,opacity:o.opacity??1});if(o.add)mat.blending=THREE.AdditiveBlending;
  const m=new THREE.Mesh(geo,mat),g=new THREE.Group();g.add(m);g.art=m;g.mat=mat;if(o.order!=null)m.renderOrder=o.order;return g;}
// A soft, see-through effect (fog, smoke) must not write depth: a nearly invisible puff that happened to be drawn first
// would block whatever is behind it and drawn later, and parts of the horse or a building would vanish. Draw it last.
function haze(s){s.mat.depthWrite=false;s.mat.alphaTest=0;s.mat.needsUpdate=true;s.art.renderOrder=10;return s;}
function plane(tex,w,h,o={}){const mat=new THREE.MeshBasicMaterial({map:tex,transparent:!!o.add||!!o.alpha,side:THREE.DoubleSide,fog:o.fog!==false,depthWrite:!o.add,opacity:o.opacity??1});if(o.add)mat.blending=THREE.AdditiveBlending;const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),mat);if(o.order!=null)m.renderOrder=o.order;return m;}
const col=h=>new THREE.Color(h).convertSRGBToLinear();
const TX={},W={},BOXES=[],PICK=[];
function put(tex,ppu,ax,ay,x,y,z,ex){const s=S(tex,ppu,ax,ay);s.position.set(x,y,z);scene.add(s);if(ex){s.art.userData.ex=ex;PICK.push(s.art);}return s;}
function solid(x,z,hx,hz){BOXES.push({x,z,hx,hz});}
/* a partition with thickness: the wall's outline (low at the front, so we can see in; a doorway in the middle) extruded
   0.22 units. The faces carry the partition drawing; the cut edges are hatched plaster, like a section drawing. */
const WALL_T=0.22;
function thickWall(x,door){
  const P=[[-5,0],[-5,1.4],[-1.5,6.5],[5,6.5],[5,0]];if(door)P.push([2,0],[2,4.4],[-1,4.4],[-1,0]);
  const sh=new THREE.Shape();sh.moveTo(P[0][0],P[0][1]);for(const q of P.slice(1))sh.lineTo(q[0],q[1]);sh.closePath();
  const g=new THREE.ExtrudeGeometry(sh,{depth:WALL_T,bevelEnabled:false});g.translate(0,0,-WALL_T/2);
  const pos=g.attributes.position,uv=g.attributes.uv;
  for(const gr of g.groups)for(let i=gr.start;i<gr.start+gr.count;i++){
    if(gr.materialIndex===0)uv.setXY(i,(pos.getX(i)+5)/10,pos.getY(i)/6.5);
    else uv.setXY(i,(pos.getX(i)+pos.getZ(i))*1.6,pos.getY(i)*1.6);}
  uv.needsUpdate=true;
  const face=new THREE.MeshBasicMaterial({map:door?TX.partD:TX.partE,transparent:true,alphaTest:0.05,side:THREE.DoubleSide});
  const cut=new THREE.MeshBasicMaterial({map:TX.poche,side:THREE.DoubleSide});
  const m=new THREE.Mesh(g,[face,cut]);m.rotation.y=Math.PI/2;m.position.set(x,0,0);return m;}
function drawPoche(ctx,W,H){ctx.fillStyle=mix(P.plaster,P.paper,0.35);ctx.fillRect(0,0,W,H);ctx.save();ctx.strokeStyle=hexA(P.ink,0.55);ctx.lineWidth=2;for(let k=-H;k<W;k+=12){ctx.beginPath();ctx.moveTo(k,H);ctx.lineTo(k+H,0);ctx.stroke();}ctx.restore();}

function build(){
  for(const v of ['side','back','front']){const k=v[0].toUpperCase()+v.slice(1);TX['leg'+k]=T(126,250,drawLeg(v),{border:5});TX['coat'+k]=T(320,470,drawCoat(v));}
  TX.headS=T(260,260,drawHead('side'),{cut:{b:214}});TX.headF=T(260,260,drawHead('front'),{cut:{b:214}});TX.headB=T(260,260,drawHead('back'),{cut:{b:214}});TX.hat=T(190,220,drawHat);
  TX.upperArm=T(90,126,drawUpperArm(true),{border:5,cut:{b:112}});TX.upperArmPlain=T(90,126,drawUpperArm(false),{border:5,cut:{b:112}});TX.forearm=T(100,140,drawForearm(false),{border:5,cut:{t:18}});TX.forearmGrip=T(100,140,drawForearm(true),{border:5,cut:{t:18}});TX.scarf=T(230,100,drawScarf,{border:5});TX.case=T(200,170,drawCase,{border:5});
  TX.attBody=T(260,260,drawAttBody);TX.attHead=T(200,214,drawAttHead,{cut:{b:186}});TX.attEyes=T(80,24,drawAttEyes,{border:0});TX.attArm=T(124,70,drawAttArm,{border:4});
  TX.floor=T(1024,512,drawFloor,{border:0,repeat:[8,2]});TX.cut=T(512,90,drawCut,{border:0,repeat:[10,1]});
  Object.values(AREAS).filter(a=>!a.outdoor).forEach((a,ai)=>a.rooms.forEach((r,i)=>{r.wallTex=T(1000,650,drawBackWall(r),{border:0,seed:500+ai*10+i});if(r.sign)r.signTex=T(1000,110,drawSign(r.sign,54),{border:4,seed:800+ai*10+i});}));
  TX.stoneFloor=T(1024,512,drawStoneFloor,{border:0,repeat:[6,2]});
  TX.partD=T(1000,650,drawPartition(true),{border:4,seed:700});TX.poche=T(128,128,drawPoche,{border:0,grain:false,repeat:[1,1]});TX.partE=T(1000,650,drawPartition(false),{border:4,seed:701});
  TX.vMin=T(300,260,drawVitrine('minerals'));TX.vIns=T(300,260,drawVitrine('insects'));TX.vTri=T(300,260,drawVitrine('trilobites'));
  TX.cabRocks=T(300,560,drawCabinet('rocks'));TX.cabBirds=T(300,560,drawCabinet('birds'));
  TX.portrait=T(220,300,drawPortrait);TX.fern=T(400,300,drawFernSlab);TX.lamp=T(140,320,drawLampPed,{border:5});
  TX.desk=T(420,300,drawDesk);TX.notice=T(260,320,drawNotice);TX.lectern=T(140,260,drawLectern,{border:5});
  TX.caribou=T(520,460,drawCaribou,{border:7});TX.moose=T(240,220,drawMoose);TX.mothTable=T(180,250,drawMothTable,{border:5});
  TX.bench=T(300,120,drawBench,{border:5});TX.stand=T(90,180,drawStand,{border:4});TX.rug=T(640,400,drawRug,{border:0});TX.clock=T(120,300,drawClock,{border:5});TX.pend=T(40,110,drawPendulum,{border:3});
  TX.harBody=T(240,480,drawHarBody);TX.harHead=T(200,220,drawHarHead,{cut:{b:192}});TX.harEyes=T(80,24,drawHarEyes,{border:0});TX.harArm=T(96,220,drawHarArm,{border:4});
  TX.bigDesk=T(440,300,drawBigDesk);TX.myDesk=T(420,320,drawMyDesk);TX.bookcase=T(260,520,drawBookcase);TX.filing=T(180,300,drawFiling);TX.letters=T(220,200,drawLetterRack);TX.sortTable=T(360,200,drawSortTable,{border:5});
  TX.shelves={};for(const[id,n] of [['a-f','A – F'],['g-o','G – O'],['p-z','P – Z']])TX.shelves[id]=T(300,560,drawShelfUnit(n),{seed:900+id.charCodeAt(0)});
  TX.sconce=T(140,210,drawSconce,{border:4});TX.glow=T(256,256,drawGlow,{border:0,grain:false});TX.moth=T(120,90,drawMoth,{border:4});TX.blob=T(128,64,drawBlob,{border:0,grain:false});

  /* every area: floor, cut face, walls, partitions, gas light */
  W.gas=[];W.skies=[];W.moons=[];
  for(const a of Object.values(AREAS)){const w=a.x1-a.x0,cx=(a.x0+a.x1)/2;if(a.outdoor){const n0=W.gas.length;({train:buildTrain,street:buildStreet,square:buildSquare,line:buildLine})[a.id](a);for(let i=n0;i<W.gas.length;i++)W.gas[i].outdoor=true;continue;}
    const fl=plane(a.id==='basement'?TX.stoneFloor:TX.floor,w,10,{order:-10});fl.rotation.x=-Math.PI/2;fl.position.x=cx;scene.add(fl);
    const cut=plane(TX.cut,w+0.4,0.7,{});cut.position.set(cx,-0.35,5);scene.add(cut);
    for(const r of a.rooms){const wl=plane(r.wallTex,10,6.5,{});wl.position.set((r.x0+r.x1)/2,3.25,-5);scene.add(wl);
      if(r.signTex){const sg=S(r.signTex,150,500,55);sg.position.set((r.x0+r.x1)/2,5.85,-4.97);scene.add(sg);}
      const pool=plane(TX.glow,9,7,{add:true,opacity:a.id==='basement'?0.14:0.2,order:-5});pool.rotation.x=-Math.PI/2;pool.position.set((r.x0+r.x1)/2,0.01,-1.0);scene.add(pool);
      const wash=plane(TX.glow,12,7,{add:true,opacity:0.12,order:-6});wash.position.set((r.x0+r.x1)/2,3.6,-4.96);scene.add(wash);}
    for(const x of [a.x0,...a.parts,a.x1])scene.add(thickWall(x,!(x===a.x0||x===a.x1)));
    for(const x of a.gas){const sc=S(TX.sconce,120,70,176);sc.position.set(x,3.5,-4.93);scene.add(sc);
      const gl=S(TX.glow,256/1.5,128,128,{add:true,fog:false,opacity:0.6});gl.position.set(x,3.5+(176-60)/120,-4.9);scene.add(gl);W.gas.push(gl);
      const ww=plane(TX.glow,3.4,3.4,{add:true,opacity:0.22,order:-6});ww.position.set(x,4.3,-4.95);scene.add(ww);}}
  /* Gesner room */
  const ex=id=>EXHIBITS.find(e=>e.id===id);
  put(TX.portrait,100,110,150,-17.2,3.5,-4.94,ex('gesner'));
  put(TX.vMin,110,150,260,-14.6,0,-1.4,ex('minerals'));solid(-14.6,-1.6,1.3,0.45);
  put(TX.cabRocks,100,150,560,-12.4,0,-4.55,ex('mohs'));solid(-12.4,-4.7,1.45,0.5);
  put(TX.lamp,100,70,320,-18.2,0,1.6,ex('lamp'));solid(-18.2,1.5,0.4,0.35);W.lampGlow=S(TX.glow,256/1.4,128,128,{add:true,fog:false,opacity:0.8});W.lampGlow.position.set(-18.2,2.62,1.65);scene.add(W.lampGlow);
  /* Entrance hall */
  const rug=plane(TX.rug,6.4,4,{order:-9});rug.rotation.x=-Math.PI/2;rug.position.set(-5,0.012,1.6);scene.add(rug);
  put(TX.desk,160,210,300,-5,0,-3.1,ex('attendant'));solid(-5,-3.3,1.6,0.6);
  // the attendant is a small rig too: she writes in the ledger, and looks up when the Archivist comes near
  W.att=new THREE.Group();W.att.position.set(-5,0.85,-3.75);scene.add(W.att);const ab=S(TX.attBody,190,130,260);W.att.add(ab);ab.art.userData.ex=ex('attendant');PICK.push(ab.art);
  W.attHead=new THREE.Group();W.attHead.position.set(0,(260-62)/190,-0.004);W.att.add(W.attHead);const ah=S(TX.attHead,190,100,205);W.attHead.add(ah);ah.art.userData.ex=ex('attendant');PICK.push(ah.art);
  W.attEyes=S(TX.attEyes,190,40,12);W.attEyes.position.set(0,(205-116)/190,0.004);W.attHead.add(W.attEyes);
  W.attArm=S(TX.attArm,190,104,14);W.attArm.position.set((200-130)/190,(260-134)/190,0.01);W.att.add(W.attArm);
  // the way out: a doormat at the open front of the hall (the street door is on the side we look in from)
  TX.mat=T(300,110,drawMat,{border:0});const mat=plane(TX.mat,2.6,0.95,{order:-8,alpha:true});mat.rotation.x=-Math.PI/2;mat.position.set(-5,0.014,4.25);mat.userData.ex=thing('to-street');PICK.push(mat);scene.add(mat);
  put(TX.notice,110,130,160,-8.2,3.4,-4.94,ex('notice'));put(TX.bench,110,150,120,-8.2,0,-4.55);solid(-8.2,-4.6,1.4,0.35);
  put(TX.lectern,100,70,260,-2.2,0,-0.9,ex('book'));solid(-2.2,-0.9,0.45,0.35);
  put(TX.clock,100,60,150,-3.6,4.0,-4.93);W.pend=S(TX.pend,100,20,0);W.pend.position.set(-3.6,4.15,-4.92);scene.add(W.pend);
  put(TX.stand,100,45,180,-0.55,0,-4.5);solid(-0.55,-4.5,0.4,0.3);
  /* Fossils */
  put(TX.fern,100,200,150,2.9,3.5,-4.94,ex('fern'));
  put(TX.vIns,110,150,260,5.2,0,-1.1,ex('insects'));solid(5.2,-1.3,1.3,0.45);
  put(TX.vTri,110,150,260,8.2,0,1.8,ex('trilobites'));solid(8.2,1.6,1.3,0.45);
  /* Birds & mammals */
  put(TX.caribou,105,260,460,14.4,0,-2.6,ex('caribou'));solid(14.4,-2.7,2.2,0.6);
  put(TX.cabBirds,100,150,560,18.1,0,-4.55,ex('birds'));solid(18.1,-4.7,1.45,0.5);
  put(TX.moose,100,120,110,11.6,4.4,-4.94);
  put(TX.mothTable,100,90,250,11.7,0,2.0,ex('moths'));solid(11.7,2.0,0.6,0.35);
  /* the offices upstairs */
  put(TX.bookcase,100,130,520,61.7,0,-4.6);solid(61.7,-4.6,1.3,0.4);
  put(TX.bigDesk,160,220,300,65.2,0,-3.0,thing('harrow'));solid(65.2,-3.2,1.45,0.6);
  put(TX.stand,100,45,180,69.2,0,-4.5);solid(69.2,-4.5,0.4,0.3);
  const rug2=plane(TX.rug,5.4,3.4,{order:-9});rug2.rotation.x=-Math.PI/2;rug2.position.set(65.4,0.012,0.6);scene.add(rug2);
  put(TX.letters,110,110,200,75,1.0,-4.94);put(TX.bench,110,150,120,75,0,-4.55);solid(75,-4.6,1.4,0.35);
  put(TX.filing,100,90,300,81.3,0,-4.6);solid(81.3,-4.6,0.9,0.4);
  put(TX.myDesk,150,210,320,84.2,0,-2.6,thing('mydesk'));solid(84.2,-2.8,1.45,0.55);
  put(TX.lamp,100,70,320,88.9,0,1.8);solid(88.9,1.7,0.4,0.35);
  // Mr. Harrow: a standing rig (body, head, eyes, the arm that holds the letter). He gestures while he talks.
  W.har=new THREE.Group();W.har.scale.setScalar(0.95);scene.add(W.har);const hb=S(TX.harBody,215,120,470);W.har.add(hb);hb.art.userData.ex=thing('harrow');PICK.push(hb.art);
  W.harHead=new THREE.Group();W.harHead.position.set(0,(470-96)/215,-0.004);W.harHead.scale.setScalar(1.18);W.har.add(W.harHead);const hh=S(TX.harHead,215,100,212);W.harHead.add(hh);hh.art.userData.ex=thing('harrow');PICK.push(hh.art);
  W.harEyes=S(TX.harEyes,215,40,12);W.harEyes.position.set(0,(212-114)/215,0.004);W.harHead.add(W.harEyes);
  W.harArm=S(TX.harArm,215,40,10);W.harArm.position.set((178-120)/215,(470-90)/215,0.01);W.har.add(W.harArm);
  W.harSolid={x:0,z:0,hx:0.32,hz:0.28};BOXES.push(W.harSolid);
  /* Mrs. Hanlon's boarding house, and the townspeople (placeCast puts them where the stage wants them) */
  buildLodgings();
  W.gage=makePerson(GAGE,'gage');W.hanlon=makePerson(HANLON,'hanlon');W.folk=FOLK.map(f=>makePerson(f,f.id));
  buildTitle();
  TX.cardFx=T(64,44,drawCardFx,{border:2,grain:false});W.cards=[];for(let i=0;i<22;i++){const c=S(TX.cardFx,300,32,22);c.visible=false;scene.add(c);W.cards.push(c);}
  /* the stacks, in the basement */
  for(const t of THINGS.filter(t=>t.kind==='shelf')){put(TX.shelves[t.shelf],110,150,560,t.at[0],0,-4.45,t);solid(t.at[0],-4.5,1.36,0.45);}
  put(TX.sortTable,110,180,200,136.8,0,1.6);solid(136.8,1.6,1.6,0.35);
  /* the archivist */
  buildRig();
  /* moths and motes */
  W.moths=[];for(let i=0;i<6;i++){const m=S(TX.moth,300,60,45);scene.add(m);W.moths.push(m);}
  const N=380,pos=new Float32Array(N*3);W.motes={N,seed:[]};R=mulberry(5);for(let i=0;i<N;i++)W.motes.seed.push([rr(-20,20),rr(0,6.5),rr(-5,5),rr(0,TAU),rr(0.3,1)]);
  const mg=new THREE.BufferGeometry();mg.setAttribute('position',new THREE.BufferAttribute(pos,3));
  W.moteMat=new THREE.PointsMaterial({size:0.05,map:TX.glow,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:0.5,color:col(P.paper)});W.motePts=new THREE.Points(mg,W.moteMat);scene.add(W.motePts);
  for(const g of W.gas)g.mat.color=col(P.glow);W.lampGlow.mat.color=col(P.glow);
  scene.traverse(o=>{if(o.isMesh&&o.material.blending===THREE.AdditiveBlending&&o.material.map===TX.glow&&!W.gas.some(g=>g.art===o))o.material.color=col(P.glow);});
}

/* Union Street, outside No. 72 (x 170..230). The museum's front is the "back wall" at z = -5: the sidewalk runs in
   front of it (z -5..-2.6), then the curb and the road. The open lot to the right of the museum is fenced. */
function buildStreet(a){const cx=(a.x0+a.x1)/2,w=a.x1-a.x0,F=190;// F: the museum's left edge
  TX.facade72=T(1100,1300,drawFacade72,{border:7,seed:1206});TX.frontDoor=T(260,420,drawFrontDoor,{border:5,seed:1207});
  TX.nbr=[0,1,2].map(v=>T(v?1000:1050,v?900:1000,drawNeighbour(v),{border:7,seed:1210+v}));
  TX.pole=T(200,1400,drawPole,{border:4,seed:1220});TX.fence=T(1140,150,drawFence,{border:4,seed:1221});TX.shed=T(500,360,drawShed,{border:5,seed:1222});
  TX.road=T(1024,512,drawRoad,{border:0,repeat:[w/10,1]});TX.walk=T(1024,256,drawWalk,{border:0,repeat:[w/5,1]});TX.curb=T(1024,34,drawCurb,{border:0,repeat:[w/7,1]});
  TX.sideWall=T(720,970,drawSideWall,{border:0,seed:1223});TX.sky=T(512,1024,drawSky,{border:0,grain:false});TX.skyline=T(2048,700,drawSkyline,{border:4,seed:1224});TX.moon=T(200,200,drawMoon,{border:5});
  const sky=plane(TX.sky,280,130,{fog:false,order:-20});sky.position.set(cx,45,-75);scene.add(sky);W.skies.push(sky);
  const moon=S(TX.moon,34,100,100,{fog:false});moon.position.set(cx+16,27,-70);scene.add(moon);W.moons.push(moon);
  const sk=S(TX.skyline,38,1024,700);sk.position.set(cx,0,-30);scene.add(sk);
  const road=plane(TX.road,w,7.6,{order:-10});road.rotation.x=-Math.PI/2;road.position.set(cx,0,1.2);scene.add(road);
  const walk=plane(TX.walk,w,2.4,{order:-10});walk.rotation.x=-Math.PI/2;walk.position.set(cx,0.004,-3.8);scene.add(walk);
  const curb=plane(TX.curb,w,0.24,{order:-9});curb.rotation.x=-Math.PI/2;curb.position.set(cx,0.008,-2.6);scene.add(curb);
  const lot=plane(TX.road,16,12,{order:-11});lot.rotation.x=-Math.PI/2;lot.position.set(211,-0.01,-11);scene.add(lot);
  const cut=plane(TX.cut,w+0.4,0.7,{});cut.position.set(cx,-0.35,5);scene.add(cut);
  // the buildings: the museum, its side wall over the lot, the neighbours
  put(TX.facade72,80,0,1300,F,0,-4.99);
  const sw=plane(TX.sideWall,9,12.1,{});sw.rotation.y=Math.PI/2;sw.position.set(F+1050/80-0.03,12.1/2,-9.5);scene.add(sw);
  put(TX.frontDoor,80,130,420,F+550/80,0,-4.96,thing('to-museum'));
  put(TX.nbr[0],80,0,1000,F-1050/80,0,-5.0);put(TX.nbr[1],80,0,900,F-1050/80-1000/80,0,-5.02);put(TX.nbr[2],80,0,900,218,0,-5.02);
  put(TX.fence,80,0,150,F+1100/80,0,-4.75);put(TX.shed,80,250,360,212,0,-13);
  // telegraph poles at the curb, as in the photo, and their wires (sagging between the poles)
  const POLES=[188.4,206.2],PZ=-2.4,TOP=14;// at the road edge of the curb, so the sidewalk is clear
  for(const x of POLES){put(TX.pole,100,100,1400,x,0,PZ);solid(x,PZ,0.14,0.14);}
  const wm=new THREE.LineBasicMaterial({color:col(mix(P.ink,P.skyBot,0.3))});
  for(const[dx,y] of [[-0.63,TOP-1.28],[-0.21,TOP-1.28],[0.21,TOP-1.28],[0.63,TOP-1.28],[-0.21,TOP-2.18],[0.21,TOP-2.18]]){
    const xs=[a.x0-2,...POLES,a.x1+2],pts=[];for(let k=0;k<xs.length-1;k++){const x0=xs[k]+dx,x1=xs[k+1]+dx,sag=0.02*(x1-x0);for(let u=0;u<=1;u+=0.05)pts.push(new THREE.Vector3(lerp(x0,x1,u),y-sag*4*u*(1-u),PZ-0.02));}
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),wm));}
  // light: the lamp by the door, the lit windows, a pool on the sidewalk
  const glow=(x,y,z,s,o)=>{const g=S(TX.glow,256/s,128,128,{add:true,fog:false,opacity:o});g.position.set(x,y,z);scene.add(g);W.gas.push(g);return g;};
  glow(F+408/80,(1300-955)/80,-4.9,2.2,0.75);glow(F+550/80,(1300-905)/80,-4.92,2.6,0.35);
  for(const i of [1,3,4])glow(F+BAYS[i]/80,(1300-1060)/80,-4.93,3.4,0.32);glow(F+BAYS[4]/80,(1300-700)/80,-4.93,2.8,0.25);
  const pool=plane(TX.glow,7,3.6,{add:true,opacity:0.3,order:-5});pool.rotation.x=-Math.PI/2;pool.position.set(F+480/80,0.012,-3.4);scene.add(pool);
  buildCab();}

/* ---------- rig ---------- */
const RIG={};
// an arm is two paper pieces pinned together: the upper arm swings at the shoulder, the forearm at the elbow
function makeArm(grip){const g=new THREE.Group();g.up=S(TX.upperArm,220,45,8);g.add(g.up);g.el=new THREE.Group();g.el.position.y=-(112-8)/220;g.add(g.el);
  g.fa=S(grip?TX.forearmGrip:TX.forearm,220,48,6);g.el.add(g.fa);g.up.position.z=0.002;return g;}
function buildRig(){const ppu=220;
  RIG.root=new THREE.Group();scene.add(RIG.root);RIG.body=new THREE.Group();RIG.root.add(RIG.body);RIG.hip=new THREE.Group();RIG.hip.position.y=0.99;RIG.body.add(RIG.hip);
  RIG.legF=S(TX.legSide,ppu,52,12);RIG.legN=S(TX.legSide,ppu,52,12);RIG.hip.add(RIG.legF);RIG.hip.add(RIG.legN);RIG.torso=new THREE.Group();RIG.hip.add(RIG.torso);
  RIG.coat=S(TX.coatSide,ppu,150,300);RIG.torso.add(RIG.coat);RIG.neck=new THREE.Group();RIG.torso.add(RIG.neck);RIG.head=S(TX.headS,ppu,110,250);RIG.neck.add(RIG.head);
  RIG.hat=new THREE.Group();RIG.neck.add(RIG.hat);RIG.hatS=S(TX.hat,ppu,90,204);RIG.hat.add(RIG.hatS);RIG.scarf=S(TX.scarf,ppu,206,18);RIG.torso.add(RIG.scarf);
  RIG.armF=makeArm(false);RIG.armN=makeArm(true);RIG.torso.add(RIG.armF);RIG.torso.add(RIG.armN);
  RIG.caseH=S(TX.case,ppu,100,16);RIG.caseH.position.set(0,-(108-6)/ppu,0.02);RIG.armN.el.add(RIG.caseH);
  RIG.shadow=plane(TX.blob,1.3,0.45,{alpha:true,order:-4});RIG.shadow.rotation.x=-Math.PI/2;scene.add(RIG.shadow);
  RIG.parts=[RIG.legF,RIG.legN,RIG.coat,RIG.head,RIG.hatS,RIG.scarf,RIG.armF.up,RIG.armF.fa,RIG.armN.up,RIG.armN.fa,RIG.caseH];
  RIG.far=[RIG.legF,RIG.armF.up,RIG.armF.fa];setBodyMode('side');}
function setBodyMode(m){RIG.mode=m;
  const L={side:TX.legSide,back:TX.legBack,front:TX.legFront}[m];RIG.legN.mat.map=L;RIG.legF.mat.map=L;
  RIG.coat.mat.map={side:TX.coatSide,back:TX.coatBack,front:TX.coatFront}[m];RIG.head.mat.map={side:TX.headS,back:TX.headB,front:TX.headF}[m];
  RIG.hatBaseX=m==='side'?0.045:0;RIG.scarf.visible=m!=='front';for(const a of [RIG.armN,RIG.armF])a.up.mat.map=m==='front'?TX.upperArmPlain:TX.upperArm;
  if(m==='side'){RIG.legN.position.set(0.02,0,-0.012);RIG.legF.position.set(-0.03,0,-0.035);RIG.legN.scale.x=RIG.legF.scale.x=1;
    RIG.armN.position.set(0.11,1.05,0.035);RIG.armF.position.set(-0.09,1.05,-0.05);RIG.neck.position.set(0.05,1.17,-0.006);RIG.scarf.position.set(-0.045,1.127,0.008);RIG.scarfBase=0;RIG.out={N:1,F:1};}
  else{const s=m==='front'?1:-1;// the case hand is the Archivist's left: screen right from the front, screen left from behind
    RIG.legN.position.set(s*0.11,0,-0.012);RIG.legF.position.set(-s*0.11,0,-0.014);RIG.legN.scale.x=s;RIG.legF.scale.x=-s;
    RIG.armN.position.set(s*0.33,1.04,0.02);RIG.armF.position.set(-s*0.33,1.04,0.02);RIG.neck.position.set(0,1.08,-0.006);RIG.scarf.position.set(0.04,1.12,0.008);RIG.scarfBase=Math.PI/2-0.05;RIG.out={N:s,F:-s};}
  RIG.farTint=m==='side'?0.68:0.95;}

/* ---------- player ---------- */
const ME={x:-6.8,z:2.6,view:{mode:'side',facing:1},flip:null,dist:0,amp:0,target:[],pending:null,stuck:0,idle:0};
const RAD=0.42;
function blocked(x,z){if(x<AREA.x0+RAD||x>AREA.x1-RAD||z<-5+RAD+0.1||z>4.6)return true;
  for(const wx of AREA.parts)if(Math.abs(x-wx)<RAD+0.12&&!(z>-2+RAD*0.85&&z<1-RAD*0.85))return true;
  for(const b of BOXES)if(Math.abs(x-b.x)<b.hx+RAD&&Math.abs(z-b.z)<b.hz+RAD)return true;return false;}
const roomAt=x=>AREA.rooms.find(r=>x>=r.x0&&x<r.x1)||AREA.rooms[0];
/* pathfinding: A* on a quarter-unit grid of the floor, then string-pulled so the walk looks deliberate */
const GS=0.25,GH=40;let GW=160,GRID=null;// the grid is rebuilt for each area (GRID=null), and when Mr. Harrow moves
function buildGrid(){GW=Math.round((AREA.x1-AREA.x0)/GS);GRID=new Uint8Array(GW*GH);for(let j=0;j<GH;j++)for(let i=0;i<GW;i++)GRID[j*GW+i]=blocked(AREA.x0+(i+0.5)*GS,-5+(j+0.5)*GS)?1:0;}
const cellOf=(x,z)=>[clamp(Math.floor((x-AREA.x0)/GS),0,GW-1),clamp(Math.floor((z+5)/GS),0,GH-1)];
const cellPt=(i,j)=>[AREA.x0+(i+0.5)*GS,-5+(j+0.5)*GS];
function freeNear(i,j){if(!GRID[j*GW+i])return[i,j];for(let r=1;r<12;r++)for(let dj=-r;dj<=r;dj++)for(let di=-r;di<=r;di++){if(Math.max(Math.abs(di),Math.abs(dj))!==r)continue;const a=i+di,b=j+dj;if(a>=0&&b>=0&&a<GW&&b<GH&&!GRID[b*GW+a])return[a,b];}return null;}
function lineFree(x0,z0,x1,z1){const n=Math.ceil(Math.hypot(x1-x0,z1-z0)/0.08);for(let k=1;k<=n;k++){const u=k/n;if(blocked(lerp(x0,x1,u),lerp(z0,z1,u)))return false;}return true;}
function astar(s,g){const N=GW*GH,gs=new Float32Array(N).fill(1e9),from=new Int32Array(N).fill(-1),closed=new Uint8Array(N);const si=s[1]*GW+s[0],gi=g[1]*GW+g[0];gs[si]=0;const open=[si];
  const h=k=>{const dx=Math.abs(k%GW-g[0]),dz=Math.abs((k/GW|0)-g[1]);return Math.max(dx,dz)+0.414*Math.min(dx,dz);};
  while(open.length){let bi=0,bf=1e9;for(let q=0;q<open.length;q++){const f=gs[open[q]]+h(open[q]);if(f<bf){bf=f;bi=q;}}const cur=open[bi];open[bi]=open[open.length-1];open.pop();
    if(cur===gi)break;if(closed[cur])continue;closed[cur]=1;const ci=cur%GW,cj=cur/GW|0;
    for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){if(!di&&!dj)continue;const a=ci+di,b=cj+dj;if(a<0||b<0||a>=GW||b>=GH)continue;const k=b*GW+a;if(GRID[k]||closed[k])continue;
      if(di&&dj&&(GRID[cj*GW+a]||GRID[b*GW+ci]))continue;const ng=gs[cur]+(di&&dj?1.414:1);if(ng<gs[k]){gs[k]=ng;from[k]=cur;open.push(k);}}}
  if(from[gi]<0&&si!==gi)return null;const out=[];for(let k=gi;k!==-1&&k!==si;k=from[k])out.push(cellPt(k%GW,k/GW|0));return out.reverse();}
function routeTo(x,z){if(!GRID)buildGrid();ME.stuck=0;const s=freeNear(...cellOf(ME.x,ME.z)),g=freeNear(...cellOf(x,z));if(!s||!g){ME.target=[];return;}
  const raw=astar(s,g);if(!raw){ME.target=[];return;}if(!blocked(x,z))raw.push([x,z]);
  const pts=[];let cx=ME.x,cz=ME.z,i=0;while(i<raw.length){let far=i;for(let k=raw.length-1;k>i;k--)if(lineFree(cx,cz,raw[k][0],raw[k][1])){far=k;break;}pts.push(raw[far]);[cx,cz]=raw[far];i=far+1;}
  ME.target=pts;}
const base=v=>v.mode!=='side'?0:(v.facing<0?Math.PI:0);
function wantView(vx,vz){const sp=Math.hypot(vx,vz);if(sp<1e-4)return ME.view;if(Math.abs(vx)>0.38*sp)return{mode:'side',facing:Math.sign(vx)};return{mode:vz<0?'back':'front',facing:ME.view.facing};}
function faceFront(){if(ME.view.mode!=='front'&&!ME.flip)ME.flip={from:ME.view,to:{mode:'front',facing:ME.view.facing},u:0};}
const keys={};
/* the start menu (#title) and the pause menu (#pausemenu): while either is up the world stands still */
const pauseMenu=document.getElementById('pausemenu'),titleScreen=document.getElementById('title');
const paused=()=>pauseMenu.open||!titleScreen.hidden||document.getElementById('options').open;
window.addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(paused()||document.body.dataset.overlay||FADE.on)return;
  if(k==='escape'&&!cardOpen){e.preventDefault();openPause();return;}
  if(e.target.id==='menubtn')return;
  if(e.target.closest?.('.hear-word,.hear-sentence') && ['enter',' ','e','arrowleft','arrowright'].includes(k))return;
  if(DLG.open){if(k==='arrowleft'){e.preventDefault();dlgBack();return;}if(k==='arrowright'){e.preventDefault();dlgNext();return;}
    if((k==='e'||k==='enter'||k===' ')&&!(document.activeElement&&document.activeElement.closest('.dlg-choices,.dlg-nav'))){e.preventDefault();dlgNext();}return;}
  if(CUT.on)return;
  if(cardOpen){if(k==='escape'||k==='e'||k==='enter'||k===' '){e.preventDefault();closeCard();}return;}
  if(['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d'].includes(k)){keys[k]=true;ME.target=[];ME.pending=null;e.preventDefault();}
  if((k==='e'||k==='enter'||k===' ')&&near&&document.activeElement&&!/INPUT|TEXTAREA/.test(document.activeElement.tagName)){if(document.activeElement.tagName==='BUTTON'&&document.activeElement.closest('.cat'))return;e.preventDefault();interact(near);}});
window.addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false;});
window.addEventListener('blur',()=>{for(const k in keys)keys[k]=false;});

/* ---------- catalogue card ---------- */
const ui={room:document.getElementById('room'),prompt:document.getElementById('prompt'),wrap:document.getElementById('cardwrap'),no:document.getElementById('cno'),croom:document.getElementById('croom'),title:document.getElementById('ctitle'),label:document.getElementById('clabel'),labelText:document.getElementById('clabeltext'),body:document.getElementById('cbody'),close:document.getElementById('close'),cat:document.getElementById('cat'),count:document.getElementById('count'),obj:document.getElementById('obj'),fade:document.getElementById('fade'),
  dlg:document.getElementById('dlg'),dlgFace:document.getElementById('dlgface'),dlgWho:document.getElementById('dlgwho'),dlgText:document.getElementById('dlgtext'),dlgCard:document.getElementById('dlgcard'),dlgChoices:document.getElementById('dlgchoices'),dlgMore:document.getElementById('dlgmore'),dlgBack:document.getElementById('dlgback'),dlgNextBtn:document.getElementById('dlgnext')};
let cardOpen=null,near=null;const seen=new Set();
function esc(s){return s.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));}
function openCard(ex){MuseumAudio.play('whoosh',0.22);cardOpen=ex;ME.target=[];ME.pending=null;for(const k in keys)keys[k]=false;
  ui.no.textContent='Cat. '+ex.no;ui.croom.textContent=ex.place||ROOMS[ex.room].name;ui.title.textContent=ex.name;
  ui.label.firstElementChild.textContent=ex.head||(ex.talk?'Says the attendant':'The museum’s label, 1910');ui.labelText.textContent=ex.label;
  ui.body.innerHTML=ex.body.map(p=>`<p>${esc(p)}</p>`).join('')+(ex.now?`<p class="now"><b>What we know now</b>${esc(ex.now)}</p>`:'');
  ReadAloud.attach(ui.labelText,ex.talk ? 'attendant' : 'narrator');
  for(const paragraph of ui.body.querySelectorAll('p')) {
    const heading=paragraph.querySelector('b');
    if(heading)heading.remove();
    ReadAloud.attach(paragraph,'narrator');
    if(heading)paragraph.prepend(heading);
  }
  ui.wrap.hidden=false;ui.close.focus();seen.add(ex.id);renderCat();
  faceFront();}
function closeCard(){MuseumAudio.stopVoice();cardOpen=null;ui.wrap.hidden=true;vp.focus({preventScroll:true});}
ui.close.onclick=closeCard;ui.wrap.addEventListener('click',e=>{if(e.target===ui.wrap)closeCard();});
function renderCat(){ui.count.textContent=`${seen.size}/${EXHIBITS.length} examined`;}
/* ================= STORY: the first evening at work =================
   The stages, their objectives and every line people say are in js/story.js (window.STORY). This part runs them:
   talking, the doors, the desk and the shelves move the story on. Saved in localStorage. */
const SAVE_KEY='archivist:save-v1';
const newGame=()=>({v:1,stage:'arrive',have:[],carrying:[],desk:{}});
let G=(()=>{try{return Object.assign(newGame(),JSON.parse(localStorage.getItem(SAVE_KEY))||{});}catch(e){return newGame();}})();
function persist(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(G));}catch(e){}}
const STAGE=()=>window.STORY.stages[G.stage]||{};
const busy=()=>!!(cardOpen||DLG.open||FADE.on||document.body.dataset.overlay||CUT.on);
function setStage(s){G.stage=s;persist();placeHarrow();placeCast();applyTime();renderObj();}
const ACT=()=>window.Activities;
function boxName(id){const b=ACT()?.BOXES[id];return b?`${b.maker.split(',')[0]} ${b.year}`:id;}
function renderObj(){
  const st=STAGE(),el=ui.obj;if(!el)return;let h=`<b>To do</b>${esc(typeof st.obj==='function'?st.obj(AREA.id):st.obj||'')}`;
  const c=st.case||st.fetch||st.file;const cs=c&&ACT()?.caseById(c);
  if(st.fetch&&cs){const got=cs.fetch.filter(b=>G.have.includes(b)).length;h+=`<span class="obj-rq">Boxes fetched: ${got} of ${cs.fetch.length} · ${cs.fetch.map(b=>(G.have.includes(b)?'✓ ':'')+boxName(b)).join(', ')}</span>`;}
  if(st.file&&G.carrying.length)h+=`<span class="obj-rq">Papers in your arms: ${G.carrying.length}</span>`;
  if(st.case&&cs)h+=`<span class="obj-rq">Question: ${esc(cs.rq.text)}</span>`;
  if(el.dataset.h!==h){el.innerHTML=h;el.dataset.h=h;}}

/* areas and doors */
const CAM0={h:4.8,back:10.6,look:2.3,ahead:1.9,m:3.8},CAMV=()=>AREA.cam||CAM0;
const camX=x=>clamp(x,AREA.x0+CAMV().m,AREA.x1-CAMV().m);
function snapCamera(){const c=CAMV();camPos.set(camX(ME.x),c.h,ME.z+c.back);camLook.set(camX(ME.x),c.look,ME.z-c.ahead);}
function enterArea(id){AREA=AREAS[id];GRID=null;near=null;ME.target=[];ME.pending=null;
  applyTime();renderObj();}
const FADE={on:false};
function fade(mid,done){FADE.on=true;ui.fade.classList.add('on');setTimeout(()=>{mid&&mid();setTimeout(()=>{ui.fade.classList.remove('on');setTimeout(()=>{FADE.on=false;done&&done();},160);},80);},170);}
function useDoor(d){MuseumAudio.play('creak',0.35);stopWalking();fade(()=>{enterArea(d.to[0]);ME.x=d.to[1];ME.z=d.to[2];ME.view={mode:d.face==='back'?'back':'front',facing:1};ME.flip=null;snapCamera();const s=window.STORY.onEnter?.(G.stage,d.to[0]);if(s)setStage(s);});}
function stopWalking(){ME.target=[];ME.pending=null;for(const k in keys)keys[k]=false;}

/* Mr. Harrow stands in his office, or beside your desk while you work through your first stack */
const HARROW_AT={home:[67.6,-2.7],desk:[86.6,-2.3],stacks:[129.3,-2.5],square:[320.6,-0.6]};
function placeHarrow(){if(!W.har)return;const where=STAGE().harrow||'home',[x,z]=HARROW_AT[where];W.har.position.set(x,0,z);const h=thing('harrow');h.at=[x,z+1.25];h.area=where==='stacks'?'basement':where==='square'?'square':'office';Object.assign(W.harSolid,{x,z});GRID=null;}
// a speaker's face as an image, for the coaching bubbles inside the desk and the stacks
const FACES={};function faceURL(who){if(FACES[who])return FACES[who];const sp=SPEAKERS[who],src=TX[sp.face]?.image;if(!src)return'';const c=document.createElement('canvas');c.width=c.height=96;const x=c.getContext('2d');x.fillStyle='#2a2c33';x.fillRect(0,0,96,96);const[a,b,w,h]=sp.crop;x.drawImage(src,a,b,w,h,0,0,96,96);return FACES[who]=c.toDataURL();}

/* dialogue */
const SPEAKERS={narrator:{name:'',face:null},conductor:{name:'The conductor',face:null},harrow:{name:'Mr. Harrow · the Curator',face:'harHead',crop:[22,40,156,156]},attendant:{name:'Miss Doucet · the attendant',face:'attHead',crop:[34,22,132,132]},gage:{name:'Percy Gage · travelling salesman',face:'head_gage',crop:[22,8,156,156]},hanlon:{name:'Mrs. Hanlon · your landlady',face:'head_hanlon',crop:[22,18,156,156]},cabman:{name:'The cabman',face:'cabmanH',crop:[0,0,70,75]},newsboy:{name:'A newsboy',face:'head_newsboy',crop:[24,20,152,152]},folk:{name:'Somebody in the crowd',face:null},you:{name:'You',face:'headF',crop:[40,36,170,170]}};
const DLG={open:false,lines:[],i:0,reply:null,end:null,who:null};
function say(lines,end){if(!lines||!lines.length){end&&end();return;}stopWalking();if(cardOpen)closeCard();DLG.open=true;DLG.lines=lines;DLG.i=0;DLG.reply=null;DLG.end=end;if(!CUT.lockView)faceFront();showLine();}
function showLine(){const L=DLG.lines[DLG.i];if(!L)return endDlg();
  if(L.do){MuseumAudio.stopVoice();ui.dlg.hidden=true;return DO[L.do](L,()=>{DLG.i++;showLine();});}renderLine(L);}
function card(L){
  if(L.card==='duties')return`<div class="dlg-card"><div class="rq-tag">Your job, in four parts</div><ol><li><b>Read</b> the letter. Find the <b>research question</b>.</li><li><b>Fetch</b> the papers from the stacks, in the basement.</li><li>At your desk, <b>sort</b> the papers and find <b>proof</b>.</li><li><b>File</b> every paper back in its box.</li></ol></div>`;
  if(L.card==='rule')return`<div class="dlg-card rule"><div class="p"><b>PRIMARY</b><p>Made by someone who was there, at the time.</p></div><div class="s"><b>SECONDARY</b><p>Made later, by someone who learned about it from other sources.</p></div></div>`;
  if(L.card==='note'&&L.note)return`<div class="dlg-card note"><div class="rq-tag">${esc(L.note.tag)}</div>${L.note.lines.map(l=>`<p>${esc(l)}</p>`).join('')}</div>`;
  if(L.card==='rq'){const c=ACT()?.caseById(L.case);return c?`<div class="dlg-card rq"><div class="rq-tag">Your research question</div><p>${esc(c.rq.text)}</p></div>`:'';}
  if(L.card==='slip'){const c=ACT()?.caseById(L.case);return c?`<div class="dlg-card"><div class="rq-tag">Request slip · fetch these boxes from the stacks</div><ol>${c.fetch.map(b=>`<li>${esc(ACT().BOXES[b].maker)} · ${esc(ACT().BOXES[b].year)}</li>`).join('')}</ol></div>`:'';}
  return'';}
function renderLine(L){const who=DLG.reply?.who||L.who,sp=SPEAKERS[who]||SPEAKERS.you;DLG.who=who;ui.dlg.classList.toggle('noface',!sp.face);ui.dlg.classList.toggle('narr',who==='narrator');
  const fc=ui.dlgFace.getContext('2d'),src=TX[sp.face]?.image;fc.fillStyle='#2a2c33';fc.fillRect(0,0,96,96);if(src){const[x,y,w,h]=sp.crop;fc.drawImage(src,x,y,w,h,0,0,96,96);}
  ui.dlgWho.textContent=sp.name;ui.dlgText.textContent=DLG.reply?DLG.reply.text:L.text;
  MuseumAudio.speak(who,ui.dlgText.textContent);
  ReadAloud.attach(ui.dlgText,who);
  ui.dlgCard.innerHTML=DLG.reply?'':card(L);ui.dlgCard.hidden=!ui.dlgCard.innerHTML;
  for(const block of ui.dlgCard.querySelectorAll('p,li'))ReadAloud.attach(block,who);
  ui.dlgChoices.replaceChildren();const ch=!DLG.reply&&L.choices;
  if(ch)for(const c of L.choices){
    const option=document.createElement('div'),label=document.createElement('span'),choose=document.createElement('button');
    option.className='spoken-choice';label.textContent=c.label;ReadAloud.attach(label,'you');
    choose.type='button';choose.textContent='Choose';choose.setAttribute('aria-label','Choose: '+c.label);
    choose.onclick=e=>{e.stopPropagation();DLG.reply={text:c.reply,again:!c.ok,who:c.who};renderLine(L);};
    option.append(label,choose);ui.dlgChoices.append(option);}
  ui.dlgMore.textContent=ch?'Choose an answer.':(matchMedia('(pointer: coarse)').matches?'':'E or → next · ← back');
  ui.dlgBack.disabled=!(DLG.reply||prevLine()>=0);ui.dlgNextBtn.hidden=!!ch;
  ui.dlg.hidden=false;(ch?ui.dlgChoices.querySelector('button'):ui.dlg).focus({preventScroll:true});}
function dlgNext(){if(!DLG.open||ui.dlg.hidden)return;const L=DLG.lines[DLG.i];
  if(DLG.reply){const again=DLG.reply.again;DLG.reply=null;if(again)return renderLine(L);DLG.i++;return showLine();}
  if(L&&L.choices)return;DLG.i++;showLine();}
// Back goes to the line before, but never back across something that happened (a walk, a fade, a new stage)
function prevLine(){for(let j=DLG.i-1;j>=0;j--){if(DLG.lines[j].do)return-1;return j;}return-1;}
function dlgBack(){if(!DLG.open||ui.dlg.hidden)return;const L=DLG.lines[DLG.i];if(DLG.reply){DLG.reply=null;return renderLine(L);}const j=prevLine();if(j<0)return;DLG.i=j;renderLine(DLG.lines[j]);}
function endDlg(){MuseumAudio.stopVoice();DLG.open=false;DLG.who=null;ui.dlg.hidden=true;vp.focus({preventScroll:true});const e=DLG.end;DLG.end=null;e&&e();}
// things a line of dialogue can make happen
const DO={
  stage:(L,next)=>{setStage(L.stage);next();},
  // the Curator walks you to your office: a fade, and you are both there
  toOffice:(L,next)=>fade(()=>{setStage(L.stage);enterArea('office');ME.x=84.6;ME.z=0.2;ME.view={mode:'front',facing:1};ME.flip=null;snapCamera();},next),
  harrowHome:(L,next)=>fade(()=>setStage(L.stage),next),
  // the Curator takes you down to the stacks
  toStacks:(L,next)=>fade(()=>{setStage(L.stage);enterArea('basement');ME.x=126.4;ME.z=-1.1;ME.view={mode:'front',facing:1};ME.flip=null;snapCamera();},next),
  // he shows you how to file the paper, at shelf P – Z (the dialogue goes on when the shelf closes)
  tutorShelf:(L,next)=>{if(!ACT())return next();ACT().shelf({shelfId:'p-z',mode:'file',carrying:G.carrying.slice(),have:[],tutor:true,face:faceURL('harrow'),
    onFile:d=>{G.carrying=G.carrying.filter(x=>x!==d);persist();renderObj();},onClose:()=>{vp.focus({preventScroll:true});next();}});},
  // and sends you back up to your own stack
  toDesk:(L,next)=>fade(()=>{setStage(L.stage);enterArea('office');ME.x=84.6;ME.z=0.2;ME.view={mode:'front',facing:1};ME.flip=null;snapCamera();},next),
  // your index cards spill out on the train
  cards:(L,next)=>{burstCards();MuseumAudio.play('whoosh',0.5);setTimeout(next,800);},
  // Percy Gage goes off down the aisle, selling
  gageGo:(L,next)=>{if(W.gage)W.gage.walk={to:W.gage.g.position.x+9,v:2.2};next();},
  // the morning paper opens; the story goes on when it is folded up
  paper:(L,next)=>{if(!ACT())return next();MuseumAudio.play('whoosh',0.3);ACT().paper({onClose:()=>{vp.focus({preventScroll:true});G.readPaper=true;persist();placeCast();next();}});},
  // the night passes: you wake in your room, and it is morning
  sleep:(L,next)=>fade(()=>{setStage(L.stage);ME.x=414.4;ME.z=-1.4;ME.view={mode:'front',facing:1};ME.flip=null;snapCamera();},next),
  // out to King Square for the comet
  toSquare:(L,next)=>fade(()=>{setStage(L.stage);enterArea('square');ME.x=317.6;ME.z=2.2;ME.view={mode:'front',facing:1};ME.flip=null;snapCamera();},next),
  // the next morning, in Mr. Harrow's office
  toHarrowOffice:(L,next)=>fade(()=>{setStage(L.stage);enterArea('office');ME.x=67.6;ME.z=0.8;ME.view={mode:'back',facing:1};ME.flip=null;snapCamera();},next),
};
function talk(who){const lines=window.STORY.talk[who]?.(G.stage);say(lines);}
/* The evening train (area 'train', x 258..282): one coach, three bays long. The back wall has its windows cut out; behind
   them the country and the telegraph poles slide past (their textures scroll while CUT.train is on). The seats are
   side-on: a plush back and cushion behind you, the carved end on the aisle in front of you, which hides your legs. */
function buildTrain(a){const cx=(a.x0+a.x1)/2,w=a.x1-a.x0;
  TX.carWall=T(800,600,drawCarWall,{border:0,seed:1300});TX.country=T(2048,512,drawCountry,{border:0,grain:false,repeat:[1,1],seed:1303});TX.trackPoles=T(1024,512,drawTrackPoles,{border:0,grain:false,repeat:[2,1]});
  TX.carFloor=T(1024,256,drawCarFloor,{border:0,repeat:[w/8,1]});TX.seatBack=T(300,300,drawSeatBack,{border:5,seed:1301});TX.seatEnd=T(300,230,drawSeatEnd,{border:5,seed:1302});
  const country=plane(TX.country,36,9,{fog:false,order:-20});country.position.set(cx,3.3,-7);scene.add(country);
  const poles=plane(TX.trackPoles,18,9,{alpha:true,fog:false,order:-19});poles.position.set(cx,0.6,-4.2);scene.add(poles);
  for(let x=a.x0+4;x<a.x1;x+=8){const wl=plane(TX.carWall,8,6,{alpha:true});wl.position.set(x,3,-2.3);scene.add(wl);
    const g=S(TX.glow,256/3,128,128,{add:true,fog:false,opacity:0.45});g.position.set(x,5.5,-1.6);scene.add(g);W.gas.push(g);}
  const fl=plane(TX.carFloor,w,4.6,{order:-10});fl.rotation.x=-Math.PI/2;fl.position.set(cx,0,0);scene.add(fl);
  const cut=plane(TX.cut,w+0.4,0.7,{});cut.position.set(cx,-0.35,2.3);scene.add(cut);
  for(let x=a.x0+0.4;x<a.x1-1;x+=2.0){put(TX.seatBack,200,30,300,x,0,-1.3);put(TX.seatEnd,200,30,230,x,0,-0.2);}}
const SEAT_X=258.4+2.0*4+0.72;// where you sit: the fifth seat
/* The cab: one group, built once, hidden until the opening. Its origin is on the road under the cab door; the horse is
   its own group in front (HX), in the horse frame of drawHorseBody. Paint order, back to front: far wheels, far shaft,
   far legs, near legs, tail, neck, body, near shaft, cab, near wheels. */
const HX=3.62;
function buildCab(){
  TX.cab=T(530,470,drawCab,{border:6,seed:1310});TX.wheelR=T(196,196,drawCabWheel(14),{border:0,seed:1311});TX.wheelF=T(146,146,drawCabWheel(12),{border:0,seed:1312});
  TX.shaft=T(410,105,drawShaft,{border:3,seed:1318});TX.cabmanB=T(140,135,drawCabmanBody,{border:5,seed:1313});TX.cabmanH=T(70,75,drawCabmanHead,{border:4,seed:1319});
  TX.horse=T(330,255,drawHorseBody,{border:6,seed:1314});TX.horseHead=T(100,155,drawHorseHead,{border:5,seed:1315});TX.horseTail=T(70,155,drawHorseTail,{border:4,seed:1320});
  TX.whip=T(65,250,drawWhip,{border:0,seed:1321});
  for(const k of ['foreUp','foreLo','hindUp','hindLo'])TX['leg_'+k]=T(65,104,drawHorseLeg(k),{border:4,seed:1330+k.length,cut:k.endsWith('Lo')?{t:10}:undefined});
  const g=new THREE.Group();g.visible=false;scene.add(g);const C={g,x:150,z:-1.0,v:0,d:0,goal:null,leave:false,wheels:[],legs:[]};W.cabS=C;
  const add=(par,tex,ax,ay,x,y,z,tint)=>{const s=S(tex,100,ax,ay);s.position.set(x,y,z);if(tint)s.mat.color.setScalar(tint);par.add(s);return s;};
  for(const[tex,x,r] of [[TX.wheelR,-0.9,0.95],[TX.wheelF,2.3,0.7]]){const c=tex.userData.w/2;C.wheels.push({s:add(g,tex,c,c,x+0.1,r,-0.42,0.45),r});}
  add(g,TX.shaft,-220,215,0,0.06,-0.3,0.5);
  const hg=new THREE.Group();hg.position.x=HX;g.add(hg);C.horse=hg;
  // legs: the upper piece swings at the elbow / stifle, the lower at the knee / hock (its z just behind the upper's)
  const leg=(fore,x,z,tint,o)=>{const up=add(hg,TX[fore?'leg_foreUp':'leg_hindUp'],35,8,x,fore?1.48:1.58,z,tint);
    const lo=add(up,TX[fore?'leg_foreLo':'leg_hindLo'],35,8,fore?0:-0.15,fore?-0.62:-0.72,-0.004,0);C.legs.push({up,lo,fore,o:o*TAU});};
  leg(false,0.38,-0.12,0.55,0.5);leg(true,2.16,-0.12,0.55,0.75);leg(false,0.5,-0.06,0,0);leg(true,2.3,-0.06,0,0.25);
  C.tail=add(hg,TX.horseTail,55,10,0.1,2.4,-0.04);
  C.body=add(hg,TX.horse,15,372,0,0,0);
  C.neck=add(hg,TX.horseHead,22,60,2.97,3.4,0.01);// (the head: it nods at the poll)
  add(g,TX.shaft,-220,215,0,0,0.06);
  C.man=add(g,TX.cabmanB,-130,390,0,0,-0.05);C.head=add(C.man,TX.cabmanH,35,70,1.9,3.6,0.004);
  add(g,TX.cab,200,470,0,0,0.02);add(g,TX.whip,-260,460,0,0,0.03);
  for(const[tex,x,r] of [[TX.wheelR,-0.9,0.95],[TX.wheelF,2.3,0.7]]){const c=tex.userData.w/2;C.wheels.push({s:add(g,tex,c,c,x,r,0.1),r});}
  const lamp=S(TX.glow,256/1.4,128,128,{add:true,fog:false,opacity:0.75});lamp.position.set(1.51,2.1,0.14);g.add(lamp);W.gas.push(lamp);
  C.reins=new THREE.Line(new THREE.BufferGeometry().setFromPoints([0,1,2].map(()=>new THREE.Vector3())),new THREE.LineBasicMaterial({color:col(P.boot)}));g.add(C.reins);}
// the walk: each leg spends about 60% of a stride on the ground, sweeping back, then lifts, folds at the knee or hock and
// swings forward. Four beats: near hind, near fore, far hind, far fore. The head nods twice a stride; the tail swings.
const STRIDE=1.9;
function cabTick(dt){const C=W.cabS;if(!C||!C.g.visible){MuseumAudio.drive('cab_roll',0);return;}
  if(C.goal!=null){const rem=C.goal-C.x,want=Math.min(3.4,Math.sqrt(2*0.9*Math.max(0,rem)));C.v=Math.min(want,C.v+1.1*dt);if(rem<0.03){C.x=C.goal;C.v=0;C.goal=null;}}
  else if(C.leave){C.v=Math.min(3.4,C.v+0.9*dt);if(C.x>242)C.g.visible=false;}
  C.x+=C.v*dt;C.d+=C.v*dt;
  // sound: each hoof sounds as it touches down (below), and the wheels and harness roll with the speed
  const near=CUT.skip?0:1/(1+(CUT.hideMe?0:Math.abs(C.x-ME.x))*0.18);
  MuseumAudio.drive('cab_roll',near*0.55*Math.min(1,C.v/2.4));
  C.g.position.set(C.x,0,C.z);
  for(const w of C.wheels)w.s.rotation.z=-C.d/w.r;
  C.amp=lerp(C.amp||0,Math.min(1,C.v/1.0),1-Math.exp(-6*dt));const amp=C.amp,cyc=C.d/STRIDE;
  C.legs.forEach((l,i)=>{const ph=((cyc+l.o/TAU)%1+1)%1;
    if(near&&C.v>0.05&&l.ph!=null&&l.ph>0.8&&ph<0.2)MuseumAudio.play('hoof_'+i%4,near*(l.fore?0.62:0.52)*(i<2?0.5:1),0.95+Math.random()*0.1);// legs 0,1 are the far side, behind the horse
    l.ph=ph;});
  for(const l of C.legs){const ph=((cyc+l.o/TAU)%1+1)%1,A=l.fore?0.3:0.26;let up,fold=0;
    if(ph<0.6)up=lerp(A,-A,ph/0.6);else{const u=(ph-0.6)/0.4,e=u*u*(3-2*u);up=lerp(-A,A,e);fold=Math.sin(Math.PI*u);}
    l.up.rotation.z=up*amp;l.lo.rotation.z=(l.fore?-1.0:0.7)*fold*amp-(l.fore?0:0.12*up*amp);}
  const bob=Math.cos(cyc*TAU*2);C.horse.position.y=0.03*amp*(0.5+0.5*bob);
  C.neck.rotation.z=0.06*amp*Math.sin(cyc*TAU*2)+(1-amp)*(0.03*Math.sin(TM*0.7)+0.02*Math.sin(TM*1.9));
  C.tail.rotation.z=0.05*Math.sin(TM*1.3)+0.04*amp*Math.sin(cyc*TAU);
  C.man.position.y=0.018*amp*Math.abs(Math.sin(cyc*TAU*2));C.head.rotation.z=0.03*amp*Math.sin(cyc*TAU*2+1)+(1-amp)*0.02*Math.sin(TM*0.5);
  // the reins: from his hands, through the terret on the saddle pad, to the bit (which moves with the head)
  const n=C.neck,bx=3.44-2.97,by=2.7-3.4,cs=Math.cos(n.rotation.z),sn=Math.sin(n.rotation.z),hy=C.horse.position.y,pa=C.reins.geometry.attributes.position;
  pa.setXYZ(0,2.56,3.04+C.man.position.y,0.05);pa.setXYZ(1,HX+1.75,2.84+hy,0.05);pa.setXYZ(2,HX+2.97+bx*cs-by*sn,3.4+hy+bx*sn+by*cs,0.05);pa.needsUpdate=true;}

/* ================= THE TOWN: building King Square, the boarding house, and the train from outside =================
   (The drawings are with Union Street, above. These put them in the world.) */
function buildSquare(a){
  TX.sqGround=T(2048,600,drawSquareGround,{border:0,seed:1400});TX.sideGround=T(1024,300,drawSidewalkGround,{border:0,seed:1401,repeat:[2,1]});
  TX.grassG=T(256,256,(ctx,W,H)=>{ctx.fillStyle=GRASS();ctx.fillRect(0,0,W,H);for(let i=0;i<500;i++){ctx.strokeStyle=R()<0.5?hexA(P.ink,0.3):hexA('#9ab07a',0.1);ctx.lineWidth=1.4;const x=rr(0,W),y=rr(0,H);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+rr(-2,2),y-rr(4,9));ctx.stroke();}},{border:0,grain:false,repeat:[6,3],seed:1409});
  TX.elm=T(600,760,drawElm,{border:6,seed:1402});TX.elm2=T(600,760,drawElm,{border:6,seed:1403});TX.lampPost=T(120,460,drawLampPost,{border:4,seed:1404});TX.parkBench=T(300,150,drawParkBench,{border:4,seed:1405});
  TX.bandstand=T(1000,1000,drawBandstand,{border:7,seed:1406});TX.boarding=T(900,1150,drawBoardingHouse,{border:7,seed:1407});TX.bhDoor=T(200,330,drawBHDoor,{border:5,seed:1408});
  TX.graves=[0,1,2,3].map(v=>T(480,260,drawGraves(v),{border:5,seed:1410+v}));TX.railing=T(512,120,drawRailing,{border:0,grain:false,repeat:[22/4.5,1]});
  TX.postSquare=T(300,430,drawFingerpost([['UNION ST.',1],['MUSEUM',1]]),{border:5,seed:1415});TX.postMarket=T(300,430,drawFingerpost([['CHARLOTTE ST.',-1],['MARKET',-1]]),{border:5,seed:1416});
  TX.postStreet=T(300,430,drawFingerpost([['KING SQUARE',-1],['SYDNEY ST.',-1]]),{border:5,seed:1417});TX.skyDay=T(512,1024,drawSkyDay,{border:0,grain:false});
  // the sky, the moon and the town beyond the square
  const sky=plane(TX.sky,320,130,{fog:false,order:-20});sky.position.set(336,45,-75);scene.add(sky);W.skies.push(sky);
  const moon=S(TX.moon,34,100,100,{fog:false});moon.position.set(350,27,-70);scene.add(moon);W.moons.push(moon);
  const sk=S(TX.skyline,38,1024,700);sk.position.set(336,0,-34);scene.add(sk);
  for(const[x,v] of [[296,0],[311,1],[325,2],[352,1],[365,0]])put(TX.nbr[v],80,0,v?900:1000,x,0,-17);
  // the ground: the square (x 300..335), then Sydney Street and the burial ground's side (x 335..372), and the grass
  // of the burial ground behind its railing
  const g1=plane(TX.sqGround,35,10,{order:-10});g1.rotation.x=-Math.PI/2;g1.position.set(317.5,0,0);scene.add(g1);
  const g2=plane(TX.sideGround,37,10,{order:-10});g2.rotation.x=-Math.PI/2;g2.position.set(353.5,0,0);scene.add(g2);
  const g3=plane(TX.grassG,23,13,{order:-9});g3.rotation.x=-Math.PI/2;g3.position.set(360.5,0.006,-9.2);scene.add(g3);
  const g4=plane(TX.grassG,40,14,{order:-11});g4.rotation.x=-Math.PI/2;g4.position.set(317.5,-0.01,-12);scene.add(g4);
  const cut=plane(TX.cut,72.4,0.7,{});cut.position.set(336,-0.35,5);scene.add(cut);
  // the square: elms behind, the bandstand in the middle, gas lamps along the cross path, benches
  for(const[x,z,t] of [[301.5,-8,TX.elm],[309,-9.5,TX.elm2],[326,-9,TX.elm],[333.5,-7.5,TX.elm2],[356,-8.5,TX.elm2],[368,-10.5,TX.elm]])put(t,70,300,760,x,0,z);
  put(TX.bandstand,80,500,1000,317,0,-3.7,thing('bandstand'));solid(317,-3.7,4.4,1.3);
  const glow=(x,y,z,s,o)=>{const g=S(TX.glow,256/s,128,128,{add:true,fog:false,opacity:o});g.position.set(x,y,z);scene.add(g);W.gas.push(g);return g;};
  for(const x of [304.5,312.5,322.5,330.5]){put(TX.lampPost,105,60,460,x,0,-1.4);solid(x,-1.4,0.18,0.18);glow(x,(460-100)/105,-1.36,2.2,0.7);
    const pool=plane(TX.glow,4,2.4,{add:true,opacity:0.18,order:-5});pool.rotation.x=-Math.PI/2;pool.position.set(x,0.012,-0.9);scene.add(pool);}
  for(const[x,z] of [[307.6,-2.6],[326.6,-2.6]]){put(TX.parkBench,110,150,150,x,0,z);solid(x,z,1.3,0.3);}
  // Sydney Street: Mrs. Hanlon's boarding house (its door is its own cut-out), a lamp at the corner
  put(TX.boarding,80,0,1150,337,0,-5.0);put(TX.bhDoor,80,100,330,BH_DOOR,0.5,-4.96,thing('to-lodgings'));
  put(TX.lampPost,105,60,460,349.2,0,-2.4);solid(349.2,-2.4,0.18,0.18);glow(349.2,(460-100)/105,-2.36,2.2,0.7);
  // the old burial ground: a low iron railing, and the stones behind it, row on row into the dark
  const rail=plane(TX.railing,22,1.0,{alpha:true});rail.position.set(361,0.5,-2.7);scene.add(rail);solid(361,-2.9,11,0.22);
  [[351.4,-3.8,0],[359.6,-4.4,1],[366.2,-3.7,2],[354.6,-6.6,3],[363.4,-7.4,1],[369.4,-6.2,0],[352.2,-10.2,2],[360.2,-11.4,3],[367.4,-10.4,1]].forEach(([x,z,v])=>put(TX.graves[v],140,0,260,x,0,z));
  // signposts at both ends, and one on Union Street pointing here
  put(TX.postSquare,100,150,430,370.6,0,-2.3,thing('to-union'));solid(370.6,-2.3,0.12,0.12);
  put(TX.postMarket,100,150,430,301.4,0,-2.3,thing('closed'));solid(301.4,-2.3,0.12,0.12);
  put(TX.postStreet,100,150,430,171.4,0,-2.3,thing('to-square'));}
function buildLodgings(){
  TX.stove=T(300,330,drawStove,{border:5,seed:1420});TX.ktable=T(420,230,drawKitchenTable,{border:5,seed:1421});TX.dresser=T(300,430,drawDresser,{border:5,seed:1422});
  TX.bedTex=T(520,300,drawBed,{border:5,seed:1423});TX.wash=T(200,300,drawWashstand,{border:5,seed:1424});TX.trunk=T(230,150,drawTrunk,{border:5,seed:1425});TX.ntable=T(200,230,drawNightTable,{border:5,seed:1426});
  // the kitchen
  put(TX.stove,110,150,330,401.8,0,-4.5);solid(401.8,-4.5,1.4,0.5);
  put(TX.dresser,110,150,430,408.2,0,-4.55);solid(408.2,-4.6,1.4,0.45);
  put(TX.ktable,110,210,230,405.6,0,-2.7);solid(405.6,-2.8,1.9,0.5);
  const mat=plane(TX.mat,2.6,0.95,{order:-8,alpha:true});mat.rotation.x=-Math.PI/2;mat.position.set(405,0.014,4.25);mat.userData.ex=thing('to-sydney');PICK.push(mat);scene.add(mat);
  // your room (Mr. Tull's old room)
  put(TX.wash,100,100,300,411.6,0,-4.5);solid(411.6,-4.5,0.8,0.4);
  put(TX.ntable,100,100,230,413.6,0,-3.6,thing('paper'));solid(413.6,-3.6,0.8,0.35);
  put(TX.bedTex,100,260,300,416.8,0,-3.9);solid(416.8,-4.0,2.5,0.7);
  put(TX.trunk,100,115,150,418.6,0,-0.9,thing('trunk'));solid(418.6,-0.9,1.1,0.4);}
// the townspeople: a body, a head (pinned at the neck, swapped for a looking-up head on the comet night), maybe an arm
function makePerson(sp,id){
  const tb=T(240,480,drawPerson(sp.body),{seed:1500+id.length*7}),th=T(200,220,drawPersonHead(sp.head),{cut:{b:192},seed:1530+id.length*7}),tu=T(200,220,drawPersonHead({...sp.head,up:true,grin:false}),{cut:{b:192},seed:1560+id.length*7});
  TX['head_'+id]=th;const ta=sp.arm?T(96,220,drawPersonArm(sp.arm),{border:4,seed:1590+id.length}):null;
  const g=new THREE.Group();g.scale.setScalar(0.95*(sp.scale||1));scene.add(g);const ex=thing(id);
  const b=S(tb,215,120,470);g.add(b);if(ex){b.art.userData.ex=ex;PICK.push(b.art);}
  const hg=new THREE.Group();hg.position.set(0,(470-92)/215,-0.004);hg.scale.setScalar(1.12);g.add(hg);const h=S(th,215,100,212);hg.add(h);if(ex){h.art.userData.ex=ex;PICK.push(h.art);}
  let arm=null;if(ta){arm=S(ta,215,40,10);arm.position.set((176-120)/215,(470-92)/215,0.01);g.add(arm);}
  const shadow=plane(TX.blob,1.1,0.4,{alpha:true,order:-4});shadow.rotation.x=-Math.PI/2;scene.add(shadow);
  const sol={x:-1e4,z:0,hx:0.3,hz:0.26};BOXES.push(sol);g.visible=false;shadow.visible=false;
  return{g,head:hg,headS:h,headTex:th,upTex:tu,arm,shadow,solid:sol,id,seed:rr(0,TAU),talk:0};}
// where the townspeople stand, by stage. The folk: the newsboy first, then the passers-by.
const CAST_AT={gage:{towork:[326.4,-0.6],comet:[310.6,0.6]},hanlon:[402.4,-1.7],
  folk:{towork:[[321.6,-1.5],[306.2,-1.9],[332.2,-1.2]],comet:[[314.6,-0.4],[309.4,-1.6],[323.6,-1.0],[327.8,0.0],[305.2,0.2],[319.6,1.8]]}};
function placeCast(){if(!W.gage)return;const st=G.stage;
  const at=(p,xz,area)=>{const on=!!xz,t=thing(p.id);p.g.visible=on;p.shadow.visible=on;if(t)t.off=!on;if(!on){p.solid.x=-1e4;return;}
    p.g.position.set(xz[0],0,xz[1]);p.shadow.position.set(xz[0]+0.05,0.015,xz[1]+0.05);Object.assign(p.solid,{x:xz[0],z:xz[1]});if(t){t.at=[xz[0]+(p.id==='hanlon'?1.5:0),xz[1]+1.2];t.area=area;}};
  if(!W.gage.inTrain&&!W.gage.walk)at(W.gage,CAST_AT.gage[st],'square');
  at(W.hanlon,CAST_AT.hanlon,'lodgings');
  W.folk.forEach((f,i)=>{at(f,(CAST_AT.folk[st]||[])[i],'square');f.headS.mat.map=st==='comet'?f.upTex:f.headTex;});
  const pp=thing('paper');if(pp)pp.off=!G.readPaper;
  GRID=null;}
// night or a foggy day: the stage says which. Outdoors, the sky, the moon, the fog and the gas lamps follow it.
const isNight=()=>TITLE.on||(CUT.on&&!G.opening)||!!(window.STORY.stages[G.stage]||{}).night;
function applyTime(){const night=isNight();
  for(const s of W.skies||[])s.material.map=night?TX.sky:TX.skyDay;for(const m of W.moons||[])m.visible=night&&!TITLE.on;// on the title, the comet is the only bright thing in the sky
  for(const g of W.gas)if(g.outdoor)g.dayK=night?1:0.25;
  const f=(!night&&AREA.fogDay)||AREA.fog||[16,42,P.fog];scene.fog.near=f[0];scene.fog.far=f[1];scene.fog.color.copy(col(f[2]));}
// the door that leads toward an area: the first step of the shortest way there, through the doors
function doorToward(from,to){if(from===to)return null;const q=[[from,null]],seen=new Set([from]);
  while(q.length){const[a,first]=q.shift();for(const[id,d] of Object.entries(DOORS)){if(d.from!==a)continue;const b=d.to[0];if(seen.has(b))continue;const f=first||id;if(b===to)return f;seen.add(b);q.push([b,f]);}}return null;}
/* your index cards, spilling out of the case on the train: they fly up, flutter down, and lie on the floor */
function drawCardFx(ctx,W,H){const c=box(3,3,W-6,H-6,0.6);fill(ctx,c,mix(P.paper,'#ffffff',0.2));line(ctx,[[6,11],[W-6,11]],1.6,P.red||'#a8432f');for(let k=1;k<4;k++)line(ctx,[[6,11+k*7],[W-6,11+k*7]],1,'#6a8aaa',0.6);ink(ctx,c,1.4);}
function burstCards(){if(!W.cards)return;W.cards.forEach((c,i)=>{c.visible=true;c.p=[ME.x+0.25,1.25,ME.z+0.3];c.v=[rr(-1.6,2.6),rr(2.2,4.4),rr(-0.6,1.4)];c.spin=rr(-6,6);c.down=false;c.rotation.set(0,0,rr(0,TAU));});}
function hideCards(){for(const c of W.cards||[])c.visible=false;}
function cardsTick(dt){for(const c of W.cards||[]){if(!c.visible||c.down)continue;c.v[1]-=5.2*dt;c.v[0]*=1-1.6*dt;c.v[2]*=1-1.6*dt;if(c.v[1]<-0.9)c.v[1]=-0.9;// paper falls slowly
  c.p[0]+=c.v[0]*dt;c.p[1]+=c.v[1]*dt;c.p[2]+=c.v[2]*dt;c.p[0]+=Math.sin(TM*7+c.spin)*0.6*dt;c.rotation.z+=c.spin*dt;
  if(c.p[1]<0.03){c.p[1]=0.03;c.down=true;c.rotation.set(-Math.PI/2,0,c.rotation.z);}c.position.set(...c.p);}}
/* the train from outside (area 'line'): locomotive, tender, two coaches, turning wheels, side rods, smoke */
function buildLine(a){const cx=(a.x0+a.x1)/2,w=a.x1-a.x0;
  TX.lineCountry=T(2048,512,drawCountry,{border:0,grain:false,repeat:[3,1],seed:1340});TX.spruce=T(2048,300,drawSpruceBand,{border:0,grain:false,repeat:[3,1],seed:1341});
  TX.track=T(1024,128,drawTrack,{border:0,repeat:[w/8,1],seed:1347});TX.loco=T(760,420,drawLoco,{border:6,seed:1342});TX.tender=T(400,280,drawTender,{border:6,seed:1343});TX.coachOut=T(1000,340,drawCoachOut,{border:6,seed:1344});
  TX.puff=T(128,128,drawPuff,{border:0,grain:false});TX.drv=T(170,170,drawCabWheel(16),{border:0,seed:1345});TX.lead=T(90,90,drawCabWheel(10),{border:0,seed:1346});
  TX.field=T(256,256,(ctx,W,H)=>{ctx.fillStyle=mix(P.far,P.ink,0.5);ctx.fillRect(0,0,W,H);for(let i=0;i<400;i++){ctx.strokeStyle=hexA(P.paper,rr(0.03,0.08));ctx.lineWidth=1.2;const x=rr(0,W),y=rr(0,H);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+rr(-2,2),y-rr(4,8));ctx.stroke();}},{border:0,grain:false,repeat:[w/6,3],seed:1348});
  const sky=plane(TX.sky,420,150,{fog:false,order:-22});sky.position.set(cx,50,-95);scene.add(sky);
  const moon=S(TX.moon,30,100,100,{fog:false});moon.position.set(cx+28,26,-85);scene.add(moon);
  const country=plane(TX.lineCountry,180,30,{fog:false,order:-21});country.position.set(cx,7,-45);scene.add(country);
  const spr=plane(TX.spruce,150,8,{alpha:true,order:-20});spr.position.set(cx,3.6,-16);scene.add(spr);
  const field=plane(TX.field,w+60,30,{order:-12});field.rotation.x=-Math.PI/2;field.position.set(cx,-0.02,-4);scene.add(field);
  const track=plane(TX.track,w+60,1.8,{order:-10});track.rotation.x=-Math.PI/2;track.position.set(cx,0.01,0);scene.add(track);
  for(let x=a.x0-20;x<a.x1+20;x+=15){put(TX.pole,100,100,1400,x,0,-4.5);}
  const wm=new THREE.LineBasicMaterial({color:col(mix(P.ink,P.skyBot,0.3))});
  for(const y of [12.6,12.2]){const pts=[];for(let x=a.x0-20;x<a.x1+20;x+=15){for(let u=0;u<=1;u+=0.1)pts.push(new THREE.Vector3(x+15*u,y-0.4*4*u*(1-u),-4.52));}scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),wm));}
  // the train, built facing right; its origin at the back of the last coach, on the rail
  const g=new THREE.Group();g.visible=false;scene.add(g);const C={g,x:a.x0,v:0,d:0,wheels:[],puffs:[],emit:0};W.trainOut=C;
  const add=(tex,ax,ay,x,y,z,o)=>{const s=S(tex,100,ax,ay,o);s.position.set(x,y,z);g.add(s);return s;};
  add(TX.coachOut,0,340,0,0.18,0);add(TX.coachOut,0,340,10.2,0.18,0);add(TX.tender,0,280,20.4,0.18,0);add(TX.loco,0,420,24.5,0.18,0);
  const wheel=(tex,px,x,r)=>{const s=S(tex,100,px/2,px/2);s.position.set(x,0.18+r,0.05);s.scale.setScalar(r/(px/200));s.mat.color.setScalar(0.55);g.add(s);C.wheels.push({s,r,x});};
  for(const x of [1.4,2.4,7.6,8.6,11.6,12.6,17.8,18.8,21.2,22.2,23.4])wheel(TX.lead,90,x,0.42);
  for(const x of [29.6,30.5])wheel(TX.lead,90,x,0.45);for(const x of [26.6,28.2])wheel(TX.drv,170,x,0.8);
  C.rod=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3()]),new THREE.LineBasicMaterial({color:col(mix(P.brass,P.ink,0.4))}));g.add(C.rod);
  const lamp=S(TX.glow,256/5,128,128,{add:true,fog:false,opacity:0.95});lamp.position.set(24.5+6.7,0.18+3.06,0.1);g.add(lamp);W.gas.push(lamp);
  for(let x=1;x<20;x+=2.4){const wg=S(TX.glow,256/2.2,128,128,{add:true,fog:false,opacity:0.3});wg.position.set(x,2.3,0.08);g.add(wg);}
  for(let i=0;i<28;i++){const p=haze(S(TX.puff,90,64,64));p.visible=false;scene.add(p);C.puffs.push({s:p,age:9});}}
function lineTick(dt){const C=W.trainOut;if(!C||!C.g.visible)return;C.x+=C.v*dt;C.d+=C.v*dt;C.g.position.set(C.x,0,0);
  for(const w of C.wheels)w.s.rotation.z=-C.d/w.r;
  const a=-C.d/0.8,pin=x=>new THREE.Vector3(x+0.42*Math.cos(a),0.98+0.42*Math.sin(a),0.12),pa=C.rod.geometry.attributes.position,p0=pin(26.6),p1=pin(28.2);pa.setXYZ(0,p0.x,p0.y,p0.z);pa.setXYZ(1,p1.x,p1.y,p1.z);pa.needsUpdate=true;
  C.emit-=dt;if(C.emit<=0){C.emit=0.11;const p=C.puffs.reduce((o,q)=>q.age>o.age?q:o);p.age=0;p.s.visible=true;p.s.position.set(C.x+24.5+6.1,4.2,0.02);p.v=[rr(-0.4,0.3),rr(1.6,2.3)];}
  for(const p of C.puffs){if(!p.s.visible)continue;p.age+=dt;if(p.age>3.6){p.s.visible=false;continue;}const u=p.age/3.6;p.v[1]*=1-0.9*dt;p.s.position.x+=p.v[0]*dt;p.s.position.y+=p.v[1]*dt;
    p.s.scale.setScalar(0.7+u*2.8);p.s.mat.opacity=0.85*(1-u);p.s.quaternion.copy(camera.quaternion);}}

/* ================= THE OPENING =================
   Played once, at the start of a new game (stage 'arrive', until G.opening is set). The train (narration from
   STORY.opening.train), a fade, the cab to Union Street, the walk to the door, the camera rising up the building with the
   title, one line at the door. Then the game. Skip ends it at the door. Waits run on CUT.t, which only moves while the
   game is not paused, so pausing holds the opening. */
const CUT={on:false,t:0,waits:[],cam:null,skip:false,lockView:false,hideMe:false,train:false,line:false,follow:false,say:null,fadeRej:null};
function cutWait(s){return new Promise((res,rej)=>CUT.waits.push({at:CUT.t+s,res,rej}));}
function cutUntil(fn,max=30){const t0=CUT.t;return new Promise((res,rej)=>CUT.waits.push({fn:()=>fn()||CUT.t-t0>max,res,rej}));}
function cutSay(lines){return new Promise((res,rej)=>{CUT.say=rej;say(lines,()=>{CUT.say=null;res();});});}
function cutFade(mid){return new Promise((res,rej)=>{CUT.fadeRej=rej;fade(()=>{if(!CUT.skip)mid();},()=>{CUT.fadeRej=null;res();});});}
function cutTick(dt){CUT.t+=dt;if(CUT.train){TX.country.offset.x+=dt*0.012;TX.trackPoles.offset.x+=dt*0.34;}cabTick(dt);lineTick(dt);
  if(CUT.follow&&CUT.cam){const x=W.trainOut.x+26;CUT.cam.pos[0]=x;CUT.cam.look[0]=x;}
  for(const w of CUT.waits.slice())if(w.fn?w.fn():CUT.t>=w.at){CUT.waits.splice(CUT.waits.indexOf(w),1);w.res();}}
async function runOpening(){
  CUT.on=true;CUT.train=false;CUT.skip=false;CUT.t=0;CUT.waits=[];CUT.lockView=true;document.body.classList.add('cutscene');document.getElementById('skipbtn').hidden=false;
  const C=W.cabS,O=window.STORY.opening,TR=W.trainOut;
  try{
    // outside: the evening train crosses the dark country. The camera rides alongside, then lets it go by.
    await cutFade(()=>{enterArea('line');CUT.hideMe=true;Object.assign(TR,{x:438,v:6.4,d:0,emit:0});TR.g.visible=true;CUT.line=true;CUT.follow=true;
      const x=TR.x+26;ME.x=x;ME.z=0;CUT.cam={pos:[x,3.3,15.5],look:[x,2.1,-2],k:40};camPos.set(...CUT.cam.pos);camLook.set(...CUT.cam.look);applyTime();});
    await cutWait(1.2);
    await cutSay(O.line);
    CUT.follow=false;const cx=CUT.cam.pos[0]+12;CUT.cam={pos:[cx,3.0,15.5],look:[cx,2.3,-2],k:0.7};
    await cutUntil(()=>TR.x>cx+4,9);await cutWait(0.8);
    // inside: your seat, Mr. Gage, the cards, the letter, the conductor
    await cutFade(()=>{CUT.line=false;TR.g.visible=false;for(const p of TR.puffs)p.s.visible=false;CUT.cam=null;enterArea('train');ME.x=SEAT_X;ME.z=-0.75;ME.sink=0.52;ME.view={mode:'side',facing:1};ME.flip=null;ME.target=[];CUT.hideMe=false;CUT.train=true;
      const g=W.gage;g.inTrain=true;g.walk=null;g.g.visible=true;g.shadow.visible=true;g.g.position.set(SEAT_X+1.9,0,0.5);g.shadow.position.set(SEAT_X+1.95,0.015,0.55);snapCamera();});
    await cutWait(1.6);
    await cutSay(O.train);
    await cutWait(0.5);
    // Union Street: a cab from the depot. You ride inside (hidden); the cabman talks over his shoulder.
    await cutFade(()=>{CUT.train=false;ME.sink=0;CUT.hideMe=true;hideCards();W.gage.inTrain=false;W.gage.walk=null;placeCast();enterArea('street');Object.assign(C,{x:158,v:0,d:0,goal:F72_DOOR,leave:false});C.g.visible=true;ME.x=C.x;ME.z=1.2;snapCamera();});
    const ride=cutUntil(()=>{ME.x=C.x;return C.goal==null;},60);
    await cutSay(O.cab);
    await ride;
    await cutWait(0.8);
    // you step down on the curb side, behind the cab, and it drives off
    ME.x=F72_DOOR+0.4;ME.z=-2.2;ME.view={mode:'front',facing:1};CUT.hideMe=false;MuseumAudio.play('stone_1',0.52,0.85);
    await cutWait(0.6);C.leave=true;
    await cutWait(1.8);routeTo(F72_DOOR,-3.5);
    await cutUntil(()=>!ME.target.length,8);
    // the camera rises up the front of No. 72, and the title
    CUT.cam={pos:[F72_DOOR,6.8,8.5],look:[F72_DOOR,12.2,-5]};
    await cutWait(1.8);document.getElementById('optitle').hidden=false;MuseumAudio.play('title_phrase',0.58);
    await cutWait(3.6);document.getElementById('optitle').hidden=true;CUT.cam=null;
    await cutWait(1.2);CUT.cam={pos:[F72_DOOR+1.2,3.4,6.2],look:[F72_DOOR,2.2,-4.6]};// close in for your line at the door
    await cutWait(1.4);
    await cutSay(O.door);CUT.cam=null;
  }catch(e){if(e!=='skip')console.error(e);}
  finishOpening();}
function skipOpening(){if(!CUT.on||CUT.skip)return;CUT.skip=true;for(const w of CUT.waits.splice(0))w.rej('skip');
  if(CUT.say){const r=CUT.say;CUT.say=null;DLG.end=null;endDlg();r('skip');}
  if(CUT.fadeRej){const r=CUT.fadeRej;CUT.fadeRej=null;r('skip');}}
function finishOpening(){const skipped=CUT.skip;
  const done=()=>{MuseumAudio.drive('cab_roll',0);Object.assign(CUT,{on:false,train:false,cam:null,lockView:false,hideMe:false,waits:[],say:null,fadeRej:null});ME.sink=0;W.cabS.g.visible=false;W.cabS.goal=null;W.cabS.leave=false;Object.assign(CUT,{line:false,follow:false});W.trainOut.g.visible=false;for(const p of W.trainOut.puffs)p.s.visible=false;hideCards();W.gage.inTrain=false;W.gage.walk=null;
    document.getElementById('optitle').hidden=true;document.getElementById('skipbtn').hidden=true;document.body.classList.remove('cutscene');
    if(skipped||AREA.id!=='street'){enterArea('street');ME.x=F72_DOOR;ME.z=-3.5;ME.view={mode:'front',facing:1};ME.flip=null;ME.target=[];snapCamera();}
    G.opening=true;persist();placeCast();applyTime();renderObj();vp.focus({preventScroll:true});};
  if(skipped)fade(done);else done();}



/* the desk and the shelves open the paper activities (js/desk/) over the museum */
function useDesk(){const st=STAGE();
  if(!st.case||!ACT()){const ev=window.STORY.deskEvent?.(G.stage);return say(ev||[{who:'you',text:window.STORY.deskIdle(G.stage)}]);}
  stopWalking();const cid=st.case,save=G.desk[cid]||(G.desk[cid]={});
  ACT().desk({caseId:cid,save,persist,face:faceURL('harrow'),onLeave:()=>vp.focus({preventScroll:true}),
    onComplete:()=>{G.carrying=ACT().docsOf(ACT().caseById(cid));G.have=[];persist();vp.focus({preventScroll:true});say(window.STORY.afterCase(cid),()=>{if(STAGE().case===cid)setStage(st.next);});}});}
function useShelf(id){const st=STAGE();if(!ACT())return;stopWalking();
  const mode=st.fetch?'fetch':st.file?'file':'browse';
  ACT().shelf({shelfId:id,mode,need:st.fetch?ACT().caseById(st.fetch).fetch:[],have:G.have.slice(),carrying:mode==='file'?G.carrying.slice():[],
    onTake:b=>{if(!G.have.includes(b))G.have.push(b);persist();renderObj();},
    onFile:d=>{G.carrying=G.carrying.filter(x=>x!==d);persist();renderObj();},
    onClose:()=>{vp.focus({preventScroll:true});progress();}});}
function progress(){const st=STAGE();
  if(st.fetch&&ACT().caseById(st.fetch).fetch.every(b=>G.have.includes(b))){setStage(st.next);say(window.STORY.afterFetch(st.fetch));}
  else if(st.file&&!G.carrying.length){setStage(st.next);say(window.STORY.afterFile(st.file));}}

/* the quest marker: the pointing hand over the next thing to use (STORY.stages[...].goal), or over the door that
   leads toward it. Off the side of the screen, it points along the edge. */
const DOOR_TOWARD={museum:{office:'to-offices',basement:'to-offices',street:'to-street'},office:{museum:'to-galleries',basement:'to-stacks',street:'to-galleries'},
  basement:{office:'to-upstairs',museum:'to-upstairs',street:'to-upstairs'},street:{museum:'to-museum',office:'to-museum',basement:'to-museum'}};
function questGoal(){const st=STAGE(),A=ACT();let id=st.goal;if(!id)return null;
  if(id==='shelf'){if(!A)return null;let box=null;if(st.fetch)box=A.caseById(st.fetch).fetch.find(b=>!G.have.includes(b));else if(st.file&&G.carrying.length)box=A.SOURCES[G.carrying[0]].box;if(!box)return null;id='shelf-'+A.shelfOf(box).id;}
  const t=EXHIBITS.concat(THINGS).find(e=>e.id===id);if(!t||t.off)return null;return t.area===AREA.id?t:thing(doorToward(AREA.id,t.area));}
function questMarker(){const m=ui.marker;if(!m)return;const q=busy()?null:questGoal();if(!q||near===q)return m.hide();
  v3.set(q.at[0],q.labelY+0.25,q.at[1]-0.8);v3.project(camera);const W_=vp.clientWidth,H_=vp.clientHeight;let x=(v3.x*0.5+0.5)*W_,y=(-v3.y*0.5+0.5)*H_;
  if(v3.z>1||x<24||x>W_-24){const right=v3.z>1?q.at[0]>ME.x:x>W_/2;return m.at(right?W_-18:18,clamp(y,120,H_-120),right?'right':'left');}
  m.at(x,clamp(y,110,H_-20),'down');}
function interact(x){if(!x||busy())return;
  if(x.kind==='door')return useDoor(x.door);
  if(x.kind==='desk')return useDesk();
  if(x.kind==='shelf')return useShelf(x.shelf);
  if(x.folk!=null)return say(window.STORY.talk.folk(G.stage,x.folk));
  if(x.kind==='bed')return say(G.stage==='sleep'?window.STORY.sleep:window.STORY.look('bed',G.stage));
  if(x.kind==='look'){const l=window.STORY.look(x.id,G.stage);return l?say(l):undefined;}
  if(x.kind==='talk'||x.id==='attendant'){if(x.id==='attendant'){seen.add('attendant');renderCat();}return talk(x.id);}
  openCard(x);}


/* ---------- pointer: tap to walk, tap an exhibit, drag to peek ---------- */
const drag={on:false,x:0,y:0,moved:0,yaw:0,pitch:0,ty:0,tp:0};const ray=new THREE.Raycaster(),ndc=new THREE.Vector2();
vp.addEventListener('pointerdown',e=>{if(busy()||e.target.closest('.cardwrap,.prompt,.menubtn'))return;vp.focus({preventScroll:true});drag.on=true;drag.x=e.clientX;drag.y=e.clientY;drag.moved=0;vp.setPointerCapture(e.pointerId);});
vp.addEventListener('pointermove',e=>{if(!drag.on)return;const w=vp.clientWidth;drag.moved=Math.max(drag.moved,Math.hypot(e.clientX-drag.x,e.clientY-drag.y));if(drag.moved>8){drag.ty=clamp((e.clientX-drag.x)/w*-1.2,-0.5,0.5);drag.tp=clamp((e.clientY-drag.y)/w*1.0,-0.2,0.3);}});
vp.addEventListener('pointerup',e=>{if(!drag.on)return;drag.on=false;if(drag.moved>8)return;
  const r=vp.getBoundingClientRect();ndc.set((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height)*2+1);ray.setFromCamera(ndc,camera);
  const hits=ray.intersectObjects(PICK,false);for(const h of hits){const uv=h.uv,tx=h.object.material.map,img=tx.image;const px=Math.floor(uv.x*img.width),py=Math.floor((1-uv.y)*img.height);
    try{if(img.getContext('2d').getImageData(px,py,1,1).data[3]<40)continue;}catch(err){}
    const ex=h.object.userData.ex;routeTo(ex.at[0],ex.at[1]);ME.pending=ex;return;}
  const pl=new THREE.Plane(new THREE.Vector3(0,1,0),0),pt=new THREE.Vector3();if(ray.ray.intersectPlane(pl,pt)){routeTo(clamp(pt.x,AREA.x0+0.5,AREA.x1-0.5),clamp(pt.z,-4.4,4.5));ME.pending=null;}});
vp.addEventListener('pointercancel',()=>{drag.on=false;});

/* ---------- frame ---------- */
const v3=new THREE.Vector3();let last=performance.now(),TM=0,hintT=0;const camPos=new THREE.Vector3(-6.8,4.8,13.2),camLook=new THREE.Vector3(-6.8,2.3,0.7);
function step(dt){
  TM+=dt;
  let ix=0,iz=0;
  // in the opening you can't steer, but you still walk where the scene sends you (ME.target)
  if(!busy()||(CUT.on&&!DLG.open&&!FADE.on)){if(!CUT.on){ix=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0);iz=(keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0);}
    if(!ix&&!iz&&ME.target.length){const[tx,tz]=ME.target[0];const dx=tx-ME.x,dz=tz-ME.z,d=Math.hypot(dx,dz);
      if(d<0.12){ME.target.shift();if(!ME.target.length&&ME.pending){const p=ME.pending;ME.pending=null;interact(p);}}else{ix=dx/d;iz=dz/d;}}}
  const len=Math.hypot(ix,iz);let moved=0;
  if(len>0){ix/=len;iz/=len;const sp=3.1*dt;const ox=ME.x,oz=ME.z;
    if(!blocked(ME.x+ix*sp,ME.z))ME.x+=ix*sp;if(!blocked(ME.x,ME.z+iz*sp))ME.z+=iz*sp;moved=Math.hypot(ME.x-ox,ME.z-oz);ME.dist+=moved;
    if(ME.target.length){if(moved<sp*0.25){ME.stuck+=dt;if(ME.stuck>0.35){const p=ME.pending;ME.target=[];ME.pending=null;if(p&&Math.hypot(p.at[0]-ME.x,p.at[1]-ME.z)<2.4)interact(p);}}else ME.stuck=0;}
    if(!ME.flip&&moved>sp*0.35){const want=wantView(ME.x-ox,ME.z-oz);if(want.mode!==ME.view.mode||want.facing!==ME.view.facing)ME.flip={from:ME.view,to:want,u:0};}}
  const stride=Math.floor(ME.dist/0.55);
  if(moved && stride!==Math.floor((ME.dist-moved)/0.55) && !ME.sink && !CUT.hideMe){
    const floor=['street','basement','square'].includes(AREA.id)?'stone':'wood';
    MuseumAudio.play(floor+'_'+(stride%2*2+(Math.random()<0.5?0:1)),0.20,0.92+Math.random()*0.1);// left foot 0|1, right 2|3
  }
  ME.amp=lerp(ME.amp,moved>0.0005?1:0,1-Math.exp(-12*dt));
  ME.idle=moved>0.0005?0:(ME.idle||0)+dt;if(ME.idle>2.6&&!cardOpen&&!CUT.lockView)faceFront();
  if(ME.flip){ME.flip.u+=dt/0.18;if(ME.flip.u>=1){ME.view=ME.flip.to;ME.flip=null;}}
  // nearest exhibit
  near=null;let best=2.0;for(const e of EXHIBITS.concat(THINGS)){if(e.area!==AREA.id||e.off)continue;const d=Math.hypot(e.at[0]-ME.x,e.at[1]-ME.z);if(d<best){best=d;near=e;}}
}
function pose(){
  const a=ME.amp,ph=ME.dist/0.55*Math.PI,sw=Math.sin(ph)*a;
  const s={y:0,sy:1+0.012*Math.sin(TM*2.4),lean:0,legN:0,legF:0,liftN:0,liftF:0,n1:0.05,n2:0.06,f1:-0.06,f2:0.32,head:Math.sin(TM*0.7)*0.025*(1-a),scarf:Math.sin(TM*3.1)*0.06,waddle:0,fsN:1,fsF:1};
  let mode=ME.view.mode,rot=base(ME.view);
  if(ME.flip){const u=ME.flip.u;mode=u<0.5?ME.flip.from.mode:ME.flip.to.mode;rot=u<0.5?base(ME.flip.from)+u*Math.PI:base(ME.flip.to)+(u-1)*Math.PI;}
  if(mode!==RIG.mode)setBodyMode(mode);
  if(mode==='side'){
    s.legN=0.45*sw;s.legF=-s.legN;s.y+=0.06*a*(1-Math.abs(Math.sin(ph)));s.lean=0.04*a+Math.sin(ph*2)*0.02*a;s.scarf+=0.12*sw-0.18*a;
    // the case arm stays long and heavy; the free arm swings from the shoulder and bends more on the forward swing
    s.n1=0.05-0.07*sw;s.n2=0.05+0.03*a;s.f1=lerp(-0.06,0,a)+0.45*sw;s.f2=lerp(0.32,0.16,a)+0.42*Math.max(0,Math.sin(ph))*a;
  }else{
    s.liftN=Math.max(0,Math.sin(ph))*0.12*a;s.liftF=Math.max(0,-Math.sin(ph))*0.12*a;s.waddle=Math.sin(ph)*0.035*a;s.y+=0.04*a*Math.abs(Math.cos(ph));
    // seen from the front or back, a swinging arm shows as a slight sway and a shortening as it comes toward us
    s.n1=0.06+0.03*sw;s.f1=0.08-0.04*sw;s.n2=0.04;s.f2=0.14+0.08*Math.abs(sw);s.fsN=1-0.06*Math.max(0,-sw);s.fsF=1-0.12*Math.max(0,sw);
  }
  // seated on the train, the whole figure sinks behind the seat end (ME.sink) and rocks with the coach
  RIG.root.position.set(ME.x,s.y-(ME.sink||0),ME.z);RIG.root.rotation.y=rot;RIG.root.rotation.z=s.waddle+(CUT.train?Math.sin(TM*1.7)*0.012:0);
  RIG.root.visible=!CUT.hideMe&&!TITLE.on;RIG.shadow.visible=!CUT.hideMe&&!ME.sink&&!TITLE.on;
  RIG.body.scale.set(0.82/Math.sqrt(s.sy),0.82*s.sy,0.82);RIG.torso.rotation.z=-s.lean;
  if(RIG.mode==='side'){RIG.legN.rotation.z=s.legN;RIG.legF.rotation.z=s.legF;RIG.legN.position.y=0;RIG.legF.position.y=0;}else{RIG.legN.rotation.z=0;RIG.legF.rotation.z=0;RIG.legN.position.y=s.liftN;RIG.legF.position.y=s.liftF;}
  const o=RIG.out,side=RIG.mode==='side';
  RIG.armN.rotation.z=side?s.n1:o.N*s.n1;RIG.armN.el.rotation.z=side?s.n2:-o.N*s.n2;RIG.armN.scale.y=s.fsN;
  RIG.armF.rotation.z=side?s.f1:o.F*s.f1;RIG.armF.el.rotation.z=side?s.f2:-o.F*s.f2;RIG.armF.scale.y=s.fsF;
  RIG.neck.rotation.z=s.head+s.lean*0.6;RIG.neck.rotation.y=0;
  RIG.hat.position.set(RIG.hatBaseX,0.855,0.004);RIG.scarf.rotation.z=RIG.scarfBase+s.scarf;
  RIG.caseH.rotation.z=s.lean-RIG.armN.rotation.z-RIG.armN.el.rotation.z+Math.sin(TM*2.1)*0.03;
  for(const p of RIG.parts)p.mat.color.setScalar(RIG.far.includes(p)?RIG.farTint:1);
  RIG.shadow.position.set(ME.x+0.05,0.015,ME.z+0.05);
}
function world(){
  // the attendant writes until the Archivist comes close, then looks up and follows them with her eyes
  const ax=ME.x+5,dP=Math.hypot(ax,ME.z+2.2),lk=W.attLook=lerp(W.attLook||0,dP<4.5?1:0,0.06),wr=1-lk;
  W.attArm.rotation.z=wr*(Math.sin(TM*9)*0.06+Math.sin(TM*23)*0.025)+lk*0.08;W.attArm.position.x=(200-130)/190+wr*Math.sin(TM*1.3)*0.012;
  W.attHead.rotation.z=wr*0.07-lk*clamp(ax*0.025,-0.07,0.07);W.attHead.position.y=(260-62)/190+lk*0.018;
  W.attEyes.position.x=lk*clamp(ax*0.012,-0.03,0.03);W.attEyes.position.y=(205-116)/190-wr*0.014;W.attEyes.scale.y=(TM%3.7)<0.13?0.15:1;
  // Mr. Harrow gestures with the letter while he talks, and watches the Archivist
  {const tk=DLG.open&&DLG.who==='harrow'?1:0;W.harTalk=lerp(W.harTalk||0,tk,0.08);const hx=ME.x-W.har.position.x;
  W.harArm.rotation.z=0.06+0.02*Math.sin(TM*1.1)+W.harTalk*(0.32+0.16*Math.sin(TM*2.6));W.harHead.rotation.z=0.02*Math.sin(TM*0.8)+W.harTalk*0.035*Math.sin(TM*3.3);
  W.harEyes.position.x=clamp(hx*0.01,-0.02,0.02);W.harEyes.scale.y=((TM+1.3)%4.1)<0.13?0.15:1;}
  for(const g of W.gas)g.mat.opacity=(0.55+0.06*Math.sin(TM*9+g.position.x)*Math.sin(TM*3.7))*(g.dayK??1);
  // the townspeople breathe and sway; whoever is talking gestures (Gage waves his pills about)
  for(const p of [W.gage,W.hanlon,...W.folk]){if(!p.g.visible)continue;const tk=DLG.open&&DLG.who===p.id?1:0;p.talk=lerp(p.talk,tk,0.08);
    p.head.rotation.z=0.03*Math.sin(TM*0.8+p.seed)+p.talk*0.04*Math.sin(TM*3.1);p.g.position.y=0.008*Math.sin(TM*1.6+p.seed);
    if(p.arm)p.arm.rotation.z=0.08+0.03*Math.sin(TM*1.2+p.seed)+p.talk*(0.36+0.18*Math.sin(TM*2.8));}
  {const g=W.gage;if(g.walk){const x=g.g.position.x+g.walk.v*(1/60);g.g.position.x=x;g.shadow.position.x=x+0.05;g.g.position.y=0.04*Math.abs(Math.sin(TM*6));if(x>=g.walk.to){g.walk=null;g.g.visible=false;g.shadow.visible=false;}}}
  cardsTick(1/60);
  W.lampGlow.mat.opacity=0.7+0.1*Math.sin(TM*11)*Math.sin(TM*4.1);W.pend.rotation.z=Math.sin(TM*Math.PI)*0.12;
  W.moths.forEach((m,i)=>{m.quaternion.copy(camera.quaternion);const flap=0.25+0.75*Math.abs(Math.sin(TM*26+i*1.7));
    if(i<4){const a=TM*(0.9+i*0.25)+i*1.6;m.position.set(18.1+Math.cos(a)*(0.9+i*0.15),3.2+Math.sin(a*1.6)*1.1,-3.6+Math.sin(a)*0.5);}
    else{const cx=i===4?-6.3:5.5,a=TM*(1.4+i*0.2)+i;m.position.set(cx+Math.cos(a)*0.6,4.7+Math.sin(a*1.7)*0.25,-4.4+Math.sin(a)*0.3);}
    m.scale.set(flap,1,1);});
  const pa=W.motePts.geometry.attributes.position;for(let i=0;i<W.motes.N;i++){const[x,y,z,ph,sp]=W.motes.seed[i];pa.array[i*3]=x+Math.sin(TM*0.3*sp+ph)*0.5;pa.array[i*3+1]=(y+TM*0.08*sp)%6.5;pa.array[i*3+2]=z+Math.cos(TM*0.25*sp+ph)*0.4;}pa.needsUpdate=true;
}
function placeCamera(dt){
  const cx=camX(ME.x),cv_=CAMV();const tp=new THREE.Vector3(cx,cv_.h,ME.z+cv_.back),tl=new THREE.Vector3(cx,cv_.look,ME.z-cv_.ahead);
  if(CUT.cam){tp.set(...CUT.cam.pos);tl.set(...CUT.cam.look);}// the opening can take the camera (a slow glide)
  const k=1-Math.exp(-(CUT.cam?(CUT.cam.k??1.1):4)*dt);camPos.lerp(tp,k);camLook.lerp(tl,k);
  drag.yaw+=(drag.ty-drag.yaw)*0.12;drag.pitch+=(drag.tp-drag.pitch)*0.12;if(!drag.on){drag.ty*=0.93;drag.tp*=0.93;}
  const dx=camPos.x-camLook.x,dz=camPos.z-camLook.z,c=Math.cos(drag.yaw),s=Math.sin(drag.yaw);
  camera.position.set(camLook.x+dx*c-dz*s,camPos.y+drag.pitch*Math.hypot(dx,dz)+(CUT.train?Math.sin(TM*8.3)*0.01+Math.sin(TM*1.7)*0.02:0),camLook.z+dx*s+dz*c);camera.lookAt(camLook);
}
function hud(){
  ui.room.textContent=roomAt(ME.x).name;ui.obj.hidden=DLG.open||!!document.body.dataset.overlay;
  questMarker();
  if(near&&!busy()){const e=near;v3.set(e.at[0],e.labelY,Math.min(e.at[1],-0.5)+ (e.at[1]>-0.5?e.at[1]+0.5:0));v3.set(e.at[0],e.labelY,e.at[1]-0.8);v3.project(camera);
    const x=(v3.x*0.5+0.5)*vp.clientWidth,y=(-v3.y*0.5+0.5)*vp.clientHeight;ui.prompt.hidden=false;ui.prompt.style.left=clamp(x,90,vp.clientWidth-90)+'px';ui.prompt.style.top=clamp(y,40,vp.clientHeight-10)+'px';
    const touch=matchMedia('(pointer: coarse)').matches;const html=(touch?'Tap: ':'<kbd>E</kbd>')+(e.verb?esc(e.verb):e.talk?'Talk to the attendant':esc(e.name));if(ui.prompt.dataset.h!==html){ui.prompt.innerHTML=html;ui.prompt.dataset.h=html;}}
  else ui.prompt.hidden=true;
}
function audioScene(){
  if(TITLE.on&&!titleScreen.hidden&&!pauseMenu.open)return 'street';
  if(paused())return '';
  if(document.body.dataset.overlay==='desk')return 'desk';
  if((CUT.train||CUT.line) && !CUT.skip)return 'train';
  if(AREA.id==='square')return 'street';
  if(AREA.id==='lodgings')return 'office';
  if(AREA.id==='museum')return roomAt(ME.x).score;
  return AREA.id==='basement'?'stacks':AREA.id;
}
function frame(now){const dt=Math.min(0.05,(now-last)/1000);last=now;
  MuseumAudio.scene(audioScene());
  if(paused()){if(TITLE.on&&!titleScreen.hidden){titleTick(dt);world();renderer.render(scene,camera);}requestAnimationFrame(frame);return;}step(dt);if(CUT.on)cutTick(dt);pose();world();placeCamera(dt);if(document.body.dataset.overlay!=='desk')renderer.render(scene,camera);hud();
  if(ME.dist>3&&!hintT){hintT=1;document.getElementById('keyhint').style.opacity='0';}requestAnimationFrame(frame);}
function resize(){const w=vp.clientWidth,h=vp.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
  if(paused())renderer.render(scene,camera);} /* setSize clears the canvas, and frame() draws nothing while a menu is up */
new ResizeObserver(()=>{resize();if(!titleScreen.hidden)titleScreen.pointHand?.();}).observe(vp);
/* ================= THE TITLE SCREEN =================
   While the title is up, Union Street at night plays behind it: the camera drifts along the street and up the front of
   No. 72, a cab goes by now and then, a woman walks past under her umbrella, fog drifts in from the harbour, and
   Halley's comet hangs over the rooftops (it was in the evening sky over North America in late May 1910). The street
   is borrowed: your place in the game is saved when the title opens and put back when you start playing. */
const TITLE={on:false,t:0,saved:null,cabAt:6,walkAt:2,loop:46};
// the camera's path: [time (s), position, look at]. The menu is on the left, so the subject sits right of centre.
const TITLE_SHOTS=[[0,[173,2.7,10.5],[178,2.5,-3]],[12,[184,3.1,9.8],[189,3.0,-4]],[23,[199,3.4,12.4],[197,8.8,-5]],[34,[206,7.4,19.5],[198,5.6,-4]],[46,[211,8.2,21.5],[203,5.4,-4]]];
function titleCam(t){const S=TITLE_SHOTS;let i=0;while(i<S.length-2&&t>S[i+1][0])i++;const a=S[i],b=S[i+1],u=clamp((t-a[0])/(b[0]-a[0])),e=u*u*(3-2*u);
  return{pos:a[1].map((v,k)=>lerp(v,b[1][k],e)),look:a[2].map((v,k)=>lerp(v,b[2][k],e))};}
function drawComet(ctx,W,H){// 900 x 300, additive: a bright head (right) and a long soft tail fanning away to the left
  const hx=W*0.88,hy=H*0.32;
  // a broad faint veil first, then the bright streaks
  const veil=ctx.createLinearGradient(hx,hy,hx-W*0.8,hy+H*0.3);veil.addColorStop(0,'rgba(210,222,255,0.35)');veil.addColorStop(1,'rgba(180,200,240,0)');
  ctx.fillStyle=veil;ctx.beginPath();ctx.moveTo(hx,hy-4);ctx.quadraticCurveTo(hx-W*0.4,hy-26,hx-W*0.86,hy-30);ctx.lineTo(hx-W*0.86,hy+H*0.62);ctx.quadraticCurveTo(hx-W*0.4,hy+60,hx,hy+6);ctx.fill();
  for(let i=0;i<110;i++){const a=rr(-0.08,0.24),len=rr(0.45,1)*W*0.86,w=rr(1.5,6),ex=hx-len*Math.cos(a),ey=hy+len*Math.sin(a);
    const g=ctx.createLinearGradient(hx,hy,ex,ey);g.addColorStop(0,`rgba(230,236,255,${rr(0.25,0.5)})`);g.addColorStop(1,'rgba(170,190,235,0)');
    ctx.strokeStyle=g;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(hx,hy);ctx.quadraticCurveTo(hx-len*0.5,hy+len*Math.sin(a)*0.35,ex,ey);ctx.stroke();}
  const gl=ctx.createRadialGradient(hx,hy,0,hx,hy,46);gl.addColorStop(0,'rgba(255,255,248,1)');gl.addColorStop(0.25,'rgba(232,238,255,0.7)');gl.addColorStop(1,'rgba(200,215,255,0)');ctx.fillStyle=gl;ctx.fillRect(hx-46,hy-46,92,92);}
function buildTitle(){
  TX.comet=T(900,300,drawComet,{border:0,grain:false});
  // the comet hangs over the open lot beside No. 72, in front of the far roofs, where the sky is clear
  const c=S(TX.comet,58,792,96,{add:true,fog:false,opacity:0.9});c.position.set(219,14.5,-24);c.rotation.z=-0.26;c.visible=false;scene.add(c);W.titleComet=c;
  W.titleFog=[];for(let i=0;i<8;i++){const s=haze(S(TX.puff,26,64,64,{opacity:0.16}));s.position.set(rr(164,236),rr(0.6,1.8),rr(-1.5,4));s.scale.setScalar(rr(3,5.5));s.visible=false;scene.add(s);W.titleFog.push({s,v:rr(0.25,0.6)});}}
function enterTitle(){if(TITLE.on)return;TITLE.on=true;TITLE.saved={area:AREA.id,x:ME.x,z:ME.z,view:ME.view};TITLE.t=0;TITLE.cabAt=7;TITLE.walkAt=2.5;
  enterArea('street');document.body.classList.add('at-title');W.titleComet.visible=true;for(const f of W.titleFog)f.s.visible=true;
  const c=titleCam(0);camPos.set(...c.pos);camLook.set(...c.look);applyTime();}
function leaveTitle(){if(!TITLE.on)return;TITLE.on=false;document.body.classList.remove('at-title');ui.fade.classList.remove('on');
  W.titleComet.visible=false;for(const f of W.titleFog)f.s.visible=false;
  if(!CUT.on){const C=W.cabS;C.g.visible=false;C.goal=null;C.leave=false;MuseumAudio.drive('cab_roll',0);}
  W.titleWalker=null;placeCast();const s=TITLE.saved;if(s){enterArea(s.area);ME.x=s.x;ME.z=s.z;ME.view=s.view;ME.flip=null;}snapCamera();applyTime();}
function titleTick(dt){TITLE.t+=dt;const t=TITLE.t%TITLE.loop,c=titleCam(t);camPos.set(...c.pos);camLook.set(...c.look);camera.position.copy(camPos);camera.lookAt(camLook);
  if(!CUT.on){ME.x=camPos.x;// sounds are placed by their distance from you; on the title, from the camera
    // a cab now and then
    const C=W.cabS;if(TITLE.t>TITLE.cabAt&&!C.g.visible){Object.assign(C,{x:150,v:0.8,d:0,goal:null,leave:true});C.g.visible=true;TITLE.cabAt=TITLE.t+31;}
    cabTick(dt);}
  // a passer-by under her umbrella
  const p=W.folk[1];if(!W.titleWalker&&TITLE.t>TITLE.walkAt){W.titleWalker={x:166};p.g.visible=true;p.shadow.visible=true;p.headS.mat.map=p.headTex;}
  if(W.titleWalker){const w=W.titleWalker;w.x+=1.0*dt;p.g.position.set(w.x,0.03*Math.abs(Math.sin(TITLE.t*5.2)),-3.75);p.shadow.position.set(w.x+0.05,0.015,-3.7);
    if(w.x>234){W.titleWalker=null;p.g.visible=false;p.shadow.visible=false;TITLE.walkAt=TITLE.t+18;}}
  // fog along the street
  for(const f of W.titleFog){f.s.position.x+=f.v*dt;if(f.s.position.x>238)f.s.position.x=162;f.s.quaternion.copy(camera.quaternion);}
  W.titleComet.mat.opacity=0.82+0.08*Math.sin(TITLE.t*0.7);
  // the loop starts again behind a quick fade
  ui.fade.classList.toggle('on',TITLE.t>1&&(t>TITLE.loop-0.5||t<0.25));}
/* the menus: the arrow keys move through the buttons; the pointing hand follows; a soft click on each move */
function menuButtons(root){return[...root.querySelectorAll('.menu:not([hidden]) button')].filter(b=>b.offsetParent&&!b.closest('[hidden]'));}
function setupMenuHands(){
  const hands=[[titleScreen,window.HAND.make(titleScreen,'menu',58),52],[pauseMenu,window.HAND.make(pauseMenu,'menu',44),34]];
  for(const[root,hand,dx] of hands){
    // (the hand is position: fixed, and neither the title nor the dialog is transformed, so screen coordinates work)
    const point=b=>{if(!b||!b.closest('.menu')||!b.getClientRects().length)return hand.hide();const r=b.getBoundingClientRect();hand.at(r.left+dx,r.top+Math.min(r.height/2,21),'right');};
    root.pointHand=()=>point(document.activeElement);
    root.addEventListener('focusin',e=>{point(e.target.closest('.menu button'));MuseumAudio.play('wood_1',0.14,1.35);});
    root.addEventListener('pointerover',e=>{const b=e.target.closest('.menu button');if(b&&document.activeElement!==b){b.focus({preventScroll:true});point(b);}});
    root.addEventListener('keydown',e=>{if(e.key!=='ArrowDown'&&e.key!=='ArrowUp')return;const bs=menuButtons(root);if(!bs.length)return;e.preventDefault();
      const i=bs.indexOf(document.activeElement),n=e.key==='ArrowDown'?(i+1)%bs.length:(i-1+bs.length)%bs.length;bs[i<0?0:n].focus();point(bs[i<0?0:n]);});}}
/* ---------- start menu and pause menu ----------
   New game on the start menu is the only way to begin again; the pause menu never erases anything.
   A new game over an old one clears the save and reloads, then skips the start menu once (BEGIN_KEY). */
const BEGIN_KEY='archivist:begin';let playedThisVisit=false;
const objText=()=>{const st=STAGE();return typeof st.obj==='function'?st.obj(AREA.id):st.obj||'';};
const hasSave=()=>{try{return localStorage.getItem(SAVE_KEY)!==null;}catch(e){return false;}};
const menuBtn=()=>document.getElementById('menubtn');
function haltPlayer(){stopWalking();drag.on=false;}
function showTitle(){
  document.getElementById('newgame').textContent='New game';
  haltPlayer();if(pauseMenu.open)pauseMenu.close();
  const can=playedThisVisit||hasSave(),cont=document.getElementById('continue');
  cont.hidden=!can;document.getElementById('newgame').classList.toggle('big',!can);document.getElementById('continue-where').textContent=can&&objText()?'To do: '+objText():'';
  document.getElementById('titlemenu').hidden=false;document.getElementById('titleconfirm').hidden=true;document.getElementById('credits').hidden=true;titleScreen.classList.remove('reading');
  menuBtn().hidden=true;enterTitle();titleScreen.hidden=false;(can?cont:document.getElementById('newgame')).focus();titleScreen.pointHand?.();}
function startPlay(){leaveTitle();titleScreen.hidden=true;menuBtn().hidden=false;playedThisVisit=true;last=performance.now();vp.focus({preventScroll:true});
  if(G.stage==='arrive'&&!G.opening&&!CUT.on)runOpening();}// a new game opens on the train
function openPause(){
  if(paused()||document.body.dataset.overlay)return;haltPlayer();
  const t=objText();document.getElementById('pause-obj').innerHTML=t?'<b>To do</b>'+esc(t):'';
  pauseMenu.showModal();document.getElementById('resume').focus();pauseMenu.pointHand?.();}
function setupMenus(){
  const $=id=>document.getElementById(id);
  $('continue').onclick=startPlay;
  $('newgame').onclick=()=>{
    if(!playedThisVisit&&!hasSave())return startPlay();
    $('titlemenu').hidden=true;$('titleconfirm').hidden=false;$('newgame-no').focus();};
  $('newgame-no').onclick=()=>{$('titleconfirm').hidden=true;$('titlemenu').hidden=false;$('newgame').focus();};
  $('newgame-yes').onclick=()=>{try{localStorage.removeItem(SAVE_KEY);sessionStorage.setItem(BEGIN_KEY,'1');}catch(e){}location.reload();};
  menuBtn().onclick=openPause;$('skipbtn').onclick=e=>{e.stopPropagation();skipOpening();};
  $('to-title').onclick=showTitle;
  const opts=$('options');let optFrom=null;
  const openOptions=e=>{optFrom=e.currentTarget;opts.showModal();opts.querySelector('input')?.focus();};
  $('title-options').onclick=openOptions;$('pause-options').onclick=openOptions;
  opts.addEventListener('close',()=>{optFrom?.focus();(pauseMenu.open?pauseMenu:titleScreen).pointHand?.();});
  $('title-credits').onclick=()=>{$('titlemenu').hidden=true;$('credits').hidden=false;titleScreen.classList.add('reading');$('credits-back').focus();titleScreen.pointHand?.();};
  $('credits-back').onclick=()=>{$('credits').hidden=true;$('titlemenu').hidden=false;titleScreen.classList.remove('reading');$('title-credits').focus();titleScreen.pointHand?.();};
  titleScreen.addEventListener('keydown',e=>{if(e.key!=='Escape')return;if(!$('credits').hidden)$('credits-back').click();else if(!$('titleconfirm').hidden)$('newgame-no').click();});
  setupMenuHands();
  pauseMenu.addEventListener('close',()=>{last=performance.now();if(titleScreen.hidden)vp.focus({preventScroll:true});});}
async function boot(){
  try{await Promise.race([Promise.all(['40px "IM Fell English SC"','40px "IM Fell English"','20px "Special Elite"'].map(f=>document.fonts.load(f))),new Promise(r=>setTimeout(r,2500))]);}catch(e){}
  build();for(const e of TEXS){compose(e);e.t.needsUpdate=true;}renderCat();resize();placeHarrow();placeCast();renderObj();
  window.addEventListener('activities-ready',renderObj);
  ui.prompt.addEventListener('click',()=>interact(near));ui.dlg.addEventListener('click',e=>{if(!e.target.closest('button,.dlg-cardslot'))dlgNext();});ui.dlgBack.onclick=e=>{e.stopPropagation();dlgBack();};ui.dlgNextBtn.onclick=e=>{e.stopPropagation();dlgNext();};
  ui.marker=window.HAND.make(vp,'quest',130);
  setupMenus();
  document.getElementById('loading').hidden=true;
  if(G.stage==='arrive'){enterArea('street');ME.x=183.5;ME.z=-3.4;ME.view={mode:'side',facing:1};}// a new game starts outside
  const START={home1:['street',F72_DOOR,-3.2],hanlon1:['lodgings',405,2.6],sleep:['lodgings',405,2.6],breakfast:['lodgings',414.4,-1.4],comet:['square',317.6,2.2]};
  if(START[G.stage]){const[a,x,z]=START[G.stage];enterArea(a);ME.x=x;ME.z=z;ME.view={mode:'front',facing:1};}
  applyTime();
  snapCamera();pose();world();placeCamera(1);renderer.render(scene,camera);
  showTitle();
  if(sessionStorage.getItem(BEGIN_KEY)){
    sessionStorage.removeItem(BEGIN_KEY);
    // The reload cleared browser audio activation. Board from a gesture in this document.
    const board=document.getElementById('newgame');
    board.textContent='Board the train';board.focus();
  }
  window.museum={tick:(n=60,dt=1/60)=>{for(let i=0;i<n;i++){step(dt);if(CUT.on)cutTick(dt);pose();}return[ME.x,ME.z];},opening:runOpening,skip:skipOpening,cut:CUT,cab:()=>W.cabS,train:()=>W.trainOut,cast:()=>({gage:W.gage,hanlon:W.hanlon,folk:W.folk}),title:TITLE,fx:()=>({fog:W.titleFog,smoke:W.trainOut.puffs,cab:W.cabS}),// (test hook: the title's fog, the train's smoke, the cab)
    night:()=>isNight(),keys,go:(x,z,area)=>{if(area)enterArea(area);ME.x=x;ME.z=z;snapCamera();},area:()=>AREA.id,say:l=>say(l),stage:st=>{if(st)setStage(st);return G.stage;},game:()=>G,open:id=>interact(EXHIBITS.concat(THINGS).find(e=>e.id===id)),close:closeCard,walk:routeTo,me:ME,
    frame:(w=960,h=540,cam)=>{renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();pose();world();placeCamera(1);if(cam){camera.position.set(cam[0],cam[1],cam[2]);camera.lookAt(cam[3],cam[4],cam[5]);}renderer.render(scene,camera);const d=canvas.toDataURL('image/jpeg',0.85);resize();return d;}};
  requestAnimationFrame(frame);
}
boot();
})();
