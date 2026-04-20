import { CTA_HEADING, SOCIAL_LINKS } from './consts'
import styles from './styles.module.css'

export function SiteFooter() {
  const year = new Date().getFullYear()

  return (
    <footer id="contact" className={styles.footer} aria-labelledby="contact-cta">
      <div className={styles.ctaBand}>
        <h2 id="contact-cta" className={styles.ctaTitle}>
          {CTA_HEADING}
        </h2>
        <nav className={styles.links} aria-label="Social and contact links">
          {SOCIAL_LINKS.map((item) => (
            <a
              key={item.id}
              className={styles.link}
              href={item.href}
              target="_blank"
              rel="noreferrer noopener"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
      <p className={styles.copyright}>
        © {year} Hasmik Asatryan. All rights reserved.
      </p>
    </footer>
  )
}
