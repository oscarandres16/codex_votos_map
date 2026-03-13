import type { VoterPriority, VoterStatus } from "@/lib/voters-store";

export type FormMode = "create" | "edit";

export type FormState = {
  name: string;
  documentType: string;
  documentNumber: string;
  phone: string;
  email: string;
  address: string;
  locationLink: string;
  neighborhood: string;
  status: VoterStatus;
  priority: VoterPriority;
  support: number;
  visits: number;
  lat: number;
  lng: number;
  notes: string;
  leaderId: string;
  zoneId: string;
  mesa: number;
  pollingZoneId: string;
};
