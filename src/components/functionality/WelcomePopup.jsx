import { motion, AnimatePresence } from 'framer-motion';
import { X, CalendarClock, ArrowRight } from 'lucide-react';

export default function WelcomePopup({ isOpen, onClose, onBook }) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[150] flex items-center justify-center p-6 animate-fade-in">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="glass-effect rounded-[3rem] shadow-2xl max-w-lg w-full p-10 relative animate-slide-up overflow-hidden group text-center"
                    >
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 text-gray-400 hover:text-primary-900 transition-colors bg-gray-50 p-2 rounded-full hover:bg-white"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex justify-center mb-8">
                            <div className="bg-primary-50 p-6 rounded-[2rem] text-primary-900 shadow-inner">
                                <CalendarClock size={40} strokeWidth={1.5} />
                            </div>
                        </div>

                        <h3 className="text-2xl font-serif text-primary-950 mb-4 font-black uppercase tracking-tight">Benvenuti nel nostro Atelier</h3>
                        <p className="text-gray-500 mb-10 text-sm leading-relaxed font-semibold">
                            Per garantirvi un servizio impeccabile e personalizzato, vi accogliamo <span className="text-primary-900 font-bold">esclusivamente su appuntamento</span>.
                        </p>

                        <button
                            onClick={() => {
                                onBook();
                                onClose();
                            }}
                            className="group relative w-full px-8 py-5 border border-primary-900 overflow-hidden transition-all rounded-full flex items-center justify-center gap-2"
                        >
                            <span className="relative z-10 uppercase text-[10px] tracking-[0.3em] font-black text-black group-hover:text-primary-900 transition-colors flex items-center gap-3">
                                Richiedi Appuntamento <ArrowRight size={14} />
                            </span>
                            <div className="absolute inset-x-0 bottom-0 h-0 bg-primary-400 group-hover:h-full transition-all duration-500 ease-out z-0" />
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
