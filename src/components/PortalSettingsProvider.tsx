"use client";

import { useEffect } from "react";
import { applyPortalTheme, usePortalSettings } from "@/lib/portal-settings";

export function PortalSettingsProvider() {
  const { settings } = usePortalSettings();

  useEffect(() => {
    applyPortalTheme(settings.theme);
  }, [settings.theme]);

  return null;
}
