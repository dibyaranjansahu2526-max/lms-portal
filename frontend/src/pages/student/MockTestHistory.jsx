import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, BarChart3, Clock3, History, Play, Trophy } from 'lucide-react'
import api, { getErrorMessage } from '../../api/client'
import { EmptyState, ErrorAlert } from '../../components/Feedback'
import { PageLoader } from '../../components/Loading'
import { formatDateTime, formatDuration, formatMarks } from '../../api/helpers'

export default function MockTestHistory() {
  const { testId } = useParams()
  const [history, setHistory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    api
      .get(`/student/mock-tests/${testId}/attempts`)
      .then(({ data }) => {
        if (active) setHistory(data)
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err, 'Could not load attempt history.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [testId])

  if (loading) return <PageLoader label="Loading attempt history..." />
  if (!history) {
    return (
      <div className="page-enter mx-auto max-w-3xl">
        <Link
          to="/student/mock-tests"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-indigo-600"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Mock Tests
        </Link>
        <ErrorAlert message={error || 'Attempt history not found.'} />
      </div>
    )
  }

  const bestScore = history.attempts.length
    ? Math.max(...history.attempts.map((attempt) => attempt.score))
    : null

  return (
    <div className="page-enter">
      <Link
        to="/student/mock-tests"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-indigo-600"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Mock Tests
      </Link>

      <div className="card overflow-hidden">
        <div className="bg-slate-950 px-6 py-6 text-white sm:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-300">Attempt history</p>
              <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">{history.testTitle}</h1>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="badge bg-white/10 text-slate-200">{history.category}</span>
                <span className="badge bg-white/10 text-slate-200">{formatMarks(history.totalMarks)} marks</span>
                <span className="badge bg-white/10 text-slate-200">{history.durationMinutes} minutes</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Link to={`/student/mock-tests/${testId}/start`} className="btn-primary !bg-white !text-slate-900 hover:!bg-slate-100">
                <Play className="h-4 w-4" /> Start test
              </Link>
              <Link to={`/student/mock-tests/${testId}/leaderboard`} className="btn-secondary !border-white/20 !bg-white/10 !text-white hover:!bg-white/20">
                <BarChart3 className="h-4 w-4" /> Leaderboard
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 divide-x divide-slate-100 sm:grid-cols-3">
          <div className="px-5 py-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Attempts</p>
            <p className="mt-1 flex items-center gap-2 text-xl font-extrabold text-slate-900">
              <History className="h-5 w-5 text-indigo-500" /> {history.attempts.length}
            </p>
          </div>
          <div className="px-5 py-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Best score</p>
            <p className="mt-1 flex items-center gap-2 text-xl font-extrabold text-slate-900">
              <Trophy className="h-5 w-5 text-amber-500" />
              {bestScore === null ? '—' : `${formatMarks(bestScore)} / ${formatMarks(history.totalMarks)}`}
            </p>
          </div>
          <div className="col-span-2 px-5 py-4 sm:col-span-1">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Pass mark</p>
            <p className="mt-1 flex items-center gap-2 text-xl font-extrabold text-slate-900">
              <Clock3 className="h-5 w-5 text-emerald-500" /> 40%
            </p>
          </div>
        </div>
      </div>

      <ErrorAlert message={error} className="mt-5" />

      {history.attempts.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={History}
            title="No attempts yet"
            description="Start this mock test to see your score history and track your improvement."
            action={
              <Link to={`/student/mock-tests/${testId}/start`} className="btn-primary">
                <Play className="h-4 w-4" /> Start test
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Attempt</th>
                  <th className="px-4 py-3">Submitted</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Correct</th>
                  <th className="px-4 py-3">Wrong</th>
                  <th className="px-4 py-3">Skipped</th>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.attempts.map((attempt, index) => (
                  <tr key={attempt.attemptId} className="hover:bg-slate-50/70">
                    <td className="whitespace-nowrap px-4 py-3 font-bold text-slate-800">#{history.attempts.length - index}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">{formatDateTime(attempt.submittedAt)}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <p className="font-extrabold text-slate-900">
                        {formatMarks(attempt.score)} <span className="font-medium text-slate-400">/ {formatMarks(attempt.totalMarks)}</span>
                      </p>
                      <p className={`text-xs font-bold ${attempt.passed ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {formatMarks(attempt.percentage)}%
                      </p>
                    </td>
                    <td className="px-4 py-3 font-semibold text-emerald-600">{attempt.correctCount}</td>
                    <td className="px-4 py-3 font-semibold text-rose-600">{attempt.wrongCount}</td>
                    <td className="px-4 py-3 font-semibold text-slate-500">{attempt.unansweredCount}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs font-semibold text-slate-500">{formatDuration(attempt.timeTakenSeconds)}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className={`badge ${attempt.passed ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                        {attempt.status === 'AUTO_SUBMITTED' ? 'Auto' : attempt.passed ? 'Passed' : 'Failed'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <Link
                        to={`/student/mock-tests/${testId}/results/${attempt.attemptId}`}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                      >
                        View result
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
