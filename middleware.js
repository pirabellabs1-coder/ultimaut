import { next } from '@vercel/edge';
import { decide } from './geo-rules.js';

// On exclut les assets (_astro, fichiers avec extension) et l'API.
export const config = {
  matcher: ['/((?!api/|_astro/|.*\\.).*)'],
};

// Accès privé propriétaire : ouvrir https://ultimauto.fr/?acces=acces-prive-ultimauto une fois
// -> cookie 1 an qui laisse entrer depuis n'importe quel pays (utile en VPN/voyage).
const BYPASS = 'acces-prive-ultimauto';

export default function middleware(request) {
  const url = new URL(request.url);
  const ua = request.headers.get('user-agent') || '';
  const country = request.headers.get('x-vercel-ip-country') || '';
  const cookie = request.headers.get('cookie') || '';

  if (cookie.includes('ua_ok=' + BYPASS)) return next();
  if (url.searchParams.get('acces') === BYPASS) {
    return next({
      headers: { 'set-cookie': `ua_ok=${BYPASS}; Path=/; Max-Age=31536000; SameSite=Lax; Secure` },
    });
  }
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
          <p>Une question ? Contactez-nous directement :</p>
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
