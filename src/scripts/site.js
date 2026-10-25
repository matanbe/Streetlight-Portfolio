// Site-wide behaviour: day / dusk switch, the wordmark, direction-aware wipes, table rows, the mobile menu.
import lottie from 'lottie-web/build/player/lottie_light';
import LOGO from '../assets/logo-lottie.json';
import { initDuskLight } from './dusk-light.js';

const root = document.documentElement;

// ---------- day / dusk: one mode for the whole site (kept for the visit) ----------
function applyTheme(dusk){
  if (dusk) root.dataset.theme = 'dusk'; else delete root.dataset.theme;
  try { sessionStorage.setItem('sl-theme', dusk ? 'dusk' : 'light'); } catch(e){}
  dispatchEvent(new Event('themechange'));
}
// switch with a circle opening from (x, y) — the bulb that was clicked
window.slSetTheme = (dusk, x = innerWidth / 2, y = innerHeight / 2) => {
  dusk = !!dusk; if ((root.dataset.theme === 'dusk') === dusk) return;
  if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches){ applyTheme(dusk); return; }
  const R = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  document.startViewTransition(() => applyTheme(dusk)).ready.then(() => {
    const px = (x / innerWidth * 100).toFixed(3) + '%', py = (y / innerHeight * 100).toFixed(3) + '%', rp = (R / (Math.hypot(innerWidth, innerHeight) / Math.SQRT2) * 100).toFixed(3) + '%';
    root.animate({clipPath: [`circle(0% at ${px} ${py})`, `circle(${rp} at ${px} ${py})`]},
                 {duration: 750, easing: 'cubic-bezier(.5,0,.75,0)', pseudoElement: '::view-transition-new(root)'});
  });
};

// ---------- the wordmark: plays forward on hover, back on leave ----------
document.querySelectorAll('[data-logo]').forEach(el => {
  const a = lottie.loadAnimation({container: el, renderer: 'svg', loop: false, autoplay: false,
    animationData: JSON.parse(JSON.stringify(LOGO)), rendererSettings: {preserveAspectRatio: 'xMidYMid meet'}});
  a.addEventListener('DOMLoaded', () => a.goToAndStop(0, true));
  const host = el.closest('a') || el;
  host.addEventListener('pointerenter', () => { a.setDirection(1); a.play(); });
  host.addEventListener('pointerleave', () => { a.setDirection(-1); a.play(); });
});

// ---------- buttons + chips: the fill enters from the side the pointer came in, leaves toward where it goes ----------
{
  const SEL = '.fx, .chips button, #contactPop .cf-budget button';
  const side = (el, e) => { const r = el.getBoundingClientRect(); return e.clientX < r.left + r.width / 2 ? 'left' : 'right'; };
  ['pointerenter', 'pointerleave'].forEach(t => document.addEventListener(t, e => { const el = e.target; if (el.matches && el.matches(SEL)) el.style.setProperty('--o', side(el, e)); }, true));
}

// ---------- table rows: the red fill comes in from the top or bottom edge, and lingers a beat on the way out ----------
export function rowHover(r){
  const side = e => { const b = r.getBoundingClientRect(); return e.clientY < b.top + b.height / 2 ? 'top' : 'bottom'; };
  r.addEventListener('mouseenter', e => { clearTimeout(r._lv); r.style.setProperty('--o', side(e)); void r.offsetWidth; r.classList.add('h'); });
  r.addEventListener('mouseleave', e => { const o = side(e); clearTimeout(r._lv); r._lv = setTimeout(() => { r.style.setProperty('--o', o); void r.offsetWidth; r.classList.remove('h'); }, 160); });
}
document.querySelectorAll('.m-row:not(.m-head)').forEach(rowHover);

// ---------- mobile menu ----------
{
  const menu = document.getElementById('mnav'), btn = document.getElementById('burger');
  if (menu && btn){
    const isOpen = () => document.body.classList.contains('mn-open');
    const set = open => {
      document.body.classList.toggle('mn-open', open); btn.setAttribute('aria-expanded', open); menu.setAttribute('aria-hidden', !open);
      root.style.overflow = open ? 'hidden' : '';
    };
    btn.addEventListener('click', () => set(!isOpen()));
    menu.addEventListener('click', e => {
      const a = e.target.closest('a, .mn-contact'); if (!a) return;
      if (a.matches('.mn-contact')){ set(false); setTimeout(() => window.slContact && window.slContact.open(), 380); return; }
      // same-page anchors (/#about on the home page) close first, then scroll
      if (a.hash && a.pathname === location.pathname){ e.preventDefault(); set(false); setTimeout(() => document.querySelector(a.hash)?.scrollIntoView({behavior: 'smooth'}), 380); }
    });
    const night = menu.querySelector('.mn-night');
    const syncNight = () => { const d = root.dataset.theme === 'dusk'; night.setAttribute('aria-pressed', d); night.querySelector('b').textContent = d ? 'Lights on' : 'Lights off'; };
    night.addEventListener('click', () => { const r = night.querySelector('.mn-dot').getBoundingClientRect(); window.slSetTheme(root.dataset.theme !== 'dusk', r.left + r.width / 2, r.top + r.height / 2); });
    addEventListener('themechange', syncNight); syncNight();
    addEventListener('keydown', e => { if (e.key === 'Escape' && isOpen()) set(false); });
    matchMedia('(min-width:801px)').addEventListener('change', m => { if (m.matches && isOpen()) set(false); });
  }
}

// dusk sky (gradient + vignette + grain) — the same canvas on every page; the home page and the playground start it themselves
if (!document.getElementById('lamp') && !document.getElementById('world')) initDuskLight();

document.querySelectorAll('.ft-y').forEach(e => e.textContent = new Date().getFullYear());
