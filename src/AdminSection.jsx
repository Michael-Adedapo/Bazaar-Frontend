import { useState } from 'react'
import AdminLogin from './AdminLogin'
import AdminDashboard from './AdminDashboard'

// Handles the /admin route — shows login or dashboard depending on auth state.
// Auth state is stored in sessionStorage so it clears when the tab is closed.
export default function AdminSection() {
  const [authed, setAuthed] = useState(
    () => !!sessionStorage.getItem('admin_token')
  )

  if (!authed) return <AdminLogin onLogin={() => setAuthed(true)} />
  return <AdminDashboard onLogout={() => setAuthed(false)} />
}