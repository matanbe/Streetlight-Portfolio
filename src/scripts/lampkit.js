// LampKit2: the isometric street lamps (shared by the home page and the 404)
export const LampKit2 = (function(){
  const C = Math.cos(Math.PI/6), S = .5;
  const Pj = (x,y,z)=>[(x - z)*C, (x + z)*S - y];
  const STYLES = ['cobra','classic','mushroom','double','post','globe','ornate'];
  const DEF = {
    classic:  {pole:170, arm:41, lantern:13, lanternW:6, roof:11},
    mushroom: {mast:161, mastR:2.5, dome:17, domeH:9},
    cobra:    {heads:1, baseH:54, baseR:3.2, pole:165, poleR:2.3, arm:28, head:19, headW:4.5, headH:3.5},
    double:   {heads:2, pole:173, arm:49, armR:1.5, rise:15, shade:7},
    post:     {post:135, lantern:22, lanternW:7, roof:12.5},
    globe:    {mast:154, split:.36, lowR:2.8, upR:2, lean:0, ball:12},
    ornate:   {arms:2, post:140, arm:40, urn:7.6},
  };
  const COMMON = {rays:6, pool:1};
  const dirs8 = (dd, pp) => { const k = Math.SQRT1_2, a = [(dd[0]+pp[0])*k, (dd[1]+pp[1])*k], b = [(dd[0]-pp[0])*k, (dd[1]-pp[1])*k], n = v => [-v[0], -v[1]];
    return [dd, n(dd), pp, n(pp), a, n(a), b, n(b)]; };
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
      const H = P.pole, s0 = P.arm - 1, s1 = s0 + P.head, w = P.headW, y1 = H + 1.5, y0 = y1 - P.headH;
      part(0, ()=>{ cyl(0,0,P.baseR,0,P.baseH); frustum(0,0,P.poleR,P.baseH,P.poleR*.7,H,'lo'); cyl(0,0,1.8,H,H+2.5); });
      // 1–8 heads, around the pole: one, its opposite, the perpendicular pair, then the diagonals
      for (const D of dirs8(dd, pp).slice(0, Math.round(P.heads))){
        const Dp = [-D[1], D[0]], Dn = [-D[0], -D[1]], [ox,,oz] = along((s0+s1)/2, 0, D);
        part(depthOf(D,20), ()=>{
          line(curve(t=>along(1.5+t*P.arm, H+1.6+t*1.2, D), 8)); line(curve(t=>along(1.5+t*P.arm, H-.2+t*1.2, D), 8));
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
    return { svg: out.join(''), minX, minY, w: maxX-minX, h: maxY-minY };
  }
  return { STYLES, DEF, COMMON, make };
})();
