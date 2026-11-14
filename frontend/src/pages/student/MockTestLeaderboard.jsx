import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Clock3, History, Medal, Play, Trophy } from 'lucide-react'
import api, { getErrorMessage } from '../../api/client'
import { EmptyState, ErrorAlert } from '../../components/Feedback'
import { PageLoader } from '../../components/Loading'
import { formatDateTime, formatDuration, formatMarks } from '../../api/helpers'

const RANK_STYLES = [
  'bg-amber-100 text-amber-700 ring-amber-200',
  'bg-slate-100 text-slate-600 ring-slate-200',
  'bg-orange-100 text-orange-700 ring-orange-200',
]

export default function MockTestLeaderboard() {
  const { testId } = useParams()
  const [leaderboard, setLeaderboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    api
      .get(`/student/mock-tests/${testId}/leaderboard`)
      .then(({ data }) => {
        if (active) setLeaderboard(data)
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err, 'Could not load the leaderboard.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [testId])

  if (loading) return <PageLoader label="Loading leaderboard..." />
  if (!leaderboard) {
    return (
      <div className="page-enter mx-auto max-w-3xl">
        <Link
          to="/student/mock-tests"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-indigo-600"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Mock Tests
        </Link>
        <ErrorAlert message={error || 'Leaderboard not found.'} />
      </div>
    )
  }

  return (
    <div className="page-enter">
      <Link
        to="/student/mock-tests"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-indigo-600"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Mock Tests
      </Link>

      <div className="card overflow-hidden">
        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 px-6 py-7 text-white sm:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-200">Top 10 leaderboard</p>
              <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">{leaderboard.testTitle}</h1>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="badge bg-white/10 text-slate-100">{leaderboard.category}</span>
                <span className="badge bg-white/10 text-slate-100">{formatMarks(leaderboard.totalMarks)} marks</span>
                <span className="badge bg-white/10 text-slate-100">Best attempt per student</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Link to={`/student/mock-tests/${testId}/start`} className="btn-primary !bg-white !text-slate-900 hover:!bg-slate-100">
                <Play className="h-4 w-4" /> Start test
              </Link>
              <Link to={`/student/mock-tests/${testId}/history`} className="btn-secondary !border-white/20 !bg-white/10 !text-white hover:!bg-white/20">
                <History className="h-4 w-4" /> My history
              </Link>
            </div>
          </div>
        </div>

        {leaderboard.entries.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={Trophy}
              title="No scores on the board yet"
              description="Be the first student to complete this mock test and claim the top spot."
              action={
                <Link to={`/student/mock-tests/${testId}/start`} className="btn-primary">
                  <Play className="h-4 w-4" /> Start test
                </Link>
              }
            />
          </div>
        ) : (
          <>
            <div className="grid gap-3 border-b border-slate-100 bg-slate-50/70 p-5 sm:grid-cols-3">
              {leaderboard.entries.slice(0, 3).map((entry) => (
                <div
                  key={entry.rank}
                  className={`rounded-2xl border bg-white p-4 shadow-sm ${
                    entry.rank === 1 ? 'border-amber-200' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-extrabold ring-1 ${RANK_STYLES[entry.rank - 1]}`}>
                      {entry.rank}
                    </span>
                    {entry.rank === 1 ? <Trophy className="h-5 w-5 text-amber-500" /> : <Medal className="h-5 w-5 text-slate-400" />}
                  </div>
                  <p className="mt-3 truncate text-sm font-extrabold text-slate-900">{entry.studentName}</p>
                  <p className="mt-1 text-xl font-extrabold text-indigo-600">
                    {formatMarks(entry.score)}
                    <span className="text-xs font-semibold text-slate-400"> / {formatMarks(entry.totalMarks)}</span>
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                    <Clock3 className="h-3.5 w-3.5" /> {formatDuration(entry.timeTakenSeconds)}
                  </p>
                </div>
              ))}
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-white text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Rank</th>
                    <th className="px-5 py-3">Student</th>
                    <th className="px-5 py-3">Score</th>
                    <th className="px-5 py-3">Percentage</th>
                    <th className="px-5 py-3">Time taken</th>
                    <th className="px-5 py-3">Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leaderboard.entries.map((entry) => (
                    <tr key={entry.rank} className={entry.rank <= 3 ? 'bg-indigo-50/30' : 'hover:bg-slate-50/70'}>
                      <td className="whitespace-nowrap px-5 py-3">
                        <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-extrabold ring-1 ${RANK_STYLES[entry.rank - 1] || 'bg-slate-100 text-slate-500 ring-slate-200'}`}>
                          {entry.rank}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 font-bold text-slate-800">{entry.studentName}</td>
                      <td className="whitespace-nowrap px-5 py-3">
                        <span className="font-extrabold text-slate-900">{formatMarks(entry.score)}</span>
                        <span className="font-medium text-slate-400"> / {formatMarks(entry.totalMarks)}</span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 font-semibold text-indigo-600">{formatMarks(entry.percentage)}%</td>
                      <td className="whitespace-nowrap px-5 py-3 text-xs font-semibold text-slate-500">{formatDuration(entry.timeTakenSeconds)}</td>
                      <td className="whitespace-nowrap px-5 py-3 text-xs text-slate-500">{formatDateTime(entry.submittedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
