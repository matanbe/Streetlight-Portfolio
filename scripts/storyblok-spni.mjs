// One-off: uploads the SPNI files from webflow-export/ to Storyblok (asset folder "spni") and writes the case study into the SPNI project — published.
// Run: node scripts/storyblok-spni.mjs   (reads STORYBLOK_PAT from .env.local)
import fs from 'node:fs'; import path from 'node:path';
const env = Object.fromEntries(fs.readFileSync('.env.local', 'utf8').split('\n').filter(l => l.includes('=')).map(l => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]));
const PAT = env.STORYBLOK_PAT; if (!PAT) throw new Error('STORYBLOK_PAT missing in .env.local');
const S = 'https://mapi.storyblok.com/v1/spaces/295313965919026', DIR = 'webflow-export/projects/spni', AWS = 'https://d375a3v81h8eln.cloudfront.net/';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const api = async (m, p, body) => { for (let i = 0; i < 5; i++){
  const r = await fetch(S + p, { method: m, headers: { Authorization: PAT, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  if (r.status === 429){ await sleep(1500 * (i + 1)); continue; } if (!r.ok) throw new Error(`${m} ${p} → ${r.status} ${await r.text()}`); return r.status === 204 ? null : r.json(); } };

// image size from the file (png / jpg), lottie size from its json
const dims = (f, b) => { if (f.endsWith('.json')){ const j = JSON.parse(b); return `${j.w}x${j.h}`; }
  if (b[0] === 0x89) return `${b.readUInt32BE(16)}x${b.readUInt32BE(20)}`;
  let i = 2; while (i < b.length){ const m = b[i + 1], L = b.readUInt16BE(i + 2); if (m >= 0xC0 && m <= 0xC2) return `${b.readUInt16BE(i + 7)}x${b.readUInt16BE(i + 5)}`; i += 2 + L; } return ''; };

const folders = (await api('GET', '/asset_folders')).asset_folders;
let fid = (folders.find(f => f.name === 'spni') || {}).id;
if (!fid) fid = (await api('POST', '/asset_folders', { asset_folder: { name: 'spni' } })).asset_folder.id;
const have = (await api('GET', `/assets?in_folder=${fid}&per_page=100`)).assets;
const up = {};
async function upload(f){
  const name = f.toLowerCase(), hit = have.find(a => a.filename.endsWith('/' + name));
  if (hit) return up[f] = { filename: hit.filename.replace(/^https?:/, 'https:'), id: hit.id };
  const b = fs.readFileSync(path.join(DIR, f));
  const r = await api('POST', '/assets', { filename: f, size: dims(f, b), asset_folder_id: fid });
  const fd = new FormData(); for (const [k, v] of Object.entries(r.fields)) fd.append(k, v);
  fd.append('file', new Blob([b], { type: r.fields['Content-Type'] }), f);
  const s3 = await fetch(r.post_url, { method: 'POST', body: fd }); if (!s3.ok && s3.status !== 204) throw new Error('upload ' + f + ' → ' + s3.status);
  await api('GET', `/assets/${r.id}/finish_upload`).catch(() => {});
  console.log('  ↑ ' + f);
  return up[f] = { filename: 'https:' + r.pretty_url, id: r.id };
}

// ---- the case: blocks of frames (files → Storyblok, videos stay on AWS) ----
// Lottie .json can't go to Storyblok (needs a verified space): those live in public/lottie/kayma-stories and go in as URLs
const LOT = '/lottie/spni/';
const F = (files = [], fill = '', urls = []) => ({ files: files.filter(f => !f.endsWith('.json')), fill, urls: [...files.filter(f => f.endsWith('.json')).map(f => LOT + f), ...urls] });
const CH = [
  { label: 'Impact', slides: [
    { t: 'Highlighting SPNI\'s environmental impact', p: 'Dozens of initiatives defending nature across the country at any given time, brought to the front of the site.', b: 'full', r: '16/9', f: [F([], '', [AWS + 'SPNI+-+main.mp4'])] },
    { t: 'The fights', p: 'Every campaign gets its own story: where it stands, what is at stake, how to help.', b: 'full', r: '16/9', f: [F([], '', [AWS + 'SPNI+-+big+fight.mp4'])] },
    { t: 'Across the map', p: '', cont: true, b: 'duo', r: '16/9', f: [
      F(['03-SPNI-map-1.json', '04-SPNI-map-2.json', '05-SPNI-map-3.json', '06-SPNI-map-4.json', '07-SPNI-map-5.json']),
      F(['08-SPNI-04.png', '09-SPNI-01.png', '10-SPNI-03.png', '11-SPNI-05.png', '12-SPNI-06.png'])] },
    { t: 'The fights', p: '', cont: true, b: 'full', r: '16/9', f: [F([], '', [AWS + 'SPNI+-+small+fight.mp4'])] },
  ]},
  { label: 'Trips & hostels', slides: [
    { t: 'Designing for impact and revenue', p: 'Hundreds of field trips and a network of hostels are SPNI\'s main income: the site helps visitors find, understand and book them quickly.', b: 'full', r: '16/9', f: [F([], '', [AWS + 'SPNI+-+trip.mp4'])] },
    { t: 'Designing for impact and revenue', p: '', cont: true, b: 'duo', r: '16/9', f: [F(['15-SPNI-11.jpg']), F(['16-SPNI-12.jpg'])] },
  ]},
  { label: 'One platform', slides: [
    { t: 'Unifying a massive digital presence', p: 'Hundreds of pages and several mini-sites mapped and brought onto one platform: easier, cheaper and faster, with better SEO and clearer funnels for new members.', b: 'trio', r: '1/1', f: [
      F(['17-SPNI-07.jpg'], '#ffffff'), F(['18-SPNI-10.jpg']), F(['19-SPNI-09.jpg', '20-SPNI-08.jpg'])] },
  ]},
];

console.log('Uploading files…');
for (const ch of CH) for (const sl of ch.slides) for (const fr of sl.f) for (const f of fr.files) if (!up[f]) await upload(f);

const st = (await api('GET', '/stories?with_slug=projects/spni')).stories[0];
const story = (await api('GET', `/stories/${st.id}`)).story;
story.content.has_case = true;
story.content.chapters = CH.map(ch => ({ component: 'chapter', label: ch.label, slides: ch.slides.map(sl => ({
  component: 'slide', title: sl.t, caption: sl.p, continued: !!sl.cont, block: sl.b, ratio: sl.r,
  frames: sl.f.map(fr => ({ component: 'frame', fill: fr.fill, urls: fr.urls.join('\n'),
    media: fr.files.map(f => ({ fieldtype: 'asset', id: up[f].id, filename: up[f].filename, alt: '', name: '', title: '' })) })) })) }));
await api('PUT', `/stories/${st.id}`, { story: { content: story.content }, publish: 1 });
console.log('\nDone — SPNI case study published.');
