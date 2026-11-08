import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Award,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Heart,
  MessageSquare,
  PlayCircle,
  Users,
} from 'lucide-react'
import api, { getErrorMessage } from '../../api/client'
import { ErrorAlert, SuccessAlert } from '../../components/Feedback'
import { ButtonLoader, PageLoader } from '../../components/Loading'
import ProgressBar from '../../components/ProgressBar'
import RatingStars from '../../components/RatingStars'
import { formatDate, initials } from '../../api/helpers'

export default function CourseDetail() {
  const { courseId } = useParams()
  const [course, setCourse] = useState(null)
  const [reviews, setReviews] = useState(null)
  const [enrollments, setEnrollments] = useState([])
  const [wishlisted, setWishlisted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [enrolling, setEnrolling] = useState(false)
  const [savingReview, setSavingReview] = useState(false)
  const [formRating, setFormRating] = useState(0)
  const [formComment, setFormComment] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    setSuccess('')
    Promise.all([
      api.get(`/courses/${courseId}`),
      api.get(`/courses/${courseId}/reviews`),
      api.get('/student/courses'),
      api.get('/student/wishlist'),
    ])
      .then(([courseResponse, reviewResponse, enrollmentResponse, wishlistResponse]) => {
        if (!active) return
        setCourse(courseResponse.data)
        setReviews(reviewResponse.data)
        setEnrollments(enrollmentResponse.data)
        setWishlisted(wishlistResponse.data.some((item) => item.course.id === Number(courseId)))
        if (reviewResponse.data.myReview) {
          setFormRating(reviewResponse.data.myReview.rating)
          setFormComment(reviewResponse.data.myReview.comment)
        }
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

  const enrollment = enrollments.find((item) => item.course.id === Number(courseId))
  const enrolled = Boolean(enrollment)
  const myReview = reviews?.myReview || null
  const averageRating = reviews?.averageRating ?? course?.averageRating ?? 0
  const reviewCount = reviews?.reviewCount ?? course?.reviewCount ?? 0

  const handleEnroll = async () => {
    setEnrolling(true)
    setError('')
    setSuccess('')
    try {
      const { data } = await api.post(`/courses/${courseId}/enroll`)
      setEnrollments((current) => [data, ...current])
      setCourse((current) =>
        current ? { ...current, enrollmentCount: current.enrollmentCount + 1 } : current,
      )
      setSuccess('You are enrolled. Continue below to start the course.')
    } catch (err) {
      setError(getErrorMessage(err, 'Could not enroll in this course.'))
    } finally {
      setEnrolling(false)
    }
  }

  const handleToggleWishlist = async () => {
    const wasWishlisted = wishlisted
    setError('')
    setSuccess('')
    setWishlisted(!wasWishlisted)
    try {
      if (wasWishlisted) {
        await api.delete(`/student/wishlist/${courseId}`)
        setSuccess('Removed this course from your wishlist.')
      } else {
        await api.post(`/student/wishlist/${courseId}`)
        setSuccess('Saved this course to your wishlist.')
      }
    } catch (err) {
      setWishlisted(wasWishlisted)
      setError(getErrorMessage(err, 'Could not update your wishlist.'))
    }
  }

  const handleReviewSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    if (formRating < 1) {
      setError('Please choose a rating from 1 to 5 stars.')
      return
    }
    if (!formComment.trim()) {
      setError('Please write a short comment for your review.')
      return
    }

    setSavingReview(true)
    try {
      const payload = { rating: formRating, comment: formComment.trim() }
      if (myReview) {
        await api.put(`/student/courses/${courseId}/reviews`, payload)
      } else {
        await api.post(`/student/courses/${courseId}/reviews`, payload)
      }

      const { data } = await api.get(`/courses/${courseId}/reviews`)
      setReviews(data)
      setCourse((current) =>
        current
          ? { ...current, averageRating: data.averageRating, reviewCount: data.reviewCount }
          : current,
      )
      if (data.myReview) {
        setFormRating(data.myReview.rating)
        setFormComment(data.myReview.comment)
      }
      setSuccess(myReview ? 'Your review has been updated.' : 'Thank you for sharing your review.')
    } catch (err) {
      setError(getErrorMessage(err, 'Could not save your review.'))
    } finally {
      setSavingReview(false)
    }
  }

  if (loading) return <PageLoader label="Loading course..." />

  if (error && !course) {
    return (
      <div className="page-enter">
        <ErrorAlert message={error} />
        <Link to="/student/catalog" className="btn-secondary mt-5">
          <ArrowLeft className="h-4 w-4" /> Back to catalog
        </Link>
      </div>
    )
  }

  if (!course) return null

  return (
    <div className="page-enter">
      <Link
        to="/student/catalog"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-indigo-600"
      >
        <ArrowLeft className="h-4 w-4" /> Back to catalog
      </Link>

      <section className="card overflow-hidden">
        <div className="grid md:grid-cols-2">
          <div className="relative min-h-64 bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500">
            {course.imageUrl && (
              <img src={course.imageUrl} alt="" className="h-full min-h-64 w-full object-cover" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 to-transparent" />
          </div>
          <div className="p-6 sm:p-8">
            <span className="badge bg-indigo-50 text-indigo-700">{course.category || 'General'}</span>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              {course.title}
            </h1>
            <p className="mt-1 text-sm text-slate-500">Taught by {course.teacherName}</p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <RatingStars value={averageRating} size="h-4 w-4" />
              <span className="text-sm font-bold text-slate-800">{averageRating.toFixed(1)}</span>
              <span className="text-sm text-slate-400">
                ({reviewCount} review{reviewCount === 1 ? '' : 's'})
              </span>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-slate-500">{course.description}</p>

            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-slate-400">
              <span className="flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" /> {course.lessonCount} lessons
              </span>
              <span className="flex items-center gap-1.5">
                <ClipboardList className="h-3.5 w-3.5" /> {course.quizCount} quizzes
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" /> {course.enrollmentCount} learners
              </span>
            </div>

            {enrollment && <ProgressBar value={enrollment.progress.percentage} showLabel className="mt-5" />}

            <ErrorAlert message={error} className="mt-5" />
            <SuccessAlert message={success} className="mt-5" />

            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              {enrolled ? (
                <Link to={`/student/courses/${course.id}/learn`} className="btn-primary">
                  <PlayCircle className="h-4 w-4" /> Continue learning
                </Link>
              ) : (
                <button type="button" onClick={handleEnroll} disabled={enrolling} className="btn-primary">
                  {enrolling ? <ButtonLoader label="Enrolling..." /> : 'Enroll now'}
                </button>
              )}
              <button type="button" onClick={handleToggleWishlist} className="btn-secondary">
                <Heart className={`h-4 w-4 ${wishlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
                {wishlisted ? 'Saved to wishlist' : 'Save to wishlist'}
              </button>
            </div>
            {enrolled && enrollment?.progress.completed && (
              <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                <Award className="h-4 w-4" /> Course completed — your certificate is ready in My Courses.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          <div className="card p-5 sm:p-6">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-xl font-extrabold tracking-tight text-slate-900">Student reviews</h2>
                <p className="mt-1 text-sm text-slate-500">
                  What learners think about this course.
                </p>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-amber-50 px-4 py-3">
                <span className="text-3xl font-extrabold text-amber-700">{averageRating.toFixed(1)}</span>
                <div>
                  <RatingStars value={averageRating} size="h-4 w-4" />
                  <p className="mt-0.5 text-xs font-semibold text-amber-700">
                    {reviewCount} review{reviewCount === 1 ? '' : 's'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-4">
            {reviews?.reviews?.length ? (
              reviews.reviews.map((review) => (
                <article key={review.id} className="card p-5">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                      {initials(review.studentName)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-800">{review.studentName}</p>
                        {review.mine && <span className="badge bg-indigo-50 text-indigo-700">Your review</span>}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <RatingStars value={review.rating} size="h-3.5 w-3.5" />
                        <span className="text-xs text-slate-400">{formatDate(review.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{review.comment}</p>
                </article>
              ))
            ) : (
              <div className="card flex flex-col items-center justify-center px-6 py-12 text-center">
                <MessageSquare className="h-8 w-8 text-slate-300" />
                <p className="mt-3 font-semibold text-slate-700">No reviews yet</p>
                <p className="mt-1 text-sm text-slate-400">Be the first enrolled student to share your experience.</p>
              </div>
            )}
          </div>
        </div>

        <aside className="card p-5 sm:p-6 lg:sticky lg:top-24">
          <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
            {myReview ? 'Edit your review' : 'Write a review'}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {myReview ? 'Update your rating or comment at any time.' : 'Share your experience with other learners.'}
          </p>

          {enrolled ? (
            <form onSubmit={handleReviewSubmit} className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Your rating
                </label>
                <RatingStars value={formRating} onChange={setFormRating} size="h-7 w-7" />
                <p className="mt-1 text-xs text-slate-400">
                  {formRating ? `${formRating} out of 5 stars` : 'Choose a rating'}
                </p>
              </div>
              <div>
                <label
                  htmlFor="review-comment"
                  className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500"
                >
                  Your comment
                </label>
                <textarea
                  id="review-comment"
                  rows={5}
                  maxLength={2000}
                  value={formComment}
                  onChange={(event) => setFormComment(event.target.value)}
                  placeholder="What did you enjoy? What could be better?"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                />
                <p className="mt-1 text-right text-[11px] text-slate-400">{formComment.length}/2000</p>
              </div>
              <button type="submit" disabled={savingReview} className="btn-primary w-full">
                {savingReview ? (
                  <ButtonLoader label="Saving..." />
                ) : myReview ? (
                  'Update review'
                ) : (
                  'Publish review'
                )}
              </button>
            </form>
          ) : (
            <div className="mt-5 rounded-xl border border-indigo-100 bg-indigo-50/70 p-4 text-sm text-indigo-800">
              <p className="font-semibold">Enrolled students only</p>
              <p className="mt-1 text-indigo-700">
                Enroll in this course to leave a rating and review for other learners.
              </p>
            </div>
          )}

          {enrolled && (
            <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-slate-400">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              You can edit your review after publishing. One review per student per course.
            </p>
          )}
        </aside>
      </section>
    </div>
  )
}
