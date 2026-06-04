import { View, Text, TouchableOpacity, Alert } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { IconLogout, IconUser, IconShieldCheck, IconChevronRight } from '@tabler/icons-react-native'
import { useAuth } from '@/providers/auth-provider'
import { authService } from '@/lib/auth.service'

export default function Profile() {
  const { user } = useAuth()

  const handleSignOut = async () => {
    Alert.alert('Sair da conta', 'Tem certeza que deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await authService.signOut()
          // AuthProvider detecta SIGNED_OUT → AuthGate redireciona para (auth)/
        },
      },
    ])
  }

  return (
    <SafeAreaView className="flex-1 bg-[#FDFDFD] px-6 pt-6">
      <Text className="text-2xl text-gray-900 mb-6" style={{ fontFamily: 'RedditSans-Bold' }}>Perfil</Text>

      {user && (
        <View className="flex-row items-center gap-4 p-4 rounded-2xl border border-gray-100 bg-white mb-6">
          <View className="w-12 h-12 rounded-full bg-violet-100 items-center justify-center">
            <IconUser size={24} color="#7C3AED" />
          </View>
          <View className="flex-1">
            <Text className="text-base text-gray-900" style={{ fontFamily: 'RedditSans-SemiBold' }}>
              {user.email}
            </Text>
            <Text className="text-sm text-gray-500" style={{ fontFamily: 'RedditSans-Regular' }}>
              Paciente · Noun App
            </Text>
          </View>
        </View>
      )}

      {/* Configurações de privacidade */}
      <TouchableOpacity
        className="flex-row items-center justify-between p-4 rounded-2xl border border-gray-100 bg-white mb-4"
        onPress={() => router.push('/(app)/privacy-settings')}
        activeOpacity={0.7}
      >
        <View className="flex-row items-center gap-3">
          <IconShieldCheck size={20} color="#7C3AED" />
          <Text className="text-sm text-gray-800" style={{ fontFamily: 'RedditSans-Medium' }}>
            Configurações de privacidade
          </Text>
        </View>
        <IconChevronRight size={18} color="#A1A7AE" />
      </TouchableOpacity>

      <View className="flex-1" />

      <TouchableOpacity
        className="flex-row items-center justify-center gap-3 rounded-full border border-red-200 py-4 mb-4"
        onPress={handleSignOut}
        activeOpacity={0.7}
      >
        <IconLogout size={20} color="#DC2626" />
        <Text className="text-base text-red-600" style={{ fontFamily: 'RedditSans-SemiBold' }}>Sair da conta</Text>
      </TouchableOpacity>
    </SafeAreaView>
  )
}
