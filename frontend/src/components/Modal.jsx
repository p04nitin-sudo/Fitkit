import React, { useEffect } from 'react'
import { X } from 'lucide-react'

export default function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-(--overlay) backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-(--border-strong) bg-(--modal) p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-bold text-(--text-1)">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-(--text-2) hover:bg-(--hover) hover:text-(--text-1)"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
