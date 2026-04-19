import { Empty, Typography } from 'antd'

const { Title, Paragraph } = Typography

export function ProjectsPage() {
  return (
    <>
      <Title level={2}>Projects</Title>
      <Paragraph type="secondary">
        Add case studies or repo links here. This section uses Ant Design{' '}
        <Typography.Text code>Empty</Typography.Text> as a placeholder.
      </Paragraph>
      <Empty description="No projects listed yet" />
    </>
  )
}
