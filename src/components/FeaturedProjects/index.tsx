import { FEATURED_PROJECTS, SECTION_TITLE } from './consts'
import styles from './styles.module.css'

const THUMB_TONES = [styles.tone1, styles.tone2, styles.tone3] as const

export function FeaturedProjects() {
  return (
    <section
      id="projects"
      className={styles.section}
      aria-labelledby="featured-projects-heading"
    >
      <h2 id="featured-projects-heading" className={styles.heading}>
        {SECTION_TITLE}
      </h2>
      <div className={styles.list}>
        {FEATURED_PROJECTS.map((project, index) => {
          const toneClass = THUMB_TONES[index % THUMB_TONES.length]
          return (
            <article
              key={project.id}
              className={styles.card}
              aria-label={`${project.title}, ${project.category}`}
            >
              <div
                className={`${styles.thumb} ${toneClass}`}
                role="img"
                aria-hidden
              />
              <div className={styles.meta}>
                <h3 className={styles.title}>{project.title}</h3>
                <p className={styles.category}>{project.category}</p>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
