import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Flame, Mail, Lock, User as UserIcon, ArrowRight, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const [form, setForm] = useState({
    username: '',
    name: '',
    email: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(form)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-app">
      <div className="flex flex-1 items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-400 shadow-lg shadow-emerald-500/25">
              <Flame size={24} className="text-slate-950" strokeWidth={2.5} />
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-(--text-1)">
              Fit<span className="text-gradient">Kit</span>
            </span>
          </div>

          <h2 className="text-3xl font-extrabold tracking-tight text-(--text-1)">Create your account</h2>
          <p className="mt-2 text-sm text-(--text-2)">Start tracking meals, workouts and progress today.</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-(--text-3)">
                  Full name
                </label>
                <div className="relative">
                  <UserIcon size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-(--text-3)" />
                  <input
                    className="input pl-11"
                    placeholder="Alex"
                    value={form.name}
                    onChange={set('name')}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-(--text-3)">
                  Username
                </label>
                <div className="relative">
                  <UserIcon size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-(--text-3)" />
                  <input
                    required
                    minLength={3}
                    className="input pl-11"
                    placeholder="alex.fit"
                    value={form.username}
                    onChange={set('username')}
                  />
                </div>
              </div>
            </div>

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
                  value={form.email}
                  onChange={set('email')}
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
                  minLength={6}
                  className="input pl-11"
                  placeholder="At least 6 characters"
                  value={form.password}
                  onChange={set('password')}
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
                  Create account <CheckCircle2 size={17} />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-(--text-2)">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      <div className="hidden flex-1 items-center justify-center bg-gradient-to-br from-emerald-600/20 via-cyan-600/10 to-transparent p-12 lg:flex">
        <div className="max-w-md">
          <h2 className="text-4xl font-extrabold leading-tight tracking-tight text-(--text-1)">
            One account.
            <br />
            <span className="text-gradient">Total control.</span>
          </h2>
          <ul className="mt-8 space-y-4">
            {[
              'Personalized daily calorie targets',
              'Meal-by-meal macro tracking',
              'Saved exercise library',
              'Beautiful weekly progress charts',
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-(--text-2)">
                <CheckCircle2 size={19} className="shrink-0 text-emerald-500" />
                <span className="text-sm">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
