/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    // Next.js sayfalarının ve src içindeki tüm bileşenlerin yolunu belirtiyoruz.
    "./src/**/*.{js,ts,jsx,tsx}", // <-- Bu yol KRİTİKTİR, src altını tarar.
    "./pages/**/*.{js,ts,jsx,tsx}",
    // Diğerleri
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}