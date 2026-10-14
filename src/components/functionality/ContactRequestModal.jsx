import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, MessageCircle, Mail, CheckCircle2, Loader2, Phone } from 'lucide-react';
import { db } from '../../services/firebaseConfig';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { registerToClub, splitName } from '../../services/newsletterService';
import AddressSelector from './AddressSelector';
import PhoneInput from './PhoneInput';

export default function ContactRequestModal({ isOpen, onClose, product }) {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        size: '',
        eventType: '',
        eventDate: '',
        notes: ''
    });



    const [isSent, setIsSent] = useState(false);
    const [sentType, setSentType] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    const handleConfirmSuccess = useCallback(async () => {
        // If already saved by automated flow, just go home
        if (isSaved) {
            navigate('/');
            onClose();
            return;
        }

        if (isSaving) return;
        setIsSaving(true);
        try {
            await addDoc(collection(db, "leads"), {
                ...formData,
                productId: product.id,
                productName: product.name,
                type: sentType || 'WhatsApp',
                status: 'Nuova',
                created_at: Timestamp.now()
            });
            setIsSaved(true);
            setIsSaving(false);

            // Redirect to home
            navigate('/');

            // Close after a brief success message
            setTimeout(() => {
                onClose();
                // Reset states after animation/close
                setTimeout(() => {
                    setIsSent(false);
                    setIsSaved(false);
                }, 500);
            }, 2000);
        } catch (error) {
            console.error("Error saving lead:", error);
            setIsSaving(false);
            // Fallback: go home anyway
            navigate('/');
            onClose();
        }
    }, [formData, product, sentType, isSaving, isSaved, onClose, navigate]);

    // Body Scroll Lock
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSendWhatsApp = async () => {
        setSentType('WhatsApp');
        setIsSent(true);
        setIsSaving(true);

        const phoneNumber = "393356588361";
        let message = `*RICHIESTA INFORMAZIONI*\n\nSalve Mitica Cerimonia,\nSono interessato/a a questo abito:\n- *${product.name}*\n\n- *I MIEI DATI:*\n- Nome: ${formData.name}\n- Tel: ${formData.phone}`;
        if (formData.size) message += `\n- Taglia: ${formData.size}`;
        if (formData.eventType) message += `\n- Tipo Evento: ${formData.eventType}`;
        if (formData.eventDate) message += `\n- Data Evento: ${formData.eventDate}`;
        if (formData.notes) message += `\n\n- *NOTE:*\n${formData.notes}`;

        // Only include product link if it's a real product (not a generic inquiry)
        const isRealProduct = product.id && !product.id.includes('CATALOG_') && !product.id.includes('NO_RESULTS');
        if (isRealProduct) {
            message += `\n\n- *LINK PRODOTTO:*\n${window.location.href}`;
        }

        const url = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;

        // Save to Firestore and ONLY THEN redirect
        try {
            await addDoc(collection(db, "leads"), {
                ...formData,
                productId: product.id,
                productName: product.name,
                type: 'WhatsApp',
                status: 'Nuova',
                created_at: Timestamp.now()
            });

            // Auto-register to Club Mitica (silent/fire-and-forget)
            const { firstName, lastName } = splitName(formData.name);
            registerToClub(firstName, lastName, formData.phone, '').catch(err => console.error("Auto-reg failed:", err));

            // Mostra l'alert visivo per 3 secondi prima di procedere all'apertura dell'app
            setTimeout(() => {
                setIsSaved(true);
                setIsSaving(false);

                // Apri l'app di WhatsApp solo ora
                window.location.assign(url);

                // Instant Home redirect
                navigate('/');

                // Chiudi tutto dopo 2 secondi
                setTimeout(() => {
                    onClose();
                    setTimeout(() => {
                        setIsSent(false);
                        setIsSaved(false);
                    }, 500);
                }, 2000);
            }, 3000);
        } catch (error) {
            console.error("Error saving lead:", error);
            setIsSaving(false);
            window.location.href = url;
        }
    };

    const handleSendEmail = async () => {
        setSentType('Email');
        setIsSent(true);
        setIsSaving(true);

        const subject = `Richiesta Info: ${product.name}`;

        // Only include product link if it's a real product (not a generic inquiry)
        const isRealProduct = product.id && !product.id.includes('CATALOG_') && !product.id.includes('NO_RESULTS');
        const productLink = isRealProduct ? `\n\n- LINK PRODOTTO:\n${window.location.href}` : '';

        const body = `RICHIESTA INFORMAZIONI\n\nSalve Mitica Cerimonia,\nVorrei informazioni sul seguente prodotto:\n\n- PRODOTTO: ${product.name}\n\n- DETTAGLI CLIENTE:\n- Nome: ${formData.name}\n- Telefono: ${formData.phone}\n- Taglia: ${formData.size}\n- Tipo Evento: ${formData.eventType}\n- Data: ${formData.eventDate || 'Da definire'}\n\n- NOTE:\n${formData.notes || 'Nessuna nota aggiuntiva'}${productLink}`;

        const url = `mailto:celebrity.fashion335@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

        // Save to Firestore and ONLY THEN redirect
        try {
            await addDoc(collection(db, "leads"), {
                ...formData,
                productId: product.id,
                productName: product.name,
                type: 'Email',
                status: 'Nuova',
                created_at: Timestamp.now()
            });

            // Auto-register to Club Mitica (silent/fire-and-forget)
            const { firstName, lastName } = splitName(formData.name);
            registerToClub(firstName, lastName, formData.phone, '').catch(err => console.error("Auto-reg failed:", err));
            // Wait, form has phone. Email is sent via mailto but user inputs phone in form.
            // Actually the form input is "Telefono".

            setIsSaved(true);
            setIsSaving(false);

            // Trigger app launch immediately
            window.location.assign(url);

            // Instant Home redirect
            navigate('/');

            setTimeout(() => {
                onClose();
                setTimeout(() => {
                    setIsSent(false);
                    setIsSaved(false);
                }, 500);
            }, 3000);
        } catch (error) {
            console.error("Error saving lead:", error);
            setIsSaving(false);
            window.location.href = url;
        }
    };

    const handleSendPhone = async () => {
        setSentType('Telefono');
        setIsSent(true);
        setIsSaving(true);

        const url = 'tel:+390693579105';

        // Save to Firestore and ONLY THEN redirect
        try {
            await addDoc(collection(db, "leads"), {
                ...formData,
                productId: product.id,
                productName: product.name,
                type: 'Telefono',
                status: 'Nuova',
                created_at: Timestamp.now()
            });

            // Auto-register to Club Mitica (silent/fire-and-forget)
            const { firstName, lastName } = splitName(formData.name);
            registerToClub(firstName, lastName, formData.phone, '').catch(err => console.error("Auto-reg failed:", err));

            setIsSaved(true);
            setIsSaving(false);

            // Trigger app launch immediately
            window.location.assign(url);

            // Instant Home redirect
            navigate('/');

            setTimeout(() => {
                onClose();
                setTimeout(() => {
                    setIsSent(false);
                    setIsSaved(false);
                }, 500);
            }, 3000);
        } catch (error) {
            console.error("Error saving lead:", error);
            setIsSaving(false);
            window.location.href = url;
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-fade-in"
            onClick={onClose}
        >
            <div
                className="glass-effect rounded-[2rem] shadow-2xl max-w-sm w-full p-8 relative animate-slide-up max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-black transition"
                >
                    <X size={24} />
                </button>

                {!isSent ? (
                    <>
                        <div className="mb-8">
                            <h3 className="text-3xl font-serif text-primary-950 mb-2 leading-tight">Info su Prodotto</h3>
                            <div className="h-1 w-12 bg-primary-600 rounded-full mb-3"></div>
                            <p className="text-gray-500 text-sm italic">
                                Ricevi una consulenza personalizzata su <span className="font-bold text-primary-900">{product.name}</span>.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="group">
                                <label className="block text-[10px] uppercase tracking-[0.2em] font-black text-gray-400 mb-1.5 ml-1">Nome e Cognome *</label>
                                <input
                                    type="text"
                                    className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl p-3.5 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white focus:outline-none text-gray-900 transition-all shadow-sm"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Es: Maria Rossi"
                                />
                            </div>

                            <div className="group">
                                <label className="block text-[10px] uppercase tracking-[0.2em] font-black text-gray-400 mb-1.5 ml-1">Telefono *</label>
                                <PhoneInput
                                    value={formData.phone}
                                    onChange={(value) => setFormData({ ...formData, phone: value })}
                                    required
                                    placeholder="333 1234567"
                                />
                            </div>

                            <div className="group">
                                <label className="block text-[10px] uppercase tracking-[0.2em] font-black text-gray-400 mb-1.5 ml-1">Tipo Evento *</label>
                                <select
                                    className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl p-3.5 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white focus:outline-none text-gray-900 transition-all shadow-sm appearance-none cursor-pointer"
                                    value={formData.eventType}
                                    onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                                >
                                    <option value="" disabled hidden>Seleziona tipo evento...</option>
                                    <option value="Matrimonio">Matrimonio</option>
                                    <option value="Comunione">Comunione</option>
                                    <option value="Cresima">Cresima</option>
                                    <option value="Battesimo">Battesimo</option>
                                    <option value="Diciottesimo">Diciottesimo</option>
                                    <option value="Invitato/a">Invitato/a</option>
                                    <option value="Altro">Altro (Specificare nelle note)</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="group">
                                    <label className="block text-[10px] uppercase tracking-[0.2em] font-black text-gray-400 mb-1.5 ml-1">Taglia *</label>
                                    <input
                                        type="text"
                                        className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl p-3.5 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white focus:outline-none text-gray-900 transition-all shadow-sm"
                                        value={formData.size}
                                        onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                                        placeholder="Taglia"
                                    />
                                </div>
                                <div className="group">
                                    <label className="block text-[10px] uppercase tracking-[0.2em] font-black text-gray-400 mb-1.5 ml-1">Data Evento *</label>
                                    <input
                                        type="date"
                                        min={new Date().toISOString().split('T')[0]}
                                        className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl p-3.5 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white focus:outline-none text-gray-900 transition-all shadow-sm"
                                        value={formData.eventDate}
                                        onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="group">
                                <label className="block text-[10px] uppercase tracking-[0.2em] font-black text-gray-400 mb-1.5 ml-1">Note (Opzionale)</label>
                                <textarea
                                    className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl p-3.5 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white focus:outline-none text-gray-900 h-20 transition-all shadow-sm resize-none"
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="Domande particolari..."
                                ></textarea>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <button
                                    onClick={handleSendWhatsApp}
                                    disabled={!formData.name || !formData.phone || !formData.size || !formData.eventDate || !formData.eventType}
                                    className={`flex items-center justify-center gap-2 py-4 rounded-2xl text-white font-bold transition-all duration-300 shadow-lg active:scale-95 ${formData.name && formData.phone && formData.size && formData.eventDate && formData.eventType
                                        ? 'bg-[#25D366] hover:bg-[#20bd5a] hover:shadow-[#25D366]/20'
                                        : 'bg-[#25D366]/20 text-[#25D366]/40 cursor-not-allowed shadow-none border border-[#25D366]/10'
                                        }`}
                                >
                                    <MessageCircle size={20} /> WhatsApp
                                </button>
                                <button
                                    onClick={handleSendPhone}
                                    disabled={!formData.name || !formData.phone || !formData.size || !formData.eventDate || !formData.eventType}
                                    className={`flex items-center justify-center gap-2 py-4 rounded-2xl text-white font-bold transition-all duration-300 shadow-lg active:scale-95 ${formData.name && formData.phone && formData.size && formData.eventDate && formData.eventType
                                        ? 'bg-black hover:bg-gray-900 hover:shadow-gray-900/20'
                                        : 'bg-black/20 text-black/40 cursor-not-allowed shadow-none border border-black/10'
                                        }`}
                                >
                                    <Phone size={20} /> Chiama
                                </button>
                                <button
                                    onClick={handleSendEmail}
                                    disabled={!formData.name || !formData.phone || !formData.size || !formData.eventDate || !formData.eventType}
                                    className="col-span-2 flex items-center justify-center gap-2 py-4 rounded-2xl text-white font-bold transition-all duration-300 shadow-lg active:scale-95 bg-black hover:bg-gray-900 disabled:bg-gray-100 disabled:text-gray-300 disabled:shadow-none disabled:cursor-not-allowed"
                                >
                                    <Mail size={20} /> Invia via Email
                                </button>
                            </div>

                            {(!formData.name || !formData.phone || !formData.size || !formData.eventDate || !formData.eventType) && (
                                <p className="text-[10px] text-center text-primary-600/60 mt-2 font-medium uppercase tracking-wider">
                                    Compila i campi * per abilitare l'invio.
                                </p>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="py-12 text-center space-y-6 animate-fade-in">
                        {!isSaved ? (
                            <>
                                <div className="relative w-24 h-24 mx-auto mb-8">
                                    <div className="absolute inset-0 bg-primary-100 rounded-full animate-ping opacity-20"></div>
                                    <div className="relative bg-white rounded-full p-6 shadow-xl border border-primary-50 flex items-center justify-center">
                                        <Loader2 className="text-primary-600 animate-spin" size={40} />
                                    </div>
                                </div>
                                <h3 className="text-2xl font-serif text-primary-950">In attesa...</h3>
                                {sentType === 'WhatsApp' ? (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mx-4 animate-pulse">
                                        <p className="text-yellow-800 text-sm font-bold">
                                            ATTENZIONE: Ricordati di premere il tasto INVIA su WhatsApp per inoltrarci il messaggio!
                                        </p>
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-sm leading-relaxed px-4">
                                        Completa l&apos;invio su <strong>{sentType}</strong>. Appena tornerai qui, la richiesta sarà confermata.
                                    </p>
                                )}
                                <button
                                    onClick={handleConfirmSuccess}
                                    className="text-primary-600 text-xs font-bold underline cursor-pointer hover:text-primary-800 transition"
                                >
                                    Clicca qui se hai già inviato
                                </button>
                            </>
                        ) : (
                            <div className="animate-bounce-in">
                                <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                                    <CheckCircle2 className="text-green-500" size={50} />
                                </div>
                                <h3 className="text-2xl font-serif text-primary-950 mb-4">Grazie Mille!</h3>
                                <p className="text-gray-600 text-sm leading-relaxed mb-6">
                                    La tua richiesta per <strong>{product.name}</strong> è stata registrata. Ti contatteremo a breve!
                                </p>
                                <div className="p-4 bg-primary-50 rounded-2xl border border-primary-100">
                                    <p className="text-[10px] uppercase tracking-widest font-black text-primary-900 mb-2">Ci trovi in Atelier:</p>
                                    <AddressSelector
                                        address="Mitica Cerimonia, Via dei Prati Fiscali 325, Roma"
                                        displayText="Via dei Prati Fiscali 325, Roma"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
