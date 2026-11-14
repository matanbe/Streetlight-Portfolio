// "Filament" text entrance (after Codrops Text Character Animations #16), with the values tuned in the prototype.
// slFilament(elements, delayOf): each character heats up and cools into its own colour; delayOf(el, i) → ms.
export const slFilament = (() => {
  const P = {"timing": {"dur": 600, "letter": 10, "line": 0, "order": "lines", "textGap": 0}, "heat": {"hot": 0.68, "cool": 0.4, "redAt": 0.84, "gStart": 0, "gEnd": 0.02, "bStart": 0, "bEnd": 0.11, "gMax": 0, "bMax": 0}, "halo": {"halo": 0.1, "inner": 0.45, "outer": 0.7, "innerA": 0.32, "outerA": 0.7}, "flicker": {"share": 0.57, "depthMin": 0.55, "depthMax": 0.85, "dips": 3}};
  const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a || 1e-6))); return t * t * (3 - 2 * t); };
  const H = P.heat, G = P.halo, T = P.timing, F = P.flicker;
  const glow = h => [ss(0, H.redAt, h), H.gMax * ss(H.gStart, H.gEnd, h), H.bMax * ss(H.bStart, H.bEnd, h)];
  // dusk theme: the same curve, but the hot light is our dusk orange (lighter) and it cools into the dusk text colour (white)
  const DUSK_HOT = [253, 189, 78];   // #fdbd4e — the dusk accent (as on the live site)
  const dusk = () => document.documentElement.dataset.theme === 'dusk';
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
      else if (c.nodeType === 1 && !/^(BUTTON|SELECT|OPTION|SVG|IMG|VIDEO|CANVAS)$/i.test(c.tagName)) walk(c); });
    walk(el); return chars; };
  const lines = chars => { const L = []; let top = null; chars.forEach(c => { const y = Math.round(c.getBoundingClientRect().top);
      if (top === null || Math.abs(y - top) > 4){ L.push([]); top = y; } L[L.length - 1].push(c); }); return L; };
  let N = 0;
  return (els, delayOf) => {
    try { if (matchMedia('(prefers-reduced-motion: reduce)').matches) return; } catch(e){}
    els.forEach(el => {
      if (!el._chars || !el._chars.length || !el.contains(el._chars[0])){ el._chars = wrap(el); el._n = N++; }
      el._chars.forEach(c => { c.getAnimations().forEach(a => a.cancel()); c.style.color = 'transparent'; });
    });
    els.forEach((el, k) => { const t0 = delayOf(el, k), ink = (getComputedStyle(el).color.match(/\d+/g) || [27, 27, 27]).slice(0, 3).map(Number);
      lines(el._chars).forEach((line, li) => line.forEach((c, i) => {
        const r = Math.abs(Math.sin((li * 31 + i + el._n * 97) * 12.9898) * 43758.5453) % 1;
        const flick = r < F.share ? Array.from({length: Math.max(1, r < F.share / 2 ? F.dips - 1 : F.dips)}, (_, q) => [.07 + .085 * q + .03 * ((r * 7 + q * .37) % 1), F.depthMin + (F.depthMax - F.depthMin) * ((r * 13 + q * .61) % 1)]) : null;
        const own = (getComputedStyle(c.parentElement).color.match(/\d+/g) || ink).slice(0, 3).map(Number);
        c.animate(frames(own, flick), {duration: T.dur, delay: t0 + li * T.line + i * T.letter, fill: 'both'}).finished.then(() => { c.getAnimations().forEach(a => a.cancel()); c.style.color = ''; }).catch(() => {});
      })); });
  };
})();
