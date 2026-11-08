import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Compass, Heart } from 'lucide-react'
import api, { getErrorMessage } from '../../api/client'
import CourseCard from '../../components/CourseCard'
import { EmptyState, ErrorAlert, SuccessAlert } from '../../components/Feedback'
import { PageLoader } from '../../components/Loading'
import PageHeader from '../../components/PageHeader'

export default function Wishlist() {
  const [items, setItems] = useState([])
  const [enrolledIds, setEnrolledIds] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [enrollingId, setEnrollingId] = useState(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    Promise.all([api.get('/student/wishlist'), api.get('/student/courses')])
      .then(([wishlistResponse, enrollmentResponse]) => {
        if (!active) return
        setItems(wishlistResponse.data)
        setEnrolledIds(new Set(enrollmentResponse.data.map((enrollment) => enrollment.course.id)))
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err, 'Could not load your wishlist.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const handleToggleWishlist = async (course) => {
    setError('')
    setSuccess('')
    try {
      await api.delete(`/student/wishlist/${course.id}`)
      setItems((current) => current.filter((item) => item.course.id !== course.id))
      setSuccess(`Removed "${course.title}" from your wishlist.`)
    } catch (err) {
      setError(getErrorMessage(err, 'Could not remove this course from your wishlist.'))
    }
  }

  const handleEnroll = async (course) => {
    setEnrollingId(course.id)
    setError('')
    setSuccess('')
    try {
      await api.post(`/courses/${course.id}/enroll`)
      setEnrolledIds((current) => new Set([...current, course.id]))
      setSuccess(`You are enrolled in "${course.title}". Head to My Courses to start learning.`)
    } catch (err) {
      setError(getErrorMessage(err, 'Could not enroll in this course.'))
    } finally {
      setEnrollingId(null)
    }
  }

  if (loading) return <PageLoader label="Loading your wishlist..." />

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="Saved learning"
        title="My Wishlist"
        description="Keep the courses you want to take next in one place."
        action={
          <Link to="/student/catalog" className="btn-primary">
            <Compass className="h-4 w-4" /> Browse catalog
          </Link>
        }
      />

      <ErrorAlert message={error} className="mb-5" />
      <SuccessAlert message={success} className="mb-5" />

      {items.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Your wishlist is empty"
          description="Tap the heart on any course in the catalog to save it for later."
          action={
            <Link to="/student/catalog" className="btn-primary">
              Explore courses
            </Link>
          }
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(({ course }) => (
            <CourseCard
              key={course.id}
              course={course}
              enrolled={enrolledIds.has(course.id)}
              enrolling={enrollingId === course.id}
              onEnroll={handleEnroll}
              wishlisted
              onToggleWishlist={handleToggleWishlist}
            />
          ))}
        </div>
      )}
    </div>
  )
}
