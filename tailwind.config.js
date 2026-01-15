/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                background: "var(--bg-color)",
                card: "var(--card-bg)",
                border: "var(--border-color)",
                primary: "var(--text-primary)",
                secondary: "var(--text-secondary)",
                accent: "var(--accent)",
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
