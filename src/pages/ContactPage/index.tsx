import { Button, Form, Input, Typography } from 'antd'
import {
  FIELD_LABELS,
  FIELD_RULES,
  INTRO_TEXT,
  PAGE_TITLE,
  SEND_BUTTON_LABEL,
  TEXTAREA_ROWS,
} from './consts'
import styles from './styles.module.css'
import type { ContactFormValues } from './types'
import { submitContactForm } from './utils'

const { Title, Paragraph } = Typography

export function ContactPage() {
  const [form] = Form.useForm<ContactFormValues>()

  const onFinish = (values: ContactFormValues) => {
    submitContactForm(form, values)
  }

  return (
    <>
      <Title level={2}>{PAGE_TITLE}</Title>
      <Paragraph type="secondary">{INTRO_TEXT}</Paragraph>
      <Form<ContactFormValues>
        form={form}
        layout="vertical"
        onFinish={onFinish}
        className={styles.form}
      >
        <Form.Item name="name" label={FIELD_LABELS.name} rules={FIELD_RULES.name}>
          <Input autoComplete="name" />
        </Form.Item>
        <Form.Item
          name="email"
          label={FIELD_LABELS.email}
          rules={FIELD_RULES.email}
        >
          <Input type="email" autoComplete="email" />
        </Form.Item>
        <Form.Item
          name="message"
          label={FIELD_LABELS.message}
          rules={FIELD_RULES.message}
        >
          <Input.TextArea rows={TEXTAREA_ROWS} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            {SEND_BUTTON_LABEL}
          </Button>
        </Form.Item>
      </Form>
    </>
  )
}
