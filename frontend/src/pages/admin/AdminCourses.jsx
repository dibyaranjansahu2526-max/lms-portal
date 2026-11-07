import { useEffect, useMemo, useState } from 'react'
import { BookOpen, Eye, EyeOff, Search, Trash2 } from 'lucide-react'
import api, { getErrorMessage } from '../../api/client'
import { EmptyState, ErrorAlert, SuccessAlert } from '../../components/Feedback'
import { PageLoader } from '../../components/Loading'
import PageHeader from '../../components/PageHeader'
import { formatDate } from '../../api/helpers'

export default function AdminCourses() {
  const [courses, setCourses] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [deletingId, setDeletingId] = useState(null)

  const loadCourses = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/admin/courses')
      setCourses(data)
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load courses.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCourses()
  }, [])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return courses
    return courses.filter(
      (course) =>
        course.title.toLowerCase().includes(term) ||
        course.teacherName.toLowerCase().includes(term) ||
        (course.category || '').toLowerCase().includes(term),
    )
  }, [courses, search])

  const handleDelete = async (course) => {
    if (!window.confirm(`Delete "${course.title}"? This removes all lessons, quizzes, enrollments and progress tied to it.`)) {
      return
    }
    setDeletingId(course.id)
    setError('')
    setSuccess('')
    try {
      await api.delete(`/admin/courses/${course.id}`)
      setCourses((current) => current.filter((item) => item.id !== course.id))
      setSuccess(`"${course.title}" was deleted.`)
    } catch (err) {
      setError(getErrorMessage(err, 'Could not delete the course.'))
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) return <PageLoader label="Loading courses..." />

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="Administration"
        title="Courses"
        description={`${courses.length} courses across the platform. Review content and remove courses when necessary.`}
      />

      <ErrorAlert message={error} className="mb-5" />
      <SuccessAlert message={success} className="mb-5" />

      {courses.length === 0 ? (
        <EmptyState icon={BookOpen} title="No courses found" description="Courses created by teachers will appear here." />
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
                placeholder="Search by title, teacher or category..."
              />
            </div>
            <span className="text-xs font-semibold text-slate-400">
              Showing {filtered.length} of {courses.length}
            </span>
          </div>

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Teacher</th>
                  <th>Content</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((course) => (
                  <tr key={course.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                          {course.imageUrl ? (
                            <img src={course.imageUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full bg-gradient-to-br from-indigo-500 to-violet-500" />
                          )}
                        </div>
                        <div>
                          <p className="max-w-xs truncate font-semibold text-slate-800">{course.title}</p>
                          <p className="mt-0.5 text-xs text-slate-400">{course.category || 'General'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-sm">{course.teacherName}</td>
                    <td>
                      <p className="text-xs text-slate-500">{course.lessonCount} lessons</p>
                      <p className="text-xs text-slate-400">{course.quizCount} quizzes · {course.enrollmentCount} students</p>
                    </td>
                    <td>
                      {course.published ? (
                        <span className="badge bg-emerald-50 text-emerald-700">
                          <Eye className="h-3 w-3" /> Published
                        </span>
                      ) : (
                        <span className="badge bg-slate-100 text-slate-500">
                          <EyeOff className="h-3 w-3" /> Draft
                        </span>
                      )}
                    </td>
                    <td className="text-sm">{formatDate(course.createdAt)}</td>
                    <td className="text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(course)}
                        disabled={deletingId === course.id}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {deletingId === course.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <p className="px-5 py-12 text-center text-sm text-slate-400">No courses match your search.</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
