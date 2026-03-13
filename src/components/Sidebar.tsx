"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { usePortalSettings } from "@/lib/portal-settings";

const navItems = [
  {
    label: "Mapa",
    href: "/",
    icon: (
      <span className="material-symbols-rounded text-[20px]">map</span>
    ),
  },
  {
    label: "Votantes",
    href: "/votantes",
    icon: (
      <span className="material-symbols-rounded text-[20px]">group</span>
    ),
  },
  {
    label: "Líderes",
    href: "/lideres",
    icon: (
      <span className="material-symbols-rounded text-[20px]">person</span>
    ),
  },
  {
    label: "Zonas",
    href: "/zonas",
    icon: (
      <span className="material-symbols-rounded text-[20px]">polyline</span>
    ),
  },
  {
    label: "Puestos de votación",
    href: "/zonas-votacion",
    icon: (
      <span className="material-symbols-rounded text-[20px]">
        how_to_vote
      </span>
    ),
  },
  {
    label: "Configuración",
    href: "/configuracion",
    icon: (
      <span className="material-symbols-rounded text-[20px]">settings</span>
    ),
  },
];

const SIDEBAR_STATE_KEY = "votantes-sidebar-collapsed";

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(true);
  const { settings } = usePortalSettings();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(SIDEBAR_STATE_KEY);
    if (raw === "true") {
      setCollapsed(true);
      return;
    }
    if (raw === "false") {
      setCollapsed(false);
    }
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        window.localStorage.setItem(SIDEBAR_STATE_KEY, String(next));
      }
      return next;
    });
  };

  return (
    <aside
      className={`relative z-20 flex min-h-screen flex-col gap-6 border-r border-white/10 bg-[var(--panel)]/90 px-3 py-6 transition-[width] duration-300 ${
        collapsed ? "w-20" : "w-60"
      }`}
    >
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-emerald-400/15 text-emerald-200">
            {settings.logoDataUrl ? (
              <img
                src={settings.logoDataUrl}
                alt="Logo"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-sm font-semibold">VM</span>
            )}
          </div>
          {!collapsed ? (
            <div>
              <p className="text-sm font-semibold">
                {settings.campaignName || "Votantes Map"}
              </p>
              <p className="text-[11px] text-white/50">Panel central</p>
            </div>
          ) : null}
        </div>
        <button
          type="button"
          onClick={toggleCollapsed}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/60 transition hover:border-white/30 hover:text-white/90"
          aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
        >
          <span
            className={`material-symbols-rounded text-[18px] transition-transform ${
              collapsed ? "rotate-180" : ""
            }`}
          >
            chevron_left
          </span>
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-2">
        {navItems.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 rounded-2xl border px-3 py-3 text-sm transition ${
                active
                  ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-100"
                  : "border-transparent text-white/70 hover:border-white/10 hover:bg-white/5"
              }`}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-emerald-100 transition group-hover:scale-110">
                {item.icon}
              </span>
              {!collapsed ? (
                <span className="font-medium tracking-wide">{item.label}</span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="px-2 text-[11px] text-white/40">
        {!collapsed ? "v1.0 · Panel de campo" : "v1.0"}
      </div>
    </aside>
  );
}
