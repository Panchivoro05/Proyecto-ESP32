import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const TOKEN_KEY = 'controlled_auth_token';

export type Rol = 'admin' | 'usuario';

export type LoginResult = {
  mensaje: string;
  usuario: string;
  rol: Rol;
  token: string;
};

export type PerfilResult = {
  usuario: string;
  rol: Rol;
  mensaje: string;
};

export type UsuariosResult = {
  usuarios: string[];
};

export class ApiError extends Error {
  status: number;

  constructor(status: number, mensaje: string) {
    super(mensaje);
    this.status = status;
  }
}

async function apiFetch(path: string, options: RequestInit = {}) {
  if (!API_URL) {
    throw new Error('Falta configurar EXPO_PUBLIC_API_URL');
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, options);
  } catch {
    throw new Error('No se pudo conectar con el servidor');
  }

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(response.status, body.mensaje ?? 'Error inesperado');
  }

  return body;
}

export async function login(usuario: string, password: string): Promise<LoginResult> {
  return apiFetch('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario, password }),
  });
}

export async function getPerfil(token: string): Promise<PerfilResult> {
  return apiFetch('/perfil', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getUsuarios(token: string): Promise<UsuariosResult> {
  return apiFetch('/usuarios', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function guardarToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.setItem(TOKEN_KEY, token);
    return;
  }
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function leerToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return localStorage.getItem(TOKEN_KEY);
  }
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function borrarToken(): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.removeItem(TOKEN_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}
