import api from './client'

export function validateCoupon(courseId, code) {
  return api
    .post('/student/coupons/validate', { courseId, code: code.trim() })
    .then(({ data }) => data)
}