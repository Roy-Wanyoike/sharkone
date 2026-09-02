export function WebsiteJsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'SHARKONE',
          url: 'https://sharkone.com',
          description: 'Shop. Ship. Smile. — East Africa\'s premier e-commerce platform',
          potentialAction: {
            '@type': 'SearchAction',
            target: 'https://sharkone.com/search?q={search_term_string}',
            'query-input': 'required name=search_term_string',
          },
        }),
      }}
    />
  );
}

export function OrganizationJsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'SHARKONE',
          url: 'https://sharkone.com',
          logo: 'https://sharkone.com/logo.svg',
          sameAs: [],
          contactPoint: {
            '@type': 'ContactPoint',
            contactType: 'customer service',
            email: 'support@sharkone.com',
          },
        }),
      }}
    />
  );
}

export function ProductJsonLd({ product }: { product: { id: string; name: string; description: string; price: number; image: string; rating: number; category?: { name: string } | null } }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: product.name,
          description: product.description,
          image: product.image,
          offers: {
            '@type': 'Offer',
            price: product.price,
            priceCurrency: 'KSH',
            availability: 'https://schema.org/InStock',
          },
          aggregateRating: product.rating > 0 ? {
            '@type': 'AggregateRating',
            ratingValue: product.rating,
            bestRating: 5,
          } : undefined,
        }),
      }}
    />
  );
}

export function BreadcrumbJsonLd({ items }: { items: { name: string; url: string }[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: item.url,
          })),
        }),
      }}
    />
  );
}
