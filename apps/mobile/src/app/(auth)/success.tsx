import { View, Text, Image, TouchableOpacity } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { IconConfetti, IconHeartbeat, IconArrowRight } from '@tabler/icons-react-native'

export default function Success() {
  return (
    <SafeAreaView className="flex-1 bg-[#FDFDFD]">
      <View className="flex-1 items-center justify-between px-6 pt-16 pb-8">
        <View className="flex-1 items-center justify-center gap-8">
          <Image
            source={require('../../../../assets/create_account/congratulations.png')}
            className="w-64 h-64"
            resizeMode="contain"
          />
          <View className="items-center gap-3">
            <View className="flex-row items-center gap-2">
              <IconConfetti size={28} color="#7C3AED" />
              <Text
                className="text-3xl text-gray-900"
                style={{ fontFamily: 'RedditSans-Bold' }}
              >
                Bem-vinda!
              </Text>
            </View>
            <Text
              className="text-lg text-gray-900 text-center"
              style={{ fontFamily: 'RedditSans-SemiBold' }}
            >
              Sua conta foi criada com sucesso!
            </Text>
            <Text
              className="text-base text-gray-500 text-center leading-6"
              style={{ fontFamily: 'RedditSans-Regular' }}
            >
              Acesse profissionais especializados, farmácias e seu diário de saúde.
            </Text>
          </View>
        </View>

        <View className="w-full gap-3">
          {/* CTA principal — perfil de saúde */}
          <TouchableOpacity
            className="w-full rounded-full bg-violet-600 py-4 flex-row items-center justify-center gap-2"
            onPress={() => router.replace('/(auth)/consent')}
            activeOpacity={0.8}
          >
            <Text
              className="text-base text-white"
              style={{ fontFamily: 'RedditSans-SemiBold' }}
            >
              Começar minha jornada
            </Text>
          </TouchableOpacity>

          {/* Sugestão de completar perfil de saúde */}
          <View className="flex-row items-start gap-3 bg-violet-50 border border-violet-100 rounded-2xl p-4">
            <IconHeartbeat size={20} color="#7C3AED" style={{ marginTop: 1 }} />
            <View className="flex-1 gap-1">
              <Text
                className="text-sm text-gray-800"
                style={{ fontFamily: 'RedditSans-SemiBold' }}
              >
                Complete seu perfil de saúde
              </Text>
              <Text
                className="text-xs text-gray-500 leading-4"
                style={{ fontFamily: 'RedditSans-Regular' }}
              >
                Informe condições, medicamentos e preferências para receber cuidado personalizado.
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.replace('/(app)/health-profile')}
              activeOpacity={0.7}
              className="self-center"
            >
              <IconArrowRight size={20} color="#7C3AED" />
            </TouchableOpacity>
          </View>

          <Text
            className="text-xs text-gray-400 text-center"
            style={{ fontFamily: 'RedditSans-Regular' }}
          >
            Você pode preencher depois em Perfil → Meu perfil de saúde
          </Text>
        </View>
      </View>
    </SafeAreaView>
  )
}
