// The playground: frames on an isometric street grid, with street lamps (ported from the prototype)
import { initDuskLight } from './dusk-light.js';
initDuskLight();

// ---------------- data (placeholder frames — swap for real ones) ----------------
const TAGS = ['Interaction','Illustration','Branding','UI','Motion','Data Viz'];
const ALL = Array.from({length:36}, (_,i)=>{
  const r = n => (Math.sin((i+1)*99.13 + n*17.7)*43758.5453) % 1;
  const a = Math.floor(Math.abs(r(1))*TAGS.length);
  const b = Math.floor(Math.abs(r(2))*TAGS.length);
  const tags = a === b ? [TAGS[a]] : [TAGS[a], TAGS[b]];
  return { id:i, title:`Frame ${String(i+1).padStart(3,'0')}`, year: 2016 + (i % 10), tags };
});

function art(item){
  const s = item.id * 7.31, t = item.tags[0];
  const L = (d, c='#1b1b1b', w=.9) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" vector-effect="non-scaling-stroke"/>`;
  let g = '';
  if (t==='Illustration'){ for(let k=0;k<5;k++){const r=8+k*7, x=50+Math.sin(s+k)*8, y=46+Math.cos(s+k)*6; g+=L(`M${x+r} ${y}A${r} ${r} 0 1 1 ${x+r-.01} ${y}`, k%2?'#a9a69e':'#1b1b1b');} }
  if (t==='Interaction'){ g+=L('M24 36h52v18H24z'); g+=L('M58 50l8 18 3-7 7-2z','#ff4d1a'); g+=L('M30 45h20','#a9a69e'); }
  if (t==='Branding'){ g+=L('M34 66V30h18a10 10 0 0 1 0 20H34'); g+=L('M52 50l14 16'); g+=L('M28 74h44','#a9a69e'); }
  if (t==='UI'){ g+=L('M22 22h56v52H22z'); g+=L('M22 32h56','#a9a69e'); g+=L('M28 40h20v26H28z'); g+=L('M54 40h18M54 46h14M54 52h18','#a9a69e'); }
  if (t==='Motion'){ for(let k=0;k<4;k++){let d='M18 '+(36+k*8); for(let x=18;x<=82;x+=4) d+=`L${x} ${(36+k*8+Math.sin(x/7+s+k)*4).toFixed(1)}`; g+=L(d, k===1?'#ff4d1a':k%2?'#a9a69e':'#1b1b1b');} }
  if (t==='Data Viz'){ g+=L('M20 74h60M20 74V24','#a9a69e'); for(let k=0;k<6;k++){const h=10+Math.abs(Math.sin(s+k*1.7))*38; g+=L(`M${27+k*9} 74V${74-h}`, k===3?'#ff4d1a':'#1b1b1b',1.6);} }
  return `<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">${g}</svg>`;
}


// ---------------- street lamp kit — hairline iso lamps in several styles ----------------

