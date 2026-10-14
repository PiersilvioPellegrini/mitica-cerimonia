import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Skeleton } from '../../components/ui/Skeleton';
import SEO from '../../components/common/SEO';

export default function OurStory() {
    const [imagesLoaded, setImagesLoaded] = useState({});

    const handleImageLoad = (id) => {
        setImagesLoaded(prev => ({ ...prev, [id]: true }));
    };

    const galleryImages = [
        { id: 'atelier', src: '/images/story/atelier_interior.png', alt: 'Interno Atelier' },
        { id: 'mannequin', src: '/images/story/mannequin_detail.png', alt: 'Dettaglio Abito' },
        { id: 'atmosphere', src: '/images/story/boutique_atmosphere.png', alt: 'Atmosfera Boutique' }
    ];

    return (
        <div className="bg-white">
            <SEO
                title="La Nostra Storia"
                description="Dal 1980 Mitica Cerimonia è l'Atelier di riferimento a Roma. Scopri la nostra storia di sartoria, eccellenza e passione per gli abiti da cerimonia."
            />
            {/* Hero Section */}
            <section className="relative h-[70vh] flex items-center justify-center overflow-hidden bg-black text-white">
                <div className="absolute inset-0 z-0">
                    <motion.img
                        initial={{ scale: 1.1 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 10, repeat: Infinity, repeatType: 'reverse' }}
                        src="/images/home/hero_bg_user.jpg"
                        alt="Atelier Storico"
                        className="w-full h-full object-cover opacity-60 grayscale"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/80" />
                </div>
                <div className="relative z-10 text-center px-6 max-w-4xl">
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                        className="text-6xl md:text-8xl font-serif mb-8 leading-tight tracking-tighter"
                    >
                        La Nostra <span className="italic text-primary-300">Storia.</span>
                    </motion.h1>
                    <motion.div
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: '100px' }}
                        transition={{ delay: 0.8, duration: 1 }}
                        className="h-[2px] bg-primary-300 mx-auto mb-8"
                    />
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1, duration: 1 }}
                        className="text-xs md:text-sm uppercase tracking-[0.5em] font-black text-primary-100/80"
                    >
                        Tradizione e Alta Sartoria dal 1980
                    </motion.p>
                </div>
            </section>

            {/* Content Section */}
            <section className="py-32 px-6">
                <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-20 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="space-y-8"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-[1px] bg-primary-900" />
                            <h2 className="text-primary-900 text-xs font-black uppercase tracking-[0.4em]">Le Origini</h2>
                        </div>
                        <h3 className="text-5xl font-serif leading-[1.1] text-primary-950">
                            Un sogno nato <span className="italic text-primary-600 font-medium">quarant&apos;anni fa.</span>
                        </h3>
                        <p className="text-gray-600 leading-relaxed font-light text-xl">
                            Mitica vanta tradizioni antiche, tramandate da madre in figlio. Nata come piccola sartoria, si è trasformata negli anni in un atelier di riferimento per abiti da sposa, sposo e cerimonia per tutta la famiglia.
                            <br /><br />
                            Il cuore del nostro lavoro è l&apos;ascolto: tramite l&apos;appuntamento riusciamo ad entrare in profonda sintonia con le tue esigenze. Sergio e il suo team ti guideranno con gentilezza e competenza alla scoperta dell&apos;abito dei tuoi sogni, in un ambiente familiare dove ogni dettaglio è curato con passione.
                            <br /><br />
                            Grazie alla vostra fiducia siamo diventati una realtà importante nel nostro settore.
                        </p>
                        <div className="pt-6">
                            <div>
                                <h4 className="text-2xl font-serif italic text-primary-900 mb-1">20k+</h4>
                                <p className="text-[10px] uppercase tracking-widest font-black text-gray-400">Sogni Realizzati</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1 }}
                        className="relative"
                    >
                        <div className="aspect-[3/4] bg-primary-50 relative overflow-hidden shadow-2xl rounded-[3rem] border border-gray-100 p-4">
                            <div className="w-full h-full overflow-hidden rounded-[2.5rem] relative">
                                {!imagesLoaded['main'] && <Skeleton className="absolute inset-0 w-full h-full" />}
                                <img
                                    src="/images/story/tailor_hands.png"
                                    alt="Dettaglio Sartoriale"
                                    onLoad={() => handleImageLoad('main')}
                                    className={`object-cover w-full h-full transition-opacity duration-1000 ${imagesLoaded['main'] ? 'opacity-100' : 'opacity-0'}`}
                                />
                            </div>
                        </div>
                        <div className="absolute -bottom-8 -right-8 w-64 h-64 border-[12px] border-primary-50 z-[-1] rounded-[4rem]" />
                    </motion.div>
                </div>
            </section>

            {/* Gallery Section */}
            <section className="py-32 px-6 bg-gray-50/50">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20">
                        <h2 className="text-primary-900 text-xs font-black uppercase tracking-[0.4em] mb-4">L&apos;Atelier</h2>
                        <h3 className="text-5xl font-serif italic text-primary-950">I Nostri Spazi</h3>
                    </div>

                    {/* Central Large Image */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1 }}
                        className="mb-16 relative"
                    >
                        <div className="aspect-video w-full bg-white p-3 rounded-[3rem] shadow-xl border border-gray-100">
                            <div className="w-full h-full overflow-hidden rounded-[2.5rem] relative">
                                {!imagesLoaded['central'] && <Skeleton className="absolute inset-0 w-full h-full" />}
                                <img
                                    src="/images/story/showroom_central_large.jpg"
                                    alt="Il nostro showroom principale"
                                    loading="lazy"
                                    onLoad={() => handleImageLoad('central')}
                                    className={`w-full h-full object-cover transition-all duration-1000 hover:scale-105 ${imagesLoaded['central'] ? 'opacity-100' : 'opacity-0'}`}
                                />
                            </div>
                        </div>
                    </motion.div>


                </div>
            </section>

            {/* Values Section */}
            <section className="py-32 px-6 bg-white relative overflow-hidden border-t border-gray-100">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl md:text-6xl font-serif text-primary-950 mb-6">I Nostri Valori</h2>
                        <div className="w-24 h-[1px] bg-primary-900 mx-auto" />
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                img: "/images/values/empathy.png",
                                title: "Empatia",
                                text: "Ascoltiamo con il cuore. Comprendere i vostri desideri profondi è l'essenza del nostro lavoro, per guidarvi verso l'abito che rispecchia la vostra anima."
                            },
                            {
                                img: "/images/values/trust.png",
                                title: "Fiducia",
                                text: "Una promessa lunga 40 anni. La nostra storia è fatta di legami autentici e trasparenza, garantendovi la serenità di affidarvi a mani esperte nel giorno più importante."
                            },
                            {
                                img: "/images/values/customization.png",
                                title: "Eccellenza",
                                text: "L'arte del dettaglio sartoriale. Selezioniamo solo i tessuti migliori e curiamo ogni finitura con passione artigianale, perché la vostra unicità merita la perfezione."
                            }
                        ].map((val, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.2, duration: 0.6 }}
                                className="group p-10 bg-white rounded-[3rem] border border-gray-100 shadow-sm transition-all duration-500 hover:shadow-xl hover:shadow-primary-900/5 hover:-translate-y-2 text-center relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-50 rounded-full -mr-16 -mt-16 opacity-30 group-hover:scale-110 transition-transform duration-700" />
                                <div className="w-32 h-32 mx-auto mb-8 relative z-10 group-hover:scale-105 transition-transform">
                                    <img
                                        src={val.img}
                                        alt={val.title}
                                        loading="lazy"
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                                <h3 className="text-2xl font-serif mb-4 text-primary-950 relative z-10">{val.title}</h3>
                                <p className="text-gray-500 text-base leading-relaxed font-medium relative z-10">{val.text}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
