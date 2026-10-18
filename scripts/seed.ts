/**
 * 예시 콘텐츠 투입 스크립트.
 *
 * 관리자 계정은 여기서 만들지 않습니다. GitHub으로 처음 로그인할 때
 * 허용 목록을 통과하면 그때 자동으로 생성됩니다.
 */
import 'dotenv/config'
import { config } from 'dotenv'
import mongoose from 'mongoose'

config({ path: '.env.local', override: true })

import Project from '../lib/models/Project'
import Post from '../lib/models/Post'

// 이전 템플릿(가상 인물) 시절의 예시 콘텐츠. 시드를 다시 돌리면 지웁니다.
const LEGACY_PROJECT_SLUGS = ['blue-team-lab', 'zero-trust', 'packet-notes']
const LEGACY_POST_SLUGS = ['what-we-cut-when-we-cut-alerts', 'finding-entry-with-double-encoding']

const projects = [
  {
    title: 'TrustGate',
    slug: 'trustgate',
    summary: 'npm 패키지 설치 전에 릴리스 계보를 검증하고, 검증되지 않으면 설치를 막는 도구를 만들었습니다.',
    category: '공급망',
    visual: 'trust',
    period: '2026.06 — 2026.09',
    role: '팀장',
    stack: ['Python', 'Docker', 'Sigstore', 'OSV', 'Semgrep'],
    featured: true,
    order: 0,
    body: `## 배경

최근 npm 공급망 공격은 정상 패키지의 계정이나 빌드 과정을 장악해 악성 버전을 끼워 넣는 방식이 많습니다.
패키지 이름과 버전만 봐서는 이 릴리스가 원래 저장소의 원래 빌드에서 나온 것인지 알 수 없습니다.

## 판정 원칙: fail-closed

- 규칙 하나라도 \`RISK\`이면 설치를 막습니다
- 증거가 부족해 검증할 수 없는 패키지도 \`UNVERIFIABLE (RISK)\`로 막습니다
- npm 인터셉트, \`trustgate install\`, \`trustgate scan\`이 모두 같은 기준으로 판정합니다

## npm provenance와 다른 점

대체하는 것이 아니라 **소비**합니다. provenance는 증명을 발급하는 쪽이고,
TrustGate는 그 증명을 읽어 설치를 차단하고, 정책을 적용하고, 증명이 없는 패키지를 등급화합니다.

## 통합 CLI

\`\`\`bash
trustgate doctor     # 환경 진단
trustgate up         # 대시보드 실행
trustgate scan       # 패키지 검사
trustgate install    # 검사 후 설치
trustgate monitor    # 설치 버전 취약점 확인
\`\`\`

대시보드가 꺼져 있어도 터미널 검사 이력이 로컬 DB에 남습니다.

## AI는 설명만 합니다

패키지 상세 화면에서 OSV 취약점 조회와 Semgrep 정적 분석 결과를 묶어 위험 요약을 보여줍니다.
**설치 여부는 AI가 아니라 기존 보안 규칙이 결정합니다.** AI API를 쓸 수 없으면 로컬 분석으로 넘어갑니다.

## 수집기에서 찾은 버그

판정이 조용히 틀어지던 버그 세 건을 찾아 고쳤습니다. 자세한 내용은 기록에 따로 정리했습니다.`,
  },
  {
    title: 'sudo 취약점 탐색과 N-day 분석',
    slug: 'sudo-nday',
    summary: 'sudo에서 새 취약점을 찾다가, 과거 권한 상승 취약점의 원인부터 분석했습니다.',
    category: '시스템',
    visual: 'hex',
    period: '2025.12 — 2026.02',
    role: '취약점 분석',
    stack: ['C', 'Docker'],
    featured: false,
    order: 1,
    body: `## 목표

sudo에서 아직 알려지지 않은 취약점을 찾는 것이었습니다.

## 막힌 곳

막상 시작해 보니 무작정 코드를 읽는 것만으로는 어디를 봐야 할지 알 수 없었습니다.
sudo는 오래되고 큰 코드베이스라, 기준 없이 읽으면 전부 수상해 보이거나 전부 평범해 보입니다.

## 방향 전환

그래서 먼저 과거 취약점이 **어디서, 왜** 발생했는지 이해하는 것부터 시작했습니다.
CVE-2025-32463 등 권한 상승 원데이를 Docker 환경에서 재현하며 원인과 패치를 분석했습니다.

CVE-2025-32463은 \`sudo -R\`(chroot 옵션)을 처리하는 과정에서 사용자가 만든 디렉터리 안의
\`nsswitch.conf\`를 읽어 버리는 문제입니다. 그 파일이 가리키는 공유 라이브러리가 root 권한으로
로드되면서 일반 사용자가 root를 얻습니다. 썸네일의 헥스 덤프가 바로 그 파일의 바이트입니다.

## 배운 것

취약점을 볼 때 "무엇인지"보다 "왜 그렇게 터졌는지"를 먼저 봐야, 다음에 비슷한 것을 알아볼 수 있다는 점입니다.`,
  },
  {
    title: 'AWS CI/CD 보안 파이프라인',
    slug: 'aws-devsecops-pipeline',
    summary: 'AWS CI/CD 파이프라인에 SAST·SCA·DAST를 적용해 보안 검사를 자동화했습니다.',
    category: '클라우드',
    visual: 'log',
    period: '2025.10 — 2025.12',
    role: 'PM',
    stack: ['AWS CodeBuild', 'ECR', 'CodeDeploy', 'ECS', 'IaC', 'Slack'],
    featured: false,
    order: 2,
    body: `## 구성

1. GitHub에 코드를 올리면 CodeBuild가 빌드와 함께 **SAST·SCA** 검사를 수행
2. Docker 이미지를 만들어 ECR에 저장
3. CodeDeploy와 ECS로 배포
4. 배포 후 **DAST**로 웹 취약점 점검
5. 결과는 Slack 알림과 대시보드로 확인

인프라는 IaC 방식으로 코드로 관리했습니다.

## 역할

PM을 맡아 팀원들과 역할을 나누고 일정을 관리했습니다.

## 범위와 한계

클라우드를 처음 접한 프로젝트라 AWS 환경과 CI/CD 구조를 이해하는 데 중점을 뒀습니다.
보안 도구를 파이프라인에 붙이는 데까지가 범위였고, 오탐(false positive) 운영까지는 가지 못했습니다.
지금 다시 한다면 기준선을 잡고 새로 생긴 항목만 빌드를 실패시키겠습니다.`,
  },
  {
    title: '지뢰찾기 리버싱',
    slug: 'minesweeper-reversing',
    summary: 'OllyDbg로 지뢰찾기의 조건 분기를 찾아 패치하고, 합동 세미나에서 발표했습니다.',
    category: '리버싱',
    visual: 'none',
    period: '2026.01',
    role: '분석, 발표',
    stack: ['OllyDbg', 'x86 Assembly'],
    featured: false,
    order: 3,
    body: `## 한 일

윈도우 지뢰찾기의 동작을 OllyDbg로 따라가며 게임 진행에 영향을 주는 조건문을 찾았습니다.
어셈블리 수준에서 분기를 패치해 실행 흐름을 바꾸고, 프로그램 동작이 실제로 달라지는 것을 확인했습니다.

## 발표

이 내용을 2026년 1월 명지대학교와의 합동 세미나에서 발표했습니다.

## 남은 것

바이너리 안에서 코드가 어떤 흐름으로 실행되는지 직접 보는 재미가, 이후 시스템 해킹과 취약점 분석으로 넘어가는 계기가 됐습니다.`,
  },
]

