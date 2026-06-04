import { View, Text, TouchableOpacity, Image } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  IconMail,
  IconBrandGoogle,
  IconBrandApple,
} from '@tabler/icons-react-native'

// ============================================================
// Landing — Logo + 3 botões de entrada
// FASE 2: implementar Google e Apple OAuth
// ============================================================

export default function AuthLanding() {
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
            <Text
              className="text-4xl text-gray-900 text-center"
              style={{ fontFamily: 'RedditSans-Bold' }}
            >
              Noun
            </Text>
            <Text
              className="text-lg text-gray-500 text-center leading-7 px-4"
              style={{ fontFamily: 'RedditSans-Regular' }}
            >
              Cuide da sua saúde hormonal com quem entende você
            </Text>
          </View>
        </View>

        {/* Botões de autenticação */}
        <View className="w-full gap-3">
          {/* Google — FASE 2 */}
          <TouchableOpacity
            className="flex-row items-center justify-center gap-3 rounded-full border border-gray-200 bg-white py-4 shadow-sm"
            onPress={() => {
              // TODO FASE 2: signInWithGoogle()
            }}
            activeOpacity={0.7}
          >
            <IconBrandGoogle size={20} color="#252525" />
            <Text
              className="text-base text-gray-900"
              style={{ fontFamily: 'RedditSans-SemiBold' }}
            >
              Entrar com Google
            </Text>
          </TouchableOpacity>

          {/* Apple — FASE 2 */}
          <TouchableOpacity
            className="flex-row items-center justify-center gap-3 rounded-full border border-gray-200 bg-white py-4 shadow-sm"
            onPress={() => {
              // TODO FASE 2: signInWithApple()
            }}
            activeOpacity={0.7}
          >
            <IconBrandApple size={20} color="#252525" />
            <Text
              className="text-base text-gray-900"
              style={{ fontFamily: 'RedditSans-SemiBold' }}
            >
              Entrar com Apple
            </Text>
          </TouchableOpacity>

          {/* E-mail */}
          <TouchableOpacity
            className="flex-row items-center justify-center gap-3 rounded-full bg-violet-600 py-4"
            onPress={() => router.push('/(auth)/sign-up')}
            activeOpacity={0.8}
          >
            <IconMail size={20} color="white" />
            <Text
              className="text-base text-white"
              style={{ fontFamily: 'RedditSans-SemiBold' }}
            >
              Continuar com e-mail
            </Text>
          </TouchableOpacity>

          {/* Login existente */}
          <TouchableOpacity
            className="items-center py-3"
            onPress={() => router.push('/(auth)/sign-in')}
            activeOpacity={0.7}
          >
            <Text
              className="text-gray-500"
              style={{ fontFamily: 'RedditSans-Regular' }}
            >
              Já tenho conta —{' '}
              <Text
                className="text-violet-600"
                style={{ fontFamily: 'RedditSans-SemiBold' }}
              >
                fazer login
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  )
}
