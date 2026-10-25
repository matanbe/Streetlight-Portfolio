// contact form: drops from the navbar, validates, then the perforated stub is torn off to send (ported from the prototype)
const contactPop = document.getElementById('contactPop');
if (contactPop){
// contact form: drop down, validate, then fold / tear the stub off to send
const cf = contactPop, cfStub = cf.querySelector('.cf-stub'), cfBody = cf.querySelector('.cf-body');
// The peel: grab the stub and drag — the nearest top corner lifts and the stub peels back on itself like a sticker,
// tearing along the perforation as the fold line runs across it. Drawn on a canvas: the part still attached, the
// folded-back flap (its plain back, shaded toward the fold), and the flap's shadow. Once the fold has crossed the whole
// perforation the stub is free and falls. A plain click peels it by itself.
const TEST_MODE = false;   // prototype: allow sending an empty form — set to false to require name + email
const SH = 70, MG = 140;  // stub height; canvas margin around the stub for the flap to travel into
(() => {   // the resting stub stays plain DOM (one face) — the canvas only takes over while it peels
  const tpl = cfStub.innerHTML; cfStub.innerHTML = '';
  const st = document.createElement('div'); st.className = 'cf-strip s0'; st.style.height = SH + 'px';
  const f = document.createElement('div'); f.className = 'cf-face';
  const inn = document.createElement('div'); inn.className = 'cf-in'; inn.innerHTML = tpl; inn.style.top = '0';
  f.append(inn); st.append(f); cfStub.append(st);
})();
const pc = document.createElement('canvas'); pc.className = 'cf-peel'; cfStub.append(pc);
const pctx = pc.getContext('2d');
const ts = {phase: 'idle', held: false, raf: 0, last: 0, moved: false, corner: 0, P: [0, 0], T: [0, 0], V: [0, 0], auto: 0,
  sx: 0, sy: 0, y: 0, vy: 0, rz: 0, vz: 0, fallTo: 0, pvx: 0, pvy: 0, px: 0, py: 0, pt: 0};
const clampN = (v, a, b) => Math.min(Math.max(v, a), b);
const buzz = ms => { try { navigator.vibrate && navigator.vibrate(ms); } catch(e){} };
const W = () => cfStub.offsetWidth;
function sizeCanvas(){
  const dpr = Math.min(2, devicePixelRatio || 1), w = W() + MG * 2, h = SH + MG * 2;
  pc.width = w * dpr; pc.height = h * dpr; pc.style.width = w + 'px'; pc.style.height = h + 'px'; pc.style.left = -MG + 'px'; pc.style.top = -MG + 'px';
  pctx.setTransform(dpr, 0, 0, dpr, MG * dpr, MG * dpr);
}
// clip a polygon to the half-plane (X - M)·n >= 0 (sign = 1) or < 0 (sign = -1)
function halfClip(poly, M, n, sign){
  const out = [], f = q => ((q[0] - M[0]) * n[0] + (q[1] - M[1]) * n[1]) * sign;
  for (let i = 0; i < poly.length; i++){
    const a = poly[i], b = poly[(i + 1) % poly.length], fa = f(a), fb = f(b);
    if (fa >= 0) out.push(a);
    if ((fa >= 0) !== (fb >= 0)){ const t = fa / (fa - fb); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); }
  }
  return out;
}
const reflect = (q, M, n) => { const d = (q[0] - M[0]) * n[0] + (q[1] - M[1]) * n[1]; return [q[0] - 2 * d * n[0], q[1] - 2 * d * n[1]]; };
const pathOf = (ctx, poly) => { ctx.beginPath(); poly.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.closePath(); };
function fold(){   // → {M, n, tear}: fold line through M with normal n (pointing away from the lifted corner); tear = how far along the top it has run
  const w = W(), C = ts.corner ? [w, 0] : [0, 0], P = ts.P, d = Math.hypot(P[0] - C[0], P[1] - C[1]);
  if (d < .5) return null;
  const n = [(P[0] - C[0]) / d, (P[1] - C[1]) / d], M = [(C[0] + P[0]) / 2, (C[1] + P[1]) / 2];
  // where the fold line meets the top edge (y = 0)
  const xt = Math.abs(n[0]) < 1e-6 ? (ts.corner ? -1e9 : 1e9) : (M[0] * n[0] + M[1] * n[1]) / n[0];
  const tear = ts.corner ? clampN(w - xt, 0, w) : clampN(xt, 0, w);
  return {M, n, tear, C};
}
function drawPeel(){
  const w = W(), red = getComputedStyle(cf).getPropertyValue('--bg').trim() || '#ff4d1a', F = fold();
  pctx.clearRect(-MG, -MG, w + MG * 2, SH + MG * 2);
  const rect = [[0, 0], [w, 0], [w, SH], [0, SH]];
  const keep = F ? halfClip(rect, F.M, F.n, 1) : rect, flap = F ? halfClip(rect, F.M, F.n, -1).map(q => reflect(q, F.M, F.n)) : [];
  // the part still attached: paper, perforation half-holes, corner notches, label
  if (keep.length > 2){
    pctx.save(); pathOf(pctx, keep); pctx.clip();
    pctx.fillStyle = red; pctx.fillRect(0, 0, w, SH);
    pctx.globalCompositeOperation = 'destination-out'; pctx.beginPath();
    for (let x = w / 2 % 11 - 11; x < w + 11; x += 11){ pctx.moveTo(x + 3.4, 0); pctx.arc(x, 0, 3.4, 0, Math.PI * 2); }
    pctx.moveTo(7, 0); pctx.arc(0, 0, 7, 0, Math.PI * 2); pctx.moveTo(w + 7, 0); pctx.arc(w, 0, 7, 0, Math.PI * 2); pctx.fill();
    pctx.globalCompositeOperation = 'source-over';
    const cs = getComputedStyle(cfStub.querySelector('.cf-in'));
    pctx.fillStyle = cs.color; pctx.textBaseline = 'middle';
    pctx.font = `500 14px ${cs.fontFamily}`; pctx.textAlign = 'center'; pctx.fillText(cfStub.querySelector('.cf-in span').textContent, w / 2, SH / 2 + 1.5);
    pctx.restore();
  }
  if (flap.length > 2){
    // the flap's shadow on what's still attached, then the flap itself: its back, lit at the fold where it curls
    pctx.save(); pctx.shadowColor = 'rgba(27,27,27,.35)'; pctx.shadowBlur = 14; pctx.shadowOffsetX = F.n[0] * 4; pctx.shadowOffsetY = 4 + F.n[1] * 3;
    pathOf(pctx, flap); pctx.fillStyle = '#c63a12'; pctx.fill(); pctx.restore();
    const L = Math.max(30, Math.hypot(ts.P[0] - F.C[0], ts.P[1] - F.C[1]) * .5);
    const g = pctx.createLinearGradient(F.M[0], F.M[1], F.M[0] + F.n[0] * L, F.M[1] + F.n[1] * L);
    g.addColorStop(0, '#ff9a72'); g.addColorStop(.18, '#f2602e'); g.addColorStop(.6, '#d94818'); g.addColorStop(1, '#c43c12');
    pathOf(pctx, flap); pctx.fillStyle = g; pctx.fill();
  }
  // the form's bottom edge goes ragged as far as the tear has run
  if (F && ts.phase !== 'flying') raggedTo(cfBody, F.tear, ts.corner);
  return F;
}
const FIB = [1.6,.4,2.2,.9,1.8,.2,2.4,1.1,.5,2,1.4,.3,2.3,.8,1.7,.1,2.1,1.2,.6,1.9];
function raggedTo(el, tear, fromRight){
  if (tear < .5){ el.style.clipPath = ''; return; }
  const w = el.offsetWidth, H = el.offsetHeight, a = fromRight ? w - tear : 0, b = fromRight ? w : tear, pts = ['0px 0px', `${w}px 0px`, `${w}px ${H}px`];
  for (let k = Math.ceil(w / 6); k >= 0; k--){ const x = Math.min(k * 6, w); pts.push(`${x.toFixed(1)}px ${(x >= a && x <= b ? H - FIB[k % FIB.length] : H).toFixed(1)}px`); }
  el.style.clipPath = `polygon(${pts.join(',')})`;
}
function freed(F){   // the fold line has crossed the whole perforation: both top corners are on the lifted side
  if (!F || ts.P[1] < 8 || F.n[1] <= 0) return false; const f = q => (q[0] - F.M[0]) * F.n[0] + (q[1] - F.M[1]) * F.n[1];
  return f([0, 0]) < 0 && f([W(), 0]) < 0;
}
function detach(){
  ts.held = false; ts.auto = 0; buzz(16);
  const top = cfStub.offsetTop;
  cfStub.style.position = 'absolute'; cfStub.style.top = top + 'px'; cfStub.style.left = '0';
  ts.phase = 'flying'; cf.classList.remove('tearing');
  ts.y = 0; ts.vy = clampN(ts.pvy, -300, 900) * .4 + 80; ts.rz = 0; ts.vz = (ts.corner ? -1 : 1) * (20 + Math.random() * 14);
  ts.fallTo = innerHeight - cfStub.getBoundingClientRect().top + MG;
  const v = n => cf.querySelector(`[name=${n}]`).value.trim();
  cf.querySelector('.cf-name').textContent = v('name').split(' ')[0] || 'friend';
  cfSuccess();
  // (prototype: nothing is actually sent — hook a form endpoint in here)
  setTimeout(() => { if (cf.classList.contains('sent')) cfClose(); }, 5400);
}
// success: the fields fade, the form shrinks to fit the note while it turns from red to black,
// then the note writes itself in letter by letter (the same colour sweep as the scroll reveal: black → red → white)
function cfSuccess(){
  const body = cfBody, form = cf.querySelector('.cf-form'), done = cf.querySelector('.cf-done'), h0 = body.offsetHeight;
  body.style.height = h0 + 'px'; body.style.overflow = 'hidden';
  form.animate([{opacity: 1}, {opacity: 0}], {duration: 350, fill: 'forwards'}).finished.then(() => {
    // measure the note's height, then glide there
    cf.classList.add('sent'); body.style.height = 'auto'; const h1 = body.offsetHeight; body.style.height = h0 + 'px';
    // wrap the note's letters (words kept whole)
    { const nm = document.createElement('em'); nm.className = 'cf-name'; nm.textContent = done.querySelector('.cf-name').textContent;
      done.textContent = ''; done.append('Thanks ', nm, ',', document.createElement('br'), 'I’ll\u00a0be\u00a0in\u00a0touch\u00a0soon.'); }   // break after the comma; the second line stays whole
    {
      const walk = node => [...node.childNodes].forEach(n => {
        if (n.nodeType === 3){ const f = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(w => { if (!w) return; if (/^\s+$/.test(w)){ f.append(w); return; }
            const ws = document.createElement('span'); ws.style.whiteSpace = 'nowrap';
            for (const ch of w){ const c = document.createElement('span'); c.className = 'dc'; c.textContent = ch; ws.append(c); } f.append(ws); });
          n.replaceWith(f); }
        else if (n.nodeType === 1) walk(n); });
      walk(done);
    }
    const chars = [...done.querySelectorAll('.dc')], N = chars.length;
    const fromC = [27, 27, 27], redC = [255, 77, 26];
    const endOf = c => c.closest('em') ? [255, 77, 26] : [255, 255, 255];
    const mix = (a, b, t) => `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(',')})`;
    chars.forEach(c => c.style.color = mix(fromC, fromC, 0)); done.style.opacity = 0;
    cf.classList.add('dark');
    // the title changes while the form turns dark
    const ttl = cf.querySelector('.cf-head b');
    ttl.animate([{opacity: 1}, {opacity: 0}], {duration: 300, fill: 'forwards'}).finished.then(() => {
      ttl.textContent = 'Message received.'; ttl.getAnimations().forEach(a => a.cancel());
      ttl.animate([{opacity: 0}, {opacity: 1}], {duration: 450, easing: 'ease-out'}); });
    body.animate([{height: h0 + 'px'}, {height: h1 + 'px'}], {duration: 800, easing: 'cubic-bezier(.65,0,.25,1)', fill: 'forwards'}).finished.then(() => {
      body.style.height = h1 + 'px'; body.getAnimations().forEach(a => a.cancel()); raggedTo(body, body.offsetWidth, 0);
      done.style.opacity = ''; const t0 = performance.now(), T = 1300;
      (function sweep(now){
        const p = Math.min(1, (now - t0) / T);
        chars.forEach((c, i) => {
          const k = Math.min(1, Math.max(0, (p - (i / Math.max(1, N - 1)) * .8) / .2)), end = endOf(c);
          c.style.color = k < .4 ? mix(fromC, redC, k / .4) : mix(redC, end, (k - .4) / .6);
        });
        if (p < 1 && cf.classList.contains('sent')) requestAnimationFrame(sweep);
      })(t0);
    });
  });
}
function tick(now){
  ts.raf = 0;
  const dt = ts.last ? Math.min((now - ts.last) / 1000, .05) : 1 / 60; ts.last = now;
  if (ts.phase === 'flying'){
    ts.vy += 2600 * dt; ts.y += ts.vy * dt; ts.rz += ts.vz * dt;
    // keep peeling while it falls, so it curls over as it goes
    ts.P[0] += (ts.corner ? -1 : 1) * 260 * dt; ts.P[1] += 120 * dt; drawPeel();
    cfStub.style.transform = `translateY(${ts.y.toFixed(1)}px) rotate(${ts.rz.toFixed(1)}deg)`;
    cfStub.style.opacity = clampN(1 - (ts.y - ts.fallTo * .55) / (ts.fallTo * .45), 0, 1).toFixed(3);
    if (ts.y > ts.fallTo){ ts.phase = 'torn'; ts.last = 0; cfStub.style.visibility = 'hidden'; return; }
    ts.raf = requestAnimationFrame(tick); return;
  }
  if (ts.auto){   // the click: peel along a path, easing in
    ts.auto += dt; const k = clampN(ts.auto / .8, 0, 1), e = k * k * (3 - 2 * k), w = W();
    // far enough that the fold line runs past the other end of the perforation
    const end = ts.corner ? [w - w * 2.3, SH * 1.3] : [w * 2.3, SH * 1.3], A = ts.A0;
    ts.T = [A[0] + (end[0] - A[0]) * e, A[1] + (end[1] - A[1]) * e + Math.sin(e * Math.PI) * 26];
  }
  // the lifted corner chases the target on a spring (held / auto) or springs home (let go)
  const live = ts.held || ts.auto, k = live ? 700 : 260, d = live ? 38 : 22;
  // fixed small sub-steps keep the spring stable on slow frames
  for (let n = Math.ceil(dt / (1 / 240)), h = dt / n; n > 0; n--)
    for (let i = 0; i < 2; i++){ ts.V[i] += ((ts.T[i] - ts.P[i]) * k - ts.V[i] * d) * h; ts.P[i] += ts.V[i] * h; }
  // the corner can't swing past where it's stuck down
  if (ts.P[1] < 0){ ts.P[1] = 0; ts.V[1] = Math.max(0, ts.V[1]); }
  if (ts.corner ? ts.P[0] > W() : ts.P[0] < 0){ ts.P[0] = ts.corner ? W() : 0; ts.V[0] = 0; }
  const F = drawPeel();
  if (freed(F)){ detach(); ts.raf = requestAnimationFrame(tick); return; }
  const C = ts.corner ? [W(), 0] : [0, 0];
  if (!live && Math.hypot(ts.P[0] - C[0], ts.P[1] - C[1]) < .4 && Math.hypot(ts.V[0], ts.V[1]) < 2){
    ts.phase = 'idle'; ts.last = 0; cf.classList.remove('tearing', 'peeling'); cfBody.style.clipPath = ''; return; }
  ts.raf = requestAnimationFrame(tick);
}
const wake = () => { if (!ts.raf) ts.raf = requestAnimationFrame(tick); };
function cfValid(){
  const v = n => cf.querySelector(`[name=${n}]`).value.trim(), errs = {};
  if (!v('name')) errs.name = 'Please add your name';
  if (!v('email')) errs.email = 'Please add your email';
  else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v('email'))) errs.email = 'That email doesn’t look quite right';
  if (TEST_MODE) return true;
  cf.querySelectorAll('label[data-f]').forEach(l => {
    const m = errs[l.dataset.f], e = l.querySelector('.err');
    l.classList.toggle('bad', !!m); if (m && e) e.textContent = m;
    // the underline sits under the input, above the note
    if (m){ const inp = l.querySelector('input,textarea'); l.style.setProperty('--line-y', (inp.offsetTop + inp.offsetHeight - 2) + 'px');
      l.classList.remove('nudge'); void l.offsetWidth; l.classList.add('nudge'); }
  });
  if (Object.keys(errs).length){ cf.classList.remove('shake'); void cf.offsetWidth; cf.classList.add('shake'); return false; }
  return true;
}
function startPeel(corner){
  const w = W(); ts.corner = corner; const C = corner ? [w, 0] : [0, 0];
  ts.P = C.slice(); ts.T = C.slice(); ts.V = [0, 0];
  sizeCanvas(); ts.phase = 'tearing'; cf.classList.add('tearing', 'peeling');
}
cfStub.addEventListener('pointerdown', e => {
  if (ts.phase === 'flying' || ts.phase === 'torn' || ts.auto || (e.pointerType === 'mouse' && e.button !== 0)) return;
  if (!cfValid()) return;
  e.preventDefault(); cfStub.setPointerCapture(e.pointerId);
  const r = cfStub.getBoundingClientRect(), lx = e.clientX - r.left;
  if (ts.phase === 'idle') startPeel(lx > r.width / 2 ? 1 : 0);
  ts.held = true; ts.moved = false; ts.sx = e.clientX; ts.sy = e.clientY;
  ts.base = ts.T.slice(); ts.px = e.clientX; ts.py = e.clientY; ts.pt = e.timeStamp; ts.pvx = ts.pvy = 0; wake();
});
cfStub.addEventListener('pointermove', e => {
  if (!ts.held) return;
  const dt = e.timeStamp - ts.pt;
  if (dt > 0){ ts.pvx = ts.pvx * .5 + (e.clientX - ts.px) / dt * 500; ts.pvy = ts.pvy * .5 + (e.clientY - ts.py) / dt * 500; }
  ts.px = e.clientX; ts.py = e.clientY; ts.pt = e.timeStamp;
  const dx = e.clientX - ts.sx, dy = e.clientY - ts.sy; if (Math.hypot(dx, dy) > 4) ts.moved = true;
  // the lifted corner follows the hand (it can't go above the perforation)
  ts.T = [ts.base[0] + dx * 2.2, Math.max(0, ts.base[1] + dy * 1.6)];
  wake();
});
const release = () => {
  if (!ts.held) return; ts.held = false;
  const F = fold();
  if (!ts.moved || (F && F.tear > W() * .5)){ ts.auto = 1e-6; ts.A0 = ts.P.slice(); }   // a click, or let go past halfway: it peels itself the rest of the way
  else { ts.T = ts.corner ? [W(), 0] : [0, 0]; }                                        // let go early: it lies back down
  wake();
};
cfStub.addEventListener('pointerup', release); cfStub.addEventListener('pointercancel', release);
cfStub.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && ts.phase === 'idle' && !e.repeat){ e.preventDefault(); if (!cfValid()) return; startPeel(0); ts.auto = 1e-6; ts.A0 = ts.P.slice(); wake(); } });
function cfReset(){
  cancelAnimationFrame(ts.raf); Object.assign(ts, {phase: 'idle', held: false, raf: 0, last: 0, auto: 0, y: 0, rz: 0, P: [0, 0], T: [0, 0], V: [0, 0]});
  cfStub.removeAttribute('style'); cfBody.style.clipPath = ''; pctx.clearRect(-MG, -MG, 4000, 4000);
  cf.querySelector('.cf-head b').textContent = 'Let’s Collab.';
  cf.classList.remove('sent', 'shake', 'tearing', 'peeling', 'dark'); cfBody.style.height = ''; cfBody.style.overflow = ''; cfBody.getAnimations().forEach(a => a.cancel()); cf.querySelector('.cf-form').getAnimations().forEach(a => a.cancel()); cf.querySelectorAll('input,textarea').forEach(x => x.value = '');
  cf.querySelectorAll('.cf-budget .on').forEach(b => b.classList.remove('on')); cf.querySelectorAll('.bad').forEach(l => l.classList.remove('bad'));
  cfMsg.style.height = '';
}
function cfClose(){ cf.classList.remove('on'); if (cf.classList.contains('sent')) setTimeout(cfReset, 750); }
cf.addEventListener('click', e => {
  if (e.target.closest('[data-close]')) return cfClose();
  const b = e.target.closest('.cf-budget button');
  if (b){ cf.querySelectorAll('.cf-budget button').forEach(x => x.classList.toggle('on', x === b && !b.classList.contains('on'))); return; }
});
cf.addEventListener('input', e => e.target.closest('label')?.classList.remove('bad'));
// the message grows from one line up to three, and the form grows with it
const cfMsg = cf.querySelector('textarea[name=msg]');
const cfGrow = () => { cfMsg.style.height = 'auto'; const lh = parseFloat(getComputedStyle(cfMsg).lineHeight) || 28.6, pad = 6;
  cfMsg.style.height = Math.min(cfMsg.scrollHeight, lh * 3 + pad) + 'px'; cfMsg.style.overflowY = cfMsg.scrollHeight > lh * 3 + pad + 1 ? 'auto' : 'hidden'; };
cfMsg.addEventListener('input', cfGrow);
addEventListener('keydown', e => { if (e.key === 'Escape' && cf.classList.contains('on')) cfClose(); });
document.addEventListener('pointerdown', e => { if (cf.classList.contains('on') && !e.target.closest('#contactPop,[data-nav="contact"]')) cfClose(); });
// open / close from any [data-nav="contact"] (the header button, the mobile menu, "Let's Collab")
document.addEventListener('click', e => {
  const a = e.target.closest('[data-nav="contact"]'); if (!a) return;
  e.preventDefault();
  if (cf.classList.contains('on')) cfClose();
  else { cf.classList.add('on'); setTimeout(() => cf.querySelector('[name=name]').focus({preventScroll: true}), 650); }
});
window.slContact = { open: () => cf.classList.add('on'), close: cfClose };
}
