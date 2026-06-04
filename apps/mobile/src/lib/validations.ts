// ============================================================
// Validações — CPF, e-mail, senha, data de nascimento
// ============================================================

export function validateEmail(email: string): string | null {
  if (!email.trim()) return 'E-mail é obrigatório'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'E-mail inválido'
  return null
}

export function validatePassword(password: string): string | null {
  if (password.length < 8) return 'A senha precisa ter no mínimo 8 caracteres'
  if (!/\d/.test(password)) return 'A senha precisa ter pelo menos 1 número'
  if (!/[!@#$%^&*()\-_=+\[\]{};:'",.<>/?\\|`~]/.test(password))
    return 'A senha precisa ter pelo menos 1 caractere especial'
  return null
}

export function validateCPF(cpf: string): string | null {
  const digits = cpf.replace(/\D/g, '')
  if (digits.length !== 11) return 'CPF incompleto'

  // Rejeita sequências repetidas: 000.000.000-00, 111.111.111-11 etc.
  if (/^(\d)\1+$/.test(digits)) return 'CPF inválido'

  // Primeiro dígito verificador
  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]!) * (10 - i)
  let first = 11 - (sum % 11)
  if (first > 9) first = 0
  if (parseInt(digits[9]!) !== first) return 'CPF inválido'

  // Segundo dígito verificador
  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]!) * (11 - i)
  let second = 11 - (sum % 11)
  if (second > 9) second = 0
  if (parseInt(digits[10]!) !== second) return 'CPF inválido'

  return null
}

/** Valida data DD/MM/AAAA e verifica maioridade (≥18 anos) */
export function validateBirthDate(dateStr: string): string | null {
  const parts = dateStr.split('/')
  if (parts.length !== 3 || parts[2]!.length !== 4) return 'Data inválida'
  const [d, m, y] = parts.map(Number)
  if (!d || !m || !y) return 'Data inválida'

  const date = new Date(y!, m! - 1, d!)
  if (
    date.getFullYear() !== y ||
    date.getMonth() !== m! - 1 ||
    date.getDate() !== d
  ) return 'Data inválida'

  const today = new Date()
  const age =
    today.getFullYear() -
    date.getFullYear() -
    (today.getMonth() < date.getMonth() ||
    (today.getMonth() === date.getMonth() && today.getDate() < date.getDate())
      ? 1
      : 0)

  if (age < 18) return 'Você precisa ter pelo menos 18 anos'
  if (age > 120) return 'Data de nascimento inválida'
  return null
}

/** Converte DD/MM/AAAA → AAAA-MM-DD (ISO para o banco) */
export function toISODate(dateStr: string): string {
  const [d, m, y] = dateStr.split('/')
  return `${y}-${m?.padStart(2, '0')}-${d?.padStart(2, '0')}`
}
