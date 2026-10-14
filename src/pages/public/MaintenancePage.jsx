import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export default function MaintenancePage() {
    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Texture */}
            <div className="absolute inset-0 bg-[url('/images/home/hero_bg_user.jpg')] bg-cover bg-center opacity-20 blur-sm"></div>
            <div className="absolute inset-0 bg-black/80"></div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1 }}
                className="relative z-10 text-center space-y-8 max-w-2xl"
            >
                <div className="w-24 h-24 mx-auto bg-white/5 rounded-full flex items-center justify-center backdrop-blur-md border border-white/10">
                    <Sparkles size={40} className="text-violet-400" />
                </div>

                <h1 className="text-6xl md:text-8xl font-serif tracking-tighter">
                    Mitica <br />
                    <span className="italic text-gray-400">Cerimonia</span>
                </h1>

                <div className="h-px w-32 bg-gradient-to-r from-transparent via-white/50 to-transparent mx-auto"></div>

                <div className="space-y-4">
                    <h2 className="text-xl md:text-2xl font-light tracking-[0.2em] uppercase">Sito in Aggiornamento</h2>
                    <p className="text-gray-400 max-w-md mx-auto leading-relaxed">
                        Stiamo lavorando per rendere la vostra esperienza ancora più esclusiva. Torneremo online a breve con tante novità.
                    </p>
                </div>

                <div className="pt-8 text-xs text-gray-600 font-bold uppercase tracking-widest">
                    Coming Soon
                </div>
            </motion.div>
        </div>
    );
}
