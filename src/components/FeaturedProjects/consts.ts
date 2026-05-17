import type { FeaturedProject } from './types'

export const SECTION_TITLE = 'Selected Works'
export const SECTION_SUBTITLE =
  'A collection of projects, including a published Cordova mobile app on Google Play — driving digital healthcare transformation with Android Studio and AI.'
export const SECTION_FILTERS = ['React', 'TypeScript', 'Tailwind']

export const FEATURED_PROJECTS: FeaturedProject[] = [
  {
    id: 'p1',
    title: 'Portfolio – DevMed Studio',
    description:
      'Includes video generation demos, GitHub MSP setup, and Vercel deployment for live portfolio hosting.',
    tags: [
      'React/Vite',
      'Gemini API (axios)',
      'Video Generation',
      'GitHub + Vercel Deployment',
    ],
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
    title: 'Manage Weight',
    description:
      'A mobile application published on Google Play, designed to calculate BMI, track healthy weight ranges, and provide multilingual guidance for digital healthcare.',
    tags: ['Cordova', 'Android Studio', 'AdMob'],
    ctaLabel: 'Case Study',
    collageSrc: '/20260517_210122-COLLAGE.jpg',
  },
]
