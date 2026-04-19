import { Link, Outlet, useLocation } from 'react-router-dom'
import { Layout, Menu, Typography, theme } from 'antd'
import { CodeOutlined } from '@ant-design/icons'

const { Header, Content, Footer } = Layout

const menuItems = [
  { key: '/', label: <Link to="/">Home</Link> },
  { key: '/projects', label: <Link to="/projects">Projects</Link> },
  { key: '/contact', label: <Link to="/contact">Contact</Link> },
]

export function AppLayout() {
  const location = useLocation()
  const {
    token: { colorBgContainer },
  } = theme.useToken()

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          background: colorBgContainer,
          paddingInline: 24,
        }}
      >
        <Typography.Title level={4} style={{ margin: 0, flexShrink: 0 }}>
          <CodeOutlined /> Your Name
        </Typography.Title>
        <Menu
          mode="horizontal"
          selectedKeys={[location.pathname]}
          items={menuItems}
          style={{ flex: 1, minWidth: 0, borderBottom: 'none' }}
        />
      </Header>
      <Content style={{ padding: '24px 48px', maxWidth: 960, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        <Outlet />
      </Content>
      <Footer style={{ textAlign: 'center' }}>
        Portfolio © {new Date().getFullYear()}
      </Footer>
    </Layout>
  )
}
