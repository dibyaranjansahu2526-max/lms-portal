export const ROLE_HOME = {
  ADMIN: '/admin',
  TEACHER: '/teacher/courses',
  STUDENT: '/student/catalog',
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
