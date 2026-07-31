import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Flame, Mail, Lock, ArrowRight, Activity, HeartPulse, Trophy, Sun, Moon } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

const HIGHLIGHTS = [
  { icon: Activity, title: 'Track workouts', desc: 'Log cardio & strength with calories burned' },
  { icon: HeartPulse, title: 'Nutrition at a glance', desc: 'Calories, protein, carbs & fat per meal' },
  { icon: Trophy, title: 'Visual progress', desc: 'Beautiful charts that keep you motivated' },
]

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-app">
      <div className="hidden flex-1 flex-col justify-between p-12 lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-400 shadow-lg shadow-emerald-500/25">
            <Flame size={24} className="text-slate-950" strokeWidth={2.5} />
          </div>
          <span className="text-2xl font-extrabold tracking-tight text-(--text-1)">
            Fit<span className="text-gradient">Kit</span>
          </span>
          <button
            onClick={toggleTheme}
            title="Toggle theme"
            className="ml-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-(--border) text-(--text-2) transition hover:bg-(--hover) hover:text-(--text-1)"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        <div>
          <h1 className="max-w-md text-5xl font-extrabold leading-tight tracking-tight text-(--text-1)">
            Your fitness journey, <span className="text-gradient">beautifully tracked.</span>
          </h1>
          <p className="mt-4 max-w-md text-(--text-2)">
            Log meals, crush workouts, and watch your progress come alive with intelligent,
            real-time insights.
          </p>

          <div className="mt-10 space-y-4">
            {HIGHLIGHTS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-center gap-4 rounded-2xl border border-(--border) bg-(--card) p-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 text-emerald-600 dark:text-emerald-300">
                  <Icon size={22} />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-(--text-1)">{title}</div>
                  <div className="text-xs text-(--text-3)">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-xs text-(--text-3)">
          © {new Date().getFullYear()} FitKit · Smart Fitness Tracker
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-400">
              <Flame size={24} className="text-slate-950" strokeWidth={2.5} />
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-(--text-1)">
              Fit<span className="text-gradient">Kit</span>
            </span>
            <button
              onClick={toggleTheme}
              className="ml-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-(--border) text-(--text-2) transition hover:bg-(--hover)"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>

          <h2 className="text-3xl font-extrabold tracking-tight text-(--text-1)">Welcome back</h2>
          <p className="mt-2 text-sm text-(--text-2)">Log in to continue your fitness streak.</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-(--text-3)">
                Email
              </label>
              <div className="relative">
                <Mail size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-(--text-3)" />
                <input
                  type="email"
                  required
                  className="input pl-11"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-(--text-3)">
                Password
              </label>
              <div className="relative">
                <Lock size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-(--text-3)" />
                <input
                  type="password"
                  required
                  className="input pl-11"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-600 dark:text-rose-300">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary flex w-full items-center justify-center gap-2">
              {loading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900/30 border-t-slate-900" />
              ) : (
                <>
                  Sign in <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-(--text-2)">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
