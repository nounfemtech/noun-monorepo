import { useState } from 'react'
import { View, Text, TouchableOpacity, Image, Alert, Platform } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as WebBrowser from 'expo-web-browser'
import { makeRedirectUri } from 'expo-auth-session'
import * as AppleAuthentication from 'expo-apple-authentication'
import {
  IconMail, IconBrandGoogle, IconBrandApple,
} from '@tabler/icons-react-native'
import { authService } from '@/lib/auth.service'

WebBrowser.maybeCompleteAuthSession()

// ============================================================
// Landing — Logo + Google / Apple / E-mail
// ============================================================

export default function AuthLanding() {
  const [loading, setLoading] = useState<'google' | 'apple' | null>(null)

  // ── Google OAuth (expo-auth-session, sem eject) ──────────
  const handleGoogle = async () => {
    setLoading('google')
    try {
      const redirectTo = makeRedirectUri({ scheme: 'noun', path: 'auth/callback' })
      const result = await authService.getGoogleOAuthUrl(redirectTo)

      if (!result.success || !result.url) {
        Alert.alert('Erro', result.error ?? 'Não foi possível iniciar o login com Google')
        return
      }

      const browserResult = await WebBrowser.openAuthSessionAsync(result.url, redirectTo)

      if (browserResult.type === 'success' && browserResult.url) {
        const sessionResult = await authService.setSessionFromUrl(browserResult.url)
        if (!sessionResult.success) {
          Alert.alert('Erro', sessionResult.error ?? 'Falha ao processar login do Google')
        }
        // AuthProvider detecta a sessão via onAuthStateChange → AuthGate redireciona
      }
    } catch (err: any) {
      Alert.alert('Erro', err.message ?? 'Falha no login com Google')
    } finally {
      setLoading(null)
    }
  }

  // ── Apple Sign In (iOS apenas) ───────────────────────────
  const handleApple = async () => {
    if (Platform.OS !== 'ios') {
      Alert.alert('Indisponível', 'Login com Apple está disponível apenas no iOS.')
      return
    }
    setLoading('apple')
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      })

      if (!credential.identityToken) {
        throw new Error('Token não recebido da Apple')
      }

      const { supabase } = await import('@/lib/supabase')
      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      })

      if (error) throw error
      // AuthProvider detecta → AuthGate redireciona
    } catch (err: any) {
      if (err.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('Erro', err.message ?? 'Falha no login com Apple')
      }
    } finally {
      setLoading(null)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-[#FDFDFD]">
      <View className="flex-1 items-center justify-between px-6 pt-12 pb-8">

        {/* Logo + headline */}
        <View className="flex-1 items-center justify-center gap-6">
          <Image
            source={require('../../../assets/icon.png')}
            className="w-24 h-24 rounded-3xl"
            resizeMode="contain"
          />
          <View className="items-center gap-2">
            <Text className="text-4xl text-gray-900 text-center" style={{ fontFamily: 'RedditSans-Bold' }}>
              Noun
            </Text>
            <Text className="text-lg text-gray-500 text-center leading-7 px-4" style={{ fontFamily: 'RedditSans-Regular' }}>
              Cuide da sua saúde hormonal com quem entende você
            </Text>
          </View>
        </View>

        {/* Botões */}
        <View className="w-full gap-3">
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

          {Platform.OS === 'ios' && (
            <TouchableOpacity
              className="flex-row items-center justify-center gap-3 rounded-full border border-gray-200 bg-white py-4"
              onPress={handleApple}
              disabled={!!loading}
              activeOpacity={0.7}
            >
              <IconBrandApple size={20} color="#252525" />
              <Text className="text-base text-gray-900" style={{ fontFamily: 'RedditSans-SemiBold' }}>
                {loading === 'apple' ? 'Aguarde...' : 'Entrar com Apple'}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            className="flex-row items-center justify-center gap-3 rounded-full bg-violet-600 py-4"
            onPress={() => router.push('/(auth)/sign-up')}
            disabled={!!loading}
            activeOpacity={0.8}
          >
            <IconMail size={20} color="white" />
            <Text className="text-base text-white" style={{ fontFamily: 'RedditSans-SemiBold' }}>
              Continuar com e-mail
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="items-center py-3"
            onPress={() => router.push('/(auth)/sign-in')}
            activeOpacity={0.7}
          >
            <Text className="text-gray-500" style={{ fontFamily: 'RedditSans-Regular' }}>
              Já tenho conta —{' '}
              <Text className="text-violet-600" style={{ fontFamily: 'RedditSans-SemiBold' }}>fazer login</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  )
}
