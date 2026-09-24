import bgPattern from '@/assets/images/user-bg-pattern.svg'
import Icon from '@/components/wrappers/Icon'
import { useAuth } from '@/hooks/useAuth'
import { Dropdown, DropdownHeader, DropdownItem, DropdownMenu, DropdownToggle } from 'react-bootstrap'

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

const UserProfileSettings = () => {
  const { userInfo, fullName, logout } = useAuth()
  const name = fullName ?? userInfo?.email ?? 'Kullanıcı'
  const role = ROLE_LABELS[userInfo?.role ?? ''] ?? userInfo?.role ?? ''

  return (
    <div id="user-profile-settings" className="sidenav-user" style={{ background: `url(${bgPattern})` }}>
      <div className="d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center gap-2">
          <div
            className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0"
            style={{ width: 40, height: 40, background: 'var(--ct-primary)', fontSize: 14 }}
          >
            {initials(name)}
          </div>
          <div>
            <span className="sidenav-user-name fw-bold d-block" style={{ fontSize: 13 }}>{name}</span>
            <span className="fs-12 fw-semibold text-muted">{role}</span>
          </div>
        </div>
        <div>
          <Dropdown align="end">
            <DropdownToggle as="a" href="#" className="drop-arrow-none link-reset sidenav-user-set-icon" aria-haspopup="false" aria-expanded={false}>
              <Icon icon="settings" className="fs-24 align-middle ms-1" />
            </DropdownToggle>
            <DropdownMenu>
              <DropdownHeader className="noti-title">
                <h6 className="text-overflow m-0">Hoş geldiniz!</h6>
              </DropdownHeader>
              <DropdownItem href="/geri-bildirimler">
                <Icon icon="solar:chat-line-bold" className="me-1 fs-lg align-middle" />
                <span className="align-middle">Geri Bildirimler</span>
              </DropdownItem>
              <DropdownItem onClick={logout} className="text-danger fw-semibold" style={{ cursor: 'pointer' }}>
                <Icon icon="solar:logout-3-bold" className="me-1 fs-lg align-middle" />
                <span className="align-middle">Çıkış Yap</span>
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>
    </div>
  )
}

export default UserProfileSettings
