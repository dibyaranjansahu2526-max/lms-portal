import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Check,
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
import { formatMarks } from '../../api/helpers'

const blankOption = (correct = false) => ({ text: '', correct })
const blankQuestion = () => ({
  text: '',
  options: [blankOption(true), blankOption(), blankOption(), blankOption()],
})

export default function TeacherMockTestQuestions() {
  const { testId } = useParams()
  const [test, setTest] = useState(null)
  const [form, setForm] = useState(blankQuestion)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadTest = async () => {
    const { data } = await api.get(`/teacher/mock-tests/${testId}`)
    setTest(data)
    return data
  }

  useEffect(() => {
    let active = true
    setLoading(true)
    api
      .get(`/teacher/mock-tests/${testId}`)
      .then(({ data }) => {
        if (active) setTest(data)
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err, 'Could not load this mock test.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [testId])

  const resetForm = () => {
    setEditingId(null)
    setForm(blankQuestion())
    setError('')
  }

  const startEdit = (question) => {
    setEditingId(question.id)
    setForm({
      text: question.text,
      options: question.options.map((option) => ({ text: option.text, correct: option.correct })),
    })
    setError('')
    setSuccess('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const updateText = (text) => setForm((current) => ({ ...current, text }))

  const updateOption = (optionIndex, text) => {
    setForm((current) => ({
      ...current,
      options: current.options.map((option, index) =>
        index === optionIndex ? { ...option, text } : option,
      ),
    }))
  }

  const markCorrect = (optionIndex) => {
    setForm((current) => ({
      ...current,
      options: current.options.map((option, index) => ({ ...option, correct: index === optionIndex })),
    }))
  }

  const validate = () => {
    if (!form.text.trim()) return 'Question text is required.'
    if (form.options.length !== 4) return 'Every question must have exactly four options.'
    if (form.options.some((option) => !option.text.trim())) return 'Every option needs text.'
    if (form.options.filter((option) => option.correct).length !== 1) {
      return 'Mark exactly one correct option.'
    }
    const unique = new Set(form.options.map((option) => option.text.trim().toLowerCase()))
    if (unique.size !== form.options.length) return 'Options in a question must be unique.'
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
        text: form.text,
        options: form.options.map((option) => ({ text: option.text, correct: option.correct })),
      }
      if (editingId) {
        await api.put(`/teacher/mock-tests/${testId}/questions/${editingId}`, payload)
        setSuccess('Question updated.')
      } else {
        await api.post(`/teacher/mock-tests/${testId}/questions`, payload)
        setSuccess('Question added.')
      }
      await loadTest()
      resetForm()
    } catch (err) {
      setError(getErrorMessage(err, 'Could not save the question.'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (question) => {
    if (!window.confirm(`Delete question ${question.order}?`)) return
    setDeletingId(question.id)
    setError('')
    setSuccess('')
    try {
      await api.delete(`/teacher/mock-tests/${testId}/questions/${question.id}`)
      await loadTest()
      if (editingId === question.id) resetForm()
      setSuccess('Question deleted.')
    } catch (err) {
      setError(getErrorMessage(err, 'Could not delete the question.'))
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) return <PageLoader label="Loading mock test..." />
  if (!test) return <ErrorAlert message={error || 'Mock test not found.'} />

  return (
    <div className="page-enter">
      <Link
        to="/teacher/mock-tests"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-indigo-600"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Mock Tests
      </Link>

      <PageHeader
        eyebrow="Question bank"
        title={test.title}
        description={`${test.category} · ${test.questionCount} questions · ${test.durationMinutes} minutes`}
        action={
          editingId ? (
            <button type="button" onClick={resetForm} className="btn-secondary">
              <RotateCcw className="h-4 w-4" /> New question
            </button>
          ) : null
        }
      />

      <ErrorAlert message={error} className="mb-5" />
      <SuccessAlert message={success} className="mb-5" />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="card px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Questions</p>
          <p className="mt-1 flex items-center gap-1.5 text-sm font-bold text-slate-800">
            <FileQuestion className="h-4 w-4 text-indigo-500" /> {test.questionCount}
          </p>
        </div>
        <div className="card px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Duration</p>
          <p className="mt-1 flex items-center gap-1.5 text-sm font-bold text-slate-800">
            <Clock3 className="h-4 w-4 text-indigo-500" /> {test.durationMinutes} min
          </p>
        </div>
        <div className="card px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Total marks</p>
          <p className="mt-1 flex items-center gap-1.5 text-sm font-bold text-slate-800">
            <Trophy className="h-4 w-4 text-indigo-500" /> {formatMarks(test.totalMarks)}
          </p>
        </div>
        <div className="card px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Status</p>
          <p className="mt-1">
            <span className={`badge ${test.published ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
              {test.published ? 'Published' : 'Draft'}
            </span>
          </p>
        </div>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[1fr_1.05fr]">
        <form onSubmit={handleSubmit} className="card p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                {editingId ? 'Edit question' : 'Add a question'}
              </h2>
              <p className="mt-1 text-xs text-slate-400">Exactly four options and one correct answer.</p>
            </div>
            {editingId && (
              <span className="badge bg-amber-50 text-amber-700">
                <Pencil className="h-3 w-3" /> Editing
              </span>
            )}
          </div>

          <div>
            <label className="label" htmlFor="question-text">
              Question
            </label>
            <textarea
              id="question-text"
              required
              rows={3}
              maxLength={1000}
              value={form.text}
              onChange={(event) => updateText(event.target.value)}
              className="input resize-none"
              placeholder="Enter the question text"
            />
          </div>

          <p className="mb-2 mt-5 text-xs font-bold uppercase tracking-wide text-slate-400">
            Options · select the correct one
          </p>
          <div className="space-y-2.5">
            {form.options.map((option, optionIndex) => (
              <div key={optionIndex} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => markCorrect(optionIndex)}
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition ${
                    option.correct
                      ? 'border-emerald-500 bg-emerald-500 text-white'
                      : 'border-slate-300 bg-white text-transparent hover:border-emerald-400'
                  }`}
                  aria-label={`Mark option ${optionIndex + 1} correct`}
                  title="Mark as correct"
                >
                  <Check className="h-4 w-4" />
                </button>
                <input
                  type="text"
                  required
                  maxLength={500}
                  value={option.text}
                  onChange={(event) => updateOption(optionIndex, event.target.value)}
                  className={`input bg-white ${
                    option.correct ? '!border-emerald-300 !ring-2 !ring-emerald-50' : ''
                  }`}
                  placeholder={`Option ${optionIndex + 1}`}
                />
              </div>
            ))}
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
                  <Save className="h-4 w-4" /> {editingId ? 'Save question' : 'Add question'}
                </>
              )}
            </button>
          </div>
        </form>

        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-slate-900">Questions</h2>
            <span className="badge bg-slate-100 text-slate-600">{test.questions.length}</span>
          </div>

          {test.questions.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No questions yet"
              description="Add the first question to make this mock test ready for students."
            />
          ) : (
            <div className="space-y-4">
              {test.questions.map((question) => (
                <article key={question.id} className="card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-xs font-extrabold text-white">
                        {question.order}
                      </span>
                      <p className="pt-0.5 text-sm font-bold leading-snug text-slate-800">{question.text}</p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={() => startEdit(question)}
                        className="rounded-lg p-2 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600"
                        aria-label="Edit question"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(question)}
                        disabled={deletingId === question.id}
                        className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                        aria-label="Delete question"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-1.5">
                    {question.options.map((option) => (
                      <div
                        key={option.id}
                        className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs ${
                          option.correct
                            ? 'bg-emerald-100/80 font-semibold text-emerald-800'
                            : 'bg-slate-50 text-slate-500'
                        }`}
                      >
                        {option.correct ? (
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                        ) : (
                          <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-slate-300" />
                        )}
                        {option.text}
                      </div>
                    ))}
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
