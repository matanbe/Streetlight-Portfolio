// @ts-check
import { defineConfig } from 'astro/config';
import { storyblok } from '@storyblok/astro';
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
  ],
});
