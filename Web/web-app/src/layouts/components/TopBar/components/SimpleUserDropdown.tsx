import Icon from '@/components/wrappers/Icon'
import { useAuth } from '@/hooks/useAuth'
import { Dropdown, DropdownDivider, DropdownHeader, DropdownItem, DropdownMenu, DropdownToggle } from 'react-bootstrap'

const ROLE_LABELS: Record<string, string> = {
  admin: 'Sistem Yöneticisi',
  yonetici: 'Yönetici',
  sakin: 'Sakin',
}

const initials = (name?: string | null) =>
  (name ?? 'K')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

const UserDropdown = () => {
  const { userInfo, fullName, logout } = useAuth()
  const name = fullName ?? userInfo?.email ?? 'Kullanıcı'
  const role = ROLE_LABELS[userInfo?.role ?? ''] ?? userInfo?.role ?? ''

  return (
    <div id="simple-user-dropdown" className="topbar-item nav-user">
      <Dropdown>
        <DropdownToggle className="topbar-link drop-arrow-none" type="button">
          <div
            className="rounded-circle me-lg-2 d-flex align-items-center justify-content-center fw-bold text-white"
            style={{ width: 32, height: 32, background: 'var(--ct-primary)', fontSize: 13, flexShrink: 0 }}
          >
            {initials(name)}
          </div>
          <div className="d-lg-flex align-items-center gap-1 d-none">
            <h5 className="my-0">{name}</h5>
            <Icon icon="chevron-down" className="align-middle" />
          </div>
        </DropdownToggle>
        <DropdownMenu className="dropdown-menu-end">
          <DropdownHeader className="noti-title">
            <h6 className="text-overflow m-0">Hoş geldiniz!</h6>
            {role && <small className="text-muted">{role}</small>}
          </DropdownHeader>

          <DropdownItem href="/geri-bildirimler">
            <Icon icon="solar:chat-line-bold" className="me-1 fs-lg align-middle" />
            <span className="align-middle">Geri Bildirimler</span>
          </DropdownItem>

          <DropdownDivider />

          <DropdownItem onClick={logout} className="text-danger fw-semibold" style={{ cursor: 'pointer' }}>
            <Icon icon="solar:logout-3-bold" className="me-1 fs-lg align-middle" />
            <span className="align-middle">Çıkış Yap</span>
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    </div>
  )
}

export default UserDropdown
