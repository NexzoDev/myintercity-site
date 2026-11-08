// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // Canonical site URL (used for canonical links / sitemaps)
  site: 'https://www.myintercity.com',

  // Fully static output — no server runtime, maximum performance.
  output: 'static',

  build: {
    // Inline small stylesheets to avoid extra blocking requests.
    inlineStylesheets: 'auto',
  },
});
