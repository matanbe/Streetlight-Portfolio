// Page entrances shared by the tables (Work, Thoughts): rows come in one after another, each row's line draws itself
// left → right (a trim path on its bottom border), and the text plays the Filament in step with it.
import { slFilament } from './filament.js';

const still = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch(e){ return false; } };

export function slRowsIn(rows, o = {}){
  if (still()) return;
  const base = o.base || 0, step = o.step || 40;
  rows.forEach((r, i) => {
    const cs = getComputedStyle(r), bw = parseFloat(cs.borderBottomWidth) || 0, d = base + Math.min(i, 16) * step;
    if (!bw) return;
    // the line sits inside the row's bottom edge (rows clip what's outside); the real border is hidden at once (no fade) and comes back at once
    const ln = document.createElement('i'); ln.setAttribute('aria-hidden', 'true');
    ln.style.cssText = `position:absolute;left:0;right:0;bottom:0;height:${bw}px;background:${cs.borderBottomColor};transform:scaleX(0);transform-origin:left;pointer-events:none;z-index:3`;
    const tr = r.style.transition; r.style.transition = 'none'; r.style.borderBottomColor = 'transparent'; r.appendChild(ln);
    ln.animate([{transform: 'scaleX(0)'}, {transform: 'scaleX(1)'}], {duration: 800, delay: d, fill: 'forwards', easing: 'cubic-bezier(.65,0,.35,1)'})
      .finished.then(() => { r.style.borderBottomColor = ''; ln.remove(); requestAnimationFrame(() => r.style.transition = tr); });
  });
}

// a table page: title (Filament) → chips (fade) → column heads → rows, each with its line
export const slReady = () => document.documentElement.classList.remove('sl-enter');
export function tableEnter({title, chips, table}){
  if (still()){ slReady(); return; }
  const head = [...table.querySelectorAll('.m-head')], rows = [...table.querySelectorAll('.m-row:not(.m-head)')].filter(r => r.offsetParent !== null);
  if (title) slFilament([title], () => 0);
  if (chips) chips.animate([{opacity: 0}, {opacity: 1}], {duration: 520, delay: 180, fill: 'backwards', easing: 'ease'});
  slRowsIn(head, {base: 260}); slRowsIn(rows, {base: 364, step: 40});
  slFilament([...head.flatMap(r => [...r.children]), ...rows], el => el.closest('.m-head') ? 260 : 364 + Math.min(rows.indexOf(el), 16) * 40);
  slReady();   // everything is in its first frame now: show the page
}

// a text page (an article): everything is hidden letter by letter at once; each part plays when it scrolls in —
// the ones already on screen keep their order (at + step × index), later ones start as they arrive
export function articleEnter(groups){
  if (still()){ slReady(); return; }
  const all = []; groups.forEach(g => g.els.forEach((el, i) => { el._at = g.at + (g.step || 0) * Math.min(i, 12); all.push(el); }));
  slFilament.prepare(all); slReady();
  const t0 = performance.now();
  const io = new IntersectionObserver(es => es.forEach(en => { if (!en.isIntersecting) return; io.unobserve(en.target);
    const el = en.target, wait = Math.max(0, el._at - (performance.now() - t0)); slFilament([el], () => wait); }), {threshold: .15});
  all.forEach(el => io.observe(el));
}
