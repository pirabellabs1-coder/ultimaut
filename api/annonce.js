// Bascule du bandeau d'annonce — flag "annonce" dans Vercel Edge Config.
// Le bandeau étant généré au build, la bascule déclenche AUSSI un redéploiement.
//   GET  /api/annonce?cle=SECRET              -> { on: boolean }
//   POST /api/annonce  { cle:SECRET, on:bool } -> { on: boolean, rebuild: boolean }
// Env : MAINTENANCE_SECRET, VERCEL_TOKEN, EDGE_CONFIG_ID, VERCEL_TEAM_ID

const API = 'https://api.vercel.com';
const PROJECT = 'ultimauto.fr';

function qs(extra = '') {
  const t = process.env.VERCEL_TEAM_ID;
  const base = t ? `?teamId=${t}` : '?';
  return base + (extra ? '&' + extra : '');
}
function auth() {
  return { Authorization: `Bearer ${process.env.VERCEL_TOKEN}`, 'Content-Type': 'application/json' };
}

async function readFlag() {
  // On lit la liste complète : une clé absente n'est alors pas une erreur.
  const r = await fetch(`${API}/v1/edge-config/${process.env.EDGE_CONFIG_ID}/items${qs()}`, {
    headers: auth(),
  });
  if (!r.ok) throw new Error('lecture_' + r.status);
  const items = await r.json();
  const found = Array.isArray(items) ? items.find((i) => i.key === 'annonce') : null;
  return !!(found && found.value === true);
}

async function writeFlag(on) {
  const r = await fetch(`${API}/v1/edge-config/${process.env.EDGE_CONFIG_ID}/items${qs()}`, {
    method: 'PATCH',
    headers: auth(),
    body: JSON.stringify({ items: [{ operation: 'upsert', key: 'annonce', value: !!on }] }),
  });
  if (!r.ok) throw new Error('ecriture_' + r.status);
  return !!on;
}

// Relance un build de production à partir du dernier déploiement (pas de dépôt Git connecté).
async function rebuild() {
  const list = await fetch(
    `${API}/v6/deployments${qs(`app=${PROJECT}&target=production&limit=1&state=READY`)}`,
    { headers: auth() }
  );
  if (!list.ok) return false;
  const { deployments } = await list.json();
  if (!deployments || !deployments.length) return false;

  const r = await fetch(`${API}/v13/deployments${qs('forceNew=1&skipAutoDetectionConfirmation=1')}`, {
    method: 'POST',
    headers: auth(),
    body: JSON.stringify({ name: PROJECT, deploymentId: deployments[0].uid, target: 'production' }),
  });
  return r.ok;
}

export default async function handler(req, res) {
  const secret = process.env.MAINTENANCE_SECRET;
  if (!secret || !process.env.VERCEL_TOKEN || !process.env.EDGE_CONFIG_ID) {
    return res.status(500).json({ error: 'config_manquante' });
  }

  let body = {};
  if (req.method === 'POST') {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  }
  const cle = String((req.method === 'POST' ? body.cle : (req.query && req.query.cle)) || '');
  if (cle !== secret) return res.status(401).json({ error: 'non_autorise' });

  try {
    if (req.method === 'GET') return res.status(200).json({ on: await readFlag() });
    if (req.method === 'POST') {
      const on = await writeFlag(body.on === true || body.on === 'true');
      const ok = await rebuild();
      return res.status(200).json({ on, rebuild: ok });
    }
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  } catch (e) {
    return res.status(502).json({ error: 'edge_config', detail: String((e && e.message) || e).slice(0, 200) });
  }
}
