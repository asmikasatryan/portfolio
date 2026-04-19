import { Link } from 'react-router-dom'
import { Button, Card, Space, Typography } from 'antd'
import { RocketOutlined } from '@ant-design/icons'

const { Title, Paragraph } = Typography

export function HomePage() {
  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Title level={2}>Hi, I&apos;m a frontend developer</Title>
        <Paragraph>
          This is a starter for your portfolio. Replace this copy in{' '}
          <Typography.Text code>src/pages/HomePage.tsx</Typography.Text> and
          update the header brand in{' '}
          <Typography.Text code>src/components/AppLayout.tsx</Typography.Text>.
        </Paragraph>
      </div>
      <Card title="Stack" size="small">
        <Paragraph style={{ marginBottom: 0 }}>
          React · TypeScript · Vite · pnpm · Ant Design
        </Paragraph>
      </Card>
      <Link to="/projects">
        <Button type="primary" icon={<RocketOutlined />}>
          View projects
        </Button>
      </Link>
    </Space>
  )
}
