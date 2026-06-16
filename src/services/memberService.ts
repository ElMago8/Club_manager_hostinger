import type {
  DocumentStatus,
  DocumentType,
  Member,
  MemberDocument,
  MemberStatus,
} from "@/types/inventory";

const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

// ─── Tipos API (shape que devuelve el backend) ────────────────────────────────

interface ApiDocumento {
  id: number;
  socioId: number;
  tipoDocumento: string;
  numeroDocumento: string | null;
  fechaEmision: string | null;
  fechaVencimiento: string | null;
  estado: string;
  archivoUrl: string | null;
  nombreArchivo: string | null;
  mimeType: string | null;
  tamanioBytes: number | null;
  subidoEn: string | null;
  observaciones: string | null;
  creadoEn: string;
}

interface ApiSocio {
  id: number;
  codigoSocio: string;
  nombre: string;
  apellido: string;
  dni: string | null;
  fechaNacimiento: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  localidad: string | null;
  provincia: string | null;
  estado: string;
  cupoMensualGramos: number | null;
  observaciones: string | null;
  creadoEn: string;
  documentos?: ApiDocumento[];
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, MemberStatus> = {
  activo:     "active",
  pendiente:  "pending",
  suspendido: "suspended",
  inactivo:   "inactive",
};

const STATUS_REVERSE: Record<MemberStatus, string> = {
  active:    "activo",
  pending:   "pendiente",
  suspended: "suspendido",
  inactive:  "inactivo",
};

function latestDoc(docs: ApiDocumento[], tipo: string): ApiDocumento | undefined {
  return docs
    .filter((d) => d.tipoDocumento === tipo && d.fechaVencimiento)
    .sort((a, b) => (b.fechaVencimiento! > a.fechaVencimiento! ? 1 : -1))[0];
}

function mapApiDocumento(d: ApiDocumento): MemberDocument {
  return {
    id: String(d.id),
    socioId: String(d.socioId),
    tipoDocumento: d.tipoDocumento as DocumentType,
    numeroDocumento: d.numeroDocumento ?? undefined,
    fechaEmision: d.fechaEmision ? new Date(d.fechaEmision).toISOString().slice(0, 10) : undefined,
    fechaVencimiento: d.fechaVencimiento ? new Date(d.fechaVencimiento).toISOString().slice(0, 10) : undefined,
    estado: d.estado as DocumentStatus,
    archivoUrl: d.archivoUrl ?? undefined,
    nombreArchivo: d.nombreArchivo ?? undefined,
    mimeType: d.mimeType ?? undefined,
    tamanioBytes: d.tamanioBytes ?? undefined,
    subidoEn: d.subidoEn ?? undefined,
    observaciones: d.observaciones ?? undefined,
    creadoEn: d.creadoEn,
  };
}

function mapApiSocio(s: ApiSocio): Member {
  const docs = s.documentos ?? [];
  const reprocann = latestDoc(docs, "reprocann");
  const certMedico = latestDoc(docs, "certificado_medico");

  return {
    id: String(s.id),
    credentialCode: s.codigoSocio,
    firstName: s.nombre,
    lastName: s.apellido,
    fullName: `${s.nombre} ${s.apellido}`,
    dni: s.dni ?? undefined,
    birthDate: s.fechaNacimiento ? new Date(s.fechaNacimiento).toISOString().slice(0, 10) : undefined,
    phone: s.telefono ?? undefined,
    email: s.email ?? undefined,
    address: s.direccion ?? undefined,
    localidad: s.localidad ?? undefined,
    provincia: s.provincia ?? undefined,
    status: STATUS_MAP[s.estado] ?? "inactive",
    monthlyQuotaGrams: s.cupoMensualGramos ?? 0,
    currentMonthUsageGrams: 0,
    registrationDate: new Date(s.creadoEn).toISOString().slice(0, 10),
    reprocannExpirationDate: reprocann?.fechaVencimiento
      ? new Date(reprocann.fechaVencimiento).toISOString().slice(0, 10)
      : undefined,
    medicalDocumentExpirationDate: certMedico?.fechaVencimiento
      ? new Date(certMedico.fechaVencimiento).toISOString().slice(0, 10)
      : undefined,
    notes: s.observaciones ?? undefined,
    documents: docs.map(mapApiDocumento),
  };
}

// ─── Utilidad HTTP ────────────────────────────────────────────────────────────

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(body.message ?? `Error ${res.status} en ${path}`);
  }
  return res.json() as Promise<T>;
}