const posts = [
  {
    title: 'TrustGate에서 판정을 조용히 틀어지게 만든 버그 세 건',
    slug: 'trustgate-silent-bugs',
    excerpt: '프로세스는 죽지 않는데 판정만 틀어지는 버그는, 화면에서는 아무 일도 없어 보입니다.',
    tags: ['공급망', 'TrustGate'],
    published: true,
    publishedAt: new Date('2026-08-16'),
    body: `세 건 모두 공통점이 있습니다. **크래시가 나지 않습니다.** 대신 판정이 조용히 틀어집니다.
보안 도구에서는 이쪽이 더 위험합니다.

## 1. 정의되지 않은 함수

\`lineage.py\`에서 \`_slsa_git_reference\`를 호출하는데, 저장소 어디에도 그 함수 정의가 없었습니다.
해당 경로에 닿으면 \`NameError\`가 납니다.

그런데 \`scanning.py\`의 넓은 \`try/except\`가 예외를 삼켜서 프로세스는 죽지 않았습니다.
결과적으로 그 패키지는 그냥 \`ERROR\` 판정으로 나갔습니다.

사라진 정의를 복원했고, npm \`dist.gitHead\`가 없는 패키지도 이제 정상 판정됩니다.
같은 유실이 다시 생기면 바로 잡히도록 회귀 테스트를 붙였습니다.

## 2. 전달되지 않은 인자

\`_collect_github\` 호출부 두 곳 모두 \`workflow_entry_point\`를 넘기지 않아 항상 \`None\`이었습니다.

- \`workflow_modified_before_release\`가 항상 \`None\`
- 규칙 엔진의 20점 분기가 **영원히 도달할 수 없는 죽은 코드**
- \`workflow_drift\` 규칙이 **모든 스캔에서 PARTIAL**

즉 "릴리스 커밋에서 빌드 워크플로 파일이 바뀌었는가"라는 신호를 한 번도 못 보고 있었습니다.
공급망 공격에서 가장 먼저 봐야 할 신호 중 하나입니다.

경로가 GitHub 트랙까지 전달되도록 고쳤습니다. 트랙 전체를 다시 돌리면 API를 20번 넘게 부르지만
이 신호에는 3번이면 충분해서, 그 값만 따로 채우도록 했습니다.

## 3. 미검증인데 성공

\`trustgate scan\`은 설치 없이 검사만 하고 종료 코드로 결과를 알립니다. CI와 스크립트는 이 코드만 봅니다.

기존 코드는 \`RISK\`만 \`1\`로 처리하고 \`UNVERIFIABLE\`은 \`0\`을 돌려줬습니다.
화면에는 미검증 위험으로 뜨는데 자동화 환경에서는 **검사 성공**으로 읽히는 상태였습니다.

이제 \`PASS\`가 아니면 전부 \`1\`입니다. fail-closed 원칙이 CLI 종료 코드에서 새고 있었던 셈입니다.

## 정리

넓은 \`try/except\`, 기본값이 \`None\`인 인자, 성공으로 떨어지는 종료 코드.
셋 다 평소에는 "안전한 기본값"처럼 보이는 것들이었습니다.`,
  },
  {
    title: 'sudo에서 새 취약점을 찾다가 N-day로 돌아간 이유',
    slug: 'why-i-went-back-to-nday',
    excerpt: '어디를 봐야 할지 모를 때는, 이미 터진 곳이 왜 터졌는지부터 보는 게 빨랐습니다.',
    tags: ['시스템', 'sudo'],
    published: true,
    publishedAt: new Date('2026-02-24'),
    body: `## 처음 계획

두 달 동안 sudo에서 새 취약점을 하나 찾아보자는 것이었습니다.

## 막힌 이유

코드를 처음부터 읽기 시작했지만, 어디가 위험한지 판단할 기준이 없었습니다.
기준이 없으니 모든 함수가 비슷해 보였습니다.

## 그래서 거꾸로

이미 발견된 취약점이 **어디서, 왜** 생겼는지부터 보기로 했습니다.
CVE-2025-32463 같은 권한 상승 원데이를 Docker로 재현하고, 원인과 패치를 나란히 놓고 읽었습니다.

이렇게 보면 "sudo에서 위험한 곳"이 막연한 감이 아니라 구체적인 패턴이 됩니다.
권한이 바뀌는 순간, 사용자가 고른 경로를 신뢰하는 지점, 설정 파일을 읽는 순서 같은 것들입니다.

## 배운 것

취약점을 볼 때 "무엇인지"보다 "왜 그렇게 터졌는지"를 먼저 봐야 다음에 비슷한 것을 알아볼 수 있습니다.
새 취약점을 찾는 데 실패한 두 달이 아니라, 찾는 방법을 배운 두 달이었습니다.`,
  },
  {
    title: '지뢰찾기에 첫 클릭 자동 클리어 코드를 심기까지, 세 번의 시나리오',
    slug: 'minesweeper-auto-clear',
    excerpt: '지뢰 위치를 보여주는 맵핵 다음으로, 첫 클릭과 동시에 모든 지뢰를 표시하는 코드를 바이너리에 직접 붙였습니다.',
    tags: ['리버싱', '지뢰찾기'],
    published: true,
    publishedAt: new Date('2026-01-12'),
    body: `이전에 지뢰 위치를 보여주는 맵핵과 시간 핵을 만들었습니다.
명지대학교와의 합동 세미나를 앞두고, 이번에는 **타일을 누르자마자 모든 지뢰 위치에 표시를 하고 게임을 끝내는 핵**을 만들기로 했습니다.

처음에는 Windows 7 지뢰찾기로 시작했는데 분석이 너무 버거워서 Windows XP 버전으로 바꿨습니다.

## 먼저 찾은 두 가지

- **지뢰 판 메모리**: \`0x01005340\` ~ \`0x0100548A\`
- **타일을 그리는 코드**: \`BitBlt\` 호출. 그 위에서 인자를 쌓고 있었습니다

인자를 쌓기 직전 레지스터를 보면 \`ECX\`에 y, \`ESI\`에 x가 들어 있고, x는 이후 \`EAX\`로 옮겨집니다.
판 메모리에서 지뢰가 숨어 있는 칸은 \`0x8F\`였습니다.

## 시나리오 1: BitBlt를 직접 부르기

1. \`EAX\`, \`ECX\`, \`EBX\` 저장
2. 좌표를 (1, 1)로, \`EBX\`를 판 시작 주소로
3. 칸 값이 \`0x8F\`이면 \`BitBlt\` 호출, 좌표를 옮기며 반복
4. 레지스터 복원

**막힌 점**: \`BitBlt\`는 디바이스 컨텍스트 핸들이 필요해서, 결국 그리는 함수 전체를 가져와야 했습니다.
또 칸 값이 \`0xCC\`여야 지뢰 그림이 나오는데 값을 바꾸지 않고 부르고 있었습니다.

## 시나리오 2: 그리는 함수를 부르기

\`BitBlt\` 대신 타일을 그리는 함수를 Y, X 순서로 인자를 넣어 부르고, 한 줄이 \`0x20\` 바이트라 \`EBX\`를 \`0x20\`씩 더해 가며 칸을 검사했습니다.

**막힌 점**: 그 함수는 안에서 \`ESI\`를 X, \`EDX\`를 Y로 쓰고 있었습니다.
칸 주소도 \`0x01005340 + Y × 2⁵ + X\`로 계산하고 있어서, 제 반복문도 같은 레지스터와 같은 식을 써야 했습니다.

## 시나리오 3: 게임의 계산 방식에 맞추기

1. \`EBX\`, \`EDX\`, \`ESI\` 저장, \`EDX\`=1(Y), \`ESI\`=1(X), \`EBX\`=판 시작 주소
2. \`EDX\`를 잠깐 쌓아 두고 \`SHL EDX, 5\` 후 \`ESI\`를 더해 칸 위치 계산
3. 칸이 \`0x8F\`이면
   - 칸을 \`0xCC\`로 바꾸고, 레지스터와 플래그를 모두 저장(\`PUSHAD\`, \`PUSHFD\`)한 뒤 그리는 함수 호출
   - 복원 후 칸을 다시 \`0x8F\`로 되돌림
4. X가 9면 다음 줄로, 아니면 X+1. Y가 10이 될 때까지 반복
5. 저장한 레지스터를 복원하고 원래 명령어로 점프

실제로 붙인 바이트입니다.

\`\`\`
52 53 56 BE 01 00 00 00 BA 01 00 00 00 BB 40 53
00 01 52 C1 E2 05 01 F2 80 3C 1A 8F 75 1A C6 04
1A CC 5A 60 9C 52 56 E8 C4 DB FF FF 9D 61 52 C1
E2 05 01 F2 C6 04 1A 8F 5A 83 FE 09 75 0A BE 01
00 00 00 83 C2 01 EB 03 83 C6 01 83 FA 0A 75 C2
5E 5B 5A 84 1D 00 50 00 01 E9 BD ED FF FF
\`\`\`

## 정리

두 번 막힌 이유는 같았습니다. 제가 원하는 방식으로 코드를 짰고, 게임이 이미 쓰고 있는 방식(어느 레지스터에 무엇을 두는지, 칸 주소를 어떻게 계산하는지)을 따르지 않았습니다.
세 번째에서 원래 함수의 규칙에 맞추자 바로 동작했습니다.`,
  },
  {
    title: 'JBU CTF 2025 리버싱 풀이: 시드를 맞춘 forge, 시간을 바꾼 pessword',
    slug: 'jbu-ctf-2025-rev',
    excerpt: '두 문제 모두 답은 "시간"에 있었습니다. 하나는 같은 초에 같은 난수를 만들었고, 하나는 바이너리에 박힌 시간을 바꿨습니다.',
    tags: ['리버싱', 'CTF'],
    published: true,
    publishedAt: new Date('2025-12-29'),
    body: `2025 JBU CTF에서 장려상을 받았습니다. 그때 푼 리버싱 문제 중 두 개를 정리합니다.

## forge: 난수 열 번 맞히기

디컴파일한 \`main\`의 끝부분에서 플래그를 출력합니다.

\`\`\`c
if ( !--v10 )
{
  system("/bin/cat flag.txt");
  return 0;
}
\`\`\`

\`v10\`은 10에서 시작해 한 바퀴마다 1씩 줄어듭니다. 즉 반복문을 **10번 통과**해야 합니다.
반복문을 빠져나가는 다른 길은 입력이 틀렸을 때뿐입니다.

\`\`\`c
v9 = rand() % 1000;
...
if ( v11 != v9 ) { puts(...); return 0; }
\`\`\`

\`v11\`은 제 입력이고, \`v9\`는 \`rand() % 1000\`입니다. 그리고 시드는 \`srand(time(0))\`, 현재 초입니다.

\`rand()\`는 시드가 같으면 같은 수열을 냅니다. 그래서 서버에 접속하는 **같은 초에** 제 쪽에서도 같은 libc로 \`srand(time(0))\`을 부르면 열 개를 모두 미리 알 수 있다고 봤습니다.

\`\`\`python
from pwn import *
import ctypes

p = remote(HOST, PORT)
libc = ctypes.CDLL('./libc.so.6')

libc.srand(libc.time(0))
for i in range(10):
    k = libc.rand() % 1000
    p.recvuntil(b':')
    p.sendline(str(k).encode())

print(p.recvall().decode('utf-8', errors='ignore'))
\`\`\`

이 문제에서 pwntools를 처음 써 봤습니다. 비슷한 역할의 함수가 많아서 계속 찾아보며 풀었습니다.

## pessword: 파일에 박힌 시간

코드를 보면 실행 파일 헤더의 \`TimeDateStamp\` 값을 읽어 SHA-256을 계산하고, 그 결과를 플래그로 보여줍니다.

파일에 저장된 값은 \`BB 11 F5 68\`이었는데, 이걸로 나온 값은 진짜 플래그가 아니었습니다.
힌트로 나온 **CTF 시작 시각**에 맞춰 \`TimeDateStamp\`를 바꿔 넣자 진짜 플래그가 나왔습니다.

## 정리

두 문제 모두 "프로그램이 무엇을 입력으로 쓰는가"를 먼저 찾으면 풀렸습니다.
forge는 시드가 현재 시각이라는 점, pessword는 플래그의 재료가 헤더의 시각 값이라는 점이었습니다.`,
  },
  {
    title: 'JADX를 처음 써 본 Android 리버싱: NEXA Uncrackable1',
    slug: 'nexa-uncrackable1',
    excerpt: '계산기 앱에 숨은 잠금 화면을 호출 관계를 거꾸로 따라가 찾았는데, 정작 플래그는 코드에 그대로 적혀 있었습니다.',
    tags: ['리버싱', 'Android'],
    published: true,
    publishedAt: new Date('2026-04-29'),
    body: `평범한 계산기 앱처럼 보이는 문제였습니다. 목표는 두 가지였습니다.

1. 계산기에 특별한 숫자를 입력하기
2. 코드에서 플래그를 얻는 데 쓰이는 배열 찾기

JADX를 처음 써 봤습니다. 앱은 Java(Kotlin 디컴파일 결과)로 되어 있었습니다.

## 검증 함수 찾기

여기저기 눌러 보다가 \`com.ctf.calculator.core.stage.Stage1Validator\`에서 플래그와 관련된 코드를 찾았습니다.

\`\`\`java
private static final int EXPECTED_VALUE = 107;
private static final int[] SECRET_ARRAY = {99, 124, 119, 123, 242, EXPECTED_VALUE, 111, 197, ...};

public final ValidationResult validate(String input) {
    Integer inputValue = StringsKt.toIntOrNull(input);
    if (inputValue == null) return new ValidationResult.Failure("숫자를 입력하세요");
    if (inputValue.intValue() == SECRET_ARRAY[5]) return ValidationResult.Success.INSTANCE;
    return new ValidationResult.Failure("틀렸습니다");
}
\`\`\`

\`SECRET_ARRAY[5]\`, 즉 **107**을 넣으면 통과합니다. 남은 문제는 이 입력창이 어디서 열리느냐였습니다.

## 호출 관계를 거꾸로 따라가기

1. \`validate\`가 성공하면 \`showFlag()\`가 불립니다
2. \`showFlag\`는 잠금 해제 다이얼로그의 \`verifyCode()\`에서 불립니다
3. 그 다이얼로그를 띄우는 쪽을 따라가니 \`CalculatorViewModel\`이 나왔고

\`\`\`java
public final class CalculatorViewModel extends ViewModel {
    private static final String UNLOCK_CODE = "1337";
    ...
\`\`\`

계산기 화면에 **1337**을 입력하자 숨은 입력창이 열렸고, 여기에 **107**을 넣자 플래그가 나왔습니다.

## 그런데

사실 처음 열어 본 클래스에 이미 답이 있었습니다.

\`\`\`java
public static final String FLAG = "FLAG{...}";
\`\`\`

플래그가 상수로 하드코딩되어 있어서, 디컴파일만 하면 바로 읽힙니다.
앱 안에서 검증하는 값은 숨긴 것처럼 보여도 결국 사용자 손에 있는 코드라는 점을 직접 확인한 문제였습니다.`,
  },
]

