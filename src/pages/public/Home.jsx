import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Star, Phone, MessageCircle, MapPin } from 'lucide-react';
import WhatsAppButton from '../../components/functionality/WhatsAppButton';
import AppointmentModal from '../../components/functionality/AppointmentModal';
import WelcomePopup from '../../components/functionality/WelcomePopup';
import ProductCard from '../../components/products/ProductCard';
import { useAuth } from '../../contexts/AuthContext';
import { ProductCardSkeleton } from '../../components/ui/Skeleton';
import { isWithinLast90Days } from '../../utils/dateUtils';
import SEO from '../../components/common/SEO';
import NewsletterSignup from '../../components/functionality/NewsletterSignup';
import AddressSelector from '../../components/functionality/AddressSelector';
import { reviewsPool } from '../../data/reviews';

// Helper Component for smooth image transitions
const AtmosphereCard = ({ cat, i, galleries, atmosphereGalleries, atmosphereIndex }) => {
    const dynamicImages = galleries[cat.key];
    const images = (dynamicImages && dynamicImages.length > 0) ? dynamicImages : (atmosphereGalleries[cat.key] || []);
    const targetImage = images.length > 0 ? images[atmosphereIndex % images.length] : null;

    const [displayImage, setDisplayImage] = useState(targetImage);

    // Preload next image and only update when ready
    useEffect(() => {
        if (!targetImage) return;

        const img = new Image();
        img.src = targetImage;
        img.onload = () => {
            setDisplayImage(targetImage);
        };
    }, [targetImage]);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: i * 0.1, ease: "easeOut" }}
            className={`${i === 1 || i === 3 ? 'md:mt-8' : ''}`}
        >
            <Link to={cat.link} className="block group relative bg-white p-3 rounded-[2.5rem] transition-all duration-500 hover:shadow-2xl hover:shadow-primary-900/10 border border-transparent hover:border-gray-100">
                <div className="relative aspect-[3/4] rounded-[2rem] overflow-hidden bg-gray-100">
                    <AnimatePresence mode="popLayout">
                        {displayImage && (
                            <motion.img
                                key={displayImage}
                                src={displayImage}
                                alt={cat.name}
                                initial={{ opacity: 0, scale: 1.1 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }} // Smooth crossfade: old one fades out while new one fades in (absolute positioning allows overlap)
                                transition={{ duration: 1.2, ease: "easeInOut" }} // Slower, deeper transition
                                className="w-full h-full object-cover absolute inset-0 will-change-transform"
                            />
                        )}
                    </AnimatePresence>

                    {/* Loading State if no images */}
                    {!displayImage && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                            <div className="animate-pulse w-full h-full bg-gray-200" />
                        </div>
                    )}

                    {/* Glass Overlay with "Esplora" Text */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-auto px-8 py-3 bg-primary-950/40 backdrop-blur-md border border-white/20 rounded-full opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-500 flex items-center justify-center z-10 shadow-xl">
                        <span className="text-white uppercase tracking-[0.2em] text-xs font-bold">
                            Esplora
                        </span>
                    </div>
                </div>
                <div className="p-4 text-center">
                    <h3 className="text-xl font-serif text-stone-800 italic">{cat.name}</h3>
                </div>
            </Link>
        </motion.div>
    );
};

