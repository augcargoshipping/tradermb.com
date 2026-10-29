/**
 * Turso stores rates as RMB per 1 GHS paid (e.g. 0.52).
 * The public banner shows the ₵1,000+ (standard) rate: 1 GHS = stored RMB.
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