// ─── Payload types ────────────────────────────────────────────────────────────

export interface CreateMemberPayload {
  codigoSocio: string;
  nombre: string;
  apellido: string;
  dni?: string;
  fechaNacimiento?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  localidad?: string;
  provincia?: string;
  estado: MemberStatus;
  cupoMensualGramos?: number;
  observaciones?: string;
}

export type UpdateMemberPayload = Partial<CreateMemberPayload>;

export interface CreateDocumentPayload {
  tipoDocumento: DocumentType;
  numeroDocumento?: string;
  fechaEmision?: string;
  fechaVencimiento?: string;
  estado: DocumentStatus;
  observaciones?: string;
}

// ─── Servicios de socios ──────────────────────────────────────────────────────

export async function getMembers(filters: { estado?: MemberStatus; search?: string } = {}): Promise<Member[]> {
  const params = new URLSearchParams();
  if (filters.estado) params.set("estado", STATUS_REVERSE[filters.estado]);
  if (filters.search) params.set("search", filters.search);
  const qs = params.toString();
  return (await apiRequest<ApiSocio[]>(`/api/members${qs ? `?${qs}` : ""}`)).map(mapApiSocio);
}

export async function getMemberById(id: string): Promise<Member | null> {
  return mapApiSocio(await apiRequest<ApiSocio>(`/api/members/${id}`));
}

export async function createMember(payload: CreateMemberPayload): Promise<Member> {
  return mapApiSocio(
    await apiRequest<ApiSocio>("/api/members", {
      method: "POST",
      body: JSON.stringify({ ...payload, estado: STATUS_REVERSE[payload.estado] }),
    }),
  );
}

export async function updateMember(id: string, payload: UpdateMemberPayload): Promise<Member> {
  const body: Record<string, unknown> = { ...payload };
  if (payload.estado) body.estado = STATUS_REVERSE[payload.estado];
  return mapApiSocio(
    await apiRequest<ApiSocio>(`/api/members/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  );
}

export async function deactivateMember(id: string): Promise<Member> {
  return mapApiSocio(
    await apiRequest<ApiSocio>(`/api/members/${id}`, { method: "DELETE" }),
  );
}

// ─── Servicios de documentos ──────────────────────────────────────────────────

export async function getMemberDocuments(socioId: string): Promise<MemberDocument[]> {
  const docs = await apiRequest<ApiDocumento[]>(`/api/members/${socioId}/documents`);
  return docs.map(mapApiDocumento);
}

export async function createMemberDocument(
  socioId: string,
  payload: CreateDocumentPayload,
  file?: File,
): Promise<MemberDocument> {
  if (file) {
    const fd = new FormData();
    Object.entries(payload).forEach(([k, v]) => { if (v != null && v !== "") fd.append(k, String(v)); });
    fd.append("arquivo", file);
    const res = await fetch(`${BASE}/api/members/${socioId}/documents`, { method: "POST", body: fd });
    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as { message?: string };
      throw new Error(body.message ?? `Error ${res.status}`);
    }
    return mapApiDocumento(await res.json() as ApiDocumento);
  }
  return mapApiDocumento(
    await apiRequest<ApiDocumento>(`/api/members/${socioId}/documents`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  );
}

export async function updateMemberDocument(
  docId: string,
  payload: Partial<CreateDocumentPayload>,
  file?: File,
): Promise<MemberDocument> {
  if (file) {
    const fd = new FormData();
    Object.entries(payload).forEach(([k, v]) => { if (v != null && v !== "") fd.append(k, String(v)); });
    fd.append("arquivo", file);
    const res = await fetch(`${BASE}/api/member-documents/${docId}`, { method: "PATCH", body: fd });
    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as { message?: string };
      throw new Error(body.message ?? `Error ${res.status}`);
    }
    return mapApiDocumento(await res.json() as ApiDocumento);
  }
  return mapApiDocumento(
    await apiRequest<ApiDocumento>(`/api/member-documents/${docId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  );
}

export async function deleteMemberDocument(docId: string): Promise<void> {
  await apiRequest<unknown>(`/api/member-documents/${docId}`, { method: "DELETE" });
}
