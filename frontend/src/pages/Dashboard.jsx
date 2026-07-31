import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  UtensilsCrossed,
  Flame,
  Scale,
  Timer,
  Plus,
  ArrowUpRight,
  Dumbbell,
  Target,
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import { lastNDays, groupByDay, sum, todayKey, MEAL_TYPE_LABELS } from '../utils'

function ChartTooltip({ active, payload, label, unit = '' }) {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="rounded-xl border border-(--border-strong) bg-(--modal) px-3.5 py-2.5 text-xs shadow-2xl">
      <div className="mb-1.5 font-bold text-(--text-1)">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2 py-0.5 text-(--text-2)">
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ background: p.color || p.fill || p.stroke }}
          />
          <span className="capitalize">{p.name}</span>
          <span className="ml-auto pl-3 font-bold text-(--text-1)">
            {Math.round(p.value)}
            {unit}
          </span>
        </div>
      ))}
    </div>
  )
}

const MACRO_COLORS = ['#10b981', '#06b6d4', '#f59e0b']

function StatCard({ icon: Icon, label, value, sub, accent }) {
  return (
    <div className="card flex items-center gap-4 p-5">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${accent}`}>
        <Icon size={22} />
      </div>
      <div className="min-w-0">
        <div className="text-xs font-semibold uppercase tracking-wider text-(--text-3)">{label}</div>
        <div className="mt-0.5 text-2xl font-extrabold tracking-tight text-(--text-1)">{value}</div>
        {sub && <div className="truncate text-xs font-medium text-(--text-3)">{sub}</div>}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [meals, setMeals] = useState([])
  const [workouts, setWorkouts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/meals/range?days=7'),
      api.get('/workouts/range?days=7'),
    ])
      .then(([m, w]) => {
        setMeals(m.data)
        setWorkouts(w.data)
      })
      .catch((err) => console.log(err))
      .finally(() => setLoading(false))
  }, [])

  const today = todayKey()
  const goal = user?.dailyCalorieGoal || 2500

  const { caloriesChart, workoutMinutes, todayIntake, todayBurned, todayMinutes, macros } =
    useMemo(() => {
      const days = lastNDays(7)
      const mealsByDay = groupByDay(meals)
      const workoutsByDay = groupByDay(workouts)

      const caloriesChart = days.map((d) => ({
        label: d.label,
        full: d.full,
        intake: sum(mealsByDay[d.key] || [], 'calories'),
        burned: sum(workoutsByDay[d.key] || [], 'caloriesBurned'),
      }))

      const workoutMinutes = days.map((d) => ({
        label: d.label,
        minutes: sum(workoutsByDay[d.key] || [], 'duration'),
      }))

      const todayMeals = mealsByDay[today] || []
      const todayWorkouts = workoutsByDay[today] || []

      return {
        caloriesChart,
        workoutMinutes,
        todayIntake: sum(todayMeals, 'calories'),
        todayBurned: sum(todayWorkouts, 'caloriesBurned'),
        todayMinutes: sum(todayWorkouts, 'duration'),
        macros: [
          { name: 'Protein', value: sum(todayMeals, 'protein') },
          { name: 'Carbs', value: sum(todayMeals, 'carbs') },
          { name: 'Fat', value: sum(todayMeals, 'fat') },
        ],
      }
    }, [meals, workouts, today])

  const netCalories = todayIntake - todayBurned
  const progressPct = Math.min(100, Math.round((todayIntake / goal) * 100))
  const recentMeals = [...meals].reverse().slice(0, 5)
  const recentWorkouts = [...workouts].reverse().slice(0, 5)

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  })()

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-(--border) border-t-emerald-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-(--text-1) lg:text-3xl">
            {greeting}, {user?.name || user?.username} 👋
          </h1>
          <p className="mt-1 text-sm text-(--text-2)">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}{' '}
            · Here's your fitness overview.
          </p>
        </div>
        <div className="flex gap-3">
          <Link to="/meals" className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={16} /> Add Meal
          </Link>
          <Link to="/workouts" className="btn-ghost flex items-center gap-2 text-sm">
            <Plus size={16} /> Log Workout
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={UtensilsCrossed}
          label="Calories Intake"
          value={`${todayIntake.toLocaleString()}`}
          sub="kcal consumed today"
          accent="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          icon={Flame}
          label="Calories Burned"
          value={`${todayBurned.toLocaleString()}`}
          sub="kcal burned today"
          accent="bg-orange-500/10 text-orange-600 dark:text-orange-400"
        />
        <StatCard
          icon={Scale}
          label="Net Calories"
          value={`${netCalories >= 0 ? '+' : ''}${netCalories.toLocaleString()}`}
          sub="intake minus burned"
          accent="bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
        />
        <StatCard
          icon={Timer}
          label="Active Minutes"
          value={`${todayMinutes}`}
          sub="min of activity today"
          accent="bg-violet-500/10 text-violet-600 dark:text-violet-400"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="card p-6 xl:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-(--text-1)">Calories Overview</h2>
              <p className="text-xs text-(--text-3)">Intake vs burned · last 7 days</p>
            </div>
            <div className="flex gap-4 text-xs font-semibold text-(--text-2)">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Intake
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-cyan-500" /> Burned
              </span>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={caloriesChart} margin={{ top: 5, right: 5, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="gIntake" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gBurned" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: 'var(--text-3)', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis tick={{ fill: 'var(--text-3)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip unit=" kcal" />} cursor={{ stroke: 'var(--border-strong)' }} />
                <Area
                  type="monotone"
                  dataKey="intake"
                  name="Intake"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fill="url(#gIntake)"
                />
                <Area
                  type="monotone"
                  dataKey="burned"
                  name="Burned"
                  stroke="#06b6d4"
                  strokeWidth={2.5}
                  fill="url(#gBurned)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card flex flex-col p-6">
          <h2 className="text-base font-bold text-(--text-1)">Daily Goal</h2>
          <p className="text-xs text-(--text-3)">Calories eaten vs target</p>

          <div className="mt-6 flex flex-1 items-center justify-center">
            <div className="relative h-44 w-44">
              <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                <circle cx="60" cy="60" r="52" fill="none" stroke="var(--ring-track)" strokeWidth="11" />
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="url(#goalGrad)"
                  strokeWidth="11"
                  strokeLinecap="round"
                  strokeDasharray={`${(progressPct / 100) * 326.7} 326.7`}
                />
                <defs>
                  <linearGradient id="goalGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-3xl font-extrabold text-(--text-1)">{progressPct}%</div>
                <div className="text-[11px] font-medium text-(--text-3)">of {goal.toLocaleString()} kcal</div>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-2.5">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-(--text-2)">
                <Target size={14} className="shrink-0 text-emerald-500" /> Consumed
              </span>
              <span className="font-bold text-(--text-1)">{todayIntake.toLocaleString()} kcal</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-(--text-2)">
                <Flame size={14} className="shrink-0 text-orange-500" /> Remaining
              </span>
              <span className={`font-bold ${goal - todayIntake >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {(goal - todayIntake).toLocaleString()} kcal
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="card p-6">
          <h2 className="text-base font-bold text-(--text-1)">Macro Split</h2>
          <p className="text-xs text-(--text-3)">Today's nutrition breakdown</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={macros}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  strokeWidth={0}
                >
                  {macros.map((_, i) => (
                    <Cell key={i} fill={MACRO_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip unit=" g" />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {macros.map((m, i) => (
              <div key={m.name} className="rounded-xl bg-(--hover) p-3 text-center">
                <div className="text-lg font-extrabold text-(--text-1)">{m.value}g</div>
                <div className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-(--text-3)">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: MACRO_COLORS[i] }} />
                  {m.name}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <div className="mb-5">
            <h2 className="text-base font-bold text-(--text-1)">Workout Minutes</h2>
            <p className="text-xs text-(--text-3)">Last 7 days</p>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workoutMinutes} margin={{ top: 5, right: 5, left: -22, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: 'var(--text-3)', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis tick={{ fill: 'var(--text-3)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip unit=" min" />} cursor={{ fill: 'var(--hover)' }} />
                <Bar dataKey="minutes" name="Minutes" radius={[6, 6, 0, 0]} maxBarSize={34}>
                  {workoutMinutes.map((_, i) => (
                    <Cell key={i} fill={i === 6 ? '#06b6d4' : '#10b981'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-(--text-1)">Recent Activity</h2>
            <Link to="/meals" className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300">
              View all <ArrowUpRight size={13} />
            </Link>
          </div>

          <div className="space-y-3">
            {recentMeals.length === 0 && recentWorkouts.length === 0 && (
              <div className="py-8 text-center text-sm text-(--text-3)">
                No activity yet. Add a meal or log a workout!
              </div>
            )}
            {recentMeals.map((meal) => (
              <div key={meal._id} className="flex items-center gap-3 rounded-xl bg-(--hover) p-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <UtensilsCrossed size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-(--text-1)">{meal.name}</div>
                  <div className="text-[11px] text-(--text-3)">
                    {MEAL_TYPE_LABELS[meal.mealType] || meal.mealType} · {meal.calories} kcal
                  </div>
                </div>
              </div>
            ))}
            {recentWorkouts.map((w) => (
              <div key={w._id} className="flex items-center gap-3 rounded-xl bg-(--hover) p-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                  <Dumbbell size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-(--text-1)">{w.name}</div>
                  <div className="text-[11px] text-(--text-3)">
                    {w.duration} min · {w.caloriesBurned} kcal burned
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
