import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { IconArrowLeft, IconUser, IconInfoCircle } from '@tabler/icons-react-native'

// ============================================================
// Passo 5/5 — Nome social (opcional)
// FASE 2: chamar authService.saveProfile(data) e navegar para success
// ============================================================

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <View className="flex-row gap-1.5 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} className={`h-1 flex-1 rounded-full ${i < step ? 'bg-violet-600' : 'bg-gray-200'}`} />
      ))}
    </View>
  )
}

export default function AdditionalInfo() {
  const params = useLocalSearchParams<{ fullName: string; cpf: string; birthDate: string }>()
  const [socialName, setSocialName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleFinish = async () => {
    setLoading(true)
    // TODO FASE 2: await authService.saveProfile({ ...params, socialName: socialName || undefined })
    setLoading(false)
    router.replace('/(auth)/success')
  }

  return (
    <SafeAreaView className="flex-1 bg-[#FDFDFD]">
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View className="flex-1 px-6 pt-4">
          <TouchableOpacity onPress={() => router.back()} className="mb-6 self-start p-1">
            <IconArrowLeft size={24} color="#252B37" />
          </TouchableOpacity>

          <ProgressBar step={5} total={5} />

          <Text className="text-2xl text-gray-900 mb-2" style={{ fontFamily: 'RedditSans-Bold' }}>
            Como prefere ser chamada?
          </Text>
          <Text className="text-base text-gray-500 mb-2" style={{ fontFamily: 'RedditSans-Regular' }}>
            Seu nome social é opcional — mas queremos te chamar do jeito que você se identifica.
          </Text>

          {/* Info box */}
          <View className="flex-row gap-3 bg-violet-50 border border-violet-100 rounded-xl p-4 mb-8">
            <IconInfoCircle size={20} color="#7C3AED" />
            <Text className="flex-1 text-sm text-violet-700" style={{ fontFamily: 'RedditSans-Regular' }}>
              O nome social é o nome pelo qual uma pessoa trans ou não-binária se identifica, diferente do nome registrado em documentos.
            </Text>
          </View>

          {/* Input */}
          <View className="gap-1.5 mb-6">
            <Text className="text-sm text-gray-700" style={{ fontFamily: 'RedditSans-Medium' }}>
              Nome social <Text className="text-gray-400">(opcional)</Text>
            </Text>
            <View className="flex-row items-center border border-gray-200 rounded-xl px-4 gap-3 bg-white" style={{ height: 52 }}>
              <IconUser size={18} color="#A1A7AE" />
              <TextInput
                className="flex-1 text-base text-gray-900"
                style={{ fontFamily: 'RedditSans-Regular' }}
                placeholder={params.fullName?.split(' ')[0] ?? 'Seu nome social'}
                placeholderTextColor="#A1A7AE"
                value={socialName}
                onChangeText={setSocialName}
              />
            </View>
          </View>

          <View className="flex-1" />

          {/* Botões */}
          <View className="gap-3">
            <TouchableOpacity
              className="rounded-full bg-violet-600 py-4 items-center"
              onPress={handleFinish}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text className="text-base text-white" style={{ fontFamily: 'RedditSans-SemiBold' }}>
                {loading ? 'Criando conta...' : 'Criar minha conta'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="items-center py-3"
              onPress={handleFinish}
              disabled={loading}
            >
              <Text className="text-base text-gray-500" style={{ fontFamily: 'RedditSans-Regular' }}>
                Pular por agora
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
