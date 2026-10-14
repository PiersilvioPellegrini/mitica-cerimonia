import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';
import WhatsAppButton from '../../components/functionality/WhatsAppButton';
import ContactRequestModal from '../../components/functionality/ContactRequestModal';
import { ArrowLeft, MessageCircle, Scissors, Check, X, Trash2 } from 'lucide-react';
import { getColorClasses } from '../../utils/colorUtils';
import { useAuth } from '../../contexts/AuthContext';
import { trackProductView } from '../../services/analyticsService';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '../../components/ui/Skeleton';
import SEO from '../../components/common/SEO';

export default function ProductDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(0);
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);
    const [showWhatsAppNudge, setShowWhatsAppNudge] = useState(false);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);
    const [isImageLoaded, setIsImageLoaded] = useState(false);

    // Reset image loading state when image changes
    useEffect(() => {
        setIsImageLoaded(false);
    }, [selectedImage]);

    // Variant Selection State
    const [selectedColor, setSelectedColor] = useState(null);
    const [selectedSize, setSelectedSize] = useState(null);

    useEffect(() => {
        if (currentUser) return;

        const timer = setTimeout(() => {
            setShowWhatsAppNudge(true);
        }, 2000);
        return () => clearTimeout(timer);
    }, [currentUser]);

    // Hide static WhatsApp Button while on this page
    useEffect(() => {
        document.body.classList.add('hide-wa-button');
        return () => document.body.classList.remove('hide-wa-button');
    }, []);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const docRef = doc(db, "products", id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = { id: docSnap.id, ...docSnap.data() };
                    setProduct(data);
                    trackProductView(data.id, data.name);

                    // Auto-select first available variant if using new schema
                    if (data.variants && data.variants.length > 0) {
                        setSelectedColor(data.variants[0].color);
                        setSelectedSize(data.variants[0].size);
                    }
                } else {
                    console.log("No such product!");
                }
            } catch (error) {
                console.error("Error fetching product:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id]);

    useEffect(() => {
        if (!product || !product.images || !Array.isArray(product.images) || product.images.length <= 1 || !isAutoPlaying) return;

        const interval = setInterval(() => {
            setSelectedImage((prev) => (prev + 1) % product.images.length);
        }, 3000);

        return () => clearInterval(interval);
    }, [product, isAutoPlaying]);

    if (loading) return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 bg-white min-h-screen">
            <div className="mb-8"><Skeleton className="h-6 w-32" /></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                <div className="space-y-6">
                    <Skeleton variant="card" className="aspect-[3/4] w-full" />
                    <div className="flex gap-4">
                        {[1, 2, 3].map(i => <Skeleton key={i} className="w-24 h-24 rounded-2xl" />)}
                    </div>
                </div>
                <div className="space-y-6">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-16 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <div className="py-10 border-b border-gray-100"><Skeleton className="h-10 w-1/3" /></div>
                    <div className="space-y-4">
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-20 w-full" />
                    </div>
                </div>
            </div>
        </div>
    );

    if (!product) return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
            <h2 className="text-2xl font-serif text-gray-400">Prodotto non trovato.</h2>
            <Link to="/catalog" className="text-violet-600 font-bold mt-4 inline-block hover:underline">Torna al catalogo</Link>
        </div>
    );

    // Get unique colors and sizes for the selected variant set
    const colors = product.available_colors && product.available_colors.length > 0
        ? product.available_colors
        : (product.variants ? [...new Set(product.variants.map(v => v.color).filter(c => c))] : [product.color]);

    const availableSizes = product.variants
        ? product.variants.filter(v => v.color === selectedColor).map(v => v.size)
        : [product.size];

    const allMedia = [
        ...(product.videoUrl ? [{ url: product.videoUrl, type: 'video' }] : []),
        ...(product.images && Array.isArray(product.images) ? product.images.map(url => {
            if (typeof url !== 'string') return { url: '', type: 'image' };
            const isVideo = url.toLowerCase().includes('.mp4') || url.toLowerCase().includes('.mov') || url.toLowerCase().includes('.webm');
            return { url, type: isVideo ? 'video' : 'image' };
        }) : [])
    ];

    // Schema.org Structured Data
    const productSchema = {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": product.name,
        "image": product.images || [],
        "description": product.description ? product.description.replace(/<[^>]*>/g, '') : "Abito da cerimonia esclusivo Mitica Cerimonia.",
        "brand": {
            "@type": "Brand",
            "name": product.brand || "Mitica Cerimonia"
        },
        "sku": product.code || product.id,
        "offers": {
            "@type": "Offer",
            "url": window.location.href,
            "priceCurrency": "EUR",
            "price": product.promo_price || product.price_list || product.price || "0.00",
            "availability": "https://schema.org/InStock",
            "itemCondition": "https://schema.org/NewCondition"
        }
    };

    const handleDelete = async () => {
        if (!product || !product.id) return;
        if (window.confirm('Sei sicuro di voler eliminare DEFINITIVAMENTE questo prodotto? Questa azione non può essere annullata.')) {
            try {
                setLoading(true);
                await deleteDoc(doc(db, "products", product.id));
                // Clear cache if needed (handled by Catalog reload usually, but good to be safe)
                // navigate back to catalog
                navigate('/catalog');
            } catch (error) {
                console.error("Error deleting product:", error);
                alert("Errore durante l'eliminazione del prodotto.");
                setLoading(false);
            }
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 bg-white min-h-screen">
            <SEO
                title={product.name}
                description={`Acquista ${product.name} - ${product.category} ${product.brand ? `di ${product.brand}` : ''}. Collezione esclusiva Mitica Cerimonia Roma.`}
                image={product.images?.[0]}
                schema={productSchema}
            />
            <div className="flex justify-between items-center mb-8">
                <button
                    onClick={() => {
                        if (window.history.length > 2) {
                            window.history.back();
                        } else {
                            navigate('/catalog');
                        }
                    }}
                    className="inline-flex items-center text-gray-700 hover:text-primary-900 transition font-medium"
                >
                    <ArrowLeft size={20} className="mr-2" /> Torna al catalogo
                </button>

                {currentUser && (
                    <div className="flex gap-4">
                        <button
                            onClick={handleDelete}
                            className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-lg font-bold uppercase text-xs tracking-wider hover:bg-red-600 hover:text-white transition flex items-center"
                        >
                            <Trash2 size={16} className="mr-2" /> Elimina
                        </button>
                        <Link
                            to={`/admin/inventory?editId=${product.id}&returnTo=${encodeURIComponent(window.location.pathname)}`}
                            className="bg-black text-white px-4 py-2 rounded-lg font-bold uppercase text-xs tracking-wider hover:bg-violet-600 transition"
                        >
                            Modifica Prodotto
                        </Link>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                {/* Image Gallery */}
                <div className="space-y-6">
                    <div
                        className="aspect-[3/4] overflow-hidden rounded-[2.5rem] bg-gray-50 border border-gray-100 shadow-sm relative group cursor-zoom-in"
                        onMouseEnter={() => setIsAutoPlaying(false)}
                        onMouseLeave={() => setIsAutoPlaying(true)}
                    >
                        {/* Skeleton underneath */}
                        {!isImageLoaded && (
                            <div className="absolute inset-0 bg-gray-100 animate-pulse z-0" />
                        )}

                        {allMedia[selectedImage] ? (
                            (() => {
                                const media = allMedia[selectedImage];
                                return media.type === 'video' ? (
                                    <video
                                        key={selectedImage}
                                        src={media.url}
                                        autoPlay
                                        muted
                                        loop
                                        playsInline
                                        className="w-full h-full object-cover rounded-[2.5rem]"
                                        onLoadedData={() => setIsImageLoaded(true)}
                                    />
                                ) : (
                                    <img
                                        key={selectedImage}
                                        src={media.url}
                                        alt={product.name}
                                        decoding="async"
                                        fetchPriority="high" // Prioritize the main visible image
                                        loading="eager"      // Load immediately
                                        onLoad={() => setIsImageLoaded(true)}
                                        className={`w-full h-full object-cover object-top transition-all duration-1000 hover:scale-125 scale-100 ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`}
                                    />
                                );
                            })()
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-400 font-medium relative z-10">No Image</div>
                        )}

                        {/* Status Badges */}
                        <div className="absolute top-6 left-6 flex flex-col gap-2 z-10">
                            <span className="bg-white/90 backdrop-blur-md text-primary-900 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-lg border border-white">
                                {product.category}
                            </span>
                        </div>
                    </div>
                    <div className="flex gap-8 overflow-x-auto pb-4 pt-4 scrollbar-hide px-2">
                        <AnimatePresence mode="popLayout">
                            {allMedia.map((media, idx) => (
                                <motion.button
                                    key={idx}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    transition={{ delay: idx * 0.1 }}
                                    onClick={() => setSelectedImage(idx)}
                                    className={`
                                        relative w-20 h-28 flex-shrink-0 rounded-[1.5rem] overflow-hidden transition-all duration-500
                                        ${selectedImage === idx
                                            ? 'shadow-xl shadow-violet-500/30 ring-2 ring-violet-500 opacity-100 scale-105'
                                            : 'opacity-50 hover:opacity-100'}
                                    `}
                                >
                                    {media.type === 'video' ? (
                                        <video src={media.url} className="w-full h-full object-cover" muted loop />
                                    ) : (
                                        <img src={media.url} alt="" className="w-full h-full object-cover" loading="lazy" fetchPriority="low" />
                                    )}
                                </motion.button>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Product Info */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                    className="flex flex-col"
                >
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="mb-4"
                    >
                        <span className="text-violet-600 uppercase tracking-[0.2em] text-[11px] font-black border-l-4 border-violet-600 pl-3">
                            {product.brand || 'Mitica Cerimonia'}
                        </span>
                    </motion.div>

                    <div className="mb-4">
                        {/* Name Hidden as per request */}
                    </div>

                    {product.is_promo && (
                        <div className="flex items-center gap-4 mb-8">
                            {product.promo_price ? (
                                <div className="flex flex-col">
                                    <span className="text-4xl font-black text-red-600">€{product.promo_price}</span>
                                    <span className="text-lg text-gray-400 line-through font-bold">€{product.price_list}</span>
                                </div>
                            ) : product.price_list ? (
                                <span className="text-4xl font-black text-primary-950">€{product.price_list}</span>
                            ) : null}

                            <span className="bg-red-100 text-red-600 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ml-2">
                                Offerta Speciale
                            </span>
                        </div>
                    )}

                    <div className="space-y-8 mb-12">
                        {/* Description Hidden as per request */}

                        <div className="flex gap-8 pt-4 border-t border-gray-50">
                            <div>
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Categoria</h3>
                                <p className="text-gray-950 font-bold">{product.category} - {product.subcategory || 'Collezione'}</p>
                            </div>
                            {(product.available_colors && product.available_colors.length > 0) && (
                                <div>
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Colori Disponibili</h3>
                                    <div className="flex gap-2">
                                        {product.available_colors.map((color, i) => (
                                            <span key={i} className="text-gray-950 font-bold bg-gray-100 px-3 py-1 rounded-full text-sm">
                                                {color}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-4 mt-auto">
                        <button
                            onClick={() => setIsContactModalOpen(true)}
                            className="w-full flex items-center justify-center gap-3 bg-black text-white py-6 px-10 rounded-full hover:bg-violet-600 transition-all duration-500 uppercase tracking-widest font-black shadow-xl hover:shadow-violet-200 hover:-translate-y-1 active:scale-95"
                        >
                            <MessageCircle size={24} /> Chiedi Informazioni
                        </button>
                    </div>
                </motion.div>
            </div >

            <ContactRequestModal
                isOpen={isContactModalOpen}
                onClose={() => setIsContactModalOpen(false)}
                product={{
                    ...product,
                    selectedColor,
                    selectedSize
                }}
            />

            {/* WhatsApp Nudge Popup */}
            {
                showWhatsAppNudge && (
                    <div className="fixed bottom-6 right-6 z-50 animate-slide-up max-w-[340px] w-full">
                        <div className="bg-white rounded-[2rem] shadow-2xl border border-gray-100 p-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-full -mr-16 -mt-16 -z-10 opacity-50"></div>
                            <button
                                onClick={() => setShowWhatsAppNudge(false)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-2"
                            >
                                <X size={20} />
                            </button>
                            <div className="flex gap-4 items-start">
                                <div className="bg-green-500 p-3 rounded-full text-white shadow-lg shadow-green-200">
                                    <MessageCircle size={24} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-950 text-base mb-1">Consulenza Immediata</h4>
                                    <p className="text-xs text-gray-500 mb-4 leading-relaxed font-medium">
                                        Siamo a tua disposizione per domande su taglie, colori o per prenotare una prova in sede.
                                    </p>
                                    <button
                                        onClick={() => {
                                            setShowWhatsAppNudge(false);
                                            setIsContactModalOpen(true);
                                        }}
                                        className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white text-[11px] font-black uppercase tracking-widest py-3 px-6 rounded-full transition-all shadow-lg hover:shadow-green-200 active:scale-95"
                                    >
                                        Parla con noi
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
