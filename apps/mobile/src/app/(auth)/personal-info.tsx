import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { IconArrowLeft, IconUser, IconId, IconCalendar } from '@tabler/icons-react-native'
import { useAuth } from '@/providers/auth-provider'
import { validateCPF, validateBirthDate } from '@/lib/validations'

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <View className="flex-row gap-1.5 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} className={`h-1 flex-1 rounded-full ${i < step ? 'bg-violet-600' : 'bg-gray-200'}`} />
      ))}
    </View>
  )
}

function maskCPF(raw: string) {
  const d = raw.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}

function maskDate(raw: string) {
  const d = raw.replace(/\D/g, '').slice(0, 8)
  if (d.length <= 2) return d
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`
}

interface FieldProps {
  label: string; icon: React.ReactNode; value: string
  onChangeText: (v: string) => void; placeholder: string
  keyboardType?: 'default' | 'number-pad'; error?: string
}

function Field({ label, icon, value, onChangeText, placeholder, keyboardType = 'default', error }: FieldProps) {
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
  const { user } = useAuth()
  const [fullName,   setFullName]   = useState('')
  const [cpf,        setCpf]        = useState('')
  const [birthDate,  setBirthDate]  = useState('')
  const [errors,     setErrors]     = useState<Record<string, string>>({})
  const [loading,    setLoading]    = useState(false)

  const validate = () => {
    const errs: Record<string, string> = {}
    if (fullName.trim().split(/\s+/).length < 2) errs.fullName = 'Informe nome e sobrenome'
    const cpfErr = validateCPF(cpf)
    if (cpfErr) errs.cpf = cpfErr
    const dateErr = validateBirthDate(birthDate)
    if (dateErr) errs.birthDate = dateErr
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const isFormFilled = fullName.trim().split(/\s+/).length >= 2
    && cpf.replace(/\D/g, '').length === 11
    && birthDate.replace(/\D/g, '').length === 8

  const handleContinue = async () => {
    if (!validate()) return
    router.push({
      pathname: '/(auth)/additional-info',
      params: { fullName: fullName.trim(), cpf: cpf.replace(/\D/g, ''), birthDate },
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

          <Text className="text-2xl text-gray-900 mb-2" style={{ fontFamily: 'RedditSans-Bold' }}>Seus dados pessoais</Text>
          <Text className="text-base text-gray-500 mb-8" style={{ fontFamily: 'RedditSans-Regular' }}>
            Protegidos e usados para emissão de prescrições.
          </Text>

          <Field
            label="Nome civil completo"
            icon={<IconUser size={18} color="#A1A7AE" />}
            value={fullName}
            onChangeText={(v) => { setFullName(v); setErrors((e) => ({ ...e, fullName: '' })) }}
            placeholder="Ex.: Ana Paula Souza"
            error={errors.fullName}
          />
          <Field
            label="CPF"
            icon={<IconId size={18} color="#A1A7AE" />}
            value={cpf}
            onChangeText={(v) => { setCpf(maskCPF(v)); setErrors((e) => ({ ...e, cpf: '' })) }}
            placeholder="000.000.000-00"
            keyboardType="number-pad"
            error={errors.cpf}
          />
          <Field
            label="Data de nascimento"
            icon={<IconCalendar size={18} color="#A1A7AE" />}
            value={birthDate}
            onChangeText={(v) => { setBirthDate(maskDate(v)); setErrors((e) => ({ ...e, birthDate: '' })) }}
            placeholder="DD/MM/AAAA"
            keyboardType="number-pad"
            error={errors.birthDate}
          />

          <TouchableOpacity
            className={`rounded-full py-4 items-center mt-2 mb-8 ${isFormFilled ? 'bg-violet-600' : 'bg-gray-200'}`}
            onPress={handleContinue}
            disabled={!isFormFilled || loading}
            activeOpacity={0.8}
          >
            <Text className={`text-base ${isFormFilled ? 'text-white' : 'text-gray-400'}`} style={{ fontFamily: 'RedditSans-SemiBold' }}>
              {loading ? 'Salvando...' : 'Continuar'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
