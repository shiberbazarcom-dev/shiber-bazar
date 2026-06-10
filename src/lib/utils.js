import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatDate(date) {
  return new Intl.DateTimeFormat('bn-BD', {
    year: 'numeric', month: 'long', day: 'numeric'
  }).format(new Date(date))
}

export function slugify(text) {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .trim()
}

export function truncate(str, length = 100) {
  if (!str) return ''
  return str.length > length ? str.slice(0, length) + '...' : str
}

export function getInitials(name = '') {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export function getAvatarUrl(name, bg = '16a34a') {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${bg}&color=fff&size=200&font-size=0.4&bold=true`
}

export function formatPhone(phone) {
  if (!phone) return ''
  return phone.replace(/(\d{4})(\d{3})(\d{4})/, '$1-$2-$3')
}

export function whatsappUrl(phone, message = '') {
  const cleaned = phone?.replace(/\D/g, '') || ''
  const num = cleaned.startsWith('0') ? '88' + cleaned : cleaned
  return `https://wa.me/${num}${message ? `?text=${encodeURIComponent(message)}` : ''}`
}
