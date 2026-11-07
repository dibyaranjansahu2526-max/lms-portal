export default function ProgressBar({ value = 0, className = '', showLabel = false, size = 'md' }) {
  const safeValue = Math.max(0, Math.min(100, Math.round(value || 0)))
  const height = size === 'sm' ? 'h-1.5' : 'h-2.5'
  return (
    <div className={className}>
      {showLabel && (
        <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-slate-500">
          <span>Progress</span>
          <span className="text-indigo-600">{safeValue}%</span>
        </div>
      )}
      <div className={`w-full overflow-hidden rounded-full bg-slate-100 ${height}`}>
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
          style={{ width: `${safeValue}%` }}
          role="progressbar"
          aria-valuenow={safeValue}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  )
}
