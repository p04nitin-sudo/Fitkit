import React, { useEffect, useMemo, useState } from 'react'
import {
  Dumbbell,
  Plus,
  Trash2,
  Flame,
  Timer,
  Zap,
  ChevronLeft,
  ChevronRight,
  Activity,
  PersonStanding,
  Trophy,
  CalendarDays,
  BookMarked,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area,
} from 'recharts'
import api from '../api/client'
import Modal from '../components/Modal'
import { localDateKey, todayKey, lastNDays, sum, WORKOUT_TYPE_LABELS, parseLocalDate } from '../utils'

const TYPE_ICONS = {
  cardio: Activity,
  strength: Dumbbell,
  flexibility: PersonStanding,
  sports: Trophy,
  other: Zap,
}

const TYPE_ACCENTS = {
  cardio: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  strength: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  flexibility: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  sports: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  other: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
}

const EMPTY_LIB = { name: '', type: 'cardio', caloriesPerMin: '' }

function ChartTooltip({ active, payload, label, unit }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-(--border-strong) bg-(--modal) px-3.5 py-2.5 text-xs shadow-2xl">
      <div className="mb-1.5 font-bold text-(--text-1)">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2 text-(--text-2)">
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: p.color || p.fill }} />
          {p.name}: <span className="font-bold text-(--text-1)">{Math.round(p.value)}{unit}</span>
        </div>
      ))}
    </div>
  )
}

