import type { Metadata } from 'next'
import ContactForm from '@/components/site/ContactForm'

export const metadata: Metadata = {
  title: '문의',
  description: '보안 점검, 사고 대응, 교육 문의를 받습니다.',
}

export default function ContactPage() {
  return (
    <section className="wrap" style={{ paddingTop: 72, paddingBottom: 100 }}>
      <div className="section-head">
        <h2>문의</h2>
        <p className="note">보통 영업일 기준 2일 안에 답장합니다</p>
      </div>

      <div className="contact-grid">
        <div>
          <h3 className="contact-lead">지켜야 할 시스템이 있나요?</h3>
          <p className="contact-note">
            점검이든 사고 대응이든, 상황을 먼저 들어보고 필요한 범위를 같이 정하겠습니다.
            이미 사고가 진행 중이라면 메일 제목에 <strong>긴급</strong>을 넣어주세요.
          </p>
          <dl className="caps">
            <div><dt>메일</dt><dd><a href="mailto:hello@jiwoo.security">hello@jiwoo.security</a></dd></div>
            <div><dt>위치</dt><dd>서울</dd></div>
          </dl>
        </div>
        <ContactForm />
      </div>
    </section>
  )
}
