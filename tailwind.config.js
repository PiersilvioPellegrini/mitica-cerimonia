/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // New Brand Palette: Purple & White
                primary: {
                    50: '#f4f1ff',
                    100: '#ebe5ff',
                    200: '#d9d2ff',
                    300: '#b8a5ff',
                    400: '#9570ff',
                    500: '#6d28d9',
                    600: '#5b21b6',
                    700: '#4c1d95',
                    800: '#381675',
                    900: '#260c52',
                    950: '#12022b',
                },
                // High contrast text
                brandtext: {
                    main: '#1A1A1A', // Pretty much black, softer
                    secondary: '#4A4A4A',
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                serif: ['Playfair Display', 'serif'],
            },
            // Custom Animations
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                marquee: {
                    '0%': { transform: 'translateX(100%)' },
                    '100%': { transform: 'translateX(-100%)' },
                }
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-out',
                'slide-up': 'slideUp 0.7s ease-out',
                'marquee': 'marquee 25s linear infinite',
            },
        },
    },
    plugins: [],
}
