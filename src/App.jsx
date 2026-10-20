import { useState } from 'react'
import AdminSection from './AdminSection'
import OrderForm from './pages/OrderForm'
import PaymentStep from './pages/PaymentStep'
import DoneScreen from './pages/DoneScreen'

const SESSION_KEY = 'bol_bazaar_session'

function loadSession() {
  try {
    const saved = sessionStorage.getItem(SESSION_KEY)
    if (saved) return JSON.parse(saved)
  } catch {}
  return null
}

function saveSession(step, order) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ step, order }))
  } catch {}
}

function clearSession() {
  try {
    sessionStorage.removeItem(SESSION_KEY)
  } catch {}
}

export default function App() {
  // Send /admin routes to the admin section — customers never see this
  if (window.location.pathname.startsWith('/admin')) return <AdminSection />

  const saved = loadSession()

  const [step, setStep]   = useState(saved?.step  ?? 'form')
  const [order, setOrder] = useState(saved?.order ?? null)

  function handleOrderComplete(orderData) {
    setOrder(orderData)
    setStep('payment')
    saveSession('payment', orderData)
  }

  function handleWhatsAppSent() {
    setStep('done')
    saveSession('done', order)
  }

  function reset() {
    setStep('form')
    setOrder(null)
    clearSession()
  }

  if (step === 'payment') return <PaymentStep order={order} onWhatsAppSent={handleWhatsAppSent} onBack={() => { setStep('form'); clearSession() }} />
  if (step === 'done')    return <DoneScreen  order={order} onReset={reset} />

  return <OrderForm onComplete={handleOrderComplete} />
}