import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { Pressable, StyleSheet, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { LoginScreen } from '@/components/login-screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/hooks/use-auth';

SplashScreen.preventAutoHideAsync();

function CerrarSesionFlotante() {
  const { logout } = useAuth();
  const insets = useSafeAreaInsets();

  return (
    <Pressable
      onPress={logout}
      style={[styles.logoutFab, { top: insets.top + Spacing.two, right: insets.right + Spacing.three }]}>
      <ThemedText style={styles.logoutFabText}>Cerrar sesión</ThemedText>
    </Pressable>
  );
}

function RootContent() {
  const { sesion, cargando } = useAuth();

  if (cargando) {
    return <ThemedView style={{ flex: 1 }} />;
  }

  if (!sesion) {
    return <LoginScreen />;
  }

  return (
    <View style={{ flex: 1 }}>
      <AppTabs />
      <CerrarSesionFlotante />
    </View>
  );
}

const styles = StyleSheet.create({
  logoutFab: {
    position: 'absolute',
    backgroundColor: '#d9534f',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.five,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  logoutFabText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <AuthProvider>
        <RootContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
