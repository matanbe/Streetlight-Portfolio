// Content lives in src/content/*.json for now — shaped like the Storyblok content types it will move to
// (see src/lib/cms.ts: the pages only talk to that file, so switching the source is one change there).
import { defineCollection } from 'astro:content';
import { file } from 'astro/loaders';
import { z } from 'astro/zod';

// image blocks: b = full | duo | trio | quad, r = 16/9 | 1/1 | 1/2, f = frames, each [{ src, bg?, alt? }] (several = cube carousel)
const frame = z.object({ items: z.array(z.object({ src: z.string(), bg: z.string().optional(), alt: z.string().optional() })) });
const slide = z.object({ t: z.string(), p: z.string().optional(), cont: z.boolean().optional(), b: z.enum(['full', 'duo', 'trio', 'quad']).optional(), r: z.string().optional(), f: z.array(frame).optional() });

const projects = defineCollection({
  loader: file('src/content/projects.json'),
  schema: z.object({
    name: z.string(),
    industry: z.string(),
    year: z.string(),
    disciplines: z.array(z.string()),
    lines: z.array(z.string()).default([]),
    services: z.array(z.string()).default([]),
    live: z.string().nullable().optional(),
    hasCase: z.boolean().default(false),
    heroOrder: z.number().nullable().optional(),   // 1… = a card in the home page's main scroll
    moreOrder: z.number().nullable().optional(),   // 1… = a row in "More work" on the home page
    about: z.string().nullable().optional(),
    outcome: z.object({ k: z.string(), v: z.string(), u: z.string().optional() }).nullable().optional(),
    chapters: z.array(z.object({ key: z.string(), label: z.string(), slides: z.array(slide) })).default([]),
  }),
});

const block = z.union([
  z.object({ p: z.string() }),
  z.object({ h: z.string() }),
  z.object({ ol: z.array(z.string()) }),
  z.object({ links: z.array(z.string()) }),
]);
const posts = defineCollection({
  loader: file('src/content/posts.json'),
  schema: z.object({
    title: z.string(), topic: z.string(), date: z.string(), year: z.string().optional(), read: z.number(),
    blocks: z.array(block),
  }),
});

const testimonials = defineCollection({
  loader: file('src/content/testimonials.json'),
  schema: z.object({ order: z.number(), ini: z.string(), name: z.string(), role: z.string(), proj: z.string(), photo: z.string().optional(), short: z.string(), full: z.string() }),
});

export const collections = { projects, posts, testimonials };
