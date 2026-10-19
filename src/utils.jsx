import { WHATSAPP_NUMBER, BANK_NAME, ACCOUNT_NAME } from './Config'

// Format a number as Nigerian Naira
export function fmt(n) {
  return '₦' + n.toLocaleString('en-NG')
}

// Build the pre-filled WhatsApp message sent after payment
export function buildWhatsAppMessage({ customer_name, customer_phone, items, subtotal, discount, total, order_id }) {
  const itemLines = items
    .map(it => `  • ${it.name} ×${it.quantity} — ${fmt(it.price * it.quantity)}`)
    .join('\n')

  const discountLine = discount > 0
    ? `\nDiscount (5%): −${fmt(discount)}`
    : ''

  return [
    `🛍 *BOL Bazaar Pre-Order — Payment Receipt*`,
    `─────────────────────────────────────────`,
    `📋 *Order Ref:* ${order_id}`,
    ``,
    `👤 *Name:* ${customer_name}`,
    `📞 *WhatsApp:* ${customer_phone}`,
    ``,
    `🍽 *Order:*`,
    itemLines,
    `─────────────────────────────────────────`,
    `Subtotal: ${fmt(subtotal)}${discountLine}`,
    `💰 *Amount Paid: ${fmt(total)}*`,
    ``,
    `_Payment made to ${ACCOUNT_NAME} — ${BANK_NAME}_`,
    ``,
    `📎 *Payment screenshot attached above.*`,
    `Kindly confirm my order. Thank you!`,
  ].join('\n')
}

// Generate a local order ref as fallback if the backend is unreachable
export function localRef() {
  return 'BOL-' + Date.now().toString(36).toUpperCase()
}
