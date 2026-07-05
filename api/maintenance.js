// Bascule du mode maintenance — lit/écrit le flag "maintenance" dans Vercel Edge Config.
// Protégé par un secret (MAINTENANCE_SECRET).
//   GET  /api/maintenance?cle=SECRET            -> { on: boolean }
//   POST /api/maintenance  { cle:SECRET, on:bool } -> { on: boolean }
// Variables d'environnement requises :
//   MAINTENANCE_SECRET : mot de passe de la page /pilote
//   VERCEL_TOKEN       : token API Vercel (droit sur l'Edge Config)
//   EDGE_CONFIG_ID     : identifiant de l'Edge Config (ecfg_…)
//   VERCEL_TEAM_ID     : (optionnel) identifiant d'équipe Vercel (team_…)

const API = 'https://api.vercel.com';

function teamQS() {
  return process.env.VERCEL_TEAM_ID ? `?teamId=${process.env.VERCEL_TEAM_ID}` : '';
}

async function readFlag() {
  const id = process.env.EDGE_CONFIG_ID;
  const token = process.env.VERCEL_TOKEN;
  const r = await fetch(`${API}/v1/edge-config/${id}/item/maintenance${teamQS()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (r.status === 404) return false; // clé jamais définie = maintenance OFF
  if (!r.ok) throw new Error('lecture_echouee_' + r.status);
  const j = await r.json();
  return j && j.value === true;
}

async function writeFlag(on) {
  const id = process.env.EDGE_CONFIG_ID;
  const token = process.env.VERCEL_TOKEN;
  const r = await fetch(`${API}/v1/edge-config/${id}/items${teamQS()}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: [{ operation: 'upsert', key: 'maintenance', value: !!on }] }),
  });
  if (!r.ok) throw new Error('ecriture_echouee_' + r.status + '_' + (await r.text().catch(() => '')).slice(0, 120));
  return !!on;
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
    if (req.method === 'GET') {
      return res.status(200).json({ on: await readFlag() });
    }
    if (req.method === 'POST') {
      const on = await writeFlag(body.on === true || body.on === 'true');
      return res.status(200).json({ on });
    }
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  } catch (e) {
    return res.status(502).json({ error: 'edge_config', detail: String((e && e.message) || e).slice(0, 200) });
  }
}
