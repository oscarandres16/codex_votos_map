"use client";

import { useEffect, useMemo, useState } from "react";
import { ConfirmDeleteModal } from "@/components/modals/ConfirmDeleteModal";
import colombiaData from "@/data/colombia.json";
import type { PollingZone } from "@/lib/polling-zones";
import { POLLING_ZONES_KEY } from "@/lib/polling-zones";
import type { Voter } from "@/lib/voters-store";

type ColombiaDept = {
  id: number;
  departamento: string;
  ciudades: string[];
};

const STORAGE_KEY = POLLING_ZONES_KEY;
const VOTERS_KEY = "votantes-data";

const emptyForm: Omit<PollingZone, "id"> = {
  name: "",
  mesas: 1,
  departamento: "",
  municipio: "",
};

const loadZones = () => {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as PollingZone[];
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

export default function ZonasVotacionPage() {
  const [zones, setZones] = useState<PollingZone[]>([]);
  const [voters, setVoters] = useState<Voter[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PollingZone | null>(null);

  const departamentos = useMemo(
    () => (colombiaData as ColombiaDept[]).map((item) => item.departamento),
    [],
  );

  const municipios = useMemo(() => {
    const dept = (colombiaData as ColombiaDept[]).find(
      (item) => item.departamento === form.departamento,
    );
    return dept?.ciudades ?? [];
  }, [form.departamento]);

  useEffect(() => {
    if (!form.departamento) return;
    if (municipios.includes(form.municipio)) return;
    setForm((prev) => ({ ...prev, municipio: "" }));
  }, [form.departamento, form.municipio, municipios]);

  useEffect(() => {
    setZones(loadZones());
  }, []);

  useEffect(() => {
    setVoters(loadVoters());
  }, []);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) setZones(loadZones());
      if (event.key === VOTERS_KEY) setVoters(loadVoters());
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const persistZones = (next: PollingZone[]) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const totals = useMemo(() => zones.length, [zones]);

  const zonesByDept = useMemo(() => {
    const map = new Map<string, Map<string, PollingZone[]>>();
    zones.forEach((zone) => {
      if (!map.has(zone.departamento)) {
        map.set(zone.departamento, new Map());
      }
      const muniMap = map.get(zone.departamento)!;
      if (!muniMap.has(zone.municipio)) {
        muniMap.set(zone.municipio, []);
      }
      muniMap.get(zone.municipio)!.push(zone);
    });
    return map;
  }, [zones]);

  const votersByZone = useMemo(() => {
    const map = new Map<string, Voter[]>();
    voters.forEach((voter) => {
      if (!voter.pollingZoneId) return;
      const list = map.get(voter.pollingZoneId) ?? [];
      list.push(voter);
      map.set(voter.pollingZoneId, list);
    });
    return map;
  }, [voters]);

  const openCreate = () => {
    setMode("create");
    setEditingId(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const openEdit = (zone: PollingZone) => {
    setMode("edit");
    setEditingId(zone.id);
    setForm({
      name: zone.name,
      mesas: zone.mesas,
      departamento: zone.departamento,
      municipio: zone.municipio,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    if (!form.departamento.trim() || !form.municipio.trim()) return;
    const payload: PollingZone = {
      id: editingId ?? crypto.randomUUID(),
      name: form.name.trim(),
      mesas: Math.max(1, Number(form.mesas) || 1),
      departamento: form.departamento.trim(),
      municipio: form.municipio.trim(),
    };
    setZones((prev) => {
      const next =
        mode === "edit"
          ? prev.map((item) => (item.id === payload.id ? payload : item))
          : [payload, ...prev];
      persistZones(next);
      return next;
    });
    setIsModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    setZones((prev) => {
      const next = prev.filter((item) => item.id !== deleteTarget.id);
      persistZones(next);
      return next;
    });
    setVoters((prev) => {
      const next = prev.map((voter) =>
        voter.pollingZoneId === deleteTarget.id
          ? { ...voter, pollingZoneId: undefined }
          : voter,
      );
      window.localStorage.setItem(VOTERS_KEY, JSON.stringify(next));
      return next;
    });
    setDeleteTarget(null);
  };

  return (
    <div className="min-h-screen bg-[var(--background)] px-8 py-10 text-foreground">
      <div className="rounded-3xl border border-white/10 bg-[var(--panel)]/80 p-10">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl font-semibold">Puestos de votación</h1>
            <p className="mt-2 text-sm text-white/60">
              Árbol de departamentos, municipios, puestos, mesas y votantes.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-white/60">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">
              Total: {totals}
            </span>
            <button
              type="button"
              onClick={openCreate}
              className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs text-white/80 hover:border-white/30 hover:bg-white/20"
            >
              <span className="flex items-center gap-2">
                <span className="material-symbols-rounded text-[18px]">
                  add
                </span>
                Nuevo puesto
              </span>
            </button>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          {zones.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
              No hay puestos de votación registrados.
            </div>
          ) : (
            Array.from(zonesByDept.entries()).map(([departamento, muniMap]) => (
              <details
                key={departamento}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                open
              >
                <summary className="cursor-pointer text-sm font-semibold text-white">
                  {departamento}
                </summary>
                <div className="mt-3 space-y-3 pl-4">
                  {Array.from(muniMap.entries()).map(([municipio, puestos]) => (
                    <details
                      key={`${departamento}-${municipio}`}
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                      open
                    >
                      <summary className="cursor-pointer text-sm text-white/80">
                        {municipio}
                      </summary>
                      <div className="mt-3 space-y-3 pl-4">
                        {puestos.map((puesto) => {
                          const assignedVoters =
                            votersByZone.get(puesto.id) ?? [];
                          const mesas = Array.from(
                            { length: Math.max(1, puesto.mesas) },
                            (_, idx) => idx + 1,
                          );
                          const withoutMesa = assignedVoters.filter(
                            (voter) => !voter.mesa,
                          );
                          return (
                            <details
                              key={puesto.id}
                              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                            >
                              <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm text-white">
                                <span>
                                  {puesto.name} · Mesas {puesto.mesas}
                                </span>
                                <span className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => openEdit(puesto)}
                                    className="p-2 text-white/70 hover:text-white"
                                    aria-label="Editar puesto"
                                  >
                                    <span className="material-symbols-rounded text-[18px]">
                                      edit
                                    </span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeleteTarget(puesto)}
                                    className="p-2 text-rose-200 hover:text-rose-100"
                                    aria-label="Eliminar puesto"
                                  >
                                    <span className="material-symbols-rounded text-[18px]">
                                      delete
                                    </span>
                                  </button>
                                </span>
                              </summary>
                              <div className="mt-3 space-y-3 pl-4">
                                {mesas.map((mesa) => {
                                  const mesaVoters = assignedVoters.filter(
                                    (voter) => voter.mesa === mesa,
                                  );
                                  return (
                                    <details
                                      key={`${puesto.id}-mesa-${mesa}`}
                                      className="rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                                    >
                                      <summary className="cursor-pointer text-xs text-white/70">
                                        Mesa {mesa} · {mesaVoters.length}{" "}
                                        votantes
                                      </summary>
                                      <div className="mt-2 space-y-1 pl-3 text-xs text-white/60">
                                        {mesaVoters.length === 0 ? (
                                          <p>Sin votantes asignados.</p>
                                        ) : (
                                          mesaVoters.map((voter) => (
                                            <p key={voter.id}>
                                              {voter.name}
                                            </p>
                                          ))
                                        )}
                                      </div>
                                    </details>
                                  );
                                })}
                                {withoutMesa.length > 0 ? (
                                  <details className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2">
                                    <summary className="cursor-pointer text-xs text-amber-200">
                                      Sin mesa asignada · {withoutMesa.length}
                                    </summary>
                                    <div className="mt-2 space-y-1 pl-3 text-xs text-amber-100/80">
                                      {withoutMesa.map((voter) => (
                                        <p key={voter.id}>{voter.name}</p>
                                      ))}
                                    </div>
                                  </details>
                                ) : null}
                              </div>
                            </details>
                          );
                        })}
                      </div>
                    </details>
                  ))}
                </div>
              </details>
            ))
          )}
        </div>
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/70 p-6">
          <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-[var(--panel-strong)]/95 p-6 text-white shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                  {mode === "create" ? "Nuevo puesto" : "Editar puesto"}
                </p>
                <h3 className="font-[var(--font-display)] text-xl text-white">
                  Información del puesto
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <label className="text-xs text-white/60">
                Nombre
                <input
                  value={form.name}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-[var(--accent)] focus:outline-none"
                />
              </label>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="text-xs text-white/60">
                  Mesas
                  <input
                    type="number"
                    min={1}
                    value={form.mesas}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        mesas: Number(event.target.value),
                      }))
                    }
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-[var(--accent)] focus:outline-none"
                  />
                </label>
                <label className="text-xs text-white/60">
                  Departamento
                  <select
                    value={form.departamento}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        departamento: event.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-[var(--accent)] focus:outline-none"
                  >
                    <option className="text-black" value="">
                      Selecciona un departamento
                    </option>
                    {departamentos.map((dept) => (
                      <option key={dept} className="text-black" value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs text-white/60 md:col-span-2">
                  Municipio
                  <select
                    value={form.municipio}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        municipio: event.target.value,
                      }))
                    }
                    disabled={!form.departamento}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-[var(--accent)] focus:outline-none"
                  >
                    <option className="text-black" value="">
                      {form.departamento
                        ? "Selecciona un municipio"
                        : "Selecciona primero un departamento"}
                    </option>
                    {municipios.map((city) => (
                      <option key={city} className="text-black" value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <div className="-mx-6 mt-6 flex justify-end gap-2 border-t border-white/10 bg-[var(--panel-strong)]/95 px-6 py-4">
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/70"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                className="rounded-full bg-[var(--accent)]/20 px-5 py-2 text-sm font-semibold text-[var(--accent)] transition hover:bg-[var(--accent)]/30"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmDeleteModal
        isOpen={Boolean(deleteTarget)}
        title="¿Eliminar puesto?"
        description={
          deleteTarget?.name
            ? `Se eliminará definitivamente el puesto ${deleteTarget.name}.`
            : "Esta acción no se puede deshacer."
        }
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
