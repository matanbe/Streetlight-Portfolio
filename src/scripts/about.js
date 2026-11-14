// About page: the lamp + bench set (follows the lamp picked on the home page), its dusk light and moths, the drop-in,
// the Filament text entrance, and the clients strip / list. Ported from the prototype.
{
// ---------------- parametric lamp kit (same drawing language as the home lamp, with knobs) ----------------
const LampKit2 = (function(){
  const C = Math.cos(Math.PI/6), S = .5;
  const Pj = (x,y,z)=>[(x - z)*C, (x + z)*S - y];
  const STYLES = ['cobra','classic','mushroom','double','post','globe','ornate'];
  const DEF = {
    classic:  {pole:170, arm:41, lantern:13, lanternW:6, roof:11},
    mushroom: {mast:161, mastR:2.5, dome:17, domeH:9},
    cobra:    {heads:1, baseH:54, baseR:3.2, pole:165, poleR:2.3, taper:.7, capR:1.8, arm:28, armRise:1.2, armGap:1.8, head:19, headW:4.5, headH:3.5, headPos:0},
    double:   {heads:2, pole:173, arm:49, armR:1.5, rise:15, shade:7},
    post:     {post:135, lantern:22, lanternW:7, roof:12.5},
    globe:    {mast:154, split:.36, lowR:2.8, upR:2, lean:0, ball:12},
    ornate:   {arms:2, post:140, arm:40, urn:7.6},
  };
  const COMMON = {rays:6, pool:1};
  function make(style, deg, P){
    P = {...COMMON, ...DEF[style], ...(P || {})};
    const dd = [Math.cos(deg*Math.PI/180), Math.sin(deg*Math.PI/180)], pp = [-dd[1], dd[0]], nd = [-dd[0], -dd[1]];
    let out = [], minX=1e9,minY=1e9,maxX=-1e9,maxY=-1e9;
    const grow = q => { minX=Math.min(minX,q[0]);maxX=Math.max(maxX,q[0]);minY=Math.min(minY,q[1]);maxY=Math.max(maxY,q[1]); return q; };
    const fmt = q => q[0].toFixed(2)+' '+q[1].toFixed(2);
    const d = (a, close=true) => 'M' + a.map(p=>fmt(grow(Pj(...p)))).join('L') + (close?'Z':'');
    const path = (a, cls, close=true) => out.push(`<path class="${cls}" d="${d(a,close)}"/>`);
    const pathS = (a, cls, close=true) => out.push(`<path class="${cls}" d="M${a.map(q=>fmt(grow(q))).join('L')}${close?'Z':''}"/>`);
    const line = (a, cls='edge') => path(a, cls, false);
    const along = (s, y, v=dd, o=[0,0]) => [o[0] + v[0]*s, y, o[1] + v[1]*s];
    const box = (x0,x1,y0,y1,z0,z1,top='f hi')=>{
      path([[x1,y0,z0],[x1,y1,z0],[x1,y1,z1],[x1,y0,z1]], 'f edge');
      path([[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]], 'f edge');
      path([[x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1]], top);
    };
    const sq = (h, y0, y1, cx=0, cz=0, top) => box(cx-h, cx+h, y0, y1, cz-h, cz+h, top);
    const ring = (cx,cz,r,y,a0,a1,n=28)=>{ const a=[]; for(let k=0;k<=n;k++){const t=(a0+(a1-a0)*k/n)*Math.PI/180; a.push([cx+r*Math.cos(t),y,cz+r*Math.sin(t)]);} return a; };
    const frustum = (cx,cz,r0,y0,r1,y1,topCls='mid')=>{
      path(ring(cx,cz,r0,y0,-45,135).concat(ring(cx,cz,r1,y1,135,315)), 'f edge');
      path(ring(cx,cz,r1,y1,0,360,36), topCls);
      path(ring(cx,cz,r0,y0,-45,135), 'mid', false);
    };
    const cyl = (cx,cz,r,y0,y1,topCls) => frustum(cx,cz,r,y0,r,y1,topCls);
    // a leaning cylinder between two points: same build as a frustum (outline, top ring, front of the bottom ring)
    const lean = (p0, p1, r, topCls='mid') => {
      path(ring(p0[0],p0[2],r,p0[1],-45,135).concat(ring(p1[0],p1[2],r,p1[1],135,315)), 'f edge');
      path(ring(p1[0],p1[2],r,p1[1],0,360,36), topCls);
      path(ring(p0[0],p0[2],r,p0[1],-45,135), 'mid', false);
    };
    // a ring around a pole: draw the ring, then a short bit of the pole above it, so the ring's back half
    // disappears behind the pole and it reads as wrapping round it (not a see-through washer)
    const stub = (cx,cz,r,y0,h) => {
      path(ring(cx,cz,r,y0,-45,135).concat(ring(cx,cz,r,y0+h,135,315)), 'f');          // filled, no outline (no ring at its top)
      const e = a => [cx + r*Math.cos(a*Math.PI/180), cz + r*Math.sin(a*Math.PI/180)];
      for (const a of [-45, 135]){ const [x, z] = e(a); line([[x,y0,z],[x,y0+h,z]]); }    // just the two side edges
      path(ring(cx,cz,r,y0,-45,135), 'mid', false); };
    const collar = (cx,cz,r,y0,y1,pr,h) => { cyl(cx,cz,r,y0,y1); stub(cx,cz,pr,y1,h || r*1.1+1.5); };
    const tube = (p0, p1, r, cls='f edge') => {
      const a = Pj(...p0), b = Pj(...p1), dx = b[0]-a[0], dy = b[1]-a[1], L = Math.hypot(dx,dy) || 1, nx = -dy/L*r, ny = dx/L*r;
      pathS([[a[0]+nx,a[1]+ny],[b[0]+nx,b[1]+ny],[b[0]-nx,b[1]-ny],[a[0]-nx,a[1]-ny]], cls);
    };
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
    // a bent rod with thickness: offset the projected curve both ways and close it
    const rod = (pts3, r, cls='f edge') => {
      const q = pts3.map(p => Pj(...p)), L = [], R = [];
      q.forEach((p, k) => { const a = q[Math.max(0, k-1)], b = q[Math.min(q.length-1, k+1)], dx = b[0]-a[0], dy = b[1]-a[1], l = Math.hypot(dx, dy) || 1;
        L.push([p[0] - dy/l*r, p[1] + dx/l*r]); R.push([p[0] + dy/l*r, p[1] - dx/l*r]); });
      pathS(L.concat(R.reverse()), cls);
    };
    const parts = [], lights = [];
    const part = (depth, fn) => parts.push({depth, fn});
    const depthOf = (v, s) => (v[0] + v[1]) * s;
    const light = (p, kind, r, ground, gr) => lights.push({p, kind, r, g: ground, gr: gr * P.pool});
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
      const T = P.pole, LX = P.arm, [ox,,oz] = along(LX,0), yT = T - 15, yB = yT - P.lantern, hT = P.lanternW, hB = hT * .54;
      part(0, ()=>{ sq(10,0,4); sq(6.5,4,22); sq(8,22,25); cyl(0,0,4.2,25,33); cyl(0,0,2.4,33,T,'lo'); collar(0,0,3.3,T*.58,T*.58+3,2.4); cyl(0,0,3.3,T-5,T); cyl(0,0,1.4,T,T+7); });
      part(depthOf(dd,LX), ()=>{
        const arm = off => curve(t=>along(2+t*(LX-2), T-7+off+7*Math.sin(Math.PI*t)*(1-t*.4)));
        line(arm(1.2)); line(arm(-.6));
        const top = Math.min(T-4, yT+P.roof+3); line([[ox,T-4,oz],[ox,top,oz]]);
        glassLantern(ox, oz, yB, yT, hB, hT);
        path([[ox+hB,yB,oz-hB],[ox,yB-5,oz],[ox+hB,yB,oz+hB]],'f edge'); path([[ox-hB,yB,oz+hB],[ox,yB-5,oz],[ox+hB,yB,oz+hB]],'f edge');
        roofPyramid(ox, oz, yT, hT+1.5, P.roof); cyl(ox,oz,1,yT+P.roof,yT+P.roof+3);
      });
      light([ox,(yB+yT)/2,oz], 'dot', 2.8, [ox,oz], 24);
    }
    if (style === 'mushroom'){
      const M = P.mast;
      part(0, ()=>{ cyl(0,0,3.6,0,3); cyl(0,0,P.mastR+.7,3,Math.min(46, M*.3)); frustum(0,0,P.mastR,Math.min(46, M*.3),P.mastR*.75,M,'lo'); cyl(0,0,1.1,M,M+6); dome(0,0,P.dome,M+7,P.domeH); });
      light([0,M+6.6,0], 'disc', P.dome-.5, [0,0], 34*P.dome/15);
    }
    if (style === 'cobra'){
      const H = P.pole, rise = P.armRise ?? 1.2, gap = P.armGap ?? 1.8, s0 = P.arm - 1 - (P.headPos ?? 0) * P.head, s1 = s0 + P.head, w = P.headW, y1 = H + 1.5 + rise, y0 = y1 - P.headH;
      part(0, ()=>{ cyl(0,0,P.baseR,0,P.baseH); frustum(0,0,P.poleR,P.baseH,P.poleR*(P.taper ?? .7),H,'lo'); cyl(0,0,P.capR ?? 1.8,H,H+2.5); });
      // 1–4 heads, around the pole
      for (const D of [dd, nd, pp, [-pp[0],-pp[1]]].slice(0, Math.round(P.heads))){
        const Dp = [-D[1], D[0]], Dn = [-D[0], -D[1]], [ox,,oz] = along((s0+s1)/2, 0, D);
        part(depthOf(D,20), ()=>{
          line(curve(t=>along(1.5+t*(P.arm-1.5), H+1.6+t*rise, D), 8)); line(curve(t=>along(1.5+t*(P.arm-1.5), H+1.6-gap+t*rise, D), 8));
          const c = (s, q, y) => [D[0]*s + Dp[0]*q, y, D[1]*s + Dp[1]*q];
          const sides = [[[s1,-w],[s1,w], D], [[s0,w],[s0,-w], Dn], [[s0,w],[s1,w], Dp], [[s1,-w],[s0,-w], [-Dp[0],-Dp[1]]]];
          sides.filter(f => f[2][0] + f[2][1] > 0).forEach(([a,b]) => path([c(a[0],a[1],y0), c(b[0],b[1],y0), c(b[0],b[1],y1), c(a[0],a[1],y1)], 'f edge'));
          path([c(s0,-w,y1), c(s1,-w,y1), c(s1,w,y1), c(s0,w,y1)], 'f hi');
        });
        light([ox,y0-.5,oz], 'dot', 2.4, [ox,oz], 26);
      }
    }
    if (style === 'double'){
      const H = P.pole, A = P.arm, R = P.rise, top = H - 12 + R;
      part(0, ()=>{ sq(6,0,3); frustum(0,0,3.2,3,1.9,H,'lo'); cyl(0,0,1.3,H,H+7); cyl(0,0,2,H+7,H+8.5); });
      for (const v of [dd, nd, pp, [-pp[0],-pp[1]]].slice(0, Math.round(P.heads))){
        const [ox,,oz] = along(A,0,v);
        part(depthOf(v,A), ()=>{
          // shade first, then the arm, so the arm reads as holding it from above
          frustum(ox,oz,P.shade,top-11,1.3,top-5); cyl(ox,oz,1.6,top-5,top-2.5);
          rod(curve(t=>along(1.5+t*(A-2), H-12.7+R*t, v), 12), P.armR);
          rod(curve(t=>along(A-2+3*Math.sin(t*Math.PI/2), top - .7 - 4*t + 2*Math.sin(t*Math.PI), v), 8), P.armR);
        });
        light([ox,top-10,oz], 'dot', 2.4, [ox,oz], 20);
      }
    }
    if (style === 'post'){
      const T = P.post, L = P.lantern, W = P.lanternW;
      part(0, ()=>{
        // simplified: one base block, a plain post, the lantern straight on top, a roof and a short tip
        sq(8,0,4); frustum(0,0,4.6,4,3,14); cyl(0,0,2.8,14,T+6,'lo');
        glassLantern(0, 0, T+6, T+6+L, W, W);
        roofPyramid(0, 0, T+6+L, W+2, P.roof); cyl(0,0,.9,T+6+L+P.roof,T+10+L+P.roof);
      });
      light([0,T+6+L/2,0], 'dot', 3, [0,0], 20);
    }
    if (style === 'globe'){
      const M = P.mast, Lm = P.lean, top = along(Lm, M);
      part(0, ()=>{
        cyl(0,0,9,0,2.2,'hi');
        lean([0,2.2,0], along(Lm*.3,M*P.split), P.lowR); lean(along(Lm*.3,M*P.split), along(Lm*.92,M-9), P.upR, 'lo');
        path(ring(top[0]-dd[0]*.3,top[2]-dd[1]*.3,1.6,M-9,0,360,12),'mid');
        sphere(top[0], top[1], top[2], P.ball);
      });
      light(top, 'orb', P.ball, [top[0],top[2]], 26);
    }
    if (style === 'ornate'){
      const T = P.post, A = P.arm, U = P.urn, k = T / 118;
      part(0, ()=>{
        sq(11,0,3); sq(9,3,7); frustum(0,0,7,7,3.4,34);
        { const rf = y => 7 - 3.6 * (y - 7) / 27; collar(0,0,rf(12)+1.2,12,14.5,rf(17),3); collar(0,0,rf(20)+1.2,20,22.5,rf(25.5),3.5); }
        cyl(0,0,3.6,34,38); cyl(0,0,2.5,38,T,'lo'); collar(0,0,3.2,80*k,83*k,2.5); cyl(0,0,3.4,T-8,T-2); cyl(0,0,1.2,T-2,T+1); sphere(0,T+4.2,0,3.4);
      });
      const dirs = [dd, nd, pp, [-pp[0],-pp[1]]].slice(0, Math.round(P.arms));
      for (const v of dirs){
        const [ox,,oz] = along(A,0,v), b = T - 5;
        part(depthOf(v,A), ()=>{
          rod(curve(t=>along(2+t*(A-2), T-10 - 7*Math.sin(Math.PI*t) + 10*t*t, v), 18), 1.5);
          frustum(ox,oz,1,b,2.2,b+3); frustum(ox,oz,2.2,b+3,U,b+18,'lo');
          cyl(ox,oz,U+2.2,b+18,b+20,'hi'); frustum(ox,oz,U-.2,b+20,.8,b+27); cyl(ox,oz,.6,b+27,b+32); cyl(ox,oz,1.4,b+32,b+33.5);
        });
        light([ox,b+11,oz], 'dot', 2.6, [ox,oz], 18);
      }
    }
    out.push('<g class="pool">');
    for (const L of lights){ path(ring(L.g[0],L.g[1],L.gr,0,0,360,48),'lo'); path(ring(L.g[0],L.g[1],L.gr*.58,0,0,360,40),'lo'); }
    out.push('</g>');
    parts.sort((a,b)=>a.depth-b.depth).forEach(p=>p.fn());
    out.push('<g class="glow">');
    for (const L of lights){
      const c = grow(Pj(...L.p));
      if (L.kind === 'dot')  out.push(`<circle class="bulb" cx="${c[0].toFixed(2)}" cy="${c[1].toFixed(2)}" r="${L.r}"/>`);
      if (L.kind === 'orb')  out.push(`<circle class="orb" cx="${c[0].toFixed(2)}" cy="${c[1].toFixed(2)}" r="${(L.r*1.12).toFixed(2)}"/><circle class="bulb" cx="${c[0].toFixed(2)}" cy="${c[1].toFixed(2)}" r="2.6"/>`);
      if (L.kind === 'disc') out.push(`<path class="rim" d="${d(ring(L.p[0],L.p[2],L.r,L.p[1],-45,135,24),false)}"/>`);
      const n = Math.round(P.rays);
      for (let k=0;k<n;k++){
        const a = (k/n)*Math.PI*2 + .3, rr = L.kind === 'dot' ? 2.5 : L.r*.8;
        const s = Pj(L.p[0]+Math.cos(a)*rr, L.p[1]-(L.kind==='orb'?L.r*.6:1), L.p[2]+Math.sin(a)*rr);
        const e = Pj(L.g[0]+Math.cos(a)*L.gr*.66, 0, L.g[1]+Math.sin(a)*L.gr*.66);
        out.push(`<line class="ray" x1="${s[0].toFixed(2)}" y1="${s[1].toFixed(2)}" x2="${e[0].toFixed(2)}" y2="${e[1].toFixed(2)}"/>`);
      }
    }
    out.push('</g>');
    const pad = 3; minX-=pad; minY-=pad; maxX+=pad; maxY+=pad;
    return { svg: out.join(''), minX, minY, w: maxX-minX, h: maxY-minY, lights };
  }
  return { STYLES, DEF, COMMON, make };
})();

