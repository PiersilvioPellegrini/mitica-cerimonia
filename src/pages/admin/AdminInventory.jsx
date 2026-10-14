import React, { useState, useEffect } from 'react';
import { db, storage } from '../../services/firebaseConfig';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { Plus, Trash, Edit, Upload, X, ChevronDown, Layers, Calendar, Tag, RefreshCw, AlertTriangle, Package, CheckCircle, Search } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '../../components/ui/Skeleton';
import { colorMap, getColorSortIndex } from '../../utils/colorUtils';
import { compressImage } from '../../utils/imageUtils';
import { logAdminAction, getAdminLogs } from '../../services/adminLogService';

export default function AdminInventory() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isToolsOpen, setIsToolsOpen] = useState(false);
    const [completedActions, setCompletedActions] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [expandedCategories, setExpandedCategories] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const editId = searchParams.get('editId');
    const returnTo = searchParams.get('returnTo');

    const [formData, setFormData] = useState({
        code: '',
        name: '',
        category: 'Donna',
        tipologia: '',
        anno: new Date().getFullYear().toString(),
        brand: '',
        description: '',
        images: [],
        videoUrl: '',
        videoFile: null,
        available_colors: [],
        variants: [],
        is_new: true,
        is_promo: false,
        price_list: '',
        promo_price: '',
        macro_tipo: 'Abiti Lunghi' // Default value
    });

    const [currentVariant, setCurrentVariant] = useState({ size: '', color: '', quantity: 1 });
    const [uploading, setUploading] = useState(false);
    const [migrating, setMigrating] = useState(false);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const querySnapshot = await getDocs(collection(db, "products"));
            const productsData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Sort: Newest Day -> Color -> Newest Time
            productsData.sort((a, b) => {
                const dateA = a.created_at?.seconds || a.createdAt?.seconds || 0;
                const dateB = b.created_at?.seconds || b.createdAt?.seconds || 0;

                // 1. Group by Day
                const dayA = Math.floor(dateA / 86400);
                const dayB = Math.floor(dateB / 86400);
                if (dayA !== dayB) return dayB - dayA;

                // 2. Sort by Color
                // Admin product usually has available_colors array or variants
                const colA = (Array.isArray(a.available_colors) ? a.available_colors[0] : a.available_colors) || '';
                const colB = (Array.isArray(b.available_colors) ? b.available_colors[0] : b.available_colors) || '';
                const colorDiff = getColorSortIndex(colA) - getColorSortIndex(colB);
                if (colorDiff !== 0) return colorDiff;

                // 3. Exact Time
                return dateB - dateA;
            });

            setProducts(productsData);

            // Auto-open edit modal if editId is present
            if (editId) {
                const productToEdit = productsData.find(p => p.id === editId);
                if (productToEdit) {
                    handleEdit(productToEdit);
                    // Clear param so refreshing doesn't re-open or interfere
                    // window.history.replaceState({}, '', '/admin/inventory'); // Optional, maybe keep it?
                }
            }
        } catch (error) {
            console.error("Error fetching products:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleVariantChange = (e) => {
        const { name, value } = e.target;
        setCurrentVariant(prev => ({ ...prev, [name]: value }));
    };

    const addVariant = () => {
        if (!currentVariant.size || !currentVariant.color) {
            alert("Inserisci taglia e colore per la variante.");
            return;
        }
        setFormData(prev => ({
            ...prev,
            variants: [...prev.variants, { ...currentVariant }]
        }));
        setCurrentVariant({ size: '', color: '', quantity: 1 });
    };

    const removeVariant = (index) => {
        setFormData(prev => ({
            ...prev,
            variants: prev.variants.filter((_, i) => i !== index)
        }));
    };

    const handleImageUpload = async (e) => {
        const files = e.target.files;
        if (!files.length) return;

        setUploading(true);
        const newImages = [...formData.images];
        const newThumbnails = []; // Temporary buffer for this batch

        try {
            for (const file of files) {
                // 1. Compress Image
                let fileToUpload = file;
                try {
                    fileToUpload = await compressImage(file);
                } catch (err) {
                    console.error("Compression failed, using original", err);
                }

                // 2. Create Thumbnail
                let thumbToUpload = null;
                try {
                    thumbToUpload = await createThumbnail(file); // Create from original to avoid double compression issues or just re-use compressed
                } catch (err) {
                    console.error("Thumbnail creation failed", err);
                }

                // 3. Upload Main Image
                const storageRef = ref(storage, `products/${Date.now()}_${fileToUpload.name}`);
                await uploadBytes(storageRef, fileToUpload);
                const url = await getDownloadURL(storageRef);
                newImages.push(url);

                // 4. Upload Thumbnail (if created)
                if (thumbToUpload) {
                    const thumbRef = ref(storage, `products/thumbs/${Date.now()}_${thumbToUpload.name}`);
                    await uploadBytes(thumbRef, thumbToUpload);
                    const thumbUrl = await getDownloadURL(thumbRef);
                    newThumbnails.push(thumbUrl);
                } else {
                    newThumbnails.push(url); // Fallback to main url
                }
            }
            // Update both images and thumbnails in form data
            setFormData(prev => ({
                ...prev,
                images: newImages,
                thumbnails: [...(prev.thumbnails || []), ...newThumbnails]
            }));
        } catch (error) {
            console.error("Upload failed", error);
            alert("Errore caricamento immagini");
        } finally {
            setUploading(false);
        }
    };

    const handleVideoFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({ ...prev, videoFile: file }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation: If Category is Promozione OR is_promo is checked, prices are MANDATORY.
        if (formData.category === 'Promozione' || formData.is_promo) {
            if (!formData.price_list || !formData.promo_price) {
                alert("ERRORE: Per i prodotti in Promozione (o Categoria Promozione), i campi 'Prezzo Listino' e 'Prezzo Scontato' sono OBBLIGATORI.");
                return;
            }
        }

        setLoading(true);
        try {
            const productData = {
                ...formData,
                // Auto-generate name if empty
                name: formData.name || `${formData.macro_tipo || 'Articolo'} ${formData.category} ${formData.tipologia} ${formData.available_colors?.[0] || ''}`.trim(),
                // Auto-generate description if empty
                description: formData.description || `Nuova Collezione ${new Date().getFullYear()} - ${formData.category}`,
                // Auto-generate code if empty
                code: formData.code || `MC-${Date.now().toString().slice(-6)}`.toUpperCase(),
                is_promo: formData.category === 'Promozione' || formData.is_promo, // Auto-set based on category OR checkbox
                macro_tipo: formData.macro_tipo || 'Abiti Lunghi',
                tipologia: formData.tipologia, // Consistency
                subcategory: formData.tipologia, // Ensure subcategory matches tipologia
                updated_at: Timestamp.now()
            };

            // Handle local video upload if present
            if (formData.videoFile) {
                const videoRef = ref(storage, `products/videos/${Date.now()}_${formData.videoFile.name}`);
                await uploadBytes(videoRef, formData.videoFile);
                productData.videoUrl = await getDownloadURL(videoRef);
            }

            // Remove temporary UI fields
            delete productData.videoFile;
            // Note: is_new is now PRESERVED/SAVED

            if (editingId) {
                await updateDoc(doc(db, "products", editingId), productData);
            } else {
                productData.created_at = Timestamp.now();
                await addDoc(collection(db, "products"), productData);
            }

            setIsModalOpen(false);
            setEditingId(null);
            resetForm();
            fetchProducts();

            // Navigate back if returnTo is present (e.g., back to product detail)
            if (returnTo) {
                navigate(returnTo);
            }
        } catch (error) {
            console.error("Error saving product:", error);
            alert("Errore durante il salvataggio: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (product) => {
        setFormData({
            code: product.code || '',
            name: product.name || '',
            category: product.category || 'Donna',
            tipologia: product.tipologia || product.subcategory || '',
            anno: product.anno || '',
            brand: product.brand || '',
            description: product.description || '',
            images: product.images || [],
            videoUrl: product.videoUrl || '',
            videoFile: null,
            available_colors: product.available_colors || [],
            variants: product.variants || [],
            is_new: product.is_new !== undefined ? product.is_new : false,
            is_promo: product.is_promo || false,
            price_list: product.price_list || '',
            promo_price: product.promo_price || '',
            macro_tipo: product.macro_tipo || 'Abiti Lunghi'
        });
        setEditingId(product.id);
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setFormData({
            code: '',
            name: '',
            category: 'Donna',
            tipologia: '',
            anno: new Date().getFullYear().toString(),
            brand: '',
            description: '',
            images: [],
            videoUrl: '',
            videoFile: null,
            available_colors: [],
            variants: [],
            is_new: true,
            is_promo: false,
            price_list: '',
            promo_price: '',
            macro_tipo: 'Abiti Lunghi'
        });
        setEditingId(null);
    };

    const toggleCategory = (cat) => {
        setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
    };

    const { filteredGroups, stats, duplicates } = (() => {
        const codeCount = {};
        products.forEach(p => {
            const c = String(p.code || '').trim().toLowerCase();
            if (c) codeCount[c] = (codeCount[c] || 0) + 1;
        });
        const dups = Object.keys(codeCount).filter(c => codeCount[c] > 1);

        const filtered = products.filter(p => {
            const search = searchTerm.toLowerCase();
            return (
                p.name?.toLowerCase().includes(search) ||
                p.code?.toLowerCase().includes(search) ||
                p.brand?.toLowerCase().includes(search) ||
                p.category?.toLowerCase().includes(search) ||
                p.subcategory?.toLowerCase().includes(search)
            );
        });

        const groups = filtered.reduce((acc, product) => {
            let cat = product.category || 'Altro';
            if (product.is_promo) {
                cat = 'Promozione';
            }
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(product);
            return acc;
        }, {});

        const stats = {
            total: products.length,
            promo: products.filter(p => p.is_promo).length,
            new: products.filter(p => p.is_new).length,
            duplicates: dups.length
        };

        return { filteredGroups: groups, stats, duplicates: dups };
    })();

    const handleDelete = async (id) => {
        if (!window.confirm("Sei sicuro di voler eliminare questo prodotto?")) return;
        try {
            await deleteDoc(doc(db, "products", id));
            fetchProducts();
        } catch (error) {
            console.error("Error deleting product:", error);
        }
    };

    return (
        <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                    <div className="text-gray-400 text-xs font-black uppercase tracking-widest mb-1">Totale Prodotti</div>
                    <div className="text-3xl font-serif font-black text-primary-950">{stats.total}</div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                    <div className="text-violet-500 text-xs font-black uppercase tracking-widest mb-1">In Promozione</div>
                    <div className="text-3xl font-serif font-black text-violet-600">{stats.promo}</div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                    <div className="text-primary-900 text-xs font-black uppercase tracking-widest mb-1">Novità</div>
                    <div className="text-3xl font-serif font-black text-primary-950">{stats.new}</div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                    <div className="text-red-500 text-xs font-black uppercase tracking-widest mb-1">Duplicati (Codice)</div>
                    <div className="text-3xl font-serif font-black text-red-600">{stats.duplicates}</div>
                </div>
            </div>

            {/* Search & Actions */}
            <div className="flex flex-col md:flex-row gap-4 mb-8">
                <div className="flex-1 relative">
                    <input
                        type="text"
                        placeholder="Cerca per nome, codice o brand..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white border border-gray-200 p-4 pl-12 pr-12 rounded-2xl focus:ring-2 focus:ring-violet-500 transition-all font-medium shadow-sm"
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                        <Search size={20} />
                    </div>
                    {searchTerm && (
                        <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors p-1">
                            <X size={18} />
                        </button>
                    )}
                </div>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <button onClick={() => setIsToolsOpen(true)} className="flex items-center justify-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-full hover:bg-gray-800 transition font-bold shadow-lg text-sm w-full sm:w-auto">
                        <Layers size={20} /> STRUMENTI & LOG
                    </button>
                    <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="flex items-center justify-center gap-2 bg-violet-600 text-white px-6 py-3 rounded-full hover:bg-violet-700 transition font-bold shadow-lg w-full sm:w-auto">
                        <Plus size={20} /> Aggiungi Prodotto
                    </button>
                </div>
            </div>

            {/* Product List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex gap-6 items-center">
                                <Skeleton className="w-16 h-20 rounded-xl" />
                                <div className="flex-1 space-y-2"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-6 w-1/2" /></div>
                                <div className="flex-1"><Skeleton className="h-6 w-20 ml-auto" /></div>
                            </div>
                        ))}
                    </div>
                ) : Object.keys(filteredGroups).length === 0 ? (
                    <div className="bg-white rounded-[2rem] p-20 text-center space-y-4 border border-gray-100 shadow-sm text-gray-400">
                        <Package size={48} className="mx-auto" />
                        <h3 className="text-xl font-serif">Nessun prodotto trovato.</h3>
                    </div>
                ) : (
                    Object.keys(filteredGroups || {}).sort().map(category => (
                        <div key={category} className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/50 overflow-hidden border border-gray-100 mb-6">
                            <button onClick={() => toggleCategory(category)} className="w-full flex items-center justify-between p-4 sm:p-6 hover:bg-gray-50 transition-all group">
                                <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                                    <ChevronDown size={20} className={`transition-transform duration-300 ${(expandedCategories[category] || searchTerm) ? 'rotate-180 text-violet-600' : 'text-gray-400'}`} />
                                    <div className="text-left flex items-center gap-2 sm:gap-3 flex-wrap">
                                        <h3 className="text-xl sm:text-2xl font-serif text-primary-950 font-bold">{category}</h3>
                                        <span className="bg-violet-50 text-violet-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex-shrink-0">{filteredGroups[category]?.length || 0} Modelli</span>
                                    </div>
                                </div>
                            </button>

                            <AnimatePresence>
                                {(expandedCategories[category] || searchTerm) && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden bg-gray-50/30 p-2 sm:p-4 space-y-2">
                                        {filteredGroups[category]?.map((product) => (
                                            <div key={product.id} className="bg-white border p-3 sm:p-4 rounded-2xl flex items-center gap-3 sm:gap-6 border-gray-100 transition-all hover:shadow-md">
                                                <div className="w-16 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100">
                                                    {product.images?.[0] ? <img src={product.images[0]} alt="" className="w-full h-full object-cover" /> : <Package className="w-full h-full p-4 text-gray-300" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                        {product.is_promo && <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-black">PROMO</span>}
                                                        <span className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-black uppercase">{product.macro_tipo}</span>
                                                    </div>
                                                    <div className="text-[12px] text-primary-950 font-bold uppercase tracking-widest mt-1 truncate">
                                                        {product.tipologia} • {Array.isArray(product.available_colors) ? product.available_colors.join(', ') : product.available_colors}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => handleEdit(product)} className="p-2 sm:p-3 bg-gray-50 text-gray-400 hover:text-violet-600 rounded-xl transition-all"><Edit size={16} /></button>
                                                    <button onClick={() => handleDelete(product.id)} className="p-2 sm:p-3 bg-gray-50 text-gray-400 hover:text-red-500 rounded-xl transition-all"><Trash size={16} /></button>
                                                </div>
                                            </div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))
                )}
            </div>

            {/* Modal Form */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white mx-auto max-w-4xl w-full rounded-[2.5rem] shadow-2xl p-8 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-6">
                            <h3 className="text-2xl font-bold font-serif text-primary-950">{editingId ? 'Modifica Prodotto' : 'Nuovo Prodotto'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500 p-2"><X size={28} /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-10">
                            <section className="space-y-6">
                                <h4 className="text-lg font-bold text-violet-600 border-l-4 border-violet-500 pl-3">Informazioni Base</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="md:col-span-2 hidden">
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Nome Prodotto (Auto-generato)</label>
                                        <input name="name" value={formData.name} onChange={handleChange} className="w-full bg-gray-50 border-none p-4 rounded-2xl" placeholder="Es. Abito Aura" />
                                    </div>
                                    <div className="hidden">
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Codice *</label>
                                        <input name="code" value={formData.code} onChange={handleChange} className="w-full bg-gray-50 border-none p-4 rounded-2xl font-mono" placeholder="MS-12345" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Categoria *</label>
                                        <select required name="category" value={formData.category} onChange={handleChange} className="w-full bg-gray-50 border-none p-4 rounded-2xl">
                                            {/* Explicitly defined options to avoid caching issues */}
                                            <option value="Donna">Donna</option>
                                            <option value="Uomo">Uomo</option>
                                            <option value="Sposa">Sposa</option>
                                            <option value="Sposo">Sposo</option>
                                            <option value="Bambini">Bambini</option>
                                            <option value="Promozione">Promozione</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Tipologia *</label>
                                        <select required name="tipologia" value={formData.tipologia} onChange={handleChange} className="w-full bg-gray-50 border-none p-4 rounded-2xl">
                                            <option value="">Seleziona...</option>
                                            <option value="Sposa">Sposa</option>
                                            <option value="Sposo">Sposo</option>
                                            <option value="Cerimonia">Cerimonia</option>
                                            <option value="Accessori">Accessori</option>
                                            <option value="Scarpe">Scarpe</option>
                                        </select>
                                    </div>
                                    {!['Uomo', 'Sposo'].includes(formData.category) && (
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Macro Tipologia *</label>
                                            <select required={!['Uomo', 'Sposo'].includes(formData.category)} name="macro_tipo" value={formData.macro_tipo} onChange={handleChange} className="w-full bg-gray-50 border-none p-4 rounded-2xl">
                                                <option value="Abiti Lunghi">Abiti Lunghi</option>
                                                <option value="Completi/Pantaloni/Abiti Corti">Completi/Pantaloni/Abiti Corti</option>
                                            </select>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-3 pt-8">
                                        <input
                                            type="checkbox"
                                            name="is_promo"
                                            id="is_promo_check"
                                            checked={formData.is_promo || formData.category === 'Promozione'}
                                            onChange={handleChange}
                                            className="w-6 h-6 rounded-md border-gray-300 text-violet-600 focus:ring-violet-500"
                                            disabled={formData.category === 'Promozione'}
                                        />
                                        <label htmlFor="is_promo_check" className="text-sm font-bold text-gray-700">
                                            In Promozione
                                        </label>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 md:pt-0 md:col-span-2">
                                        {formData.category === 'Promozione' && (
                                            <>
                                                <div>
                                                    <label className="block text-sm font-bold text-gray-700 mb-2">Prezzo Listino (€) *</label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        name="price_list"
                                                        value={formData.price_list}
                                                        onChange={handleChange}
                                                        className="w-full bg-gray-50 border-none p-4 rounded-2xl focus:ring-2 focus:ring-violet-500 font-bold"
                                                        placeholder="150.00"
                                                        required={formData.is_promo}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-bold text-red-600 mb-2">Prezzo Scontato (€) *</label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        name="promo_price"
                                                        value={formData.promo_price}
                                                        onChange={handleChange}
                                                        className="w-full bg-red-50 border-none p-4 rounded-2xl text-red-600 font-bold focus:ring-2 focus:ring-red-500"
                                                        placeholder="99.00"
                                                        required={formData.is_promo}
                                                    />
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="hidden">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Descrizione *</label>
                                    <textarea name="description" value={formData.description} onChange={handleChange} className="w-full bg-gray-50 border-none p-4 rounded-2xl min-h-[100px]" placeholder="..." />
                                </div>
                                <div className="hidden">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Video (Carica file o inserisci URL)</label>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="file"
                                                accept="video/*"
                                                onChange={handleVideoFileChange}
                                                className="hidden"
                                                id="inventory-video-upload"
                                            />
                                            <label
                                                htmlFor="inventory-video-upload"
                                                className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-2xl border-2 border-dashed transition-all cursor-pointer font-bold ${formData.videoFile ? 'border-violet-600 bg-violet-50 text-violet-700' : 'border-gray-50 hover:border-violet-400 bg-gray-50 text-gray-400'}`}
                                            >
                                                <Upload size={18} />
                                                {formData.videoFile ? formData.videoFile.name : 'Seleziona Video MP4'}
                                            </label>
                                            {formData.videoFile && (
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, videoFile: null }))}
                                                    className="p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-100 transition-all font-bold"
                                                >
                                                    <X size={18} />
                                                </button>
                                            )}
                                        </div>
                                        <input
                                            name="videoUrl"
                                            value={formData.videoUrl}
                                            onChange={handleChange}
                                            className="w-full bg-gray-50 border-none p-4 rounded-2xl"
                                            placeholder="https://..."
                                            disabled={!!formData.videoFile}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Colori (Separati da virgola)</label>
                                    <input
                                        name="available_colors"
                                        value={Array.isArray(formData.available_colors) ? formData.available_colors.join(', ') : formData.available_colors}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setFormData(prev => ({
                                                ...prev,
                                                available_colors: val.split(',').map(s => s.trim())
                                            }));
                                        }}
                                        className="w-full bg-gray-50 border-none p-4 rounded-2xl"
                                        placeholder="Rosso, Nero, Oro"
                                    />
                                </div>
                            </section>

                            <section className="space-y-6">
                                <h4 className="text-lg font-bold text-gray-900 border-l-4 border-gray-900 pl-3">Media</h4>
                                <div className="flex justify-center p-8 border-2 border-dashed border-gray-300 rounded-2xl hover:bg-gray-50 transition relative">
                                    <input type="file" multiple accept="image/*,video/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" disabled={uploading} />
                                    <div className="text-center">
                                        {uploading ? <RefreshCw className="mx-auto animate-spin text-gray-400" /> : <Upload className="mx-auto text-gray-400" />}
                                        <p className="mt-2 text-sm text-gray-500 font-bold">Carica file</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 gap-4">
                                    {formData.images.map((url, i) => (
                                        <div key={i} className="relative group aspect-[3/4] rounded-xl overflow-hidden shadow-sm">
                                            <img src={url} className="w-full h-full object-cover" alt="" />
                                            <button type="button" onClick={() => setFormData(prev => ({ ...prev, images: prev.images.filter((_, idx) => idx !== i) }))} className="absolute top-2 right-2 bg-white/90 text-red-500 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition"><X size={12} /></button>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section className="space-y-6">
                                <h4 className="text-lg font-bold text-amber-600 border-l-4 border-amber-500 pl-3">Varianti</h4>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-amber-50 p-6 rounded-2xl">
                                    <div><label className="block text-xs font-bold mb-1 pl-1">Taglia</label><input name="size" value={currentVariant.size} onChange={handleVariantChange} className="w-full bg-white p-3 rounded-xl border border-amber-100" /></div>
                                    <div><label className="block text-xs font-bold mb-1 pl-1">Colore</label><select name="color" value={currentVariant.color} onChange={handleVariantChange} className="w-full bg-white p-3 rounded-xl border border-amber-100">{Object.keys(colorMap).map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                                    <div><label className="block text-xs font-bold mb-1 pl-1">Stock</label><input type="number" name="quantity" value={currentVariant.quantity} onChange={handleVariantChange} className="w-full bg-white p-3 rounded-xl border border-amber-100" /></div>
                                    <button type="button" onClick={addVariant} className="bg-amber-500 text-white p-3 rounded-xl font-bold shadow-md hover:bg-amber-600">Aggiungi</button>
                                </div>
                                <div className="space-y-2">
                                    {formData.variants.map((v, i) => (
                                        <div key={i} className="flex justify-between items-center p-3 bg-white border border-gray-100 rounded-xl">
                                            <span className="font-bold">{v.size} / {v.color} - Qty: {v.quantity}</span>
                                            <button type="button" onClick={() => removeVariant(i)} className="text-red-400"><Trash size={16} /></button>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <div className="flex justify-end gap-4 pt-8">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-4 font-bold text-gray-400">Annulla</button>
                                <button type="submit" className="px-12 py-4 bg-violet-600 text-white rounded-full font-black shadow-xl hover:bg-violet-700 disabled:bg-gray-300" disabled={loading || uploading || (formData.images.length === 0 && !formData.videoFile && !formData.videoUrl)}>
                                    {loading ? 'Salvataggio...' : editingId ? 'Salva Modifiche' : 'Pubblica'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )
            }

            {
                isToolsOpen && (
                    <DBToolsModal
                        onClose={() => setIsToolsOpen(false)}
                        onActionStart={() => setMigrating(true)}
                        onActionEnd={() => { setMigrating(false); fetchProducts(); }}
                        migrating={migrating}
                        completedActions={completedActions}
                        onActionComplete={(name) => setCompletedActions(prev => [...prev, name])}
                    />
                )
            }
        </div >
    );
}

function DBToolsModal({ onClose, onActionStart, onActionEnd, migrating, completedActions, onActionComplete }) {
    const [logs, setLogs] = useState([]);
    const [activeTab, setActiveTab] = useState('actions');

    useEffect(() => { loadLogs(); }, []);
    const loadLogs = async () => { setLogs(await getAdminLogs()); };

    const runAction = async (title, desc, fn) => {
        if (!window.confirm(`Eseguire: ${title}?`)) return;
        onActionStart();
        try {
            await logAdminAction({ action: title, description: `Inizio: ${desc}`, status: 'PENDING' });
            await fn();
            await logAdminAction({ action: title, description: 'Completato con successo', status: 'SUCCESS' });
            onActionComplete(title);
            alert('Completato!');
        } catch (e) {
            await logAdminAction({ action: title, description: `Errore: ${e.message}`, status: 'ERROR' });
            alert('Errore!');
        } finally {
            onActionEnd();
            loadLogs();
        }
    };

    const actions = [
        {
            title: 'TUTTO IN PROMOZIONE', desc: 'Imposta is_promo su TRUE per tutti i prodotti.', color: 'bg-amber-500', icon: Tag, fn: async () => {
                const querySnapshot = await getDocs(collection(db, "products"));
                await Promise.all(querySnapshot.docs.map(d => updateDoc(doc(db, "products", d.id), { is_promo: true })));
            }
        },
        {
            title: 'RIMUOVI PROMOZIONE', desc: 'Rimuove il flag promo da tutto il catalogo.', color: 'bg-gray-600', icon: X, fn: async () => {
                const querySnapshot = await getDocs(collection(db, "products"));
                await Promise.all(querySnapshot.docs.map(d => updateDoc(doc(db, "products", d.id), { is_promo: false })));
            }
        },
        {
            title: 'PULIZIA DUPLICATI', desc: 'Rimuovi prodotti con lo stesso codice (mantiene il più recente).', color: 'bg-blue-500', icon: RefreshCw, fn: async () => {
                const querySnapshot = await getDocs(collection(db, "products"));
                const codeMap = {};
                const toDelete = [];
                querySnapshot.docs.forEach(d => {
                    const data = d.data();
                    const code = String(data.code || '').trim().toLowerCase();
                    if (!code) return;
                    if (codeMap[code]) {
                        const existing = codeMap[code];
                        if (data.updated_at?.seconds > existing.updated_at?.seconds) {
                            toDelete.push(existing.id);
                            codeMap[code] = { id: d.id, updated_at: data.updated_at };
                        } else {
                            toDelete.push(d.id);
                        }
                    } else {
                        codeMap[code] = { id: d.id, updated_at: data.updated_at };
                    }
                });
                await Promise.all(toDelete.map(id => deleteDoc(doc(db, "products", id))));
            }
        },
        {
            title: 'OTTIMIZZA IMMAGINI (WebP)',
            desc: 'Converte tutte le immagini del catalogo in WebP riducendo il peso. Potrebbe richiedere tempo.',
            color: 'bg-green-600',
            icon: RefreshCw,
            fn: async () => {
                if (!window.confirm("Questo processo genererà anche le MINIATURE (Thumbnails) per velocizzare il caricamento. Potrebbe impiegare molto tempo. Continuare?")) return;

                const productsSnap = await getDocs(collection(db, "products"));
                let count = 0;

                for (const d of productsSnap.docs) {
                    const data = d.data();
                    const images = data.images || [];

                    const newImages = [];
                    const newThumbnails = [];
                    let changed = false;

                    for (const url of images) {
                        try {
                            // If it's a firebase storage url
                            if (typeof url === 'string' && url.includes('firebasestorage')) {
                                // 1. Fetch Blob
                                const res = await fetch(url);
                                const blob = await res.blob();

                                // 2. Extract Filename
                                let filename = 'image.jpg';
                                try {
                                    const path = decodeURIComponent(url.split('/o/')[1].split('?')[0]);
                                    filename = path.split('/').pop() || 'image.jpg';
                                } catch (e) { }

                                const originalFile = new File([blob], filename, { type: blob.type });

                                // 3. A) Optimize Main Image (if not already WebP)
                                let mainUrl = url;
                                if (!url.toLowerCase().includes('.webp')) {
                                    const compressed = await compressImage(originalFile);
                                    const storageRef = ref(storage, `products/${Date.now()}_${compressed.name}`);
                                    await uploadBytes(storageRef, compressed);
                                    mainUrl = await getDownloadURL(storageRef);

                                    try {
                                        const oldPath = decodeURIComponent(url.split('/o/')[1].split('?')[0]);
                                        await deleteObject(ref(storage, oldPath));
                                    } catch (e) { }
                                    changed = true;
                                }

                                // 3. B) Generate Thumbnail 
                                // (Always do it if missing, or if we just optimized main)
                                // We'll just generate it to be safe if it doesn't exist or just force update logic?
                                // Let's just create one.
                                const thumbFile = await createThumbnail(originalFile);
                                const thumbRef = ref(storage, `products/thumbs/${Date.now()}_${thumbFile.name}`);
                                await uploadBytes(thumbRef, thumbFile);
                                const thumbUrl = await getDownloadURL(thumbRef);

                                newImages.push(mainUrl);
                                newThumbnails.push(thumbUrl);
                                changed = true; // Thumbnails added count as change
                            } else {
                                newImages.push(url);
                                newThumbnails.push(url); // Fallback
                            }
                        } catch (err) {
                            console.error("Error processing image", url, err);
                            newImages.push(url);
                            // Keep empty or push url to thumbnail? Push url to avoid index mismatch
                            newThumbnails.push(url);
                        }
                    }

                    if (changed || !data.thumbnails) {
                        await updateDoc(doc(db, "products", d.id), {
                            images: newImages,
                            thumbnails: newThumbnails,
                            updated_at: Timestamp.now()
                        });
                        count++;
                    }
                }
                alert(`Ottimizzazione completa! Aggiornati ${count} prodotti con miniature.`);
            }
        },
        {
            title: 'SVUOTA DATABASE', desc: 'ELIMINA DEFINITIVAMENTE TUTTI I PRODOTTI. ATTENZIONE: AZIONE IRREVERSIBILE.', color: 'bg-red-600', icon: Trash, fn: async () => {
                if (!window.confirm("SEI ASSOLUTAMENTE SICURO? Questa azione cancellerà l'intero catalogo.")) return;
                if (!window.confirm("ULTIMA CONFERMA: Non potrai recuperare i dati. Procedere?")) return;
                const querySnapshot = await getDocs(collection(db, "products"));
                await Promise.all(querySnapshot.docs.map(d => deleteDoc(doc(db, "products", d.id))));
            }
        }
    ];

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center p-4 z-[100]">
            <div className="bg-white w-full max-w-5xl h-[80vh] rounded-[2.5rem] shadow-2xl flex overflow-hidden">
                <div className="w-64 bg-gray-50 border-r p-6 flex flex-col justify-between">
                    <div className="space-y-2">
                        <h3 className="text-xl font-serif font-black mb-8">Strumenti DB</h3>
                        <button onClick={() => setActiveTab('actions')} className={`w-full text-left p-4 rounded-xl font-bold text-sm ${activeTab === 'actions' ? 'bg-primary-900 text-white' : 'text-gray-500'}`}>Azioni</button>
                        <button onClick={() => setActiveTab('logs')} className={`w-full text-left p-4 rounded-xl font-bold text-sm ${activeTab === 'logs' ? 'bg-primary-900 text-white' : 'text-gray-500'}`}>Storico</button>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 font-bold">Chiudi</button>
                </div>
                <div className="flex-1 p-8 overflow-y-auto">
                    {activeTab === 'actions' ? (
                        <div className="grid grid-cols-2 gap-6">
                            {actions.map((a, i) => (
                                <div key={i} className="border p-6 rounded-2xl">
                                    <div className={`p-3 w-fit rounded-xl text-white mb-4 ${a.color}`}><a.icon size={24} /></div>
                                    <h4 className="font-bold text-lg mb-2">{a.title}</h4>
                                    <p className="text-sm text-gray-500 mb-6">{a.desc}</p>
                                    <button onClick={() => runAction(a.title, a.desc, a.fn)} disabled={migrating || completedActions.includes(a.title)} className="w-full py-3 bg-gray-50 font-bold rounded-xl hover:bg-black hover:text-white transition">Esegui</button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {logs.map((l, i) => (
                                <div key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className={`w-2 h-2 rounded-full ${l.status === 'SUCCESS' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                                        <span className="font-bold text-sm">{l.action}</span>
                                    </div>
                                    <p className="text-sm text-gray-600">{l.description}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
