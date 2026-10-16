# 한지우 — 보안 포트폴리오

Next.js(App Router) + MongoDB로 만든 포트폴리오. 프로젝트·글·문의를 DB에서 읽고,
관리자 페이지에서 브라우저로 직접 쓰고 고칠 수 있습니다.

## 빠르게 띄우기

```bash
pnpm install
cp .env.example .env.local   # 값을 채운 뒤 (아래 참고)
pnpm seed                    # 예시 콘텐츠
pnpm dev                     # http://localhost:3000
```

### GitHub OAuth 앱 만들기

로그인은 비밀번호 대신 GitHub으로 합니다. [github.com/settings/developers](https://github.com/settings/developers) → **New OAuth App**:

- Homepage URL: `http://localhost:3000`
- Authorization callback URL: `http://localhost:3000/api/auth/github/callback`

만든 뒤 Client ID와 Client Secret을 `.env.local`에 넣습니다.

### 본인 GitHub 숫자 ID 찾기

허용 목록은 사용자명이 아니라 **숫자 ID**로 겁니다. 사용자명은 바꿀 수 있고 계정을 지우면
남이 그 이름을 다시 가져갈 수 있어서, 이름으로 걸면 그 계정을 선점한 사람이 관리자가 됩니다.

```powershell
curl -s https://api.github.com/users/본인아이디
```

나온 `"id"` 값을 `ADMIN_GITHUB_IDS`에 넣으세요. 그 상태로 `/admin`에 가서 GitHub으로
로그인하면, 첫 로그인 때 관리자 문서가 자동으로 만들어집니다.

### 환경 변수

| 이름 | 설명 |
| --- | --- |
| `MONGODB_URI` | Atlas는 Connect → Drivers에서 복사. 로컬은 `mongodb://127.0.0.1:27017/jiwoo-portfolio` |
| `AUTH_SECRET` | 세션 서명 키. **손으로 짓지 말 것** — `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | OAuth 앱 자격 증명 |
| `ADMIN_GITHUB_IDS` | 들어올 수 있는 GitHub 숫자 ID. 쉼표로 여러 개 |
| `ADMIN_GITHUB_LOGIN` | ID를 못 구했을 때만 쓰는 대안. 권장하지 않음 |
| `NEXT_PUBLIC_SITE_URL` | OG 태그용 절대 URL. 배포 후 실제 도메인으로 |

`ADMIN_GITHUB_IDS`와 `ADMIN_GITHUB_LOGIN`이 **둘 다 비어 있으면 아무도 로그인할 수 없습니다.**
열어두는 것보다 잠그는 쪽이 안전해서 그렇게 뒀습니다.

## 화면

| 경로 | 내용 |
| --- | --- |
| `/` | 히어로, 최근 작업 3건, 최근 글 3건, 소개 |
| `/projects` | 검색 + 분야 필터. 상태가 URL에 남아 뒤로가기·링크 공유가 됩니다 |
| `/projects/[slug]` | 상세. 마크다운 본문, 조회수 |
| `/blog`, `/blog/[slug]` | 글 목록·상세, 태그 필터 |
| `/contact` | 문의 폼 (DB 저장) |
| `/admin` | 통계 — 공개 수, 초안 수, 안 읽은 문의, 누적 조회, 인기 프로젝트 |
| `/admin/projects` | 목록 / 추가 / 수정 / 삭제. 썸네일 그래픽 미리보기 |
| `/admin/posts` | 목록 / 작성 / 수정 / 삭제. 마크다운 미리보기 탭 |
| `/admin/messages` | 문의함. 펼치면 자동 읽음, 답장함·보관·삭제 |

## API

공개:

| 메서드 | 경로 | 비고 |
| --- | --- | --- |
| `GET` | `/api/projects?q=&category=&page=&limit=` | 공개 항목만 |
| `GET` | `/api/posts?q=&tag=&page=&limit=` | 발행 글만 |
| `POST` | `/api/messages` | 문의 접수 |
| `POST` | `/api/views/{project\|post}/{slug}` | 조회수 +1 |
| `GET` | `/api/auth/github` | state + PKCE 심고 GitHub으로 |
| `GET` | `/api/auth/github/callback` | 검증 후 세션 발급 |
| `POST` | `/api/auth/logout` | |

관리자 (`/api/admin/*`, 미들웨어가 401로 거름):

| 메서드 | 경로 |
| --- | --- |
| `GET` `POST` | `/api/admin/projects` |
| `GET` `PUT` `DELETE` | `/api/admin/projects/[id]` |
| `GET` `POST` | `/api/admin/posts` |
| `GET` `PUT` `DELETE` | `/api/admin/posts/[id]` |
| `GET` | `/api/admin/messages` |
| `PATCH` `DELETE` | `/api/admin/messages/[id]` |
| `GET` | `/api/admin/stats` |

## 보안

- **비밀번호를 저장하지 않습니다.** 신원은 GitHub이 보증하고, 서버는 숫자 ID만 대조합니다
- OAuth에 `state`와 **PKCE(S256)** 를 둘 다 겁니다. `state`는 `timingSafeEqual`로 비교하고, state·verifier·복귀 경로 쿠키는 성공이든 실패든 응답에서 즉시 폐기합니다
- `scope`를 비워서 요청합니다. 신원 확인에는 공개 프로필의 숫자 ID면 충분하고, 그 이상은 받지 않습니다. 받은 액세스 토큰은 ID 확인 후 버립니다
- 허용 목록은 숫자 ID 기준입니다. 사용자명으로 설정하면 동작은 하되 서버 로그에 경고를 남깁니다
- 복귀 경로는 `/admin` 또는 그 하위만 허용합니다 (열린 리다이렉트 방지)
- 세션은 JWT를 httpOnly·SameSite=Lax 쿠키에 담고 8시간 만료
- `middleware.ts`가 `/admin/*`과 `/api/admin/*`을 통째로 막습니다. 페이지에서만 막으면 API가 열린 채 남기 쉽습니다
- 허용 목록 밖 계정이 콜백을 반복해서 두드리면 IP 기준으로 잠급니다(`lib/rateLimit.ts`). 카운터는 **DB에 둡니다** — 인스턴스 메모리에 두면 서버리스에서 콜드 스타트마다 초기화되어 사실상 무력화됩니다. 만료는 TTL 인덱스가 처리하고, 원문 IP는 저장하지 않고 해시만 남깁니다
- 문의 폼은 허니팟 필드 + IP 해시 기준 10분 3건 제한. 원문 IP는 저장하지 않습니다
- 마크다운은 렌더 직전 DOMPurify로 태그·속성·URL 스킴을 화이트리스트로 거릅니다
- 외부 링크(`target="_blank"`)에는 `rel="noopener noreferrer"`를 강제합니다
- 검색어는 정규식 메타문자를 이스케이프해서 넘깁니다

### 남아 있는 것

솔직하게 적어둡니다.

- **세션 무효화 없음** — JWT가 stateless라 토큰이 유출되면 8시간 동안 유효합니다. 로그아웃은 본인 쿠키만 지웁니다. 강제 만료가 필요하면 `AUTH_SECRET`을 교체하세요
- **GitHub 계정에 의존** — 깃허브 계정이 뚫리면 관리자도 같이 뚫립니다. 그쪽에 2FA를 켜두세요
- **운영은 HTTPS 필수** — 세션 쿠키가 `Secure`로 나갑니다. HTTP로 서비스하면 로그인이 조용히 실패합니다
- **Atlas `0.0.0.0/0`** — M0 무료 플랜은 Private Endpoint를 지원하지 않아 사실상 강제입니다. 그러면 DB 앞 방어는 비밀번호 하나뿐이니, 직접 짓지 말고 Atlas의 Autogenerate Secure Password를 쓰세요
- **조회수 API는 인증 없음** — 숫자를 부풀릴 수 있습니다. 열람만 가능하고 데이터 침해는 아니라 그대로 뒀습니다
- **`.env.local`** — `.gitignore`에 있지만, 새면 DB 주소·비번·서명 키가 한꺼번에 나갑니다. 커밋 전 `git status` 한 번

## 설계 메모

- **연결 캐싱** — `lib/mongodb.ts`가 연결을 전역에 캐시합니다. 안 하면 개발 모드 HMR마다 커넥션이 쌓여 Atlas 한도를 넘깁니다. 실패한 프로미스는 캐시에서 비워, 한 번 실패가 이후 요청을 전부 죽이지 않게 했습니다
- **DB 없이도 빌드됨** — 공개 페이지의 조회는 실패 시 빈 값으로 떨어지고 콘솔에 크게 남습니다. 빌드가 DB에 묶이면 배포가 DB 상태에 인질이 됩니다. 관리자 화면은 이 래퍼를 쓰지 않고 에러를 그대로 띄웁니다
- **조회수는 클라이언트에서** — 서버 렌더 중에 올리면 프리페치와 봇 크롤링까지 세어 숫자가 금방 의미를 잃습니다. 세션 스토리지로 같은 방문의 중복도 막습니다
- **글 저장은 `save()`** — `findByIdAndUpdate`는 `pre('save')` 훅을 건너뛰어서 발행일과 읽는 시간이 안 채워집니다
- **검색 상태는 URL에** — 뒤로가기와 링크 공유가 공짜로 따라옵니다

## 테스트

```bash
pnpm test            # 둘 다
pnpm test:oauth      # state 비교, PKCE, 허용 목록, 열린 리다이렉트 (40건)
pnpm test:ratelimit  # 잠금 상태 머신 + 클라이언트 IP (23건)
```

DB도 네트워크도 타지 않습니다. 모델 메서드만 메모리 구현으로 갈아끼워 판정 로직만 봅니다.

## 배포 (Vercel)

1. 저장소를 import
2. Environment Variables를 넣습니다. `NEXT_PUBLIC_SITE_URL`은 배포 도메인으로
3. GitHub OAuth 앱의 **Authorization callback URL에 운영 도메인을 추가**합니다
   (`https://내도메인/api/auth/github/callback`). 로컬과 운영을 같이 쓸 거면 앱을 둘로 나누는 편이 깔끔합니다
4. Atlas의 Network Access에 `0.0.0.0/0`을 열거나 Vercel 대역을 허용합니다
5. 배포 후 `/admin`에서 GitHub으로 로그인하면 관리자 문서가 자동 생성됩니다

## 구조

```
app/
  page.tsx                  홈
  projects/                 목록, [slug] 상세
  blog/                     목록, [slug] 상세
  contact/                  문의 폼
  admin/                    로그인, 대시보드, 프로젝트·글 에디터, 문의함
  api/                      공개 API + /api/admin 보호 구간
lib/
  mongodb.ts                연결 캐싱
  models/                   Project, Post, Message, User, LoginAttempt
  auth.ts                   JWT 서명·검증, 세션 쿠키
  oauth.ts                  GitHub OAuth, PKCE, 허용 목록, 리다이렉트 검증
  rateLimit.ts              DB 기반 시도 제한
  validation.ts             zod 스키마
  markdown.ts               marked + DOMPurify
  data.ts                   서버 컴포넌트용 조회
components/site/            헤더, 푸터, 검색바, 문의 폼, 조회수, 썸네일 그래픽
components/admin/           관리 내비, 로그인 폼, 에디터, 문의 목록
middleware.ts               /admin, /api/admin 접근 제어
scripts/                    seed + 테스트 2종
```

스타일은 `app/globals.css` 한 파일(약 20KB)입니다. Tailwind와 shadcn은
한 군데도 쓰이지 않아 걷어냈습니다.
"# Portpolio" 
