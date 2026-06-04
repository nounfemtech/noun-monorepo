import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as WebBrowser from 'expo-web-browser'
import { makeRedirectUri } from 'expo-auth-session'
import {
  IconArrowLeft, IconMail, IconLock, IconEye, IconEyeOff,
  IconBrandGoogle, IconBrandApple,
} from '@tabler/icons-react-native'
import { authService } from '@/lib/auth.service'

WebBrowser.maybeCompleteAuthSession()

export default function SignIn() {
  const [email,        setEmail]        = useState('')
  const [password,     setPassword]     = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error,        setError]        = useState('')
  const [loading,      setLoading]      = useState<'email' | 'google' | null>(null)

  const isValid = email.includes('@') && password.length >= 8

  const handleSignIn = async () => {
    setLoading('email')
    setError('')
    const result = await authService.signInWithPassword(email.trim().toLowerCase(), password)
    setLoading(null)
    if (!result.success) {
      setError(result.error ?? 'E-mail ou senha incorretos.')
    }
    // Sucesso → AuthProvider detecta sessão → AuthGate redireciona
  }

  const handleGoogle = async () => {
    setLoading('google')
    try {
      const redirectTo    = makeRedirectUri({ scheme: 'noun', path: 'auth/callback' })
      const oauthResult   = await authService.getGoogleOAuthUrl(redirectTo)
      if (!oauthResult.success || !oauthResult.url) throw new Error(oauthResult.error)
      const browserResult = await WebBrowser.openAuthSessionAsync(oauthResult.url, redirectTo)
      if (browserResult.type === 'success' && browserResult.url) {
        const sessionResult = await authService.setSessionFromUrl(browserResult.url)
        if (!sessionResult.success) throw new Error(sessionResult.error)
      }
    } catch (err: any) {
      Alert.alert('Erro', err.message ?? 'Falha no login com Google')
    } finally {
      setLoading(null)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-[#FDFDFD]">
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View className="flex-1 px-6 pt-4">
          <TouchableOpacity onPress={() => router.back()} className="mb-8 self-start p-1">
            <IconArrowLeft size={24} color="#252B37" />
          </TouchableOpacity>

          <Text className="text-3xl text-gray-900 mb-2" style={{ fontFamily: 'RedditSans-Bold' }}>Entrar</Text>
          <Text className="text-base text-gray-500 mb-8" style={{ fontFamily: 'RedditSans-Regular' }}>Bem-vinda de volta! 🌸</Text>

          {/* OAuth */}
          <View className="gap-3 mb-6">
            <TouchableOpacity
              className="flex-row items-center justify-center gap-3 rounded-full border border-gray-200 bg-white py-4"
              onPress={handleGoogle}
              disabled={!!loading}
              activeOpacity={0.7}
            >
              <IconBrandGoogle size={20} color="#252525" />
              <Text className="text-base text-gray-900" style={{ fontFamily: 'RedditSans-SemiBold' }}>
                {loading === 'google' ? 'Aguarde...' : 'Entrar com Google'}
              </Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center gap-3 mb-6">
            <View className="flex-1 h-px bg-gray-200" />
            <Text className="text-sm text-gray-400" style={{ fontFamily: 'RedditSans-Regular' }}>ou</Text>
            <View className="flex-1 h-px bg-gray-200" />
          </View>

          {/* E-mail + senha */}
          <View className="gap-3 mb-2">
            <View className="flex-row items-center border border-gray-200 rounded-xl px-4 gap-3 bg-white" style={{ height: 52 }}>
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
            <View className={`flex-row items-center border rounded-xl px-4 gap-3 bg-white ${error ? 'border-red-400' : 'border-gray-200'}`} style={{ height: 52 }}>
              <IconLock size={18} color="#A1A7AE" />
              <TextInput
                className="flex-1 text-base text-gray-900"
                style={{ fontFamily: 'RedditSans-Regular' }}
                placeholder="Sua senha"
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
          </View>

          {error ? <Text className="text-sm text-red-500 mb-2" style={{ fontFamily: 'RedditSans-Regular' }}>{error}</Text> : null}

          <TouchableOpacity className="self-end mb-6" onPress={() => router.push('/(auth)/forgot-password')}>
            <Text className="text-sm text-violet-600" style={{ fontFamily: 'RedditSans-SemiBold' }}>Esqueci minha senha</Text>
          </TouchableOpacity>

          <View className="flex-1" />

          <TouchableOpacity
            className={`rounded-full py-4 items-center ${isValid ? 'bg-violet-600' : 'bg-gray-200'}`}
            onPress={handleSignIn}
            disabled={!isValid || !!loading}
            activeOpacity={0.8}
          >
            <Text className={`text-base ${isValid ? 'text-white' : 'text-gray-400'}`} style={{ fontFamily: 'RedditSans-SemiBold' }}>
              {loading === 'email' ? 'Entrando...' : 'Entrar'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity className="items-center pt-4" onPress={() => router.push('/(auth)/sign-up')}>
            <Text className="text-base text-gray-500" style={{ fontFamily: 'RedditSans-Regular' }}>
              Não tem conta?{' '}
              <Text className="text-violet-600" style={{ fontFamily: 'RedditSans-SemiBold' }}>Criar conta</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
