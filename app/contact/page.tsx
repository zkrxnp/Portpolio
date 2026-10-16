import type { Metadata } from 'next'
import ContactForm from '@/components/site/ContactForm'

export const metadata: Metadata = {
  title: '문의',
  description: '프로젝트·스터디·채용 관련 연락을 받습니다.',
}

export default function ContactPage() {
  return (
    <section className="wrap" style={{ paddingTop: 72, paddingBottom: 100 }}>
      <div className="section-head">
        <h2>문의</h2>
        <p className="note">보내주신 메일로 답장드립니다</p>
      </div>

      <div className="contact-grid">
        <div>
          <h3 className="contact-lead">같이 파볼 문제가 있나요?</h3>
          <p className="contact-note">
            함께할 프로젝트나 스터디, 세미나, 채용 관련 이야기라면 무엇이든 편하게 보내주세요.
          </p>
          <dl className="caps">
            <div><dt>메일</dt><dd><a href="mailto:cookcoo150@naver.com">cookcoo150@naver.com</a></dd></div>
            <div><dt>소속</dt><dd>중부대학교 정보보호학전공</dd></div>
          </dl>
        </div>
        <ContactForm />
      </div>
    </section>
  )
}
