import EChart from '@/components/wrappers/EChart'
import Icon from '@/components/wrappers/Icon'
import { getColor } from '@/utils/helpers'
import { LineChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { useCallback, Suspense } from 'react'
import { Card, CardBody, Col, Row } from 'react-bootstrap'
import { Link } from 'react-router'
import type { Summary, Transaction } from '../index'

const MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']
const fmt = (n: number) => '₺' + n.toLocaleString('tr-TR')

const computeMonthly = (transactions: Transaction[]) => {
  const income = new Array(12).fill(0)
  const expense = new Array(12).fill(0)
  transactions.forEach((tx) => {
    const m = new Date(tx.date).getMonth()
    if (tx.type === 0) income[m] += tx.amount
    else expense[m] += tx.amount
  })
  return { income, expense }
}

const NAV_LINKS = [
  { icon: 'building', color: 'primary', label: 'Binalar', link: '/binalar' },
  { icon: 'home', color: 'info', label: 'Daireler', link: '/daireler' },
  { icon: 'users', color: 'secondary', label: 'Sakinler', link: '/sakinler' },
  { icon: 'credit-card', color: 'success', label: 'Aidat Yönetimi', link: '/aidatlar' },
  { icon: 'bell', color: 'warning', label: 'Bildirimler', link: '/bildirimler' },
]

const WelcomeRevenueProgress = ({ summary, transactions }: { summary: Summary | null; transactions: Transaction[] }) => {
  const getOptions = useCallback(() => {
    const { income, expense } = computeMonthly(transactions)
    return {
      textStyle: { fontFamily: getComputedStyle(document.body).fontFamily },
      tooltip: {
        trigger: 'axis',
        padding: [5, 10],
        backgroundColor: getColor('secondary-bg'),
        borderColor: getColor('border-color'),
        textStyle: { color: getColor('light-text-emphasis') },
        borderWidth: 1,
        transitionDuration: 0.125,
        axisPointer: { type: 'none' },
        formatter: (params: any[]) =>
          params.map((p) => `${p.marker}${p.seriesName}: ₺${Number(p.value).toLocaleString('tr-TR')}`).join('<br/>'),
      },
      xAxis: {
        type: 'category',
        data: MONTHS,
        boundaryGap: false,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: getColor('secondary-color'), margin: 12 },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#676b891f', type: 'dashed' } },
        axisLabel: {
          color: getColor('secondary-color'),
          margin: 12,
          formatter: (v: number) => '₺' + v.toLocaleString('tr-TR'),
        },
        axisTick: { show: false },
        axisLine: { show: false },
      },
      series: [
        {
          name: 'Gelir', type: 'line', smooth: true, symbolSize: 4, symbol: 'circle',
          itemStyle: { color: getColor('primary'), borderColor: getColor('primary'), borderWidth: 2 },
          areaStyle: { opacity: 0.15, color: getColor('primary') },
          lineStyle: { color: getColor('primary') },
          data: income,
        },
        {
          name: 'Gider', type: 'line', smooth: true, symbolSize: 4, symbol: 'circle',
          itemStyle: { color: getColor('danger'), borderColor: getColor('danger'), borderWidth: 2 },
          areaStyle: { opacity: 0.1, color: getColor('danger') },
          lineStyle: { color: getColor('danger') },
          data: expense,
        },
      ],
      grid: { right: 20, left: 5, bottom: 5, top: 8, containLabel: true },
    }
  }, [transactions])

  return (
    <Card>
      <CardBody className="p-0">
        <Row className="g-0">
          <Col xxl={3} xl={6} className="order-xl-1 order-xxl-0">
            <div className="p-4 border-end border-dashed h-100">
              <h4 className="fs-lg mb-1">MobilKasa</h4>
              <p className="text-muted fs-sm mb-4">Apartman ve sitenizi kolayca yönetin.</p>
              {NAV_LINKS.map((item) => (
                <Link
                  key={item.link}
                  to={item.link}
                  className="d-flex align-items-center gap-2 text-body mb-2 text-decoration-none p-1 rounded"
                >
                  <span className={`avatar-xs bg-${item.color}-subtle text-${item.color} rounded-circle d-flex align-items-center justify-content-center flex-shrink-0`}>
                    <Icon icon={item.icon} className="fs-xs" />
                  </span>
                  <span className="fs-sm">{item.label}</span>
                  <Icon icon="chevron-right" className="ms-auto text-muted fs-xs" />
                </Link>
              ))}
            </div>
          </Col>

          <Col xxl={9} className="order-xl-3 order-xxl-1">
            <div className="px-4 py-3">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="card-title mb-0">Aylık Gelir / Gider</h5>
                <Link to="/finans" className="link-reset text-decoration-underline fw-semibold link-offset-3 fs-sm">
                  Tüm Raporlar <Icon icon="arrow-right" />
                </Link>
              </div>
              <Row className="text-center mb-3 g-2">
                <Col>
                  <div className="bg-light bg-opacity-50 p-2 rounded">
                    <p className="text-muted fs-xs mb-1">Toplam Gelir</p>
                    <h6 className="text-success mb-0">{summary ? fmt(summary.totalIncome) : '—'}</h6>
                  </div>
                </Col>
                <Col>
                  <div className="bg-light bg-opacity-50 p-2 rounded">
                    <p className="text-muted fs-xs mb-1">Toplam Gider</p>
                    <h6 className="text-danger mb-0">{summary ? fmt(summary.totalExpense) : '—'}</h6>
                  </div>
                </Col>
                <Col>
                  <div className="bg-light bg-opacity-50 p-2 rounded">
                    <p className="text-muted fs-xs mb-1">Net Bakiye</p>
                    <h6 className={`mb-0 ${summary && summary.balance < 0 ? 'text-danger' : 'text-primary'}`}>
                      {summary ? fmt(summary.balance) : '—'}
                    </h6>
                  </div>
                </Col>
              </Row>
              <div dir="ltr">
                <Suspense>
                  <EChart
                    extensions={[LineChart, TooltipComponent, GridComponent, LegendComponent, CanvasRenderer]}
                    getOptions={getOptions}
                    style={{ height: 240 }}
                  />
                </Suspense>
              </div>
            </div>
          </Col>
        </Row>
      </CardBody>
    </Card>
  )
}

export default WelcomeRevenueProgress
