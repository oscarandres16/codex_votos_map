"use client";

type MapLayer = {
  id: string;
  label: string;
  url: string;
  attribution: string;
};

export function MapControls({
  interactionEnabled,
  onToggleInteraction,
  onSearchOpen,
  onLocate,
  locating,
  isMapMenuOpen,
  onToggleMapMenu,
  mapLayers,
  mapLayerIndex,
  onSelectMapLayer,
  onZoomOut,
  onZoomIn,
}: {
  interactionEnabled: boolean;
  onToggleInteraction: () => void;
  onSearchOpen: () => void;
  onLocate: () => void;
  locating: boolean;
  isMapMenuOpen: boolean;
  onToggleMapMenu: () => void;
  mapLayers: MapLayer[];
  mapLayerIndex: number;
  onSelectMapLayer: (index: number) => void;
  onZoomOut: () => void;
  onZoomIn: () => void;
}) {
  const activeMapLayer = mapLayers[mapLayerIndex];

  return (
    <div className="pointer-events-auto absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-[var(--panel-strong)]/90 px-3 py-2 text-xs text-white/70 shadow-xl backdrop-blur">
      <div className="flex items-center gap-2">
        <button
          onClick={onLocate}
          disabled={locating}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-sm text-white/70 hover:border-white/40 disabled:opacity-60"
          aria-label="Ir a mi ubicación"
          title="Mi ubicación (L)"
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="3.2" />
            <path d="M12 2v3.5M12 18.5V22M2 12h3.5M18.5 12H22" />
          </svg>
        </button>
        <button
          onClick={onSearchOpen}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-sm text-white/70 hover:border-white/40"
          aria-label="Buscar ubicación"
          title="Buscar ubicación (S)"
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="6.5" />
            <path d="M16.2 16.2 21 21" />
          </svg>
        </button>
        <button
          onClick={onToggleInteraction}
          className={`rounded-full px-3 py-1 text-[11px] font-semibold transition ${
            interactionEnabled
              ? "bg-emerald-400/20 text-emerald-100"
              : "bg-white/10 text-white/60"
          }`}
          title="Arrastrar mapa (N)"
        >
          <span className="inline-flex items-center gap-2">
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M7 12V6a1 1 0 0 1 2 0v6" />
              <path d="M11 12V5a1 1 0 0 1 2 0v7" />
              <path d="M15 12V6a1 1 0 0 1 2 0v8" />
              <path d="M19 13V9a1 1 0 0 1 2 0v6" />
              <path d="M3 14l4.5 4.5a4 4 0 0 0 2.83 1.17h3.34a4 4 0 0 0 3.2-1.6l2.13-2.84" />
            </svg>
            {interactionEnabled ? "Arrastrar activo" : "Arrastrar"}
          </span>
        </button>
        <div className="relative">
          <button
            onClick={onToggleMapMenu}
            className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-white/70 hover:border-white/40"
            title="Cambiar mapa (M)"
            aria-expanded={isMapMenuOpen}
          >
            Mapa: {activeMapLayer.label}
          </button>
          {isMapMenuOpen ? (
            <div className="absolute bottom-10 left-1/2 z-10 w-44 -translate-x-1/2 rounded-2xl border border-white/10 bg-[var(--panel-strong)]/95 p-2 text-[11px] text-white/70 shadow-xl backdrop-blur">
              {mapLayers.map((layer, index) => (
                <button
                  key={layer.id}
                  onClick={() => onSelectMapLayer(index)}
                  className={`w-full rounded-xl px-3 py-2 text-left transition ${
                    index === mapLayerIndex
                      ? "bg-emerald-400/20 text-emerald-100"
                      : "hover:bg-white/10"
                  }`}
                >
                  {layer.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <button
          onClick={onZoomOut}
          className="h-7 w-7 rounded-full border border-white/10 text-sm text-white/70 hover:border-white/40"
          title="Alejar (−)"
        >
          −
        </button>
        <button
          onClick={onZoomIn}
          className="h-7 w-7 rounded-full border border-white/10 text-sm text-white/70 hover:border-white/40"
          title="Acercar (+)"
        >
          +
        </button>
      </div>
      <div className="mt-2 flex items-center justify-center gap-2 text-[10px] uppercase text-white/40">
        <span>Atajos:</span>
        <span>L</span>
        <span>S</span>
        <span>N</span>
        <span>M</span>
        <span>-</span>
        <span>+</span>
      </div>
    </div>
  );
}
