import { EXPERIENCE, SECTION_TITLE } from './consts'
import styles from './styles.module.css'

export function Experience() {
  return (
    <section
      id="experience"
      className={styles.section}
      aria-labelledby="experience-heading"
    >
      <h2 id="experience-heading" className={styles.heading}>
        {SECTION_TITLE}
      </h2>
      <div className={styles.list}>
        {EXPERIENCE.map((entry) => (
          <article key={entry.id} className={styles.block}>
            <h3 className={styles.role}>{entry.role}</h3>
            <p className={styles.meta}>
              {entry.company} · {entry.period}
            </p>
            <p className={styles.summary}>{entry.summary}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
