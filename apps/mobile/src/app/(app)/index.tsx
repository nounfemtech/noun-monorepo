import { View, Text, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

// ============================================================
// Home — placeholder
// FASE 2: implementar tela inicial com seções do noun-app
// ============================================================

export default function Home() {
  return (
    <SafeAreaView className="flex-1 bg-[#FDFDFD]">
      <ScrollView className="flex-1 px-6 pt-6">
        <Text className="text-2xl text-gray-900 mb-1" style={{ fontFamily: 'RedditSans-Bold' }}>
          Bem-vinda ao Noun 🌸
        </Text>
        <Text className="text-base text-gray-500 mb-8" style={{ fontFamily: 'RedditSans-Regular' }}>
          Sua jornada de saúde começa aqui.
        </Text>

        {/* Placeholder cards */}
        {['Telemedicina', 'Farmácias', 'Diário de Saúde', 'Conteúdo Educativo'].map((item) => (
          <View
            key={item}
            className="rounded-2xl border border-gray-100 bg-white p-5 mb-3 shadow-sm"
          >
            <Text className="text-base text-gray-800" style={{ fontFamily: 'RedditSans-SemiBold' }}>
              {item}
            </Text>
            <Text className="text-sm text-gray-400 mt-1" style={{ fontFamily: 'RedditSans-Regular' }}>
              Em breve — FASE 2
            </Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}
