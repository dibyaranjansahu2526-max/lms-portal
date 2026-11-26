import { useEffect, useState } from 'react'
import { validateCoupon } from '../api/coupons'
import { getErrorMessage } from '../api/client'

export function useCoupon(courseId, basePrice) {
  const [code, setCode] = useState('')
  const [applied, setApplied] = useState(null)
  const [error, setError] = useState('')
  const [applying, setApplying] = useState(false)

  useEffect(() => {
    setCode('')
    setApplied(null)
    setError('')
  }, [courseId])

  const updateCode = (value) => {
    setCode(value)
    if (applied) {
      setApplied(null)
      setError('')
    }
  }

  const apply = async (event) => {
    event.preventDefault()
    if (!code.trim()) {
      setError('Enter a coupon code.')
      return
    }
    setApplying(true)
    setError('')
    try {
      const result = await validateCoupon(courseId, code)
      setApplied(result)
    } catch (err) {
      setApplied(null)
      setError(getErrorMessage(err, 'Could not apply this coupon.'))
    } finally {
      setApplying(false)
    }
  }

  const clear = () => {
    setCode('')
    setApplied(null)
    setError('')
  }

  const finalPrice = applied
    ? Number(applied.finalPricePaise) / 100
    : Number(basePrice) || 0

  return { code, setCode: updateCode, applied, error, applying, apply, clear, finalPrice }
}