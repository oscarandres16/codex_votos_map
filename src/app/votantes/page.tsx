"use client";

import { useEffect, useMemo, useState } from "react";
import type { Voter } from "@/lib/voters-store";
import type { Leader } from "@/lib/leaders-store";
import type { PollingZone } from "@/lib/polling-zones";
import { POLLING_ZONES_KEY } from "@/lib/polling-zones";
import type { FormMode, FormState } from "@/lib/form-types";
import { VoterModal } from "@/components/modals/VoterModal";
import { ConfirmDeleteModal } from "@/components/modals/ConfirmDeleteModal";

const STORAGE_KEY = "votantes-data";
const LEADERS_KEY = "votantes-leaders";
const POLLING_ZONES_STORAGE_KEY = POLLING_ZONES_KEY;

const loadVoters = () => {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Voter[];
  } catch {
    return [];
  }
};

const loadLeaders = () => {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(LEADERS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Leader[];
  } catch {
    return [];
  }
};

const loadPollingZones = () => {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(POLLING_ZONES_STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as PollingZone[];
  } catch {
    return [];
  }
};

const documentTypeAbbr: Record<string, string> = {
  "Cédula de ciudadanía": "CC",
  "Cédula de extranjería": "CE",
  Pasaporte: "PA",
};

const emptyForm: FormState = {
  name: "",
  documentType: "Cédula de ciudadanía",
  documentNumber: "",
  phone: "",
  email: "",
  address: "",
  locationLink: "",
  neighborhood: "",
  status: "Pendiente",
  priority: "Media",
  support: 50,
  visits: 0,
  lat: 4.65,
  lng: -74.07,
  notes: "",
  leaderId: "",
  zoneId: "",
  mesa: 0,
  pollingZoneId: "",
};

const parseLatLngFromMapsLink = (link: string) => {
  const trimmed = link.trim();
  if (!trimmed) return null;
  const urlText = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  try {
    const url = new URL(urlText);
    const query = url.searchParams.get("q") || url.searchParams.get("query");
    const ll = url.searchParams.get("ll") || url.searchParams.get("center");
    const candidate = query || ll || "";
    if (candidate) {
      const match = candidate.match(
        /(-?\d+(?:\.\d+)?)[,\s]+(-?\d+(?:\.\d+)?)/i,
      );
      if (match) return [Number(match[1]), Number(match[2])] as const;
    }
    const atMatch = url.pathname.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/i);
    if (atMatch) return [Number(atMatch[1]), Number(atMatch[2])] as const;
  } catch {
    return null;
  }
  return null;
};

