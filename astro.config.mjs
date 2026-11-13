// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // URL de prod EXACTE — sert au sitemap, aux canonical et au JSON-LD.
  site: 'https://ultimauto.fr',
  // URLs sans slash final (cohérent avec les liens internes + Vercel) — évite les doublons canoniques.
  trailingSlash: 'never',
  // Astro 7 compresse par défaut avec les règles JSX ('jsx'), qui suppriment les espaces
  // contenant un retour à la ligne entre éléments (mots collés à l'affichage).
  // `true` garde la compression sans perte d'Astro 6.
  compressHTML: true,
  integrations: [
    sitemap({
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
      filter: (page) => !page.includes('/pilote'),
      serialize: (item) => {
        const u = item.url.replace(/\/+$/, '');
        return { ...item, url: u === 'https://ultimauto.fr' ? u + '/' : u };
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
