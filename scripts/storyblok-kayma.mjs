// One-off: uploads the Kayma Stories files from webflow-export/ to Storyblok (asset folder "kayma-stories")
// and writes the case study (image blocks) into the Kayma Stories project — saved as a DRAFT, not published.
// Run: node scripts/storyblok-kayma.mjs   (reads STORYBLOK_PAT from .env.local)
import fs from 'node:fs'; import path from 'node:path';
const env = Object.fromEntries(fs.readFileSync('.env.local', 'utf8').split('\n').filter(l => l.includes('=')).map(l => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]));
const PAT = env.STORYBLOK_PAT; if (!PAT) throw new Error('STORYBLOK_PAT missing in .env.local');
const S = 'https://mapi.storyblok.com/v1/spaces/295313965919026', DIR = 'webflow-export/projects/kayma-stories', AWS = 'https://streetlight.s3.eu-north-1.amazonaws.com/';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const api = async (m, p, body) => { for (let i = 0; i < 5; i++){
  const r = await fetch(S + p, { method: m, headers: { Authorization: PAT, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  if (r.status === 429){ await sleep(1500 * (i + 1)); continue; } if (!r.ok) throw new Error(`${m} ${p} → ${r.status} ${await r.text()}`); return r.status === 204 ? null : r.json(); } };

// image size from the file (png / jpg), lottie size from its json
const dims = (f, b) => { if (f.endsWith('.json')){ const j = JSON.parse(b); return `${j.w}x${j.h}`; }
  if (b[0] === 0x89) return `${b.readUInt32BE(16)}x${b.readUInt32BE(20)}`;
  let i = 2; while (i < b.length){ const m = b[i + 1], L = b.readUInt16BE(i + 2); if (m >= 0xC0 && m <= 0xC2) return `${b.readUInt16BE(i + 7)}x${b.readUInt16BE(i + 5)}`; i += 2 + L; } return ''; };

const folders = (await api('GET', '/asset_folders')).asset_folders;
let fid = (folders.find(f => f.name === 'kayma-stories') || {}).id;
if (!fid) fid = (await api('POST', '/asset_folders', { asset_folder: { name: 'kayma-stories' } })).asset_folder.id;
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
const LOT = '/lottie/kayma-stories/';
const F = (files = [], fill = '', urls = []) => ({ files: files.filter(f => !f.endsWith('.json')), fill, urls: [...files.filter(f => f.endsWith('.json')).map(f => LOT + f), ...urls] });
const CH = [
  { label: 'Concept', slides: [
    { t: 'Intriguing visuals', p: 'A lot of text, and a design that makes people want to read it.', b: 'duo', r: '16/9', f: [F([], '', [AWS + 'KS-homepage.mp4']), F([], '', [AWS + 'Kayma-scroll.mp4'])] },
    { t: 'Story cards', p: 'Each of the eight stories gets a card and a living illustration.', b: 'duo', r: '1/1', f: [
      F(['03-KS-Card-03.png', '04-KS-Card-02.png', '05-KS-Card-01.png', '06-KS-Card-04.png', '07-KS-Card-05.png'], '#2a1b3f'),
      F(['08-KS_farm.json', '09-KS_box.json', '10-KS_camera.json', '11-KS_school.json'], '#f8d3c0, #f0928e, #fcbaa7, #de6c68')] },
    { t: 'Data, animated', p: 'Research findings turned into small animated charts.', b: 'trio', r: '1/1', f: [
      F(['12-KS-title.json'], '#ffffff'), F(['13-graph04.json', '14-graph06.json', '15-graph07.json', '16-graph08.json'], '#f8d3c0, #fcbaa7, #f0928e, #453858'), F(['17-KS--Next.json'], '#ffffff')] },
  ]},
  { label: 'Illustration', slides: [
    { t: 'Distilling text into visuals', p: 'Each story distilled into a few key visual elements.', b: 'quad', r: '1/1', f: [
      F(['18-KS-03.png'], '#f8d3c0'), F(['19-KS-04.png'], '#fcbaa7'), F(['20-KS-05.png'], '#f0928e'), F(['21-KS-06.png'], '#de6c68')] },
    { t: 'One world, eight stories', p: '', b: 'duo', r: '1/1', f: [
      F(['23-KS-07.png'], '#5c4e71'), F(['22-KS-01.png', '24-KS-02.png', '25-KS-08.png'], '#fbe8c0, #fdf2e0, #453858')] },
    { t: 'Palette & type', p: '', b: 'trio', r: '1/1', f: [F(['26-ks_09.png'], '#ffffff'), F(['27-ks_10.png'], '#ffffff'), F(['28-ks_11.png'], '#ffffff')] },
  ]},
  { label: 'Execution', slides: [
    { t: 'Great execution', p: 'Concept, illustration, design, animation and development in one project. Awwwards Honors, CSSDA Special Kudos, CSS Winner Star.', b: 'full', r: '16/9', f: [F([], '', [AWS + 'KS_Illustration.mp4'])] },
  ]},
];

console.log('Uploading files…');
for (const ch of CH) for (const sl of ch.slides) for (const fr of sl.f) for (const f of fr.files) if (!up[f]) await upload(f);

const st = (await api('GET', '/stories?with_slug=projects/kayma-stories')).stories[0];
const story = (await api('GET', `/stories/${st.id}`)).story;
story.content.has_case = true;
story.content.about = story.content.about || 'Turning complex academic research into something people actually want to read: eight stories on how the science of economic behaviour changes everyday life.';
story.content.chapters = CH.map(ch => ({ component: 'chapter', label: ch.label, slides: ch.slides.map(sl => ({
  component: 'slide', title: sl.t, caption: sl.p, block: sl.b, ratio: sl.r,
  frames: sl.f.map(fr => ({ component: 'frame', fill: fr.fill, urls: fr.urls.join('\n'),
    media: fr.files.map(f => ({ fieldtype: 'asset', id: up[f].id, filename: up[f].filename, alt: '', name: '', title: '' })) })) })) }));
await api('PUT', `/stories/${st.id}`, { story: { content: story.content }, publish: 0 });
console.log('\nDone — Kayma Stories saved as a draft in Storyblok (not published).');
