import {
  EnvironmentOutlined,
  LinkOutlined,
  MailOutlined,
  ShareAltOutlined,
} from '@ant-design/icons'
import {
  ACTION_LINKS,
  CONTACT_ITEMS,
  FOOTER_LINKS,
  FOOTER_NOTE,
  SECTION_TEXT,
  SECTION_TITLE,
} from './consts'
import styles from './styles.module.css'

export function SiteFooter() {
  return (
    <footer id="contact" className={styles.footer} aria-labelledby="contact-title">
      <div className={styles.layout}>
        <div className={styles.copy}>
          <h2 id="contact-title" className={styles.title}>
            {SECTION_TITLE}
          </h2>
          <p className={styles.description}>{SECTION_TEXT}</p>
          <ul className={styles.details} aria-label="Contact details">
            {CONTACT_ITEMS.map((item) => (
              <li key={item.id} className={styles.detailItem}>
                <span className={styles.detailIcon} aria-hidden>
                  {item.id === 'mail' ? <MailOutlined /> : <EnvironmentOutlined />}
                </span>
                <span className={styles.detailValue}>{item.value}</span>
              </li>
            ))}
          </ul>
          <div className={styles.quickLinks}>
            {ACTION_LINKS.map((item) => (
              <a key={item.id} className={styles.quickLink} href={item.href} aria-label={item.label}>
                {item.id === 'website' ? <LinkOutlined aria-hidden /> : <ShareAltOutlined aria-hidden />}
              </a>
            ))}
          </div>
        </div>
        <form className={styles.formCard}>
          <label className={styles.fieldLabel} htmlFor="contact-name">
            Name
          </label>
          <input id="contact-name" className={styles.input} placeholder="Your full name" />
          <label className={styles.fieldLabel} htmlFor="contact-email">
            Email Address
          </label>
          <input
            id="contact-email"
            className={styles.input}
            placeholder="email@example.com"
            type="email"
          />
          <label className={styles.fieldLabel} htmlFor="contact-message">
            Message
          </label>
          <textarea
            id="contact-message"
            className={styles.textarea}
            placeholder="Tell me about your project..."
          />
          <button type="submit" className={styles.submitButton}>
            Send Message
          </button>
        </form>
      </div>
      <div className={styles.bottomBar}>
        <p className={styles.footerNote}>{FOOTER_NOTE}</p>
        <nav className={styles.footerLinks} aria-label="Footer links">
          {FOOTER_LINKS.map((item) => (
            <a key={item.id} className={styles.footerLink} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  )
}
