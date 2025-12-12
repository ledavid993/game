import twilio from 'twilio'

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const fromNumber = process.env.TWILIO_PHONE_NUMBER

let client: ReturnType<typeof twilio> | null = null

function getClient() {
  if (!client && accountSid && authToken) {
    client = twilio(accountSid, authToken)
  }
  return client
}

export interface SMSResult {
  success: boolean
  messageSid?: string
  error?: string
}

/**
 * Send an SMS message via Twilio
 * @param to - Phone number to send to (E.164 format, e.g., +1234567890)
 * @param body - Message content
 * @returns Result object with success status
 */
export async function sendSMS(to: string, body: string): Promise<SMSResult> {
  const twilioClient = getClient()

  if (!twilioClient) {
    console.warn('Twilio client not configured. Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN')
    return { success: false, error: 'Twilio not configured' }
  }

  if (!fromNumber) {
    console.warn('Twilio phone number not configured. Missing TWILIO_PHONE_NUMBER')
    return { success: false, error: 'Twilio phone number not configured' }
  }

  // Normalize phone number to E.164 format
  const normalizedTo = normalizePhoneNumber(to)
  if (!normalizedTo) {
    console.warn(`Invalid phone number format: ${to}`)
    return { success: false, error: 'Invalid phone number format' }
  }

  try {
    const message = await twilioClient.messages.create({
      body,
      from: fromNumber,
      to: normalizedTo,
    })

    console.log(`SMS sent successfully to ${normalizedTo}, SID: ${message.sid}`)
    return { success: true, messageSid: message.sid }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`Failed to send SMS to ${normalizedTo}:`, errorMessage)
    return { success: false, error: errorMessage }
  }
}

/**
 * Normalize a phone number to E.164 format
 * Assumes US numbers if no country code provided
 */
function normalizePhoneNumber(phone: string): string | null {
  // Remove all non-digit characters except leading +
  const cleaned = phone.replace(/[^\d+]/g, '')

  // If already in E.164 format (starts with +)
  if (cleaned.startsWith('+')) {
    return cleaned.length >= 11 ? cleaned : null
  }

  // If 10 digits, assume US number
  if (cleaned.length === 10) {
    return `+1${cleaned}`
  }

  // If 11 digits starting with 1, assume US number
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`
  }

  return null
}

/**
 * Check if Twilio is properly configured
 */
export function isTwilioConfigured(): boolean {
  return !!(accountSid && authToken && fromNumber)
}
