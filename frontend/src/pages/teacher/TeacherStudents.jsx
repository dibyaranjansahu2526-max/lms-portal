import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Award, Mail, Search, Users } from 'lucide-react'
import api, { getErrorMessage } from '../../api/client'
import { EmptyState, ErrorAlert } from '../../components/Feedback'
import { PageLoader } from '../../components/Loading'
import PageHeader from '../../components/PageHeader'
import ProgressBar from '../../components/ProgressBar'
import { formatDate } from '../../api/helpers'

export default function TeacherStudents() {
  const { courseId } = useParams()
  const [course, setCourse] = useState(null)
  const [students, setStudents] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    Promise.all([
      api.get(`/courses/${courseId}`),
      api.get(`/teacher/courses/${courseId}/students`),
    ])
      .then(([courseResponse, studentsResponse]) => {
        if (!active) return
        setCourse(courseResponse.data)
        setStudents(studentsResponse.data)
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err, 'Could not load enrolled students.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [courseId])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return students
    return students.filter(
      (student) =>
        student.name.toLowerCase().includes(term) || student.email.toLowerCase().includes(term),
    )
  }, [students, search])

  if (loading) return <PageLoader label="Loading students..." />

  return (
    <div className="page-enter">
      <Link
        to="/teacher/courses"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-indigo-600"
      >
        <ArrowLeft className="h-4 w-4" /> Back to My Courses
      </Link>

      <PageHeader
        eyebrow="Enrollment"
        title="Enrolled students"
        description={course ? `${course.title} · ${students.length} enrolled` : 'See who is enrolled and how they are progressing.'}
      />

      <ErrorAlert message={error} className="mb-5" />

      {students.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No students enrolled yet"
          description="Publish your course and share it with students. Enrollments will appear here."
        />
      ) : (
        <>
          <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="input pl-10"
                placeholder="Search students..."
              />
            </div>
            <p className="text-xs font-semibold text-slate-400">
              {filtered.length} of {students.length} students
            </p>
          </div>

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Enrolled</th>
                  <th>Progress</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((student) => (
                  <tr key={student.studentId}>
                    <td>
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-50 text-xs font-extrabold text-indigo-600">
                          {student.name
                            .split(' ')
                            .slice(0, 2)
                            .map((part) => part[0])
                            .join('')
                            .toUpperCase()}
                        </span>
                        <div>
                          <p className="font-semibold text-slate-800">{student.name}</p>
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                            <Mail className="h-3 w-3" /> {student.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="text-sm">{formatDate(student.enrolledAt)}</td>
                    <td className="min-w-48">
                      <ProgressBar value={student.progressPercentage} showLabel />
                      <p className="mt-1 text-[11px] text-slate-400">
                        {student.completedLessons}/{student.totalLessons} lessons complete
                      </p>
                    </td>
                    <td>
                      {student.completed ? (
                        <span className="badge bg-emerald-50 text-emerald-700">
                          <Award className="h-3 w-3" /> Completed
                        </span>
                      ) : (
                        <span className="badge bg-sky-50 text-sky-700">In progress</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <p className="px-5 py-10 text-center text-sm text-slate-400">No students match your search.</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
