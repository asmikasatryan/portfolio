export const BRAND_LABEL = 'Portfolio – DevMed Studio'

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

/** Portrait in header, About Me, and D-ID (public imgbb URL — light-green background). */
export const HEADER_AVATAR_SRC =
  'https://i.ibb.co/HJTCXGM/c3ffc6e0ef7a7762d8d436a2a06040d122afba4de671cbf77c1dad1b47e7eb3f.jpg'
