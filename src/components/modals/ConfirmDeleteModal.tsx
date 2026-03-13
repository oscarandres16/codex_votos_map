"use client";

export function ConfirmDeleteModal({
  isOpen,
  title,
  description,
  onCancel,
  onConfirm,
}: {
  isOpen: boolean;
  title: string;
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/70 p-6">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[var(--panel-strong)]/95 p-5 text-white shadow-2xl">
        <h4 className="text-lg font-semibold">{title}</h4>
        <p className="mt-2 text-sm text-white/70">{description}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/70"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="rounded-full bg-rose-500/20 px-4 py-2 text-sm font-semibold text-rose-100"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
