import { ABOUT_PARAGRAPHS, ABOUT_STATS, SECTION_TITLE } from './consts'
import styles from './styles.module.css'

export function AboutMe() {
  return (
    <section
      id="about"
      className={styles.section}
      aria-labelledby="about-heading"
    >
      <div className={styles.layout}>
        <div className={styles.portraitFrame}>
          <div
            className={styles.portrait}
            role="img"
            aria-label="Portrait of the maker"
          />
        </div>
        <div className={styles.copy}>
          <h2 id="about-heading" className={styles.heading}>
            {SECTION_TITLE}
          </h2>
          {ABOUT_PARAGRAPHS.map((paragraph) => (
            <p key={paragraph} className={styles.body}>
              {paragraph}
            </p>
          ))}
          <ul className={styles.stats} aria-label="Maker achievements">
            {ABOUT_STATS.map((stat) => (
              <li key={stat.label} className={styles.statItem}>
                <p className={styles.statValue}>{stat.value}</p>
                <p className={styles.statLabel}>{stat.label}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
