import nodemailer from "nodemailer"

let transporter: nodemailer.Transporter | null = null

function normalizeGmailPassword(raw: string | undefined): string | null {
  if (!raw) return null
  const pass = raw.replace(/\s/g, "")
  return pass.length > 0 ? pass : null
}

export function getMailTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter

  const user = process.env.EMAIL_USER?.trim()
  const pass = normalizeGmailPassword(process.env.EMAIL_PASSWORD)
  if (!user || !pass) return null

  try {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
      secure: true,
      port: 465,
      tls: {
        rejectUnauthorized: false,
      },
    })
    return transporter
  } catch (error) {
    console.error("mail: transporter setup failed:", error)
    transporter = null
    return null
  }
}

export async function sendMail(options: nodemailer.SendMailOptions): Promise<void> {
  const mailer = getMailTransporter()
  if (!mailer) {
    throw new Error("Email not configured — set EMAIL_USER and EMAIL_PASSWORD (Gmail app password)")
  }
  const from = options.from ?? process.env.EMAIL_USER?.trim()
  await mailer.sendMail({ ...options, from })
}
