import { BookOpen, CheckCircle2, ClipboardList, Heart, Star, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ButtonLoader } from './Loading'

export default function CourseCard({
  course,
  enrolled = false,
  enrolling = false,
  onEnroll,
  wishlisted = false,
  onToggleWishlist,
}) {
  const fallback = 'bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500'
  const detailTo = `/student/courses/${course.id}`
  const averageRating = Number(course.averageRating) || 0
  const reviewCount = Number(course.reviewCount) || 0

  return (
    <article className="card card-hover flex h-full flex-col overflow-hidden">
      <div className="relative h-40 overflow-hidden">
        <Link to={detailTo} className="block h-full w-full" aria-label={`View ${course.title}`}>
          {course.imageUrl ? (
            <img
              src={course.imageUrl}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
              onError={(event) => {
                event.currentTarget.style.display = 'none'
              }}
            />
          ) : (
            <div className={`h-full w-full ${fallback}`} />
          )}
        </Link>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/45 via-transparent to-transparent" />
        <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-2">
          <span className="badge bg-white/95 text-slate-700 shadow-sm">{course.category || 'General'}</span>
          {enrolled && (
            <span className="badge bg-emerald-500/95 text-white shadow-sm">
              <CheckCircle2 className="h-3 w-3" /> Enrolled
            </span>
          )}
        </div>
        {onToggleWishlist && (
          <button
            type="button"
            onClick={() => onToggleWishlist(course)}
            className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-slate-600 shadow-md transition hover:scale-105 hover:text-rose-600"
            aria-label={wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
            title={wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
          >
            <Heart className={`h-4 w-4 ${wishlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>
        )}
        <p className="pointer-events-none absolute bottom-3 left-4 text-xs font-semibold text-white/90">
          by {course.teacherName}
        </p>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <Link to={detailTo} className="text-base font-bold leading-snug text-slate-900 hover:text-indigo-700">
          {course.title}
        </Link>
        <div className="mt-2 flex items-center gap-1.5 text-xs">
          <Star className={`h-4 w-4 ${reviewCount > 0 ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
          <span className="font-bold text-slate-700">{averageRating.toFixed(1)}</span>
          <span className="text-slate-400">
            ({reviewCount} review{reviewCount === 1 ? '' : 's'})
          </span>
        </div>
        <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-slate-500">{course.description}</p>

        <div className="mt-4 flex items-center gap-4 text-xs font-medium text-slate-400">
          <span className="flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5" />
            {course.lessonCount} lessons
          </span>
          <span className="flex items-center gap-1.5">
            <ClipboardList className="h-3.5 w-3.5" />
            {course.quizCount} quizzes
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            {course.enrollmentCount}
          </span>
        </div>

        <button
          type="button"
          disabled={enrolled || enrolling}
          onClick={() => onEnroll?.(course)}
          className={`mt-5 w-full ${enrolled ? 'btn-secondary' : 'btn-primary'}`}
        >
          {enrolling ? (
            <ButtonLoader label="Enrolling..." />
          ) : enrolled ? (
            <>
              <CheckCircle2 className="h-4 w-4" /> Already enrolled
            </>
          ) : (
            'Enroll now'
          )}
        </button>
      </div>
    </article>
  )
}