export default function Home() {
    const { currentUser } = useAuth();
    const [allNewArrivals, setAllNewArrivals] = useState([]);
    const [newArrivals, setNewArrivals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
    const [isWelcomePopupOpen, setIsWelcomePopupOpen] = useState(false);
    const [atmosphereIndex, setAtmosphereIndex] = useState(0);
    const [reviews, setReviews] = useState([]);

    const atmosphereGalleries = {
        sposa: [
            '/images/sposa/1383-311608-2_full-scaled.jpg',
            '/images/sposa/1116-310649-f_full-scaled.jpg',
            '/images/sposa/1123-310686-f_full-dettaglio-2-scaled.jpg'
        ],
        sposo: [
            '/images/uomo/1601.jpg',
            '/images/uomo/AV-2020-INDOSSATO-01.jpg',
            '/images/uomo/C110-1945-001-A1.jpg'
        ],
        donna: [
            '/images/donna/12.jpg',
            '/images/donna/2.jpg',
            '/images/donna/527_2-600x900-1.jpg'
        ],
        uomo_cer: [
            '/images/uomo/C110-1945-001-A1.jpg',
            '/images/uomo/C220-1910L-C3.jpg',
            '/images/uomo/C234RR370-1910-004-F1.jpg'
        ]
    };

    useEffect(() => {
        // Randomize reviews on mount
        const shuffled = [...reviewsPool].sort(() => 0.5 - Math.random());
        setReviews(shuffled.slice(0, 3));
    }, []);

    useEffect(() => {
        // Suppress popup for authorized users (Admin)
        if (currentUser) return;

        const hasSeenWelcome = sessionStorage.getItem('welcomeShown');

        if (!hasSeenWelcome) {
            setIsWelcomePopupOpen(true);
            sessionStorage.setItem('welcomeShown', 'true');
        }
        // Manual close only, so no auto-close timer here as per previous request.
    }, [currentUser]);

    useEffect(() => {
        const fetchNewArrivals = async () => {
            try {
                // Fetch a larger pool of recent products to ensure we have enough diversity for a mix
                // We fetch 50-60 items to filter in memory, avoiding complex composite indexes
                let products = [];
                try {
                    const q = query(collection(db, "products"), orderBy("created_at", "desc"), limit(60));
                    const querySnapshot = await getDocs(q);
                    products = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                } catch (e) {
                    console.warn("Primary sort failed, trying fallback...", e);
                    const qFallback = query(collection(db, "products"), limit(60));
                    const fallbackSnapshot = await getDocs(qFallback);
                    products = fallbackSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    // Client-side sort if DB sort failed
                    products.sort((a, b) => {
                        const getDate = (d) => d?.seconds ? d.seconds : new Date(d).getTime() / 1000;
                        return getDate(b.created_at || b.createdAt) - getDate(a.created_at || a.createdAt);
                    });
                }

                // 1. Universal Filter (Images + Not Promo + Not Accessories)
                const validProducts = products.filter(p => {
                    const pCat = (p.category || p.Categoria || '').toLowerCase();
                    const pSub = (p.subcategory || p.Sub_Categoria || '').toLowerCase();
                    const pName = (p.name || '').toLowerCase();

                    // Exclude invalid
                    if (p.is_promo) return false;
                    if (!p.images || p.images.length === 0) return false;

                    // Exclude Accessori/Scarpe/Bambini keywords
                    const exclusionKeywords = ['accessori', 'scarpe', 'cravatt', 'papillon', 'cintur', 'velo', 'gemelli', 'calz', 'intim', 'bors', 'bijoux', 'gioiell', 'pocchet', 'fasci', 'stola', 'stole', 'guanti', 'scarpa', 'bambin', 'battesimo', 'comunione', 'cresima'];

                    const isExcluded = [pCat, pSub].some(field =>
                        exclusionKeywords.some(k => field.includes(k))
                    );

                    return !isExcluded;
                });

                // 2. Split into Men and Women
                const womenItems = [];
                const menItems = [];

                validProducts.forEach(p => {
                    const pCat = (p.category || p.Categoria || '').toLowerCase();
                    const pSub = (p.subcategory || p.Sub_Categoria || '').toLowerCase();
                    const pName = (p.name || '').toLowerCase();

                    const isMan = pCat.includes('uomo') || pCat.includes('sposo') || pSub.includes('uomo') || pSub.includes('sposo') || pName.includes('sposo');

                    if (isMan) {
                        menItems.push(p);
                    } else {
                        // Default to women if not clearly man (and not excluded above)
                        womenItems.push(p);
                    }
                });

                // 3. Interleave (Mix) - 1 Woman, 1 Man, 1 Woman...
                // "Mix di uomo e donna in base agli arrivi"
                const mixedArrivals = [];
                const maxLen = Math.max(womenItems.length, menItems.length);

                for (let i = 0; i < maxLen; i++) {
                    if (womenItems[i]) mixedArrivals.push(womenItems[i]);
                    if (menItems[i]) mixedArrivals.push(menItems[i]);
                }

                // 4. Final Limit
                const finalSelection = mixedArrivals.slice(0, 12); // Show top 12 mixed

                setAllNewArrivals(finalSelection);
                setNewArrivals(finalSelection.slice(0, 8)); // Initial visible set

            } catch (error) {
                console.error("Critical error fetching new arrivals:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchNewArrivals();
    }, []);

    // Auto-cycle products every 10 seconds


    // Atmosphere Auto-rotation
    useEffect(() => {
        const interval = setInterval(() => {
            setAtmosphereIndex(prev => (prev + 1) % 1000); // Increased modulus to avoid frequent wrap-around affecting modulo keys
        }, 8000); // Slower rotation (8s)
        return () => clearInterval(interval);
    }, []);

    // NEW: Fetch Dynamic Galleries
    const [galleries, setGalleries] = useState({
        sposa: [],
        sposo: [],
        donna: [],
        uomo_cer: []
    });

    useEffect(() => {
        const fetchGalleries = async () => {
            try {
                // Fetch latest 100 products globally (avoids composite index issues)
                const q = query(
                    collection(db, "products"),
                    orderBy("created_at", "desc"),
                    limit(100)
                );

                const snapshot = await getDocs(q);
                // Handle potential missing created_at or other failures gracefully
                const products = snapshot.docs.map(doc => doc.data());

                const getImagesFor = (cat, sub) => {
                    const normalizedCat = cat.toLowerCase();
                    const normalizedSub = sub.toLowerCase();

                    return products
                        .filter(p => {
                            if (p.is_promo) return false; // Exclude promo items

                            const pCat = (p.category || p.Categoria || '').toLowerCase(); // Handle both field names
                            const pSub = (p.subcategory || p.Sub_Categoria || '').toLowerCase();

                            // Check for category match (strict) and subcategory partial match
                            return pCat === normalizedCat && pSub.includes(normalizedSub);
                        })
                        .map(p => {
                            if (p.thumbnails && p.thumbnails.length > 0) return p.thumbnails[0];
                            if (p.images && p.images.length > 0) return p.images[0];
                            return null;
                        })
                        .filter(img => img !== null)
                        .slice(0, 5);
                };

                const sposaImages = getImagesFor('Donna', 'Sposa');
                const sposoImages = getImagesFor('Uomo', 'Sposo');
                const donnaImages = getImagesFor('Donna', 'Cerimonia');
                const uomoCImages = getImagesFor('Uomo', 'Cerimonia');

                setGalleries({
                    sposa: sposaImages, // Will be empty array if none found, triggering logic to use fallback if length check is done
                    sposo: sposoImages,
                    donna: donnaImages,
                    uomo_cer: uomoCImages
                });

            } catch (e) {
                console.warn("Error fetching galleries (fallback active):", e);
                // Fallback implicitly happens because galleries state remains empty arrays
            }
        };

        fetchGalleries();
    }, []);

    // Update visible products when index or all list changes


    // Schema.org Structured Data
    const localBusinessSchema = {
        "@context": "https://schema.org",
        "@type": "ClothingStore",
        "name": "Mitica Cerimonia",
        "image": "https://miticacerimonia.it/images/home/hero_bg_user.jpg",
        "@id": "https://miticacerimonia.it",
        "url": "https://miticacerimonia.it",
        "telephone": "+390693579105",
        "priceRange": "€€",
        "address": {
            "@type": "PostalAddress",
            "streetAddress": "Via dei Prati Fiscali 325",
            "addressLocality": "Roma",
            "addressRegion": "Lazio",
            "postalCode": "00141",
            "addressCountry": "IT"
        },
        "geo": {
            "@type": "GeoCoordinates",
            "latitude": 41.9567,
            "longitude": 12.5285
        },
        "openingHoursSpecification": [
            { "@type": "OpeningHoursSpecification", "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], "opens": "09:30", "closes": "13:00" },
            { "@type": "OpeningHoursSpecification", "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], "opens": "16:00", "closes": "19:30" }
        ],
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "reviewCount": "52"
        }
    };

    return (
        <div className="bg-white">
            <SEO
                title="Abiti da Sposa, Sposo, Cerimonia e 18esimo a Roma"
                description="Cerchi un Atelier a Roma e Provincia? Mitica Cerimonia ti aspetta in Via dei Prati Fiscali con le nuove collezioni Sposa, Sposo, Cerimonia, Damigelle e 18esimo. Prenota la tua prova."
            />

            {/* HER0 SECTION */}
            <section className="relative h-screen w-full flex items-center justify-center overflow-hidden bg-black text-white">
                <div className="absolute inset-0 z-0">
                    <img
                        src="/images/home/hero_bg_user.jpg"
                        alt="Atelier Preview"
                        fetchPriority="high"
                        className="w-full h-full object-cover object-center"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-primary-950/40 to-black/90" />
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className="relative z-10 text-center px-6 max-w-5xl"
                >

                    <h1 className="text-5xl sm:text-7xl md:text-9xl lg:text-[10rem] font-serif mb-8 sm:mb-12 leading-[0.9] tracking-tighter drop-shadow-2xl text-white">
                        Mitica <br /><span className="italic text-white">Cerimonia.</span>
                    </h1>

                    <div className="flex flex-col md:flex-row gap-8 justify-center">
                        <Link
                            to="/catalog?category=Sposa&target=Donna"
                            className="group relative px-12 py-5 border border-white/30 overflow-hidden transition-all hover:border-white active:border-white bg-white/5 backdrop-blur-sm rounded-full"
                        >
                            <span className="relative z-10 uppercase text-[10px] sm:text-xs tracking-[0.2em] sm:tracking-[0.3em] font-bold text-white group-hover:text-black group-active:text-black transition-colors flex items-center gap-2 sm:gap-3">
                                Scopri Sposa <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                            </span>
                            <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 group-active:translate-y-0 transition-transform duration-500 ease-out" />
                        </Link>

                        <Link
                            to="/catalog?category=Sposo&target=Uomo"
                            className="group relative px-12 py-5 border border-white/30 overflow-hidden transition-all hover:border-white active:border-white bg-white/5 backdrop-blur-sm rounded-full"
                        >
                            <span className="relative z-10 uppercase text-[10px] sm:text-xs tracking-[0.2em] sm:tracking-[0.3em] font-bold text-white group-hover:text-black group-active:text-black transition-colors flex items-center gap-2 sm:gap-3">
                                Scopri Sposo <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                            </span>
                            <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 group-active:translate-y-0 transition-transform duration-500 ease-out" />
                        </Link>
                    </div>

                    <div className="mt-8 flex justify-center">
                        <button
                            onClick={() => setIsAppointmentModalOpen(true)}
                            className="group relative px-16 py-6 border-2 border-white bg-transparent text-white font-serif text-lg md:text-xl font-bold uppercase tracking-[0.2em] rounded-full shadow-2xl overflow-hidden transition-all hover:scale-105 active:scale-95"
                        >
                            <span className="relative z-10 flex items-center gap-2 sm:gap-3 transition-colors group-hover:text-black text-sm sm:text-base md:text-lg">
                                <span className="hidden sm:inline">Prendi il tuo appuntamento</span>
                                <span className="sm:hidden">Prenota</span>
                                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                            </span>
                            <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 group-active:translate-y-0 transition-transform duration-500 ease-out" />
                        </button>
                    </div>
                </motion.div>

                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
                    <span className="text-[10px] uppercase tracking-[0.6em] opacity-90 text-white font-bold drop-shadow-md">Esplora</span>
                    <div className="w-[1.5px] h-16 bg-gradient-to-b from-white to-transparent opacity-80" />
                </div>
            </section>

            {/* NEW ARRIVALS (SCROLL ORIZZONTALE) */}
            <section className="py-20 bg-white">
                <div className="max-w-[90rem] mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-12">
                        <div>
                            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-primary-950 mb-4">Nuovi Arrivi</h2>
                            <div className="w-24 h-[3px] bg-primary-900" />
                        </div>
                    </div>

                    {/* Infinite Marquee of New Arrivals */}
                    {loading ? (
                        <div className="flex gap-4 overflow-hidden mask-gradient-x">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="min-w-[180px] md:min-w-[280px]">
                                    <ProductCardSkeleton />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="w-full overflow-hidden relative group">
                            {/* Gradient Masks */}
                            <div className="absolute inset-y-0 left-0 w-12 md:w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
                            <div className="absolute inset-y-0 right-0 w-12 md:w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

                            <motion.div
                                className="flex gap-4 md:gap-8 w-max px-4"
                                animate={{ x: ["0%", "-50%"] }}
                                transition={{
                                    ease: "linear",
                                    duration: 60, // Slower, smoother scroll
                                    repeat: Infinity
                                }}
                                style={{ willChange: "transform" }}
                            >
                                {/* Double the list of ALL mixed arrivals for seamless loop */}
                                {[...allNewArrivals, ...allNewArrivals].map((product, i) => (
                                    <div key={`${product.id}-${i}`} className="w-[200px] md:w-[300px] flex-shrink-0">
                                        <ProductCard product={product} priority={true} minimal />
                                    </div>
                                ))}
                            </motion.div>
                        </div>
                    )}
                </div>
            </section >

            {/* ATMOSPHERE SECTION (SMALLER & DYNAMIC) */}
            <section className="py-24 px-6 max-w-7xl mx-auto bg-primary-50/30">
                <div className="text-center mb-12 space-y-3">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-primary-900 font-bold uppercase tracking-[0.4em] text-[9px] mb-2">Abiti Cerimonia Roma e Provincia</h2>
                        <h3 className="text-2xl sm:text-3xl md:text-5xl font-serif italic tracking-tighter text-black">Per Ogni Evento Speciale: Dal Matrimonio ai 18 Anni</h3>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl mx-auto">
                    {[
                        { name: 'Sposa Couture', key: 'sposa', link: '/catalog?category=Donna&subcategory=Sposa' },
                        { name: 'Sposo Excellence', key: 'sposo', link: '/catalog?category=Uomo&subcategory=Sposo' },
                        { name: 'Cerimonia Donna', key: 'donna', link: '/catalog?category=Donna&subcategory=Cerimonia' },
                        { name: 'Cerimonia Uomo', key: 'uomo_cer', link: '/catalog?category=Uomo&subcategory=Cerimonia' }
                    ].map((cat, i) => (
                        <AtmosphereCard
                            key={i}
                            cat={cat}
                            i={i}
                            galleries={galleries}
                            atmosphereGalleries={atmosphereGalleries}
                            atmosphereIndex={atmosphereIndex}
                        />
                    ))}
                </div>
            </section>

            {/* Reviews Section */}
            <section className="py-32 bg-primary-50 relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
                        <div>
                            <h2 className="text-primary-800 text-xs font-bold uppercase tracking-[0.4em] mb-4">Testimonianze</h2>
                            <h3 className="text-3xl sm:text-4xl md:text-5xl font-serif italic text-primary-950">Cosa dicono di noi</h3>
                            <p className="text-gray-600 text-sm mt-4 font-medium">
                                ⭐ 4.8/5 · Basato su oltre 50 recensioni verificate
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <a
                                href="https://maps.app.goo.gl/78LUNiqrQyCQJEmJA"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="relative overflow-hidden inline-flex items-center justify-center gap-2 text-primary-900 font-bold uppercase tracking-widest text-[10px] border border-primary-900 px-8 py-3 rounded-full transition-all duration-300 hover:shadow-xl hover:shadow-primary-900/30 hover:-translate-y-1 active:scale-95 group"
                            >
                                <span className="relative z-20 flex items-center gap-2 group-hover:text-primary-900 group-active:text-primary-900 transition-colors duration-300">
                                    Tutte le recensioni Google <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                </span>
                                <div className="absolute inset-0 bg-primary-400 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out z-10" />
                            </a>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="flex overflow-x-auto pb-8 gap-8 scrollbar-hide snap-x">
                            {reviews.map((review, i) => (
                                <motion.div
                                    key={i}
                                    className="min-w-[320px] md:min-w-[400px] bg-white p-10 rounded-[2.5rem] shadow-lg border border-primary-50 flex flex-col justify-between"
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                >
                                    <div>
                                        <div className="flex gap-1 mb-6 text-yellow-500">
                                            {[...Array(review.rating)].map((_, idx) => <Star key={idx} size={14} fill="currentColor" />)}
                                        </div>
                                        <p className="text-gray-600 italic leading-relaxed mb-8 font-light text-sm md:text-base">
                                            &quot;{review.text}&quot;
                                        </p>
                                    </div>
                                    <div className="flex justify-between items-center border-t border-gray-50 pt-6">
                                        <span className="font-serif italic text-primary-950">{review.name}</span>
                                        <span className="text-[10px] uppercase tracking-widest text-primary-400 font-bold">{review.source}</span>
                                    </div>
                                </motion.div>
                            ))
                            }
                        </div>
                    </div>
                </div>
            </section>

            {/* NEWSLETTER / CLUB SIGNUP */}
            <NewsletterSignup />

            {/* MAISON & MAP PREVIEW */}
            < section className="py-24 px-6 max-w-7xl mx-auto" >
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div className="space-y-8 order-2 md:order-1">
                        <div className="relative h-[350px] w-full bg-gray-100 overflow-hidden group border border-gray-200 shadow-sm rounded-[2.5rem]">
                            {/* Map Overlay content */}
                            <iframe
                                src={`https://maps.google.com/maps?q=Mitica%20Cerimonia%2C%20Via%20dei%20Prati%20Fiscali%20325%2C%20Roma&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                                className="absolute inset-0 w-full h-full border-0"
                                loading="lazy"
                                title="Posizione Atelier"
                            ></iframe>
                        </div>
                    </div>

                    <div className="space-y-6 order-1 md:order-2">
                        <h2 className="text-3xl sm:text-4xl md:text-6xl font-serif italic leading-none text-black">
                            Dove la tua idea di <br /><span className="text-primary-900 not-italic">abito si realizza.</span>
                        </h2>
                        <p className="text-gray-500 text-sm leading-relaxed font-light max-w-md tracking-wide mb-4">
                            Riserviamo sessioni di prova private per garantire la massima attenzione ad ogni dettaglio del tuo giorno speciale.
                        </p>

                        <AddressSelector
                            address="Mitica Cerimonia, Via dei Prati Fiscali 325, Roma"
                            displayText="Via dei Prati Fiscali 325, Roma"
                        />

                        <div className="pt-4">
                            {!currentUser && (
                                <button
                                    onClick={() => setIsAppointmentModalOpen(true)}
                                    className="relative overflow-hidden inline-flex items-center justify-center gap-2 bg-black text-white font-bold uppercase tracking-widest text-[10px] border border-black px-8 py-4 rounded-full transition-all duration-300 hover:text-primary-900 hover:shadow-xl hover:shadow-primary-900/30 hover:-translate-y-1 active:scale-95 group"
                                >
                                    <span className="relative z-20 flex items-center gap-2 group-hover:text-primary-900 group-active:text-primary-900 transition-colors duration-300">
                                        <Star size={14} /> Prenota il tuo appuntamento
                                    </span>
                                    <div className="absolute inset-0 bg-primary-400 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out z-10" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </section >

            <WelcomePopup
                isOpen={isWelcomePopupOpen}
                onClose={() => setIsWelcomePopupOpen(false)}
                onBook={() => {
                    setIsWelcomePopupOpen(false);
                    setIsAppointmentModalOpen(true);
                }}
            />

            <AppointmentModal
                isOpen={isAppointmentModalOpen}
                onClose={() => setIsAppointmentModalOpen(false)}
            />
        </div >
    );
}
