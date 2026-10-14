
/**
 * Compresses an image file efficiently on the client side using HTML5 Canvas.
 * Converts to WebP format for optimal size/quality ratio.
 * 
 * @param {File} file - The original image file
 * @param {number} maxWidth - Maximum width (default 1920)
 * @param {number} quality - Quality from 0 to 1 (default 0.8)
 * @returns {Promise<File>} - The compressed file
 */
export async function compressImage(file, maxWidth = 1920, quality = 0.8) {
    // If not an image, return original
    if (!file.type.startsWith('image/')) return file;

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;

            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Resize logic
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Convert to WebP
                canvas.toBlob((blob) => {
                    if (!blob) {
                        reject(new Error("Image compression failed"));
                        return;
                    }

                    // Return as File object with same name but .webp extension
                    const newName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
                    const compressedFile = new File([blob], newName, {
                        type: 'image/webp',
                        lastModified: Date.now()
                    });

                    console.log(`Compressed: ${file.name} (${(file.size / 1024).toFixed(2)} KB) -> ${newName} (${(compressedFile.size / 1024).toFixed(2)} KB)`);
                    resolve(compressedFile);
                }, 'image/webp', quality);
            };

            img.onerror = (err) => reject(err);
        };

        reader.onerror = (err) => reject(err);
    });
}

/**
 * Creates a thumbnail version of the image.
 * 
 * @param {File} file 
 * @returns {Promise<File>}
 */
export async function createThumbnail(file) {
    // Generate thumbnail: max width 600px, quality 0.5 (reduced from 0.7 for space saving)
    const thumb = await compressImage(file, 600, 0.5);
    // Rename to include _thumb
    return new File([thumb], thumb.name.replace('.webp', '_thumb.webp'), {
        type: 'image/webp',
        lastModified: Date.now()
    });
}

/**
 * Generates an on-the-fly optimized URL using Weserv CDN proxy.
 * This reduces image size dynamically (useful for heavy Firebase URLs in the catalog).
 * 
 * @param {string} url - Original Image URL (Firebase or other)
 * @param {number} width - Desired width in pixels 
 * @param {number} quality - Desired quality (1-100)
 * @returns {string} - Proxy URL
 */
export function getOptimizedImageUrl(url, width = 400, quality = 60) {
    if (!url || typeof url !== 'string') return url;

    // Check if it's already an optimized or local asset, or video
    if (url.includes('images.weserv.nl') || url.startsWith('/') || url.includes('.mp4') || url.includes('.mov')) {
        return url;
    }

    // Use Weserv CDN to proxy and resize the image
    // Adding maxage=31d to force harsh browser caching for a month
    const w = width ? `&w=${width}` : '';
    const q = quality ? `&q=${quality}` : '';

    return `https://images.weserv.nl/?url=${encodeURIComponent(url)}${w}${q}&output=webp&we&maxage=31d`;
}
