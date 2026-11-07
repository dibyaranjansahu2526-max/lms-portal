import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Download,
  PlayCircle,
} from 'lucide-react'
import api, { downloadCertificate, getErrorMessage } from '../../api/client'
import { EmptyState, ErrorAlert, SuccessAlert } from '../../components/Feedback'
import { PageLoader } from '../../components/Loading'
import PageHeader from '../../components/PageHeader'
import ProgressBar from '../../components/ProgressBar'
import { formatDate } from '../../api/helpers'

export default function MyCourses() {
  const [enrollments, setEnrollments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [downloading, setDownloading] = useState(null)

  const loadCourses = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/student/courses')
      setEnrollments(data)
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load your courses.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCourses()
  }, [])

  const handleCertificate = async (courseId, title) => {
    setDownloading(courseId)
    setError('')
    setSuccess('')
    try {
      await downloadCertificate(courseId, `LMS-Certificate-${title.replace(/[^a-z0-9]+/gi, '-')}.pdf`)
      setSuccess('Your certificate has been downloaded.')
    } catch (err) {
      setError(getErrorMessage(err, 'Could not download the certificate.'))
    } finally {
      setDownloading(null)
    }
  }

  if (loading) return <PageLoader label="Loading your courses..." />

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="My learning"
        title="My Courses"
        description="Pick up where you left off, track your progress, and download your certificates."
        action={
          <Link to="/student/catalog" className="btn-primary">
            <BookOpen className="h-4 w-4" /> Browse catalog
          </Link>
        }
      />

      <ErrorAlert message={error} className="mb-5" />
      <SuccessAlert message={success} className="mb-5" />

      {enrollments.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="You have not enrolled yet"
          description="Browse the catalog and enroll in your first course to begin learning."
          action={
            <Link to="/student/catalog" className="btn-primary">
              Explore courses <ArrowRight className="h-4 w-4" />
            </Link>
          }
        />
      ) : (
        <div className="space-y-5">
          {enrollments.map(({ course, progress, enrolledAt }) => (
            <article key={course.id} className="card overflow-hidden">
              <div className="flex flex-col md:flex-row">
                <div className="relative h-44 w-full shrink-0 overflow-hidden md:h-auto md:w-64">
                  {course.imageUrl ? (
                    <img src={course.imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full min-h-44 w-full bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 to-transparent md:bg-gradient-to-r" />
                  {progress.completed && (
                    <span className="badge absolute left-3 top-3 bg-emerald-500 text-white shadow-sm">
                      <Award className="h-3 w-3" /> Completed
                    </span>
                  )}
                </div>

                <div className="flex flex-1 flex-col justify-between gap-5 p-5 sm:p-6">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="badge bg-indigo-50 text-indigo-700">{course.category || 'General'}</span>
                      <span className="text-xs text-slate-400">Enrolled {formatDate(enrolledAt)}</span>
                    </div>
                    <h2 className="mt-2 text-xl font-extrabold tracking-tight text-slate-900">{course.title}</h2>
                    <p className="mt-1 text-sm text-slate-500">by {course.teacherName}</p>

                    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <BookOpen className="h-3.5 w-3.5" />
                        {progress.completedLessons}/{progress.totalLessons} lessons complete
                      </span>
                      <span className="flex items-center gap-1.5">
                        <ClipboardList className="h-3.5 w-3.5" />
                        {progress.passedQuizzes}/{progress.totalQuizzes} quizzes passed
                      </span>
                    </div>
                  </div>

                  <div>
                    <ProgressBar value={progress.percentage} showLabel />
                    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                      <Link
                        to={`/student/courses/${course.id}/learn`}
                        className={progress.completed ? 'btn-secondary' : 'btn-primary'}
                      >
                        {progress.completed ? (
                          <>
                            <PlayCircle className="h-4 w-4" /> Review course
                          </>
                        ) : (
                          <>
                            <PlayCircle className="h-4 w-4" /> Continue learning
                          </>
                        )}
                      </Link>
                      {progress.completed && (
                        <button
                          type="button"
                          disabled={downloading === course.id}
                          onClick={() => handleCertificate(course.id, course.title)}
                          className="btn-secondary"
                        >
                          <Download className="h-4 w-4" />
                          {downloading === course.id ? 'Downloading...' : 'Download certificate'}
                        </button>
                      )}
                      {!progress.completed && progress.certificateCode && (
                        <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                          <CheckCircle2 className="h-4 w-4" /> Certificate ready
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
