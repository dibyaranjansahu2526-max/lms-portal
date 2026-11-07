import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react'
import AuthShell from '../../components/AuthShell'
import { ErrorAlert } from '../../components/Feedback'
import { ButtonLoader } from '../../components/Loading'
import { getErrorMessage } from '../../api/client'
import { homeForRole } from '../../api/helpers'
import { useAuth } from '../../context/AuthContext'

const DEMO_ACCOUNTS = [
  { label: 'Student', email: 'student1@lms.com', password: 'student123' },
  { label: 'Teacher', email: 'teacher1@lms.com', password: 'teacher123' },
  { label: 'Admin', email: 'admin@lms.com', password: 'admin123' },
]

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (user) {
    return <Navigate to={homeForRole(user.role)} replace />
  }

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const loggedIn = await login(form)
      const destination = location.state?.from || homeForRole(loggedIn.role)
      navigate(destination, { replace: true })
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to sign in. Please check your details.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell>
      <div className="page-enter">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Welcome back</h1>
        <p className="mt-2 text-sm text-slate-500">Sign in to continue learning or managing your courses.</p>

        <ErrorAlert message={error} className="mt-6" />

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
                value={form.email}
                onChange={handleChange}
                className="input pl-10"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={form.password}
                onChange={handleChange}
                className="input px-10"
                placeholder="Enter your password"
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

          <button type="submit" disabled={loading} className="btn-primary w-full py-3">
            {loading ? <ButtonLoader label="Signing in..." /> : <>Sign in <ArrowRight className="h-4 w-4" /></>}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-500">
          New to LMS Portal?{' '}
          <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-700">
            Create an account
          </Link>
        </p>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
          <p className="mb-3 text-center text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
            Demo accounts · click to fill
          </p>
          <div className="grid grid-cols-3 gap-2">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.label}
                type="button"
                onClick={() => setForm({ email: account.email, password: account.password })}
                className="rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
              >
                {account.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </AuthShell>
  )
}
