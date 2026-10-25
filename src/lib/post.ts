// post blocks → HTML: links (shown without https:// / www.), **marked** text, line breaks
const esc = (t: string) => t.replace(/[&<>]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;'} as Record<string, string>)[c]);
const link = (t: string) => t.replace(/https?:\/\/[^\s<]+/g, u => `<a href="${u}" target="_blank" rel="noopener" dir="ltr">${u.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')} ↗</a>`);
const mark = (t: string) => t.replace(/\*\*(.+?)\*\*/gs, '<mark>$1</mark>');
export function blocksToHtml(blocks: any[]){
  return blocks.map(b => b.h ? `<h2>${esc(b.h)}</h2>`
    : b.p ? `<p>${mark(link(esc(b.p))).replace(/\n/g, '<br>')}</p>`
    : b.links ? `<ul class="links">${b.links.map((u: string) => `<li>${link(esc(u))}</li>`).join('')}</ul>`
    : `<ol>${b.ol.map((t: string, k: number) => `<li><i>${String(k + 1).padStart(2, '0')}</i><span>${mark(link(esc(t)))}</span></li>`).join('')}</ol>`).join('');
}