// ---------------- benches: one per lamp style, drawn in the same iso language, lit by that lamp at dusk ----------------
const BenchKit = (function(){
  const C = Math.cos(Math.PI/6), S = .5;
  const Pj = (x,y,z)=>[(x - z)*C, (x + z)*S - y];
  const depth = (x,y,z) => x + z + y*.02;
  const sm = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const LOOK = {cobra:'concrete + steel', classic:'victorian', mushroom:'ring', double:'pair', single:'single', post:'garden'};
  const DEF = {
    cobra:    {x:19, z:-64, rot:0,  scale:1.05, len:62, depth:16,   seat:15.5, back:16, tilt:12, sheet:.62, arm:7, sit:.45},
    classic:  {x:36, z:-64, rot:0,  scale:1.1,  len:61, depth:17,   seat:12,   back:18, tilt:16, slats:6, backSlats:3, arch:4.5, frames:2, sit:.4},
    mushroom: {x:1,  z:0,   rot:88, scale:1.43, radius:30.5, depth:15, seat:14.5, legs:12, sitAngle:30},
    double:   {off:5, rot:271, scale:1.18, len:44, depth:15.5, seat:15, back:13, tilt:15, slats:3, backSlats:2, frames:2, sit:.5},
    post:     {x:18, z:-71, rot:0,  scale:1.13, len:56, depth:16,   seat:15.5, back:21, tilt:12, slats:3, backSlats:9, frames:2, sit:.4},
  };
  const v3 = {
    sub: (a, b) => [a[0]-b[0], a[1]-b[1], a[2]-b[2]], dot: (a, b) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2],
    cen: q => q.reduce((s, p) => [s[0]+p[0]/q.length, s[1]+p[1]/q.length, s[2]+p[2]/q.length], [0,0,0]),
    newell: q => { const n = [0,0,0]; for (let i = 0; i < q.length; i++){ const a = q[i], b = q[(i+1) % q.length];
      n[0] += (a[1]-b[1])*(a[2]+b[2]); n[1] += (a[2]-b[2])*(a[0]+b[0]); n[2] += (a[0]-b[0])*(a[1]+b[1]); } return n; },
  };
  // smooth a polyline (Catmull-Rom), then give it a width: a 2D outline
  const smooth = (p, n = 6) => { if (p.length < 3) return p; const o = [];
    for (let i = 0; i < p.length - 1; i++){ const a = p[Math.max(0, i-1)], b = p[i], c = p[i+1], d = p[Math.min(p.length-1, i+2)];
      for (let k = 0; k < n; k++){ const t = k / n, t2 = t*t, t3 = t2*t;
        o.push([0,1].map(j => .5 * (2*b[j] + (-a[j] + c[j])*t + (2*a[j] - 5*b[j] + 4*c[j] - d[j])*t2 + (-a[j] + 3*b[j] - 3*c[j] + d[j])*t3))); } }
    o.push(p[p.length-1]); return o; };
  const smooth3 = (p, n = 6) => { if (p.length < 3) return p; const o = [];
    for (let i = 0; i < p.length - 1; i++){ const a = p[Math.max(0, i-1)], b = p[i], c = p[i+1], d = p[Math.min(p.length-1, i+2)];
      for (let k = 0; k < n; k++){ const t = k / n, t2 = t*t, t3 = t2*t;
        o.push([0,1,2].map(j => .5 * (2*b[j] + (-a[j] + c[j])*t + (2*a[j] - 5*b[j] + 4*c[j] - d[j])*t2 + (-a[j] + 3*b[j] - 3*c[j] + d[j])*t3))); } }
    o.push(p[p.length-1]); return o; };
  const thicken = (q, w) => { const L = [], R = [], r = w / 2;
    q.forEach((p, k) => { const a = q[Math.max(0, k-1)], b = q[Math.min(q.length-1, k+1)], dx = b[0]-a[0], dy = b[1]-a[1], l = Math.hypot(dx, dy) || 1;
      L.push([p[0] - dy/l*r, p[1] + dx/l*r]); R.push([p[0] + dy/l*r, p[1] - dx/l*r]); });
    return L.concat(R.reverse()); };
  // a scroll: a spiral that tightens inward (centre, start radius, start angle, turns, direction)
  const spiral = (cx, cy, r, a0, turns, dir = 1, n = 22) => Array.from({length: n + 1}, (_, i) => { const t = i / n, rr = r * (1 - .72 * t), a = a0 + dir * turns * Math.PI * 2 * t; return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]; });
  const hull = pts => { const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]); if (p.length < 3) return p;
    const cr = (o, a, b) => (a[0]-o[0])*(b[1]-o[1]) - (a[1]-o[1])*(b[0]-o[0]); const lo = [], up = [];
    for (const q of p){ while (lo.length > 1 && cr(lo[lo.length-2], lo[lo.length-1], q) <= 0) lo.pop(); lo.push(q); }
    for (const q of p.reverse()){ while (up.length > 1 && cr(up[up.length-2], up[up.length-1], q) <= 0) up.pop(); up.push(q); }
    return lo.slice(0, -1).concat(up.slice(0, -1)); };

  // B: bench params · lights: the lamp's lights (3D bulb + ground centre + pool radius) · O: {dusk, lit, shadow, light, id}
  function make(style, B, lights, O = {}){
    const look = LOOK[style] || 'garden', k = B.scale, R = B.rot * Math.PI / 180, cr = Math.cos(R), sr = Math.sin(R);
    const place = (u, y, v) => [B.x + (v*cr - u*sr)*k, y*k, B.z + (v*sr + u*cr)*k];
    const L = B.len || 0, D = B.depth, H = B.seat, Bk = B.back || 0, t = Math.tan((B.tilt || 0) * Math.PI / 180), g = .7;
    const ns = Math.max(1, Math.round(B.slats || 1)), nb = Math.max(0, Math.round(B.backSlats || 0)), nf = Math.max(2, Math.round(B.frames || 2));
    const parts = [];
    // every part: two matching rings of 3D corners (A, Bv); its faces are the two caps and the quads between them
    const solid = (A, Bv, ink, rank, o2 = {}) => parts.push({A, Bv, ink, rank, ...o2});
    const prism = (prof, u0, u1, ink, rank, o2) => solid(prof.map(([v, y]) => place(u0, y, v)), prof.map(([v, y]) => place(u1, y, v)), ink, rank, o2);
    const box = (u0, u1, y0, y1, v0, v1, ink, rank, o2) => prism([[v0,y0],[v1,y0],[v1,y1],[v0,y1]], u0, u1, ink, rank, o2);
    const o = y => -Math.max(0, y - H) * t;   // the back leans above the seat
    const lbox = (u0, u1, y0, y1, v0, v1, ink, rank) => prism([[v0+o(y0),y0],[v1+o(y0),y0],[v1+o(y1),y1],[v0+o(y1),y1]], u0, u1, ink, rank);
    const rod = (pts, w, u0, u1, ink, rank, o2) => prism(thicken(smooth(pts), w), u0, u1, ink, rank, o2);
    // a flat curve in the back's plane (u, y), as thick as th, standing at v = vf(y)
    const plate = (pts, w, vf, th, ink, rank) => { const q = thicken(smooth(pts), w); solid(q.map(([u, y]) => place(u, y, vf(y) - th/2)), q.map(([u, y]) => place(u, y, vf(y) + th/2)), ink, rank); };
    const spread = (n, a, b, w) => Array.from({length: n}, (_, i) => a + (b - a - w) * (n === 1 ? .5 : i / (n - 1)));
    let benchC = null, split = false;

    if (look === 'concrete + steel'){
      // a solid block of cast stone; on it one folded steel sheet: back → seat, and at one end it folds into the armrest
      box(0, L, 0, H - .8, 0, D, 'hi', 'under', {tex: 'granite'});
      const u0 = L * (1 - B.sheet), u1 = L + 3, th = .55, top = H + Bk, yS = H - .5;
      rod([[2 - Bk * t, top], [1.6 - Bk * t * .45, H + Bk * .45], [1.3, H + 2.2], [2.4, yS], [5, yS], [D * .6, yS], [D + 2.5, yS]], th, u0, u1, 'edge', 'seat', {tex: 'perf'});
      const ay = H + B.arm, aw = 6;
      rod([[1.6 - (ay - H) * t * .45, ay], [D * .5, ay + .2], [D - 2, ay], [D - .4, ay - 1.8], [D - .2, yS + 2], [D + .6, yS + .2]], th, u1 - aw, u1, 'edge', 'side', {tex: 'perf'});
      benchC = place(L / 2, H / 2, D / 2);
    }
    if (look === 'victorian'){
      // wrought iron: scrolled legs and arms, an arched back filled with scrolls; wooden slats on the seat
      const ft = 1.2, w = 1, arch = B.arch, vb = y => 1.2 - Math.max(0, y - H) * t, topY = u => H + Bk - 3 + arch * Math.sin(Math.PI * Math.min(1, Math.max(0, u / L)));
      const frame = (u, end) => { const rk = end ? 'side' : 'under', R2 = (p, ww = w) => rod(p, ww, u, u + ft, 'hi', rk);
        R2([[D+2.4,1.3],[D+.7,4],[D-.3,9],[D-.6,H-1.4]]); R2(spiral(D+3.1, 2.2, 1.3, Math.PI * 1.15, .9, 1), .8);
        R2([[-2.4,1.3],[-.8,4],[.5,9],[1.2,H-1.4],[vb(H+4),H+4],[vb(H+Bk*.6),H+Bk*.6],[vb(topY(u)),topY(u)]]); R2(spiral(-3.1, 2.2, 1.3, -.15, .9, -1), .8);
        R2([[.3,3.4],[D/2,2.3],[D-.3,3.4]], .7); R2([[1,H-1.6],[D-.4,H-1.6]], .9);
        if (end){
          R2([[vb(H+10),H+10],[D*.4,H+9.1],[D-1.4,H+8.7],[D+.6,H+7.6]]); R2(spiral(D+.3, H+6.1, 1.6, Math.PI * .45, 1.05, -1), .8);
          R2([[D-.6,H-1.4],[D-.1,H+2.5],[D+.2,H+4.6]], .9); R2(spiral(D-.7, H+5, 1.1, -.2, .95, 1), .7);
        }
      };
      const us = spread(nf, 0, L, ft); us.forEach((u, i) => frame(u, i === 0 || i === us.length - 1));
      const sw = (D - 2.2 - g*(ns-1)) / ns; for (let i = 0; i < ns; i++){ const v = 1.6 + i*(sw+g); box(-.4, L+.4, H-1.4, H, v, v+sw, 'edge', 'seat'); }
      box(ft, L - ft, H - 3.2, H - 1.4, D - 1, D - .3, 'hi', 'under');
      if (Bk > 0){
        const th = .5, P2 = (p, ww = .45) => plate(p, ww, vb, th, 'hi', 'back');
        P2([[ft, H + 2.4], [L - ft, H + 2.4]], 1);
        P2(Array.from({length: 13}, (_, i) => { const u = ft + (L - 2*ft) * i / 12; return [u, topY(u)]; }), 1.1);
        // scroll motifs: a pair of C-scrolls rising from the lower rail, a smaller pair hanging from the top
        const n = Math.max(1, nb), cs = spread(n, L * .1, L * .9, 0), s = Math.min(5.2, (L * .8) / n / 2.6), mid = H + 2.4 + (Bk - 5.4) * .5;
        cs.forEach(c => { for (const dir of [-1, 1]){
          P2([[c, H + 2.4], [c + dir * s * .35, mid - s * .6], [c + dir * s * 1.05, mid]]);
          P2(spiral(c + dir * s * 1.05 - dir * s * .55, mid + s * .2, s * .55, dir > 0 ? 0 : Math.PI, .85, dir > 0 ? 1 : -1));
          const ty = topY(c) - .6; P2(spiral(c + dir * s * .55, ty - s * .5, s * .45, Math.PI / 2, .8, dir > 0 ? -1 : 1), .4);
        } P2([[c, mid - s * .2], [c, topY(c) - .5]], .4); });
      }
      benchC = place(L / 2, H / 2, D / 2);
    }
    if (look === 'ring'){
      // a ring of seat around the lamp: a thick top on slim legs; the lamp stands in the middle
      const r0 = B.radius, r1 = r0 + D, n = 48, y0 = H - 1.8, a = i => -Math.PI / 4 + i * Math.PI * 2 / n;
      const at = (r, an, y) => place(r * Math.sin(an), y, r * Math.cos(an));
      for (let i = 0; i < n; i++){ const A0 = a(i), A1 = a(i + 1), q = an => [at(r0, an, y0), at(r1, an, y0), at(r1, an, H), at(r0, an, H)];
        const lines = []; if (i === 0 || i === n / 2) lines.push([at(r1, A0, y0), at(r1, A0, H)], [at(r0, A0, y0), at(r0, A0, H)]);
        solid(q(A0), q(A1), 'edge', 'mid', {noCaps: true, lines}); }
      const nl = Math.max(3, Math.round(B.legs)), rm = (r0 + r1) / 2;
      for (let i = 0; i < nl; i++){ const an = (i + .5) * Math.PI * 2 / nl, c = at(rm, an, 0), h = .8 * k;
        const sq = y => [[c[0]-h, y, c[2]-h], [c[0]+h, y, c[2]-h], [c[0]+h, y, c[2]+h], [c[0]-h, y, c[2]+h]];
        const A = sq(0).map(p => [p[0], 0, p[2]]), T = sq(0).map(p => [p[0], y0 * k, p[2]]);
        // a leg: four sides of a thin square post (as a box: caps are its bottom and top)
        solid(A, T, 'hi', 'under'); }
      benchC = place(0, H / 2, 0); split = true;
    }
    if (look === 'single'){
      // one bench in the same build as the old back-to-back: A-frame legs, posts with slats on them
      const lw = 1.6, rail = 2.4;
      for (const u of spread(nf, 3, L - 3, lw)){
        rod([[1.2,0],[D*.45,H-rail]], 1.6, u, u+lw, 'hi', 'under'); rod([[D-1.2,0],[D*.55,H-rail]], 1.6, u, u+lw, 'hi', 'under');
        box(u, u+lw, H-rail*2, H-rail, 0, D, 'hi', 'under');
        if (Bk > 0) lbox(u, u+lw, H-rail, H+Bk, 0, 1.4, 'hi', 'post');
      }
      const sw = (D - g*(ns-1)) / ns; for (let i = 0; i < ns; i++) box(0, L, H-rail, H, i*(sw+g), i*(sw+g)+sw, 'edge', 'seat');
      if (Bk > 0 && nb > 0){ const bh = Math.min(4, (Bk - 3) / nb - g);
        for (let i = 0; i < nb; i++){ const y1 = H + Bk - .6 - i*(bh+g); lbox(-.5, L+.5, y1 - bh, y1, 1.4, 2.6, 'edge', 'back'); } }
    }
    if (look === 'back to back'){
      // two seats sharing one back: A-frame legs, a centre spine of posts, slats on both sides
      const W2 = D * 2 + 2, lw = 1.6, rail = 2.4;
      for (const u of spread(nf, 3, L - 3, lw)){
        rod([[1.2,0],[D*.5,H-rail]], 1.6, u, u+lw, 'hi', 'under'); rod([[W2-1.2,0],[W2-D*.5,H-rail]], 1.6, u, u+lw, 'hi', 'under');
        box(u, u+lw, H-rail*2, H-rail, 0, W2, 'hi', 'under');
        if (Bk > 0) box(u, u+lw, H-rail, H+Bk, D+.3, D+1.7, 'hi', 'mid');
      }
      const sw = (D - .4 - g*(ns-1)) / ns;
      for (let i = 0; i < ns; i++){ box(0, L, H-rail, H, i*(sw+g), i*(sw+g)+sw, 'edge', 'mid'); const v = D + 2.4 + i*(sw+g); box(0, L, H-rail, H, v, v+sw, 'edge', 'mid'); }
      if (Bk > 0 && nb > 0){ const bh = Math.min(4, (Bk - 3) / nb - g), lean = y => (y - H) * t * .5;
        for (let i = 0; i < nb; i++){ const y1 = H + Bk - .6 - i*(bh+g), y0 = y1 - bh;
          prism([[D-.9-lean(y0),y0],[D+.3-lean(y0),y0],[D+.3-lean(y1),y1],[D-.9-lean(y1),y1]], -.5, L+.5, 'edge', 'mid');
          prism([[D+1.7+lean(y0),y0],[D+2.9+lean(y0),y0],[D+2.9+lean(y1),y1],[D+1.7+lean(y1),y1]], -.5, L+.5, 'edge', 'mid'); } }
    }
    if (look === 'garden'){
      // a chunky wooden garden bench: square legs, arms, a backrest of spindles between two rails
      const lw = 2.4, ah = H + 8;
      for (const u of [0, L - lw]){
        box(u, u+lw, 0, ah, D-lw, D, 'edge', 'side');
        prism([[0,0],[lw,0],[lw,H],[lw+o(H+Bk),H+Bk],[o(H+Bk),H+Bk],[0,H]], u, u+lw, 'edge', 'side');
        box(u, u+lw, H-4.4, H-1.6, lw, D-lw, 'edge', 'side');
        box(u - .7, u+lw+.7, ah, ah+1.6, o(ah)+lw-.4, D+1.4, 'edge', 'sidetop');
      }
      box(lw, L-lw, H-4.4, H-1.6, D-lw+.5, D-.5, 'edge', 'under'); box(lw, L-lw, H-4.4, H-1.6, .5, lw-.5, 'edge', 'under');
      const sw = (D - .2 - g*(ns-1)) / ns; for (let i = 0; i < ns; i++) box(.2, L-.2, H-1.6, H, .1+i*(sw+g), .1+i*(sw+g)+sw, 'edge', 'seat');
      if (Bk > 0){
        lbox(lw, L-lw, H+Bk-3.4, H+Bk-.6, .3, lw-.3, 'edge', 'back'); lbox(lw, L-lw, H+2.4, H+4.6, .3, lw-.3, 'edge', 'back');
        for (const u of spread(nb, lw + 2, L - lw - 2, 1.3)) lbox(u, u+1.3, H+4.6, H+Bk-3.4, .7, lw-.7, 'edge', 'back');
      }
    }

    // ---- the person: one abstract figure (no face), same body on every bench; the hat tells the period
    if (O.person || O.hat){
      const HAT = {cobra: 'cap', classic: 'top', mushroom: 'fedora', double: 'beret', single: 'beret', post: 'boater'}[style] || 'cap';
      // where he sits: a point on the seat's front edge, a forward and a sideways direction (world), the seat's height (world)
      let o0, fw, sd, Hs;
      const sit = B.sit ?? .4;
      const edge = ({cobra: [H - .2, D + 2.5], classic: [H, D - .3], single: [H, D], post: [H, D]})[style] || [H, D];
      if (look === 'ring'){
        // the angle is in the world: 45° = the side nearest to us, facing out toward us
        const an = (B.sitAngle ?? 30) * Math.PI / 180, c0 = place(0, 0, 0), r1 = (B.radius + D) * k;
        fw = [Math.cos(an), 0, Math.sin(an)]; sd = [-Math.sin(an), 0, Math.cos(an)]; o0 = [c0[0] + fw[0] * r1, 0, c0[2] + fw[2] * r1]; Hs = H * k;
      } else {
        const uS = style === 'cobra' ? L * (1 - B.sheet) + (L * B.sheet - 6) * sit : L * sit, P0 = place(uS, 0, edge[1]);
        o0 = P0; fw = v3.sub(place(uS, 0, edge[1] + 1), P0); sd = v3.sub(place(uS - 1, 0, edge[1]), P0); Hs = edge[0] * k;
      }
      const nz = q => { const l = Math.hypot(...q) || 1; return q.map(x => x / l); }; fw = nz(fw); sd = nz(sd);
      const Wp = (a, y, b) => [o0[0] + sd[0]*a + fw[0]*b, y, o0[2] + sd[2]*a + fw[2]*b];
      const facing = fw[0] + fw[2] > 0;   // turned toward us: legs and arms go over the body; seen from behind: the body over them
      const R0 = 2;   // after the seat; a back that's nearer to us (rank 3) still covers him
      const sub = facing ? {torso: 0, leg: .1, arm: .2} : {leg: 0, arm: .1, torso: .2};
      // a limb: a square beam from p0 to p1 (person coords a, y, b), w wide sideways, t thick
      const beam = (p0, p1, w, t, rk, ink = 'edge') => { const d = [0, p1[1]-p0[1], p1[2]-p0[2]], l = Math.hypot(d[1], d[2]) || 1, n = [0, -d[2]/l, d[1]/l];
        const ring = p => [[-1,-1],[1,-1],[1,1],[-1,1]].map(([i, j]) => Wp(p[0] + i*w/2, p[1] + n[1]*j*t/2, p[2] + n[2]*j*t/2));
        solid(ring(p0), ring(p1), ink, R0 + rk); };
      const cyl = (a, b, r0, y0, y1, rk, ink = 'edge', r1 = r0, sx = 1) => { const ring = (r, y) => Array.from({length: 20}, (_, i) => { const t2 = i / 20 * Math.PI * 2; return Wp(a + Math.cos(t2) * r * sx, y, b + Math.sin(t2) * r); });
        solid(ring(r0, y0), ring(r1, y1), ink, R0 + rk); };
      if (O.person){
      // body: soft volumes — ellipsoids for the trunk and head, tapering tubes for the limbs. Each piece is drawn as one
      // silhouette (a wide stroke under its fill), so where parts meet there's no seam: it reads as one body, not parts.
      const el = (c, ra, ry, rb) => ({t: 'e', c, ax: [sd.map(x => x * ra), [0, ry, 0], fw.map(x => x * rb)]});
      const tube = (pts, r0, r1) => ({t: 't', pts, r0, r1});
      const piece = (shapes, rk) => parts.push({kind: 'blob', shapes, ink: 'edge', rank: R0 + rk});
      const P3 = (a, y, b) => Wp(a, y, b);
      const lean = .6;   // he sits a little forward
      piece([
        el(P3(0, Hs + 3.4, -6.4), 6.8, 3.8, 5),                                    // hips
        el(P3(0, Hs + 8, -6.4 + lean * .4), 6.1, 4.6, 4.2),                        // waist
        el(P3(0, Hs + 13, -6.2 + lean), 7.2, 6.4, 4.4),                            // chest + shoulders
        tube([P3(0, Hs + 18.2, -5.8 + lean), P3(0, Hs + 20.6, -5.3 + lean)], 1.8, 1.6),   // neck
        el(P3(0, Hs + 23.9, -5 + lean), 3.2, 3.9, 3.5),                            // head
        ...[-1, 1].map(s => tube([P3(s * 3.4, Hs + 3.2, -6), P3(s * 3.5, Hs + 3.6, -2), P3(s * 3.6, Hs + 3.3, 1.6)], 3.3, 2.6)),   // thighs
      ], facing ? .1 : .2);
      for (const s of [-1, 1]){
        piece([tube([P3(s * 3.6, Hs + 2.8, 1.6), P3(s * 3.6, Hs * .5, 2.4), P3(s * 3.6, 2.4, 2.5)], 2.4, 1.6),   // shin
               tube([P3(s * 3.6, 1.4, 2.2), P3(s * 3.7, 1, 5), P3(s * 3.8, 1, 7)], 1.5, 1.2)], facing ? .15 : .05);   // foot
        piece([tube([P3(s * 7.4, Hs + 16.2, -6 + lean), P3(s * 8.1, Hs + 12.8, -5.4), P3(s * 8.2, Hs + 9.6, -4.2)], 1.9, 1.6),   // upper arm
               tube([P3(s * 8.2, Hs + 9.6, -4.2), P3(s * 6.6, Hs + 7.6, -1.8), P3(s * 4.8, Hs + 6.6, .2)], 1.6, 1.3),   // forearm
               el(P3(s * 4.6, Hs + 6.2, .8), 1.4, 1.2, 1.7)], facing ? .25 : 0);                                         // hand
      }
      }
      // the hat: on his head, or — with nobody there — left on the seat
      const deep = look === 'ring' ? D * k : (edge[1] - (style === 'cobra' ? 2 : 1.5)) * k;
      const hb = O.person ? -5 + .6 : -deep * .42, yT = O.person ? Hs + 28.8 : Hs + ({cap: 1.7, top: 1.45, fedora: 1.55, beret: 1, boater: 1.45})[HAT];
      if (HAT === 'cap'){ cyl(0, hb, 3.6, yT - 1.6, yT + .9, .4, 'hi', 2.4); beam([0, yT - 1.5, hb + 2.6], [0, yT - 2, hb + 7.6], 5.6, .5, .41, 'hi'); }
      if (HAT === 'top'){ cyl(0, hb, 5.6, yT - 1.4, yT - .9, .4, 'hi'); cyl(0, hb, 3.6, yT - .9, yT + 7.4, .41, 'hi', 3.8); }
      if (HAT === 'fedora'){ cyl(0, hb, 6.6, yT - 1.5, yT - 1, .4, 'hi'); cyl(0, hb, 3.9, yT - 1, yT + 3.6, .41, 'hi', 3.2); }
      if (HAT === 'beret'){ cyl(.9, hb, 4.7, yT - 1, yT + .5, .4, 'hi', 4.2); cyl(.9, hb, .45, yT + .5, yT + 1.3, .41, 'hi'); }
      if (HAT === 'boater'){ cyl(0, hb, 6.1, yT - 1.4, yT - .95, .4, 'hi'); cyl(0, hb, 3.7, yT - .95, yT + 2.4, .41, 'hi'); }
    }

    // ---- faces: each part's faces that turn toward us; fills first, then its lines (creases and silhouettes only)
    if (!benchC) benchC = place(L/2, H/2, look === 'back to back' ? D + 1 : D/2);
    const dC = depth(...benchC);
    const backNear = depth(...place(L/2, H, 0)) > depth(...place(L/2, H, D));
    const RANK = {under: 0, seat: 1, mid: 1, back: backNear ? 3 : .5, post: backNear ? 3.2 : .4};   // posts sit behind the back slats
    const vis = n => n[0] + n[1] + n[2] > 1e-6;
    const outB = [], outF = [], defs = [], all = [], shadowPts = lights.map(() => []);
    const f2 = n => n.toFixed(2), dpath = q => 'M' + q.map(p => p.map(f2).join(' ')).join('L') + 'Z';
    const lightAt = (p, n) => { let v = 0; const nl = Math.hypot(...n) || 1;
      for (const Lg of lights){ const Ly = Lg.p[1]; if (p[1] >= Ly - .5) continue;
        const rh = Math.hypot(p[0] - Lg.g[0], p[2] - Lg.g[1]), rc = Math.max(4, Lg.gr * 2 * (Ly - p[1]) / Ly);
        const cone = 1 - sm(.35, 1.1, rh / rc);
        const lx = Lg.p[0]-p[0], ly = Lg.p[1]-p[1], lz = Lg.p[2]-p[2], d = Math.hypot(lx, ly, lz);
        const lam = Math.max(0, (n[0]*lx + n[1]*ly + n[2]*lz) / (d * nl));
        v = Math.max(v, cone * (.2 + .8 * lam) * Math.min(1, 1.25 / (1 + Math.pow(d / (Ly * 1.15), 2)))); }
      return Math.min(1, v); };
    const id0 = O.id || 'b';
    defs.push(`<pattern id="${id0}perf" patternUnits="userSpaceOnUse" width="1.5" height="1.5"><circle class="tx-perf" cx=".75" cy=".75" r=".36"/></pattern>`);
    { let s = 7, rnd = () => (s = (s * 16807) % 2147483647) / 2147483647, dots = '';
      for (let i = 0; i < 26; i++) dots += `<circle class="tx-gr" cx="${f2(rnd() * 6)}" cy="${f2(rnd() * 6)}" r="${f2(.12 + rnd() * .14)}"/>`;
      defs.push(`<pattern id="${id0}granite" patternUnits="userSpaceOnUse" width="6" height="6">${dots}</pattern>`); }
    let gid = 0;
    const prepared = parts.map(pt => {
      const cen = pt.kind === 'blob' ? v3.cen(pt.shapes.map(sh => sh.t === 'e' ? sh.c : v3.cen(sh.pts))) : v3.cen(pt.A.concat(pt.Bv));
      const near = depth(...cen) > dC, rank = typeof pt.rank === 'number' ? pt.rank : pt.rank === 'side' ? (near ? 5 : -1) : pt.rank === 'sidetop' ? (near ? 5.5 : -.5) : RANK[pt.rank];   // armrests go on top of their legs
      return {pt, cen, rank, d: depth(...cen)};
    });
    prepared.sort((a, b) => a.rank - b.rank || a.d - b.d);
    const PS = Math.hypot(C, C);   // a sphere of radius r shows as a circle of r × this
    const blobOut = (pt, out) => {
      // each shape → its 2D outline (ellipses exactly; tubes as an offset polyline + round ends)
      const svgs = [], pts3 = [];
      for (const sh of pt.shapes){
        if (sh.t === 'e'){ const c = Pj(...sh.c), A2 = sh.ax.map(v => [(v[0] - v[2]) * C, (v[0] + v[2]) * S - v[1]]);
          const a = A2.reduce((s, v) => s + v[0]*v[0], 0), b = A2.reduce((s, v) => s + v[0]*v[1], 0), d = A2.reduce((s, v) => s + v[1]*v[1], 0);
          const tr = (a + d) / 2, df = Math.sqrt(Math.max(0, (a - d) * (a - d) / 4 + b * b)), l1 = tr + df, l2 = Math.max(0, tr - df), ang = Math.atan2(l1 - a, b) * 180 / Math.PI;
          svgs.push(`<ellipse cx="${f2(c[0])}" cy="${f2(c[1])}" rx="${f2(Math.sqrt(l1))}" ry="${f2(Math.sqrt(l2))}" transform="rotate(${f2(b === 0 && a >= d ? 0 : b === 0 ? 90 : ang)} ${f2(c[0])} ${f2(c[1])})"/>`);
          const R = Math.sqrt(l1); all.push([c[0]-R, c[1]-R], [c[0]+R, c[1]+R]);
          for (const v of sh.ax) for (const sg of [-1, 1]) pts3.push(sh.c.map((x, i) => x + v[i] * sg)); pts3.push(sh.c);
        } else {
          const sp = smooth3(sh.pts), N = sp.length, q = sp.map(p => Pj(...p)), rr = sp.map((_, i) => (sh.r0 + (sh.r1 - sh.r0) * i / (N - 1)) * PS), Lp = [], Rp = [];
          q.forEach((p, i) => { const a = q[Math.max(0, i-1)], b = q[Math.min(N-1, i+1)], dx = b[0]-a[0], dy = b[1]-a[1], l = Math.hypot(dx, dy) || 1;
            Lp.push([p[0] - dy/l*rr[i], p[1] + dx/l*rr[i]]); Rp.push([p[0] + dy/l*rr[i], p[1] - dx/l*rr[i]]); });
          svgs.push(`<path d="${dpath(Lp.concat(Rp.reverse()))}"/>`);
          for (const i of [0, N - 1]) svgs.push(`<circle cx="${f2(q[i][0])}" cy="${f2(q[i][1])}" r="${f2(rr[i])}"/>`);
          q.forEach((p, i) => all.push([p[0]-rr[i], p[1]-rr[i]], [p[0]+rr[i], p[1]+rr[i]]));
          sp.forEach((p, i) => { const r = rr[i] / PS; pts3.push(p); for (const [x, z] of [[r,0],[-r,0],[0,r],[0,-r]]) pts3.push([p[0]+x, p[1], p[2]+z], [p[0], p[1]+r, p[2]], [p[0], p[1]-r, p[2]]); });
        }
      }
      const body = svgs.join('');
      out.push(`<g class="pk"><g class="${pt.ink} pk-o">${body}</g><g class="pk-f">${body}</g>`);
      if (O.dusk && O.lit > 0){
        // lit from above: the top of the piece takes the light at its height, the bottom less
        const top = pts3.reduce((m, p) => p[1] > m[1] ? p : m), bot = pts3.reduce((m, p) => p[1] < m[1] ? p : m);
        const toL = p => { const Lg = lights[0]; return Lg ? v3.sub(Lg.p, p) : [0, 1, 0]; };
        const vt = lightAt(top, toL(top)), vb = lightAt(bot, toL(bot)) * .55;
        if (Math.max(vt, vb) > .015){ const id = `${id0}g${gid++}`, a = Pj(...top), b = Pj(...bot);
          defs.push(`<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${f2(a[0])}" y1="${f2(a[1] - 4)}" x2="${f2(b[0])}" y2="${f2(b[1])}"><stop offset="0" stop-color="${O.light}" stop-opacity="${(vt*O.lit).toFixed(3)}"/><stop offset="1" stop-color="${O.light}" stop-opacity="${(vb*O.lit).toFixed(3)}"/></linearGradient>`);
          out.push(`<g class="pk-l" style="fill:url(#${id})">${body}</g>`); }
      }
      out.push('</g>');
      if (O.dusk && O.shadow > 0) lights.forEach((Lg, li) => { const Lp = Lg.p;
        const pr = pts3.filter(p => p[1] < Lp[1] - .5).map(p => { const s = Lp[1] / (Lp[1] - p[1]); return Pj(Lp[0] + (p[0]-Lp[0])*s, 0, Lp[2] + (p[2]-Lp[2])*s); });
        if (pr.length > 2) shadowPts[li].push(hull(pr)); });
    };
    for (const {pt, cen, d: dP} of prepared){
      if (pt.kind === 'blob'){ blobOut(pt, split && dP > dC ? outF : outB); continue; }
      const {A, Bv} = pt, n = A.length, out = split && dP > dC ? outF : outB;
      // normals: caps point away from each other; sides outward (the sign that most of them agree on)
      let c0 = v3.newell(A), c1 = v3.newell(Bv);
      const cA = v3.cen(A), cB = v3.cen(Bv);
      if (v3.dot(c0, v3.sub(cA, cB)) < 0) c0 = c0.map(x => -x); if (v3.dot(c1, v3.sub(cB, cA)) < 0) c1 = c1.map(x => -x);
      const quads = [], sideN = [];
      for (let i = 0; i < n; i++){ const j = (i+1) % n, q = [A[i], A[j], Bv[j], Bv[i]]; quads.push(q); sideN.push(v3.newell(q)); }
      let vote = 0; quads.forEach((q, i) => vote += v3.dot(sideN[i], v3.sub(v3.cen(q), cen)));
      if (vote < 0) sideN.forEach((N, i) => sideN[i] = N.map(x => -x));
      const v0 = !pt.noCaps && vis(c0), v1 = !pt.noCaps && vis(c1), sideVis = sideN.map(vis);
      const faces = [];
      if (v0) faces.push({q: A, n: c0}); if (v1) faces.push({q: Bv, n: c1});
      quads.forEach((q, i) => { if (sideVis[i]) faces.push({q, n: sideN[i]}); });
      faces.sort((a, b) => depth(...v3.cen(a.q)) - depth(...v3.cen(b.q)));
      for (const f of faces){
        const sp = f.q.map(p => Pj(...p)); sp.forEach(p => all.push(p)); const dd = dpath(sp);
        out.push(`<path class="f" d="${dd}"/>`);
        if (pt.tex && O.tex) out.push(`<path d="${dd}" style="fill:url(#${id0}${pt.tex});stroke:none"/>`);
        if (O.dusk && O.lit > 0){
          const vs = f.q.map(p => lightAt(p, f.n)), mx = Math.max(...vs), mn = Math.min(...vs);
          if (mx > .015){ const iM = vs.indexOf(mx), im = vs.indexOf(mn), id = `${id0}g${gid++}`;
            if (mx - mn > .03 && Math.hypot(sp[iM][0]-sp[im][0], sp[iM][1]-sp[im][1]) > .5){
              defs.push(`<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${f2(sp[iM][0])}" y1="${f2(sp[iM][1])}" x2="${f2(sp[im][0])}" y2="${f2(sp[im][1])}"><stop offset="0" stop-color="${O.light}" stop-opacity="${(mx*O.lit).toFixed(3)}"/><stop offset="1" stop-color="${O.light}" stop-opacity="${(mn*O.lit).toFixed(3)}"/></linearGradient>`);
              out.push(`<path d="${dd}" style="fill:url(#${id});stroke:none"/>`);
            } else out.push(`<path d="${dd}" style="fill:${O.light};fill-opacity:${(mx*O.lit).toFixed(3)};stroke:none"/>`);
          }
        }
      }
      // lines: the cap outline where the cap or that side shows, and the long edges at creases / silhouettes
      const seg = (p, q) => `M${Pj(...p).map(f2).join(' ')}L${Pj(...q).map(f2).join(' ')}`;
      let d = '';
      for (let i = 0; i < n; i++){ const j = (i+1) % n;
        if (!pt.noCaps){ if (v0 || sideVis[i]) d += seg(A[i], A[j]); if (v1 || sideVis[i]) d += seg(Bv[i], Bv[j]); }
        const h = (i - 1 + n) % n, a = sideN[h], b = sideN[i], cosA = v3.dot(a, b) / ((Math.hypot(...a) * Math.hypot(...b)) || 1);
        if ((sideVis[h] || sideVis[i]) && (sideVis[h] !== sideVis[i] || cosA < .87)) d += seg(A[i], Bv[i]); }
      for (const [p, q] of (pt.lines || [])) d += seg(p, q);
      out.push(`<path class="${pt.ink}" d="${d}"/>`);
      // shadow: every corner thrown from the bulb onto the ground
      if (O.dusk && O.shadow > 0) lights.forEach((Lg, li) => { const Lp = Lg.p;
        const pr = A.concat(Bv).filter(p => p[1] < Lp[1] - .5).map(p => { const s = Lp[1] / (Lp[1] - p[1]); return Pj(Lp[0] + (p[0]-Lp[0])*s, 0, Lp[2] + (p[2]-Lp[2])*s); });
        if (pr.length > 2) shadowPts[li].push(hull(pr)); });
    }
    // shadows only where that lamp's light reaches: a soft radial mask around its pool
    let sh = '';
    if (O.dusk && O.shadow > 0) lights.forEach((Lg, li) => { if (!shadowPts[li].length) return;
      const c = Pj(Lg.g[0], 0, Lg.g[1]), r = Lg.gr * 2.4, rx = r * C * Math.SQRT2, ry = r * S * Math.SQRT2, id = `${id0}m${li}`;
      defs.push(`<radialGradient id="${id}r"><stop offset=".35" stop-color="#fff"/><stop offset="1" stop-color="#000"/></radialGradient><mask id="${id}" maskUnits="userSpaceOnUse" x="${f2(c[0]-rx)}" y="${f2(c[1]-ry)}" width="${f2(rx*2)}" height="${f2(ry*2)}"><ellipse cx="${f2(c[0])}" cy="${f2(c[1])}" rx="${f2(rx)}" ry="${f2(ry)}" fill="url(#${id}r)"/></mask>`);
      sh += `<g mask="url(#${id})"><g style="opacity:${O.shadow}">${shadowPts[li].map(q => `<path d="${dpath(q)}" style="fill:#020816;stroke:none"/>`).join('')}</g></g>`;
      });   // shadows don't count toward the bounds, so the drawing keeps its size and place in day and dusk
    const xs = all.map(p => p[0]), ys = all.map(p => p[1]);
    return { svg: outB.join(''), front: outF.join(''), shadow: sh, defs: defs.join(''), depth: dC, split,
      minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
  }
  // screen drag → ground move (inverse of the iso projection on y = 0)
  const unproject = (dx, dy) => [(dx / C + dy / S) / 2, (dy / S - dx / C) / 2];
  // a style's bench(es), split into what goes behind the lamp and what goes in front of it
  function build(style, B, lights, O = {}){
    let list;
    if (style === 'double'){
      // one bench under each head, facing the pole, a little past the middle of its pool
      list = lights.map((Lg, i) => { const gl = Math.hypot(Lg.g[0], Lg.g[1]) || 1, aw = [Lg.g[0] / gl, Lg.g[1] / gl];
        const R = Math.atan2(-aw[1], -aw[0]) + B.rot * Math.PI / 180, cr = Math.cos(R), sr = Math.sin(R), k = B.scale;
        const cx = Lg.g[0] + aw[0] * B.off, cz = Lg.g[1] + aw[1] * B.off;
        const x = cx - (cr * B.depth / 2 - sr * B.len / 2) * k, z = cz - (sr * B.depth / 2 + cr * B.len / 2) * k;
        return make('single', {...B, x, z, rot: R * 180 / Math.PI}, lights, {...O, id: (O.id || 'b') + i, person: O.person && i === 0, hat: O.hat && i === 0}); });
    } else list = [make(style, B, lights, O)];
    const r = {behind: '', front: '', shadow: '', defs: '', minX: 1e9, minY: 1e9, maxX: -1e9, maxY: -1e9};
    for (const b of list){
      if (b.split){ r.behind += b.svg; r.front += b.front; } else if (b.depth > 0) r.front += b.svg; else r.behind += b.svg;
      r.shadow += b.shadow; r.defs += b.defs; r.minX = Math.min(r.minX, b.minX); r.minY = Math.min(r.minY, b.minY); r.maxX = Math.max(r.maxX, b.maxX); r.maxY = Math.max(r.maxY, b.maxY);
    }
    return r;
  }
  return { DEF, LOOK, make, build, unproject };
})();
// ---------------- moths: at dusk a few of them circle each bulb — loops, sudden darts at the light, a short trail ----------------
const Moths = (function(){
  const still = (() => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch(e){ return false; } })();
  function attach(box, getSvg){
    const cv = document.createElement('canvas'); cv.className = 'moths'; box.appendChild(cv);
    const ctx = cv.getContext('2d'); let raf = 0, M = [], t0 = 0;
    const bulbs = () => { const svg = getSvg(); if (!svg) return []; const a = box.getBoundingClientRect(), m = svg.getScreenCTM(), k = m ? Math.hypot(m.a, m.b) : 1;
      return [...svg.querySelectorAll('.glow .bulb, .glow .rim')].filter(e => !e.closest('.lit-ov')).map(e => { const r = e.getBoundingClientRect(); return [r.left + r.width / 2 - a.left, r.top + r.height / 2 - a.top, k]; }); };
    function frame(now){
      raf = requestAnimationFrame(frame);
      const a = box.getBoundingClientRect(), dpr = devicePixelRatio || 1, W = Math.round(a.width * dpr), H = Math.round(a.height * dpr);
      if (cv.width !== W || cv.height !== H){ cv.width = W; cv.height = H; }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, a.width, a.height);
      const B = bulbs(); if (!B.length) return; const t = (now - t0) / 1000, fade = Math.min(1, t / 1.6);
      for (const m of M){
        const b = B[m.i % B.length], k = b[2];
        const pos = tt => { const dart = Math.pow(Math.max(0, Math.sin(tt * m.f3 + m.p3)), 14);   // now and then: straight at the light
          const r = m.r * k * (1 + .35 * Math.sin(tt * m.f1 + m.p1)) * (1 - .85 * dart), an = m.a0 + tt * m.w + .9 * Math.sin(tt * m.f2 + m.p2);
          return [b[0] + Math.cos(an) * r * 1.25 + Math.sin(tt * 7.3 + m.p1) * .6 * k, b[1] + m.dy * k + Math.sin(an) * r * .75 + Math.cos(tt * 6.1 + m.p2) * .6 * k]; };
        const p = pos(t);
        ctx.strokeStyle = `rgba(255,224,163,${(.14 * fade).toFixed(3)})`; ctx.lineWidth = .5; ctx.beginPath();
        for (let j = 0; j <= 6; j++){ const q = pos(t - j * .022); j ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); } ctx.stroke();
        const flap = .55 + .45 * Math.abs(Math.sin(t * m.flap)), s = Math.max(.65, .4 * k) * m.s;
        ctx.fillStyle = `rgba(255,236,205,${(.95 * fade).toFixed(3)})`; ctx.beginPath(); ctx.ellipse(p[0], p[1], s * (1 + flap), s * .8, 0, 0, Math.PI * 2); ctx.fill();
      }
    }
    return {
      start(per = 4){ if (still || raf) return; const n = Math.max(1, bulbs().length) * per, R = Math.random;
        M = Array.from({length: n}, (_, i) => ({i, r: 8 + R() * 16, w: (R() < .5 ? -1 : 1) * (1.4 + R() * 2.2), a0: R() * 6.3, dy: 2 + R() * 4, s: .8 + R() * .5, flap: 26 + R() * 18,
          f1: .7 + R() * 1.4, p1: R() * 6.3, f2: 1.1 + R() * 2, p2: R() * 6.3, f3: .25 + R() * .4, p3: R() * 6.3}));
        if (!raf){ t0 = performance.now(); raf = requestAnimationFrame(frame); } },
      stop(){ cancelAnimationFrame(raf); raf = 0; M = []; ctx.clearRect(0, 0, cv.width, cv.height); },
    };
  }
  return { attach };
})();

