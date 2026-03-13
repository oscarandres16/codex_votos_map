"use client";

import type { Dispatch, SetStateAction } from "react";

export type LeaderForm = {
  name: string;
  phone: string;
  zone: string;
  notes: string;
};

export function LeaderModal({
  isOpen,
  mode,
  form,
  setForm,
  onClose,
  onSubmit,
  saving,
}: {
  isOpen: boolean;
  mode: "create" | "edit";
  form: LeaderForm;
  setForm: Dispatch<SetStateAction<LeaderForm>>;
  onClose: () => void;
  onSubmit: () => void;
  saving: boolean;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/70 p-6">
      <div className="w-full max-w-xl overflow-hidden rounded-3xl border border-white/10 bg-[var(--panel-strong)]/95 p-6 text-white shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">
              {mode === "create" ? "Nuevo líder" : "Editar líder"}
            </p>
            <h3 className="font-[var(--font-display)] text-xl text-white">
              Información del líder
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70"
          >
            Cerrar
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <label className="text-xs text-white/60">
            Nombre completo
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
              Teléfono
              <input
                value={form.phone}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, phone: event.target.value }))
                }
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-[var(--accent)] focus:outline-none"
              />
            </label>
            <label className="text-xs text-white/60">
              Zona / Barrio
              <input
                value={form.zone}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, zone: event.target.value }))
                }
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-[var(--accent)] focus:outline-none"
              />
            </label>
          </div>
          <label className="text-xs text-white/60">
            Notas
            <textarea
              value={form.notes}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, notes: event.target.value }))
              }
              rows={3}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-[var(--accent)] focus:outline-none"
            />
          </label>
        </div>

        <div className="-mx-6 mt-6 flex justify-end gap-2 border-t border-white/10 bg-[var(--panel-strong)]/95 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/70"
          >
            Cancelar
          </button>
          <button
            onClick={onSubmit}
            disabled={saving}
            className="rounded-full bg-[var(--accent)]/20 px-5 py-2 text-sm font-semibold text-[var(--accent)] transition hover:bg-[var(--accent)]/30 disabled:opacity-60"
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
