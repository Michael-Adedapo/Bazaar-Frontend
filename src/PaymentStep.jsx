import { BANK_NAME, ACCOUNT_NUMBER, ACCOUNT_NAME, WHATSAPP_NUMBER } from '../config'
import { fmt, buildWhatsAppMessage } from '../utils'
import CopyButton from '../components/CopyButton'
import WhatsAppIcon from '../components/WhatsAppIcon'

export default function PaymentStep({ order, onWhatsAppSent, onBack }) {
  const { customer_phone, items, discount, total, order_id } = order

  function sendToWhatsApp() {
    const msg = buildWhatsAppMessage(order)
    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`,
      '_blank',
      'noopener,noreferrer'
    )
    // Small delay so WA opens, then show done screen
    setTimeout(onWhatsAppSent, 600)
  }

  return (
    <div className="min-h-screen bg-[#FDF8F9] flex items-center justify-center p-4">
      <div className="bg-white border border-[#EAE2E5] rounded-3xl p-8 w-full max-w-md shadow-sm">

        {/* Back button */}
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#9E8E92]
            hover:text-[#1A1215] transition-colors mb-6 group"
        >
          <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
          Back to order
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-full bg-[#FFF0F4] flex items-center
            justify-center mx-auto mb-4 text-2xl">
            💳
          </div>
          <h2 className="text-xl font-black tracking-tight text-[#1A1215]">
            Make Payment
          </h2>
          <p className="text-xs text-[#9E8E92] font-medium mt-1.5">
            Transfer the exact amount to the account below,<br />
            then send your receipt to WhatsApp for confirmation.
          </p>
        </div>

        {/* Amount to pay — prominent */}
        <div className="bg-[#FFF0F4] border border-[#FFC5D3] rounded-2xl p-4 text-center mb-5">
          <p className="text-[10px] font-bold tracking-[.14em] uppercase text-[#B85C72] mb-1">
            Amount to Transfer
          </p>
          <p className="text-3xl font-black text-[#1A1215] tabular-nums leading-none">
            {fmt(total)}
          </p>
          {discount > 0 && (
            <p className="text-xs text-emerald-700 font-semibold mt-1.5">
              Includes 5% discount — you saved {fmt(discount)}
            </p>
          )}
        </div>

        {/* Bank details */}
        <div className="bg-[#FDF8F9] border border-[#EAE2E5] rounded-2xl p-4 mb-5 space-y-3">
          <p className="text-[10px] font-bold tracking-[.14em] uppercase text-[#C4B4B9]">
            Bank Account Details
          </p>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-[#9E8E92] font-medium">Bank</p>
              <p className="text-sm font-bold text-[#1A1215]">{BANK_NAME}</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-[#9E8E92] font-medium">Account Number</p>
              <p className="text-lg font-black text-[#1A1215] tracking-widest tabular-nums">
                {ACCOUNT_NUMBER}
              </p>
            </div>
            <CopyButton text={ACCOUNT_NUMBER} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-[#9E8E92] font-medium">Account Name</p>
              <p className="text-sm font-bold text-[#1A1215]">{ACCOUNT_NAME}</p>
            </div>
            <CopyButton text={ACCOUNT_NAME} />
          </div>
        </div>

        {/* Order summary (compact) */}
        <div className="border border-[#EAE2E5] rounded-2xl p-4 mb-5">
          <p className="text-[10px] font-bold tracking-[.14em] uppercase text-[#C4B4B9] mb-2">
            Order Ref: {order_id}
          </p>
          {items.map(it => (
            <div key={it.id} className="flex justify-between text-xs py-1
              border-b border-[#EAE2E5] last:border-b-0">
              <span className="text-[#9E8E92]">
                {it.name} <span className="text-[#C4B4B9]">×{it.quantity}</span>
              </span>
              <span className="font-semibold text-[#1A1215] tabular-nums">
                {fmt(it.price * it.quantity)}
              </span>
            </div>
          ))}
        </div>

        {/* Steps */}
        <ol className="space-y-2 mb-6">
          {[
            'Transfer ' + fmt(total) + ' to the account above',
            'Take a screenshot of your payment receipt',
            'Tap the button below — your order details will be pre-filled',
            'Attach the screenshot and send the message',
          ].map((step, i) => (
            <li key={i} className="flex gap-2.5 text-xs text-[#6E5E63] font-medium">
              <span className="w-5 h-5 rounded-full bg-[#FFF0F4] border border-[#FFC5D3]
                text-[#B85C72] font-bold flex items-center justify-center shrink-0 text-[10px]">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>

        {/* WhatsApp CTA */}
        <button
          type="button"
          onClick={sendToWhatsApp}
          className="w-full py-4 rounded-2xl font-bold text-sm text-white
            bg-[#25D366] hover:bg-[#20BC5A] active:scale-[.99]
            flex items-center justify-center gap-2 transition-all
            hover:shadow-[0_4px_16px_rgba(37,211,102,.3)] mb-3"
        >
          <WhatsAppIcon size={18} />
          I've Paid — Send Receipt on WhatsApp
        </button>

        <p className="text-[10px] text-[#C4B4B9] text-center font-medium leading-relaxed">
          Your order is reserved. Confirmation will be sent<br />
          to <strong className="text-[#9E8E92]">{customer_phone}</strong> once payment is verified.
        </p>
      </div>
    </div>
  )
}