const DAYS = { Mo: 'Monday', Tu: 'Tuesday', We: 'Wednesday', Th: 'Thursday', Fr: 'Friday', Sa: 'Saturday', Su: 'Sunday' };

const LOGO_IMG = (site) => ({ '@type': 'ImageObject', url: site.url + '/img/logo-ultimauto.png', width: 190, height: 70 });

function parsePrice(s) {
  const str = String(s || '').trim();
  if (str.startsWith('+')) return null; // option/add-on, pas une offre autonome
  const m = str.match(/(\d[\d\s]*)/);
  return m ? m[1].replace(/\s/g, '') : null;
}

// Construit un AggregateOffer (+ Offer[]) à partir d'une catégorie tarifaire (tarifs.json).
export function buildOffers(cat, site) {
  if (!cat || !Array.isArray(cat.formules)) return null;
  const offers = cat.formules
    .map((f) => {
      const price = parsePrice(f.prix);
      if (!price) return null;
      return {
        '@type': 'Offer',
        name: f.nom,
        ...(f.desc ? { description: f.desc } : {}),
        price,
        priceCurrency: 'EUR',
        availability: 'https://schema.org/InStock',
        url: site.url + '/tarifs',
      };
    })
    .filter(Boolean);
  if (!offers.length) return null;
  const nums = offers.map((o) => Number(o.price));
  return {
    '@type': 'AggregateOffer',
    priceCurrency: 'EUR',
    lowPrice: String(Math.min(...nums)),
    highPrice: String(Math.max(...nums)),
    offerCount: offers.length,
    offers,
  };
}

export function localBusiness(site, avis) {
  const reviews = ((avis && avis.items) || []).slice(0, 12).map((r) => ({
    '@type': 'Review',
    author: { '@type': 'Person', name: r.auteur },
    reviewRating: { '@type': 'Rating', ratingValue: String(r.note), bestRating: '5', worstRating: '1' },
    reviewBody: r.texte,
  }));
  return {
    '@context': 'https://schema.org',
    '@type': 'AutoRepair',
    '@id': site.url + '#business',
    name: site.name,
    legalName: site.legalName,
    description: site.baseline,
    url: site.url,
    telephone: site.phone,
    email: site.email,
    image: LOGO_IMG(site),
    logo: LOGO_IMG(site),
    priceRange: site.priceRange,
    ...(site.siren ? { identifier: { '@type': 'PropertyValue', propertyID: 'SIREN', value: site.siren } } : {}),
    address: {
      '@type': 'PostalAddress',
      streetAddress: site.address.street,
      postalCode: site.address.postalCode,
      addressLocality: site.address.city,
      addressRegion: site.address.region,
      addressCountry: site.address.country,
    },
    geo: { '@type': 'GeoCoordinates', latitude: site.geo.latitude, longitude: site.geo.longitude },
    hasMap: 'https://www.google.com/maps/search/?api=1&query=' + site.geo.latitude + ',' + site.geo.longitude,
    openingHoursSpecification: (site.openingHours || []).map((o) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: o.days.map((d) => DAYS[d]),
      opens: o.opens,
      closes: o.closes,
    })),
    areaServed: [
      { '@type': 'AdministrativeArea', name: 'Pays de la Loire' },
      ...(site.areaServedDepts || []).map((d) => ({ '@type': 'AdministrativeArea', name: 'Département ' + d })),
    ],
    sameAs: Object.values(site.social || {}).filter(Boolean),
    ...(site.googleReviewCount
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: site.googleRating,
            reviewCount: site.googleReviewCount,
            bestRating: '5',
            worstRating: '1',
          },
        }
      : {}),
    ...(reviews.length ? { review: reviews } : {}),
  };
}

export function service({ site, service, url, areaServedName, cat }) {
  const offers = buildOffers(cat, site);
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: service.nom,
    name: areaServedName ? `${service.nom} à ${areaServedName}` : service.nom,
    description: service.accroche,
    url,
    provider: { '@type': 'AutoRepair', '@id': site.url + '#business', name: site.name, url: site.url, telephone: site.phone },
    areaServed: areaServedName
      ? { '@type': 'City', name: areaServedName }
      : (site.areaServedDepts || []).map((d) => ({ '@type': 'AdministrativeArea', name: 'Département ' + d })),
    ...(offers ? { offers } : {}),
  };
}

export function faqPage(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((i) => ({
      '@type': 'Question',
      name: i.q,
      acceptedAnswer: { '@type': 'Answer', text: i.r },
    })),
  };
}

export function breadcrumb(list) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: list.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: it.url })),
  };
}

export function organization(site) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': site.url + '#org',
    name: site.name,
    legalName: site.legalName,
    url: site.url,
    logo: site.url + '/img/logo-ultimauto.png',
    image: site.url + '/img/logo-ultimauto.png',
    telephone: site.phone,
    email: site.email,
    ...(site.siren ? { identifier: { '@type': 'PropertyValue', propertyID: 'SIREN', value: site.siren } } : {}),
    sameAs: Object.values(site.social || {}).filter(Boolean),
  };
}

export function website(site) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': site.url + '#website',
    name: site.name,
    url: site.url,
    inLanguage: 'fr-FR',
    publisher: { '@id': site.url + '#org' },
  };
}

export function article({ title, description, url, datePublished, dateModified, image, wordCount, site }) {
  return {
    '@context': 'https://schema.org',
    '@type': ['Article', 'BlogPosting'],
    headline: title,
    description,
    image,
    inLanguage: 'fr-FR',
    isAccessibleForFree: true,
    datePublished,
    dateModified: dateModified || datePublished,
    ...(wordCount ? { wordCount } : {}),
    author: {
      '@type': 'Person',
      name: 'Ronan',
      jobTitle: 'Spécialiste décalaminage & dépollution moteur',
      worksFor: { '@type': 'Organization', name: site.name, '@id': site.url + '#org' },
      knowsAbout: ['Décalaminage hydrogène', 'Nettoyage FAP', 'Reprogrammation moteur', 'AdBlue', 'Dépollution moteur'],
      url: site.url + '/expertise',
    },
    publisher: {
      '@type': 'Organization',
      name: site.name,
      url: site.url,
      logo: { '@type': 'ImageObject', url: site.url + '/img/logo-ultimauto.png' },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    speakable: { '@type': 'SpeakableSpecification', cssSelector: ['h1', '.rte'] },
  };
}
