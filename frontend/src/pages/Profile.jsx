import { useEffect, useState } from 'react'
import { Eye, EyeOff, KeyRound, LockKeyhole, Mail, ShieldCheck, UserRound } from 'lucide-react'
import api, { getErrorMessage } from '../api/client'
import { ErrorAlert, SuccessAlert } from '../components/Feedback'
import { ButtonLoader, PageLoader } from '../components/Loading'
import PageHeader from '../components/PageHeader'
import { formatDate, formatRole, initials } from '../api/helpers'
import { useAuth } from '../context/AuthContext'

const EMPTY_PASSWORD_FORM = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
}

export default function Profile() {
  const { user, updateUser } = useAuth()
  const [profile, setProfile] = useState(user)
  const [name, setName] = useState(user?.name || '')
  const [loading, setLoading] = useState(true)
  const [profileError, setProfileError] = useState('')
  const [profileSuccess, setProfileSuccess] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [passwordForm, setPasswordForm] = useState(EMPTY_PASSWORD_FORM)
  const [showPassword, setShowPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  useEffect(() => {
    let active = true

    api
      .get('/profile')
      .then(({ data }) => {
        if (!active) return
        setProfile(data)
        setName(data.name)
        updateUser(data)
      })
      .catch((err) => {
        if (active) setProfileError(getErrorMessage(err, 'Could not load your profile.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [updateUser])

  const handleNameSubmit = async (event) => {
    event.preventDefault()
    const nextName = name.trim()
    setProfileError('')
    setProfileSuccess('')

    if (!nextName) {
      setProfileError('Name is required.')
      return
    }

    setSavingProfile(true)
    try {
      const { data } = await api.put('/profile', { name: nextName })
      setProfile(data)
      setName(data.name)
      updateUser(data)
      setProfileSuccess('Your profile has been updated.')
    } catch (err) {
      setProfileError(getErrorMessage(err, 'Could not update your profile.'))
    } finally {
      setSavingProfile(false)
    }
  }

  const handlePasswordChange = (event) => {
    const { name: field, value } = event.target
    setPasswordForm((current) => ({ ...current, [field]: value }))
  }

  const handlePasswordSubmit = async (event) => {
    event.preventDefault()
    const { currentPassword, newPassword, confirmPassword } = passwordForm
    setPasswordError('')
    setPasswordSuccess('')

    if (!currentPassword) {
      setPasswordError('Enter your current password.')
      return
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.')
      return
    }
    if (newPassword.length > 100) {
      setPasswordError('New password must be at most 100 characters long.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.')
      return
    }

    setSavingPassword(true)
    try {
      await api.put('/profile/password', { currentPassword, newPassword })
      setPasswordForm(EMPTY_PASSWORD_FORM)
      setShowPassword(false)
      setPasswordSuccess('Your password has been changed.')
    } catch (err) {
      setPasswordError(getErrorMessage(err, 'Could not change your password.'))
    } finally {
      setSavingPassword(false)
    }
  }

  if (loading) return <PageLoader label="Loading your profile..." />

  return (
    <div className="page-enter mx-auto max-w-5xl">
      <PageHeader
        eyebrow="Account"
        title="Your profile"
        description="Update the name shown across the LMS and keep your account secure with a new password."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-6 sm:p-7">
          <div className="flex items-center gap-4 border-b border-slate-100 pb-5 dark:border-slate-800">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-lg font-extrabold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
              {initials(profile?.name)}
            </span>
            <div className="min-w-0">
              <h2 className="text-lg font-extrabold tracking-tight text-slate-900">Account details</h2>
              <p className="mt-0.5 truncate text-sm text-slate-500">{profile?.email}</p>
              <p className="mt-1 text-xs font-medium text-slate-400">
                Member since {formatDate(profile?.createdAt)}
              </p>
            </div>
          </div>

          <ErrorAlert message={profileError} className="mt-5" />
          <SuccessAlert message={profileSuccess} className="mt-5" />

          <form onSubmit={handleNameSubmit} className="mt-5 space-y-4">
            <div>
              <label className="label" htmlFor="profile-name">
                Full name
              </label>
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  id="profile-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  maxLength={120}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="input pl-10"
                  placeholder="Your full name"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="profile-email">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    id="profile-email"
                    type="email"
                    value={profile?.email || ''}
                    disabled
                    className="input pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="label" htmlFor="profile-role">
                  Role
                </label>
                <div className="relative">
                  <ShieldCheck className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    id="profile-role"
                    type="text"
                    value={formatRole(profile?.role)}
                    disabled
                    className="input pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button type="submit" disabled={savingProfile} className="btn-primary">
                {savingProfile ? <ButtonLoader label="Saving..." /> : 'Save changes'}
              </button>
            </div>
          </form>
        </section>

        <section className="card p-6 sm:p-7">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-5 dark:border-slate-800">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400">
              <KeyRound className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-extrabold tracking-tight text-slate-900">Change password</h2>
              <p className="mt-0.5 text-sm text-slate-500">
                Confirm your current password before choosing a new one.
              </p>
            </div>
          </div>

          <ErrorAlert message={passwordError} className="mt-5" />
          <SuccessAlert message={passwordSuccess} className="mt-5" />

          <form onSubmit={handlePasswordSubmit} className="mt-5 space-y-4">
            <div>
              <label className="label" htmlFor="current-password">
                Current password
              </label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  id="current-password"
                  name="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  className="input pl-10"
                  placeholder="Enter your current password"
                />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="new-password">
                New password
              </label>
              <div className="relative">
                <input
                  id="new-password"
                  name="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  minLength={6}
                  maxLength={100}
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  className="input pr-11"
                  placeholder="At least 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute right-3 top-2.5 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  aria-label={showPassword ? 'Hide passwords' : 'Show passwords'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="label" htmlFor="confirm-password">
                Confirm new password
              </label>
              <input
                id="confirm-password"
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                minLength={6}
                maxLength={100}
                value={passwordForm.confirmPassword}
                onChange={handlePasswordChange}
                className="input"
                placeholder="Repeat your new password"
              />
            </div>

            <p className="text-xs text-slate-400">
              Passwords must be between 6 and 100 characters.
            </p>

            <div className="flex justify-end pt-1">
              <button type="submit" disabled={savingPassword} className="btn-primary">
                {savingPassword ? <ButtonLoader label="Updating..." /> : 'Update password'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  )
}
