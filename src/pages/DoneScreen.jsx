export default function DoneScreen({ order, onReset }) {
  return (
    <div className="min-h-screen bg-[#FDF8F9] flex items-center justify-center p-4">
      <div className="bg-white border border-[#EAE2E5] rounded-3xl p-8 w-full max-w-md
        shadow-sm text-center">
        <div className="w-14 h-14 rounded-full bg-[#F0FDF4] flex items-center
          justify-center mx-auto mb-5">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 13l4 4L19 7" stroke="#15803D" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <h1 className="text-2xl font-black tracking-tight text-[#1A1215] mb-1.5">
          Receipt Sent!
        </h1>
        <p className="text-sm text-[#9E8E92] font-medium mb-6 leading-relaxed">
          Once your payment is verified by the admin,<br />
          a confirmation will be sent to your WhatsApp.
        </p>

        <div className="bg-[#FDF8F9] border border-[#EAE2E5] rounded-2xl p-4 mb-6">
          <p className="text-[10px] font-bold tracking-[.14em] uppercase text-[#C4B4B9] mb-1">
            Order Reference
          </p>
          <code className="text-sm font-bold text-[#1A1215] tracking-wide break-all">
            {order.order_id}
          </code>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 mb-6
          flex gap-2 text-left">
          <span className="text-base leading-none mt-0.5">⏳</span>
          <p className="text-xs text-amber-800 font-medium leading-relaxed">
            Your order is pending payment verification. Do not place a duplicate order.
            The admin will reach you on WhatsApp once confirmed.
          </p>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="w-full py-3.5 rounded-2xl font-bold text-sm text-[#6E5E63]
            bg-[#FDF8F9] border border-[#EAE2E5] hover:bg-[#F5EDF0] transition-colors"
        >
          Place Another Order
        </button>
      </div>
    </div>
  )
}