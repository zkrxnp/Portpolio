# 정현진 — 보안 연구 포트폴리오

Next.js(App Router, React) + MongoDB(Mongoose)로 만든 풀스택 포트폴리오입니다.
프로젝트 탐색, Research Log, 방명록을 DB에서 읽고 쓰며, 관리자 화면에서 코드 수정 없이 관리합니다.

- **Frontend**: Next.js 16 / React 19 (서버 컴포넌트 + 필요한 곳만 클라이언트 컴포넌트)
- **Backend**: Next.js Route Handler(Node 런타임)로 만든 REST API — `app/api/**`
- **Database**: MongoDB (로컬 Docker 또는 Atlas)
- **디자인**: Dark Editorial + Security Research Lab (차콜 / 라임, `app/globals.css` 한 파일)

> **왜 Express를 따로 두지 않았나** — Route Handler가 이미 Node 위에서 도는 REST 서버입니다.
> Express를 추가하면 같은 API를 두 곳에 두게 되고, Vercel 하나로 되던 배포가 프론트·백엔드 둘로
> 갈라져 CORS·쿠키 도메인 설정까지 생깁니다. 검증·인증·요청 제한·오류 처리 요구사항은 모두 이 구조로
> 충족되므로 기존 스택을 확장했습니다.

## 빠르게 띄우기

```bash
pnpm install
cp .env.example .env.local   # 값을 채운 뒤 (아래 참고)
pnpm seed                    # 초기 데이터 — 없는 것만 만들고, 있는 문서는 덮어쓰지 않음
pnpm dev                     # http://localhost:3000
```

로컬 DB가 필요하면 Docker로 띄울 수 있습니다.

```bash
docker run -d --name portfolio-mongo -p 127.0.0.1:27017:27017 -v portfolio-mongo-data:/data/db mongo:7
```

### GitHub OAuth 앱 만들기

