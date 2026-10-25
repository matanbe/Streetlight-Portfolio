// Dusk: the sky (gradient + vignette + grain on one canvas) and the lamps' real light — the Dusk tests page's maths.
// The home page runs it for its big lamp; other pages (the playground) use window.duskLightAPI.render() for theirs.
export function initDuskLight(){
  if (window.__duskInit) return; window.__duskInit = true;   // once per page

  const root = document.documentElement, lampSvg = document.getElementById('lamp') || Object.assign(document.createElementNS('http://www.w3.org/2000/svg', 'svg'), {}), noHomeLamp = !document.getElementById('lamp');
  if (noHomeLamp) lampSvg.style.display = 'none';   // pages without the home lamp: sky + render() only
  const KEY = 'dusk-tests-v1';
  // defaults = the Dusk tests page defaults; whatever was saved on that page wins (same origin → same storage)
  const DEF = { light:'#f09800', core:'#ffe0a3', skyTop:'#0b1f3d', skyMid:'#1d4a7a', skyMidAt:58, skyBot:'#0a1a33', vig:.55, grain:.06, grainSize:.9, grainBlend:'overlay',
    poolR:520, poolA:.32, coneF:14, shape:'cone', coneDir:190, coneW:56, lampSize:460,
    beamOn:1, beamLen:620, beamStartW:34, beamStartOff:-4, beamA:.42, beamGamma:1.4, beamFeather:14, coreW:.38, coreA:.35, beamBlend:'screen',
    floorA:.18, floorAt:1, floorSize:1, floorFlat:.32, floorSoft:0, floorX:0, lampLit:.75, lampLitR:1.2, lampLitSide:.5,
    ground:'lamp base', endFade:.45, beamFront:.28, lampBounce:.55, lampSpill:.15, poolOn:1, headBlock:0,
    baseH:.2, baseLit:.35, baseFall:.5, baseSide:.5, baseBounce:.5, shX:0, shZ:0, shA:.55, shLen:280, shW:12, shSoft:8, shDir:0, shCut:.85, shBase:.5,
    tStr:.85, tGamma:1.6, reach:620 };
  const ENV = ['light', 'core', 'skyTop', 'skyMid', 'skyMidAt', 'skyBot', 'vig', 'grain', 'grainSize', 'grainBlend', 'tStr', 'tGamma', 'reach'];
  const LAMP_KEYS = Object.keys(DEF).filter(k => !ENV.includes(k));
  const SPREAD = { poolR:300, poolA:.18, shape:'spread', beamLen:360, beamA:.3, beamFeather:18, coreW:.3, coreA:.3, floorA:.2, floorSize:1, floorFlat:.32, lampLitR:.9, lampSpill:0, beamFront:.15, shLen:160, shA:.45 };
  // Matan's tuned profiles (from Dusk tests screenshots)
  const STYLE_DEF = { cobra:{ lampSize:540, headBlock:1, shape:'cone', coneDir:181, coneW:33, beamStartW:21, beamStartOff:-4, beamLen:440, beamA:1, beamGamma:1.65, beamFeather:21, coreW:.33, coreA:.33, poolOn:0, ground:'lamp base', floorAt:1, endFade:.45, poolA:.32, poolR:520, coneF:14, lampLit:.91, lampLitR:1.36, lampLitSide:.5, lampSpill:.28, beamFront:.28, baseH:.2, baseLit:.35, baseFall:.5, baseSide:.5, shA:.79, shLen:180, shW:19, shSoft:10, shDir:0, shX:-1, shZ:-2, shBase:.13 }, classic:{ coneW:70, baseH:.22 }, mushroom:{ coneW:110, beamStartW:60 }, double:{}, post:{ ...SPREAD }, globe:{ ...SPREAD, beamLen:420 } };
  let SV = {};
  // grain can also be set from the home page's dusk palette panel (overrides the test page)
  let GRAIN = null;
  addEventListener('skygrain', e => { GRAIN = e.detail; paintSky(); });
  window.duskSkyGrain = () => { const Q = cfg('cobra'); return { grain: Q.grain, grainSize: Q.grainSize }; };
  const load = () => { try { SV = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch(e){ SV = {}; } };
  load();
  // settings for one lamp style: the environment from the page, the light from that lamp's own profile
  const cfgCache = {};
  function cfg(st){
    if (cfgCache[st]) return cfgCache[st];
    const Q = { ...DEF };
    ENV.forEach(k => { if (k in SV) Q[k] = SV[k]; });
    Object.assign(Q, STYLE_DEF[st] || {}, ((SV.profiles || {})[st]) || (SV.lampStyle === st ? Object.fromEntries(LAMP_KEYS.filter(k => k in SV).map(k => [k, SV[k]])) : {}));
    if (Q.shape === 'circle') Q.shape = 'spread';
    return cfgCache[st] = Q;
  }
  addEventListener('storage', e => { if (e.key === KEY){ load(); for (const k in cfgCache) delete cfgCache[k]; env(); dirty = true; } });

  // ---- layers ----
  const sky = document.createElement('div'); sky.id = 'duskSky';
  // the sky is painted once into one flat canvas (gradient + vignette + grain) — a single cheap layer; only the glow moves
  sky.innerHTML = '<canvas class="sk"></canvas><div class="glow"></div>';
  document.body.prepend(sky);
  const mk = id => { const c = document.createElement('canvas'); c.id = id; c.className = 'dsk-c'; document.body.appendChild(c); return [c, c.getContext('2d')]; };
  const [sc, sx] = mk('dskShad'), [bc, bx] = mk('dskBeam'), [bf, fx] = mk('dskFront');
  const off = document.createElement('canvas'), ox = off.getContext('2d');
  const hexRGB = h => [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16)).join(',');
  function env(){
    const Q = cfg('cobra'), s = root.style;
    s.setProperty('--sky-top', Q.skyTop); s.setProperty('--sky-mid', Q.skyMid); s.setProperty('--sky-mid-at', Q.skyMidAt + '%'); s.setProperty('--sky-bot', Q.skyBot);
    s.setProperty('--sky-light', hexRGB(Q.light));
    paintSky();
  }
  function paintSky(){
    const Q = { ...cfg('cobra'), ...(GRAIN || {}) }, cv = sky.querySelector('.sk'), W = innerWidth, H = innerHeight, d = Math.min(2, devicePixelRatio || 1);
    cv.width = Math.round(W * d); cv.height = Math.round(H * d); const c = cv.getContext('2d'); c.setTransform(d, 0, 0, d, 0, 0);
    const lg = c.createLinearGradient(0, 0, 0, H); lg.addColorStop(0, Q.skyTop); lg.addColorStop(Q.skyMidAt / 100, Q.skyMid); lg.addColorStop(1, Q.skyBot);
    c.fillStyle = lg; c.fillRect(0, 0, W, H);
    // vignette: same shape as the test page (120% × 90% ellipse at 50% 40%, clear to 55%)
    c.save(); c.translate(W * .5, H * .4); c.scale(1.2 * W / Math.max(W, H), .9 * H / Math.max(W, H));
    const R = Math.max(W, H) * .75, vg = c.createRadialGradient(0, 0, 0, 0, 0, R);
    vg.addColorStop(0, 'rgba(0,6,20,0)'); vg.addColorStop(.55, 'rgba(0,6,20,0)'); vg.addColorStop(1, `rgba(0,6,20,${Q.vig})`);
    c.fillStyle = vg; c.fillRect(-W * 2, -H * 2, W * 4, H * 4); c.restore();
    if (Q.grain > 0){   // grain: a noise tile, coarser as grainSize goes up
      const T = 256, t = document.createElement('canvas'); t.width = t.height = T; const tc = t.getContext('2d'), im = tc.createImageData(T, T);
      for (let i = 0; i < im.data.length; i += 4){ const v = Math.random() * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; }
      tc.putImageData(im, 0, 0);
      c.save(); c.globalAlpha = Q.grain; c.globalCompositeOperation = ['overlay', 'soft-light', 'screen', 'multiply'].includes(Q.grainBlend) ? Q.grainBlend : 'source-over';
      const sc2 = Math.max(.35, Q.grainSize) / d; c.setTransform(d * sc2, 0, 0, d * sc2, 0, 0);
      c.fillStyle = c.createPattern(t, 'repeat'); c.fillRect(0, 0, W / sc2, H / sc2); c.restore();
    }
  }
  addEventListener('resize', () => paintSky());
  env();

  // ---- the lamp: every drawn lamp group (two of them mid-morph), its heads, ground points and base ----
  function lamps(root = lampSvg){
    const out = [];
    root.querySelectorAll('.glow').forEach(glow => {
      const grp = glow.parentNode, ctm = grp.getScreenCTM(); if (!ctm) return;
      const inv = ctm.inverse(), k = Math.hypot(ctm.a, ctm.b) || 1;
      const toS = p => { const q = new DOMPoint(p[0], p[1]).matrixTransform(ctm); return [q.x, q.y]; };
      const toU = p => { const q = new DOMPoint(p[0], p[1]).matrixTransform(inv); return [q.x, q.y]; };
      const faces = [...grp.querySelectorAll('.f')].filter(e => !e.closest('.lit-ov'));
      const fs = faces.map(e => e.getBBox()); if (!fs.length) return;
      let maxY = -1e9, minY = 1e9; fs.forEach(b => { maxY = Math.max(maxY, b.y + b.height); minY = Math.min(minY, b.y); });
      const low = fs.filter(b => b.y + b.height > maxY - 1.5); let x0 = 1e9, x1 = -1e9; low.forEach(b => { x0 = Math.min(x0, b.x); x1 = Math.max(x1, b.x + b.width); });
      const bulbs = [...glow.querySelectorAll('.bulb, .rim')].map(b => { const r = b.getBBox(); return [r.x + r.width / 2, r.y + r.height / 2]; });
      const rings = [...(grp.querySelector(':scope > .pool') || {children: []}).children];
      const unders = bulbs.map((_, i) => { const r = rings[i * 2]; if (!r) return null; const b = r.getBBox(); return [b.x + b.width / 2, b.y + b.height / 2]; });
      const op = +getComputedStyle(grp).opacity;
      out.push({ grp, faces, fs, toS, toU, k, base: [(x0 + x1) / 2, maxY], top: minY, bulbs, unders, op });
    });
    return out;
  }
  // geometry of one light, screen px. f scales every px setting from the test page's lamp size to this lamp's size
  function geo(Q, f, L, under, base){
    const spread = Q.shape === 'spread';
    const th = (spread ? 180 : Q.coneDir) * Math.PI / 180, d = [Math.sin(th), -Math.cos(th)], n = [Math.cos(th), Math.sin(th)];
    const so = spread ? 0 : Q.beamStartOff * f;
    const S = [L[0] + d[0] * so, L[1] + d[1] * so], len = Q.beamLen * f, tan = Math.tan(Q.coneW / 2 * Math.PI / 180), w0 = Q.beamStartW / 2 * f;
    let G = len * (spread ? .6 : 1);
    if (Q.ground === 'lamp base' && base && d[1] > .05) G = Math.max(20 * f, ((under || base)[1] - S[1]) / d[1]);
    G *= Q.floorAt;
    const C = [S[0] + d[0] * G + Q.floorX * f, S[1] + d[1] * G], wG = w0 + G * tan;
    const rx = Math.max(1, (spread ? len * .45 : wG) * Q.floorSize), ry = Math.max(1, rx * Q.floorFlat);
    return { Q, f, spread, d, n, S, len, tan, w0, G, C, wG, rx, ry, base, under };
  }
  function conePath(c, g, wScale, spreadScale){
    const Q = g.Q, { S, n, C } = g, w0 = g.w0 * wScale, tanS = Math.tan(Q.coneW * spreadScale / 2 * Math.PI / 180);
    const wG = w0 + g.G * tanS, rx = Math.max(1, wG * Q.floorSize), ry = Math.max(1, rx * Q.floorFlat), sgn = n[0] < 0 ? 1 : -1;
    c.beginPath(); c.moveTo(S[0] + n[0] * w0 * sgn, S[1] + n[1] * w0 * sgn); c.lineTo(C[0] - rx, C[1]);
    c.ellipse(C[0], C[1], rx, ry, 0, Math.PI, 0, true); c.lineTo(S[0] - n[0] * w0 * sgn, S[1] - n[1] * w0 * sgn); c.closePath();
  }
  function fall(c, g, rgb, a, reach){ const gr = c.createRadialGradient(g.S[0], g.S[1], 0, g.S[0], g.S[1], Math.max(1, reach));
    for (let i = 0; i <= 10; i++){ const t = i / 10; gr.addColorStop(t, `rgba(${rgb},${(a * Math.pow(1 - t, g.Q.beamGamma)).toFixed(3)})`); } return gr; }
  function paintPool(c, g, rgb){
    const Q = g.Q; if (Q.floorA <= 0 || !+Q.poolOn) return;
    c.save(); c.translate(g.C[0], g.C[1]); c.scale(1, Q.floorFlat);
    const R = g.rx, pg = c.createRadialGradient(0, g.spread ? 0 : -R * .15, 0, 0, 0, R);
    pg.addColorStop(0, `rgba(${rgb},${Q.floorA})`); pg.addColorStop(Math.min(.95, Q.floorSoft), `rgba(${rgb},${Q.floorA})`);
    pg.addColorStop(Math.min(.97, Q.floorSoft + (1 - Q.floorSoft) * .6), `rgba(${rgb},${(Q.floorA * .35).toFixed(3)})`); pg.addColorStop(1, `rgba(${rgb},0)`);
    c.fillStyle = pg; c.beginPath(); c.arc(0, 0, R, 0, Math.PI * 2); c.fill(); c.restore();
  }
  function paintBeam(c, g, mult, withPool){
    const Q = g.Q, rgb = hexRGB(Q.light), core = hexRGB(Q.core), fe = Q.beamFeather * g.f * RS;
    c.filter = fe ? `blur(${fe}px)` : 'none';
    if (g.spread){
      c.fillStyle = fall(c, g, rgb, Q.beamA * mult, g.len); c.beginPath(); c.arc(g.S[0], g.S[1], g.len, 0, Math.PI * 2); c.fill();
      if (Q.coreW > 0 && Q.coreA > 0){ const r = g.len * Q.coreW * .5; c.fillStyle = fall(c, g, core, Q.coreA * mult, r); c.beginPath(); c.arc(g.S[0], g.S[1], r, 0, Math.PI * 2); c.fill(); }
      if (withPool) paintPool(c, g, rgb); c.filter = 'none'; return;
    }
    const reach = Math.max(g.len, g.G * 1.05);
    ox.setTransform(1, 0, 0, 1, 0, 0); ox.clearRect(0, 0, off.width, off.height); ox.setTransform(c.getTransform());
    conePath(ox, g, 1, 1); ox.fillStyle = fall(ox, g, rgb, Q.beamA * mult, reach); ox.fill();
    if (Q.coreW > 0 && Q.coreA > 0){ conePath(ox, g, Q.coreW, Q.coreW); ox.fillStyle = fall(ox, g, core, Q.coreA * mult, reach); ox.fill(); }
    if (Q.endFade > 0){
      const f0 = [g.S[0] + g.d[0] * g.G * (1 - Q.endFade * .6), g.S[1] + g.d[1] * g.G * (1 - Q.endFade * .6)], f1 = [g.C[0], g.C[1] + g.ry];
      const lg = ox.createLinearGradient(f0[0], f0[1], f1[0], f1[1]); lg.addColorStop(0, '#000'); lg.addColorStop(1, `rgba(0,0,0,${(1 - Q.endFade).toFixed(2)})`);
      ox.globalCompositeOperation = 'destination-in'; ox.fillStyle = lg; ox.fillRect(-1e4, -1e4, 3e4, 3e4); ox.globalCompositeOperation = 'source-over';
    }
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(off, 0, 0); c.restore();
    if (withPool) paintPool(c, g, rgb); c.filter = 'none';
  }
  function shadowPath(c, g){
    const Q = g.Q, f = g.f, B = g.base, U = g.under || [g.S[0], B[1]];
    let vx = B[0] - U[0], vy = (B[1] - U[1]) * 2; const dist = Math.hypot(vx, vy); if (dist < 1){ vx = 1; vy = 0; }
    const a = Math.atan2(vy, vx) + Q.shDir * Math.PI / 180, w = Q.shW * f, L = Q.shLen * f * Math.min(1, .15 + dist / (w * 6));
    c.save(); c.translate(B[0] + Q.shX * f, B[1] + Q.shZ * f); c.scale(1, .5); c.rotate(a);
    c.beginPath(); c.moveTo(0, -w / 2); c.lineTo(L, -w * .9); c.lineTo(L, w * .9); c.lineTo(0, w / 2); c.closePath();
    return Math.max(1, L);
  }
  function cutHead(c, lp){
    const hs = lp.faces.filter(e => e.classList.contains('hd')); if (!hs.length) return;
    const m = lp.grp.getScreenCTM(); c.save(); c.setTransform(m.a * RS, m.b * RS, m.c * RS, m.d * RS, (m.e - BOX.x) * RS, (m.f - BOX.y) * RS);
    c.globalCompositeOperation = 'destination-out'; c.fillStyle = '#000';
    hs.forEach(e => { if (e.tagName === 'circle'){ c.beginPath(); c.arc(+e.getAttribute('cx'), +e.getAttribute('cy'), +e.getAttribute('r'), 0, Math.PI * 2); c.fill(); }
      else { const d = e.getAttribute('d'); if (d) c.fill(new Path2D(d)); } });
    c.restore();
  }
  // the light layers are all soft: drawn at half resolution (blur radii halved to match) — much cheaper while scrolling
  const RS = .5;
  // …and each layer only covers the area the light actually reaches (a full-screen blended layer is costly to composite)
  let BOX = {x: 0, y: 0, w: 1, h: 1};
  function fit(cv, c, W, H){ const B = (W === 0) ? {x: 0, y: 0, w: 1, h: 1} : BOX, w = Math.max(1, Math.round(B.w * RS)), h = Math.max(1, Math.round(B.h * RS));
    if (cv.width !== w || cv.height !== h){ cv.width = w; cv.height = h; }
    cv.style.left = B.x + 'px'; cv.style.top = B.y + 'px'; cv.style.width = B.w + 'px'; cv.style.height = B.h + 'px';
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, w, h); c.setTransform(RS, 0, 0, RS, -B.x * RS, -B.y * RS); }

  // ---- light on the lamp: masks + lit copies of the faces, rebuilt whenever the lamp's drawing changes ----
  // light on the lamp, cheap version for the home page: no SVG masks — each face gets a vertical gradient sampled from
  // the same cone / spread / bounce maths (soft edge included), plus the front → back shade. Rebuilt whenever the drawing changes.
  function litAt(gs, Q, x, y, isBase){
    let v = 0;
    for (const g of gs){
      const vx = x - g.S[0], vy = y - g.S[1], reach = g.len * Q.lampLitR;
      if (g.spread){ v = Math.max(v, Math.pow(Math.max(0, 1 - Math.hypot(vx, vy) / reach), Q.beamGamma * .85)); }
      else {
        const along = vx * g.d[0] + vy * g.d[1], across = Math.abs(vx * g.n[0] + vy * g.n[1]);
        if (along > -4){
          const fall = Math.pow(Math.max(0, 1 - Math.hypot(vx, vy) / reach), Q.beamGamma * .85), soft = Math.max(3, (Q.beamFeather * .6 + 2) * g.f);
          const hw = g.w0 + Math.max(0, along) * g.tan, hs = g.w0 * 1.2 + Math.max(0, along) * Math.tan(Q.coneW * 1.5 / 2 * Math.PI / 180);
          v = Math.max(v, fall * Math.max(sm(hw + soft, hw - soft, across), Q.lampSpill * sm(hs + soft, hs - soft, across)));
        }
      }
      const bo = isBase ? Q.baseBounce : Q.lampBounce;
      if (g.base && +Q.beamOn && +Q.poolOn && bo > 0){
        const h = Math.max(g.rx, (g.base[1] - g.S[1]) * .45), up = (g.base[1] - y) / h, side = Math.abs(x - g.C[0]) / (g.rx * 1.2);
        v = Math.max(v, bo * Math.max(0, 1 - up) * (1 - sm(.6, 1, side)));
      }
    }
    return Math.min(1, v);
  }
  function litLamp(lp, gs, idx){
    lp.grp.querySelectorAll(':scope .lit-ov').forEach(e => e.remove());
    const Q = gs[0].Q; if (Q.lampLit <= 0 && Q.baseLit <= 0) return;
    const rgb = hexRGB(Q.light), id = 'dsk' + idx, dk = 'rgba(6,16,34,';
    const shadeX = (sid, side) => { const a = side >= 0 ? ['0', '1'] : ['1', '0'];
      return `<linearGradient id="${sid}" x1="${a[0]}" y1="0" x2="${a[1]}" y2="0"><stop offset="0" stop-color="${dk}0)"/><stop offset=".45" stop-color="${dk}.1)"/><stop offset="1" stop-color="${dk}${(.6 * Math.abs(side) + .15).toFixed(2)})"/></linearGradient>`; };
    let grads = shadeX(id + 'SX', Q.lampLitSide) + shadeX(id + 'BX', Q.baseSide)
      + `<linearGradient id="${id}BY" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${dk}0)"/><stop offset="1" stop-color="${dk}${(.85 * Q.baseFall).toFixed(2)})"/></linearGradient>`;
    const cut = lp.base[1] - Q.baseH * (lp.base[1] - lp.top), lowBulb = Math.max(...lp.bulbs.map(b => b[1])), H = lp.base[1] - lp.top;
    const jobs = [];
    lp.faces.forEach((el, i) => {
      const b = lp.fs[i];
      if (b.y < lowBulb + 1 && b.height < H * .4) el.classList.add('hd');
      if (+Q.headBlock && el.classList.contains('hd')) return;
      const isBase = Q.baseH > 0 && b.y >= cut - .01, amt = isBase ? Q.baseLit : Q.lampLit; if (amt <= 0) return;
      // sample the light down the face's centre line (and a little to each side for wide faces)
      const N = 7, stops = []; let any = 0;
      for (let j = 0; j < N; j++){
        const t = j / (N - 1), yy = b.y + b.height * t;
        let v = 0; for (const fx of (b.width > 6 ? [.2, .5, .8] : [.5])){ const P = lp.toS([b.x + b.width * fx, yy]); v = Math.max(v, litAt(gs, Q, P[0], P[1], isBase)); }
        any = Math.max(any, v); stops.push(`<stop offset="${t.toFixed(3)}" stop-color="rgb(${rgb})" stop-opacity="${(v * amt).toFixed(3)}"/>`);
      }
      if (any < .01) return;
      grads += `<linearGradient id="${id}L${i}" x1="0" y1="0" x2="0" y2="1">${stops.join('')}</linearGradient>`;
      jobs.push([el, i, isBase, any]);
    });
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs'); defs.setAttribute('class', 'lit-ov'); defs.innerHTML = grads; lp.grp.prepend(defs);
    for (const [el, i, isBase, any] of jobs){
      const grp = document.createElementNS('http://www.w3.org/2000/svg', 'g'); grp.setAttribute('class', 'lit-ov');
      const a = el.cloneNode(); a.removeAttribute('class'); a.style.cssText = `fill:url(#${id}L${i});stroke:none`;
      const s2 = el.cloneNode(); s2.removeAttribute('class'); s2.style.cssText = `fill:url(#${id}${isBase ? 'BX' : 'SX'});stroke:none;opacity:${any.toFixed(3)}`;   // the back goes darker only as much as the face is lit
      grp.append(a, s2);
      if (isBase){ const y = el.cloneNode(); y.removeAttribute('class'); y.style.cssText = `fill:url(#${id}BY);stroke:none`; grp.append(y); }
      const c = el.cloneNode(); c.style.fill = 'none'; grp.append(c);
      el.after(grp);
    }
  }

  // ---- every frame (only redraws when something moved) ----
  let dirty = true, lastKey = '', GS = [], QQ = null;
  // the light comes on only after a lamp change has finished: fades out fast as the change starts, back in once it's done
  let fade = 1, lastT = performance.now(), swapEnd = 0;
  function frame(){
    requestAnimationFrame(frame);
    const now = performance.now(), dt = Math.min(64, now - lastT); lastT = now;
    const dusk = root.dataset.theme === 'dusk';
    const lop = +getComputedStyle(lampSvg).opacity, shown = dusk && lampSvg.style.display !== 'none' && lop > .01 && !document.body.classList.contains('in-project') && !document.body.classList.contains('in-thoughts');
    const W = innerWidth, H = innerHeight;
    if (!shown){ GS = []; if (lastKey){ [[sc, sx], [bc, bx], [bf, fx]].forEach(([cv, c]) => fit(cv, c, 0, 0)); lastKey = ''; } return; }
    const st = window.homeLampStyle ? window.homeLampStyle() : 'cobra', Q = cfg(st);
    // mid-change the lamp is animated with transforms: the lit copies would lag behind, so the lamp goes unlit for that moment
    const swap = document.body.classList.contains('lamp-swap') || lampSvg.querySelector(':scope > g:not(.lit-ov) .glow');
    if (swap) lampSvg.querySelectorAll('.lit-ov').forEach(e => e.remove());
    if (swap){ fade = Math.max(0, fade - dt / 140); swapEnd = now; }
    else if (now - swapEnd > 150) fade = Math.min(1, fade + dt / 750);
    const fe = fade * fade * (3 - 2 * fade);
    [sc, bc, bf].forEach(c => c.style.opacity = (lop * fe).toFixed(3));
    lampSvg.style.setProperty('--lit-fade', fe.toFixed(3)); root.style.setProperty('--sky-fade', fe.toFixed(3)); FADE = fe;
    if (swap && fade <= 0){ if (lastKey !== 'swap'){ [[sc, sx], [bc, bx], [bf, fx]].forEach(([cv, c]) => fit(cv, c, 0, 0)); lastKey = 'swap'; } return; }
    const lps = lamps(); if (!lps.length) return;
    const key = st + '|' + W + 'x' + H + '|' + lps.map(lp => lp.bulbs.map(b => lp.toS(b).map(v => v.toFixed(1)).join(',')).join(';') + '@' + lp.k.toFixed(3) + '/' + lp.op.toFixed(2) + (lp.grp.querySelector('.lit-ov') ? '' : '*')).join('|');
    if (key === lastKey && !dirty) return;
    lastKey = key; dirty = false;
    // follow the lamp's stacking: shadow and beam just under it, the haze just over it
    const z = +getComputedStyle(lampSvg).zIndex || 4500;
    sc.style.zIndex = z - 2; bc.style.zIndex = z - 1; bf.style.zIndex = z + 1;
    bc.style.mixBlendMode = bf.style.mixBlendMode = Q.beamBlend;
    // geometry first, so the layers can be sized to what the light covers
    const pre = lps.map(lp => { const f = lp.k / (Q.lampSize / 200), base = lp.toS(lp.base);
      return { f, base, gs: lp.bulbs.map((b, i) => geo(Q, f, lp.toS(b), lp.unders[i] ? lp.toS(lp.unders[i]) : null, base)) }; });
    { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; const add = (x, y, r) => { x0 = Math.min(x0, x - r); y0 = Math.min(y0, y - r); x1 = Math.max(x1, x + r); y1 = Math.max(y1, y + r); };
      pre.forEach(({f, base, gs}) => gs.forEach(g => { const m = Q.beamFeather * g.f * 3 + 20;
        if (g.spread) add(g.S[0], g.S[1], g.len + m); else { add(g.S[0], g.S[1], g.w0 + m); add(g.C[0], g.C[1], Math.max(g.rx, g.wG) + m); add(g.C[0], g.C[1] + g.ry, m); }
        add(g.C[0], g.C[1], g.rx + m); add(base[0], base[1], (Q.shLen + Q.shW * 2 + Math.abs(Q.shX) + Math.abs(Q.shZ)) * f + Q.shSoft * f * 3 + 20); }));
      x0 = Math.max(0, Math.floor(x0)); y0 = Math.max(0, Math.floor(y0)); x1 = Math.min(W, Math.ceil(x1)); y1 = Math.min(H, Math.ceil(y1));
      BOX = x1 > x0 && y1 > y0 ? {x: x0, y: y0, w: x1 - x0, h: y1 - y0} : {x: 0, y: 0, w: 1, h: 1}; }
    fit(sc, sx, W, H); fit(bc, bx, W, H); fit(bf, fx, W, H);
    if (off.width !== bc.width || off.height !== bc.height){ off.width = bc.width; off.height = bc.height; }
    let first = null; const allG = []; QQ = Q;
    lps.forEach((lp, idx) => {
      const { f, base, gs } = pre[idx];
      if (!first) first = gs[0]; allG.push(...gs);
      if (!swap && !(window.__dskOff || {}).lit && (!lp.grp.querySelector('.lit-ov') || dirty)) litLamp(lp, gs, idx);
      if (!+Q.beamOn || (window.__dskOff || {}).canvas) return;
      [bx, fx, sx].forEach(c => c.globalAlpha = lp.op);
      for (const g of gs){ paintBeam(bx, g, 1, true); if (Q.beamFront > 0) paintBeam(fx, g, Q.beamFront, false); }
      if (+Q.headBlock) cutHead(fx, lp);
      const many = gs.length > 1, soft = Q.shSoft ? `blur(${Q.shSoft * f * RS}px)` : 'none';
      for (const g of gs){
        if (Q.shA <= 0 && Q.shCut <= 0) continue;
        const lit = Math.max(0, 1 - Math.hypot(g.base[0] - g.C[0], (g.base[1] - g.C[1]) / Math.max(.1, Q.floorFlat)) / (g.rx * 1.6));
        for (const [c, a, op] of [[sx, Q.shA * (.35 + .65 * lit) * (many ? .7 : 1), 'source-over'], [bx, (+Q.poolOn ? Q.shCut : 0) * (many ? .6 : 1), 'destination-out']]){
          if (a <= 0) continue;
          c.filter = soft; c.globalCompositeOperation = op;
          const L = shadowPath(c, g), lg = c.createLinearGradient(0, 0, L, 0);
          lg.addColorStop(0, `rgba(4,10,24,${a.toFixed(3)})`); lg.addColorStop(.6, `rgba(4,10,24,${(a * .45).toFixed(3)})`); lg.addColorStop(1, 'rgba(4,10,24,0)');
          c.fillStyle = lg; c.fill(); c.restore(); c.globalCompositeOperation = 'source-over'; c.filter = 'none';
        }
      }
      if (Q.shBase > 0){ const r = Math.max(Q.shW * f * 1.6, 10); sx.save(); sx.translate(base[0] + Q.shX * f, base[1] + Q.shZ * f); sx.scale(1, .45);
        const cg = sx.createRadialGradient(0, 0, 0, 0, 0, r); cg.addColorStop(0, `rgba(2,6,16,${Q.shBase})`); cg.addColorStop(1, 'rgba(2,6,16,0)');
        sx.fillStyle = cg; sx.beginPath(); sx.arc(0, 0, r, 0, Math.PI * 2); sx.fill(); sx.restore(); }
      [bx, fx, sx].forEach(c => c.globalAlpha = 1);
    });
    GS = allG;
    // the glow on the sky, around the first light
    if (first){
      const s = root.style, f = first.f;
      s.setProperty('--sky-lx', first.S[0] + 'px'); s.setProperty('--sky-ly', first.S[1] + 'px');
      s.setProperty('--sky-pr', (Q.poolR * f) + 'px'); s.setProperty('--sky-pa', Q.poolA * lop);
      root.classList.toggle('sky-cone', Q.shape === 'cone');
      s.setProperty('--sky-cs', (Q.coneDir - Q.coneW / 2) + 'deg'); s.setProperty('--sky-cw', Q.coneW + 'deg'); s.setProperty('--sky-cf', Math.min(Q.coneF, Q.coneW / 2) + 'deg');
    }
  }
  // ---- the same light for lamps on other pages (the playground): one lamp → its own canvases, painted once ----
  // returns {box, shad, beam, front, blend} in screen px at the time of the call; the caller moves them with the lamp
  let UID = 0;
  window.duskLightAPI = {
    render(root, st, opt = {}){
      const Q = cfg(st), lps = lamps(root); if (!lps.length) return null;
      const pre = lps.map(lp => { const f = lp.k / (Q.lampSize / 200), base = lp.toS(lp.base);
        return { f, base, gs: lp.bulbs.map((b, i) => geo(Q, f, lp.toS(b), lp.unders[i] ? lp.toS(lp.unders[i]) : null, base)) }; });
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; const add = (x, y, r) => { x0 = Math.min(x0, x - r); y0 = Math.min(y0, y - r); x1 = Math.max(x1, x + r); y1 = Math.max(y1, y + r); };
      pre.forEach(({f, base, gs}) => gs.forEach(g => { const m = Q.beamFeather * g.f * 3 + 20;
        if (g.spread) add(g.S[0], g.S[1], g.len + m); else { add(g.S[0], g.S[1], g.w0 + m); add(g.C[0], g.C[1], Math.max(g.rx, g.wG) + m); add(g.C[0], g.C[1] + g.ry, m); }
        add(g.C[0], g.C[1], g.rx + m); add(base[0], base[1], (Q.shLen + Q.shW * 2 + Math.abs(Q.shX) + Math.abs(Q.shZ)) * f + Q.shSoft * f * 3 + 20); }));
      const B = {x: Math.floor(x0), y: Math.floor(y0), w: Math.max(1, Math.ceil(x1 - x0)), h: Math.max(1, Math.ceil(y1 - y0))};
      const mk = () => { const cv = document.createElement('canvas'); cv.width = Math.max(1, Math.round(B.w * RS)); cv.height = Math.max(1, Math.round(B.h * RS));
        const c = cv.getContext('2d'); c.setTransform(RS, 0, 0, RS, -B.x * RS, -B.y * RS); return [cv, c]; };
      const [scv, sx2] = mk(), [bcv, bx2] = mk(), [fcv, fx2] = mk();
      const ow = off.width, oh = off.height; off.width = bcv.width; off.height = bcv.height;
      lps.forEach((lp, idx) => {
        const { f, base, gs } = pre[idx];
        if (opt.noLampLit){   // light on the ground only — just mark the head faces (for 'head over the light')
          const lowBulb = Math.max(...lp.bulbs.map(b => b[1])), H = lp.base[1] - lp.top;
          lp.faces.forEach((el, i) => { const b = lp.fs[i]; if (b.y < lowBulb + 1 && b.height < H * .4) el.classList.add('hd'); });
        } else litLamp(lp, gs, 'pg' + (UID++));
        if (!+Q.beamOn) return;
        for (const g of gs){ paintBeam(bx2, g, 1, true); if (Q.beamFront > 0) paintBeam(fx2, g, Q.beamFront, false); }
        // 'head over the light': these canvases sit above the lamp, so the head is cut out of both the beam and the haze
        if (+Q.headBlock){ const ob = BOX; BOX = B; cutHead(bx2, lp); cutHead(fx2, lp); BOX = ob; }
        const many = gs.length > 1, soft = Q.shSoft ? `blur(${Q.shSoft * f * RS}px)` : 'none';
        for (const g of gs){
          if (Q.shA <= 0 && Q.shCut <= 0) continue;
          const lit = Math.max(0, 1 - Math.hypot(g.base[0] - g.C[0], (g.base[1] - g.C[1]) / Math.max(.1, Q.floorFlat)) / (g.rx * 1.6));
          for (const [c, a, op] of [[sx2, Q.shA * (.35 + .65 * lit) * (many ? .7 : 1), 'source-over'], [bx2, (+Q.poolOn ? Q.shCut : 0) * (many ? .6 : 1), 'destination-out']]){
            if (a <= 0) continue;
            c.filter = soft; c.globalCompositeOperation = op;
            const L = shadowPath(c, g), lg = c.createLinearGradient(0, 0, L, 0);
            lg.addColorStop(0, `rgba(4,10,24,${a.toFixed(3)})`); lg.addColorStop(.6, `rgba(4,10,24,${(a * .45).toFixed(3)})`); lg.addColorStop(1, 'rgba(4,10,24,0)');
            c.fillStyle = lg; c.fill(); c.restore(); c.globalCompositeOperation = 'source-over'; c.filter = 'none';
          }
        }
        if (Q.shBase > 0){ const r = Math.max(Q.shW * f * 1.6, 10); sx2.save(); sx2.translate(base[0] + Q.shX * f, base[1] + Q.shZ * f); sx2.scale(1, .45);
          const cg = sx2.createRadialGradient(0, 0, 0, 0, 0, r); cg.addColorStop(0, `rgba(2,6,16,${Q.shBase})`); cg.addColorStop(1, 'rgba(2,6,16,0)');
          sx2.fillStyle = cg; sx2.beginPath(); sx2.arc(0, 0, r, 0, Math.PI * 2); sx2.fill(); sx2.restore(); }
      });
      off.width = ow; off.height = oh;
      return { box: B, shad: scv, beam: bcv, front: fcv, blend: Q.beamBlend };
    },
    clear(root){ root.querySelectorAll('.lit-ov').forEach(e => e.remove()); }
  };

  // ---- the light falls on things: type, lines, frames, cubes — like on the Dusk tests page ----
  let FADE = 1;
  const sm = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  function lightAt(x, y){
    let k = 0;
    for (const g of GS){
      const Q = g.Q, vx = x - g.S[0], vy = y - g.S[1];
      let v = 0;
      if (g.spread){ const d = Math.hypot(vx, vy); v = Math.pow(Math.max(0, 1 - d / g.len), Q.beamGamma); }
      else {
        const along = vx * g.d[0] + vy * g.d[1], across = Math.abs(vx * g.n[0] + vy * g.n[1]), reach = Math.max(g.len, g.G * 1.05);
        if (along > 0){ const hw = g.w0 + along * g.tan, soft = Math.max(4, Q.beamFeather * g.f * 1.5);
          v = sm(hw + soft, hw - soft, across) * Math.pow(Math.max(0, 1 - along / reach), Q.beamGamma); }
      }
      if (+Q.poolOn && Q.floorA > 0){ const e = Math.hypot((x - g.C[0]) / g.rx, (y - g.C[1]) / g.ry); v = Math.max(v, (1 - sm(.4, 1, e)) * Math.min(1, Q.floorA * 3)); }
      k = Math.max(k, v);
    }
    return Math.min(1, k * FADE);
  }
  const LIT_SEL = '#intro .w, #top nav a:not(#contact), #more .m-row, .site-foot, #hud, section .pct, .wrap';   // texts with the scroll reveal are lit per word through it
  (function lightEls(){
    requestAnimationFrame(lightEls);
    const on = root.dataset.theme === 'dusk' && GS.length && !(window.__dskOff || {}).els;
    if (!on){ if (lightEls.was){ document.querySelectorAll('[data-lk]').forEach(el => { el.style.removeProperty('--lk'); delete el.dataset.lk; });
      if (window.TR) TR.items.forEach(it => { if (it.ks){ TR.light(it, null); } }); lightEls.was = false; } return; }
    lightEls.was = true;
    const Q = QQ || DEF, H = innerHeight, W = innerWidth;
    document.querySelectorAll(LIT_SEL).forEach(el => {
      const r = el.getBoundingClientRect(); if (r.bottom < 0 || r.top > H || r.right < 0 || r.left > W || !r.width){ if (el.dataset.lk){ el.style.setProperty('--lk', 0); } return; }
      // brightest point of the element: its centre, or the point of it nearest the light's axis for long rows
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      let k = lightAt(cx, cy);
      if (r.width > 160 || r.height > 160){   // big things (rows, cards): sample a grid and take the brightest spot
        const nx = r.width > 160 ? 9 : 1, ny = r.height > 160 ? 6 : 1;
        for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) k = Math.max(k, lightAt(r.left + r.width * (nx > 1 ? i / (nx - 1) : .5), r.top + r.height * (ny > 1 ? j / (ny - 1) : .5)));
      }
      k = Math.pow(k, Math.max(.3, Q.tGamma * .6)) * Q.tStr;
      el.style.setProperty('--lk', k.toFixed(3)); el.dataset.lk = 1;
      if (el.classList.contains('wrap') && GS[0]){   // which way the light comes from (for the active card's border gradient)
        el.style.setProperty('--la', (Math.atan2(cx - GS[0].S[0], -(cy - GS[0].S[1])) * 180 / Math.PI).toFixed(1) + 'deg'); }
    });
    // texts with the scroll reveal: light per word, painted by the reveal itself so both effects add up
    if (window.TR){ const L = Q.light.match(/\w\w/g).map(h => parseInt(h, 16)), g = Math.max(.3, Q.tGamma * .6);
      TR.items.forEach(it => {
        const r = it.el.getBoundingClientRect(); if (r.bottom < 0 || r.top > H){ return; }
        const ks = it.words.map(w => { const b = w.getBoundingClientRect(); return Math.pow(lightAt(b.left + b.width / 2, b.top + b.height / 2), g) * Q.tStr; });
        const old = it.ks; if (old && old.length === ks.length && ks.every((v, i) => Math.abs(v - old[i]) < .02)) return;
        TR.light(it, ks, L);
      }); }
  })();
  addEventListener('themechange', () => { dirty = true; if (root.dataset.theme !== 'dusk') lampSvg.querySelectorAll('.lit-ov').forEach(e => e.remove()); });
  requestAnimationFrame(frame);
}
