import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  BookOpen,
  FileText,
  Link2,
  ListOrdered,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  Video,
} from 'lucide-react'
import api, { getErrorMessage } from '../../api/client'
import { EmptyState, ErrorAlert, SuccessAlert } from '../../components/Feedback'
import { ButtonLoader, PageLoader } from '../../components/Loading'
import PageHeader from '../../components/PageHeader'

const EMPTY_LESSON = {
  title: '',
  content: '',
  videoUrl: '',
  materialUrl: '',
  order: 1,
}

export default function LessonManager() {
  const { courseId } = useParams()
  const [course, setCourse] = useState(null)
  const [lessons, setLessons] = useState([])
  const [form, setForm] = useState(EMPTY_LESSON)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadData = async () => {
    const [courseResponse, lessonsResponse] = await Promise.all([
      api.get(`/courses/${courseId}`),
      api.get(`/teacher/courses/${courseId}/lessons`),
    ])
    setCourse(courseResponse.data)
    setLessons(lessonsResponse.data)
    return lessonsResponse.data
  }

  useEffect(() => {
    let active = true
    setLoading(true)
    Promise.all([api.get(`/courses/${courseId}`), api.get(`/teacher/courses/${courseId}/lessons`)])
      .then(([courseResponse, lessonsResponse]) => {
        if (!active) return
        setCourse(courseResponse.data)
        setLessons(lessonsResponse.data)
        setForm((current) => ({ ...current, order: lessonsResponse.data.length + 1 }))
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err, 'Could not load course lessons.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [courseId])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: name === 'order' ? Number(value) : value }))
  }

  const resetForm = (nextOrder) => {
    setEditingId(null)
    setForm({ ...EMPTY_LESSON, order: nextOrder ?? lessons.length + 1 })
  }

  const startEdit = (lesson) => {
    setEditingId(lesson.id)
    setForm({
      title: lesson.title,
      content: lesson.content,
      videoUrl: lesson.videoUrl || '',
      materialUrl: lesson.materialUrl || '',
      order: lesson.order,
    })
    setError('')
    setSuccess('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      if (editingId) {
        await api.put(`/teacher/lessons/${editingId}`, form)
        setSuccess('Lesson updated.')
      } else {
        await api.post(`/teacher/courses/${courseId}/lessons`, form)
        setSuccess('Lesson added.')
      }
      const updated = await loadData()
      resetForm(updated.length + 1)
    } catch (err) {
      setError(getErrorMessage(err, 'Could not save the lesson.'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (lesson) => {
    if (!window.confirm(`Delete lesson "${lesson.title}"?`)) return
    setDeletingId(lesson.id)
    setError('')
    setSuccess('')
    try {
      await api.delete(`/teacher/lessons/${lesson.id}`)
      const updated = await loadData()
      setSuccess('Lesson deleted.')
      if (editingId === lesson.id) resetForm(updated.length + 1)
    } catch (err) {
      setError(getErrorMessage(err, 'Could not delete the lesson.'))
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) return <PageLoader label="Loading lessons..." />

  return (
    <div className="page-enter">
      <Link
        to="/teacher/courses"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-indigo-600"
      >
        <ArrowLeft className="h-4 w-4" /> Back to My Courses
      </Link>

      <PageHeader
        eyebrow="Course content"
        title="Lesson manager"
        description={course ? `${course.title} · ${lessons.length} lessons` : 'Build your course lesson by lesson.'}
      />

      <ErrorAlert message={error} className="mb-5" />
      <SuccessAlert message={success} className="mb-5" />

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_1.15fr]">
        <form onSubmit={handleSubmit} className="card p-6 lg:sticky lg:top-24">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                {editingId ? 'Edit lesson' : 'Add a lesson'}
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                {editingId ? 'Update the lesson details below.' : 'Lessons can include text, video and materials.'}
              </p>
            </div>
            {editingId && (
              <button
                type="button"
                onClick={() => resetForm()}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Cancel edit
              </button>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="label" htmlFor="lesson-title">
                Lesson title
              </label>
              <input
                id="lesson-title"
                name="title"
                type="text"
                required
                maxLength={180}
                value={form.title}
                onChange={handleChange}
                className="input"
                placeholder="e.g. Introduction to REST APIs"
              />
            </div>

            <div>
              <label className="label" htmlFor="lesson-content">
                Text content
              </label>
              <textarea
                id="lesson-content"
                name="content"
                required
                rows={8}
                value={form.content}
                onChange={handleChange}
                className="input resize-y"
                placeholder="Write the lesson content. Line breaks are preserved."
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="lesson-video">
                  YouTube video URL
                </label>
                <input
                  id="lesson-video"
                  name="videoUrl"
                  type="url"
                  maxLength={500}
                  value={form.videoUrl}
                  onChange={handleChange}
                  className="input"
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>
              <div>
                <label className="label" htmlFor="lesson-order">
                  Order
                </label>
                <input
                  id="lesson-order"
                  name="order"
                  type="number"
                  min={1}
                  required
                  value={form.order}
                  onChange={handleChange}
                  className="input"
                />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="lesson-material">
                Material URL
              </label>
              <input
                id="lesson-material"
                name="materialUrl"
                type="url"
                maxLength={500}
                value={form.materialUrl}
                onChange={handleChange}
                className="input"
                placeholder="https://example.com/handout.pdf"
              />
            </div>
          </div>

          <button type="submit" disabled={saving} className="btn-primary mt-5 w-full">
            {saving ? (
              <ButtonLoader />
            ) : editingId ? (
              <><Pencil className="h-4 w-4" /> Save lesson</>
            ) : (
              <><Plus className="h-4 w-4" /> Add lesson</>
            )}
          </button>
        </form>

        <div>
          {lessons.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No lessons yet"
              description="Use the form to add your first lesson. Students will see lessons in the order you set."
            />
          ) : (
            <div className="space-y-3">
              {lessons.map((lesson) => (
                <article key={lesson.id} className="card p-5">
                  <div className="flex items-start gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-sm font-extrabold text-indigo-600">
                      {lesson.order}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold leading-snug text-slate-900">{lesson.title}</h3>
                      <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-slate-500">{lesson.content}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {lesson.videoUrl && (
                          <span className="badge bg-rose-50 text-rose-600">
                            <Video className="h-3 w-3" /> Video
                          </span>
                        )}
                        {lesson.materialUrl && (
                          <span className="badge bg-sky-50 text-sky-600">
                            <Link2 className="h-3 w-3" /> Material
                          </span>
                        )}
                        <span className="badge bg-slate-100 text-slate-500">
                          <ListOrdered className="h-3 w-3" /> Order {lesson.order}
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={() => startEdit(lesson)}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-indigo-50 hover:text-indigo-600"
                        aria-label="Edit lesson"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(lesson)}
                        disabled={deletingId === lesson.id}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                        aria-label="Delete lesson"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
