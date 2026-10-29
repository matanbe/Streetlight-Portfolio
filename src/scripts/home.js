// The home page: cubes along the street, the lamp + its light, More work, About, the project overlay. Ported from the prototype.
import Lenis from 'lenis';
import Hairline from '../vendor/hairline.js';
import { initDuskLight } from './dusk-light.js';
import { LampKit2 } from './lampkit.js';
// Storyblok images get a resize suffix; anything else (CDN, /public) is used as is
const sbm = (u, w) => /a\.storyblok\.com/.test(u) && !/\.svg(\?|$)/i.test(u) ? `${u}/m/${w}x0` : u;

// the home scroll is built from this list — add / remove / reorder projects here only (any count works)
const PROJECTS = window.__SL.projects;
const HERO_COUNT = window.__SL.heroCount;   // how many of the projects above get a card in the home scroll (the rest still have project pages)
const SECTIONS = PROJECTS.slice(0, HERO_COUNT).map(p => p.name);
const N = SECTIONS.length;


// ---------------- testimonials rolodex (ported from testimonials.html; uses its saved params) ----------------
const Rolo = (() => {
const T = window.__SL.testimonials;

// avatar: a portrait (drawn as a mask, so it takes the card's ink colour) or the initials
const ph = t => t.photo ? `<div class="ph has-img"><b style="--ph:url('${t.photo}')"></b></div>` : `<div class="ph"><i>${t.ini}</i></div>`;
const RX = (() => {
  const VIEW = new DOMMatrix('rotateX(-35.264deg) rotateY(-45deg)');
  const nzOf = (y, z) => { const o = VIEW.transformPoint(new DOMPoint(0,0,0)), q = VIEW.transformPoint(new DOMPoint(0, y, z)); return q.z - o.z; };
  // cylinder along X centred on (y0, z0): facets, with outline only on the silhouette
  const cyl = (r, L, y0 = 0, z0 = 0, ridges = 0, cls = '') => { let out = ''; const n = ridges > 0 ? Math.max(ridges, 12) : 28, every = ridges > 0 ? Math.max(1, Math.round(n / ridges)) : 0;
    for (let k = 0; k < n; k++){ const f1 = 2*Math.PI*k/n, f2 = 2*Math.PI*(k+1)/n, fm = (f1+f2)/2;
      const y1 = r*Math.cos(f1), z1 = r*Math.sin(f1), y2 = r*Math.cos(f2), z2 = r*Math.sin(f2), h = Math.hypot(y2-y1, z2-z1), ty = (y2-y1)/h, tz = (z2-z1)/h;
      const edge = Math.sign(nzOf(Math.cos(fm), Math.sin(fm))) !== Math.sign(nzOf(Math.cos(fm + 2*Math.PI/n), Math.sin(fm + 2*Math.PI/n)));
      out += `<div class="cyl${cls ? ' ' + cls : ''}${edge ? ' sil' : ''}${every && k % every === 0 ? ' rid' : ''}" style="left:${-L/2}px;top:${-h/2-.3}px;width:${L}px;height:${h+.6}px;transform:matrix3d(1,0,0,0, 0,${ty},${tz},0, 0,${-tz},${ty},0, 0,${y0+(y1+y2)/2},${z0+(z1+z2)/2},1)"></div>`; }
    return out; };
  // crisp outline for a rod along X: two flat strips that face the camera, sitting on the rod's silhouette
  const VI = VIEW.inverse(), O = VI.transformPoint(new DOMPoint(0,0,0)), Vp = VI.transformPoint(new DOMPoint(0,0,1));
  const vv = [Vp.x - O.x, Vp.y - O.y, Vp.z - O.z];                        // view direction in rig space
  const rodLines = (r, L, w = 1.5, y0 = 0, z0 = 0) => { if (!(w > 0)) return '';
    const f0 = Math.atan2(-vv[1], vv[2]);
    // strip plane: spans X and e2 = v × X (normalised), normal ≈ v
    let e2 = [0, vv[2], -vv[1]]; const n2 = Math.hypot(e2[1], e2[2]); e2 = [0, e2[1]/n2, e2[2]/n2];
    const nz = [0, -e2[2], e2[1]];
    return [f0, f0 + Math.PI].map(f => { const y = y0 + (r + .3) * Math.cos(f), z = z0 + (r + .3) * Math.sin(f);
      return `<div class="rodl" style="left:${-L/2}px;top:${-w/2}px;width:${L}px;height:${w}px;transform:matrix3d(1,0,0,0, 0,${e2[1]},${e2[2]},0, 0,${nz[1]},${nz[2]},0, 0,${y},${z},1)"></div>`; }).join(''); };
  // rings around the axle (where the cards hook on): thin circles just outside the rod
  const rings = (r, L, n) => n <= 0 ? '' : Array.from({length:n}, (_, k) => { const x = -L/2 + L * (k + .5) / n;
      return `<div class="aring" style="left:${-r}px;top:${-r}px;width:${2*r}px;height:${2*r}px;transform:translateX(${x}px) rotateY(90deg)"></div>`; }).join('');
  const circ = (c, r, n = 32) => Array.from({length:n}, (_, k) => [c[0] + r*Math.cos(2*Math.PI*k/n), c[1] + r*Math.sin(2*Math.PI*k/n)]);
  // an extruded side piece: union of polygons (in z,y), two plates + the strip between them
  const svgPath = poly => 'M' + poly.map(q => (-q[0]).toFixed(1) + ' ' + q[1].toFixed(1)).join('L') + 'Z';   // svg x = −z under rotateY(90deg)
  // the svg is sized to the drawing (a big svg plane stops painting in 3D)
  const plate = (x, members) => { const pts = members.flat(), xs = pts.map(q => -q[0]), ys = pts.map(q => q[1]);
    const x0 = Math.floor(Math.min(...xs)) - 6, y0 = Math.floor(Math.min(...ys)) - 6, w = Math.ceil(Math.max(...xs)) + 6 - x0, h = Math.ceil(Math.max(...ys)) + 6 - y0;
    // centre the box on x = 0 so rotateY pivots about the axle line
    const hx = Math.max(-x0, x0 + w);
    return `<svg class="leg" viewBox="${-hx} ${y0} ${2*hx} ${h}" width="${2*hx}" height="${h}" style="left:${-hx}px;top:${y0}px;transform:translateX(${x}px) rotateY(90deg)">
      ${members.map(m => `<path class="st" d="${svgPath(m)}"/>`).join('')}${members.map(m => `<path class="fl" d="${svgPath(m)}"/>`).join('')}</svg>`; };
  const sides = (x0, members, TH) => members.map(PR => PR.map((p, k) => { const q = PR[(k+1) % PR.length], pr = PR[(k+PR.length-1) % PR.length];
    const turn = Math.abs(Math.atan2(p[1]-pr[1], p[0]-pr[0]) - Math.atan2(q[1]-p[1], q[0]-p[0])) % (2*Math.PI), cn = turn > .4 && turn < 2*Math.PI - .4;
    const z1 = p[0], y1 = p[1], z2 = q[0], y2 = q[1], L = Math.hypot(z2-z1, y2-y1) || 1, uy = (y2-y1)/L, uz = (z2-z1)/L;
    return `<div class="lside${cn ? ' cn' : ''}" style="left:${-L/2-.5}px;top:${-TH/2+1.5}px;width:${L+1}px;height:${Math.max(1, TH-3)}px;transform:matrix3d(0,${uy},${uz},0, 1,0,0,0, 0,${uz},${-uy},0, ${x0+TH/2},${(y1+y2)/2},${(z1+z2)/2},1)"></div>`; }).join('')).join('');
  const side = (x0, members, TH) => plate(x0, members) + sides(x0, members, TH) + plate(x0 + TH, members);
  // knob: a short cylinder out from the side, capped by the dial face (dots + red marker)
  const knob = (xIn, size, M, sd = 1, T = 14, ridges = 0, ky = 0) => { const x = xIn + sd * T;
    return `<div class="kw" style="transform:translateY(${ky}px)">` + (T > 0 ? `<div class="disc" style="left:${-size/2}px;top:${-size/2}px;width:${size}px;height:${size}px;transform:translateX(${xIn + sd}px) rotateY(90deg)"></div>`
      + `<div class="kw" style="transform:translateX(${xIn + sd * T / 2}px)">${cyl(size / 2, T)}${grip(size / 2 + .4, T, ridges)}</div>` : '')
    + `<div class="disc knob1" style="left:${-size/2}px;top:${-size/2}px;width:${size}px;height:${size}px;transform:translateX(${x}px) rotateY(${sd > 0 ? 90 : -90}deg)">
      <div class="rot">${Array.from({length:M}, (_, k) => `<i class="${k ? '' : 'm'}" style="transform:rotate(${k*360/M}deg) translateY(${-size*.34}px)"></i>`).join('')}</div></div></div>`; };
  // grip lines: their own ring just above the knob's surface, so they can turn with the drum
  const grip = (r, T, n) => n <= 0 ? '' : `<div class="kspin">${Array.from({length:n}, (_, k) => { const f = 2*Math.PI*k/n, ty = -Math.sin(f), tz = Math.cos(f);
      return `<i class="gl" style="left:${-T/2}px;width:${T}px;transform:matrix3d(1,0,0,0, 0,${ty},${tz},0, 0,${-tz},${ty},0, 0,${r*Math.cos(f)},${r*Math.sin(f)},1)"></i>`; }).join('')}</div>`;
  // a collar on the axle: short cylinder with both faces, so the shaft reads as a solid rod
  const collar = (x, r, T) => r <= 0 ? '' : [x - T/2, x + T/2].map(xx => `<div class="disc" style="left:${-r}px;top:${-r}px;width:${2*r}px;height:${2*r}px;transform:translateX(${xx}px) rotateY(90deg)"></div>`).join('')
      + `<div class="kw" style="transform:translateX(${x}px)">${cyl(r, T)}</div>`;
  const pool = () => T.map(t => ({...t, tag: t.proj}));
  const cardHTML = (t, cls) => `<div class="${cls}"><div class="qq">“${t.short}”</div><div class="nm">${ph(t)}<div><strong>${t.name}</strong><span>${t.role}</span></div></div></div>`;
  const ss = x => x * x * (3 - 2 * x);
  // navigation shared by both: spring, wheel (one card per ~step px), drag, arrows
  function nav(g, st, P, clampT, knobClick = true, wheel = true){
    const kick = () => { if (!st.raf) st.raf = requestAnimationFrame(st.frame); };
    st.go = d => { st.target = clampT(st.target + d); kick(); };
    g.closest('section')?.querySelectorAll('[data-d]').forEach(b => b.onclick = () => st.go(+b.dataset.d));
    let acc = 0, last = 0, quiet = 0;
    if (wheel) g.addEventListener('wheel', e => {
      const dir = Math.sign(e.deltaY);
      if (clampT(st.target + dir) === st.target) return;                     // at an end: the page scrolls on
      e.preventDefault(); clearTimeout(quiet); quiet = setTimeout(() => acc = 0, 220);
      acc += e.deltaMode === 1 ? e.deltaY * 32 : e.deltaY; const now = performance.now();
      if (Math.abs(acc) > P.wheel && now - last > P.wheelGap){ st.go(Math.sign(acc)); acc = 0; last = now; } else if (Math.abs(acc) > P.wheel * 3) acc = Math.sign(acc) * P.wheel * 3; }, {passive:false});
    let y0 = null, t0 = 0;
    g.addEventListener('pointerdown', e => { if (e.target.closest('.knob1') || e.defaultPrevented) return; y0 = e.clientY; t0 = st.target; g.classList.add('drag'); g.setPointerCapture(e.pointerId); });
    g.addEventListener('pointermove', e => { if (y0 == null) return; st.target = t0 + (y0 - e.clientY) / P.drag; kick(); });
    const up = () => { if (y0 == null) return; y0 = null; g.classList.remove('drag'); st.target = clampT(Math.round(st.target)); kick(); };
    g.addEventListener('pointerup', up); g.addEventListener('pointercancel', up);
    if (knobClick) g.addEventListener('click', e => { if (e.target.closest('.knob1')) st.go(1); });
  }
  const look = (g, P) => {
    g.style.setProperty('--cw', P.cardW + 'px'); g.style.setProperty('--ch', P.cardH + 'px'); g.style.setProperty('--pad', P.pad + 'px');
    g.style.setProperty('--qf', P.quote + 'px'); g.style.setProperty('--nf', P.name + 'px'); g.style.setProperty('--tf', P.tag + 'px'); g.style.setProperty('--av', P.avatar + 'px'); g.style.setProperty('--axw', (P.axleLine || 1.5) + 'px');
    const fit = 1;
    g.querySelector('.rig').style.transform = `translate(${P.offX * fit}px,${P.offY * fit}px) rotateX(-35.264deg) rotateY(-45deg) scale(${P.scale * fit})`;
  };
  return { cyl, rodLines, rings, circ, side, knob, collar, pool, cardHTML, ss, nav, look };
})();


function mount(g, start = 0, hl = -1){   // hl: the testimonial for this project (its cards are printed red)
  const DEF = { cards:39, spacing:13, openTilt:-10, backStart:16, frontFall:90, hang:3.6, backLimit:94, rail:37,
                cardW:360, cardH:208, pad:21, quote:16, name:13, tag:10, avatar:35,
                axle:26, axleLine:1.5, axleRings:7, collar:8, collarW:13, legH:64, legW:53, legT:17, knob:80, knobT:11, ridges:24, knobY:0, legY:0, scale:1.21, offX:0, offY:10,
                stiff:.04, damp:.55, wheel:250, wheelGap:170, drag:70 };
  // Matan's tuned rolodex (from the Rolodex tests page); a newer save in this browser still wins while tuning
  let saved = {"cards":39,"spacing":13,"openTilt":-10,"backStart":16,"frontFall":90,"hang":3.6,"backLimit":94,"rail":37,"cardW":360,"cardH":208,"pad":21,"quote":16,"name":13,"tag":10,"avatar":35,"axle":26,"axleLine":1.5,"axleRings":7,"collar":8,"collarW":13,"legH":64,"legW":53,"legT":17,"knob":80,"knobT":11,"ridges":24,"knobY":0,"legY":0,"scale":1.21,"offX":0,"offY":10,"stiff":0.04,"damp":0.55,"wheel":250,"wheelGap":170,"drag":70}; try { Object.assign(saved, (JSON.parse(localStorage.getItem('testimonial-rolodex-params-v1') || '{}') || {}).r7 || {}); } catch(e){}
  const P = {...DEF, ...saved};
  if (innerWidth <= 800){ P.cards = Math.min(P.cards, 14); P.rail = Math.min(P.rail, 20); }   // phones: a shorter rolodex so it all fits
  const rig = g.querySelector('.rig'), pool = RX.pool(), M = pool.length;
  const st = { a:start, v:0, target:start, raf:0 };
  let cards = [], dots = [];
  // phones: scale the whole thing down to fit inside its box (measured, so it holds for any setting)
  function fitBox(){
    if (innerWidth > 800){ g.style.transform = ''; return; }
    g.style.transform = ''; const r = g.getBoundingClientRect(); let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    g.querySelectorAll('.rig *').forEach(e => { const b = e.getBoundingClientRect(); if (!b.width && !b.height) return; x0 = Math.min(x0, b.left); x1 = Math.max(x1, b.right); y0 = Math.min(y0, b.top); y1 = Math.max(y1, b.bottom); });
    if (x1 <= x0) return;
    const k = Math.min(1, (r.width - 8) / (x1 - x0), (r.height - 8) / (y1 - y0)), ox = (x0 + x1) / 2 - r.left, oy = (y0 + y1) / 2 - r.top;
    g.style.transformOrigin = `${ox}px ${oy}px`; g.style.transform = `translate(${r.width / 2 - ox}px,${r.height / 2 - oy}px) scale(${k})`;
  }
  setTimeout(fitBox, 60); addEventListener('resize', () => setTimeout(fitBox, 60));
  function build(){
    RX.look(g, P);
    const half = P.legW, members = [[...Array.from({length:19}, (_, k) => { const t = Math.PI + Math.PI*k/18; return [half*Math.cos(t), half*Math.sin(t)]; }), [half, P.legH], [-half, P.legH]]
                                      .map(q => [q[0], q[1] + P.legY])];   // legY: slide the whole leg up / down
    const XL = P.cardW / 2 + 24;
    rig.innerHTML = RX.cyl(P.axle, 2*XL, 0, 0, 0, 'ax') + RX.rodLines(P.axle, 2*XL, P.axleLine) + RX.rings(P.axle + .6, P.cardW * .9, P.axleRings) + [-1, 1].map(sd => RX.collar(sd * (XL - 14), P.axle + P.collar, P.collarW)).join('') + [-1, 1].map(sd => RX.side(sd > 0 ? XL : -XL - P.legT, members, P.legT) + RX.knob(sd * (XL + P.legT), P.knob, M, sd, P.knobT, P.ridges, P.knobY)).join('');
    dots = [...rig.querySelectorAll('.rot')];
    cards = [];
    // all testimonials keep looping as before; copies of this project's testimonial are marked, and the frame paints one of them red
    for (let i = 0; i < P.cards; i++){
      const c = document.createElement('div'); c.className = 'card'; if (hl >= 0 && i % M === hl) c.dataset.mine = 1; c.innerHTML = RX.cardHTML(pool[i % M], 'in7'); rig.appendChild(c); cards.push(c); }
    st.frame(true);
  }
  const ang = d => d >= 0 ? (d <= 1 ? P.openTilt + (P.frontFall - P.openTilt) * RX.ss(d) : P.frontFall + Math.min(d - 1, 3) * 4)
                         : (d >= -1 ? P.openTilt - (P.backStart + P.openTilt) * RX.ss(-d) : -P.backStart + (d + 1) * P.spacing);
  st.frame = force => {
    st.v += (st.target - st.a) * P.stiff; st.v *= P.damp; st.a += st.v;
    const N = cards.length, wrap = d => ((d % N) + N * 1.5) % N - N / 2;
    // dials turn with the drum (counter-clockwise): the right dial faces +x, the left one −x, hence the opposite signs
    dots.forEach((dt, i) => dt.style.transform = `rotate(${(i ? -1 : 1) * st.a * 360 / M}deg)`);
    rig.querySelectorAll('.kspin').forEach(k => k.style.transform = `rotateX(${-st.a * 360 / M}deg)`);
    // exactly one red card: the copy of this project's testimonial that is at the front or still on its way there (d ≤ .5);
    // once it leaves the front the red moves to the next copy in the stack behind — and back again if you roll back
    let red = null, best = -1e9;
    cards.forEach((c, i) => { if (!c.dataset.mine) return; const d = wrap(st.a - i); if (d <= .5 && d > best){ best = d; red = c; } });
    cards.forEach((c, i) => {
      c.classList.toggle('proj', c === red);
      const d = wrap(st.a - i), th = ang(d);          // a↑ → cards travel back → open → front (counter-clockwise)
      c.style.transform = `rotateX(${-th}deg) translateY(${-P.rail}px)`;
      c.style.visibility = (d > P.hang || th < -P.backLimit) ? 'hidden' : '';
      c.style.setProperty('--c', Math.max(0, 1 - Math.abs(d) * 1.6).toFixed(3));
      c.classList.toggle('on', Math.abs(d) < .5);
    });
    st.raf = (Math.abs(st.target - st.a) > .002 || Math.abs(st.v) > .002) ? requestAnimationFrame(() => st.frame()) : 0;
  };
  RX.nav(g, st, P, t => t, false, false);   // no wheel here: the page has to keep scrolling
  // turn the drum by the knob: drag around the dial and its red marker follows the pointer
  let knobDrag = false;
  // hit-test by the dial's on-screen box (3D hit-testing on the drum is unreliable), a little generous so the knob body counts too
  const knobAt = (x, y) => [...g.querySelectorAll('.knob1')].find(k => { const r = k.getBoundingClientRect(), m = r.width * .25;
    return x >= r.left - m && x <= r.right + m && y >= r.top - m && y <= r.bottom + m; });
  g.addEventListener('pointerdown', e => {
    const kb = knobAt(e.clientX, e.clientY); if (!kb) return;
    e.stopPropagation(); e.preventDefault();
    const rot = kb.querySelector('.rot'), mk = rot && rot.querySelector('i.m'); if (!mk) return;
    const r = kb.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const ang = (x, y) => Math.atan2(y - cy, x - cx) * 180 / Math.PI, wrapA = d => ((d + 540) % 360) - 180;
    const mAng = () => { const b = mk.getBoundingClientRect(); return ang(b.left + b.width / 2, b.top + b.height / 2); };
    // how many screen degrees the marker turns per card (and which way) — measured on the dial as it's seen
    const keep = rot.style.transform, k = dots.indexOf(rot), a0 = mAng();
    rot.style.transform = `rotate(${(k ? -1 : 1) * (st.a + .25) * 360 / M}deg)`; const per = wrapA(mAng() - a0) / .25; rot.style.transform = keep;
    const perCard = (per < 0 ? -1 : 1) * 28;   // ~28° of turn per card: a short twist is enough
    let last = ang(e.clientX, e.clientY), lastY = e.clientY;
    g.setPointerCapture(e.pointerId); g.classList.add('drag');
    const mv = ev => { const a = ang(ev.clientX, ev.clientY), d = wrapA(a - last), dy = ev.clientY - lastY; last = a; lastY = ev.clientY;
      // near the dial: turn it; once the pointer is well away from it, a plain up / down drag keeps rolling
      const far = Math.hypot(ev.clientX - cx, ev.clientY - cy) > r.width * 1.2;
      st.target += far ? -dy / P.drag : d / perCard; if (!st.raf) st.raf = requestAnimationFrame(() => st.frame()); };
    const up = () => { g.removeEventListener('pointermove', mv, true); g.removeEventListener('pointerup', up, true); g.removeEventListener('pointercancel', up, true); knobDrag = false;
      g.classList.remove('drag'); st.target = Math.round(st.target); if (!st.raf) st.raf = requestAnimationFrame(() => st.frame()); };
    knobDrag = true; g.addEventListener('pointermove', mv, true); g.addEventListener('pointerup', up, true); g.addEventListener('pointercancel', up, true);
  }, true);
  // a click anywhere on the rolodex (not a drag) = one card forward
  let down = null;
  g.addEventListener('pointerdown', e => { down = {x:e.clientX, y:e.clientY}; }, true);
  g.addEventListener('pointerup', e => {
    if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) { down = null; return; }
    down = null; st.target = Math.round(st.target) + 1; if (!st.raf) st.raf = requestAnimationFrame(() => st.frame());
  });
  // ---- easter egg: shake it too hard and it breaks ----
  // two quick back-and-forths while dragging (3 changes of direction within ~1.4s, each stroke ≥30px and fast) → the knob pops off
  // on a coiled spring and falls on its side, the cards flop over. It stays broken until the page is rebuilt (reload / another project).
  const BK = { flips: 3, window: 1400, minRun: 30, speed: .2 };
  let bDown = false, broken = false, bDir = 0, bRun = 0, bY = 0, bT = 0, bT0 = 0, bFlips = [];
  g.addEventListener('dragstart', e => e.preventDefault());
  g.addEventListener('pointerdown', e => { bDown = !knobAt(e.clientX, e.clientY); bDir = 0; bRun = 0; bY = e.clientY; bT = bT0 = performance.now(); bFlips = []; }, true);
  addEventListener('pointerup', () => bDown = false); addEventListener('pointercancel', () => bDown = false);
  addEventListener('pointermove', e => {
    if (!bDown || broken || !g.isConnected) return;
    const now = performance.now(), dy = e.clientY - bY, dt = Math.max(1, now - bT); bY = e.clientY; bT = now;
    if (!dy) return;
    const d = Math.sign(dy);
    if (bDir && d !== bDir){ if (bRun >= BK.minRun && bRun / Math.max(1, now - bT0) >= BK.speed) bFlips.push(now); bRun = 0; }
    if (!bRun) bT0 = now - dt;
    bDir = d; bRun += Math.abs(dy);
    bFlips = bFlips.filter(t => now - t < BK.window);
    if (bFlips.length >= BK.flips) breakIt();
  }, true);
  ['pointerdown', 'pointerup', 'click'].forEach(ev => addEventListener(ev, e => { if (broken && g.contains(e.target)){ e.stopPropagation(); e.preventDefault(); } }, {capture: true, passive: false}));
  function breakIt(){
    broken = true; bDown = false; g.classList.add('broken'); g.classList.remove('drag');
    cancelAnimationFrame(st.raf); st.raf = 0; st.frame = () => { st.raf = 0; };   // the drum is dead now
    // the knob on the right pops off along the axle, drops and lies flat on its side
    const kb = [...rig.querySelectorAll('.knob1')].find(k => /translateX\((\d)/.test(k.style.transform)) || rig.querySelector('.knob1');
    const kw = kb && kb.parentNode, ground = P.legH + P.legY - 6;
    if (kw){
      const base = kw.style.transform || '', x0 = parseFloat((kb.style.transform.match(/translateX\((-?[\d.]+)px\)/) || [0, 0])[1]);
      const K = (dx, dy, rx, rz) => ({transform: `${base} translate3d(${x0 + dx}px, ${dy}px, 0) rotateX(${rx}deg) rotateZ(${rz}deg) translateX(${-x0}px)`});
      kw.animate([K(0, 0, 0, 0), K(50, -34, 90, 10), K(95, ground, 160, 80), K(102, ground - 12, 175, 86), K(106, ground, 180, 90)],
                 {duration: 1300, easing: 'cubic-bezier(.3,.1,.5,1)', fill: 'forwards'});
      // a hole where it sat, and a coiled spring boings out of it
      const xs = x0 - (P.knobT || 11) + 1.5, hr = Math.max(6, (P.knob || 80) * .16);
      const hole = document.createElement('div'); hole.className = 'k-hole';
      hole.style.cssText = `left:${-hr}px;top:${-hr}px;width:${2 * hr}px;height:${2 * hr}px;transform:translateX(${xs}px) rotateY(90deg)`;
      rig.appendChild(hole);
      const loops = 8, r = 3.2, dd = 9, w = loops * 2 * Math.PI * r + 4, h = 2 * dd + 4; let path = '';
      for (let t = 0; t <= loops * 2 * Math.PI; t += .18){ const x = 2 + r * t - dd * Math.sin(t), y = h / 2 - dd * Math.cos(t); path += (path ? ' L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1); }
      const sp = document.createElement('div'); sp.className = 'spring'; sp.style.top = (-h / 2) + 'px';
      sp.innerHTML = `<svg width="${w.toFixed(0)}" height="${h}" viewBox="0 0 ${w.toFixed(0)} ${h}"><path d="${path}"/></svg>`;
      rig.appendChild(sp);
      const S = (k, rz) => ({transform: `translateX(${xs}px) scaleX(${k}) rotateZ(${rz}deg)`});
      sp.animate([S(.04, 0), S(1.3, -10), S(.75, 7), S(1.12, -4), S(.92, 2), S(1, 0)], {duration: 1300, easing: 'ease-out', fill: 'forwards'});
    }
    // the cards come loose and flop over — forward or backward around the axle
    cards.forEach(c => {
      if (c.style.visibility === 'hidden') return;
      const T = c.style.transform, th = -parseFloat((T.match(/rotateX\((-?[\d.]+)deg\)/) || [0, 0])[1]), rn = (a, b) => a + Math.random() * (b - a);
      const fwd = th > P.openTilt + 4 || (Math.abs(th - P.openTilt) <= 4 && Math.random() < .5);
      const to = fwd ? rn(96, 104) : -rn(98, 112), over = fwd ? to + 6 : to - 6;
      const rest = `translateY(${(-P.rail + rn(2, 10)).toFixed(1)}px) rotateZ(${rn(-2.5, 2.5).toFixed(2)}deg)`;
      c.animate([{transform: T}, {transform: `rotateX(${-over}deg) ${rest}`, offset: .75}, {transform: `rotateX(${-to}deg) ${rest}`}],
                {duration: rn(700, 1100), delay: rn(0, 220), easing: 'cubic-bezier(.55,0,.8,.4)', fill: 'forwards'});
    });
  }
  build();
}
const FOR = {'Kayma Stories':'Kayma', 'Cognit':'Cognit', 'Showdigs':'Showdigs', 'Content Lab':'Content Lab'};
const same = (a, b) => !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();
// a testimonial can belong to several projects: "Science Museum, Young Scientists"
return { mount, indexFor: name => T.findIndex(t => (t.proj || '').split(',').some(p => same(p, name) || same(p, FOR[name]))) };
})();

// ---------------- case studies: chapters + slides (texts from studiostreetlight.com) ----------------
const CASES = window.__SL.cases;
function caseOf(i){
  const c = CASES[PROJECTS[i].name];
  if (c) return c;
  return {about:'Placeholder for the project story — the problem, the approach and what shipped. Keep it short; the images on the right carry the case.',
          chapters:[{key:'work', label:'Work', slides:Array.from({length:10}, (_, n) => ({t:'Slide ' + String(n+1).padStart(2,'0'), p:'Caption placeholder.'}))}]};
}
const info = document.getElementById('info');
let shownIdx = -2;
const page = document.getElementById('page');
const stage = document.getElementById('stage');
const guide = document.getElementById('guide');
const hud = document.getElementById('hud');

// ---------- build page ----------
page.innerHTML =
  `<section class="intro"><div class="tag"><small>scroll ↓</small>Intro</div></section>` +
  SECTIONS.map((s,i)=>`<section data-i="${i}"><div class="tag"><small>section ${String(i+1).padStart(2,'0')}</small>${s}</div></section>`).join('') +
  `<section class="outro"></section>` +
  `<section id="more"><div class="m-in"><div class="m-top"><div><div class="idx">More work</div><h2>Past projects.</h2></div><a class="fx solid m-all" href="/work"><span class="l-txt">All projects</span><span class="l-arr"><i>→</i><i>→</i></span></a></div><div class="m-table" role="table"><div class="m-row m-head" role="row"><span>Project</span><span>Industry</span><span>Year</span><span></span></div>${window.__SL.moreRows}</div></div></div></section>` +
  `<section id="about">
     <div class="ab-in">
       <div class="rv idx">About</div>
       <h2 class="rv tr tr--clear">Hey there, I’m Matan, and I run Streetlight.</h2>
       <p class="rv sub tr tr--gray">12 years of designing, directing and building digital products with a mix of creativity, fun and professional attitude. I take pride in my work, and so do my clients.</p>
       <p class="rv sub tr tr--gray">I collaborate with individuals, startups, and organizations that understand the value of good design and strive to make a positive impact in the world.</p>
       <div class="services rv"><div class="lbl">—&nbsp;&nbsp;&nbsp;Services</div>
         <div class="cols"><div><h3>Product Design</h3><ul><li>UX/UI</li><li>Prototyping</li><li>Design systems</li><li>Wireframes</li><li>Journey maps</li><li>Research</li><li>Icon design</li><li>Micro-interactions</li><li>Information architecture</li><li>Product audits</li><li>Dev support</li></ul></div><div><h3>Web Design &amp; Development</h3><ul><li>Website design</li><li>Art direction</li><li>UX/UI</li><li>Development</li><li>Interactions</li><li>Storytelling</li><li>Web animations</li><li>Support &amp; maintenance</li></ul></div><div><h3>Brand &amp; Marketing</h3><ul><li>Concept development</li><li>Brand identity</li><li>Brand guidelines</li><li>Illustration</li><li>Motion design</li><li>Infographics</li><li>Marketing assets</li></ul></div></div></div>
       <div class="awards rv"><div class="lbl">—&nbsp;&nbsp;&nbsp;Awards &amp; recognition</div>
         <div class="aw"><div><b>Awwwards</b><span>3 Awards</span></div><div><b>CSS Design Awards</b><span>3 Awards</span></div><div><b>CSS Winner</b><span>1 Award</span></div></div></div>
       <div class="clients rv"><div class="lbl">—&nbsp;&nbsp;&nbsp;Past &amp; current clients</div>
         <div class="strip"><div class="slot"><span class="lg"></span></div><div class="slot"><span class="lg"></span></div><div class="slot"><span class="lg"></span></div><div class="slot"><span class="lg"></span></div><div class="slot"><span class="lg"></span></div></div></div>
       <div class="ab-cta rv"><a class="fx solid ab-btn" href="#contact" data-nav="contact"><span class="l-txt">Let’s Collab</span><span class="l-arr"><i>→</i><i>→</i></span></a></div>
     </div>
   </section>
   <footer id="foot" class="site-foot">
     <div class="ft-l"><span>© <span class="ft-y"></span> Streetlight Studio</span></div>
     <a class="ft-logo" href="/" aria-label="Streetlight — back to top"><span class="lt-logo" data-logo aria-hidden="true"></span></a>
     <div class="ft-r">
       <a href="mailto:matan@studiostreetlight.com?subject=Hey%20Streetlight" title="matan@studiostreetlight.com">Email</a><i class="ft-div"></i>
       <a href="https://www.linkedin.com/in/mbd1/" target="_blank" rel="noopener" title="LinkedIn">LI</a><i class="ft-div"></i>
       <a href="https://www.instagram.com/studio.streetlight/" target="_blank" rel="noopener" title="Instagram">IN</a><i class="ft-div"></i>
       <a href="https://x.com/matanbendavid_" target="_blank" rel="noopener" title="X">X</a>
     </div>
   </footer>`;
const secEls = [...page.querySelectorAll('section[data-i]')];
const allSecs = [...page.querySelectorAll('section')];
allSecs.forEach(sec=>sec.insertAdjacentHTML('beforeend','<div class="pct"></div>'));
const pctEls = allSecs.map(sec=>sec.querySelector('.pct'));

// ---------- build cubes ----------
const face = (cls, inner) => `<div class="face ${cls}">${inner}</div>`;
const cubes = SECTIONS.map((s,i)=>{
  const w = document.createElement('div');
  w.className = 'wrap';
  w.innerHTML = `<div class="shadow"></div><div class="cube">
    ${face('f-front', `<span class="num">${String(i+1).padStart(2,'0')}</span><div class="m-circle"></div><div class="hl"></div>`)}
    ${face('f-back',  `<div class="m-bar"></div>`)}
    ${face('f-right', `<div class="m-bar"></div>`)}
    ${face('f-left',  `<div class="m-cross"></div>`)}
    ${face('f-top',   `<svg width="40%" height="40%" viewBox="0 0 10 10"><path d="M5 1 L9 9 L1 9 Z" fill="none" stroke="currentColor" stroke-width=".6"/></svg>`)}
    ${face('f-bottom','')}
  </div>`;
  stage.appendChild(w);
  return {wrap:w, cube:w.querySelector('.cube'), shadow:w.querySelector('.shadow')};
});
// the CMS hero image on the card's face (the flying hero picks it up from here too)
cubes.forEach((c, i) => { const H = PROJECTS[i] && PROJECTS[i].hero; if (!H) return;
  const top = c.wrap.querySelector('.f-top'); top.classList.add('img'); top.innerHTML = '';
  if (!H.video){ top.style.backgroundImage = `url('${sbm(H.url, 800)}')`; return; }
  // a video hero: its poster (a frame) until the card is active — then it plays; inactive again = it just pauses where it is
  if (H.poster) top.style.backgroundImage = `url('${H.poster}')`;
  top.innerHTML = `<video class="cv" muted loop playsinline preload="none" data-src="${H.url}"${H.poster ? ` poster="${H.poster}"` : ''}></video>`; });
// seek once the video knows its length (a seek before that is ignored); '#t=5' on the URL = start (and poster) at 5s
const seekTo = (v, t) => { if (!(t > 0)) return; if (v.readyState >= 1) v.currentTime = t; else v.addEventListener('loadedmetadata', () => { v.currentTime = t; }, {once: true}); };
const startAt = u => +((/#t=([\d.]+)/.exec(u || '') || [])[1] || 0);
const cubeVid = (i, on) => { const v = i >= 0 && cubes[i] && cubes[i].wrap.querySelector('video.cv'); if (!v) return null;
  if (on){ if (!v.src){ v.src = v.dataset.src; seekTo(v, startAt(v.dataset.src)); } v.play().catch(() => {}); } else v.pause(); return v; };

// ---------- hairline figures on the front faces ----------
const FIGS = ['vault','terrain','terrain','turntable','phone','phone','router','terminal'];
const figs = cubes.map((c,i)=>{
  try { return Hairline[FIGS[i]](c.wrap.querySelector('.hl'), {theme:'light', play:false, intensity:.6}); }
  catch(err){ console.warn('hairline', err); return null; }
});

// ---------- params ----------
const P = {};
const ids = {sx:'v-sx',sy:'v-sy',sz:'v-sz',gap:'v-gap',lift:'v-lift',scale:'v-scale',hold:'v-hold',rad:'v-rad',spin:'v-spin'};
function readParams(){
  for (const k in ids){ P[k] = +document.getElementById(k).value; document.getElementById(ids[k]).textContent = P[k]; }
  // phones: smaller cards, gentler zoom on the active one
  if (matchMedia('(max-width:800px)').matches){ const m = Math.min(1, innerWidth / 560); P.sx *= m * .62; P.sy *= m * .62; P.sz *= m * .62; P.scale = (innerWidth - 48) / P.sx; P.gap *= .7; }   // phones: the active card fills the width (inside the page padding)
  P.lane = document.querySelector('input[name=lane]:checked').value;
  P.exit = document.querySelector('input[name=exit]:checked').value;
  P.target = document.querySelector('input[name=target]:checked').value;
  const rs = document.documentElement.style;
  rs.setProperty('--W', P.sx+'px'); rs.setProperty('--H', P.sy+'px'); rs.setProperty('--D', P.sz+'px');
  stage.classList.toggle('flat', P.sz < 2);
  stage.classList.toggle('top-target', document.querySelector('input[name=target]:checked').value === 'top');
  stage.classList.toggle('figs', document.getElementById('figs').checked);
  stage.classList.toggle('xray', document.getElementById('xray').checked);
  guide.style.display = document.getElementById('guideOn').checked ? '' : 'none';
  measure(); render();
}
document.getElementById('ctl').addEventListener('input', ev=>{
  const t = ev.target;
  if (document.getElementById('lock').checked && ['sx','sy','sz'].includes(t.id))
    ['sx','sy','sz'].forEach(k=>document.getElementById(k).value = t.value);
  readParams();
});

// ---------- math ----------
const clamp = (v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const smooth = t => t*t*(3-2*t);
const lerp = (a,b,t)=>a+(b-a)*t;
const ISO_X = -35.264, ISO_Y = 45;

let A = [];          // scrollY at which each section is centered
function measure(){
  const vh = innerHeight;
  A = secEls.map(el => el.offsetTop + el.offsetHeight/2 - vh/2);
}

// lane position L (in cube units): L = i means cube i sits at the focus point
function laneL(s){
  if (s <= A[0])   return (s - A[0]) / (A[1]-A[0]);
  if (s >= A[N-1]) return N-1 + (s - A[N-1]) / (A[N-1]-A[N-2]);
  let i = 0; while (s > A[i+1]) i++;
  const u = (s - A[i]) / (A[i+1]-A[i]);
  const h = P.hold/2;
  const t = clamp((u - h) / Math.max(1e-4, 1 - 2*h));
  return i + smooth(t);
}

function render(){
  allSecs.forEach((sec,k)=>{ pctEls[k].textContent = (sec.getBoundingClientRect().top / innerHeight * 100).toFixed(0) + '%'; });
  const W = innerWidth, H = innerHeight;
  const L = laneL(scrollY);

  // lane direction (unit vector pointing up-right)
  let dx, dy;
  if (P.lane === 'iso'){ dx = Math.cos(Math.PI/6); dy = -Math.sin(Math.PI/6); }
  else { const m = Math.hypot(W,H); dx = W/m; dy = -H/m; }
  const fx = W/2, fy = H/2;

  // guides
  const far = Math.hypot(W,H);
  guide.innerHTML =
    `<line x1="${fx-dx*far}" y1="${fy-dy*far}" x2="${fx+dx*far}" y2="${fy+dy*far}" style="stroke:var(--guide-line,#bdb9af)" stroke-dasharray="4 6"/>`;

  let active = -1, best = 0;
  cubes.forEach((c,i)=>{
    const d = (i - L) * P.gap;                 // >0 = upcoming (up-right), <0 = passed (down-left)
    const x = fx + dx*d, y = fy + dy*d;
    const e = 1 - smooth(clamp(Math.abs(L - i) / P.rad));   // 0 = iso, 1 = frontal
    if (e > best){ best = e; active = i; }

    // "stay": once a cube has passed its section it keeps facing the user
    const eRot = (P.exit === 'stay' && L >= i) ? 1 : e;
    const rx = lerp(ISO_X, P.target === 'top' ? -90 : 0, eRot);
    const ry = (ISO_Y + 360*P.spin) * (1 - eRot);
    const sc = lerp(1, P.scale, e);
    const lift = P.lift * e;

    c.wrap.style.transform = `translate(${x}px,${y}px)`;
    c.wrap.style.zIndex = e > 0.01 ? 1000 + Math.round(e*100) : Math.round(y);
    c.wrap.classList.toggle('on', e > 0.98);
    c.cube.style.transform = `translateY(${-lift}px) scale(${sc}) rotateX(${rx}deg) rotateY(${ry}deg)`;
    c.cube.style.setProperty('--bw', (1 / sc).toFixed(3) + 'px');   // the border stays 1px on screen however much the card is zoomed

    // ground footprint: iso diamond that stays on the lane, fades in as cube lifts
    const half = P.sy/2;
    c.shadow.style.transform = `rotateX(${ISO_X}deg) rotateY(${ISO_Y}deg) translateY(${half}px) rotateX(90deg)`;
    c.shadow.style.opacity = e;
  });

  // info text: shown only while the active cube is fully frontal (red)
  const onIdx = best > 0.98 ? active : -1;
  lastActive = active; lastBest = best;
  if (onIdx !== shownIdx){
    if (openIdx < 0){ cubeVid(shownIdx, false); cubeVid(onIdx, true); }
    shownIdx = onIdx;
    figs.forEach((f,k)=>f && f.update({play: k === onIdx}));
    if (onIdx >= 0){
      const pr = PROJECTS[onIdx];
      info.classList.remove('show');
      info.innerHTML = `<div class="idx">${String(onIdx+1).padStart(2,'0')} / ${String(N).padStart(2,'0')}</div>
        <h2>${pr.name}</h2>${pr.lines.map(l=>`<p>${l}</p>`).join('')}<div class="meta">${pr.meta}</div><button class="view fx ghost" data-i="${onIdx}"><span class="l-txt">${pr.ext ? 'View live' : 'View project'}</span><span class="l-arr"><i>${pr.ext ? '↗' : '→'}</i><i>${pr.ext ? '↗' : '→'}</i></span></button>`;
      void info.offsetWidth;
      info.classList.add('show');
    } else info.classList.remove('show');
  }
  const sec = active >= 0 ? SECTIONS[active] : '—';
  hud.innerHTML =
    `scroll <b>${Math.round(scrollY)}</b>px<br>` +
    `lane L <b>${L.toFixed(2)}</b><br>` +
    `active <b>${active >= 0 ? String(active+1).padStart(2,'0')+' '+sec : '—'}</b><br>` +
    `turn <b>${(best*100).toFixed(0)}%</b>`;
}

let raf = 0;
addEventListener('scroll', ()=>{ if(!raf) raf = requestAnimationFrame(()=>{ raf=0; render(); }); }, {passive:true});
addEventListener('resize', ()=>{ measure(); render(); });

// ---------------- street lamp kit — hairline iso lamps in several styles ----------------
// LampKit.get(style, dir) → {svg, minX, minY, w, h}; dir 0..3 = arm along one of the 4 street directions.
const LampKit = (function(){
  const C = Math.cos(Math.PI/6), S = .5;
  const Pj = (x,y,z)=>[(x - z)*C, (x + z)*S - y];
  const DIRS = [[1,0],[0,1],[-1,0],[0,-1]];
  const STYLES = ['classic','mushroom','cobra','double','post','globe','ornate'];
  const cache = {};

  function make(style, dirIdx, deg){
    const dd = deg === undefined ? DIRS[dirIdx] : [Math.cos(deg*Math.PI/180), Math.sin(deg*Math.PI/180)], pp = [-dd[1], dd[0]], nd = [-dd[0], -dd[1]];
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
        // oriented head box: draw the side faces that face the viewer, then the top
        const s0 = 17, s1 = 36, w = 4.2, y0 = H-2.5, y1 = H+1.5;
        const c = (s, q, y) => [dd[0]*s + pp[0]*q, y, dd[1]*s + pp[1]*q];
        const sides = [[[s1,-w],[s1,w], dd], [[s0,w],[s0,-w], nd], [[s0,w],[s1,w], pp], [[s1,-w],[s0,-w], [-pp[0],-pp[1]]]];
        sides.filter(f => f[2][0] + f[2][1] > 0).forEach(([a,b]) => path([c(a[0],a[1],y0), c(b[0],b[1],y0), c(b[0],b[1],y1), c(a[0],a[1],y1)], 'f edge'));
        path([c(s0,-w,y1), c(s1,-w,y1), c(s1,w,y1), c(s0,w,y1)], 'f hi');
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
    get(style, dir){ const k = style+dir; return cache[k] || (cache[k] = make(style, dir)); },
    at(style, deg){ deg = ((Math.round(deg) % 360) + 360) % 360; const k = style+'@'+deg; return cache[k] || (cache[k] = make(style, 0, deg)); }
  };
})();

// home uses the tuned lamps (values from the lamps page) — per-lamp base rotation + shared light settings
const HomeLamps = (function(){
  const ROT = {double:90, ornate:90}, G = {rays:6, pool:1.2}, cache = {};
  return { STYLES: LampKit2.STYLES.filter(st => st !== 'ornate'),   // ornate is shelved for now
    at(style, deg){ deg = ((Math.round(deg) % 360) + 360) % 360; const k = style+'@'+deg;
      return cache[k] || (cache[k] = LampKit2.make(style, deg + (ROT[style] || 0), G)); } };
})();
// ---------- home street lamp: cobra head — big in the centre, shrinks into place as you scroll ----------
(function(){
  const svg = document.getElementById('lamp');
  // fixed frame = union of every rotation, so the pole stays put while the head sweeps around
  let SPIN = 0; const SPIN_STEP = 0;   // extra turn added on every lamp change
  let morphing = false, FLOOR = 1, STYLE = (() => { try { return sessionStorage.getItem('sl-lamp') || 'cobra'; } catch(e){ return 'cobra'; } })(), ratio = 1, glow, pool, lastDeg = null, SINK = 0, FLICK = 1, swapping = false;
  const boxCache = {};
  const LAMP_SIZE = { mushroom: .9, post: .9, globe: .9 };   // relative to the cobra (1)
  window.homeLampGeo = { box: st => boxOf(st), deg: () => lastDeg || 0 };
  function boxOf(st){
    if (boxCache[st]) return boxCache[st];
    let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
    for (let a = 0; a < 360; a += 15){ const d = HomeLamps.at(st, a); bx0 = Math.min(bx0, d.minX); by0 = Math.min(by0, d.minY); bx1 = Math.max(bx1, d.minX + d.w); by1 = Math.max(by1, d.minY + d.h); }
    // some lamps read too big next to the cobra: their frame grows around the lamp's foot (0,0), so they draw smaller in the same space
    const k = 1 / (LAMP_SIZE[st] || 1);
    return boxCache[st] = [bx0 * k, by0 * k, bx1 * k, by1 * k];
  }
  function applyBox([bx0, by0, bx1, by1]){
    svg.setAttribute('viewBox', `${bx0} ${by0} ${bx1-bx0} ${by1-by0}`);
    ratio = (bx1-bx0) / (by1-by0);
    FLOOR = (0 - by0) / (by1 - by0);            // where the pavement (lamp base, y = 0) sits in the box, 0..1
  }
  function frameFor(){ applyBox(boxOf(STYLE)); }
  frameFor();
  function setAngle(deg){
    deg = Math.round(deg); if (morphing || deg === lastDeg) return; lastDeg = deg;
    svg.innerHTML = HomeLamps.at(STYLE, deg).svg;
    glow = svg.querySelector('.glow'); pool = svg.querySelector('.pool');
  }
  setAngle(0);
  // easter egg hook: swap the home lamp's style
  // style change: the lamp sinks into the pavement, the new one rises out of it, then its light flickers on
  const anim = (ms, fn, ease) => new Promise(res => { const t0 = performance.now(); (function f(now){ const k = Math.min(1, (now - t0) / ms); fn(ease ? ease(k) : k); if (k < 1) requestAnimationFrame(f); else res(); })(t0); });
  const inQ = k => k * k * k, outBack = k => { const c = 1.6; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };
  // ---- morph / pop: every drawn element of the old lamp folds away, the new lamp's elements unfold
  const clamp01 = v => v < 0 ? 0 : v > 1 ? 1 : v, sm = k => k * k * (3 - 2 * k);
  // bbox straight from the drawing data (no layout reads → smooth)
  function bboxOf(el){
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; const add = (x, y) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); };
    if (el.tagName === 'circle'){ const cx = +el.getAttribute('cx'), cy = +el.getAttribute('cy'), r = +el.getAttribute('r'); add(cx - r, cy - r); add(cx + r, cy + r); }
    else if (el.tagName === 'path'){
      for (const seg of (el.getAttribute('d') || '').match(/[A-Za-z][^A-Za-z]*/g) || []){
        const n = (seg.slice(1).match(/-?\d*\.?\d+(?:e-?\d+)?/g) || []).map(Number);
        if (seg[0] === 'A'){ for (let k = 5; k + 1 < n.length; k += 7) add(n[k], n[k + 1]); }
        else for (let k = 0; k + 1 < n.length; k += 2) add(n[k], n[k + 1]);
      }
    } else if (el.tagName === 'g') return null;
    return {x: x0, y: y0, width: x1 - x0, height: y1 - y0};
  }
  const prepCache = {};
  function prep(st, deg){
    const key = st + '@' + deg; if (prepCache[key]) return prepCache[key];
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.innerHTML = HomeLamps.at(st, deg).svg;
    const fx = [...g.querySelectorAll('.pool, .glow')];
    const els = [...g.children].filter(e => !fx.includes(e)).map(el => { const b = bboxOf(el); return b && {el, cx: b.x + b.width/2, cy: b.y + b.height/2, top: b.y}; }).filter(Boolean);
    const axis = els.filter(e => Math.abs(e.cx) < 4), off = els.filter(e => Math.abs(e.cx) >= 4);
    const H = -Math.min(...axis.map(e => e.top), -1);
    // stagger order by rank (not raw distance) so the cascade is evenly spread
    off.sort((a, b) => Math.hypot(a.cx, a.cy + H) - Math.hypot(b.cx, b.cy + H)).forEach((e, k) => e.d = off.length > 1 ? k / (off.length - 1) : 0);
    [...els].sort((a, b) => b.cy - a.cy).forEach((e, k) => e.h = els.length > 1 ? k / (els.length - 1) : 0);   // 0 = bottom … 1 = top
    return prepCache[key] = {g, fx, els, axis, off, H};
  }
  const M = (el, s, sy, tx, ty, op) => { el.setAttribute('transform', `matrix(${Math.max(s, .001)},0,0,${Math.max(sy, .001)},${tx},${ty})`); el.style.opacity = op; };
  // shrink an element into point (ax, ay): k = 0 in place … 1 gone (k may overshoot below 0 for a little pop)
  const fold = (e, k, ax, ay) => { const s = 1 - k, kk = Math.max(0, k), nx = e.cx + (ax - e.cx) * kk, ny = e.cy + (ay - e.cy) * kk; M(e.el, s, s, nx - s * e.cx, ny - s * e.cy, k > .97 ? 0 : 1); };
  const inBack = k => { const c = 1.7; return k * k * ((c + 1) * k - c); };          // dips first, then collapses fast
  const ioCubic = k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
  const win = (t, a, len) => clamp01((t - a) / len);
  async function morphTo(st, mode){
    const d0 = lastDeg || 0, bA = boxOf(STYLE), bB = boxOf(st);
    morphing = true; glow = pool = document.createElement('i');   // the light loop drives a dummy while we fade lights by hand
    let A, B, cur = null;
    const build = deg => {                     // swap in the (cached) drawings for this heading — the lamp spins while it morphs
      deg = ((Math.round(deg / 3) * 3) % 360 + 360) % 360; if (deg === cur) return; cur = deg;
      A = prep(STYLE, deg); B = prep(st, deg);
      [...svg.children].forEach(c => c.remove()); svg.appendChild(A.g); svg.appendChild(B.g);
      B.fx.forEach(f => { if (f.classList.contains('glow')) f.style.visibility = 'hidden'; });
    };
    const T = 1150;
    await anim(T, t => {
      build(d0 + SPIN_STEP * ioCubic(win(t, .08, .72)));                       // fast turn through the middle
      applyBox(bA.map((v, i) => v + (bB[i] - v) * sm(win(t, .3, .35)))); size();
      if (mode === 'pop'){
        // old lamp: every piece pops shut in a top-down cascade; new lamp pops open bottom-up
        A.els.forEach(e => fold(e, inBack(win(t, (1 - e.h) * .35, .16)), e.cx, e.cy));
        B.els.forEach(e => fold(e, 1 - outBack(win(t, .48 + e.h * .34, .18)), e.cx, e.cy));
      } else {
        // heads/arms snap back into the pole one by one (furthest first), the pole stretches into the new one, new parts spring out
        A.off.forEach(e => fold(e, inBack(win(t, (1 - e.d) * .28, .16)), 0, Math.max(e.cy, -A.H)));
        const u = sm(win(t, .28, .3)), r = B.H / A.H;
        A.axis.forEach(e => M(e.el, 1, 1 + (r - 1) * u, 0, 0, 1 - u));
        B.axis.forEach(e => M(e.el, 1, 1 / r + (1 - 1 / r) * u, 0, 0, u));
        B.off.forEach(e => fold(e, 1 - outBack(win(t, .52 + e.d * .3, .18)), 0, Math.max(e.cy, -B.H)));
      }
      A.fx.forEach(f => f.style.opacity = 1 - win(t, 0, .12));
      B.fx.forEach(f => { if (f.classList.contains('pool')) f.style.opacity = sm(win(t, .75, .25)) * .6; });
    });
    [...svg.children].forEach(c => c.remove());
    for (const k in prepCache) delete prepCache[k];                            // drawings carry morph transforms — drop them
    SPIN += SPIN_STEP; STYLE = st; frameFor(); morphing = false; lastDeg = null; size();
  }
  // ---- flow: every line of the old lamp turns into a line of the new one (nothing vanishes) ----
  // each shape → polyline → resampled to N points; shapes are paired by nearest centre (extra ones split / merge)
  const FN = 36;
  function polyOf(el){
    if (el.tagName === 'circle'){ const cx = +el.getAttribute('cx'), cy = +el.getAttribute('cy'), r = +el.getAttribute('r'), a = [];
      for (let k = 0; k < 24; k++){ const t = k / 24 * Math.PI * 2; a.push([cx + r * Math.cos(t), cy + r * Math.sin(t)]); } return {pts: a, closed: true}; }
    const a = []; let closed = false;
    for (const seg of (el.getAttribute('d') || '').match(/[A-Za-z][^A-Za-z]*/g) || []){
      const n = (seg.slice(1).match(/-?\d*\.?\d+(?:e-?\d+)?/g) || []).map(Number), c = seg[0];
      if (c === 'Z' || c === 'z'){ closed = true; continue; }
      if (c === 'A'){ for (let k = 5; k + 1 < n.length; k += 7){ const p0 = a[a.length - 1], p1 = [n[k], n[k + 1]];
          for (let j = 1; j <= 6; j++){ const t = j / 6, bulge = Math.sin(t * Math.PI) * .35; a.push([p0[0] + (p1[0] - p0[0]) * t + (p1[1] - p0[1]) * bulge, p0[1] + (p1[1] - p0[1]) * t - (p1[0] - p0[0]) * bulge]); } } continue; }
      for (let k = 0; k + 1 < n.length; k += 2) a.push([n[k], n[k + 1]]);
    }
    return a.length ? {pts: a, closed} : null;
  }
  function resample(pts, closed, N){
    const P = closed ? pts.concat([pts[0]]) : pts, L = [0];
    for (let i = 1; i < P.length; i++) L.push(L[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
    const tot = L[L.length - 1] || 1e-6, out = []; let j = 1;
    for (let k = 0; k < N; k++){
      const d = closed ? tot * k / N : tot * k / (N - 1);
      while (j < P.length - 1 && L[j] < d) j++;
      const seg = (L[j] - L[j - 1]) || 1e-6, t = Math.min(1, Math.max(0, (d - L[j - 1]) / seg));
      out.push([P[j - 1][0] + (P[j][0] - P[j - 1][0]) * t, P[j - 1][1] + (P[j][1] - P[j - 1][1]) * t]);
    }
    return out;
  }
  function shapesOf(st, deg){
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.innerHTML = HomeLamps.at(st, deg).svg;
    const fx = [...g.querySelectorAll('.pool, .glow')], list = [];
    [...g.children].filter(e => !fx.includes(e)).forEach((el, i) => {
      const p = polyOf(el); if (!p) return;
      const pts = resample(p.pts, p.closed, FN), c = pts.reduce((a, q) => [a[0] + q[0] / FN, a[1] + q[1] / FN], [0, 0]);
      list.push({pts, closed: p.closed, cls: el.getAttribute('class') || 'edge', c, i});
    });
    return {g, fx, list};
  }
  // best start offset (and direction) of b's loop to line up with a's
  function align(a, b, closed){
    const cands = closed ? [] : [b, [...b].reverse()];
    if (closed) for (const bb of [b, [...b].reverse()]) for (let o = 0; o < FN; o += 2) cands.push(bb.slice(o).concat(bb.slice(0, o)));
    let best = cands[0], bd = 1e18;
    for (const c of cands){ let d = 0; for (let k = 0; k < FN; k += 3) d += (a[k][0] - c[k][0]) ** 2 + (a[k][1] - c[k][1]) ** 2; if (d < bd){ bd = d; best = c; } }
    return best;
  }
  async function flowTo(st){
    const d0 = lastDeg || 0, d1 = d0 + SPIN_STEP, bA = boxOf(STYLE), bB = boxOf(st);
    const A = shapesOf(STYLE, ((Math.round(d0) % 360) + 360) % 360), B = shapesOf(st, ((Math.round(d1) % 360) + 360) % 360);
    morphing = true; glow = pool = document.createElement('i');
    const near = (p, L) => L.reduce((best, q) => { const d = Math.hypot(p.c[0] - q.c[0], p.c[1] - q.c[1]); return d < best[0] ? [d, q] : best; }, [1e18, null])[1];
    const pairs = [], used = new Set();
    B.list.forEach(b => { const a = near(b, A.list); used.add(a); pairs.push({a, b, ord: b.i}); });            // every new shape grows out of the closest old one
    A.list.filter(a => !used.has(a)).forEach(a => { const b = near(a, B.list); pairs.push({a, b, ord: b.i - .5}); });   // leftovers flow into the closest new one
    pairs.sort((x, y) => x.ord - y.ord);
    // stagger: from the base upward
    [...pairs].sort((x, y) => (y.a.c[1] + y.b.c[1]) - (x.a.c[1] + x.b.c[1])).forEach((p, k) => p.delay = k / Math.max(1, pairs.length - 1));
    const NS = 'http://www.w3.org/2000/svg', layer = document.createElementNS(NS, 'g');
    [...svg.children].forEach(c => c.remove());
    A.fx.forEach(f => layer.appendChild(f)); B.fx.forEach(f => { layer.appendChild(f); f.style.opacity = 0; });
    pairs.forEach(p => {
      const closed = p.a.closed && p.b.closed, from = p.a.pts, to = align(from, p.b.pts, closed);
      p.from = from; p.to = to; p.closed = closed || p.b.closed;
      p.el = document.createElementNS(NS, 'path'); layer.appendChild(p.el);
    });
    A.fx.forEach(f => layer.insertBefore(f, layer.firstChild));
    svg.appendChild(layer);
    const fmtP = q => q[0].toFixed(2) + ' ' + q[1].toFixed(2);
    await anim(1250, t => {
      applyBox(bA.map((v, i) => v + (bB[i] - v) * ioCubic(win(t, .1, .7)))); size();
      for (const p of pairs){
        const k = ioCubic(win(t, p.delay * .4, .6));
        p.el.setAttribute('class', k < .5 ? p.a.cls : p.b.cls);
        p.el.setAttribute('d', 'M' + p.from.map((q, i) => fmtP([q[0] + (p.to[i][0] - q[0]) * k, q[1] + (p.to[i][1] - q[1]) * k])).join('L') + (p.closed && k > .5 ? 'Z' : (p.a.closed && k <= .5 ? 'Z' : '')));
      }
      A.fx.forEach(f => f.style.opacity = 1 - win(t, 0, .15));
      B.fx.forEach(f => { f.style.opacity = f.classList.contains('glow') ? 0 : sm(win(t, .75, .25)) * .6; });
    });
    [...svg.children].forEach(c => c.remove());
    SPIN += SPIN_STEP; STYLE = st; frameFor(); morphing = false; lastDeg = null; size();
  }
  window.setHomeLamp = async st => {
    try { sessionStorage.setItem('sl-lamp', st); } catch(e){}   // the playground's lamps follow the one picked here
    if (swapping) return; swapping = true; document.body.classList.add('lamp-swap');
    const mode = (document.querySelector('input[name=lampFx]:checked') || {}).value || 'flow';
    if (mode !== 'sink'){
      FLICK = 0; await (mode === 'flow' ? flowTo(st) : morphTo(st, mode));
      await anim(350, k => FLICK = k);   // light just fades back in
      FLICK = 1; document.body.classList.remove('lamp-swap'); swapping = false; return;
    }
    await anim(380, k => { SINK = k; FLICK = 1 - k; size(); }, inQ);
    STYLE = st; frameFor(); const d = lastDeg; lastDeg = null; setAngle(d || 0);
    await anim(560, k => { SINK = 1 - k; size(); }, outBack);
    SINK = 0; size();
    // flicker on
    await anim(350, k => FLICK = k);
    FLICK = 1; document.body.classList.remove('lamp-swap'); swapping = false;
  };
  window.homeLampStyle = () => STYLE;
  let on = 0, target = 0;
  const easeIO = t => t<.5 ? 2*t*t : 1-Math.pow(-2*t+2,2)/2;
  function size(){
    const mob = innerWidth <= 800;
    const small = mob ? 110 : 170, big = mob ? Math.min(innerHeight * .5, 400) : Math.min(innerHeight * .66, 560);
    const t = easeIO(clamp(scrollY / (innerHeight * .6)));            // 0 at the top of the page → 1 after ~60% of a screen
    const mo = document.getElementById('more'), ab = document.getElementById('about');
    // tail: 0 when the list starts entering → 1 when About is settled
    const q0 = mo ? clamp((scrollY + innerHeight - mo.offsetTop) / Math.max(1, (ab.offsetTop - mo.offsetTop) + innerHeight * .2)) : 0;
    const ly = +document.getElementById('lampY').value;
    const bigAbout = mob ? Math.min(innerHeight * .4, 336) : Math.min(innerHeight * .82, 720);   // phones: smaller at the end so its base stays above the footer
    let h, top, left = 50, op = 1;
    // tail, in two legs:
    //  1) from the end of the last project until the table is done: grows and turns 1½ times, moving over to the right of the table
    //  2) from the table's end until About is in place: slides diagonally down-left and turns another ½
    let a1 = 0, a2 = 0;
    if (mo && ab){
      // leg 1 runs while the table slides in, then the lamp holds still for the whole table (however long it gets)
      const vh = innerHeight, s0 = mo.offsetTop - vh, e0 = mo.offsetTop - vh * .15, tb = mo.querySelector('.m-table'), tEnd = tb ? tb.getBoundingClientRect().bottom + scrollY : mo.offsetTop + mo.offsetHeight,
            s1 = Math.max(e0, tEnd - vh * .35)   /* moves on once the last row has scrolled up past ~⅓ of the screen */, s2 = Math.min(document.documentElement.scrollHeight - vh, s1 + 2 * Math.max(vh * .3, ab.offsetTop - vh * .1 - s1));   // last leg stretched ×2
      a1 = easeIO(clamp((scrollY - s0) / Math.max(1, e0 - s0)));
      a2 = easeIO(clamp((scrollY - s1) / Math.max(1, s2 - s1)));
    }
    const midH = bigAbout * .8;
    if (a1 <= 0){ h = lerp(big, small, t); top = lerp(50, ly, t); }
    else {
      h = lerp(small, midH, a1) + (bigAbout - midH) * a2;
      top = lerp(ly, 46, a1) + (54 - 46) * a2;
      left = lerp(50, 63, a1) + ((mob ? 80 : 24) - 63) * a2;   // over the table it stands in the gap between the years and the hover buttons; phones: About ends with it on the right, beside the awards + Let's Collab
    }
    svg.setAttribute('height', h); svg.setAttribute('width', h*ratio);
    // SINK: 0 = standing, 1 = fully under the floor (moved down by its height, clipped at the floor line)
    svg.style.transform = `translate(-50%,-50%) translateY(${SINK * FLOOR * h}px)`;
    svg.style.clipPath = SINK > 0 ? `inset(0 0 ${(1 - FLOOR + SINK * FLOOR) * 100}% 0)` : '';
    svg.style.top = top + '%'; svg.style.left = left + '%'; svg.style.opacity = op;
    setAngle(360 * t + 540 * a1 + (mob ? 360 : 180) * a2 + SPIN);   // phones: a full turn through About (½ over the text, ½ more as it moves right)                                     // the turn ends exactly when it lands — head pointing right, at the text                       // 1¼ turns → ends with the head pointing left, at the text
    svg.style.display = document.getElementById('lampOn').checked ? '' : 'none';
    const it = document.getElementById('intro'); if (it){ const k = clamp(scrollY / (innerHeight * .45)); it.style.opacity = 1 - k; it.style.transform = `translate(-50%, calc(-50% - ${k * 80}px))`; }
    document.getElementById('v-lampY').textContent = ly;
    // red label with the lamp's name, next to it
    const tg = document.getElementById('lampTag');
    if (tg){ const r = svg.getBoundingClientRect(); tg.textContent = STYLE; tg.style.left = (r.left + r.width * .5 + 18) + 'px'; tg.style.top = (r.bottom - Math.min(r.height * .12, 40)) + 'px';
      tg.style.opacity = svg.style.display === 'none' ? 0 : op * (1 - SINK); }
  }
  addEventListener('pointermove', e=>{
    const r = svg.getBoundingClientRect();
    const dist = Math.hypot(e.clientX-(r.left+r.width/2), e.clientY-(r.top+r.height/2));
    target = 1 - clamp((dist-60)/(260 + r.height*.4));
  });
  (function tick(){
    on += (target - on) * .08;
    glow.style.opacity = (0.15 + 0.85*on*(0.92 + Math.random()*0.08)) * FLICK;
    pool.style.opacity = 0.35 + 0.65*on;
    requestAnimationFrame(tick);
  })();
  document.getElementById('lampOn').addEventListener('change', size);
  document.getElementById('lampY').addEventListener('input', size);
  addEventListener('scroll', size, {passive:true});
  addEventListener('resize', size);
  size();
})();
// ---------- save / load parameters ----------
const STORE_KEY = 'iso-cubes-params-v1';
const ctl = document.getElementById('ctl');
const fields = () => [...ctl.querySelectorAll('input')].filter(el => el.type !== 'file');
const DEFAULTS = (()=>{ const o={}; fields().forEach(el=>{ o[el.type==='radio' ? el.name+'='+el.value : el.id] = el.type==='range' ? el.value : el.checked; }); return o; })();
function getParams(){
  const o = {};
  fields().forEach(el=>{
    if (el.type === 'range') o[el.id] = +el.value;
    else if (el.type === 'checkbox') o[el.id] = el.checked;
    else if (el.type === 'radio' && el.checked) o[el.name] = el.value;
  });
  return o;
}
function setParams(o){
  fields().forEach(el=>{
    if (el.type === 'range' && el.id in o) el.value = o[el.id];
    else if (el.type === 'checkbox' && el.id in o) el.checked = !!o[el.id];
    else if (el.type === 'radio' && el.name in o) el.checked = (el.value === o[el.name]);
    el.dispatchEvent(new Event('change', {bubbles:true}));
  });
  ctl.querySelector('input[type=range]').dispatchEvent(new Event('input', {bubbles:true}));
  document.getElementById('lampY').dispatchEvent(new Event('input'));
}
const msg = t => { const m = document.getElementById('saveMsg'); m.textContent = t; clearTimeout(msg.t); msg.t = setTimeout(()=>m.textContent='', 2500); };
function store(o){ try { localStorage.setItem(STORE_KEY, JSON.stringify(o)); return true; } catch(e){ return false; } }

document.getElementById('presets').addEventListener('click', e=>{
  const a = e.target.dataset.a; if (!a) return;
  if (a === 'save') msg(store(getParams()) ? 'saved — loads automatically next time' : 'browser blocked storage — use export');
  if (a === 'export'){
    const blob = new Blob([JSON.stringify(getParams(), null, 2)], {type:'application/json'});
    const link = Object.assign(document.createElement('a'), {href:URL.createObjectURL(blob), download:'iso-cubes-params.json'});
    link.click(); URL.revokeObjectURL(link.href); msg('exported');
  }
  if (a === 'import') document.getElementById('importFile').click();
  if (a === 'copy'){
    const txt = JSON.stringify(getParams());
    (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(()=>msg('copied to clipboard'), ()=>{ prompt('copy:', txt); });
  }
  if (a === 'reset'){
    try { localStorage.removeItem(STORE_KEY); } catch(e){}
    fields().forEach(el=>{ const k = el.type==='radio' ? el.name+'='+el.value : el.id; if (el.type==='range') el.value = DEFAULTS[k]; else el.checked = DEFAULTS[k]; });
    setParams({}); msg('reset to defaults');
  }
});
document.getElementById('importFile').addEventListener('change', e=>{
  const f = e.target.files[0]; if (!f) return;
  f.text().then(t=>{ try { const o = JSON.parse(t); setParams(o); store(o); msg('imported'); } catch(err){ msg('not a valid settings file'); } });
  e.target.value = '';
});
// load saved on start
try { const saved = JSON.parse(localStorage.getItem(STORE_KEY) || 'null'); if (saved) setParams(saved); } catch(e){}

// about: rises in when it enters the viewport
const tailSeen = new Set();
const tailObs = new IntersectionObserver(es=>es.forEach(e=>{
  e.target.classList.toggle('in', e.isIntersecting);
  if (e.isIntersecting) tailSeen.add(e.target.id); else tailSeen.delete(e.target.id);
  document.body.classList.toggle('in-about', tailSeen.has('about'));
  document.body.classList.toggle('in-tail', tailSeen.size > 0);
}), {threshold:.1});
['more','about'].forEach(id => tailObs.observe(document.getElementById(id)));


// ---------------- project pages: seamless (Barba-style) shared-element transition ----------------
// The frontal face of the active cube lifts off and becomes the project hero; back reverses it.
// URL updates via history (#project/slug), so browser back/forward and deep links work.
const projEl = document.getElementById('project');
const SLUG = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const DUR = 1050, EASE = 'cubic-bezier(.76,0,.24,1)';
let openIdx = -1, busy = false, skipPop = 0;
// history can be locked down in sandboxed previews — never let it break the transition
const hist = (fn, ...a) => { try { history[fn](...a); return true; } catch(e){ return false; } };
var lastActive = -1, lastBest = 0;   // var: render() may run before this line

function frontFace(i){ return cubes[i].wrap.querySelector(P.target === 'top' ? '.f-top' : '.f-front'); }
function heroInner(i){
  const H = PROJECTS[i].hero;   // from the CMS
  if (H) return H.video ? `<div class="hero-art"><video src="${H.url}" muted loop playsinline${H.poster ? ` poster="${H.poster}"` : ''}></video></div>` : `<div class="hero-art" style="background-image:url('${sbm(H.url, 1600)}')"></div>`;
  const top = cubes[i] && cubes[i].wrap.querySelector('.f-top');   // projects past HERO_COUNT have no cube
  if (top && top.classList.contains('img'))
    return `<div class="hero-art" style="background-image:${getComputedStyle(top).backgroundImage.replace(/"/g, "'")}"></div>`;
  return `<div class="hero-art ph"><span>${PROJECTS[i].name}</span><small>hero image ${String(i+1).padStart(2,'0')}</small></div>`;
}
function metaParts(i){ const parts = PROJECTS[i].meta.split(' · '); const year = /^\d/.test(parts[0]) ? parts.shift() : '—'; return {year, services: parts.filter(x => x !== 'Website').join(', ') || '—'}; }
function introHTML(i){
  const pr = PROJECTS[i], m = metaParts(i);
  return `<div class="idx">${String(i+1).padStart(2,'0')} / ${String(PROJECTS.length).padStart(2,'0')}</div>
    <h2>${pr.name}</h2>
    ${pr.lines.map(l=>`<p>${l}</p>`).join('')}
    <dl class="p-mini"><div><dt>Year</dt><dd>${m.year}</dd></div><div><dt>Services</dt><dd>${m.services}</dd></div></dl>`;
}
function homeInfoHTML(i){
  const pr = PROJECTS[i];
  return `<div class="idx">${String(i+1).padStart(2,'0')} / ${String(PROJECTS.length).padStart(2,'0')}</div>
    <h2>${pr.name}</h2>${pr.lines.map(l=>`<p>${l}</p>`).join('')}<div class="meta">${pr.meta}</div><button class="view fx ghost" data-i="${i}"><span class="l-txt">View project</span><span class="l-arr"><i>→</i><i>→</i></span></button>`;
}
function buildProject(i){
  const pr = PROJECTS[i], next = (i + 1) % PROJECTS.length, C = caseOf(i), multi = C.chapters.length > 1;
  let n = 0; const total = C.chapters.reduce((a, c) => a + c.slides.length, 0);
  const slidesHTML = C.chapters.map((ch, ci) => {
    const head = multi ? `<div class="p-chdiv" data-ch="${ci}"><b>${String(ci+1).padStart(2,'0')}</b><span>${ch.label}</span><small>${ch.slides.length} frames</small></div>` : '';
    return head + ch.slides.map((sl, si) => { const k = n++;
      const hs = sl.hs ? sl.hs.map((h, hi) => `<button class="hs" style="left:${h.x}%;top:${h.y}%;--k:${hi}" data-h="${hi}">${hi+1}</button>`).join('')
                         + `<svg class="hs-line" preserveAspectRatio="none"><path/></svg><div class="hs-card"></div><span class="hs-hint">Tap the numbers to explore</span>` : '';
      const media = sl.img ? (sl.img.video ? `<video class="s-media" src="${sl.img.url}" muted loop playsinline autoplay></video>` : `<img class="s-media" src="${sbm(sl.img.url, 1800)}" alt="${(sl.img.alt || sl.t || '').replace(/"/g, '&quot;')}" loading="lazy">`) : '';
      if (sl.b) return `<figure class="slide is-block b-${sl.b}" data-ch="${ci}" data-k="${k}">${Blocks.html(sl)}${(sl.t || sl.p) && !sl.cont ? `<figcaption class="s-cap">${sl.t ? `<b>${sl.t}</b>` : ''}${sl.p ? `<span>${sl.p}</span>` : ''}</figcaption>` : ''}</figure>`;
      return `<figure class="slide${sl.img ? ' has-media' : ''}" data-ch="${ci}" data-k="${k}"><div class="s-frame">${media}<span class="s-no">${String(k+1).padStart(2,'0')}</span><span class="s-lbl">slide ${String(k+1).padStart(2,'0')} / ${total}</span>${multi ? `<span class="s-tag">${ch.label}</span>` : ''}${hs}</div>${(sl.t || sl.p) && !sl.cont ? `<figcaption class="s-cap">${sl.t ? `<b>${sl.t}</b>` : ''}${sl.p ? `<span>${sl.p}</span>` : ''}</figcaption>` : ''}</figure>`; }).join('');
  }).join('');
  const navHTML = multi ? `<nav class="p-chap reveal" style="--d:4">${C.chapters.map((ch, ci) => `<div class="c-grp" data-ch="${ci}"><span class="c-lbl"><b>${String(ci+1).padStart(2,'0')}</b>${ch.label}</span><ol>${
      ch.slides.filter(s => !s.cont).map(s => `<li data-t="${s.t}">${s.t}</li>`).join('')}</ol></div>`).join('')}</nav>` : '';
  projEl.innerHTML = `
    <div class="p-grid">
      <aside class="p-side">
        <div class="p-intro">${introHTML(i)}</div>
        ${pr.live ? `<a class="p-live fx solid reveal" style="--d:1" href="${pr.live}" target="_blank" rel="noopener"><span class="l-txt">View live site</span><span class="l-arr"><i>↗</i><i>↗</i></span></a>` : ''}
        <div class="p-div reveal" style="--d:2"></div>
        <div class="p-now reveal" style="--d:3"><div class="n-in"><p>${C.about}</p></div></div>
      </aside>
      <div class="p-map" aria-hidden="true"><svg></svg><span class="p-mtag"></span></div>
      <div class="p-main">
        <div class="hero-slot"></div>
        <div class="p-slides">${slidesHTML}</div>
        <div class="p-rolo"><div class="rolo"><div class="rig"></div></div></div>
        <a class="p-next" data-next="${next}">
          <div class="nx-bar"><div class="nx-fill"></div><em class="nx-tag">Scroll for next project</em></div>
          <small>Next project</small><span class="nx-name">${PROJECTS[next].name} →</span>
        </a>
        <div class="nx-pad"></div>
      </div>
    </div>`;
  { const k = Rolo.indexFor(pr.name); Rolo.mount(projEl.querySelector('.rolo'), Math.max(0, k), k); }
  Blocks.mount(projEl, C);
  CH.cur = -2; CH.idx = i; caseFx(); if (typeof NX !== 'undefined'){ NX.p = 0; }
}
// text flyer: the home-page project text travels into the left column
function textFlight(i, fromRect, toEl, reverse){
  const t = document.createElement('div'); t.className = 'p-intro text-fly'; t.innerHTML = introHTML(i);
  const to = toEl.getBoundingClientRect();
  t.style.width = to.width + 'px'; document.body.appendChild(t);
  const a = reverse ? to : fromRect, b = reverse ? fromRect : to;
  const anim = t.animate([{left: a.left+'px', top: a.top+'px'}, {left: b.left+'px', top: b.top+'px'}], {duration: DUR, easing: EASE, fill: 'forwards'});
  return anim.finished.then(()=>t);
}
function infoRectFor(i){ return (shownIdx === i && info.classList.contains('show')) ? info.getBoundingClientRect() : null; }
function rectStyle(el, r){ Object.assign(el.style, {left: r.left+'px', top: r.top+'px', width: r.width+'px', height: r.height+'px'}); }
function fly(el, from, to){
  return el.animate([
    {left: from.left+'px', top: from.top+'px', width: from.width+'px', height: from.height+'px'},
    {left: to.left+'px',   top: to.top+'px',   width: to.width+'px',   height: to.height+'px'}
  ], {duration: DUR, easing: EASE, fill: 'forwards'}).finished;
}
function makeFlyer(i, rect){
  const f = document.createElement('div'); f.className = 'flyer'; f.innerHTML = heroInner(i);
  document.body.appendChild(f); rectStyle(f, rect);
  // a video hero continues from the card's frame (no jump back to the start); the card's own video pauses behind it
  const fv = f.querySelector('video'), cv = cubes[i] && cubes[i].wrap.querySelector('video.cv');
  if (fv){ seekTo(fv, cv && cv.src ? cv.currentTime : startAt(fv.getAttribute('src'))); if (cv) cv.pause(); fv.play().catch(() => {}); }
  return f;
}
function dock(f){
  f.getAnimations().forEach(a => a.cancel());
  f.removeAttribute('style'); f.classList.add('docked');
  projEl.querySelector('.hero-slot').appendChild(f);
  f.querySelector('video')?.play().catch(() => {});   // moving a video in the DOM pauses it
}
const nextFrame = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
const wait = ms => new Promise(r => setTimeout(r, ms));

// make sure cube i is the frontal one (instantly scroll the hidden home page there)
async function bringCube(i){
  if (lastActive === i && lastBest > .98) return;
  const smooth = document.documentElement.style.scrollBehavior;
  document.documentElement.style.scrollBehavior = 'auto';
  window.scrollTo(0, A[i]); render(); await nextFrame(); render();
  document.documentElement.style.scrollBehavior = smooth;
}

let directOpen = false;   // opened from a link (no cube flight): closes with a fade
async function openProject(i, push = true, direct = false){
  if (PROJECTS[i]?.ext){ if (PROJECTS[i].live) window.open(PROJECTS[i].live, '_blank', 'noopener'); return; }   // no case → the live site
  if (busy || openIdx === i) return; busy = true;
  directOpen = direct || !cubes[i];
  if (directOpen){   // not in the home scroll (past HERO_COUNT): no cube to fly from — the page fades in
    buildProject(i); projEl.classList.add('open'); projTop();
    dock(makeFlyer(i, projEl.querySelector('.hero-slot').getBoundingClientRect()));
    document.body.classList.add('in-project'); projEl.classList.add('bg');
    if (push) hist('pushState', {p: i, ours: true}, '', '/work/' + SLUG(PROJECTS[i].name));
    projEl.querySelector('.p-intro').classList.add('fade-in');
    projEl.animate([{opacity: 0}, {opacity: 1}], {duration: 450, easing: 'ease'});
    await wait(120); projEl.classList.add('below', 'shown'); MAP.intro = performance.now(); drawMap(); CH.cur = -2; caseFx();
    openIdx = i; busy = false; return;
  }
  await bringCube(i);
  const face = frontFace(i), from = face.getBoundingClientRect(), iRect = infoRectFor(i);
  buildProject(i);
  projEl.classList.add('open'); projTop();
  const to = projEl.querySelector('.hero-slot').getBoundingClientRect(), intro = projEl.querySelector('.p-intro');
  const f = makeFlyer(i, from);
  cubes[i].wrap.style.visibility = 'hidden';
  document.body.classList.add('in-project');
  projEl.classList.add('bg');
  if (push) hist('pushState', {p: i, ours: true}, '', '/work/' + SLUG(PROJECTS[i].name));
  intro.style.visibility = 'hidden';
  const tf = iRect ? textFlight(i, iRect, intro, false) : null;
  if (!iRect) intro.classList.add('fade-in');
  const bt = setTimeout(() => projEl.classList.add('below'), DUR - 300);
  await Promise.all([fly(f, from, to), tf]);
  dock(f);
  if (tf) (await tf).remove();
  intro.style.visibility = '';
  projEl.classList.add('shown'); MAP.intro = performance.now(); drawMap(); CH.cur = -2; caseFx();
  openIdx = i; busy = false;
}

async function closeProject(){
  if (busy || openIdx < 0) return; busy = true;
  const i = openIdx;
  if (!cubes[i] || directOpen){   // no cube to fly back to (or it never flew) — fade out
    await projEl.animate([{opacity: 1}, {opacity: 0}], {duration: 380, easing: 'ease', fill: 'forwards'}).finished;
    projEl.classList.remove('shown', 'below', 'bg', 'open'); document.body.classList.remove('in-project');
    projEl.innerHTML = ''; projEl.getAnimations().forEach(a => a.cancel());
    openIdx = -1; busy = false; return;
  }
  projEl.classList.remove('shown', 'below');
  if (projEl.scrollTop > 4){
    projEl.scrollTo({top: 0, behavior: 'smooth'});
    for (let t = 0; t < 60 && projEl.scrollTop > 2; t++) await wait(16);
  }
  await wait(320);                     // let the content under the hero fade out first
  await bringCube(i);
  const f = projEl.querySelector('.flyer'), from = f.getBoundingClientRect();
  const intro = projEl.querySelector('.p-intro');
  f.classList.remove('docked'); document.body.appendChild(f); rectStyle(f, from); f.querySelector('video')?.play().catch(() => {});
  const to = frontFace(i).getBoundingClientRect();
  document.body.classList.add('info-hold');
  info.classList.add('show'); info.innerHTML = homeInfoHTML(i); shownIdx = i;
  const iRect = info.getBoundingClientRect();
  const tf = textFlight(i, iRect, intro, true);
  intro.style.visibility = 'hidden';
  document.body.classList.remove('in-project');
  projEl.classList.remove('bg');
  await Promise.all([fly(f, from, to), tf]);
  cubes[i].wrap.style.visibility = '';
  document.body.classList.remove('info-hold'); (await tf).remove();
  { const fv = f.querySelector('video'), cv = cubes[i].wrap.querySelector('video.cv');
    if (fv && cv){ if (!cv.src) cv.src = cv.dataset.src; seekTo(cv, fv.currentTime); } }
  f.remove(); projEl.classList.remove('open'); projEl.innerHTML = '';
  openIdx = -1; busy = false; cubeVid(i, true);
}

// back to the top of the project page — Lenis too, or it glides back to its old target (the bottom of the last project)
function projTop(){ projEl.scrollTop = 0;
  // Lenis caches the page height — re-measure for the new project (now and once its content has settled), or it stops at the old project's length
  const L = () => window.lenisProj; try { if (L()){ L().resize(); L().scrollTo(0, {immediate: true, force: true}); } } catch(e){}
  [200, 700, 1500].forEach(t => setTimeout(() => { try { L() && L().resize(); } catch(e){} }, t)); }
async function toNextProject(j, frameEl, push = true){
  if (busy) return; busy = true;
  const i = openIdx, from = frameEl.getBoundingClientRect();
  const f = makeFlyer(j, from); frameEl.style.visibility = 'hidden';
  projEl.classList.remove('shown', 'below');
  projEl.querySelector('.hero-slot .flyer')?.animate([{opacity:1},{opacity:0}], {duration: 350, fill: 'forwards'});
  await wait(380);
  buildProject(j); projTop();
  projEl.querySelector('.p-intro').classList.add('fade-in');
  const to = projEl.querySelector('.hero-slot').getBoundingClientRect();
  if (push) hist('pushState', {p: j, ours: true}, '', '/work/' + SLUG(PROJECTS[j].name));
  if (cubes[i]) cubes[i].wrap.style.visibility = ''; if (cubes[j]) cubes[j].wrap.style.visibility = 'hidden';
  setTimeout(() => projEl.classList.add('below'), DUR - 300);
  await fly(f, from, to);
  dock(f);
  projEl.classList.add('shown'); MAP.intro = performance.now(); drawMap(); CH.cur = -2; caseFx();
  openIdx = j; busy = false;
}

// triggers: click the frontal face, the "View project" link, back / next inside the page
// the snapped cube is clickable. 3D hit-testing is unreliable, so test against the face's on-screen rect instead
function snappedAt(x, y){
  if (openIdx >= 0 || busy || lastActive < 0 || lastBest < .98 || document.body.classList.contains('in-thoughts')) return -1;
  const r = frontFace(lastActive).getBoundingClientRect();
  return (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) ? lastActive : -1;
}
document.addEventListener('click', e => {
  if (e.target.closest('a,button,input,select,label,#ctl,#info,#top,#contactPop,#project,#about,#mnav')) return;
  const i = snappedAt(e.clientX, e.clientY); if (i >= 0) openProject(i);
});
document.addEventListener('pointermove', e => {
  const over = !e.target.closest('#ctl,#top,#info,#project,#thoughts,#about') && snappedAt(e.clientX, e.clientY) >= 0;
  document.body.classList.toggle('over-snap', over);
}, {passive:true});
info.addEventListener('click', e => { const b = e.target.closest('.view'); if (b) openProject(+b.dataset.i); });
projEl.addEventListener('click', e => {
  const nl = e.target.closest('.p-next-link'); if (nl){ const f = projEl.querySelector('.p-next .nx-name'); f.scrollIntoView({block:'center'}); setTimeout(()=>toNextProject(+nl.dataset.next, f), 60); return; }
  const n = e.target.closest('.p-next'); if (n) toNextProject(+n.dataset.next, n.querySelector('.nx-name'));
});
addEventListener('keydown', e => { if (e.key === 'Escape' && openIdx >= 0) closeFromUI(); });
document.getElementById('pBack')?.addEventListener('click', ()=>closeFromUI());
// close from the page itself: animate back home right away, then tidy the URL/history
function closeFromUI(){
  if (busy || openIdx < 0) return;
  const st = (()=>{ try { return history.state; } catch(e){ return null; } })();
  closeProject();
  if (st && st.ours){ skipPop++; if (!hist('back')) skipPop--; }
  else hist('replaceState', {}, '', '/' + location.search);
}
addEventListener('popstate', e => {
  if (skipPop){ skipPop--; return; }
  const p = e.state && e.state.p;
  if (p === undefined || p === null){ if (openIdx >= 0) closeProject(); }
  else if (openIdx < 0) openProject(p, false);
  else if (p !== openIdx){ const nf = projEl.querySelector('.p-next .nx-name'); toNextProject(p, nf, false); }
});
// open a project by name (used by the Work page inside the prototype)
window.slOpenProject = name => { const i = PROJECTS.findIndex(p => p.name === name); if (i >= 0) setTimeout(() => openProject(i), 380); };
// deep link: #project/slug
(function(){
  const m = location.hash.match(/^#project\/(.+)$/); if (!m) return;
  const i = PROJECTS.findIndex(p => SLUG(p.name) === m[1]); if (i < 0){ document.documentElement.classList.remove('deep'); return; }
  hist('replaceState', {p: i}, '', '/work/' + m[1]);   // the shareable address
  requestAnimationFrame(() => openProject(i, false, true).then(() => setTimeout(() => document.documentElement.classList.remove('deep'), 500)));   // once the page has faded in fully
})();


// ---------------- header links on the home page: the logo scrolls to the top, About scrolls to its section ----------------
function smoothTo(y){ if (window.lenis) window.lenis.scrollTo(y, {duration: 1.1}); else window.scrollTo({top: y, behavior: 'smooth'}); }
async function leaveOverlays(){ if (openIdx >= 0){ await closeProject(); hist('replaceState', {}, '', '/' + location.search); } }
document.addEventListener('click', async e => {
  const a = e.target.closest('a[href="/"], a[href="/#about"]'); if (!a || e.metaKey || e.ctrlKey) return;
  e.preventDefault();
  await leaveOverlays();
  if (location.hash) hist('replaceState', {}, '', '/' + location.search);
  if (a.getAttribute('href') === '/') smoothTo(0); else smoothTo(document.getElementById('about').offsetTop);
});
if (location.hash === '#about') setTimeout(() => smoothTo(document.getElementById('about').offsetTop), 300);

// ---------------- image blocks: a slide holds 1–4 frames (full · duo · trio · quad) sharing one ratio (16:9 · 1:1 · 1:2) ----------------
// a frame holds one item, or several = a cube carousel (turns up, one quarter per click; clicks queue). Items: image · video · lottie (.json),
// each on an optional fill colour (for files that sit 'contain' inside a frame of another ratio). Media only plays while on screen.
const Blocks = (() => {
  let io = null, anims = [];
  const kind = u => /\.(mp4|webm|mov|m4v)([?#]|$)/i.test(u) ? 'video' : /\.json([?#]|$)/i.test(u) ? 'lottie' : 'img';   // a #pause=N may follow
  const img = (u, w) => /a\.storyblok\.com/.test(u) && !/\.svg(\?|$)/i.test(u) ? `${u}/m/${w}x0` : u;
  const esc = v => String(v || '').replace(/"/g, '&quot;');
  const per = {full: 1, duo: 2, trio: 3, quad: 4};
  // '#pad=8' at the end of a file's URL = shrink it inside its frame (8% padding all round)
  const media = (it, px, alt) => { const t = kind(it.src), pad = (/[#&]pad=([\d.]+)/.exec(it.src) || [])[1], ps = pad ? ` style="padding:${pad}%"` : '';
    return t === 'video' ? `<video data-src="${it.src}" muted loop playsinline preload="none"${ps}></video>`
         : t === 'lottie' ? `<div class="f-lot" data-lottie="${it.src}"${ps}></div>`
         : `<img src="${img(it.src, px)}" alt="${esc(it.alt || alt)}" loading="lazy"${ps}>`; };
  function html(sl){
    const n = per[sl.b] || 1, px = Math.round(1800 / n), r = sl.r || '16/9';
    return `<div class="s-row" style="--r:${r}">${(sl.f || []).slice(0, n).map((fr, fi) => {
      const its = fr.items || []; if (!its.length) return `<div class="bf"></div>`;
      const face = (cls, it) => `<div class="cc-face ${cls}" style="background:${it.bg || 'var(--bg)'}">${media(it, px, sl.t)}<i></i></div>`;
      if (its.length === 1) return `<div class="bf"><div class="cc-face" style="background:${its[0].bg || 'var(--bg)'}">${media(its[0], px, sl.t)}</div></div>`;
      return `<div class="bf cube-car" data-f="${fi}"><div class="cc-rig">${face('cc-a', its[0])}<div class="cc-face cc-b"><i></i></div></div>`
        + `<span class="cc-nav"><button class="cc-btn fx ghost" data-d="-1" aria-label="Previous">↑</button><button class="cc-btn fx ghost" data-d="1" aria-label="Next">↓</button></span></div>`;
    }).join('')}</div>`;
  }
  // start / stop what's in a face (video, lottie)
  function wake(face, on){
    if (!face) return;
    const v = face.querySelector('video'); if (v){ if (on){ if (!v.src) v.src = v.dataset.src; v.play().catch(() => {}); } else if (v.src) v.pause(); }
    const l = face.querySelector('.f-lot');
    if (l){ l._on = on; if (on && !l._a && window.__lottie){
        // '#pause=3' at the end of the file's URL = play once, wait that many seconds, play again (instead of a straight loop)
        const [src, frag] = l.dataset.lottie.split('#'), pause = +((/pause=([\d.]+)/.exec(frag || '') || [])[1] || 0);
        const a = l._a = window.__lottie.loadAnimation({container: l, renderer: 'svg', loop: !pause, autoplay: true, path: src, rendererSettings: {preserveAspectRatio: 'xMidYMid meet'}});
        if (pause) a.addEventListener('complete', () => { clearTimeout(l._t); l._t = setTimeout(() => { if (l.isConnected && l._on) a.goToAndPlay(0, true); }, pause * 1000); });
        anims.push(a); }
      if (l._a) on ? l._a.play() : l._a.pause(); }
  }
  function cube(el, items, px, alt){
    const rig = el.querySelector('.cc-rig'); let A = el.querySelector('.cc-a'), B = el.querySelector('.cc-b'), i = 0, busy = false; const queue = [];
    const fill = (face, it) => { face.style.background = it.bg || 'var(--bg)'; face.innerHTML = media(it, px, alt) + '<i></i>'; };
    const rest = () => { const hh = el.clientHeight / 2; rig.style.transform = `translateZ(${-hh}px)`; A.style.transform = `translateZ(${hh}px)`; };
    // clicks queue up: each adds a quarter turn; queued turns chain without stopping, and run faster the more are waiting
    const turn = (dir, chained = false) => {
      if (busy && !chained){ if (queue.length < 6) queue.push(dir); return; } busy = true;
      const k = (i + dir + items.length) % items.length, hh = el.clientHeight / 2;   // turns up: the next face rolls in from below
      fill(B, items[k]); wake(B, true);
      B.style.transform = `rotateX(${-90 * dir}deg) translateZ(${hh}px)`; A.style.transform = `translateZ(${hh}px)`;
      const P = parseFloat(getComputedStyle(el).perspective) || 2400, shA = A.querySelector('i'), shB = B.querySelector('i'), t0 = performance.now();
      const more = queue.length > 0, D = more ? Math.max(380, 900 / (1 + queue.length)) : (chained ? 650 : 900);
      const cubic = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2, eIn = t => t * t, eOut = t => 1 - (1 - t) * (1 - t);
      const ease = chained && more ? (t => t) : chained ? eOut : more ? eIn : cubic;
      const step = now => {
        const t = Math.min(1, (now - t0) / D), e = ease(t), th = e * Math.PI / 2;
        // scaled every frame so the turning cube's outline always fits the frame (never bigger than its neighbours, no settle at the end)
        const s0 = 1 / (Math.cos(th) + Math.sin(th)), zc = hh * (Math.SQRT2 * Math.cos(Math.PI / 4 - th) - 1), s = s0 * (P - s0 * zc) / P;
        rig.style.transform = `scale3d(${s},${s},${s}) translateZ(${-hh}px) rotateX(${90 * dir * e}deg)`;
        shA.style.opacity = .45 * e; shB.style.opacity = .45 * (1 - e);
        if (t < 1) return requestAnimationFrame(step);
        // the incoming face becomes the front one
        wake(A, false); [A, B] = [B, A]; A.classList.replace('cc-b', 'cc-a'); B.classList.replace('cc-a', 'cc-b');
        B.innerHTML = '<i></i>'; B.style.transform = ''; i = k; busy = false;
        rest(); shA.style.opacity = 0;
        if (queue.length) turn(queue.shift(), true);
      };
      requestAnimationFrame(step);
    };
    el.addEventListener('click', e => { const b = e.target.closest('.cc-btn'); turn(b ? +b.dataset.d : 1); });
    rest(); el._rest = rest;
  }
  async function mount(root, C){
    anims.forEach(a => a.destroy()); anims = []; if (io) io.disconnect();
    const rows = root.querySelectorAll('.slide.is-block'); if (!rows.length) return;
    if (root.querySelector('.f-lot') || C.chapters.some(ch => ch.slides.some(sl => (sl.f || []).some(fr => (fr.items || []).some(it => kind(it.src) === 'lottie')))))
      if (!window.__lottie) window.__lottie = (await import('lottie-web/build/player/lottie_light')).default;
    const slides = C.chapters.flatMap(ch => ch.slides);
    rows.forEach(row => { const sl = slides[+row.dataset.k]; if (!sl || !sl.b) return; const px = Math.round(1800 / (per[sl.b] || 1));
      row.querySelectorAll('.cube-car').forEach(el => cube(el, sl.f[+el.dataset.f].items, px, sl.t)); });
    io = new IntersectionObserver(es => es.forEach(e => e.target.querySelectorAll('.bf > .cc-face, .cc-a').forEach(f => wake(f, e.isIntersecting))), {rootMargin: '10% 0px'});
    rows.forEach(r => io.observe(r));
  }
  addEventListener('resize', () => document.querySelectorAll('.cube-car').forEach(el => el._rest && el._rest()));
  return { html, mount };
})();

// slides: scale/fade toward the centre of the screen as you scroll the project page
function slideFx(){
  const slides = projEl.querySelectorAll('.slide'); if (!slides.length) return;
  const mid = innerHeight / 2;
  slides.forEach(sl => {
    const r = sl.getBoundingClientRect(), d = Math.abs(r.top + r.height/2 - mid) / innerHeight;
    const k = Math.min(1, d * 1.6);
    sl.style.transform = `scale(${1 - .08*k})`; sl.style.opacity = 1 - .55*k;
    sl.classList.toggle('at', d < .18);
  });
}
projEl.addEventListener('scroll', () => requestAnimationFrame(slideFx), {passive:true});
addEventListener('resize', slideFx);


// ---------------- project minimap ----------------
// minor ticks scale with the page height; major ticks mark the hero, each slide and "next";
// the parallelogram frame = what's on screen now. Hover magnifies nearby ticks, click/drag scrubs.
const MAP = { hoverY: null, drag: false };
function drawMap(){
  const map = projEl.querySelector('.p-map'); if (!map || !projEl.classList.contains('open')) return;
  const svg = map.querySelector('svg'), T = Math.tan(Math.PI/6);
  const W = 29, pad = 2, slant = T * (W - pad*2);           // iso slope, same as the cubes
  const Hm = Math.min(innerHeight * 0.18, 160), L = 22;     // L = room on the left for 01/02
  const sh = projEl.scrollHeight, ch = projEl.clientHeight, st = projEl.scrollTop, pt = projEl.getBoundingClientRect().top;
  const C = caseOf(openIdx >= 0 ? openIdx : CH.idx), multi = C.chapters.length > 1;
  const since = MAP.intro ? performance.now() - MAP.intro : 1e9, anim = since < 1600;
  let n = 0; const A = () => anim ? ` a" style="animation-delay:${(n++ * 45 - since).toFixed(0)}ms` : '';
  const tick = (y, cls, x0, ext) => { x0 -= ext; return `<line class="${cls}${A()}" x1="${x0.toFixed(1)}" y1="${(y + (W - pad - x0) * T).toFixed(1)}" x2="${W-pad}" y2="${y.toFixed(1)}"/>`; };
  const mag = y => MAP.hoverY == null ? 0 : 7 * Math.exp(-Math.pow((y - MAP.hoverY) / 10, 2));
  const yOf = el => el.getBoundingClientRect().top - pt + st;   // page position; mapped onto an even rail below
  // marks: chapters = long black, steps (hero, frames, next) = short grey
  const marks = [];
  const hero = projEl.querySelector('.hero-slot'); if (hero) marks.push({y: yOf(hero), lbl: PROJECTS[CH.idx].name, kind:'step'});
  if (multi) projEl.querySelectorAll('.p-chdiv').forEach(el => { const ci = +el.dataset.ch; marks.push({y: yOf(el), lbl: `${String(ci+1).padStart(2,'0')} ${C.chapters[ci].label}`, kind:'ch', ci}); });
  projEl.querySelectorAll('.slide').forEach(el => { const m = slideMeta(+el.dataset.k); marks.push({y: yOf(el), lbl: m ? m.t : '', kind: multi ? 'step' : 'ch'}); });
  const nx = projEl.querySelector('.p-next'); if (nx) marks.push({y: yOf(nx), lbl: 'Next project', kind:'step'});
  marks.sort((a, b) => a.y - b.y);
  // even rhythm: every mark gets the same gap; scroll position is interpolated between marks
  const N = marks.length; marks.forEach((m, k) => { m.py = m.y; m.y = N > 1 ? Hm * k / (N - 1) : 0; });
  MAP.rail = marks.map(m => [m.py, m.y]);
  const rail = py => railY(py);
  let out = '';
  marks.forEach(m => {
    if (m.kind === 'ch'){
      out += tick(m.y, 't-maj', pad, 4 + mag(m.y));
      if (m.ci != null) out += `<text class="t-ch${MAP.ch === m.ci ? ' on' : ''}${A()}" x="${(pad - 7).toFixed(1)}" y="${(m.y + slant + 6).toFixed(1)}" text-anchor="end">${String(m.ci+1).padStart(2,'0')}</text>`;
    } else out += tick(m.y, multi ? 't-min' : 't-maj', multi ? W * .22 : pad, mag(m.y) * (multi ? .6 : 1));
  });
  // viewport frame
  const fy = rail(st + ch * .25), fh = Math.max(14, rail(st + ch * .75) - fy);
  out += `<path class="t-fr${A()}" d="M${pad} ${(fy+slant).toFixed(1)} L${W-pad} ${fy.toFixed(1)} L${W-pad} ${(fy+fh).toFixed(1)} L${pad} ${(fy+fh+slant).toFixed(1)} Z"/>`;
  out += `<text class="t-lbl${A()}" x="${W-pad}" y="${(fy+fh+slant+11).toFixed(1)}" text-anchor="end">${Math.round(100 * st / Math.max(1, sh - ch))}%</text>`;
  svg.setAttribute('viewBox', `${-L} 0 ${W+L} ${Hm + slant + 14}`); svg.style.marginLeft = -L + 'px';
  svg.setAttribute('width', W + L); svg.setAttribute('height', Hm + slant + 14);
  svg.innerHTML = out;
  MAP.Hm = Hm; MAP.slant = slant; MAP.marks = marks;
  // hover: red tag with the name of the nearest part
  const tag = map.querySelector('.p-mtag');
  if (MAP.hoverY != null && marks.length){
    let best = marks[0]; marks.forEach(m => { if (Math.abs(m.y - MAP.hoverY) < Math.abs(best.y - MAP.hoverY)) best = m; });
    tag.textContent = best.lbl; tag.style.top = (best.y + slant / 2) + 'px'; tag.classList.add('on');
  } else tag.classList.remove('on');
  if (anim) requestAnimationFrame(() => {});   // keep timing continuous across redraws
}
function railY(py){
  const R = MAP.rail; if (!R || !R.length) return 0;
  if (py <= R[0][0]) return R[0][1];
  for (let k = 1; k < R.length; k++) if (py <= R[k][0]){ const [a, ya] = R[k-1], [b, yb] = R[k]; return ya + (yb - ya) * (py - a) / Math.max(1, b - a); }
  return R[R.length-1][1];
}
function railInv(y){
  const R = MAP.rail; if (!R || !R.length) return 0;
  if (y <= R[0][1]) return R[0][0];
  for (let k = 1; k < R.length; k++) if (y <= R[k][1]){ const [a, ya] = R[k-1], [b, yb] = R[k]; return a + (b - a) * (y - ya) / Math.max(1e-6, yb - ya); }
  return R[R.length-1][0];
}
function mapScrub(e){
  const map = projEl.querySelector('.p-map'), r = map.querySelector('svg').getBoundingClientRect();
  const y = e.clientY - r.top - MAP.slant / 2;                                    // centre of the slanted frame
  const sh = projEl.scrollHeight, ch = projEl.clientHeight;
  projEl.scrollTo({ top: Math.max(0, Math.min(sh - ch, railInv(y) - ch * .5)), behavior: MAP.drag ? 'auto' : 'smooth' });
}
projEl.addEventListener('pointermove', e => {
  const map = e.target.closest('.p-map');
  if (map){ const r = map.querySelector('svg').getBoundingClientRect(); MAP.hoverY = e.clientY - r.top - MAP.slant / 2; if (MAP.drag) mapScrub(e); }
  else if (MAP.hoverY != null) MAP.hoverY = null;
  else return;
  requestAnimationFrame(drawMap);
});
projEl.addEventListener('pointerleave', () => { MAP.hoverY = null; MAP.drag = false; requestAnimationFrame(drawMap); });
projEl.addEventListener('pointerdown', e => { if (e.target.closest('.p-map')){ MAP.drag = true; mapScrub(e); e.preventDefault(); } });
addEventListener('pointerup', () => { if (MAP.drag){ MAP.drag = false; } });
projEl.addEventListener('scroll', () => requestAnimationFrame(drawMap), {passive:true});
addEventListener('resize', () => requestAnimationFrame(drawMap));



// ---------------- case chapters: left column follows the slide at screen centre ----------------
const CH = { cur:-2, idx:-1 };
function slideMeta(k){ const C = caseOf(CH.idx); let n = 0; for (const ch of C.chapters) for (const s of ch.slides){ if (n++ === k) return s; } return null; }
function caseFx(){
  if (!projEl.classList.contains('open')) return;
  const slides = [...projEl.querySelectorAll('.slide')]; if (!slides.length) return;
  const mid = innerHeight / 2; let best = -1, bd = 1e9;
  slides.forEach((sl, k) => { const r = sl.getBoundingClientRect(), d = Math.abs(r.top + r.height/2 - mid);
    if (r.top < mid + r.height * .6 && r.bottom > mid - r.height * .6 && d < bd){ bd = d; best = k; }
    if (r.top < innerHeight * .7 && r.bottom > innerHeight * .3) sl.classList.add('hs-in'); });
  const nxr = projEl.querySelector('.p-next')?.getBoundingClientRect();
  if (best < 0 && nxr && nxr.top < innerHeight * .8) best = -3;
  CH.end = best === -3;
  if (best === CH.cur) return; CH.cur = best; if (best === -3) best = -1;
  const now = projEl.querySelector('.p-now'), m = best >= 0 ? slideMeta(best) : null, ci = best >= 0 ? +slides[best].dataset.ch : -1;
  projEl.querySelectorAll('.p-chap .c-grp').forEach(g => g.classList.toggle('on', +g.dataset.ch === ci));
  projEl.querySelectorAll('.p-chap li').forEach(li => li.classList.toggle('on', !!m && li.dataset.t === m.t && +li.closest('.c-grp').dataset.ch === ci));
  if (!now || innerWidth <= 800) return;   // phones: captions sit under each image instead
  now.classList.add('swap');
  clearTimeout(CH.t); CH.t = setTimeout(() => {
    const C = caseOf(CH.idx);
    now.querySelector('.n-in').innerHTML = m ? `<h3>${m.t}</h3><p>${m.p}</p>`
      : (CH.end && C.outcome) ? `<h3>${C.outcome.k}</h3><p>${C.outcome.v}</p>${C.outcome.u ? `<a class="p-out-link" href="${C.outcome.u}" target="_blank" rel="noopener">Read about it ↗</a>` : ''}` : `<p>${C.about}</p>`;
    now.classList.remove('swap');
  }, 220);
  MAP.ch = ci;
}
projEl.addEventListener('scroll', () => requestAnimationFrame(caseFx), {passive:true});
projEl.addEventListener('scroll', () => { const v = projEl.querySelector('.hero-slot video'); if (!v) return;
  const r = v.getBoundingClientRect(), seen = r.bottom > 80 && r.top < innerHeight; if (seen && v.paused) v.play().catch(() => {}); else if (!seen && !v.paused) v.pause(); }, {passive:true});
projEl.addEventListener('click', e => {
  const li = e.target.closest('.p-chap li'), lbl = e.target.closest('.p-chap .c-lbl');
  if (!li && !lbl) return;
  const ci = +(li || lbl).closest('.c-grp').dataset.ch;
  const t = li ? [...projEl.querySelectorAll(`.slide[data-ch="${ci}"]`)].find(s => slideMeta(+s.dataset.k).t === li.dataset.t)
               : projEl.querySelector(`.slide[data-ch="${ci}"]`);
  if (t) t.scrollIntoView({behavior:'smooth', block:'center'});
});

// ---------------- hotspots: numbered hairline callouts → card beside the point ----------------
function hsOpen(fig, h){
  const k = +fig.dataset.k, list = slideMeta(k).hs, frame = fig.querySelector('.s-frame'), card = frame.querySelector('.hs-card'), line = frame.querySelector('.hs-line');
  frame.querySelectorAll('.hs').forEach(b => b.classList.toggle('on', +b.dataset.h === h));
  if (h < 0){ card.classList.remove('on'); line.classList.remove('on'); return; }
  const it = list[h];
  card.innerHTML = `<button class="hc-x" aria-label="Close">×</button><div class="hc-img">detail ${h+1}</div><span class="hc-no">${String(h+1).padStart(2,'0')} / ${String(list.length).padStart(2,'0')}</span>
    <h4>${it.t}</h4><p>${it.p}</p><div class="hc-nav"><button data-d="-1">←</button><button data-d="1">→</button><span class="hc-dots">${list.map((_, j) => `<i class="${j===h?'on':''}"></i>`).join('')}</span></div>`;
  card.dataset.h = h;
  // place the card on the emptier side, then draw a hairline elbow from the point to it
  const W = frame.clientWidth, H = frame.clientHeight, px = it.x/100*W, py = it.y/100*H, right = it.x < 55;
  card.style.left = right ? '' : '16px'; card.style.right = right ? '16px' : '';
  card.style.top = Math.max(16, Math.min(H - card.offsetHeight - 16, py - 60)) + 'px';
  const cx = right ? W - 16 - card.offsetWidth : 16 + card.offsetWidth, cy = Math.max(16, Math.min(H - card.offsetHeight - 16, py - 60)) + 20;
  const ex = px + (right ? 11 : -11), mx = ex + (cx - ex) * .5;
  const d = `M${ex} ${py} L${mx} ${py} L${mx} ${cy} L${cx} ${cy}`;
  line.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const path = line.querySelector('path'); path.setAttribute('d', d);
  const len = Math.abs(mx - ex) + Math.abs(cy - py) + Math.abs(cx - mx); line.style.setProperty('--len', len);
  line.classList.remove('on'); void line.offsetWidth; line.classList.add('on'); card.classList.add('on');
}
projEl.addEventListener('click', e => {
  const fig = e.target.closest('.slide'); if (!fig) return;
  const b = e.target.closest('.hs'), card = e.target.closest('.hs-card');
  if (b){ e.stopPropagation(); hsOpen(fig, b.classList.contains('on') ? -1 : +b.dataset.h); return; }
  if (card){
    if (e.target.closest('.hc-x')) return hsOpen(fig, -1);
    const nb = e.target.closest('[data-d]'); if (nb){ const L = slideMeta(+fig.dataset.k).hs.length; hsOpen(fig, (+card.dataset.h + +nb.dataset.d + L) % L); }
    return;
  }
  if (fig.querySelector('.hs.on')) hsOpen(fig, -1);
});

// ---------------- next project: the page stops at the end; extra scroll only drives the bar ----------------
const NX = { p:0, fired:false, idle:0, raf:0, endSince:0, lock:false, quiet:0, deadline:0 };
// while the next project flies in, scrolling is held; once it has landed the hold lets go as soon as the wheel
// pauses for a moment — and never later than 0.5s, so continuous scrolling keeps flowing
function nxLock(){ NX.lock = true; NX.deadline = 0; try { window.lenisProj && lenisProj.stop(); } catch(e){} }
function nxUnlock(){ clearTimeout(NX.quiet); if (!NX.lock) return; NX.lock = false; NX.endSince = 0; try { window.lenisProj && lenisProj.start(); } catch(e){} }
function nxLanded(){ NX.deadline = performance.now() + 500; clearTimeout(NX.quiet); NX.quiet = setTimeout(nxUnlock, 140); }
addEventListener('wheel', e => { if (!NX.lock) return; e.preventDefault(); e.stopPropagation();
  if (NX.deadline){ if (performance.now() > NX.deadline) nxUnlock(); else { clearTimeout(NX.quiet); NX.quiet = setTimeout(nxUnlock, 140); } } }, {passive: false, capture: true});
addEventListener('touchmove', e => { if (NX.lock) e.preventDefault(); }, {passive: false, capture: true});
function nxSet(p){
  NX.p = Math.max(0, Math.min(1, p));
  const nx = projEl.querySelector('.p-next'); if (!nx) return;
  nx.style.setProperty('--p', NX.p.toFixed(4));
  nx.classList.toggle('armed', NX.p > .01); nx.classList.toggle('go', NX.p >= 1);
  if (NX.p >= 1 && !NX.fired && !busy && openIdx >= 0){
    NX.fired = true; nxLock();
    setTimeout(() => toNextProject(+nx.dataset.next, nx.querySelector('.nx-name')).then(() => { NX.fired = false; NX.p = 0; projTop(); nxLanded(); }), 180);
  }
}
function nxIdle(){                 // let go before the end → the bar eases back
  clearTimeout(NX.idle); cancelAnimationFrame(NX.raf);
  NX.idle = setTimeout(function back(){ if (NX.fired || NX.p <= 0) return; nxSet(NX.p - .035); NX.raf = requestAnimationFrame(back); }, 520);
}
function atEnd(){ return projEl.scrollTop >= projEl.scrollHeight - projEl.clientHeight - 2; }
function nxDrive(dy, e){
  if (!projEl.classList.contains('shown') || busy || NX.fired || NX.lock) return;
  // the page stops at its end for a beat (≈0.25s) before extra scroll starts filling the bar, so a fast flick lands on the end instead of shooting through
  if (!atEnd()) NX.endSince = 0;
  else if (dy > 0 && !e.touches){ const now = performance.now(); if (!NX.endSince) NX.endSince = now; if (now - NX.endSince < 250){ e.preventDefault(); return; } }
  if ((dy > 0 && atEnd()) || (dy < 0 && NX.p > 0)){
    e.preventDefault(); cancelAnimationFrame(NX.raf);
    nxSet(NX.p + dy / 900); nxIdle();
  }
}
projEl.addEventListener('wheel', e => nxDrive(e.deltaMode === 1 ? e.deltaY * 32 : e.deltaY, e), {passive:false});
let nxTouchY = null;
projEl.addEventListener('touchstart', e => { nxTouchY = e.touches[0].clientY; }, {passive:true});
projEl.addEventListener('touchmove', e => { if (nxTouchY == null) return; const y = e.touches[0].clientY; nxDrive((nxTouchY - y) * 4.5, e); nxTouchY = y; }, {passive:false});
// let go past halfway → it carries on to the next project
projEl.addEventListener('touchend', () => { nxTouchY = null; if (NX.p >= .45 && !NX.fired){ clearTimeout(NX.idle); (function on(){ if (NX.fired) return; nxSet(NX.p + .06); if (!NX.fired) requestAnimationFrame(on); })(); } });
addEventListener('keydown', e => { if (openIdx >= 0 && ['ArrowDown','PageDown',' '].includes(e.key) && atEnd()){ e.preventDefault(); nxSet(NX.p + .12); nxIdle(); } });


// more-work table: red fill enters from the side the cursor came in, leaves toward where it goes
// past projects: a case page and/or a live site per row (placeholders for now — fill in the real links)
// one link → the whole row goes there (live opens in a new tab); both → the row opens the case, the buttons pick
// columns hug their content (widest entry + 56px gap), all to the left — the hover buttons stay on the right
(() => {
  const tb = document.querySelector('#more .m-table'); if (!tb) return;
  const fit = () => {
    for (let c = 1; c <= 3; c++){
      let w = 0;
      tb.querySelectorAll(`.m-row > span:nth-child(${c})`).forEach(sp => { const r = document.createRange(); r.selectNodeContents(sp); w = Math.max(w, r.getBoundingClientRect().width); });
      tb.style.setProperty('--c' + c, Math.ceil(w + 14) + 'px');
    }
  };
  fit(); addEventListener('resize', fit); document.fonts && document.fonts.ready.then(fit);
})();
const PAST_LINKS = window.__SL.moreLinks;
const openHome = name => { const k = PROJECTS.findIndex(p => p.name === name); if (k >= 0) openProject(k); };
document.querySelectorAll('#more .m-row:not(.m-head)').forEach((r, i) => {
  const L = PAST_LINKS[i] || {};
  const acts = document.createElement('span'); acts.className = 'm-acts';
  // both → View live first, View case on the far right in black
  if (L.live) acts.insertAdjacentHTML('beforeend', `<a class="m-btn" href="${L.live}" target="_blank" rel="noopener">View live ↗</a>`);
  if (L.case) acts.insertAdjacentHTML('beforeend', `<a class="m-btn${L.live ? ' solid' : ''}" href="${L.case}">View case</a>`);
  if (L.home) acts.insertAdjacentHTML('beforeend', `<button class="m-btn${L.live ? ' solid' : ''}" data-home>View case</button>`);
  if (L.soon) acts.insertAdjacentHTML('beforeend', `<span class="m-soon">Coming soon</span>`);
  const hb = acts.querySelector('[data-home]'); if (hb) hb.addEventListener('click', () => openHome(L.home));
  r.appendChild(acts);
  r.style.cursor = (L.home || L.case || L.live) ? 'pointer' : '';
  r.addEventListener('click', e => {
    if (e.target.closest('.m-btn')) return;                       // a button does its own thing
    if (L.home) openHome(L.home);
    else if (L.case) location.href = L.case;                           // case first, same tab
    else if (L.live) window.open(L.live, '_blank', 'noopener');   // only live → new tab
  });
  const side = e => { const b = r.getBoundingClientRect(); return e.clientY < b.top + b.height / 2 ? 'top' : 'bottom'; };
  r.addEventListener('mouseenter', e => { clearTimeout(r._lv); r.style.setProperty('--o', side(e)); void r.offsetWidth; r.classList.add('h'); });
  r.addEventListener('mouseleave', e => { const o = side(e); clearTimeout(r._lv); r._lv = setTimeout(() => { r.style.setProperty('--o', o); void r.offsetWidth; r.classList.remove('h'); }, 160); });   // lingers a beat — moving between rows overlaps
});


// ---------------- video reel: the header frame grows into a full-screen player ----------------
(function(){
  const btn = document.getElementById('reel'), rp = document.getElementById('reelPlayer');
  const stageEl = rp.querySelector('.rp-stage'), vid = rp.querySelector('video'), thumb = btn.querySelector('video');
  const box = r => ({left:r.left, top:r.top, width:r.width, height:r.height});
  const target = () => { const w = Math.min(innerWidth * .86, (innerHeight * .8) * 16/9), h = w * 9/16; return {left:(innerWidth-w)/2, top:(innerHeight-h)/2, width:w, height:h}; };
  const set = (r) => Object.assign(stageEl.style, {left:r.left+'px', top:r.top+'px', width:r.width+'px', height:r.height+'px'});
  const anim = (a, b) => stageEl.animate([{left:a.left+'px',top:a.top+'px',width:a.width+'px',height:a.height+'px'},{left:b.left+'px',top:b.top+'px',width:b.width+'px',height:b.height+'px'}],
                                          {duration: 750, easing: 'cubic-bezier(.76,0,.24,1)', fill:'forwards'}).finished;
  let open = false, busy = false;
  btn.addEventListener('click', async () => {
    if (busy || open) return; busy = true;
    const from = box(btn.querySelector('video').getBoundingClientRect());
    rp.classList.add('open'); set(from); void rp.offsetWidth; rp.classList.add('bg');
    try { vid.currentTime = thumb.currentTime || 0; } catch(e){}
    await anim(from, target()); stageEl.getAnimations().forEach(a=>a.cancel()); set(target());
    vid.muted = false; vid.play().catch(()=>{ vid.muted = true; vid.play().catch(()=>{}); });
    open = true; busy = false;
  });
  async function close(){
    if (busy || !open) return; busy = true;
    vid.pause(); rp.classList.remove('bg');
    await anim(box(stageEl.getBoundingClientRect()), box(btn.querySelector('video').getBoundingClientRect()));
    stageEl.getAnimations().forEach(a=>a.cancel()); rp.classList.remove('open'); open = false; busy = false;
  }
  rp.querySelector('.rp-close').addEventListener('click', close);
  rp.addEventListener('click', e => { if (e.target === rp) close(); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && open) close(); });
  addEventListener('resize', () => { if (open) set(target()); });
})();


// About: each part slides up into place as it scrolls in (natural stagger from their spacing)
const aboutParts = [...document.querySelectorAll('#about .rv')];
function aboutReveal(){
  const H = innerHeight;
  aboutParts.forEach((el, k) => {
    const r = el.getBoundingClientRect(), maxS = document.documentElement.scrollHeight - H;
    // fully in by the time the page can't scroll any further (things near the bottom would otherwise stay half-faded)
    let a = r.top + scrollY - H * .92, b = a + H * .32;
    if (b > maxS){ b = maxS; a = Math.min(a, b - Math.min(H * .2, b)); }
    const p = clamp((scrollY - a) / Math.max(1, b - a));
    el.style.opacity = p; el.style.transform = `translateY(${(1 - easeOut(p)) * 48}px)`;
  });
}
const easeOut = t => 1 - Math.pow(1 - t, 3);
addEventListener('scroll', () => requestAnimationFrame(aboutReveal), {passive:true});
addEventListener('resize', aboutReveal); aboutReveal();
// clients: a strip of 5 that swaps every few seconds, slot by slot
const CLIENTS = window.__SL.clients;
let cIdx = 0;
function fillStrip(first){
  [...document.querySelectorAll('#about .strip .slot')].forEach((slot, k) => {
    const name = CLIENTS[(cIdx + k) % CLIENTS.length], old = slot.querySelector('.lg');
    if (first){ old.textContent = name; return; }
    const nw = document.createElement('span'); nw.className = 'lg in'; nw.textContent = name;
    setTimeout(() => { slot.appendChild(nw); void nw.offsetWidth; nw.classList.remove('in'); old.classList.add('out'); setTimeout(() => old.remove(), 750); }, k * 90);
  });
}
fillStrip(true);
setInterval(() => { cIdx = (cIdx + (innerWidth <= 800 ? 3 : 5)) % CLIENTS.length; fillStrip(false); }, 2800);   // phones show 3

readParams();

// ---------------- opening line: the lamp lights the words; drag the red crosshair to aim it ----------------
(() => {
  const intro = document.getElementById('intro'), p = intro.querySelector('p'), aim = document.getElementById('aim'), beam = document.getElementById('beam');
  const cone = beam.querySelector('.cone'), pool = beam.querySelector('.pool'), grad = beam.querySelector('#beamG'), lampSvg = document.getElementById('lamp');
  // split into words (keeping the "stand out" wrapper)
  const wrap = node => { [...node.childNodes].forEach(n => {
    if (n.nodeType === 3){ const f = document.createDocumentFragment(); n.textContent.split(/(\s+)/).forEach(t => { if (!t) return; if (/^\s+$/.test(t)) f.append(t); else { const sp = document.createElement('span'); sp.className = 'w'; sp.textContent = t; f.append(sp); } }); n.replaceWith(f); }
    else if (n.nodeType === 1) wrap(n); }); };
  wrap(p);
  const words = [...p.querySelectorAll('.w')];
  const R = () => Math.max(60, p.getBoundingClientRect().height * .2);          // how wide the light falls on the text
  const STARTS = [[0.76, 1.060], [0.174, 1.060], [0.5, 1.45], [0.5, -0.2]];      // one start point per lamp head (relative to the paragraph)
  // phones: the text wraps differently — aim the first light under "stand out" wherever it lands
  const startFor = k => { const s = STARTS[k % STARTS.length].slice();
    if (k === 0 && innerWidth <= 800){ const so = p.querySelector('.so'), r = p.getBoundingClientRect();
      if (so && r.width){ const b = so.getBoundingClientRect(); s[0] = (b.left + b.width / 2 - r.left) / r.width; } }
    return s; };
  let X_AT = [0.578, 1.802], xLocked = false;
  addEventListener('resize', () => xLocked = false);                                                    // the hidden X on the pavement
  // one crosshair + one beam per light on the lamp
  const NS = 'http://www.w3.org/2000/svg', defs = beam.querySelector('defs'), beams = [], aims = [];
  function ensure(n){
    while (aims.length < n){
      const k = aims.length;
      const a = k ? aim.cloneNode(true) : aim; if (k){ a.removeAttribute('id'); document.body.appendChild(a); }
      const g = k ? grad.cloneNode(true) : grad; g.id = 'beamG' + k; if (k) defs.appendChild(g);
      const c = k ? cone.cloneNode() : cone, pl = k ? pool.cloneNode() : pool; c.style.fill = `url(#beamG${k})`; if (k){ beam.appendChild(c); beam.appendChild(pl); }
      const A = {el: a, rel: startFor(k), k, drag: false};
      a.addEventListener('pointerdown', e => { A.drag = true; a.classList.add('drag'); a.setPointerCapture(e.pointerId); e.preventDefault(); e.stopPropagation(); });
      a.addEventListener('pointermove', e => { if (!A.drag) return; const r = p.getBoundingClientRect();
        A.rel = [Math.max(-.1, Math.min(1.1, (e.clientX - r.left) / r.width)), Math.max(-.3, Math.min(Math.max(1.3 + 120 / r.height, X_AT[1] + .1), (e.clientY - r.top) / r.height))]; });
      const up = () => { A.drag = false; a.classList.remove('drag'); };
      a.addEventListener('pointerup', up); a.addEventListener('pointercancel', up);
      a.addEventListener('dblclick', () => A.rel = startFor(k));   // double-click: back to the start point
      aims.push(A); beams.push({cone: c, pool: pl, grad: g});
    }
  }
  ensure(1);
  function draw(){
    const r = p.getBoundingClientRect(), op = +getComputedStyle(intro).opacity;
    const on = op > .02 && lampSvg.style.display !== 'none';
    // the lamp's lights, left → right
    let bulbs = [...lampSvg.querySelectorAll('.glow .bulb')]; if (!bulbs.length) bulbs = [...lampSvg.querySelectorAll('.glow .rim, .glow .orb')].slice(0, 1);
    const swapping = document.body.classList.contains('lamp-swap');            // mid-change both lamps are drawn — keep the old count
    const n = swapping ? (draw.n || 1) : (draw.n = Math.max(1, bulbs.length)); ensure(n);
    const L = bulbs.map(b => { const bb = b.getBoundingClientRect(); return [bb.left + bb.width/2, bb.top + bb.height/2]; }).sort((a, b) => a[0] - b[0]);
    const act = aims.slice(0, n).map(A => ({A, x: r.left + A.rel[0] * r.width, y: r.top + A.rel[1] * r.height})).sort((a, b) => a.x - b.x);
    aims.forEach((A, k) => { A.el.style.display = k < n ? '' : 'none'; });
    beams.forEach((B, k) => { if (k >= n){ B.cone.style.display = B.pool.style.display = 'none'; } });
    const rr = R();
    act.forEach((o, k) => {
      const {A, x: ax, y: ay} = o, B = beams[A.k];
      A.el.style.transform = `translate(${ax}px,${ay}px)`; A.el.style.opacity = op; A.el.style.pointerEvents = op > .2 ? 'auto' : 'none';
      const xy = A.el.querySelector('.xy'); if (xy) xy.textContent = `x ${A.rel[0].toFixed(3)} · y ${A.rel[1].toFixed(3)}`;
      const src = L[k];
      if (src && on){
        const [bx, by] = src, dx = ax - bx, dy = ay - by, Ln = Math.hypot(dx, dy) || 1, nx = -dy / Ln, ny = dx / Ln, w0 = 3, w1 = rr * .75;
        // the cone runs a little past the aim and ends in a round, feathered cap (gradient fades to 0 + blur)
        const ux = dx / Ln, uy = dy / Ln, ex = ax + ux * w1 * .9, ey = ay + uy * w1 * .9;
        B.cone.setAttribute('d', `M${bx + nx*w0} ${by + ny*w0} L${ax + nx*w1} ${ay + ny*w1} Q${ex + nx*w1} ${ey + ny*w1} ${ex} ${ey} Q${ex - nx*w1} ${ey - ny*w1} ${ax - nx*w1} ${ay - ny*w1} L${bx - nx*w0} ${by - ny*w0} Z`);
        B.grad.setAttribute('x1', bx); B.grad.setAttribute('y1', by); B.grad.setAttribute('x2', ex); B.grad.setAttribute('y2', ey);
        B.pool.setAttribute('cx', ax); B.pool.setAttribute('cy', ay); B.pool.setAttribute('rx', rr); B.pool.setAttribute('ry', rr * .5);
        B.cone.style.display = B.pool.style.display = '';
      } else B.cone.style.display = B.pool.style.display = 'none';
    });
    beam.style.opacity = on ? op : 0;
    words.forEach(w => { const b = w.getBoundingClientRect();
      w.classList.toggle('lit', act.some(({x: ax, y: ay}) => { const cx = Math.max(b.left, Math.min(ax, b.right)), cy = Math.max(b.top, Math.min(ay, b.bottom)); return Math.hypot(cx - ax, (cy - ay) * 2.6) < rr * .9; })); });
    const zn = document.getElementById('aimZone');   // same limits as the drag clamp
    if (zn){ Object.assign(zn.style, {left: (r.left - .1 * r.width) + 'px', top: (r.top - .3 * r.height) + 'px', width: (1.2 * r.width) + 'px', height: (1.6 * r.height + 120) + 'px', opacity: op}); }
    const fx = document.getElementById('floorX');
    // the X sits in the middle of the lamp's light pool on the pavement (follows the lamp on any screen size)
    // measured once (and again on resize) — it stays put when the lamp changes
    // always the centre of the COBRA's pool (whichever lamp is up), taken at the top of the page — so it never moves when the lamp changes
    if (!xLocked && !swapping && scrollY < 4 && lampSvg.style.display !== 'none' && window.homeLampGeo && window.cobraPoolAt){
      const c = cobraPoolAt(); if (c){ xLocked = true; X_AT = [(c[0] - r.left) / r.width, (c[1] - r.top) / r.height]; } }
    if (fx){ fx.style.left = (r.left + X_AT[0] * r.width) + 'px'; fx.style.top = (r.top + X_AT[1] * r.height) + 'px'; fx.style.opacity = op; fx.style.pointerEvents = op > .2 ? 'auto' : 'none'; }
    requestAnimationFrame(draw);
  }
  requestAnimationFrame(() => requestAnimationFrame(draw));
  // click the X → the home lamp swaps to the next style
  const fx = document.getElementById('floorX');
  const swapLamp = el => { const L = HomeLamps.STYLES, cur = window.homeLampStyle ? window.homeLampStyle() : 'cobra';
    window.setHomeLamp && window.setHomeLamp(L[(L.indexOf(cur) + 1) % L.length]);
    el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); setTimeout(() => el.classList.remove('pop'), 350); };
  fx.addEventListener('click', e => { e.stopPropagation(); swapLamp(fx); });
  // the same X at the bottom of the page: on the pavement under the lamp once it has settled at the end
  const fx2 = fx.cloneNode(true); fx2.id = 'floorX2'; document.body.appendChild(fx2);
  fx2.addEventListener('click', e => { e.stopPropagation(); swapLamp(fx2); });
  // centre of the cobra's pavement ring, in lamp units, for a given turn (cached)
  const spotCache = {}, probe = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  probe.setAttribute('style', 'position:absolute;width:0;height:0;overflow:hidden;visibility:hidden'); document.body.appendChild(probe);
  function cobraSpot(deg){ deg = ((Math.round(deg) % 360) + 360) % 360; if (spotCache[deg]) return spotCache[deg];
    probe.innerHTML = HomeLamps.at('cobra', deg).svg; const ring = probe.querySelector('.pool > *'); const b = ring ? ring.getBBox() : {x: 0, y: 0, width: 0, height: 0};
    return spotCache[deg] = [b.x + b.width / 2, b.y + b.height / 2]; }
  // screen position of the cobra's pool centre for the lamp as it stands now (any style, any turn)
  window.cobraPoolAt = () => { if (!window.homeLampGeo) return null;
    const P = cobraSpot(homeLampGeo.deg()), B = homeLampGeo.box('cobra'), r = lampSvg.getBoundingClientRect(), h = +lampSvg.getAttribute('height') || r.height;
    if (!r.width) return null; const k = h / (B[3] - B[1]), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    return [cx + (P[0] - (B[0] + B[2]) / 2) * k, cy + (P[1] - (B[1] + B[3]) / 2) * k]; };
  (function placeX2(){
    requestAnimationFrame(placeX2);
    const maxS = document.documentElement.scrollHeight - innerHeight, near = Math.min(1, Math.max(0, 1 - (maxS - scrollY) / (innerHeight * .25)));
    const busy = document.body.classList.contains('in-project') || document.body.classList.contains('in-thoughts');
    if (near <= 0 || busy || lampSvg.style.display === 'none' || !window.homeLampGeo){ fx2.style.opacity = 0; fx2.style.pointerEvents = 'none'; return; }
    // always where the COBRA's light would land, whichever lamp is up (so the button never moves when the lamp changes)
    const c = cobraPoolAt(); if (!c) return;
    let [x, y] = c;
    if (innerWidth <= 800){ const r = lampSvg.getBoundingClientRect(); y = Math.max(y, r.bottom - 14); }   // phones: level with the lamp's base, not behind it
    fx2.style.left = x + 'px'; fx2.style.top = y + 'px';
    fx2.style.opacity = near.toFixed(3); fx2.style.pointerEvents = near > .05 ? 'auto' : 'none';
  })();                                   // double-click: back to the start point
  addEventListener('resize', () => {});
})();

// ---------------- smooth scroll (Lenis): the page, the project overlay and the thoughts overlay ----------------
(() => {
  if (!window.Lenis) return;
  const box = document.getElementById('lenisOn'), proj = document.getElementById('project'), th = document.getElementById('thoughts');
  let all = [], raf = 0;
  const loop = t => { all.forEach(l => l.raf(t)); raf = requestAnimationFrame(loop); };
  function on(){
    if (all.length) return;
    const o = {lerp: .1, wheelMultiplier: 1, smoothWheel: true};
    window.lenis = new Lenis(o);
    all = [window.lenis, window.lenisProj = new Lenis({...o, wrapper: proj, content: proj})];
    raf = requestAnimationFrame(loop);
  }
  function off(){ cancelAnimationFrame(raf); all.forEach(l => l.destroy()); all = []; window.lenis = window.lenisProj = null; }
  box.addEventListener('change', () => box.checked ? on() : off());
  if (box.checked) on();
})();

// ---------------- scroll text reveal (About): letters go grey/background → red → ink as you scroll ----------------
// .tr--gray starts light grey, .tr--clear starts in the page colour (appears out of the background)
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const hex = h => { h = h.replace('#', ''); return [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16)); };
  const rgb = c => { const v = (c.match(/\d*\.?\d+/g) || [0, 0, 0]).slice(0, 3).map(Number); return /^color\(/.test(c) ? v.map(x => x * 255) : v; };   // also reads color(srgb …)
  const mix = (a, b, t) => `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(',')})`;
  const tok = n => rgb(getComputedStyle(document.documentElement).getPropertyValue(n).trim().replace(/^#(..)(..)(..)$/, (m, a, b, c) => `rgb(${parseInt(a,16)},${parseInt(b,16)},${parseInt(c,16)})`));
  let GRAY = tok('--rv-from'), RED = tok('--rv-mid');
  // every text on the home page: headings appear out of the background, the rest from grey (the intro line is lit by the lamp instead)
  const CLEAR = '#page section > .tag, #more h2, #about h2, #about h3, #about .aw b';
  const GRAYS = '#more .idx, #about .idx, #about .lbl, #about .cols li, #about .aw span, #about .meta';
  document.querySelectorAll(CLEAR).forEach(e => e.classList.add('tr', 'tr--clear'));
  document.querySelectorAll(GRAYS).forEach(e => e.classList.add('tr', 'tr--gray'));
  const items = [...document.querySelectorAll('.tr')].map(el => {
    const end = rgb(getComputedStyle(el).color), start = el.classList.contains('tr--clear') ? tok('--bg') : GRAY;
    el.setAttribute('aria-label', el.textContent);
    // wrap each letter (words kept whole so lines don't break mid-word)
    const walk = node => [...node.childNodes].forEach(n => {
      if (n.nodeType === 3){ const f = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(w => { if (!w) return; if (/^\s+$/.test(w)){ f.append(w); return; }
          const ws = document.createElement('span'); ws.className = 'trw'; ws.setAttribute('aria-hidden', 'true');
          for (const ch of w){ const c = document.createElement('span'); c.className = 'trc'; c.textContent = ch; ws.append(c); }
          f.append(ws); });
        n.replaceWith(f); }
      else if (n.nodeType === 1) walk(n); });
    walk(el);
    const words = [...el.querySelectorAll('.trw')], chars = [...el.querySelectorAll('.trc')];
    return {el, chars, words, cw: chars.map(c => words.indexOf(c.parentNode)), ks: null, start, end, last: -1};
  });
  const mixA = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
  let LIGHT = [255, 176, 74];
  function paint(it, p){
    const n = it.chars.length;
    it.chars.forEach((c, i) => {
      const k = Math.min(1, Math.max(0, (p - (i / Math.max(1, n - 1)) * .88) / .12));   // short per-letter window → tighter, stronger red band
      let col = k < .4 ? mixA(it.start, RED, k / .4) : mixA(RED, it.end, (k - .4) / .6);
      // dusk: the lamp's light on top of the reveal — per word, scaled by how far the letter has revealed
      const lk = it.ks ? (it.ks[it.cw[i]] || 0) * k : 0; if (lk > .003) col = mixA(col, LIGHT, lk);
      c.style.color = `rgb(${col.map(Math.round).join(',')})`;
    });
  }
  // the dusk light module feeds per-word light amounts here
  window.TR = { items, light(it, ks, light){ it.ks = ks; if (light) LIGHT = light; paint(it, Math.max(0, it.last)); } };
  let queued = false;
  function update(){
    queued = false; const vh = innerHeight;
    for (const it of items){
      const r = it.el.getBoundingClientRect(), maxS = document.documentElement.scrollHeight - vh;
      // 0 when the text's top reaches 85% of the screen … 1 when its bottom passes 40%,
      // squeezed to finish at the very end of the page for texts that can never scroll that far up
      let a = r.top + scrollY - vh * .85, b = a + vh * .45 + r.height;
      if (b > maxS){ b = maxS; a = Math.min(a, b - Math.min(vh * .3, b)); }
      const p = Math.min(1, Math.max(0, (scrollY - a) / Math.max(1, b - a)));
      const q = Math.round(p * 400) / 400; if (q === it.last) continue; it.last = q; paint(it, q);
    }
  }
  const req = () => { if (!queued){ queued = true; requestAnimationFrame(update); } };
  addEventListener('scroll', req, {passive: true}); addEventListener('resize', req); update();
  // dusk / light: re-read the colours and repaint
  addEventListener('themechange', () => {
    GRAY = tok('--rv-from'); RED = tok('--rv-mid');
    const bg = tok('--bg');
    items.forEach(it => { it.end = rgb(getComputedStyle(it.el).color); it.start = it.el.classList.contains('tr--clear') ? bg : GRAY; it.last = -1; if (document.documentElement.dataset.theme !== 'dusk') it.ks = null; });
    update();
  });
})();

// buttons whose letters spread on hover: lock their width to the spread width up front, so the hover never nudges the nav
(() => {
  const lock = el => { if (el.dataset.w || !el.querySelector('.l-txt') || !el.offsetParent) return;
    el.style.minWidth = ''; el.classList.add('fx-measure'); const w = el.getBoundingClientRect().width; el.classList.remove('fx-measure');
    if (w){ el.style.minWidth = Math.ceil(w) + 'px'; el.dataset.w = 1; } };
  const all = () => document.querySelectorAll('.fx').forEach(lock);
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(all); addEventListener('load', all);
  addEventListener('resize', () => { document.querySelectorAll('.fx[data-w]').forEach(el => delete el.dataset.w); all(); });
  document.addEventListener('pointerenter', e => { const el = e.target; if (el.matches && el.matches('.fx')) lock(el); }, true);   // ones that were hidden at load
})();


// blue guide frames: off by default, toggle in controls
(() => { const b = document.getElementById('guidesOn'); const f = () => document.body.classList.toggle('guides', b.checked); b.addEventListener('change', f); f(); })();

document.querySelectorAll('.ft-y').forEach(e => e.textContent = new Date().getFullYear());

// H toggles the dev tools (test pages in the nav, the controls panel) — not while typing in a field
addEventListener('keydown', e => {
  if (e.key.toLowerCase() !== 'h' || e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.target.closest && e.target.closest('input,textarea,select,[contenteditable]')) return;
  document.body.classList.toggle('dev');
});

// the reel button lives in the bottom-left corner, outside the header's layer (so the footer can slide over it)
(() => { const r = document.getElementById('reel'); if (!r) return; document.body.appendChild(r);
  // when the footer comes up, the reel rides up with it instead of slipping underneath
  const f = document.getElementById('foot');
  const hud = document.getElementById('hud'), fr = r.querySelector('.r-frame'), lb = r.querySelector('.r-lbl');
  const place = () => { const t = f ? f.getBoundingClientRect().top : innerHeight, up = Math.max(0, innerHeight - t); r.style.bottom = (24 + up) + 'px'; if (hud) hud.style.bottom = (16 + up) + 'px';
    // twice the size in the hero, back to normal over the first ~250px of scroll
    // only the video frame grows (the label and the corner brackets keep their size)
    const k = Math.min(1, Math.max(0, scrollY / 250)), e = k * k * (3 - 2 * k), sc = 2 - e * .55;   // 2× in the hero → settles at 1.45×
    fr.style.width = (64 * sc).toFixed(1) + 'px'; fr.style.height = (38 * sc).toFixed(1) + 'px';
    // a little into the scroll the label fades and slides in behind the frame
    const q = Math.min(1, Math.max(0, (scrollY - 60) / 200)), qe = q * q * (3 - 2 * q);
    lb.style.opacity = (1 - qe).toFixed(3); lb.style.transform = `translate(-50%, ${(-qe * 26).toFixed(1)}px)`;   // the label rises in behind the frame
    r.style.bottom = (16 + 22 * (1 - qe) + up) + 'px'; };              // …and the frame settles down into the corner
  addEventListener('scroll', place, {passive: true}); addEventListener('resize', place); place(); })();

// ---------------- dusk: the sky + the home lamp's real light (src/scripts/dusk-light.js) ----------------
initDuskLight();

// ---------------- easter egg: click the lamp's bulb → dusk mode (click again → back to day) ----------------
(() => {
  const root = document.documentElement, lamp = document.getElementById('lamp');
  const hit = document.createElement('button'); hit.id = 'bulbHit'; hit.setAttribute('aria-label', 'Switch the street light (dark / light)'); document.body.appendChild(hit);
  try { if (sessionStorage.getItem('sl-theme') === 'dusk') root.dataset.theme = 'dusk'; } catch(e){}
  // the hit area follows the bulb wherever the lamp is
  (function follow(){
    const b = lamp && lamp.querySelector('.glow .bulb, .glow .rim, .glow .orb');
    const on = b && lamp.style.display !== 'none' && +getComputedStyle(lamp).opacity > .2 && !document.body.classList.contains('in-project') && !document.body.classList.contains('in-thoughts');
    if (on){ const r = b.getBoundingClientRect(); hit.style.display = ''; hit.style.transform = `translate(${r.left + r.width / 2}px,${r.top + r.height / 2}px)`; }
    else hit.style.display = 'none';
    requestAnimationFrame(follow);
  })();
  function apply(dusk){
    if (dusk) root.dataset.theme = 'dusk'; else delete root.dataset.theme;
    try { sessionStorage.setItem('sl-theme', dusk ? 'dusk' : 'light'); } catch(e){}
    dispatchEvent(new Event('themechange'));
  }
  hit.addEventListener('pointerdown', e => e.stopPropagation());
  // switch with the circle opening from (x, y) — also used by sub-pages (the playground's lamps)
  function switchFrom(dusk, x, y){
    if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches){ apply(dusk); return; }
    // the new street spreads out from the bulb in a circle
    const R = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    document.startViewTransition(() => apply(dusk)).ready.then(() => {
      // in % of the snapshot, not px: stays on the bulb even if the page is shown scaled / zoomed
      const px = (x / innerWidth * 100).toFixed(3) + '%', py = (y / innerHeight * 100).toFixed(3) + '%', rp = (R / (Math.hypot(innerWidth, innerHeight) / Math.SQRT2) * 100).toFixed(3) + '%';
      root.animate({clipPath: [`circle(0% at ${px} ${py})`, `circle(${rp} at ${px} ${py})`]},
                   {duration: 750, easing: 'cubic-bezier(.5,0,.75,0)', pseudoElement: '::view-transition-new(root)'});
    });
  }
  window.slSetTheme = (dusk, x = innerWidth / 2, y = innerHeight / 2) => { if ((root.dataset.theme === 'dusk') !== !!dusk) switchFrom(!!dusk, x, y); };
  hit.addEventListener('click', e => {
    e.stopPropagation();
    // the circle starts from the bulb itself (the head of the lamp), not from wherever the click landed
    const b = lamp && lamp.querySelector('.glow .bulb, .glow .rim, .glow .orb'), br = b && b.getBoundingClientRect();
    const dusk = root.dataset.theme !== 'dusk', x = br ? br.left + br.width / 2 : e.clientX, y = br ? br.top + br.height / 2 : e.clientY;
    switchFrom(dusk, x, y);
  });
  if (root.dataset.theme === 'dusk') requestAnimationFrame(() => dispatchEvent(new Event('themechange')));
})();

// ---------------- dusk palette controls (dev panel, H) ----------------
(() => {
  const KEY = 'dusk-palette-v1';
  // Matan's tuned dusk palette
  const DEF = {bg:'#0a152e', face:'#0a152e', ink:'#98b1cd', ink2:'#607c9f', mute:'#607c9f', soft:'#1e2d66',
               acc:'#fdbd4e', beam:'#ffa82e', bulb:'#ffffff', rvFrom:'#2c4d78', rvMid:'#fcbd4f',
               lampHi:'#35425f', lampEdge:'#323f4e', lampMid:'#384557', lampLo:'#04070c', guideLine:'#536d88', grain:.16};
  const SPEC = [['Surfaces'], ['bg','background'], ['face','cubes / cards'], ['soft','soft lines'],
                ['Type'], ['ink','text + lines'], ['ink2','secondary text'], ['mute','muted text'],
                ['Light'], ['acc','accent (hover, tags, selection)'], ['beam','light beam + lit words'], ['bulb','bulb'],
                ['Scroll reveal'], ['rvFrom','letters start'], ['rvMid','letters pass through'],
                ['Lamp + figures'], ['guideLine','dashed diagonal line'], ['lampHi','strong lines'], ['lampEdge','edges'], ['lampMid','mid lines'], ['lampLo','faint lines']];
  let P = {...DEF}; try { Object.assign(P, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch(e){}
  const st = document.createElement('style'); st.id = 'duskVars'; document.head.appendChild(st);
  const write = () => {
    st.textContent = `html[data-theme="dusk"]{--bg:${P.bg};--face:${P.face};--ink:${P.ink};--ink2:${P.ink2};--mute:${P.mute};--soft:${P.soft};--acc:${P.acc};--beam:${P.beam};--rv-from:${P.rvFrom};--rv-mid:${P.rvMid};--guide-line:${P.guideLine}}
html[data-theme="dusk"] #lamp{--hi:${P.lampHi};--edge:${P.lampEdge};--mid:${P.lampMid};--lo:${P.lampLo};--plate:${P.bg}}
html[data-theme="dusk"] #lamp .bulb{fill:${P.bulb}} html[data-theme="dusk"] #lamp .ray{stroke:${P.beam}}
html[data-theme="dusk"] .w.lit{color:${P.beam}}
html[data-theme="dusk"] .hl{--hairline-plate:${P.face};--hairline-hi:${P.lampHi};--hairline-edge:${P.lampEdge};--hairline-mid:${P.lampMid};--hairline-lo:${P.lampLo}}
html[data-theme="dusk"] .wrap.on .hl{--hairline-hi:${P.acc}}`;
    if (document.documentElement.dataset.theme === 'dusk') dispatchEvent(new Event('themechange'));
  };
  const box = document.createElement('details'); box.id = 'duskCtl'; box.open = true; box.setAttribute('data-lenis-prevent', '');
  box.innerHTML = `<summary>dusk palette</summary><div class="dc-b">${SPEC.map(([k, l]) => l === undefined ? `<div class="dc-h">${k}</div>`
      : `<label><input type="color" data-k="${k}" value="${P[k]}"><span>${l}</span><code>${P[k]}</code></label>`).join('')}
    <div class="dc-h">Grain</div>
    <label class="rg"><span>amount</span><code data-v="grain"></code><input type="range" data-g="grain" min="0" max="1" step=".01"></label>
    <label class="rg"><span>size (fine → coarse)</span><code data-v="grainSize"></code><input type="range" data-g="grainSize" min=".15" max="2.5" step=".01"></label>
    <div class="dc-btns"><button data-a="toggle">dusk on / off</button><button data-a="save">save</button><button data-a="reset">reset</button><button data-a="copy">copy JSON</button><span class="ok"></span></div></div>`;
  document.body.appendChild(box);
  // grain sliders: start from the Dusk tests values until moved here
  const g0 = window.duskSkyGrain ? duskSkyGrain() : { grain: .06, grainSize: .9 };
  ['grain', 'grainSize'].forEach(k => { if (P[k] === undefined) P[k] = g0[k]; box.querySelector(`[data-g="${k}"]`).value = P[k]; box.querySelector(`[data-v="${k}"]`).textContent = P[k]; });
  const grainOut = () => dispatchEvent(new CustomEvent('skygrain', { detail: { grain: +P.grain, grainSize: +P.grainSize } }));
  box.addEventListener('input', e => { const g = e.target.dataset.g; if (!g) return; P[g] = +e.target.value; box.querySelector(`[data-v="${g}"]`).textContent = P[g]; grainOut(); });
  grainOut();
  box.addEventListener('input', e => { const k = e.target.dataset.k; if (!k) return; P[k] = e.target.value; e.target.parentNode.querySelector('code').textContent = P[k]; write(); });
  box.addEventListener('click', async e => {
    const a = e.target.closest('[data-a]'); if (!a) return; const ok = box.querySelector('.ok');
    if (a.dataset.a === 'toggle'){ const r = document.documentElement; if (r.dataset.theme === 'dusk') delete r.dataset.theme; else r.dataset.theme = 'dusk'; dispatchEvent(new Event('themechange')); }
    if (a.dataset.a === 'save'){ try { localStorage.setItem(KEY, JSON.stringify(P)); ok.textContent = 'saved ✓'; } catch(err){ ok.textContent = 'can’t save'; } }
    if (a.dataset.a === 'reset'){ P = {...DEF, ...(window.duskSkyGrain ? duskSkyGrain() : {})}; ['grain', 'grainSize'].forEach(k => { box.querySelector(`[data-g="${k}"]`).value = P[k]; box.querySelector(`[data-v="${k}"]`).textContent = P[k]; }); dispatchEvent(new CustomEvent('skygrain', { detail: null })); try { localStorage.removeItem(KEY); } catch(err){} box.querySelectorAll('input[data-k]').forEach(i => { i.value = P[i.dataset.k]; i.parentNode.querySelector('code').textContent = P[i.dataset.k]; }); write(); ok.textContent = 'reset ✓'; }
    if (a.dataset.a === 'copy'){ const t = JSON.stringify(P); try { await navigator.clipboard.writeText(t); ok.textContent = 'copied ✓'; } catch(err){ prompt('JSON', t); } }
    setTimeout(() => ok.textContent = '', 1600);
  });
  write();
})();
