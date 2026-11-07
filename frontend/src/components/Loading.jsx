import { Loader2 } from 'lucide-react'

export function Spinner({ className = 'h-5 w-5' }) {
  return <Loader2 className={`animate-spin ${className}`} aria-hidden="true" />
}

export function PageLoader({ label = 'Loading...' }) {
  return (
    <div className="flex min-h-[55vh] flex-col items-center justify-center gap-4 text-slate-500">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
        <Spinner className="h-6 w-6" />
      </div>
      <p className="text-sm font-medium">{label}</p>
    </div>
  )
}

export function ButtonLoader({ label = 'Saving...' }) {
  return (
    <>
      <Spinner className="h-4 w-4" />
      {label}
    </>
  )
}

export function SkeletonCard() {
  return (
    <div className="card animate-pulse overflow-hidden">
      <div className="h-40 bg-slate-100" />
      <div className="space-y-3 p-5">
        <div className="h-4 w-2/3 rounded bg-slate-100" />
        <div className="h-3 w-full rounded bg-slate-100" />
        <div className="h-3 w-5/6 rounded bg-slate-100" />
        <div className="h-9 w-full rounded-xl bg-slate-100" />
      </div>
    </div>
  )
}
