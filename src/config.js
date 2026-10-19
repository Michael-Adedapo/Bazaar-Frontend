// ─── Menu data ───────────────────────────────────────────────────────────────
export const MENU = [
  {
    category: 'Plates',
    items: [
      { id: 'f1', name: 'Jollof Rice & Chicken',  price: 3500 },
      { id: 'f2', name: 'Fried Rice & Beef',       price: 3000 },
      { id: 'f3', name: 'Special Asun Portion',    price: 4000 },
      { id: 'f4', name: 'Special Praited Rogs',    price: 5000 },
    ],
  },
  {
    category: 'Drinks',
    items: [
      { id: 'd1', name: 'Chilled Soft Drink',  price:  500 },
      { id: 'd2', name: 'Fresh Fruit Juice',   price: 1200 },
      { id: 'd3', name: 'Bottled Water',       price:  300 },
    ],
  },
]

export const ALL_ITEMS          = MENU.flatMap(g => g.items)
export const DISCOUNT_THRESHOLD = 30_000

// ─── Config (set these in .env) ──────────────────────────────────────────────
export const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '2348000000000'
export const BANK_NAME       = import.meta.env.VITE_BANK_NAME       || 'GTBank'
export const ACCOUNT_NUMBER  = import.meta.env.VITE_ACCOUNT_NUMBER  || '0123456789'
export const ACCOUNT_NAME    = import.meta.env.VITE_ACCOUNT_NAME    || 'BOL Bazaar'
export const API_URL         = import.meta.env.VITE_API_URL         || 'http://localhost:8000'
