import Icon from '@/components/wrappers/Icon'
import { Card, CardBody, CardHeader, ListGroup, ListGroupItem } from 'react-bootstrap'
import { Link } from 'react-router'
import type { Notification } from '../index'

const NOTIF_ICONS = ['bell', 'credit-card', 'hammer', 'clipboard-list', 'tool']
const NOTIF_COLORS = ['secondary', 'warning', 'info', 'primary', 'danger']

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}d önce`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}sa önce`
  return `${Math.floor(hours / 24)}g önce`
}

const Discussions = ({ notifications }: { notifications: Notification[] }) => {
  const recent = [...notifications]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  return (
    <Card className="h-100">
      <CardHeader className="d-flex justify-content-between align-items-center">
        <h5 className="card-title mb-0">Son Bildirimler</h5>
        <Link to="/bildirimler" className="badge text-bg-light fs-xs fw-semibold p-1 text-decoration-none">
          Tümünü Gör
        </Link>
      </CardHeader>
      <CardBody className="pt-1">
        {recent.length === 0 ? (
          <div className="p-3 rounded bg-light-subtle border border-dashed text-center">
            <Icon icon="bell-off" className="fs-2xl text-muted mb-2" />
            <p className="mb-1 fw-medium">Bildirim yok</p>
            <p className="text-muted fs-sm mb-0">
              Sakinlere bildirim göndermek için{' '}
              <Link to="/bildirimler" className="text-primary">buraya tıklayın</Link>.
            </p>
          </div>
        ) : (
          <ListGroup variant="flush">
            {recent.map((notif) => {
              const color = NOTIF_COLORS[notif.type] ?? 'secondary'
              const icon = NOTIF_ICONS[notif.type] ?? 'bell'
              return (
                <ListGroupItem key={notif.id} className="px-0 border-light">
                  <div className="d-flex gap-3">
                    <div className="flex-shrink-0">
                      <div className="avatar-sm">
                        <span className={`avatar-title bg-${color}-subtle text-${color} rounded-circle fs-16`}>
                          <Icon icon={icon} />
                        </span>
                      </div>
                    </div>
                    <div className="flex-grow-1 min-w-0">
                      <div className="d-flex justify-content-between align-items-start">
                        <h6 className="text-body mb-1 fs-sm text-truncate">{notif.title}</h6>
                        <small className="text-muted fs-xxs text-nowrap ms-2">{timeAgo(notif.createdAt)}</small>
                      </div>
                      <p className="mb-0 text-muted fs-xs text-truncate">{notif.body}</p>
                    </div>
                  </div>
                </ListGroupItem>
              )
            })}
          </ListGroup>
        )}

        <div className="text-center mt-3">
          <Link to="/bildirimler" className="link-reset text-decoration-underline fw-semibold link-offset-3 fs-sm">
            Tüm Bildirimler <Icon icon="arrow-right" />
          </Link>
        </div>
      </CardBody>
    </Card>
  )
}

export default Discussions
