/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                cream: '#F8F5F0',
                'cream-white': '#FFFFFF',
                charcoal: '#1A1A1A',
                'charcoal-light': '#2A2A2A',
                'text-secondary': '#595959',
                gold: '#DFBD38',
                coral: '#DE7B6C',
                'dot-grid': '#E0E0E0',
            },
            fontFamily: {
                sans: ['Inter', 'Helvetica Neue', 'Arial', 'sans-serif'],
                serif: ['"Playfair Display"', 'Bodoni MT', 'Georgia', 'serif'],
                display: ['"Playfair Display"', 'Georgia', 'serif'],
                ui: ['Montserrat', 'sans-serif'],
                inter: ['Inter', 'sans-serif'],
            },
            transitionTimingFunction: {
                'spring-bounce': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
            },
            borderRadius: {
                'editorial': '2px',
                '4xl': '2rem',
                '5xl': '3rem',
                '6xl': '4rem',
            },
            backgroundImage: {
                'dot-grid': "radial-gradient(circle, #E0E0E0 1px, transparent 1px)",
            },
        },
    },
    plugins: [],
}
