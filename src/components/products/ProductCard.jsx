import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { isWithinLast30Days } from '../../utils/dateUtils';
import { getOptimizedImageUrl } from '../../utils/imageUtils';

export default function ProductCard({ product, showPrice, priority = false }) {
    const [isHovered, setIsHovered] = useState(false);

    // Smart Preload on Hover
    const handleMouseEnter = () => {
        setIsHovered(true);
        // Preload Detail Images
        if (product.images && product.images.length > 0) {
            const img = new Image();
            img.src = product.images[0];
            // Optionally preload second image if exists (for hover effect availability)
            if (product.images[1]) {
                const img2 = new Image();
                img2.src = product.images[1];
            }
        }
    };
    const scrollContainerRef = React.useRef(null);
    const isNew = isWithinLast30Days(product.created_at);

    const scroll = (direction) => {
        if (scrollContainerRef.current) {
            const { current } = scrollContainerRef;
            const scrollAmount = current.clientWidth;
            current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    // Determine color display
    const availableColors = product.available_colors && product.available_colors.length > 0
        ? product.available_colors
        : (product.variants && product.variants.length > 0
            ? [...new Set(product.variants.map(v => v.color).filter(c => c))]
            : (product.color ? [product.color] : []));

    const colorDisplay = availableColors.length > 1
        ? `${availableColors.length} Colori`
        : (availableColors[0] || 'In Boutique');

    const hasMultipleImages = product.images && product.images.length > 1;
    const mediaList = product.images && product.images.length > 0 ? product.images : [];

    // Combine logic for thumbnails vs images
    const thumbnails = (product.thumbnails && product.thumbnails.length > 0) ? product.thumbnails : [];

    // Process displayed images through optimization proxy (if not already optimized)
    const rawImages = thumbnails.length > 0 ? thumbnails : mediaList;
    const displayImages = rawImages.map(url => {
        // Only proxy external URLs (Firebase Storage), skip local/videos
        if (typeof url === 'string' && url.includes('firebasestorage.googleapis.com')) {
            // Aggressive optimization: 300px width, 50% quality
            return getOptimizedImageUrl(url, 300, 50);
        }
        return url;
    });

    // PRELOAD FULL IMAGE ON HOVER
    const preloadFullImage = () => {
        if (product.images && product.images.length > 0 && typeof product.images[0] === 'string') {
            const img = new Image();
            img.src = product.images[0]; // Full Res URL
        }
    };

    return (
        <Link
            to={`/product/${product.id}`}
            className="block group relative bg-white p-3 rounded-[2.5rem] transition-all duration-500 hover:shadow-2xl hover:shadow-primary-900/10 border border-transparent hover:border-gray-100"
            onMouseEnter={() => {
                handleMouseEnter();
                preloadFullImage();
            }}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="relative aspect-[3/4] rounded-[2rem] overflow-hidden bg-gray-50 protected-media">

                {/* Media Container */}
                <div
                    ref={scrollContainerRef}
                    className={`w-full h-full flex overflow-x-auto snap-x snap-mandatory scrollbar-hide ${displayImages.length > 1 ? 'cursor-grab active:cursor-grabbing' : ''}`}
                >
                    {product.videoUrl ? (
                        <div className="w-full h-full flex-shrink-0 snap-center px-[1px]">
                            <video
                                src={product.videoUrl}
                                autoPlay={isHovered}
                                loop
                                muted
                                playsInline
                                className="w-full h-full object-cover object-center"
                            />
                        </div>
                    ) : (
                        displayImages.length > 0 ? (
                            <div className="w-full h-full flex-shrink-0 snap-center relative px-[1px]">
                                <img
                                    src={displayImages[0]}
                                    alt={product.name}
                                    className="w-full h-full object-cover object-center will-change-transform transition-opacity duration-500 ease-in-out opacity-0"
                                    onLoad={(e) => e.target.classList.remove('opacity-0')}
                                    width="100%"
                                    height="100%"
                                    loading={priority ? "eager" : "lazy"}
                                    fetchPriority={priority ? "high" : "auto"}
                                    decoding="async"
                                />
                            </div>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300 italic text-xs">
                                No Image
                            </div>
                        )
                    )}

                    {/* 2. SECONDARY MEDIA (Rest of list) - Rendered ONLY on Hover */}
                    {isHovered && displayImages.length > 0 && (
                        displayImages.map((img, index) => {
                            // Skip index 0 if it was already rendered above (and no video)
                            if (!product.videoUrl && index === 0) return null;

                            const isVideoFile = typeof img === 'string' && (img.toLowerCase().includes('.mp4') || img.toLowerCase().includes('.mov'));

                            return (
                                <div key={index} className="w-full h-full flex-shrink-0 snap-center relative px-[1px]">
                                    {isVideoFile ? (
                                        <video
                                            src={img}
                                            autoPlay={isHovered}
                                            loop
                                            muted
                                            playsInline
                                            className="w-full h-full object-cover object-center"
                                        />
                                    ) : (
                                        <img
                                            src={img}
                                            alt={`${product.name} - View ${index + 1}`}
                                            className="w-full h-full object-cover object-center will-change-transform transition-opacity duration-300 ease-in-out opacity-0"
                                            onLoad={(e) => e.target.classList.remove('opacity-0')}
                                            loading="lazy"
                                            decoding="async"
                                        />
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Carousel Indicators */}
                {(displayImages.length > 1 || (product.videoUrl && displayImages.length > 0)) && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        {(product.videoUrl ? [product.videoUrl, ...displayImages] : displayImages).map((_, idx) => (
                            <div key={idx} className="w-1.5 h-1.5 rounded-full bg-white/80 shadow-sm backdrop-blur-sm" />
                        ))}
                    </div>
                )}

                {/* Navigation Arrows */}
                {(mediaList.length > 1 || (product.videoUrl && mediaList.length > 0)) && (
                    <>
                        <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); scroll('left'); }}
                            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-stone-800 shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 hover:bg-white"
                            aria-label="Previous image"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); scroll('right'); }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-stone-800 shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 hover:bg-white"
                            aria-label="Next image"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </>
                )}


                <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
                    {/* Badges or tags can go here */}
                </div>

                {/* Glass Overlay / Action Button - FIXED: Transparent Background */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 scale-50 group-hover:opacity-100 group-hover:scale-100 transition-all duration-500 flex items-center justify-center z-10 pointer-events-none">
                    <div className="p-3 bg-transparent text-white drop-shadow-xl">
                        {/* Drop shadow on icon itself for visibility against light backgrounds, no bg box */}
                        <Eye size={32} strokeWidth={2} style={{ filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.5))' }} />
                    </div>
                </div>
                {/* Glass Overlay / Action Button */}


            </div>

            {/* Info Footer */}
            <div className="p-4 px-2 flex justify-between items-center gap-4">
                <div className="flex-1 min-w-0">
                    <div className="h-2"></div>

                    {product.is_promo && (product.price_list || product.promo_price) && (
                        <div className="flex items-center gap-2 mt-2">
                            {product.promo_price ? (
                                <>
                                    <span className="text-red-600 font-black text-sm">€{product.promo_price}</span>
                                    <span className="text-stone-400 line-through text-[10px] font-bold">€{product.price_list}</span>
                                </>
                            ) : (
                                <span className="text-stone-800 font-black text-sm">€{product.price_list}</span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
}
