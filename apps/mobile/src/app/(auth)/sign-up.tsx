import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { IconArrowLeft, IconMail } from '@tabler/icons-react-native'
import { authService } from '@/lib/auth.service'
import { validateEmail } from '@/lib/validations'

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <View className="flex-row gap-1.5 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} className={`h-1 flex-1 rounded-full ${i < step ? 'bg-violet-600' : 'bg-gray-200'}`} />
      ))}
    </View>
  )
}

export default function SignUp() {
  const [email,   setEmail]   = useState('')
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const emailError = validateEmail(email)
  const isValid    = !emailError

  const handleContinue = async () => {
    const err = validateEmail(email)
    if (err) { setError(err); return }

    setLoading(true)
    setError('')

    const result = await authService.sendOTP(email.trim().toLowerCase())
    setLoading(false)

    if (!result.success) {
      setError(result.error ?? 'Erro ao enviar código')
      return
    }

    router.push({ pathname: '/(auth)/verify-email', params: { email: email.trim().toLowerCase() } })
  }

  return (
    <SafeAreaView className="flex-1 bg-[#FDFDFD]">
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View className="flex-1 px-6 pt-4">
          <TouchableOpacity onPress={() => router.back()} className="mb-6 self-start p-1">
            <IconArrowLeft size={24} color="#252B37" />
          </TouchableOpacity>

          <ProgressBar step={1} total={5} />

          <Text className="text-2xl text-gray-900 mb-2" style={{ fontFamily: 'RedditSans-Bold' }}>
            Qual é o seu e-mail?
          </Text>
          <Text className="text-base text-gray-500 mb-8" style={{ fontFamily: 'RedditSans-Regular' }}>
            Usaremos para criar e proteger sua conta.
          </Text>

          <View className="gap-1.5">
            <View
              className={`flex-row items-center border rounded-xl px-4 gap-3 bg-white ${error ? 'border-red-400' : 'border-gray-200'}`}
              style={{ height: 52 }}
            >
              <IconMail size={18} color="#A1A7AE" />
              <TextInput
                className="flex-1 text-base text-gray-900"
                style={{ fontFamily: 'RedditSans-Regular' }}
                placeholder="seu@email.com"
                placeholderTextColor="#A1A7AE"
                value={email}
                onChangeText={(v) => { setEmail(v); setError('') }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
              />
            </View>
            {error ? (
              <Text className="text-sm text-red-500" style={{ fontFamily: 'RedditSans-Regular' }}>{error}</Text>
            ) : null}
          </View>

          <View className="flex-1" />

          <TouchableOpacity
            className={`rounded-full py-4 items-center ${isValid ? 'bg-violet-600' : 'bg-gray-200'}`}
            onPress={handleContinue}
            disabled={!isValid || loading}
            activeOpacity={0.8}
          >
            <Text className={`text-base ${isValid ? 'text-white' : 'text-gray-400'}`} style={{ fontFamily: 'RedditSans-SemiBold' }}>
              {loading ? 'Enviando código...' : 'Continuar'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
