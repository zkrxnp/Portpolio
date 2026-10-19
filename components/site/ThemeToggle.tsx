'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

export const THEME_KEY = 'theme'

/**
 * 밝은 화면 / 어두운 화면 전환. 실제 색은 <html data-theme>에 걸린 CSS 토큰이 바꿉니다.
 * 첫 화면 깜빡임을 막으려고 초기값은 layout의 인라인 스크립트가 먼저 넣고(저장값 → 시스템 설정 순),
 * 여기서는 그 값을 읽어 아이콘만 맞춥니다.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === 'light' ? 'light' : 'dark')
  }, [])

  function toggle() {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    document.documentElement.dataset.theme = next
    try {
      localStorage.setItem(THEME_KEY, next)
    } catch {
      /* 저장소를 못 쓰는 환경(시크릿 창 등)이면 이번 방문 동안만 유지됩니다. */
    }
  }

  const label = theme === 'light' ? '어두운 화면으로 바꾸기' : '밝은 화면으로 바꾸기'
  return (
    <button type="button" className="theme-toggle" onClick={toggle} aria-label={label} title={label}>
      {theme === 'light' ? <Moon aria-hidden /> : <Sun aria-hidden />}
    </button>
  )
}

export default ThemeToggle
