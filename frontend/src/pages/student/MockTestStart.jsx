import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Flag,
  Send,
  X,
} from 'lucide-react'
import api, { getErrorMessage } from '../../api/client'
import { ErrorAlert } from '../../components/Feedback'
import { ButtonLoader, PageLoader } from '../../components/Loading'
import { formatClock, formatMarks } from '../../api/helpers'

export default function MockTestStart() {
  const { testId } = useParams()
  const navigate = useNavigate()
  const [attempt, setAttempt] = useState(null)
  const [answers, setAnswers] = useState({})
  const [marked, setMarked] = useState(() => new Set())
  const [current, setCurrent] = useState(0)
  const [remaining, setRemaining] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [timeUp, setTimeUp] = useState(false)
  const startPromiseRef = useRef(null)
  const autoTriggeredRef = useRef(false)
  const submitRef = useRef(null)

  const submitAttempt = async (auto = false) => {
    if (!attempt || submitting) return
    setSubmitting(true)
    setConfirmOpen(false)
    setError('')
    try {
      const payload = {
        answers: Object.entries(answers).map(([questionId, optionId]) => ({
          questionId: Number(questionId),
          optionId: Number(optionId),
        })),
      }
      await api.post(`/student/mock-attempts/${attempt.attemptId}/submit`, payload)
      navigate(`/student/mock-tests/${testId}/results/${attempt.attemptId}`, { replace: true })
    } catch (err) {
      setError(getErrorMessage(err, 'Could not submit your test. Please try again.'))
      if (auto) setTimeUp(true)
    } finally {
      setSubmitting(false)
    }
  }
  submitRef.current = submitAttempt

  useEffect(() => {
    let active = true
    setLoading(true)
    if (!startPromiseRef.current) {
      startPromiseRef.current = api.post(`/student/mock-tests/${testId}/attempts`)
    }
    startPromiseRef.current
      .then(({ data }) => {
        if (!active) return
        setAttempt(data)
        setRemaining(data.remainingSeconds)
        const saved = {}
        for (const answer of data.savedAnswers || []) {
          saved[answer.questionId] = answer.optionId
        }
        setAnswers(saved)
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err, 'Could not start this mock test.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [testId])

  useEffect(() => {
    if (!attempt) return
    const deadline = Date.now() + Math.max(0, attempt.remainingSeconds) * 1000
    const tick = () => {
      const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000))
      setRemaining(left)
      if (left === 0 && !autoTriggeredRef.current) {
        autoTriggeredRef.current = true
        setTimeUp(true)
        submitRef.current?.(true)
      }
    }
    tick()
    const interval = window.setInterval(tick, 1000)
    return () => window.clearInterval(interval)
  }, [attempt])

  useEffect(() => {
    if (!attempt) return
    const warnBeforeUnload = (event) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warnBeforeUnload)
    return () => window.removeEventListener('beforeunload', warnBeforeUnload)
  }, [attempt])

  const selectOption = (questionId, optionId) => {
    setAnswers((currentAnswers) => ({ ...currentAnswers, [questionId]: optionId }))
    if (!attempt) return
    api
      .put(`/student/mock-attempts/${attempt.attemptId}/answers/${questionId}`, { optionId })
      .catch((err) => {
        setError(getErrorMessage(err, 'Could not save that answer.'))
      })
  }

  const toggleMark = (questionId) => {
    setMarked((currentMarked) => {
      const next = new Set(currentMarked)
      if (next.has(questionId)) next.delete(questionId)
      else next.add(questionId)
      return next
    })
  }

  if (loading) return <PageLoader label="Preparing your mock test..." />
  if (!attempt) {
    return (
      <div className="page-enter mx-auto max-w-3xl">
        <Link
          to="/student/mock-tests"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-indigo-600"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Mock Tests
        </Link>
        <ErrorAlert message={error || 'Mock test not found.'} />
      </div>
    )
  }

  const questions = attempt.questions
  const currentQuestion = questions[current]
  const answeredCount = Object.keys(answers).length
  const unansweredCount = questions.length - answeredCount
  const markedCount = marked.size
  const isLast = current === questions.length - 1
  const timerDanger = remaining <= 60

  return (
    <div className="page-enter">
      <Link
        to="/student/mock-tests"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-indigo-600"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Mock Tests
      </Link>

      <ErrorAlert message={error} className="mb-5" />

      <div className="card mb-5 overflow-hidden">
        <div className="flex flex-col gap-4 bg-slate-950 px-5 py-5 text-white sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-300">Mock test in progress</p>
            <h1 className="mt-1.5 text-xl font-extrabold tracking-tight sm:text-2xl">{attempt.title}</h1>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="badge bg-white/10 text-slate-200">{attempt.category}</span>
              <span className="badge bg-white/10 text-slate-200">{questions.length} questions</span>
              <span className="badge bg-white/10 text-slate-200">{formatMarks(attempt.totalMarks)} marks</span>
              <span className="badge bg-white/10 text-slate-200">{attempt.durationMinutes} minutes</span>
            </div>
          </div>
          <div
            className={`flex items-center gap-3 rounded-2xl px-4 py-3 ring-1 ${
              timerDanger
                ? 'bg-rose-500/15 text-rose-200 ring-rose-400/30'
                : 'bg-white/10 text-white ring-white/15'
            }`}
          >
            <Clock3 className="h-5 w-5" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] opacity-70">Time left</p>
              <p className="font-mono text-2xl font-extrabold tabular-nums">{formatClock(remaining)}</p>
            </div>
          </div>
        </div>
        {timeUp && (
          <div className="flex items-center gap-2 border-b border-amber-100 bg-amber-50 px-5 py-3 text-sm font-semibold text-amber-800 sm:px-6">
            <AlertTriangle className="h-4 w-4" />
            Time is up. Your saved answers are being submitted automatically.
          </div>
        )}
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[1fr_300px]">
        <div className="card p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-extrabold text-white">
                {current + 1}
              </span>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Question {current + 1} of {questions.length}
              </p>
            </div>
            {marked.has(currentQuestion.id) && (
              <span className="badge bg-amber-50 text-amber-700">
                <Flag className="h-3 w-3" /> Marked
              </span>
            )}
          </div>

          <h2 className="mt-5 text-lg font-bold leading-snug text-slate-900 sm:text-xl">
            {currentQuestion.text}
          </h2>

          <div className="mt-5 space-y-2.5">
            {currentQuestion.options.map((option, optionIndex) => {
              const selected = answers[currentQuestion.id] === option.id
              return (
                <label
                  key={option.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition ${
                    selected
                      ? 'border-indigo-300 bg-indigo-50 text-indigo-900 ring-2 ring-indigo-100'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    value={option.id}
                    checked={selected}
                    onChange={() => selectOption(currentQuestion.id, option.id)}
                    className="h-4 w-4 accent-indigo-600"
                  />
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100 text-[11px] font-extrabold text-slate-500">
                    {String.fromCharCode(65 + optionIndex)}
                  </span>
                  <span className="font-medium">{option.text}</span>
                  {selected && <Check className="ml-auto h-4 w-4 text-indigo-600" />}
                </label>
              )
            })}
          </div>

          <div className="mt-6 flex flex-col gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => setCurrent((index) => Math.max(0, index - 1))}
              disabled={current === 0}
              className="btn-secondary"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </button>

            <button
              type="button"
              onClick={() => toggleMark(currentQuestion.id)}
              className={`btn-secondary ${marked.has(currentQuestion.id) ? '!border-amber-200 !bg-amber-50 !text-amber-700' : ''}`}
            >
              <Bookmark className="h-4 w-4" />
              {marked.has(currentQuestion.id) ? 'Unmark review' : 'Mark for review'}
            </button>

            {isLast ? (
              <button type="button" onClick={() => setConfirmOpen(true)} className="btn-primary">
                <Send className="h-4 w-4" /> Submit test
              </button>
            ) : (
              <button type="button" onClick={() => setCurrent((index) => Math.min(questions.length - 1, index + 1))} className="btn-primary">
                Next <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <aside className="card p-5 lg:sticky lg:top-24">
          <h2 className="text-sm font-extrabold uppercase tracking-wide text-slate-500">Question navigator</h2>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-emerald-50 px-2.5 py-2 text-center">
              <p className="text-lg font-extrabold text-emerald-700">{answeredCount}</p>
              <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-600">Answered</p>
            </div>
            <div className="rounded-xl bg-slate-100 px-2.5 py-2 text-center">
              <p className="text-lg font-extrabold text-slate-700">{unansweredCount}</p>
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Unanswered</p>
            </div>
            <div className="rounded-xl bg-amber-50 px-2.5 py-2 text-center">
              <p className="text-lg font-extrabold text-amber-700">{markedCount}</p>
              <p className="text-[10px] font-bold uppercase tracking-wide text-amber-600">Marked</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-5 gap-2">
            {questions.map((question, index) => {
              const isCurrent = index === current
              const isAnswered = Boolean(answers[question.id])
              const isMarked = marked.has(question.id)
              return (
                <button
                  key={question.id}
                  type="button"
                  onClick={() => setCurrent(index)}
                  className={`flex h-9 items-center justify-center rounded-lg text-xs font-extrabold transition ${
                    isMarked
                      ? 'bg-amber-400 text-amber-950'
                      : isAnswered
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  } ${isCurrent ? 'ring-2 ring-indigo-500 ring-offset-1' : ''}`}
                  aria-label={`Go to question ${index + 1}`}
                >
                  {index + 1}
                </button>
              )
            })}
          </div>

          <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
            <p className="flex items-center gap-2">
              <span className="h-3 w-3 rounded bg-emerald-500" /> Answered
            </p>
            <p className="flex items-center gap-2">
              <span className="h-3 w-3 rounded bg-slate-200" /> Unanswered
            </p>
            <p className="flex items-center gap-2">
              <span className="h-3 w-3 rounded bg-amber-400" /> Marked for review
            </p>
          </div>

          <button type="button" onClick={() => setConfirmOpen(true)} className="btn-primary mt-5 w-full">
            <Send className="h-4 w-4" /> Submit test
          </button>
        </aside>
      </div>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">Submit mock test?</h2>
                <p className="mt-1 text-sm text-slate-500">
                  You will not be able to change your answers after submitting.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close confirmation"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-emerald-50 px-3 py-2.5 text-center">
                <p className="text-xl font-extrabold text-emerald-700">{answeredCount}</p>
                <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-600">Answered</p>
              </div>
              <div className="rounded-xl bg-slate-100 px-3 py-2.5 text-center">
                <p className="text-xl font-extrabold text-slate-700">{unansweredCount}</p>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Unanswered</p>
              </div>
              <div className="rounded-xl bg-amber-50 px-3 py-2.5 text-center">
                <p className="text-xl font-extrabold text-amber-700">{markedCount}</p>
                <p className="text-[10px] font-bold uppercase tracking-wide text-amber-600">Marked</p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setConfirmOpen(false)} className="btn-secondary">
                Keep working
              </button>
              <button
                type="button"
                onClick={() => submitAttempt(false)}
                disabled={submitting}
                className="btn-primary"
              >
                {submitting ? <ButtonLoader label="Submitting..." /> : <><CheckCircle2 className="h-4 w-4" /> Submit test</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {submitting && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-2xl bg-white px-5 py-4 shadow-2xl">
            <ButtonLoader label="Submitting your test..." />
          </div>
        </div>
      )}
    </div>
  )
}
