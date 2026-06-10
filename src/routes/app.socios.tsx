import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, ExternalLink, Plus, Search, UploadCloud, Users, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useSortable } from "@/hooks/useSortable";
import { SortHead } from "@/components/ui/sort-head";
import { DateInput } from "@/components/ui/date-input";
import {
  createMember,
  createMemberDocument,
  deactivateMember,
  deleteMemberDocument,
  getMemberDocuments,
  getMembers,
  updateMember,
  updateMemberDocument,
  type CreateDocumentPayload,
  type CreateMemberPayload,
} from "@/services/memberService";
import type {
  DocumentStatus,
  DocumentType,
  Member,
  MemberDocument,
  MemberStatus,
} from "@/types/inventory";

export const Route = createFileRoute("/app/socios")({
  head: () => ({ meta: [{ title: "Socios · Cannabis Club Manager" }] }),
  component: SociosPage,
});

// ─── Constantes visuales ──────────────────────────────────────────────────────

const STATUS_LABEL: Record<MemberStatus, string> = {
  active:    "Activo",
  pending:   "Pendiente",
  suspended: "Suspendido",
  inactive:  "Inactivo",
};

const STATUS_CLASS: Record<MemberStatus, string> = {
  active:    "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  pending:   "bg-amber-500/10 text-amber-700 border-amber-200",
  suspended: "bg-red-500/10 text-red-700 border-red-200",
  inactive:  "bg-muted text-muted-foreground border-border",
};


const DOC_TYPE_LABEL: Record<DocumentType, string> = {
  credencial:        "Credencial",
  dni_frente:        "DNI frente",
  dni_dorso:         "DNI dorso",
  reprocann:         "REPROCANN",
  certificado_medico:"Cert. médico",
  autorizacion:      "Autorización",
  otro:              "Otro (opcional)",
};

const REQUIRED_DOC_TYPES: DocumentType[] = [
  "credencial", "dni_frente", "dni_dorso", "reprocann", "certificado_medico", "autorizacion",
];
const ALL_DOC_TYPES: DocumentType[] = [...REQUIRED_DOC_TYPES, "otro"];

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

const DOC_STATUS_LABEL: Record<DocumentStatus, string> = {
  vigente:    "Vigente",
  por_vencer: "Por vencer",
  vencido:    "Vencido",
  pendiente:  "Pendiente",
  inactivo:   "Inactivo",
};

