import React, { useState } from 'react';
import { db } from '../../services/firebaseConfig';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { registerToClub } from '../../services/newsletterService';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Phone, Mail, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import PhoneInput from './PhoneInput';

export default function NewsletterSignup() {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        email: ''
    });
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        const cleanPhone = formData.phone.replace(/\D/g, ''); // Remove non-digits
        // Assuming prefix is included (e.g. 39333...), total length should be at least 11-12 digits?
        // Or if formData.phone is "+39 333...", we check the number part.
        // Let's strip the known prefix or just check total length.
        // Italian mobile: 3xx xxxxxxx (9-10 digits). Prefix +39 adds 2 digits.
        // Reasonable min length for a valid full number including prefix: 11-12.
        if (cleanPhone.length < 11) {
            setError("Inserisci un numero di telefono valido (almeno 9 cifre dopo il prefisso).");
            return;
        }

        if (!formData.email.includes('@') || !formData.email.includes('.')) {
            setError("Inserisci un indirizzo email valido.");
            return;
        }

        if (!formData.firstName || !formData.lastName) return;

        setIsSaving(true);
        setError(null);

        try {
            // Pass true for checkDuplicates
            const result = await registerToClub(formData.firstName, formData.lastName, formData.phone, formData.email, true);

            if (result.success) {
                if (result.isDuplicate) {
                    setError("Utente già registrato con questo telefono o email.");
                } else {
                    setIsSaved(true);
                }
            } else {
                setError(result.message || "Si è verificato un errore.");
            }
        } catch (err) {
            console.error("Error signing up:", err);
            setError("Si è verificato un errore. Riprova più tardi.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <section className="py-20 px-4 bg-white relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-primary-50 rounded-full -ml-32 -mt-32 blur-3xl opacity-50"></div>
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-violet-50 rounded-full -mr-32 -mb-32 blur-3xl opacity-50"></div>

            <div className="max-w-4xl mx-auto relative z-10">
                <div className="bg-gray-50/50 backdrop-blur-md rounded-[3rem] p-8 md:p-16 border border-gray-100 shadow-sm text-center">
                    <AnimatePresence mode="wait">
                        {!isSaved ? (
                            <motion.div
                                key="form"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="space-y-8"
                            >
                                <div className="space-y-4">
                                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-50 text-violet-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-violet-100 mb-2">
                                        <Sparkles size={14} /> Join the Club
                                    </div>
                                    <h2 className="text-4xl md:text-5xl font-serif text-primary-950 font-black leading-tight">
                                        Entra nel Mondo <br /> <span className="text-violet-600 italic">Mitica Cerimonia</span>
                                    </h2>
                                    <p className="text-gray-500 font-medium max-w-lg mx-auto leading-relaxed">
                                        Iscriviti per ricevere in anteprima le nuove collezioni, eventi esclusivi e promozioni dedicate ai nostri clienti.
                                    </p>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-4 max-w-3xl mx-auto">
                                    {/* Row 1: Names */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Nome</label>
                                            <input
                                                required
                                                type="text"
                                                value={formData.firstName}
                                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                                placeholder="Nome"
                                                className="w-full bg-white border border-gray-100 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:outline-none transition-all shadow-sm"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Cognome</label>
                                            <input
                                                required
                                                type="text"
                                                value={formData.lastName}
                                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                                placeholder="Cognome"
                                                className="w-full bg-white border border-gray-100 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:outline-none transition-all shadow-sm"
                                            />
                                        </div>
                                    </div>

                                    {/* Row 2: Contacts */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Telefono</label>
                                            <PhoneInput
                                                value={formData.phone}
                                                onChange={(value) => setFormData({ ...formData, phone: value })}
                                                placeholder="333 1234567"
                                                required
                                                className="w-full"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Email</label>
                                            <input
                                                required
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                placeholder="tua@email.com"
                                                className="w-full bg-white border border-gray-100 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:outline-none transition-all shadow-sm"
                                            />
                                        </div>
                                    </div>
                                    <div className="md:col-span-1">
                                        <button
                                            type="submit"
                                            disabled={isSaving}
                                            className="w-full bg-black text-white font-black uppercase tracking-widest text-[10px] p-5 rounded-2xl hover:bg-neutral-800 transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {isSaving ? <Loader2 size={16} className="animate-spin" /> : 'Iscriviti'}
                                        </button>
                                    </div>
                                </form>
                                {error && <p className="text-red-500 text-xs font-bold mt-2">{error}</p>}
                            </motion.div>
                        ) : (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="space-y-6 py-8"
                            >
                                <div className="w-20 h-20 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                                    <CheckCircle2 size={40} />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-3xl font-serif text-primary-950 font-black">Benvenuto nel Club!</h3>
                                    <p className="text-gray-500 font-medium">La tua iscrizione è stata confermata correttamente. A presto!</p>
                                </div>
                                <button
                                    onClick={() => setIsSaved(false)}
                                    className="text-violet-600 text-[10px] font-black uppercase tracking-widest hover:underline"
                                >
                                    Iscrivi un altro contatto
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </section>
    );
}
