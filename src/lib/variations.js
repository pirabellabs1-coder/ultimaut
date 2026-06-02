import { villeSlug } from './slug.js';
import { depuisCholet, formatTemps, communesVoisines } from './geo.js';

/* Hash déterministe (FNV-1a) → variante stable par (service, ville). */
export function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function pick(arr, seed) {
  return arr[hashString(seed) % arr.length];
}

const DEPT_NOMS = { '44': 'Loire-Atlantique', '49': 'Maine-et-Loire', '56': 'Morbihan', '79': 'Deux-Sèvres', '85': 'Vendée' };

export function listeFr(noms) {
  const a = noms.filter(Boolean);
  if (a.length <= 1) return a.join('');
  return `${a.slice(0, -1).join(', ')} et ${a[a.length - 1]}`;
}

function phrasePopulation(pop) {
  const fmt = pop.toLocaleString('fr-FR');
  if (pop >= 50000) return `grande ville d'environ ${fmt} habitants`;
  if (pop >= 10000) return `ville d'environ ${fmt} habitants`;
  if (pop >= 2000) return `commune d'environ ${fmt} habitants`;
  return `commune de ${fmt} habitants`;
}

export function buildContext({ service, ville, villes }) {
  const slug = villeSlug(ville);
  const seed = `${service.slug}::${slug}`;
  const dist = depuisCholet(ville);
  const voisines = communesVoisines(ville, villes, 6).map((v) => v.nom);
  const deptNom = DEPT_NOMS[ville.dept] || ville.dept;
  const serviceLower = service.nom.charAt(0).toLowerCase() + service.nom.slice(1);

  const distancePhrase = dist.surPlace
    ? "directement dans notre atelier, au cœur de l'agglomération du Choletais"
    : `à environ ${dist.km} km de notre atelier de Cholet (~${formatTemps(dist.minutes)} de route)`;
  const distanceCourte = dist.surPlace ? 'à Cholet même' : `à ${formatTemps(dist.minutes)} de route`;
  const mobilePhrase = dist.surPlace
    ? "Notre atelier vous accueille au cœur de Cholet, et notre service mobile peut aussi intervenir directement chez vous."
    : `Nous accueillons votre véhicule à l'atelier de Cholet et, grâce à notre service mobile, nous pouvons aussi intervenir à ${ville.nom}, à votre domicile ou sur votre lieu de travail (frais de déplacement selon la distance).`;

  return {
    seed, slug, ville: ville.nom, dept: ville.dept, deptNom, zone: ville.zone,
    surPlace: dist.surPlace, km: dist.km, temps: formatTemps(dist.minutes),
    distancePhrase, distanceCourte, mobilePhrase, voisines,
    voisinesText: listeFr(voisines.slice(0, 3)),
    populationPhrase: phrasePopulation(ville.population),
    population: ville.population, service, serviceLower,
  };
}

const introPool = [
  (c) => `À la recherche d'un spécialiste du ${c.serviceLower} à ${c.ville} (${c.dept}) ? Ultimauto accompagne les automobilistes de ${c.ville}, ${c.populationPhrase} du secteur ${c.zone}. Notre atelier se situe ${c.distancePhrase}, et nous recevons régulièrement des conducteurs venus de ${listeFr(c.voisines.slice(0, 3))}. Diagnostic sérieux, conseils transparents et devis gratuit : voici tout ce qu'il faut savoir sur le ${c.serviceLower} à ${c.ville} et dans ses environs.`,
  (c) => `Votre véhicule a besoin d'un ${c.serviceLower} et vous habitez ${c.ville} ou ses alentours ? Ultimauto met son savoir-faire au service des conducteurs de cette ${c.populationPhrase} du ${c.deptNom}. Comptez ${c.distanceCourte} pour rejoindre notre atelier de Cholet depuis ${c.ville}, aux côtés de communes voisines comme ${listeFr(c.voisines.slice(0, 3))}. Nous détaillons ci-dessous notre méthode, les signes à surveiller et le déroulé de l'intervention.`,
  (c) => `${c.service.nom} à ${c.ville} : Ultimauto est votre interlocuteur de confiance dans le ${c.deptNom}. Implanté ${c.distancePhrase}, notre centre intervient pour ${c.ville} (${c.populationPhrase}) et l'ensemble du secteur ${c.zone}, jusqu'à ${listeFr(c.voisines.slice(0, 3))}. Découvrez comment nous redonnons à votre véhicule tout son potentiel, en toute transparence et avec un devis gratuit.`,
  (c) => `Besoin d'un ${c.serviceLower} fiable du côté de ${c.ville} (${c.deptNom}) ? Faites confiance à Ultimauto. Depuis notre atelier situé ${c.distancePhrase}, nous prenons en charge les véhicules de ${c.ville} et des communes proches — ${listeFr(c.voisines.slice(0, 3))} — avec la même exigence de qualité. Cette page vous explique en détail notre prestation et la marche à suivre.`,
];

