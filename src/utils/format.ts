export function normalizePhone(input: string): string {
  let digits = input.replace(/\D/g, '')
  if (digits.startsWith('8') && digits.length === 11) {
    digits = `7${digits.slice(1)}`
  }
  return digits
}

export function formatPhone(phone: string): string {
  const digits = normalizePhone(phone)
  if (digits.startsWith('7') && digits.length === 11) {
    return `+7 ${digits.slice(1, 4)} ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9)}`
  }
  if (digits.startsWith('375') && digits.length === 12) {
    return `+375 ${digits.slice(3, 5)} ${digits.slice(5, 8)}-${digits.slice(8, 10)}-${digits.slice(10)}`
  }
  return digits ? `+${digits}` : ''
}

export function isValidPhone(phone: string): boolean {
  const digits = normalizePhone(phone)
  return digits.length === 11 || digits.length === 12
}

export function formatTime(timestamp: number): string {
  const date = new Date(timestamp < 1e12 ? timestamp * 1000 : timestamp)
  return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

export function initials(title: string): string {
  const digits = title.replace(/\D/g, '')
  if (title.trim().startsWith('+') && digits.length >= 2) {
    return digits.slice(-2)
  }
  const parts = title.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

export function newKey(): string {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}
