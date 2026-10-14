import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Download, Save, RefreshCw, Trash, Plus, Settings } from 'lucide-react';
import { parseInvoiceImage, generateMagicStoreCSV, downloadCSV } from '../../services/invoiceService';

export default function AdminInvoiceImport() {
    const [apiKey, setApiKey] = useState(localStorage.getItem('openai_api_key') || '');
    const [showSettings, setShowSettings] = useState(false);

    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const onDrop = (acceptedFiles) => {
        const selected = acceptedFiles[0];
        setFile(selected);
        setPreviewUrl(URL.createObjectURL(selected));
        setError(null);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': [], 'application/pdf': [] },
        maxFiles: 1
    });

    const handleAnalyze = async () => {
        if (!apiKey) {
            setError("Chiave API OpenAI mancante. Inseriscila nelle impostazioni.");
            setShowSettings(true);
            return;
        }
        if (!file) return;

        setLoading(true);
        setError(null);
        try {
            const extractedItems = await parseInvoiceImage(file, apiKey);
            setItems(extractedItems);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveKey = () => {
        localStorage.setItem('openai_api_key', apiKey);
        setShowSettings(false);
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const removeItem = (index) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const addItem = () => {
        setItems([...items, {
            codice: '',
            reparto: 'Donna',
            marchio: '',
            tipologia: 'Abito',
            modello: '',
            descrizione: '',
            anno: new Date().getFullYear(),
            taglia: 'Unica',
            colore: '',
            quantity: 1,
            price: 0
        }]);
    };

    const handleDownload = () => {
        const csv = generateMagicStoreCSV(items);
        downloadCSV(csv, `import_magastore_${new Date().toISOString().slice(0, 10)}.csv`);
    };

    return (
        <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-serif text-primary-950 font-bold">Importazione Fatture</h2>
                    <p className="text-gray-600">Carica una fattura per generare il file di carico MagicStore.</p>
                </div>
                <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="p-3 bg-white text-gray-600 rounded-full shadow-sm hover:bg-gray-100 transition"
                >
                    <Settings size={24} />
                </button>
            </div>

            {/* Settings Modal */}
            {showSettings && (
                <div className="mb-8 bg-white p-6 rounded-2xl shadow-lg border border-gray-100 animate-in fade-in slide-in-from-top-4">
                    <h3 className="font-bold text-lg mb-4">Impostazioni API</h3>
                    <div className="flex gap-4">
                        <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="sk-..."
                            className="flex-1 bg-gray-50 border p-3 rounded-xl"
                        />
                        <button onClick={handleSaveKey} className="bg-primary-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-black">
                            Salva
                        </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">La chiave viene salvata localmente nel browser.</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Upload Section */}
                <div className="space-y-6">
                    <div
                        {...getRootProps()}
                        className={`border-3 border-dashed rounded-[2rem] h-80 flex flex-col items-center justify-center p-8 transition-all cursor-pointer
                            ${isDragActive ? 'border-violet-500 bg-violet-50' : 'border-gray-200 bg-white hover:border-violet-300'}
                        `}
                    >
                        <input {...getInputProps()} />
                        {previewUrl ? (
                            <img src={previewUrl} alt="Preview" className="h-full object-contain rounded-xl" />
                        ) : (
                            <div className="text-center text-gray-400 space-y-4">
                                <Upload size={48} className="mx-auto" />
                                <p className="font-bold">Trascina qui la fattura o clicca per caricare</p>
                                <p className="text-sm">(Immagini PNG, JPG)</p>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleAnalyze}
                        disabled={!file || loading}
                        className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all
                            ${!file || loading ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-violet-600 text-white hover:bg-violet-700 hover:-translate-y-1'}
                        `}
                    >
                        {loading ? <RefreshCw className="animate-spin" /> : <FileText />}
                        {loading ? 'Analisi in corso...' : 'Estrai Dati da Fattura'}
                    </button>

                    {error && (
                        <div className="p-4 bg-red-50 text-red-600 rounded-xl font-medium text-sm border border-red-100">
                            {error}
                        </div>
                    )}
                </div>

                {/* Results Section */}
                <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 p-6 flex flex-col h-[800px]">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-xl flex items-center gap-2">
                            Articoli Estratti <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">{items.length}</span>
                        </h3>
                        <div className="flex gap-2">
                            <button onClick={addItem} className="p-2 text-violet-600 hover:bg-violet-50 rounded-lg font-bold text-sm flex items-center gap-1">
                                <Plus size={16} /> Aggiungi
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                        {items.length === 0 && !loading && (
                            <div className="h-full flex flex-col items-center justify-center text-gray-300 space-y-4">
                                <FileText size={64} />
                                <p>Nessun dato estratto.</p>
                            </div>
                        )}

                        {items.map((item, i) => (
                            <div key={i} className="p-4 rounded-xl bg-gray-50 border border-gray-100 group hover:border-violet-200 transition-all text-xs">
                                <div className="grid grid-cols-12 gap-2 items-center mb-2">
                                    <div className="col-span-3">
                                        <label className="text-[9px] uppercase font-bold text-gray-400 block">Codice</label>
                                        <input
                                            value={item.codice}
                                            onChange={(e) => handleItemChange(i, 'codice', e.target.value)}
                                            className="w-full bg-white border border-gray-200 rounded px-2 py-1 font-mono font-bold"
                                        />
                                    </div>
                                    <div className="col-span-3">
                                        <label className="text-[9px] uppercase font-bold text-gray-400 block">Marchio</label>
                                        <input
                                            value={item.marchio}
                                            onChange={(e) => handleItemChange(i, 'marchio', e.target.value)}
                                            className="w-full bg-white border border-gray-200 rounded px-2 py-1"
                                        />
                                    </div>
                                    <div className="col-span-4">
                                        <label className="text-[9px] uppercase font-bold text-gray-400 block">Reparto</label>
                                        <input
                                            value={item.reparto}
                                            onChange={(e) => handleItemChange(i, 'reparto', e.target.value)}
                                            className="w-full bg-white border border-gray-200 rounded px-2 py-1"
                                        />
                                    </div>
                                    <div className="col-span-2 text-right">
                                        <button onClick={() => removeItem(i)} className="text-gray-300 hover:text-red-500 p-1">
                                            <Trash size={14} />
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-12 gap-2 mb-2">
                                    <div className="col-span-3">
                                        <label className="text-[9px] uppercase font-bold text-gray-400 block">Tipologia</label>
                                        <input
                                            value={item.tipologia}
                                            onChange={(e) => handleItemChange(i, 'tipologia', e.target.value)}
                                            className="w-full bg-white border border-gray-200 rounded px-2 py-1"
                                        />
                                    </div>
                                    <div className="col-span-3">
                                        <label className="text-[9px] uppercase font-bold text-gray-400 block">Modello</label>
                                        <input
                                            value={item.modello}
                                            onChange={(e) => handleItemChange(i, 'modello', e.target.value)}
                                            className="w-full bg-white border border-gray-200 rounded px-2 py-1"
                                        />
                                    </div>
                                    <div className="col-span-6">
                                        <label className="text-[9px] uppercase font-bold text-gray-400 block">Descrizione</label>
                                        <input
                                            value={item.descrizione}
                                            onChange={(e) => handleItemChange(i, 'descrizione', e.target.value)}
                                            className="w-full bg-white border border-gray-200 rounded px-2 py-1 font-medium"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-12 gap-2">
                                    <div className="col-span-2">
                                        <label className="text-[9px] uppercase font-bold text-gray-400 block">Anno</label>
                                        <input
                                            value={item.anno}
                                            onChange={(e) => handleItemChange(i, 'anno', e.target.value)}
                                            className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-center"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-[9px] uppercase font-bold text-gray-400 block">Taglia</label>
                                        <input
                                            value={item.taglia}
                                            onChange={(e) => handleItemChange(i, 'taglia', e.target.value)}
                                            className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-center font-bold"
                                        />
                                    </div>
                                    <div className="col-span-3">
                                        <label className="text-[9px] uppercase font-bold text-gray-400 block">Colore</label>
                                        <input
                                            value={item.colore}
                                            onChange={(e) => handleItemChange(i, 'colore', e.target.value)}
                                            className="w-full bg-white border border-gray-200 rounded px-2 py-1"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-[9px] uppercase font-bold text-gray-400 block">Qta</label>
                                        <input
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) => handleItemChange(i, 'quantity', parseInt(e.target.value) || 0)}
                                            className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-center bg-violet-50 text-violet-900 font-bold"
                                        />
                                    </div>
                                    <div className="col-span-3">
                                        <label className="text-[9px] uppercase font-bold text-gray-400 block">Prezzo (€)</label>
                                        <input
                                            type="number"
                                            value={item.price}
                                            onChange={(e) => handleItemChange(i, 'price', parseFloat(e.target.value) || 0)}
                                            className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-right"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-100">
                        <button
                            onClick={handleDownload}
                            disabled={items.length === 0}
                            className={`w-full py-4 rounded-xl font-black uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-2
                                ${items.length === 0 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700 hover:-translate-y-1'}
                            `}
                        >
                            <Download size={20} /> Scarica CSV MagicStore
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
