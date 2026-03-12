"use client";

export function DiscardModal({
  isOpen,
  onKeepEditing,
  onDiscard,
}: {
  isOpen: boolean;
  onKeepEditing: () => void;
  onDiscard: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/70 p-6">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[var(--panel-strong)]/95 p-5 text-white shadow-2xl">
        <h4 className="text-lg font-semibold">¿Descartar cambios?</h4>
        <p className="mt-2 text-sm text-white/70">
          Tienes cambios sin guardar. Si cierras ahora, se perderán.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onKeepEditing}
            className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/70"
          >
            Seguir editando
          </button>
          <button
            onClick={onDiscard}
            className="rounded-full bg-rose-500/20 px-4 py-2 text-sm font-semibold text-rose-100"
          >
            Descartar
          </button>
        </div>
      </div>
    </div>
  );
}