// ---------------- the art: a lamp + its bench (the sets from the Lamps page); a small switcher swaps the set ----------------
const SETS = ['cobra', 'classic', 'mushroom', 'double', 'post'];
const ROT = {double: 90};
const COBRA = {heads:1, baseH:54, baseR:3.2, pole:165, poleR:2.3, taper:.7, capR:1.8, arm:28, armRise:1.2, armGap:1.8, head:19, headW:4.5, headH:3.5, headPos:0};
// the lamps / benches as tuned on the Lamps page (same site, same storage), else their defaults
let SAVED = {}; try { SAVED = JSON.parse(localStorage.getItem('lamp-params-v5') || '{}') || {}; } catch(e){}
const G = {rays: 6, pool: 1.2, benchLit: 1, benchShadow: .6, ...(SAVED.G || {})};
// the set follows the lamp chosen on the home page (the same one Playground uses); cobra if that lamp has no set
let SET = 'cobra'; try { const v = sessionStorage.getItem('sl-lamp'); if (SETS.includes(v)) SET = v; } catch(e){}   // set on the home page when a lamp is picked
const isDusk = () => document.documentElement.dataset.theme === 'dusk';
function draw(){
  const s = SET, lp = {rot: ROT[s] || 0, ...LampKit2.DEF[s], ...(s === 'cobra' ? COBRA : {}), ...((SAVED.P || {})[s] || {})};
  const bp = {...BenchKit.DEF[s], ...((SAVED.B || {})[s] || {})};
  const d = LampKit2.make(s, (G.angle || 0) + (lp.rot || 0), {...lp, rays: G.rays, pool: G.pool});
  const b = BenchKit.build(s, bp, d.lights, {dusk: isDusk(), lit: G.benchLit, shadow: G.benchShadow, light: '#f09800', id: 'ab', hat: false});
  const lamp = `<g id="lampHit" style="cursor:pointer">${d.svg}</g>`;
  const m = 29, minX = Math.min(d.minX, b.minX) - m, minY = Math.min(d.minY, b.minY) - m, maxX = Math.max(d.minX + d.w, b.maxX) + m, maxY = Math.max(d.minY + d.h, b.maxY) + m;
  const svg = document.getElementById('art');
  svg.setAttribute('viewBox', `${minX.toFixed(2)} ${minY.toFixed(2)} ${(maxX - minX).toFixed(2)} ${(maxY - minY).toFixed(2)}`);
  svg.innerHTML = `<defs>${b.defs}</defs><g class="bsh">${b.shadow}</g><g class="bench">${b.behind}</g>${lamp}<g class="bench">${b.front}</g>`;
  if (typeof applyDrop === 'function') applyDrop();
}
draw();
// the lamp is the light switch, like on the home page: click → dusk / light, spreading from the bulb
document.getElementById('art').addEventListener('click', e => { if (!e.target.closest('#lampHit')) return;
  const svg = document.getElementById('art'), b = svg.querySelector('.bulb'), r = (b || svg).getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
  if (window.slSetTheme){ window.slSetTheme(document.documentElement.dataset.theme !== 'dusk', x, y); return; }
  const R = document.documentElement; if (R.dataset.theme === 'dusk') delete R.dataset.theme; else R.dataset.theme = 'dusk'; });
