import { Button, Form, Input, Typography, message } from 'antd'

const { Title, Paragraph } = Typography

type ContactForm = {
  name: string
  email: string
  message: string
}

export function ContactPage() {
  const [form] = Form.useForm<ContactForm>()

  const onFinish = (values: ContactForm) => {
    console.info('Contact form (wire up to your API):', values)
    message.success('Thanks — hook this form to email or a backend.')
    form.resetFields()
  }

  return (
    <>
      <Title level={2}>Contact</Title>
      <Paragraph type="secondary">
        Replace this with your preferred channel (email, social, or a serverless
        form handler).
      </Paragraph>
      <Form<ContactForm>
        form={form}
        layout="vertical"
        onFinish={onFinish}
        style={{ maxWidth: 480 }}
      >
        <Form.Item name="name" label="Name" rules={[{ required: true }]}>
          <Input autoComplete="name" />
        </Form.Item>
        <Form.Item
          name="email"
          label="Email"
          rules={[{ required: true, type: 'email' }]}
        >
          <Input type="email" autoComplete="email" />
        </Form.Item>
        <Form.Item name="message" label="Message" rules={[{ required: true }]}>
          <Input.TextArea rows={4} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            Send
          </Button>
        </Form.Item>
      </Form>
    </>
  )
}
