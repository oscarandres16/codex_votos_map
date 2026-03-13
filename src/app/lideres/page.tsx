"use client";

import { useEffect, useMemo, useState } from "react";
import type { Leader } from "@/lib/leaders-store";
import type { Voter } from "@/lib/voters-store";
import { ConfirmDeleteModal } from "@/components/modals/ConfirmDeleteModal";
import { LeaderModal, type LeaderForm } from "@/components/modals/LeaderModal";

const STORAGE_KEY = "votantes-leaders";
const VOTERS_KEY = "votantes-data";

const emptyForm: LeaderForm = {
  name: "",
  phone: "",
  zone: "",
  notes: "",
};

const documentTypeAbbr: Record<string, string> = {
  "Cédula de ciudadanía": "CC",
  "Cédula de extranjería": "CE",
  Pasaporte: "PA",
};

const loadLeaders = () => {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Leader[];
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

export default function LideresPage() {
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [voters, setVoters] = useState<Voter[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [form, setForm] = useState<LeaderForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Leader | null>(null);
  const [votersModalLeader, setVotersModalLeader] = useState<Leader | null>(
    null,
  );

  useEffect(() => {
    setLeaders(loadLeaders());
  }, []);

  useEffect(() => {
    setVoters(loadVoters());
  }, []);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      setLeaders(loadLeaders());
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== VOTERS_KEY) return;
      setVoters(loadVoters());
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const persistLeaders = (next: Leader[]) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const totals = useMemo(() => leaders.length, [leaders]);

  const votersByLeader = useMemo(() => {
    const map = new Map<string, Voter[]>();
    voters.forEach((voter) => {
      if (!voter.leaderId) return;
      const list = map.get(voter.leaderId) ?? [];
      list.push(voter);
      map.set(voter.leaderId, list);
    });
    return map;
  }, [voters]);

  const openCreate = () => {
    setMode("create");
    setEditingId(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const openEdit = (leader: Leader) => {
    setMode("edit");
    setEditingId(leader.id);
    setForm({
      name: leader.name,
      phone: leader.phone,
      zone: leader.zone,
      notes: leader.notes,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      if (mode === "create") {
        const nextLeader: Leader = {
          id: crypto.randomUUID(),
          name: form.name,
          phone: form.phone,
          zone: form.zone,
          notes: form.notes,
        };
        setLeaders((prev) => {
          const next = [nextLeader, ...prev];
          persistLeaders(next);
          return next;
        });
      } else if (editingId) {
        setLeaders((prev) => {
          const next = prev.map((item) =>
            item.id === editingId
              ? {
                  ...item,
                  name: form.name,
                  phone: form.phone,
                  zone: form.zone,
                  notes: form.notes,
                }
              : item,
          );
          persistLeaders(next);
          return next;
        });
      }
      setIsModalOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRequest = (id: string) => {
    const leader = leaders.find((item) => item.id === id) ?? null;
    setDeleteTarget(leader);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    setLeaders((prev) => {
      const next = prev.filter((item) => item.id !== deleteTarget.id);
      persistLeaders(next);
      return next;
    });
    setDeleteTarget(null);
  };

  const handleOpenVotersModal = (leader: Leader) => {
    setVotersModalLeader(leader);
  };

  return (
    <div className="min-h-screen bg-[var(--background)] px-8 py-10 text-foreground">
      <div className="rounded-3xl border border-white/10 bg-[var(--panel)]/80 p-10">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl font-semibold">Líderes políticos</h1>
            <p className="mt-2 text-sm text-white/60">
              Administra el directorio de líderes.
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
                Nuevo líder
              </span>
            </button>
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-3xl border border-white/10">
          <div className="max-h-[70vh] overflow-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-xs text-white/70">
              <thead className="sticky top-0 bg-[var(--background)] text-[11px] uppercase tracking-wide text-white/50">
                <tr>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Teléfono</th>
                  <th className="px-4 py-3">Zona</th>
                  <th className="px-4 py-3">Votantes</th>
                  <th className="px-4 py-3">Notas</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {leaders.map((leader) => {
                  const leaderVoters = votersByLeader.get(leader.id) ?? [];
                  const votersCount = leaderVoters.length;
                  return (
                    <tr
                      key={leader.id}
                      className="border-t border-white/5 hover:bg-white/5"
                    >
                      <td className="px-4 py-3 text-sm text-white">
                        {leader.name}
                      </td>
                      <td className="px-4 py-3">{leader.phone}</td>
                      <td className="px-4 py-3">{leader.zone}</td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => handleOpenVotersModal(leader)}
                          className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-white/70 hover:border-white/30 hover:text-white disabled:opacity-60"
                          aria-label={`Ver votantes de ${leader.name}`}
                          disabled={votersCount === 0}
                        >
                          {votersCount}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        {leader.notes ? leader.notes : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(leader)}
                          className="p-2 text-white/70 hover:text-white"
                          aria-label="Editar líder"
                        >
                          <span className="material-symbols-rounded text-[18px]">
                            edit
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteRequest(leader.id)}
                          className="p-2 text-rose-200 hover:text-rose-100"
                          aria-label="Eliminar líder"
                        >
                          <span className="material-symbols-rounded text-[18px]">
                            delete
                          </span>
                        </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {leaders.length === 0 ? (
                  <tr>
                    <td
                      className="px-4 py-10 text-center text-sm text-white/50"
                      colSpan={6}
                    >
                      No hay líderes cargados todavía.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <LeaderModal
        isOpen={isModalOpen}
        mode={mode}
        form={form}
        setForm={setForm}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        saving={saving}
      />

      <ConfirmDeleteModal
        isOpen={Boolean(deleteTarget)}
        title="¿Eliminar líder?"
        description={
          deleteTarget?.name
            ? `Se eliminará definitivamente a ${deleteTarget.name}.`
            : "Esta acción no se puede deshacer."
        }
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />

      {votersModalLeader ? (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/70 p-6">
          <div className="w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-[var(--panel-strong)]/95 p-6 text-white shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                  Votantes asignados
                </p>
                <h3 className="font-[var(--font-display)] text-xl text-white">
                  {votersModalLeader.name}
                </h3>
              </div>
              <button
                onClick={() => setVotersModalLeader(null)}
                className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-5 max-h-[60vh] overflow-auto rounded-2xl border border-white/10">
              <table className="w-full min-w-[640px] border-collapse text-left text-xs text-white/70">
                <thead className="sticky top-0 bg-[var(--background)] text-[11px] uppercase tracking-wide text-white/50">
                  <tr>
                    <th className="px-4 py-3">Nombre</th>
                    <th className="px-4 py-3">Documento</th>
                    <th className="px-4 py-3">Barrio</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3">Teléfono</th>
                  </tr>
                </thead>
                <tbody>
                  {(votersByLeader.get(votersModalLeader.id) ?? []).map(
                    (voter) => (
                      <tr
                        key={voter.id}
                        className="border-t border-white/5 hover:bg-white/5"
                      >
                        <td className="px-4 py-3 text-sm text-white">
                          {voter.name}
                        </td>
                        <td className="px-4 py-3">
                          {(documentTypeAbbr[voter.documentType] ??
                            voter.documentType) +
                            " " +
                            voter.documentNumber}
                        </td>
                        <td className="px-4 py-3">{voter.neighborhood}</td>
                        <td className="px-4 py-3">{voter.status}</td>
                        <td className="px-4 py-3">{voter.phone}</td>
                      </tr>
                    ),
                  )}
                  {(votersByLeader.get(votersModalLeader.id) ?? []).length ===
                  0 ? (
                    <tr>
                      <td
                        className="px-4 py-8 text-center text-sm text-white/50"
                        colSpan={5}
                      >
                        Este líder no tiene votantes asignados.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
