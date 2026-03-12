"use client";

type SearchResult = { display_name: string; lat: string; lon: string };

export function SearchModal({
  isOpen,
  query,
  onQueryChange,
  onSearch,
  searching,
  error,
  results,
  onSelectResult,
  onClose,
}: {
  isOpen: boolean;
  query: string;
  onQueryChange: (value: string) => void;
  onSearch: (value: string) => void;
  searching: boolean;
  error: string;
  results: SearchResult[];
  onSelectResult: (result: SearchResult) => void;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/70 backdrop-blur"
      onClick={onClose}
    >
      <div className="w-full max-w-xl px-6">
        <div
          className="rounded-3xl border border-white/10 bg-[var(--panel-strong)]/95 p-4 shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-3">
            <svg
              className="h-4 w-4 text-emerald-200"
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
            <input
              autoFocus
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  onSearch(query);
                }
                if (event.key === "Escape") {
                  onClose();
                }
              }}
              className="w-full bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
              placeholder="Buscar municipio o ciudad"
            />
            <button
              onClick={() => onSearch(query)}
              disabled={searching}
              className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-white/70 hover:border-white/30 disabled:opacity-60"
            >
              {searching ? "..." : "Buscar"}
            </button>
          </div>
          {error ? (
            <p className="mt-3 text-xs text-rose-200">{error}</p>
          ) : null}
          {results.length > 0 ? (
            <div className="mt-3 max-h-64 overflow-auto rounded-2xl border border-white/10 bg-white/5">
              {results.map((result) => (
                <button
                  key={`${result.lat}-${result.lon}-${result.display_name}`}
                  onClick={() => onSelectResult(result)}
                  className="w-full px-4 py-3 text-left text-xs text-white/70 hover:bg-white/10"
                >
                  {result.display_name}
                </button>
              ))}
            </div>
          ) : null}
          <div className="mt-3 flex justify-end">
            <button
              onClick={onClose}
              className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-white/60 hover:border-white/30"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
