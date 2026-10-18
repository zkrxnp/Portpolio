import type { Metadata } from 'next'
import ContactForm from '@/components/site/ContactForm'

export const metadata: Metadata = {
  title: '문의',
}

export default function ContactPage() {
  return (
    <section className="wrap" style={{ paddingTop: 72, paddingBottom: 100 }}>
      <div className="section-head">
        <h2>문의</h2>
      </div>

      <div className="contact-grid">
        <div>
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
