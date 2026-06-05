export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

export function emailShell(title: string, bodyHtml: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #059669 0%, #0d9488 100%); padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 22px;">${escapeHtml(title)}</h1>
      </div>
      <div style="padding: 24px; background: #f9fafb;">
        ${bodyHtml}
      </div>
    </div>
  `
}

export function siteBaseUrl(): string {
  const url = process.env.NEXTAUTH_URL?.trim() || process.env.VERCEL_URL
  if (!url) return "http://localhost:3000"
  if (url.startsWith("http")) return url.replace(/\/$/, "")
  return `https://${url.replace(/\/$/, "")}`
}
