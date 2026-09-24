import ComponentCard from '@/components/cards/ComponentCard'
import EChart from '@/components/wrappers/EChart'
import { getColor } from '@/utils/helpers'
import { PieChart } from 'echarts/charts'
import { TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { useCallback, Suspense } from 'react'
import type { Transaction } from '../index'

const fmt = (n: number) => '₺' + n.toLocaleString('tr-TR')

const ProjectPerformance = ({ transactions }: { transactions: Transaction[] }) => {
  const income = transactions.filter((t) => t.type === 0).reduce((s, t) => s + t.amount, 0)
  const expense = transactions.filter((t) => t.type === 1).reduce((s, t) => s + t.amount, 0)
  const hasData = income > 0 || expense > 0

  const getOptions = useCallback(() => ({
    tooltip: {
      trigger: 'item' as const,
      padding: [8, 15],
      backgroundColor: getColor('secondary-bg'),
      borderColor: getColor('border-color'),
      textStyle: { color: getColor('light-text-emphasis') },
      borderWidth: 1,
      formatter: (p: any) => `${p.name}: ₺${Number(p.value).toLocaleString('tr-TR')} (${p.percent}%)`,
    },
    textStyle: { fontFamily: getComputedStyle(document.body).fontFamily },
    series: [
      {
        name: 'Dağılım',
        type: 'pie' as const,
        radius: ['55%', '85%'],
        center: ['50%', '50%'],
        itemStyle: { borderRadius: 4 },
        label: { show: false },
        data: hasData
          ? [
              { value: income, name: 'Gelir', itemStyle: { color: getColor('success') } },
              { value: expense, name: 'Gider', itemStyle: { color: getColor('danger') } },
            ]
          : [{ value: 1, name: 'Veri yok', itemStyle: { color: getColor('light') } }],
      },
    ],
  }), [income, expense, hasData])

  return (
    <ComponentCard title="Gelir / Gider Dağılımı" isCloseable isCollapsible>
      <div className="d-flex justify-content-center gap-4 mb-3">
        <span className="d-flex align-items-center gap-1 fs-sm">
          <span className="badge bg-success rounded-circle p-1">&nbsp;</span>
          Gelir {hasData && <strong className="ms-1">{fmt(income)}</strong>}
        </span>
        <span className="d-flex align-items-center gap-1 fs-sm">
          <span className="badge bg-danger rounded-circle p-1">&nbsp;</span>
          Gider {hasData && <strong className="ms-1">{fmt(expense)}</strong>}
        </span>
      </div>
      <div dir="ltr">
        <Suspense>
          <EChart
            extensions={[PieChart, TooltipComponent, CanvasRenderer]}
            getOptions={getOptions}
            style={{ height: 180 }}
          />
        </Suspense>
      </div>
      {!hasData && (
        <p className="text-muted text-center fs-sm mb-0 mt-2">Henüz finansal işlem kaydedilmedi.</p>
      )}
    </ComponentCard>
  )
}

export default ProjectPerformance
