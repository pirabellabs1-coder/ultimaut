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

// Robots des moteurs de recherche / IA / réseaux sociaux — TOUJOURS autorisés (sinon désindexation).
export const BOTS = /(googlebot|google-inspectiontool|googleother|google-extended|mediapartners-google|adsbot-google|storebot-google|bingbot|bingpreview|msnbot|adidxbot|slurp|duckduckbot|duckassistbot|baiduspider|yandex|sogou|facebookexternalhit|facebot|twitterbot|linkedinbot|pinterest|applebot|ia_archiver|archive\.org_bot|gptbot|oai-searchbot|chatgpt-user|claudebot|claude-web|anthropic-ai|perplexitybot|ccbot|bytespider|amazonbot|petalbot|semrushbot|ahrefsbot|mj12bot|dotbot|uptimerobot|vercel|lighthouse)/i;

// Renvoie 'allow' ou 'block'.
export function decide(country, ua) {
  if (BOTS.test(ua || '')) return 'allow';
  if (BLOCKED.has((country || '').toUpperCase())) return 'block';
  return 'allow';
}
