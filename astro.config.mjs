// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // URL de prod EXACTE — sert au sitemap, aux canonical et au JSON-LD.
  site: 'https://ultimauto.fr',
  integrations: [
    sitemap({
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
      filter: (page) => !page.includes('/pilote'),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
