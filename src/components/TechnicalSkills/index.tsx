import {
  AppstoreOutlined,
  CodeOutlined,
  DatabaseOutlined,
} from '@ant-design/icons'
import { SECTION_TITLE, SKILL_COLUMNS, type SkillColumn } from './consts'
import styles from './styles.module.css'

function getIcon(icon: SkillColumn['icon']) {
  if (icon === 'backend') return <DatabaseOutlined aria-hidden />
  if (icon === 'tools') return <CodeOutlined aria-hidden />
  return <AppstoreOutlined aria-hidden />
}

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
      <ul className={styles.columns}>
        {SKILL_COLUMNS.map((column) => (
          <li key={column.id} className={styles.card}>
            <span className={styles.iconBadge}>{getIcon(column.icon)}</span>
            <h3 className={styles.cardTitle}>{column.title}</h3>
            <ul className={styles.list}>
              {column.skills.map((skill) => (
                <li key={skill} className={styles.item}>
                  {skill}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  )
}
