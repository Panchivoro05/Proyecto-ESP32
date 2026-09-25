import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { ApiError } from '@/services/auth';

export function LoginScreen() {
  const { login } = useAuth();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enviar = async () => {
    if (!usuario.trim() || !password) {
      setError('Ingrese usuario y contraseña');
      return;
    }
    setError(null);
    setCargando(true);
    try {
      const resultado = await login(usuario.trim(), password);
      console.log('Inicio de sesión exitoso');
      console.log('Usuario:', resultado.usuario);
      console.log('Rol:', resultado.rol);
      console.log('JWT generado correctamente:', resultado.token);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('No se pudo conectar con el servidor');
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top + Spacing.six }]}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          ControlLED
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Iniciá sesión para continuar
        </ThemedText>
      </View>

      <View style={styles.form}>
        <TextInput
          style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
          placeholder="Usuario"
          placeholderTextColor={theme.textSecondary}
          autoCapitalize="none"
          autoCorrect={false}
          value={usuario}
          onChangeText={setUsuario}
          editable={!cargando}
        />
        <TextInput
          style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
          placeholder="Contraseña"
          placeholderTextColor={theme.textSecondary}
          autoCapitalize="none"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          editable={!cargando}
        />

        {error && (
          <ThemedText type="small" style={styles.error}>
            {error}
          </ThemedText>
        )}

        <Pressable
          style={[styles.button, cargando && styles.buttonDisabled]}
          onPress={enviar}
          disabled={cargando}>
          {cargando ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <ThemedText style={styles.buttonText}>Ingresar</ThemedText>
          )}
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.six,
  },
  title: {
    fontSize: 32,
    lineHeight: 38,
  },
  form: {
    width: '100%',
    maxWidth: 320,
    gap: Spacing.three,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 16,
  },
  error: {
    color: '#d9534f',
  },
  button: {
    backgroundColor: '#3c87f7',
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
