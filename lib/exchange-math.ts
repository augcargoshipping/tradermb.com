/**
 * Turso stores `single_exchange_rate` as RMB per 1 GHS paid.
 * The public banner shows GHS per 1 RMB (= 1 / stored rate).
 */

export function ghsPerRmbFromStored(storedRmbPerGhs: number): number {
  return 1 / storedRmbPerGhs
}

export function convertGhsToRmb(ghs: number, storedRmbPerGhs: number): number {
  return ghs * storedRmbPerGhs
}

export function convertRmbToGhs(rmb: number, storedRmbPerGhs: number): number {
  return rmb / storedRmbPerGhs
}

export function formatAmount(amount: number): string {
  return amount.toFixed(2)
}
