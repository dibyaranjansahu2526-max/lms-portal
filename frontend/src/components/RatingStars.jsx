import { Star } from 'lucide-react'

export default function RatingStars({ value = 0, onChange, size = 'h-5 w-5', className = '' }) {
  const interactive = typeof onChange === 'function'
  const rounded = Math.round(value)

  return (
    <div
      className={`flex items-center gap-0.5 ${className}`}
      role={interactive ? 'radiogroup' : undefined}
      aria-label={`${value} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const icon = (
          <Star
            className={`${size} ${star <= rounded ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
          />
        )
        if (!interactive) {
          return <span key={star}>{icon}</span>
        }
        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="rounded p-0.5 transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-amber-400"
            aria-label={`${star} star${star === 1 ? '' : 's'}`}
            aria-pressed={star === value}
          >
            {icon}
          </button>
        )
      })}
    </div>
  )
}
