export type VoterStatus = "Confirmado" | "Pendiente" | "En revisión";
export type VoterPriority = "Alta" | "Media" | "Baja";

export type Voter = {
  id: string;
  name: string;
  documentType: string;
  documentNumber: string;
  phone: string;
  email?: string;
  address: string;
  locationLink?: string;
  neighborhood: string;
  status: VoterStatus;
  priority: VoterPriority;
  support: number;
  visits: number;
  lat: number;
  lng: number;
  notes: string;
};

const initialVoters: Voter[] = [
  {
    id: "v-102",
    name: "Laura Méndez",
    documentType: "Cédula de ciudadanía",
    documentNumber: "1032456789",
    phone: "+57 312 555 0198",
    email: "laura.mendez@email.com",
    address: "Calle 67 # 5-32",
    neighborhood: "Chapinero Alto",
    status: "Confirmado",
    priority: "Alta",
    support: 92,
    visits: 3,
    lat: 4.6513,
    lng: -74.061,
    notes: "Prefiere contacto por la tarde.",
  },
  {
    id: "v-087",
    name: "Miguel Torres",
    documentType: "Cédula de ciudadanía",
    documentNumber: "79451233",
    phone: "+57 300 447 8301",
    email: "",
    address: "Carrera 24 # 39-55",
    neighborhood: "La Soledad",
    status: "Pendiente",
    priority: "Media",
    support: 64,
    visits: 1,
    lat: 4.6362,
    lng: -74.0702,
    notes: "Solicitó información del plan social.",
  },
  {
    id: "v-141",
    name: "Camila Rojas",
    documentType: "Cédula de ciudadanía",
    documentNumber: "1029987765",
    phone: "+57 315 220 4409",
    email: "camila.rojas@email.com",
    address: "Carrera 17 # 41-20",
    neighborhood: "Teusaquillo",
    status: "En revisión",
    priority: "Baja",
    support: 41,
    visits: 2,
    lat: 4.6409,
    lng: -74.0821,
    notes: "Requiere seguimiento presencial.",
  },
  {
    id: "v-066",
    name: "Juan Pablo Cruz",
    documentType: "Pasaporte",
    documentNumber: "PA4729081",
    phone: "+57 320 901 2204",
    email: "juan.cruz@email.com",
    address: "Calle 25 # 3-12",
    neighborhood: "La Macarena",
    status: "Confirmado",
    priority: "Alta",
    support: 86,
    visits: 4,
    lat: 4.6107,
    lng: -74.0686,
    notes: "Líder comunitario, traer material impreso.",
  },
  {
    id: "v-019",
    name: "Sofía Salazar",
    documentType: "Cédula de extranjería",
    documentNumber: "CE10988765",
    phone: "+57 301 889 7711",
    email: "",
    address: "Carrera 6 # 10-22",
    neighborhood: "La Candelaria",
    status: "Pendiente",
    priority: "Media",
    support: 58,
    visits: 0,
    lat: 4.5981,
    lng: -74.0758,
    notes: "Contactar por WhatsApp.",
  },
  {
    id: "v-110",
    name: "Andrés Pineda",
    documentType: "Cédula de ciudadanía",
    documentNumber: "80123456",
    phone: "+57 318 555 9090",
    email: "andres.pineda@email.com",
    address: "Calle 121 # 7-45",
    neighborhood: "Usaquén",
    status: "Confirmado",
    priority: "Alta",
    support: 77,
    visits: 2,
    lat: 4.7056,
    lng: -74.0304,
    notes: "Disponible sábado en la mañana.",
  },
];

let voters = [...initialVoters];

export function listVoters() {
  return voters;
}

export function addVoter(input: Omit<Voter, "id"> & { id?: string }) {
  const newVoter: Voter = {
    id: input.id ?? crypto.randomUUID(),
    ...input,
  };
  voters = [newVoter, ...voters];
  return newVoter;
}

export function updateVoter(id: string, updates: Partial<Omit<Voter, "id">>) {
  const index = voters.findIndex((voter) => voter.id === id);
  if (index === -1) {
    return null;
  }
  voters[index] = { ...voters[index], ...updates };
  return voters[index];
}

export function deleteVoter(id: string) {
  const exists = voters.some((voter) => voter.id === id);
  voters = voters.filter((voter) => voter.id !== id);
  return exists;
}
