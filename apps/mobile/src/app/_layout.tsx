import { useEffect } from 'react'
import { Slot } from 'expo-router'
import { useFonts } from 'expo-font'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import './globals.css'

SplashScreen.preventAutoHideAsync()

// ============================================================
// Root Layout — carrega fontes e controla splash
// FASE 2: adicionar AuthProvider + ThemeProvider + ColorThemeProvider
// ============================================================

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'RedditSans-Regular': require('../../assets/fonts/RedditSans-Regular.ttf'),
    'RedditSans-Medium': require('../../assets/fonts/RedditSans-Medium.ttf'),
    'RedditSans-SemiBold': require('../../assets/fonts/RedditSans-SemiBold.ttf'),
    'RedditSans-Bold': require('../../assets/fonts/RedditSans-Bold.ttf'),
  })

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync()
    }
  }, [fontsLoaded, fontError])

  if (!fontsLoaded && !fontError) return null

  return (
    <>
      <StatusBar style="auto" />
      <Slot />
    </>
  )
}
