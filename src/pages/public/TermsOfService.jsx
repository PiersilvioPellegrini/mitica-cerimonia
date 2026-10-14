import React from 'react';
import { motion } from 'framer-motion';

const TermsOfService = () => {
    return (
        <div className="min-h-screen pt-32 pb-20 px-6 max-w-4xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <h1 className="text-4xl font-serif font-bold mb-12 text-primary-900">Termini e Condizioni di Servizio</h1>

                <div className="space-y-8 text-gray-600 leading-relaxed font-light text-sm md:text-base">
                    <section>
                        <h2 className="text-xl font-bold mb-4 text-black uppercase tracking-widest text-xs">1. Oggetto</h2>
                        <p>
                            I presenti Termini e Condizioni disciplinano l'accesso e l'uso del sito web di Mitica Cerimonia. L'accesso e l'uso del sito, così come l'acquisto di prodotti, presuppongono la lettura, la conoscenza e l'accettazione di questi Termini.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4 text-black uppercase tracking-widest text-xs">2. Proprietà Intellettuale</h2>
                        <p>
                            I contenuti del sito (testi, immagini, grafica) sono di proprietà di Celebrity Fashion srls o dei suoi partner. È vietata la riproduzione non autorizzata.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4 text-black uppercase tracking-widest text-xs">3. Prenotazione Appuntamenti</h2>
                        <p>
                            Il servizio di prenotazione appuntamenti online è volto a facilitare il contatto tra il cliente e l'Atelier. La conferma dell'appuntamento è soggetta a disponibilità e sarà comunicata tramite i recapiti forniti in fase di prenotazione.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4 text-black uppercase tracking-widest text-xs">4. Legge Applicabile</h2>
                        <p>
                            Qualsiasi controversia relativa a questi Termini sarà soggetta alla giurisdizione esclusiva dei tribunali italiani (Foro di Roma).
                        </p>
                    </section>

                    <div className="pt-8 text-xs text-gray-400">
                        Ultima modifica: {new Date().toLocaleDateString('it-IT')}
                        <br />
                        Celebrity Fashion srls - P.IVA 17925031001
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default TermsOfService;