const pourquoiLocalPool = [
  (c) => `Pourquoi choisir Ultimauto pour votre ${c.serviceLower} à ${c.ville} ? Parce que nous combinons un matériel professionnel, une vraie expertise et une approche honnête. Chaque intervention démarre par un diagnostic : nous ne proposons que ce dont votre véhicule a réellement besoin. De nombreux automobilistes de ${c.ville}, mais aussi de ${listeFr(c.voisines.slice(0, 2))}, nous font confiance pour cette transparence. ${c.mobilePhrase}`,
  (c) => `À ${c.ville}, trouver un professionnel sérieux pour un ${c.serviceLower} n'est pas toujours simple. Ultimauto s'est fait une réputation dans tout le secteur ${c.zone} en misant sur la pédagogie et la durabilité : on vous explique le problème, on privilégie la réparation à la dépose systématique, et on s'engage sur le résultat. C'est ce qui amène jusqu'à nous des clients de ${c.ville} comme de ${listeFr(c.voisines.slice(1, 3))}. ${c.mobilePhrase}`,
  (c) => `Confier son ${c.serviceLower} à Ultimauto, c'est choisir un atelier qui prend le temps. Pour les conducteurs de ${c.ville} et du ${c.deptNom}, nous réalisons un diagnostic clair, un devis gratuit et détaillé, et nous n'intervenons qu'avec votre accord. Cette exigence vaut pour ${c.ville} comme pour ${listeFr(c.voisines.slice(0, 2))}. ${c.mobilePhrase}`,
  (c) => `Les automobilistes du secteur ${c.zone} apprécient de trouver en Ultimauto un spécialiste qui ne pousse pas à la consommation. Pour votre ${c.serviceLower} à ${c.ville}, nous cherchons la solution la plus pertinente et la plus économique, en expliquant chaque étape. Que vous veniez de ${c.ville}, de ${listeFr(c.voisines.slice(0, 2))} ou d'ailleurs dans le ${c.deptNom}, vous bénéficiez du même soin. ${c.mobilePhrase}`,
];

const zoneContextPool = [
  (c) => `Implantés à Cholet, nous intervenons dans tout le secteur ${c.zone}. ${c.ville} fait partie des communes que nous desservons régulièrement, ${c.surPlace ? "puisque notre atelier s'y trouve" : `à environ ${c.km} km de l'atelier`}. Autour de ${c.ville}, nous accueillons aussi les conducteurs de ${listeFr(c.voisines.slice(0, 4))}. Vous pouvez nous amener votre véhicule à Cholet ou faire appel à notre service mobile.`,
  (c) => `Notre zone d'intervention couvre le ${c.deptNom} et, plus largement, le Grand Ouest (44, 49, 56, 79 et 85). Pour un ${c.serviceLower} à ${c.ville}, vous êtes au bon endroit : la commune est rattachée au secteur ${c.zone} que nous connaissons bien, comme les communes voisines de ${listeFr(c.voisines.slice(0, 4))}. ${c.surPlace ? "Notre atelier est sur place, à Cholet." : `Comptez environ ${c.temps} de route entre ${c.ville} et Cholet.`}`,
  (c) => `Que vous soyez en centre-ville de ${c.ville} ou dans les communes alentours, Ultimauto vous accompagne pour votre ${c.serviceLower}. Le secteur ${c.zone} fait partie de nos zones de prédilection ; nous y recevons fréquemment des véhicules de ${c.ville} ainsi que de ${listeFr(c.voisines.slice(1, 4))}. Notre service mobile complète l'accueil à l'atelier de Cholet pour vous simplifier la vie.`,
  (c) => `${c.ville} et ses environs font pleinement partie de notre rayon d'action. Depuis Cholet, nous rayonnons sur le ${c.deptNom} et le Grand Ouest, et le secteur ${c.zone} compte parmi les territoires que nous desservons le plus, aux côtés de ${listeFr(c.voisines.slice(0, 4))}. ${c.surPlace ? "Tout se passe à notre atelier de Cholet, ou chez vous via notre service mobile." : `À environ ${c.temps} de route, l'atelier reste facilement accessible — et notre service mobile peut venir à vous.`}`,
];

const deroulementIntroPool = [
  (c) => `Voici comment se déroule concrètement votre ${c.serviceLower} lorsque vous venez de ${c.ville} :`,
  (c) => `De la prise de rendez-vous à la restitution, votre ${c.serviceLower} se passe simplement :`,
  (c) => `Pour un ${c.serviceLower} à ${c.ville} et ses environs, nous procédons toujours par étapes :`,
  (c) => `Concrètement, votre ${c.serviceLower} suit un déroulé précis et maîtrisé :`,
];

