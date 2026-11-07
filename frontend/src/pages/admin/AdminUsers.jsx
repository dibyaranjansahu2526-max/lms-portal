import { useEffect, useMemo, useState } from 'react'
import { Search, Shield, Trash2, UserRound, Users } from 'lucide-react'
import api, { getErrorMessage } from '../../api/client'
import { EmptyState, ErrorAlert, SuccessAlert } from '../../components/Feedback'
import { PageLoader } from '../../components/Loading'
import PageHeader from '../../components/PageHeader'
import { formatDate, formatRole, initials } from '../../api/helpers'
import { useAuth } from '../../context/AuthContext'

const ROLE_STYLES = {
  ADMIN: 'bg-rose-50 text-rose-700',
  TEACHER: 'bg-violet-50 text-violet-700',
  STUDENT: 'bg-sky-50 text-sky-700',
}

export default function AdminUsers() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [deletingId, setDeletingId] = useState(null)

  const loadUsers = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/admin/users')
      setUsers(data)
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load users.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return users
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.role.toLowerCase().includes(term),
    )
  }, [users, search])

  const handleDelete = async (user) => {
    if (user.id === currentUser?.id) {
      setError('You cannot delete your own admin account.')
      return
    }
    if (!window.confirm(`Delete ${user.name} (${user.email})? Their related enrollments, progress and courses will also be removed.`)) {
      return
    }

    setDeletingId(user.id)
    setError('')
    setSuccess('')
    try {
      await api.delete(`/admin/users/${user.id}`)
      setUsers((current) => current.filter((item) => item.id !== user.id))
      setSuccess(`${user.name} was deleted.`)
    } catch (err) {
      setError(getErrorMessage(err, 'Could not delete the user.'))
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) return <PageLoader label="Loading users..." />

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="Administration"
        title="Users"
        description={`${users.length} accounts on the platform. Delete accounts that should no longer have access.`}
      />

      <ErrorAlert message={error} className="mb-5" />
      <SuccessAlert message={success} className="mb-5" />

      {users.length === 0 ? (
        <EmptyState icon={Users} title="No users found" description="Registered users will appear here." />
      ) : (
        <>
          <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="input pl-10"
                placeholder="Search by name, email or role..."
              />
            </div>
            <span className="text-xs font-semibold text-slate-400">
              Showing {filtered.length} of {users.length}
            </span>
          </div>

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-extrabold text-slate-600">
                          {initials(user.name)}
                        </span>
                        <div>
                          <p className="font-semibold text-slate-800">
                            {user.name}
                            {user.id === currentUser?.id && (
                              <span className="ml-2 text-[10px] font-bold uppercase tracking-wide text-indigo-500">You</span>
                            )}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${ROLE_STYLES[user.role] || 'bg-slate-100 text-slate-600'}`}>
                        {user.role === 'ADMIN' && <Shield className="h-3 w-3" />}
                        {formatRole(user.role)}
                      </span>
                    </td>
                    <td className="text-sm">{formatDate(user.createdAt)}</td>
                    <td className="text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(user)}
                        disabled={user.id === currentUser?.id || deletingId === user.id}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                        title={user.id === currentUser?.id ? 'You cannot delete your own account' : 'Delete user'}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {deletingId === user.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="flex flex-col items-center px-5 py-12 text-center">
                <UserRound className="h-8 w-8 text-slate-300" />
                <p className="mt-3 text-sm font-semibold text-slate-500">No users match your search.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
