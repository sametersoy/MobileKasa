import Icon from '@/components/wrappers/Icon'
import { Card, CardBody, Col, Row } from 'react-bootstrap'
import { Link } from 'react-router'
import type { DashboardData } from '../index'

const fmt = (n: number) => '₺' + n.toLocaleString('tr-TR')

const StatCards = ({ data }: { data: DashboardData }) => {
  const cards = [
    {
      title: 'Toplam Bina',
      value: data.buildingCount,
      icon: 'building',
      color: 'primary',
      description: 'Kayıtlı bina',
      link: '/binalar',
    },
    {
      title: 'Toplam Daire',
      value: data.unitCount,
      icon: 'home',
      color: 'info',
      description: 'Seçili binada',
      link: '/daireler',
    },
    {
      title: 'Kayıtlı Sakin',
      value: data.residentCount,
      icon: 'users',
      color: 'secondary',
      description: 'Aktif sakin',
      link: '/sakinler',
    },
    {
      title: 'Toplam Gelir',
      value: data.summary ? fmt(data.summary.totalIncome) : '—',
      icon: 'trending-up',
      color: 'success',
      description: 'Tüm zamanlar',
      link: '/finans',
    },
    {
      title: 'Net Bakiye',
      value: data.summary ? fmt(data.summary.balance) : '—',
      icon: 'wallet',
      color: data.summary && data.summary.balance < 0 ? 'danger' : 'primary',
      description: 'Gelir − Gider',
      link: '/finans',
    },
  ]

  return (
    <Row className="row-cols-xxl-5 row-cols-md-3 row-cols-1 g-3">
      {cards.map((card, i) => (
        <Col key={i}>
          <Card className="h-100">
            <CardBody>
              <div className="d-flex align-items-center justify-content-between mb-3">
                <p className="text-muted fs-sm mb-0">{card.title}</p>
                <span className={`avatar-sm bg-${card.color}-subtle text-${card.color} rounded-circle d-flex align-items-center justify-content-center`}>
                  <Icon icon={card.icon} className="fs-lg" />
                </span>
              </div>
              <h3 className="mb-1">{card.value}</h3>
              <p className="text-muted fs-xs mb-0">
                <Link to={card.link} className="text-muted text-decoration-none">
                  {card.description} <Icon icon="arrow-right" className="fs-xxs" />
                </Link>
              </p>
            </CardBody>
          </Card>
        </Col>
      ))}
    </Row>
  )
}

export default StatCards
