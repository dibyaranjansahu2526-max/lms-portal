import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BookOpen,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  LibraryBig,
  ShieldCheck,
  UserCheck,
  Users,
} from 'lucide-react'
import api, { getErrorMessage } from '../../api/client'
import { ErrorAlert } from '../../components/Feedback'
import { PageLoader } from '../../components/Loading'
import PageHeader from '../../components/PageHeader'
import StatCard from '../../components/StatCard'
import { useAuth } from '../../context/AuthContext'

export default function AdminDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    api
      .get('/admin/stats')
      .then(({ data }) => {
        if (active) setStats(data)
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err, 'Could not load dashboard statistics.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  if (loading) return <PageLoader label="Loading dashboard..." />
  if (!stats) return <ErrorAlert message={error || 'Dashboard unavailable.'} />

  const publishedShare = stats.totalCourses
    ? Math.round((stats.publishedCourses / stats.totalCourses) * 100)
    : 0
  const studentShare = stats.totalUsers ? Math.round((stats.totalStudents / stats.totalUsers) * 100) : 0

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="Administration"
        title={`Welcome, ${user?.name?.split(' ')[0] || 'Admin'}`}
        description="A complete snapshot of the LMS platform. Manage users, courses and enrollments from one place."
        action={
          <Link to="/admin/users" className="btn-primary">
            <Users className="h-4 w-4" /> Manage users
          </Link>
        }
      />

      <ErrorAlert message={error} className="mb-5" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total users" value={stats.totalUsers} icon={Users} tone="indigo" hint={`${stats.totalStudents} students · ${stats.totalTeachers} teachers`} />
        <StatCard label="Courses" value={stats.totalCourses} icon={BookOpen} tone="violet" hint={`${stats.publishedCourses} published`} />
        <StatCard label="Enrollments" value={stats.totalEnrollments} icon={UserCheck} tone="emerald" hint="Across all courses" />
        <StatCard label="Lessons" value={stats.totalLessons} icon={LibraryBig} tone="amber" hint={`${stats.totalQuizzes} quizzes`} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <section className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Platform overview</h2>
              <p className="mt-1 text-xs text-slate-400">How the LMS community is distributed.</p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <LayoutDashboard className="h-5 w-5" />
            </span>
          </div>

          <div className="mt-6 space-y-5">
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-600">Students</span>
                <span className="font-bold text-slate-800">{stats.totalStudents} <span className="font-normal text-slate-400">({studentShare}%)</span></span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-indigo-500" style={{ width: `${studentShare}%` }} />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-600">Teachers</span>
                <span className="font-bold text-slate-800">{stats.totalTeachers}</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-violet-500"
                  style={{ width: `${stats.totalUsers ? Math.max(6, Math.round((stats.totalTeachers / stats.totalUsers) * 100)) : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-600">Published courses</span>
                <span className="font-bold text-slate-800">{stats.publishedCourses} <span className="font-normal text-slate-400">({publishedShare}%)</span></span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${publishedShare}%` }} />
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-slate-100 pt-5">
            <div className="rounded-xl bg-slate-50 p-3.5">
              <p className="text-xs font-semibold text-slate-400">Quizzes</p>
              <p className="mt-1 text-xl font-extrabold text-slate-800">{stats.totalQuizzes}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3.5">
              <p className="text-xs font-semibold text-slate-400">Published / total</p>
              <p className="mt-1 text-xl font-extrabold text-slate-800">{stats.publishedCourses}/{stats.totalCourses}</p>
            </div>
          </div>
        </section>

        <section className="card p-6">
          <h2 className="text-lg font-extrabold text-slate-900">Quick actions</h2>
          <p className="mt-1 text-xs text-slate-400">Jump straight into platform management.</p>

          <div className="mt-5 space-y-3">
            <Link
              to="/admin/users"
              className="flex items-center gap-4 rounded-xl border border-slate-200 p-4 transition hover:border-indigo-200 hover:bg-indigo-50/40"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Users className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-800">Manage users</p>
                <p className="mt-0.5 text-xs text-slate-500">Review accounts and remove users.</p>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </Link>

            <Link
              to="/admin/courses"
              className="flex items-center gap-4 rounded-xl border border-slate-200 p-4 transition hover:border-indigo-200 hover:bg-indigo-50/40"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <BookOpen className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-800">Manage courses</p>
                <p className="mt-0.5 text-xs text-slate-500">See all courses and remove content.</p>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </Link>

            <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-800">Role-based security</p>
                <p className="mt-0.5 text-xs text-slate-500">JWT protected admin area.</p>
              </div>
              <GraduationCap className="h-4 w-4 text-slate-300" />
            </div>
          </div>

          <div className="mt-5 flex items-center gap-2 rounded-xl bg-indigo-50 px-4 py-3 text-xs text-indigo-700">
            <ClipboardList className="h-4 w-4 shrink-0" />
            Every course can include lessons, quizzes and certificates.
          </div>
        </section>
      </div>
    </div>
  )
}
