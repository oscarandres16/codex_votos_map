"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Zone } from "@/lib/zones-store";
import type { Voter } from "@/lib/voters-store";
import { ConfirmDeleteModal } from "@/components/modals/ConfirmDeleteModal";

const ZONES_KEY = "votantes-zones";
const VOTERS_KEY = "votantes-data";

const loadZones = () => {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(ZONES_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Zone[];
  } catch {
    return [];
  }
};

const loadVoters = () => {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(VOTERS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Voter[];
  } catch {
    return [];
  }
};

export default function ZonasPage() {
  const router = useRouter();
  const [zones, setZones] = useState<Zone[]>([]);
  const [voters, setVoters] = useState<Voter[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<Zone | null>(null);

  useEffect(() => {
    setZones(loadZones());
    setVoters(loadVoters());
  }, []);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === ZONES_KEY) setZones(loadZones());
      if (event.key === VOTERS_KEY) setVoters(loadVoters());
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const votersByZone = useMemo(() => {
    const counts: Record<string, number> = {};
    voters.forEach((voter) => {
      if (!voter.zoneId) return;
      counts[voter.zoneId] = (counts[voter.zoneId] ?? 0) + 1;
    });
    return counts;
  }, [voters]);

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    const nextZones = zones.filter((zone) => zone.id !== deleteTarget.id);
    window.localStorage.setItem(ZONES_KEY, JSON.stringify(nextZones));
    const nextVoters = voters.map((voter) =>
      voter.zoneId === deleteTarget.id ? { ...voter, zoneId: undefined } : voter,
    );
    window.localStorage.setItem(VOTERS_KEY, JSON.stringify(nextVoters));
    setZones(nextZones);
    setVoters(nextVoters);
    setDeleteTarget(null);
  };

  return (
    <div className="min-h-screen bg-[var(--background)] px-8 py-10 text-foreground">
      <div className="rounded-3xl border border-white/10 bg-[var(--panel)]/80 p-10">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl font-semibold">Zonas</h1>
            <p className="mt-2 text-sm text-white/60">
              Administración de zonas dibujadas en el mapa.
            </p>
          </div>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/60">
            Total: {zones.length}
          </span>
        </div>

        <div className="mt-8 overflow-hidden rounded-3xl border border-white/10">
          <div className="max-h-[70vh] overflow-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-xs text-white/70">
              <thead className="sticky top-0 bg-[var(--background)] text-[11px] uppercase tracking-wide text-white/50">
                <tr>
                  <th className="px-4 py-3">Zona</th>
                  <th className="px-4 py-3">Color</th>
                  <th className="px-4 py-3">Votantes</th>
                  <th className="px-4 py-3">Notas</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {zones.map((zone) => (
                  <tr
                    key={zone.id}
                    className="border-t border-white/5 hover:bg-white/5"
                  >
                    <td className="px-4 py-3 text-sm text-white">
                      {zone.name}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex h-4 w-4 rounded-full"
                        style={{ background: zone.color }}
                      />
                    </td>
                    <td className="px-4 py-3">
                      {votersByZone[zone.id] ?? 0}
                    </td>
                    <td className="px-4 py-3">
                      {zone.notes ? zone.notes : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            router.push(`/?zoneId=${zone.id}&zoneMode=view`)
                          }
                          className="p-2 text-white/70 hover:text-white"
                          aria-label="Ver zona"
                        >
                          <span className="material-symbols-rounded text-[18px]">
                            visibility
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            router.push(`/?zoneId=${zone.id}&zoneMode=edit`)
                          }
                          className="p-2 text-white/70 hover:text-white"
                          aria-label="Editar zona"
                        >
                          <span className="material-symbols-rounded text-[18px]">
                            edit
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(zone)}
                          className="p-2 text-rose-200 hover:text-rose-100"
                          aria-label="Eliminar zona"
                        >
                          <span className="material-symbols-rounded text-[18px]">
                            delete
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {zones.length === 0 ? (
                  <tr>
                    <td
                      className="px-4 py-10 text-center text-sm text-white/50"
                      colSpan={5}
                    >
                      No hay zonas creadas todavía.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ConfirmDeleteModal
        isOpen={Boolean(deleteTarget)}
        title="¿Eliminar zona?"
        description={
          deleteTarget?.name
            ? `Se eliminará definitivamente la zona ${deleteTarget.name}.`
            : "Esta acción no se puede deshacer."
        }
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