export default function Workouts() {
  const [workouts, setWorkouts] = useState([])
  const [library, setLibrary] = useState([])
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const [loading, setLoading] = useState(true)
  const [logModal, setLogModal] = useState({ open: false })
  const [logForm, setLogForm] = useState({ name: '', type: 'other', duration: '', caloriesBurned: '', date: '' })
  const [libForm, setLibForm] = useState(EMPTY_LIB)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [libMsg, setLibMsg] = useState('')

  const loadWorkouts = () => {
    api
      .get('/workouts/range?days=30')
      .then((res) => setWorkouts(res.data))
      .catch((err) => console.log(err))
  }

  const loadLibrary = () => {
    api
      .get('/saved-exercises')
      .then((res) => setLibrary(res.data))
      .catch((err) => console.log(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    Promise.all([loadWorkouts(), loadLibrary()])
  }, [])

  const selKey = localDateKey(selectedDate)
  const today = todayKey()

  const dayWorkouts = useMemo(
    () =>
      workouts
        .filter((w) => localDateKey(w.date) === selKey)
        .sort((a, b) => new Date(a.date) - new Date(b.date)),
    [workouts, selKey]
  )

  const burned = sum(dayWorkouts, 'caloriesBurned')
  const minutes = sum(dayWorkouts, 'duration')
  const totalBurned = sum(workouts, 'caloriesBurned')
  const totalMinutes = sum(workouts, 'duration')

  const weeklyChart = useMemo(() => {
    const days = lastNDays(7)
    const burnMap = {}
    const minMap = {}
    workouts.forEach((w) => {
      const k = localDateKey(w.date)
      burnMap[k] = (burnMap[k] || 0) + w.caloriesBurned
      minMap[k] = (minMap[k] || 0) + w.duration
    })
    return days.map((d) => ({
      label: d.label,
      burned: burnMap[d.key] || 0,
      minutes: minMap[d.key] || 0,
    }))
  }, [workouts])

  const shiftDay = (delta) => {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() + delta)
    setSelectedDate(d)
  }

  const setLibField = (key) => (e) => {
    setLibForm({ ...libForm, [key]: e.target.value })
    setLibMsg('')
  }

  const onSaveExercise = async (e) => {
    e.preventDefault()
    setLibMsg('')
    setSaving(true)
    try {
      await api.post('/saved-exercises/add', {
        name: libForm.name,
        type: libForm.type,
        caloriesPerMin: Number(libForm.caloriesPerMin) || 0,
      })
      setLibForm(EMPTY_LIB)
      setLibMsg('Exercise saved to your library!')
      loadLibrary()
    } catch (err) {
      setLibMsg(err.response?.data?.error || 'Could not save exercise')
    } finally {
      setSaving(false)
    }
  }

  const onDeleteExercise = async (id) => {
    if (!window.confirm('Delete this exercise from your library?')) return
    try {
      await api.delete(`/saved-exercises/${id}`)
      loadLibrary()
    } catch (err) {
      console.log(err)
    }
  }

  const openLog = (exercise) => {
    setError('')
    setLogForm({
      name: exercise?.name || '',
      type: exercise?.type || 'other',
      duration: '',
      caloriesBurned: exercise?.caloriesPerMin ? Math.round(exercise.caloriesPerMin * 30) : '',
      date: selKey,
      exerciseId: exercise?._id || '',
    })
    setLogModal({ open: true, exercise: exercise || null })
  }

  const setLogField = (key) => (e) => {
    const v = e.target.value
    setLogForm((f) => {
      let next = { ...f, [key]: v }
      if (key === 'duration' && logModal.exercise?.caloriesPerMin > 0) {
        next.caloriesBurned = Math.round((Number(v) || 0) * logModal.exercise.caloriesPerMin)
      }
      return next
    })
  }

  const onLogSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await api.post('/workouts/add', {
        name: logForm.name,
        type: logForm.type,
        duration: Number(logForm.duration) || 0,
        caloriesBurned: Number(logForm.caloriesBurned) || 0,
        date: logForm.date || selKey,
      })
      setLogModal({ open: false })
      if (logForm.date) setSelectedDate(parseLocalDate(logForm.date))
      loadWorkouts()
    } catch (err) {
      setError(err.response?.data?.error || 'Could not add workout')
    } finally {
      setSaving(false)
    }
  }

  const onDelete = async (id) => {
    if (!window.confirm('Delete this workout session?')) return
    try {
      await api.delete(`/workouts/${id}`)
      loadWorkouts()
    } catch (err) {
      console.log(err)
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-(--border) border-t-emerald-500" />
      </div>
    )
  }

  const dateLabel = selectedDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-(--text-1) lg:text-3xl">Workouts</h1>
          <p className="mt-1 text-sm text-(--text-2)">
            Save exercises to your library, then log which ones you did on any day.
          </p>
        </div>
        <button onClick={() => openLog(null)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} /> Log Workout
        </button>
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-(--border) bg-(--card) px-4 py-3">
        <button onClick={() => shiftDay(-1)} className="rounded-lg p-2 text-(--text-2) hover:bg-(--hover) hover:text-(--text-1)">
          <ChevronLeft size={18} />
        </button>
        <div className="text-center">
          <div className="text-sm font-bold text-(--text-1)">{dateLabel}</div>
          {selKey === today && (
            <span className="chip mt-1 inline-block bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">Today</span>
          )}
        </div>
        <button
          onClick={() => shiftDay(1)}
          className="rounded-lg p-2 text-(--text-2) hover:bg-(--hover) hover:text-(--text-1)"
          disabled={selKey === today}
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card flex items-center gap-3.5 p-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
            <Flame size={20} />
          </div>
          <div className="min-w-0">
            <div className="text-xl font-extrabold text-(--text-1)">{burned} kcal</div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-(--text-3)">Burned on this day</div>
          </div>
        </div>
        <div className="card flex items-center gap-3.5 p-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
            <Timer size={20} />
          </div>
          <div className="min-w-0">
            <div className="text-xl font-extrabold text-(--text-1)">{minutes} min</div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-(--text-3)">Active on this day</div>
          </div>
        </div>
        <div className="card flex items-center gap-3.5 p-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
            <Zap size={20} />
          </div>
          <div className="min-w-0">
            <div className="text-xl font-extrabold text-(--text-1)">{totalBurned} kcal</div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-(--text-3)">Burned in last 30 days</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="card p-6">
          <div className="mb-4 flex items-center gap-2">
            <BookMarked size={17} className="text-emerald-500" />
            <h2 className="text-base font-bold text-(--text-1)">Exercise Library</h2>
          </div>
          <p className="mb-4 text-xs text-(--text-3)">
            Save exercises once, then log them on any day.
          </p>

          <form onSubmit={onSaveExercise} className="mb-4 space-y-3 rounded-xl border border-(--border) bg-(--hover) p-3">
            <input
              required
              className="input"
              placeholder="Exercise name (e.g. Running)"
              value={libForm.name}
              onChange={setLibField('name')}
            />
            <div className="grid grid-cols-2 gap-3">
              <select className="input select-input" value={libForm.type} onChange={setLibField('type')}>
                {Object.entries(WORKOUT_TYPE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <input
                type="number"
                min="0"
                step="0.1"
                className="input"
                placeholder="kcal/min (opt)"
                value={libForm.caloriesPerMin}
                onChange={setLibField('caloriesPerMin')}
              />
            </div>
            <button type="submit" disabled={saving} className="btn-primary flex w-full items-center justify-center gap-2 text-sm">
              {saving ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900/30 border-t-slate-900" />
              ) : (
                <>Save exercise <Plus size={15} /></>
              )}
            </button>
            {libMsg && (
              <div className={`rounded-lg px-3 py-2 text-xs ${libMsg.includes('saved') ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
                {libMsg}
              </div>
            )}
          </form>

          <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
            {library.length === 0 ? (
              <div className="py-6 text-center text-sm text-(--text-3)">
                Your library is empty. Save an exercise above!
              </div>
            ) : (
              library.map((ex) => {
                const Icon = TYPE_ICONS[ex.type] || Zap
                return (
                  <div key={ex._id} className="group flex items-center gap-3 rounded-xl bg-(--hover) p-3 transition hover:bg-(--border)">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${TYPE_ACCENTS[ex.type]}`}>
                      <Icon size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-(--text-1)">{ex.name}</div>
                      <div className="text-[11px] text-(--text-3)">
                        {WORKOUT_TYPE_LABELS[ex.type] || ex.type}
                        {ex.caloriesPerMin > 0 && ` · ${ex.caloriesPerMin} kcal/min`}
                      </div>
                    </div>
                    <button
                      onClick={() => openLog(ex)}
                      title="Log for a day"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 transition hover:bg-emerald-500/25 dark:text-emerald-400"
                    >
                      <Plus size={15} />
                    </button>
                    <button
                      onClick={() => onDeleteExercise(ex._id)}
                      className="shrink-0 rounded-lg p-1.5 text-(--text-3) opacity-0 transition hover:bg-rose-500/10 hover:text-rose-500 group-hover:opacity-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </div>

        <div className="card p-6 xl:col-span-2">
          <h2 className="text-base font-bold text-(--text-1)">Sessions — {dateLabel}</h2>
          <p className="mb-4 text-xs text-(--text-3)">
            {dayWorkouts.length} session{dayWorkouts.length !== 1 ? 's' : ''} logged
          </p>

          {dayWorkouts.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-(--border) py-12 text-center">
              <Dumbbell size={32} className="text-(--text-3)" />
              <p className="mt-3 text-sm text-(--text-3)">No workouts logged for this day.</p>
              <button onClick={() => openLog(null)} className="mt-4 text-sm font-semibold text-cyan-600 hover:text-cyan-500 dark:text-cyan-400 dark:hover:text-cyan-300">
                Log a workout →
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {dayWorkouts.map((w) => {
                const Icon = TYPE_ICONS[w.type] || Zap
                return (
                  <div key={w._id} className="group flex items-start gap-3 rounded-xl bg-(--hover) p-4 transition hover:bg-(--border)">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${TYPE_ACCENTS[w.type]}`}>
                      <Icon size={17} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-(--text-1)">{w.name}</div>
                      <div className="mt-0.5 text-[11px] text-(--text-3)">
                        {WORKOUT_TYPE_LABELS[w.type] || w.type} ·{' '}
                        <span className="font-semibold text-cyan-600 dark:text-cyan-400">{w.caloriesBurned} kcal burned</span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <span className="chip bg-orange-500/10 text-orange-600 dark:text-orange-400">⏱ {w.duration} min</span>
                        <span className="chip bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          🔥 {Math.round((w.caloriesBurned / Math.max(w.duration, 1)) * 60)} kcal/hr
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => onDelete(w._id)}
                      className="shrink-0 rounded-lg p-1.5 text-(--text-3) opacity-0 transition hover:bg-rose-500/10 hover:text-rose-500 group-hover:opacity-100"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="card p-6">
          <h2 className="text-base font-bold text-(--text-1)">Calories Burned — Last 7 Days</h2>
          <p className="text-xs text-(--text-3)">Energy expended per day</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyChart} margin={{ top: 5, right: 5, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="gBurn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: 'var(--text-3)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-3)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip unit=" kcal" />} cursor={{ stroke: 'var(--border-strong)' }} />
                <Area type="monotone" dataKey="burned" name="Burned" stroke="#06b6d4" strokeWidth={2.5} fill="url(#gBurn)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-base font-bold text-(--text-1)">Workout Minutes — Last 7 Days</h2>
          <p className="text-xs text-(--text-3)">Duration per day</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyChart} margin={{ top: 5, right: 5, left: -22, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: 'var(--text-3)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-3)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip unit=" min" />} cursor={{ fill: 'var(--hover)' }} />
                <Bar dataKey="minutes" name="Minutes" radius={[6, 6, 0, 0]} maxBarSize={38} fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <Modal open={logModal.open} onClose={() => setLogModal({ open: false })} title="Log Workout Session">
        <form onSubmit={onLogSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-(--text-3)">Exercise</label>
            <input required className="input" placeholder="e.g. Morning run" value={logForm.name} onChange={setLogField('name')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-(--text-3)">Type</label>
              <select className="input select-input" value={logForm.type} onChange={setLogField('type')}>
                {Object.entries(WORKOUT_TYPE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-(--text-3)">Date</label>
              <div className="relative">
                <CalendarDays size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-(--text-3)" />
                <input type="date" required className="input pl-10" value={logForm.date} onChange={setLogField('date')} />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-(--text-3)">Duration (min)</label>
              <input required type="number" min="0" className="input" placeholder="45" value={logForm.duration} onChange={setLogField('duration')} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-(--text-3)">Calories burned</label>
              <input required type="number" min="0" className="input" placeholder="320" value={logForm.caloriesBurned} onChange={setLogField('caloriesBurned')} />
            </div>
          </div>
          {logModal.exercise?.caloriesPerMin > 0 && (
            <p className="text-xs text-(--text-3)">
              Auto-calculated from <span className="font-semibold text-(--text-2)">{logModal.exercise.caloriesPerMin} kcal/min</span> — you can edit it.
            </p>
          )}

          {error && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-600 dark:text-rose-300">{error}</div>
          )}

          <button type="submit" disabled={saving} className="btn-primary flex w-full items-center justify-center gap-2">
            {saving ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900/30 border-t-slate-900" />
            ) : (
              <>Save workout <Plus size={16} /></>
            )}
          </button>
        </form>
      </Modal>
    </div>
  )
}
