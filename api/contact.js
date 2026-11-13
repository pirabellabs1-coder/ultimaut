// Fonction serverless Vercel — adaptateur du formulaire de contact.
// La logique (validation, e-mails Resend) vit dans server/contact.js, partagée avec le Worker Cloudflare.
// Secrets/config lus depuis les variables d'environnement : RESEND_API_KEY, CONTACT_FROM, CONTACT_TO.
import { handleContact } from '../server/contact.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }
  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  } catch {
    return res.status(500).json({ error: 'erreur_serveur' });
  }
  const r = await handleContact(body, process.env);
  return res.status(r.status).json(r.body);
}
