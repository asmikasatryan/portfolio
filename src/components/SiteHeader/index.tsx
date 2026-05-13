import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Drawer } from 'antd'
import { MenuOutlined } from '@ant-design/icons'
import {
  BRAND_LABEL,
  DEFAULT_ACTIVE_LINK_ID,
  HEADER_AVATAR_SRC,
  MOBILE_LINKS,
  NAV_LINKS,
} from './consts'
import styles from './styles.module.css'

export function SiteHeader() {
  const [open, setOpen] = useState(false)

  const close = () => {
    setOpen(false)
  }

  return (
    <header className={styles.bar}>
      <div className={styles.inner}>
        <a href="#hero" className={styles.brand} onClick={close}>
          {BRAND_LABEL}
        </a>
        <nav className={styles.desktopNav} aria-label="Primary">
          <ul className={styles.desktopList}>
            {NAV_LINKS.map((item) => {
              const isActive = item.id === DEFAULT_ACTIVE_LINK_ID
              return (
                <li key={item.id}>
                  <a
                    href={item.href}
                    className={`${styles.desktopLink} ${
                      isActive ? styles.desktopLinkActive : ''
                    }`}
                  >
                    {item.label}
                  </a>
                </li>
              )
            })}
          </ul>
        </nav>
        <div className={styles.rightCluster}>
          <Link className={styles.contactButton} to="/contact">
            Contact
          </Link>
          <img
            className={styles.headerAvatar}
            src={HEADER_AVATAR_SRC}
            alt=""
            width={64}
            height={64}
          />
          <button
            type="button"
            className={styles.menuButton}
            aria-label="Open menu"
            aria-expanded={open}
            aria-controls="site-nav-drawer"
            onClick={() => {
              setOpen(true)
            }}
          >
            <MenuOutlined />
          </button>
        </div>
      </div>
      <Drawer
        id="site-nav-drawer"
        title={BRAND_LABEL}
        placement="right"
        onClose={close}
        open={open}
        width={280}
      >
        <nav aria-label="Primary">
          <ul className={styles.drawerList}>
            {MOBILE_LINKS.map((item) => (
              <li key={item.id}>
                <a
                  className={styles.drawerLink}
                  href={item.href}
                  onClick={close}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </Drawer>
    </header>
  )
}
