import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { IconArrowLeft, IconUser, IconId, IconCalendar } from '@tabler/icons-react-native'

// ============================================================
// Passo 4/5 — Dados pessoais: nome civil, CPF, data de nascimento
// FASE 2: validar CPF com dígitos verificadores + DatePicker nativo
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

/** Mascara CPF: 000.000.000-00 */
function maskCPF(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

/** Máscara data: DD/MM/AAAA */
function maskDate(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

function FieldInput({
  label, icon, value, onChangeText, placeholder, keyboardType = 'default', error,
}: {
  label: string
  icon: React.ReactNode
  value: string
  onChangeText: (v: string) => void
  placeholder: string
  keyboardType?: 'default' | 'number-pad'
  error?: string
}) {
  return (
    <View className="gap-1.5 mb-4">
      <Text className="text-sm text-gray-700" style={{ fontFamily: 'RedditSans-Medium' }}>{label}</Text>
      <View className={`flex-row items-center border rounded-xl px-4 gap-3 bg-white ${error ? 'border-red-400' : 'border-gray-200'}`} style={{ height: 52 }}>
        {icon}
        <TextInput
          className="flex-1 text-base text-gray-900"
          style={{ fontFamily: 'RedditSans-Regular' }}
          placeholder={placeholder}
          placeholderTextColor="#A1A7AE"
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
        />
      </View>
      {error ? <Text className="text-xs text-red-500" style={{ fontFamily: 'RedditSans-Regular' }}>{error}</Text> : null}
    </View>
  )
}

export default function PersonalInfo() {
  const [fullName, setFullName] = useState('')
  const [cpf, setCpf] = useState('')
  const [birthDate, setBirthDate] = useState('')

  const isValid = fullName.trim().split(' ').length >= 2
    && cpf.replace(/\D/g, '').length === 11
    && birthDate.replace(/\D/g, '').length === 8

  const handleContinue = async () => {
    if (!isValid) return
    router.push({
      pathname: '/(auth)/additional-info',
      params: { fullName, cpf: cpf.replace(/\D/g, ''), birthDate },
    })
  }

  return (
    <SafeAreaView className="flex-1 bg-[#FDFDFD]">
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView className="flex-1 px-6 pt-4" keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => router.back()} className="mb-6 self-start p-1">
            <IconArrowLeft size={24} color="#252B37" />
          </TouchableOpacity>

          <ProgressBar step={4} total={5} />

          <Text className="text-2xl text-gray-900 mb-2" style={{ fontFamily: 'RedditSans-Bold' }}>
            Seus dados pessoais
          </Text>
          <Text className="text-base text-gray-500 mb-8" style={{ fontFamily: 'RedditSans-Regular' }}>
            Essas informações ficam protegidas e são usadas para emissões de prescrições.
          </Text>

          <FieldInput
            label="Nome civil completo"
            icon={<IconUser size={18} color="#A1A7AE" />}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Ex.: Ana Paula Souza"
          />
          <FieldInput
            label="CPF"
            icon={<IconId size={18} color="#A1A7AE" />}
            value={cpf}
            onChangeText={(v) => setCpf(maskCPF(v))}
            placeholder="000.000.000-00"
            keyboardType="number-pad"
          />
          <FieldInput
            label="Data de nascimento"
            icon={<IconCalendar size={18} color="#A1A7AE" />}
            value={birthDate}
            onChangeText={(v) => setBirthDate(maskDate(v))}
            placeholder="DD/MM/AAAA"
            keyboardType="number-pad"
          />

          <TouchableOpacity
            className={`rounded-full py-4 items-center mt-4 mb-8 ${isValid ? 'bg-violet-600' : 'bg-gray-200'}`}
            onPress={handleContinue}
            disabled={!isValid}
            activeOpacity={0.8}
          >
            <Text className={`text-base ${isValid ? 'text-white' : 'text-gray-400'}`} style={{ fontFamily: 'RedditSans-SemiBold' }}>
              Continuar
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
