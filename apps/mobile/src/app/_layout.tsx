import { useEffect } from 'react'
import { Slot, useRouter, useSegments } from 'expo-router'
import { useFonts } from 'expo-font'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { AuthProvider, useAuth } from '@/providers/auth-provider'
import './globals.css'

SplashScreen.preventAutoHideAsync()

// ============================================================
// AuthGate — redireciona baseado em sessão + existência de perfil
// Deve ficar dentro de AuthProvider para acessar o contexto.
// ============================================================

function AuthGate() {
  const { session, loading, hasProfile } = useAuth()
  const segments  = useSegments()
  const router    = useRouter()

  useEffect(() => {
    if (loading) return

    const inAuth = segments[0] === '(auth)'
    const inApp  = segments[0] === '(app)'

    if (!session) {
      // Não autenticado → landing de auth
      if (!inAuth) router.replace('/(auth)/')
      return
    }

    // Autenticado mas hasProfile ainda não foi verificado → aguarda
    if (hasProfile === null) return

    if (!hasProfile && !inAuth) {
      // Logou via OAuth mas ainda não preencheu o perfil
      router.replace('/(auth)/personal-info')
      return
    }

    if (hasProfile && inAuth) {
      // Já tem perfil e está em tela de auth → manda para o app
      router.replace('/(app)/')
    }
  }, [session, loading, hasProfile, segments])

  return null
}

// ============================================================
// Root Layout
// ============================================================

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'RedditSans-Regular':  require('../../assets/fonts/RedditSans-Regular.ttf'),
    'RedditSans-Medium':   require('../../assets/fonts/RedditSans-Medium.ttf'),
    'RedditSans-SemiBold': require('../../assets/fonts/RedditSans-SemiBold.ttf'),
    'RedditSans-Bold':     require('../../assets/fonts/RedditSans-Bold.ttf'),
  })

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync()
  }, [fontsLoaded, fontError])

  if (!fontsLoaded && !fontError) return null

  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <AuthGate />
      <Slot />
    </AuthProvider>
  )
}
