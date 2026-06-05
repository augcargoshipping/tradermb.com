import nodemailer from "nodemailer"

let transporter: nodemailer.Transporter | null = null

export function getMailTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) return null

  try {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
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

export async function sendMail(options: nodemailer.SendMailOptions): Promise<boolean> {
  const mailer = getMailTransporter()
  if (!mailer) return false
  await mailer.sendMail(options)
  return true
}
