import { PERSON_NAME, HERO_TAGLINE, ROLE_HEADLINE } from './consts'
import styles from './styles.module.css'

export function Hero() {
  return (
    <section id="hero" className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.row}>
        <div className={styles.copy}>
          <h1 id="hero-title" className={styles.role}>
            {ROLE_HEADLINE}
          </h1>
          <p className={styles.name}>{PERSON_NAME}</p>
          <p className={styles.tagline}>{HERO_TAGLINE}</p>
        </div>
        <div className={styles.visual} role="presentation" aria-hidden />
      </div>
    </section>
  )
}
