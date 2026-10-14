import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebaseConfig';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { MessageCircle, Phone, Mail, Calendar, CheckCircle2, Trash2, Clock, Filter, Download, User, Scissors, Type, Sparkles, RefreshCw } from 'lucide-react';
import { registerToClub, splitName } from '../../services/newsletterService';

export default function AdminRequests() {
    const [leads, setLeads] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [newsletter, setNewsletter] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('leads'); // 'leads', 'appointments', or 'newsletter'

    useEffect(() => {
        const qLeads = query(collection(db, "leads"), orderBy("created_at", "desc"));
        const qApps = query(collection(db, "appointments"), orderBy("created_at", "desc"));
        const qNews = query(collection(db, "newsletter"), orderBy("created_at", "desc"));

        const unsubLeads = onSnapshot(qLeads, (snapshot) => {
            setLeads(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }, (error) => {
            console.error("Error fetching leads:", error);
        });

        const unsubApps = onSnapshot(qApps, (snapshot) => {
            setAppointments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }, (error) => {
            console.error("Error fetching appointments:", error);
        });

        const unsubNews = onSnapshot(qNews, (snapshot) => {
            const rawData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Client-side deduplication for display (keeps latest entry per contact)
            const uniqueMap = new Map();
            rawData.forEach(item => {
                if (item.contact && !uniqueMap.has(item.contact)) {
                    uniqueMap.set(item.contact, item);
                }
            });

            setNewsletter(Array.from(uniqueMap.values()));
            setLoading(false);
        }, (error) => {
            console.error("Error fetching newsletter:", error);
            setLoading(false);
        });

        return () => {
            unsubLeads();
            unsubApps();
            unsubNews();
        };
    }, []);

    const updateStatus = async (collectionName, id, newStatus) => {
        try {
            await updateDoc(doc(db, collectionName, id), {
                status: newStatus,
                managed_at: Timestamp.now()
            });
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    const deleteRequest = async (collectionName, id) => {
        if (window.confirm("Sei sicuro di voler eliminare questa richiesta?")) {
            try {
                await deleteDoc(doc(db, collectionName, id));
            } catch (error) {
                console.error("Error deleting request:", error);
            }
        }
    };

    const handleSyncContacts = async () => {
        if (!window.confirm("Vuoi sincronizzare tutti i contatti passati nel Club Mitica? Questo importerà Leads e Appuntamenti esistenti.")) return;

        const originalLoading = loading;
        setLoading(true); // Show loading spinner
        let count = 0;
        let errors = 0;

        try {
            // Sync Leads
            for (const lead of leads) {
                if (lead.phone || lead.email) {
                    const contact = lead.phone || lead.email;
                    if (contact) {
                        const { firstName, lastName } = splitName(lead.name);
                        const res = await registerToClub(firstName, lastName, contact, true);
                        if (res.success && !res.isDuplicate) count++;
                    }
                }
            }

            // Sync Appointments
            for (const app of appointments) {
                if (app.phone || app.email) {
                    const contact = app.phone || app.email;
                    if (contact) {
                        const { firstName, lastName } = splitName(app.name);
                        const res = await registerToClub(firstName, lastName, contact, true);
                        if (res.success && !res.isDuplicate) count++;
                    }
                }
            }
            alert(`Sincronizzazione completata!\n\nNuovi contatti aggiunti: ${count}`);
        } catch (e) {
            console.error("Sync error:", e);
            alert("Errore durante la sincronizzazione. Controlla la console.");
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return '-';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return new Intl.DateTimeFormat('it-IT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    const downloadCSV = () => {
        const dataToExport = activeTab === 'leads' ? leads : (activeTab === 'appointments' ? appointments : newsletter);
        if (dataToExport.length === 0) return;

        // Header
        let headers = [];
        if (activeTab === 'leads') {
            headers = ['Data', 'Nome', 'Prodotto', 'Taglia', 'Evento', 'Canale', 'Note', 'Status'];
        } else if (activeTab === 'appointments') {
            headers = ['Data', 'Nome', 'Taglia', 'Evento', 'Data Evento', 'Canale', 'Note', 'Status'];
        } else {
            headers = ['Data Registro', 'Nome', 'Cognome', 'Telefono', 'Email', 'Status'];
        }

        // Rows
        const rows = dataToExport.map(item => {
            if (activeTab === 'leads') {
                return [
                    formatDate(item.created_at),
                    item.name || '-',
                    item.productName || '-',
                    item.size || '-',
                    item.eventType || '-',
                    item.type || '-',
                    item.notes || '-',
                    item.status || '-'
                ];
            } else if (activeTab === 'appointments') {
                return [
                    formatDate(item.created_at),
                    item.name || '-',
                    item.size || '-',
                    item.eventType || '-',
                    item.eventDate || '-',
                    item.channel || '-',
                    item.notes || '-',
                    item.status || '-'
                ];
            } else {
                return [
                    formatDate(item.created_at),
                    item.firstName || '-',
                    item.lastName || '-',
                    item.phone || item.contact || '-', // Fallback to contact if phone empty (legacy)
                    item.email || '-',
                    item.status || '-'
                ];
            }
        });

        const csvContent = [
            headers.join(','),
            ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `mitica_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-4xl font-serif text-primary-950 font-black">Richieste & Leads</h2>
                        <p className="text-gray-600 font-medium">Gestione contatti e appuntamenti dal sito.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100">
                            <button
                                onClick={() => setActiveTab('leads')}
                                className={`px-6 py-2.5 rounded-xl font-bold transition-all text-sm flex items-center gap-2 ${activeTab === 'leads' ? 'bg-violet-600 text-white shadow-lg shadow-violet-200' : 'text-gray-500 hover:text-gray-950'}`}
                            >
                                <Mail size={18} /> Info su Prodotto ({leads.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('appointments')}
                                className={`px-6 py-2.5 rounded-xl font-bold transition-all text-sm flex items-center gap-2 ${activeTab === 'appointments' ? 'bg-violet-600 text-white shadow-lg shadow-violet-200' : 'text-gray-500 hover:text-gray-950'}`}
                            >
                                <Calendar size={18} /> Richieste Appuntamenti ({appointments.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('newsletter')}
                                className={`px-6 py-2.5 rounded-xl font-bold transition-all text-sm flex items-center gap-2 ${activeTab === 'newsletter' ? 'bg-violet-600 text-white shadow-lg shadow-violet-200' : 'text-gray-500 hover:text-gray-950'}`}
                            >
                                <Sparkles size={18} /> Club Mitica ({newsletter.length})
                            </button>
                        </div>

                        <button
                            onClick={downloadCSV}
                            disabled={
                                activeTab === 'leads' ? leads.length === 0 :
                                    (activeTab === 'appointments' ? appointments.length === 0 : newsletter.length === 0)
                            }
                            className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-2xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        >
                            <Download size={18} /> Esporta CSV
                        </button>

                        <button
                            onClick={handleSyncContacts}
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-3 bg-violet-50 border border-violet-100 text-violet-700 hover:bg-violet-100 rounded-2xl font-bold text-sm transition-all disabled:opacity-50"
                            title="Importa contatti da Leads e Appuntamenti"
                        >
                            <RefreshCw size={18} /> Sincronizza
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="py-20 text-center animate-pulse text-gray-400 font-bold uppercase tracking-widest text-xs">Caricamento richieste...</div>
                ) : (
                    <div className="space-y-4">
                        {activeTab === 'leads' ? (
                            leads.length > 0 ? (
                                <div className="grid grid-cols-1 gap-4">
                                    {leads.map(lead => (
                                        <div key={lead.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-violet-200/20 transition-all group">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                                <div className="flex items-start gap-4">
                                                    <div className={`p-4 rounded-3xl ${lead.type === 'WhatsApp' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                                                        {lead.type === 'WhatsApp' ? <MessageCircle size={24} /> : <Mail size={24} />}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-3">
                                                            <h4 className="text-xl font-black text-gray-950">{lead.name}</h4>
                                                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${lead.status === 'Nuova' ? 'bg-violet-100 text-violet-600' : 'bg-gray-100 text-gray-500'}`}>
                                                                {lead.status}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-gray-500 font-medium mt-1">
                                                            Interessato/a a: <span className="text-violet-600 font-bold">{lead.productName}</span>
                                                            {lead.size && <span className="ml-2 bg-gray-100 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter">Taglia {lead.size}</span>}
                                                        </p>
                                                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-400 font-bold uppercase tracking-widest">
                                                            <span className="flex items-center gap-1"><Clock size={12} /> {formatDate(lead.created_at)}</span>
                                                            <span className="flex items-center gap-1"><Filter size={12} /> {lead.eventType}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {lead.notes && (
                                                    <div className="flex-1 max-w-md bg-gray-50 p-4 rounded-2xl italic text-sm text-gray-600 border border-gray-100">
                                                        &quot;{lead.notes}&quot;
                                                    </div>
                                                )}

                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => updateStatus('leads', lead.id, lead.status === 'Nuova' ? 'Gestita' : 'Nuova')}
                                                        className={`p-4 rounded-2xl transition-all ${lead.status === 'Nuova' ? 'bg-violet-600 text-white hover:bg-violet-700 shadow-lg shadow-violet-200' : 'bg-white border border-gray-100 text-gray-400 hover:text-violet-600'}`}
                                                        title={lead.status === 'Nuova' ? 'Segna come gestita' : 'Ripristina come nuova'}
                                                    >
                                                        <CheckCircle2 size={24} />
                                                    </button>
                                                    <button
                                                        onClick={() => deleteRequest('leads', lead.id)}
                                                        className="p-4 bg-white border border-red-50 text-red-200 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                                                    >
                                                        <Trash2 size={24} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
                                    <div className="text-gray-200 text-6xl mb-4 flex justify-center"><Mail size={64} /></div>
                                    <p className="text-gray-400 font-black uppercase tracking-widest text-sm">Nessuna lead ricevuta ancora.</p>
                                </div>
                            )
                        ) : activeTab === 'appointments' ? (
                            appointments.length > 0 ? (
                                <div className="grid grid-cols-1 gap-4">
                                    {appointments.map(app => (
                                        <div key={app.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-violet-200/20 transition-all group">
                                            {/* ... same appointment content ... */}
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                                <div className="flex items-start gap-4">
                                                    <div className={`p-4 rounded-3xl ${app.channel === 'WhatsApp' ? 'bg-green-50 text-green-600' : 'bg-black text-white'}`}>
                                                        {app.channel === 'WhatsApp' ? <MessageCircle size={24} /> : <Phone size={24} />}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-3">
                                                            <h3 className="text-xl font-black text-gray-950">{app.name || 'Cliente Interessato'}</h3>
                                                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${app.status === 'Nuova' ? 'bg-violet-100 text-violet-600' : 'bg-gray-100 text-gray-500'}`}>
                                                                {app.status || 'Interesse'}
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
                                                            <span className="flex items-center gap-1 text-xs text-violet-600 font-bold">
                                                                <Filter size={14} /> {app.eventType}
                                                            </span>
                                                            {app.size && (
                                                                <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded font-black uppercase tracking-tighter">
                                                                    Taglia {app.size}
                                                                </span>
                                                            )}
                                                            {app.eventDate && (
                                                                <span className="flex items-center gap-1 text-xs text-gray-500 font-bold">
                                                                    <Calendar size={14} /> {app.eventDate}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-400 font-bold uppercase tracking-widest">
                                                            <span className="flex items-center gap-1"><Clock size={12} /> {formatDate(app.created_at)}</span>
                                                            <span className="flex items-center gap-1 uppercase">Canale: {app.channel}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {app.notes && (
                                                    <div className="flex-1 max-w-md bg-gray-50 p-4 rounded-2xl italic text-sm text-gray-600 border border-gray-100">
                                                        &quot;{app.notes}&quot;
                                                    </div>
                                                )}

                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => updateStatus('appointments', app.id, app.status === 'Nuova' ? 'Gestito' : 'Nuova')}
                                                        className={`p-4 rounded-2xl transition-all ${app.status === 'Nuova' ? 'bg-violet-600 text-white hover:bg-violet-700 shadow-lg shadow-violet-200' : 'bg-white border border-gray-100 text-gray-400 hover:text-violet-600'}`}
                                                        title={app.status === 'Nuova' ? 'Segna come gestito' : 'Ripristina come nuovo'}
                                                    >
                                                        <CheckCircle2 size={24} />
                                                    </button>
                                                    <button
                                                        onClick={() => deleteRequest('appointments', app.id)}
                                                        className="p-4 bg-white border border-red-50 text-red-200 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                                                    >
                                                        <Trash2 size={24} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
                                    <div className="text-gray-200 text-6xl mb-4 flex justify-center"><Calendar size={64} /></div>
                                    <p className="text-gray-400 font-black uppercase tracking-widest text-sm">Nessuna richiesta di appuntamento.</p>
                                </div>
                            )
                        ) : (
                            newsletter.length > 0 ? (
                                <div className="grid grid-cols-1 gap-4">
                                    {newsletter.map(entry => (
                                        <div key={entry.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-violet-200/20 transition-all group">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                                <div className="flex items-start gap-4">
                                                    <div className="p-4 rounded-3xl bg-violet-50 text-violet-600">
                                                        <User size={24} />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-3">
                                                            <h4 className="text-xl font-black text-gray-950">{entry.firstName} {entry.lastName}</h4>
                                                            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-violet-100 text-violet-600">
                                                                {entry.status}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-gray-500 font-medium mt-1 flex items-center gap-2">
                                                            <Sparkles size={14} className="text-violet-600" /> Club Mitica
                                                        </p>
                                                        <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-gray-400 font-bold uppercase tracking-widest">
                                                            {entry.phone && (
                                                                <span className="flex items-center gap-1 text-gray-950 font-black">
                                                                    <Phone size={12} /> {entry.phone}
                                                                </span>
                                                            )}
                                                            {entry.email && (
                                                                <span className="flex items-center gap-1 text-gray-950 font-black">
                                                                    <Mail size={12} /> {entry.email}
                                                                </span>
                                                            )}
                                                            {!entry.phone && !entry.email && entry.contact && (
                                                                <span className="flex items-center gap-1 text-gray-950 font-black">
                                                                    <User size={12} /> {entry.contact}
                                                                </span>
                                                            )}
                                                            <span className="flex items-center gap-1"><Clock size={12} /> {formatDate(entry.created_at)}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => deleteRequest('newsletter', entry.id)}
                                                        className="p-4 bg-white border border-red-50 text-red-200 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                                                    >
                                                        <Trash2 size={24} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
                                    <div className="text-gray-200 text-6xl mb-4 flex justify-center"><Sparkles size={64} /></div>
                                    <p className="text-gray-400 font-black uppercase tracking-widest text-sm">Nessun iscritto al club ancora.</p>
                                </div>
                            )
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
