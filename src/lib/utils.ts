import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, isPast, parseISO } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '—'
  return format(parseISO(date), 'MMM d, yyyy')
}

export function formatDateShort(date: string | null | undefined): string {
  if (!date) return '—'
  return format(parseISO(date), 'MMM d')
}

export function timeAgo(date: string): string {
  return formatDistanceToNow(parseISO(date), { addSuffix: true })
}

export function isOverdue(date: string | null | undefined): boolean {
  if (!date) return false
  return isPast(parseISO(date))
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    planning: 'bg-slate-100 text-slate-700',
    active: 'bg-blue-100 text-blue-700',
    on_hold: 'bg-yellow-100 text-yellow-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
    backlog: 'bg-slate-100 text-slate-600',
    todo: 'bg-blue-100 text-blue-600',
    in_progress: 'bg-violet-100 text-violet-700',
    in_review: 'bg-orange-100 text-orange-700',
    done: 'bg-green-100 text-green-700',
  }
  return map[status] ?? 'bg-slate-100 text-slate-600'
}

export function getPriorityColor(priority: string): string {
  const map: Record<string, string> = {
    low: 'bg-slate-100 text-slate-600',
    medium: 'bg-blue-100 text-blue-700',
    high: 'bg-orange-100 text-orange-700',
    urgent: 'bg-red-100 text-red-700',
  }
  return map[priority] ?? 'bg-slate-100 text-slate-600'
}

export function getMilestoneStatusColor(status: string): string {
  const map: Record<string, string> = {
    upcoming: 'text-blue-500',
    at_risk: 'text-yellow-500',
    completed: 'text-green-500',
    missed: 'text-red-500',
  }
  return map[status] ?? 'text-slate-400'
}

export function getCompletionColor(pct: number): string {
  if (pct >= 80) return 'text-green-600'
  if (pct >= 50) return 'text-blue-600'
  if (pct >= 25) return 'text-yellow-600'
  return 'text-red-600'
}

export function humanizeStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}