관리자 로그인은 비밀번호 대신 GitHub으로 합니다. [github.com/settings/developers](https://github.com/settings/developers) → **New OAuth App**:

- Homepage URL: `http://localhost:3000`
- Authorization callback URL: `http://localhost:3000/api/auth/github/callback`

만든 뒤 Client ID와 Client Secret을 `.env.local`에 넣습니다. OAuth 앱은 콜백 URL을 하나만 받으므로
**운영용 앱은 따로** 만들어 운영 도메인의 콜백을 등록하세요.

### 본인 GitHub 숫자 ID 찾기

허용 목록은 사용자명이 아니라 **숫자 ID**로 겁니다. 사용자명은 바꿀 수 있고 계정을 지우면
남이 그 이름을 다시 가져갈 수 있어서, 이름으로 걸면 그 계정을 선점한 사람이 관리자가 됩니다.

```powershell
curl -s https://api.github.com/users/본인아이디
```

나온 `"id"` 값을 `ADMIN_GITHUB_IDS`에 넣으세요. 이 값이 관리자 계정을 만드는 **유일한 초기 설정**입니다.
아무나 관리자를 만들 수 있는 가입 경로는 없습니다.

### 환경 변수

| 이름 | 설명 |
| --- | --- |
| `MONGODB_URI` | Atlas는 Connect → Drivers에서 복사(`.net/` 뒤에 DB 이름). 로컬은 `mongodb://127.0.0.1:27017/jiwoo-portfolio` |
| `AUTH_SECRET` | 세션 서명 키. **손으로 짓지 말 것** — `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`. 로컬과 운영은 다른 값 |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | OAuth 앱 자격 증명 |
| `ADMIN_GITHUB_IDS` | 들어올 수 있는 GitHub 숫자 ID. 쉼표로 여러 개 |
| `ADMIN_GITHUB_LOGIN` | ID를 못 구했을 때만 쓰는 대안. 권장하지 않음 |
| `NEXT_PUBLIC_SITE_URL` | OG 태그용 절대 URL. 배포 후 실제 도메인으로 |

`ADMIN_GITHUB_IDS`와 `ADMIN_GITHUB_LOGIN`이 **둘 다 비어 있으면 아무도 로그인할 수 없습니다.**

**개발 데이터와 운영 데이터 분리** — `.env.local`은 로컬 DB(또는 Atlas의 `-dev` DB)를, Vercel 환경 변수는
운영 DB를 가리키게 두세요. 명령 앞에 붙인 환경 변수가 `.env.local`보다 우선하므로
`MONGODB_URI=mongodb://127.0.0.1:27017/portfolio-test pnpm seed`처럼 대상을 명시할 수 있고,
seed는 실행할 때 대상 주소(비밀번호는 가림)를 먼저 출력합니다.

## 화면

| 경로 | 내용 |
| --- | --- |
| `/` | 히어로, 대표 작업(비대칭 그리드), 소개, 활동 타임라인, 최근 Research Log, **방명록**, 연락 |
| `/projects` | 검색 + 분야 · **기술 스택** · **진행 상태** 필터 + **정렬**(추천·최신·이름). 상태가 URL에 남습니다 |
| `/projects/[slug]` | 케이스 스터디(OBJECTIVE / ANALYSIS / FINDINGS / STACK), 상태·GitHub 링크, **연결된 Research Log** |
| `/blog` | **Research Log** — 검색, 분류·태그 필터, 최신·오래된 순 |
| `/blog/[slug]` | 마크다운 본문(코드 블록·이미지), **관련 프로젝트** |
| `/contact` | 문의 폼 (DB 저장) |
| `/admin` | 통계 — 공개/비공개 수, 방명록 수, 안 읽은 문의, 누적 조회 |
| `/admin/projects` | 추가 / 수정 / 삭제. 진행 상태, 대표 이미지 경로, GitHub 링크 |
| `/admin/posts` | Research Log 작성 / 수정 / 삭제, 분류·관련 프로젝트, **목록에서 공개 여부 바로 전환** |
| `/admin/guestbook` | 방명록 목록·삭제 |
| `/admin/messages` | 문의함 |

케이스 스터디 라벨은 본문을 새로 쓰지 않습니다. 본문의 `##` 소제목 이름으로 분류만 합니다
(배경·목표 → OBJECTIVE, 배운 것·결과·한계·찾은 것 → FINDINGS, 나머지 → ANALYSIS. `lib/caseStudy.ts`).

## 데이터

| 컬렉션 | 명세 이름 → 실제 필드 |
| --- | --- |
| `projects` | description → `summary`, content → `body`, technologies → `stack`, githubUrl → `links.repo`, `status`, `thumbnail`, `category`, `slug`(unique), timestamps |
| `posts` (Research Log) | summary → `excerpt`, content → `body`, `category`, `tags`, `relatedProjectIds`, `published`, `slug`(unique), timestamps |
| `guestbook` | `name`, `message`, `createdAt` — IP는 저장하지 않음 |
| `ratehits` | 공개 쓰기 요청 기록. 키는 `sha256(IP + AUTH_SECRET)`, **제한 창(10분)이 지나면 TTL로 자동 삭제** |

기존 데이터를 지키려고 DB 필드 이름은 바꾸지 않았고, API 응답에는 명세의 이름(`description`, `content`,
`technologies`, `githubUrl`, `summary`)을 함께 실어 보냅니다. Research Log는 기존 글이 있던 `posts`
컬렉션을 그대로 씁니다(이름을 바꾸면 기존 글이 사라진 것처럼 보이므로).

인덱스: 공개·분류·기술·상태 조합, `relatedProjectIds`, 방명록 `createdAt`, rate hit TTL.

## API

공개:

| 메서드 | 경로 | 비고 |
| --- | --- | --- |
| `GET` | `/api/projects?q=&category=&tech=&status=&sort=featured\|latest\|name&page=&limit=` | 공개 항목만. 잘못된 값은 **422** |
| `GET` | `/api/projects/:slug` | 상세 + 연결된 Research Log. 없으면 404 |
| `GET` | `/api/research-logs?q=&tag=&category=&sort=newest\|oldest&page=&limit=` | **공개 기록만** |
| `GET` | `/api/research-logs/:slug` | 비공개면 404(존재 여부도 숨김) |
| `GET` | `/api/posts` | 예전 주소 호환(= research-logs) |
| `GET` | `/api/guestbook?page=&limit=` | 최신순, 페이지네이션 |
| `POST` | `/api/guestbook` | `{ name, message }` — 아래 보안 참고 |
| `POST` | `/api/messages` | 문의 접수 |
| `POST` | `/api/views/{project\|post}/{slug}` | 조회수 +1 |
| `GET` | `/api/auth/github` → `/api/auth/github/callback` | OAuth(state + PKCE) |
| `POST` | `/api/auth/logout` | 세션 쿠키 만료 |

관리자 (`/api/admin/*` — 미들웨어가 모든 요청에서 세션을 검사, 없으면 **401**):

| 메서드 | 경로 |
| --- | --- |
| `GET` `POST` | `/api/admin/projects` |
| `GET` `PUT` `DELETE` | `/api/admin/projects/[id]` |
| `GET` `POST` | `/api/admin/posts` |
| `GET` `PUT` `PATCH`(공개 여부) `DELETE` | `/api/admin/posts/[id]` |
| `DELETE` | `/api/admin/guestbook/[id]` |
| `GET` / `PATCH` `DELETE` | `/api/admin/messages`, `/api/admin/messages/[id]` |
| `GET` | `/api/admin/stats` |

오류 응답은 `{ error, issues? }` 형태이고 스택 트레이스·경로·환경 변수를 싣지 않습니다(`lib/http.ts`).

## 보안

- **비밀번호를 저장하지 않습니다.** 관리자 신원은 GitHub이 보증하고 서버는 숫자 ID만 대조합니다(저장할 비밀번호가 없으니 해시 유출·대입 공격 표면이 없음)
- OAuth에 `state`와 **PKCE(S256)**. `state`는 `timingSafeEqual`로 비교하고 일회용 쿠키는 성공·실패 무관하게 폐기
- `scope`를 비워 요청하고, 받은 액세스 토큰은 ID 확인 후 버립니다
- 복귀 경로는 `/admin` 또는 그 하위만 허용(열린 리다이렉트 방지)
- 세션은 JWT(HS256)를 **HttpOnly · SameSite=Lax · 운영에서 Secure** 쿠키에, 8시간 만료
- `middleware.ts`가 `/admin/*`, `/api/admin/*`을 통째로 막습니다. 화면에서 메뉴를 숨기는 것과 무관하게 API마다 서버에서 검사합니다
- **CSRF**: 관리자 API의 쓰기 요청은 `Origin`이 같은 사이트일 때만 받습니다(없거나 다르면 403). SameSite=Lax와 겹쳐 둡니다
- 로그인 시도 제한: 허용 목록 밖 계정의 반복 시도를 IP·계정 기준으로 잠급니다(DB 카운터 + TTL)
- **방명록**: 4KB 요청 크기 제한, JSON만, zod 검증(보이지 않는 문자 제거 후 공백만 있는 입력 거부, 이름 1~40자·메시지 2~500자), 허니팟, **발신지별 10분 3건 + 전체 10분 60건** 제한. 저장은 평문이고 화면에서는 React가 텍스트로 이스케이프하므로 HTML·스크립트가 실행되지 않습니다
- 모든 입력은 zod를 먼저 통과합니다 — `{"$ne": …}` 같은 연산자 객체는 문자열 검사에서 걸립니다(NoSQL 인젝션 방지)
- 검색어는 정규식 메타문자를 이스케이프하고, 정렬 키·페이지는 허용 목록으로 검증합니다
- 프로젝트 링크는 `http(s)`만, 대표 이미지는 사이트 경로(`/…`)나 `https`만 저장됩니다(`javascript:` 차단)
- 마크다운은 렌더 직전 DOMPurify로 태그·속성·URL 스킴을 화이트리스트로 거릅니다
- 클라이언트 IP는 `X-Forwarded-For`의 **맨 오른쪽** 값(앞단 프록시가 붙인 값)을 씁니다

### 남아 있는 것

- **세션 무효화 없음** — JWT가 stateless라 토큰이 유출되면 8시간 동안 유효합니다. 강제 만료는 `AUTH_SECRET` 교체
- **GitHub 계정에 의존** — 깃허브 계정이 뚫리면 관리자도 뚫립니다. 2FA를 켜두세요
- **운영은 HTTPS 필수** — 세션 쿠키가 `Secure`로 나갑니다
- **Atlas `0.0.0.0/0`** — M0 무료 플랜은 Private Endpoint 미지원. DB 비밀번호가 사실상 유일한 방어선
- **조회수 API는 인증 없음** — 숫자 부풀리기 가능(열람 전용이라 그대로 둠)
- **프록시 없이 직접 노출하면** XFF를 믿을 수 없어 IP 기준 제한이 우회됩니다. Vercel처럼 앞단이 헤더를 덮어쓰는 환경을 전제로 합니다

## 테스트

```bash
pnpm test        # 단위(36) + OAuth(40) + 레이트리밋(23) — DB·네트워크 없이
pnpm typecheck
pnpm build
```

API 통합 테스트(67건)는 **실제 서버에 HTTP로 요청**합니다. 운영 DB를 쓰지 않도록 로컬 테스트 DB로 서버를 띄워 돌립니다.

```bash
# 1) 테스트 DB 준비
MONGODB_URI=mongodb://127.0.0.1:27017/portfolio-test pnpm seed
# 2) 빌드 후 테스트 DB로 서버 실행 (다른 터미널)
pnpm build
MONGODB_URI=mongodb://127.0.0.1:27017/portfolio-test AUTH_SECRET=<테스트용 32자 이상> pnpm exec next start -p 3100
# 3) 같은 값으로 테스트
MONGODB_URI=mongodb://127.0.0.1:27017/portfolio-test AUTH_SECRET=<같은 값> TEST_BASE_URL=http://localhost:3100 pnpm test:api
```

테스트 스크립트는 `MONGODB_URI`가 Atlas 주소면 실행을 거부합니다. 관리자 로그인은 GitHub OAuth라 자동화할 수
없어서, 서버와 같은 `AUTH_SECRET`으로 세션을 서명해 "로그인된 상태"를 만든 뒤 권한 검사와 CRUD를 검증합니다.

## 배포 (Vercel)

API가 Next.js 안에 있으므로 **프론트와 백엔드가 한 번에 배포**됩니다. 별도 서버·CORS 설정이 필요 없습니다.

1. 저장소를 import
2. Environment Variables: `MONGODB_URI`(운영 DB), `AUTH_SECRET`(새로 생성), `GITHUB_CLIENT_ID/SECRET`(운영용 OAuth 앱), `ADMIN_GITHUB_IDS`, `NEXT_PUBLIC_SITE_URL`
3. 운영용 OAuth 앱의 callback URL: `https://내도메인/api/auth/github/callback`
4. Atlas Network Access에 `0.0.0.0/0`(M0) 또는 Vercel 대역
5. 운영 DB에 초기 데이터가 필요하면 한 번만: `MONGODB_URI=<운영 주소> pnpm seed` (없는 것만 만듦)
6. 배포 후 확인: `/api/projects` 200, `/admin` → GitHub 로그인 → 관리자 화면, 방명록 등록

빌드는 DB 없이도 통과합니다(DB 검사는 실제 연결 시점). env를 빠뜨리면 빌드는 되지만 목록이 비어 보이니,
env를 넣은 뒤에는 **Redeploy** 하세요.

## 구조

```
app/
  page.tsx                  홈
  projects/(list)/          목록 + loading (라우트 그룹: 상세 404가 스트리밍에 묻히지 않게)
  projects/[slug]/          케이스 스터디 상세
  blog/(list)/, blog/[slug]/  Research Log
  contact/                  문의 폼
  admin/                    로그인, 대시보드, 프로젝트·기록 에디터, 방명록, 문의함
  api/                      공개 REST API + /api/admin 보호 구간
lib/
  data.ts                   조회 계층 — 페이지와 API가 같은 필터·정렬·응답 형태를 씀
  validation.ts             zod: 입력·조회 쿼리 스키마
  caseStudy.ts              본문 소제목 → OBJECTIVE/ANALYSIS/FINDINGS
  activities.ts             활동 기록(Notion 기준) + 연도 묶음
  models/                   Project, Post, Guestbook, RateHit, Message, User, LoginAttempt
  mongodb.ts                연결 캐싱(연결 시점에 env 검사)
  auth.ts · oauth.ts        JWT 세션 · GitHub OAuth
  rateLimit.ts              로그인 시도 제한, 클라이언트 IP
  markdown.ts               marked + DOMPurify
components/site/            헤더, 검색바(필터·정렬), 방명록, 시각 자료, 페이지 전환
components/admin/           관리 내비, 에디터, 공개 토글, 삭제 버튼
middleware.ts               /admin, /api/admin 인증 + 쓰기 요청 Origin 검사
scripts/                    seed, unit / oauth / ratelimit / api 테스트
```
