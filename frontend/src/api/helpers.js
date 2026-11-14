export const ROLE_HOME = {
  ADMIN: '/admin',
  TEACHER: '/teacher/courses',
  STUDENT: '/student/dashboard',
}

export function homeForRole(role) {
  return ROLE_HOME[role] || '/login'
}

export function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatRole(role) {
  return role ? role.charAt(0) + role.slice(1).toLowerCase() : ''
}

export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

export function formatMarks(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—'
  const number = Number(value)
  return Number.isInteger(number) ? String(number) : number.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')
}

export function formatDuration(seconds) {
  const safe = Math.max(0, Math.floor(Number(seconds) || 0))
  const hours = Math.floor(safe / 3600)
  const minutes = Math.floor((safe % 3600) / 60)
  const remainingSeconds = safe % 60
  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, '0')}m`
  }
  if (minutes > 0) {
    return `${minutes}m ${String(remainingSeconds).padStart(2, '0')}s`
  }
  return `${remainingSeconds}s`
}

export function formatClock(seconds) {
  const safe = Math.max(0, Math.floor(Number(seconds) || 0))
  const hours = Math.floor(safe / 3600)
  const minutes = Math.floor((safe % 3600) / 60)
  const remainingSeconds = safe % 60
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
  }
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
}

export function getYoutubeEmbed(url) {
  if (!url) return null
  try {
    const parsed = new URL(url)
    let id = ''
    if (parsed.hostname.includes('youtu.be')) {
      id = parsed.pathname.slice(1)
    } else if (parsed.pathname.startsWith('/embed/')) {
      id = parsed.pathname.split('/embed/')[1]
    } else {
      id = parsed.searchParams.get('v') || ''
    }
    return id ? `https://www.youtube.com/embed/${id}` : null
  } catch {
    return null
  }
}
