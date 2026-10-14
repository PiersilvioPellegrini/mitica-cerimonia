import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, ArrowLeft, X } from 'lucide-react';

export default function Login() {
    const { login, loginWithGoogle, loginWithApple } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(email, password);
            navigate('/');
        } catch (err) {
            setError('Credenziali non valide. Riprova.');
        }
    };

    const handleGoogleLogin = async () => {
        try {
            await loginWithGoogle();
            navigate('/');
        } catch (err) {
            setError('Accesso con Google fallito.');
        }
    };

    const handleAppleLogin = async () => {
        try {
            await loginWithApple();
            navigate('/');
        } catch (err) {
            setError('Accesso con Apple fallito.');
        }
    };

    const containerVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.8,
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50/50 relative overflow-hidden p-6">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-100/50 rounded-full blur-3xl -mr-64 -mt-64" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-violet-100/30 rounded-full blur-3xl -ml-64 -mb-64" />

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="w-full max-w-lg bg-white/80 backdrop-blur-xl p-10 md:p-16 rounded-[3rem] shadow-2xl shadow-primary-900/10 border border-white relative z-10"
            >
                <motion.div variants={itemVariants} className="text-center mb-12">
                    <Link to="/" className="inline-block mb-8">
                        <img src="/images/logo.png" alt="Mitica Cerimonia" className="h-20 w-auto mx-auto object-contain" />
                    </Link>
                    <h1 className="text-4xl font-serif text-primary-950 font-black tracking-tight">Accesso Privato</h1>
                    <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-[10px] mt-4">Riservato allo staff Mitica Cerimonia</p>
                </motion.div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mb-8 p-4 bg-red-50 border border-red-100 text-red-600 text-sm font-bold rounded-2xl flex items-center justify-center gap-2"
                    >
                        <X size={16} /> {error}
                    </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <motion.div variants={itemVariants}>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Email Aziendale</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="email"
                                className="w-full bg-gray-50 border-none focus:ring-2 focus:ring-primary-900/20 p-4 pl-12 rounded-2xl transition-all font-medium text-gray-900"
                                placeholder="nome@miticacerimonia.it"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="password"
                                className="w-full bg-gray-50 border-none focus:ring-2 focus:ring-primary-900/20 p-4 pl-12 rounded-2xl transition-all font-medium text-gray-900"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </motion.div>

                    <motion.button
                        variants={itemVariants}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        className="w-full bg-black py-5 text-white font-black uppercase tracking-[0.2em] text-xs rounded-full shadow-xl shadow-primary-900/10 hover:bg-primary-900 transition-all flex items-center justify-center gap-3"
                    >
                        <LogIn size={18} /> Accedi al Gestionale
                    </motion.button>
                </form>

                <motion.div variants={itemVariants} className="my-10 flex items-center gap-4">
                    <div className="flex-grow h-[1px] bg-gray-100"></div>
                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Altre opzioni</span>
                    <div className="flex-grow h-[1px] bg-gray-100"></div>
                </motion.div>

                <div className="grid grid-cols-2 gap-4">
                    <motion.button
                        variants={itemVariants}
                        whileHover={{ y: -2 }}
                        onClick={handleGoogleLogin}
                        className="flex items-center justify-center gap-3 border border-gray-100 bg-white py-4 rounded-2xl shadow-sm transition-all hover:shadow-md text-xs font-bold"
                    >
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="h-5 w-5" />
                        Google
                    </motion.button>
                    <motion.button
                        variants={itemVariants}
                        whileHover={{ y: -2 }}
                        onClick={handleAppleLogin}
                        className="flex items-center justify-center gap-3 bg-black py-4 rounded-2xl shadow-sm transition-all hover:shadow-md text-xs font-bold text-white"
                    >
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.127 3.675-.548 9.093 1.519 12.127 1.006 1.479 2.22 3.122 3.822 3.087 1.547-.038 2.126-.983 3.987-.983 1.84 0 2.378.983 3.982.955 1.637-.027 2.688-1.468 3.71-2.946 1.157-1.685 1.62-3.328 1.646-3.411-.035-.015-3.172-1.22-3.21-4.832-.03-3.037 2.478-4.49 2.584-4.57-1.411-2.074-3.626-2.306-4.409-2.345-1.954-.15-3.606 1.072-4.71 1.072l.001-.128zm-2.884-.315c.983 1.258 2.768 1.524 3.053 1.246.332-1.7-1.066-4.226-3.208-4.256-.476.01-3.623 2.127 0 2.996.096.014.155.014.155.014z" /></svg>
                        Apple
                    </motion.button>
                </div>

                <motion.div variants={itemVariants} className="mt-12 text-center">
                    <Link to="/" className="inline-flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-primary-900 transition-colors">
                        <ArrowLeft size={14} /> Torna al Sito Pubblico
                    </Link>
                </motion.div>
            </motion.div>
        </div>
    );
}

