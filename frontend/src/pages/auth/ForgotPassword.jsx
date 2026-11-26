import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Mail } from 'lucide-react'
import api, { getErrorMessage } from '../../api/client'
import AuthShell from '../../components/AuthShell'
import { ErrorAlert, SuccessAlert } from '../../components/Feedback'
import { ButtonLoader } from '../../components/Loading'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')

    if (!EMAIL_PATTERN.test(email.trim())) {
      setError('Enter a valid email address.')
      return
    }

    setLoading(true)
    try {
      const { data } = await api.post('/auth/forgot-password', { email: email.trim() })
      setMessage(data.message || 'If an account exists for that email, a password reset link has been sent.')
    } catch (err) {
      setError(getErrorMessage(err, 'Could not request a password reset link.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell>
      <div className="page-enter">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Forgot password?</h1>
        <p className="mt-2 text-sm text-slate-500">
          Enter your email and we'll send a link to reset your password.
        </p>

        <ErrorAlert message={error} className="mt-6" />
        <SuccessAlert message={message} className="mt-6" />

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label className="label" htmlFor="email">
              Email address
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="input pl-10"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-3">
            {loading ? <ButtonLoader label="Sending link..." /> : <>Send reset link <ArrowRight className="h-4 w-4" /></>}
          </button>
        </form>

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