import { BookOpen, CheckCircle2, ClipboardList, Users } from 'lucide-react'
import { ButtonLoader } from './Loading'

export default function CourseCard({ course, enrolled = false, enrolling = false, onEnroll }) {
  const fallback = 'bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500'

  return (
    <article className="card card-hover flex h-full flex-col overflow-hidden">
      <div className="relative h-40 overflow-hidden">
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
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/45 via-transparent to-transparent" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <span className="badge bg-white/95 text-slate-700 shadow-sm">{course.category || 'General'}</span>
          {enrolled && (
            <span className="badge bg-emerald-500/95 text-white shadow-sm">
              <CheckCircle2 className="h-3 w-3" /> Enrolled
            </span>
          )}
        </div>
        <p className="absolute bottom-3 left-4 text-xs font-semibold text-white/90">
          by {course.teacherName}
        </p>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-base font-bold leading-snug text-slate-900">{course.title}</h3>
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
