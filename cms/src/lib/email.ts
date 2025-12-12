import nodemailer from 'nodemailer'

const emailHost = process.env.EMAIL_HOST
const emailPort = parseInt(process.env.EMAIL_PORT || '587', 10)
const emailUser = process.env.EMAIL_USER
const emailPass = process.env.EMAIL_PASS
const emailFrom = process.env.EMAIL_FROM || emailUser

let transporter: nodemailer.Transporter | null = null

function getTransporter() {
  if (!transporter && emailHost && emailUser && emailPass) {
    transporter = nodemailer.createTransport({
      host: emailHost,
      port: emailPort,
      secure: emailPort === 465,
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    })
  }
  return transporter
}

export interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Send an email
 * @param to - Email address to send to
 * @param subject - Email subject
 * @param html - HTML content of the email
 * @returns Result object with success status
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<EmailResult> {
  const emailTransporter = getTransporter()

  if (!emailTransporter) {
    console.warn('Email not configured. Missing EMAIL_HOST, EMAIL_USER, or EMAIL_PASS')
    return { success: false, error: 'Email not configured' }
  }

  if (!emailFrom) {
    console.warn('Email FROM address not configured. Missing EMAIL_FROM')
    return { success: false, error: 'Email FROM address not configured' }
  }

  try {
    const info = await emailTransporter.sendMail({
      from: `"Manor of Whispers" <${emailFrom}>`,
      to,
      subject,
      html,
    })

    console.log(`Email sent successfully to ${to}, ID: ${info.messageId}`)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`Failed to send email to ${to}:`, errorMessage)
    return { success: false, error: errorMessage }
  }
}

/**
 * Check if email is properly configured
 */
export function isEmailConfigured(): boolean {
  return !!(emailHost && emailUser && emailPass)
}
