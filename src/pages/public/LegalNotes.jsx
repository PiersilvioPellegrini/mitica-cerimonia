import React from 'react';
import { motion } from 'framer-motion';

const LegalNotes = () => {
    return (
        <div className="min-h-screen pt-32 pb-20 px-6 max-w-4xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <h1 className="text-4xl font-serif font-bold mb-12 text-primary-900">Note Legali e Diritti</h1>

                <div className="space-y-8 text-gray-600 leading-relaxed font-light text-sm md:text-base">
                    <section>
                        <h2 className="text-xl font-bold mb-4 text-black uppercase tracking-widest text-xs">1. Copyright e Diritti d&apos;Autore</h2>
                        <p>
                            Tutti i contenuti presenti su questo sito (testi, immagini, grafica, loghi, icone, video, audio, etc.) sono di proprietà esclusiva di <strong>Mitica Cerimonia</strong> o dei rispettivi proprietari e sono protetti dalle leggi italiane e internazionali sul diritto d&apos;autore.
                        </p>
                        <p className="mt-2">
                            È severamente vietata la riproduzione, la distribuzione, la modifica, l&apos;esposizione pubblica o qualsiasi altro utilizzo dei contenuti di questo sito senza l&apos;esplicita autorizzazione scritta di Mitica Cerimonia.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4 text-black uppercase tracking-widest text-xs">2. Limitazione di Responsabilità</h2>
                        <p>
                            Mitica Cerimonia si impegna a fornire informazioni accurate e aggiornate su questo sito, ma non garantisce l&apos;assenza di errori o omissioni. L&apos;azienda non si assume alcuna responsabilità per eventuali danni diretti, indiretti, incidentali o consequenziali derivanti dall&apos;accesso o dall&apos;uso di questo sito.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4 text-black uppercase tracking-widest text-xs">3. Marchi Registrati</h2>
                        <p>
                            I marchi, i loghi e i nomi commerciali presenti su questo sito sono di proprietà di Mitica Cerimonia o delle rispettive società proprietarie. L&apos;uso non autorizzato di tali marchi è vietato.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4 text-black uppercase tracking-widest text-xs">4. Modifiche ai Termini</h2>
                        <p>
                            Mitica Cerimonia si riserva il diritto di modificare o aggiornare queste note legali in qualsiasi momento senza preavviso. L&apos;utilizzo continuato del sito dopo tali modifiche costituisce accettazione dei nuovi termini.
                        </p>
                    </section>
                </div>
            </motion.div>
        </div>
    );
};

export default LegalNotes;
