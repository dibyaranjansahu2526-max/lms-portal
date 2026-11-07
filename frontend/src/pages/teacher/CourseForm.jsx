import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff, Image, Save, Sparkles } from 'lucide-react'
import api, { getErrorMessage } from '../../api/client'
import { ErrorAlert } from '../../components/Feedback'
import { ButtonLoader, PageLoader } from '../../components/Loading'
import PageHeader from '../../components/PageHeader'

const EMPTY_FORM = {
  title: '',
  description: '',
  category: '',
  imageUrl: '',
  published: true,
}

export default function CourseForm() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(courseId)
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isEdit) return
    let active = true
    api
      .get(`/courses/${courseId}`)
      .then(({ data }) => {
        if (!active) return
        setForm({
          title: data.title || '',
          description: data.description || '',
          category: data.category || '',
          imageUrl: data.imageUrl || '',
          published: data.published,
        })
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err, 'Could not load this course.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [courseId, isEdit])

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (isEdit) {
        await api.put(`/teacher/courses/${courseId}`, form)
      } else {
        await api.post('/teacher/courses', form)
      }
      navigate('/teacher/courses')
    } catch (err) {
      setError(getErrorMessage(err, 'Could not save the course.'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <PageLoader label="Loading course..." />

  return (
    <div className="page-enter mx-auto max-w-6xl">
      <Link
        to="/teacher/courses"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-indigo-600"
      >
        <ArrowLeft className="h-4 w-4" /> Back to My Courses
      </Link>

      <PageHeader
        eyebrow={isEdit ? 'Edit course' : 'New course'}
        title={isEdit ? 'Edit your course' : 'Create a new course'}
        description="Give your course a clear title and description. You can add lessons and quizzes after saving."
      />

      <ErrorAlert message={error} className="mb-5" />

      <form onSubmit={handleSubmit} className="grid items-start gap-6 lg:grid-cols-[1fr_360px]">
        <div className="card space-y-5 p-6">
          <div>
            <label className="label" htmlFor="title">
              Course title
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              maxLength={180}
              value={form.title}
              onChange={handleChange}
              className="input"
              placeholder="e.g. Java Spring Boot Masterclass"
            />
          </div>

          <div>
            <label className="label" htmlFor="category">
              Category
            </label>
            <input
              id="category"
              name="category"
              type="text"
              maxLength={100}
              value={form.category}
              onChange={handleChange}
              className="input"
              placeholder="e.g. Programming, Design, Business"
            />
          </div>

          <div>
            <label className="label" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              required
              maxLength={4000}
              rows={7}
              value={form.description}
              onChange={handleChange}
              className="input resize-none"
              placeholder="What will students learn in this course? Who is it for?"
            />
            <p className="mt-1.5 text-xs text-slate-400">{form.description.length}/4000 characters</p>
          </div>

          <div>
            <label className="label" htmlFor="imageUrl">
              Cover image URL
            </label>
            <div className="relative">
              <Image className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                id="imageUrl"
                name="imageUrl"
                type="url"
                maxLength={500}
                value={form.imageUrl}
                onChange={handleChange}
                className="input pl-10"
                placeholder="https://images.example.com/course-cover.jpg"
              />
            </div>
            <p className="mt-1.5 text-xs text-slate-400">Optional. A gradient cover is used when left blank.</p>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div>
              <p className="text-sm font-bold text-slate-800">Publish course</p>
              <p className="mt-0.5 text-xs text-slate-500">
                Published courses are visible in the student catalog and open for enrollment.
              </p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                name="published"
                checked={form.published}
                onChange={handleChange}
                className="peer sr-only"
              />
              <span className="h-6 w-11 rounded-full bg-slate-300 transition peer-checked:bg-indigo-600 peer-focus:ring-4 peer-focus:ring-indigo-100" />
              <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
            </label>
          </div>

          <div className="flex flex-col gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <Link to="/teacher/courses" className="btn-secondary">
              Cancel
            </Link>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? <ButtonLoader /> : <><Save className="h-4 w-4" /> {isEdit ? 'Save changes' : 'Create course'}</>}
            </button>
          </div>
        </div>

        <aside className="card overflow-hidden lg:sticky lg:top-24">
          <div className="border-b border-slate-100 px-5 py-3.5">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
              <Sparkles className="h-3.5 w-3.5" /> Live preview
            </p>
          </div>
          <div className="relative h-40">
            {form.imageUrl ? (
              <img
                src={form.imageUrl}
                alt=""
                className="h-full w-full object-cover"
                onError={(event) => {
                  event.currentTarget.style.display = 'none'
                }}
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 to-transparent" />
            <span className="badge absolute left-3 top-3 bg-white/95 text-slate-700">
              {form.category || 'General'}
            </span>
            <span className="badge absolute right-3 top-3 bg-slate-900/80 text-white">
              {form.published ? <><Eye className="h-3 w-3" /> Published</> : <><EyeOff className="h-3 w-3" /> Draft</>}
            </span>
          </div>
          <div className="p-5">
            <h3 className="text-lg font-bold leading-snug text-slate-900">
              {form.title || 'Your course title'}
            </h3>
            <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-slate-500">
              {form.description || 'Your course description will appear here. Make it clear and inviting.'}
            </p>
          </div>
        </aside>
      </form>
    </div>
  )
}
