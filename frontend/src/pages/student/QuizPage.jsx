import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Award,
  CheckCircle2,
  ClipboardList,
  Download,
  RotateCcw,
  Trophy,
  XCircle,
} from 'lucide-react'
import api, { downloadCertificate, getErrorMessage } from '../../api/client'
import { ErrorAlert } from '../../components/Feedback'
import { ButtonLoader, PageLoader } from '../../components/Loading'
import ProgressBar from '../../components/ProgressBar'

export default function QuizPage() {
  const { quizId } = useParams()
  const [quiz, setQuiz] = useState(null)
  const [answers, setAnswers] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    let active = true
    api
      .get(`/student/quizzes/${quizId}`)
      .then(({ data }) => {
        if (active) setQuiz(data)
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err, 'Could not load this quiz.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [quizId])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    const unanswered = quiz.questions.filter((question) => !answers[question.id])
    if (unanswered.length > 0) {
      setError(`Please answer all questions. ${unanswered.length} remaining.`)
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        answers: quiz.questions.map((question) => ({
          questionId: question.id,
          optionId: answers[question.id],
        })),
      }
      const { data } = await api.post(`/student/quizzes/${quizId}/attempts`, payload)
      setResult(data)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setError(getErrorMessage(err, 'Could not submit your quiz.'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleCertificate = async () => {
    setDownloading(true)
    setError('')
    try {
      await downloadCertificate(quiz.courseId, `LMS-Certificate-${quiz.courseTitle.replace(/[^a-z0-9]+/gi, '-')}.pdf`)
    } catch (err) {
      setError(getErrorMessage(err, 'Could not download the certificate.'))
    } finally {
      setDownloading(false)
    }
  }

  const retake = () => {
    setResult(null)
    setAnswers({})
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading) return <PageLoader label="Preparing your quiz..." />
  if (!quiz) return <ErrorAlert message={error || 'Quiz not found.'} />

  return (
    <div className="page-enter mx-auto max-w-4xl">
      <Link
        to={`/student/courses/${quiz.courseId}/learn`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-indigo-600"
      >
        <ArrowLeft className="h-4 w-4" /> Back to course
      </Link>

      <ErrorAlert message={error} className="mb-5" />

      {result ? (
        <div className="card overflow-hidden">
          <div
            className={`px-6 py-10 text-center text-white sm:px-10 ${
              result.passed
                ? 'bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500'
                : 'bg-gradient-to-br from-rose-600 via-rose-500 to-orange-500'
            }`}
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
              {result.passed ? <Trophy className="h-8 w-8" /> : <XCircle className="h-8 w-8" />}
            </div>
            <h1 className="mt-5 text-3xl font-extrabold tracking-tight">
              {result.passed ? 'Quiz passed!' : 'Not passed yet'}
            </h1>
            <p className="mt-2 text-sm text-white/80">
              {result.passed
                ? 'Great work — this quiz is now marked as passed.'
                : `You need ${result.passingScore}% to pass. Review the lessons and try again.`}
            </p>
            <p className="mt-6 text-6xl font-extrabold tracking-tight">{result.score}%</p>
            <p className="mt-1 text-sm font-medium text-white/80">
              {result.correctAnswers} of {result.totalQuestions} answers correct
            </p>
          </div>

          <div className="p-6 sm:p-8">
            <ProgressBar value={result.score} />

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-start gap-3">
                {result.passed ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                ) : (
                  <ClipboardList className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                )}
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    {result.courseCompleted
                      ? 'Course complete — certificate unlocked!'
                      : result.passed
                        ? 'Quiz requirement complete'
                        : 'Keep learning'}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-500">
                    {result.courseCompleted
                      ? 'You have completed every lesson and passed every quiz. Download your certificate below.'
                      : result.passed
                        ? 'Your next step is to finish any remaining lessons and pass the other quizzes.'
                        : 'Revisit the course lessons, then return for another attempt. You can retake quizzes as often as you need.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <Link to={`/student/courses/${quiz.courseId}/learn`} className="btn-primary">
                Back to course <ArrowRight className="h-4 w-4" />
              </Link>
              {result.courseCompleted && (
                <button type="button" onClick={handleCertificate} disabled={downloading} className="btn-secondary">
                  <Download className="h-4 w-4" />
                  {downloading ? 'Downloading...' : 'Download certificate'}
                </button>
              )}
              {!result.passed && (
                <button type="button" onClick={retake} className="btn-secondary">
                  <RotateCcw className="h-4 w-4" /> Try again
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="card mb-6 overflow-hidden">
            <div className="bg-slate-950 px-6 py-7 text-white sm:px-8">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-300">Course quiz</p>
              <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">{quiz.title}</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-400">{quiz.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="badge bg-white/10 text-slate-200">{quiz.questions.length} questions</span>
                <span className="badge bg-white/10 text-slate-200">Pass mark: {quiz.passingScore}%</span>
                <span className="badge bg-white/10 text-slate-200">{quiz.courseTitle}</span>
              </div>
            </div>
            {quiz.alreadyPassed && (
              <div className="flex items-center gap-2 border-b border-emerald-100 bg-emerald-50 px-6 py-3 text-sm font-semibold text-emerald-700">
                <Award className="h-4 w-4" />
                You have already passed this quiz{quiz.lastScore !== null ? ` with ${quiz.lastScore}%` : ''}. You can retake it any time.
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {quiz.questions.map((question, questionIndex) => (
              <fieldset key={question.id} className="card p-5 sm:p-6">
                <legend className="sr-only">Question {questionIndex + 1}</legend>
                <div className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-sm font-extrabold text-indigo-600">
                    {questionIndex + 1}
                  </span>
                  <h2 className="pt-1 text-base font-bold leading-snug text-slate-900">{question.text}</h2>
                </div>

                <div className="mt-5 space-y-2.5 pl-0 sm:pl-11">
                  {question.options.map((option) => {
                    const selected = answers[question.id] === option.id
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
                          name={`question-${question.id}`}
                          value={option.id}
                          checked={selected}
                          onChange={() =>
                            setAnswers((current) => ({ ...current, [question.id]: option.id }))
                          }
                          className="h-4 w-4 accent-indigo-600"
                        />
                        <span className="font-medium">{option.text}</span>
                      </label>
                    )
                  })}
                </div>
              </fieldset>
            ))}

            <div className="card flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center">
              <p className="text-sm text-slate-500">
                {Object.keys(answers).length} of {quiz.questions.length} answered
              </p>
              <button type="submit" disabled={submitting} className="btn-primary w-full sm:w-auto">
                {submitting ? <ButtonLoader label="Scoring..." /> : <>Submit quiz <ArrowRight className="h-4 w-4" /></>}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  )
}
