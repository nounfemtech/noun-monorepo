import { supabase } from './supabase'
import { getRandomBytesAsync } from 'expo-crypto'
import { toISODate } from './validations'

// ============================================================
// AuthService — baseado no noun-app, adaptado para o monorepo
// Usa a tabela `profiles` existente no Supabase
// ============================================================

export interface ProfileData {
  userId: string
  fullName: string
  socialName?: string
  cpf?: string
  birthDate: string   // DD/MM/AAAA — convertido para ISO antes de salvar
  email?: string
}

// ---------------------------------------------------------------------------
// Senha temporária forte (atende política Supabase)
// ---------------------------------------------------------------------------

const LOWER   = 'abcdefghijklmnopqrstuvwxyz'
const UPPER   = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const DIGITS  = '0123456789'
const SPECIAL = '!@#$%^&*()_+-=[]{};\':"|<>?,./`~'
const ALL     = LOWER + UPPER + DIGITS + SPECIAL

async function generateTempPassword(): Promise<string> {
  const bytes = await getRandomBytesAsync(32)
  const pick  = (charset: string, b: number) => charset[b % charset.length]!

  const guaranteed = [
    pick(LOWER, bytes[0]!),
    pick(UPPER, bytes[1]!),
    pick(DIGITS, bytes[2]!),
    pick(SPECIAL, bytes[3]!),
  ]

  const rest = Array.from(bytes.slice(4), (b) => ALL[b % ALL.length]!)
  const combined = [...guaranteed, ...rest]

  // Fisher-Yates shuffle usando os bytes aleatórios
  for (let i = combined.length - 1; i > 0; i--) {
    const j = bytes[i % bytes.length]! % (i + 1)
    ;[combined[i], combined[j]] = [combined[j]!, combined[i]!]
  }

  return combined.join('')
}

// ---------------------------------------------------------------------------
// AuthService
// ---------------------------------------------------------------------------

class AuthService {
  /**
   * Etapa 1 — Envia OTP para o e-mail.
   * Cria usuário com senha temporária e aciona o template "Confirm Signup".
   */
  async sendOTP(email: string) {
    try {
      const tempPassword = await generateTempPassword()

      const { data, error } = await supabase.auth.signUp({
        email,
        password: tempPassword,
        options: { data: { email_verified: false } },
      })

      if (error) throw error

      // Usuário já existe (identities vazia)
      if (data.user?.identities?.length === 0) {
        return { success: false, error: 'Este e-mail já está cadastrado. Faça login ou recupere sua senha.' }
      }

      return { success: true, data }
    } catch (err: any) {
      if (err.message?.includes('User already registered')) {
        return { success: false, error: 'Este e-mail já está cadastrado.' }
      }
      return { success: false, error: err.message ?? 'Erro ao enviar código de verificação' }
    }
  }

  /**
   * Etapa 2 — Verifica o OTP de 6 dígitos.
   * Confirma o e-mail e abre a sessão autenticada.
   */
  async verifyOTP(email: string, token: string) {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'signup',
      })
      if (error) throw error
      return { success: true, data }
    } catch (err: any) {
      if (err.message?.includes('Token has expired'))
        return { success: false, error: 'Código expirado. Solicite um novo.' }
      if (err.message?.includes('Invalid token') || err.message?.includes('invalid'))
        return { success: false, error: 'Código incorreto. Tente novamente.' }
      return { success: false, error: err.message ?? 'Código inválido ou expirado' }
    }
  }

  /**
   * Reenvio de OTP (após 60s de timeout).
   */
  async resendOTP(email: string) {
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false },
      })
      if (error) throw error
      return { success: true, data }
    } catch (err: any) {
      return { success: false, error: err.message ?? 'Erro ao reenviar código' }
    }
  }

  /**
   * Etapa 3 — Define a senha real (substitui a temporária).
   * Requer sessão ativa (após verifyOTP).
   */
  async setPassword(password: string) {
    try {
      const { data, error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      return { success: true, data }
    } catch (err: any) {
      if (err.message?.includes('session_not_found'))
        return { success: false, error: 'Sessão expirada. Refaça o cadastro.' }
      return { success: false, error: err.message ?? 'Erro ao definir senha' }
    }
  }

  /**
   * Etapas 4-5 — Salva perfil do paciente na tabela `profiles`.
   * Adapta para o schema real do banco (inclui role, date_of_birth, is_active).
   */
  async saveProfile(data: ProfileData) {
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: data.userId,
          role: 'patient',
          full_name: data.fullName,
          social_name: data.socialName ?? null,
          cpf: data.cpf ?? null,
          email: data.email ?? null,
          date_of_birth: toISODate(data.birthDate),
          is_active: true,
          updated_at: new Date().toISOString(),
        })

      if (error) throw error
      return { success: true }
    } catch (err: any) {
      if (err.code === '23505' && err.message?.includes('cpf'))
        return { success: false, error: 'Este CPF já está cadastrado.' }
      return { success: false, error: err.message ?? 'Erro ao salvar perfil' }
    }
  }

  /**
   * Busca o perfil do usuário autenticado.
   */
  async getProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, social_name, cpf, date_of_birth, role')
        .eq('id', userId)
        .maybeSingle()

      if (error) throw error
      return { success: true, profile: data }
    } catch (err: any) {
      return { success: false, profile: null, error: err.message }
    }
  }

  /**
   * Login com e-mail e senha.
   */
  async signInWithPassword(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      return { success: true, data }
    } catch (err: any) {
      if (err.message?.includes('Invalid login credentials'))
        return { success: false, error: 'E-mail ou senha incorretos.' }
      return { success: false, error: err.message ?? 'Erro ao fazer login' }
    }
  }

  /**
   * Logout.
   */
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }

  /**
   * Envio de e-mail para reset de senha.
   */
  async resetPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'noun://auth/reset-password',
      })
      if (error) throw error
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message ?? 'Erro ao enviar e-mail de recuperação' }
    }
  }

  /**
   * Login com Google via expo-auth-session (web flow, sem eject).
   * Retorna a URL OAuth — o caller abre no WebBrowser.
   */
  async getGoogleOAuthUrl(redirectTo: string) {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, skipBrowserRedirect: true },
      })
      if (error) throw error
      return { success: true, url: data.url }
    } catch (err: any) {
      return { success: false, url: null, error: err.message }
    }
  }

  /**
   * Aplica sessão a partir de tokens OAuth (callback URL).
   */
  async setSessionFromUrl(url: string) {
    try {
      // Tokens podem estar no hash ou nos query params
      const urlObj = new URL(url)
      let accessToken: string | null = null
      let refreshToken: string | null = null

      if (url.includes('#')) {
        const hash = url.split('#')[1] ?? ''
        const params = new URLSearchParams(hash)
        accessToken = params.get('access_token')
        refreshToken = params.get('refresh_token')
      }
      if (!accessToken) {
        accessToken = urlObj.searchParams.get('access_token')
        refreshToken = urlObj.searchParams.get('refresh_token')
      }

      if (!accessToken || !refreshToken) {
        return { success: false, error: 'Tokens não encontrados na URL de callback' }
      }

      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })

      if (error) throw error
      return { success: true, session: data.session }
    } catch (err: any) {
      return { success: false, session: null, error: err.message }
    }
  }
}

export const authService = new AuthService()
