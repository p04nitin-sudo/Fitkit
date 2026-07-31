import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'

export default function ProtectedRoute() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center">
        <div className="h-10 w-10 rounded-full border-2 border-(--border) border-t-emerald-500 animate-spin" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  return (
    <Layout>
      <Outlet />
    </Layout>
  )
}
