import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';

export default function PerfilScreen() {
  const { sesion, logout, obtenerUsuarios } = useAuth();
  const insets = useSafeAreaInsets();

  const [usuarios, setUsuarios] = useState<string[] | null>(null);
  const [errorUsuarios, setErrorUsuarios] = useState<string | null>(null);

  useEffect(() => {
    if (sesion?.rol !== 'admin') {
      return;
    }
    obtenerUsuarios()
      .then((resultado) => setUsuarios(resultado.usuarios))
      .catch(() => setErrorUsuarios('No se pudo cargar la lista de usuarios'));
  }, [sesion?.rol, obtenerUsuarios]);

  if (!sesion) {
    return null;
  }

  return (
    <ThemedView
      style={[
        styles.container,
        { paddingTop: insets.top + Spacing.six, paddingBottom: insets.bottom + BottomTabInset },
      ]}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          Perfil
        </ThemedText>
      </View>

      <ThemedView type="backgroundElement" style={styles.card}>
        <ThemedText type="small" themeColor="textSecondary">
          Usuario
        </ThemedText>
        <ThemedText type="subtitle" style={styles.value}>
          {sesion.usuario}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.rolLabel}>
          Rol
        </ThemedText>
        <ThemedText type="default">{sesion.rol}</ThemedText>
      </ThemedView>

      {sesion.rol === 'admin' && (
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText type="small" themeColor="textSecondary">
            Usuarios registrados
          </ThemedText>
          {errorUsuarios && (
            <ThemedText type="small" style={styles.error}>
              {errorUsuarios}
            </ThemedText>
          )}
          {usuarios?.map((nombre) => (
            <ThemedText key={nombre} type="default">
              • {nombre}
            </ThemedText>
          ))}
        </ThemedView>
      )}

      <Pressable style={styles.logoutButton} onPress={logout}>
        <ThemedText style={styles.logoutText}>Cerrar sesión</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
  },
  header: {
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    lineHeight: 38,
  },
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.four,
    gap: Spacing.one,
  },
  value: {
    marginBottom: Spacing.two,
  },
  rolLabel: {
    marginTop: Spacing.two,
  },
  error: {
    color: '#d9534f',
  },
  logoutButton: {
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    backgroundColor: '#d9534f',
    marginTop: 'auto',
  },
  logoutText: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
