import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole } from 'lucide-react'
import api, { getErrorMessage } from '../../api/client'
import AuthShell from '../../components/AuthShell'
import { ErrorAlert, SuccessAlert } from '../../components/Feedback'
import { ButtonLoader } from '../../components/Loading'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = (searchParams.get('token') || '').trim()
  const [form, setForm] = useState({ password: '', confirmPassword: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (form.password.length < 6 || form.password.length > 100) {
      setError('Password must be between 6 and 100 characters.')
      return
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const { data } = await api.post('/auth/reset-password', { token, password: form.password })
      setSuccess(data.message || 'Your password has been reset. You can now sign in.')
      setForm({ password: '', confirmPassword: '' })
    } catch (err) {
      setError(getErrorMessage(err, 'Could not reset your password.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell>
      <div className="page-enter">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Reset password</h1>
        <p className="mt-2 text-sm text-slate-500">Choose a new password for your account.</p>

        <ErrorAlert message={error} className="mt-6" />
        <SuccessAlert message={success} className="mt-6" />

        {!token ? (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            This reset link is missing its token.{' '}
            <Link to="/forgot-password" className="font-semibold underline">
              Request a new link
            </Link>
            .
          </div>
        ) : success ? (
          <Link to="/login" className="btn-primary mt-6 inline-flex w-full items-center justify-center gap-2 py-3">
            Continue to sign in <ArrowRight className="h-4 w-4" />
          </Link>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label className="label" htmlFor="password">
                New password
              </label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  minLength={6}
                  maxLength={100}
                  value={form.password}
                  onChange={handleChange}
                  className="input px-10"
                  placeholder="At least 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute right-3 top-2.5 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="label" htmlFor="confirmPassword">
                Confirm new password
              </label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  minLength={6}
                  maxLength={100}
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className="input pl-10"
                  placeholder="Re-enter your new password"
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? <ButtonLoader label="Resetting password..." /> : <>Reset password <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>
        )}

        <Link
          to="/login"
          className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to sign in
        </Link>
      </div>
    </AuthShell>
  )
}