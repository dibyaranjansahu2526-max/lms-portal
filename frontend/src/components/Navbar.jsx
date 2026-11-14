import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  BookOpen,
  ChevronDown,
  ClipboardList,
  Compass,
  GraduationCap,
  Heart,
  LayoutDashboard,
  LibraryBig,
  LogOut,
  Menu,
  Users,
  X,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { formatRole, initials } from '../api/helpers'

const NAV_LINKS = {
  STUDENT: [
    { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/student/catalog', label: 'Catalog', icon: Compass },
    { to: '/student/courses', label: 'My Courses', icon: BookOpen },
    { to: '/student/mock-tests', label: 'Mock Tests', icon: ClipboardList },
    { to: '/student/wishlist', label: 'Wishlist', icon: Heart },
  ],
  TEACHER: [
    { to: '/teacher/courses', label: 'My Courses', icon: LibraryBig },
    { to: '/teacher/mock-tests', label: 'Mock Tests', icon: ClipboardList },
  ],
  ADMIN: [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/courses', label: 'Courses', icon: BookOpen },
  ],
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    setMobileOpen(false)
    setProfileOpen(false)
  }, [location.pathname])

  const links = NAV_LINKS[user?.role] || []

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-200">
            <GraduationCap className="h-5 w-5" />
          </span>
          <span className="text-lg font-extrabold tracking-tight text-slate-900">
            LMS<span className="text-indigo-600">Portal</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => {
            const Icon = link.icon
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </NavLink>
            )
          })}
        </nav>

        <div className="flex items-center gap-2">
          <div className="relative hidden sm:block">
            <button
              type="button"
              onClick={() => setProfileOpen((open) => !open)}
              className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 text-left transition hover:bg-slate-100"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                {initials(user?.name)}
              </span>
              <span className="hidden lg:block">
                <span className="block max-w-[150px] truncate text-sm font-semibold text-slate-800">
                  {user?.name}
                </span>
                <span className="block text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  {formatRole(user?.role)}
                </span>
              </span>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-60 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                <div className="border-b border-slate-100 px-3 py-2.5">
                  <p className="truncate text-sm font-semibold text-slate-800">{user?.name}</p>
                  <p className="truncate text-xs text-slate-500">{user?.email}</p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 md:hidden"
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 md:hidden">
          <div className="mb-3 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
              {initials(user?.name)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-800">{user?.name}</p>
              <p className="truncate text-xs text-slate-500">{formatRole(user?.role)}</p>
            </div>
          </div>
          <nav className="space-y-1">
            {links.map((link) => {
              const Icon = link.icon
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold ${
                      isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </NavLink>
              )
            })}
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </nav>
        </div>
      )}
    </header>
  )
}
