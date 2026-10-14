import React, { useState, useEffect } from 'react';
import { db, storage } from '../../services/firebaseConfig';
import { collection, addDoc, serverTimestamp, writeBatch, doc, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Upload, X, Check, Loader2, Image as ImageIcon, Trash2, FileSpreadsheet, Download, AlertTriangle, Edit } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Papa from 'papaparse';
import { compressImage } from '../../utils/imageUtils';

const CATEGORIES = ['Donna', 'Uomo', 'Bambini', 'Promozione', 'Accessori', 'Scarpe'];
const SUBCATEGORIES = {
    'Donna': ['Sposa', 'Cerimonia', 'Accessori', 'Scarpe'],
    'Uomo': ['Sposo', 'Cerimonia', 'Accessori', 'Scarpe'],
    'Bambini': ['Battesimo', 'Comunione', 'Premaman'],
    'Promozione': ['Donna', 'Uomo', 'Bambini', 'Accessori', 'Scarpe'],
    'Accessori': ['Sposa', 'Sposo', 'Cerimonia', 'Bambini'],
    'Scarpe': ['Sposa', 'Sposo', 'Cerimonia', 'Bambini']
};

export default function SimpleImageManager() {
    const [mode, setMode] = useState('manual'); // 'manual' or 'csv'

    // Manual State
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [subcategory, setSubcategory] = useState('');
    const [priceList, setPriceList] = useState('');
    const [promoPrice, setPromoPrice] = useState('');
    const [isPromo, setIsPromo] = useState(false);
    const [images, setImages] = useState([]);
    const [videoUrl, setVideoUrl] = useState('');
    const [videoFile, setVideoFile] = useState(null);
    const [availableColors, setAvailableColors] = useState('');
    const [brand, setBrand] = useState('Mitica Cerimonia');
    const [macroTipo, setMacroTipo] = useState('Abiti Lunghi');

    // CSV State
    const [csvFile, setCsvFile] = useState(null);
    const [csvData, setCsvData] = useState([]);
    const [localImages, setLocalImages] = useState([]); // Array of File objects

    const [uploading, setUploading] = useState(false);
    const [success, setSuccess] = useState(false);

    // NEW: Staging Queue
    const [pendingProducts, setPendingProducts] = useState([]); // [{ id, name, category, ... status: 'pending' }]
    const [editingQueueId, setEditingQueueId] = useState(null);

    // Existing Images Map for Duplication Check
    const [existingImages, setExistingImages] = useState({}); // { 'filename.jpg': 'ProductName', ... }

    useEffect(() => {
        const fetchExistingImages = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, "products"));
                const imageMap = {};

                querySnapshot.docs.forEach(doc => {
                    const data = doc.data();
                    const images = data.images || data.imageUrls || [];
                    const productName = data.name || 'Prodotto Esistente';

                    images.forEach(url => {
                        if (typeof url === 'string') {
                            // Extract filename from Firebase Storage URL
                            try {
                                // Simple extraction based on common patterns
                                const pathPart = url.split('/o/')[1]?.split('?')[0];
                                if (!pathPart) return;

                                const decodedPath = decodeURIComponent(pathPart);
                                const fullBasename = decodedPath.split('/').pop();

                                let originalName = fullBasename;

                                // Handle prefixes
                                if (originalName.startsWith('bulk_')) originalName = originalName.replace('bulk_', '');

                                // Handle timestamp (digits_)
                                const parts = originalName.split('_');
                                if (parts.length > 1 && /^\d+$/.test(parts[0])) {
                                    parts.shift();
                                    originalName = parts.join('_');
                                }

                                imageMap[originalName] = productName;
                            } catch (e) {
                                // ignore parse errors
                            }
                        }
                    });
                });
                setExistingImages(imageMap);
            } catch (err) {
                console.error("Error checking duplicates:", err);
            }
        };

        fetchExistingImages();
    }, [success]);

    const checkDuplicate = (filename) => existingImages[filename];

    // Manual Image Handlers
    const handleFileChange = (e) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setImages(prev => [...prev, ...newFiles]);
        }
    };

    const removeImage = (index) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    // CSV Handlers
    const handleCsvUpload = (e) => {
        const file = e.target.files[0];
        setCsvFile(file);
        if (file) {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    const sanitized = results.data.map(item => {
                        const price_list = item['Prezzo Listino'] || item.price_list || '';
                        const promo_price = item['Prezzo Scontato'] || item.promo_price || '';

                        // Normalize Legacy Macro Types
                        let mType = item.Tipologia || item.macro_tipo || 'Abiti Lunghi';
                        if (mType === 'Abito') mType = 'Abiti Lunghi';
                        if (mType === 'Completo') mType = 'Completi/Pantaloni/Abiti Corti';

                        return {
                            name: item.Nome || item.name || '',
                            description: item.Descrizione || item.description || '',
                            category: item.Categoria || item.category || '',
                            subcategory: item.Sottocategoria || item.subcategory || '',
                            price_list: price_list,
                            promo_price: promo_price,
                            is_promo: !!(price_list || promo_price),
                            imageUrls: (item.Immagini || item.images || '').split(',').map(s => s.trim()).filter(s => s), // filenames or urls
                            videoUrl: item.Video || item.videoUrl || '',
                            available_colors: (item.Colori || item.colors || '').split(',').map(s => s.trim()).filter(s => s),
                            brand: item.Brand || item.brand || 'Mitica Cerimonia',
                            macro_tipo: mType
                        };
                    });
                    setCsvData(sanitized);
                },
                error: (error) => {
                    console.error('CSV Error:', error);
                    alert('Errore nella lettura del CSV');
                }
            });
        }
    };

    const handleLocalImagesSelect = (e) => {
        if (e.target.files) {
            setLocalImages(Array.from(e.target.files));
        }
    };

    const downloadTemplate = () => {
        const csvContent = "Nome,Descrizione,Categoria,Sottocategoria,Prezzo Listino,Prezzo Scontato,Immagini,Video,Colori,Brand\nAbito Test,Bellissimo abito,Donna,Cerimonia,150,120,\"foto1.jpg, foto2.jpg\",https://video.com/video.mp4,\"Rosso, Nero, Oro\",Mitica Cerimonia";
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "template_import_mitica.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Unified Queue Addition for Manual Mode
    const addToQueue = (e) => {
        e.preventDefault();
        if (!category || (images.length === 0 && !videoFile && !videoUrl)) {
            alert('Per favore inserisci categoria e almeno una foto o un video.');
            return;
        }

        const autoName = name || `${macroTipo || 'Articolo'} ${category} ${subcategory} ${availableColors.split(',')[0] || ''}`.trim();

        const productData = {
            name: autoName,
            description: description || `Nuova Collezione ${new Date().getFullYear()} - ${category}`,
            category,
            subcategory,
            price_list: isPromo ? priceList : '',
            promo_price: isPromo ? promoPrice : '',
            is_promo: isPromo,
            images: images, // Array of Files
            videoFile: videoFile,
            videoUrl: videoUrl,
            available_colors: availableColors.split(',').map(s => s.trim()).filter(s => s),
            brand: brand,
            macro_tipo: macroTipo,
            status: 'pending', // pending, uploading, done, error
            source: 'manual'
        };

        if (editingQueueId) {
            // Update existing product in queue
            setPendingProducts(prev => prev.map(p =>
                p.id === editingQueueId ? { ...p, ...productData } : p
            ));
            setEditingQueueId(null);
            alert("Modifiche salvate in coda!");
        } else {
            // Add new product
            const newProduct = {
                id: Date.now().toString(),
                ...productData
            };
            setPendingProducts(prev => [...prev, newProduct]);
            alert("Prodotto aggiunto alla coda di pubblicazione in basso!");
        }
        resetManualForm();
    };

    const resetManualForm = () => {
        setName('');
        setDescription('');
        setCategory('');
        setSubcategory('');
        setPriceList('');
        setPromoPrice('');
        setIsPromo(false);
        setImages([]);
        setVideoUrl('');
        setVideoFile(null);
        setAvailableColors('');
        setBrand('Mitica Cerimonia');
        setMacroTipo('Abiti Lunghi');
        setEditingQueueId(null);
    };

    const handleEditFromQueue = (product) => {
        setMode('manual');
        setEditingQueueId(product.id);

        setName(product.name || '');
        setDescription(product.description || '');
        setCategory(product.category || '');
        setSubcategory(product.subcategory || '');
        setPriceList(product.price_list || '');
        setPromoPrice(product.promo_price || '');
        setIsPromo(product.is_promo || false);
        setImages(product.images || []);
        setVideoUrl(product.videoUrl || '');
        setVideoFile(product.videoFile || null);
        setAvailableColors(Array.isArray(product.available_colors) ? product.available_colors.join(', ') : (product.available_colors || ''));
        setBrand(product.brand || 'Mitica Cerimonia');
        setMacroTipo(product.macro_tipo || 'Abiti Lunghi');

        // Scroll to form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        resetManualForm();
    };

    const removeFromQueue = (id) => {
        setPendingProducts(prev => prev.filter(p => p.id !== id));
    };

    const publishQueue = async () => {
        if (pendingProducts.length === 0) return;
        setUploading(true);

        const queue = [...pendingProducts];

        for (let i = 0; i < queue.length; i++) {
            const product = queue[i];
            if (product.status === 'done') continue;

            try {
                // Update status to uploading
                setPendingProducts(prev => prev.map(p => p.id === product.id ? { ...p, status: 'uploading' } : p));

                // 1. Upload Images
                const finalImageUrls = await Promise.all(product.images.map(async (img) => {
                    if (img instanceof File) {
                        try {
                            // COMPRESS IMAGE ON THE FLY
                            const compressedImg = await compressImage(img);
                            const storageRef = ref(storage, `products/${Date.now()}_${compressedImg.name}`);
                            await uploadBytes(storageRef, compressedImg);
                            const mainUrl = await getDownloadURL(storageRef);

                            // GENERATE THUMBNAIL
                            let thumbUrl = mainUrl;
                            try {
                                const thumbImg = await createThumbnail(img);
                                const thumbRef = ref(storage, `products/thumbs/${Date.now()}_${thumbImg.name}`);
                                await uploadBytes(thumbRef, thumbImg);
                                thumbUrl = await getDownloadURL(thumbRef);
                            } catch (e) { console.error("Thumbnail failed", e); }

                            return { url: mainUrl, thumb: thumbUrl };
                        } catch (err) {
                            console.error("Compression failed, uploading original:", err);
                            const storageRef = ref(storage, `products/${Date.now()}_${img.name}`);
                            await uploadBytes(storageRef, img);
                            const url = await getDownloadURL(storageRef);
                            return { url: url, thumb: url };
                        }
                    }
                    return img; // Already a URL string
                }));

                // 2. Upload Video
                let finalVideoUrl = product.videoUrl;
                if (product.videoFile) {
                    const videoRef = ref(storage, `products/videos/${Date.now()}_${product.videoFile.name}`);
                    await uploadBytes(videoRef, product.videoFile);
                    finalVideoUrl = await getDownloadURL(videoRef);
                }

                // Extract Images and Thumbnails
                const imagesArray = finalImageUrls.map(item => (typeof item === 'object' && item.url) ? item.url : item);
                const thumbsArray = finalImageUrls.map(item => (typeof item === 'object' && item.thumb) ? item.thumb : item);

                // 3. Create Firestore Doc
                await addDoc(collection(db, 'products'), {
                    name: product.name,
                    description: product.description,
                    category: product.category,
                    subcategory: product.subcategory,
                    price_list: product.price_list,
                    promo_price: product.promo_price,
                    is_promo: product.is_promo,
                    images: imagesArray,
                    thumbnails: thumbsArray, // New Field
                    videoUrl: finalVideoUrl,
                    available_colors: product.available_colors,
                    brand: product.brand,
                    macro_tipo: product.macro_tipo || 'Abiti Lunghi',
                    created_at: serverTimestamp(),
                    updated_at: serverTimestamp(),
                    is_active: true,
                    price: 0,
                    variants: []
                });

                // Update status to done
                setPendingProducts(prev => prev.map(p => p.id === product.id ? { ...p, status: 'done' } : p));

            } catch (error) {
                console.error("Error publishing product:", product.name, error);
                setPendingProducts(prev => prev.map(p => p.id === product.id ? { ...p, status: 'error' } : p));
            }
        }

        setUploading(false);
        setSuccess(true);
        setTimeout(() => {
            setSuccess(false);
        }, 3000);
    };

    const clearCompleted = () => {
        setPendingProducts(prev => prev.filter(p => p.status !== 'done'));
    };
    // Add CSV Data to Queue
    const addCsvToQueue = () => {
        if (csvData.length === 0) return;

        // Match CSV items with local images
        const enrichedItems = csvData.map((item, idx) => {
            const matchedImages = item.imageUrls.map(filename => {
                const file = localImages.find(f => f.name === filename);
                return file || filename; // Return File object if found, else keep string (URL)
            });

            return {
                ...item,
                id: `csv-${Date.now()}-${idx}`,
                status: 'pending',
                source: 'csv',
                images: matchedImages, // Mix of Files and Strings
                is_promo: !!(item.price_list || item.promo_price),
                available_colors: (item.available_colors || []).map(s => s.trim()).filter(s => s),
                imageFilenames: item.imageUrls
            };
        });

        setPendingProducts(prev => [...prev, ...enrichedItems]);
        setCsvData([]);
        setLocalImages([]);
        setMode('manual'); // Return to default view
        alert(`Aggiunti ${enrichedItems.length} prodotti alla coda!`);
    };

    return (
        <div className="max-w-5xl mx-auto p-6">
            <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 p-8">
                {/* Header with Mode Toggle */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div className="flex items-center gap-4">
                        <div className="bg-violet-100 p-3 rounded-2xl text-violet-600">
                            <ImageIcon size={32} />
                        </div>
                        <div>
                            <h2 className="text-3xl font-serif font-black text-primary-950">Gestione Catalogo</h2>
                            <p className="text-gray-500 font-medium text-sm">Aggiungi nuovi modelli manualmente o via CSV.</p>
                        </div>
                    </div>

                    <div className="flex bg-gray-100 p-1 rounded-2xl w-full md:w-auto">
                        <button
                            onClick={() => setMode('manual')}
                            className={`flex-1 md:flex-none px-6 py-3 md:py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all text-center ${mode === 'manual' ? 'bg-white text-violet-600 shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            Manuale
                        </button>
                        <button
                            onClick={() => setMode('csv')}
                            className={`flex-1 md:flex-none px-6 py-3 md:py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all text-center ${mode === 'csv' ? 'bg-white text-violet-600 shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            Importa CSV
                        </button>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {mode === 'manual' ? (
                        <motion.form
                            key="manual"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            onSubmit={addToQueue}
                            className="space-y-8"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Info Section */}
                                <div className="space-y-6">
                                    <div className="hidden">
                                        <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2 ml-4">Nome Articolo (Auto)</label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="Es: Abito da Sposa Redingote"
                                            className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-violet-600 focus:bg-white rounded-3xl transition-all outline-none font-bold text-gray-900"
                                        />
                                    </div>

                                    <div className="hidden">
                                        <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2 ml-4">Brand</label>
                                        <input
                                            type="text"
                                            value={brand}
                                            onChange={(e) => setBrand(e.target.value)}
                                            placeholder="Es: Mitica Cerimonia"
                                            className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-violet-600 focus:bg-white rounded-3xl transition-all outline-none font-bold text-gray-900"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2 ml-4">Macro Tipologia</label>
                                        <select
                                            value={macroTipo}
                                            onChange={(e) => setMacroTipo(e.target.value)}
                                            className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-violet-600 focus:bg-white rounded-3xl transition-all outline-none font-bold text-gray-900 appearance-none cursor-pointer"
                                            required
                                        >
                                            <option value="Abiti Lunghi">Abiti Lunghi</option>
                                            <option value="Completi/Pantaloni/Abiti Corti">Completi/Pantaloni/Abiti Corti</option>
                                        </select>
                                    </div>

                                    <div className="hidden">
                                        <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2 ml-4">Descrizione (Opzionale)</label>
                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="Racconta brevemente l'abito..."
                                            rows={4}
                                            className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-violet-600 focus:bg-white rounded-3xl transition-all outline-none font-medium text-gray-700 resize-none"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2 ml-4">Categoria</label>
                                            <select
                                                value={category}
                                                onChange={(e) => {
                                                    setCategory(e.target.value);
                                                    setSubcategory('');
                                                }}
                                                className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-violet-600 focus:bg-white rounded-3xl transition-all outline-none font-bold text-gray-900 appearance-none cursor-pointer"
                                                required
                                            >
                                                <option value="">Seleziona...</option>
                                                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2 ml-4">Sotto-cat</label>
                                            <select
                                                value={subcategory}
                                                onChange={(e) => setSubcategory(e.target.value)}
                                                className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-violet-600 focus:bg-white rounded-3xl transition-all outline-none font-bold text-gray-900 appearance-none cursor-pointer disabled:opacity-50"
                                                disabled={!category}
                                            >
                                                <option value="">Tutte</option>
                                                {category && SUBCATEGORIES[category]?.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 py-4 border-t border-gray-100 mt-4">
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                checked={isPromo}
                                                onChange={(e) => setIsPromo(e.target.checked)}
                                                className="w-6 h-6 rounded-lg border-gray-300 text-red-600 focus:ring-red-500 transition-all"
                                            />
                                            <span className="text-sm font-bold text-gray-700 group-hover:text-red-600 transition-colors uppercase tracking-widest">In Promozione</span>
                                        </label>
                                    </div>

                                    {isPromo && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            className="grid grid-cols-2 gap-6 pt-4 border-t border-gray-100"
                                        >
                                            <div>
                                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Prezzo Listino (€) *</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={priceList}
                                                    onChange={(e) => setPriceList(e.target.value)}
                                                    className="w-full bg-gray-50 border-none p-4 rounded-2xl focus:ring-2 focus:ring-violet-500 font-bold"
                                                    placeholder="150.00"
                                                    required={isPromo}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-black text-red-600 uppercase tracking-widest mb-2">Prezzo Scontato (€) *</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={promoPrice}
                                                    onChange={(e) => setPromoPrice(e.target.value)}
                                                    className="w-full bg-red-50 border-none p-4 rounded-2xl text-red-600 font-bold focus:ring-2 focus:ring-red-500"
                                                    placeholder="99.00"
                                                    required={isPromo}
                                                />
                                            </div>
                                        </motion.div>
                                    )}

                                    <div className="hidden">
                                        <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2 ml-4">Video (Carica file o inserisci URL)</label>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="file"
                                                    accept="video/*"
                                                    onChange={(e) => setVideoFile(e.target.files[0])}
                                                    className="hidden"
                                                    id="video-upload"
                                                />
                                                <label
                                                    htmlFor="video-upload"
                                                    className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-3xl border-2 border-dashed transition-all cursor-pointer font-bold ${videoFile ? 'border-violet-600 bg-violet-50 text-violet-700' : 'border-gray-200 hover:border-violet-400 bg-white text-gray-400'}`}
                                                >
                                                    <Upload size={18} />
                                                    {videoFile ? videoFile.name : 'Seleziona Video MP4'}
                                                </label>
                                                {videoFile && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setVideoFile(null)}
                                                        className="p-4 bg-red-50 text-red-500 rounded-3xl hover:bg-red-100 transition-all"
                                                    >
                                                        <X size={18} />
                                                    </button>
                                                )}
                                            </div>
                                            <input
                                                type="text"
                                                value={videoUrl}
                                                onChange={(e) => setVideoUrl(e.target.value)}
                                                placeholder="Oppure inserisci URL video..."
                                                className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-violet-600 focus:bg-white rounded-3xl transition-all outline-none font-bold text-gray-900"
                                                disabled={!!videoFile}
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-gray-100 mt-4">
                                        <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2 ml-4">Colori (Separati da virgola)</label>
                                        <input
                                            type="text"
                                            value={availableColors}
                                            onChange={(e) => setAvailableColors(e.target.value)}
                                            placeholder="Es: Rosso, Nero, Oro"
                                            className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-violet-600 focus:bg-white rounded-3xl transition-all outline-none font-bold text-gray-900"
                                        />
                                    </div>
                                </div>

                                {/* Image Section */}
                                <div className="space-y-6">
                                    <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2 ml-4">Immagini del Modello</label>

                                    <div className="relative group">
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        />
                                        <div className="border-4 border-dashed border-gray-100 rounded-[2rem] p-10 flex flex-col items-center justify-center text-center gap-4 group-hover:border-violet-200 group-hover:bg-violet-50 transition-all">
                                            <div className="bg-white p-4 rounded-full shadow-lg text-violet-600">
                                                <Upload size={32} />
                                            </div>
                                            <div>
                                                <p className="font-black text-gray-900 uppercase tracking-tight">Trascina o clicca</p>
                                                <p className="text-gray-400 text-sm font-medium">Puoi selezionare più immagini insieme</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-3">
                                        <AnimatePresence>
                                            {images.map((file, idx) => {
                                                const duplicateOf = checkDuplicate(file.name);
                                                return (
                                                    <motion.div
                                                        key={idx}
                                                        initial={{ scale: 0.8, opacity: 0 }}
                                                        animate={{ scale: 1, opacity: 1 }}
                                                        exit={{ scale: 0.8, opacity: 0 }}
                                                        className={`relative aspect-square rounded-2xl overflow-hidden group border ${duplicateOf ? 'border-amber-400 ring-2 ring-amber-100' : 'border-gray-100'}`}
                                                    >
                                                        <img
                                                            src={URL.createObjectURL(file)}
                                                            alt="preview"
                                                            className="w-full h-full object-cover"
                                                        />

                                                        {duplicateOf && (
                                                            <div className="absolute top-2 right-2 bg-amber-500 text-white p-1 rounded-full shadow-lg z-20" title={`Immagine già usata in: ${duplicateOf}`}>
                                                                <AlertTriangle size={14} />
                                                            </div>
                                                        )}

                                                        <button
                                                            type="button"
                                                            onClick={() => removeImage(idx)}
                                                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white z-10"
                                                        >
                                                            <Trash2 size={24} />
                                                        </button>

                                                        {duplicateOf && (
                                                            <div className="absolute bottom-0 inset-x-0 bg-amber-500/90 p-1 text-[8px] text-white text-center font-bold tracking-tighter truncate leading-tight">
                                                                Già Presente
                                                            </div>
                                                        )}
                                                    </motion.div>
                                                )
                                            })}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    type="submit"
                                    disabled={uploading}
                                    className={`flex-1 py-6 rounded-full font-black uppercase tracking-widest text-white transition-all shadow-xl hover:shadow-violet-200 flex items-center justify-center gap-4 ${uploading ? 'bg-gray-400' : editingQueueId ? 'bg-violet-600 hover:bg-violet-700' : 'bg-black hover:bg-violet-600'} active:scale-95`}
                                >
                                    {editingQueueId ? <Check size={24} /> : <Check size={24} />}
                                    {editingQueueId ? 'Salva Modifiche' : 'Aggiungi alla Coda'}
                                </button>
                                {editingQueueId && (
                                    <button
                                        type="button"
                                        onClick={cancelEdit}
                                        className="px-10 py-6 rounded-full font-black uppercase tracking-widest text-gray-400 bg-gray-100 hover:bg-gray-200 transition-all active:scale-95"
                                    >
                                        Annulla
                                    </button>
                                )}
                            </div>
                        </motion.form>
                    ) : (
                        <motion.div
                            key="csv"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-8"
                        >
                            <div className="flex flex-col md:flex-row gap-6">
                                <div className="flex-1 space-y-4">
                                    <div className="relative group min-h-[160px] border-4 border-dashed border-gray-100 rounded-[2rem] p-6 flex flex-col items-center justify-center text-center gap-4 hover:border-violet-200 hover:bg-violet-50 transition-all cursor-pointer">
                                        <input
                                            type="file"
                                            accept=".csv"
                                            onChange={handleCsvUpload}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        />
                                        <div className="bg-white p-3 rounded-full shadow-lg text-violet-600">
                                            <FileSpreadsheet size={24} />
                                        </div>
                                        <div>
                                            <p className="font-black text-gray-900 uppercase tracking-tight">1. Carica CSV</p>
                                            <p className="text-gray-400 text-sm font-medium">{csvFile ? csvFile.name : 'Trascina o clicca per caricare'}</p>
                                        </div>
                                    </div>

                                    <div className="relative group min-h-[160px] border-4 border-dashed border-gray-100 rounded-[2rem] p-6 flex flex-col items-center justify-center text-center gap-4 hover:border-violet-200 hover:bg-violet-50 transition-all cursor-pointer">
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            onChange={handleLocalImagesSelect}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        />
                                        <div className="bg-white p-3 rounded-full shadow-lg text-violet-600">
                                            <ImageIcon size={24} />
                                        </div>
                                        <div>
                                            <p className="font-black text-gray-900 uppercase tracking-tight">2. Seleziona Immagini Locali</p>
                                            <p className="text-gray-400 text-sm font-medium">Seleziona tutte le foto citate nel CSV ({localImages.length} selezionate)</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="md:w-64 flex flex-col justify-center gap-4">
                                    <button
                                        onClick={downloadTemplate}
                                        className="flex items-center justify-center gap-2 p-4 bg-gray-50 border border-gray-100 rounded-3xl text-gray-600 font-bold hover:bg-white transition-colors text-sm"
                                    >
                                        <Download size={18} /> Scarica Template CSV
                                    </button>
                                    <div className="p-4 bg-amber-50 rounded-3xl border border-amber-100">
                                        <p className="text-[10px] text-amber-700 font-black uppercase mb-1 tracking-widest">Procedura</p>
                                        <ol className="text-xs text-amber-600 font-medium list-decimal list-inside space-y-1 mt-2">
                                            <li>Scarica il template.</li>
                                            <li>Compila con i nomi dei file (es. foto1.jpg).</li>
                                            <li>Carica il CSV qui.</li>
                                            <li>Seleziona dal tuo computer tutte le foto insieme.</li>
                                            <li>Il sistema le abbinerà automaticamente.</li>
                                        </ol>
                                    </div>
                                </div>
                            </div>

                            {csvData.length > 0 && (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h3 className="font-serif font-black text-xl text-primary-950">Anteprima ({csvData.length} articoli)</h3>
                                        <button onClick={() => { setCsvData([]); setCsvFile(null); }} className="text-red-500 font-bold text-xs uppercase tracking-widest hover:underline">Annulla</button>
                                    </div>
                                    <div className="max-h-96 overflow-y-auto rounded-3xl border border-gray-100">
                                        <table className="w-full text-left">
                                            <thead className="sticky top-0 bg-gray-50 border-b border-gray-100">
                                                <tr className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
                                                    <th className="px-6 py-4">Reparto</th>
                                                    <th className="px-6 py-4">Prezzi</th>
                                                    <th className="px-6 py-4">Foto (Locali)</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {csvData.map((item, i) => (
                                                    <tr key={i} className="text-xs text-gray-700">
                                                        <td className="px-6 py-4">
                                                            <span className="bg-violet-50 text-violet-600 px-2 py-1 rounded-md font-black uppercase tracking-tighter text-[9px]">{item.category}</span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {item.promo_price ? (
                                                                <div className="flex flex-col">
                                                                    <span className="text-[10px] line-through text-gray-400">€{item.price_list}</span>
                                                                    <span className="text-[11px] font-black text-red-600">€{item.promo_price}</span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-[11px] font-bold">€{item.price_list || '0'}</span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col gap-1">
                                                                <div className="flex gap-1 flex-wrap">
                                                                    {item.imageUrls.map((img, idx) => {
                                                                        const isLocal = localImages.find(f => f.name === img);
                                                                        const duplicateOf = checkDuplicate(img);
                                                                        return (
                                                                            <span key={idx} className={`relative flex items-center justify-center w-3 h-3 rounded-full ${isLocal ? (duplicateOf ? 'bg-amber-400' : 'bg-green-500') : 'bg-red-300'}`} title={isLocal ? (duplicateOf ? `DUPLICATO: Già in uso su ${duplicateOf}` : `Locale: ${img}`) : `Assente/URL: ${img}`}>
                                                                                {duplicateOf && <AlertTriangle size={8} className="text-white" />}
                                                                            </span>
                                                                        )
                                                                    })}
                                                                </div>
                                                                <span className="text-[8px] text-gray-400">{item.imageUrls?.length} files</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <button
                                        onClick={addCsvToQueue}
                                        disabled={uploading}
                                        className={`w-full py-6 rounded-full font-black uppercase tracking-widest text-white transition-all shadow-xl hover:shadow-violet-200 flex items-center justify-center gap-4 ${uploading ? 'bg-gray-400' : 'bg-violet-600 hover:bg-violet-700 active:scale-95'}`}
                                    >
                                        <FileSpreadsheet size={24} /> Unisci e Aggiungi alla Coda
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* QUEUE TABLE SECTION */}
            {pendingProducts.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-12 bg-white rounded-[2.5rem] shadow-xl border border-gray-100 p-8">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <h3 className="text-2xl font-serif font-black text-primary-950">Coda di Pubblicazione</h3>
                            <span className="bg-violet-100 text-violet-600 px-3 py-1 rounded-full text-xs font-black">{pendingProducts.length}</span>
                        </div>
                        <button
                            onClick={publishQueue}
                            disabled={uploading}
                            className="px-8 py-4 bg-green-500 hover:bg-green-600 text-white rounded-full font-black uppercase tracking-widest shadow-lg shadow-green-200 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                        >
                            {uploading ? <Loader2 className="animate-spin" /> : <Upload size={20} />}
                            {uploading ? 'Pubblicazione...' : 'PUBBLICA TUTTO'}
                        </button>
                        {pendingProducts.some(p => p.status === 'done') && (
                            <button
                                onClick={clearCompleted}
                                className="bg-gray-100 text-gray-500 px-4 py-4 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-gray-200 transition-colors ml-4"
                            >
                                Svuota Completati
                            </button>
                        )}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-[10px] font-black uppercase text-gray-400 tracking-widest border-b border-gray-100">
                                    <th className="p-4">Media</th>
                                    <th className="p-4">Nome</th>
                                    <th className="p-4">Info</th>
                                    <th className="p-4">Stato</th>
                                    <th className="p-4 text-right">Azioni</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {pendingProducts.map((p, i) => (
                                    <tr key={p.id} className="group hover:bg-gray-50 transition-colors">
                                        <td className="p-4">
                                            <div className="flex -space-x-2">
                                                {p.images.slice(0, 3).map((img, idx) => (
                                                    <div key={idx} className="w-10 h-10 rounded-full border-2 border-white bg-gray-200 overflow-hidden relative">
                                                        {img instanceof File ? (
                                                            <img src={URL.createObjectURL(img)} className="w-full h-full object-cover" />
                                                        ) : (
                                                            // String (URL) or filename without local match
                                                            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-[8px] text-gray-400 overflow-hidden break-all leading-none">{typeof img === 'string' && img.startsWith('http') ? <img src={img} className="w-full h-full object-cover" /> : 'FILE'}</div>
                                                        )}
                                                    </div>
                                                ))}
                                                {p.images.length > 3 && <div className="w-10 h-10 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500">+{p.images.length - 3}</div>}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-bold text-gray-900">{p.name}</div>
                                            <div className="text-xs text-gray-400">{p.brand}</div>
                                        </td>
                                        <td className="p-4">
                                            <span className="bg-gray-100 px-2 py-1 rounded text-[10px] font-bold uppercase mr-2">{p.category}</span>
                                            {p.is_promo && <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-[10px] font-bold uppercase">Promo</span>}
                                        </td>
                                        <td className="p-4">
                                            {p.status === 'pending' && <span className="text-gray-400 text-xs font-bold uppercase">In Attesa</span>}
                                            {p.status === 'uploading' && <span className="text-violet-600 text-xs font-bold uppercase animate-pulse">Caricamento...</span>}
                                            {p.status === 'done' && <span className="text-green-500 text-xs font-bold uppercase flex items-center gap-1"><Check size={14} /> Fatto</span>}
                                            {p.status === 'error' && <span className="text-red-500 text-xs font-bold uppercase">Errore</span>}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleEditFromQueue(p)}
                                                    className="p-2 bg-white text-violet-600 rounded-xl hover:bg-violet-50 transition-colors border border-gray-100 shadow-sm"
                                                    title="Modifica"
                                                    disabled={p.status === 'uploading' || p.status === 'done'}
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => removeFromQueue(p.id)}
                                                    className="p-2 bg-white text-red-500 rounded-xl hover:bg-red-50 transition-colors border border-gray-100 shadow-sm"
                                                    title="Rimuovi"
                                                    disabled={p.status === 'uploading'}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            )}
            <div className="h-6"></div>

        </div >

    );
}
