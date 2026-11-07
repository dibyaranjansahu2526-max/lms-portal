import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BookOpen,
  ClipboardList,
  Eye,
  EyeOff,
  GraduationCap,
  Pencil,
  Plus,
  Trash2,
  Users,
} from 'lucide-react'
import api, { getErrorMessage } from '../../api/client'
import { EmptyState, ErrorAlert, SuccessAlert } from '../../components/Feedback'
import { SkeletonCard } from '../../components/Loading'
import PageHeader from '../../components/PageHeader'

export default function TeacherCourses() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [deletingId, setDeletingId] = useState(null)

  const loadCourses = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/teacher/courses')
      setCourses(data)
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load your courses.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCourses()
  }, [])

  const handleDelete = async (course) => {
    if (!window.confirm(`Delete "${course.title}"? This also removes its lessons, quizzes and enrollments.`)) {
      return
    }
    setDeletingId(course.id)
    setError('')
    setSuccess('')
    try {
      await api.delete(`/teacher/courses/${course.id}`)
      setCourses((current) => current.filter((item) => item.id !== course.id))
      setSuccess(`"${course.title}" was deleted.`)
    } catch (err) {
      setError(getErrorMessage(err, 'Could not delete the course.'))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="Teaching studio"
        title="My Courses"
        description="Create courses, organize lessons and quizzes, and keep an eye on your enrolled students."
        action={
          <Link to="/teacher/courses/new" className="btn-primary">
            <Plus className="h-4 w-4" /> New course
          </Link>
        }
      />

      <ErrorAlert message={error} className="mb-5" />
      <SuccessAlert message={success} className="mb-5" />

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="Create your first course"
          description="Share your knowledge with students by building a course with lessons, quizzes and progress tracking."
          action={
            <Link to="/teacher/courses/new" className="btn-primary">
              <Plus className="h-4 w-4" /> Create course
            </Link>
          }
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <article key={course.id} className="card card-hover flex h-full flex-col overflow-hidden">
              <div className="relative h-36 overflow-hidden">
                {course.imageUrl ? (
                  <img src={course.imageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 to-transparent" />
                <div className="absolute left-3 top-3">
                  {course.published ? (
                    <span className="badge bg-emerald-500/95 text-white shadow-sm">
                      <Eye className="h-3 w-3" /> Published
                    </span>
                  ) : (
                    <span className="badge bg-slate-800/90 text-white shadow-sm">
                      <EyeOff className="h-3 w-3" /> Draft
                    </span>
                  )}
                </div>
                <span className="badge absolute bottom-3 left-3 bg-white/95 text-slate-700">
                  {course.category || 'General'}
                </span>
              </div>

              <div className="flex flex-1 flex-col p-5">
                <h2 className="text-base font-bold leading-snug text-slate-900">{course.title}</h2>
                <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-slate-500">{course.description}</p>

                <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 text-center">
                  <div>
                    <p className="text-lg font-extrabold text-slate-800">{course.lessonCount}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Lessons</p>
                  </div>
                  <div className="border-x border-slate-200">
                    <p className="text-lg font-extrabold text-slate-800">{course.quizCount}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Quizzes</p>
                  </div>
                  <div>
                    <p className="text-lg font-extrabold text-slate-800">{course.enrollmentCount}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Students</p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Link to={`/teacher/courses/${course.id}/lessons`} className="btn-secondary !px-2.5">
                    <BookOpen className="h-4 w-4" /> Lessons
                  </Link>
                  <Link to={`/teacher/courses/${course.id}/quizzes`} className="btn-secondary !px-2.5">
                    <ClipboardList className="h-4 w-4" /> Quizzes
                  </Link>
                  <Link to={`/teacher/courses/${course.id}/students`} className="btn-secondary !px-2.5">
                    <Users className="h-4 w-4" /> Students
                  </Link>
                  <Link to={`/teacher/courses/${course.id}/edit`} className="btn-secondary !px-2.5">
                    <Pencil className="h-4 w-4" /> Edit
                  </Link>
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(course)}
                  disabled={deletingId === course.id}
                  className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-60"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {deletingId === course.id ? 'Deleting...' : 'Delete course'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
