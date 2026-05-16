export const SECTION_TITLE = 'About the Maker'

export const ABOUT_PARAGRAPHS = [
  `I am a highly motivated Junior Frontend Developer with a solid foundation in HTML, CSS, and JavaScript, specializing in creating responsive and user-centric web applications. Combining my professional background as a Physician with my passion for technology, I aim to develop innovative digital solutions and applications that support the healthcare industry.`,
  `Beyond web development, I have basic experience with React and Node.js, and a working knowledge of Python. I am also keen on exploring the field of Medical Data. My ability to manage projects from conception to completion is demonstrated by my mobile app 'Manage Weight,' developed with Cordova and successfully published on Google Play. I am ready to bring my unique perspective and technical skills to a dynamic team where I can contribute and grow professionally.`,
]

export const ABOUT_STATS = [
  { value: '120+', label: 'Projects Shipped' },
  { value: '50+', label: 'Happy Clients' },
] as const

/** Paragraphs for Azure Speech SSML (pauses between blocks). */
export function getAboutSpeechParagraphs(): readonly string[] {
  return ABOUT_PARAGRAPHS
}

/** Plain text for browser speech synthesis. */
export function getAboutSpeechScript(): string {
  return ABOUT_PARAGRAPHS.join(' ')
}
