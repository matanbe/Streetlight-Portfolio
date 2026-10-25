// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://studiostreetlight.com',
  trailingSlash: 'never',
  build: { format: 'file' },
  devToolbar: { enabled: false },   // the dev overlay costs frames on the heavy pages
});
