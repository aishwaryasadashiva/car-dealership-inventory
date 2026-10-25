import { describe, expect, it } from 'vitest'
import { calculateEmi } from './emi'

describe('calculateEmi', () => {
  it('matches the standard reducing-balance formula', () => {
    const result = calculateEmi({ price: 1_000_000, downPayment: 0, annualRate: 10, months: 60 })

    expect(result.monthly).toBeCloseTo(21247.04, 2)
    expect(result.principal).toBe(1_000_000)
    expect(result.totalPayable).toBeCloseTo(21247.04 * 60, 0)
    expect(result.totalInterest).toBeCloseTo(result.totalPayable - 1_000_000, 6)
  })

  it('subtracts the down payment from the amount financed', () => {
    const result = calculateEmi({ price: 1_000_000, downPayment: 200_000, annualRate: 9, months: 48 })

    expect(result.principal).toBe(800_000)
    expect(result.monthly).toBeCloseTo(19908.03, 2)
  })

  it('splits evenly when the interest rate is zero', () => {
    const result = calculateEmi({ price: 600_000, downPayment: 0, annualRate: 0, months: 60 })

    expect(result.monthly).toBe(10_000)
    expect(result.totalInterest).toBe(0)
  })

  it('needs no loan when the down payment covers the price', () => {
    const result = calculateEmi({ price: 500_000, downPayment: 900_000, annualRate: 9, months: 36 })

    expect(result).toEqual({ principal: 0, monthly: 0, totalPayable: 0, totalInterest: 0 })
  })

  it('never returns NaN for a zero-month tenure', () => {
    const result = calculateEmi({ price: 500_000, downPayment: 0, annualRate: 9, months: 0 })

    expect(Number.isFinite(result.monthly)).toBe(true)
  })
})
