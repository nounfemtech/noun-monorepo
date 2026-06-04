import 'react-native-url-polyfill/auto'
import { Platform } from 'react-native'
import { createClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'

// ============================================================
// SecureStore adapter com chunking para tokens grandes (>2 KB)
// ============================================================

const CHUNK_SIZE = 1800 // bytes com margem de segurança

const SecureStoreAdapter = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') return localStorage.getItem(key)
    try {
      // Tenta leitura em chunks (valores grandes)
      const countRaw = await SecureStore.getItemAsync(`${key}__n`)
      if (countRaw) {
        const n = parseInt(countRaw, 10)
        const parts: string[] = []
        for (let i = 0; i < n; i++) {
          const part = await SecureStore.getItemAsync(`${key}__${i}`)
          if (part == null) return null
          parts.push(part)
        }
        return parts.join('')
      }
      // Fallback: valor pequeno armazenado direto
      return await SecureStore.getItemAsync(key)
    } catch {
      return null
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') { localStorage.setItem(key, value); return }
    if (value.length <= CHUNK_SIZE) {
      await SecureStore.setItemAsync(key, value)
      return
    }
    // Divide em chunks
    const chunks: string[] = []
    for (let i = 0; i < value.length; i += CHUNK_SIZE) {
      chunks.push(value.slice(i, i + CHUNK_SIZE))
    }
    await SecureStore.setItemAsync(`${key}__n`, String(chunks.length))
    await Promise.all(chunks.map((chunk, i) => SecureStore.setItemAsync(`${key}__${i}`, chunk)))
  },

  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') { localStorage.removeItem(key); return }
    try {
      const countRaw = await SecureStore.getItemAsync(`${key}__n`)
      if (countRaw) {
        const n = parseInt(countRaw, 10)
        await SecureStore.deleteItemAsync(`${key}__n`)
        await Promise.all(
          Array.from({ length: n }, (_, i) => SecureStore.deleteItemAsync(`${key}__${i}`))
        )
      }
      await SecureStore.deleteItemAsync(key)
    } catch {}
  },
}

// ============================================================
// Cliente Supabase
// ============================================================

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase env vars ausentes: EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: SecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