const DOC_STATUS_CLASS: Record<DocumentStatus, string> = {
  vigente:    "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  por_vencer: "bg-amber-500/10 text-amber-700 border-amber-200",
  vencido:    "bg-red-500/10 text-red-700 border-red-200",
  pendiente:  "bg-sky-500/10 text-sky-700 border-sky-200",
  inactivo:   "bg-muted text-muted-foreground border-border",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysUntil(iso?: string): number | null {
  if (!iso) return null;
  return Math.floor((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

function fmtDate(iso?: string): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

const SOLO_ARCHIVO_TYPES = new Set<DocumentType>(["dni_frente", "dni_dorso"]);

function computeDocStatus(doc: MemberDocument): DocumentStatus {
  if (SOLO_ARCHIVO_TYPES.has(doc.tipoDocumento)) return "vigente";
  if (doc.fechaVencimiento) {
    const days = Math.floor((new Date(doc.fechaVencimiento).getTime() - Date.now()) / 86_400_000);
    if (days < 0) return "vencido";
    if (days <= 30) return "por_vencer";
    return "vigente";
  }
  return doc.estado;
}

function getDocForType(docs: MemberDocument[], tipo: DocumentType): MemberDocument | undefined {
  return docs
    .filter((d) => d.tipoDocumento === tipo && d.estado !== "inactivo")
    .sort((a, b) => new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime())[0];
}

function reprocannSummary(member: Member): { label: string; class: string } {
  const doc = getDocForType(member.documents ?? [], "reprocann");
  if (!doc) return { label: "Sin documento", class: "bg-muted text-muted-foreground border-border" };
  const status = computeDocStatus(doc);
  const map: Record<DocumentStatus, { label: string; class: string }> = {
    vigente:    { label: "Vigente",    class: DOC_STATUS_CLASS.vigente },
    por_vencer: { label: "Por vencer", class: DOC_STATUS_CLASS.por_vencer },
    vencido:    { label: "Vencido",    class: DOC_STATUS_CLASS.vencido },
    pendiente:  { label: "Pendiente",  class: DOC_STATUS_CLASS.pendiente },
    inactivo:   { label: "Sin documento", class: "bg-muted text-muted-foreground border-border" },
  };
  return map[status];
}

// ─── Form inicial ─────────────────────────────────────────────────────────────

const EMPTY_FORM: CreateMemberPayload = {
  codigoSocio:       "",
  nombre:            "",
  apellido:          "",
  dni:               "",
  fechaNacimiento:   "",
  telefono:          "",
  email:             "",
  direccion:         "",
  localidad:         "",
  provincia:         "",
  estado:            "activo" as MemberStatus,
  cupoMensualGramos: undefined,
  observaciones:     "",
};

function memberToForm(m: Member): CreateMemberPayload {
  return {
    codigoSocio:       m.credentialCode,
    nombre:            m.firstName,
    apellido:          m.lastName,
    dni:               m.dni ?? "",
    fechaNacimiento:   m.birthDate ?? "",
    telefono:          m.phone ?? "",
    email:             m.email ?? "",
    direccion:         m.address ?? "",
    localidad:         m.localidad ?? "",
    provincia:         m.provincia ?? "",
    estado:            m.status,
      cupoMensualGramos: m.monthlyQuotaGrams || undefined,
    observaciones:     m.notes ?? "",
  };
}

// ─── Página principal ─────────────────────────────────────────────────────────

function SociosPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | MemberStatus>("all");
  const [docFilter, setDocFilter] = useState<"all" | "vigente" | "por_vencer" | "vencido">("all");

  const [selected, setSelected] = useState<Member | null>(null);
  const [formTarget, setFormTarget] = useState<Member | "new" | null>(null);
  const [showQuotaCol, setShowQuotaCol] = useState(false);

  useEffect(() => {
    void getMembers().then((data) => {
      setMembers(data);
      setLoading(false);
    });
  }, []);

  const stats = useMemo(() => {
    let active = 0, pending = 0, expiring = 0, nearQuota = 0;
    for (const m of members) {
      if (m.status === "active") active++;
      if (m.status === "pending") pending++;
      const dCred = daysUntil(m.reprocannExpirationDate);
      const dMed = daysUntil(m.medicalDocumentExpirationDate);
      const min = Math.min(dCred ?? 999, dMed ?? 999);
      if (min >= 0 && min <= 30) expiring++;
      if (m.status === "active" && m.monthlyQuotaGrams > 0 && m.currentMonthUsageGrams / m.monthlyQuotaGrams >= 0.8) nearQuota++;
    }
    return { total: members.length, active, pending, expiring, nearQuota };
  }, [members]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return members.filter((m) => {
      if (statusFilter !== "all" && m.status !== statusFilter) return false;
      if (docFilter !== "all") {
        const summary = reprocannSummary(m);
        const key = summary.label.toLowerCase().replace(/ /g, "_");
        if (docFilter === "vigente" && key !== "vigente") return false;
        if (docFilter === "por_vencer" && key !== "por_vencer") return false;
        if (docFilter === "vencido" && key !== "vencido") return false;
      }
      if (!q) return true;
      return (
        m.fullName.toLowerCase().includes(q) ||
        m.credentialCode.toLowerCase().includes(q) ||
        (m.dni ?? "").includes(q)
      );
    });
  }, [members, search, statusFilter, docFilter]);

  const { sorted, col: sCol, dir: sDir, toggle: sort } = useSortable(filtered);

  function handleSelectMember(m: Member) {
    setSelected(m);
    setFormTarget(null);
  }

  function handleMemberSaved(saved: Member) {
    setMembers((prev) => {
      const idx = prev.findIndex((m) => m.id === saved.id);
      return idx === -1 ? [saved, ...prev] : prev.map((m) => (m.id === saved.id ? saved : m));
    });
    setFormTarget(null);
    setSelected(saved);
  }

  function handleMemberDeleted(m: Member) {
    setMembers((prev) => prev.filter((x) => x.id !== m.id));
    if (selected?.id === m.id) setSelected(null);
    setFormTarget(null);
  }

  function handleDeactivate(m: Member) {
    const updated = { ...m, status: "inactive" as MemberStatus };
    setMembers((prev) => prev.map((x) => (x.id === m.id ? updated : x)));
    if (selected?.id === m.id) setSelected(updated);
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Socios · Pacientes</h1>
          <p className="text-sm text-muted-foreground">Gestión de socios, cupos y documentación</p>
        </div>
        <Button className="gap-1.5" onClick={() => setFormTarget("new")}>
          <Plus className="h-4 w-4" />
          Nuevo socio
        </Button>
      </div>

      {message ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {message}
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {[
          { label: "Total de socios", value: stats.total },
          { label: "Activos", value: stats.active },
          { label: "Pendientes", value: stats.pending },
          { label: "Doc. por vencer", value: stats.expiring },
          { label: "Cupos al límite", value: stats.nearQuota },
        ].map((c) => (
          <div key={c.label} className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{c.label}</p>
            <p className="mt-1 font-mono text-2xl font-semibold text-foreground">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="h-9 pl-8 bg-card"
              placeholder="Buscar por nombre, código o DNI"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
            <SelectTrigger className="h-9 bg-card"><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="active">Activo</SelectItem>
              <SelectItem value="pending">Pendiente</SelectItem>
              <SelectItem value="suspended">Suspendido</SelectItem>
              <SelectItem value="inactive">Inactivo</SelectItem>
            </SelectContent>
          </Select>
          <Select value={docFilter} onValueChange={(v) => setDocFilter(v as typeof docFilter)}>
            <SelectTrigger className="h-9 bg-card"><SelectValue placeholder="Documentación" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toda la documentación</SelectItem>
              <SelectItem value="vigente">Vigente</SelectItem>
              <SelectItem value="por_vencer">Por vencer (≤30 días)</SelectItem>
              <SelectItem value="vencido">Vencida</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="show-quota"
          checked={showQuotaCol}
          onCheckedChange={(v) => setShowQuotaCol(!!v)}
        />
        <label htmlFor="show-quota" className="text-sm text-muted-foreground cursor-pointer select-none">
          Mostrar columna Cupo mensual estimado
        </label>
      </div>

      {loading ? (
        <div className="rounded-lg border border-border bg-card py-16 text-center">
          <p className="text-sm text-muted-foreground">Cargando socios...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-border bg-card py-16 text-center">
          <Users className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">No hay socios que coincidan con los filtros</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <SortHead label="Código"               sortKey="credentialCode"     col={sCol} dir={sDir} onSort={sort} className="text-center" />
                <SortHead label="Nombre"               sortKey="fullName"           col={sCol} dir={sDir} onSort={sort} className="text-center" />
                <SortHead label="DNI"                  sortKey="dni"                col={sCol} dir={sDir} onSort={sort} className="text-center" />
                <SortHead label="Teléfono"             sortKey="phone"              col={sCol} dir={sDir} onSort={sort} className="text-center" />
                <SortHead label="Estado"               sortKey="status"             col={sCol} dir={sDir} onSort={sort} className="text-center" />
                <TableHead className="text-center">REPROCANN</TableHead>
                {showQuotaCol && (
                  <SortHead label="Cupo mensual estimado" sortKey="monthlyQuotaGrams" col={sCol} dir={sDir} onSort={sort} className="text-center" />
                )}
                <TableHead className="text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((m) => {
                const doc = reprocannSummary(m);
                return (
                  <TableRow
                    key={m.id}
                    className="cursor-pointer hover:bg-muted/40"
                    onClick={() => handleSelectMember(m)}
                  >
                    <TableCell className="font-mono text-xs text-center">{m.credentialCode}</TableCell>
                    <TableCell className="font-medium text-center">{m.fullName}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground text-center">{m.dni ?? "-"}</TableCell>
                    <TableCell className="text-xs text-center">{m.phone ?? "-"}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={STATUS_CLASS[m.status]}>
                        {STATUS_LABEL[m.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={doc.class}>{doc.label}</Badge>
                    </TableCell>
                    {showQuotaCol && (
                      <TableCell className="font-mono text-xs text-center">
                        {m.monthlyQuotaGrams ? `${m.monthlyQuotaGrams} g` : "-"}
                      </TableCell>
                    )}
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); handleSelectMember(m); }}
                        >
                          Ver
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); setFormTarget(m); }}
                        >
                          Editar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <MemberFormSheet
        target={formTarget}
        onClose={() => setFormTarget(null)}
        onSaved={handleMemberSaved}
        onDeleted={handleMemberDeleted}
        onError={setMessage}
      />

      <MemberDetailSheet
        member={selected}
        onClose={() => setSelected(null)}
        onEdit={() => { if (selected) { const m = selected; setSelected(null); setFormTarget(m); } }}
        onDeactivate={handleDeactivate}
        onError={setMessage}
      />
    </div>
  );
}

// ─── Sheet de creación / edición ──────────────────────────────────────────────

interface FormSheetProps {
  target: Member | "new" | null;
  onClose: () => void;
  onSaved: (m: Member) => void;
  onDeleted: (m: Member) => void;
  onError: (msg: string) => void;
}

function MemberFormSheet({ target, onClose, onSaved, onDeleted, onError }: FormSheetProps) {
  const isNew = target === "new";
  const editMember = isNew ? null : (target as Member | null);

  const [form, setForm] = useState<CreateMemberPayload>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState("");
  const [documents, setDocuments] = useState<MemberDocument[]>([]);
  const [docLoading, setDocLoading] = useState(false);
  const [docError, setDocError] = useState("");
  const [pendingDocs, setPendingDocs] = useState<PendingDocMap>({});

  useEffect(() => {
    if (!target) return;
    setForm(editMember ? memberToForm(editMember) : EMPTY_FORM);
    setError("");
    setDocError("");
    setDocuments([]);
    setPendingDocs({});
    if (editMember) {
      if (editMember.documents) {
        setDocuments(editMember.documents.filter((d) => d.estado !== "inactivo"));
      } else {
        setDocLoading(true);
        getMemberDocuments(editMember.id)
          .then((docs) => setDocuments(docs.filter((d) => d.estado !== "inactivo")))
          .catch(() => setDocuments([]))
          .finally(() => setDocLoading(false));
      }
    }
  }, [target]);

  const set = (key: keyof CreateMemberPayload, value: unknown) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function handleSubmit() {
    if (!form.codigoSocio.trim()) { setError("El código de socio es obligatorio."); return; }
    if (!form.nombre.trim())      { setError("El nombre es obligatorio."); return; }
    if (!form.apellido.trim())    { setError("El apellido es obligatorio."); return; }

    setSaving(true);
    setError("");
    try {
      const payload: CreateMemberPayload = {
        ...form,
        dni: form.dni || undefined,
        fechaNacimiento: form.fechaNacimiento || undefined,
        telefono: form.telefono || undefined,
        email: form.email || undefined,
        direccion: form.direccion || undefined,
        localidad: form.localidad || undefined,
        provincia: form.provincia || undefined,
        observaciones: form.observaciones || undefined,
      };
      const saved = editMember
        ? await updateMember(editMember.id, payload)
        : await createMember(payload);

      if (isNew) {
        for (const entry of Object.values(pendingDocs)) {
          if (!entry) continue;
          try { await createMemberDocument(saved.id, entry.payload, entry.file); } catch { /* no bloquear */ }
        }
      }

      onSaved(saved);
      onError("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No se pudo guardar el socio.";
      setError(msg);
      onError(msg);
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!editMember) return;
    setConfirmOpen(false);
    setDeleting(true);
    setError("");
    try {
      await deactivateMember(editMember.id);
      onDeleted(editMember);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar el asociado.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Sheet open={Boolean(target)} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent className="w-full sm:max-w-[560px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isNew ? "Nuevo socio" : "Editar socio"}</SheetTitle>
          <SheetDescription>
            {isNew ? "Completá los datos del nuevo socio." : `Editando ${editMember?.fullName}`}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          {error ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Código socio *">
              <Input value={form.codigoSocio} onChange={(e) => set("codigoSocio", e.target.value)} />
            </Field>
            <Field label="Estado">
              <Select value={form.estado} onValueChange={(v) => set("estado", v as MemberStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="suspendido">Suspendido</SelectItem>
                  <SelectItem value="inactivo">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Nombre *">
              <Input value={form.nombre} onChange={(e) => set("nombre", e.target.value)} />
            </Field>
            <Field label="Apellido *">
              <Input value={form.apellido} onChange={(e) => set("apellido", e.target.value)} />
            </Field>
            <Field label="DNI">
              <Input value={form.dni ?? ""} onChange={(e) => set("dni", e.target.value)} />
            </Field>
            <Field label="Fecha de nacimiento">
              <DateInput value={form.fechaNacimiento ?? ""} onChange={(v) => set("fechaNacimiento", v)} />
            </Field>
            <Field label="Teléfono">
              <Input value={form.telefono ?? ""} onChange={(e) => set("telefono", e.target.value)} />
            </Field>
            <Field label="Email">
              <Input type="email" value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} />
            </Field>
            <Field label="Dirección" className="sm:col-span-2">
              <Input value={form.direccion ?? ""} onChange={(e) => set("direccion", e.target.value)} />
            </Field>
            <Field label="Localidad">
              <Input value={form.localidad ?? ""} onChange={(e) => set("localidad", e.target.value)} />
            </Field>
            <Field label="Provincia">
              <Input value={form.provincia ?? ""} onChange={(e) => set("provincia", e.target.value)} />
            </Field>
            <Field label="Cupo mensual estimado (g)">
              <Input
                type="number"
                min={0}
                step={5}
                value={form.cupoMensualGramos ?? ""}
                onChange={(e) => set("cupoMensualGramos", e.target.value ? Number(e.target.value) : undefined)}
              />
            </Field>
            <Field label="Observaciones" className="sm:col-span-2">
              <Textarea
                value={form.observaciones ?? ""}
                onChange={(e) => set("observaciones", e.target.value)}
                rows={3}
              />
            </Field>
          </div>

          <Button className="w-full cursor-pointer" onClick={handleSubmit} disabled={saving || deleting}>
            {saving ? "Guardando..." : isNew ? "Crear socio" : "Guardar cambios"}
          </Button>

          {!isNew && editMember ? (
            <Button
              className="w-full cursor-pointer"
              variant="destructive"
              onClick={() => setConfirmOpen(true)}
              disabled={saving || deleting}
            >
              {deleting ? "Eliminando..." : "Eliminar asociado"}
            </Button>
          ) : null}

          <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle className="text-destructive">Eliminar asociado</DialogTitle>
                <DialogDescription className="pt-1">
                  Estás por eliminar a{" "}
                  <span className="font-semibold text-foreground">{editMember?.fullName}</span>.
                  <br />
                  Esta acción no se puede deshacer.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  variant="outline"
                  className="cursor-pointer"
                  onClick={() => setConfirmOpen(false)}
                  disabled={deleting}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  className="cursor-pointer"
                  onClick={() => void confirmDelete()}
                  disabled={deleting}
                >
                  {deleting ? "Eliminando..." : "Sí, eliminar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {isNew ? (
            <div className="border-t border-border pt-5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                Documentación <span className="normal-case font-normal text-muted-foreground">(opcional)</span>
              </h3>
              <PendingDocChecklist pending={pendingDocs} onChange={setPendingDocs} />
            </div>
          ) : editMember ? (
            <div className="border-t border-border pt-5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Documentación</h3>
              {docError ? (
                <p className="mb-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{docError}</p>
              ) : null}
              {docLoading ? (
                <p className="text-xs text-muted-foreground">Cargando documentos...</p>
              ) : (
                <DocumentChecklist
                  socioId={editMember.id}
                  documents={documents}
                  onDocumentsChange={setDocuments}
                  onError={setDocError}
                />
              )}
            </div>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Sheet de detalle ─────────────────────────────────────────────────────────

interface DetailSheetProps {
  member: Member | null;
  onClose: () => void;
  onEdit: () => void;
  onDeactivate: (m: Member) => void;
  onError: (msg: string) => void;
}

function MemberDetailSheet({ member, onClose, onEdit, onDeactivate, onError }: DetailSheetProps) {
  const [documents, setDocuments] = useState<MemberDocument[]>([]);
  const [docLoading, setDocLoading] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  useEffect(() => {
    if (!member) { setDocuments([]); return; }
    setDocLoading(true);
    getMemberDocuments(member.id)
      .then((docs) => setDocuments(docs.filter((d) => d.estado !== "inactivo")))
      .catch(() => setDocuments(member.documents?.filter((d) => d.estado !== "inactivo") ?? []))
      .finally(() => setDocLoading(false));
  }, [member]);

  async function handleDeactivate() {
    if (!member) return;
    setDeactivating(true);
    try {
      await updateMember(member.id, { estado: "inactive" as MemberStatus });
      onDeactivate(member);
      onClose();
    } catch (err) {
      onError(err instanceof Error ? err.message : "No se pudo inactivar el socio.");
    } finally {
      setDeactivating(false);
    }
  }

  if (!member) {
    return (
      <Sheet open={false} onOpenChange={(o) => { if (!o) onClose(); }}>
        <SheetContent />
      </Sheet>
    );
  }

  const usagePct = member.monthlyQuotaGrams > 0
    ? Math.round((member.currentMonthUsageGrams / member.monthlyQuotaGrams) * 100)
    : 0;

  return (
    <Sheet open onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent className="w-[480px] sm:max-w-[520px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{member.fullName}</SheetTitle>
          <SheetDescription>{member.credentialCode}</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-5 text-sm">
          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Datos generales</h3>
            <Row label="Estado">
              <Badge variant="outline" className={STATUS_CLASS[member.status]}>{STATUS_LABEL[member.status]}</Badge>
            </Row>
            <Row label="DNI" mono>{member.dni ?? "-"}</Row>
            <Row label="Teléfono">{member.phone ?? "-"}</Row>
            <Row label="Email">{member.email ?? "-"}</Row>
            {member.localidad ? <Row label="Localidad">{member.localidad}{member.provincia ? `, ${member.provincia}` : ""}</Row> : null}
            <Row label="Alta">{fmtDate(member.registrationDate)}</Row>
          </section>

          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cupo</h3>
            <Row label="Cupo mensual estimado" mono>{member.monthlyQuotaGrams ? `${member.monthlyQuotaGrams} g` : "-"}</Row>
            <Row label="Uso del mes" mono>{`${member.currentMonthUsageGrams} g · ${usagePct}%`}</Row>
            {member.monthlyQuotaGrams > 0 ? (
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full ${usagePct >= 80 ? "bg-amber-500" : "bg-emerald-500"}`}
                  style={{ width: `${Math.min(100, usagePct)}%` }}
                />
              </div>
            ) : null}
          </section>

          {member.notes ? (
            <section className="space-y-1">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Observaciones</h3>
              <p className="text-muted-foreground">{member.notes}</p>
            </section>
          ) : null}

          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Documentación</h3>
            {docLoading ? (
              <p className="text-xs text-muted-foreground">Cargando...</p>
            ) : (
              <div className="space-y-1.5">
                {ALL_DOC_TYPES.map((tipo) => {
                  const doc = getDocForType(documents, tipo);
                  const effectiveStatus = doc ? computeDocStatus(doc) : null;
                  return (
                    <div key={tipo} className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2">
                      <span className="shrink-0">
                        {!doc ? (
                          <span className="inline-block h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
                        ) : effectiveStatus === "vigente" ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        ) : effectiveStatus === "vencido" ? (
                          <XCircle className="h-4 w-4 text-red-500" />
                        ) : (
                          <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[8px] font-bold text-white">!</span>
                        )}
                      </span>
                      <span className="flex-1 text-xs font-medium">{DOC_TYPE_LABEL[tipo]}</span>
                      {doc ? (
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${DOC_STATUS_CLASS[effectiveStatus!]}`}>
                            {DOC_STATUS_LABEL[effectiveStatus!]}
                          </Badge>
                          {doc.fechaEmision ? (
                            <span className="hidden sm:inline">{fmtDate(doc.fechaEmision)}</span>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">Sin cargar</span>
                      )}
                      {doc?.archivoUrl ? (
                        <a
                          href={`${API_BASE}${doc.archivoUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground hover:text-foreground"
                          title={doc.nombreArchivo ?? "Ver archivo"}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <div className="flex gap-2 pt-2">
            <Button className="flex-1" variant="outline" onClick={onEdit}>
              Editar socio
            </Button>
            {member.status !== "inactive" ? (
              <Button
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={() => void handleDeactivate()}
                disabled={deactivating}
              >
                {deactivating ? "..." : "Inactivar"}
              </Button>
            ) : null}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Checklist de documentos ──────────────────────────────────────────────────

interface DocChecklistProps {
  socioId: string;
  documents: MemberDocument[];
  onDocumentsChange: (docs: MemberDocument[]) => void;
  onError: (msg: string) => void;
}

interface DocRowForm {
  tipoDocumento:   DocumentType;
  fechaEmision:    string;
  estado:          DocumentStatus;
  numeroDocumento: string;
  observaciones:   string;
  file?: File;
}

function emptyRowForm(tipo: DocumentType): DocRowForm {
  return { tipoDocumento: tipo, fechaEmision: "", estado: "vigente", numeroDocumento: "", observaciones: "" };
}

type DocFieldConfig = {
  soloArchivo:    boolean;
  fechaLabel:     string;
  showEstado:     boolean;
  numLabel:       string | null;
  obsLabel:       string | null;
};

const DOC_FIELD_CONFIG: Record<DocumentType, DocFieldConfig> = {
  credencial:        { soloArchivo: false, fechaLabel: "Fecha de Alta",         showEstado: true,  numLabel: "N°",                   obsLabel: null          },
  dni_frente:        { soloArchivo: true,  fechaLabel: "",                      showEstado: false, numLabel: null,                   obsLabel: null          },
  dni_dorso:         { soloArchivo: true,  fechaLabel: "",                      showEstado: false, numLabel: null,                   obsLabel: null          },
  reprocann:         { soloArchivo: false, fechaLabel: "Fecha de Alta",         showEstado: true,  numLabel: "Código Vinculación",   obsLabel: null          },
  certificado_medico:{ soloArchivo: false, fechaLabel: "Fecha de prescripción", showEstado: false, numLabel: null,                   obsLabel: "Diagnóstico" },
  autorizacion:      { soloArchivo: false, fechaLabel: "Fecha de Alta",         showEstado: false, numLabel: null,                   obsLabel: "Descripción" },
  otro:              { soloArchivo: false, fechaLabel: "Fecha",                 showEstado: false, numLabel: null,                   obsLabel: "Descripción" },
};

function DocumentChecklist({ socioId, documents, onDocumentsChange, onError }: DocChecklistProps) {
  const [activeType, setActiveType] = useState<DocumentType | null>(null);
  const [rowForm, setRowForm] = useState<DocRowForm>(emptyRowForm("credencial"));
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function openCreate(tipo: DocumentType) {
    setActiveType(tipo);
    setRowForm(emptyRowForm(tipo));
    if (fileRef.current) fileRef.current.value = "";
  }

  function openEdit(doc: MemberDocument) {
    setActiveType(doc.tipoDocumento);
    setRowForm({
      tipoDocumento:   doc.tipoDocumento,
      fechaEmision:    doc.fechaEmision ?? "",
      estado:          computeDocStatus(doc),
      numeroDocumento: doc.numeroDocumento ?? "",
      observaciones:   doc.observaciones ?? "",
    });
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleSave() {
    if (!activeType) return;
    setSaving(true);
    const existingDoc = getDocForType(documents, activeType);
    const cfg = DOC_FIELD_CONFIG[activeType];
    const payload: CreateDocumentPayload = {
      tipoDocumento:   rowForm.tipoDocumento,
      fechaEmision:    rowForm.fechaEmision || undefined,
      estado:          cfg.showEstado ? rowForm.estado : "vigente",
      numeroDocumento: rowForm.numeroDocumento || undefined,
      observaciones:   rowForm.observaciones || undefined,
    };
    try {
      let saved: MemberDocument;
      if (existingDoc) {
        saved = await updateMemberDocument(existingDoc.id, payload, rowForm.file);
        onDocumentsChange(documents.map((d) => (d.id === saved.id ? saved : d)));
      } else {
        saved = await createMemberDocument(socioId, payload, rowForm.file);
        onDocumentsChange([...documents, saved]);
      }
      setActiveType(null);
      onError("");
    } catch (err) {
      onError(err instanceof Error ? err.message : "No se pudo guardar el documento.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(doc: MemberDocument) {
    try {
      await deleteMemberDocument(doc.id);
      onDocumentsChange(documents.filter((d) => d.id !== doc.id));
    } catch (err) {
      onError(err instanceof Error ? err.message : "No se pudo eliminar el documento.");
    }
  }

  return (
    <div className="space-y-1.5">
      {ALL_DOC_TYPES.map((tipo) => {
        const doc = getDocForType(documents, tipo);
        const effectiveStatus = doc ? computeDocStatus(doc) : null;
        const isEditing = activeType === tipo;

        return (
          <div key={tipo} className="rounded-md border border-border bg-card overflow-hidden">
            {/* Fila principal */}
            <div className="flex items-center gap-2 px-3 py-2">
              {/* Ícono de estado */}
              <span className="shrink-0">
                {!doc ? (
                  <span className="inline-block h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
                ) : effectiveStatus === "vigente" ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : effectiveStatus === "vencido" ? (
                  <XCircle className="h-4 w-4 text-red-500" />
                ) : (
                  <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[8px] font-bold text-white">!</span>
                )}
              </span>

              {/* Nombre del tipo */}
              <span className="flex-1 text-xs font-medium">{DOC_TYPE_LABEL[tipo]}</span>

              {/* Badge estado + vencimiento */}
              {doc ? (
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${DOC_STATUS_CLASS[effectiveStatus!]}`}>
                    {DOC_STATUS_LABEL[effectiveStatus!]}
                  </Badge>
                  {doc.fechaVencimiento ? (
                    <span className="hidden sm:inline">Vence {fmtDate(doc.fechaVencimiento)}</span>
                  ) : null}
                </div>
              ) : (
                <span className="text-[11px] text-muted-foreground">Sin cargar</span>
              )}

              {/* Botón ver archivo */}
              {doc?.archivoUrl ? (
                <a
                  href={`${API_BASE}${doc.archivoUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground hover:text-foreground"
                  title={doc.nombreArchivo ?? "Ver archivo"}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : null}

              {/* Botón editar / cargar */}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[11px] shrink-0"
                onClick={() => {
                  if (isEditing) { setActiveType(null); return; }
                  doc ? openEdit(doc) : openCreate(tipo);
                }}
              >
                {isEditing ? "Cancelar" : doc ? "Editar" : <><UploadCloud className="mr-1 h-3 w-3" />Cargar</>}
              </Button>
            </div>

            {/* Formulario inline — layout por tipo */}
            {isEditing ? (
              <div className="border-t border-border bg-muted/30 px-3 py-3 space-y-2.5">
                {(() => {
                  const cfg = DOC_FIELD_CONFIG[tipo];

                  if (cfg.soloArchivo) {
                    /* DNI frente / DNI dorso: solo archivo */
                    return (
                      <Field label={doc?.archivoUrl ? "Reemplazar archivo (PDF, JPG, PNG)" : "Adjuntar archivo (PDF, JPG, PNG)"}>
                        <input
                          ref={tipo === activeType ? fileRef : undefined}
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.webp"
                          className="block w-full text-xs text-muted-foreground file:mr-2 file:rounded file:border-0 file:bg-muted file:px-2 file:py-1 file:text-xs file:font-medium"
                          onChange={(e) => setRowForm((f) => ({ ...f, file: e.target.files?.[0] }))}
                        />
                        {doc?.nombreArchivo ? (
                          <p className="text-[11px] text-muted-foreground">Actual: {doc.nombreArchivo}</p>
                        ) : null}
                      </Field>
                    );
                  }

                  /* Tipos con campos de texto */
                  const hasNum = cfg.numLabel !== null;
                  const hasObs = cfg.obsLabel !== null;

                  return (
                    <>
                      {/* Fila superior: fecha + (estado) + (número/código) */}
                      <div className={`grid gap-2 ${cfg.showEstado && hasNum ? "grid-cols-3" : cfg.showEstado || hasNum ? "grid-cols-2" : "grid-cols-1"}`}>
                        <Field label={cfg.fechaLabel}>
                          <DateInput
                            className="h-7 text-xs"
                            value={rowForm.fechaEmision}
                            onChange={(v) => setRowForm((f) => ({ ...f, fechaEmision: v }))}
                          />
                        </Field>

                        {cfg.showEstado && (
                          <Field label="Estado">
                            <Select value={rowForm.estado} onValueChange={(v) => setRowForm((f) => ({ ...f, estado: v as DocumentStatus }))}>
                              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="vigente">Vigente</SelectItem>
                                <SelectItem value="por_vencer">Por vencer</SelectItem>
                                <SelectItem value="pendiente">Pendiente</SelectItem>
                                <SelectItem value="vencido">Vencido</SelectItem>
                              </SelectContent>
                            </Select>
                          </Field>
                        )}

                        {hasNum && (
                          <Field label={cfg.numLabel!}>
                            <Input
                              className="h-7 text-xs"
                              value={rowForm.numeroDocumento}
                              onChange={(e) => setRowForm((f) => ({ ...f, numeroDocumento: e.target.value }))}
                              placeholder="Opcional"
                            />
                          </Field>
                        )}
                      </div>

                      {/* Observaciones / Diagnóstico / Descripción (textarea amplio) */}
                      {hasObs && (
                        <Field label={cfg.obsLabel!}>
                          <textarea
                            className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs min-h-[72px] resize-y focus:outline-none focus:ring-1 focus:ring-ring"
                            value={rowForm.observaciones}
                            onChange={(e) => setRowForm((f) => ({ ...f, observaciones: e.target.value }))}
                            placeholder="Opcional"
                          />
                        </Field>
                      )}

                      {/* Archivo adjunto */}
                      <Field label={doc?.archivoUrl ? "Reemplazar archivo (PDF, JPG, PNG)" : "Adjuntar archivo (PDF, JPG, PNG)"}>
                        <input
                          ref={tipo === activeType ? fileRef : undefined}
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.webp"
                          className="block w-full text-xs text-muted-foreground file:mr-2 file:rounded file:border-0 file:bg-muted file:px-2 file:py-1 file:text-xs file:font-medium"
                          onChange={(e) => setRowForm((f) => ({ ...f, file: e.target.files?.[0] }))}
                        />
                        {doc?.nombreArchivo ? (
                          <p className="text-[11px] text-muted-foreground">Actual: {doc.nombreArchivo}</p>
                        ) : null}
                      </Field>
                    </>
                  );
                })()}

                <div className="flex gap-2">
                  <Button size="sm" className="flex-1 h-7 text-xs" onClick={() => void handleSave()} disabled={saving}>
                    {saving ? "Guardando..." : "Guardar"}
                  </Button>
                  {doc ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs text-destructive hover:text-destructive"
                      onClick={() => void handleDelete(doc)}
                      disabled={saving}
                    >
                      Quitar
                    </Button>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

// ─── Checklist de docs pendientes (nuevo socio) ───────────────────────────────

type PendingDocEntry = { payload: CreateDocumentPayload; file?: File };
type PendingDocMap = Partial<Record<DocumentType, PendingDocEntry>>;

function PendingDocChecklist({ pending, onChange }: { pending: PendingDocMap; onChange: (m: PendingDocMap) => void }) {
  const [activeType, setActiveType] = useState<DocumentType | null>(null);
  const [rowForm, setRowForm] = useState<DocRowForm>(emptyRowForm("credencial"));
  const fileRef = useRef<HTMLInputElement>(null);

  function openCreate(tipo: DocumentType) {
    setActiveType(tipo);
    setRowForm(emptyRowForm(tipo));
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleSave() {
    if (!activeType) return;
    const cfg = DOC_FIELD_CONFIG[activeType];
    const entry: PendingDocEntry = {
      payload: {
        tipoDocumento: rowForm.tipoDocumento,
        fechaEmision: rowForm.fechaEmision || undefined,
        estado: cfg.showEstado ? rowForm.estado : "vigente",
        numeroDocumento: rowForm.numeroDocumento || undefined,
        observaciones: rowForm.observaciones || undefined,
      },
      file: rowForm.file,
    };
    onChange({ ...pending, [activeType]: entry });
    setActiveType(null);
  }

  function handleRemove(tipo: DocumentType) {
    const next = { ...pending };
    delete next[tipo];
    onChange(next);
  }

  return (
    <div className="space-y-1.5">
      {ALL_DOC_TYPES.map((tipo) => {
        const entry = pending[tipo];
        const isEditing = activeType === tipo;
        const cfg = DOC_FIELD_CONFIG[tipo];

        return (
          <div key={tipo} className="rounded-md border border-border bg-card overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2">
              <span className="shrink-0">
                {entry
                  ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  : <span className="inline-block h-4 w-4 rounded-full border-2 border-muted-foreground/30" />}
              </span>
              <span className="flex-1 text-xs font-medium">{DOC_TYPE_LABEL[tipo]}</span>
              {entry?.file ? (
                <span className="text-[11px] text-muted-foreground truncate max-w-[120px]">{entry.file.name}</span>
              ) : (
                <span className="text-[11px] text-muted-foreground">Sin cargar</span>
              )}
              <Button
                variant="ghost" size="sm"
                className="h-6 px-2 text-[11px] shrink-0"
                onClick={() => { if (isEditing) { setActiveType(null); } else { openCreate(tipo); } }}
              >
                {isEditing ? "Cancelar" : entry ? "Editar" : <><UploadCloud className="mr-1 h-3 w-3" />Cargar</>}
              </Button>
            </div>

            {isEditing && (
              <div className="border-t border-border bg-muted/30 px-3 py-3 space-y-2.5">
                {cfg.soloArchivo ? (
                  <Field label="Adjuntar archivo (PDF, JPG, PNG)">
                    <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp"
                      className="block w-full text-xs text-muted-foreground file:mr-2 file:rounded file:border-0 file:bg-muted file:px-2 file:py-1 file:text-xs file:font-medium"
                      onChange={(e) => setRowForm((f) => ({ ...f, file: e.target.files?.[0] }))} />
                  </Field>
                ) : (
                  <>
                    <div className={`grid gap-2 ${cfg.showEstado && cfg.numLabel ? "grid-cols-3" : cfg.showEstado || cfg.numLabel ? "grid-cols-2" : "grid-cols-1"}`}>
                      <Field label={cfg.fechaLabel}>
                        <DateInput className="h-7 text-xs" value={rowForm.fechaEmision}
                          onChange={(v) => setRowForm((f) => ({ ...f, fechaEmision: v }))} />
                      </Field>
                      {cfg.showEstado && (
                        <Field label="Estado">
                          <Select value={rowForm.estado} onValueChange={(v) => setRowForm((f) => ({ ...f, estado: v as DocumentStatus }))}>
                            <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="vigente">Vigente</SelectItem>
                              <SelectItem value="por_vencer">Por vencer</SelectItem>
                              <SelectItem value="pendiente">Pendiente</SelectItem>
                              <SelectItem value="vencido">Vencido</SelectItem>
                            </SelectContent>
                          </Select>
                        </Field>
                      )}
                      {cfg.numLabel && (
                        <Field label={cfg.numLabel}>
                          <Input className="h-7 text-xs" value={rowForm.numeroDocumento} placeholder="Opcional"
                            onChange={(e) => setRowForm((f) => ({ ...f, numeroDocumento: e.target.value }))} />
                        </Field>
                      )}
                    </div>
                    {cfg.obsLabel && (
                      <Field label={cfg.obsLabel}>
                        <textarea className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs min-h-[72px] resize-y focus:outline-none focus:ring-1 focus:ring-ring"
                          value={rowForm.observaciones} placeholder="Opcional"
                          onChange={(e) => setRowForm((f) => ({ ...f, observaciones: e.target.value }))} />
                      </Field>
                    )}
                    <Field label="Adjuntar archivo (PDF, JPG, PNG)">
                      <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp"
                        className="block w-full text-xs text-muted-foreground file:mr-2 file:rounded file:border-0 file:bg-muted file:px-2 file:py-1 file:text-xs file:font-medium"
                        onChange={(e) => setRowForm((f) => ({ ...f, file: e.target.files?.[0] }))} />
                    </Field>
                  </>
                )}
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1 h-7 text-xs" onClick={handleSave}>En cola</Button>
                  {entry && (
                    <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive hover:text-destructive"
                      onClick={() => handleRemove(tipo)}>Quitar</Button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Componentes auxiliares ───────────────────────────────────────────────────

function Row({ label, children, mono }: { label: string; children: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className={mono ? "font-mono text-xs" : ""}>{children}</span>
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
