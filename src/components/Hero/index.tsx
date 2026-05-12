import { ArrowRightOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import {
  AVAILABILITY_BADGE,
  HERO_TAGLINE,
  HERO_SIDE_IMAGE,
  HERO_TITLE,
  HERO_WORDMARK,
  PRIMARY_CTA,
  SECONDARY_CTA,
} from './consts'
import styles from './styles.module.css'


export function Hero() {
  return (
    <section id="hero" className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.ambientGlow} aria-hidden />
      <div className={styles.row}>
        <div className={styles.copy}>
          <p className={styles.badge}>{AVAILABILITY_BADGE}</p>
          <p className={styles.wordmark} aria-hidden>
            {HERO_WORDMARK}
          </p>
          <h1 id="hero-title" className={styles.title}>
            {HERO_TITLE}
          </h1>
          <p className={styles.tagline}>{HERO_TAGLINE}</p>
          <div className={styles.actions}>
            <a className={styles.primaryAction} href={PRIMARY_CTA.href}>
              {PRIMARY_CTA.label}
              <ArrowRightOutlined aria-hidden />
            </a>
            <Link className={styles.secondaryAction} to={SECONDARY_CTA.to}>
              {SECONDARY_CTA.label}
            </Link>
          </div>
        </div>
        <div className={styles.visualWrap} aria-hidden>
          <img className={styles.visual} src={HERO_SIDE_IMAGE} alt="" />
        </div>
      </div>
    </section>
  )
}
