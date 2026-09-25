import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import {
  ApiError,
  borrarToken,
  getPerfil,
  getUsuarios,
  leerToken,
  guardarToken,
  login as loginRequest,
  type LoginResult,
  type Rol,
  type UsuariosResult,
} from '@/services/auth';

type Sesion = {
  token: string;
  usuario: string;
  rol: Rol;
};

type AuthContextValue = {
  sesion: Sesion | null;
  cargando: boolean;
  login: (usuario: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  obtenerUsuarios: () => Promise<UsuariosResult>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [cargando, setCargando] = useState(true);

  const cerrarSesion = useCallback(async () => {
    await borrarToken();
    setSesion(null);
  }, []);

  useEffect(() => {
    (async () => {
      const token = await leerToken();
      if (!token) {
        setCargando(false);
        return;
      }
      try {
        const perfil = await getPerfil(token);
        setSesion({ token, usuario: perfil.usuario, rol: perfil.rol });
      } catch {
        // Token inválido o expirado: se descarta y vuelve al login.
        await borrarToken();
      } finally {
        setCargando(false);
      }
    })();
  }, []);

  const login = useCallback(async (usuario: string, password: string) => {
    const resultado = await loginRequest(usuario, password);
    await guardarToken(resultado.token);
    setSesion({ token: resultado.token, usuario: resultado.usuario, rol: resultado.rol });
    return resultado;
  }, []);

  const obtenerUsuarios = useCallback(async () => {
    if (!sesion) {
      throw new ApiError(401, 'Token requerido');
    }
    try {
      return await getUsuarios(sesion.token);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        await cerrarSesion();
      }
      throw error;
    }
  }, [sesion, cerrarSesion]);

  const value = useMemo<AuthContextValue>(
    () => ({ sesion, cargando, login, logout: cerrarSesion, obtenerUsuarios }),
    [sesion, cargando, login, cerrarSesion, obtenerUsuarios]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}
