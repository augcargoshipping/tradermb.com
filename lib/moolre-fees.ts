/** Moolre published MoMo collection fees: 1% (min ₵0.50, max ₵10) + network 1% (max ₵20). */

function roundGhs(value: number): number {
  return Math.round(value * 100) / 100
}

export function moolreCollectionFees(tradeGhs: number) {
  const base = Number.isFinite(tradeGhs) && tradeGhs > 0 ? tradeGhs : 0
  const moolreFee = roundGhs(Math.min(10, Math.max(0.5, base * 0.01)))
  const networkFee = roundGhs(Math.min(20, base * 0.01))
  const fee = roundGhs(moolreFee + networkFee)
  const collect = roundGhs(base + fee)
  return { moolreFee, networkFee, fee, collect }
}

export function formatGhsMoney(value: number): string {
  return value.toFixed(2)
}
