import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BarChart3,
  ClipboardList,
  Clock3,
  FileQuestion,
  History,
  Play,
  Trophy,
} from 'lucide-react'
import api, { getErrorMessage } from '../../api/client'
import { EmptyState, ErrorAlert } from '../../components/Feedback'
import { PageLoader } from '../../components/Loading'
import PageHeader from '../../components/PageHeader'
import { formatMarks } from '../../api/helpers'

export default function StudentMockTests() {
  const [tests, setTests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    api
      .get('/student/mock-tests')
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

  if (loading) return <PageLoader label="Loading mock tests..." />

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="Practice arena"
        title="Mock tests"
        description="Take timed tests, review every answer and compare your score on the leaderboard."
      />

      <ErrorAlert message={error} className="mb-5" />

      {tests.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No mock tests available"
          description="Your teachers have not published any mock tests yet. Check back soon."
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {tests.map((test) => (
            <article key={test.id} className="card flex flex-col overflow-hidden">
              <div className="bg-slate-950 px-5 py-5 text-white">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="badge bg-white/10 text-slate-200">{test.category}</span>
                    <h2 className="mt-3 text-xl font-extrabold tracking-tight">{test.title}</h2>
                  </div>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-200 ring-1 ring-indigo-400/30">
                    <ClipboardList className="h-5 w-5" />
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-400">
                  {test.description || 'A timed mock test to check your understanding.'}
                </p>
              </div>

              <div className="flex flex-1 flex-col p-5">
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-xl bg-slate-50 px-3 py-2.5 text-center">
                    <Clock3 className="mx-auto h-4 w-4 text-indigo-500" />
                    <p className="mt-1 text-sm font-extrabold text-slate-800">{test.durationMinutes}m</p>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Duration</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-3 py-2.5 text-center">
                    <FileQuestion className="mx-auto h-4 w-4 text-indigo-500" />
                    <p className="mt-1 text-sm font-extrabold text-slate-800">{test.questionCount}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Questions</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-3 py-2.5 text-center">
                    <Trophy className="mx-auto h-4 w-4 text-indigo-500" />
                    <p className="mt-1 text-sm font-extrabold text-slate-800">{formatMarks(test.totalMarks)}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Marks</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Your best score</p>
                    <p className="mt-0.5 text-lg font-extrabold text-slate-900">
                      {test.bestScore === null ? (
                        <span className="text-sm font-semibold text-slate-400">Not attempted</span>
                      ) : (
                        <>
                          {formatMarks(test.bestScore)}
                          <span className="text-sm font-semibold text-slate-400"> / {formatMarks(test.totalMarks)}</span>
                        </>
                      )}
                    </p>
                  </div>
                  <span className="badge bg-indigo-50 text-indigo-700">
                    {test.attemptCount} {test.attemptCount === 1 ? 'attempt' : 'attempts'}
                  </span>
                </div>

                <p className="mt-3 text-xs text-slate-400">
                  +{formatMarks(test.marksPerCorrect)} per correct
                  {test.negativeMarks > 0 ? ` · −${formatMarks(test.negativeMarks)} per wrong` : ' · no negative marking'}
                </p>

                <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                  {test.questionCount > 0 ? (
                    <Link to={`/student/mock-tests/${test.id}/start`} className="btn-primary !px-3 !py-2 text-xs">
                      <Play className="h-3.5 w-3.5" /> Start test
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  ) : (
                    <span className="btn-secondary !px-3 !py-2 text-xs opacity-60">Questions coming soon</span>
                  )}
                  <Link to={`/student/mock-tests/${test.id}/history`} className="btn-secondary !px-3 !py-2 text-xs">
                    <History className="h-3.5 w-3.5" /> History
                  </Link>
                  <Link to={`/student/mock-tests/${test.id}/leaderboard`} className="btn-ghost !px-3 !py-2 text-xs">
                    <BarChart3 className="h-3.5 w-3.5" /> Leaderboard
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
