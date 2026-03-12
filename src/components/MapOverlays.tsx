"use client";

type Stat = { label: string; value: number };

export function MapOverlays({
  selectedId,
  stats,
  locationLabel,
  locationDetail,
  pickMode,
}: {
  selectedId: string | null;
  stats: Stat[];
  locationLabel: string;
  locationDetail: string;
  pickMode: boolean;
}) {
  return (
    <>
      {!selectedId ? (
        <div className="absolute left-6 top-6 rounded-2xl border border-white/10 bg-[var(--panel-strong)]/95 p-5 text-sm text-white/70 pointer-events-auto">
          Selecciona un votante en la lista o en el mapa.
        </div>
      ) : null}

      <div className="absolute bottom-6 right-6 flex flex-col gap-3 pointer-events-auto">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white/70 backdrop-blur"
          >
            <p className="text-xs uppercase text-white/40">{stat.label}</p>
            <p className="text-lg font-semibold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="absolute bottom-6 left-6 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white/70 backdrop-blur pointer-events-auto">
        <p className="text-xs uppercase text-white/40">Ubicación actual</p>
        <p className="text-lg font-semibold text-white">{locationLabel}</p>
        {locationDetail ? (
          <p className="text-xs text-white/50">{locationDetail}</p>
        ) : null}
      </div>

      {pickMode ? (
        <div className="absolute left-1/2 top-6 -translate-x-1/2 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-4 py-2 text-xs text-emerald-100 backdrop-blur pointer-events-auto">
          Haz click en el mapa para seleccionar la ubicación. Esc para salir.
        </div>
      ) : null}
    </>
  );
}
