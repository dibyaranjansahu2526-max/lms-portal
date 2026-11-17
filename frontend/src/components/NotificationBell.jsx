import { useEffect, useRef, useState } from 'react'
import { Award, Bell, BookOpen, CheckCheck, ClipboardCheck } from 'lucide-react'
import api, { getErrorMessage } from '../api/client'
import { formatDateTime } from '../api/helpers'

const POLL_INTERVAL_MS = 30000

const TYPE_META = {
  ENROLLMENT: { icon: BookOpen, className: 'bg-indigo-50 text-indigo-600' },
  QUIZ_PASSED: { icon: ClipboardCheck, className: 'bg-emerald-50 text-emerald-600' },
  CERTIFICATE: { icon: Award, className: 'bg-amber-50 text-amber-600' },
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [markingAll, setMarkingAll] = useState(false)
  const [error, setError] = useState('')
  const containerRef = useRef(null)

  const refreshUnreadCount = () => {
    api
      .get('/notifications/unread-count')
      .then(({ data }) => setUnreadCount(Number(data?.count) || 0))
      .catch(() => {})
  }

  useEffect(() => {
    refreshUnreadCount()
    const timer = window.setInterval(refreshUnreadCount, POLL_INTERVAL_MS)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!open) return undefined
    let active = true
    setLoading(true)
    setError('')
    api
      .get('/notifications')
      .then(({ data }) => {
        if (active) setNotifications(Array.isArray(data) ? data : [])
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err, 'Could not load notifications.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [open])

  useEffect(() => {
    if (!open) return undefined
    const handlePointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) setOpen(false)
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const markRead = async (notification) => {
    if (notification.read) return
    setError('')
    setNotifications((current) =>
      current.map((item) => (item.id === notification.id ? { ...item, read: true } : item)),
    )
    setUnreadCount((current) => Math.max(0, current - 1))
    try {
      await api.put(`/notifications/${notification.id}/read`)
    } catch (err) {
      setError(getErrorMessage(err, 'Could not mark this notification as read.'))
      refreshUnreadCount()
      api
        .get('/notifications')
        .then(({ data }) => setNotifications(Array.isArray(data) ? data : []))
        .catch(() => {})
    }
  }

  const markAllRead = async () => {
    if (unreadCount === 0 || markingAll) return
    setMarkingAll(true)
    setError('')
    try {
      await api.put('/notifications/read-all')
      setNotifications((current) => current.map((item) => ({ ...item, read: true })))
      setUnreadCount(0)
    } catch (err) {
      setError(getErrorMessage(err, 'Could not mark all notifications as read.'))
    } finally {
      setMarkingAll(false)
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="relative rounded-xl p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
        aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : 'Notifications'}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-none text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-bold text-slate-900">Notifications</p>
            <button
              type="button"
              onClick={markAllRead}
              disabled={unreadCount === 0 || markingAll}
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 transition hover:text-indigo-800 disabled:cursor-not-allowed disabled:text-slate-300"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all as read
            </button>
          </div>

          {error && (
            <p className="border-b border-rose-100 bg-rose-50 px-4 py-2 text-xs text-rose-600">{error}</p>
          )}

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <p className="px-4 py-8 text-center text-sm text-slate-400">Loading notifications...</p>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <Bell className="h-5 w-5" />
                </span>
                <p className="mt-3 text-sm font-semibold text-slate-700">You&apos;re all caught up</p>
                <p className="mt-1 text-xs text-slate-400">
                  Enrollment, quiz and certificate updates will appear here.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {notifications.map((notification) => {
                  const meta = TYPE_META[notification.type] || TYPE_META.ENROLLMENT
                  const Icon = meta.icon
                  return (
                    <li key={notification.id}>
                      <button
                        type="button"
                        onClick={() => markRead(notification)}
                        className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-slate-50 ${
                          notification.read ? '' : 'bg-indigo-50/60'
                        }`}
                      >
                        <span
                          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${meta.className}`}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span
                            className={`block text-sm ${
                              notification.read ? 'text-slate-600' : 'font-semibold text-slate-800'
                            }`}
                          >
                            {notification.message}
                          </span>
                          <span className="mt-1 block text-[11px] font-medium text-slate-400">
                            {formatDateTime(notification.createdAt)}
                          </span>
                        </span>
                        {!notification.read && (
                          <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-indigo-500" aria-label="Unread" />
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
