import { useState, useEffect, useCallback } from 'react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function fmt(n) {
  return '₦' + Number(n ?? 0).toLocaleString('en-NG')
}

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

function BestSellers({ orders }) {
  // Aggregate item quantities across all orders
  const counts = {}
  orders.forEach(o => {
    if (!Array.isArray(o.items)) return
    o.items.forEach(item => {
      const name = item.name ?? item.id ?? 'Unknown'
      const qty  = item.quantity ?? item.qty ?? 1
      counts[name] = (counts[name] ?? 0) + qty
    })
  })

  const ranked = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)

  if (ranked.length === 0) return null

  const max = ranked[0][1]

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <h2 className="text-sm font-semibold text-gray-700 mb-4">Best Sellers</h2>
      <div className="space-y-2.5">
        {ranked.map(([name, qty], i) => (
          <div key={name} className="flex items-center gap-3">
            <span className="w-5 text-xs font-bold text-gray-400 text-right shrink-0">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-gray-800 truncate">{name}</span>
                <span className="text-gray-500 shrink-0 ml-2">{qty} ordered</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-orange-400 transition-all duration-500"
                  style={{ width: `${(qty / max) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
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

  // Total sales = sum of all confirmed order totals
  const totalSales = orders
    .filter(o => o.status === 'confirmed')
    .reduce((sum, o) => sum + (o.total ?? o.pricing?.amount_due ?? 0), 0)

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
      return items.map(i => {
        const qty = i.quantity ?? i.qty ?? 1
        return `${i.name}${qty > 1 ? ` ×${qty}` : ''}`
      }).join(', ')
    return JSON.stringify(items)
  }

  const getId = (o) => o._id ?? o.ref ?? o.id

  // Field name helpers — backend saves customer_name / customer_phone
  const getName  = (o) => o.customer_name  ?? o.name  ?? '—'
  const getPhone = (o) => o.customer_phone ?? o.phone ?? o.whatsapp ?? '—'

  const exportPDF = () => {
    const date = new Date().toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })

    const rows = orders.map(o => {
      const total = o.total ?? o.pricing?.amount_due ?? 0
      const items = Array.isArray(o.items)
        ? o.items.map(i => {
            const qty = i.quantity ?? i.qty ?? 1
            return `${i.name}${qty > 1 ? ` ×${qty}` : ''}`
          }).join(', ')
        : (o.items ?? '—')
      const status = o.status ?? 'pending'
      const statusColor = status === 'confirmed' ? '#16a34a' : status === 'cancelled' ? '#dc2626' : '#d97706'

      return `
        <tr>
          <td>${String(getId(o)).slice(-8).toUpperCase()}</td>
          <td>${getName(o)}</td>
          <td>${getPhone(o)}</td>
          <td class="items">${items}</td>
          <td class="right">₦${Number(total).toLocaleString('en-NG')}</td>
          <td>${o.created_at ? new Date(o.created_at).toLocaleString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}</td>
          <td><span style="color:${statusColor};font-weight:600;text-transform:capitalize">${status}</span></td>
        </tr>`
    }).join('')

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>BOL Bazaar — Sales Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #111; padding: 32px; }
    header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; border-bottom: 2px solid #ea580c; padding-bottom: 16px; }
    header h1 { font-size: 22px; color: #ea580c; }
    header p { font-size: 11px; color: #555; margin-top: 2px; }
    .stats { display: flex; gap: 24px; margin-bottom: 24px; }
    .stat { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 10px 16px; }
    .stat-label { font-size: 10px; color: #777; }
    .stat-value { font-size: 16px; font-weight: 700; color: #ea580c; }
    table { width: 100%; border-collapse: collapse; }
    thead tr { background: #ea580c; color: white; }
    thead th { padding: 8px 10px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; }
    thead th.right { text-align: right; }
    tbody tr:nth-child(even) { background: #fafafa; }
    tbody tr { border-bottom: 1px solid #eee; }
    tbody td { padding: 7px 10px; vertical-align: top; }
    tbody td.right { text-align: right; font-weight: 600; }
    tbody td.items { max-width: 200px; color: #444; }
    @media print {
      @page { margin: 20mm; size: A4 landscape; }
    }
  </style>
</head>
<body>
  <header>
    <div>
      <h1>🍽️ BOL Bazaar</h1>
      <p>Sales Report — Generated ${date}</p>
    </div>
    <div style="text-align:right">
      <p style="font-size:13px;font-weight:700">Total Orders: ${orders.length}</p>
      <p style="font-size:13px;font-weight:700;color:#16a34a">Total Sales: ₦${Number(totalSales).toLocaleString('en-NG')}</p>
    </div>
  </header>
  <table>
    <thead>
      <tr>
        <th>Ref</th><th>Customer</th><th>WhatsApp</th><th>Items</th>
        <th class="right">Total</th><th>Date</th><th>Status</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`

    const win = window.open('', '_blank')
    win.document.write(html)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print() }, 500)
  }

  const skeletonStats = Array.from({ length: 5 }).map((_, i) => (
    <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm animate-pulse">
      <div className="h-2.5 w-20 bg-gray-100 rounded mb-3" />
      <div className="h-7 w-10 bg-gray-100 rounded" />
    </div>
  ))

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
              onClick={exportPDF}
              disabled={loading || orders.length === 0}
              className="text-sm bg-orange-50 text-orange-600 hover:bg-orange-100 disabled:opacity-40 px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5"
            >
              ↓ Export PDF
            </button>
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
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {loading ? skeletonStats : (
            <>
              <StatCard label="Total Sales (confirmed)" value={fmt(totalSales)} color="text-orange-600" />
              <StatCard label="Total Orders"            value={counts.all}       color="text-gray-900" />
              <StatCard label="Pending"                 value={counts.pending}   color="text-yellow-600" />
              <StatCard label="Confirmed"               value={counts.confirmed} color="text-green-600" />
              <StatCard label="Cancelled"               value={counts.cancelled} color="text-red-600" />
            </>
          )}
        </div>

        {/* Best sellers */}
        {!loading && !error && <BestSellers orders={orders} />}

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

        {/* Orders table */}
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
                    {['Ref','Customer','WhatsApp','Items','Total','Date','Status','Actions'].map(h => (
                      <th key={h} className={`px-4 py-3 font-medium ${h === 'Total' ? 'text-right' : 'text-left'}`}>{h}</th>
                    ))}
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
                    {['Ref','Customer','WhatsApp','Items','Total','Date','Status','Actions'].map(h => (
                      <th key={h} className={`px-4 py-3 font-medium ${h === 'Total' ? 'text-right' : 'text-left'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(order => {
                    const id     = getId(order)
                    const phone  = getPhone(order)
                    const status = order.status || 'pending'
                    return (
                      <tr key={id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-gray-400">
                          {String(id).slice(-8).toUpperCase()}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                          {getName(order)}
                        </td>
                        <td className="px-4 py-3">
                          {phone !== '—' ? (
                            <a href={`https://wa.me/${phone}`} target="_blank" rel="noreferrer"
                              className="text-green-600 hover:underline">
                              {phone}
                            </a>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-600 max-w-xs">
                          <span className="line-clamp-2">{formatItems(order.items)}</span>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900 whitespace-nowrap">
                          {fmt(order.total ?? order.pricing?.amount_due)}
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
                              <button onClick={() => updateStatus(id, 'confirmed')}
                                className="text-xs bg-green-50 text-green-700 hover:bg-green-100 px-2 py-1 rounded-lg font-medium transition-colors">
                                ✓ Confirm
                              </button>
                            )}
                            {status === 'pending' && (
                              <button onClick={() => updateStatus(id, 'cancelled')}
                                className="text-xs bg-red-50 text-red-600 hover:bg-red-100 px-2 py-1 rounded-lg font-medium transition-colors">
                                ✕
                              </button>
                            )}
                            {status === 'confirmed' && (
                              <button onClick={() => updateStatus(id, 'pending')}
                                className="text-xs bg-gray-50 text-gray-600 hover:bg-gray-100 px-2 py-1 rounded-lg font-medium transition-colors">
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