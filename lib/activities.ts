/**
 * 활동 기록. 출처는 Notion "ME 포트폴리오"의 Activities 목록과 하위 페이지입니다.
 * Notion에 적힌 날짜만 씁니다. 날짜가 없는 항목은 date를 비워두고 추측해서 채우지 않습니다.
 */
export type Activity = {
  date: string
  kind: '발표' | 'CTF' | '수상' | '프로젝트' | '교육' | '행사' | '탐방' | '동아리' | '학력'
  title: string
  detail?: string
  href?: string
}

export const activities: Activity[] = [
  { date: '2026.09.30', kind: '발표', title: 'S.C.P 세미나 — House of Spirit 취약점' },
  { date: '2026.08', kind: '행사', title: '해킹캠프 참가', detail: 'AI 에이전트 해킹, LLM 로그인 계정 탈취, SBOM 등 세션 정리' },
  { date: '2026.07.06 — 07.16', kind: '교육', title: '합동강화훈련' },
  { date: '2026.06 — 09', kind: '프로젝트', title: 'TrustGate — 릴리스 계보 탐지·패키지 취약점 분석 시스템', detail: 'Rootkeepers, 팀장', href: '/projects/trustgate' },
  { date: '2026.04.14', kind: '발표', title: '오픈 세미나 — 프롬프트 인젝션' },
  { date: '2026.02.08', kind: 'CTF', title: '한양대 CTF 참가' },
  { date: '2026.02.07', kind: 'CTF', title: 'Inc0gnito CTF 참가' },
  { date: '2026.01.12', kind: '발표', title: '명지대 합동 세미나 — 지뢰찾기 리버싱', href: '/projects/minesweeper-reversing' },
  { date: '2025.12.29 — 2026.02.24', kind: '프로젝트', title: 'sudo 취약점 탐색과 N-day 분석', href: '/projects/sudo-nday' },
  { date: '2025.10.01 — 12.06', kind: '프로젝트', title: 'AWS CI/CD 보안 파이프라인', detail: 'PM', href: '/projects/aws-devsecops-pipeline' },
  { date: '2025', kind: '수상', title: 'JBU CTF 장려상' },
  { date: '2025', kind: 'CTF', title: 'CCE CTF 참가' },
  { date: '2025', kind: 'CTF', title: '세종 헥테온 CTF 참가' },
  { date: '2025-2', kind: '동아리', title: '직무동아리 — 라온시큐어 AI 레드티밍 기업 분석' },
  { date: '', kind: '탐방', title: '안랩 기업 탐방' },
  { date: '', kind: '탐방', title: '토스 기업 탐방' },
  { date: '2025.03', kind: '학력', title: '중부대학교 정보보호학전공 입학' },
]
