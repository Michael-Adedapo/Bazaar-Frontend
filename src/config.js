// ─── Menu data ───────────────────────────────────────────────────────────────
export const MENU = [
  {
    category: 'Specials',
    items: [
      { id: 'full-chicken',        name: 'Full Chicken',          price: 15000 },
      { id: 'catfish-pepper-soup', name: 'Catfish Pepper Soup',   price: 20000 },
      { id: 'guinea-fowl',         name: 'Guinea Fowl',           price: 15000 },
      { id: 'Chef Ada\'s Special Fried Rice', name: 'Chef Ada\'s Special Fried Rice', price: 8000 },
    ]
  },
  {
    category: 'Plates',
    items: [
      { id: 'jollof-rice',         name: 'Jollof Rice',                  price:  3500 },
      { id: 'jollof-rice-beef',    name: 'Jollof Rice & Beef',           price:  4500 },
      { id: 'jollof-rice-chicken', name: 'Jollof Rice & Chicken Laps',   price:  8000 },
      { id: 'peppered-ponmo',      name: 'Peppered Ponmo (Bowl)',        price:  1500 },
      { id: 'moi-moi-egg',         name: 'Moi-Moi (With Egg)',           price:  1000 },
      { id: 'moi-moi-no-egg',      name: 'Moi-Moi (Without Egg)',        price:   700 },
      { id: 'chicken-laps',        name: 'Chicken Laps',                 price:  5000 },
    ]
  },
  {
    category: 'Drinks',
    items: [
      { id: 'guinness-small', name: 'Guinness Small',  price: 1700 },
      { id: 'malta-guinness', name: 'Malta Guinness',  price: 1000 },
      { id: 'amstel-malta',   name: 'Amstel Malta',    price: 1000 },
      { id: 'desperados',     name: 'Desperados',      price: 1500 },
      { id: 'smirnoff-ice',   name: 'Smirnoff Ice',    price: 1500 },
      { id: 'heineken',       name: 'Heineken',        price: 2000 },
      { id: 'water',          name: 'Bottle Water',    price:  500 },
      { id: 'soft-drinks',    name: 'Soft Drinks',     price: 1000 },
      { id: 'star-radler',    name: 'Star Radler',     price: 1500 },
      { id: 'gulder',         name: 'Gulder',          price: 1700 },
    ]
  },
]

export const ALL_ITEMS          = MENU.flatMap(g => g.items)
export const DISCOUNT_THRESHOLD = 30_000

// ─── Config (set these in .env) ──────────────────────────────────────────────
export const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER 
export const BANK_NAME       = import.meta.env.VITE_BANK_NAME       
export const ACCOUNT_NUMBER  = import.meta.env.VITE_ACCOUNT_NUMBER  
export const ACCOUNT_NAME    = import.meta.env.VITE_ACCOUNT_NAME    
export const API_URL         = import.meta.env.VITE_API_URL         
