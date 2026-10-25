import { describe, expect, it } from 'vitest'
import { formatPrice, formatPriceShort, stockLabel } from './format'

describe('formatPrice', () => {
  it('uses Indian digit grouping with the rupee sign', () => {
    expect(formatPrice(1_199_000).replace(/\s/g, '')).toBe('₹11,99,000')
  })
})

describe('formatPriceShort', () => {
  it('shows lakhs and crores compactly', () => {
    expect(formatPriceShort(649_000)).toBe('₹6.49 L')
    expect(formatPriceShort(3_399_000)).toBe('₹33.99 L')
    expect(formatPriceShort(25_000_000)).toBe('₹2.5 Cr')
  })

  it('falls back to the full price below one lakh', () => {
    expect(formatPriceShort(85_000).replace(/\s/g, '')).toBe('₹85,000')
  })
})

describe('stockLabel', () => {
  it('describes sold-out, low and healthy stock', () => {
    expect(stockLabel(0)).toEqual({ text: 'Sold out', tone: 'out' })
    expect(stockLabel(1)).toEqual({ text: 'Only 1 left', tone: 'low' })
    expect(stockLabel(3)).toEqual({ text: 'Only 3 left', tone: 'low' })
    expect(stockLabel(8)).toEqual({ text: '8 in stock', tone: 'ok' })
  })
})
