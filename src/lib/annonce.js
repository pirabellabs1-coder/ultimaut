// État du bandeau d'annonce, lu AU MOMENT DU BUILD depuis Vercel Edge Config.
// Repli sur site.json si Edge Config est indisponible (build local, incident réseau…).
import site from '../data/site.json';

let cached;

export async function annonceActive() {
  if (cached !== undefined) return cached;

  const conn = process.env.EDGE_CONFIG;
  if (!conn) return (cached = !!(site.annonce && site.annonce.actif));

  try {
    const u = new URL(conn);
    u.pathname = u.pathname.replace(/\/$/, '') + '/item/annonce';
    const r = await fetch(u);
    if (r.status === 404) return (cached = false); // clé absente = pas de bandeau
    if (!r.ok) return (cached = !!(site.annonce && site.annonce.actif));
    return (cached = (await r.json()) === true);
  } catch {
    return (cached = !!(site.annonce && site.annonce.actif));
  }
}
