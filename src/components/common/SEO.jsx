import { Helmet } from 'react-helmet-async';

export default function SEO({
    title,
    description,
    keywords,
    image = '/og-image.jpg',
    url = window.location.href,
    type = 'website',
    schema = null
}) {
    const siteTitle = title ? `${title} | Mitica Cerimonia Roma` : "Mitica Cerimonia Roma e Provincia | Abiti Sposa, Sposo, Cerimonia e 18esimo";
    const metaDescription = description || "Mitica Cerimonia Roma: Atelier specializzato in abiti da Sposa, Sposo, Cerimonia uomo/donna, Damigelle e 18esimo. Sartoria interna ed abiti eleganti per ogni evento a Roma e Provincia.";

    const defaultKeywords = "mitica cerimonia roma, cerimonia roma e provincia, abiti sposa roma, sposo roma, atelier cerimonia roma, vestiti da cerimonia roma, abiti da sera roma, abiti testimone roma, abiti mamma sposa roma, abbigliamento cerimonia roma, abiti 18esimo roma, vestiti 18 anni, abiti eleganti roma, damigelle roma, abiti per damigelle, matrimonio roma";

    const defaultSchema = {
        "@context": "https://schema.org",
        "@type": "ClothingStore",
        "name": "Mitica Cerimonia Roma",
        "logo": "https://miticacerimonia.it/images/logo.png",
        "image": "https://miticacerimonia.it/images/home/hero_bg_user.jpg",
        "@id": "https://miticacerimonia.it",
        "url": "https://miticacerimonia.it",
        "telephone": "+390693579105",
        "priceRange": "€€-€€€",
        "address": {
            "@type": "PostalAddress",
            "streetAddress": "Via dei Prati Fiscali, 325",
            "addressLocality": "Roma",
            "addressRegion": "Lazio",
            "postalCode": "00141",
            "addressCountry": "IT"
        },
        "geo": {
            "@type": "GeoCoordinates",
            "latitude": 41.944,
            "longitude": 12.518
        },
        "openingHoursSpecification": [
            {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
                "opens": "10:00",
                "closes": "13:00"
            },
            {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
                "opens": "15:30",
                "closes": "18:30"
            }
        ],
        "sameAs": [
            "https://www.instagram.com/miticacerimonia/",
            "https://www.facebook.com/miticaboutiqueroma/",
            "https://www.tiktok.com/@mitica_cerimonia"
        ]
    };

    return (
        <Helmet>
            {/* Standard Metadata */}
            <title>{siteTitle}</title>
            <meta name="description" content={metaDescription} />
            <meta name="keywords" content={keywords || defaultKeywords} />
            <link rel="canonical" href={url} />

            {/* Geo Tags for Local SEO */}
            <meta name="geo.region" content="IT-RM" />
            <meta name="geo.placename" content="Roma" />
            <meta name="geo.position" content="41.944;12.518" />
            <meta name="ICBM" content="41.944, 12.518" />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:title" content={siteTitle} />
            <meta property="og:description" content={metaDescription} />
            <meta property="og:image" content={image} />
            <meta property="og:url" content={url} />
            <meta property="og:site_name" content="Mitica Cerimonia Roma" />
            <meta property="og:locale" content="it_IT" />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={siteTitle} />
            <meta name="twitter:description" content={metaDescription} />
            <meta name="twitter:image" content={image} />

            {/* Structured Data (JSON-LD) */}
            <script type="application/ld+json">
                {JSON.stringify(schema || defaultSchema)}
            </script>
        </Helmet>
    );
}
