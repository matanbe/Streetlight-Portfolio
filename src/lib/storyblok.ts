// Storyblok (read-only, at build time). Token + version from env: STORYBLOK_TOKEN, STORYBLOK_VERSION (published | draft)
const TOKEN = import.meta.env.STORYBLOK_TOKEN || process.env.STORYBLOK_TOKEN;
const VERSION = import.meta.env.STORYBLOK_VERSION || process.env.STORYBLOK_VERSION || 'published';
export const hasStoryblok = !!TOKEN;
const cache = new Map<string, Promise<any>>();
async function get(path: string, q: Record<string, string> = {}){
  const qs = new URLSearchParams({ token: TOKEN!, version: VERSION, ...q }).toString();
  const key = path + '?' + qs;
  if (!cache.has(key)) cache.set(key, fetch(`https://api.storyblok.com/v2/cdn/${path}?${qs}`, { redirect: 'follow' }).then(r => { if (!r.ok) throw new Error(`Storyblok ${r.status} ${path}`); return r.json(); }));
  return cache.get(key)!;
}
export async function stories(folder: string){
  const out: any[] = []; for (let page = 1; ; page++){
    const d = await get('stories', { starts_with: folder + '/', per_page: '100', page: String(page), sort_by: 'position:asc' });
    out.push(...d.stories); if (d.stories.length < 100) break; }
  return out;
}
export const story = async (slug: string) => (await get('stories/' + slug)).story;

// rich text → HTML (bold = the red highlight, links open in a new tab and show without https:// / www.)
const esc = (t: string) => t.replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'} as Record<string, string>)[c]);
function inline(n: any): string {
  if (n.type === 'hard_break') return '<br>';
  if (n.type !== 'text') return (n.content || []).map(inline).join('');
  let s = esc(n.text || '');
  for (const m of n.marks || []){
    if (m.type === 'bold') s = `<mark>${s}</mark>`;
    else if (m.type === 'italic') s = `<em>${s}</em>`;
    else if (m.type === 'link'){ const href = m.attrs?.href || ''; const shown = s === esc(href) ? esc(href.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')) + ' ↗' : s;
      s = `<a href="${esc(href)}" target="_blank" rel="noopener" dir="ltr">${shown}</a>`; }
  }
  return s;
}
export function richtext(doc: any): string {
  return (doc?.content || []).map((b: any) => {
    const kids = (b.content || []).map(inline).join('');
    if (b.type === 'paragraph') return `<p>${kids}</p>`;
    if (b.type === 'heading') return `<h2>${kids}</h2>`;
    if (b.type === 'ordered_list') return `<ol>${(b.content || []).map((li: any, k: number) => `<li><i>${String(k + 1).padStart(2, '0')}</i><span>${(li.content || []).map((p: any) => (p.content || []).map(inline).join('')).join('<br>')}</span></li>`).join('')}</ol>`;
    if (b.type === 'bullet_list') return `<ul class="links">${(b.content || []).map((li: any) => `<li>${(li.content || []).map((p: any) => (p.content || []).map(inline).join('')).join('<br>')}</li>`).join('')}</ul>`;
    if (b.type === 'blockquote') return `<blockquote>${kids}</blockquote>`;
    return kids;
  }).join('');
}
export const plain = (doc: any): string => (doc?.content || []).map((b: any) => (b.content || []).map((n: any) => n.text || ' ').join('')).join(' ');
