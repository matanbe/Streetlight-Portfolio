// The one place pages get content from. Today: local JSON (src/content). Later: Storyblok —
// swap these functions for Storyblok API calls returning the same shapes, and nothing else changes.
import { getCollection, getEntry } from 'astro:content';
import settings from '../content/settings.json';
import projectsRaw from '../content/projects.json';
import postsRaw from '../content/posts.json';
// the order the entries are written in (the collection API sorts by id)
const pIdx = new Map(projectsRaw.map((p: any, i: number) => [p.id, i])), postIdx = new Map(postsRaw.map((p: any, i: number) => [p.id, i]));

export const getSettings = () => settings;

export async function getProjects(){
  const all = (await getCollection('projects')).map(e => ({ id: e.id, ...e.data }));
  // newest first: a range counts by its end year, then by its start year
  const end = (y: string) => +(y.split('–').pop() || 0), start = (y: string) => +(y.split('–')[0] || 0);
  return all.sort((a, b) => end(b.year) - end(a.year) || start(b.year) - start(a.year) || pIdx.get(a.id)! - pIdx.get(b.id)!);
}
export const getHeroProjects = async () => (await getProjects()).filter(p => p.heroOrder).sort((a, b) => a.heroOrder! - b.heroOrder!);
export const getMoreProjects = async () => (await getProjects()).filter(p => p.moreOrder).sort((a, b) => a.moreOrder! - b.moreOrder!);

export async function getPosts(){
  // newest first, as written in the content
  return (await getCollection('posts')).map(e => ({ id: e.id, ...e.data })).sort((a, b) => postIdx.get(a.id)! - postIdx.get(b.id)!);
}
export async function getPost(id: string){ const e = await getEntry('posts', id); return e ? { id: e.id, ...e.data } : null; }

export async function getTestimonials(){
  return (await getCollection('testimonials')).map(e => ({ id: e.id, ...e.data })).sort((a, b) => a.order - b.order);
}
