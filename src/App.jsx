import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { Suspense, lazy, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './index.css'

// Lazy Load Admin Pages (Keep bundle size low for initial visitors)
const Login = lazy(() => import('./pages/public/Login'));
const AdminLayout = lazy(() => import('./layouts/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminInventory = lazy(() => import('./pages/admin/AdminInventory'));
const AdminRequests = lazy(() => import('./pages/admin/AdminRequests'));
const AdminIntegrations = lazy(() => import('./pages/admin/AdminIntegrations'));
const SimpleImageManager = lazy(() => import('./pages/admin/SimpleImageManager'));

// Eager Load Public Pages for Maximum Reactivity (Instant Navigation)
import MainLayout from './layouts/MainLayout';
import Home from './pages/public/Home';

// Lazy load non-essential initial pages to reduce bundle size
const Catalog = lazy(() => import('./pages/public/Catalog'));
const ProductDetail = lazy(() => import('./pages/public/ProductDetail'));
const OurStory = lazy(() => import('./pages/public/OurStory'));

// Legal pages can stay lazy 
const PrivacyPolicy = lazy(() => import('./pages/public/PrivacyPolicy'));
const CookiePolicy = lazy(() => import('./pages/public/CookiePolicy'));
const TermsOfService = lazy(() => import('./pages/public/TermsOfService'));
const LegalNotes = lazy(() => import('./pages/public/LegalNotes'));

import ScrollToTop from './components/ui/ScrollToTop';

// Loading Fallback
const PageLoader = () => (
    <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-900"></div>
    </div>
);

import Firewall from './components/security/Firewall';
// Monitoring removed

const MaintenancePage = lazy(() => import('./pages/public/MaintenancePage'));

// --- SMART REDIRECT COMPONENT ---
// --- SMART REDIRECT COMPONENT ---
function LegacyRedirectHandler() {
    const location = useLocation();
    const path = location.pathname.toLowerCase();

    // Specific Mapping Logic based on user request
    if (path.includes('sposa')) return <Navigate to="/catalog?category=Donna&subcategory=Sposa" replace />;
    if (path.includes('sposo')) return <Navigate to="/catalog?category=Uomo&subcategory=Sposo" replace />;
    if (path.includes('cerimonia') && path.includes('donna')) return <Navigate to="/catalog?category=Donna&subcategory=Cerimonia" replace />;

    // Order matters: check inclusive terms after specific ones
    if (path.includes('donna')) return <Navigate to="/catalog?category=Donna&subcategory=Cerimonia" replace />;
    if (path.includes('uomo')) return <Navigate to="/catalog?category=Uomo&subcategory=Cerimonia" replace />; // "uomo" mapped to "cerimonia uomo"

    // General fallbacks
    if (path.includes('cerimonia')) return <Navigate to="/catalog?category=Donna&subcategory=Cerimonia" replace />;
    if (path.includes('storia') || path.includes('chi-siamo') || path.includes('atelier')) return <Navigate to="/la-nostra-storia" replace />;
    if (path.includes('contat')) return <Navigate to="/" replace />; // Home handles contacts
    if (path.includes('privacy')) return <Navigate to="/privacy-policy" replace />;

    // Default Fallback
    return <Navigate to="/" replace />;
}

function AnimatedRoutes() {
    const location = useLocation();
    const isMaintenanceMode = false;

    return (
        <Routes location={location}>
            {/* Always accessible routes */}
            <Route path="/login" element={<Login />} />

            {/* Admin Routes (Always accessible) */}
            <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="inventory" element={<AdminInventory />} />
                <Route path="requests" element={<AdminRequests />} />
                <Route path="integrations" element={<AdminIntegrations />} />
                <Route path="simple-uploader" element={<SimpleImageManager />} />
            </Route>

            {/* Public Routes (Intercepted by Maintenance Mode) */}
            {isMaintenanceMode ? (
                <Route path="*" element={<MaintenancePage />} />
            ) : (
                <Route path="/" element={<MainLayout />}>
                    <Route index element={<Home />} />
                    <Route path="catalog" element={<Catalog />} />
                    <Route path="product/:id" element={<ProductDetail />} />
                    <Route path="la-nostra-storia" element={<OurStory />} />
                    <Route path="privacy-policy" element={<PrivacyPolicy />} />
                    <Route path="cookie-policy" element={<CookiePolicy />} />
                    <Route path="termini-servizio" element={<TermsOfService />} />
                    <Route path="note-legali" element={<LegalNotes />} />
                    <Route path="*" element={<LegacyRedirectHandler />} />
                </Route>
            )}
        </Routes>
    );
}

function App() {
    // Disable right-click and common shortcuts on images/videos
    useEffect(() => {
        const handleContextMenu = (e) => {
            if (e.target.tagName === 'IMG' || e.target.tagName === 'VIDEO' || e.target.closest('.protected-media')) {
                e.preventDefault();
            }
        };

        const handleKeyDown = (e) => {
            // Prevent Ctrl+S / Cmd+S globally for simplicity if protection is desired
            if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
                // e.preventDefault();
            }
        };

        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    return (
        <AuthProvider>
            <Router>
                <ScrollToTop />
                <Suspense fallback={<PageLoader />}>
                    <AnimatedRoutes />
                </Suspense>
            </Router>
        </AuthProvider>
    )
}

export default App
