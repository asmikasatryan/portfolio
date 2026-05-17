export type FeaturedProject = {
  id: string
  title: string
  description: string
  tags: string[]
  ctaLabel: string
  /** Optional image shown directly above this project card */
  collageSrc?: string
}
