import { useEffect, useRef } from 'react';

/**
 * A hook to silently preload an array of image URLs in the background.
 * Uses a small delay to avoid blocking the main React thread during initial mount.
 * 
 * @param {string[]} imageUrls - Array of image URLs to preload
 * @param {number} delayMs - Delay before starting preload (ms)
 */
export function useImagePreloader(imageUrls, delayMs = 3000) {
    const hasPreloaded = useRef(false);

    useEffect(() => {
        if (!imageUrls || imageUrls.length === 0 || hasPreloaded.current) return;

        const timer = setTimeout(() => {
            // Trigger preloads
            imageUrls.forEach(url => {
                if (url && typeof url === 'string') {
                    const img = new Image();
                    img.src = url;
                }
            });
            hasPreloaded.current = true;
        }, delayMs);

        return () => clearTimeout(timer);
    }, [imageUrls, delayMs]);
}
