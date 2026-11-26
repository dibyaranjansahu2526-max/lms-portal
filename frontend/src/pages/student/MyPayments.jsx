import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CreditCard, Download, ExternalLink, Receipt } from 'lucide-react'
import api, { downloadPaymentReceipt, getErrorMessage } from '../../api/client'
import { formatCurrency, formatDateTime } from '../../api/helpers'
import { EmptyState, ErrorAlert } from '../../components/Feedback'
import { PageLoader } from '../../components/Loading'
import PageHeader from '../../components/PageHeader'

const STATUS_STYLES = {
  SUCCESS: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  FAILED: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
  CREATED: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
}

export default function MyPayments() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [downloadingId, setDownloadingId] = useState(null)

  const loadPayments = () => {
    let active = true
    setLoading(true)
    setError('')
    api
      .get('/student/payments')
      .then(({ data }) => {
        if (active) setPayments(Array.isArray(data) ? data : [])
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err, 'Could not load your payments.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }

  const handleDownload = async (payment) => {
    if (payment.status !== 'SUCCESS' || !payment.id) return
    setDownloadingId(payment.id)
    setError('')
    try {
      await downloadPaymentReceipt(payment.id)
    } catch (err) {
      setError(getErrorMessage(err, 'Could not download this receipt.'))
    } finally {
      setDownloadingId(null)
    }
  }
  useEffect(loadPayments, [])

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="Student"
        title="My Payments"
        description="A record of every order you placed for a paid course, including its verification status."
        action={
          <Link to="/student/catalog" className="btn-secondary">
            <CreditCard className="h-4 w-4" /> Browse courses
          </Link>
        }
      />

      <ErrorAlert message={error} className="mb-5" />

      {loading ? (
        <PageLoader label="Loading payments..." />
      ) : payments.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No payments yet"
          description="Paid courses you buy will appear here with their order and payment details."
          action={
            <Link to="/student/catalog" className="btn-primary">
              Explore the catalog
            </Link>
          }
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 border-b border-slate-200 bg-slate-50 px-6 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400 md:grid">
            <span>Course</span>
            <span>Amount</span>
            <span>Status</span>
            <span>Date</span>
            <span>Details</span>
          </div>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {payments.map((payment) => (
              <li
                key={payment.id || payment.razorpayOrderId}
                className="grid gap-3 px-6 py-4 md:grid-cols-[2fr_1fr_1fr_1fr_auto] md:items-center md:gap-4"
              >
                <div className="min-w-0">
                  <Link
                    to={`/student/courses/${payment.courseId}`}
                    className="block truncate text-sm font-bold text-slate-900 hover:text-indigo-600 dark:text-slate-100"
                  >
                    {payment.courseTitle || `Course #${payment.courseId}`}
                  </Link>
                  <p className="mt-0.5 truncate font-mono text-[11px] text-slate-400">
                    Order {payment.razorpayOrderId}
                  </p>
                </div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  {formatCurrency(Number(payment.amountPaise || 0) / 100)}
                </p>
                <div>
                  <span
                    className={`badge ${STATUS_STYLES[payment.status] || STATUS_STYLES.CREATED}`}
                  >
                    {payment.status || 'CREATED'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {formatDateTime(payment.createdAt)}
                </p>
                <div className="flex items-center gap-3">
                  {payment.razorpayPaymentId && (
                    <span
                      className="truncate font-mono text-[11px] text-slate-400"
                      title={payment.razorpayPaymentId}
                    >
                      {payment.razorpayPaymentId}
                    </span>
                  )}
                  <Link
                    to={`/student/courses/${payment.courseId}`}
                    className="shrink-0 text-slate-400 transition hover:text-indigo-600"
                    aria-label={`View ${payment.courseTitle || 'course'}`}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                  {payment.status === 'SUCCESS' && payment.id && (
                    <button
                      type="button"
                      onClick={() => handleDownload(payment)}
                      disabled={downloadingId === payment.id}
                      className="shrink-0 text-slate-400 transition hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label={`Download receipt for ${payment.courseTitle || 'course'}`}
                      title="Download PDF receipt"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}