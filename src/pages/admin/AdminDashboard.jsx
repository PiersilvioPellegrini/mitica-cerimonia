import React, { useState, useEffect } from 'react';
import { getGlobalStats, getTopProducts } from '../../services/analyticsService';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';
import { BarChart3, TrendingUp, Package, Eye, ArrowRight, ExternalLink, Mail, Calendar, X, Database, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Skeleton } from '../../components/ui/Skeleton';

export default function AdminDashboard() {
    const [stats, setStats] = useState({ total_product_views: 0 });
    const [topProducts, setTopProducts] = useState([]);
    const [totalProducts, setTotalProducts] = useState(0);
    const [totalLeads, setTotalLeads] = useState(0);
    const [totalAppointments, setTotalAppointments] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                // Individual fetches to prevent one failure from blocking all
                const fetchGlobalStats = async () => {
                    try { return await getGlobalStats(); } catch { return { total_product_views: 0 }; }
                };
                const fetchTopProducts = async () => {
                    try { return await getTopProducts(5); } catch { return []; }
                };
                const fetchProducts = async () => {
                    try { return await getDocs(collection(db, 'products')); } catch { return { size: 0, docs: [] }; }
                };
                const fetchLeads = async () => {
                    try { return await getDocs(collection(db, 'leads')); } catch { return { size: 0, docs: [] }; }
                };
                const fetchApps = async () => {
                    try { return await getDocs(collection(db, 'appointments')); } catch { return { size: 0, docs: [] }; }
                };

                const [globalStats, topProds, productsSnap, leadsSnap, appsSnap] = await Promise.all([
                    fetchGlobalStats(),
                    fetchTopProducts(),
                    fetchProducts(),
                    fetchLeads(),
                    fetchApps()
                ]);

                setStats(globalStats || { total_product_views: 0 });
                setTopProducts(topProds || []);
                setTotalProducts(productsSnap.size || 0);
                setTotalLeads(leadsSnap.size || 0);
                setTotalAppointments(appsSnap.size || 0);
            } catch (error) {
                console.error("Critical Dashboard Error:", error);
            } finally {
                setLoading(false);
            }
        };

        loadDashboardData();
    }, []);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-4xl font-serif text-primary-950 font-black">Dashboard</h2>
                        <p className="text-gray-600 font-medium">Panoramica delle attività sul sito.</p>
                    </div>
                    <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full border border-green-200 shadow-sm animate-pulse-slow">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-xs font-black uppercase tracking-widest">Sistema Online</span>
                    </div>
                </div>

                {/* Stat Cards */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-2 gap-3 md:gap-6"
                >
                    {[
                        { icon: Eye, label: 'Views', value: stats.total_product_views, color: 'violet' },
                        { icon: Package, label: 'Prodotti', value: totalProducts, color: 'green' },
                        { icon: Mail, label: 'Info Prodotto', value: totalLeads, color: 'blue' },
                        { icon: Calendar, label: 'Richieste App', value: totalAppointments, color: 'amber' }
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            variants={itemVariants}
                            className="bg-white p-3 md:p-6 rounded-[1.5rem] md:rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center sm:items-center gap-2 md:gap-5 hover:shadow-xl hover:shadow-primary-900/5 transition-all group overflow-hidden"
                        >
                            <div className={`bg-${stat.color}-50 p-2 md:p-4 rounded-2xl md:rounded-3xl text-${stat.color}-600 group-hover:scale-110 transition-transform flex-shrink-0`}>
                                <stat.icon className="w-5 h-5 md:w-6 md:h-6" />
                            </div>
                            <div className="min-w-0 flex-1 w-full text-center sm:text-left">
                                {loading ? (
                                    <Skeleton className="h-6 w-12 md:h-8 md:w-16 mb-1 mx-auto sm:mx-0" />
                                ) : (
                                    <div className="text-base sm:text-xl md:text-2xl font-black text-gray-950 tracking-tight break-words leading-none mb-1">
                                        {stat.value}
                                    </div>
                                )}
                                <div className="text-[9px] md:text-[10px] text-gray-400 font-black uppercase tracking-widest break-words leading-tight">
                                    {stat.label}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Detailed Stats */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Top Products */}
                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-8 border-b border-gray-50 flex justify-between items-center">
                            <h3 className="text-xl font-bold font-serif text-primary-950 flex items-center gap-2">
                                <BarChart3 className="text-violet-600" size={24} />
                                I più cercati
                            </h3>
                            <span className="text-[10px] font-black bg-violet-50 text-violet-600 px-3 py-1 rounded-full uppercase tracking-widest">Ultimi 7 giorni</span>
                        </div>
                        <div className="p-8 space-y-6">
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <div key={i} className="flex items-center justify-between p-4">
                                        <div className="flex items-center gap-4 flex-1">
                                            <Skeleton variant=" pill" className="w-10 h-10" />
                                            <div className="space-y-2 flex-1">
                                                <Skeleton className="h-4 w-3/4" />
                                                <Skeleton className="h-3 w-1/4" />
                                            </div>
                                        </div>
                                        <Skeleton className="h-6 w-12" />
                                    </div>
                                ))
                            ) : topProducts.length > 0 ? (
                                topProducts.map((product, idx) => (
                                    <motion.div
                                        key={product.productId}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="flex items-center justify-between group hover:bg-gray-50/80 p-4 rounded-2xl transition-all border border-transparent hover:border-gray-100"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center font-black text-gray-400 text-sm group-hover:bg-primary-900 group-hover:text-white transition-colors">
                                                {idx + 1}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-950 group-hover:text-primary-900 transition-colors uppercase tracking-tight">{product.name}</div>
                                                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">ID: {product.productId.substring(0, 8)}...</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <div className="text-lg font-black text-gray-950">{product.views}</div>
                                                <div className="text-[9px] text-gray-400 font-bold uppercase">Click</div>
                                            </div>
                                            <Link to={`/product/${product.productId}`} target="_blank" className="p-2 text-gray-400 hover:text-primary-900 transition-colors">
                                                <ExternalLink size={18} />
                                            </Link>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="text-center py-10 text-gray-400 italic">Nessun dato di visualizzazione ancora disponibile.</div>
                            )}
                        </div>
                    </div>

                    {/* Quick Info / Tips */}
                    <div className="space-y-6">
                        <div className="bg-violet-600 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 group-hover:scale-110 transition-transform duration-700"></div>
                            <h4 className="text-2xl font-serif font-bold mb-4">Gestisci il Catalogo</h4>
                            <p className="text-violet-100 mb-8 font-medium">Controlla l&apos;inventario e gestisci le impostazioni della piattaforma.</p>
                            <div className="flex flex-col gap-3">
                                <Link to="/admin/inventory" className="flex items-center justify-between bg-white/10 hover:bg-white/20 backdrop-blur-md p-4 rounded-2xl transition-all font-bold">
                                    Vai all&apos;Inventario <ArrowRight size={20} />
                                </Link>
                                <Link to="/admin/requests" className="flex items-center justify-between bg-white/10 hover:bg-white/20 backdrop-blur-md p-4 rounded-2xl transition-all font-bold">
                                    Richieste & Messaggi <ArrowRight size={20} />
                                </Link>
                                <Link to="/admin/simple-uploader" className="flex items-center justify-between bg-white text-violet-600 hover:bg-violet-50 p-4 rounded-2xl transition-all font-black shadow-lg">
                                    Caricamento Rapido Immagini <Upload size={20} />
                                </Link>
                            </div>
                        </div>

                        <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm">
                            <h4 className="font-bold text-gray-950 mb-4 flex items-center gap-2">
                                <TrendingUp className="text-green-500" size={20} />
                                Suggerimento del sistema
                            </h4>
                            <p className="text-sm text-gray-600 leading-relaxed font-medium mb-6">
                                I prodotti con più visualizzazioni potrebbero beneficiare di uno sconto temporaneo o di una posizione in vetrina nella home page per massimizzare le conversioni.
                            </p>

                        </div>

                        <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-full -mr-16 -mt-16 opacity-50"></div>
                            <h4 className="font-bold text-gray-950 mb-4 flex items-center gap-2">
                                <Database className="text-red-500" size={20} />
                                Manutenzione Sistema
                            </h4>
                            <p className="text-sm text-gray-600 leading-relaxed font-medium mb-6">
                                Strumenti avanzati per la pulizia del database e la gestione tecnica del catalogo.
                            </p>
                            <div className="space-y-3">
                                <Link
                                    to="/admin/inventory"
                                    className="flex items-center justify-between p-4 bg-gray-50 hover:bg-red-50 text-gray-700 hover:text-red-700 rounded-2xl transition-all font-bold group"
                                    onClick={() => {
                                        // We can't easily pass state through Link to open modal, 
                                        // but we can suggest the user to use the tools button there.
                                    }}
                                >
                                    Pulizia Totale <ArrowRight size={18} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                </Link>
                                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                                    <p className="text-[10px] text-amber-700 font-bold uppercase">Suggerimento</p>
                                    <p className="text-xs text-amber-600 font-medium">Usa "Strumenti" in Inventario per rimuovere i duplicati.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
