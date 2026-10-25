// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://streetlight-portfolio.vercel.app',   // → https://studiostreetlight.com once the domain is connected (also public/robots.txt)
  trailingSlash: 'never',
  build: { format: 'file' },
  devToolbar: { enabled: false },   // the dev overlay costs frames on the heavy pages
});
