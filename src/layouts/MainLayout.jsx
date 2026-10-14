import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Instagram, Facebook, Phone, MapPin, Mail, LayoutDashboard, LogOut, ChevronDown, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import AppointmentModal from '../components/functionality/AppointmentModal';
import WhatsAppButton from '../components/functionality/WhatsAppButton';
import AddressSelector from '../components/functionality/AddressSelector';

export default function MainLayout() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const { currentUser, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await logout();
            setIsMenuOpen(false);
            navigate('/');
        } catch (error) {
            console.error("Logout error:", error);
            alert("Errore durante il logout. Riprova tra poco.");
        }
    };

    // Scroll detection
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Hide WhatsApp Button when appointment modal is open + Scroll Lock
    // Scroll Lock removed to prevent freezing issues
    useEffect(() => {
        // Only managing WA button visibility
        if (isAppointmentModalOpen) {
            document.body.classList.add('hide-wa-button');
        } else {
            document.body.classList.remove('hide-wa-button');
        }
        return () => {
            document.body.classList.remove('hide-wa-button');
        };
    }, [isAppointmentModalOpen]);

    const categories = [
        {
            name: 'Donna',
            path: '/catalog?category=Donna',
            subcategories: [
                { name: 'Sposa', path: '/catalog?category=Donna&subcategory=Sposa' },
                { name: 'Cerimonia', path: '/catalog?category=Donna&subcategory=Cerimonia' },
                { name: 'Scarpe', path: '/catalog?category=Donna&subcategory=Scarpe' },
                { name: 'Accessori', path: '/catalog?category=Donna&subcategory=Accessori' }
            ]
        },
        {
            name: 'Uomo',
            path: '/catalog?category=Uomo',
            subcategories: [
                { name: 'Sposo', path: '/catalog?category=Uomo&subcategory=Sposo' },
                { name: 'Cerimonia', path: '/catalog?category=Uomo&subcategory=Cerimonia' },
                { name: 'Scarpe', path: '/catalog?category=Uomo&subcategory=Scarpe' },
                { name: 'Accessori', path: '/catalog?category=Uomo&subcategory=Accessori' }
            ]
        },
        {
            name: 'Bambini',
            path: '/catalog?category=Bambini'
        },
        {
            name: 'Abiti in Promozione',
            path: '/catalog?category=Promozione'
        },
        { name: 'La Nostra Storia', path: '/la-nostra-storia' },
    ];

    const isHome = location.pathname === '/';
    const isActive = (path) => location.pathname + location.search === path;

    return (
        <div className="font-sans text-brandtext-main bg-white selection:bg-primary-900 selection:text-white flex flex-col min-h-screen max-w-[2500px] mx-auto shadow-2xl relative">

            {/* Navbar */}
            <nav className={`fixed w-full max-w-[2500px] z-[9999] transition-all duration-500 ${scrolled || !isHome ? 'bg-white py-3 shadow-sm' : 'bg-transparent py-6'}`}>
                <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">

                    {/* Logo */}
                    <Link
                        to="/"
                        className="flex items-center gap-2 group"
                    >
                        <img
                            src="/images/logo.png"
                            alt="Mitica Cerimonia"
                            className={`w-auto transition-all duration-300 object-contain ${scrolled || !isHome ? 'brightness-0 h-14 md:h-20' : 'brightness-0 invert h-20 md:h-32'}`}
                        />
                    </Link>

                    {/* Desktop Menu */}
                    <div className={`hidden lg:flex ml-12 lg:ml-20 gap-16 font-medium uppercase text-[15px] tracking-[0.2em] items-center h-full ${scrolled || !isHome ? 'text-black' : 'text-white'}`}>
                        {categories.map(cat => (
                            <div key={cat.name} className="relative group h-full flex items-center">
                                <Link
                                    to={cat.path}
                                    className="group-hover:text-primary-600 active:text-primary-600 transition-colors py-8 block flex items-center gap-1"
                                >
                                    {cat.name}
                                    {cat.subcategories && <ChevronDown size={14} className="group-hover:rotate-180 transition-transform duration-300 opacity-80" />}
                                    <span className="absolute bottom-6 left-0 w-0 h-[1.5px] bg-primary-600 transition-all group-hover:w-full" />
                                </Link>

                                {/* Dropdown */}
                                {
                                    cat.subcategories && (
                                        <div className="absolute top-[100%] left-0 pt-8 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 ease-out transform group-hover:translate-y-0 translate-y-4">
                                            <div className="glass-effect text-black shadow-[0_20px_60px_rgba(0,0,0,0.1)] min-w-[300px] flex flex-col p-4 pb-8 rounded-[2rem] animate-fade-in ring-1 ring-black/5">
                                                {cat.subcategories.map(sub => (
                                                    <Link
                                                        key={sub.name}
                                                        to={sub.path}
                                                        className={`block px-6 py-4 text-[13px] tracking-[0.15em] uppercase font-bold transition-all duration-200 rounded-xl ${isActive(sub.path) ? 'bg-primary-50 text-primary-600' : 'text-gray-600 hover:bg-gray-50 hover:text-primary-600 active:text-primary-600'}`}
                                                    >
                                                        {sub.name}
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                }
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-4">
                            {currentUser ? (
                                <Link
                                    to="/admin/inventory"
                                    className="hidden md:flex items-center gap-2 text-[13px] font-bold uppercase tracking-widest px-8 py-3 rounded-full bg-black text-white hover:bg-primary-900 hover:shadow-lg hover:shadow-primary-900/20 transition-all transform hover:-translate-y-0.5"
                                    title="Gestionale"
                                >
                                    <LayoutDashboard size={14} />
                                    <span className="hidden lg:inline">Gestionale</span>
                                </Link>
                            ) : null}

                            {currentUser && (
                                <button
                                    onClick={handleLogout}
                                    className={`flex items-center gap-2 text-[13px] font-bold uppercase tracking-widest hover:text-red-500 transition-colors ${scrolled || !isHome ? 'text-black' : 'text-white'}`}
                                    title="Esci"
                                >
                                    <LogOut size={14} />
                                    <span className="hidden lg:inline">Esci</span>
                                </button>
                            )}
                        </div>
                        <button className="lg:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                            {isMenuOpen ? <X className="text-black" /> : <Menu className={scrolled || !isHome ? 'text-black' : 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]'} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu Overlay */}
                <AnimatePresence>
                    {isMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, x: '100%' }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: '100%' }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed inset-0 bg-white z-[60] flex flex-col items-center justify-center gap-8 text-center"
                        >
                            <button className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100" onClick={() => setIsMenuOpen(false)}>
                                <X className="w-8 h-8 text-black" />
                            </button>

                            <div className="flex flex-col gap-6 max-h-[70vh] overflow-y-auto w-full px-6">
                                {categories.map(cat => (
                                    <div key={cat.name} className="flex flex-col gap-4">
                                        <Link
                                            to={cat.path}
                                            className="text-2xl font-serif uppercase tracking-widest hover:text-primary-900 transition-colors"
                                            onClick={() => setIsMenuOpen(false)}
                                        >
                                            {cat.name}
                                        </Link>
                                        {cat.subcategories && (
                                            <div className="flex flex-col gap-3 pb-4">
                                                {cat.subcategories.map(sub => (
                                                    <Link
                                                        key={sub.name}
                                                        to={sub.path}
                                                        className={`text-base font-bold uppercase tracking-widest ${isActive(sub.path) ? 'text-primary-900' : 'text-gray-400'}`}
                                                        onClick={() => setIsMenuOpen(false)}
                                                    >
                                                        {sub.name}
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Mobile Auth Links */}
                            {currentUser ? (
                                <div className="flex flex-col gap-6 mt-8 w-full px-6">
                                    <Link
                                        to="/admin/inventory"
                                        onClick={() => setIsMenuOpen(false)}
                                        className="text-base font-bold text-white bg-black py-5 rounded-sm uppercase tracking-widest flex items-center justify-center gap-2 w-full shadow-lg"
                                    >
                                        <LayoutDashboard size={20} /> Gestionale
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="text-base font-bold text-red-500 uppercase tracking-widest flex items-center justify-center gap-2"
                                    >
                                        <LogOut size={20} /> Esci
                                    </button>
                                </div>
                            ) : null}
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav >

            {/* Main Content with Transition */}
            <main className={`flex-grow w-full ${!isHome ? 'pt-24 md:pt-32' : ''}`}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                    >
                        <Outlet />
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Footer */}
            < footer className="bg-black text-white pt-32 pb-16 border-t border-white/10 w-full" >
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-20 mb-32">

                        {/* Brand Column */}
                        <div className="space-y-8">
                            <div className="text-3xl font-serif font-bold tracking-tighter">
                                <img
                                    src="/images/logo.png"
                                    alt="Mitica Cerimonia"
                                    className="h-28 w-auto brightness-0 invert object-contain"
                                />
                            </div>
                            <div className="pt-4">
                                <h4 className="text-xs md:text-[11px] uppercase tracking-[0.4em] font-bold mb-6 text-gray-300">Seguici sui social:</h4>
                                <div className="flex gap-8">
                                    <a href="https://www.instagram.com/miticacerimonia/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-transform hover:scale-110"><Instagram className="w-6 h-6" /></a>
                                    <a href="https://www.facebook.com/miticaboutiqueroma/?locale=it_IT" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-transform hover:scale-110"><Facebook className="w-6 h-6" /></a>
                                    <a href="https://www.tiktok.com/@mitica_cerimonia?_r=1&_t=ZN-93NMFMNRdeo" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-transform hover:scale-110">
                                        <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                                            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                                        </svg>
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Collections */}
                        <div>
                            <h4 className="text-xs md:text-[11px] uppercase tracking-[0.4em] font-bold mb-10 text-gray-300">Collezioni</h4>
                            <ul className="space-y-5 text-sm md:text-xs text-gray-400 tracking-widest font-medium">
                                <li><Link to="/catalog?category=Donna&subcategory=Sposa" className="hover:text-primary-300 transition-colors">Abiti da Sposa</Link></li>
                                <li><Link to="/catalog?category=Uomo&subcategory=Sposo" className="hover:text-primary-300 transition-colors">Abiti da Sposo</Link></li>
                                <li><Link to="/catalog?category=Donna&subcategory=Cerimonia" className="hover:text-primary-300 transition-colors">Cerimonia Donna</Link></li>
                                <li><Link to="/catalog?category=Uomo&subcategory=Cerimonia" className="hover:text-primary-300 transition-colors">Cerimonia Uomo</Link></li>
                                <li><Link to="/catalog?category=Bambini" className="hover:text-primary-300 transition-colors">Cerimonia Bambini</Link></li>
                                <li><Link to="/catalog?category=Accessori" className="hover:text-primary-300 transition-colors">Accessori</Link></li>
                            </ul>
                        </div>

                        {/* Appointment CTA */}
                        <div className="space-y-10">
                            <h4 className="text-xs md:text-[11px] uppercase tracking-[0.4em] font-bold mb-10 text-gray-300">Riserva subito il tuo appuntamento</h4>
                            <p className="text-gray-300 text-xs leading-relaxed font-light">
                                e vieni a trovarci nel nostro showroom
                            </p>
                            <button
                                onClick={() => setIsAppointmentModalOpen(true)}
                                className="relative overflow-hidden w-full py-4 border border-gray-600 text-gray-200 text-[10px] uppercase tracking-[0.2em] font-bold rounded-full transition-all duration-300 hover:shadow-lg hover:shadow-white/10 hover:border-transparent group"
                            >
                                <span className="relative z-20 group-hover:text-primary-900 group-active:text-primary-900 transition-colors duration-300">
                                    Prenota il tuo appuntamento
                                </span>
                                <div className="absolute inset-0 bg-primary-400 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out z-10" />
                            </button>
                            <div className="pt-2">
                                <Link to="/la-nostra-storia" className="text-gray-400 hover:text-white text-[10px] uppercase tracking-widest transition-colors font-bold">
                                    Scopri la nostra storia →
                                </Link>
                            </div>
                        </div>

                        {/* Contact Info */}
                        {!currentUser && (
                            <div>
                                <h4 className="text-xs md:text-[11px] uppercase tracking-[0.4em] font-bold mb-10 text-gray-300">Contatti</h4>
                                <ul className="space-y-6 text-sm md:text-xs text-gray-400 font-medium">
                                    <li className="flex items-start gap-4">
                                        <AddressSelector
                                            address="Mitica Cerimonia, Via dei Prati Fiscali 325, Roma"
                                            displayText="Via dei Prati Fiscali 325/335, 00141 Roma (RM)"
                                            className="text-gray-400 hover:text-white"
                                        />
                                    </li>
                                    <li className="flex items-center gap-4">
                                        <Phone className="w-4 h-4 text-gray-400" />
                                        <a href="tel:0693579105" className="hover:text-primary-300 transition-colors">06 9357 9105</a>
                                    </li>
                                    <li className="flex items-center gap-4">
                                        <Mail className="w-4 h-4 text-gray-400" />
                                        <a href="mailto:celebrity.fashion335@gmail.com" className="hover:text-primary-300 transition-colors">celebrity.fashion335@gmail.com</a>
                                    </li>
                                    <li className="flex items-center gap-4">
                                        <Clock className="w-4 h-4 text-gray-400" />
                                        <span className="text-gray-400">10:00-13.00 // 15:30-18:30</span>
                                    </li>
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Bottom Bar */}
                    <div className="border-t border-white/10 pt-16 flex flex-col md:flex-row justify-between items-center gap-10 text-[10px] md:text-[9px] uppercase tracking-[0.3em] text-gray-600 font-bold">
                        <div className="text-center md:text-left space-y-2">
                            <p>© {new Date().getFullYear()} MITICA CERIMONIA - ROMA</p>
                            <p className="text-gray-700">CELEBRITY FASHION SRLS - P.IVA 17925031001 - TUTTI I DIRITTI RISERVATI</p>
                        </div>
                        <div className="flex flex-wrap justify-center gap-6">
                            <Link to="/login" className="hover:text-white transition-colors bg-white/5 px-4 py-2 rounded-full border border-white/10">Area Riservata</Link>
                            <Link to="/privacy-policy" className="hover:text-primary-400 transition-colors py-2">Privacy Policy</Link>
                            <Link to="/cookie-policy" className="hover:text-primary-400 transition-colors py-2">Cookie Policy</Link>
                            <Link to="/termini-servizio" className="hover:text-primary-400 transition-colors py-2">Termini</Link>
                            <Link to="/note-legali" className="hover:text-primary-400 transition-colors py-2">Note Legali</Link>
                        </div>
                    </div>
                </div>
            </footer>
            <AppointmentModal isOpen={isAppointmentModalOpen} onClose={() => setIsAppointmentModalOpen(false)} />
            <WhatsAppButton onClick={() => setIsAppointmentModalOpen(true)} />
        </div >
    );
}
