import type { FeaturedProject } from './types'

export const SECTION_TITLE = 'Selected Works'
export const SECTION_SUBTITLE =
  'A curated gallery of projects focusing on motion, performance, and user-centric design.'
export const SECTION_FILTERS = ['React', 'TypeScript', 'Tailwind']

export const FEATURED_PROJECTS: FeaturedProject[] = [
  {
    id: 'p1',
    title: 'Lumina Dashboard',
    description:
      'High-performance analytics platform for SaaS teams, focusing on real-time data visualization.',
    tags: ['React', 'D3.js', 'GraphQL'],
    ctaLabel: 'Case Study',
  },
  {
    id: 'p2',
    title: 'Etheric Studio',
    description:
      'An immersive portfolio site for a creative studio using WebGL and advanced CSS animations.',
    tags: ['Three.js', 'GSAP', 'Next.js'],
    ctaLabel: 'Case Study',
  },
  {
    id: 'p3',
    title: 'Bloom Health',
    description:
      'A wellness application designed to simplify holistic habit tracking through micro-interactions.',
    tags: ['React Native', 'Firebase', 'Expo'],
    ctaLabel: 'Case Study',
  },
]
