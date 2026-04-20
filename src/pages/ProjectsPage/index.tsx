import { FeaturedProjects } from '../../components/FeaturedProjects'
import { PAGE_INTRO } from './consts'
import styles from './styles.module.css'

export function ProjectsPage() {
  return (
    <div className={styles.root}>
      <p className={styles.intro}>{PAGE_INTRO}</p>
      <FeaturedProjects />
    </div>
  )
}
