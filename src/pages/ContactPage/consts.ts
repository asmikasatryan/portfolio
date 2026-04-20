import type { Rule } from 'antd/es/form'

export const PAGE_TITLE = 'Contact'

export const INTRO_TEXT =
  'Replace this with your preferred channel (email, social, or a serverless form handler).'

export const SUCCESS_MESSAGE =
  'Thanks — hook this form to email or a backend.'

export const SEND_BUTTON_LABEL = 'Send'

export const FIELD_LABELS = {
  name: 'Name',
  email: 'Email',
  message: 'Message',
} as const

export const TEXTAREA_ROWS = 4

export const FIELD_RULES: {
  name: Rule[]
  email: Rule[]
  message: Rule[]
} = {
  name: [{ required: true }],
  email: [{ required: true, type: 'email' }],
  message: [{ required: true }],
}
