// Départements réellement couverts par Ultimauto (atelier de Cholet + service mobile).
// Source unique : utilisée par le composant ZoneCheck, la page contact et l'API contact.
export const DEPARTEMENTS = [
  { code: '44', nom: 'Loire-Atlantique' },
  { code: '49', nom: 'Maine-et-Loire' },
  { code: '56', nom: 'Morbihan' },
  { code: '79', nom: 'Deux-Sèvres' },
  { code: '85', nom: 'Vendée' },
];

/** ['44','49','56','79','85'] */
export const CODES = DEPARTEMENTS.map((d) => d.code);

/** "44 · 49 · 56 · 79 · 85" */
export const LISTE_COURTE = CODES.join(' · ');

/** "Loire-Atlantique (44), Maine-et-Loire (49), …" */
export const LISTE_LONGUE = DEPARTEMENTS.map((d) => `${d.nom} (${d.code})`).join(', ');

/** Le département est-il couvert ? Accepte "49" ou un code postal "49300". */
export function estCouvert(valeur) {
  return CODES.includes(String(valeur || '').trim().slice(0, 2));
}
