
import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: true
})

export const metadata = {
  title: 'Dertlio - Şirket Şikayetleri ve Deneyimler Platformu',
  description: 'Şirketler hakkında deneyimlerinizi paylaşın, şikayetlerinizi dile getirin ve diğer kullanıcıların deneyimlerinden faydalanın. Türkiye\'nin en güvenilir şikayet platformu.',
  keywords: 'şikayet, şirket deneyimi, tüketici hakları, müşteri memnuniyeti, firma değerlendirme, dertlio',
  authors: [{ name: 'Dertlio' }],
  creator: 'Dertlio',
  publisher: 'Dertlio',
  robots: 'index, follow',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=5',
  themeColor: '#dc2626',
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    url: 'https://dertlio.com',
    siteName: 'Dertlio',
    title: 'Dertlio - Şirket Şikayetleri ve Deneyimler Platformu',
    description: 'Şirketler hakkında deneyimlerinizi paylaşın, şikayetlerinizi dile getirin ve diğer kullanıcıların deneyimlerinden faydalanın.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dertlio - Şirket Şikayetleri ve Deneyimler Platformu',
    description: 'Şirketler hakkında deneyimlerinizi paylaşın, şikayetlerinizi dile getirin ve diğer kullanıcıların deneyimlerinden faydalanın.',
  },
  alternates: {
    canonical: 'https://dertlio.com'
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      <head>
        <link rel="icon" href="https://static.readdy.ai/image/7787a2ce36fec40941bbbef8cf7f1725/91fea210aebe086edefc8a9b37eab84b.png" />
        <link 
          href="https://cdn.jsdelivr.net/npm/remixicon@2.5.0/fonts/remixicon.css" 
          rel="stylesheet"
          crossOrigin="anonymous"
        />
        <link 
          href="https://fonts.googleapis.com/css2?family=Pacifico&display=swap" 
          rel="stylesheet"
          crossOrigin="anonymous"
        />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//static.readdy.ai" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className={inter.className}>
        <div id="__next">{children}</div>
      </body>
    </html>
  )
}
