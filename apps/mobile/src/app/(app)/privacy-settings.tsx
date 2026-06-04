import { useState, useEffect, useCallback } from 'react'
import { View, Text, Switch, TouchableOpacity, ScrollView, Alert } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as WebBrowser from 'expo-web-browser'
import {
  IconArrowLeft,
  IconShieldCheck,
  IconExternalLink,
  IconTrash,
} from '@tabler/icons-react-native'
import { useAuth } from '@/providers/auth-provider'
import {
  consentService,
  ConsentRecord,
  ConsentType,
  TERMS_VERSION,
} from '@/lib/consent.service'

// TODO: atualizar URLs quando documentos jurídicos estiverem disponíveis
// [PLACEHOLDER - AGUARDANDO ASSESSORIA JURÍDICA]
const TERMS_URL   = 'https://nounfemtech.com/termos-de-uso'
const PRIVACY_URL = 'https://nounfemtech.com/politica-de-privacidade'

const CONSENT_LABELS: Record<ConsentType, string> = {
  terms_of_use:   'Termos de Uso',
  privacy_policy: 'Política de Privacidade',
  health_data:    'Uso de dados de saúde',
  marketing:      'Comunicações por e-mail',
}

const REQUIRED: ConsentType[] = ['terms_of_use', 'privacy_policy', 'health_data']

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day:   '2-digit',
    month: 'short',
    year:  'numeric',
  })
}

// ============================================================
// Tela de Configurações de Privacidade
// ============================================================

