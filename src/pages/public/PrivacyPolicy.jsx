import React from 'react';
import { motion } from 'framer-motion';

const PrivacyPolicy = () => {
    return (
        <div className="min-h-screen pt-32 pb-20 px-6 max-w-4xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <h1 className="text-4xl font-serif font-bold mb-12 text-primary-900">Privacy Policy</h1>

                <div className="space-y-8 text-gray-600 leading-relaxed font-light text-sm md:text-base">
                    <section>
                        <h2 className="text-xl font-bold mb-4 text-black uppercase tracking-widest text-xs">1. Titolare del Trattamento</h2>
                        <p>
                            Mitica Cerimonia<br />
                            Via dei Prati Fiscali 325/335, 00141 Roma (RM)<br />
                            Email: celebrity.fashion335@gmail.com
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4 text-black uppercase tracking-widest text-xs">2. Tipologie di Dati raccolti</h2>
                        <p className="mb-4">
                            Fra i Dati Personali raccolti da questa Applicazione, in modo autonomo o tramite terze parti, ci sono: Cookie; Dati di utilizzo; email; nome; cognome; numero di telefono.
                        </p>
                        <p>
                            Dettagli completi su ciascuna tipologia di dati raccolti sono forniti nelle sezioni dedicate di questa privacy policy o mediante specifici testi informativi visualizzati prima della raccolta dei dati stessi.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4 text-black uppercase tracking-widest text-xs">3. Modalità e luogo del trattamento</h2>
                        <p>
                            Il Titolare adotta le opportune misure di sicurezza volte ad impedire l’accesso, la divulgazione, la modifica o la distruzione non autorizzate dei Dati Personali.
                            Il trattamento viene effettuato mediante strumenti informatici e/o telematici, con modalità organizzative e con logiche strettamente correlate alle finalità indicate.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4 text-black uppercase tracking-widest text-xs">4. Finalità del Trattamento</h2>
                        <p>
                            I Dati dell’Utente sono raccolti per consentire al Titolare di fornire il Servizio, adempiere agli obblighi di legge, rispondere a richieste o azioni esecutive, tutelare i propri diritti ed interessi (o quelli di Utenti o di terze parti), individuare eventuali attività dolose o fraudolente.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4 text-black uppercase tracking-widest text-xs">5. Diritti dell’Utente</h2>
                        <p>
                            Gli Utenti possono esercitare determinati diritti con riferimento ai Dati trattati dal Titolare. In particolare, l’Utente ha il diritto di:
                        </p>
                        <ul className="list-disc pl-5 mt-2 space-y-2">
                            <li>Revocare il consenso in ogni momento.</li>
                            <li>Opporsi al trattamento dei propri Dati.</li>
                            <li>Accedere ai propri Dati.</li>
                            <li>Verificare e chiedere la rettificazione.</li>
                            <li>Ottenere la limitazione del trattamento.</li>
                            <li>Ottenere la cancellazione o rimozione dei propri Dati Personali.</li>
                        </ul>
                    </section>

                    <div className="pt-8 text-xs text-gray-400">
                        Ultima modifica: {new Date().toLocaleDateString('it-IT')}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default PrivacyPolicy;
