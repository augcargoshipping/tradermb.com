/**
 * Site availability. Production is closed by default until you reopen.
 * Set SITE_CLOSED=false on Vercel (or in .env.local) to bring the site back.
 */
export function isSiteClosed(): boolean {
  if (process.env.SITE_CLOSED === "false") return false
  if (process.env.SITE_CLOSED === "true") return true
  return process.env.VERCEL_ENV === "production"
}
