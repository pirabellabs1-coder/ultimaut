// Liste de BLOCAGE : visiteurs humains de ces pays bloqués (trafic sans intérêt pour un garage français).
// Le site reste ouvert partout ailleurs. Les robots des moteurs de recherche passent TOUJOURS.
export const BLOCKED = new Set([
  'US', // États-Unis
  'RU', // Russie
  'CN', // Chine
  'IN', // Inde
  'VN', // Vietnam
  'ID', // Indonésie
  'PK', // Pakistan
]);

// Robots moteurs / IA / outils (vérification GSC, PageSpeed, Rich Results…) / aperçus réseaux sociaux
// — TOUJOURS autorisés (sinon désindexation OU échec de validation de propriété).
// 'google' et 'bing' larges couvrent TOUS leurs fetchers (Googlebot, Google-Site-Verification,
// Google-InspectionTool, AdsBot, Google-Read-Aloud, BingPreview, etc.), quel que soit le pays.
export const BOTS = /(google|bing|msnbot|adidxbot|slurp|duckduckbot|duckassistbot|baiduspider|yandex|sogou|facebookexternalhit|facebookcatalog|facebot|twitterbot|linkedinbot|pinterest|applebot|ia_archiver|archive\.org_bot|gptbot|oai-searchbot|chatgpt-user|claudebot|claude-web|anthropic-ai|perplexitybot|ccbot|bytespider|amazonbot|petalbot|semrushbot|ahrefsbot|mj12bot|dotbot|uptimerobot|vercel|lighthouse|pagespeed|headlesschrome|whatsapp|telegrambot|discordbot|embedly)/i;

// Renvoie 'allow' ou 'block'.
export function decide(country, ua) {
  if (BOTS.test(ua || '')) return 'allow';
  if (BLOCKED.has((country || '').toUpperCase())) return 'block';
  return 'allow';
}
