# Streetlight — studiostreetlight.com

Astro site, content shaped for Storyblok (local JSON for now), hosted on Vercel.

```bash
npm install
npm run dev      # http://localhost:4321
npm run build
```

## Where things are
- `src/content/*.json` — projects, posts, testimonials, settings. Each file matches a future Storyblok content type.
- `src/lib/cms.ts` — the only place pages read content from. Switching to Storyblok = changing this file.
- `src/layouts/Base.astro` — head, header (+ mobile menu), contact form, footer.
- `src/styles/global.css` — tokens (day + dusk), header, footer, buttons, chips, tables.
- `src/scripts/site.js` — day/dusk switch, wordmark, wipes, table rows, mobile menu. `contact.js` — the tear-off contact form.
- `public/fonts` — Simpler Pro Mono.

## Status
- [x] Base layout, header + mobile menu, footer, contact form, dusk mode
- [x] /work, /thoughts, /thoughts/[id]
- [ ] Home (cubes, lamp + light, rolodex, About, More work)
- [ ] /work/[id] project pages
- [ ] /playground
- [ ] Storyblok, contact form backend, SEO / OG images, analytics
