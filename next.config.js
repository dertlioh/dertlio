const nextConfig = {
  output: "export",
  images: {
    unoptimized: true,  },
  typescript: {    ignoreBuildErrors: false,  }};
module.exports = nextConfig;
```**`tailwind.config.js` dosyası oluştur:**
```javascriptmodule.exports = {
  content: [    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],  theme: {
    extend: {
      fontFamily: {        pacifico: ['var(--font-pacifico)', 'serif'],      },    },
  },
  plugins: [],
}```