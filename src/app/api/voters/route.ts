import { addVoter, listVoters } from "@/lib/voters-store";

export async function GET() {
  return Response.json({ voters: listVoters() });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    name: string;
    documentType: string;
    documentNumber: string;
    phone: string;
    email?: string;
    address: string;
    locationLink?: string;
    neighborhood: string;
    status: "Confirmado" | "Pendiente" | "En revisión";
    priority: "Alta" | "Media" | "Baja";
    support: number;
    visits: number;
    lat: number;
    lng: number;
    notes: string;
  };

  if (
    !body?.name ||
    !body?.documentType ||
    !body?.documentNumber ||
    !body?.phone ||
    !body?.address ||
    !body?.neighborhood
  ) {
    return Response.json({ message: "Datos incompletos" }, { status: 400 });
  }

  const newVoter = addVoter(body);
  return Response.json({ voter: newVoter }, { status: 201 });
}
