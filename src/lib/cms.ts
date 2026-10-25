// The one place pages get content from: Storyblok when STORYBLOK_TOKEN is set (local .env / Vercel env), else the local JSON in src/content.
import { getCollection } from 'astro:content';
import settingsLocal from '../content/settings.json';
import projectsRaw from '../content/projects.json';
import postsRaw from '../content/posts.json';
import { blocksToHtml } from './post';
import { hasStoryblok, stories, story, richtext, plain } from './storyblok';

const pIdx = new Map(projectsRaw.map((p: any, i: number) => [p.id, i])), postIdx = new Map(postsRaw.map((p: any, i: number) => [p.id, i]));
const num = (v: any) => (v === '' || v == null || isNaN(+v)) ? null : +v;
const md = (s: string) => (s || '').replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
const asset = (a: any) => a?.filename ? { url: a.filename as string, alt: (a.alt || '') as string, video: /\.(mp4|webm|mov)$/i.test(a.filename) } : null;

export type Project = { id: string; name: string; industry: string; year: string; disciplines: string[]; lines: string[]; services: string[]; live: string | null;
  hasCase: boolean; heroOrder: number | null; moreOrder: number | null; about: string | null; outcome: { k: string; v: string } | null;
  chapters: { key: string; label: string; slides: { t: string; p?: string; cont?: boolean; img?: any }[] }[]; hero: any; seo?: { title?: string; description?: string; image?: string } };

export async function getSettings(){
  if (!hasStoryblok) return settingsLocal;
  const c = (await story('settings')).content;
  return { email: c.email, tagline: c.tagline, clients: (c.clients || '').split('\n').map((s: string) => s.trim()).filter(Boolean),
    socials: (c.socials || []).map((s: any) => ({ label: s.label, url: s.url })), reel: c.reel, description: c.default_description, ogImage: c.default_og_image?.filename };
}

const byYear = (a: Project, b: Project) => { const end = (y: string) => +(String(y).split(/[–-]/).pop() || 0), start = (y: string) => +(String(y).split(/[–-]/)[0] || 0);
  return end(b.year) - end(a.year) || start(b.year) - start(a.year); };

export async function getProjects(): Promise<Project[]>{
  if (!hasStoryblok){
    const all = (await getCollection('projects')).map(e => ({ id: e.id, ...e.data, hero: null })) as any[];
    return all.sort((a, b) => byYear(a, b) || pIdx.get(a.id)! - pIdx.get(b.id)!);
  }
  const list = await stories('projects');
  return list.map((s: any, i: number) => { const c = s.content;
    return { id: s.slug, name: c.name, industry: c.industry || '', year: c.year || '', disciplines: c.disciplines || [],
      lines: (c.lines || '').split('\n').map((x: string) => x.trim()).filter(Boolean), services: (c.services || '').split(',').map((x: string) => x.trim()).filter(Boolean),
      live: c.live || null, hasCase: !!c.has_case, heroOrder: num(c.hero_order), moreOrder: num(c.more_order), about: c.about || null,
      outcome: c.outcome_title ? { k: c.outcome_title, v: c.outcome_text || '' } : null,
      chapters: (c.chapters || []).map((ch: any, k: number) => ({ key: 'c' + k, label: ch.label || '', slides: (ch.slides || []).map((sl: any) => ({ t: sl.title || '', p: sl.caption || '', cont: !!sl.continued, img: asset(sl.image) })) })),
      hero: asset(c.hero), seo: { title: c.seo_title, description: c.seo_description, image: c.og_image?.filename }, _i: i } as any;
  }).sort((a: any, b: any) => byYear(a, b) || a._i - b._i);
}

export type Post = { id: string; title: string; topic: string; date: string; read: number; html: string; description: string };
export async function getPosts(): Promise<Post[]>{
  if (!hasStoryblok){
    return (await getCollection('posts')).map(e => { const d: any = e.data; const first = d.blocks.find((b: any) => b.p);
      return { id: e.id, title: d.title, topic: d.topic, date: d.date, read: d.read, html: blocksToHtml(d.blocks), description: first ? first.p.replace(/\*\*/g, '').slice(0, 155) : d.title }; })
      .sort((a, b) => postIdx.get(a.id)! - postIdx.get(b.id)!);
  }
  return (await stories('posts')).map((s: any) => { const c = s.content;
    return { id: s.slug, title: c.title, topic: c.topic || '', date: c.date || '', read: +c.read || 1, html: richtext(c.body), description: c.seo_description || plain(c.body).slice(0, 155) }; });
}

export async function getTestimonials(){
  if (!hasStoryblok) return (await getCollection('testimonials')).map(e => ({ id: e.id, ...e.data })).sort((a: any, b: any) => a.order - b.order);
  return (await stories('testimonials')).map((s: any) => { const c = s.content;
    return { id: s.slug, order: +c.order || 0, ini: c.initials || '', name: c.name, role: c.role || '', proj: c.project || '', short: md(c.short), full: md(c.full) }; })
    .sort((a: any, b: any) => a.order - b.order);
}
