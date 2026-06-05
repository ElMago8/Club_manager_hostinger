export interface ClubSettings {
  club: {
    name: string;
    email: string;
    phone: string;
    address: string;
    admin: string;
  };
  preferences: {
    displayName: string;
    theme: "system" | "light" | "dark";
    minStock: number;
    alertDays: number;
    primaryUnit: "g";
  };
}

const DEFAULT_SETTINGS: ClubSettings = {
  club: {
    name: "Hipnosis Cannabis Club",
    email: "contacto@hipnosis-demo.local",
    phone: "+54 11 5555 0100",
    address: "Av. Ficticia 1234, CABA · Argentina",
    admin: "Admin Club",
  },
  preferences: {
    displayName: "Cannabis Club Manager",
    theme: "system",
    minStock: 10,
    alertDays: 7,
    primaryUnit: "g",
  },
};

// TODO: reemplazar mock por llamada a API Node.js (GET /api/settings).
export async function getSettings(): Promise<ClubSettings> {
  return DEFAULT_SETTINGS;
}
