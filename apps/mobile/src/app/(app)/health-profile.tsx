import { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  ActivityIndicator,
  Image,
  Pressable,
} from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'
import {
  IconArrowLeft,
  IconCamera,
  IconCheck,
  IconUser,
  IconShieldLock,
  IconChevronDown,
  IconX,
} from '@tabler/icons-react-native'
import { usePatientProfile } from '@/hooks/use-patient-profile'
import { GenderIdentity } from '@/lib/patient-profile.service'

// ============================================================
// Constantes
// ============================================================

const GENDER_OPTIONS: { value: GenderIdentity; label: string }[] = [
  { value: 'cisgender_woman',  label: 'Mulher cisgênero' },
  { value: 'trans_woman',      label: 'Mulher trans' },
  { value: 'non_binary',       label: 'Não-binário' },
  { value: 'gender_fluid',     label: 'Gênero fluido' },
  { value: 'prefer_not_to_say', label: 'Prefiro não informar' },
  { value: 'other',            label: 'Outro' },
]

const GENDER_LABEL: Record<GenderIdentity, string> = {
  cisgender_woman:  'Mulher cisgênero',
  trans_woman:      'Mulher trans',
  non_binary:       'Não-binário',
  gender_fluid:     'Gênero fluido',
  prefer_not_to_say: 'Prefiro não informar',
  other:            'Outro',
}

const STANDARD_CONDITIONS = [
  'SOP (Síndrome dos Ovários Policísticos)',
  'Endometriose',
  'TRH (Terapia de Reposição Hormonal)',
  'Menopausa',
  'Perimenopausa',
  'Hipotireoidismo',
  'Hipertireoidismo',
  'Diabetes tipo 1',
  'Diabetes tipo 2',
  'PCOS',
  'Síndrome de Turner',
]

// ============================================================
// Tela de Perfil de Saúde
// ============================================================

