/**
 * userService — Fase 2.1
 *
 * Consume la API real del backend (GET /api/users).
 * Si el servidor no está disponible, cae en modo mock para no romper demo mode.
 */

import { getMockStore } from "./_mockStore";
import type { AppUser } from "@/types/inventory";

const API_BASE = "http://localhost:4000/api";

interface ApiUser {
  id: number;
  codigoUsuario: string;
  username: string;
  nombre: string;
  apellido?: string | null;
  email?: string | null;
  estado: string;
  ultimoLoginEn?: string | null;
  creadoEn: string;
  roles: Array<{ id: number; slug: string; nombre: string }>;
}

function slugToAppRole(slug: string): AppUser["role"] {
  if (slug === "administrador") return "Administrador";
  if (slug === "operador")      return "Operador";
  return "Auditor";
}

function mapApiUser(u: ApiUser): AppUser {
  const firstRole = u.roles[0];
  return {
    id:           String(u.id),
    name:         `${u.nombre}${u.apellido ? " " + u.apellido : ""}`,
    email:        u.email ?? u.username,
    role:         firstRole ? slugToAppRole(firstRole.slug) : "Auditor",
    status:       u.estado === "activo" ? "active" : u.estado === "pendiente" ? "pending" : "inactive",
    lastAccessAt: u.ultimoLoginEn ?? u.creadoEn,
  };
}

export async function getAppUsers(): Promise<AppUser[]> {
  try {
    const res = await fetch(`${API_BASE}/users`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: ApiUser[] = await res.json();
    return data.map(mapApiUser);
  } catch {
    // Backend no disponible → fallback a mock (demo mode)
    return getMockStore().getAppUsers();
  }
}

export async function createUser(payload: {
  codigoUsuario: string;
  username: string;
  nombre: string;
  apellido?: string;
  email?: string;
  password: string;
  estado?: string;
  roleSlugs: string[];
}): Promise<AppUser> {
  const res = await fetch(`${API_BASE}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? `HTTP ${res.status}`);
  }
  return mapApiUser(await res.json());
}

export async function updateUser(id: number, payload: {
  nombre?: string;
  apellido?: string;
  email?: string;
  password?: string;
  estado?: string;
  roleSlugs?: string[];
}): Promise<AppUser> {
  const res = await fetch(`${API_BASE}/users/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? `HTTP ${res.status}`);
  }
  return mapApiUser(await res.json());
}

export async function deactivateUser(id: number): Promise<AppUser> {
  const res = await fetch(`${API_BASE}/users/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? `HTTP ${res.status}`);
  }
  return mapApiUser(await res.json());
}

export async function loginUser(username: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? "Error de autenticación");
  }
  return res.json() as Promise<{
    usuario: { id: number; username: string; nombre: string; apellido?: string | null };
    roles: Array<{ slug: string; nombre: string }>;
    permisos: Array<{ clavePermiso: string; modulo: string; accion: string }>;
  }>;
}
