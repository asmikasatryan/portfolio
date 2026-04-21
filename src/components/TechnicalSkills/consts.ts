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
    skills: ['React / Next.js', 'TypeScript', 'Tailwind CSS', 'Framer Motion'],
  },
  {
    id: 'backend',
    title: 'Backend',
    icon: 'backend',
    skills: ['Node.js / Express', 'PostgreSQL / Supabase', 'REST & GraphQL', 'Firebase'],
  },
  {
    id: 'tools',
    title: 'Tools',
    icon: 'tools',
    skills: ['Git / GitHub', 'Docker', 'Figma', 'Vercel / AWS'],
  },
]
