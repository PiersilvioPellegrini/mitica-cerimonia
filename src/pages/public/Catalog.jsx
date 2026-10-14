import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';
import FilterSidebar from '../../components/products/FilterSidebar';
import WhatsAppButton from '../../components/functionality/WhatsAppButton';
import ContactRequestModal from '../../components/functionality/ContactRequestModal';
import { Search, SlidersHorizontal, ChevronRight, X, AlertTriangle } from 'lucide-react';
import ProductCard from '../../components/products/ProductCard';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import { ProductCardSkeleton } from '../../components/ui/Skeleton';
import { getColorSortIndex, normalizeColor } from '../../utils/colorUtils';
import SEO from '../../components/common/SEO';

const ITEMS_PER_PAGE = 24;

export default function Catalog() {
    const { currentUser } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const initialCategory = searchParams.get('category');
    const initialTarget = searchParams.get('target');
    const initialSub = searchParams.get('subcategory');

    const [allProducts, setAllProducts] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);

    const [availableColors, setAvailableColors] = useState([]);
    const [availableSizes, setAvailableSizes] = useState([]);
    const [availableSeasons, setAvailableSeasons] = useState([]);
    const [availableSubcategories, setAvailableSubcategories] = useState([]);
    const [availableProductTypes, setAvailableProductTypes] = useState([]);

    const [filters, setFilters] = useState({
        categories: initialCategory ? [initialCategory] : [],
        subcategories: initialSub ? [initialSub] : [],
        target: initialTarget || '',
        sizes: [],
        colors: [],
        minPrice: '',
        maxPrice: '',
        product_types: []
    });
    const isPromoMode = filters.categories.includes('Promozione');


    useEffect(() => {
        const params = new URLSearchParams();
        if (filters.categories.length > 0) params.set('category', filters.categories[0]);
        if (filters.subcategories.length > 0) params.set('subcategory', filters.subcategories[0]);
        if (filters.target) params.set('target', filters.target);
        setSearchParams(params, { replace: true });
    }, [filters.categories, filters.target, setSearchParams]);

    // Data Loading & Pre-processing (Cache-First + Stale-While-Revalidate Strategy)
    useEffect(() => {
        // RESET Logic: Listen to URL changes to handle Back Button or External Links.
        // We only update state if it DIFFERS from the URL, to avoid overriding user interaction loops.

        const urlCategory = initialCategory || '';
        const stateCategory = filters.categories[0] || '';

        const urlSub = initialSub || '';
        const stateSub = filters.subcategories[0] || '';

        const urlTarget = initialTarget || '';
        const stateTarget = filters.target || '';

        const hasChanged =
            urlCategory !== stateCategory ||
            urlSub !== stateSub ||
            urlTarget !== stateTarget;

        if (hasChanged) {
            setFilters(prev => ({
                ...prev,
                categories: initialCategory ? [initialCategory] : [],
                subcategories: initialSub ? [initialSub] : [],
                target: initialTarget || '',
            }));
        }
    }, [initialCategory, initialTarget, initialSub, location.search]);

    // Data Loading & Pre-processing (Cache-First + Stale-While-Revalidate Strategy)
    useEffect(() => {
        const loadProducts = async () => {
            const CACHE_KEY = 'mitica_catalog_cache_v3';
            const CACHE_DURATION = 1000 * 60 * 60 * 24; // 24 Hours

            // 1. FAST LOAD: Check LocalStorage Cache
            const cachedWrapper = localStorage.getItem(CACHE_KEY);
            let hasCachedData = false;

            if (cachedWrapper) {
                try {
                    const { data, timestamp } = JSON.parse(cachedWrapper);
                    const isFresh = (Date.now() - timestamp) < CACHE_DURATION;

                    if (data && Array.isArray(data)) {
                        setAllProducts(data);
                        setLoading(false); // Immediate interaction
                        hasCachedData = true;

                        // If cache is fresh, we *could* skip network, but for a catalog it's better to background update.
                        // However, if we want to save reads, we can skip if very fresh (< 5 mins?).
                        // For now, we always fetch latest in background to ensure stock/promo updates.
                    }
                } catch (e) {
                    console.warn("Cache parsing failed", e);
                }
            } else {
                if (!hasCachedData) setLoading(true);
            }

            try {
                // 2. BACKGROUND FETCH: Fresh Data from Firestore (Persistence Enabled)
                const querySnapshot = await getDocs(collection(db, "products"));

                // Pre-process / Normalize data ONCE upon fetching
                const processed = querySnapshot.docs.map(doc => {
                    const data = doc.data();
                    // Pre-calculate normalized fields for fast filtering
                    return {
                        id: doc.id,
                        ...data,
                        _cat: (data.category || data.Categoria || data.reparto || 'Donna').toLowerCase().trim(),
                        _sub: (data.subcategory || data.Sub_Categoria || data.Sottocategoria || data.Tipologia || '').toLowerCase().trim(),
                        _name: (data.name || '').toLowerCase(),
                        _type: (data.macro_tipo === 'Abito' ? 'Abiti Lunghi' : (data.macro_tipo === 'Completo' ? 'Completi/Pantaloni/Abiti Corti' : (data.macro_tipo || 'Abiti Lunghi'))),
                        _colors: (data.variants && data.variants.length > 0)
                            ? data.variants.map(v => normalizeColor(v.color))
                            : (data.available_colors ? data.available_colors.map(c => normalizeColor(c)) : (data.color ? [normalizeColor(data.color)] : [])),
                        _sizes: (data.variants && data.variants.length > 0)
                            ? data.variants.map(v => v.size)
                            : (data.size ? [data.size] : []),
                        // Pre-calculate Flags
                        _hasMedia: (data.images && data.images.length > 0) || !!data.videoUrl,
                        _isPromo: !!data.is_promo,
                        _promoPrice: data.promo_price ? parseFloat(data.promo_price) : 0,
                        _date: (data.created_at?.seconds || data.createdAt?.seconds || 0)
                    };
                });

                // Update Cache and State
                localStorage.setItem(CACHE_KEY, JSON.stringify({
                    timestamp: Date.now(),
                    data: processed
                }));
                setAllProducts(processed);

            } catch (error) {
                console.error("Error loading catalogue:", error);
            } finally {
                setLoading(false);
            }
        };
        loadProducts();
    }, []);

    // 2. Sorting (Client Side) - Fast on pre-processed data
    // 2. Sorting (Client Side) - Fast on pre-processed data
    const sortedProducts = useMemo(() => {
        return [...allProducts].sort((a, b) => {
            // PROMO MODE: Sort by Price Ascending (Cheapest First)
            if (isPromoMode) {
                return (a._promoPrice || 0) - (b._promoPrice || 0);
            }

            // STANDARD MODE: Sort by Date (Day) -> Color -> Time
            // 1. Group by Day of Upload (Newest Days First)
            // This ensures "Last Uploaded" are seen first, but grouping preserves color sorting within batches.
            const dayA = Math.floor(a._date / 86400);
            const dayB = Math.floor(b._date / 86400);

            if (dayA !== dayB) return dayB - dayA; // Newest Day First

            // 2. Sort by Color Index (within the same day)
            const colA = a._colors[0] || '';
            const colB = b._colors[0] || '';
            const colorDiff = getColorSortIndex(colA) - getColorSortIndex(colB);

            if (colorDiff !== 0) return colorDiff;

            // 3. Tie-breaker: Exact Time (Newest First)
            return b._date - a._date;
        });
    }, [allProducts, isPromoMode]);

    // 3. OPTIMIZED SINGLE-PASS FILTERING
    const { products: filteredList, facets } = useMemo(() => {
        const resultProducts = [];
        const facetSubcats = new Set();
        const facetColors = new Set();
        const facetSizes = new Set();
        const facetTypes = new Set();

        // Cached Filter Values
        const activeCats = filters.categories.filter(c => c !== 'Promozione');
        if (filters.target) activeCats.push(filters.target);
        const isPromoFilter = filters.categories.includes('Promozione');

        const wantedSubs = filters.subcategories;
        const wantedColors = filters.colors;
        const wantedSizes = filters.sizes;
        const wantedTypes = filters.product_types;
        const minP = filters.minPrice ? parseFloat(filters.minPrice) : 0;
        const maxP = filters.maxPrice ? parseFloat(filters.maxPrice) : Infinity;

        // Helper: Check Category Match
        const checkCategory = (p) => {
            if (!p._hasMedia) return false;

            // Promo Check
            if (isPromoFilter) {
                if (!p._isPromo && p._promoPrice <= 0) return false;
            } else {
                if (p._isPromo) return false;
            }

            const pCat = p._cat;
            const pSub = p._sub;
            const pName = p._name;

            // Heuristics for Gender
            const isManItem = pCat === 'uomo' || pCat === 'sposo' || pSub.includes('uomo') || pSub.includes('sposo') || pName.includes('sposo') || pSub.includes('cravatt') || pSub.includes('papillon') || pSub.includes('gemelli');
            const isWomanItem = pCat === 'donna' || pCat === 'sposa' || pSub.includes('donna') || pSub.includes('sposa') || pName.includes('sposa') || pSub.includes('velo') || pSub.includes('stola');

            // TARGET COMPATIBILITY CHECK
            if (filters.target) {
                const target = filters.target.toLowerCase();
                // If Target is Donna, exclude explicit Man items
                if ((target === 'donna' || target === 'sposa') && isManItem && !isWomanItem) return false;

                // If Target is Uomo, exclude explicit Woman items
                if ((target === 'uomo' || target === 'sposo') && isWomanItem && !isManItem) return false;
            }

            if (activeCats.length === 0) return true; // Show all if no category

            // 1. CLASSIFICATION FLAGS
            const isClothing = pSub.includes('abito') || pName.includes('abito') || pSub.includes('completo') || pName.includes('completo') ||
                pSub.includes('giacca') || pSub.includes('pantalon') || pName.includes('giacca') || pName.includes('pantalon') ||
                pSub.includes('camicia') || pName.includes('camicia');

            const isShoe = p._sub === 'scarpe' || p._cat === 'scarpe' || p._sub === 'sandali' || p._sub === 'sandalo' || p._sub === 'decollete' || p._sub === 'sneaker' || p._sub === 'sneakers';

            const isAccessory = (pCat === 'accessori' || pSub === 'accessori' ||
                pSub.includes('pochette') || pSub.includes('cravatt') || pSub.includes('papillon') ||
                pSub.includes('cintur') || pSub.includes('intimo') || pSub.includes('bijou') || pSub.includes('velo') ||
                pSub.includes('bors') || pSub.includes('stola') || pSub.includes('guanti') || pSub.includes('gemelli')
            ) && !isClothing && !isShoe;

            const isKid = pCat.includes('bambin') || pSub.includes('bambin') || pSub.includes('comunione');

            // 2. MATCHING AGAINST ACTIVE CATS
            // Logic ported from previous applyFilters but simplified

            // PROMO SUB-FILTERING: If 'Promozione' is active, activeCats might be empty OR contain sub-targets like 'Donna'
            // If isPromoFilter is true, we already passed the Promo check.
            // Now we check if p matches the "Sub Targets" (Donna, Uomo) if any are selected.
            // In the new UI, Promo uses 'subcategories' state for the Department list inside Promo.
            // So if isPromoFilter is TRUE, the "Category" check is practically done (it's valid).
            // The "Subcategory" check (managed below) will handle 'Donna'/'Uomo' for Promo.
            // 2. MATCHING AGAINST ACTIVE CATS
            // Sub-filtering "Promozione" (Departments)
            if (isPromoFilter) return true;

            const wantsDonna = activeCats.includes('Donna');
            const wantsUomo = activeCats.includes('Uomo');
            const wantsBambini = activeCats.includes('Bambini');
            const wantsAccessori = activeCats.includes('Accessori') || filters.subcategories.includes('Accessori');
            const wantsScarpe = activeCats.includes('Scarpe') || filters.subcategories.includes('Scarpe');

            // If no category selected, show all valid items (not promos)
            if (activeCats.length === 0) return true;

            // STRICT MATCHING
            // An item is visible if it matches AT LEAST ONE of the selected main categories.

            let isMatch = false;

            // 1. Check Uomo
            if (wantsUomo && pCat === 'uomo') {
                // If user specifically wants Accessori/Scarpe, DO NOT generic match Uomo items unless they ARE Accessori/Scarpe
                if ((wantsAccessori || wantsScarpe) && !isAccessory && !isShoe) {
                    isMatch = false;
                }
                else if (!wantsAccessori && !wantsScarpe && (isAccessory || isShoe)) {
                    // This excludes accessories from MAIN view (existing logic)
                    isMatch = false;
                } else {
                    // Refine by Type if Sposo/Cerimonia selected alongside Uomo
                    const wantsSposo = activeCats.includes('Sposo');
                    const wantsCerimonia = activeCats.includes('Cerimonia');

                    if (wantsSposo && !pSub.includes('sposo') && !pName.includes('sposo')) {
                        isMatch = false;
                    } else if (wantsCerimonia) {
                        // Strict Cerimonia: Must match filter, AND NOT BE SPOSO (unless Sposo is also selected)
                        const isSposoItem = pSub.includes('sposo') || pName.includes('sposo');
                        const isCerimoniaItem = pSub.includes('cerimoni') || pName.includes('cerimoni');

                        // If it's a Sposo item, only show it if Sposo filter is ALSO active. 
                        // If only Cerimonia is active, hide Sposo items.
                        if (isSposoItem && !wantsSposo) {
                            isMatch = false;
                        } else if (!isCerimoniaItem && !isSposoItem) {
                            // If it's neither Sposo nor Cerimonia (e.g. generic Uomo suit), hide it if we strictly want Cerimonia
                            isMatch = false;
                        } else {
                            // It's a valid Cerimonia item (or legitimate Sposo if we wanted both)
                            isMatch = true;
                        }
                    } else {
                        isMatch = true;
                    }
                }
            }

            // 2. Check Donna (if not already matched)
            if (!isMatch && wantsDonna && pCat === 'donna') {
                // If user specifically wants Accessori/Scarpe, DO NOT generic match Donna items unless they ARE Accessori/Scarpe
                if ((wantsAccessori || wantsScarpe) && !isAccessory && !isShoe) {
                    isMatch = false;
                }
                else if (!wantsAccessori && !wantsScarpe && (isAccessory || isShoe)) {
                    isMatch = false;
                } else {
                    const wantsSposa = activeCats.includes('Sposa');
                    const wantsCerimonia = activeCats.includes('Cerimonia');

                    if (wantsSposa && !pSub.includes('sposa') && !pName.includes('sposa')) {
                        isMatch = false;
                    } else if (wantsCerimonia && !pSub.includes('cerimoni') && !pName.includes('cerimoni')) {
                        isMatch = false;
                    } else {
                        isMatch = true;
                    }
                }
            }

            // 3. Check Bambini
            if (!isMatch && wantsBambini && isKid) {
                isMatch = true;
            }

            // 4. Check Accessori (Global)
            if (!isMatch && wantsAccessori && (pCat === 'accessori' || isAccessory) && !isClothing && !isShoe) {
                // Gender Filter: If we are in Donna section, exclude explicit Man items
                if (wantsDonna && isManItem && !isWomanItem) {
                    // Skip
                } else if (wantsUomo && isWomanItem && !isManItem) {
                    // Skip
                } else {
                    isMatch = true;
                }
            }

            // 5. Check Scarpe (Global)
            if (!isMatch && wantsScarpe && isShoe && !isClothing && !isAccessory) {
                // Gender Filter
                if (wantsDonna && isManItem && !isWomanItem) {
                    // Skip
                } else if (wantsUomo && isWomanItem && !isManItem) {
                    // Skip
                } else {
                    isMatch = true;
                }
            }

            return isMatch;
        };

        // LOOP ONCE
        for (const p of sortedProducts) {
            const matchesCat = checkCategory(p);
            if (!matchesCat) continue;

            // Helper for Subcat/Type/Color/Size Matching
            // Note: In Promo mode, 'wantedSubs' contains 'Donna', 'Uomo' etc.
            // In Normal mode, 'wantedSubs' contains actual subcategories (Sposa, Cerimonia) or specific types.

            const matchesSub = wantedSubs.length === 0 || wantedSubs.some(s => {
                const sl = s.toLowerCase();
                return p._sub === sl || p._sub.includes(sl) || p._cat === sl; // loose match
            });

            const matchesType = wantedTypes.length === 0 || wantedTypes.includes(p._type);

            const matchesColor = wantedColors.length === 0 || p._colors.some(c => wantedColors.includes(c));
            const matchesSize = wantedSizes.length === 0 || p._sizes.some(sz => wantedSizes.includes(sz));

            const matchesPrice = (!filters.minPrice || p._promoPrice >= minP) && (!filters.maxPrice || p._promoPrice <= maxP);

            // 1. ADD TO RESULT LIST implies MATCHING ALL
            if (matchesSub && matchesType && matchesColor && matchesSize && matchesPrice) {
                resultProducts.push(p);
            }

            // 2. CALCULATE FACETS (Available Options)
            // Rule: Option X is available if there is at least one product that matches ALL OTHER filters EXCEPT X.

            // Available SUBCATS: Match Cat + Type + Color + Size + Price (Ignore Sub)
            if (matchesType && matchesColor && matchesSize && matchesPrice) {
                // For Promo Mode: use _cat or _sub? Promo Facets are departments. 
                // Actually, in Promo, the 'wantedSubs' ARE the departments. 
                // So we want to see available 'p._sub' or 'p._cat'.
                // Let's rely on _sub as standard.
                if (p._sub) facetSubcats.add(p._sub);
                // Also add p._cat if in Promo to allow filtering by macro department?
                // The sidebar uses whatever is passed.
            }

            // Available TYPES: Match Cat + Sub + Color + Size + Price (Ignore Type)
            if (matchesSub && matchesColor && matchesSize && matchesPrice) {
                facetTypes.add(p._type);
            }

            // Available COLORS: Match Cat + Sub + Type + Size + Price (Ignore Color)
            // Note: Usually we want colors relative to the visible list (strict), OR broad.
            // Standard is: Filter by Cat+Sub+Type. Size/Color are 'siblings'. 
            // Let's align with: Match Cat + Sub + Type (Ignore Color & Size for broader context?)
            // User requested "Show filters even when selected".
            // Strict Faceting: matchesSub && matchesType && matchesSize && matchesPrice
            if (matchesSub && matchesType && matchesSize && matchesPrice) {
                p._colors.forEach(c => c && facetColors.add(c));
            }

            // Available SIZES: Match Cat + Sub + Type + Color + Price
            if (matchesSub && matchesType && matchesColor && matchesPrice) {
                p._sizes.forEach(s => s && facetSizes.add(s));
            }
        }

        return {
            products: resultProducts,
            facets: {
                colors: [...facetColors].sort(),
                sizes: [...facetSizes].sort(), // logic for size sort omitted for brevity
                subcats: [...facetSubcats].sort(),
                types: [...facetTypes].sort()
            }
        };

    }, [sortedProducts, filters]); // Single dependency set

    // Update States
    useEffect(() => {
        setProducts(filteredList);
        setAvailableColors(facets.colors);
        setAvailableSizes(facets.sizes);
        setAvailableSubcategories(facets.subcats);
        setAvailableProductTypes(facets.types);
    }, [filteredList, facets]);


    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 20;

    // Filter resets page to 1
    useEffect(() => {
        setCurrentPage(1);
    }, [filters]);

    // Calculate Pagination
    const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
    const paginatedProducts = products.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // PRELOAD NEXT PAGE IMAGES
    // This ensures that when user clicks "Next", images are likely already in browser cache.
    useEffect(() => {
        if (currentPage < totalPages) {
            const nextPageStart = currentPage * ITEMS_PER_PAGE;
            const nextPageEnd = (currentPage + 1) * ITEMS_PER_PAGE;
            const nextPageProducts = products.slice(nextPageStart, nextPageEnd);

            nextPageProducts.forEach(p => {
                // Determine which image to preload (same logic as ProductCard)
                const thumbnails = (p.thumbnails && p.thumbnails.length > 0) ? p.thumbnails : [];
                const displayImages = thumbnails.length > 0 ? thumbnails : (p.images || []);

                if (displayImages.length > 0 && typeof displayImages[0] === 'string') {
                    const img = new Image();
                    img.src = displayImages[0];
                }
            });
        }
    }, [currentPage, products, totalPages]);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
            {(() => {
                let pageTitle = "Collezioni Cerimonia";
                const cat = filters.categories[0];
                const sub = filters.subcategories[0];
                const isPromo = filters.categories.includes('Promozione');

                if (isPromo) {
                    pageTitle = "Outlet Abiti Cerimonia Roma e Provincia | Promozioni e Sconti";
                } else if (cat === 'Donna') {
                    if (sub === 'Sposa') pageTitle = "Abiti da Sposa Roma e Provincia | Collezioni Eleganti per Matrimonio";
                    else if (sub === 'Cerimonia') pageTitle = "Abiti Cerimonia Donna, Damigelle e 18esimo Roma | Collezioni Eleganti";
                    else pageTitle = "Abiti Cerimonia Donna e 18esimo Roma";
                } else if (cat === 'Uomo') {
                    if (sub === 'Sposo') pageTitle = "Abiti da Sposo Roma e Provincia | Collezioni Uomo ed Abiti Eleganti";
                    else pageTitle = "Abiti Cerimonia Uomo ed Eleganti Roma";
                } else if (cat === 'Bambini') {
                    pageTitle = "Abiti Cerimonia Bambini Roma e Provincia";
                } else if (cat) {
                    pageTitle = `${cat} Roma e Provincia | Collezioni ed Eventi`;
                }

                const seoDescription = `Atelier Mitica Cerimonia Roma e Provincia. Scopri la splendida selezione di ${pageTitle.replace('Roma e Provincia |', '').replace('Roma |', '').trim()}. Ideale per matrimoni, diciottesimi (18esimo), damigelle ed eventi esclusivi. Prenota la tua prova in struttura!`;

                return (
                    <SEO
                        title={pageTitle}
                        description={seoDescription}
                    />
                );
            })()}

            <div className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-serif text-primary-950 font-black uppercase tracking-tight">
                        {filters.categories.includes('Promozione') ? 'Abiti in Promozione' : 'Le nostre proposte'}
                    </h1>
                    <div className="mt-2 text-gray-500 font-medium text-lg space-y-1">
                        {(() => {
                            const isBambiniSelected = filters.categories?.some(c => ['Bambini', 'Battesimo', 'Comunione', 'Cresima'].includes(c)) || ['Bambina', 'Bambino'].includes(filters.target);
                            if (isBambiniSelected) return null;

                            const isAccessoriSelected = filters.categories?.includes('Accessori');
                            const isScarpeSelected = filters.categories?.includes('Scarpe');

                            if ((isAccessoriSelected || isScarpeSelected) && filters.categories.length === 1) {
                                return (
                                    <p className="text-gray-500 font-medium text-lg">
                                        In negozio puoi trovare molto altro, compreso l'abito adatto a te, dalla 38 alle 66, nelle varie colorazioni.
                                    </p>
                                );
                            }

                            const isDonnaVisible = (filters.categories?.some(c => ['Donna', 'Sposa'].includes(c)) || filters.target === 'Donna' || (!filters.categories?.some(c => ['Uomo', 'Sposo', 'Accessori', 'Scarpe'].includes(c)) && filters.target !== 'Uomo'));
                            const isUomoVisible = (filters.categories?.some(c => ['Uomo', 'Sposo'].includes(c)) || filters.target === 'Uomo' || (!filters.categories?.some(c => ['Donna', 'Sposa', 'Accessori', 'Scarpe'].includes(c)) && filters.target !== 'Donna'));

                            const isMixedView = isDonnaVisible && isUomoVisible;

                            return (
                                <>
                                    {isDonnaVisible && (
                                        <p>
                                            {isMixedView && <span className="font-bold text-primary-900 uppercase tracking-wider text-xs mr-2">Donna</span>}
                                            In negozio puoi trovare molto altro, compreso l'abito adatto a te, dalla <span className="font-bold text-primary-950">38 alle 66</span>, nelle varie colorazioni.
                                        </p>
                                    )}
                                    {isUomoVisible && (
                                        <p>
                                            {isMixedView && <span className="font-bold text-primary-900 uppercase tracking-wider text-xs mr-2">Uomo</span>}
                                            In negozio puoi trovare molto altro, compreso l'abito adatto a te, dalla <span className="font-bold text-primary-950">44 alle 66</span>, nelle varie colorazioni.
                                        </p>
                                    )}
                                </>
                            );
                        })()}
                    </div>
                    <p className="text-gray-400 mt-1 font-medium text-sm">
                        {products.length} articoli in questa selezione
                        {products.length > ITEMS_PER_PAGE && ` (Pagina ${currentPage} di ${totalPages})`}
                    </p>
                </div>


                <button
                    onClick={() => setIsMobileFiltersOpen(true)}
                    className="md:hidden flex items-center gap-2 bg-black text-white hover:bg-violet-600 transition-all px-6 py-3 rounded-full uppercase tracking-widest text-[10px] font-black shadow-lg"
                >
                    <SlidersHorizontal size={14} /> Filtri
                </button>
            </div>

            <div className="flex flex-col md:flex-row gap-12">
                <FilterSidebar
                    filters={filters}
                    setFilters={setFilters}
                    availableColors={availableColors}
                    availableSizes={availableSizes}
                    availableSeasons={availableSeasons}
                    availableSubcategories={availableSubcategories}
                    availableProductTypes={availableProductTypes}
                    isOpen={isMobileFiltersOpen}
                    onClose={() => setIsMobileFiltersOpen(false)}
                    isPromo={filters.categories.includes('Promozione')}
                    initialCategory={initialCategory}
                />

                <div className="flex-1">
                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
                            {[...Array(6)].map((_, i) => (
                                <ProductCardSkeleton key={i} />
                            ))}
                        </div>
                    ) : products.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 px-4 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200 text-center space-y-8">
                            <div className="bg-white p-6 rounded-full shadow-xl mb-2">
                                <Search className="text-violet-200 w-12 h-12" />
                            </div>
                            <div className="max-w-md space-y-4">
                                <h3 className="text-3xl font-serif font-black text-primary-950">
                                    {filters.categories.includes('Promozione') ? 'Promozioni in Arrivo' : 'Nessun Risultato'}
                                </h3>
                                <p className="text-gray-600 font-medium leading-relaxed">
                                    {filters.categories.includes('Promozione') ? (
                                        <>
                                            Il nostro outlet si rinnova continuamente con nuove promozioni dedicate a te che ci vieni a trovare. <br />
                                            <span className="text-violet-600 font-bold underline cursor-pointer" onClick={() => setIsContactModalOpen(true)}>Scrivici per info</span> o <a href="tel:+390693579105" className="text-violet-600 font-bold underline">chiamaci in Atelier</a> per scoprire le offerte del momento!
                                        </>
                                    ) : (
                                        <>
                                            Abbiamo articoli in arrivo ogni settimana. Se cerchi qualcosa di specifico, <br />
                                            <span className="text-violet-600 font-bold underline cursor-pointer" onClick={() => setIsContactModalOpen(true)}>scrivici su WhatsApp</span> o <a href="tel:+390693579105" className="text-violet-600 font-bold underline">chiamaci in Atelier</a>.
                                        </>
                                    )}
                                </p>
                                <button
                                    onClick={() => setFilters({
                                        categories: initialCategory ? [initialCategory] : [],
                                        subcategories: [],
                                        target: initialTarget || '',
                                        sizes: [],
                                        colors: [],
                                        minPrice: '',
                                        maxPrice: '',
                                        product_types: []
                                    })}
                                    className="px-10 py-4 bg-black text-white rounded-full font-black uppercase tracking-widest hover:bg-violet-600 transition-all shadow-xl active:scale-95 mt-4"
                                >
                                    Resetta Filtri
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <motion.div
                                layout
                                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-10"
                            >
                                {paginatedProducts.map((product, i) => (
                                    <motion.div
                                        key={product.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{
                                            duration: 0.2,
                                            ease: "easeOut"
                                        }}
                                    >
                                        <ProductCard product={product} showPrice={isPromoMode} priority={i < 6} />
                                    </motion.div>
                                ))}
                            </motion.div>

                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="mt-16 flex justify-center items-center gap-4">
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="p-3 rounded-full border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                    >
                                        <ChevronRight className="rotate-180" size={20} />
                                    </button>

                                    <div className="flex gap-2">
                                        {[...Array(totalPages)].map((_, i) => (
                                            <button
                                                key={i + 1}
                                                onClick={() => handlePageChange(i + 1)}
                                                className={`
                                                    w-10 h-10 rounded-full text-sm font-bold transition-all
                                                    ${currentPage === i + 1
                                                        ? 'bg-black text-white shadow-lg scale-110'
                                                        : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'}
                                                `}
                                            >
                                                {i + 1}
                                            </button>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="p-3 rounded-full border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                    >
                                        <ChevronRight size={20} />
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            <ContactRequestModal
                isOpen={isContactModalOpen}
                onClose={() => setIsContactModalOpen(false)}
                product={{
                    id: 'CATALOG_NO_RESULTS',
                    name: filters.categories.includes('Promozione')
                        ? "Richiesta Informazioni Promozioni"
                        : "Consulenza Personalizzata (Ricerca)"
                }}
            />
        </div >
    );
}
