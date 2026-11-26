import api from './client'

const CHECKOUT_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js'
const RECEIPTS_PREFIX = 'lms_payment_receipts:'

let checkoutScriptPromise = null

export class PaymentCancelledError extends Error {
  constructor() {
    super('Payment cancelled. You have not been charged.')
    this.name = 'PaymentCancelledError'
    this.cancelled = true
  }
}

export function loadRazorpayCheckout() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Checkout is only available in the browser.'))
  }

  if (window.Razorpay) return Promise.resolve(window.Razorpay)
  if (checkoutScriptPromise) return checkoutScriptPromise

  checkoutScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = CHECKOUT_SCRIPT_URL
    script.async = true
    script.onload = () => {
      if (window.Razorpay) {
        resolve(window.Razorpay)
      } else {
        reject(new Error('Payment checkout did not load properly. Please try again.'))
      }
    }
    script.onerror = () => {
      reject(new Error('Could not load Razorpay Checkout. Check your connection and try again.'))
    }
    document.body.appendChild(script)
  }).catch((error) => {
    checkoutScriptPromise = null
    throw error
  })

  return checkoutScriptPromise
}

export async function buyCourse(course, user, couponCode) {
  const { data: order } = await api.post('/student/payments/create-order', {
    courseId: course.id,
    ...(couponCode ? { couponCode } : {}),
  })

  if (order?.directEnrollment) {
    const verification = {
      status: order.status || 'SUCCESS',
      razorpayOrderId: order.orderId,
      razorpayPaymentId: '',
      enrollmentId: order.enrollmentId,
    }
    recordPaymentReceipt(user, course, order, verification)
    return { order, verification }
  }

  if (!order?.orderId || !order?.keyId) {
    throw new Error('Checkout could not be started. Please try again.')
  }

  const Razorpay = await loadRazorpayCheckout()

  return new Promise((resolve, reject) => {
    let settled = false

    const settle = (callback, value) => {
      if (settled) return
      settled = true
      callback(value)
    }

    const options = {
      key: order.keyId,
      amount: order.amount,
      currency: order.currency || 'INR',
      name: 'LMS Portal',
      description: course.title,
      order_id: order.orderId,
      prefill: {
        ...(user?.name ? { name: user.name } : {}),
        ...(user?.email ? { email: user.email } : {}),
      },
      notes: {
        courseId: String(course.id),
        courseTitle: course.title,
      },
      theme: {
        color: '#4f46e5',
      },
      handler: async (response) => {
        try {
          const { data: verification } = await api.post('/student/payments/verify', {
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          })
          recordPaymentReceipt(user, course, order, verification)
          settle(resolve, { order, verification })
        } catch (error) {
          settle(reject, error)
        }
      },
      modal: {
        ondismiss: () => settle(reject, new PaymentCancelledError()),
      },
    }

    try {
      const checkout = new Razorpay(options)
      checkout.on('payment.failed', (response) => {
        const description =
          response?.error?.description || 'Payment failed. You have not been charged.'
        settle(reject, new Error(description))
      })
      checkout.open()
    } catch (error) {
      settle(reject, error)
    }
  })
}

function receiptStorageKey(user) {
  return user?.id ? `${RECEIPTS_PREFIX}${user.id}` : null
}

export function readPaymentReceipts(user) {
  const key = receiptStorageKey(user)
  if (!key || typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(key)
    const parsed = raw ? JSON.parse(raw) : []
    if (!Array.isArray(parsed)) return []
    return parsed.filter((receipt) => receipt?.courseId && receipt?.paidAt)
  } catch {
    return []
  }
}

function recordPaymentReceipt(user, course, order, verification) {
  const key = receiptStorageKey(user)
  if (!key || typeof window === 'undefined') return

  const receipt = {
    id: `${order.orderId}:${verification?.razorpayPaymentId || 'verified'}`,
    orderId: order.orderId,
    paymentId: verification?.razorpayPaymentId || '',
    enrollmentId: verification?.enrollmentId ?? null,
    courseId: course.id,
    courseTitle: course.title,
    amount: Number(order.amount) / 100,
    currency: order.currency || 'INR',
    status: verification?.status || 'SUCCESS',
    paidAt: new Date().toISOString(),
  }

  const existing = readPaymentReceipts(user)
  const next = [
    receipt,
    ...existing.filter(
      (item) => item.courseId !== receipt.courseId && item.orderId !== receipt.orderId,
    ),
  ]

  try {
    window.localStorage.setItem(key, JSON.stringify(next.slice(0, 50)))
  } catch {
    // Verification already succeeded, so a storage failure should not block enrollment.
  }
}
