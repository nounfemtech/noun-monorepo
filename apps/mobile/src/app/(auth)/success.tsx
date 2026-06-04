import { View, Text, Image, TouchableOpacity } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { IconConfetti } from '@tabler/icons-react-native'

// ============================================================
// Sucesso — Cadastro concluído
// ============================================================

export default function Success() {
  return (
    <SafeAreaView className="flex-1 bg-[#FDFDFD]">
      <View className="flex-1 items-center justify-between px-6 pt-16 pb-8">

        {/* Ilustração */}
        <View className="flex-1 items-center justify-center gap-8">
          <Image
            source={require('../../../../assets/create_account/congratulations.png')}
            className="w-64 h-64"
            resizeMode="contain"
          />
          <View className="items-center gap-3">
            <View className="flex-row items-center gap-2">
              <IconConfetti size={28} color="#7C3AED" />
              <Text className="text-3xl text-gray-900" style={{ fontFamily: 'RedditSans-Bold' }}>
                Bem-vinda!
              </Text>
            </View>
            <Text className="text-lg text-gray-900 text-center" style={{ fontFamily: 'RedditSans-SemiBold' }}>
              Sua conta foi criada com sucesso!
            </Text>
            <Text className="text-base text-gray-500 text-center leading-6" style={{ fontFamily: 'RedditSans-Regular' }}>
              Agora você tem acesso a profissionais de saúde especializados, farmácias e um diário da sua saúde.
            </Text>
          </View>
        </View>

        {/* CTA */}
        <TouchableOpacity
          className="w-full rounded-full bg-violet-600 py-4 items-center"
          onPress={() => router.replace('/(app)/')}
          activeOpacity={0.8}
        >
          <Text className="text-base text-white" style={{ fontFamily: 'RedditSans-SemiBold' }}>
            Começar minha jornada
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}
