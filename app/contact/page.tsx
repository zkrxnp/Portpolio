import type { Metadata } from 'next'
import ContactForm from '@/components/site/ContactForm'

export const metadata: Metadata = {
  title: '문의',
}

export default function ContactPage() {
  return (
    <section className="wrap page">
      <header className="page-head">
        <h1>연락</h1>
      </header>

      <div className="contact-grid">
        <div>
          <a className="contact-mail" href="mailto:cookcoo150@naver.com">cookcoo150@naver.com</a>
          <dl className="about-facts">
            <div><dt>GitHub</dt><dd><a className="link" href="https://github.com/zkrxnp" target="_blank" rel="noopener noreferrer">github.com/zkrxnp ↗</a></dd></div>
            <div><dt>블로그</dt><dd><a className="link" href="https://hjstu.tistory.com/" target="_blank" rel="noopener noreferrer">hjstu.tistory.com ↗</a></dd></div>
            <div><dt>소속</dt><dd>중부대학교 정보보호학전공</dd></div>
          </dl>
        </div>
        <ContactForm />
      </div>
    </section>
  )
}
