import type { Member, MemberStatus } from "@/types/inventory";

const ts = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
};

const tsFuture = (daysAhead: number) => {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString();
};

// Nombres ficticios neutros (no asociados a personas reales conocidas)
const firstNames = [
  "Lucía", "Mateo", "Sofía", "Bruno", "Camila", "Joaquín", "Renata", "Tomás",
  "Valentina", "Ignacio", "Martina", "Lautaro", "Julieta", "Facundo", "Catalina",
  "Nicolás", "Florencia", "Agustín", "Paula", "Ramiro", "Antonia", "Federico",
  "Micaela", "Gonzalo", "Delfina", "Emilio", "Rocío", "Iván", "Ariana", "Diego",
  "Brenda", "Lucas", "Carla", "Hernán",
];

const lastNames = [
  "Aguirre", "Benítez", "Cabrera", "Domínguez", "Escudero", "Funes", "Gómez",
  "Herrera", "Iriarte", "Juárez", "Krause", "Linares", "Molina", "Navarro",
  "Ortega", "Paz", "Quiroga", "Ramírez", "Suárez", "Torres", "Ulloa", "Vargas",
  "Wagner", "Ximénez", "Yáñez", "Zelaya", "Báez", "Castro", "Delgado", "Estévez",
  "Falcón", "Gallardo", "Heredia", "Ibarra",
];

const statuses: MemberStatus[] = ["active", "active", "active", "active", "active", "pending", "suspended", "inactive"];

const notesPool = [
  "",
  "Renovación de credencial en proceso.",
  "Documentación médica revisada por auditoría.",
  "Cupo ajustado por indicación del responsable.",
  "Socio activo desde el inicio del club.",
  "",
];

export function generateMembers(): Member[] {
  const members: Member[] = [];
  for (let i = 0; i < 36; i++) {
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[(i * 3) % lastNames.length];
    const status = statuses[i % statuses.length];
    const monthlyQuota = [30, 40, 50, 60, 80][i % 5];
    const usage = status === "active" ? Math.floor(monthlyQuota * ((i % 10) / 10)) : 0;
    const credentialCode = `HC-${String(i + 1).padStart(4, "0")}`;
    // DNI ficticio (sin reglas reales)
    const dni = `${20_000_000 + i * 137_493}`.slice(0, 8);
    members.push({
      id: `mem-${String(i + 1).padStart(3, "0")}`,
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
      dni,
      credentialCode,
      status,
      monthlyQuotaGrams: monthlyQuota,
      currentMonthUsageGrams: usage,
      registrationDate: ts(30 + i * 9),
      reprocannExpirationDate: tsFuture(((i * 23) % 240) - 30),
      medicalDocumentExpirationDate: tsFuture(((i * 17) % 200) - 20),
      phone: `+54 9 11 ${String(4000 + i * 11).slice(0, 4)}-${String(1000 + i * 37).slice(0, 4)}`,
      email: `socio${String(i + 1).padStart(3, "0")}@hipnosis-demo.local`,
      notes: notesPool[i % notesPool.length],
    });
  }
  return members;
}