export default function VotantesPage() {
  const [voters, setVoters] = useState<Voter[]>([]);
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [pollingZones, setPollingZones] = useState<PollingZone[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState<FormMode>("create");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [locationLinkError, setLocationLinkError] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Voter | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteIds, setBulkDeleteIds] = useState<string[] | null>(null);
  const [sortKey, setSortKey] = useState<
    | "name"
    | "documentNumber"
    | "neighborhood"
    | "status"
    | "priority"
    | "phone"
    | "support"
    | "visits"
  >("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    setVoters(loadVoters());
  }, []);

  useEffect(() => {
    setLeaders(loadLeaders());
  }, []);

  useEffect(() => {
    setPollingZones(loadPollingZones());
  }, []);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      setVoters(loadVoters());
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== LEADERS_KEY) return;
      setLeaders(loadLeaders());
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== POLLING_ZONES_STORAGE_KEY) return;
      setPollingZones(loadPollingZones());
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const totals = useMemo(() => {
    const total = voters.length;
    const confirmed = voters.filter((v) => v.status === "Confirmado").length;
    const pending = voters.filter((v) => v.status === "Pendiente").length;
    const review = voters.filter((v) => v.status === "En revisión").length;
    return { total, confirmed, pending, review };
  }, [voters]);

  const leadersById = useMemo(() => {
    const map = new Map<string, Leader>();
    leaders.forEach((leader) => map.set(leader.id, leader));
    return map;
  }, [leaders]);

  const sortedVoters = useMemo(() => {
    const next = [...voters];
    next.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      const getValue = (voter: Voter) => {
        switch (sortKey) {
          case "name":
            return voter.name.toLowerCase();
          case "documentNumber":
            return voter.documentNumber.toLowerCase();
          case "neighborhood":
            return voter.neighborhood.toLowerCase();
          case "status":
            return voter.status.toLowerCase();
          case "priority":
            return voter.priority.toLowerCase();
          case "phone":
            return voter.phone.toLowerCase();
          case "support":
            return voter.support;
          case "visits":
            return voter.visits;
          default:
            return "";
        }
      };
      const av = getValue(a);
      const bv = getValue(b);
      if (typeof av === "number" && typeof bv === "number") {
        return (av - bv) * dir;
      }
      return String(av).localeCompare(String(bv), "es", {
        sensitivity: "base",
        numeric: true,
      }) * dir;
    });
    return next;
  }, [voters, sortKey, sortDir]);

  useEffect(() => {
    setSelectedIds((prev) => {
      if (prev.size === 0) return prev;
      const next = new Set<string>();
      voters.forEach((voter) => {
        if (prev.has(voter.id)) next.add(voter.id);
      });
      return next;
    });
  }, [voters]);

  const persistVoters = (next: Voter[]) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const openCreate = () => {
    setMode("create");
    setEditingId(null);
    setForm(emptyForm);
    setLocationLinkError("");
    setIsModalOpen(true);
  };

  const openEdit = (voter: Voter) => {
    setMode("edit");
    setEditingId(voter.id);
    setForm({
      name: voter.name,
      documentType: voter.documentType,
      documentNumber: voter.documentNumber,
      phone: voter.phone,
      email: voter.email ?? "",
      address: voter.address,
      locationLink: voter.locationLink ?? "",
      neighborhood: voter.neighborhood,
      status: voter.status,
      priority: voter.priority,
      support: voter.support,
      visits: voter.visits,
      lat: voter.lat,
      lng: voter.lng,
      notes: voter.notes,
      leaderId: voter.leaderId ?? "",
      zoneId: voter.zoneId ?? "",
      mesa: voter.mesa ?? 0,
      pollingZoneId: voter.pollingZoneId ?? "",
    });
    setLocationLinkError("");
    setIsModalOpen(true);
  };

  const applyLocationLink = (link: string) => {
    if (!link.trim()) {
      setLocationLinkError("");
      return;
    }
    const coords = parseLatLngFromMapsLink(link);
    if (!coords) {
      setLocationLinkError("No pudimos leer las coordenadas del enlace.");
      return;
    }
    setForm((prev) => ({ ...prev, lat: coords[0], lng: coords[1] }));
    setLocationLinkError("");
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      if (mode === "create") {
        const nextVoter: Voter = {
          id: crypto.randomUUID(),
          name: form.name,
          documentType: form.documentType,
          documentNumber: form.documentNumber,
          phone: form.phone,
          email: form.email || undefined,
          address: form.address,
          locationLink: form.locationLink || undefined,
          neighborhood: form.neighborhood,
          status: form.status,
          priority: form.priority,
          support: form.support,
          visits: form.visits,
          lat: form.lat,
          lng: form.lng,
          notes: form.notes,
          leaderId: form.leaderId || undefined,
          zoneId: form.zoneId || undefined,
          mesa: form.mesa || undefined,
          pollingZoneId: form.pollingZoneId || undefined,
        };
        setVoters((prev) => {
          const next = [nextVoter, ...prev];
          persistVoters(next);
          return next;
        });
      } else if (editingId) {
        setVoters((prev) => {
          const next = prev.map((item) =>
            item.id === editingId
              ? {
                  ...item,
                  name: form.name,
                  documentType: form.documentType,
                  documentNumber: form.documentNumber,
                  phone: form.phone,
                  email: form.email || undefined,
                  address: form.address,
                  locationLink: form.locationLink || undefined,
                  neighborhood: form.neighborhood,
                  status: form.status,
                  priority: form.priority,
                  support: form.support,
                  visits: form.visits,
                  lat: form.lat,
                  lng: form.lng,
                  notes: form.notes,
                  leaderId: form.leaderId || undefined,
                  zoneId: form.zoneId || undefined,
                  mesa: form.mesa || undefined,
                  pollingZoneId: form.pollingZoneId || undefined,
                }
              : item,
          );
          persistVoters(next);
          return next;
        });
      }
      setIsModalOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRequest = (id: string) => {
    const voter = voters.find((item) => item.id === id) ?? null;
    setDeleteTarget(voter);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    setVoters((prev) => {
      const next = prev.filter((item) => item.id !== deleteTarget.id);
      persistVoters(next);
      return next;
    });
    setDeleteTarget(null);
  };

  const handleBulkDeleteRequest = () => {
    if (selectedIds.size === 0) return;
    setBulkDeleteIds(Array.from(selectedIds));
  };

  const handleConfirmBulkDelete = () => {
    if (!bulkDeleteIds || bulkDeleteIds.length === 0) return;
    setVoters((prev) => {
      const next = prev.filter((item) => !bulkDeleteIds.includes(item.id));
      persistVoters(next);
      return next;
    });
    setSelectedIds(new Set());
    setBulkDeleteIds(null);
  };

  const allSelected = voters.length > 0 && selectedIds.size === voters.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  const toggleAll = () => {
    setSelectedIds((prev) => {
      if (prev.size === voters.length) return new Set();
      return new Set(voters.map((voter) => voter.id));
    });
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const SortButton = ({
    label,
    sortId,
  }: {
    label: string;
    sortId: typeof sortKey;
  }) => {
    const active = sortKey === sortId;
    return (
      <button
        type="button"
        onClick={() => handleSort(sortId)}
        className={`flex items-center gap-1 text-[11px] uppercase tracking-wide ${
          active ? "text-white" : "text-white/50"
        }`}
      >
        {label}
        <span
          className={`material-symbols-rounded text-[14px] transition ${
            active ? "opacity-100" : "opacity-40"
          } ${active && sortDir === "desc" ? "rotate-180" : ""}`}
        >
          arrow_upward
        </span>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-[var(--background)] px-8 py-10 text-foreground">
      <div className="rounded-3xl border border-white/10 bg-[var(--panel)]/80 p-10">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl font-semibold">Votantes</h1>
            <p className="mt-2 text-sm text-white/60">
              Listado general de votantes registrados.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-white/60">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">
              Total: {totals.total}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">
              Confirmados: {totals.confirmed}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">
              Pendientes: {totals.pending}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">
              En revisión: {totals.review}
            </span>
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-3xl border border-white/10">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-white/5 px-4 py-3 text-xs text-white/60">
            <span>
              Seleccionados:{" "}
              <span className="text-white">{selectedIds.size}</span>
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={openCreate}
                className="rounded-full border border-white/10 bg-white/10 px-3 py-2 text-[11px] text-white/80 hover:border-white/30 hover:bg-white/20"
              >
                <span className="flex items-center gap-2">
                  <span className="material-symbols-rounded text-[18px]">
                    add
                  </span>
                  Nuevo votante
                </span>
              </button>
              <button
                type="button"
                onClick={handleBulkDeleteRequest}
                disabled={selectedIds.size === 0}
                className="rounded-full border border-rose-300/30 bg-rose-500/10 px-3 py-2 text-[11px] text-rose-100 hover:border-rose-300/60 hover:bg-rose-500/20 disabled:opacity-60"
              >
                Eliminar seleccionados
              </button>
            </div>
          </div>
          <div className="max-h-[70vh] overflow-auto">
            <table className="w-full min-w-[860px] border-collapse text-left text-xs text-white/70">
              <thead className="sticky top-0 bg-[var(--background)] text-[11px] uppercase tracking-wide text-white/50">
                <tr>
                  <th className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(node) => {
                        if (!node) return;
                        node.indeterminate = someSelected;
                      }}
                      onChange={toggleAll}
                      aria-label="Seleccionar todos"
                      className="h-4 w-4 accent-[var(--accent)]"
                    />
                  </th>
                  <th className="px-4 py-3">
                    <SortButton label="Nombre" sortId="name" />
                  </th>
                  <th className="px-4 py-3">
                    <SortButton label="Documento" sortId="documentNumber" />
                  </th>
                  <th className="px-4 py-3">
                    <SortButton label="Barrio" sortId="neighborhood" />
                  </th>
                  <th className="px-4 py-3">Líder</th>
                  <th className="px-4 py-3">
                    <SortButton label="Estado" sortId="status" />
                  </th>
                  <th className="px-4 py-3">
                    <SortButton label="Prioridad" sortId="priority" />
                  </th>
                  <th className="px-4 py-3">
                    <SortButton label="Teléfono" sortId="phone" />
                  </th>
                  <th className="px-4 py-3">
                    <SortButton label="Apoyo" sortId="support" />
                  </th>
                  <th className="px-4 py-3">
                    <SortButton label="Visitas" sortId="visits" />
                  </th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sortedVoters.map((voter) => (
                  <tr
                    key={voter.id}
                    className="border-t border-white/5 hover:bg-white/5"
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(voter.id)}
                        onChange={() => toggleOne(voter.id)}
                        aria-label={`Seleccionar ${voter.name}`}
                        className="h-4 w-4 accent-[var(--accent)]"
                      />
                    </td>
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
                    <td className="px-4 py-3">
                      {voter.leaderId
                        ? leadersById.get(voter.leaderId)?.name ?? "—"
                        : "—"}
                    </td>
                    <td className="px-4 py-3">{voter.status}</td>
                    <td className="px-4 py-3">{voter.priority}</td>
                    <td className="px-4 py-3">{voter.phone}</td>
                    <td className="px-4 py-3">{voter.support}%</td>
                    <td className="px-4 py-3">{voter.visits}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(voter)}
                          className="p-2 text-white/70 hover:text-white"
                          aria-label="Editar votante"
                        >
                          <span className="material-symbols-rounded text-[18px]">
                            edit
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteRequest(voter.id)}
                          className="p-2 text-rose-200 hover:text-rose-100"
                          aria-label="Eliminar votante"
                        >
                          <span className="material-symbols-rounded text-[18px]">
                            delete
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {voters.length === 0 ? (
                  <tr>
                    <td
                      className="px-4 py-10 text-center text-sm text-white/50"
                      colSpan={11}
                    >
                      No hay votantes cargados todavía.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <VoterModal
        isOpen={isModalOpen}
        mode={mode}
        form={form}
        setForm={setForm}
        requestCloseModal={() => setIsModalOpen(false)}
        applyLocationLink={applyLocationLink}
        locationLinkError={locationLinkError}
        onPickLocationMode={() =>
          setLocationLinkError(
            "La selección en mapa está disponible en el Dashboard.",
          )
        }
        onSubmit={handleSubmit}
        saving={saving}
        leaders={leaders}
        pollingZones={pollingZones}
      />

      <ConfirmDeleteModal
        isOpen={Boolean(deleteTarget)}
        title="¿Eliminar votante?"
        description={
          deleteTarget?.name
            ? `Se eliminará definitivamente a ${deleteTarget.name}.`
            : "Esta acción no se puede deshacer."
        }
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />

      <ConfirmDeleteModal
        isOpen={Boolean(bulkDeleteIds)}
        title="¿Eliminar seleccionados?"
        description={
          bulkDeleteIds && bulkDeleteIds.length > 0
            ? `Se eliminarán ${bulkDeleteIds.length} votantes de forma definitiva.`
            : "Esta acción no se puede deshacer."
        }
        onCancel={() => setBulkDeleteIds(null)}
        onConfirm={handleConfirmBulkDelete}
      />
    </div>
  );
}