const isDusk = () => document.documentElement.dataset.theme === 'dusk';
const homeStyle = () => { try { const st = sessionStorage.getItem('sl-lamp') || 'cobra'; return ['classic','mushroom','cobra','double','post','globe'].includes(st) ? st : null; } catch(e){ return null; } };
// LampKit.get(style, dir) → {svg, minX, minY, w, h}; dir 0..3 = arm along one of the 4 street directions.
const LampKit = (function(){
  const C = Math.cos(Math.PI/6), S = .5;
  const Pj = (x,y,z)=>[(x - z)*C, (x + z)*S - y];
  const DIRS = [[1,0],[0,1],[-1,0],[0,-1]];
  const STYLES = ['classic','mushroom','cobra','double','post','globe','ornate'];
  const cache = {};

  function make(style, dirIdx){
    const dd = DIRS[dirIdx], pp = [-dd[1], dd[0]], nd = [-dd[0], -dd[1]];
    let out = [], minX=1e9,minY=1e9,maxX=-1e9,maxY=-1e9;
    const grow = q => { minX=Math.min(minX,q[0]);maxX=Math.max(maxX,q[0]);minY=Math.min(minY,q[1]);maxY=Math.max(maxY,q[1]); return q; };
    const fmt = q => q[0].toFixed(2)+' '+q[1].toFixed(2);
    const d = (a, close=true) => 'M' + a.map(p=>fmt(grow(Pj(...p)))).join('L') + (close?'Z':'');
    const path = (a, cls, close=true) => out.push(`<path class="${cls}" d="${d(a,close)}"/>`);
    const pathS = (a, cls, close=true) => out.push(`<path class="${cls}" d="M${a.map(q=>fmt(grow(q))).join('L')}${close?'Z':''}"/>`);
    const line = (a, cls='edge') => path(a, cls, false);
    const along = (s, y, v=dd, o=[0,0]) => [o[0] + v[0]*s, y, o[1] + v[1]*s];
    const box = (x0,x1,y0,y1,z0,z1)=>{
      path([[x1,y0,z0],[x1,y1,z0],[x1,y1,z1],[x1,y0,z1]], 'f edge');
      path([[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]], 'f edge');
      path([[x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1]], 'f hi');
    };
    const sq = (h, y0, y1, cx=0, cz=0) => box(cx-h, cx+h, y0, y1, cz-h, cz+h);
    const ring = (cx,cz,r,y,a0,a1,n=28)=>{ const a=[]; for(let k=0;k<=n;k++){const t=(a0+(a1-a0)*k/n)*Math.PI/180; a.push([cx+r*Math.cos(t),y,cz+r*Math.sin(t)]);} return a; };
    // vertical frustum (cylinder when r0 == r1): silhouette, visible top ring, front of bottom ring
    const frustum = (cx,cz,r0,y0,r1,y1,topCls='mid')=>{
      path(ring(cx,cz,r0,y0,-45,135).concat(ring(cx,cz,r1,y1,135,315)), 'f edge');
      path(ring(cx,cz,r1,y1,0,360,36), topCls);
      path(ring(cx,cz,r0,y0,-45,135), 'mid', false);
    };
    const cyl = (cx,cz,r,y0,y1,topCls) => frustum(cx,cz,r,y0,r,y1,topCls);
    // straight tube between two world points (screen-space outline)
    const tube = (p0, p1, r, cls='f edge') => {
      const a = Pj(...p0), b = Pj(...p1), dx = b[0]-a[0], dy = b[1]-a[1], L = Math.hypot(dx,dy) || 1, nx = -dy/L*r, ny = dx/L*r;
      pathS([[a[0]+nx,a[1]+ny],[b[0]+nx,b[1]+ny],[b[0]-nx,b[1]-ny],[a[0]-nx,a[1]-ny]], cls);
    };
    // shallow dome: rim ring at y0, height h
    const dome = (cx,cz,R,y0,h) => {
      const c = Pj(cx,y0,cz), rx = R*1.2247, ryRim = R*.7071, ry = Math.sqrt(h*h + ryRim*ryRim), pts = [];
      for (let k=0;k<=24;k++){ const t = Math.PI*k/24; pts.push([c[0]-rx*Math.cos(t), c[1]-ry*Math.sin(t)]); }
      for (let k=0;k<=24;k++){ const t = Math.PI*k/24; pts.push([c[0]+rx*Math.cos(t), c[1]+ryRim*Math.sin(t)]); }
      pathS(pts, 'f edge');
      path(ring(cx,cz,R,y0,-45,135,24), 'hi', false);
      const top = Pj(cx,y0+h,cz); pathS([[top[0]-1.5,top[1]],[top[0]+1.5,top[1]]], 'mid', false);
    };
    const sphere = (cx,cy,cz,R) => {
      const c = grow(Pj(cx,cy,cz)); grow([c[0]-R*1.2,c[1]-R*1.2]); grow([c[0]+R*1.2,c[1]+R*1.2]);
      out.push(`<circle class="f edge" cx="${c[0].toFixed(2)}" cy="${c[1].toFixed(2)}" r="${(R*1.15).toFixed(2)}"/>`);
      out.push(`<path class="lo" d="M${fmt([c[0]-R*.75,c[1]-R*.1])}A${R*.8} ${R*.8} 0 0 1 ${fmt([c[0]-R*.1,c[1]-R*.8])}"/>`);
    };
    const curve = (fn, n=24) => { const a=[]; for(let k=0;k<=n;k++) a.push(fn(k/n)); return a; };

    // depth-sorted parts (pole at depth 0; heads by how far toward the viewer they reach)
    const parts = [], lights = [];
    const part = (depth, fn) => parts.push({depth, fn});
    const depthOf = (v, s) => (v[0] + v[1]) * s;
    const light = (p, kind, r, ground, gr) => lights.push({p, kind, r, g: ground, gr});

    // ---- lantern bits shared by classic / post
    const glassLantern = (ox, oz, yB, yT, hB, hT) => {
      const c = (h,y,sx,sz)=>[ox+sx*h,y,oz+sz*h];
      line([c(hT,yT,-1,-1),c(hB,yB,-1,-1)],'lo'); line([c(hT,yT,1,-1),c(hB,yB,1,-1)],'lo'); line([c(hT,yT,-1,1),c(hB,yB,-1,1)],'lo');
      path([c(hB,yB,-1,-1),c(hB,yB,1,-1),c(hB,yB,1,1),c(hB,yB,-1,1)],'lo');
      path([c(hT,yT,1,-1),c(hT,yT,1,1),c(hB,yB,1,1),c(hB,yB,1,-1)],'edge');
      path([c(hT,yT,-1,1),c(hT,yT,1,1),c(hB,yB,1,1),c(hB,yB,-1,1)],'edge');
    };
    const roofPyramid = (ox, oz, y, h, rise) => {
      box(ox-h,ox+h,y,y+1.6,oz-h,oz+h);
      path([[ox+h,y+1.6,oz-h],[ox,y+rise,oz],[ox+h,y+1.6,oz+h]],'f edge');
      path([[ox-h,y+1.6,oz+h],[ox,y+rise,oz],[ox+h,y+1.6,oz+h]],'f edge');
    };

    if (style === 'classic'){
      const LX = 30, [ox,,oz] = along(LX,0);
      part(0, ()=>{ sq(10,0,4); sq(6.5,4,22); sq(8,22,25); cyl(0,0,4.2,25,33); cyl(0,0,2.4,33,121,'lo'); cyl(0,0,3.3,70,73); cyl(0,0,3.3,116,121); cyl(0,0,1.4,121,128); });
      part(depthOf(dd,LX), ()=>{
        const arm = off => curve(t=>along(2+t*(LX-2), 114+off+7*Math.sin(Math.PI*t)*(1-t*.4)));
        line(arm(1.2)); line(arm(-.6));
        line(curve(t=>along(2+t*14, 98+18*Math.sin(t*Math.PI/2)), 20), 'mid');
        line([[ox,117,oz],[ox,111,oz]]);
        glassLantern(ox, oz, 91, 106, 3.5, 6.5);
        path([[ox+3.5,91,oz-3.5],[ox,86,oz],[ox+3.5,91,oz+3.5]],'f edge'); path([[ox-3.5,91,oz+3.5],[ox,86,oz],[ox+3.5,91,oz+3.5]],'f edge');
        roofPyramid(ox, oz, 106, 8, 8); cyl(ox,oz,1,114,117);
      });
      light([ox,99,oz], 'dot', 2.8, [ox,oz], 24);
    }

    if (style === 'mushroom'){   // modern: thin mast, flat dome, glowing underside
      part(0, ()=>{ cyl(0,0,3.6,0,3); cyl(0,0,2.7,3,46); frustum(0,0,2.0,46,1.5,152,'lo'); cyl(0,0,1.1,152,158); dome(0,0,15,159,9); });
      light([0,158.6,0], 'disc', 14.5, [0,0], 34);
    }

    if (style === 'cobra'){      // modern highway head on a short arm
      const H = 162, [ox,,oz] = along(28,0);
      part(0, ()=>{ sq(5,0,2); cyl(0,0,2.8,2,14); frustum(0,0,2.3,14,1.6,H,'lo'); cyl(0,0,1.8,H,H+2.5); });
      part(depthOf(dd,20), ()=>{
        line(curve(t=>along(1.5+t*18, H+1.6+t*1.2), 8)); line(curve(t=>along(1.5+t*18, H-.2+t*1.2), 8));
        const s0 = 17, s1 = 36, w = 4.2, xs = [dd[0]*s0 + pp[0]*w, dd[0]*s0 - pp[0]*w, dd[0]*s1 + pp[0]*w, dd[0]*s1 - pp[0]*w],
              zs = [dd[1]*s0 + pp[1]*w, dd[1]*s0 - pp[1]*w, dd[1]*s1 + pp[1]*w, dd[1]*s1 - pp[1]*w];
        box(Math.min(...xs), Math.max(...xs), H-2.5, H+1.5, Math.min(...zs), Math.max(...zs));
      });
      light([ox,H-3,oz], 'dot', 2.4, [ox,oz], 26);
    }

    if (style === 'double'){     // two curved arms with bell shades
      part(0, ()=>{ sq(6,0,3); frustum(0,0,3.2,3,1.9,150,'lo'); cyl(0,0,1.3,150,157); cyl(0,0,2,157,158.5); });
      for (const v of [dd, nd]){
        const [ox,,oz] = along(38,0,v);
        part(depthOf(v,38), ()=>{
          line(curve(t=>along(1.5+t*36, 138+18*t, v), 12)); line(curve(t=>along(1.5+t*36, 136.6+18*t, v), 12));
          line(curve(t=>along(36+3*Math.sin(t*Math.PI/2), 156 - 4*t + 2*Math.sin(t*Math.PI), v), 8));
          line(curve(t=>along(1.5+t*22, 116+34*Math.sin(t*Math.PI/2), v), 16), 'mid');
          frustum(ox,oz,6.5,145,1.3,151); cyl(ox,oz,1.6,151,153.5);
        });
        light([ox,146,oz], 'dot', 2.4, [ox,oz], 20);
      }
    }

    if (style === 'post'){       // short ornate post lantern
      part(0, ()=>{
        sq(10,0,3); sq(8,3,6); frustum(0,0,5,6,3.2,16); cyl(0,0,2.8,16,58,'lo');
        cyl(0,0,3.6,30,33); cyl(0,0,3.6,46,48); cyl(0,0,4,58,62); sq(6,62,64);
        glassLantern(0, 0, 64, 78, 5, 5);
        roofPyramid(0, 0, 78, 7.5, 7); cyl(0,0,.9,85,90); cyl(0,0,1.6,90,91.5);
      });
      light([0,71,0], 'dot', 3, [0,0], 20);
    }

    if (style === 'globe'){      // modern: leaning mast with a sphere
      const top = along(10,121);
      part(0, ()=>{
        cyl(0,0,9,0,2.2,'hi');
        tube([0,2.2,0], along(3,48), 2.2); tube(along(3,48), along(9.2,112), 1.1);
        path(ring(top[0]-dd[0]*.3,top[2]-dd[1]*.3,1.6,112,0,360,12),'mid');
        sphere(top[0], top[1], top[2], 9);
      });
      light(top, 'orb', 9, [top[0],top[2]], 26);
    }

    if (style === 'ornate'){     // tall fluted post, three scrolled arms with urn lanterns
      part(0, ()=>{
        sq(11,0,3); sq(9,3,7); frustum(0,0,7,7,3.4,34); cyl(0,0,4.8,12,14.5); cyl(0,0,4.3,20,22.5);
        cyl(0,0,3.6,34,38); cyl(0,0,2.5,38,118,'lo'); cyl(0,0,3.2,80,83); cyl(0,0,3.4,110,116); frustum(0,0,1.6,116,.25,134);
      });
      for (const v of [dd, nd, pp]){
        const [ox,,oz] = along(24,0,v);
        part(depthOf(v,24), ()=>{
          line(curve(t=>along(2+t*22, 108 - 7*Math.sin(Math.PI*t) + 10*t*t, v), 18));
          line(curve(t=>{ const a = t*Math.PI*1.7; return along(8 + 3.2*Math.cos(a)*(1-t*.5), 104 + 3.2*Math.sin(a)*(1-t*.5), v); }, 22), 'mid');
          frustum(ox,oz,1,113,2.2,116); frustum(ox,oz,2.2,116,6.2,131,'lo');
          cyl(ox,oz,8.4,131,133,'hi'); frustum(ox,oz,6,133,.8,140); cyl(ox,oz,.6,140,145); cyl(ox,oz,1.4,145,146.5);
        });
        light([ox,124,oz], 'dot', 2.6, [ox,oz], 18);
      }
    }

    // pools first (ground), then parts back-to-front, then the light on top
    const head = out; out = [];
    out.push('<g class="pool">');
    for (const L of lights){ path(ring(L.g[0],L.g[1],L.gr,0,0,360,48),'lo'); path(ring(L.g[0],L.g[1],L.gr*.58,0,0,360,40),'lo'); }
    out.push('</g>');
    parts.sort((a,b)=>a.depth-b.depth).forEach(p=>p.fn());
    out.push('<g class="glow">');
    for (const L of lights){
      const c = grow(Pj(...L.p));
      if (L.kind === 'dot')  out.push(`<circle class="bulb" cx="${c[0].toFixed(2)}" cy="${c[1].toFixed(2)}" r="${L.r}"/>`);
      if (L.kind === 'orb')  out.push(`<circle class="orb" cx="${c[0].toFixed(2)}" cy="${c[1].toFixed(2)}" r="${(L.r*1.12).toFixed(2)}"/>`);
      if (L.kind === 'disc') out.push(`<path class="rim" d="${d(ring(L.p[0],L.p[2],L.r,L.p[1],-45,135,24),false)}"/>`);
      const n = L.kind === 'dot' ? 6 : 8;
      for (let k=0;k<n;k++){
        const a = (k/n)*Math.PI*2 + .3, rr = L.kind === 'dot' ? 2.5 : L.r*.8;
        const s = Pj(L.p[0]+Math.cos(a)*rr, L.p[1]-(L.kind==='orb'?L.r*.6:1), L.p[2]+Math.sin(a)*rr);
        const e = Pj(L.g[0]+Math.cos(a)*L.gr*.66, 0, L.g[1]+Math.sin(a)*L.gr*.66);
        out.push(`<line class="ray" x1="${s[0].toFixed(2)}" y1="${s[1].toFixed(2)}" x2="${e[0].toFixed(2)}" y2="${e[1].toFixed(2)}"/>`);
      }
    }
    out.push('</g>');
    void head;
    const pad = 3; minX-=pad; minY-=pad; maxX+=pad; maxY+=pad;
    return { svg: out.join(''), minX, minY, w: maxX-minX, h: maxY-minY };
  }

  return {
    STYLES,
    MODERN: ['mushroom','cobra','globe'],
    ORNATE: ['classic','post','ornate','double'],
    get(style, dir){ const k = style+dir; return cache[k] || (cache[k] = make(style, dir)); }
  };
})();

