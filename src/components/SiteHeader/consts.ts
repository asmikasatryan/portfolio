export const BRAND_LABEL = 'Atelier.Dev'

export const NAV_LINKS = [
  { id: 'projects', href: '#projects', label: 'Work' },
  { id: 'skills', href: '#skills', label: 'Skills' },
  { id: 'experience', href: '#experience', label: 'Timeline' },
  { id: 'about', href: '#about', label: 'About' },
  { id: 'gemini', href: '#gemini', label: 'Gemini' },
] as const

export const MOBILE_LINKS = [
  ...NAV_LINKS,
  { id: 'contact', href: '#contact', label: 'Contact' },
] as const

export const DEFAULT_ACTIVE_LINK_ID = 'projects'
