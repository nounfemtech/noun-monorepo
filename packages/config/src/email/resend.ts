import { Resend } from 'resend'

export function createResendClient() {
  const apiKey = process.env['RESEND_API_KEY']

  if (!apiKey) {
    throw new Error('Missing Resend env var: RESEND_API_KEY')
  }

  return new Resend(apiKey)
}
