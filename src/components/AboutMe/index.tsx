import { ABOUT_TEXT, SECTION_TITLE } from './consts'
import styles from './styles.module.css'

export function AboutMe() {
  return (
    <section
      id="about"
      className={styles.section}
      aria-labelledby="about-heading"
    >
      <div className={styles.layout}>
        <div className={styles.portrait} role="img" aria-label="Portrait" />
        <div className={styles.copy}>
          <h2 id="about-heading" className={styles.heading}>
            {SECTION_TITLE}
          </h2>
          <p className={styles.body}>{ABOUT_TEXT}</p>
        </div>
      </div>
    </section>
  )
}
