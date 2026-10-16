import { ViewTransition } from 'react'

const slide = { 'nav-forward': 'nav-forward', 'nav-back': 'nav-back', default: 'none' }

// 페이지 단위 좌우 슬라이드. 레이아웃은 내비게이션 사이에 유지되므로 각 page.tsx에서 감쌉니다.
export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter={slide} exit={slide} default="none">
      {children}
    </ViewTransition>
  )
}

// 목록의 썸네일과 상세의 큰 비주얼을 같은 이름으로 묶어 모핑시킵니다.
export function SharedVisual({ slug, children }: { slug: string; children: React.ReactNode }) {
  return (
    <ViewTransition name={`visual-${slug}`} share="morph" default="none">
      {children}
    </ViewTransition>
  )
}
