import { Stack } from 'expo-router'

// ============================================================
// Auth Layout — Stack sem header, fundo branco
// ============================================================

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#FDFDFD' },
        animation: 'slide_from_right',
      }}
    />
  )
}
