"use client";

import { useMemo } from "react";
import {
  applyPortalTheme,
  PortalTheme,
  usePortalSettings,
} from "@/lib/portal-settings";

const themeOptions: { id: PortalTheme; label: string; hint: string }[] = [
  { id: "emerald", label: "Esmeralda", hint: "Clásico verde" },
  { id: "ocean", label: "Océano", hint: "Azules fríos" },
  { id: "sunset", label: "Atardecer", hint: "Naranjas cálidos" },
];

export default function ConfiguracionPage() {
  const { settings, setSettings } = usePortalSettings();
  const logoPreview = useMemo(
    () => settings.logoDataUrl || "",
    [settings.logoDataUrl],
  );

  const handleThemeChange = (theme: PortalTheme) => {
    const next = { ...settings, theme };
    setSettings(next);
    applyPortalTheme(theme);
  };

  const handleNameChange = (value: string) => {
    setSettings({ ...settings, campaignName: value });
  };

  const handleLogoChange = (file?: File | null) => {
    if (!file) {
      setSettings({ ...settings, logoDataUrl: "" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setSettings({ ...settings, logoDataUrl: result });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-[var(--background)] px-8 py-10 text-foreground">
      <div className="rounded-3xl border border-white/10 bg-[var(--panel)]/80 p-10">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl font-semibold">Configuración</h1>
            <p className="mt-2 text-sm text-white/60">
              Personaliza el tema, el nombre de campaña y el logo.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/60">
            Guardado automático
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-sm font-semibold">Tema</h2>
            <p className="mt-1 text-xs text-white/50">
              Cambia la atmósfera general del portal.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {themeOptions.map((option) => {
                const active = settings.theme === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleThemeChange(option.id)}
                    className={`rounded-2xl border px-4 py-4 text-left transition ${
                      active
                        ? "border-emerald-300/50 bg-emerald-300/10 text-emerald-100"
                        : "border-white/10 text-white/70 hover:border-white/30 hover:bg-white/10"
                    }`}
                  >
                    <p className="text-sm font-semibold">{option.label}</p>
                    <p className="mt-1 text-xs text-white/50">
                      {option.hint}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-sm font-semibold">Identidad</h2>
            <div className="mt-4">
              <label className="text-xs text-white/60">
                Nombre de la campaña o candidato
              </label>
              <input
                value={settings.campaignName}
                onChange={(event) => handleNameChange(event.target.value)}
                placeholder="Ej: Equipo Ana 2026"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-emerald-300/50 focus:outline-none"
              />
            </div>

            <div className="mt-6">
              <label className="text-xs text-white/60">Logo</label>
              <div className="mt-3 flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/20 text-xs text-white/40">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Logo de campaña"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    "Sin logo"
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                      handleLogoChange(event.target.files?.[0])
                    }
                    className="block text-xs text-white/60 file:mr-3 file:rounded-full file:border-0 file:bg-emerald-400/20 file:px-4 file:py-2 file:text-xs file:text-emerald-100"
                  />
                  {logoPreview ? (
                    <button
                      type="button"
                      onClick={() => handleLogoChange(null)}
                      className="text-left text-[11px] text-rose-200 hover:text-rose-100"
                    >
                      Quitar logo
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
