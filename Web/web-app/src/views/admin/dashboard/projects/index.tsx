import PageBreadcrumb from '@/components/PageBreadcrumb'
import BuildingSelect from '@/components/BuildingSelect'
import api from '@/lib/api'
import { useBuilding } from '@/context/BuildingContext'
import { useEffect, useState } from 'react'
import { Col, Row, Spinner } from 'react-bootstrap'
import StatCards from './components/StatCards'
import WelcomeRevenueProgress from './components/WelcomeRevenueProgress'
import QuarterlyReports from './components/QuarterlyReports'
import ProjectUpdates from './components/ProjectUpdates'
import Discussions from './components/Discussions'
import ProjectPerformance from './components/ProjectPerformance'

export type Transaction = {
  id: string; type: number; amount: number; category: string
  description: string; date: string; createdAt: string
  unitNumber?: string; residentName?: string
}
export type Notification = {
  id: string; title: string; body: string; type: number; isRead: boolean; createdAt: string
}
export type Summary = { totalIncome: number; totalExpense: number; balance: number }

export interface DashboardData {
  buildingCount: number
  unitCount: number
  residentCount: number
  summary: Summary | null
  transactions: Transaction[]
  notifications: Notification[]
  activeTenderCount: number
}

const emptyData: DashboardData = {
  buildingCount: 0, unitCount: 0, residentCount: 0,
  summary: null, transactions: [], notifications: [], activeTenderCount: 0,
}

const Page = () => {
  const { selectedBuilding, buildings } = useBuilding()
  const [data, setData] = useState<DashboardData>(emptyData)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setData((d) => ({ ...d, buildingCount: buildings.length }))
  }, [buildings.length])

  useEffect(() => {
    if (!selectedBuilding) {
      setData((d) => ({ ...d, unitCount: 0, residentCount: 0, summary: null, transactions: [], notifications: [], activeTenderCount: 0 }))
      return
    }
    setLoading(true)
    const bid = selectedBuilding.id
    Promise.allSettled([
      api.get<any[]>(`/buildings/${bid}/units`),
      api.get<Summary>(`/buildings/${bid}/financial/summary`),
      api.get<Transaction[]>(`/buildings/${bid}/financial`),
      api.get<Notification[]>(`/buildings/${bid}/notifications`),
      api.get<{ id: string; status: number }[]>(`/buildings/${bid}/tenders`),
      api.get<any[]>(`/buildings/${bid}/residents`),
    ])
      .then(([units, summary, txs, notifs, tenders, residents]) => {
        setData((d) => ({
          ...d,
          unitCount: units.status === 'fulfilled' ? units.value.data.length : 0,
          residentCount: residents.status === 'fulfilled' ? residents.value.data.length : 0,
          summary: summary.status === 'fulfilled' ? summary.value.data : null,
          transactions: txs.status === 'fulfilled' ? txs.value.data : [],
          notifications: notifs.status === 'fulfilled' ? notifs.value.data : [],
          activeTenderCount: tenders.status === 'fulfilled' ? tenders.value.data.filter((t) => t.status === 0).length : 0,
        }))
      })
      .finally(() => setLoading(false))
  }, [selectedBuilding?.id])

  return (
    <>
      <PageBreadcrumb title="Panel" subTitle="MobilKasa" />

      <Row className="align-items-center mb-3 mt-2">
        <Col xs="auto">
          <BuildingSelect />
        </Col>
        {loading && (
          <Col xs="auto" className="ms-2">
            <Spinner animation="border" size="sm" variant="primary" />
          </Col>
        )}
      </Row>

      <StatCards data={data} />

      <Row className="mt-3">
        <Col xs={12}>
          <WelcomeRevenueProgress summary={data.summary} transactions={data.transactions} />
        </Col>
      </Row>

      <Row className="mt-3">
        <Col xxl={4}>
          <QuarterlyReports transactions={data.transactions} />
          <ProjectPerformance transactions={data.transactions} />
        </Col>
        <Col xxl={4} xl={6}>
          <ProjectUpdates transactions={data.transactions} />
        </Col>
        <Col xxl={4} xl={6}>
          <Discussions notifications={data.notifications} />
        </Col>
      </Row>
    </>
  )
}

export default Page
