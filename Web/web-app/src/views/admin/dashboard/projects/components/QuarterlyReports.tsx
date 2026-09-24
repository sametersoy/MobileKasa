import ComponentCard from '@/components/cards/ComponentCard'
import { Badge, Table } from 'react-bootstrap'
import type { Transaction } from '../index'

const MONTH_NAMES = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']
const fmt = (n: number) => '₺' + n.toLocaleString('tr-TR')

const getLast6Months = () => {
  const result = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    result.push({ year: d.getFullYear(), month: d.getMonth(), key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` })
  }
  return result
}

const QuarterlyReports = ({ transactions }: { transactions: Transaction[] }) => {
  const months = getLast6Months()

  const rows = months.map(({ year, month, key }) => {
    const monthTxs = transactions.filter((tx) => {
      const d = new Date(tx.date)
      return d.getFullYear() === year && d.getMonth() === month
    })
    const income = monthTxs.filter((t) => t.type === 0).reduce((s, t) => s + t.amount, 0)
    const expense = monthTxs.filter((t) => t.type === 1).reduce((s, t) => s + t.amount, 0)
    const balance = income - expense
    return { key, label: `${MONTH_NAMES[month]} ${year}`, income, expense, balance, hasData: monthTxs.length > 0 }
  })

  return (
    <ComponentCard title="Aylık Finansal Özet" bodyClassName="p-0" isCloseable isCollapsible>
      <div className="table-responsive">
        <Table hover className="table-custom table-nowrap table-centered mb-0">
          <thead className="bg-light bg-opacity-25 thead-sm">
            <tr className="text-uppercase fs-xxs">
              <th className="text-muted">Dönem</th>
              <th className="text-muted">Gelir</th>
              <th className="text-muted">Gider</th>
              <th className="text-muted">Bakiye</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key}>
                <td><h5 className="fs-sm mb-0 fw-medium">{row.label}</h5></td>
                <td>
                  {row.hasData
                    ? <span className="text-success fw-medium">{fmt(row.income)}</span>
                    : <span className="text-muted">—</span>}
                </td>
                <td>
                  {row.hasData
                    ? <span className="text-danger fw-medium">{fmt(row.expense)}</span>
                    : <span className="text-muted">—</span>}
                </td>
                <td>
                  {row.hasData
                    ? <Badge bg={row.balance >= 0 ? 'success' : 'danger'} className="fw-medium">{fmt(row.balance)}</Badge>
                    : <Badge bg="light" text="dark" className="fw-medium">Veri yok</Badge>}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </ComponentCard>
  )
}

export default QuarterlyReports
