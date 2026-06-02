// Slugification déterministe (règle §5 du brief).
const DIACRITICS = /[̀-ͯ]/g;
const APOSTROPHES = /['’]/g;

export function slugify(str) {
  return String(str)
    .normalize('NFD')
    .replace(DIACRITICS, '') // é→e, è→e, ç→c…
    .toLowerCase()
    .replace(APOSTROPHES, ' ') // apostrophes droites et typographiques
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function villeSlug(ville) {
  return slugify(typeof ville === 'string' ? ville : ville.nom);
}
