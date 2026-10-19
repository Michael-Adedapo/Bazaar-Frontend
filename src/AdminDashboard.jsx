import { useState, useEffect, useCallback } from 'react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function StatusBadge({ status }) {
  const map = {
    pending:   'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-green-100  text-green-700',
    cancelled: 'bg-red-100    text-red-700',
  }
  const s = status || 'pending'
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${map[s] ?? map.pending}`}>
      {s}
    </span>
  )
}

function StatCard({ label, value, color }) {
  return (
    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  )
}

export default function AdminDashboard({ onLogout }) {
  const [orders, setOrders]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [filter, setFilter]   = useState('all')

  const token = sessionStorage.getItem('admin_token')

  const authedFetch = useCallback(
    (url, opts = {}) =>
      fetch(url, {
        ...opts,
        headers: { Authorization: `Bearer ${token}`, ...(opts.headers ?? {}) },
      }),
    [token]
  )

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await authedFetch(`${API}/api/orders`)
      if (res.status === 401) { onLogout(); return }
      if (!res.ok) throw new Error()
      const data = await res.json()
      // newest first — handle both array and {orders:[]} shapes
      const list = Array.isArray(data) ? data : (data.orders ?? [])
      setOrders([...list].reverse())
    } catch {
      setError('Could not load orders. Check your backend is running.')
    } finally {
      setLoading(false)
    }
  }, [authedFetch, onLogout])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  const updateStatus = async (id, status) => {
    try {
      const res = await authedFetch(`${API}/api/orders/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.status === 401) { onLogout(); return }
      setOrders(prev =>
        prev.map(o => (o._id === id || o.ref === id) ? { ...o, status } : o)
      )
    } catch {
      alert('Failed to update order status')
    }
  }

  const logout = () => {
    sessionStorage.removeItem('admin_token')
    onLogout()
  }

  const counts = {
    all:       orders.length,
    pending:   orders.filter(o => !o.status || o.status === 'pending').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
  }

  const filtered =
    filter === 'all' ? orders : orders.filter(o => (o.status || 'pending') === filter)

  const formatDate = (ts) => {
    if (!ts) return '—'
    return new Date(ts).toLocaleString('en-NG', {
      day: 'numeric', month: 'short',
      hour: '2-digit', minute: '2-digit',
    })
  }

  const formatItems = (items) => {
    if (!items) return '—'
    if (typeof items === 'string') return items
    if (Array.isArray(items))
      return items.map(i => `${i.name}${i.qty > 1 ? ` ×${i.qty}` : ''}`).join(', ')
    return JSON.stringify(items)
  }

  const getId = (o) => o._id ?? o.ref ?? o.id

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🍽️</span>
            <div>
              <h1 className="font-bold text-gray-900 leading-tight">BOL Bazaar</h1>
              <p className="text-xs text-gray-500">Admin Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={fetchOrders}
              disabled={loading}
              className="text-sm text-gray-500 hover:text-gray-800 disabled:opacity-40 flex items-center gap-1.5"
            >
              {loading ? (
                <span className="flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:300ms]" />
                </span>
              ) : '↻ Refresh'}
            </button>
            <button
              onClick={logout}
              className="text-sm text-red-500 hover:text-red-700 font-medium"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm animate-pulse">
                <div className="h-2.5 w-20 bg-gray-100 rounded mb-3" />
                <div className="h-7 w-10 bg-gray-100 rounded" />
              </div>
            ))
          ) : (
            <>
              <StatCard label="Total Orders"  value={counts.all}       color="text-gray-900" />
              <StatCard label="Pending"       value={counts.pending}   color="text-yellow-600" />
              <StatCard label="Confirmed"     value={counts.confirmed} color="text-green-600" />
              <StatCard label="Cancelled"     value={counts.cancelled} color="text-red-600" />
            </>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {['all', 'pending', 'confirmed', 'cancelled'].map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${
                filter === tab
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-orange-300'
              }`}
            >
              {tab} ({counts[tab] ?? 0})
            </button>
          ))}
        </div>

        {/* Content */}
        {error ? (
          <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl p-6 text-center text-sm">
            {error}
          </div>
        ) : loading ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr className="text-xs text-gray-500 uppercase tracking-wide">
                    <th className="px-4 py-3 text-left font-medium">Ref</th>
                    <th className="px-4 py-3 text-left font-medium">Customer</th>
                    <th className="px-4 py-3 text-left font-medium">WhatsApp</th>
                    <th className="px-4 py-3 text-left font-medium">Items</th>
                    <th className="px-4 py-3 text-right font-medium">Total</th>
                    <th className="px-4 py-3 text-left font-medium">Date</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-left font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-4 py-3"><div className="h-3 w-16 bg-gray-100 rounded" /></td>
                      <td className="px-4 py-3"><div className="h-3 w-24 bg-gray-100 rounded" /></td>
                      <td className="px-4 py-3"><div className="h-3 w-28 bg-gray-100 rounded" /></td>
                      <td className="px-4 py-3"><div className="h-3 w-40 bg-gray-100 rounded" /></td>
                      <td className="px-4 py-3 text-right"><div className="h-3 w-16 bg-gray-100 rounded ml-auto" /></td>
                      <td className="px-4 py-3"><div className="h-3 w-20 bg-gray-100 rounded" /></td>
                      <td className="px-4 py-3"><div className="h-5 w-16 bg-gray-100 rounded-full" /></td>
                      <td className="px-4 py-3"><div className="h-6 w-20 bg-gray-100 rounded-lg" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">
            No {filter !== 'all' ? filter : ''} orders yet
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr className="text-xs text-gray-500 uppercase tracking-wide">
                    <th className="px-4 py-3 text-left font-medium">Ref</th>
                    <th className="px-4 py-3 text-left font-medium">Customer</th>
                    <th className="px-4 py-3 text-left font-medium">WhatsApp</th>
                    <th className="px-4 py-3 text-left font-medium">Items</th>
                    <th className="px-4 py-3 text-right font-medium">Total</th>
                    <th className="px-4 py-3 text-left font-medium">Date</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-left font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(order => {
                    const id = getId(order)
                    const phone = order.phone ?? order.whatsapp ?? ''
                    const status = order.status || 'pending'
                    return (
                      <tr key={id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-gray-400">
                          {String(id).slice(-8).toUpperCase()}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                          {order.name}
                        </td>
                        <td className="px-4 py-3">
                          <a
                            href={`https://wa.me/${phone}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-green-600 hover:underline"
                          >
                            {phone}
                          </a>
                        </td>
                        <td className="px-4 py-3 text-gray-600 max-w-xs">
                          <span className="line-clamp-2">{formatItems(order.items)}</span>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900 whitespace-nowrap">
                          ₦{Number(order.total ?? 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                          {formatDate(order.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={status} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1.5">
                            {status === 'pending' && (
                              <button
                                onClick={() => updateStatus(id, 'confirmed')}
                                className="text-xs bg-green-50 text-green-700 hover:bg-green-100 px-2 py-1 rounded-lg font-medium transition-colors"
                              >
                                ✓ Confirm
                              </button>
                            )}
                            {status === 'pending' && (
                              <button
                                onClick={() => updateStatus(id, 'cancelled')}
                                className="text-xs bg-red-50 text-red-600 hover:bg-red-100 px-2 py-1 rounded-lg font-medium transition-colors"
                              >
                                ✕
                              </button>
                            )}
                            {status === 'confirmed' && (
                              <button
                                onClick={() => updateStatus(id, 'pending')}
                                className="text-xs bg-gray-50 text-gray-600 hover:bg-gray-100 px-2 py-1 rounded-lg font-medium transition-colors"
                              >
                                Undo
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}