// dusk: the lamp gets the same light as every lamp on the site (the home page's renderer, cobra profile), painted into canvases beside it
let LIT = null, litT;
function light(){
  const svg = document.getElementById('art'), box = svg.parentNode;
  const API = window.duskLightAPI;
  (LIT || []).forEach(c => c.remove()); LIT = null; if (API) API.clear(svg);
  if (document.documentElement.dataset.theme !== 'dusk' || !API) return;
  const r = API.render(svg, SET); if (!r) return;
  const a = box.getBoundingClientRect();
  LIT = [r.shad, r.beam, r.front].map((cv, k) => { cv.className = 'lit-c';
    Object.assign(cv.style, {left: (r.box.x - a.left) + 'px', top: (r.box.y - a.top) + 'px', width: r.box.w + 'px', height: r.box.h + 'px', zIndex: k === 2 ? 2 : 0});
    if (k) cv.style.mixBlendMode = r.blend || 'screen'; box.appendChild(cv); return cv; });
}
const relight = () => { clearTimeout(litT); litT = setTimeout(() => requestAnimationFrame(light), 60); };
// day: crosshairs over the bulbs (screen-sized, like the home page's)
function aims(){ const box = document.querySelector('.ab-art'), a = box.getBoundingClientRect(); box.querySelectorAll('.ab-aim').forEach(e => e.remove());
  document.querySelectorAll('#art .glow .bulb').forEach(b => { const r = b.getBoundingClientRect(), d = document.createElement('div'); d.className = 'ab-aim';
    d.style.left = (r.left + r.width / 2 - a.left) + 'px'; d.style.top = (r.top + r.height / 2 - a.top) + 'px';
    d.innerHTML = '<svg viewBox="-14 -14 28 28" width="28" height="28"><circle r="7"/><line x1="-13" y1="0" x2="13" y2="0"/><line x1="0" y1="-13" x2="0" y2="13"/></svg>'; box.appendChild(d); }); }
