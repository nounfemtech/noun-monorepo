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
  const { session, loading, hasProfile, hasRequiredConsents } = useAuth()
  const segments  = useSegments()
  const router    = useRouter()

  useEffect(() => {
    if (loading) return

    const segs   = segments as unknown as string[]
    const inAuth = segs[0] === '(auth)'
    const page   = segs[1] as string | undefined

    if (!session) {
      // Não autenticado → landing de auth
      if (!inAuth) router.replace('/(auth)/')
      return
    }

    // Autenticado mas hasProfile ainda não foi verificado → aguarda
    if (hasProfile === null) return

    if (!hasProfile) {
      // Logou via OAuth mas ainda não preencheu o perfil
      if (!inAuth) router.replace('/(auth)/personal-info')
      return
    }

    // Perfil existe mas consentimentos ainda não verificados → aguarda
    if (hasRequiredConsents === null) return

    if (!hasRequiredConsents) {
      // Permite aguardar na success e na própria tela de consent
      if (inAuth && (page === 'consent' || page === 'success')) return
      router.replace('/(auth)/consent')
      return
    }

    if (inAuth) {
      // Tudo ok → entra no app
      router.replace('/(app)/')
    }
  }, [session, loading, hasProfile, hasRequiredConsents, segments])

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
