export const SECTION_TITLE = 'Technical Arsenal'

export type SkillColumn = {
  id: string
  title: string
  icon: 'frontend' | 'backend' | 'tools'
  skills: string[]
}

export const SKILL_COLUMNS: SkillColumn[] = [
  {
    id: 'frontend',
    title: 'Frontend',
    icon: 'frontend',
    skills: ['JS / React.js', 'TypeScript', 'CSS/Flex ', 'HTML'],
  },
  {
    id: 'backend',
    title: 'Backend',
    icon: 'backend',
    skills: ['Node.js / Express', 'PostgreSQL', 'MongoDB'],
  },
  {
    id: 'tools',
    title: 'Tools',
    icon: 'tools',
    skills: ['Git / GitHub', 'Docker', 'Figma', 'Vercel'],
  },
]
