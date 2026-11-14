import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Clock3,
  History,
  MinusCircle,
  RotateCcw,
  Trophy,
  XCircle,
} from 'lucide-react'
import api, { getErrorMessage } from '../../api/client'
import { ErrorAlert } from '../../components/Feedback'
import { PageLoader } from '../../components/Loading'
import ProgressBar from '../../components/ProgressBar'
import { formatDateTime, formatDuration, formatMarks } from '../../api/helpers'

export default function MockTestResult() {
  const { testId, attemptId } = useParams()
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    api
      .get(`/student/mock-attempts/${attemptId}/result`)
      .then(({ data }) => {
        if (active) setResult(data)
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err, 'Could not load this result.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [attemptId])

  if (loading) return <PageLoader label="Loading your result..." />
  if (!result) {
    return (
      <div className="page-enter mx-auto max-w-3xl">
        <Link
          to="/student/mock-tests"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-indigo-600"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Mock Tests
        </Link>
        <ErrorAlert message={error || 'Result not found.'} />
      </div>
    )
  }

  const progress = Math.max(0, Math.min(100, result.percentage))

  return (
    <div className="page-enter">
      <Link
        to="/student/mock-tests"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-indigo-600"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Mock Tests
      </Link>

      <section
        className={`card overflow-hidden ${
          result.passed
            ? 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-white'
            : 'border-rose-200 bg-gradient-to-br from-rose-50 to-white'
        }`}
      >
        <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
              {result.category} · Result
            </p>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              {result.testTitle}
            </h1>
            <div className="mt-3 flex flex-wrap gap-2">
              <span
                className={`badge ${
                  result.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                }`}
              >
                {result.passed ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                {result.passed ? 'Passed' : 'Needs more practice'}
              </span>
              {result.status === 'AUTO_SUBMITTED' && (
                <span className="badge bg-amber-100 text-amber-700">
                  <Clock3 className="h-3 w-3" /> Auto-submitted at time limit
                </span>
              )}
              <span className="badge bg-white text-slate-600 ring-1 ring-slate-200">
                Submitted {formatDateTime(result.submittedAt)}
              </span>
            </div>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-600">
              {result.passed
                ? 'You cleared the 40% pass mark. Review the explanations below and try to improve your speed on the next attempt.'
                : 'You did not reach the 40% pass mark this time. Review every answer below and retake the test when you are ready.'}
            </p>
          </div>

          <div className="flex items-center gap-5 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Score</p>
              <p className="mt-1 text-3xl font-extrabold text-slate-900">
                {formatMarks(result.score)}
                <span className="text-base font-semibold text-slate-400"> / {formatMarks(result.totalMarks)}</span>
              </p>
            </div>
            <div className="h-12 w-px bg-slate-200" />
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Percentage</p>
              <p className={`mt-1 text-3xl font-extrabold ${result.passed ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatMarks(result.percentage)}%
              </p>
            </div>
          </div>
        </div>
        <div className="px-6 pb-6 sm:px-8">
          <ProgressBar value={progress} />
        </div>
      </section>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="card px-4 py-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Correct</p>
          <p className="mt-1 flex items-center gap-2 text-xl font-extrabold text-emerald-600">
            <CheckCircle2 className="h-5 w-5" /> {result.correctCount}
          </p>
        </div>
        <div className="card px-4 py-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Wrong</p>
          <p className="mt-1 flex items-center gap-2 text-xl font-extrabold text-rose-600">
            <XCircle className="h-5 w-5" /> {result.wrongCount}
          </p>
        </div>
        <div className="card px-4 py-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Unanswered</p>
          <p className="mt-1 flex items-center gap-2 text-xl font-extrabold text-slate-500">
            <MinusCircle className="h-5 w-5" /> {result.unansweredCount}
          </p>
        </div>
        <div className="card px-4 py-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Time taken</p>
          <p className="mt-1 flex items-center gap-2 text-xl font-extrabold text-indigo-600">
            <Clock3 className="h-5 w-5" /> {formatDuration(result.timeTakenSeconds)}
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link to={`/student/mock-tests/${testId}/start`} className="btn-primary">
          <RotateCcw className="h-4 w-4" /> Retake test
        </Link>
        <Link to={`/student/mock-tests/${testId}/history`} className="btn-secondary">
          <History className="h-4 w-4" /> Attempt history
        </Link>
        <Link to={`/student/mock-tests/${testId}/leaderboard`} className="btn-secondary">
          <BarChart3 className="h-4 w-4" /> Leaderboard
        </Link>
        <Link to="/student/mock-tests" className="btn-ghost">
          <Trophy className="h-4 w-4" /> All mock tests
        </Link>
      </div>

      <section className="mt-8">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Question review</h2>
            <p className="mt-1 text-sm text-slate-500">Your answer is shown beside the correct answer for every question.</p>
          </div>
          <span className="badge bg-slate-100 text-slate-600">{result.answers.length} questions</span>
        </div>

        <div className="space-y-4">
          {result.answers.map((answer, index) => (
            <article key={answer.questionId} className="card p-5">
              <div className="flex items-start gap-3">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-extrabold text-white ${
                    answer.correct ? 'bg-emerald-500' : answer.answered ? 'bg-rose-500' : 'bg-slate-400'
                  }`}
                >
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="text-sm font-bold leading-snug text-slate-900">{answer.questionText}</p>
                    <span
                      className={`badge shrink-0 ${
                        answer.correct
                          ? 'bg-emerald-50 text-emerald-700'
                          : answer.answered
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {answer.correct ? 'Correct' : answer.answered ? 'Wrong' : 'Unanswered'}
                      {' · '}
                      {formatMarks(answer.marksAwarded)} marks
                    </span>
                  </div>

                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <div
                      className={`rounded-xl border px-3 py-2.5 text-xs ${
                        answer.correct
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                          : 'border-rose-200 bg-rose-50 text-rose-800'
                      }`}
                    >
                      <p className="font-bold uppercase tracking-wide opacity-70">Your answer</p>
                      <p className="mt-1 font-semibold">{answer.studentAnswer || 'Not answered'}</p>
                    </div>
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-800">
                      <p className="font-bold uppercase tracking-wide opacity-70">Correct answer</p>
                      <p className="mt-1 font-semibold">{answer.correctAnswer}</p>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
