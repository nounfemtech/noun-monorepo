import { useState, useRef, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { IconArrowLeft, IconMail } from '@tabler/icons-react-native'
import { authService } from '@/lib/auth.service'

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <View className="flex-row gap-1.5 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} className={`h-1 flex-1 rounded-full ${i < step ? 'bg-violet-600' : 'bg-gray-200'}`} />
      ))}
    </View>
  )
}

const CODE_LENGTH = 6

export default function VerifyEmail() {
  const { email } = useLocalSearchParams<{ email: string }>()
  const [digits,    setDigits]    = useState<string[]>(Array(CODE_LENGTH).fill(''))
  const [error,     setError]     = useState('')
  const [loading,   setLoading]   = useState(false)
  const [countdown, setCountdown] = useState(60)
  const inputRefs = useRef<(TextInput | null)[]>([])

  useEffect(() => {
    const timer = setInterval(() => setCountdown((c) => (c > 0 ? c - 1 : 0)), 1000)
    return () => clearInterval(timer)
  }, [])

  const handleDigit = (value: string, index: number) => {
    const cleaned = value.replace(/\D/g, '').slice(-1)
    const next    = [...digits]
    next[index]   = cleaned
    setDigits(next)
    setError('')
    if (cleaned && index < CODE_LENGTH - 1) inputRefs.current[index + 1]?.focus()
  }

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const code       = digits.join('')
  const isComplete = code.length === CODE_LENGTH

  const handleVerify = async () => {
    if (!isComplete || !email) return
    setLoading(true)
    setError('')

    const result = await authService.verifyOTP(email, code)
    setLoading(false)

    if (!result.success) {
      setError(result.error ?? 'Código inválido')
      setDigits(Array(CODE_LENGTH).fill(''))
      inputRefs.current[0]?.focus()
      return
    }

    router.push({ pathname: '/(auth)/set-password', params: { email } })
  }

  const handleResend = async () => {
    if (countdown > 0 || !email) return
    setCountdown(60)
    const result = await authService.resendOTP(email)
    if (result.success) {
      Alert.alert('Código reenviado', `Verifique sua caixa de entrada em ${email}`)
    } else {
      Alert.alert('Erro', result.error ?? 'Não foi possível reenviar o código')
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-[#FDFDFD]">
      <View className="flex-1 px-6 pt-4">
        <TouchableOpacity onPress={() => router.back()} className="mb-6 self-start p-1">
          <IconArrowLeft size={24} color="#252B37" />
        </TouchableOpacity>

        <ProgressBar step={2} total={5} />

        <View className="items-center mb-4">
          <View className="w-14 h-14 rounded-full bg-violet-100 items-center justify-center mb-4">
            <IconMail size={28} color="#7C3AED" />
          </View>
          <Text className="text-2xl text-gray-900 text-center" style={{ fontFamily: 'RedditSans-Bold' }}>
            Verifique seu e-mail
          </Text>
          <Text className="mt-2 text-base text-gray-500 text-center" style={{ fontFamily: 'RedditSans-Regular' }}>
            Código enviado para{'\n'}
            <Text className="text-gray-700" style={{ fontFamily: 'RedditSans-SemiBold' }}>{email}</Text>
          </Text>
        </View>

        {/* 6 caixas de dígito */}
        <View className="flex-row justify-center gap-3 mb-4">
          {digits.map((digit, i) => (
            <TextInput
              key={i}
              ref={(r) => { inputRefs.current[i] = r }}
              className={`w-12 h-14 border rounded-xl text-center text-2xl bg-white ${
                error ? 'border-red-400' : digit ? 'border-violet-500' : 'border-gray-200'
              }`}
              style={{ fontFamily: 'RedditSans-Bold' }}
              value={digit}
              onChangeText={(v) => handleDigit(v, i)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        {error ? (
          <Text className="text-sm text-red-500 text-center mb-4" style={{ fontFamily: 'RedditSans-Regular' }}>
            {error}
          </Text>
        ) : null}

        <TouchableOpacity onPress={handleResend} disabled={countdown > 0} className="items-center mb-8">
          <Text className="text-base text-gray-500" style={{ fontFamily: 'RedditSans-Regular' }}>
            {countdown > 0 ? `Reenviar em ${countdown}s` : (
              <Text className="text-violet-600" style={{ fontFamily: 'RedditSans-SemiBold' }}>
                Reenviar código
              </Text>
            )}
          </Text>
        </TouchableOpacity>

        <View className="flex-1" />

        <TouchableOpacity
          className={`rounded-full py-4 items-center ${isComplete ? 'bg-violet-600' : 'bg-gray-200'}`}
          onPress={handleVerify}
          disabled={!isComplete || loading}
          activeOpacity={0.8}
        >
          <Text className={`text-base ${isComplete ? 'text-white' : 'text-gray-400'}`} style={{ fontFamily: 'RedditSans-SemiBold' }}>
            {loading ? 'Verificando...' : 'Verificar'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}
