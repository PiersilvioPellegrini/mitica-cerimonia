import React, { useState } from 'react';
import { MapPin, X, Navigation } from 'lucide-react';

export default function AddressSelector({ address, displayText, className }) {
    const [showModal, setShowModal] = useState(false);

    const handleOpenMaps = (app) => {
        const encodedAddress = encodeURIComponent(address);
        let url;

        switch (app) {
            case 'google':
                url = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
                break;
            case 'apple':
                url = `http://maps.apple.com/?q=${encodedAddress}`;
                break;
            case 'waze':
                url = `https://waze.com/ul?q=${encodedAddress}`;
                break;
            default:
                url = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
        }

        window.open(url, '_blank', 'noopener,noreferrer');
        setShowModal(false);
    };

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-colors ${className || 'text-primary-900 hover:text-black'}`}
            >
                <MapPin size={16} />
                {displayText}
            </button>

            {showModal && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-fade-in"
                    onClick={() => setShowModal(false)}
                >
                    <div
                        className="glass-effect rounded-[2rem] shadow-2xl max-w-sm w-full p-8 relative animate-slide-up"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 transition-colors"
                        >
                            <X size={24} />
                        </button>

                        <div className="text-center mb-8">
                            <div className="inline-flex p-4 bg-primary-50 rounded-full mb-4">
                                <Navigation className="text-primary-600" size={32} />
                            </div>
                            <h3 className="text-2xl font-serif text-gray-900 mb-2">
                                Apri con
                            </h3>
                            <p className="text-sm text-gray-500">
                                Scegli l'app di navigazione
                            </p>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={() => handleOpenMaps('google')}
                                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white border-2 border-gray-100 hover:border-primary-500 hover:bg-primary-50 transition-all group"
                            >
                                <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
                                    <img
                                        src="/images/icons/google-maps.png"
                                        alt="Google Maps"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="flex-1 text-left">
                                    <div className="font-bold text-gray-900 group-hover:text-primary-900">Google Maps</div>
                                    <div className="text-xs text-gray-500">Navigazione e traffico in tempo reale</div>
                                </div>
                            </button>

                            <button
                                onClick={() => handleOpenMaps('apple')}
                                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white border-2 border-gray-100 hover:border-primary-500 hover:bg-primary-50 transition-all group"
                            >
                                <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
                                    <img
                                        src="/images/icons/apple-maps.png"
                                        alt="Apple Maps"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="flex-1 text-left">
                                    <div className="font-bold text-gray-900 group-hover:text-primary-900">Apple Maps</div>
                                    <div className="text-xs text-gray-500">Integrato con iOS e macOS</div>
                                </div>
                            </button>

                            <button
                                onClick={() => handleOpenMaps('waze')}
                                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white border-2 border-gray-100 hover:border-primary-500 hover:bg-primary-50 transition-all group"
                            >
                                <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-white p-2">
                                    <img
                                        src="/images/icons/waze.png"
                                        alt="Waze"
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                                <div className="flex-1 text-left">
                                    <div className="font-bold text-gray-900 group-hover:text-primary-900">Waze</div>
                                    <div className="text-xs text-gray-500">Percorsi ottimizzati e avvisi</div>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
