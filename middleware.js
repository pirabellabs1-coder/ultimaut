import { next } from '@vercel/edge';
import { get } from '@vercel/edge-config';
import { decide } from './geo-rules.js';

// On exclut les assets (_astro, fichiers avec extension) et l'API.
export const config = {
  matcher: ['/((?!api/|_astro/|.*\\.).*)'],
};

// Accès privé propriétaire : ouvrir https://ultimauto.fr/?acces=acces-prive-ultimauto une fois
// -> cookie 1 an qui laisse entrer depuis n'importe quel pays ET pendant la maintenance.
const BYPASS = 'acces-prive-ultimauto';
// Page de pilotage du mode maintenance (bouton ON/OFF) — toujours accessible.
const ADMIN_PATH = '/pilote';

// Lit le flag maintenance depuis Edge Config. Fail-safe : si non configuré / erreur -> false (site normal).
async function isMaintenance() {
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

const SVC_ICON = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#1565C0" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 11 3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>';

// Page affichée pendant une maintenance volontaire (503).
const MAINT_PAGE = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>Ultimauto — Site en maintenance</title>
<style>
  *{box-sizing:border-box}
  body{margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;background:#eef2f7}
  .wrap{min-height:100vh;display:grid;place-items:center;padding:22px}
  .card{background:#fff;max-width:560px;width:100%;border-radius:26px;overflow:hidden;box-shadow:0 30px 70px rgba(15,76,146,.22);text-align:center}
  .head{background:linear-gradient(160deg,#0f4c92 0%,#1565C0 100%);color:#fff;padding:40px 32px 34px}
  .logo{font-weight:800;font-size:28px;letter-spacing:-.5px}
  .logo b{color:#9bdb4d}
  .gear{margin:18px auto 4px;width:56px;height:56px;display:block}
  h1{font-size:24px;margin:14px 0 8px;line-height:1.3}
  .head p{margin:0;color:rgba(255,255,255,.92);font-size:15px;line-height:1.6}
  .body{padding:28px 30px 32px}
  .body p{color:#475569;margin:0 0 20px;font-size:15.5px;line-height:1.6}
  .btns{display:flex;flex-wrap:wrap;gap:10px;justify-content:center}
  a.btn{display:inline-flex;align-items:center;gap:8px;padding:13px 22px;border-radius:999px;font-weight:700;text-decoration:none;font-size:15px}
  .tel{background:#1565C0;color:#fff}
  .wa{background:#0a7d3c;color:#fff}
  .mail{background:#eef2f7;color:#0f172a}
  .foot{margin-top:24px;font-size:12.5px;color:#94a3b8}
</style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <div class="head">
        <div class="logo">ultim<b>auto</b></div>
        <svg class="gear" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>
        <h1>Site en maintenance</h1>
        <p>Nous effectuons une petite mise à jour. Le site sera de retour très vite.</p>
      </div>
      <div class="body">
        <p>Besoin d'un renseignement ou d'un rendez-vous&nbsp;? Contactez-nous directement, l'atelier reste ouvert&nbsp;:</p>
        <div class="btns">
          <a class="btn tel" href="tel:+33652193605">📞 06 52 19 36 05</a>
          <a class="btn wa" href="https://wa.me/33652193605" target="_blank" rel="noopener">WhatsApp</a>
          <a class="btn mail" href="mailto:contact@ultimauto.fr">contact@ultimauto.fr</a>
        </div>
        <div class="foot">Ultimauto — Multiservices Automobile · 1 Imp. de la Haie, 49300 Cholet</div>
      </div>
    </div>
  </div>
</body>
</html>`;

const BLOCK_PAGE = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Ultimauto — Accès non disponible</title>
<style>
  *{box-sizing:border-box}
  body{margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;background:#eef2f7}
  .wrap{min-height:100vh;display:grid;place-items:center;padding:22px}
  .card{background:#fff;max-width:720px;width:100%;border-radius:26px;overflow:hidden;box-shadow:0 30px 70px rgba(15,76,146,.22)}
  .head{background:linear-gradient(160deg,#0f4c92 0%,#1565C0 100%);color:#fff;padding:36px 32px 30px;text-align:center}
  .logo{font-weight:800;font-size:27px;letter-spacing:-.5px}
  .logo b{color:#9bdb4d}
  .badge{display:inline-flex;align-items:center;gap:8px;margin-top:18px;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.28);padding:7px 15px;border-radius:999px;font-size:13px;font-weight:600}
  h1{font-size:23px;margin:16px 0 8px;line-height:1.3}
  .head p{margin:0;color:rgba(255,255,255,.92);font-size:15px;line-height:1.6}
  .body{padding:28px 30px 30px}
  .lbl{font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#1565C0;text-align:center;margin:0 0 16px}
  .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(195px,1fr));gap:10px}
  .svc{display:flex;align-items:center;gap:11px;padding:13px 14px;border:1px solid #e6edf5;border-radius:14px;background:#f8fafc;font-weight:600;font-size:14.5px;line-height:1.25}
  .contact{margin-top:26px;text-align:center;border-top:1px solid #eef2f7;padding-top:24px}
  .contact p{color:#475569;margin:0 0 15px;font-size:15px}
  .btns{display:flex;flex-wrap:wrap;gap:10px;justify-content:center}
  a.btn{display:inline-flex;align-items:center;gap:8px;padding:13px 20px;border-radius:999px;font-weight:700;text-decoration:none;font-size:15px}
  .tel{background:#1565C0;color:#fff}
  .wa{background:#0a7d3c;color:#fff}
  .mail{background:#eef2f7;color:#0f172a}
  .foot{margin-top:22px;text-align:center;font-size:12.5px;color:#94a3b8}
</style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <div class="head">
        <div class="logo">ultim<b>auto</b></div>
        <div class="badge">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z"/></svg>
          Centre automobile basé en France
        </div>
        <h1>Ce site n'est pas accessible depuis votre pays</h1>
        <p>Ultimauto, centre multiservices automobile à Cholet (49) — France. Nos prestations s'adressent à la clientèle française.</p>
      </div>
      <div class="body">
        <p class="lbl">Nos prestations</p>
        <div class="grid">
          <div class="svc">${SVC_ICON} Décalaminage hydrogène</div>
          <div class="svc">${SVC_ICON} Nettoyage FAP</div>
          <div class="svc">${SVC_ICON} Reprogrammation moteur</div>
          <div class="svc">${SVC_ICON} Suppression AdBlue</div>
        </div>
        <div class="contact">
          <p>Une question&nbsp;? Contactez-nous directement&nbsp;:</p>
          <div class="btns">
            <a class="btn tel" href="tel:+33652193605">06 52 19 36 05</a>
            <a class="btn wa" href="https://wa.me/33652193605" target="_blank" rel="noopener">WhatsApp</a>
            <a class="btn mail" href="mailto:contact@ultimauto.fr">contact@ultimauto.fr</a>
          </div>
        </div>
        <div class="foot">Ultimauto — Multiservices Automobile · 1 Imp. de la Haie, 49300 Cholet</div>
      </div>
    </div>
  </div>
</body>
</html>`;
