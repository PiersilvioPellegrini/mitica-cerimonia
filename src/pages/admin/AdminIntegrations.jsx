import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, RefreshCw, CheckCircle, AlertTriangle, Link as LinkIcon, Database, Mail, ShieldCheck } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';

export default function AdminIntegrations() {
    const navigate = useNavigate();
    const [emailConfig, setEmailConfig] = useState({ targetEmail: '' });
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');

    useEffect(() => {
        const loadConfig = async () => {
            setLoading(true);
            try {
                const docRef = doc(db, "config", "notifications");
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setEmailConfig(docSnap.data());
                }
            } catch (error) {
                console.error("Error loading config:", error);
            } finally {
                setLoading(false);
            }
        };
        loadConfig();
    }, []);

    const handleSaveEmail = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await setDoc(doc(db, "config", "notifications"), emailConfig);
            setStatus('✅ Configurazione salvata con successo');
            setTimeout(() => setStatus(''), 3000);
        } catch (error) {
            console.error("Error saving email config:", error);
            setStatus('❌ Errore durante il salvataggio');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 md:p-8 bg-gray-50 min-h-screen text-left">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
                        <ShieldCheck className="text-violet-600 w-8 h-8" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-serif text-primary-950">Strumenti di Sistema</h2>
                        <p className="text-gray-600 font-medium">Gestione notifiche e configurazioni tecniche.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Notification Settings */}
                    <div className="bg-white rounded-[2rem] shadow-xl overflow-hidden border border-gray-100 p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="bg-violet-50 p-3 rounded-2xl text-violet-600">
                                <Mail size={24} />
                            </div>
                            <h3 className="text-xl font-bold font-serif text-primary-950">Email Notifiche</h3>
                        </div>
                        <form onSubmit={handleSaveEmail} className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Email per Appuntamenti & Leads</label>
                                <input
                                    type="email"
                                    value={emailConfig.targetEmail}
                                    onChange={(e) => setEmailConfig({ targetEmail: e.target.value })}
                                    className="w-full bg-gray-50 border-none p-4 rounded-2xl focus:ring-2 focus:ring-violet-500 font-medium shadow-inner"
                                    placeholder="info@miticacerimonia.it"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-2 bg-primary-950 text-white py-4 rounded-2xl font-bold hover:bg-black transition-all shadow-lg active:scale-95 disabled:opacity-50"
                            >
                                <Save size={18} /> {loading ? 'Salvataggio...' : 'Salva Configurazione'}
                            </button>
                        </form>
                    </div>

                    {/* Quick Access to Maintenance */}
                    <div className="bg-white rounded-[2rem] shadow-xl overflow-hidden border border-gray-100 p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="bg-red-50 p-3 rounded-2xl text-red-600">
                                <Database size={24} />
                            </div>
                            <h3 className="text-xl font-bold font-serif text-primary-950">Manutenzione DB</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-8 font-medium">
                            Per eseguire la pulizia dei duplicati o svuotare completamente il catalogo, utilizza gli strumenti avanzati nella sezione Inventario.
                        </p>
                        <button
                            onClick={() => navigate('/admin/inventory')}
                            className="w-full flex items-center justify-center gap-2 bg-gray-50 text-gray-700 py-4 rounded-2xl font-bold hover:bg-gray-100 transition-all border border-gray-100"
                        >
                            <RefreshCw size={18} /> Vai agli Strumenti DB
                        </button>
                    </div>
                </div>

                {status && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 rounded-2xl text-center font-bold ${status.includes('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                    >
                        {status}
                    </motion.div>
                )}
            </div>
        </div>
    );
}
