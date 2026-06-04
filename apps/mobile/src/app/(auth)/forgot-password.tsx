import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { IconArrowLeft, IconMail, IconCheck } from '@tabler/icons-react-native'
import { authService } from '@/lib/auth.service'
import { validateEmail } from '@/lib/validations'

export default function ForgotPassword() {
  const [email,   setEmail]   = useState('')
  const [sent,    setSent]    = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const isValid = !validateEmail(email)

  const handleSend = async () => {
    const err = validateEmail(email)
    if (err) { setError(err); return }

    setLoading(true)
    setError('')
    const result = await authService.resetPassword(email.trim().toLowerCase())
    setLoading(false)

    if (!result.success) {
      setError(result.error ?? 'Erro ao enviar e-mail')
      return
    }
    setSent(true)
  }

  return (
    <SafeAreaView className="flex-1 bg-[#FDFDFD]">
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View className="flex-1 px-6 pt-4">
          <TouchableOpacity onPress={() => router.back()} className="mb-8 self-start p-1">
            <IconArrowLeft size={24} color="#252B37" />
          </TouchableOpacity>

          {sent ? (
            <View className="flex-1 items-center justify-center gap-6">
              <View className="w-16 h-16 rounded-full bg-emerald-100 items-center justify-center">
                <IconCheck size={32} color="#059669" />
              </View>
              <View className="items-center gap-2">
                <Text className="text-2xl text-gray-900 text-center" style={{ fontFamily: 'RedditSans-Bold' }}>E-mail enviado!</Text>
                <Text className="text-base text-gray-500 text-center" style={{ fontFamily: 'RedditSans-Regular' }}>
                  Verifique a caixa de entrada de{'\n'}
                  <Text className="text-gray-700" style={{ fontFamily: 'RedditSans-SemiBold' }}>{email}</Text>
                </Text>
              </View>
              <TouchableOpacity
                className="w-full rounded-full bg-violet-600 py-4 items-center mt-4"
                onPress={() => router.replace('/(auth)/sign-in')}
                activeOpacity={0.8}
              >
                <Text className="text-base text-white" style={{ fontFamily: 'RedditSans-SemiBold' }}>Voltar ao login</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text className="text-2xl text-gray-900 mb-2" style={{ fontFamily: 'RedditSans-Bold' }}>Recuperar senha</Text>
              <Text className="text-base text-gray-500 mb-8" style={{ fontFamily: 'RedditSans-Regular' }}>
                Informe seu e-mail e enviaremos um link para redefinir sua senha.
              </Text>

              <View className={`flex-row items-center border rounded-xl px-4 gap-3 bg-white mb-2 ${error ? 'border-red-400' : 'border-gray-200'}`} style={{ height: 52 }}>
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
                  autoCorrect={false}
                />
              </View>
              {error ? <Text className="text-sm text-red-500 mb-4" style={{ fontFamily: 'RedditSans-Regular' }}>{error}</Text> : null}

              <View className="flex-1" />

              <TouchableOpacity
                className={`rounded-full py-4 items-center ${isValid ? 'bg-violet-600' : 'bg-gray-200'}`}
                onPress={handleSend}
                disabled={!isValid || loading}
                activeOpacity={0.8}
              >
                <Text className={`text-base ${isValid ? 'text-white' : 'text-gray-400'}`} style={{ fontFamily: 'RedditSans-SemiBold' }}>
                  {loading ? 'Enviando...' : 'Enviar link de recuperação'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
