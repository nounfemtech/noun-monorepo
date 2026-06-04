import { View, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

// ============================================================
// Minha Saúde — placeholder (FASE 2: diário hormonal)
// ============================================================

export default function Health() {
  return (
    <SafeAreaView className="flex-1 bg-[#FDFDFD] items-center justify-center">
      <Text className="text-2xl text-gray-900 mb-2" style={{ fontFamily: 'RedditSans-Bold' }}>
        Minha Saúde
      </Text>
      <Text className="text-base text-gray-400" style={{ fontFamily: 'RedditSans-Regular' }}>
        Diário hormonal — FASE 2
      </Text>
    </SafeAreaView>
  )
}
