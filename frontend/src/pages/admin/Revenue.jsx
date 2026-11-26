import { useEffect, useState } from 'react'
import { BarChart3, CheckCircle2, CreditCard, Receipt } from 'lucide-react'
import api, { getErrorMessage } from '../../api/client'
import { formatCurrency, formatDateTime } from '../../api/helpers'
import { EmptyState, ErrorAlert } from '../../components/Feedback'
import { PageLoader } from '../../components/Loading'
import PageHeader from '../../components/PageHeader'
import StatCard from '../../components/StatCard'

const STATUS_STYLES = {
  SUCCESS: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  FAILED: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
  CREATED: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
}

export default function Revenue() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    api
      .get('/admin/revenue')
      .then(({ data: response }) => {
        if (active) setData(response)
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err, 'Could not load revenue data.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  if (loading) return <PageLoader label="Loading revenue..." />
  if (!data) return <ErrorAlert message={error || 'Revenue data unavailable.'} />

  const byCourse = Array.isArray(data.revenueByCourse) ? data.revenueByCourse : []
  const byDay = Array.isArray(data.revenueByDay) ? data.revenueByDay : []
  const recent = Array.isArray(data.recentPayments) ? data.recentPayments : []
  const totalRevenue = Number(data.totalRevenuePaise || 0) / 100
  const successfulPayments = Number(data.successfulPayments || 0)
  const chartMax = Math.max(1, ...byDay.map((day) => Number(day.revenuePaise || 0)))
  const hasChartRevenue = byDay.some((day) => Number(day.revenuePaise || 0) > 0)

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="Administration"
        title="Revenue"
        description="Successful payment totals, course breakdown and recent activity across the platform."
      />

      <ErrorAlert message={error} className="mb-5" />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Total revenue"
          value={formatCurrency(totalRevenue)}
          icon={CreditCard}
          tone="emerald"
          hint="From successful payments only"
        />
        <StatCard
          label="Successful payments"
          value={successfulPayments}
          icon={CheckCircle2}
          tone="indigo"
          hint="All-time verified orders"
        />
      </div>

      <section className="card mt-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-900">
              <BarChart3 className="h-5 w-5 text-indigo-600" /> Revenue by day
            </h2>
            <p className="mt-1 text-xs text-slate-400">Last 30 days, including days with no sales.</p>
          </div>
          <span className="badge bg-indigo-50 text-indigo-700">30 days</span>
        </div>

        {hasChartRevenue ? (
          <div className="mt-6 flex h-56 items-end gap-1 overflow-x-auto pb-2">
            {byDay.map((day, index) => {
              const amount = Number(day.revenuePaise || 0) / 100
              const height = Math.max(4, Math.round((Number(day.revenuePaise || 0) / chartMax) * 100))
              return (
                <div
                  key={day.date}
                  className="flex h-full min-w-[14px] flex-1 flex-col items-center justify-end gap-1"
                  title={`${day.date}: ${formatCurrency(amount)}`}
                >
                  <div className="flex h-full w-full items-end">
                    <div
                      className="w-full rounded-t bg-indigo-500 transition hover:bg-indigo-600"
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-slate-400">
                    {index % 5 === 0 || index === byDay.length - 1 ? day.date.slice(8) : ''}
                  </span>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="mt-6 rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-400">
            No successful payments in the last 30 days.
          </p>
        )}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="card overflow-hidden">
          <div className="border-b border-slate-100 px-6 py-5 dark:border-slate-800">
            <h2 className="text-lg font-extrabold text-slate-900">Revenue per course</h2>
            <p className="mt-1 text-xs text-slate-400">Sorted by total successful revenue.</p>
          </div>
          {byCourse.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No revenue yet"
              description="Successful payments will be broken down by course here."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-100 text-[11px] uppercase tracking-wide text-slate-400 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-3 font-bold">Course</th>
                    <th className="px-3 py-3 text-right font-bold">Sales</th>
                    <th className="px-6 py-3 text-right font-bold">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {byCourse.map((item) => (
                    <tr key={item.courseId}>
                      <td className="px-6 py-3 font-semibold text-slate-800 dark:text-slate-100">
                        {item.courseTitle}
                      </td>
                      <td className="px-3 py-3 text-right text-slate-500">{item.successfulPayments}</td>
                      <td className="px-6 py-3 text-right font-bold text-emerald-600">
                        {formatCurrency(Number(item.revenuePaise || 0) / 100)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="card overflow-hidden">
          <div className="border-b border-slate-100 px-6 py-5 dark:border-slate-800">
            <h2 className="text-lg font-extrabold text-slate-900">Recent payments</h2>
            <p className="mt-1 text-xs text-slate-400">The 20 most recent orders, all statuses.</p>
          </div>
          {recent.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No payments yet"
              description="Orders placed by students will appear here."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-100 text-[11px] uppercase tracking-wide text-slate-400 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-3 font-bold">Student</th>
                    <th className="px-3 py-3 font-bold">Course</th>
                    <th className="px-3 py-3 text-right font-bold">Amount</th>
                    <th className="px-3 py-3 font-bold">Status</th>
                    <th className="px-6 py-3 font-bold">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {recent.map((payment) => (
                    <tr key={payment.id}>
                      <td className="px-6 py-3">
                        <p className="font-semibold text-slate-800 dark:text-slate-100">{payment.studentName}</p>
                        <p className="text-[11px] text-slate-400">{payment.studentEmail}</p>
                      </td>
                      <td className="max-w-[180px] truncate px-3 py-3 text-slate-600 dark:text-slate-300">
                        {payment.courseTitle}
                      </td>
                      <td className="px-3 py-3 text-right font-bold text-slate-800 dark:text-slate-100">
                        {formatCurrency(Number(payment.amountPaise || 0) / 100)}
                      </td>
                      <td className="px-3 py-3">
                        <span className={`badge ${STATUS_STYLES[payment.status] || STATUS_STYLES.CREATED}`}>
                          {payment.status || 'CREATED'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-3 text-xs text-slate-500">
                        {formatDateTime(payment.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}