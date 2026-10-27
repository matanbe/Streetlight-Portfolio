# Turns webflow-export/pages/* into webflow-export/projects/<name>/ : media renamed in page order + content.md (text and media interleaved).
import os, re, json, shutil, html as H
from html.parser import HTMLParser
from urllib.parse import unquote
from collections import Counter
ROOT = 'webflow-export'; PAGES = f'{ROOT}/_raw/pages'; OUT = f'{ROOT}/projects'
MEDIA = re.compile(r'\.(jpe?g|png|gif|webp|svg|avif|mp4|webm|mov|m4v|pdf|json|lottie)(\?|$)', re.I)
def safe(s): s = re.sub(r'[^\w.-]+', '-', s); s = s.strip('-')[:90]; return s or 'item'
def fname(u): return safe(unquote(u.split('?')[0].split('/')[-1]))
def clean(n): return re.sub(r'^[0-9a-f]{24}_', '', n)          # drop Webflow's id prefix
SKIP = {'script', 'style', 'noscript', 'svg', 'nav', 'footer', 'head'}
BLOCK = {'h1','h2','h3','h4','h5','h6','p','li','blockquote','div','a','span','figcaption','strong','em'}
VOID = {'img','br','meta','link','source','input','hr','wbr','area','base','col','embed','track','param'}
class Walk(HTMLParser):
    def __init__(s): super().__init__(convert_charrefs=True); s.out = []; s.skip = []; s.buf = ''; s.h = ''
    def flush(s):
        t = re.sub(r'\s+', ' ', s.buf).strip()
        if t: s.out.append(('t', t, s.h))
        s.buf = ''
    def handle_starttag(s, tag, a):
        a = dict(a)
        if s.skip:
            if tag == s.skip[-1]: s.skip.append(tag)
            return
        if tag in SKIP: s.skip.append(tag); return
        if tag in BLOCK or tag == 'br': s.flush()
        if re.fullmatch(r'h[1-6]', tag): s.h = tag
        urls = []
        if tag == 'img':
            ss = a.get('srcset')
            if ss: urls.append(sorted([x.strip().split() for x in ss.split(',')], key=lambda x: -int(re.sub(r'\D', '', x[1]) or 0) if len(x) > 1 else 0)[0][0])
            elif a.get('src'): urls.append(a['src'])
        if tag in ('source', 'video') and a.get('src'): urls.append(a['src'])
        if a.get('data-video-urls'): urls += [u.strip() for u in a['data-video-urls'].split(',')]
        if a.get('data-src'): urls.append(a['data-src'])
        for m in re.finditer(r'url\((?:&quot;|["\'])?([^"\')&]+)', a.get('style') or ''): urls.append(m.group(1))
        for u in urls:
            if u.startswith('http') and MEDIA.search(u): s.out.append(('m', fname(u)))
    def handle_startendtag(s, tag, a): s.handle_starttag(tag, a)
    def handle_endtag(s, tag):
        if s.skip:
            if tag == s.skip[-1]: s.skip.pop()
            return
        if tag in BLOCK: s.flush()
        if tag == s.h: s.flush(); s.h = ''
    def handle_data(s, d):
        if not s.skip: s.buf += d
pages = sorted(d for d in os.listdir(PAGES) if os.path.isdir(f'{PAGES}/{d}'))
walked = {}
for p in pages:
    w = Walk(); w.feed(open(f'{PAGES}/{p}/page.html', encoding='utf-8').read()); w.flush(); walked[p] = w.out
# boilerplate = text/media that shows up on 3+ pages (nav, footer, "Next project", logos)
tc = Counter(); mc = Counter()
for p, o in walked.items():
    tc.update({x[1] for x in o if x[0] == 't'}); mc.update({x[1] for x in o if x[0] == 'm'})
boiler_t = {t for t, n in tc.items() if n >= 3}; boiler_m = {m for m, n in mc.items() if n >= 3}
if os.path.isdir(OUT): shutil.rmtree(OUT)
summary = []
for p in pages:
    name = 'site-' + p if p in ('index', 'works', 'about') else ('archive' if p == 'archive' else p.replace('works-', ''))
    dest = f'{OUT}/{name}'; os.makedirs(dest)
    lines, order, seenm, seent = [], {}, set(), set()
    for x in walked[p]:
        if x[0] == 'm':
            m = x[1]
            if m in boiler_m or m in seenm or not os.path.exists(f'{PAGES}/{p}/{m}'): continue
            seenm.add(m); k = len(order) + 1; new = f'{k:02d}-{clean(m)}'; order[m] = new
            shutil.copy2(f'{PAGES}/{p}/{m}', f'{dest}/{new}')
            lines.append(f'![{new}]({new})')
        else:
            t, h = x[1], x[2]
            if t in boiler_t or t in seent or len(t) < 2: continue
            seent.add(t); lines.append(('#' * int(h[1]) + ' ' if h else '') + t)
    url = open(f'{PAGES}/{p}/content.md', encoding='utf-8').read().split('\n')[2]
    open(f'{dest}/content.md', 'w', encoding='utf-8').write(f'<!-- {url} -->\n\n' + '\n\n'.join(lines) + '\n')
    size = sum(os.path.getsize(f'{dest}/{f}') for f in os.listdir(dest))
    summary.append((name, len(order), round(size / 1e6, 1)))
# library files not used on any page
used = {m for o in walked.values() for x in o if x[0] == 'm' for m in [x[1]]}
un = f'{OUT}/_unused-library'; os.makedirs(un)
lib = [f for f in os.listdir(f'{ROOT}/_raw/assets') if not f.startswith('_')]
n = 0
for f in lib:
    if f not in used: shutil.copy2(f'{ROOT}/_raw/assets/{f}', f'{un}/{clean(f)}'); n += 1
for s in summary: print(f'{s[0]:28} {s[1]:3} files  {s[2]} MB')
print(f'_unused-library: {n} files')
