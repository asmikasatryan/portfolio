import { Outlet } from 'react-router-dom'
import { SiteHeader } from '../SiteHeader'
import styles from './styles.module.css'

export function AppLayout() {
  return (
    <div className={styles.layout}>
      <SiteHeader />
      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  )
}
