import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { IconArrowLeft, IconLock, IconEye, IconEyeOff, IconCheck, IconX } from '@tabler/icons-react-native'

// ============================================================
// Passo 3/5 — Definir senha
// FASE 2: chamar authService.setPassword(password)
// ============================================================

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <View className="flex-row gap-1.5 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} className={`h-1 flex-1 rounded-full ${i < step ? 'bg-violet-600' : 'bg-gray-200'}`} />
      ))}
    </View>
  )
}

function Requirement({ met, label }: { met: boolean; label: string }) {
  return (
    <View className="flex-row items-center gap-2">
      {met
        ? <IconCheck size={16} color="#059669" />
        : <IconX size={16} color="#D1D5DB" />}
      <Text className={`text-sm ${met ? 'text-emerald-700' : 'text-gray-400'}`} style={{ fontFamily: 'RedditSans-Regular' }}>
        {label}
      </Text>
    </View>
  )
}

function strengthLabel(s: number): { label: string; color: string } {
  if (s < 2) return { label: 'Fraca', color: 'bg-red-400' }
  if (s < 3) return { label: 'Razoável', color: 'bg-amber-400' }
  if (s < 4) return { label: 'Boa', color: 'bg-yellow-400' }
  return { label: 'Forte', color: 'bg-emerald-500' }
}

export default function SetPassword() {
  const { email } = useLocalSearchParams<{ email: string }>()
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const hasLength = password.length >= 8
  const hasNumber = /\d/.test(password)
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  const strength = [hasLength, hasNumber, hasSpecial].filter(Boolean).length + (password.length >= 12 ? 1 : 0)
  const { label: strengthLabelText, color: strengthColor } = strengthLabel(strength)
  const isValid = hasLength && hasNumber && hasSpecial

  const handleContinue = async () => {
    if (!isValid) return
    setLoading(true)
    // TODO FASE 2: await authService.setPassword(password)
    setLoading(false)
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

          <Text className="text-2xl text-gray-900 mb-2" style={{ fontFamily: 'RedditSans-Bold' }}>
            Crie sua senha
          </Text>
          <Text className="text-base text-gray-500 mb-8" style={{ fontFamily: 'RedditSans-Regular' }}>
            Use pelo menos 8 caracteres com um número e um símbolo.
          </Text>

          {/* Input senha */}
          <View className="border border-gray-200 rounded-xl px-4 flex-row items-center bg-white mb-4" style={{ height: 52 }}>
            <IconLock size={18} color="#A1A7AE" />
            <TextInput
              className="flex-1 text-base text-gray-900 mx-3"
              style={{ fontFamily: 'RedditSans-Regular' }}
              placeholder="Mínimo 8 caracteres"
              placeholderTextColor="#A1A7AE"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowPassword((v) => !v)}>
              {showPassword
                ? <IconEyeOff size={18} color="#A1A7AE" />
                : <IconEye size={18} color="#A1A7AE" />}
            </TouchableOpacity>
          </View>

          {/* Barra de força */}
          {password.length > 0 && (
            <View className="mb-4">
              <View className="flex-row gap-1 mb-1">
                {[1, 2, 3, 4].map((n) => (
                  <View key={n} className={`h-1.5 flex-1 rounded-full ${strength >= n ? strengthColor : 'bg-gray-200'}`} />
                ))}
              </View>
              <Text className="text-xs text-gray-500" style={{ fontFamily: 'RedditSans-Regular' }}>
                Força: <Text className="text-gray-700" style={{ fontFamily: 'RedditSans-SemiBold' }}>{strengthLabelText}</Text>
              </Text>
            </View>
          )}

          {/* Requisitos */}
          <View className="gap-2">
            <Requirement met={hasLength} label="Mínimo 8 caracteres" />
            <Requirement met={hasNumber} label="Pelo menos 1 número" />
            <Requirement met={hasSpecial} label="Pelo menos 1 caractere especial" />
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
