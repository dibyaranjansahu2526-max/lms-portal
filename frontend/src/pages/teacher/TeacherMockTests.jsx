import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileQuestion,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  Trophy,
} from 'lucide-react'
import api, { getErrorMessage } from '../../api/client'
import { EmptyState, ErrorAlert, SuccessAlert } from '../../components/Feedback'
import { ButtonLoader, PageLoader } from '../../components/Loading'
import PageHeader from '../../components/PageHeader'
import { formatDateTime, formatMarks } from '../../api/helpers'

const emptyForm = () => ({
  title: '',
  description: '',
  category: '',
  durationMinutes: 15,
  totalMarks: 10,
  marksPerCorrect: 1,
  negativeMarks: 0,
  published: true,
})

export default function TeacherMockTests() {
  const navigate = useNavigate()
  const [tests, setTests] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadTests = async () => {
    const { data } = await api.get('/teacher/mock-tests')
    setTests(data)
    return data
  }

  useEffect(() => {
    let active = true
    setLoading(true)
    api
      .get('/teacher/mock-tests')
      .then(({ data }) => {
        if (active) setTests(data)
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err, 'Could not load mock tests.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const updateForm = (patch) => setForm((current) => ({ ...current, ...patch }))

  const resetForm = () => {
    setEditingId(null)
    setForm(emptyForm())
    setError('')
  }

  const startEdit = (test) => {
    setEditingId(test.id)
    setForm({
      title: test.title,
      description: test.description || '',
      category: test.category,
      durationMinutes: test.durationMinutes,
      totalMarks: test.totalMarks,
      marksPerCorrect: test.marksPerCorrect,
      negativeMarks: test.negativeMarks,
      published: test.published,
    })
    setError('')
    setSuccess('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const validate = () => {
    if (!form.title.trim()) return 'Test title is required.'
    if (!form.category.trim()) return 'Category is required.'
    if (!Number.isFinite(Number(form.durationMinutes)) || Number(form.durationMinutes) < 1) {
      return 'Duration must be at least 1 minute.'
    }
    if (!Number.isFinite(Number(form.totalMarks)) || Number(form.totalMarks) <= 0) {
      return 'Total marks must be greater than zero.'
    }
    if (!Number.isFinite(Number(form.marksPerCorrect)) || Number(form.marksPerCorrect) <= 0) {
      return 'Marks per correct answer must be greater than zero.'
    }
    if (!Number.isFinite(Number(form.negativeMarks)) || Number(form.negativeMarks) < 0) {
      return 'Negative marks cannot be negative.'
    }
    return ''
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const payload = {
        ...form,
        durationMinutes: Number(form.durationMinutes),
        totalMarks: Number(form.totalMarks),
        marksPerCorrect: Number(form.marksPerCorrect),
        negativeMarks: Number(form.negativeMarks),
      }
      if (editingId) {
        await api.put(`/teacher/mock-tests/${editingId}`, payload)
        await loadTests()
        resetForm()
        setSuccess('Mock test updated.')
      } else {
        const { data } = await api.post('/teacher/mock-tests', payload)
        setSuccess('Mock test created. Add questions next.')
        navigate(`/teacher/mock-tests/${data.id}/questions`)
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Could not save the mock test.'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (test) => {
    if (!window.confirm(`Delete mock test "${test.title}"? Questions and attempts will also be removed.`)) {
      return
    }
    setDeletingId(test.id)
    setError('')
    setSuccess('')
    try {
      await api.delete(`/teacher/mock-tests/${test.id}`)
      await loadTests()
      if (editingId === test.id) resetForm()
      setSuccess('Mock test deleted.')
    } catch (err) {
      setError(getErrorMessage(err, 'Could not delete the mock test.'))
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) return <PageLoader label="Loading mock tests..." />

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="Assessment centre"
        title="Mock tests"
        description="Create timed practice tests, add four-option questions and publish them for students."
        action={
          editingId ? (
            <button type="button" onClick={resetForm} className="btn-secondary">
              <RotateCcw className="h-4 w-4" /> New test
            </button>
          ) : null
        }
      />

      <ErrorAlert message={error} className="mb-5" />
      <SuccessAlert message={success} className="mb-5" />

      <div className="grid items-start gap-6 xl:grid-cols-[1fr_1.05fr]">
        <form onSubmit={handleSubmit} className="card p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                {editingId ? 'Edit mock test' : 'Create a mock test'}
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Set the exam rules, then add questions with exactly four options.
              </p>
            </div>
            {editingId && (
              <span className="badge bg-amber-50 text-amber-700">
                <Pencil className="h-3 w-3" /> Editing
              </span>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="label" htmlFor="mock-title">
                Test title
              </label>
              <input
                id="mock-title"
                type="text"
                required
                maxLength={180}
                value={form.title}
                onChange={(event) => updateForm({ title: event.target.value })}
                className="input"
                placeholder="e.g. Java Basics Mock Test"
              />
            </div>

            <div>
              <label className="label" htmlFor="mock-description">
                Description
              </label>
              <textarea
                id="mock-description"
                rows={3}
                maxLength={2000}
                value={form.description}
                onChange={(event) => updateForm({ description: event.target.value })}
                className="input resize-none"
                placeholder="What does this test cover?"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="mock-category">
                  Category
                </label>
                <input
                  id="mock-category"
                  type="text"
                  required
                  maxLength={100}
                  value={form.category}
                  onChange={(event) => updateForm({ category: event.target.value })}
                  className="input"
                  placeholder="e.g. Programming"
                />
              </div>
              <div>
                <label className="label" htmlFor="mock-duration">
                  Duration (minutes)
                </label>
                <input
                  id="mock-duration"
                  type="number"
                  min={1}
                  max={600}
                  required
                  value={form.durationMinutes}
                  onChange={(event) => updateForm({ durationMinutes: event.target.value })}
                  className="input"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="label" htmlFor="mock-total">
                  Total marks
                </label>
                <input
                  id="mock-total"
                  type="number"
                  min="0.01"
                  step="0.25"
                  required
                  value={form.totalMarks}
                  onChange={(event) => updateForm({ totalMarks: event.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="label" htmlFor="mock-correct">
                  Marks / correct
                </label>
                <input
                  id="mock-correct"
                  type="number"
                  min="0.01"
                  step="0.25"
                  required
                  value={form.marksPerCorrect}
                  onChange={(event) => updateForm({ marksPerCorrect: event.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="label" htmlFor="mock-negative">
                  Negative / wrong
                </label>
                <input
                  id="mock-negative"
                  type="number"
                  min="0"
                  step="0.25"
                  value={form.negativeMarks}
                  onChange={(event) => updateForm({ negativeMarks: event.target.value })}
                  className="input"
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div>
                <p className="text-sm font-bold text-slate-800">Publish test</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Published tests appear in the student mock-test list.
                </p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={form.published}
                  onChange={(event) => updateForm({ published: event.target.checked })}
                  className="peer sr-only"
                />
                <span className="h-6 w-11 rounded-full bg-slate-300 transition peer-checked:bg-indigo-600 peer-focus:ring-4 peer-focus:ring-indigo-100" />
                <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
              </label>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <button type="button" onClick={resetForm} className="btn-secondary">
              Clear
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? (
                <ButtonLoader />
              ) : (
                <>
                  <Save className="h-4 w-4" /> {editingId ? 'Save test' : 'Create test'}
                </>
              )}
            </button>
          </div>
        </form>

        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-slate-900">Your mock tests</h2>
            <span className="badge bg-slate-100 text-slate-600">{tests.length}</span>
          </div>

          {tests.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No mock tests yet"
              description="Create your first timed mock test and add ten questions to get started."
            />
          ) : (
            <div className="space-y-4">
              {tests.map((test) => (
                <article key={test.id} className="card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-slate-900">{test.title}</h3>
                        <span className={`badge ${test.published ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                          {test.published ? 'Published' : 'Draft'}
                        </span>
                      </div>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-indigo-500">
                        {test.category}
                      </p>
                      {test.description && (
                        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-500">{test.description}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={() => startEdit(test)}
                        className="rounded-lg p-2 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600"
                        aria-label="Edit mock test"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(test)}
                        disabled={deletingId === test.id}
                        className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                        aria-label="Delete mock test"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Questions</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-sm font-bold text-slate-800">
                        <FileQuestion className="h-3.5 w-3.5 text-indigo-500" /> {test.questionCount}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Duration</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-sm font-bold text-slate-800">
                        <Clock3 className="h-3.5 w-3.5 text-indigo-500" /> {test.durationMinutes}m
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Total marks</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-sm font-bold text-slate-800">
                        <Trophy className="h-3.5 w-3.5 text-indigo-500" /> {formatMarks(test.totalMarks)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Attempts</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-sm font-bold text-slate-800">
                        <CheckCircle2 className="h-3.5 w-3.5 text-indigo-500" /> {test.attemptCount}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                    <Link to={`/teacher/mock-tests/${test.id}/questions`} className="btn-primary !px-3 !py-2 text-xs">
                      <Plus className="h-3.5 w-3.5" /> Manage questions
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                    <span className="text-xs text-slate-400">
                      +{formatMarks(test.marksPerCorrect)} correct
                      {test.negativeMarks > 0 ? ` · −${formatMarks(test.negativeMarks)} wrong` : ' · no negative marking'}
                    </span>
                    <span className="ml-auto text-[11px] text-slate-400">{formatDateTime(test.createdAt)}</span>
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
