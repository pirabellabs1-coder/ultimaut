import { next } from '@vercel/edge';
import { get } from '@vercel/edge-config';
import { decide } from './geo-rules.js';
import { MAINT_PAGE, BLOCK_PAGE } from './server/pages.js';

// On exclut les assets (_astro, fichiers avec extension) et l'API.
export const config = {
  matcher: ['/((?!api/|_astro/|.*\\.).*)'],
};

// Accès privé propriétaire : ouvrir https://ultimauto.fr/?acces=acces-prive-ultimauto une fois
// -> cookie 1 an qui laisse entrer depuis n'importe quel pays ET pendant la maintenance.
const BYPASS = 'acces-prive-ultimauto';
// Page de pilotage du mode maintenance (bouton ON/OFF) — toujours accessible.
const ADMIN_PATH = '/pilote';

// Forçage temporaire du mode maintenance via le code (mot de passe /pilote oublié).
// Mettre à false puis redéployer pour revenir au pilotage normal via Edge Config.
const FORCE_MAINTENANCE = false;

// Lit le flag maintenance depuis Edge Config. Fail-safe : si non configuré / erreur -> false (site normal).
async function isMaintenance() {
  if (FORCE_MAINTENANCE) return true;
  if (!process.env.EDGE_CONFIG) return false;
  try {
    return (await get('maintenance')) === true;
  } catch {
    return false;
  }
}

export default async function middleware(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  const ua = request.headers.get('user-agent') || '';
  const country = request.headers.get('x-vercel-ip-country') || '';
  const cookie = request.headers.get('cookie') || '';

  // 1) Page de pilotage : toujours joignable (la bascule reste protégée par un secret côté API).
  if (path === ADMIN_PATH || path === ADMIN_PATH + '/') return next();

  // 2) Le propriétaire active son accès privé (cookie 1 an).
  if (url.searchParams.get('acces') === BYPASS) {
    return next({
      headers: { 'set-cookie': `ua_ok=${BYPASS}; Path=/; Max-Age=31536000; SameSite=Lax; Secure` },
    });
  }
  const owner = cookie.includes('ua_ok=' + BYPASS);

  // 3) Mode maintenance : tout le monde voit la page « bientôt de retour » (503), sauf le propriétaire.
  if (!owner && (await isMaintenance())) {
    return new Response(MAINT_PAGE, {
      status: 503,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'retry-after': '3600',
        'x-robots-tag': 'noindex',
        'cache-control': 'no-store',
      },
    });
  }

  // 4) Propriétaire : accès total (hors maintenance déjà géré ci-dessus).
  if (owner) return next();

  // 5) Géo-blocage (visiteurs humains de certains pays ; les robots passent toujours).
  if (decide(country, ua) === 'allow') return next();

  return new Response(BLOCK_PAGE, {
    status: 403,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'x-robots-tag': 'noindex, nofollow',
      'cache-control': 'no-store',
    },
  });
}
