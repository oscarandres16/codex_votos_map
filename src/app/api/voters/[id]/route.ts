import { deleteVoter, updateVoter } from "@/lib/voters-store";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const updates = (await request.json()) as Record<string, unknown>;
  const voter = updateVoter(params.id, updates);

  if (!voter) {
    return Response.json({ message: "Votante no encontrado" }, { status: 404 });
  }

  return Response.json({ voter });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const deleted = deleteVoter(params.id);
  if (!deleted) {
    return Response.json({ message: "Votante no encontrado" }, { status: 404 });
  }

  return Response.json({ ok: true });
}
