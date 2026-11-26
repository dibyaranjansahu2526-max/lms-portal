import { Check, Tag, X } from 'lucide-react'
import { formatCurrency } from '../api/helpers'
import { ButtonLoader } from './Loading'

export default function CouponField({ coupon, disabled = false, compact = false }) {
  return (
    <div
      className={`${compact ? 'mt-3' : 'mt-4'} rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-700 dark:bg-slate-800/40`}
    >
      <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        <Tag className="h-3.5 w-3.5" /> Have a coupon?
      </label>
      <form onSubmit={coupon.apply} className="mt-2 flex gap-2">
        <input
          type="text"
          value={coupon.code}
          onChange={(event) => coupon.setCode(event.target.value)}
          disabled={disabled || coupon.applying}
          placeholder="Enter code"
          maxLength={40}
          className="input min-w-0 flex-1 py-2 text-sm uppercase"
          aria-label="Coupon code"
        />
        <button
          type="submit"
          disabled={disabled || coupon.applying || !coupon.code.trim()}
          className="btn-secondary shrink-0 px-3 py-2 text-xs"
        >
          {coupon.applying ? <ButtonLoader label="Applying..." /> : 'Apply'}
        </button>
      </form>

      {coupon.applied && (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-emerald-50 px-2.5 py-2 text-xs text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
          <span className="flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5" />
            <span className="font-bold">{coupon.applied.code}</span> applied — you pay{' '}
            <strong>{formatCurrency(coupon.finalPrice)}</strong>
          </span>
          <button type="button" onClick={coupon.clear} className="font-semibold underline" disabled={disabled}>
            <span className="inline-flex items-center gap-1">
              <X className="h-3 w-3" /> Remove
            </span>
          </button>
        </div>
      )}
      {coupon.error && <p className="mt-2 text-xs font-medium text-rose-600">{coupon.error}</p>}
    </div>
  )
}