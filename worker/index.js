// Worker Cloudflare d'ultimauto.fr — remplace le middleware et les fonctions Vercel.
// Ordre de traitement :
//   1) API : /api/contact, /api/maintenance
//   2) Redirections 301 (vercel.json) puis suppression du slash final (308).
//      Écart voulu avec Vercel (qui retire d'abord le slash) : « /ancienne-url/ » part en 301 en un seul saut,
//      et « /2024/ » redirige vers /blog au lieu de finir en 404.
//   3) Pages : /pilote toujours joignable -> accès privé propriétaire -> maintenance (503) -> géo-blocage (403)
//   4) Fichiers statiques de dist/ (binding ASSETS)
// Bindings : ASSETS (fichiers statiques), FLAGS (KV, clé "maintenance"),
//   CONTACT_LIMITER et MAINTENANCE_LIMITER (limites de débit par IP).
// Secrets : MAINTENANCE_SECRET, RESEND_API_KEY, CONTACT_FROM, CONTACT_TO.
import { decide } from '../geo-rules.js';
import { MAINT_PAGE, BLOCK_PAGE } from '../server/pages.js';
import { handleContact } from '../server/contact.js';
import { findRedirect } from './redirects.js';

// Accès privé propriétaire : ouvrir https://ultimauto.fr/?acces=acces-prive-ultimauto une fois
// -> cookie 1 an qui laisse entrer depuis n'importe quel pays ET pendant la maintenance.
const BYPASS = 'acces-prive-ultimauto';
// Page de pilotage du mode maintenance (bouton ON/OFF) — toujours accessible.
const ADMIN_PATH = '/pilote';
// Forçage du mode maintenance via le code (secours si la clé /pilote est perdue) : true puis redéployer.
const FORCE_MAINTENANCE = false;
// Durée de cache du flag maintenance en périphérie (secondes) : délai max d'application d'une bascule.
const FLAG_CACHE_TTL = 60;

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
};

function withSecurity(response, extra) {
  const r = new Response(response.body, response);
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) r.headers.set(k, v);
  if (extra) for (const [k, v] of Object.entries(extra)) r.headers.append(k, v);
  return r;
}

function json(status, body, headers) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
  });
}

function html(status, body, headers) {
  return new Response(body, {
    status,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', ...headers },
  });
}

