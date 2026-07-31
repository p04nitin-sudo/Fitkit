import React, { useEffect, useState } from 'react'
import {
  User as UserIcon,
  Mail,
  Ruler,
  Weight,
  Cake,
  Activity,
  Save,
  Target,
  Flame,
  Sun,
  Moon,
} from 'lucide-react'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { ACTIVITY_LABELS } from '../utils'

export default function Profile() {
  const { user, refreshUser } = useAuth()
  const { theme, setTheme } = useTheme()
  const [form, setForm] = useState({
    name: '',
    age: 25,
    heightCm: 170,
    weightKg: 70,
    gender: 'male',
    activityLevel: 'moderate',
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || user.username || '',
        age: user.age || 25,
        heightCm: user.heightCm || 170,
        weightKg: user.weightKg || 70,
        gender: user.gender || 'male',
        activityLevel: user.activityLevel || 'moderate',
      })
    }
  }, [user])

  const setField = (key) => (e) => {
    const val = ['age', 'heightCm', 'weightKg'].includes(key) ? Number(e.target.value) : e.target.value
    setForm({ ...form, [key]: val })
    setMessage('')
    setError('')
  }

  const bmr = (() => {
    const base = 10 * (form.weightKg || 0) + 6.25 * (form.heightCm || 0) - 5 * (form.age || 0)
    return form.gender === 'male' ? base + 5 : base - 161
  })()

  const factors = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, veryActive: 1.9 }
  const tdee = Math.round(bmr * (factors[form.activityLevel] || 1.55))
  const goal = Math.round((tdee - 500) / 50) * 50

  const onSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')
    try {
      const res = await api.put('/auth/profile', form)
      await refreshUser()
      setForm({
        name: res.data.user.name || '',
        age: res.data.user.age,
        heightCm: res.data.user.heightCm,
        weightKg: res.data.user.weightKg,
        gender: res.data.user.gender,
        activityLevel: res.data.user.activityLevel,
      })
      setMessage('Profile updated successfully!')
    } catch (err) {
      setError(err.response?.data?.error || 'Could not update profile')
    } finally {
      setSaving(false)
    }
  }

  const themeOptions = [
    { key: 'light', label: 'Light', icon: Sun },
    { key: 'dark', label: 'Dark', icon: Moon },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-(--text-1) lg:text-3xl">Profile</h1>
        <p className="mt-1 text-sm text-(--text-2)">Manage your details and personalize the app.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="card p-6 xl:col-span-1">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 text-3xl font-extrabold text-slate-950 shadow-lg shadow-emerald-500/25">
              {(user?.name || user?.username || 'U').charAt(0).toUpperCase()}
            </div>
            <h2 className="mt-4 text-lg font-bold text-(--text-1)">{user?.name || user?.username}</h2>
            <div className="text-sm text-(--text-3)">@{user?.username}</div>
          </div>

          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-3 rounded-xl bg-(--hover) p-3">
              <Mail size={16} className="shrink-0 text-(--text-3)" />
              <span className="truncate text-sm text-(--text-1)">{user?.email}</span>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-(--hover) p-3">
              <Ruler size={16} className="shrink-0 text-(--text-3)" />
              <span className="text-sm text-(--text-1)">{form.heightCm} cm</span>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-(--hover) p-3">
              <Weight size={16} className="shrink-0 text-(--text-3)" />
              <span className="text-sm text-(--text-1)">{form.weightKg} kg</span>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-(--hover) p-3">
              <Cake size={16} className="shrink-0 text-(--text-3)" />
              <span className="text-sm text-(--text-1)">{form.age} years</span>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-(--border) bg-(--hover) p-4">
              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-(--text-3)">
                <Flame size={14} className="shrink-0 text-orange-500" /> BMR
              </span>
              <span className="font-bold text-(--text-1)">{bmr} kcal</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-(--border) bg-(--hover) p-4">
              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-(--text-3)">
                <Activity size={14} className="shrink-0 text-cyan-500" /> Daily burn (TDEE)
              </span>
              <span className="font-bold text-(--text-1)">{tdee} kcal</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-emerald-500/15 to-cyan-500/10 p-4">
              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                <Target size={14} /> Calorie goal
              </span>
              <span className="font-extrabold text-(--text-1)">{goal} kcal</span>
            </div>
          </div>
        </div>

        <div className="space-y-4 xl:col-span-2">
          <div className="card p-6">
            <h2 className="text-base font-bold text-(--text-1)">Personal Details</h2>
            <p className="mb-6 text-xs text-(--text-3)">
              These are used to calculate your BMR, daily burn and recommended calorie goal.
            </p>

            <form onSubmit={onSubmit} className="space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-(--text-3)">Full name</label>
                  <div className="relative">
                    <UserIcon size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-(--text-3)" />
                    <input className="input pl-10" value={form.name} onChange={setField('name')} placeholder="Your name" />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-(--text-3)">Age</label>
                  <div className="relative">
                    <Cake size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-(--text-3)" />
                    <input type="number" min="10" max="100" className="input pl-10" value={form.age} onChange={setField('age')} />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-(--text-3)">Height (cm)</label>
                  <div className="relative">
                    <Ruler size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-(--text-3)" />
                    <input type="number" min="100" max="250" className="input pl-10" value={form.heightCm} onChange={setField('heightCm')} />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-(--text-3)">Weight (kg)</label>
                  <div className="relative">
                    <Weight size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-(--text-3)" />
                    <input type="number" min="30" max="300" className="input pl-10" value={form.weightKg} onChange={setField('weightKg')} />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-(--text-3)">Gender</label>
                  <select className="input select-input" value={form.gender} onChange={setField('gender')}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-(--text-3)">Activity level</label>
                  <select className="input select-input" value={form.activityLevel} onChange={setField('activityLevel')}>
                    {Object.entries(ACTIVITY_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {message && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-300">
                  {message}
                </div>
              )}
              {error && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-600 dark:text-rose-300">
                  {error}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-(--text-3)">
                  Recommended goal: <span className="font-bold text-emerald-600 dark:text-emerald-400">{goal} kcal/day</span> (mild deficit)
                </p>
                <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 text-sm">
                  {saving ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900/30 border-t-slate-900" />
                  ) : (
                    <>
                      <Save size={16} /> Save changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="card p-6">
            <h2 className="text-base font-bold text-(--text-1)">Appearance</h2>
            <p className="mt-1 text-xs text-(--text-3)">Choose how FitKit looks for you.</p>
            <div className="mt-4 flex gap-3">
              {themeOptions.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setTheme(key)}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                    theme === key
                      ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-[0_0_0_3px_rgba(16,185,129,0.12)]'
                      : 'border-(--border) text-(--text-2) hover:bg-(--hover)'
                  }`}
                >
                  <Icon size={17} />
                  {label} theme
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
