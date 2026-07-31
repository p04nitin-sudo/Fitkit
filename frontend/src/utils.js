export function localDateKey(date) {
  const d = new Date(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseLocalDate(str) {
  if (!str) return new Date()
  const [y, m, d] = String(str).split('-').map(Number)
  if (!y || !m || !d) return new Date()
  return new Date(y, m - 1, d)
}

export function todayKey() {
  return localDateKey(new Date())
}

export function lastNDays(n) {
  const days = []
  const now = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(now.getDate() - i)
    days.push({
      key: localDateKey(d),
      label: d.toLocaleDateString('en-US', { weekday: 'short' }),
      full: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    })
  }
  return days
}

export function groupByDay(items) {
  const map = {}
  for (const item of items) {
    const key = localDateKey(item.date)
    if (!map[key]) map[key] = []
    map[key].push(item)
  }
  return map
}

export function sum(list, field) {
  return list.reduce((acc, item) => acc + (Number(item[field]) || 0), 0)
}

export function initials(name = '') {
  if (!name) return 'U'
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export const MEAL_TYPE_LABELS = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
}

export const WORKOUT_TYPE_LABELS = {
  cardio: 'Cardio',
  strength: 'Strength',
  flexibility: 'Flexibility',
  sports: 'Sports',
  other: 'Other',
}

export const ACTIVITY_LABELS = {
  sedentary: 'Sedentary (little exercise)',
  light: 'Lightly active (1–3 days/week)',
  moderate: 'Moderately active (3–5 days/week)',
  active: 'Very active (6–7 days/week)',
  veryActive: 'Extremely active (physical job / 2x training)',
}