// Comparaison à temps constant (évite de deviner le secret par mesure du temps de réponse).
function sameSecret(a, b) {
  const enc = new TextEncoder();
  const x = enc.encode(String(a));
  const y = enc.encode(String(b));
  if (x.byteLength !== y.byteLength) return false;
  if (crypto.subtle && typeof crypto.subtle.timingSafeEqual === 'function') {
    return crypto.subtle.timingSafeEqual(x, y);
  }
  let diff = 0;
  for (let i = 0; i < x.byteLength; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

// Fail-safe : KV absent ou en erreur -> maintenance OFF (le site reste en ligne).
async function isMaintenance(env) {
  if (FORCE_MAINTENANCE) return true;
  if (!env.FLAGS) return false;
  try {
    return (await env.FLAGS.get('maintenance', { cacheTtl: FLAG_CACHE_TTL })) === 'true';
  } catch {
    return false;
  }
}

// Corps JSON décodé ; {} si vide (comme Vercel) ; null si le JSON est invalide.
// Limite de débit par IP (binding Workers Rate Limiting). Absent ou en erreur -> pas de blocage.
async function tooManyRequests(limiter, request) {
  if (!limiter) return false;
  try {
    const { success } = await limiter.limit({ key: request.headers.get('cf-connecting-ip') || 'inconnu' });
    return !success;
  } catch {
    return false;
  }
}

const RATE_LIMITED = () => json(429, { error: 'trop_de_requetes' }, { 'retry-after': '60' });

async function readJson(request) {
  try {
    const text = await request.text();
    if (!text.trim()) return {};
    const b = JSON.parse(text);
    return b && typeof b === 'object' ? b : {};
  } catch {
    return null;
  }
}

// GET  /api/maintenance  (en-tête X-Cle: SECRET) -> { on: boolean }   [?cle= accepté pour compatibilité]
// POST /api/maintenance  { cle:SECRET, on:bool } -> { on: boolean }
async function maintenanceApi(request, env, url) {
  if (request.method !== 'GET' && request.method !== 'POST') {
    return json(405, { error: 'method_not_allowed' }, { Allow: 'GET, POST' });
  }
  if (await tooManyRequests(env.MAINTENANCE_LIMITER, request)) return RATE_LIMITED();
  if (!env.MAINTENANCE_SECRET || !env.FLAGS) return json(500, { error: 'config_manquante' });

  let body = {};
  if (request.method === 'POST') {
    body = await readJson(request);
    if (!body) return json(400, { error: 'json_invalide' });
  }
  const cle = String(
    (request.method === 'POST' ? body.cle : request.headers.get('x-cle') || url.searchParams.get('cle')) || '',
  );
  if (!cle || !sameSecret(cle, env.MAINTENANCE_SECRET)) return json(401, { error: 'non_autorise' });

  try {
    if (request.method === 'GET') {
      return json(200, { on: (await env.FLAGS.get('maintenance')) === 'true' });
    }
    const on = body.on === true || body.on === 'true';
    await env.FLAGS.put('maintenance', on ? 'true' : 'false');
    return json(200, { on });
  } catch (e) {
    return json(502, { error: 'kv', detail: String((e && e.message) || e).slice(0, 200) });
  }
}

async function contactApi(request, env) {
  if (request.method !== 'POST') return json(405, { error: 'method_not_allowed' }, { Allow: 'POST' });
  if (await tooManyRequests(env.CONTACT_LIMITER, request)) return RATE_LIMITED();
  const body = await readJson(request);
  if (!body) return json(500, { error: 'erreur_serveur' }); // JSON invalide : même réponse que la version Vercel
  const r = await handleContact(body, env);
  return json(r.status, r.body);
}

// Pages soumises à la logique d'accès (même périmètre que le matcher du middleware Vercel) :
// tout sauf /api/, /_astro/ et les chemins contenant un point (fichiers).
const isPagePath = (p) => !p.startsWith('/api/') && !p.startsWith('/_astro/') && !p.includes('.');

const router = {
  async route(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // 1) API
    if (path === '/api/contact') return withSecurity(await contactApi(request, env));
    if (path === '/api/maintenance') return withSecurity(await maintenanceApi(request, env, url));

    // 2) Redirections permanentes (la requête conserve sa query string, comme sur Vercel)
    const dest = findRedirect(path);
    if (dest) return withSecurity(Response.redirect(new URL(dest + url.search, url).toString(), 301));
    if (path.length > 1 && path.endsWith('/')) {
      url.pathname = path.replace(/\/+$/, '') || '/';
      return withSecurity(Response.redirect(url.toString(), 308));
    }

    if (!isPagePath(path)) return withSecurity(await env.ASSETS.fetch(request));

    // 3a) Page de pilotage : toujours joignable (la bascule reste protégée par le secret côté API).
    if (path === ADMIN_PATH) return withSecurity(await env.ASSETS.fetch(request));

    // 3b) Le propriétaire active son accès privé (cookie 1 an).
    if (url.searchParams.get('acces') === BYPASS) {
      return withSecurity(await env.ASSETS.fetch(request), {
        'set-cookie': `ua_ok=${BYPASS}; Path=/; Max-Age=31536000; SameSite=Lax; Secure`,
      });
    }
    const owner = (request.headers.get('cookie') || '').includes('ua_ok=' + BYPASS);

    // 3c) Maintenance : page « bientôt de retour » (503) pour tous sauf le propriétaire.
    if (!owner && (await isMaintenance(env))) {
      return withSecurity(html(503, MAINT_PAGE, { 'retry-after': '3600', 'x-robots-tag': 'noindex' }));
    }

    // 3d) Géo-blocage des visiteurs humains de certains pays (les robots passent toujours).
    if (!owner) {
      const country = (request.cf && request.cf.country) || '';
      if (decide(country, request.headers.get('user-agent') || '') !== 'allow') {
        return withSecurity(html(403, BLOCK_PAGE, { 'x-robots-tag': 'noindex, nofollow' }));
      }
    }

    // 4) Fichier statique
    return withSecurity(await env.ASSETS.fetch(request));
  },
};

export default {
  async fetch(request, env) {
    // www.ultimauto.fr -> ultimauto.fr (domaine canonique, sans www), chemin et query conservés.
    const host = new URL(request.url).hostname;
    if (host.startsWith('www.')) {
      const to = new URL(request.url);
      to.hostname = host.slice(4);
      return withSecurity(Response.redirect(to.toString(), 301));
    }
    const response = await router.route(request, env);
    // Adresse de test *.workers.dev : jamais indexée (évite le contenu dupliqué avec ultimauto.fr).
    if (new URL(request.url).hostname.endsWith('.workers.dev')) {
      response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    }
    return response;
  },
};
