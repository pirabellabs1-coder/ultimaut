import services from '../data/services.json';
import villes from '../data/villes.json';

export const servicesLocaux = services.filter((s) => s.local);

/**
 * Une commune a-t-elle une page pour ce service ?
 * - Choletais : tous les services (territoire prioritaire).
 * - population ≥ 1000 : tous les services.
 * - petites communes (<1000) hors Choletais : décalaminage + FAP uniquement (anti-dilution §8).
 */
export function aUnePage(ville, serviceSlug) {
  if (ville.zone === 'Agglomération du Choletais') return true;
  if (ville.population >= 1000) return true;
  return ['decalaminage-hydrogene', 'nettoyage-fap'].includes(serviceSlug);
}

export function villesPourService(serviceSlug) {
  return villes.filter((v) => aUnePage(v, serviceSlug)).sort((a, b) => b.population - a.population);
}

/** Tous les couples (service local, ville) à générer. */
export function combosServiceVille() {
  const out = [];
  for (const service of servicesLocaux) {
    for (const ville of villes) {
      if (aUnePage(ville, service.slug)) out.push({ service, ville });
    }
  }
  return out;
}
