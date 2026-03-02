/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                periwinkle: '#C3C0D8',
                violet: '#584B77',
                charcoal: '#1A1A1A',
                'charcoal-light': '#2A2A2A',
            },
            fontFamily: {
                sans: ['"Plus Jakarta Sans"', 'Outfit', 'sans-serif'],
                serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
                outfit: ['Outfit', 'sans-serif'],
                jakarta: ['"Plus Jakarta Sans"', 'sans-serif'],
                cormorant: ['"Cormorant Garamond"', 'serif'],
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
                'hex-pattern': "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100'%3E%3Cpath d='M28 66L0 50V16L28 0l28 16v34L28 66zM28 100L0 84V68l28 16 28-16v16L28 100z' fill='none' stroke='%23584B77' stroke-width='0.5' opacity='0.05'/%3E%3C/svg%3E\")",
            },
        },
    },
    plugins: [],
}