const reaim = () => requestAnimationFrame(aims); reaim(); addEventListener('resize', reaim); if (document.fonts) document.fonts.ready.then(reaim);
// entrance: the lamp drops into place (100–200px, fading in), then the bench; the light, moths and crosshair come after.
// The drawing can be rebuilt mid-drop (theme sync, fonts): applyDrop() is also called after every draw and picks up where it was.
var DROP = null;   // var: draw() runs before this line
function applyDrop(){
  if (!DROP) return; const t = performance.now() - DROP.t0; if (t > 1250) return;
  const svg = document.getElementById('art'), m = svg.getScreenCTM(), k = m ? Math.hypot(m.a, m.b) : 1;
  const fall = (els, delay, px) => els.forEach(e => { const d = px / k;
    const a = e.animate([{transform: `translateY(${-d}px)`, opacity: 0, offset: 0}, {opacity: 1, offset: .55}, {transform: 'translateY(0px)', opacity: 1, offset: 1}], {duration: 760, delay, fill: 'backwards', easing: 'cubic-bezier(.2,.75,.25,1)'});
    a.currentTime = t; });
  fall([...svg.querySelectorAll(':scope > #lampHit')], 0, DROP.dl);
  fall([...svg.querySelectorAll(':scope > .bench, :scope > .bsh')], 380, DROP.db);
}
{ const box = document.querySelector('.ab-art'); box.classList.add('pre'); let done = false;
  const still = (() => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch(e){ return false; } })();
  const drop = () => { box.classList.remove('pre'); if (still) return; box.classList.add('dropping');
    DROP = {t0: performance.now(), dl: 100 + Math.random() * 100, db: 100 + Math.random() * 100}; applyDrop();
    setTimeout(() => { box.classList.remove('dropping'); DROP = null; }, 1250); };
  const io = new IntersectionObserver(es => { if (!done && es.some(e => e.isIntersecting)){ done = true; io.disconnect();
    // wait for the page to be fully in (fonts, the layer fading in over home), so the drop is actually seen
    const go = () => setTimeout(() => requestAnimationFrame(drop), 200);
    if (document.readyState === 'complete') go(); else addEventListener('load', go, {once: true}); } }, {threshold: .3});
  io.observe(box); }
