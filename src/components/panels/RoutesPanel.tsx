"use client";

import type { Voter } from "@/lib/voters-store";

type SavedRoute = {
  id: string;
  name: string;
  date?: string;
  time?: string;
  stops: string[];
};

export function RoutesPanel({
  isOpen,
  onShow,
  onHide,
  routeStopVoters,
  routeStops,
  selectedId,
  routeCandidate,
  setRouteCandidate,
  routeSuggestions,
  routeName,
  setRouteName,
  routeDate,
  setRouteDate,
  routeTime,
  setRouteTime,
  savedRoutes,
  addRouteStop,
  moveRouteStop,
  removeRouteStop,
  clearRoute,
  saveCurrentRoute,
  loadSavedRoute,
  deleteSavedRoute,
  onDragStart,
  onDragEnd,
  onDropOnRoute,
}: {
  isOpen: boolean;
  onShow: () => void;
  onHide: () => void;
  routeStopVoters: Voter[];
  routeStops: string[];
  selectedId: string | null;
  routeCandidate: string;
  setRouteCandidate: (value: string) => void;
  routeSuggestions: Voter[];
  routeName: string;
  setRouteName: (value: string) => void;
  routeDate: string;
  setRouteDate: (value: string) => void;
  routeTime: string;
  setRouteTime: (value: string) => void;
  savedRoutes: SavedRoute[];
  addRouteStop: (id: string) => void;
  moveRouteStop: (id: string, direction: "up" | "down") => void;
  removeRouteStop: (id: string) => void;
  clearRoute: () => void;
  saveCurrentRoute: () => void;
  loadSavedRoute: (id: string) => void;
  deleteSavedRoute: (id: string) => void;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onDropOnRoute: (id: string) => void;
}) {
  if (!isOpen) {
    return (
      <button
        onClick={onShow}
        className="pointer-events-auto absolute top-6 right-6 z-40 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[11px] text-white shadow-xl backdrop-blur"
      >
        Mostrar rutas
      </button>
    );
  }

  return (
    <div className="pointer-events-auto absolute top-6 right-6 z-40 w-[320px] rounded-3xl border border-white/10 bg-[var(--panel-strong)]/95 p-4 text-sm text-white shadow-2xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase text-white/40 tracking-[0.35em]">
            Rutas de visita
          </p>
          <p className="text-lg font-semibold">Orden actual</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={clearRoute}
            className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-white/70 hover:border-white/40"
          >
            Limpiar
          </button>
          <button
            onClick={onHide}
            className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-white/70 hover:border-white/40"
          >
            Ocultar
          </button>
        </div>
      </div>
      <div className="mt-3 max-h-[60vh] space-y-2 overflow-y-auto pr-1">
        {routeStopVoters.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/20 bg-white/5 px-3 py-2 text-xs text-white/50">
            Agrega votantes para trazar la ruta
          </p>
        ) : (
          routeStopVoters.map((voter, index) => (
            <div
              key={voter.id}
              draggable
              onDragStart={() => onDragStart(voter.id)}
              onDragEnd={onDragEnd}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => onDropOnRoute(voter.id)}
              className="flex items-start justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-2 hover:cursor-grab"
            >
              <div className="mr-3 flex h-8 w-2 items-center justify-center">
                <div className="h-2 w-full rounded-full bg-white/50" />
                <div className="mt-1 h-2 w-full rounded-full bg-white/50" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-[12px] font-semibold">
                  {index + 1}. {voter.name}
                </p>
                <p className="text-[11px] text-white/60">
                  {voter.neighborhood}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="flex gap-1">
                  <button
                    onClick={() => moveRouteStop(voter.id, "up")}
                    disabled={index === 0}
                    className="rounded-full border border-white/10 px-2 text-[10px] text-white/50 disabled:text-white/20"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveRouteStop(voter.id, "down")}
                    disabled={index === routeStopVoters.length - 1}
                    className="rounded-full border border-white/10 px-2 text-[10px] text-white/50 disabled:text-white/20"
                  >
                    ↓
                  </button>
                </div>
                <button
                  onClick={() => removeRouteStop(voter.id)}
                  className="rounded-full border border-rose-400/40 px-2 text-[10px] text-rose-200"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="mt-4 space-y-2">
        <button
          onClick={() => addRouteStop(selectedId ?? "")}
          disabled={!selectedId || routeStops.includes(selectedId)}
          className="w-full rounded-full border border-white/10 bg-emerald-500/10 px-3 py-2 text-[11px] font-semibold text-emerald-100 transition hover:bg-emerald-500/20 disabled:opacity-50"
        >
          Agregar votante seleccionado
        </button>
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              value={routeCandidate}
              onChange={(event) => setRouteCandidate(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  if (routeCandidate && !routeStops.includes(routeCandidate)) {
                    addRouteStop(routeCandidate);
                    setRouteCandidate("");
                  }
                }
              }}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white focus:border-emerald-400/60 focus:outline-none"
              placeholder="Busca por nombre o barrio"
            />
            <button
              onClick={() => {
                if (routeCandidate && !routeStops.includes(routeCandidate)) {
                  addRouteStop(routeCandidate);
                  setRouteCandidate("");
                }
              }}
              disabled={!routeCandidate || routeStops.includes(routeCandidate)}
              className="rounded-full border border-white/10 px-3 py-2 text-[11px] text-white/70 hover:border-white/40 disabled:opacity-50"
            >
              Agregar
            </button>
          </div>
          {routeSuggestions.length > 0 ? (
            <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] text-white/70">
              {routeSuggestions.map((voter) => (
                <button
                  key={voter.id}
                  onClick={() => {
                    addRouteStop(voter.id);
                    setRouteCandidate("");
                  }}
                  className="w-full text-left hover:text-white"
                >
                  {voter.name} · {voter.neighborhood}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <input
            value={routeName}
            onChange={(event) => setRouteName(event.target.value)}
            placeholder="Nombre de la ruta"
            className="col-span-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white focus:border-emerald-400/60 focus:outline-none"
          />
          <input
            type="date"
            value={routeDate}
            onChange={(event) => setRouteDate(event.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white focus:border-emerald-400/60 focus:outline-none"
          />
          <input
            type="time"
            value={routeTime}
            onChange={(event) => setRouteTime(event.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white focus:border-emerald-400/60 focus:outline-none"
          />
          <button
            onClick={saveCurrentRoute}
            disabled={routeStops.length === 0}
            className="rounded-full border border-white/10 bg-emerald-500/10 px-3 py-2 text-[11px] font-semibold text-emerald-100 transition hover:bg-emerald-500/20 disabled:opacity-50"
          >
            Guardar ruta
          </button>
        </div>
        {savedRoutes.length > 0 ? (
          <div className="space-y-2">
            <p className="text-[11px] uppercase text-white/40 tracking-[0.3em]">
              Rutas guardadas
            </p>
            {savedRoutes.map((route) => (
              <div
                key={route.id}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] text-white"
              >
                <div>
                  <p className="font-semibold">{route.name}</p>
                  <p className="text-white/60">
                    {route.date ?? "Fecha sin asignar"} ·{" "}
                    {route.time ?? "Hora sin asignar"}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 text-white/50">
                  <button
                    onClick={() => loadSavedRoute(route.id)}
                    className="text-[10px] hover:text-white"
                  >
                    Cargar
                  </button>
                  <button
                    onClick={() => deleteSavedRoute(route.id)}
                    className="text-[10px] text-rose-200 hover:text-white"
                  >
                    Borrar
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
