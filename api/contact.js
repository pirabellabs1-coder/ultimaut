// Fonction serverless Vercel — reçoit le formulaire de contact du site,
// envoie une notification à l'atelier ET un accusé de réception au visiteur, via Resend.
// Secrets/config lus depuis les variables d'environnement (jamais en clair dans le code) :
//   RESEND_API_KEY, CONTACT_FROM ("Ultimauto <contact@ultimauto.fr>"), CONTACT_TO.

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const BRAND = { blue: '#1565C0', deep: '#196AD5', lime: '#8BC53F', ink: '#1f2a37', muted: '#64748b' };

function shell(headerRight, bodyHtml) {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#eef2f7;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f7;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
        <tr><td style="background:${BRAND.blue};padding:26px 32px;">
          <table role="presentation" width="100%"><tr>
            <td style="font:800 22px Arial,sans-serif;color:#ffffff;letter-spacing:1px;">ULTIMAUTO</td>
            <td align="right" style="font:600 12px Arial,sans-serif;color:#cfe0f5;">${headerRight}</td>
          </tr></table>
        </td></tr>
        <tr><td style="height:4px;background:${BRAND.lime};font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr><td style="padding:30px 32px;">${bodyHtml}</td></tr>
        <tr><td style="background:${BRAND.deep};padding:18px 32px;font:400 12px/1.6 Arial,sans-serif;color:#cfe0f5;">
          <strong style="color:#ffffff;">Ultimauto</strong> — Décalaminage hydrogène &amp; nettoyage FAP<br>
          1 Imp. de la Haie, 49300 Cholet · 06 52 19 36 05<br>
          <span style="color:#a9c7ef;">Décalaminage · Nettoyage FAP · Reprogrammation · AdBlue · Grand Ouest (44·49·56·79·85)</span>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function notificationHtml({ nom, telephone, email, message }) {
  const emailCell = email
    ? `<a href="mailto:${esc(email)}" style="color:${BRAND.blue};text-decoration:none;">${esc(email)}</a>`
    : '<span style="color:#94a3b8;">non renseigné</span>';
  const replyBtn = email
    ? `<a href="mailto:${esc(email)}" style="display:inline-block;background:#ffffff;color:${BRAND.blue};font:700 14px Arial,sans-serif;text-decoration:none;padding:11px 22px;border-radius:999px;border:2px solid ${BRAND.blue};">Répondre par e-mail</a>`
    : '';
  return shell('Formulaire du site', `
          <h1 style="margin:0 0 4px;font:800 20px Arial,sans-serif;color:${BRAND.ink};">Nouvelle demande de contact</h1>
          <p style="margin:0 0 22px;font:400 14px Arial,sans-serif;color:${BRAND.muted};">Reçue via le formulaire de contact d'ultimauto.fr</p>
          <table role="presentation" width="100%" style="background:#f6f9fc;border:1px solid #e2e8f0;border-radius:12px;"><tr><td style="padding:14px 20px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="padding:7px 0;font:700 13px Arial,sans-serif;color:${BRAND.muted};width:110px;vertical-align:top;">Nom</td><td style="padding:7px 0;font:600 15px Arial,sans-serif;color:${BRAND.ink};">${esc(nom)}</td></tr>
              <tr><td style="padding:7px 0;font:700 13px Arial,sans-serif;color:${BRAND.muted};vertical-align:top;">Téléphone</td><td style="padding:7px 0;font:700 15px Arial,sans-serif;"><a href="tel:${esc(telephone)}" style="color:${BRAND.blue};text-decoration:none;">${esc(telephone)}</a></td></tr>
              <tr><td style="padding:7px 0;font:700 13px Arial,sans-serif;color:${BRAND.muted};vertical-align:top;">E-mail</td><td style="padding:7px 0;font:600 15px Arial,sans-serif;">${emailCell}</td></tr>
            </table>
          </td></tr></table>
          <p style="margin:24px 0 8px;font:700 12px Arial,sans-serif;color:${BRAND.muted};text-transform:uppercase;letter-spacing:.6px;">Message</p>
          <div style="background:#ffffff;border-left:4px solid ${BRAND.lime};border-radius:0 8px 8px 0;padding:14px 18px;font:400 15px/1.65 Arial,sans-serif;color:${BRAND.ink};">${esc(message).replace(/\n/g, '<br>')}</div>
          <table role="presentation" style="margin-top:26px;"><tr>
            <td><a href="tel:${esc(telephone)}" style="display:inline-block;background:${BRAND.blue};color:#ffffff;font:700 14px Arial,sans-serif;text-decoration:none;padding:12px 24px;border-radius:999px;">Rappeler</a></td>
            <td style="width:10px;font-size:0;">&nbsp;</td>
            <td>${replyBtn}</td>
          </tr></table>`);
}

function confirmationHtml({ nom, message }) {
  return shell('Accusé de réception', `
          <h1 style="margin:0 0 6px;font:800 20px Arial,sans-serif;color:${BRAND.ink};">Merci ${esc(nom)}, votre demande est bien reçue ✅</h1>
          <p style="margin:0 0 18px;font:400 15px/1.6 Arial,sans-serif;color:#334155;">Notre équipe vous recontacte <strong>sous 24 h ouvrées</strong>. Pour une demande urgente, appelez-nous directement — c'est souvent le plus rapide.</p>
          <p style="margin:0 0 8px;font:700 12px Arial,sans-serif;color:${BRAND.muted};text-transform:uppercase;letter-spacing:.6px;">Votre message</p>
          <div style="background:#f6f9fc;border-left:4px solid ${BRAND.lime};border-radius:0 8px 8px 0;padding:14px 18px;font:400 15px/1.65 Arial,sans-serif;color:${BRAND.ink};">${esc(message).replace(/\n/g, '<br>')}</div>
          <table role="presentation" style="margin-top:24px;"><tr>
            <td><a href="tel:+33652193605" style="display:inline-block;background:${BRAND.blue};color:#ffffff;font:700 14px Arial,sans-serif;text-decoration:none;padding:12px 24px;border-radius:999px;">📞 Nous appeler</a></td>
            <td style="width:10px;font-size:0;">&nbsp;</td>
            <td><a href="https://wa.me/33652193605" style="display:inline-block;background:#25D366;color:#ffffff;font:700 14px Arial,sans-serif;text-decoration:none;padding:12px 24px;border-radius:999px;">WhatsApp</a></td>
          </tr></table>
          <p style="margin:22px 0 0;font:400 13px/1.6 Arial,sans-serif;color:${BRAND.muted};">À très vite,<br>L'équipe <strong style="color:${BRAND.ink};">Ultimauto</strong> — Cholet (49)</p>`);
}

async function sendEmail(apiKey, payload) {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const detail = r.ok ? '' : await r.text().catch(() => '');
  return { ok: r.ok, detail };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const nom = String(body.nom || '').trim();
    const telephone = String(body.telephone || '').trim();
    const email = String(body.email || '').trim();
    const message = String(body.message || '').trim();
    const botcheck = String(body.botcheck || '').trim();

    if (botcheck) return res.status(200).json({ ok: true }); // honeypot anti-spam
    if (!nom || !telephone || !message) return res.status(400).json({ error: 'champs_requis' });

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'config_manquante' });

    const from = process.env.CONTACT_FROM || 'Site Ultimauto <onboarding@resend.dev>';
    const to = (process.env.CONTACT_TO || 'ultimautodecalaminage@gmail.com')
      .split(',').map((s) => s.trim()).filter(Boolean);

    const text =
      `Nouveau message depuis ultimauto.fr\n\nNom : ${nom}\nTéléphone : ${telephone}\nE-mail : ${email || '—'}\n\nMessage :\n${message}\n`;

    // 1) Notification à l'atelier
    const notif = {
      from,
      to,
      subject: `Nouveau message du site — ${nom}`,
      text,
      html: notificationHtml({ nom, telephone, email, message }),
    };
    if (email) notif.reply_to = email;

    const sent = await sendEmail(apiKey, notif);
    if (!sent.ok) {
      return res.status(502).json({ error: 'envoi_echoue', detail: sent.detail.slice(0, 300) });
    }

    // 2) Accusé de réception au visiteur (best-effort, n'échoue jamais la requête)
    if (email) {
      try {
        await sendEmail(apiKey, {
          from,
          to: [email],
          reply_to: 'contact@ultimauto.fr',
          subject: 'Votre demande a bien été reçue — Ultimauto',
          text: `Bonjour ${nom},\n\nMerci pour votre message, nous l'avons bien reçu et revenons vers vous sous 24 h ouvrées.\nPour une demande urgente : 06 52 19 36 05.\n\nL'équipe Ultimauto — Cholet (49)`,
          html: confirmationHtml({ nom, message }),
        });
      } catch (_) {
        /* on ignore : l'essentiel (notification atelier) est parti */
      }
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: 'erreur_serveur' });
  }
}
