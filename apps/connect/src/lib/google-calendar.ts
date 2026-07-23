// Integracao com Google Calendar/Meet via REST direto (fetch), sem o SDK `googleapis`.
// Decisao (Prompt 3, apps/connect/CLAUDE.md secao 8): o repo evita dependencias pesadas quando
// da (mesmo padrao da decisao de nao usar react-big-calendar no Prompt 2); a superficie que
// precisamos (token exchange + criar/apagar evento com conferenceData) e pequena o bastante
// para nao justificar o SDK inteiro.
//
// OAuth e por medico (cada um conecta a propria conta Google) — o evento criado aparece na
// agenda pessoal de quem atende, nao numa conta de servico da Noun.

import { createSupabaseAdmin } from './supabase-admin'

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_REVOKE_URL = 'https://oauth2.googleapis.com/revoke'
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo'
const GOOGLE_CALENDAR_EVENTS_URL = 'https://www.googleapis.com/calendar/v3/calendars/primary/events'

const SCOPE = 'https://www.googleapis.com/auth/calendar.events'

export type GoogleCalendarErrorReason = 'not_connected' | 'refresh_failed' | 'api_error'

export class GoogleCalendarError extends Error {
  reason: GoogleCalendarErrorReason
  constructor(reason: GoogleCalendarErrorReason, message: string) {
    super(message)
    this.reason = reason
    this.name = 'GoogleCalendarError'
  }
}

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new GoogleCalendarError(
      'api_error',
      `Variavel de ambiente ${name} nao configurada. Configure as credenciais do Google Cloud antes de usar o Google Calendar.`
    )
  }
  return value
}

export function buildGoogleAuthUrl(state: string): string {
  const clientId = requireEnv('GOOGLE_CALENDAR_CLIENT_ID')
  const redirectUri = requireEnv('GOOGLE_CALENDAR_REDIRECT_URI')

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPE,
    access_type: 'offline',
    prompt: 'consent',
    state,
  })

  return `${GOOGLE_AUTH_URL}?${params.toString()}`
}

interface TokenResponse {
  access_token: string
  refresh_token?: string
  expires_in: number
  scope: string
}

export interface ExchangedTokens {
  accessToken: string
  refreshToken: string
  expiresAt: string
  scope: string
  googleEmail: string
}

export async function exchangeCodeForTokens(code: string): Promise<ExchangedTokens> {
  const clientId = requireEnv('GOOGLE_CALENDAR_CLIENT_ID')
  const clientSecret = requireEnv('GOOGLE_CALENDAR_CLIENT_SECRET')
  const redirectUri = requireEnv('GOOGLE_CALENDAR_REDIRECT_URI')

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new GoogleCalendarError('api_error', `Falha ao trocar codigo por token do Google: ${body}`)
  }

  const data = (await res.json()) as TokenResponse
  if (!data.refresh_token) {
    throw new GoogleCalendarError(
      'api_error',
      'O Google nao retornou refresh_token. Desconecte o acesso em myaccount.google.com/permissions e tente conectar novamente (prompt=consent deveria evitar isso).'
    )
  }

  const userRes = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${data.access_token}` },
  })
  if (!userRes.ok) {
    throw new GoogleCalendarError('api_error', 'Falha ao obter e-mail da conta Google conectada.')
  }
  const userInfo = (await userRes.json()) as { email: string }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000).toISOString(),
    scope: data.scope,
    googleEmail: userInfo.email,
  }
}

async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresAt: string }> {
  const clientId = requireEnv('GOOGLE_CALENDAR_CLIENT_ID')
  const clientSecret = requireEnv('GOOGLE_CALENDAR_CLIENT_SECRET')

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new GoogleCalendarError('refresh_failed', `Falha ao renovar token do Google: ${body}`)
  }

  const data = (await res.json()) as TokenResponse
  return {
    accessToken: data.access_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000).toISOString(),
  }
}

/**
 * Le a credencial do medico (via service role), renova o access_token se estiver expirado
 * (ou a menos de 2 minutos de expirar), persiste a renovacao e retorna um token valido.
 * Lanca GoogleCalendarError('not_connected') se o medico nunca conectou o Google Calendar.
 */
export async function ensureValidAccessToken(doctorId: string): Promise<string> {
  const admin = createSupabaseAdmin()
  const { data: credential } = await admin
    .from('doctor_google_credentials')
    .select('access_token, refresh_token, token_expires_at')
    .eq('doctor_id', doctorId)
    .maybeSingle()

  if (!credential) {
    throw new GoogleCalendarError(
      'not_connected',
      'Conecte sua conta do Google Calendar no perfil antes de confirmar a consulta.'
    )
  }

  const expiresAt = new Date(credential.token_expires_at).getTime()
  const isExpiringSoon = expiresAt - Date.now() < 2 * 60 * 1000

  if (!isExpiringSoon) {
    return credential.access_token
  }

  const refreshed = await refreshAccessToken(credential.refresh_token)
  await admin
    .from('doctor_google_credentials')
    .update({ access_token: refreshed.accessToken, token_expires_at: refreshed.expiresAt })
    .eq('doctor_id', doctorId)

  return refreshed.accessToken
}

export async function revokeGoogleToken(token: string): Promise<void> {
  try {
    await fetch(GOOGLE_REVOKE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ token }),
    })
  } catch {
    // best-effort: se a revogacao falhar, a desconexao local (apagar a linha) ainda acontece
  }
}

interface CreateCalendarEventInput {
  accessToken: string
  summary: string
  description?: string
  startsAt: string // ISO
  endsAt: string // ISO
  attendeeEmail?: string
}

export interface CreatedCalendarEvent {
  eventId: string
  meetUrl: string
  htmlLink: string
}

export async function createCalendarEvent(input: CreateCalendarEventInput): Promise<CreatedCalendarEvent> {
  const body = {
    summary: input.summary,
    description: input.description,
    start: { dateTime: input.startsAt },
    end: { dateTime: input.endsAt },
    attendees: input.attendeeEmail ? [{ email: input.attendeeEmail }] : undefined,
    conferenceData: {
      createRequest: {
        requestId: crypto.randomUUID(),
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    },
  }

  const res = await fetch(`${GOOGLE_CALENDAR_EVENTS_URL}?conferenceDataVersion=1&sendUpdates=all`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const errorBody = await res.text()
    throw new GoogleCalendarError(
      'api_error',
      `Falha ao criar evento no Google Calendar: ${errorBody}`
    )
  }

  const event = await res.json()
  const meetEntry = (event.conferenceData?.entryPoints ?? []).find(
    (entry: { entryPointType: string; uri: string }) => entry.entryPointType === 'video'
  )

  if (!meetEntry) {
    throw new GoogleCalendarError(
      'api_error',
      'Evento criado no Google Calendar, mas sem link do Meet retornado.'
    )
  }

  return { eventId: event.id, meetUrl: meetEntry.uri, htmlLink: event.htmlLink }
}

/**
 * Best-effort por design: chamado no cancelamento de consulta. Nunca lanca — retorna false e
 * deixa quem chama decidir se loga um aviso, mas o cancelamento no banco nao pode ficar preso
 * a uma falha da API do Google.
 */
export async function deleteCalendarEvent(accessToken: string, eventId: string): Promise<boolean> {
  try {
    const res = await fetch(`${GOOGLE_CALENDAR_EVENTS_URL}/${eventId}?sendUpdates=all`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    return res.ok || res.status === 410 // 410 Gone: evento ja tinha sido apagado no Google
  } catch {
    return false
  }
}
