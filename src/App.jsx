import { useState } from 'react'
import AdminSection from './AdminSection'
import OrderForm from './pages/OrderForm'
import PaymentStep from './pages/PaymentStep'
import DoneScreen from './pages/DoneScreen'

export default function App() {
  // Send /admin routes to the admin section — customers never see this
  if (window.location.pathname.startsWith('/admin')) return <AdminSection />

  const [step, setStep]   = useState('form')   // 'form' | 'payment' | 'done'
  const [order, setOrder] = useState(null)

  function handleOrderComplete(orderData) {
    setOrder(orderData)
    setStep('payment')
  }

  function handleWhatsAppSent() {
    setStep('done')
  }

  function reset() {
    setStep('form')
    setOrder(null)
  }

  if (step === 'payment') return <PaymentStep order={order} onWhatsAppSent={handleWhatsAppSent} onBack={() => setStep('form')} />
  if (step === 'done')    return <DoneScreen  order={order} onReset={reset} />

  return <OrderForm onComplete={handleOrderComplete} />
}