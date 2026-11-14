import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, ChevronLeft, ChevronRight, Compass, Search, Sparkles } from 'lucide-react'
import api, { getErrorMessage } from '../../api/client'
import CourseCard from '../../components/CourseCard'
import { EmptyState, ErrorAlert, SuccessAlert } from '../../components/Feedback'
import { SkeletonCard } from '../../components/Loading'
import PageHeader from '../../components/PageHeader'
import { useAuth } from '../../context/AuthContext'

const PAGE_SIZE = 12

const ALL_CATEGORIES = [
  'Programming',
  'Web Development',
  'Computer Science',
  'Data Science',
  'Artificial Intelligence',
  'Database',
  'Cloud & DevOps',
  'Mobile Development',
  'Cybersecurity',
  'Soft Skills & Career',
]

export default function Catalog() {
  const { user } = useAuth()
  const [courses, setCourses] = useState([])
  const [categories, setCategories] = useState([])
  const [enrolledIds, setEnrolledIds] = useState(new Set())
  const [wishlistedIds, setWishlistedIds] = useState(new Set())
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [sort, setSort] = useState('newest')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [enrollingId, setEnrollingId] = useState(null)

  useEffect(() => {
    api
      .get('/courses/categories')
      .then(({ data }) => setCategories([...new Set([...data, ...ALL_CATEGORIES])].sort()))
      .catch(() => setCategories(ALL_CATEGORIES))

    api
      .get('/student/courses')
      .then(({ data }) => setEnrolledIds(new Set(data.map((enrollment) => enrollment.course.id))))
      .catch(() => setEnrolledIds(new Set()))

    api
      .get('/student/wishlist')
      .then(({ data }) => setWishlistedIds(new Set(data.map((item) => item.course.id))))
      .catch(() => setWishlistedIds(new Set()))
  }, [])

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    const timer = window.setTimeout(() => {
      api
        .get('/courses', {
          params: {
            search: search || undefined,
            category: category || undefined,
            sort: sort || undefined,
            page,
            size: PAGE_SIZE,
          },
        })
        .then(({ data }) => {
          if (!active) return
          const content = data?.content ?? []
          setCourses(content)
          setTotalPages(data?.totalPages ?? 0)
          setTotalElements(data?.totalElements ?? content.length)
          const lastPage = Math.max((data?.totalPages ?? 0) - 1, 0)
          if (page > lastPage) setPage(lastPage)
        })
        .catch((err) => {
          if (active) setError(getErrorMessage(err, 'Could not load courses.'))
        })
        .finally(() => {
          if (active) setLoading(false)
        })
    }, 300)

    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [search, category, sort, page])

  const handleEnroll = async (course) => {
    setEnrollingId(course.id)
    setError('')
    setSuccess('')
    try {
      await api.post(`/courses/${course.id}/enroll`)
      setEnrolledIds((current) => new Set([...current, course.id]))
      setCourses((current) =>
        current.map((item) =>
          item.id === course.id ? { ...item, enrollmentCount: item.enrollmentCount + 1 } : item,
        ),
      )
      setSuccess(`You are enrolled in "${course.title}". Head to My Courses to start learning.`)
    } catch (err) {
      setError(getErrorMessage(err, 'Could not enroll in this course.'))
    } finally {
      setEnrollingId(null)
    }
  }

  const handleToggleWishlist = async (course) => {
    const wasWishlisted = wishlistedIds.has(course.id)
    setError('')
    setSuccess('')
    setWishlistedIds((current) => {
      const next = new Set(current)
      if (wasWishlisted) next.delete(course.id)
      else next.add(course.id)
      return next
    })

    try {
      if (wasWishlisted) {
        await api.delete(`/student/wishlist/${course.id}`)
        setSuccess(`Removed "${course.title}" from your wishlist.`)
      } else {
        await api.post(`/student/wishlist/${course.id}`)
        setSuccess(`Saved "${course.title}" to your wishlist.`)
      }
    } catch (err) {
      setWishlistedIds((current) => {
        const next = new Set(current)
        if (wasWishlisted) next.add(course.id)
        else next.delete(course.id)
        return next
      })
      setError(getErrorMessage(err, 'Could not update your wishlist.'))
    }
  }

  const firstName = useMemo(() => user?.name?.split(' ')[0] || 'there', [user])

  const goToPage = (nextPage) => {
    setPage(nextPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="page-enter">
      <section className="relative mb-8 overflow-hidden rounded-3xl bg-slate-950 px-6 py-10 text-white sm:px-10 sm:py-14">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-indigo-600/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="relative max-w-3xl">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-indigo-200">
            <Sparkles className="h-3.5 w-3.5" />
            Learn at your own pace
          </p>
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
            Welcome back, {firstName}. What will you learn today?
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400 sm:text-base">
            Explore practical, expert-led courses. Complete every lesson and quiz to earn your certificate.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-3 h-5 w-5 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value)
                  setPage(0)
                }}
                className="w-full rounded-xl border border-white/10 bg-white/10 py-3 pl-12 pr-4 text-sm text-white outline-none backdrop-blur placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20"
                placeholder="Search by title or description..."
              />
            </div>
            <select
              value={category}
              onChange={(event) => {
                setCategory(event.target.value)
                setPage(0)
              }}
              className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-medium text-white outline-none backdrop-blur focus:border-indigo-400"
            >
              <option value="" className="text-slate-900">
                All categories
              </option>
              {categories.map((item) => (
                <option key={item} value={item} className="text-slate-900">
                  {item}
                </option>
              ))}
            </select>
            <select
              value={sort}
              onChange={(event) => {
                setSort(event.target.value)
                setPage(0)
              }}
              className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-medium text-white outline-none backdrop-blur focus:border-indigo-400"
              aria-label="Sort courses"
            >
              <option value="newest" className="text-slate-900">
                Newest
              </option>
              <option value="rating" className="text-slate-900">
                Highest rated
              </option>
              <option value="popular" className="text-slate-900">
                Most popular
              </option>
            </select>
          </div>
        </div>
      </section>

      <SuccessAlert message={success} className="mb-5" />
      <ErrorAlert message={error} className="mb-5" />

      <PageHeader
        eyebrow="Course catalog"
        title="Explore courses"
        description={
          loading
            ? 'Finding the best courses for you...'
            : `${totalElements} course${totalElements === 1 ? '' : 's'} available to enroll`
        }
        action={
          <Link to="/student/courses" className="btn-secondary">
            <BookOpen className="h-4 w-4" /> My courses
          </Link>
        }
      />

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <EmptyState
          icon={Compass}
          title="No courses found"
          description={
            search || category
              ? 'Try a different search term or category.'
              : 'Published courses will appear here as soon as teachers add them.'
          }
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              enrolled={enrolledIds.has(course.id)}
              enrolling={enrollingId === course.id}
              onEnroll={handleEnroll}
              wishlisted={wishlistedIds.has(course.id)}
              onToggleWishlist={handleToggleWishlist}
            />
          ))}
        </div>
      )}

      {!loading && totalPages > 1 && (
        <nav
          className="mt-8 flex items-center justify-between gap-4"
          aria-label="Course catalog pagination"
        >
          <button
            type="button"
            className="btn-secondary"
            onClick={() => goToPage(Math.max(0, page - 1))}
            disabled={page === 0}
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </button>
          <p className="text-sm font-medium text-slate-600">
            Page {page + 1} of {totalPages}
          </p>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => goToPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </nav>
      )}
    </div>
  )
}
