import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import 'react-native-reanimated'
import { AppProviders } from '@/components/app-providers'
import { colors } from '@/constants/theme'

export default function RootLayout() {
  return (
    <AppProviders>
      <Stack
        screenOptions={{
          // Semi-transparent glass header on dark mesh
          headerStyle: { backgroundColor: 'rgba(8,8,13,0.96)' },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: '700',
            color: colors.text,
            fontSize: 16,
          },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen
          name="create"
          options={{ headerShown: false }}
        />
        <Stack.Screen name="join" options={{ headerShown: false }} />
        <Stack.Screen
          name="game/[id]"
          options={{ headerShown: false, gestureEnabled: false }}
        />
        <Stack.Screen name="result/[id]" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="light" />
    </AppProviders>
  )
}
