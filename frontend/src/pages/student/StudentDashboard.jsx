import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Award, BookOpen, CheckCircle2, Compass, PlayCircle, Sparkles } from 'lucide-react'
import api, { getErrorMessage } from '../../api/client'
import CourseCard from '../../components/CourseCard'
import { EmptyState, ErrorAlert, SuccessAlert } from '../../components/Feedback'
import { PageLoader } from '../../components/Loading'
import PageHeader from '../../components/PageHeader'
import ProgressBar from '../../components/ProgressBar'
import StatCard from '../../components/StatCard'
import { useAuth } from '../../context/AuthContext'

export default function StudentDashboard() {
  const { user } = useAuth()
  const [enrollments, setEnrollments] = useState([])
  const [courses, setCourses] = useState([])
  const [wishlistedIds, setWishlistedIds] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [enrollingId, setEnrollingId] = useState(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    Promise.all([
      api.get('/student/courses'),
      api.get('/courses', { params: { size: 100 } }),
      api.get('/student/wishlist'),
    ])
      .then(([enrollmentResponse, courseResponse, wishlistResponse]) => {
        if (!active) return
        setEnrollments(enrollmentResponse.data)
        setCourses(courseResponse.data.content ?? [])
        setWishlistedIds(new Set(wishlistResponse.data.map((item) => item.course.id)))
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err, 'Could not load your dashboard.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const enrolledIds = useMemo(
    () => new Set(enrollments.map((enrollment) => enrollment.course.id)),
    [enrollments],
  )
  const enrolledCategories = useMemo(
    () => new Set(enrollments.map((enrollment) => enrollment.course.category).filter(Boolean)),
    [enrollments],
  )
  const inProgress = useMemo(
    () => enrollments.filter((enrollment) => !enrollment.progress.completed),
    [enrollments],
  )
  const completedCount = enrollments.filter((enrollment) => enrollment.progress.completed).length
  const certificateCount = enrollments.filter(
    (enrollment) => enrollment.progress.certificateCode,
  ).length

  const recommended = useMemo(() => {
    const available = courses.filter((course) => !enrolledIds.has(course.id))
    const preferred = available.filter((course) => enrolledCategories.has(course.category))
    const pool = preferred.length > 0 ? preferred : available

    return [...pool]
      .sort((a, b) => {
        if (preferred.length === 0) {
          return (
            (b.enrollmentCount || 0) - (a.enrollmentCount || 0) ||
            (b.averageRating || 0) - (a.averageRating || 0)
          )
        }
        return (
          (b.averageRating || 0) - (a.averageRating || 0) ||
          (b.enrollmentCount || 0) - (a.enrollmentCount || 0)
        )
      })
      .slice(0, 6)
  }, [courses, enrolledIds, enrolledCategories])

  const firstName = user?.name?.split(' ')[0] || 'there'

  const handleEnroll = async (course) => {
    setEnrollingId(course.id)
    setError('')
    setSuccess('')
    try {
      const { data } = await api.post(`/courses/${course.id}/enroll`)
      setEnrollments((current) => [data, ...current])
      setCourses((current) =>
        current.map((item) =>
          item.id === course.id ? { ...item, enrollmentCount: item.enrollmentCount + 1 } : item,
        ),
      )
      setSuccess(`You are enrolled in "${course.title}". Start learning whenever you are ready.`)
    } catch (err) {
      setError(getErrorMessage(err, 'Could not enroll in this course.'))
    } finally {
      setEnrollingId(null)
    }
  }

  const handleToggleWishlist = async (course) => {
    const wasWishlisted = wishlistedIds.has(course.id)
    setError('')
    setSuccess('')
    setWishlistedIds((current) => {
      const next = new Set(current)
      if (wasWishlisted) next.delete(course.id)
      else next.add(course.id)
      return next
    })

    try {
      if (wasWishlisted) {
        await api.delete(`/student/wishlist/${course.id}`)
        setSuccess(`Removed "${course.title}" from your wishlist.`)
      } else {
        await api.post(`/student/wishlist/${course.id}`)
        setSuccess(`Saved "${course.title}" to your wishlist.`)
      }
    } catch (err) {
      setWishlistedIds((current) => {
        const next = new Set(current)
        if (wasWishlisted) next.add(course.id)
        else next.delete(course.id)
        return next
      })
      setError(getErrorMessage(err, 'Could not update your wishlist.'))
    }
  }

  if (loading) return <PageLoader label="Loading your dashboard..." />

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="Student dashboard"
        title={`Welcome back, ${firstName}`}
        description="Keep your learning momentum going, revisit your progress, and discover a course that matches your goals."
        action={
          <Link to="/student/catalog" className="btn-primary">
            <Compass className="h-4 w-4" /> Browse catalog
          </Link>
        }
      />

      <ErrorAlert message={error} className="mb-5" />
      <SuccessAlert message={success} className="mb-5" />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Enrolled courses"
          value={enrollments.length}
          icon={BookOpen}
          tone="indigo"
          hint="Courses in your learning library"
        />
        <StatCard
          label="Completed courses"
          value={completedCount}
          icon={CheckCircle2}
          tone="emerald"
          hint={enrollments.length ? 'Keep going to finish more' : 'Your first completion awaits'}
        />
        <StatCard
          label="Certificates earned"
          value={certificateCount}
          icon={Award}
          tone="amber"
          hint="Download them from My Courses"
        />
      </div>

      <section className="mt-9">
        <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900">Continue learning</h2>
            <p className="mt-1 text-sm text-slate-500">Pick up an in-progress course and keep moving forward.</p>
          </div>
          <Link to="/student/courses" className="text-sm font-semibold text-indigo-600 hover:text-indigo-800">
            View all my courses
          </Link>
        </div>

        {inProgress.length === 0 ? (
          <EmptyState
            icon={PlayCircle}
            title={enrollments.length ? 'All caught up' : 'Start your learning journey'}
            description={
              enrollments.length
                ? 'You have completed all of your enrolled courses. Find something new in the catalog.'
                : 'Enroll in a course to see it here with progress tracking and a quick continue button.'
            }
            action={
              <Link to="/student/catalog" className="btn-primary">
                Explore courses
              </Link>
            }
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {inProgress.map(({ course, progress }) => (
              <article key={course.id} className="card p-4 sm:flex sm:gap-4">
                <div className="relative h-32 w-full shrink-0 overflow-hidden rounded-xl sm:h-auto sm:w-36">
                  {course.imageUrl ? (
                    <img src={course.imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full min-h-32 w-full bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500" />
                  )}
                </div>
                <div className="mt-4 flex min-w-0 flex-1 flex-col justify-between sm:mt-0">
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span className="badge bg-indigo-50 text-indigo-700">{course.category || 'General'}</span>
                        <Link
                          to={`/student/courses/${course.id}`}
                          className="mt-2 block truncate text-base font-bold text-slate-900 hover:text-indigo-700"
                        >
                          {course.title}
                        </Link>
                        <p className="mt-0.5 truncate text-xs text-slate-400">by {course.teacherName}</p>
                      </div>
                      <span className="shrink-0 text-sm font-extrabold text-indigo-600">{progress.percentage}%</span>
                    </div>
                    <ProgressBar value={progress.percentage} className="mt-4" />
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs font-medium text-slate-400">
                      {progress.completedLessons}/{progress.totalLessons} lessons ·{' '}
                      {progress.passedQuizzes}/{progress.totalQuizzes} quizzes
                    </p>
                    <Link to={`/student/courses/${course.id}/learn`} className="btn-primary !px-3 !py-2 text-xs">
                      <PlayCircle className="h-4 w-4" /> Continue
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-slate-900">
              <Sparkles className="h-5 w-5 text-indigo-500" /> Recommended for you
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {enrolledCategories.size > 0
                ? 'Courses from categories you are already learning.'
                : 'Popular courses to help you get started.'}
            </p>
          </div>
          <Link to="/student/catalog" className="text-sm font-semibold text-indigo-600 hover:text-indigo-800">
            See the full catalog
          </Link>
        </div>

        {recommended.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="No recommendations right now"
            description="Browse the catalog to find your next course."
            action={
              <Link to="/student/catalog" className="btn-primary">
                Browse courses
              </Link>
            }
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recommended.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                enrolling={enrollingId === course.id}
                onEnroll={handleEnroll}
                wishlisted={wishlistedIds.has(course.id)}
                onToggleWishlist={handleToggleWishlist}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
