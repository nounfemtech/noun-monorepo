import { Tabs } from 'expo-router'
import { Platform } from 'react-native'

// SVG tab icons (copiados do noun-app)
import HomeIconFocused from '../../../../assets/tab_bar/solar_home-smile-bold-duotone.svg'
import HomeIconUnfocused from '../../../../assets/tab_bar/solar_home-smile-line-duotone.svg'
import HealthIconFocused from '../../../../assets/tab_bar/solar_heart-pulse-bold-duotone.svg'
import HealthIconUnfocused from '../../../../assets/tab_bar/solar_heart-pulse-line-duotone.svg'
import ProfileIconFocused from '../../../../assets/tab_bar/solar_user-rounded-bold-duotone.svg'
import ProfileIconUnfocused from '../../../../assets/tab_bar/solar_user-rounded-line-duotone.svg'

// ============================================================
// App Layout — Bottom Tabs protegido
// FASE 2: verificar sessão e redirecionar para (auth) se não autenticado
// ============================================================

const ACTIVE_COLOR = '#252B37'
const INACTIVE_COLOR = '#717880'

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ACTIVE_COLOR,
        tabBarInactiveTintColor: INACTIVE_COLOR,
        tabBarStyle: {
          backgroundColor: '#FDFDFD',
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 85 : 65,
          paddingBottom: Platform.OS === 'ios' ? 24 : 12,
          paddingTop: 12,
          paddingHorizontal: 48,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -1 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: 'RedditSans-Regular',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ focused, color }) => {
            const Icon = focused ? HomeIconFocused : HomeIconUnfocused
            return <Icon width={24} height={24} color={color} />
          },
        }}
      />
      <Tabs.Screen
        name="health"
        options={{
          title: 'Minha Saúde',
          tabBarIcon: ({ focused, color }) => {
            const Icon = focused ? HealthIconFocused : HealthIconUnfocused
            return <Icon width={24} height={24} color={color} />
          },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ focused, color }) => {
            const Icon = focused ? ProfileIconFocused : ProfileIconUnfocused
            return <Icon width={24} height={24} color={color} />
          },
        }}
      />
    </Tabs>
  )
}