export default function HealthProfile() {
  const {
    profile,
    isLoading,
    isSaving,
    isUploadingAvatar,
    saveProfile,
    uploadAvatar,
  } = usePatientProfile()

  // ── Estado do formulário ─────────────────────────────────
  const [preferredName,         setPreferredName]         = useState('')
  const [genderIdentity,        setGenderIdentity]        = useState<GenderIdentity | null>(null)
  const [genderIdentityCustom,  setGenderIdentityCustom]  = useState('')
  const [selectedConditions,    setSelectedConditions]    = useState<string[]>([])
  const [showOtherCondition,    setShowOtherCondition]    = useState(false)
  const [otherConditionText,    setOtherConditionText]    = useState('')
  const [currentMedications,    setCurrentMedications]    = useState('')
  const [allergiesText,         setAllergiesText]         = useState('')
  const [avatarUri,             setAvatarUri]             = useState<string | null>(null)
  const [showGenderPicker,      setShowGenderPicker]      = useState(false)
  const [saveSuccess,           setSaveSuccess]           = useState(false)

  // ── Popula formulário quando o perfil carrega ────────────
  useEffect(() => {
    if (!profile) return

    setPreferredName(profile.preferred_name ?? '')
    setGenderIdentity(profile.gender_identity)
    setGenderIdentityCustom(profile.gender_identity_custom ?? '')
    setAvatarUri(profile.avatar_url ?? null)
    setCurrentMedications(profile.current_medications ?? '')
    setAllergiesText(profile.allergies ?? '')

    // Separa condições padrão de condição customizada
    const standard = profile.health_conditions.filter((c) =>
      STANDARD_CONDITIONS.includes(c)
    )
    const custom = profile.health_conditions.filter(
      (c) => !STANDARD_CONDITIONS.includes(c)
    )
    setSelectedConditions(standard)
    if (custom.length > 0) {
      setShowOtherCondition(true)
      setOtherConditionText(custom.join(', '))
    }
  }, [profile])

  // ── Toggle de chip de condição ───────────────────────────
  const toggleCondition = useCallback((condition: string) => {
    setSelectedConditions((prev) =>
      prev.includes(condition)
        ? prev.filter((c) => c !== condition)
        : [...prev, condition]
    )
  }, [])

  const toggleOtherCondition = useCallback(() => {
    setShowOtherCondition((prev) => {
      if (prev) setOtherConditionText('')
      return !prev
    })
  }, [])

  // ── Monta array final de condições ───────────────────────
  const buildHealthConditions = () => {
    const conditions = [...selectedConditions]
    if (showOtherCondition && otherConditionText.trim()) {
      conditions.push(otherConditionText.trim())
    }
    return conditions
  }

  // ── Upload de avatar ─────────────────────────────────────
  const handlePickImage = () => {
    Alert.alert(
      'Foto de perfil',
      'Escolha como deseja alterar sua foto',
      [
        {
          text: 'Câmera',
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync()
            if (status !== 'granted') {
              Alert.alert(
                'Permissão necessária',
                'Precisamos de acesso à câmera para tirar uma foto.'
              )
              return
            }
            const result = await ImagePicker.launchCameraAsync({
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            })
            if (!result.canceled && result.assets[0]) {
              await handleUploadAvatar(result.assets[0].uri)
            }
          },
        },
        {
          text: 'Galeria',
          onPress: async () => {
            const { status } =
              await ImagePicker.requestMediaLibraryPermissionsAsync()
            if (status !== 'granted') {
              Alert.alert(
                'Permissão necessária',
                'Precisamos de acesso à galeria para escolher uma foto.'
              )
              return
            }
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: 'images',
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            })
            if (!result.canceled && result.assets[0]) {
              await handleUploadAvatar(result.assets[0].uri)
            }
          },
        },
        { text: 'Cancelar', style: 'cancel' },
      ]
    )
  }

  const handleUploadAvatar = async (uri: string) => {
    try {
      const url = await uploadAvatar(uri)
      if (url) setAvatarUri(url)
    } catch (err) {
      Alert.alert(
        'Erro no upload',
        err instanceof Error
          ? err.message
          : 'Não foi possível enviar a foto. Tente novamente.'
      )
    }
  }

  // ── Salvar perfil ────────────────────────────────────────
  const handleSave = async () => {
    try {
      await saveProfile({
        preferred_name:         preferredName.trim() || null,
        gender_identity:        genderIdentity,
        gender_identity_custom:
          genderIdentity === 'other'
            ? genderIdentityCustom.trim() || null
            : null,
        health_conditions: buildHealthConditions(),
        current_medications:    currentMedications.trim() || null,
        allergies:              allergiesText.trim() || null,
      })
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2500)
    } catch (err) {
      Alert.alert(
        'Erro ao salvar',
        err instanceof Error
          ? err.message
          : 'Não foi possível salvar o perfil. Tente novamente.'
      )
    }
  }

  // ── Iniciais para o placeholder do avatar ────────────────
  const getInitials = () => {
    const name = preferredName.trim() || profile?.preferred_name || ''
    if (!name) return '?'
    return name
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('')
  }

  // ────────────────────────────────────────────────────────
  // Render
  // ────────────────────────────────────────────────────────

  return (
    <SafeAreaView className="flex-1 bg-[#FDFDFD]">
      {/* ── Modal do seletor de gênero ─────────────────────── */}
      <Modal
        visible={showGenderPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGenderPicker(false)}
      >
        <Pressable
          className="flex-1 bg-black/40 justify-end"
          onPress={() => setShowGenderPicker(false)}
        >
          <Pressable
            className="bg-white rounded-t-3xl px-6 pt-4 pb-10"
            onPress={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <View className="w-10 h-1 rounded-full bg-gray-200 self-center mb-6" />

            <Text
              className="text-lg text-gray-900 mb-5"
              style={{ fontFamily: 'RedditSans-Bold' }}
            >
              Identidade de gênero
            </Text>

            {GENDER_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                className="flex-row items-center justify-between py-3.5 border-b border-gray-50"
                onPress={() => {
                  setGenderIdentity(opt.value)
                  setShowGenderPicker(false)
                }}
                activeOpacity={0.7}
              >
                <Text
                  className="text-base text-gray-800"
                  style={{
                    fontFamily:
                      genderIdentity === opt.value
                        ? 'RedditSans-SemiBold'
                        : 'RedditSans-Regular',
                    color: genderIdentity === opt.value ? '#7C3AED' : '#1F2937',
                  }}
                >
                  {opt.label}
                </Text>
                {genderIdentity === opt.value && (
                  <IconCheck size={18} color="#7C3AED" />
                )}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              className="mt-4 py-4 items-center"
              onPress={() => setShowGenderPicker(false)}
              activeOpacity={0.7}
            >
              <Text
                className="text-base text-gray-500"
                style={{ fontFamily: 'RedditSans-Medium' }}
              >
                Cancelar
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Conteúdo principal ────────────────────────────── */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Header ──────────────────────────────────────── */}
        <View className="flex-row items-center gap-3 px-6 pt-4 pb-2">
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
            className="p-1 -ml-1"
          >
            <IconArrowLeft size={24} color="#252B37" />
          </TouchableOpacity>
          <Text
            className="text-2xl text-gray-900 flex-1"
            style={{ fontFamily: 'RedditSans-Bold' }}
          >
            Perfil de saúde
          </Text>
        </View>

        {/* ── Avatar ──────────────────────────────────────── */}
        <View className="items-center py-6">
          <TouchableOpacity
            onPress={handlePickImage}
            activeOpacity={0.8}
            disabled={isUploadingAvatar}
            className="relative"
          >
            {/* Círculo principal */}
            <View className="w-24 h-24 rounded-full bg-violet-100 items-center justify-center overflow-hidden">
              {isUploadingAvatar ? (
                <ActivityIndicator size="large" color="#7C3AED" />
              ) : avatarUri ? (
                <Image
                  source={{ uri: avatarUri }}
                  className="w-24 h-24 rounded-full"
                  resizeMode="cover"
                />
              ) : (
                <Text
                  className="text-3xl text-violet-600"
                  style={{ fontFamily: 'RedditSans-Bold' }}
                >
                  {getInitials()}
                </Text>
              )}
            </View>

            {/* Botão câmera */}
            {!isUploadingAvatar && (
              <View className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-violet-600 items-center justify-center border-2 border-white">
                <IconCamera size={14} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>

          <Text
            className="text-xs text-gray-400 mt-3"
            style={{ fontFamily: 'RedditSans-Regular' }}
          >
            JPEG, PNG ou WebP · máx. 2 MB
          </Text>
        </View>

        {isLoading ? (
          <View className="flex-1 items-center justify-center py-12">
            <ActivityIndicator size="large" color="#7C3AED" />
          </View>
        ) : (
          <View className="px-6 gap-5">
            {/* ── Seção 1: Identidade ──────────────────────── */}
            <View className="rounded-2xl border border-gray-100 bg-white p-5 gap-5">
              <Text
                className="text-xs text-gray-400 uppercase tracking-widest"
                style={{ fontFamily: 'RedditSans-SemiBold' }}
              >
                Identidade
              </Text>

              {/* Nome preferido */}
              <View className="gap-1.5">
                <Text
                  className="text-sm text-gray-700"
                  style={{ fontFamily: 'RedditSans-Medium' }}
                >
                  Como prefere ser chamada?
                </Text>
                <TextInput
                  value={preferredName}
                  onChangeText={setPreferredName}
                  placeholder="Seu nome ou apelido"
                  placeholderTextColor="#A1A7AE"
                  className="border border-gray-200 rounded-xl px-4 py-3 text-gray-900 bg-white"
                  style={{ fontFamily: 'RedditSans-Regular', fontSize: 15 }}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              </View>

              {/* Identidade de gênero */}
              <View className="gap-1.5">
                <Text
                  className="text-sm text-gray-700"
                  style={{ fontFamily: 'RedditSans-Medium' }}
                >
                  Identidade de gênero
                </Text>

                <TouchableOpacity
                  className="border border-gray-200 rounded-xl px-4 py-3 flex-row items-center justify-between bg-white"
                  onPress={() => setShowGenderPicker(true)}
                  activeOpacity={0.7}
                >
                  <Text
                    className={genderIdentity ? 'text-gray-900' : 'text-gray-400'}
                    style={{ fontFamily: 'RedditSans-Regular', fontSize: 15 }}
                  >
                    {genderIdentity
                      ? GENDER_LABEL[genderIdentity]
                      : 'Selecione uma opção'}
                  </Text>
                  <IconChevronDown size={18} color="#A1A7AE" />
                </TouchableOpacity>

                {/* Campo livre para "Outro" */}
                {genderIdentity === 'other' && (
                  <TextInput
                    value={genderIdentityCustom}
                    onChangeText={setGenderIdentityCustom}
                    placeholder="Como você se identifica?"
                    placeholderTextColor="#A1A7AE"
                    className="border border-violet-200 rounded-xl px-4 py-3 text-gray-900 bg-violet-50"
                    style={{ fontFamily: 'RedditSans-Regular', fontSize: 15 }}
                    autoCapitalize="sentences"
                    returnKeyType="done"
                  />
                )}
              </View>
            </View>

            {/* ── Seção 2: Saúde hormonal ──────────────────── */}
            <View className="rounded-2xl border border-gray-100 bg-white p-5 gap-5">
              <Text
                className="text-xs text-gray-400 uppercase tracking-widest"
                style={{ fontFamily: 'RedditSans-SemiBold' }}
              >
                Saúde hormonal · opcional
              </Text>

              {/* Condições de saúde — chips */}
              <View className="gap-2">
                <Text
                  className="text-sm text-gray-700"
                  style={{ fontFamily: 'RedditSans-Medium' }}
                >
                  Condições relevantes
                </Text>

                {/* Chips em flex-wrap */}
                <View className="flex-row flex-wrap gap-2">
                  {STANDARD_CONDITIONS.map((condition) => {
                    const active = selectedConditions.includes(condition)
                    return (
                      <TouchableOpacity
                        key={condition}
                        onPress={() => toggleCondition(condition)}
                        activeOpacity={0.75}
                        className={`px-3 py-1.5 rounded-full border ${
                          active
                            ? 'bg-violet-100 border-violet-300'
                            : 'bg-white border-gray-200'
                        }`}
                      >
                        <Text
                          className={`text-xs ${
                            active ? 'text-violet-700' : 'text-gray-600'
                          }`}
                          style={{
                            fontFamily: active
                              ? 'RedditSans-SemiBold'
                              : 'RedditSans-Regular',
                          }}
                        >
                          {condition}
                        </Text>
                      </TouchableOpacity>
                    )
                  })}

                  {/* Chip "Outras" especial */}
                  <TouchableOpacity
                    onPress={toggleOtherCondition}
                    activeOpacity={0.75}
                    className={`px-3 py-1.5 rounded-full border flex-row items-center gap-1 ${
                      showOtherCondition
                        ? 'bg-violet-100 border-violet-300'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    {showOtherCondition ? (
                      <IconX size={12} color="#7C3AED" />
                    ) : null}
                    <Text
                      className={`text-xs ${
                        showOtherCondition ? 'text-violet-700' : 'text-gray-600'
                      }`}
                      style={{
                        fontFamily: showOtherCondition
                          ? 'RedditSans-SemiBold'
                          : 'RedditSans-Regular',
                      }}
                    >
                      Outras
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Campo livre para "Outras" */}
                {showOtherCondition && (
                  <TextInput
                    value={otherConditionText}
                    onChangeText={setOtherConditionText}
                    placeholder="Descreva outras condições relevantes..."
                    placeholderTextColor="#A1A7AE"
                    className="border border-violet-200 rounded-xl px-4 py-3 text-gray-900 bg-violet-50 mt-1"
                    style={{ fontFamily: 'RedditSans-Regular', fontSize: 14 }}
                    multiline
                    numberOfLines={2}
                    autoCapitalize="sentences"
                    textAlignVertical="top"
                  />
                )}
              </View>

              {/* Medicamentos */}
              <View className="gap-1.5">
                <Text
                  className="text-sm text-gray-700"
                  style={{ fontFamily: 'RedditSans-Medium' }}
                >
                  Medicamentos em uso
                </Text>
                <TextInput
                  value={currentMedications}
                  onChangeText={setCurrentMedications}
                  placeholder="Ex: Metformina 500mg, Levotiroxina..."
                  placeholderTextColor="#A1A7AE"
                  className="border border-gray-200 rounded-xl px-4 py-3 text-gray-900 bg-white"
                  style={{ fontFamily: 'RedditSans-Regular', fontSize: 14 }}
                  multiline
                  numberOfLines={3}
                  autoCapitalize="sentences"
                  textAlignVertical="top"
                />
              </View>

              {/* Alergias */}
              <View className="gap-1.5">
                <Text
                  className="text-sm text-gray-700"
                  style={{ fontFamily: 'RedditSans-Medium' }}
                >
                  Alergias
                </Text>
                <TextInput
                  value={allergiesText}
                  onChangeText={setAllergiesText}
                  placeholder="Ex: Penicilina, Dipirona..."
                  placeholderTextColor="#A1A7AE"
                  className="border border-gray-200 rounded-xl px-4 py-3 text-gray-900 bg-white"
                  style={{ fontFamily: 'RedditSans-Regular', fontSize: 14 }}
                  multiline
                  numberOfLines={2}
                  autoCapitalize="sentences"
                  textAlignVertical="top"
                />
              </View>

              {/* Banner LGPD */}
              <View className="flex-row items-start gap-3 bg-violet-50 border border-violet-100 rounded-xl p-4">
                <IconShieldLock size={18} color="#7C3AED" style={{ marginTop: 1 }} />
                <Text
                  className="text-xs text-violet-700 leading-5 flex-1"
                  style={{ fontFamily: 'RedditSans-Regular' }}
                >
                  Seus dados de saúde são protegidos pela{' '}
                  <Text style={{ fontFamily: 'RedditSans-SemiBold' }}>LGPD</Text>{' '}
                  e acessíveis apenas por você e pelos profissionais que já te
                  atenderam.
                </Text>
              </View>
            </View>

            {/* ── Botão salvar ────────────────────────────── */}
            <TouchableOpacity
              onPress={handleSave}
              disabled={isSaving || isUploadingAvatar}
              activeOpacity={0.85}
              className={`rounded-full py-4 items-center flex-row justify-center gap-2 ${
                saveSuccess ? 'bg-green-600' : 'bg-violet-600'
              } ${isSaving ? 'opacity-70' : ''}`}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : saveSuccess ? (
                <>
                  <IconCheck size={18} color="#FFFFFF" />
                  <Text
                    className="text-base text-white"
                    style={{ fontFamily: 'RedditSans-SemiBold' }}
                  >
                    Perfil salvo!
                  </Text>
                </>
              ) : (
                <Text
                  className="text-base text-white"
                  style={{ fontFamily: 'RedditSans-SemiBold' }}
                >
                  Salvar perfil
                </Text>
              )}
            </TouchableOpacity>

            <Text
              className="text-xs text-gray-400 text-center -mt-2"
              style={{ fontFamily: 'RedditSans-Regular' }}
            >
              Todos os campos são opcionais
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
