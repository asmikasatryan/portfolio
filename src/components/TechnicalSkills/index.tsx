import { SECTION_TITLE, SKILLS } from './consts'
import styles from './styles.module.css'

export function TechnicalSkills() {
  return (
    <section
      id="skills"
      className={styles.section}
      aria-labelledby="skills-heading"
    >
      <h2 id="skills-heading" className={styles.heading}>
        {SECTION_TITLE}
      </h2>
      <ul className={styles.list}>
        {SKILLS.map((skill) => (
          <li key={skill} className={styles.item}>
            {skill}
          </li>
        ))}
      </ul>
    </section>
  )
}
