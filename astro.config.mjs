// @ts-check
import { defineConfig } from 'astro/config';
import { storyblok } from '@storyblok/astro';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import { loadEnv } from 'vite';

const env = loadEnv(process.env.NODE_ENV ?? '', process.cwd(), 'STORYBLOK');

// One codebase, two deployments:
// - Production (STORYBLOK_IS_PREVIEW unset): static site, published content,
//   rebuilt by the Storyblok webhook on every Publish.
// - Preview (STORYBLOK_IS_PREVIEW=yes): server-rendered, draft content, live
//   updates inside Storyblok's Visual Editor while you type.
const isPreview = env.STORYBLOK_IS_PREVIEW === 'yes';

export default defineConfig({
  // The public address of the production site. Used for canonical URLs,
  // absolute social-share URLs and the sitemap.
  site: 'https://streetlight-portfolio.vercel.app',
  output: isPreview ? 'server' : 'static',
  adapter: isPreview ? vercel() : undefined,
  integrations: [
    storyblok({
      accessToken: env.STORYBLOK_DELIVERY_API_TOKEN,
      // Space "Streetlight-Portfolio" lives in the EU region.
      apiOptions: { region: 'eu' },
      bridge: isPreview,
      livePreview: isPreview,
      components: {},
    }),
    // Only meaningful on the static production build; the preview deployment
    // renders on demand and shouldn't be indexed anyway.
    sitemap({ filter: (page) => !page.includes('/storyblok-check') }),
  ],
});
