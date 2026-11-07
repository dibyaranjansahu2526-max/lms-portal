import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ClipboardList,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  X,
} from 'lucide-react'
import api, { getErrorMessage } from '../../api/client'
import { EmptyState, ErrorAlert, SuccessAlert } from '../../components/Feedback'
import { ButtonLoader, PageLoader } from '../../components/Loading'
import PageHeader from '../../components/PageHeader'

const blankOption = () => ({ text: '', correct: false })
const blankQuestion = () => ({ text: '', options: [blankOption(), blankOption()] })
const emptyQuiz = () => ({
  title: '',
  description: '',
  passingScore: 60,
  questions: [blankQuestion()],
})

export default function QuizBuilder() {
  const { courseId } = useParams()
  const [course, setCourse] = useState(null)
  const [quizzes, setQuizzes] = useState([])
  const [form, setForm] = useState(emptyQuiz)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadData = async () => {
    const [courseResponse, quizResponse] = await Promise.all([
      api.get(`/courses/${courseId}`),
      api.get(`/teacher/courses/${courseId}/quizzes`),
    ])
    setCourse(courseResponse.data)
    setQuizzes(quizResponse.data)
    return quizResponse.data
  }

  useEffect(() => {
    let active = true
    setLoading(true)
    Promise.all([api.get(`/courses/${courseId}`), api.get(`/teacher/courses/${courseId}/quizzes`)])
      .then(([courseResponse, quizResponse]) => {
        if (!active) return
        setCourse(courseResponse.data)
        setQuizzes(quizResponse.data)
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err, 'Could not load quizzes.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [courseId])

  const resetForm = () => {
    setEditingId(null)
    setForm(emptyQuiz())
    setError('')
  }

  const startEdit = (quiz) => {
    setEditingId(quiz.id)
    setForm({
      title: quiz.title,
      description: quiz.description || '',
      passingScore: quiz.passingScore,
      questions: quiz.questions.map((question) => ({
        text: question.text,
        options: question.options.map((option) => ({ text: option.text, correct: option.correct })),
      })),
    })
    setError('')
    setSuccess('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const updateForm = (patch) => setForm((current) => ({ ...current, ...patch }))

  const updateQuestion = (questionIndex, patch) => {
    setForm((current) => ({
      ...current,
      questions: current.questions.map((question, index) =>
        index === questionIndex ? { ...question, ...patch } : question,
      ),
    }))
  }

  const addQuestion = () => {
    setForm((current) => ({ ...current, questions: [...current.questions, blankQuestion()] }))
  }

  const removeQuestion = (questionIndex) => {
    setForm((current) => ({
      ...current,
      questions: current.questions.filter((_, index) => index !== questionIndex),
    }))
  }

  const addOption = (questionIndex) => {
    setForm((current) => ({
      ...current,
      questions: current.questions.map((question, index) =>
        index === questionIndex ? { ...question, options: [...question.options, blankOption()] } : question,
      ),
    }))
  }

  const removeOption = (questionIndex, optionIndex) => {
    setForm((current) => ({
      ...current,
      questions: current.questions.map((question, index) =>
        index === questionIndex
          ? { ...question, options: question.options.filter((_, oi) => oi !== optionIndex) }
          : question,
      ),
    }))
  }

  const updateOption = (questionIndex, optionIndex, patch) => {
    setForm((current) => ({
      ...current,
      questions: current.questions.map((question, index) =>
        index === questionIndex
          ? {
              ...question,
              options: question.options.map((option, oi) =>
                oi === optionIndex ? { ...option, ...patch } : option,
              ),
            }
          : question,
      ),
    }))
  }

  const markCorrect = (questionIndex, optionIndex) => {
    setForm((current) => ({
      ...current,
      questions: current.questions.map((question, index) =>
        index === questionIndex
          ? {
              ...question,
              options: question.options.map((option, oi) => ({ ...option, correct: oi === optionIndex })),
            }
          : question,
      ),
    }))
  }

  const validate = () => {
    if (!form.title.trim()) return 'Quiz title is required.'
    if (!Number.isFinite(Number(form.passingScore)) || Number(form.passingScore) < 1 || Number(form.passingScore) > 100) {
      return 'Passing score must be between 1 and 100.'
    }
    for (let qi = 0; qi < form.questions.length; qi++) {
      const question = form.questions[qi]
      if (!question.text.trim()) return `Question ${qi + 1} needs text.`
      if (question.options.length < 2) return `Question ${qi + 1} needs at least two options.`
      if (question.options.some((option) => !option.text.trim())) {
        return `Every option in question ${qi + 1} needs text.`
      }
      if (question.options.filter((option) => option.correct).length !== 1) {
        return `Mark exactly one correct option in question ${qi + 1}.`
      }
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
        passingScore: Number(form.passingScore),
      }
      if (editingId) {
        await api.put(`/teacher/quizzes/${editingId}`, payload)
        setSuccess('Quiz updated. Previous attempts for this quiz were cleared.')
      } else {
        await api.post(`/teacher/courses/${courseId}/quizzes`, payload)
        setSuccess('Quiz created.')
      }
      await loadData()
      resetForm()
    } catch (err) {
      setError(getErrorMessage(err, 'Could not save the quiz.'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (quiz) => {
    if (!window.confirm(`Delete quiz "${quiz.title}"? Student attempts will also be removed.`)) return
    setDeletingId(quiz.id)
    setError('')
    setSuccess('')
    try {
      await api.delete(`/teacher/quizzes/${quiz.id}`)
      await loadData()
      if (editingId === quiz.id) resetForm()
      setSuccess('Quiz deleted.')
    } catch (err) {
      setError(getErrorMessage(err, 'Could not delete the quiz.'))
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) return <PageLoader label="Loading quiz builder..." />

  return (
    <div className="page-enter">
      <Link
        to="/teacher/courses"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-indigo-600"
      >
        <ArrowLeft className="h-4 w-4" /> Back to My Courses
      </Link>

      <PageHeader
        eyebrow="Assessment builder"
        title="Quiz builder"
        description={course ? `${course.title} · ${quizzes.length} quizzes` : 'Create quizzes that check student understanding.'}
        action={
          editingId ? (
            <button type="button" onClick={resetForm} className="btn-secondary">
              <RotateCcw className="h-4 w-4" /> New quiz
            </button>
          ) : null
        }
      />

      <ErrorAlert message={error} className="mb-5" />
      <SuccessAlert message={success} className="mb-5" />

      <div className="grid items-start gap-6 xl:grid-cols-[1.25fr_1fr]">
        <form onSubmit={handleSubmit} className="card p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">{editingId ? 'Edit quiz' : 'Create a quiz'}</h2>
              <p className="mt-1 text-xs text-slate-400">Every question needs one correct answer.</p>
            </div>
            {editingId && (
              <span className="badge bg-amber-50 text-amber-700">
                <Pencil className="h-3 w-3" /> Editing
              </span>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="label" htmlFor="quiz-title">
                Quiz title
              </label>
              <input
                id="quiz-title"
                type="text"
                required
                maxLength={180}
                value={form.title}
                onChange={(event) => updateForm({ title: event.target.value })}
                className="input"
                placeholder="e.g. Module 1 knowledge check"
              />
            </div>

            <div>
              <label className="label" htmlFor="quiz-description">
                Description
              </label>
              <textarea
                id="quiz-description"
                rows={3}
                maxLength={1000}
                value={form.description}
                onChange={(event) => updateForm({ description: event.target.value })}
                className="input resize-none"
                placeholder="A short description of what this quiz covers."
              />
            </div>

            <div className="max-w-xs">
              <label className="label" htmlFor="passing-score">
                Passing score (%)
              </label>
              <input
                id="passing-score"
                type="number"
                min={1}
                max={100}
                required
                value={form.passingScore}
                onChange={(event) => updateForm({ passingScore: event.target.value })}
                className="input"
              />
            </div>
          </div>

          <div className="mt-7 space-y-5">
            {form.questions.map((question, questionIndex) => (
              <div key={questionIndex} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-xs font-extrabold text-white">
                      {questionIndex + 1}
                    </span>
                    <p className="text-sm font-bold text-slate-800">Question {questionIndex + 1}</p>
                  </div>
                  {form.questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeQuestion(questionIndex)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                      aria-label="Remove question"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  required
                  value={question.text}
                  onChange={(event) => updateQuestion(questionIndex, { text: event.target.value })}
                  className="input mt-3 bg-white"
                  placeholder="Enter the question"
                />

                <p className="mb-2 mt-4 text-xs font-bold uppercase tracking-wide text-slate-400">
                  Options · select the correct one
                </p>
                <div className="space-y-2">
                  {question.options.map((option, optionIndex) => (
                    <div key={optionIndex} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => markCorrect(questionIndex, optionIndex)}
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition ${
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
                        value={option.text}
                        onChange={(event) =>
                          updateOption(questionIndex, optionIndex, { text: event.target.value })
                        }
                        className={`input bg-white ${option.correct ? '!border-emerald-300 !ring-2 !ring-emerald-50' : ''}`}
                        placeholder={`Option ${optionIndex + 1}`}
                      />
                      {question.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeOption(questionIndex, optionIndex)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                          aria-label="Remove option"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => addOption(questionIndex)}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700"
                >
                  <Plus className="h-3.5 w-3.5" /> Add option
                </button>
              </div>
            ))}
          </div>

          <button type="button" onClick={addQuestion} className="btn-secondary mt-5 w-full">
            <Plus className="h-4 w-4" /> Add another question
          </button>

          <div className="mt-5 flex flex-col gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <button type="button" onClick={resetForm} className="btn-secondary">
              Clear
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? <ButtonLoader /> : <><Save className="h-4 w-4" /> {editingId ? 'Save quiz' : 'Create quiz'}</>}
            </button>
          </div>
        </form>

        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-slate-900">Existing quizzes</h2>
            <span className="badge bg-slate-100 text-slate-600">{quizzes.length}</span>
          </div>

          {quizzes.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No quizzes yet"
              description="Create your first quiz to test what students have learned."
            />
          ) : (
            <div className="space-y-4">
              {quizzes.map((quiz) => (
                <article key={quiz.id} className="card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-slate-900">{quiz.title}</h3>
                      <p className="mt-1 text-xs text-slate-500">
                        {quiz.questions.length} questions · pass at {quiz.passingScore}%
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={() => startEdit(quiz)}
                        className="rounded-lg p-2 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600"
                        aria-label="Edit quiz"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(quiz)}
                        disabled={deletingId === quiz.id}
                        className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                        aria-label="Delete quiz"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    {quiz.questions.map((question, index) => (
                      <div key={question.id} className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs font-bold text-slate-700">
                          {index + 1}. {question.text}
                        </p>
                        <div className="mt-2 grid gap-1.5">
                          {question.options.map((option) => (
                            <div
                              key={option.id}
                              className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs ${
                                option.correct
                                  ? 'bg-emerald-100/80 font-semibold text-emerald-800'
                                  : 'bg-white text-slate-500'
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