const MO = Moths.attach(document.querySelector('.ab-art'), () => document.getElementById('art'));
const syncMoths = (re) => { if (re) MO.stop(); isDusk() ? MO.start(3) : MO.stop(); };
syncMoths();
new MutationObserver(() => { draw(); relight(); syncMoths(); }).observe(document.documentElement, {attributes: true, attributeFilter: ['data-theme']});
addEventListener('resize', relight);
if (document.fonts) document.fonts.ready.then(relight); addEventListener('load', relight); relight();
}
// "Filament" (after Codrops Text Character Animations #16), with the values tuned in filament-tuner.html
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches){ document.documentElement.classList.remove('sl-enter'); return; }
  const P = {"timing": {"dur": 600, "letter": 10, "line": 0, "order": "lines", "textGap": 0}, "heat": {"hot": 0.68, "cool": 0.4, "redAt": 0.84, "gStart": 0, "gEnd": 0.02, "bStart": 0, "bEnd": 0.11, "gMax": 0, "bMax": 0}, "halo": {"halo": 0.1, "inner": 0.45, "outer": 0.7, "innerA": 0.32, "outerA": 0.7}, "flicker": {"share": 0.57, "depthMin": 0.55, "depthMax": 0.85, "dips": 3}};
  const SEL = '.ab-in .idx, .ab-in h1, .ab-in .sub, .ab-in .lbl, .svc-line p, .svc-line small';
  const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a || 1e-6))); return t * t * (3 - 2 * t); };
  const H = P.heat, G = P.halo, T = P.timing, F = P.flicker;
  const glow = h => [ss(0, H.redAt, h), H.gMax * ss(H.gStart, H.gEnd, h), H.bMax * ss(H.bStart, H.bEnd, h)];
  // dusk theme: the same curve, but the hot light is our dusk orange (lighter) and it cools into the dusk text colour (white)
  const DUSK_HOT = [253, 189, 78];   // #fdbd4e — the dusk accent (as on the live site)
  // the page's own theme is synced from the site a moment after load: ask the site too, so the very first glow is already dusk orange
  const dusk = () => { if (document.documentElement.dataset.theme === 'dusk') return true; try { return window.parent !== window && window.parent.document.documentElement.dataset.theme === 'dusk'; } catch(e){ return false; } };
  const frames = (ink, flick) => { const out = [], dk = dusk();
    for (let i = 0; i <= 40; i++){ const t = i / 40, heat = ss(0, H.hot, t), cool = ss(H.cool, 1, t);
      let f = 1; if (flick) flick.forEach(([at, d]) => f -= d * (1 - ss(0, .022, Math.abs(t - at)))); f = Math.max(f, 0);
      const g = glow(heat).map(v => v * f), a = Math.max(...g), hot = a > 0 ? (dk ? DUSK_HOT : g.map(v => v / a * 255)) : [0, 0, 0];
      const col = hot.map((v, j) => Math.round(v + (ink[j] - v) * cool)), al = a + (1 - a) * cool;
      const halo = Math.min(1, heat * heat * (1 - cool) * f * G.halo), hc = dk ? DUSK_HOT : glow(heat).map(v => Math.round(Math.min(1, v) * 255));
      out.push({offset: t, color: `rgba(${col.join(',')},${al.toFixed(3)})`,
        textShadow: `0 0 ${G.inner}em rgba(${hc.join(',')},${(halo * G.innerA).toFixed(3)}), 0 0 ${G.outer}em rgba(${hc.join(',')},${(halo * G.outerA).toFixed(3)})`}); }
    return out; };
  const wrap = el => { const chars = []; const walk = n => [...n.childNodes].forEach(c => {
      if (c.nodeType === 3){ const f = document.createDocumentFragment();
        c.textContent.split(/(\s+)/).forEach(w => { if (!w) return; if (/^\s+$/.test(w)){ f.append(w); return; }
          const ws = document.createElement('span'); ws.style.whiteSpace = 'nowrap';
          for (const ch of w){ const s = document.createElement('span'); s.className = 'fl'; s.textContent = ch; ws.append(s); chars.push(s); } f.append(ws); });
        c.replaceWith(f); }
      else if (c.nodeType === 1 && c.tagName !== 'BUTTON') walk(c); });
    walk(el); return chars; };
  const lines = chars => { const L = []; let top = null; chars.forEach(c => { const y = Math.round(c.getBoundingClientRect().top);
      if (top === null || Math.abs(y - top) > 4){ L.push([]); top = y; } L[L.length - 1].push(c); }); return L; };
  let free = 0;   // texts entering together follow one another
  let START = null; const BLKS = [...document.querySelectorAll('.ab-in .blk')];
  const secOf = el => el.closest('h1, .idx') ? 0 : el.closest('.blk') ? 2 + Math.max(0, BLKS.indexOf(el.closest('.blk'))) : el.closest('.sub, p') ? 1 : 2;
  const play = el => { const ink = (getComputedStyle(el).color.match(/\d+/g) || [27, 27, 27]).slice(0, 3).map(Number), now = performance.now(), t0 = Math.max(0, (START ??= now) + secOf(el) * 260 - now);   // by part: title, then the text, then each block after it
    const L = lines(el._chars);
    L.forEach((line, li) => line.forEach((c, i) => {
      const r = Math.abs(Math.sin((li * 31 + i + el._n * 97) * 12.9898) * 43758.5453) % 1;
      const flick = r < F.share ? Array.from({length: Math.max(1, r < F.share / 2 ? F.dips - 1 : F.dips)}, (_, k) => [.07 + .085 * k + .03 * ((r * 7 + k * .37) % 1), F.depthMin + (F.depthMax - F.depthMin) * ((r * 13 + k * .61) % 1)]) : null;
      const own = (getComputedStyle(c.parentElement).color.match(/\d+/g) || ink).slice(0, 3).map(Number);   // e.g. the award counts cool into the accent
      c.animate(frames(own, flick), {duration: T.dur, delay: t0 + li * T.line + i * T.letter, fill: 'both'}).finished.then(() => { c.getAnimations().forEach(a => a.cancel()); c.style.color = ''; });
    }));
    free = now + t0 + L.length * T.line + T.textGap; };
  const els = [...document.querySelectorAll(SEL)];
  els.forEach((el, n) => { el._n = n; el._chars = wrap(el); el._chars.forEach(c => c.style.color = 'transparent'); });
  document.documentElement.classList.remove('sl-enter');   // the text is hidden letter by letter now: show the page
  const io = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; io.unobserve(e.target); play(e.target); }), {threshold: .2});
  els.forEach(el => io.observe(el));
})();
  { const b = document.querySelector('.cl-all'), L = document.getElementById('clList');
    const box = document.getElementById('clBox'), A = box.querySelector('.cl-a'), ease = 'cubic-bezier(.65,0,.35,1)'; let busy = false;
    // swap in three calm steps: the shown part fades out → the frame glides to the new height → the new part fades in
    const swap = async (from, to) => {
      busy = true;
      await from.animate([{opacity: 1}, {opacity: 0}], {duration: 220, easing: 'ease-out', fill: 'forwards'}).finished;
      const h0 = box.offsetHeight; from.style.display = 'none'; to.style.display = 'block'; to.style.opacity = 0;
      const h1 = box.offsetHeight; from.getAnimations().forEach(x => x.cancel());
      await box.animate([{height: h0 + 'px'}, {height: h1 + 'px'}], {duration: Math.min(700, 320 + Math.abs(h1 - h0) * .8), easing: ease}).finished;
      await to.animate([{opacity: 0, transform: 'translateY(6px)'}, {opacity: 1, transform: 'none'}], {duration: 320, easing: 'ease-out', fill: 'forwards'}).finished;
      to.style.opacity = ''; to.getAnimations().forEach(x => x.cancel()); busy = false; };
    b.addEventListener('click', () => { if (busy) return; const on = b.getAttribute('aria-expanded') !== 'true';
      b.setAttribute('aria-expanded', on); on ? swap(A, L) : swap(L, A); }); }
  const C = ["Amazon", "Taboola", "Aisap", "Second Nature", "Kovrr", "Superwise", "Showdigs", "Commcrete", "Cyber-Ridge", "Chiral Energy", "Kayma", "Content Lab", "Cognit", "Traffilog", "Buildin", "B-summit", "N1 Agency", "Ecsite", "National Library of Israel", "SPNI", "Davidson Institute", "SpaceIL", "TALI Foundation", "Bloomfield Science Museum"], slots = [...document.querySelectorAll('.strip .slot')]; let next = slots.length, k = 0;
  // all five roll to the next five names at once
  setInterval(() => { slots.forEach(slot => { const old = slot.querySelector('.lg'), nu = document.createElement('span');
      nu.className = 'lg in'; nu.textContent = C[next++ % C.length]; slot.appendChild(nu);
      requestAnimationFrame(() => requestAnimationFrame(() => { old.classList.add('out'); nu.classList.remove('in'); })); setTimeout(() => old.remove(), 700); }); }, 3000);