const closingPool = [
  (c) => `Vous souhaitez un devis pour un ${c.serviceLower} à ${c.ville} ? Contactez Ultimauto par téléphone, via WhatsApp ou avec notre formulaire en ligne. Réponse rapide, étude de votre situation et créneau adapté à votre emploi du temps. Le devis est gratuit et sans engagement.`,
  (c) => `Prêt à passer à l'action pour votre véhicule à ${c.ville} ? Demandez votre devis gratuit : nous étudions votre cas, nous expliquons les options et planifions l'intervention au plus près de vos disponibilités, à l'atelier ou en service mobile. Une simple photo suffit souvent à orienter le diagnostic.`,
  (c) => `Pour toute question sur le ${c.serviceLower} à ${c.ville} ou dans le secteur ${c.zone}, l'équipe Ultimauto est à votre écoute. Devis gratuit, conseils personnalisés et rendez-vous rapide, par téléphone ou WhatsApp.`,
  (c) => `Un ${c.serviceLower} à ${c.ville}, ça commence ici : demandez votre devis sans engagement. Nous vous accueillons à Cholet, ${c.distanceCourte}, ou nous venons à vous grâce à notre service mobile, partout dans le ${c.deptNom}.`,
];

const metaPool = [
  (c) => `${c.service.nom} à ${c.ville} (${c.dept}) chez Ultimauto : diagnostic, devis gratuit et intervention soignée. Spécialiste du secteur ${c.zone}.`,
  (c) => `Besoin d'un ${c.serviceLower} à ${c.ville} ? Ultimauto, atelier de confiance près de ${c.ville} (${c.deptNom}). Devis gratuit, conseils transparents, RDV rapide.`,
  (c) => `${c.service.nom} à ${c.ville} et alentours avec Ultimauto. ${c.service.prixIndicatif}, service mobile, devis gratuit. Prenez rendez-vous.`,
  (c) => `Ultimauto réalise votre ${c.serviceLower} pour ${c.ville} (${c.dept}) et le secteur ${c.zone}. ${c.service.prixIndicatif}. Devis gratuit en ligne ou par WhatsApp.`,
];

function clamp(str, max = 155) {
  if (str.length <= max) return str;
  const cut = str.slice(0, max - 1);
  return cut.slice(0, cut.lastIndexOf(' ')).trim() + '…';
}

function faqLocaleVille(c) {
  const q1 = [
    (c) => ({
      q: `Intervenez-vous à ${c.ville} (${c.dept}) ?`,
      r: `Oui. Ultimauto réalise ${c.serviceLower} pour les automobilistes de ${c.ville} et de tout le secteur ${c.zone}. ${c.surPlace ? 'Notre atelier se trouve à Cholet même.' : `Notre atelier est à environ ${c.km} km, soit ${c.temps} de route, et notre service mobile peut aussi intervenir à ${c.ville}.`} Nous recevons régulièrement des clients de ${listeFr(c.voisines.slice(0, 2))}. Devis gratuit, rendez-vous par téléphone ou WhatsApp.`,
    }),
    (c) => ({
      q: `Faut-il venir jusqu'à Cholet depuis ${c.ville} ?`,
      r: `Pas forcément. Vous pouvez nous amener votre véhicule à l'atelier de Cholet (${c.surPlace ? 'sur place à ' + c.ville : '~' + c.temps + ' depuis ' + c.ville}), mais notre service mobile peut aussi se déplacer à ${c.ville}, à votre domicile ou sur votre lieu de travail. Beaucoup de clients de ${listeFr(c.voisines.slice(0, 2))} choisissent l'une ou l'autre formule selon leur emploi du temps.`,
    }),
  ];
  const q2 = [
    (c) => ({
      q: `Combien coûte un ${c.serviceLower} à ${c.ville} ?`,
      r: `Le tarif débute à « ${c.service.prixIndicatif} » pour cette prestation, réalisée à notre atelier de Cholet. En service mobile à ${c.ville}, des frais de déplacement peuvent s'ajouter selon la distance. Nous établissons toujours un devis gratuit et détaillé avant d'intervenir, pour ${c.ville} comme pour ${listeFr(c.voisines.slice(2, 4))}.`,
    }),
    (c) => ({
      q: `Sous quel délai un rendez-vous depuis ${c.ville} ?`,
      r: `Nous organisons les rendez-vous au plus près de vos disponibilités. Contactez-nous par téléphone ou WhatsApp en précisant votre véhicule et votre besoin ; nous vous proposons rapidement un créneau, à l'atelier de Cholet ou en intervention mobile à ${c.ville} et alentours (${listeFr(c.voisines.slice(1, 3))}).`,
    }),
  ];
  return [pick(q1, c.seed + 'fq1')(c), pick(q2, c.seed + 'fq2')(c)];
}

export function pageVariation(ctx) {
  return {
    intro: pick(introPool, ctx.seed + 'intro')(ctx),
    pourquoiLocal: pick(pourquoiLocalPool, ctx.seed + 'pql')(ctx),
    zoneContext: pick(zoneContextPool, ctx.seed + 'zc')(ctx),
    deroulementIntro: pick(deroulementIntroPool, ctx.seed + 'der')(ctx),
    closing: pick(closingPool, ctx.seed + 'close')(ctx),
    metaDescription: clamp(pick(metaPool, ctx.seed + 'meta')(ctx), 155),
    faqLocaleVille: faqLocaleVille(ctx),
  };
}
