import React from 'react';
import { MapPin, Navigation } from 'lucide-react';

export default function StoreMap() {
    const address = "Via dei Prati Fiscali 325/335, 00141 Roma";
    // Using Apple Maps format for better iPhone integration
    const appleMapsUrl = `https://maps.apple.com/?q=Mitica+Cerimonia&address=${encodeURIComponent(address)}`;


    // Since we might not have a real API key for this demo, using an iframe with a public query or a static map fallback
    // For a reliable free production solution without API key, using OpenStreetMap or a direct link is safer, 
    // but for "Dynamic Google Map" usually implies an iframe. 
    // We will use a direct Google Maps Embed iframe which works for places without API key in some contexts or standard iframe

    return (
        <div className="w-full h-full min-h-[400px] relative rounded-[2.5rem] overflow-hidden shadow-lg border border-gray-100">
            <iframe
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: '400px' }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://maps.google.com/maps?q=${encodeURIComponent("Mitica Cerimonia, " + address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                title="Posizione Negozio"
            ></iframe>

            <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm p-4 rounded-2xl shadow-lg flex justify-between items-center">
                <div>
                    <h4 className="font-serif text-primary-900 font-bold flex items-center gap-2">
                        <MapPin size={18} className="text-primary-600" />
                        Mitica Cerimonia
                    </h4>
                    <p className="text-sm text-gray-600">{address}</p>
                </div>
                <a
                    href={appleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-full hover:bg-primary-700 transition shadow-md text-sm font-medium"
                >
                    <Navigation size={16} />
                    Portami qui
                </a>
            </div>
        </div>
    );
}
