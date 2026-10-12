import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import Header from '@/components/site/Header'
import Footer from '@/components/site/Footer'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: {
    default: '한지우 — 보안 포트폴리오',
    template: '%s — 한지우',
  },
  description: '위협 탐지, 사고 대응, 디지털 포렌식을 다루는 보안 연구자 한지우의 포트폴리오',
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    siteName: '한지우 — 보안 포트폴리오',
  },
  icons: {
    icon: [
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#050b1f',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        <a href="#main" className="skip">본문으로 건너뛰기</a>
        <Header />
        <main id="main">{children}</main>
        <Footer />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
