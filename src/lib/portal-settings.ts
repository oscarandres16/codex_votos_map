"use client";

import { useEffect, useMemo, useState } from "react";

export type PortalTheme = "emerald" | "ocean" | "sunset";

export type PortalSettings = {
  theme: PortalTheme;
  campaignName: string;
  logoDataUrl: string;
};

const STORAGE_KEY = "votantes-portal-settings";

const defaultSettings: PortalSettings = {
  theme: "emerald",
  campaignName: "Votantes Map",
  logoDataUrl: "",
};

const normalizeSettings = (value: Partial<PortalSettings> | null) => {
  if (!value) return defaultSettings;
  return {
    ...defaultSettings,
    ...value,
  };
};

export const loadPortalSettings = () => {
  if (typeof window === "undefined") return defaultSettings;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return defaultSettings;
  try {
    return normalizeSettings(JSON.parse(raw) as Partial<PortalSettings>);
  } catch {
    return defaultSettings;
  }
};

export const savePortalSettings = (next: PortalSettings) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("portal-settings"));
};

export const applyPortalTheme = (theme: PortalTheme) => {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = theme;
};

export const usePortalSettings = () => {
  const [settings, setSettings] = useState<PortalSettings>(defaultSettings);

  useEffect(() => {
    setSettings(loadPortalSettings());
  }, []);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      setSettings(loadPortalSettings());
    };
    const handleCustom = () => setSettings(loadPortalSettings());
    window.addEventListener("storage", handleStorage);
    window.addEventListener("portal-settings", handleCustom);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("portal-settings", handleCustom);
    };
  }, []);

  const setAndPersist = useMemo(
    () => (next: PortalSettings) => {
      setSettings(next);
      savePortalSettings(next);
    },
    [],
  );

  return { settings, setSettings: setAndPersist, defaultSettings };
};
