import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  Download,
  ExternalLink,
  FileText,
  LockKeyhole,
  PlayCircle,
} from 'lucide-react'
import api, { downloadCertificate, getErrorMessage } from '../../api/client'
import { EmptyState, ErrorAlert, SuccessAlert } from '../../components/Feedback'
import { ButtonLoader, PageLoader } from '../../components/Loading'
import ProgressBar from '../../components/ProgressBar'
import { getYoutubeEmbed } from '../../api/helpers'

export default function LearningPage() {
  const { courseId } = useParams()
  const [data, setData] = useState(null)
  const [activeLessonId, setActiveLessonId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [marking, setMarking] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const loadLearning = async () => {
    const { data: response } = await api.get(`/student/courses/${courseId}/learning`)
    setData(response)
    return response
  }

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    api
      .get(`/student/courses/${courseId}/learning`)
      .then(({ data: response }) => {
        if (!active) return
        setData(response)
        const firstIncomplete = response.lessons.find((lesson) => !lesson.completed)
        setActiveLessonId((firstIncomplete || response.lessons[0])?.id || null)
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
  }, [courseId])

  const activeLesson = data?.lessons.find((lesson) => lesson.id === activeLessonId) || null
  const activeIndex = data?.lessons.findIndex((lesson) => lesson.id === activeLessonId) ?? -1
  const nextLesson = activeIndex >= 0 ? data?.lessons[activeIndex + 1] : null

  const handleMarkComplete = async () => {
    if (!activeLesson) return
    setMarking(true)
    setError('')
    setSuccess('')
    try {
      await api.post(`/student/lessons/${activeLesson.id}/complete`)
      const response = await loadLearning()
      setSuccess('Lesson marked as complete. Keep going!')
      if (response.progress.completed) {
        setSuccess('Congratulations! You completed the course and unlocked your certificate.')
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Could not update your progress.'))
    } finally {
      setMarking(false)
    }
  }

  const handleCertificate = async () => {
    setDownloading(true)
    setError('')
    try {
      await downloadCertificate(courseId, `LMS-Certificate-${data.course.title.replace(/[^a-z0-9]+/gi, '-')}.pdf`)
      setSuccess('Your certificate has been downloaded.')
    } catch (err) {
      setError(getErrorMessage(err, 'Could not download the certificate.'))
    } finally {
      setDownloading(false)
    }
  }

  if (loading) return <PageLoader label="Opening your course..." />

  if (error && !data) {
    return (
      <div className="page-enter">
        <ErrorAlert message={error} />
        <Link to="/student/courses" className="btn-secondary mt-5">
          <ArrowLeft className="h-4 w-4" /> Back to My Courses
        </Link>
      </div>
    )
  }

  if (!data) return null

  const embedUrl = getYoutubeEmbed(activeLesson?.videoUrl)

  return (
    <div className="page-enter">
      <Link to="/student/courses" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-indigo-600">
        <ArrowLeft className="h-4 w-4" /> Back to My Courses
      </Link>

      <section className="card mb-6 overflow-hidden">
        <div className="bg-slate-950 px-6 py-6 text-white sm:px-8">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <span className="badge bg-white/10 text-indigo-200">{data.course.category || 'General'}</span>
              <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">{data.course.title}</h1>
              <p className="mt-1 text-sm text-slate-400">Taught by {data.course.teacherName}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm">
                <span className="font-bold text-white">{data.progress.percentage}%</span>
                <span className="text-slate-400"> complete</span>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
                {data.progress.completedLessons}/{data.progress.totalLessons} lessons
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
                {data.progress.passedQuizzes}/{data.progress.totalQuizzes} quizzes
              </div>
            </div>
          </div>
          <ProgressBar value={data.progress.percentage} className="mt-5" />
        </div>
      </section>

      <ErrorAlert message={error} className="mb-5" />
      <SuccessAlert message={success} className="mb-5" />

      <div className="grid items-start gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="card overflow-hidden lg:sticky lg:top-24">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-extrabold uppercase tracking-wide text-slate-500">Course content</h2>
            <p className="mt-1 text-xs text-slate-400">
              {data.lessons.length} lessons · {data.quizzes.length} quizzes
            </p>
          </div>

          <div className="max-h-[420px] overflow-y-auto p-2">
            {data.lessons.map((lesson, index) => {
              const isActive = lesson.id === activeLessonId
              return (
                <button
                  key={lesson.id}
                  type="button"
                  onClick={() => setActiveLessonId(lesson.id)}
                  className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                    isActive ? 'bg-indigo-50 text-indigo-900' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      lesson.completed
                        ? 'bg-emerald-100 text-emerald-700'
                        : isActive
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {lesson.completed ? <Check className="h-3.5 w-3.5" /> : index + 1}
                  </span>
                  <span className="min-w-0 flex-1 text-sm font-semibold leading-snug">{lesson.title}</span>
                  {isActive && <ChevronRight className="h-4 w-4 shrink-0 text-indigo-500" />}
                </button>
              )
            })}
          </div>

          {data.quizzes.length > 0 && (
            <div className="border-t border-slate-100 p-3">
              <p className="mb-2 px-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">Quizzes</p>
              {data.quizzes.map((quiz) => (
                <Link
                  key={quiz.id}
                  to={`/student/quizzes/${quiz.id}`}
                  className="mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition hover:bg-slate-50"
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                      quiz.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-50 text-amber-600'
                    }`}
                  >
                    {quiz.passed ? <CheckCircle2 className="h-4 w-4" /> : <ClipboardList className="h-4 w-4" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-slate-700">{quiz.title}</span>
                    <span className={`text-xs ${quiz.passed ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {quiz.passed ? 'Passed' : quiz.lastScore !== null ? `Last score: ${quiz.lastScore}%` : 'Not attempted'}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          )}

          {data.progress.completed && (
            <div className="border-t border-slate-100 bg-emerald-50/60 p-4">
              <div className="flex items-start gap-2.5">
                <Award className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <div>
                  <p className="text-sm font-bold text-emerald-800">Course completed</p>
                  <p className="mt-0.5 text-xs text-emerald-700">Your certificate is ready to download.</p>
                  <button
                    type="button"
                    onClick={handleCertificate}
                    disabled={downloading}
                    className="btn-secondary mt-3 w-full !border-emerald-200 !bg-white !py-2 !text-emerald-700 hover:!bg-emerald-50"
                  >
                    <Download className="h-4 w-4" />
                    {downloading ? 'Downloading...' : 'Download certificate'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </aside>

        <section className="min-w-0">
          {activeLesson ? (
            <article className="card overflow-hidden">
              <div className="border-b border-slate-100 p-6 sm:p-8">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="badge bg-indigo-50 text-indigo-700">Lesson {activeIndex + 1}</span>
                  {activeLesson.completed && (
                    <span className="badge bg-emerald-50 text-emerald-700">
                      <CheckCircle2 className="h-3 w-3" /> Completed
                    </span>
                  )}
                </div>
                <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900">{activeLesson.title}</h2>
              </div>

              <div className="p-6 sm:p-8">
                {embedUrl ? (
                  <div className="mb-7 aspect-video overflow-hidden rounded-2xl bg-slate-950 shadow-lg">
                    <iframe
                      src={embedUrl}
                      title={activeLesson.title}
                      className="h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : activeLesson.videoUrl ? (
                  <a
                    href={activeLesson.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mb-7 flex items-center justify-between rounded-2xl border border-indigo-100 bg-indigo-50 px-5 py-4 text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
                  >
                    <span className="flex items-center gap-2">
                      <PlayCircle className="h-5 w-5" /> Watch the lesson video
                    </span>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                ) : null}

                <div className="whitespace-pre-line text-[15px] leading-7 text-slate-600">{activeLesson.content}</div>

                {activeLesson.materialUrl && (
                  <a
                    href={activeLesson.materialUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-7 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                  >
                    <FileText className="h-4 w-4" />
                    Open lesson materials
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}

                <div className="mt-8 flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
                  {activeLesson.completed ? (
                    <p className="flex items-center gap-2 text-sm font-semibold text-emerald-600">
                      <CheckCircle2 className="h-5 w-5" /> You have completed this lesson
                    </p>
                  ) : (
                    <p className="flex items-center gap-2 text-sm text-slate-400">
                      <ClipboardCheck className="h-4 w-4" /> Finished reading? Mark this lesson complete.
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {!activeLesson.completed && (
                      <button type="button" onClick={handleMarkComplete} disabled={marking} className="btn-primary">
                        {marking ? <ButtonLoader label="Completing..." /> : <><Check className="h-4 w-4" /> Mark complete</>}
                      </button>
                    )}
                    {nextLesson && (
                      <button
                        type="button"
                        onClick={() => setActiveLessonId(nextLesson.id)}
                        className="btn-secondary"
                      >
                        Next lesson <ArrowRight className="h-4 w-4" />
                      </button>
                    )}
                    {!nextLesson && data.quizzes.some((quiz) => !quiz.passed) && (
                      <Link to={`/student/quizzes/${data.quizzes.find((quiz) => !quiz.passed).id}`} className="btn-primary">
                        Take quiz <ArrowRight className="h-4 w-4" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </article>
          ) : (
            <EmptyState
              icon={LockKeyhole}
              title="No lessons yet"
              description="The teacher has not added lessons to this course yet. Check back soon."
            />
          )}

          {data.progress.allLessonsCompleted && !data.progress.allQuizzesPassed && (
            <div className="card mt-5 flex flex-col items-start gap-4 border-amber-200 bg-amber-50/70 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <ClipboardCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                <div>
                  <p className="text-sm font-bold text-amber-900">All lessons complete</p>
                  <p className="mt-0.5 text-xs text-amber-700">Pass every quiz to finish the course and unlock your certificate.</p>
                </div>
              </div>
              {data.quizzes.find((quiz) => !quiz.passed) && (
                <Link to={`/student/quizzes/${data.quizzes.find((quiz) => !quiz.passed).id}`} className="btn-primary shrink-0">
                  Go to quiz <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
