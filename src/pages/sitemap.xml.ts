// sitemap for search engines: the pages, every post, every case study
import { getProjects, getPosts } from '../lib/cms';
export async function GET({ site }: { site: URL }){
  const urls = ['/', '/work', '/thoughts', '/playground',
    ...(await getPosts()).map(p => `/thoughts/${p.id}`),
    ...(await getProjects()).filter(p => p.hasCase).map(p => `/work/${p.id}`)];
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url><loc>${new URL(u, site)}</loc></url>`).join('\n')}\n</urlset>\n`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml' } });
}
