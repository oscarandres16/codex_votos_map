"use client";

import type { Dispatch, SetStateAction } from "react";
import type { VoterPriority, VoterStatus } from "@/lib/voters-store";
import type { Leader } from "@/lib/leaders-store";
import type { PollingZone } from "@/lib/polling-zones";
import type { FormMode, FormState } from "@/lib/form-types";

export function VoterModal({
  isOpen,
  mode,
  form,
  setForm,
  requestCloseModal,
  applyLocationLink,
  locationLinkError,
  onPickLocationMode,
  onSubmit,
  saving,
  leaders,
  pollingZones,
}: {
  isOpen: boolean;
  mode: FormMode;
  form: FormState;
  setForm: Dispatch<SetStateAction<FormState>>;
  requestCloseModal: () => void;
  applyLocationLink: (link: string) => void;
  locationLinkError: string;
  onPickLocationMode: () => void;
  onSubmit: () => void;
  saving: boolean;
  leaders: Leader[];
  pollingZones: PollingZone[];
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/60 p-6">
      <div className="w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-3xl border border-white/10 bg-[var(--panel-strong)]/95 p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/70">
              {mode === "create" ? "Nuevo votante" : "Editar votante"}
            </p>
            <h3 className="font-[var(--font-display)] text-xl text-white">
              Información principal
            </h3>
          </div>
          <button
            onClick={requestCloseModal}
            className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70"
          >
            Cerrar
          </button>
        </div>

        <div className="modal-scroll mt-5 max-h-[calc(85vh-190px)] overflow-y-auto pr-3">
          <div className="space-y-5">
            <div className="space-y-3">
              <p className="text-[11px] uppercase tracking-[0.35em] text-white/40">
                Identificación
              </p>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="text-xs text-white/60 md:col-span-2">
                  Nombre completo
                  <input
                    value={form.name}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        name: event.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-emerald-400/60 focus:outline-none"
                  />
                </label>
                <label className="text-xs text-white/60">
                  Tipo de documento
                  <select
                    value={form.documentType}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        documentType: event.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-emerald-400/60 focus:outline-none"
                  >
                    <option className="text-black" value="Cédula de ciudadanía">
                      Cédula de ciudadanía
                    </option>
                    <option className="text-black" value="Cédula de extranjería">
                      Cédula de extranjería
                    </option>
                    <option className="text-black" value="Pasaporte">
                      Pasaporte
                    </option>
                    <option className="text-black" value="Tarjeta de identidad">
                      Tarjeta de identidad
                    </option>
                  </select>
                </label>
                <label className="text-xs text-white/60">
                  Número de documento
                  <input
                    value={form.documentNumber}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        documentNumber: event.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-emerald-400/60 focus:outline-none"
                  />
                </label>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[11px] uppercase tracking-[0.35em] text-white/40">
                Contacto
              </p>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="text-xs text-white/60">
                  Teléfono
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        phone: event.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-emerald-400/60 focus:outline-none"
                  />
                </label>
                <label className="text-xs text-white/60">
                  Correo (opcional)
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        email: event.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-emerald-400/60 focus:outline-none"
                  />
                </label>
                <label className="text-xs text-white/60 md:col-span-2">
                  Dirección
                  <input
                    value={form.address}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        address: event.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-emerald-400/60 focus:outline-none"
                  />
                </label>
                <label className="text-xs text-white/60">
                  Barrio
                  <input
                    value={form.neighborhood}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        neighborhood: event.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-emerald-400/60 focus:outline-none"
                  />
                </label>
                <label className="text-xs text-white/60 md:col-span-2">
                  Enlace de Google Maps (opcional)
                  <div className="mt-2 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                    <input
                      value={form.locationLink}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          locationLink: event.target.value,
                        }))
                      }
                      onBlur={(event) => applyLocationLink(event.target.value)}
                      className="w-full bg-transparent text-sm text-white focus:outline-none"
                      placeholder="https://maps.google.com/..."
                    />
                    <button
                      type="button"
                      onClick={() => applyLocationLink(form.locationLink)}
                      className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-white/70 hover:border-white/30"
                    >
                      Usar
                    </button>
                  </div>
                  {locationLinkError ? (
                    <p className="mt-2 text-[11px] text-rose-200">
                      {locationLinkError}
                    </p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-white/50">
                    <span>
                      Coordenadas actuales: {form.lat.toFixed(4)},{" "}
                      {form.lng.toFixed(4)}
                    </span>
                    <button
                      type="button"
                      onClick={onPickLocationMode}
                      className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-[11px] text-emerald-100 hover:bg-emerald-500/20"
                    >
                      Seleccionar en mapa
                    </button>
                  </div>
                </label>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[11px] uppercase tracking-[0.35em] text-white/40">
                Gestión
              </p>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="text-xs text-white/60 md:col-span-2">
                  Líder político (opcional)
                  <select
                    value={form.leaderId}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        leaderId: event.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-emerald-400/60 focus:outline-none"
                  >
                    <option className="text-black" value="">
                      Sin líder asignado
                    </option>
                    {leaders.map((leader) => (
                      <option
                        key={leader.id}
                        className="text-black"
                        value={leader.id}
                      >
                        {leader.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs text-white/60">
                  Estado
                  <select
                    value={form.status}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        status: event.target.value as VoterStatus,
                      }))
                    }
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-emerald-400/60 focus:outline-none"
                  >
                    <option className="text-black" value="Confirmado">
                      Confirmado
                    </option>
                    <option className="text-black" value="Pendiente">
                      Pendiente
                    </option>
                    <option className="text-black" value="En revisión">
                      En revisión
                    </option>
                  </select>
                </label>
                <label className="text-xs text-white/60 md:col-span-2">
                  Puesto de votación (opcional)
                  <select
                    value={form.pollingZoneId}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        pollingZoneId: event.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-emerald-400/60 focus:outline-none"
                  >
                    <option className="text-black" value="">
                      Sin puesto asignado
                    </option>
                    {pollingZones.map((zone) => (
                      <option
                        key={zone.id}
                        className="text-black"
                        value={zone.id}
                      >
                        {zone.name} · {zone.municipio}, {zone.departamento}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs text-white/60">
                  Mesa
                  <input
                    type="number"
                    min={0}
                    value={form.mesa}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        mesa: Number(event.target.value),
                      }))
                    }
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-emerald-400/60 focus:outline-none"
                  />
                </label>
                <label className="text-xs text-white/60">
                  Prioridad
                  <select
                    value={form.priority}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        priority: event.target.value as VoterPriority,
                      }))
                    }
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-emerald-400/60 focus:outline-none"
                  >
                    <option className="text-black" value="Alta">
                      Alta
                    </option>
                    <option className="text-black" value="Media">
                      Media
                    </option>
                    <option className="text-black" value="Baja">
                      Baja
                    </option>
                  </select>
                </label>
                <label className="text-xs text-white/60">
                  Afinidad (%)
                  <input
                    type="number"
                    value={form.support}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        support: Number(event.target.value),
                      }))
                    }
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-emerald-400/60 focus:outline-none"
                  />
                </label>
                <label className="text-xs text-white/60">
                  Visitas
                  <input
                    type="number"
                    value={form.visits}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        visits: Number(event.target.value),
                      }))
                    }
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-emerald-400/60 focus:outline-none"
                  />
                </label>
                <label className="text-xs text-white/60 md:col-span-2">
                  Notas
                  <textarea
                    value={form.notes}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        notes: event.target.value,
                      }))
                    }
                    rows={3}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-emerald-400/60 focus:outline-none"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="-mx-6 mt-5 flex justify-end gap-2 border-t border-white/10 bg-[var(--panel-strong)]/95 px-6 py-4">
          <button
            onClick={requestCloseModal}
            className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/70"
          >
            Cancelar
          </button>
          <button
            onClick={onSubmit}
            disabled={saving}
            className="rounded-full bg-emerald-400/20 px-5 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-400/30 disabled:opacity-60"
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
