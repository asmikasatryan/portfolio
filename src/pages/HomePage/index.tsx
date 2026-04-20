import { AboutMe } from '../../components/AboutMe'
import { Experience } from '../../components/Experience'
import { FeaturedProjects } from '../../components/FeaturedProjects'
import { Hero } from '../../components/Hero'
import { SiteFooter } from '../../components/SiteFooter'
import { TechnicalSkills } from '../../components/TechnicalSkills'
import styles from './styles.module.css'

export function HomePage() {
  return (
    <div className={styles.root}>
      <Hero />
      <FeaturedProjects />
      <TechnicalSkills />
      <Experience />
      <AboutMe />
      <SiteFooter />
    </div>
  )
}
