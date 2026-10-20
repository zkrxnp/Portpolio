/**
 * 프로젝트·기록의 선택지 목록. 관리자 편집기(브라우저)에서도 쓰기 때문에 mongoose를 import하지 않습니다.
 * 모델 파일에서 가져오면 브라우저 번들에 mongoose가 딸려 들어가고, 브라우저판에는
 * mongoose.models가 없어 화면이 열리자마자 "reading 'Project'" 오류로 죽습니다.
 */
export const PROJECT_CATEGORIES = ['시스템', '리버싱', '공급망', '클라우드', 'AI 보안'] as const
export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number]

export const PROJECT_VISUALS = ['log', 'trust', 'hex', 'none'] as const

export const PROJECT_STATUSES = ['진행 중', '완료', '중단'] as const
export type ProjectStatus = (typeof PROJECT_STATUSES)[number]

export const LOG_CATEGORIES = ['리버싱', '시스템', '공급망', 'CTF', '클라우드', 'AI 보안', '기타'] as const
export type LogCategory = (typeof LOG_CATEGORIES)[number]
