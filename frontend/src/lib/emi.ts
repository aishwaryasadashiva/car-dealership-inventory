export type EmiInput = {
  price: number
  downPayment: number
  /** Nominal annual interest rate in percent, e.g. 9.5 */
  annualRate: number
  months: number
}

export type EmiResult = {
  principal: number
  monthly: number
  totalPayable: number
  totalInterest: number
}

/**
 * Equated monthly instalment on a reducing balance:
 *   EMI = P * r * (1 + r)^n / ((1 + r)^n - 1),  r = annualRate / 12 / 100
 */
export function calculateEmi({ price, downPayment, annualRate, months }: EmiInput): EmiResult {
  const principal = Math.max(0, price - Math.max(0, downPayment))
  if (principal === 0) {
    return { principal: 0, monthly: 0, totalPayable: 0, totalInterest: 0 }
  }

  const n = Math.max(1, Math.floor(months))
  const r = annualRate / 12 / 100
  const monthly =
    r === 0 ? principal / n : (principal * r * (1 + r) ** n) / ((1 + r) ** n - 1)
  const totalPayable = monthly * n

  return { principal, monthly, totalPayable, totalInterest: totalPayable - principal }
}
