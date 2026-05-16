export const BRAND_LABEL = 'Atelier.Dev'

export const NAV_LINKS = [
  { id: 'projects', href: '#projects', label: 'Work' },
  { id: 'skills', href: '#skills', label: 'Skills' },
  { id: 'experience', href: '#experience', label: 'Timeline' },
  { id: 'about', href: '#about', label: 'About' },
  { id: 'gemini', href: '#gemini', label: 'Gemini' },
  { id: 'video', href: '#video', label: 'Video' },
  { id: 'video-storage', href: '#video-storage', label: 'Storage' },
] as const

export const MOBILE_LINKS = [
  ...NAV_LINKS,
  { id: 'contact', href: '#contact', label: 'Contact' },
] as const

export const DEFAULT_ACTIVE_LINK_ID = 'projects'

/** Public portrait shown in the header (same asset as About Me). */
export const HEADER_AVATAR_SRC =
  '/1149de5674f43bdd39aae15d3c8370ed36dfd05e37cd8975c60bd0a3c63e903f.png'
