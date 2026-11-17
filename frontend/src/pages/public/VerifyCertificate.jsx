import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Search,
  ShieldCheck,
  UserRound,
  XCircle,
} from 'lucide-react'
import api, { getErrorMessage } from '../../api/client'
import AuthShell from '../../components/AuthShell'
import { ErrorAlert } from '../../components/Feedback'
import { ButtonLoader } from '../../components/Loading'

function formatIssueDate(value) {
  if (!value) return '—'
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function VerifyCertificate() {
  const [code, setCode] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notFound, setNotFound] = useState(false)

  const clearFeedback = () => {
    setResult(null)
    setError('')
    setNotFound(false)
  }

  const handleChange = (event) => {
    setCode(event.target.value.toUpperCase())
    clearFeedback()
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const trimmed = code.trim()
    if (!trimmed) {
      clearFeedback()
      setError('Enter the certificate code printed on your PDF.')
      return
    }

    setLoading(true)
    clearFeedback()
    try {
      const { data } = await api.get(`/certificates/verify/${encodeURIComponent(trimmed)}`)
      setResult(data)
    } catch (err) {
      if (err.response?.status === 404) {
        setNotFound(true)
      } else {
        setError(getErrorMessage(err, 'Could not verify this certificate. Please try again.'))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell>
      <div className="page-enter">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
          <ShieldCheck className="h-3.5 w-3.5" />
          Public certificate verification
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Verify a certificate</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          Enter the unique code printed on an LMS Portal certificate to confirm its authenticity.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="label" htmlFor="certificate-code">
              Certificate code
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                id="certificate-code"
                name="certificate-code"
                value={code}
                onChange={handleChange}
                autoComplete="off"
                spellCheck={false}
                placeholder="LMS-XXXXXXXXXXXX"
                className="input pl-10 font-mono uppercase tracking-wide"
              />
            </div>
            <p className="mt-1.5 text-xs text-slate-400">
              The code appears near the bottom of the certificate PDF.
            </p>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-3">
            {loading ? (
              <ButtonLoader label="Verifying..." />
            ) : (
              <>
                Verify certificate <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <ErrorAlert message={error} className="mt-5" />

        {notFound && (
          <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
                <XCircle className="h-5 w-5" />
              </span>
              <div>
                <p className="font-bold text-rose-800">Certificate not found</p>
                <p className="mt-1 text-sm leading-relaxed text-rose-700">
                  Check the code and try again. It should look like LMS- followed by a sequence of characters.
                </p>
              </div>
            </div>
          </div>
        )}

        {result && (
          <div className="mt-5 overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50/70">
            <div className="flex items-center gap-3 border-b border-emerald-200/70 p-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <p className="font-bold text-emerald-800">Certificate verified</p>
                <p className="mt-0.5 text-xs text-emerald-700">This is a valid LMS Portal certificate.</p>
              </div>
            </div>
            <dl className="space-y-4 p-5">
              <div>
                <dt className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-700/70">
                  <UserRound className="h-3 w-3" /> Student
                </dt>
                <dd className="mt-1 text-sm font-semibold text-slate-900">{result.studentName}</dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-700/70">
                  <BookOpen className="h-3 w-3" /> Course
                </dt>
                <dd className="mt-1 text-sm font-semibold text-slate-900">{result.courseName}</dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-700/70">
                  <CalendarDays className="h-3 w-3" /> Issued
                </dt>
                <dd className="mt-1 text-sm font-semibold text-slate-900">
                  {formatIssueDate(result.issueDate)}
                </dd>
              </div>
            </dl>
          </div>
        )}

        {!result && !notFound && !error && (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-4">
            <p className="text-xs leading-relaxed text-slate-500">
              A certificate code is issued only after a learner completes every lesson and passes every quiz in a
              course.
            </p>
          </div>
        )}

        <p className="mt-8 text-center text-sm text-slate-500">
          <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">
            Back to sign in
          </Link>
        </p>
      </div>
    </AuthShell>
  )
}
