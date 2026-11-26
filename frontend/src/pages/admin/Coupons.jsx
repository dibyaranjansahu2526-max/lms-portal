import { useEffect, useState } from 'react'
import { CheckCircle2, Plus, Tag, Trash2 } from 'lucide-react'
import api, { getErrorMessage } from '../../api/client'
import { formatDateTime } from '../../api/helpers'
import { EmptyState, ErrorAlert, SuccessAlert } from '../../components/Feedback'
import { ButtonLoader, PageLoader } from '../../components/Loading'
import PageHeader from '../../components/PageHeader'

function defaultExpiry() {
  const date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return date.toISOString().slice(0, 16)
}

const EMPTY_FORM = {
  code: '',
  discountPercent: '10',
  expiresAt: defaultExpiry(),
  maxUses: '10',
}

export default function Coupons() {
  const [coupons, setCoupons] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadCoupons = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/admin/coupons')
      setCoupons(data)
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load coupons.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCoupons()
  }, [])

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  const handleCreate = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    const discount = Number(form.discountPercent)
    const maxUses = Number(form.maxUses)
    if (!form.code.trim()) {
      setError('Enter a coupon code.')
      return
    }
    if (!Number.isInteger(discount) || discount < 1 || discount > 100) {
      setError('Discount must be between 1 and 100 percent.')
      return
    }
    if (!Number.isInteger(maxUses) || maxUses < 1) {
      setError('Maximum uses must be at least 1.')
      return
    }
    if (!form.expiresAt || new Date(form.expiresAt) <= new Date()) {
      setError('Choose an expiry date in the future.')
      return
    }

    setSubmitting(true)
    try {
      const { data } = await api.post('/admin/coupons', {
        code: form.code.trim(),
        discountPercent: discount,
        expiresAt: form.expiresAt,
        maxUses,
      })
      setCoupons((current) => [data, ...current])
      setForm({ ...EMPTY_FORM, expiresAt: defaultExpiry() })
      setSuccess(`Coupon ${data.code} created.`)
    } catch (err) {
      setError(getErrorMessage(err, 'Could not create this coupon.'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggle = async (coupon) => {
    setBusyId(coupon.id)
    setError('')
    setSuccess('')
    try {
      const { data } = await api.post(`/admin/coupons/${coupon.id}/${coupon.active ? 'deactivate' : 'activate'}`)
      setCoupons((current) => current.map((item) => (item.id === data.id ? data : item)))
      setSuccess(`Coupon ${data.code} ${data.active ? 'activated' : 'deactivated'}.`)
    } catch (err) {
      setError(getErrorMessage(err, 'Could not update this coupon.'))
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async (coupon) => {
    if (!window.confirm(`Delete coupon ${coupon.code}? Past payments keep their discount record.`)) return
    setBusyId(coupon.id)
    setError('')
    setSuccess('')
    try {
      await api.delete(`/admin/coupons/${coupon.id}`)
      setCoupons((current) => current.filter((item) => item.id !== coupon.id))
      setSuccess(`Coupon ${coupon.code} deleted.`)
    } catch (err) {
      setError(getErrorMessage(err, 'Could not delete this coupon.'))
    } finally {
      setBusyId(null)
    }
  }

  if (loading) return <PageLoader label="Loading coupons..." />

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="Administration"
        title="Coupons"
        description="Create discount codes for paid courses, track usage and disable them when needed."
      />

      <ErrorAlert message={error} className="mb-5" />
      <SuccessAlert message={success} className="mb-5" />

      <div className="grid items-start gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
        <section className="card p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-slate-900">
            <Plus className="h-4 w-4 text-indigo-600" /> New coupon
          </h2>
          <form onSubmit={handleCreate} className="mt-5 space-y-4">
            <div>
              <label className="label" htmlFor="coupon-code">Code</label>
              <input
                id="coupon-code"
                name="code"
                value={form.code}
                onChange={handleChange}
                maxLength={40}
                className="input uppercase"
                placeholder="SAVE20"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="coupon-discount">Discount %</label>
                <input
                  id="coupon-discount"
                  name="discountPercent"
                  type="number"
                  min="1"
                  max="100"
                  value={form.discountPercent}
                  onChange={handleChange}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="label" htmlFor="coupon-uses">Max uses</label>
                <input
                  id="coupon-uses"
                  name="maxUses"
                  type="number"
                  min="1"
                  value={form.maxUses}
                  onChange={handleChange}
                  className="input"
                  required
                />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="coupon-expiry">Expires at</label>
              <input
                id="coupon-expiry"
                name="expiresAt"
                type="datetime-local"
                value={form.expiresAt}
                onChange={handleChange}
                className="input"
                required
              />
            </div>
            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? <ButtonLoader label="Creating..." /> : 'Create coupon'}
            </button>
          </form>
        </section>

        <section className="card overflow-hidden">
          {coupons.length === 0 ? (
            <EmptyState
              icon={Tag}
              title="No coupons yet"
              description="Create a code to offer a discount on paid courses."
            />
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Discount</th>
                    <th>Usage</th>
                    <th>Expires</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((coupon) => {
                    const expired = new Date(coupon.expiresAt) <= new Date()
                    return (
                      <tr key={coupon.id}>
                        <td className="font-mono font-bold text-slate-800">{coupon.code}</td>
                        <td className="text-sm font-semibold text-indigo-600">{coupon.discountPercent}%</td>
                        <td className="text-sm">
                          {coupon.usedCount} / {coupon.maxUses}
                          <span className="ml-1 text-xs text-slate-400">({coupon.remainingUses} left)</span>
                        </td>
                        <td className="text-sm">{formatDateTime(coupon.expiresAt)}</td>
                        <td>
                          {!coupon.active ? (
                            <span className="badge bg-slate-100 text-slate-500">Inactive</span>
                          ) : expired ? (
                            <span className="badge bg-amber-50 text-amber-700">Expired</span>
                          ) : (
                            <span className="badge bg-emerald-50 text-emerald-700">
                              <CheckCircle2 className="h-3 w-3" /> Active
                            </span>
                          )}
                        </td>
                        <td className="text-right">
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleToggle(coupon)}
                              disabled={busyId === coupon.id}
                              className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-50 disabled:opacity-50"
                            >
                              {coupon.active ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(coupon)}
                              disabled={busyId === coupon.id}
                              className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
                              aria-label={`Delete ${coupon.code}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}