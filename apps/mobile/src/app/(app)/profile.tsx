import { View, Text, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { IconLogout } from '@tabler/icons-react-native'
import { router } from 'expo-router'

// ============================================================
// Perfil — placeholder (FASE 2: dados do usuário + logout real)
// ============================================================

export default function Profile() {
  const handleSignOut = () => {
    // TODO FASE 2: await authService.signOut()
    router.replace('/(auth)/')
  }

  return (
    <SafeAreaView className="flex-1 bg-[#FDFDFD] px-6 pt-6">
      <Text className="text-2xl text-gray-900 mb-6" style={{ fontFamily: 'RedditSans-Bold' }}>
        Perfil
      </Text>

      <View className="flex-1" />

      <TouchableOpacity
        className="flex-row items-center justify-center gap-3 rounded-full border border-red-200 py-4 mb-4"
        onPress={handleSignOut}
        activeOpacity={0.7}
      >
        <IconLogout size={20} color="#DC2626" />
        <Text className="text-base text-red-600" style={{ fontFamily: 'RedditSans-SemiBold' }}>
          Sair da conta
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  )
}
