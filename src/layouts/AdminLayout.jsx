import React, { useState } from 'react';
import { NavLink, Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { RefreshCw, LayoutDashboard, Package, Share2, ArrowLeft, MessageSquare, FileText, ShieldCheck, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminLayout() {
    const { currentUser } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const location = useLocation();

    if (!currentUser) {
        return <Navigate to="/login" />;
    }

    const closeSidebar = () => setIsSidebarOpen(false);

    const SidebarContent = () => (
        <>
            <Link to="/" className="p-8 pb-4 block group" onClick={closeSidebar}>
                <img
                    src="/images/logo.png"
                    alt="Mitica Cerimonia"
                    className="h-12 w-auto mb-4 object-contain"
                />
                <p className="text-[10px] text-violet-600 uppercase tracking-[0.3em] font-black mt-1">Admin Panel</p>
            </Link>

            <nav className="flex-1 px-4 space-y-1">
                <NavLink
                    to="/admin"
                    end
                    onClick={closeSidebar}
                    className={({ isActive }) => `flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all ${isActive ? 'bg-violet-600 text-white shadow-lg shadow-violet-200' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
                >
                    <LayoutDashboard size={20} /> Dashboard
                </NavLink>

                <NavLink
                    to="/admin/inventory"
                    onClick={closeSidebar}
                    className={({ isActive }) => `flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all ${isActive ? 'bg-violet-600 text-white shadow-lg shadow-violet-200' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
                >
                    <Package size={20} /> Inventario
                </NavLink>

                <NavLink
                    to="/admin/requests"
                    onClick={closeSidebar}
                    className={({ isActive }) => `flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all ${isActive ? 'bg-violet-600 text-white shadow-lg shadow-violet-200' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
                >
                    <MessageSquare size={20} /> Richieste
                </NavLink>

                <NavLink
                    to="/admin/integrations"
                    onClick={closeSidebar}
                    className={({ isActive }) => `flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all ${isActive ? 'bg-violet-600 text-white shadow-lg shadow-violet-200' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
                >
                    <ShieldCheck size={20} /> Impostazioni
                </NavLink>
            </nav>

            <div className="p-4 mt-auto space-y-2">
                <NavLink to="/" className="flex items-center gap-3 px-6 py-4 rounded-2xl font-bold text-gray-400 hover:bg-gray-50 hover:text-gray-900 transition-all border border-transparent hover:border-gray-100">
                    <ArrowLeft size={18} /> Home Pubblica
                </NavLink>
            </div>
        </>
    );

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Desktop Sidebar */}
            <aside className="w-64 bg-white text-primary-950 hidden md:flex flex-col shadow-xl border-r border-gray-100 sticky top-0 h-screen overflow-y-auto z-20">
                <SidebarContent />
            </aside>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={closeSidebar}
                            className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
                        />
                        <motion.aside
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                            className="fixed inset-y-0 left-0 w-64 bg-white z-50 md:hidden flex flex-col shadow-2xl"
                        >
                            <SidebarContent />
                            <div className="absolute top-4 right-4">
                                <button onClick={closeSidebar} className="p-2 bg-gray-100 rounded-full text-gray-600">
                                    <X size={20} />
                                </button>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-8 w-full max-w-[100vw] overflow-x-hidden">
                <header className="flex justify-between items-center mb-8 md:mb-12">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="md:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <Menu size={24} />
                        </button>
                        <h1 className="text-xl md:text-3xl font-serif text-primary-950 truncate">
                            {location.pathname === '/admin' && 'Dashboard'}
                            {location.pathname === '/admin/inventory' && 'Inventario'}
                            {location.pathname === '/admin/requests' && 'Richieste'}
                            {location.pathname === '/admin/integrations' && 'Impostazioni'}
                        </h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="hidden md:block text-sm text-gray-600 border-l border-gray-300 pl-4">
                            {currentUser.email}
                        </div>
                        <div className="md:hidden w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center text-violet-700 font-bold text-xs">
                            {currentUser.email?.charAt(0).toUpperCase()}
                        </div>
                    </div>
                </header>
                <Outlet />
            </main>
        </div>
    );
}
