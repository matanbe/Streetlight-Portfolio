// Pulls the old Webflow site: CMS collections (if any), every static page (text + images + videos from the live HTML),
// and the full asset library. Output: webflow-export/{cms,pages,assets}/...   Run: node scripts/webflow-export.mjs
import fs from 'node:fs'; import path from 'node:path';
const env = Object.fromEntries(fs.readFileSync('.env.local', 'utf8').split('\n').filter(l => l.includes('=')).map(l => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]));
const T = env.WEBFLOW_TOKEN; if (!T) throw new Error('WEBFLOW_TOKEN missing in .env.local');
const OUT = 'webflow-export/_raw';
const sleep = ms => new Promise(s => setTimeout(s, ms));
const api = async u => { for (let i = 0; i < 6; i++){ const r = await fetch('https://api.webflow.com/v2' + u, {headers: {Authorization: 'Bearer ' + T, accept: 'application/json'}});
  if (r.status === 429){ await sleep(2000 * (i + 1)); continue; } if (!r.ok){ console.warn('  ! API ' + u + ' → ' + r.status + ' ' + (await r.text()).slice(0, 200)); return null; } return r.json(); } };
const safe = s => String(s || 'item').replace(/[^\w.-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 90) || 'item';
const MEDIA = /\.(?:jpe?g|png|gif|webp|svg|avif|mp4|webm|mov|m4v|pdf|lottie|json)(?:\?|$)/i;
const dl = async (u, dir) => { const name = safe(decodeURIComponent(u.split('/').pop().split('?')[0])); const f = path.join(dir, name);
  if (fs.existsSync(f)) return name; try { const r = await fetch(u); if (!r.ok){ console.warn('    ! ' + r.status + ' ' + u); return null; }
  fs.writeFileSync(f, Buffer.from(await r.arrayBuffer())); return name; } catch(e){ console.warn('    ! ' + e.message + ' ' + u); return null; } };
const urlsIn = v => { const out = []; const walk = x => { if (!x) return; if (typeof x === 'string'){ for (const m of x.matchAll(/https?:\/\/[^\s"'<>)]+/g)) if (MEDIA.test(m[0])) out.push(m[0]); }
  else if (Array.isArray(x)) x.forEach(walk); else if (typeof x === 'object'){ if (x.url) out.push(x.url); Object.values(x).forEach(walk); } }; walk(v); return [...new Set(out)]; };
const dec = s => s.replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(n));

const { sites } = await api('/sites');
for (const site of sites){
  const host = (site.customDomains && site.customDomains[0] && site.customDomains[0].url) || (site.shortName + '.webflow.io');
  const base = env.WEBFLOW_SITE_URL ? env.WEBFLOW_SITE_URL.replace(/\/$/, '') : 'https://' + host.replace(/^https?:\/\//, '').replace(/\/$/, '');
  console.log(`site: ${site.displayName}  →  ${base}`);

  // 1) CMS
  const cols = (await api(`/sites/${site.id}/collections`) || {collections: []}).collections;
  console.log(`CMS collections: ${cols.length}`);
  for (const c of cols){
    const cdir = path.join(OUT, 'cms', safe(c.slug)); fs.mkdirSync(cdir, {recursive: true});
    fs.writeFileSync(path.join(cdir, '_collection.json'), JSON.stringify(await api(`/collections/${c.id}`), null, 2));
    let items = [], off = 0; for (;;){ const r = await api(`/collections/${c.id}/items?limit=100&offset=${off}`); if (!r) break; items = items.concat(r.items); off += 100; if (off >= r.pagination.total) break; }
    console.log(`  ${c.displayName}: ${items.length} items`);
    for (const it of items){
      const dir = path.join(cdir, safe(it.fieldData.slug || it.id)); fs.mkdirSync(dir, {recursive: true});
      const files = {}; for (const u of urlsIn(it.fieldData)){ const n = await dl(u, dir); if (n) files[u] = n; }
      fs.writeFileSync(path.join(dir, 'item.json'), JSON.stringify({...it, _files: files}, null, 2));
      console.log(`    ${it.fieldData.slug}  (${Object.keys(files).length} files)`);
    }
  }

  // 2) static pages — read from the live site
  let pages = [], off = 0; for (;;){ const r = await api(`/sites/${site.id}/pages?limit=100&offset=${off}`); if (!r) break; pages = pages.concat(r.pages); off += 100; if (off >= (r.pagination || {}).total) break; }
  pages = pages.filter(p => !p.collectionId && !p.draft && !p.archived);
  if (!pages.length){   // no Pages scope on the token → read the live sitemap instead
    try { const sm = await (await fetch(base + '/sitemap.xml')).text();
      pages = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => ({publishedPath: new URL(m[1].trim()).pathname.replace(/\/$/, '') || '/index'})); } catch(e){ console.warn('  ! no sitemap at ' + base); }
    console.log(`  sitemap: ${pages.length} pages`); }
  if (!pages.length){   // no sitemap either → crawl internal links from the home page
    const seen = new Set(['/']), queue = ['/'];
    while (queue.length && seen.size < 300){
      const pth = queue.shift(); let html = ''; try { const r = await fetch(base + pth); if (r.ok) html = await r.text(); else console.warn(`  ! ${r.status} ${base + pth}`); } catch(e){ console.warn('  ! ' + e.message + ' ' + base + pth); }
      for (const m of html.matchAll(/href="([^"#?]+)/g)){ let h = m[1]; try { const u = new URL(h, base + pth); if (u.host !== new URL(base).host) continue; h = u.pathname.replace(/\/$/, '') || '/'; } catch(e){ continue; }
        if (/\.[a-z0-9]{2,5}$/i.test(h) || seen.has(h)) continue; seen.add(h); queue.push(h); } }
    pages = [...seen].map(h => ({publishedPath: h === '/' ? '/index' : h}));
    console.log(`  crawl: ${pages.length} pages`); }
  console.log(`\nStatic pages: ${pages.length}`);
  fs.mkdirSync(path.join(OUT, 'pages'), {recursive: true});
  fs.writeFileSync(path.join(OUT, 'pages', '_pages.json'), JSON.stringify(pages, null, 2));
  for (const p of pages){
    const pth = p.publishedPath || ('/' + (p.slug || '')), url = base + (pth === '/index' ? '/' : pth);
    let html; try { const r = await fetch(url); if (!r.ok){ console.warn(`  ! ${r.status} ${url}`); continue; } html = await r.text(); } catch(e){ console.warn('  ! ' + url); continue; }
    const dir = path.join(OUT, 'pages', safe(pth.replace(/^\//, '') || 'home')); fs.mkdirSync(dir, {recursive: true});
    fs.writeFileSync(path.join(dir, 'page.html'), html);
    // media in page order: <img src/srcset>, <source>, <video>, background-image, data-src (lottie)
    const found = [];
    for (const m of html.matchAll(/<img\b[^>]*>/gi)){ const tag = m[0]; const ss = /srcset="([^"]+)"/i.exec(tag);
      if (ss){ const best = ss[1].split(',').map(s => s.trim().split(/\s+/)).sort((a, b) => parseInt(b[1] || 0) - parseInt(a[1] || 0))[0]; found.push([m.index, best[0]]); }
      else { const s = /src="([^"]+)"/i.exec(tag); if (s) found.push([m.index, s[1]]); } }
    for (const m of html.matchAll(/<(?:source|video)\b[^>]*\bsrc="([^"]+)"/gi)) found.push([m.index, m[1]]);
    for (const m of html.matchAll(/data-video-urls="([^"]+)"/gi)) dec(m[1]).split(',').forEach(u => found.push([m.index, u.trim()]));
    for (const m of html.matchAll(/data-src="([^"]+)"/gi)) found.push([m.index, m[1]]);
    for (const m of html.matchAll(/url\((?:&quot;|["'])?([^"')&]+)(?:&quot;|["'])?\)/gi)) found.push([m.index, m[1]]);
    const seen = new Set(), files = [];
    for (const [, u0] of found.sort((a, b) => a[0] - b[0])){ const u = dec(u0); if (!/^https?:/.test(u) || !MEDIA.test(u) || seen.has(u)) continue; seen.add(u);
      const n = await dl(u, dir); if (n) files.push(n); }
    // text: title, meta description, headings + paragraphs in order
    const body = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<nav[\s\S]*?<\/nav>|<footer[\s\S]*?<\/footer>/gi, '');
    const text = [...body.matchAll(/<(h[1-6]|p|li|blockquote)\b[^>]*>([\s\S]*?)<\/\1>/gi)].map(m => (m[1][0] === 'h' ? '#'.repeat(+m[1][1]) + ' ' : m[1] === 'li' ? '- ' : '') + dec(m[2].replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '')).replace(/[ \t]+/g, ' ').trim()).filter(s => s.replace(/^[#-]+\s*/, ''));
    const title = (/<title>([\s\S]*?)<\/title>/i.exec(html) || [])[1] || p.title, desc = (/<meta[^>]+name="description"[^>]+content="([^"]*)"/i.exec(html) || [])[1] || '';
    fs.writeFileSync(path.join(dir, 'content.md'), `# ${dec(title)}\n\n${url}\n\n${dec(desc)}\n\n---\n\n${text.join('\n\n')}\n\n---\nfiles (page order):\n${files.map(f => '- ' + f).join('\n')}\n`);
    console.log(`  ${pth}  (${files.length} files)`);
  }

  // 3) the whole asset library (catches anything not on a live page)
  let assets = [], ao = 0; for (;;){ const r = await api(`/sites/${site.id}/assets?limit=100&offset=${ao}`); if (!r) break; assets = assets.concat(r.assets || []); ao += 100; if (ao >= ((r.pagination || {}).total || 0)) break; }
  console.log(`\nAsset library: ${assets.length}`);
  const adir = path.join(OUT, 'assets'); fs.mkdirSync(adir, {recursive: true});
  fs.writeFileSync(path.join(adir, '_assets.json'), JSON.stringify(assets, null, 2));
  let n = 0; for (const a of assets){ const u = a.hostedUrl || a.url; if (u && await dl(u, adir)) n++; if (n % 50 === 0 && n) console.log(`  ${n}…`); }
  console.log(`  ${n} downloaded`);
}
console.log(`\nDone → ./${OUT}`);
