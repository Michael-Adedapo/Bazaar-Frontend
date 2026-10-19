import { useState, useEffect } from 'react'
import { MENU, ALL_ITEMS, DISCOUNT_THRESHOLD, API_URL } from '../config'
import { fmt, localRef } from '../utils'

const LS_KEY = 'bol_bazaar_draft'

function loadDraft() {
  try {
    const saved = localStorage.getItem(LS_KEY)
    return saved ? JSON.parse(saved) : null
  } catch { return null }
}

function saveDraft(data) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)) } catch {}
}

function clearDraft() {
  try { localStorage.removeItem(LS_KEY) } catch {}
}

export default function OrderForm({ onComplete }) {
  const draft = loadDraft()
  const [cart, setCart]   = useState(draft?.cart  ?? {})
  const [name, setName]   = useState(draft?.name  ?? '')
  const [phone, setPhone] = useState(draft?.phone ?? '')
  const [busy, setBusy]   = useState(false)
  const [error, setError] = useState(null)

  // Save draft to localStorage whenever cart, name, or phone changes
  useEffect(() => {
    saveDraft({ cart, name, phone })
  }, [cart, name, phone])

  function changeQty(id, delta) {
    setCart(prev => {
      const next = Math.max(0, (prev[id] || 0) + delta)
      if (next === 0) { const c = { ...prev }; delete c[id]; return c }
      return { ...prev, [id]: next }
    })
  }

  const cartEntries = Object.entries(cart).filter(([, q]) => q > 0)
  const subtotal    = cartEntries.reduce((s, [id, q]) => {
    const it = ALL_ITEMS.find(x => x.id === id)
    return s + (it ? it.price * q : 0)
  }, 0)
  const discount = subtotal >= DISCOUNT_THRESHOLD ? Math.floor(subtotal * 0.05) : 0
  const total    = subtotal - discount
  const pct      = Math.min(100, (subtotal / DISCOUNT_THRESHOLD) * 100)
  const unlocked = discount > 0

  async function handleSubmit(e) {
    e.preventDefault()
    if (!cartEntries.length) { setError('Select at least one item to continue.'); return }
    setBusy(true); setError(null)

    const items = cartEntries.map(([id, quantity]) => {
      const it = ALL_ITEMS.find(x => x.id === id)
      return { id, name: it.name, price: it.price, quantity }
    })

    let order_id = localRef() // always have a ref ready

    // Try to record with backend; if it fails, proceed anyway with local ref
    try {
      const res = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_name: name, customer_phone: phone, items }),
      })
      if (res.ok) {
        const data = await res.json()
        order_id = data.order_id ?? order_id
      }
    } catch {
      // Backend unreachable — continue with local ref, WhatsApp is the source of truth
    }

    clearDraft()
    onComplete({ order_id, customer_name: name, customer_phone: phone, items, subtotal, discount, total })
    setBusy(false)
  }

  return (
    <div className="min-h-screen bg-[#FDF8F9]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-20 pt-12">

        {/* Header */}
        <header className="text-center mb-9">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-[#1A1215] lowercase">
            bazaar pre-order
          </h1>
          <p className="mt-2.5 text-xs text-[#9E8E92] font-medium">
            order ahead and unlock{' '}
            <strong className="text-[#1A1215] font-bold">5% off</strong>{' '}
            on orders over{' '}
            <strong className="text-[#1A1215] font-bold">₦30,000</strong>
          </p>
        </header>

        <form onSubmit={handleSubmit}
          className="grid grid-cols-1 lg:grid-cols-[1fr_288px] gap-4 items-start">

          {/* ── LEFT ── */}
          <div className="flex flex-col gap-4">

            {/* Contact */}
            <div className="bg-white border border-[#EAE2E5] rounded-3xl p-6">
              <span className="block text-[10.5px] font-bold tracking-[.12em] uppercase
                text-[#C4B4B9] mb-4">Contact Details</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { id: 'name',  label: 'Full Name',      type: 'text', ac: 'name', ph: 'Your full name',    val: name,  set: setName  },
                  { id: 'phone', label: 'WhatsApp Phone',  type: 'tel',  ac: 'tel',  ph: '+234 000 000 0000', val: phone, set: setPhone },
                ].map(f => (
                  <div key={f.id} className="flex flex-col gap-1.5">
                    <label htmlFor={f.id}
                      className="text-[11px] font-semibold text-[#6E5E63] tracking-wide">
                      {f.label}
                    </label>
                    <input
                      id={f.id} type={f.type} required autoComplete={f.ac}
                      placeholder={f.ph} value={f.val}
                      onChange={e => f.set(e.target.value)}
                      className="bg-[#FDF8F9] border-[1.5px] border-[#EAE2E5] rounded-xl
                        px-3.5 py-2.5 text-sm font-medium text-[#1A1215]
                        placeholder:text-[#C4B4B9] placeholder:font-normal
                        focus:outline-none focus:border-[#FFC5D3] focus:ring-2
                        focus:ring-[#FFC5D3]/30 hover:border-[#D8CDD1] transition-colors"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Items */}
            <div className="bg-white border border-[#EAE2E5] rounded-3xl p-6">
              <span className="block text-[10.5px] font-bold tracking-[.12em] uppercase
                text-[#C4B4B9] mb-4">Select Items</span>
              {MENU.map(({ category, items }) => (
                <div key={category} className="mb-5 last:mb-0">
                  <span className="block text-[10px] font-bold tracking-[.14em] uppercase
                    text-[#B85C72] mb-1 px-0.5">{category}</span>
                  {items.map(item => {
                    const qty = cart[item.id] || 0
                    return (
                      <div key={item.id}
                        className="flex items-center justify-between py-2.5
                          border-b border-[#EAE2E5] last:border-b-0 gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#1A1215] truncate">
                            {item.name}
                          </p>
                          <p className="text-xs font-medium text-[#9E8E92] mt-0.5">
                            {fmt(item.price)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0"
                          role="group" aria-label={`${item.name} quantity`}>
                          <button type="button"
                            onClick={() => changeQty(item.id, -1)} disabled={qty === 0}
                            aria-label={`Remove ${item.name}`}
                            className="w-9 h-9 rounded-[9px] border-[1.5px] border-[#EAE2E5]
                              bg-white text-[#9E8E92] text-lg font-medium
                              flex items-center justify-center
                              hover:bg-[#FDF8F9] hover:border-[#D8CDD1] active:scale-90
                              disabled:opacity-25 disabled:cursor-not-allowed transition-all">−</button>
                          <span className="w-5 text-center text-sm font-bold text-[#1A1215]
                            tabular-nums select-none" aria-live="polite">{qty}</span>
                          <button type="button"
                            onClick={() => changeQty(item.id, 1)}
                            aria-label={`Add ${item.name}`}
                            className="w-9 h-9 rounded-[9px] bg-[#FFC5D3] border-[1.5px]
                              border-[#FFC5D3] text-[#1A1215] text-lg font-bold
                              flex items-center justify-center
                              hover:bg-[#FFB0C2] hover:border-[#FFB0C2] active:scale-90
                              transition-all">+</button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>

            {/* Discount progress bar */}
            <div className="bg-white border border-[#EAE2E5] rounded-3xl p-6">
              <div className="flex justify-between items-center mb-2.5">
                <span className={`text-xs font-semibold transition-colors ${
                  unlocked ? 'text-emerald-700' : 'text-[#9E8E92]'}`}>
                  {unlocked
                    ? '🎉 5% discount unlocked!'
                    : `${fmt(DISCOUNT_THRESHOLD - subtotal)} away from 5% off`}
                </span>
                <span className="text-xs font-bold text-[#C4B4B9] tabular-nums">
                  {Math.round(pct)}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#EAE2E5] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    unlocked ? 'bg-emerald-400' : 'bg-[#FFC5D3]'}`}
                  style={{ width: `${pct}%` }}
                  role="progressbar" aria-valuenow={Math.round(pct)}
                  aria-valuemin={0} aria-valuemax={100}
                />
              </div>
              <p className="text-[10px] text-[#C4B4B9] font-medium mt-1.5">
                ₦30,000 threshold
              </p>
            </div>

            {/* Error */}
            {error && (
              <div role="alert" className="flex gap-2 bg-rose-50 border border-rose-200
                text-rose-700 text-xs font-medium rounded-xl px-3.5 py-3">
                <svg className="w-3.5 h-3.5 shrink-0 mt-0.5" viewBox="0 0 16 16"
                  fill="currentColor" aria-hidden="true">
                  <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 4a.75.75 0 011.5 0v3
                    a.75.75 0 01-1.5 0V5zm.75 6.5a1 1 0 110-2 1 1 0 010 2z"/>
                </svg>
                {error}
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={busy}
              className="w-full py-4 rounded-2xl font-bold text-sm text-[#1A1215]
                bg-[#FFC5D3] hover:bg-[#FFB0C2] disabled:opacity-50
                disabled:cursor-not-allowed flex items-center justify-center gap-2
                transition-colors hover:shadow-[0_4px_16px_rgba(255,197,211,.4)]">
              {busy ? (
                <span className="flex items-center gap-2">
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1A1215] animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1A1215] animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1A1215] animate-bounce [animation-delay:300ms]" />
                  </span>
                  Processing
                </span>
              ) : 'Proceed to Payment →'}
            </button>
          </div>

          {/* ── RIGHT: Order Summary sidebar ── */}
          <aside className="lg:sticky lg:top-6">
            <div className="bg-white border border-[#EAE2E5] rounded-3xl p-6">
              <span className="block text-[10.5px] font-bold tracking-[.12em] uppercase
                text-[#C4B4B9] mb-4">Order Summary</span>
              <div className="mb-4 min-h-6">
                {cartEntries.length === 0
                  ? <p className="text-xs text-[#C4B4B9] italic">No items selected yet.</p>
                  : cartEntries.map(([id, qty]) => {
                      const it = ALL_ITEMS.find(x => x.id === id)
                      return (
                        <div key={id} className="flex justify-between items-baseline gap-2
                          py-1.5 border-b border-[#EAE2E5] last:border-b-0 text-xs">
                          <span className="text-[#9E8E92] flex-1 min-w-0 truncate">
                            {it.name} <span className="text-[#C4B4B9]">×{qty}</span>
                          </span>
                          <span className="font-semibold text-[#1A1215] tabular-nums">
                            {fmt(it.price * qty)}
                          </span>
                        </div>
                      )
                    })
                }
              </div>
              <div className="border-t border-[#EAE2E5] pt-3.5 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#9E8E92] font-medium">Subtotal</span>
                  <span className="font-semibold text-[#1A1215] tabular-nums">{fmt(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-emerald-700 font-bold">Discount</span>
                    <span className="text-emerald-700 font-bold tabular-nums">−{fmt(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline pt-3
                  border-t border-[#EAE2E5] mt-2">
                  <span className="font-black text-sm text-[#1A1215]">Total Due:</span>
                  <span className="font-black text-2xl text-[#1A1215] tabular-nums leading-none">
                    {fmt(total)}
                  </span>
                </div>
              </div>
            </div>
            {unlocked && (
              <div className="mt-2.5 flex items-center gap-2 bg-emerald-50 border
                border-emerald-200 rounded-xl px-4 py-3 text-xs font-semibold text-emerald-700">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    stroke="currentColor" strokeWidth="2.5"
                    strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                5% discount applied
              </div>
            )}
          </aside>
        </form>
      </div>
    </div>
  )
}