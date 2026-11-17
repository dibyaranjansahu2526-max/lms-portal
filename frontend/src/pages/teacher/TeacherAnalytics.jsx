import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart3,
  BookOpen,
  ClipboardList,
  Percent,
  Target,
  Users,
} from 'lucide-react'
import api, { getErrorMessage } from '../../api/client'
import { EmptyState, ErrorAlert } from '../../components/Feedback'
import { PageLoader } from '../../components/Loading'
import PageHeader from '../../components/PageHeader'
import ProgressBar from '../../components/ProgressBar'
import StatCard from '../../components/StatCard'
import { formatMarks } from '../../api/helpers'

function formatPercent(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—'
  return `${formatMarks(value)}%`
}

export default function TeacherAnalytics() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    api
      .get('/teacher/analytics/courses')
      .then(({ data }) => {
        if (active) setCourses(Array.isArray(data) ? data : [])
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err, 'Could not load your analytics.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const summary = useMemo(() => {
    const totalEnrollments = courses.reduce((sum, course) => sum + course.enrollmentCount, 0)
    const totalCompleted = courses.reduce((sum, course) => sum + course.completedCount, 0)
    const totalQuizAttempts = courses.reduce((sum, course) => sum + course.quizAttemptCount, 0)
    const weightedQuizScore = courses.reduce(
      (sum, course) => (
        course.averageQuizScore == null
          ? sum
          : sum + course.averageQuizScore * course.quizAttemptCount
      ),
      0,
    )

    return {
      totalCourses: courses.length,
      totalEnrollments,
      totalCompleted,
      completionRate: totalEnrollments
        ? Math.round((totalCompleted * 1000) / totalEnrollments) / 10
        : 0,
      averageQuizScore: totalQuizAttempts
        ? Math.round((weightedQuizScore / totalQuizAttempts) * 10) / 10
        : null,
      totalQuizAttempts,
    }
  }, [courses])

  const maxEnrollments = Math.max(1, ...courses.map((course) => course.enrollmentCount))

  if (loading) return <PageLoader label="Loading analytics..." />

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="Teaching insights"
        title="Analytics"
        description="See how students are progressing through your courses, from enrollments to quiz performance."
        action={
          <Link to="/teacher/courses" className="btn-secondary">
            <BookOpen className="h-4 w-4" /> My courses
          </Link>
        }
      />

      {error ? (
        <ErrorAlert message={error} />
      ) : courses.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No analytics yet"
          description="Create a course and publish it to start collecting enrollment, completion and quiz data."
          action={
            <Link to="/teacher/courses/new" className="btn-primary">
              <BookOpen className="h-4 w-4" /> Create course
            </Link>
          }
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Courses"
              value={summary.totalCourses}
              icon={BookOpen}
              tone="indigo"
              hint="Across your teaching studio"
            />
            <StatCard
              label="Enrollments"
              value={summary.totalEnrollments}
              icon={Users}
              tone="emerald"
              hint="Across all your courses"
            />
            <StatCard
              label="Completion rate"
              value={formatPercent(summary.completionRate)}
              icon={Percent}
              tone="violet"
              hint={`${summary.totalCompleted} of ${summary.totalEnrollments} enrollments completed`}
            />
            <StatCard
              label="Avg quiz score"
              value={formatPercent(summary.averageQuizScore)}
              icon={Target}
              tone="amber"
              hint={`${summary.totalQuizAttempts} quiz attempt${summary.totalQuizAttempts === 1 ? '' : 's'}`}
            />
          </div>

          <section className="card mt-6 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">Enrollments per course</h2>
                <p className="mt-1 text-xs text-slate-400">
                  A quick comparison of how many students have joined each course.
                </p>
              </div>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <BarChart3 className="h-5 w-5" />
              </span>
            </div>

            <div
              className="mt-6 space-y-4"
              role="img"
              aria-label="Bar chart showing enrollments for each course"
            >
              {courses.map((course) => {
                const width = course.enrollmentCount === 0
                  ? 0
                  : Math.max(4, Math.round((course.enrollmentCount / maxEnrollments) * 100))
                return (
                  <div key={course.courseId}>
                    <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                      <span className="truncate font-semibold text-slate-700" title={course.title}>
                        {course.title}
                      </span>
                      <span className="shrink-0 font-bold text-slate-800">{course.enrollmentCount}</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          <section className="card mt-6 overflow-hidden">
            <div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">Course performance</h2>
                <p className="mt-1 text-xs text-slate-400">
                  Completion and quiz averages are calculated across each course&apos;s activity.
                </p>
              </div>
              <span className="badge w-fit bg-slate-100 text-slate-600">
                <ClipboardList className="h-3 w-3" /> {courses.length} courses
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Enrollments</th>
                    <th>Completed</th>
                    <th>Completion rate</th>
                    <th>Avg quiz score</th>
                    <th>Quiz attempts</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((course) => (
                    <tr key={course.courseId}>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="max-w-[280px] truncate font-semibold text-slate-800" title={course.title}>
                            {course.title}
                          </span>
                          <span
                            className={`badge shrink-0 ${
                              course.published
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {course.published ? 'Published' : 'Draft'}
                          </span>
                        </div>
                      </td>
                      <td className="font-bold text-slate-800">{course.enrollmentCount}</td>
                      <td>{course.completedCount}</td>
                      <td>
                        <div className="flex min-w-[150px] items-center gap-3">
                          <ProgressBar value={course.completionRate} className="w-24" size="sm" />
                          <span className="font-semibold text-slate-700">
                            {formatPercent(course.completionRate)}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="font-semibold text-slate-700">
                          {formatPercent(course.averageQuizScore)}
                        </span>
                      </td>
                      <td>{course.quizAttemptCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
