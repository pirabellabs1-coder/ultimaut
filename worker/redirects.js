// Redirections 301 — source unique : la liste "redirects" de vercel.json (tant que Vercel sert de repli).
// Reproduit la sémantique Vercel (path-to-regexp) :
//   - la première règle qui correspond l'emporte (ordre du fichier) ;
//   - slash final optionnel, comparaison insensible à la casse ;
//   - ":param" = un segment, ":param(.*)" = tout le reste ; les paramètres sont reportés dans la destination.
import vercel from '../vercel.json' with { type: 'json' };

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\/-]/g, '\\$&');

// Clé de comparaison des règles exactes : minuscules, sans slash final (sauf la racine).
const norm = (p) => {
  const l = p.toLowerCase();
  return l.length > 1 && l.endsWith('/') ? l.slice(0, -1) : l;
};

function compile(source) {
  let re = '';
  let i = 0;
  const token = /:(\w+)(\(\.\*\))?/g;
  let m;
  while ((m = token.exec(source))) {
    re += escapeRe(source.slice(i, m.index));
    re += m[2] ? `(?<${m[1]}>.*)` : `(?<${m[1]}>[^/#?]+?)`;
    i = m.index + m[0].length;
  }
  re += escapeRe(source.slice(i));
  re = re.replace(/\\\/$/, ''); // le slash final devient optionnel ci-dessous
  return new RegExp(`^${re}\\/?$`, 'i');
}

const exact = new Map(); // clé normalisée -> { idx, destination }
const patterns = []; // { idx, re, destination }, dans l'ordre du fichier

(vercel.redirects || []).forEach((r, idx) => {
  if (/[:(*]/.test(r.source)) {
    patterns.push({ idx, re: compile(r.source), destination: r.destination });
  } else {
    const k = norm(r.source);
    if (!exact.has(k)) exact.set(k, { idx, destination: r.destination });
  }
});

// Renvoie le chemin de destination, ou null si aucune règle ne s'applique.
export function findRedirect(pathname) {
  const hit = exact.get(norm(pathname));
  const limit = hit ? hit.idx : Infinity;
  for (const p of patterns) {
    if (p.idx > limit) break;
    const m = p.re.exec(pathname);
    if (m) {
      const groups = m.groups || {};
      return p.destination.replace(/:(\w+)/g, (all, name) => (name in groups ? groups[name] : all));
    }
  }
  return hit ? hit.destination : null;
}

export const REDIRECT_COUNT = exact.size + patterns.length;
