import React from 'react';
import { motion } from 'framer-motion';

const CookiePolicy = () => {
    return (
        <div className="min-h-screen pt-32 pb-20 px-6 max-w-4xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <h1 className="text-4xl font-serif font-bold mb-12 text-primary-900">Cookie Policy</h1>

                <div className="space-y-8 text-gray-600 leading-relaxed font-light text-sm md:text-base">
                    <section>
                        <h2 className="text-xl font-bold mb-4 text-black uppercase tracking-widest text-xs">Cosa sono i cookie</h2>
                        <p>
                            I cookie sono piccoli file di testo che i siti visitati dagli utenti inviano ai loro terminali, ove vengono memorizzati per essere poi ritrasmessi agli stessi siti alla visita successiva. I cookie delle c.d. "terze parti" vengono, invece, impostati da un sito web diverso da quello che l'utente sta visitando. Questo perché su ogni sito possono essere presenti elementi (immagini, mappe, suoni, specifici link a pagine web di altri domini, ecc.) che risiedono su server diversi da quello del sito visitato.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4 text-black uppercase tracking-widest text-xs">Tipologie di cookie utilizzati</h2>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Cookie Tecnici:</strong> Necessari per il corretto funzionamento del sito e per l'erogazione dei servizi offerti.</li>
                            <li><strong>Cookie Analitici:</strong> Utilizzati per raccogliere informazioni in forma aggregata sul numero degli utenti e su come questi visitano il sito.</li>
                            <li><strong>Cookie di Profilazione:</strong> Volti a creare profili relativi all'utente e vengono utilizzati al fine di inviare messaggi pubblicitari in linea con le preferenze manifestate dallo stesso nell'ambito della navigazione in rete.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4 text-black uppercase tracking-widest text-xs">Gestione dei cookie</h2>
                        <p>
                            L'utente può decidere se accettare o meno i cookie utilizzando le impostazioni del proprio browser. La disabilitazione dei cookie "terze parti" non pregiudica in alcun modo la navigabilità. Le impostazioni possono essere definite in modo specifico per i diversi siti e applicazioni web.
                        </p>
                    </section>

                    <div className="pt-8 text-xs text-gray-400">
                        Ultima modifica: {new Date().toLocaleDateString('it-IT')}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default CookiePolicy;