async function main() {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI가 없습니다. .env.local을 확인하세요.')

  if (!process.env.ADMIN_GITHUB_IDS && !process.env.ADMIN_GITHUB_LOGIN) {
    console.warn('주의: ADMIN_GITHUB_IDS가 비어 있습니다. 지금 상태로는 아무도 로그인할 수 없습니다.')
  }

  await mongoose.connect(uri)
  console.log('연결됨:', mongoose.connection.name)

  {
    const gone =
      (await Project.deleteMany({ slug: { $in: LEGACY_PROJECT_SLUGS } })).deletedCount +
      (await Post.deleteMany({ slug: { $in: LEGACY_POST_SLUGS } })).deletedCount
    if (gone) console.log('이전 예시 콘텐츠 삭제', gone, '건')

    for (const p of projects) {
      await Project.findOneAndUpdate({ slug: p.slug }, { $set: p }, { upsert: true })
    }
    console.log('프로젝트', projects.length, '건')

    // pre('save')로 발행일·읽는 시간을 채우려면 save를 거쳐야 합니다.
    for (const p of posts) {
      const existing = await Post.findOne({ slug: p.slug })
      if (existing) existing.set(p)
      else await new Post(p).save().then(() => null)
      if (existing) await existing.save()
    }
    console.log('글', posts.length, '건')
  }

  await mongoose.disconnect()
  console.log('완료.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
