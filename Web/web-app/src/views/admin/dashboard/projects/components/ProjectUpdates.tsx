import Icon from '@/components/wrappers/Icon'
import { Badge, Card, CardBody, CardHeader } from 'react-bootstrap'
import { Link } from 'react-router'
import type { Transaction } from '../index'

const fmt = (n: number) => '₺' + n.toLocaleString('tr-TR')

const ProjectUpdates = ({ transactions }: { transactions: Transaction[] }) => {
  const recent = [...transactions]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8)

  return (
    <Card className="h-100">
      <CardHeader className="d-flex justify-content-between align-items-center">
        <h5 className="card-title mb-0">Son İşlemler</h5>
        <Link to="/finans" className="badge text-bg-light fs-xs fw-semibold p-1 text-decoration-none">
          Tümünü Gör
        </Link>
      </CardHeader>
      <CardBody className="pt-1">
        {recent.length === 0 ? (
          <div className="text-center py-4">
            <Icon icon="receipt-off" className="fs-2xl text-muted mb-2" />
            <p className="text-muted fs-sm mb-0">Henüz işlem kaydı yok</p>
            <Link to="/finans" className="text-primary fs-sm">İşlem ekle</Link>
          </div>
        ) : (
          <div className="timeline timeline-icon-bordered">
            {recent.map((tx, idx) => (
              <div key={tx.id} className="timeline-item d-flex align-items-stretch">
                <div className="timeline-dot">
                  <Icon
                    icon={tx.type === 0 ? 'trending-up' : 'trending-down'}
                    className={`fs-xl text-${tx.type === 0 ? 'success' : 'danger'}`}
                  />
                </div>
                <div className="timeline-content ps-3 w-100">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <p className="mb-0 fw-medium fs-sm">{tx.category || 'Genel'}</p>
                      {tx.description && <p className="text-muted fs-xs mb-0">{tx.description}</p>}
                      {tx.unitNumber && <p className="text-muted fs-xs mb-0">Daire {tx.unitNumber}</p>}
                    </div>
                    <span className={`fw-bold fs-sm ms-2 text-nowrap ${tx.type === 0 ? 'text-success' : 'text-danger'}`}>
                      {tx.type === 0 ? '+' : '−'}{fmt(tx.amount)}
                    </span>
                  </div>
                  <small className="text-muted fs-xxs">{tx.date}</small>
                  {idx < recent.length - 1 && <hr className="border-dashed" />}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  )
}

export default ProjectUpdates