export default function PrivacySettings() {
  const { user } = useAuth()
  const [consents,  setConsents]  = useState<ConsentRecord[]>([])
  const [loading,   setLoading]   = useState(true)
  const [toggling,  setToggling]  = useState(false)

  const loadConsents = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const data = await consentService.getConsents(user.id)
      setConsents(data)
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar os consentimentos.')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => { loadConsents() }, [loadConsents])

  const getConsent = (type: ConsentType) =>
    consents.find((c) => c.consent_type === type)

  const handleMarketingToggle = async (value: boolean) => {
    if (!user?.id) return
    setToggling(true)
    try {
      if (value) {
        await consentService.reactivateConsent(user.id, 'marketing')
      } else {
        await consentService.revokeConsent(user.id, 'marketing')
      }
      await loadConsents()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Não foi possível atualizar o consentimento.'
      Alert.alert('Erro', message)
    } finally {
      setToggling(false)
    }
  }

  const openUrl = (url: string) => WebBrowser.openBrowserAsync(url)

  const marketingConsent = getConsent('marketing')

  return (
    <SafeAreaView className="flex-1 bg-[#FDFDFD]">
      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ────────────────────────────────────── */}
        <TouchableOpacity
          onPress={() => router.back()}
          className="pt-4 pb-6 self-start"
          activeOpacity={0.7}
        >
          <IconArrowLeft size={24} color="#252B37" />
        </TouchableOpacity>

        <View className="flex-row items-center gap-2 mb-6">
          <IconShieldCheck size={24} color="#7C3AED" />
          <Text
            className="text-2xl text-gray-900"
            style={{ fontFamily: 'RedditSans-Bold' }}
          >
            Privacidade
          </Text>
        </View>

        {/* ── Consentimentos obrigatórios ───────────────── */}
        <View className="rounded-2xl border border-gray-100 bg-white p-5 mb-4">
          <Text
            className="text-xs text-gray-400 uppercase tracking-widest mb-5"
            style={{ fontFamily: 'RedditSans-SemiBold' }}
          >
            Meus consentimentos
          </Text>

          {REQUIRED.map((type, i) => {
            const consent = getConsent(type)
            return (
              <View key={type}>
                {i > 0 && <View className="h-px bg-gray-50 my-4" />}
                <View className="flex-row items-start justify-between gap-3">
                  <View className="flex-1">
                    <Text
                      className="text-sm text-gray-800"
                      style={{ fontFamily: 'RedditSans-Medium' }}
                    >
                      {CONSENT_LABELS[type]}
                    </Text>
                    <Text
                      className="text-xs text-gray-400 mt-0.5"
                      style={{ fontFamily: 'RedditSans-Regular' }}
                    >
                      {loading
                        ? '...'
                        : consent?.accepted
                          ? `Aceito em ${formatDate(consent.accepted_at)}`
                          : 'Não concedido'}
                    </Text>
                  </View>
                  <View
                    className={`px-2.5 py-0.5 rounded-full mt-0.5 ${
                      consent?.accepted ? 'bg-green-50' : 'bg-red-50'
                    }`}
                  >
                    <Text
                      className={`text-xs ${
                        consent?.accepted ? 'text-green-600' : 'text-red-500'
                      }`}
                      style={{ fontFamily: 'RedditSans-Medium' }}
                    >
                      {consent?.accepted ? 'Ativo' : 'Inativo'}
                    </Text>
                  </View>
                </View>
              </View>
            )
          })}
        </View>

        {/* ── Marketing (opcional, togglável) ───────────── */}
        <View className="rounded-2xl border border-gray-100 bg-white p-5 mb-4">
          <Text
            className="text-xs text-gray-400 uppercase tracking-widest mb-5"
            style={{ fontFamily: 'RedditSans-SemiBold' }}
          >
            Comunicações
          </Text>

          <View className="flex-row items-center gap-4">
            <View className="flex-1">
              <Text
                className="text-sm text-gray-800"
                style={{ fontFamily: 'RedditSans-Medium' }}
              >
                {CONSENT_LABELS.marketing}
              </Text>
              {marketingConsent?.accepted_at && (
                <Text
                  className="text-xs text-gray-400 mt-0.5"
                  style={{ fontFamily: 'RedditSans-Regular' }}
                >
                  Aceito em {formatDate(marketingConsent.accepted_at)}
                </Text>
              )}
            </View>
            <Switch
              value={marketingConsent?.accepted ?? false}
              onValueChange={handleMarketingToggle}
              disabled={toggling || loading}
              trackColor={{ false: '#E5E7EB', true: '#7C3AED' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <Text
            className="text-xs text-gray-400 mt-4 leading-5"
            style={{ fontFamily: 'RedditSans-Regular' }}
          >
            Você pode revogar este consentimento a qualquer momento.
          </Text>
        </View>

        {/* ── Versão dos termos ─────────────────────────── */}
        <View className="rounded-2xl border border-gray-100 bg-white p-5 mb-4">
          <Text
            className="text-xs text-gray-400 uppercase tracking-widest mb-4"
            style={{ fontFamily: 'RedditSans-SemiBold' }}
          >
            Documentos
          </Text>

          <TouchableOpacity
            className="flex-row items-center justify-between py-2"
            onPress={() => openUrl(TERMS_URL)}
            activeOpacity={0.7}
          >
            <Text
              className="text-sm text-gray-800"
              style={{ fontFamily: 'RedditSans-Regular' }}
            >
              Termos de Uso
            </Text>
            <IconExternalLink size={16} color="#A1A7AE" />
          </TouchableOpacity>

          <View className="h-px bg-gray-50 my-1" />

          <TouchableOpacity
            className="flex-row items-center justify-between py-2"
            onPress={() => openUrl(PRIVACY_URL)}
            activeOpacity={0.7}
          >
            <Text
              className="text-sm text-gray-800"
              style={{ fontFamily: 'RedditSans-Regular' }}
            >
              Política de Privacidade
            </Text>
            <IconExternalLink size={16} color="#A1A7AE" />
          </TouchableOpacity>

          <View className="h-px bg-gray-50 my-1" />

          <View className="flex-row items-center justify-between py-2">
            <Text
              className="text-sm text-gray-400"
              style={{ fontFamily: 'RedditSans-Regular' }}
            >
              Versão dos Termos
            </Text>
            <Text
              className="text-sm text-gray-500"
              style={{ fontFamily: 'RedditSans-Medium' }}
            >
              {TERMS_VERSION}
            </Text>
          </View>
        </View>

        {/* ── Excluir conta (placeholder) ───────────────── */}
        <TouchableOpacity
          className="flex-row items-center justify-center gap-3 rounded-full border border-red-200 py-4"
          onPress={() =>
            Alert.alert(
              'Em breve',
              'A exclusão de conta estará disponível em uma versão futura do Noun.'
            )
          }
          activeOpacity={0.7}
        >
          <IconTrash size={20} color="#DC2626" />
          <Text
            className="text-base text-red-600"
            style={{ fontFamily: 'RedditSans-SemiBold' }}
          >
            Excluir minha conta
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}
