import React from 'react';
import { AlertTriangle, RefreshCw, Trash, ShieldAlert } from 'lucide-react';
import { db } from '../../services/firebaseConfig';
import { getDoc, doc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

class RescueBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            isRescueMode: false,
            diagnostics: null,
            isAuthenticated: false,
            email: '',
            password: ''
        };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ errorInfo });
        console.error("Critical Application Error:", error, errorInfo);

        // Auto-detect rescue mode from URL
        if (window.location.search.includes('mode=rescue') || window.location.pathname === '/rescue') {
            this.setState({ isRescueMode: true });
            this.runDiagnostics();
        }
    }

    handleLogin = async () => {
        try {
            const auth = getAuth();
            await signInWithEmailAndPassword(auth, this.state.email, this.state.password);
            this.setState({ isAuthenticated: true });
        } catch (error) {
            alert("Login fallito: " + error.message);
        }
    };

    async runDiagnostics() {
        const report = {
            localStorage: { ...localStorage },
            network: navigator.onLine ? 'Online' : 'Offline',
            firestore: 'Checking...',
            url: window.location.href,
            userAgent: navigator.userAgent
        };

        try {
            // Simple Firestore Check
            await getDoc(doc(db, 'settings', 'general'));
            report.firestore = 'Connected (Read OK)';
        } catch (e) {
            report.firestore = `Failed: ${e.message} `;
        }

        this.setState({ diagnostics: report });
    }

    handleReset = () => {
        if (window.confirm("Questo resetterà la cache locale e ricaricherà la pagina. Utile per errori di configurazione.")) {
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = '/login';
        }
    };

    render() {
        const isRescue = window.location.search.includes('rescue=true');
        const isSimulation = window.location.search.includes('simulate_error=true');

        if (this.state.hasError || isRescue || isSimulation) {
            // Show Diagnostics if specifically requested or if in Rescue Mode
            const showDiagnostics = isRescue || (this.state.isRescueMode);

            if (showDiagnostics) {
                if (!this.state.diagnostics && isRescue) {
                    // Ensure diagnostics run if manually triggered via URL
                    setTimeout(() => this.state.diagnostics || this.runDiagnostics(), 0);
                }
                return (
                    <div className="min-h-screen bg-gray-900 text-gray-100 p-8 font-mono">
                        <div className="max-w-4xl mx-auto space-y-8">
                            <div className="border-l-4 border-red-500 pl-6">
                                <h1 className="text-3xl font-bold text-red-500 mb-2 flex items-center gap-3">
                                    <ShieldAlert /> MODALITÀ RESCUE
                                </h1>
                                <p className="text-gray-400">Pannello di diagnostica d&apos;emergenza.</p>
                            </div>

                            <div className="bg-black/50 p-6 rounded-xl border border-gray-800">
                                <h2 className="text-xl font-bold mb-4 text-white">Stato Errore</h2>
                                {this.state.error ? (
                                    <pre className="text-red-400 overflow-x-auto p-4 bg-red-900/10 rounded-lg text-sm">
                                        {this.state.error.toString()}
                                    </pre>
                                ) : (
                                    <div className="text-green-400 p-4 bg-green-900/10 rounded-lg text-sm border border-green-900">
                                        Nessun errore critico attivo. Modalità diagnostica manuale.
                                    </div>
                                )}
                            </div>

                            {this.state.diagnostics && (
                                <div className="bg-black/50 p-6 rounded-xl border border-gray-800">
                                    <h2 className="text-xl font-bold mb-4 text-blue-400">Diagnostica Sistema</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        <div className="p-3 bg-gray-800 rounded">
                                            <span className="text-gray-400 block text-xs uppercase">Firestore</span>
                                            <span className={this.state.diagnostics.firestore.includes('Failed') ? 'text-red-400' : 'text-green-400'}>
                                                {this.state.diagnostics.firestore}
                                            </span>
                                        </div>
                                        <div className="p-3 bg-gray-800 rounded">
                                            <span className="text-gray-400 block text-xs uppercase">Rete</span>
                                            <span className={this.state.diagnostics.network === 'Online' ? 'text-green-400' : 'text-red-400'}>
                                                {this.state.diagnostics.network}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {this.state.isAuthenticated ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-8 animate-fade-in">
                                    <button
                                        onClick={this.handleReset}
                                        className="p-4 bg-red-900/50 hover:bg-red-800 text-red-100 rounded-xl border border-red-900 flex items-center justify-center gap-3 transition-all font-bold"
                                    >
                                        <Trash size={20} /> Reset Config & Cache
                                    </button>
                                    <button
                                        onClick={() => window.location.href = '/'}
                                        className="p-4 bg-gray-800 hover:bg-gray-700 text-white rounded-xl border border-gray-700 flex items-center justify-center gap-3 transition-all font-bold"
                                    >
                                        <RefreshCw size={20} /> Riprova Caricamento
                                    </button>
                                </div>
                            ) : (
                                <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 mt-8">
                                    <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                        Area Protetta
                                    </h3>
                                    <p className="text-gray-400 text-sm mb-4">Autenticati per eseguire azioni di ripristino.</p>
                                    <div className="space-y-3">
                                        <input
                                            type="email"
                                            placeholder="Admin Email"
                                            className="w-full bg-gray-900 border border-gray-700 p-3 rounded-lg text-white"
                                            value={this.state.email || ''}
                                            onChange={(e) => this.setState({ email: e.target.value })}
                                        />
                                        <input
                                            type="password"
                                            placeholder="Password"
                                            className="w-full bg-gray-900 border border-gray-700 p-3 rounded-lg text-white"
                                            value={this.state.password || ''}
                                            onChange={(e) => this.setState({ password: e.target.value })}
                                        />
                                        <button
                                            onClick={this.handleLogin}
                                            className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-lg transition-colors"
                                        >
                                            Contatta l&apos;assistenza
                                        </button>
                                    </div>
                                    <div className="mt-4 text-[10px] text-gray-400 font-mono bg-gray-50 p-2 rounded border border-gray-100 overflow-x-auto">
                                        {this.state.error && this.state.error.toString()}
                                    </div>
                                </div>
                            )}

                            <div className="text-center pt-8 text-xs text-gray-600">
                                Copia l&apos;errore qui sopra e invialo al supporto tecnico se il reset non funziona.
                            </div>
                        </div>
                    </div>
                );
            }

            // Standard Error UI (User Facing)
            return (
                <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
                    <div className="bg-white p-8 rounded-[2rem] shadow-xl max-w-md w-full border border-gray-100">
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
                            <AlertTriangle size={32} />
                        </div>
                        <h2 className="text-2xl font-serif font-bold text-gray-900 mb-3">Si è verificato un errore</h2>
                        <p className="text-gray-500 mb-8">Non preoccuparti, è stato generato un report automatico.</p>

                        <div className="space-y-3">
                            <button
                                onClick={() => window.location.reload()}
                                className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition"
                            >
                                Ricarica Pagina
                            </button>
                            <a
                                href="/?rescue=true"
                                className="block w-full py-3 text-gray-400 hover:text-gray-600 text-sm font-bold transition"
                            >
                                Modalità Diagnostica (Admin)
                            </a>
                            <a
                                href="/login"
                                className="block w-full py-3 text-violet-600 hover:text-violet-800 text-sm font-black uppercase tracking-widest transition border-t border-gray-100 pt-4 mt-2"
                            >
                                Accesso Area Riservata
                            </a>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default RescueBoundary;
