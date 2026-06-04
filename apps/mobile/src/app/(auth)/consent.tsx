import { useState } from 'react'
import { View, Text, Switch, ScrollView, TouchableOpacity, Alert } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as WebBrowser from 'expo-web-browser'
import { useAuth } from '@/providers/auth-provider'
import { consentService, TERMS_VERSION, ConsentType } from '@/lib/consent.service'

// TODO: atualizar URLs quando documentos jurídicos estiverem disponíveis
// [PLACEHOLDER - AGUARDANDO ASSESSORIA JURÍDICA]
const TERMS_URL   = 'https://nounfemtech.com/termos-de-uso'
const PRIVACY_URL = 'https://nounfemtech.com/politica-de-privacidade'

// ============================================================
// ConsentRow — linha de toggle com label textual
// ============================================================

function ConsentRow({
  label,
  value,
  onValueChange,
  disabled = false,
}: {
  label:         React.ReactNode
  value:         boolean
  onValueChange: (v: boolean) => void
  disabled?:     boolean
}) {
  return (
    <View className="flex-row items-center gap-4">
      <Text
        className="flex-1 text-sm text-gray-800 leading-5"
        style={{ fontFamily: 'RedditSans-Regular' }}
      >
        {label}
      </Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: '#E5E7EB', true: '#7C3AED' }}
        thumbColor="#FFFFFF"
      />
    </View>
  )
}

// ============================================================
// Tela de Consentimento LGPD
// ============================================================

export default function Consent() {
  const { user, refreshConsents } = useAuth()

  const [termsAccepted,     setTermsAccepted]     = useState(false)
  const [privacyAccepted,   setPrivacyAccepted]   = useState(false)
  const [healthAccepted,    setHealthAccepted]    = useState(false)
  const [marketingAccepted, setMarketingAccepted] = useState(false)
  const [saving,            setSaving]            = useState(false)

  const allRequired = termsAccepted && privacyAccepted && healthAccepted
  const canContinue = allRequired && !saving

  const openUrl = (url: string) => WebBrowser.openBrowserAsync(url)

  const handleContinue = async () => {
    if (!canContinue || !user?.id) return
    setSaving(true)
    try {
      const consents: { consentType: ConsentType; accepted: boolean }[] = [
        { consentType: 'terms_of_use',   accepted: termsAccepted },
        { consentType: 'privacy_policy', accepted: privacyAccepted },
        { consentType: 'health_data',    accepted: healthAccepted },
        { consentType: 'marketing',      accepted: marketingAccepted },
      ]
      await consentService.saveConsents(user.id, consents)
      await refreshConsents()
      router.replace('/(app)/')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Não foi possível salvar os consentimentos.'
      Alert.alert('Erro', message)
    } finally {
      setSaving(false)
    }
  }

  const today = new Date().toLocaleDateString('pt-BR', {
    day:   '2-digit',
    month: 'long',
    year:  'numeric',
  })

  return (
    <SafeAreaView className="flex-1 bg-[#FDFDFD]">
      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ────────────────────────────────────── */}
        <View className="items-center pt-10 pb-8">
          <Text
            className="text-2xl text-violet-600 tracking-tighter"
            style={{ fontFamily: 'RedditSans-Bold' }}
          >
            noun
          </Text>
          <Text
            className="text-2xl text-gray-900 mt-5"
            style={{ fontFamily: 'RedditSans-Bold' }}
          >
            Antes de começar
          </Text>
          <Text
            className="text-base text-gray-500 text-center mt-2 leading-6"
            style={{ fontFamily: 'RedditSans-Regular' }}
          >
            Precisamos do seu consentimento para continuar
          </Text>
        </View>

        {/* ── Obrigatórios ──────────────────────────────── */}
        <View className="rounded-2xl border border-gray-100 bg-white p-5 mb-4">
          <Text
            className="text-xs text-gray-400 uppercase tracking-widest mb-5"
            style={{ fontFamily: 'RedditSans-SemiBold' }}
          >
            Obrigatórios
          </Text>

          <ConsentRow
            label={
              <>
                {'Li e aceito os '}
                <Text
                  className="text-violet-600"
                  onPress={() => openUrl(TERMS_URL)}
                >
                  Termos de Uso
                </Text>
              </>
            }
            value={termsAccepted}
            onValueChange={setTermsAccepted}
          />

          <View className="h-px bg-gray-50 my-4" />

          <ConsentRow
            label={
              <>
                {'Li e aceito a '}
                <Text
                  className="text-violet-600"
                  onPress={() => openUrl(PRIVACY_URL)}
                >
                  Política de Privacidade
                </Text>
              </>
            }
            value={privacyAccepted}
            onValueChange={setPrivacyAccepted}
          />

          <View className="h-px bg-gray-50 my-4" />

          <ConsentRow
            label="Autorizo o uso dos meus dados de saúde para prestação dos serviços do Noun"
            value={healthAccepted}
            onValueChange={setHealthAccepted}
          />

          <View className="mt-5 rounded-xl bg-violet-50 p-4">
            <Text
              className="text-xs text-violet-700 text-center leading-5"
              style={{ fontFamily: 'RedditSans-Regular' }}
            >
              Estes consentimentos são necessários para usar o Noun.{'\n'}
              Seus dados são protegidos conforme a LGPD.
            </Text>
          </View>
        </View>

        {/* ── Opcional ──────────────────────────────────── */}
        <View className="rounded-2xl border border-gray-100 bg-white p-5 mb-8">
          <Text
            className="text-xs text-gray-400 uppercase tracking-widest mb-5"
            style={{ fontFamily: 'RedditSans-SemiBold' }}
          >
            Opcional
          </Text>

          <ConsentRow
            label="Aceito receber comunicações e novidades do Noun por e-mail"
            value={marketingAccepted}
            onValueChange={setMarketingAccepted}
          />

          <Text
            className="text-xs text-gray-400 mt-4 leading-5"
            style={{ fontFamily: 'RedditSans-Regular' }}
          >
            Você pode revogar este consentimento a qualquer momento nas configurações.
          </Text>
        </View>
      </ScrollView>

      {/* ── Footer fixo ───────────────────────────────── */}
      <View className="px-6 pb-6">
        <TouchableOpacity
          className={`rounded-full py-4 items-center mb-5 ${canContinue ? 'bg-violet-600' : 'bg-gray-200'}`}
          onPress={handleContinue}
          disabled={!canContinue}
          activeOpacity={0.8}
        >
          <Text
            className={`text-base ${canContinue ? 'text-white' : 'text-gray-400'}`}
            style={{ fontFamily: 'RedditSans-SemiBold' }}
          >
            {saving ? 'Salvando...' : 'Continuar'}
          </Text>
        </TouchableOpacity>

        <View className="items-center gap-1">
          <Text
            className="text-xs text-gray-400"
            style={{ fontFamily: 'RedditSans-Regular' }}
          >
            Versão dos Termos: {TERMS_VERSION}
          </Text>
          <Text
            className="text-xs text-gray-400"
            style={{ fontFamily: 'RedditSans-Regular' }}
          >
            Data: {today}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  )
}
