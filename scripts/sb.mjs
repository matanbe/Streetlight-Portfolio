// Small Storyblok helper, run from the site folder (reads STORYBLOK_PAT from .env.local).
//   node scripts/sb.mjs hero <project-slug> <file>              upload the file and set it as the project's hero (cover) — published
//   node scripts/sb.mjs swap <project-slug> <old-name> <file>   replace an image in the case study (matched by part of its file name) — published
import fs from 'node:fs'; import path from 'node:path';
const env = Object.fromEntries(fs.readFileSync('.env.local', 'utf8').split('\n').filter(l => l.includes('=')).map(l => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]));
const PAT = env.STORYBLOK_PAT; if (!PAT) throw new Error('STORYBLOK_PAT missing in .env.local');
const S = 'https://mapi.storyblok.com/v1/spaces/295313965919026';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const api = async (m, p, body) => { for (let i = 0; i < 5; i++){
  const r = await fetch(S + p, { method: m, headers: { Authorization: PAT, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  if (r.status === 429){ await sleep(1500 * (i + 1)); continue; } if (!r.ok) throw new Error(`${m} ${p} → ${r.status} ${await r.text()}`); return r.status === 204 ? null : r.json(); } };
const dims = (f, b) => { if (b[0] === 0x89) return `${b.readUInt32BE(16)}x${b.readUInt32BE(20)}`;
  let i = 2; while (i < b.length){ const m = b[i + 1], L = b.readUInt16BE(i + 2); if (m >= 0xC0 && m <= 0xC2) return `${b.readUInt16BE(i + 7)}x${b.readUInt16BE(i + 5)}`; i += 2 + L; } return ''; };
async function folder(name){
  const fs_ = (await api('GET', '/asset_folders')).asset_folders, hit = fs_.find(f => f.name === name);
  return hit ? hit.id : (await api('POST', '/asset_folders', { asset_folder: { name } })).asset_folder.id; }
async function upload(file, folderName){
  const b = fs.readFileSync(file), name = path.basename(file);
  const r = await api('POST', '/assets', { filename: name, size: dims(name, b), asset_folder_id: await folder(folderName) });
  const fd = new FormData(); for (const [k, v] of Object.entries(r.fields)) fd.append(k, v);
  fd.append('file', new Blob([b], { type: r.fields['Content-Type'] }), name);
  const s3 = await fetch(r.post_url, { method: 'POST', body: fd }); if (!s3.ok && s3.status !== 204) throw new Error('upload → ' + s3.status);
  await api('GET', `/assets/${r.id}/finish_upload`).catch(() => {});
  return { fieldtype: 'asset', id: r.id, filename: 'https:' + r.pretty_url, alt: '', name: '', title: '' }; }
async function project(slug){ const st = (await api('GET', `/stories?with_slug=projects/${slug}`)).stories[0]; if (!st) throw new Error('no project ' + slug); return (await api('GET', `/stories/${st.id}`)).story; }

const [cmd, slug, file] = process.argv.slice(2);
if (cmd === 'hero'){
  const story = await project(slug), a = await upload(file, slug);
  story.content.hero = a; await api('PUT', `/stories/${story.id}`, { story: { content: story.content }, publish: 1 });
  console.log(`Done — ${slug}: hero set to ${a.filename} (published)`);
} else if (cmd === 'swap'){
  const [, , oldName, newFile] = process.argv.slice(2), story = await project(slug); let hit = 0, a = null;
  for (const ch of story.content.chapters || []) for (const sl of ch.slides || []) for (const fr of sl.frames || []) for (let k = 0; k < (fr.media || []).length; k++)
    if (fr.media[k].filename.toLowerCase().includes(oldName.toLowerCase())){ a = a || await upload(newFile, slug); fr.media[k] = a; if ((fr.media || []).length === 1) fr.fill = ''; hit++; }
  if (!hit) throw new Error('no image matching ' + oldName);
  await api('PUT', `/stories/${story.id}`, { story: { content: story.content }, publish: 1 });
  console.log(`Done — ${slug}: ${hit} image(s) matching "${oldName}" replaced (published)`);
} else console.log('usage: node scripts/sb.mjs hero <project-slug> <file>  |  swap <project-slug> <old-name> <file>');
