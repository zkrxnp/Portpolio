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

const projects = [
  {
    title: '탐지 랩',
    slug: 'blue-team-lab',
    summary: '흩어진 로그를 하나의 타임라인으로 모아, 평소와 다른 움직임이 나타나면 바로 경보를 올리는 탐지 체계를 만들었습니다.',
    category: '탐지',
    visual: 'log',
    period: '2024',
    role: '탐지 룰 설계, 오탐 튜닝',
    stack: ['Suricata', 'Zeek', 'Elasticsearch', 'Python'],
    featured: true,
    order: 0,
    body: `## 배경

서버마다 로그 형식이 달라서, 같은 공격이 세 군데에 다른 모양으로 남고 있었습니다.
경보는 하루 400건씩 올라왔지만 실제로 사람이 본 건 10건 남짓이었습니다.

## 한 일

- 로그를 공통 스키마로 정규화하고 한 타임라인에 올림
- 평시 트래픽으로 기준선을 잡아 임계값을 자동 계산
- 경보를 묶어 사건 단위로 올리도록 변경

## 결과

하루 400건이던 경보가 12건으로 줄었고, 그중 사람이 조치한 비율이 70%를 넘었습니다.
숫자를 줄인 게 목표가 아니라, 올라온 경보를 전부 보게 만드는 게 목표였습니다.`,
  },
  {
    title: '제로 트러스트',
    slug: 'zero-trust',
    summary: '사내망 안에 있다는 이유로 통과시키던 접근을 모두 걷어내고, 요청마다 신원과 기기를 다시 확인하도록 네트워크를 다시 그렸습니다.',
    category: '설계',
    visual: 'trust',
    period: '2024',
    role: '경계 설계, 단계적 이행',
    stack: ['mTLS', 'OPA', 'Terraform'],
    order: 1,
    body: `## 배경

VPN에 붙으면 사내 자원 대부분에 닿을 수 있는 구조였습니다.
계정 하나만 털려도 측면 이동을 막을 방법이 없었습니다.

## 설계 원칙

1. 네트워크 위치는 신뢰 근거가 아니다
2. 모든 요청은 신원과 기기 상태를 함께 제시한다
3. 권한은 기본 거부, 필요한 것만 연다

## 이행

한 번에 바꾸면 업무가 멈추므로, 자원을 민감도순으로 나눠 분기마다 한 묶음씩 옮겼습니다.`,
  },
  {
    title: '패킷 노트',
    slug: 'packet-notes',
    summary: '남아 있는 패킷과 디스크 이미지에서 공격자가 지나간 순서를 복원하고, 법정에서도 읽히는 형태로 기록을 정리했습니다.',
    category: '포렌식',
    visual: 'hex',
    period: '2023',
    role: '증거 수집, 사건 재구성',
    stack: ['Volatility', 'Wireshark', 'Autopsy'],
    order: 2,
    body: `## 배경

침해 사실은 확인됐지만 최초 진입점을 아무도 설명하지 못하는 상태였습니다.

## 접근

패킷 캡처에서 경로 조작 시도(\`..%2f..%2fetc\`)를 찾아내고,
그 시각 전후의 디스크 타임스탬프와 맞춰 진입 경로를 좁혔습니다.

## 기록

모든 단계에 해시와 수집 시각을 남겨, 제3자가 같은 결론에 도달할 수 있게 썼습니다.`,
  },
]

const posts = [
  {
    title: '경보를 줄인다는 것은 무엇을 줄이는 일인가',
    slug: 'what-we-cut-when-we-cut-alerts',
    tags: ['탐지', '관제'],
    published: true,
    body: `## 400건과 12건

경보가 하루 400건이면 아무도 보지 않습니다. 12건이면 전부 봅니다.
그런데 388건을 지우는 방법에는 좋은 방법과 나쁜 방법이 있습니다.

나쁜 방법은 임계값을 올리는 것입니다. 숫자는 줄지만 놓치는 것도 같이 늘어납니다.

좋은 방법은 **묶는 것**입니다. 같은 사건에서 나온 40건의 경보는 40건이 아니라 1건입니다.

## 묶는 기준

- 같은 출발지에서 짧은 시간에 연속으로 나온 것
- 같은 자산을 향한 것
- 공격 단계상 앞뒤로 이어지는 것

이렇게 묶으면 숫자가 줄면서도 정보는 오히려 늘어납니다.
분석가가 보는 것이 "포트 스캔 1건"이 아니라 "이 호스트가 15분간 우리 대역을 훑었다"가 되니까요.`,
  },
  {
    title: '%2f 하나로 진입점을 찾은 이야기',
    slug: 'finding-entry-with-double-encoding',
    tags: ['포렌식', '웹'],
    published: true,
    body: `## 상황

침해는 확실한데 최초 진입이 어디인지 모르는 상태로 사흘이 지나 있었습니다.

## 찾은 것

패킷 캡처를 훑다가 이런 요청을 봤습니다.

\`\`\`
GET /admin/..%2f..%2fetc/passwd HTTP/1.1
\`\`\`

웹 서버 로그에는 이 요청이 없었습니다. 로그를 쓰는 단계 앞에서
리버스 프록시가 경로를 정규화해버려서, 정작 위험한 원본 경로는 디스크에 안 남은 겁니다.

## 교훈

**로그에 없다고 일어나지 않은 것은 아닙니다.**
프록시 뒤에서 무엇이 잘려나가는지 한 번은 직접 확인해봐야 합니다.`,
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
