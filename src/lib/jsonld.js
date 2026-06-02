const DAYS = { Mo: 'Monday', Tu: 'Tuesday', We: 'Wednesday', Th: 'Thursday', Fr: 'Friday', Sa: 'Saturday', Su: 'Sunday' };

export function localBusiness(site) {
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
    image: site.url + '/img/logo-ultimauto.png',
    priceRange: site.priceRange,
    address: {
      '@type': 'PostalAddress',
      streetAddress: site.address.street,
      postalCode: site.address.postalCode,
      addressLocality: site.address.city,
      addressRegion: site.address.region,
      addressCountry: site.address.country,
    },
    geo: { '@type': 'GeoCoordinates', latitude: site.geo.latitude, longitude: site.geo.longitude },
    openingHoursSpecification: (site.openingHours || []).map((o) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: o.days.map((d) => DAYS[d]),
      opens: o.opens,
      closes: o.closes,
    })),
    areaServed: (site.areaServedDepts || []).map((d) => ({ '@type': 'AdministrativeArea', name: 'Département ' + d })),
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
  };
}

export function service({ site, service, url, areaServedName }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: service.nom,
    name: areaServedName ? `${service.nom} à ${areaServedName}` : service.nom,
    description: service.accroche,
    url,
    provider: { '@type': 'AutoRepair', name: site.name, url: site.url, telephone: site.phone },
    areaServed: areaServedName
      ? { '@type': 'City', name: areaServedName }
      : (site.areaServedDepts || []).map((d) => ({ '@type': 'AdministrativeArea', name: 'Département ' + d })),
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

export function article({ title, description, url, datePublished, image, site }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    image,
    datePublished,
    author: { '@type': 'Organization', name: site.name },
    publisher: {
      '@type': 'Organization',
      name: site.name,
      logo: { '@type': 'ImageObject', url: site.url + '/img/logo-ultimauto.png' },
    },
    mainEntityOfPage: url,
  };
}
