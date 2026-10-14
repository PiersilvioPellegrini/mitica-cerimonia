import React, { useEffect, useRef, useState } from 'react';

export default function ScrollReveal({
    children,
    animation = 'fade-up',
    delay = 0,
    duration = 700,
    className = ''
}) {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(entry.target);
                }
            },
            {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px' // Trigger slightly before element is fully in view
            }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => {
            if (ref.current) {
                // eslint-disable-next-line react-hooks/exhaustive-deps
                observer.unobserve(ref.current);
            }
        };
    }, []);

    const getAnimationClass = () => {
        switch (animation) {
            case 'fade-up': return 'fade-up';
            case 'scale-up': return 'scale-up';
            case 'fade-in': return 'fade-in'; // We'd need to add specific styling if different from base
            default: return 'fade-up';
        }
    };

    return (
        <div
            ref={ref}
            className={`animate-on-scroll ${getAnimationClass()} ${isVisible ? 'is-visible' : ''} ${className}`}
            style={{
                transitionDuration: `${duration}ms`,
                transitionDelay: `${delay}ms`
            }}
        >
            {children}
        </div>
    );
}