// ---------------- params ----------------
const DEF = {size:120, gap:26, thick:8, randH:false, hVar:90, hShare:100, hCurve:1, seed:1, hover:1.55, lamps:true, lampStyle:'mix', lampMode:'scatter', lampDensity:1.2, lampMin:1, lampMax:8, lampRot:true, every:2, lampSize:1,
             fall:750, pause:250, move:1000, stagger:350, arc:50};
const KEY = 'iso-archive-params-v3';
let P = {...DEF};
try { Object.assign(P, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch(e){}
const ctl = document.getElementById('ctl');
function syncUI(){
  document.querySelectorAll('input[name=lampMode]').forEach(r=>r.checked = r.value === P.lampMode);
  for (const k in P){ const el = document.getElementById(k); if (!el) continue;
    if (el.type === 'checkbox') el.checked = P[k]; else el.value = P[k];
    const sp = el.parentElement.querySelector('span'); if (sp && el.tagName !== 'SELECT') sp.textContent = P[k]; }
}
ctl.addEventListener('input', e=>{
  const el = e.target;
  if (el.name === 'lampMode'){ P.lampMode = el.value; clearLamps(); return; }
  if (!(el.id in P)) return;
  P[el.id] = el.type === 'checkbox' ? el.checked : el.tagName === 'SELECT' ? el.value : +el.value;
  const sp = el.parentElement.querySelector('span'); if (sp && el.tagName !== 'SELECT') sp.textContent = P[el.id];
  geom();
  if (['lamps','lampStyle','every','lampSize','lampRot','lampDensity','lampMin','lampMax','size','gap'].includes(el.id)) clearLamps();
});
const msg = t => { const m = document.getElementById('msg'); m.textContent = t; setTimeout(()=>m.textContent='', 2000); };
ctl.addEventListener('click', e=>{
  const a = e.target.dataset && e.target.dataset.a; if (!a) return;
  if (a==='shuffle'){ P.seed = (P.seed + 1) % 10000; geom(); clearLamps(); msg('shuffled'); }
  if (a==='save'){ try { localStorage.setItem(KEY, JSON.stringify(P)); msg('saved'); } catch(err){ msg('storage blocked — use copy'); } }
  if (a==='reset'){ P = {...DEF}; try { localStorage.removeItem(KEY); } catch(err){} syncUI(); geom(); clearLamps(); msg('reset'); }
  if (a==='copy'){ const t = JSON.stringify(P); (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(()=>msg('copied'), ()=>prompt('copy:', t)); }
});
syncUI();
// tooltips: '?' icons show a popover to the left of the panel
const pop = document.getElementById('pop');
ctl.addEventListener('pointerover', e=>{
  const q = e.target.closest('.q'); if (!q) return;
  pop.textContent = q.dataset.tip;
  const r = q.getBoundingClientRect(), pr = ctl.getBoundingClientRect();
  pop.style.right = (innerWidth - pr.left + 10) + 'px'; pop.style.top = Math.max(8, r.top - 8) + 'px';
  pop.classList.add('on');
});
ctl.addEventListener('pointerout', e=>{ if (e.target.closest('.q')) pop.classList.remove('on'); });

// ---------------- geometry ----------------
const ISO_X = -35.264, ISO_Y = 45, VY = 0.8165;   // VY: screen px per world px of height
let T, G, A, B, W, H;
const world = document.getElementById('world');
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v)), lerp=(a,b,t)=>a+(b-a)*t;
const ease = t => t<.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2;
const hash = n => { const s = Math.sin(n*127.1 + 311.7)*43758.5453; return s - Math.floor(s); };

function geom(){
  T = P.size; G = T + P.gap; A = Math.SQRT1_2 * G; B = 0.4082 * G;
  W = innerWidth; H = innerHeight;
  document.documentElement.style.setProperty('--T', T+'px');
  for (const t of tiles.values()) setHeight(t);
}
function tileHeight(t){
  if (!P.randH) return P.thick;
  const id = t.item.id, sd = P.seed * 17.31;
  if (hash(id*1.7 + sd) * 100 >= P.hShare) return P.thick;          // this tile stays low
  return P.thick + Math.pow(hash(id*3.3 + sd + 5), P.hCurve) * P.hVar;  // curve > 1 → mostly low, a few towers
}
function setHeight(t){ const h = tileHeight(t); t.h = h; t.el.style.setProperty('--th', h+'px'); t.el.classList.toggle('thin', h < 1); }

// ---------------- layout: finite block, one tile per frame ----------------
let list = ALL.slice(), filter = null;
let layout = null;   // {cols, rows, index: Map(id -> i)}
function makeLayout(items){
  const n = items.length, cols = Math.max(1, Math.ceil(Math.sqrt(n))), rows = Math.ceil(n / cols);
  return { cols, rows, index: new Map(items.map((it, i) => [it.id, i])) };
}
function cellUV(i){ const c = i % layout.cols, r = Math.floor(i / layout.cols);
  return [c - (layout.cols-1)/2, r - (layout.rows-1)/2]; }

let camX = 0, camY = 0, tcamX = 0, tcamY = 0;
function camBounds(){
  let hu = (layout.cols-1)/2, hv = (layout.rows-1)/2;
  const ex = (hu + hv) * A + T, ey = (hu + hv) * B + T + (P.randH ? P.hVar : 0);
  return { x: Math.max(0, ex - W/2 + 80), y: Math.max(0, ey - H/2 + 120) };
}
function clampCam(){ const b = camBounds(); tcamX = clamp(tcamX, -b.x, b.x); tcamY = clamp(tcamY, -b.y, b.y); }
function screenXY(u, v){ return [W/2 + (u - v)*A - camX, H/2 + (u + v)*B - camY]; }

// ---------------- tiles ----------------
const tiles = new Map();   // id -> tile
let phase = null;
function makeTile(item){
  const el = document.createElement('div'); el.className = 't';
  el.innerHTML = `<div class="slab"><div class="side s-t"></div><div class="side s-b"></div><div class="side s-l"></div><div class="side s-r"></div>
    <div class="face"><span class="no">${String(item.id+1).padStart(3,'0')}</span>${art(item)}
    <div class="cap"><b>${item.title}</b><i>${item.tags.join(' · ')}</i></div></div></div>`;
  const slab = el.firstChild, face = slab.querySelector('.face');
  const tile = {el, slab, item, e:0, hover:false, x:0, y:0, state:'in', move:null, appear:null, fall:null};
  face.addEventListener('pointerenter', ()=>{ if(!dragMoved && !phase){ tile.hover = true; showDetail(item);} });
  face.addEventListener('pointerleave', ()=>{ tile.hover = false; showDetail(null); });
  world.appendChild(el);
  setHeight(tile);
  return tile;
}
const detail = document.getElementById('detail');
function showDetail(it){ detail.innerHTML = it ? `<b>${it.title}</b><span>${it.year} · ${it.tags.join(' · ')}</span>` : ''; }

function slabTransform(e, scale){
  const rx = lerp(ISO_X, -90, e), ry = ISO_Y * (1 - e);
  return `translateY(${-30*e}px) scale(${scale}) rotateX(${rx}deg) rotateY(${ry}deg) rotateX(90deg)`;
}

// ---------------- lamps ----------------
const lamps = new Map();
function clearLamps(){ for (const [,l] of lamps){ l.el.remove(); (l.lit || []).forEach(c => c.remove()); } lamps.clear(); lampLayout = null; }
function lampAlpha(now){
  if (!phase) return 1;
  if (now < phase.fillAt) return clamp(1 - (now - phase.t0) / 300);   // fade out while things move
  return clamp((now - phase.fillAt) / 500);
}

// ---------------- render loop ----------------
let px = -1e4, py = -1e4, lampLayout = null, lampSpots = null;
// positions in grid units (u,v) — streets run along u = k+.5 and v = k+.5
function makeLampSpots(){
  const cols = layout.cols, rows = layout.rows, ou = (cols-1)/2, ov = (rows-1)/2, out = [];
  const dirOf = n => P.lampRot ? Math.floor(hash(n) * 4) : 0;
  const hs = homeStyle();   // embedded: every lamp is the one picked on the home page
  const pool = hs ? [hs] : (P.lampStyle === 'mix' ? LampKit.STYLES : P.lampStyle === 'mix-modern' ? LampKit.MODERN : P.lampStyle === 'mix-ornate' ? LampKit.ORNATE : [P.lampStyle]).filter(st => st !== 'ornate' || P.lampStyle === 'ornate');   // ornate is shelved
  const styleOf = n => pool[Math.floor(hash(n*1.91 + P.seed*5.3) * pool.length)];
  if (P.lampMode === 'grid'){
    for (let r = -1; r < rows; r++) for (let c = -1; c < cols; c++){
      if (((r+1) % P.every) || ((c+1) % P.every)) continue;
      out.push({id:'g'+c+':'+r, u: c+.5-ou, v: r+.5-ov, dir: dirOf(c*31 + r*17 + P.seed*7), style: styleOf(c*13 + r*29)});
    }
  } else {
    // lamp count follows how many frames are on show (filtering leaves fewer frames → fewer lamps)
    const K = Math.min(P.lampMax, Math.max(P.lampMin, Math.round(list.length * P.lampDensity / 10)));
    const ln = document.getElementById('lampNow'), fn = document.getElementById('frameNow'); if (ln){ ln.textContent = K; fn.textContent = list.length; }
    for (let i = 0; i < K; i++){
      const rnd = k => hash(i*13.7 + k*71.3 + P.seed*101.9);
      let u, v;
      if (rnd(1) < .5){ u = Math.floor(rnd(2)*(cols+1)) - 1 + .5 - ou; v = rnd(3)*rows - .5 - ov; }
      else           { v = Math.floor(rnd(2)*(rows+1)) - 1 + .5 - ov; u = rnd(3)*cols - .5 - ou; }
      out.push({id:'s'+i, u, v, dir: dirOf(i*7.7 + P.seed*3), style: styleOf(i*3.1 + 11)});
    }
  }
  return out;
}
function frame(now){
  camX += (tcamX - camX) * 0.12; camY += (tcamY - camY) * 0.12;
  if (phase && now > phase.end) phase = null;

  for (const tile of tiles.values()){
    if (tile.state === 'gone') continue;
    if (tile.fall){
      const f = tile.fall, t = (now - f.t0) / P.fall;
      if (t > 1){ tile.el.style.display = 'none'; tile.fall = null; tile.state = 'gone'; continue; }
      const tt = Math.max(0, t);
      tile.el.style.transform = `translate(${f.x + f.vx*tt}px,${f.y + tt*tt*H*0.9}px)`;
      tile.slab.style.transform = slabTransform(0, 1) + ` rotateZ(${f.spin*tt}deg)`;
      tile.el.style.opacity = 1 - clamp((tt - .45) / .55);
      continue;
    }
    const [u, v] = cellUV(layout.index.get(tile.item.id));
    let [x, y] = screenXY(u, v);
    let lift = 0, alpha = 1;
    if (tile.move){
      const m = tile.move, t = clamp((now - m.t0) / P.move), et = ease(t);
      x = lerp(m.x, x, et); y = lerp(m.y, y, et);
      lift = Math.sin(Math.PI * t) * P.arc;
      if (t >= 1){ tile.move = null; tile.el.classList.remove('busy'); }
    }
    if (tile.appear){
      const t = clamp((now - tile.appear.t0) / 650);
      lift = (1 - ease(t)) * 360; alpha = clamp(t * 1.6);
      if (t >= 1){ tile.appear = null; tile.el.classList.remove('busy'); }
    }
    place(tile, x, y, lift, alpha);
  }

  // street lamps: at intersections, or scattered along the streets
  const la = lampAlpha(now);
  if (!phase || now >= phase.fillAt){
    const key = [layout.cols, layout.rows, list.length, P.lampMode, P.lampStyle, P.lampDensity, P.lampMin, P.lampMax, P.every, P.lampRot, P.seed, homeStyle()].join('|');
    if (lampLayout !== key){ clearLamps(); lampLayout = key; lampSpots = makeLampSpots(); }
  }
  if (P.lamps && lampSpots){
    const sc = P.lampSize * T / 110;
    for (const spot of lampSpots){
      const [cx, cy] = screenXY(spot.u, spot.v);
      let L = lamps.get(spot.id);
      if (!L){
        const def = LampKit.get(spot.style, spot.dir);
        const el = document.createElementNS('http://www.w3.org/2000/svg','svg');
        el.setAttribute('class','lamp'); el.setAttribute('viewBox', `${def.minX} ${def.minY} ${def.w} ${def.h}`);
        el.innerHTML = def.svg; world.appendChild(el);
        L = {el, def, glow: el.querySelector('.glow'), pool: el.querySelector('.pool'), on: 0}; lamps.set(spot.id, L);
      }
      const def = L.def;
      L.el.setAttribute('width', def.w*sc); L.el.setAttribute('height', def.h*sc);
      const tx = cx + def.minX*sc, ty = cy + def.minY*sc;
      L.el.style.transform = `translate(${tx}px,${ty}px)`;
      lampLight(L, spot, tx, ty, sc, la);
      L.el.style.zIndex = Math.round(cy + 2000 + 1);
      L.el.style.opacity = la;
      const d = Math.hypot(px - cx, py - (cy - 60*sc));
      L.on += ((isDusk() ? 1 : 1 - clamp((d - 40) / 260)) - L.on) * .08;   // dusk: every lamp is on
      L.glow.style.opacity = .12 + .88*L.on*(.92 + Math.random()*.08);
      L.pool.style.opacity = .3 + .7*L.on;
    }
  } else clearLamps();

  requestAnimationFrame(frame);
}

function place(tile, x, y, lift, alpha){
  tile.e += ((tile.hover ? 1 : 0) - tile.e) * 0.14;
  const e = ease(clamp(tile.e));
  tile.x = x; tile.y = y;
  // top face sits h above the floor; sides hang down to the ground
  const top = tile.h * VY * (1 - e);
  tile.el.style.transform = `translate(${x}px,${y - top - lift}px)`;
  tile.el.style.zIndex = tile.e > 0.02 ? 90000 + Math.round(tile.e*100) : (tile.move || tile.appear ? 60000 + Math.round(y) : Math.round(y + 2000));
  tile.el.style.opacity = alpha;
  tile.el.classList.toggle('hot', tile.e > 0.9);
  tile.slab.style.transform = slabTransform(e, lerp(1, P.hover, e));
}

// ---------------- filtering ----------------
// 1) the rest falls  2) pause  3) survivors regroup into a smaller block, centre first
// 4) frames coming back drop in from above once the regroup has landed
function setFilter(tag){
  // can interrupt a running animation: every tile carries on from wherever it is right now
  filter = tag;
  const next = filter ? ALL.filter(it => it.tags.includes(filter)) : ALL.slice();
  const now = performance.now();
  const regroupAt = now + P.fall * 0.85 + P.pause;
  const fillAt = regroupAt + P.stagger + P.move * 0.8;
  phase = { t0: now, fillAt, end: fillAt + 1200 };
  const keep = new Set(next.map(it => it.id));
  const maxD = Math.hypot(W, H) / 2;
  for (const tile of tiles.values()){
    tile.hover = false; tile.e = 0;
    const visible = tile.state === 'in', kept = keep.has(tile.item.id);
    const pending = tile.appear && now < tile.appear.t0;          // queued to drop in but not shown yet
    if (visible && !kept){
      tile.move = null;
      if (pending){ tile.appear = null; tile.state = 'gone'; tile.el.style.display = 'none'; tile.el.classList.remove('busy'); continue; }
      tile.appear = null;
      tile.state = 'falling';
      tile.el.classList.add('falling');
      tile.fall = {x: tile.x, y: tile.y - tile.h*VY, vx: (Math.random()-.5)*80, spin: (Math.random()-.5)*50, t0: now + Math.random()*P.fall*0.15};
    } else if (visible && pending){
      tile.appear = {t0: fillAt + Math.random()*500};               // still on its way in — just re-queue it
    } else if (visible){
      const dist = Math.hypot(tile.x - W/2, tile.y - H/2);
      tile.appear = null;
      tile.move = {x: tile.x, y: tile.y, t0: regroupAt + clamp(dist / maxD) * P.stagger};
      tile.el.classList.add('busy');
    } else if (kept){                                               // gone, or mid-fall → comes back from above
      tile.fall = null; tile.move = null;
      tile.state = 'in'; tile.el.style.display = ''; tile.el.style.opacity = 0;
      tile.el.classList.remove('falling'); tile.el.classList.add('busy');
      tile.appear = {t0: fillAt + Math.random()*500};
    }
  }
  list = next; layout = makeLayout(list);
  // falling tiles still need their old layout slot for nothing — they use stored screen coords
  for (const tile of tiles.values()) if (tile.state === 'falling') tile.state = 'falling';
  tcamX = 0; tcamY = 0; clampCam();
  showDetail(null);
  renderFilters();
}
// tiles in 'falling' state are skipped by layout lookups (they have tile.fall)

// ---------------- filters UI ----------------
const filtersEl = document.getElementById('filters');
function renderFilters(){
  const count = tag => ALL.filter(it => it.tags.includes(tag)).length;
  filtersEl.innerHTML = `<button data-t="" class="${filter?'':'on'}">All<span>${ALL.length}</span></button>` +
    TAGS.map(t => `<button data-t="${t}" class="${filter===t?'on':''}">${t}<span>${count(t)}</span></button>`).join('');
}
filtersEl.addEventListener('click', e=>{
  const b = e.target.closest('button'); if (!b) return;
  const t = b.dataset.t || null;
  if (t === filter) return;
  setFilter(t);
});

// ---------------- input: pan the camera, stop at the edges ----------------
addEventListener('wheel', e=>{ if (e.target.closest('#ctl')) return; e.preventDefault(); if (phase) return;
  tcamX += e.deltaX; tcamY += e.deltaY; clampCam(); }, {passive:false});
let dragging = false, dragMoved = false, lastY = 0, lastX = 0;
world.addEventListener('pointerdown', e=>{ dragging = true; dragMoved = false; lastY = e.clientY; lastX = e.clientX; world.classList.add('drag'); });
addEventListener('pointermove', e=>{
  px = e.clientX; py = e.clientY;
  if (!dragging || phase) return;
  const dy = e.clientY - lastY, dx = e.clientX - lastX;
  if (Math.abs(dy)+Math.abs(dx) > 3) dragMoved = true;
  tcamX -= dx; tcamY -= dy; clampCam();
  lastY = e.clientY; lastX = e.clientX;
});
addEventListener('pointerup', ()=>{ dragging = false; world.classList.remove('drag'); setTimeout(()=>dragMoved=false, 0); });
addEventListener('resize', ()=>{ geom(); clampCam(); });

// dusk: each lamp gets the home page's light (the Dusk tests profile for its style) — painted once into its own canvases,
// then they just move with the lamp. Repainted when the size or style changes.
const LIGHT = () => window.duskLightAPI;
function lampLight(L, spot, tx, ty, sc, la){
  const API = LIGHT(), want = isDusk() && API;
  if (!want){ if (L.lit){ L.lit.forEach(c => c.remove()); L.lit = null; L.litKey = null; API && API.clear(L.el); } return; }
  const key = sc.toFixed(3) + '|' + spot.style;
  if (L.litKey !== key && la > .99 && !phase){
    (L.lit || []).forEach(c => c.remove()); L.lit = null; L.litKey = key;
    const r = API.render(L.el, spot.style, {noLampLit: true});   // no light on the lamp itself here
    if (r){
      const z = [59000, 59001, 59002];
      L.lit = [r.shad, r.beam, r.front].map((cv, k) => { cv.className = 'lit-c'; cv.style.width = r.box.w + 'px'; cv.style.height = r.box.h + 'px'; cv.style.zIndex = z[k];
        if (k) cv.style.mixBlendMode = r.blend || 'screen'; world.appendChild(cv); return cv; });
      L.litOff = [r.box.x - tx, r.box.y - ty];
    }
  }
  if (L.lit) L.lit.forEach(cv => { cv.style.transform = `translate(${tx + L.litOff[0]}px,${ty + L.litOff[1]}px)`; cv.style.opacity = la; });
}
addEventListener('themechange', () => { for (const [, L] of lamps) L.litKey = null; });

// ---------------- dusk: the home page's sky, lamps lit, a click on any lamp head switches the mode ----------------
// dusk: the sky comes from the dusk module (initDuskLight), the lamp colours from the same tokens as the home lamp

function bulbAt(x, y){
  for (const [, L] of lamps){
    const b = L.el.querySelector('.glow .bulb, .glow .rim, .glow .orb'); if (!b || +L.el.style.opacity < .5) continue;
    const r = b.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    if (Math.hypot(x - cx, y - cy) < Math.max(22, r.width * .8)) return [cx, cy];
  }
  return null;
}
document.addEventListener('click', e => {
  if (dragMoved || e.target.closest('#ctl, #filters, header')) return;
  const hit = bulbAt(e.clientX, e.clientY); if (!hit) return;
  e.stopPropagation(); e.preventDefault();
  const toDusk = !isDusk();
  window.slSetTheme(toDusk, hit[0], hit[1]);
}, true);
addEventListener('pointermove', e => { if (dragging) return; world.style.cursor = bulbAt(e.clientX, e.clientY) ? 'pointer' : ''; });

// ---------------- boot ----------------
layout = makeLayout(list);
geom();
ALL.forEach(it => tiles.set(it.id, makeTile(it)));
renderFilters();
requestAnimationFrame(frame);
