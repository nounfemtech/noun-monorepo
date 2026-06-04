import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { IconArrowLeft, IconLock, IconEye, IconEyeOff, IconCheck, IconX } from '@tabler/icons-react-native'
import { authService } from '@/lib/auth.service'
import { validatePassword } from '@/lib/validations'

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <View className="flex-row gap-1.5 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} className={`h-1 flex-1 rounded-full ${i < step ? 'bg-violet-600' : 'bg-gray-200'}`} />
      ))}
    </View>
  )
}

function Req({ met, label }: { met: boolean; label: string }) {
  return (
    <View className="flex-row items-center gap-2">
      {met ? <IconCheck size={16} color="#059669" /> : <IconX size={16} color="#D1D5DB" />}
      <Text className={`text-sm ${met ? 'text-emerald-700' : 'text-gray-400'}`} style={{ fontFamily: 'RedditSans-Regular' }}>
        {label}
      </Text>
    </View>
  )
}

function strengthOf(p: string) {
  const score = [p.length >= 8, /\d/.test(p), /[!@#$%^&*]/.test(p), p.length >= 12].filter(Boolean).length
  const map = [
    { label: 'Fraca',    color: 'bg-red-400' },
    { label: 'Razoável', color: 'bg-amber-400' },
    { label: 'Boa',      color: 'bg-yellow-400' },
    { label: 'Forte',    color: 'bg-emerald-500' },
  ] as const
  return { score, ...(map[score - 1] ?? map[0]) }
}

export default function SetPassword() {
  const { email } = useLocalSearchParams<{ email: string }>()
  const [password,     setPassword]     = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error,        setError]        = useState('')
  const [loading,      setLoading]      = useState(false)

  const hasLength  = password.length >= 8
  const hasNumber  = /\d/.test(password)
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  const isValid    = hasLength && hasNumber && hasSpecial
  const { score, label: strengthLabel, color: strengthColor } = strengthOf(password)

  const handleContinue = async () => {
    const err = validatePassword(password)
    if (err) { setError(err); return }

    setLoading(true)
    setError('')

    const result = await authService.setPassword(password)
    setLoading(false)

    if (!result.success) {
      setError(result.error ?? 'Erro ao definir senha')
      return
    }

    router.push('/(auth)/personal-info')
  }

  return (
    <SafeAreaView className="flex-1 bg-[#FDFDFD]">
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View className="flex-1 px-6 pt-4">
          <TouchableOpacity onPress={() => router.back()} className="mb-6 self-start p-1">
            <IconArrowLeft size={24} color="#252B37" />
          </TouchableOpacity>

          <ProgressBar step={3} total={5} />

          <Text className="text-2xl text-gray-900 mb-2" style={{ fontFamily: 'RedditSans-Bold' }}>Crie sua senha</Text>
          <Text className="text-base text-gray-500 mb-8" style={{ fontFamily: 'RedditSans-Regular' }}>
            Mínimo 8 caracteres com número e símbolo.
          </Text>

          <View className={`flex-row items-center border rounded-xl px-4 gap-3 bg-white mb-4 ${error ? 'border-red-400' : 'border-gray-200'}`} style={{ height: 52 }}>
            <IconLock size={18} color="#A1A7AE" />
            <TextInput
              className="flex-1 text-base text-gray-900"
              style={{ fontFamily: 'RedditSans-Regular' }}
              placeholder="Mínimo 8 caracteres"
              placeholderTextColor="#A1A7AE"
              value={password}
              onChangeText={(v) => { setPassword(v); setError('') }}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowPassword((v) => !v)}>
              {showPassword ? <IconEyeOff size={18} color="#A1A7AE" /> : <IconEye size={18} color="#A1A7AE" />}
            </TouchableOpacity>
          </View>

          {error ? <Text className="text-sm text-red-500 mb-3" style={{ fontFamily: 'RedditSans-Regular' }}>{error}</Text> : null}

          {password.length > 0 && (
            <View className="mb-4">
              <View className="flex-row gap-1 mb-1">
                {[1, 2, 3, 4].map((n) => (
                  <View key={n} className={`h-1.5 flex-1 rounded-full ${score >= n ? strengthColor : 'bg-gray-200'}`} />
                ))}
              </View>
              <Text className="text-xs text-gray-500" style={{ fontFamily: 'RedditSans-Regular' }}>
                Força: <Text style={{ fontFamily: 'RedditSans-SemiBold' }}>{strengthLabel}</Text>
              </Text>
            </View>
          )}

          <View className="gap-2 mb-6">
            <Req met={hasLength}  label="Mínimo 8 caracteres" />
            <Req met={hasNumber}  label="Pelo menos 1 número" />
            <Req met={hasSpecial} label="Pelo menos 1 caractere especial" />
          </View>

          <View className="flex-1" />

          <TouchableOpacity
            className={`rounded-full py-4 items-center ${isValid ? 'bg-violet-600' : 'bg-gray-200'}`}
            onPress={handleContinue}
            disabled={!isValid || loading}
            activeOpacity={0.8}
          >
            <Text className={`text-base ${isValid ? 'text-white' : 'text-gray-400'}`} style={{ fontFamily: 'RedditSans-SemiBold' }}>
              {loading ? 'Salvando...' : 'Continuar'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
