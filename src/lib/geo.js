// Distances/temps approximatifs depuis l'atelier de Cholet + communes voisines.
const CHOLET = { lat: 47.06, lon: -0.88 };

function toRad(d) {
  return (d * Math.PI) / 180;
}

function haversine(a, b) {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** Distance/temps approximatifs (route ≈ vol d'oiseau × 1.2, ~72 km/h). */
export function depuisCholet(ville) {
  const straight = haversine(CHOLET, { lat: ville.lat, lon: ville.lon });
  const surPlace = ville.nom === 'Cholet' || straight < 2.5;
  const kmRaw = straight * 1.2;
  const km = Math.max(5, Math.round(kmRaw / 5) * 5);
  const minutes = Math.max(10, Math.round((kmRaw / 72) * 60 / 5) * 5);
  return { km, minutes, surPlace };
}

export function formatTemps(min) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${String(m).padStart(2, '0')}` : `${h} h`;
}

/** Les n communes les plus proches (par vol d'oiseau), self exclu. */
export function communesVoisines(ville, villes, n = 6) {
  return villes
    .filter((v) => v.nom !== ville.nom)
    .map((v) => ({ v, d: haversine({ lat: ville.lat, lon: ville.lon }, { lat: v.lat, lon: v.lon }) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, n)
    .map((x) => x.v);
}
