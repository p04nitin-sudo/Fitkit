import React, { useEffect, useMemo, useState, useRef } from 'react'
import {
  UtensilsCrossed,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Flame,
  Beef,
  Wheat,
  Droplet,
  CalendarDays,
  BookMarked,
  Coffee,
  Sandwich,
  Moon,
  Apple,
  CheckCircle2,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/Modal'
import { localDateKey, todayKey, lastNDays, sum, MEAL_TYPE_LABELS, parseLocalDate } from '../utils'

const MEAL_ICONS = {
  breakfast: Coffee,
  lunch: Sandwich,
  dinner: Moon,
  snack: Apple,
}

const MEAL_ACCENTS = {
  breakfast: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  lunch: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  dinner: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  snack: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
}

const EMPTY_ADD = {
  name: '',
  mealType: 'breakfast',
  calories: '',
  protein: '',
  carbs: '',
  fat: '',
  date: '',
}

const EMPTY_LIB = {
  name: '',
  mealType: 'breakfast',
  calories: '',
  protein: '',
  carbs: '',
  fat: '',
}

function MacroStat({ icon: Icon, label, value, accent }) {
  return (
    <div className="card flex items-center gap-3.5 p-4">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${accent}`}>
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <div className="text-xl font-extrabold text-(--text-1)">{value}</div>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-(--text-3)">{label}</div>
      </div>
    </div>
  )
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-(--border-strong) bg-(--modal) px-3.5 py-2.5 text-xs shadow-2xl">
      <div className="mb-1.5 font-bold text-(--text-1)">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2 text-(--text-2)">
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: p.color }} />
          {p.name}: <span className="font-bold text-(--text-1)">{Math.round(p.value)} kcal</span>
        </div>
      ))}
    </div>
  )
}

export default function Meals() {
  const { user } = useAuth()
  const [meals, setMeals] = useState([])
  const [library, setLibrary] = useState([])
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_ADD)
  const [libForm, setLibForm] = useState(EMPTY_LIB)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [libMsg, setLibMsg] = useState('')
  const addedTimer = useRef(null)

  const loadMeals = () => {
    api
      .get('/meals/range?days=30')
      .then((res) => setMeals(res.data))
      .catch((err) => console.log(err))
  }

  const loadLibrary = () => {
    api
      .get('/saved-meals')
      .then((res) => setLibrary(res.data))
      .catch((err) => console.log(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    Promise.all([loadMeals(), loadLibrary()])
    return () => clearTimeout(addedTimer.current)
  }, [])

  const selKey = localDateKey(selectedDate)
  const today = todayKey()

  const dayMeals = useMemo(
    () => meals.filter((m) => localDateKey(m.date) === selKey).sort((a, b) => new Date(a.date) - new Date(b.date)),
    [meals, selKey]
  )

  const goal = user?.dailyCalorieGoal || 2500
  const intake = sum(dayMeals, 'calories')
  const protein = sum(dayMeals, 'protein')
  const carbs = sum(dayMeals, 'carbs')
  const fat = sum(dayMeals, 'fat')

  const weeklyChart = useMemo(() => {
    const days = lastNDays(7)
    const map = {}
    meals.forEach((m) => {
      const k = localDateKey(m.date)
      if (!map[k]) map[k] = 0
      map[k] += m.calories
    })
    return days.map((d) => ({ label: d.label, intake: map[d.key] || 0 }))
  }, [meals])

  const shiftDay = (delta) => {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() + delta)
    setSelectedDate(d)
  }

  const setField = (key) => (e) => setForm({ ...form, [key]: e.target.value })
  const setLibField = (key) => (e) => {
    setLibForm({ ...libForm, [key]: e.target.value })
    setLibMsg('')
  }

  const openAddModal = () => {
    setError('')
    setForm({ ...EMPTY_ADD, date: selKey })
    setModalOpen(true)
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const { date, ...rest } = form
      await api.post('/meals/add', {
        ...rest,
        calories: Number(rest.calories) || 0,
        protein: Number(rest.protein) || 0,
        carbs: Number(rest.carbs) || 0,
        fat: Number(rest.fat) || 0,
        date: date || selKey,
      })
      setModalOpen(false)
      if (date) setSelectedDate(parseLocalDate(date))
      loadMeals()
    } catch (err) {
      setError(err.response?.data?.error || 'Could not add meal')
    } finally {
      setSaving(false)
    }
  }

  const onSaveLibraryMeal = async (e) => {
    e.preventDefault()
    setLibMsg('')
    setSaving(true)
    try {
      await api.post('/saved-meals/add', {
        name: libForm.name,
        mealType: libForm.mealType,
        calories: Number(libForm.calories) || 0,
        protein: Number(libForm.protein) || 0,
        carbs: Number(libForm.carbs) || 0,
        fat: Number(libForm.fat) || 0,
      })
      setLibForm(EMPTY_LIB)
      setLibMsg('Meal saved to your library!')
      loadLibrary()
    } catch (err) {
      setLibMsg(err.response?.data?.error || 'Could not save meal')
    } finally {
      setSaving(false)
    }
  }

  const onAddFromLibrary = async (meal) => {
    try {
      await api.post('/meals/add', {
        name: meal.name,
        mealType: meal.mealType,
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fat: meal.fat,
        date: selKey,
      })
      loadMeals()
      setLibMsg(`Added "${meal.name}" to ${dateLabel} ✓`)
      clearTimeout(addedTimer.current)
      addedTimer.current = setTimeout(() => setLibMsg(''), 3000)
    } catch (err) {
      setLibMsg(err.response?.data?.error || 'Could not add meal')
    }
  }

  const onDeleteLibraryMeal = async (id) => {
    if (!window.confirm('Delete this meal from your library?')) return
    try {
      await api.delete(`/saved-meals/${id}`)
      loadLibrary()
    } catch (err) {
      console.log(err)
    }
  }

  const onDelete = async (id) => {
    if (!window.confirm('Delete this meal?')) return
    try {
      await api.delete(`/meals/${id}`)
      loadMeals()
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
          <h1 className="text-2xl font-extrabold tracking-tight text-(--text-1) lg:text-3xl">Meals & Nutrition</h1>
          <p className="mt-1 text-sm text-(--text-2)">
            Save your usual meals once, then just pick what you ate each day.
          </p>
        </div>
        <button onClick={openAddModal} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} /> Add Meal
        </button>
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-(--border) bg-(--card) px-4 py-3">
        <button onClick={() => shiftDay(-1)} className="rounded-lg p-2 text-(--text-2) hover:bg-(--hover) hover:text-(--text-1)">
          <ChevronLeft size={18} />
        </button>
        <div className="text-center">
          <div className="text-sm font-bold text-(--text-1)">{dateLabel}</div>
          {selKey === today && (
            <span className="chip mt-1 inline-block bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">Today</span>
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

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
        <div className="card col-span-2 flex items-center gap-3.5 p-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Flame size={20} />
          </div>
          <div className="min-w-0">
            <div className="text-xl font-extrabold text-(--text-1)">{intake.toLocaleString()} kcal</div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-(--text-3)">
              Consumed · goal {goal.toLocaleString()}
            </div>
          </div>
        </div>
        <MacroStat icon={Beef} label="Protein" value={`${protein}g`} accent="bg-rose-500/10 text-rose-600 dark:text-rose-400" />
        <MacroStat icon={Wheat} label="Carbs" value={`${carbs}g`} accent="bg-amber-500/10 text-amber-600 dark:text-amber-400" />
        <MacroStat icon={Droplet} label="Fat" value={`${fat}g`} accent="bg-cyan-500/10 text-cyan-600 dark:text-cyan-400" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="card p-6">
          <div className="mb-1 flex items-center gap-2">
            <BookMarked size={17} className="text-emerald-500" />
            <h2 className="text-base font-bold text-(--text-1)">Meal Library</h2>
          </div>
          <p className="mb-4 text-xs text-(--text-3)">
            Save meals once, then add them to any day with one tap.
          </p>

          <form onSubmit={onSaveLibraryMeal} className="mb-4 space-y-3 rounded-xl border border-(--border) bg-(--hover) p-3">
            <input
              required
              className="input"
              placeholder="Meal name (e.g. Paneer rice bowl)"
              value={libForm.name}
              onChange={setLibField('name')}
            />
            <div className="grid grid-cols-2 gap-3">
              <select className="input select-input" value={libForm.mealType} onChange={setLibField('mealType')}>
                {Object.entries(MEAL_TYPE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <input
                type="number"
                min="0"
                required
                className="input"
                placeholder="Calories"
                value={libForm.calories}
                onChange={setLibField('calories')}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <input type="number" min="0" className="input" placeholder="Protein g" value={libForm.protein} onChange={setLibField('protein')} />
              <input type="number" min="0" className="input" placeholder="Carbs g" value={libForm.carbs} onChange={setLibField('carbs')} />
              <input type="number" min="0" className="input" placeholder="Fat g" value={libForm.fat} onChange={setLibField('fat')} />
            </div>
            <button type="submit" disabled={saving} className="btn-primary flex w-full items-center justify-center gap-2 text-sm">
              {saving ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900/30 border-t-slate-900" />
              ) : (
                <>Save meal <Plus size={15} /></>
              )}
            </button>
            {libMsg && (
              <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${
                libMsg.includes('✓') || libMsg.includes('saved')
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
              }`}>
                {libMsg.includes('✓') || libMsg.includes('saved') ? <CheckCircle2 size={14} className="shrink-0" /> : null}
                {libMsg}
              </div>
            )}
          </form>

          <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
            {library.length === 0 ? (
              <div className="py-6 text-center text-sm text-(--text-3)">
                Your library is empty. Save a meal above!
              </div>
            ) : (
              library.map((meal) => {
                const Icon = MEAL_ICONS[meal.mealType] || Apple
                return (
                  <div key={meal._id} className="group flex items-center gap-3 rounded-xl bg-(--hover) p-3 transition hover:bg-(--border)">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${MEAL_ACCENTS[meal.mealType]}`}>
                      <Icon size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-(--text-1)">{meal.name}</div>
                      <div className="text-[11px] text-(--text-3)">
                        {MEAL_TYPE_LABELS[meal.mealType] || meal.mealType} · {meal.calories} kcal
                      </div>
                    </div>
                    <button
                      onClick={() => onAddFromLibrary(meal)}
                      title={`Add to ${dateLabel}`}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 transition hover:bg-emerald-500/25 dark:text-emerald-400"
                    >
                      <Plus size={15} />
                    </button>
                    <button
                      onClick={() => onDeleteLibraryMeal(meal._id)}
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
          <h2 className="text-base font-bold text-(--text-1)">Meals — {dateLabel}</h2>
          <p className="mb-4 text-xs text-(--text-3)">{dayMeals.length} meal{dayMeals.length !== 1 ? 's' : ''} logged</p>

          {dayMeals.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-(--border) py-12 text-center">
              <UtensilsCrossed size={32} className="text-(--text-3)" />
              <p className="mt-3 text-sm text-(--text-3)">No meals logged for this day.</p>
              <p className="mt-1 text-xs text-(--text-3)">
                Tap + on a saved meal, or add a new one.
              </p>
              <button onClick={openAddModal} className="mt-4 text-sm font-semibold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300">
                Add your first meal →
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {dayMeals.map((meal) => {
                const Icon = MEAL_ICONS[meal.mealType] || Apple
                return (
                  <div key={meal._id} className="group flex items-start gap-3 rounded-xl bg-(--hover) p-4 transition hover:bg-(--border)">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${MEAL_ACCENTS[meal.mealType]}`}>
                      <Icon size={17} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-(--text-1)">{meal.name}</div>
                      <div className="mt-0.5 text-[11px] text-(--text-3)">
                        {MEAL_TYPE_LABELS[meal.mealType] || meal.mealType} ·{' '}
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">{meal.calories} kcal</span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <span className="chip bg-rose-500/10 text-rose-600 dark:text-rose-400">P {meal.protein}g</span>
                        <span className="chip bg-amber-500/10 text-amber-600 dark:text-amber-400">C {meal.carbs}g</span>
                        <span className="chip bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">F {meal.fat}g</span>
                      </div>
                    </div>
                    <button
                      onClick={() => onDelete(meal._id)}
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

      <div className="card p-6">
        <h2 className="text-base font-bold text-(--text-1)">Intake — Last 7 Days</h2>
        <p className="text-xs text-(--text-3)">Total calories logged per day</p>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyChart} margin={{ top: 5, right: 5, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: 'var(--text-3)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-3)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--hover)' }} />
              <Bar dataKey="intake" name="Intake" radius={[6, 6, 0, 0]} maxBarSize={38} fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Meal">
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-(--text-3)">Meal name</label>
            <input required className="input" placeholder="e.g. Paneer rice bowl" value={form.name} onChange={setField('name')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-(--text-3)">Meal type</label>
              <select className="input select-input" value={form.mealType} onChange={setField('mealType')}>
                {Object.entries(MEAL_TYPE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-(--text-3)">Date</label>
              <div className="relative">
                <CalendarDays size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-(--text-3)" />
                <input
                  type="date"
                  required
                  className="input pl-10"
                  value={form.date}
                  onChange={setField('date')}
                />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-(--text-3)">Calories</label>
              <input required type="number" min="0" className="input" placeholder="450" value={form.calories} onChange={setField('calories')} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-(--text-3)">Protein (g)</label>
              <input type="number" min="0" className="input" placeholder="22" value={form.protein} onChange={setField('protein')} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-(--text-3)">Carbs (g)</label>
              <input type="number" min="0" className="input" placeholder="58" value={form.carbs} onChange={setField('carbs')} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-(--text-3)">Fat (g)</label>
              <input type="number" min="0" className="input" placeholder="14" value={form.fat} onChange={setField('fat')} />
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-600 dark:text-rose-300">{error}</div>
          )}

          <button type="submit" disabled={saving} className="btn-primary flex w-full items-center justify-center gap-2">
            {saving ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900/30 border-t-slate-900" />
            ) : (
              <>Save meal <Plus size={16} /></>
            )}
          </button>
        </form>
      </Modal>
    </div>
  )
}
