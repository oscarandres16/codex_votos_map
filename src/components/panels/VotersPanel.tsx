"use client";

import type { Voter, VoterPriority, VoterStatus } from "@/lib/voters-store";

type Stats = {
  total: number;
  confirmed: number;
  pending: number;
  review: number;
};

export function VotersPanel({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  stats,
  loading,
  voters,
  selectedId,
  onSelect,
  onCreate,
  statusStyles,
  priorityStyles,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: "Todas" | VoterStatus;
  onStatusFilterChange: (value: "Todas" | VoterStatus) => void;
  stats: Stats;
  loading: boolean;
  voters: Voter[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  statusStyles: Record<VoterStatus, string>;
  priorityStyles: Record<VoterPriority, string>;
}) {
  return (
    <aside className="panel-scroll pointer-events-auto w-full max-w-full shrink-0 border-b border-white/10 bg-[var(--panel)]/95 p-6 backdrop-blur-xl lg:w-[360px] lg:border-b-0 lg:border-r lg:rounded-r-[28px]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/70">
            Panel de campo
          </p>
          <h1 className="font-[var(--font-display)] text-2xl text-white">
            Votantes activos
          </h1>
        </div>
        <button
          onClick={onCreate}
          className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-500/20"
        >
          Nuevo votante
        </button>
      </div>

      <div className="mt-6 space-y-3">
        <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70">
          <span className="text-emerald-200">⌕</span>
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            className="w-full bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
            placeholder="Buscar votante, barrio o ID"
          />
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          {(
            [
              { label: `Todos ${stats.total}`, value: "Todas" },
              { label: `Confirmados ${stats.confirmed}`, value: "Confirmado" },
              { label: `Pendientes ${stats.pending}`, value: "Pendiente" },
              { label: `En revisión ${stats.review}`, value: "En revisión" },
            ] as const
          ).map((tag) => (
            <button
              key={tag.value}
              onClick={() => onStatusFilterChange(tag.value)}
              className={`rounded-full border px-3 py-1 transition ${
                statusFilter === tag.value
                  ? "border-emerald-400/70 bg-emerald-500/20 text-emerald-100"
                  : "border-white/10 bg-white/5 text-white/60 hover:border-white/30"
              }`}
            >
              {tag.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
            Cargando votantes...
          </div>
        ) : voters.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
            No hay votantes para este filtro.
          </div>
        ) : (
          voters.map((voter) => {
            const isSelected = voter.id === selectedId;
            return (
              <button
                key={voter.id}
                onClick={() => onSelect(voter.id)}
                className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                  isSelected
                    ? "border-emerald-400/70 bg-emerald-500/10"
                    : "border-white/10 bg-white/5 hover:border-white/30"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {voter.name}
                    </p>
                    <p className="text-xs text-white/50">
                      {voter.neighborhood}
                    </p>
                  </div>
                  <span
                    className={`rounded-full border px-2 py-1 text-[10px] ${
                      statusStyles[voter.status]
                    }`}
                  >
                    {voter.status}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-white/60">
                  <span className={priorityStyles[voter.priority]}>
                    Prioridad {voter.priority}
                  </span>
                  <span>{voter.support}% afinidad</span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}
