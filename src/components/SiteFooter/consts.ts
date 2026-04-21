import type { ActionLink, ContactItem } from './types'

export const SECTION_TITLE = 'Start a Project'
export const SECTION_TEXT =
  "Have a vision you'd like to bring to life? Let's collaborate and build something exceptional together."

export const CONTACT_ITEMS: ContactItem[] = [
  { id: 'mail', label: 'Email', value: 'hello@atelier.dev' },
  { id: 'location', label: 'Location', value: 'Berlin, Germany' },
]

export const ACTION_LINKS: ActionLink[] = [
  { id: 'website', label: 'Website', href: '#' },
  { id: 'share', label: 'Share profile', href: '#' },
]

export const FOOTER_NOTE = '© 2024 Digital Atelier. Crafted with intentional asymmetry.'

export const FOOTER_LINKS: ActionLink[] = [
  { id: 'github', label: 'GitHub', href: 'https://github.com/' },
  { id: 'linkedin', label: 'LinkedIn', href: 'https://www.linkedin.com/' },
  { id: 'layers', label: 'Layers', href: '#' },
]
