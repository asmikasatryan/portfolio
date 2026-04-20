import { message } from 'antd'
import type { FormInstance } from 'antd'
import { SUCCESS_MESSAGE } from './consts'
import type { ContactFormValues } from './types'

export function submitContactForm(
  form: FormInstance<ContactFormValues>,
  values: ContactFormValues,
): void {
  console.info('Contact form (wire up to your API):', values)
  message.success(SUCCESS_MESSAGE)
  form.resetFields()
}
