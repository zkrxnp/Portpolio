import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import Header from '@/components/site/Header'
import Footer from '@/components/site/Footer'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: {
    default: '정현진 — 보안 포트폴리오',
    template: '%s — 정현진',
  },
  description: '리버싱과 시스템 해킹을 공부하는 정현진의 포트폴리오',
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    siteName: '정현진 — 보안 포트폴리오',
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
  colorScheme: 'dark light',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f6f6f6' },
    { media: '(prefers-color-scheme: dark)', color: '#1e1e1e' },
  ],
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // data-theme은 아래 스크립트가 그리기 전에 넣습니다(저장값 → 시스템 설정). 서버 HTML과 달라도 경고를 내지 않게 합니다.
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark')t=matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme='dark'}`,
          }}
        />
      </head>
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
