// Éléments d'UI partagés (icônes SVG, glyphe WhatsApp) réutilisés dans le Layout et les pages.

export const WA_PATH =
  'M19.05 4.91A9.82 9.82 0 0 0 12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21h.004c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01zM12.04 20.15h-.003a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.11.82.83-3.04-.2-.31a8.18 8.18 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.69 8.23-8.23 8.23zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.16.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.51.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43-.14-.01-.31-.01-.48-.01-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.11-.22-.17-.47-.29z';

// Tracé(s) d'icône par slug de service (stroke, viewBox 24).
export const ICONS = {
  'decalaminage-hydrogene': ['M13 2 4 14h6l-1 8 9-12h-6z'],
  'nettoyage-fap': ['M3 5h18l-7 8v6l-4 2v-8z'],
  'reprogrammation-moteur': ['M4 19a8 8 0 1 1 16 0', 'M12 13.5l3.5-3.5'],
  'suppression-adblue': ['M12 3s5 5.5 5 9a5 5 0 1 1-10 0c0-3.5 5-9 5-9z'],
  'destruction-dodeurs': ['M3 8h11a2.5 2.5 0 1 0-2.5-2.5', 'M3 12h15a2.5 2.5 0 1 1-2.5 2.5', 'M3 16h8a2 2 0 1 1-2 2'],
  'pressing-siege-auto': ['M6 4h6a3 3 0 0 1 3 3v6H9a3 3 0 0 1-3-3V4z', 'M15 13h2a2 2 0 0 1 2 2v3', 'M6 13v5', 'M19 20H6'],
  'optique-de-phare': ['M3 6h7a6 6 0 0 1 0 12H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z', 'M15 8h3', 'M15 12h5', 'M15 16h3'],
};

export const TAGLINE = {
  'decalaminage-hydrogene': 'Calamine éliminée, sans démontage',
  'nettoyage-fap': 'FAP colmaté nettoyé en profondeur',
  'reprogrammation-moteur': 'Plus de couple, conso maîtrisée',
  'suppression-adblue': 'Fin des pannes du système SCR',
  'destruction-dodeurs': 'Habitacle sain, traitement à l’ozone',
  'pressing-siege-auto': 'Sièges & moquettes comme neufs',
  'optique-de-phare': 'Phares clairs, sécurité retrouvée',
};

// Photo réelle (héro) associée à chaque service.
export const SERVICE_PHOTO = {
  'decalaminage-hydrogene': '/img/photo-1.jpg',
  'nettoyage-fap': '/img/hero-2.jpg',
  'reprogrammation-moteur': '/img/photo-3.jpg',
  'suppression-adblue': '/img/photo-2.jpg',
  'destruction-dodeurs': '/img/atelier.jpg',
  'pressing-siege-auto': '/img/hero-1.jpg',
  'optique-de-phare': '/img/hero-3.jpg',
};

// Galerie de photos réelles (réutilisée sur les hubs).
export const GALLERY = [
  { src: '/img/photo-3.jpg', alt: 'Décalaminage hydrogène de plusieurs véhicules sur site', cap: 'Plusieurs véhicules traités sur site', wide: true },
  { src: '/img/hero-2.jpg', alt: 'Décalaminage de berlines et citadines, capots ouverts', cap: 'Berlines & citadines' },
  { src: '/img/hero-3.jpg', alt: 'Décalaminage hydrogène sur camping-cars', cap: 'Camping-cars & utilitaires' },
  { src: '/img/photo-1.jpg', alt: "Sonde d'injection d'hydrogène sur le moteur", cap: "Injection d'hydrogène sur le moteur" },
  { src: '/img/photo-2.jpg', alt: 'Service mobile Ultimauto à domicile', cap: 'Service mobile : on vient à vous' },
];


export function socialLinks(site) {
  // Ne renvoie que les réseaux réellement renseignés (évite les liens morts href="#").
  return [
    { name: 'Facebook', img: '/img/social-facebook.png', href: site.social?.facebook },
    { name: 'LinkedIn', img: '/img/social-linkedin.png', href: site.social?.linkedin },
    { name: 'Instagram', img: '/img/social-instagram.png', href: site.social?.instagram },
    { name: 'Snapchat', img: '/img/social-snapchat.png', href: site.social?.snapchat },
  ].filter((s) => s.href && s.href.trim() !== '');
}
