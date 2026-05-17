import { ArrowRightOutlined } from '@ant-design/icons'
import {
  FEATURED_PROJECTS,
  SECTION_FILTERS,
  SECTION_SUBTITLE,
  SECTION_TITLE,
} from './consts'
import styles from './styles.module.css'

const THUMB_TONES = [styles.tone1, styles.tone2, styles.tone3] as const

export function FeaturedProjects() {
  return (
    <section
      id="projects"
      className={styles.section}
      aria-labelledby="featured-projects-heading"
    >
      <header className={styles.header}>
        <div className={styles.headingWrap}>
          <h2 id="featured-projects-heading" className={styles.heading}>
            {SECTION_TITLE}
          </h2>
          <p className={styles.subtitle}>{SECTION_SUBTITLE}</p>
        </div>
        <ul className={styles.filters} aria-label="Project technologies">
          {SECTION_FILTERS.map((filter) => (
            <li key={filter} className={styles.filterPill}>
              {filter}
            </li>
          ))}
        </ul>
      </header>
      <div className={styles.list}>
        {FEATURED_PROJECTS.map((project, index) => {
          const toneClass = THUMB_TONES[index % THUMB_TONES.length]
          return (
            <article
              key={project.id}
              className={`${styles.card} ${project.collageSrc ? styles.cardWithCollage : ''}`}
              aria-label={project.title}
            >
              {project.collageSrc ? (
                <div className={styles.thumbImageFrame}>
                  <img
                    className={styles.thumbImage}
                    src={project.collageSrc}
                    alt={`${project.title} preview`}
                  />
                </div>
              ) : (
                <div
                  className={`${styles.thumb} ${toneClass}`}
                  role="img"
                  aria-hidden
                />
              )}
              <div className={styles.meta}>
                  <h3 className={styles.title}>{project.title}</h3>
                  <p className={styles.description}>{project.description}</p>
                  <ul className={styles.tags} aria-label={`${project.title} technologies`}>
                    {project.tags.map((tag) => (
                      <li key={tag} className={styles.tag}>
                        {tag}
                      </li>
                    ))}
                  </ul>
                  <a className={styles.link} href="#contact">
                    {project.ctaLabel}
                    <ArrowRightOutlined className={styles.linkIcon} aria-hidden />
                  </a>
                </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
