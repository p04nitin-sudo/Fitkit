import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  UtensilsCrossed,
  Dumbbell,
  User,
  LogOut,
  Menu,
  X,
  Flame,
  Sun,
  Moon,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/meals', label: 'Meals', icon: UtensilsCrossed },
  { to: '/workouts', label: 'Workouts', icon: Dumbbell },
  { to: '/profile', label: 'Profile', icon: User },
]

function SidebarContent({ onNavigate }) {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-full flex-col p-5">
      <div className="flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-400">
          <Flame size={22} className="text-slate-950" strokeWidth={2.5} />
        </div>
        <div className="min-w-0">
          <div className="text-lg font-extrabold tracking-tight text-(--text-1)">
            Fit<span className="text-gradient">Kit</span>
          </div>
          <div className="text-[11px] font-medium text-(--text-3)">Smart Fitness Tracker</div>
        </div>
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-(--border) text-(--text-2) transition hover:bg-(--hover) hover:text-(--text-1)"
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>
      </div>

      <nav className="mt-10 flex flex-1 flex-col gap-1.5">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-500/15 to-cyan-500/10 text-emerald-600 dark:text-emerald-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
                  : 'text-(--text-2) hover:bg-(--hover) hover:text-(--text-1)'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={19}
                  className={`shrink-0 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-(--text-3) group-hover:text-(--text-1)'}`}
                />
                <span className="truncate">{label}</span>
                {isActive && (
                  <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="rounded-2xl border border-(--border) bg-(--hover) p-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 text-sm font-bold text-slate-950">
            {(user?.name || user?.username || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-(--text-1)">
              {user?.name || user?.username}
            </div>
            <div className="truncate text-[11px] text-(--text-3)">{user?.email}</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-(--border) py-2 text-xs font-semibold text-(--text-2) transition hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-500 dark:hover:text-rose-300"
        >
          <LogOut size={14} />
          Log out
        </button>
      </div>
    </div>
  )
}

export default function Layout({ children }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="min-h-screen bg-app">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-(--border) bg-(--sidebar) backdrop-blur-xl lg:block">
        <SidebarContent />
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-(--overlay) backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-72 border-r border-(--border) bg-(--sidebar) shadow-2xl">
            <button
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 z-10 rounded-lg p-2 text-(--text-2) hover:bg-(--hover) hover:text-(--text-1)"
            >
              <X size={18} />
            </button>
            <SidebarContent onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-(--border) bg-(--header) px-5 py-3.5 backdrop-blur-xl lg:px-8">
          <button
            onClick={() => setOpen(true)}
            className="rounded-lg p-2 text-(--text-2) hover:bg-(--hover) lg:hidden"
          >
            <Menu size={20} />
          </button>
          <div className="hidden text-sm text-(--text-3) lg:block">
            Track. Train. Transform.
          </div>
          <div className="flex items-center gap-2 rounded-full border border-(--border) bg-(--hover) px-3 py-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-300">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            Fit &amp; Active
          </div>
        </header>
        <main className="px-5 py-7 lg:px-8 lg:py-9">{children}</main>
      </div>
    </div>
  )
}
