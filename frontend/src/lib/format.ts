const rupees = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

export const formatPrice = (amount: number) => rupees.format(amount)

const trim = (value: number) => Number(value.toFixed(2)).toString()

/** Indian shorthand: ₹6.49 L (lakh) and ₹2.5 Cr (crore). */
export function formatPriceShort(amount: number): string {
  if (amount >= 10_000_000) return `₹${trim(amount / 10_000_000)} Cr`
  if (amount >= 100_000) return `₹${trim(amount / 100_000)} L`
  return formatPrice(amount)
}

export type StockTone = 'ok' | 'low' | 'out'

const LOW_STOCK_THRESHOLD = 3

export function stockLabel(quantity: number): { text: string; tone: StockTone } {
  if (quantity <= 0) return { text: 'Sold out', tone: 'out' }
  if (quantity <= LOW_STOCK_THRESHOLD) return { text: `Only ${quantity} left`, tone: 'low' }
  return { text: `${quantity} in stock`, tone: 'ok' }
}
