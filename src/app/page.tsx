"use client";

import type { Voter, VoterPriority, VoterStatus } from "@/lib/voters-store";
import type { FormMode, FormState } from "@/lib/form-types";
import type { Map as LeafletMap } from "leaflet";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DiscardModal } from "@/components/modals/DiscardModal";
import { SearchModal } from "@/components/modals/SearchModal";
import { VoterModal } from "@/components/modals/VoterModal";
import { RoutesPanel } from "@/components/panels/RoutesPanel";
import { VotersPanel } from "@/components/panels/VotersPanel";
import { MapControls } from "@/components/MapControls";
import { MapOverlays } from "@/components/MapOverlays";

const MapView = dynamic(
  () => import("@/components/MapView").then((mod) => mod.MapView),
  { ssr: false },
);

const emptyForm: FormState = {
  name: "",
  documentType: "Cédula de ciudadanía",
  documentNumber: "",
  phone: "",
  email: "",
  address: "",
  locationLink: "",
  neighborhood: "",
  status: "Pendiente",
  priority: "Media",
  support: 50,
  visits: 0,
  lat: 4.65,
  lng: -74.07,
  notes: "",
};

const statusStyles: Record<VoterStatus, string> = {
  Confirmado: "bg-emerald-500/20 text-emerald-200 border-emerald-400/40",
  Pendiente: "bg-amber-500/20 text-amber-200 border-amber-400/40",
  "En revisión": "bg-rose-500/20 text-rose-200 border-rose-400/40",
};

const priorityStyles: Record<VoterPriority, string> = {
  Alta: "text-emerald-200",
  Media: "text-amber-200",
  Baja: "text-slate-300",
};

export default function Home() {
  const mapLayers = [
    {
      id: "standard",
      label: "Estándar",
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    },
    {
      id: "relieve",
      label: "Relieve",
      url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
      attribution:
        'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, SRTM | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
    },
    {
      id: "satelite",
      label: "Satélite",
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      attribution:
        "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye",
    },
    {
      id: "oscuro",
      label: "Oscuro",
      url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    },
  ];
  const storageKey = "votantes-map-state";
  const votersStorageKey = "votantes-data";
  const routesStorageKey = "votantes-routes";

  const [voters, setVoters] = useState<Voter[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"Todas" | VoterStatus>(
    "Todas",
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showDiscardWarning, setShowDiscardWarning] = useState(false);
  const [mode, setMode] = useState<FormMode>("create");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [locationLabel, setLocationLabel] = useState("Cargando ubicación");
  const [locationDetail, setLocationDetail] = useState("");
  const [interactionEnabled, setInteractionEnabled] = useState(true);
  const [manualClear, setManualClear] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    { display_name: string; lat: string; lon: string }[]
  >([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [locating, setLocating] = useState(false);
  const [pickMode, setPickMode] = useState(false);
  const [locationLinkError, setLocationLinkError] = useState("");
  const [routeStops, setRouteStops] = useState<string[]>([]);
  const [routeCandidate, setRouteCandidate] = useState("");
  const [routeName, setRouteName] = useState("");
  const [routeDate, setRouteDate] = useState("");
  const [routeTime, setRouteTime] = useState("");
  const [savedRoutes, setSavedRoutes] = useState<
    {
      id: string;
      name: string;
      date?: string;
      time?: string;
      stops: string[];
    }[]
  >([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [showRoutePanel, setShowRoutePanel] = useState(true);
  const searchCacheRef = useRef<
    Map<
      string,
      {
        ts: number;
        results: {
          display_name: string;
          lat: string;
          lon: string;
        }[];
      }
    >
  >(new Map());
  const lastSearchAtRef = useRef(0);
  const readStoredMapState = () => {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as {
        center?: { lat?: number; lng?: number };
        zoom?: number;
        layerId?: string;
      };
      return parsed;
    } catch {
      return null;
    }
  };

  const [mapLayerIndex, setMapLayerIndex] = useState(0);
  const [isMapMenuOpen, setIsMapMenuOpen] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>(() => {
    const saved = readStoredMapState();
    if (
      typeof saved?.center?.lat === "number" &&
      typeof saved?.center?.lng === "number"
    ) {
      return [saved.center.lat, saved.center.lng];
    }
    return [4.6486, -74.0736];
  });
  const [mapZoom, setMapZoom] = useState(() => {
    const saved = readStoredMapState();
    return typeof saved?.zoom === "number" ? saved.zoom : 12;
  });
  const [mapReady, setMapReady] = useState(false);
  const [storageLoaded, setStorageLoaded] = useState(false);
  const appliedStoredViewRef = useRef(false);
  const initialFormRef = useRef<FormState>(emptyForm);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const searchControllerRef = useRef<AbortController | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const activeMapLayer = mapLayers[mapLayerIndex];

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setManualClear(false);
  };

  const isSameForm = (a: FormState, b: FormState) =>
    a.name === b.name &&
    a.documentType === b.documentType &&
    a.documentNumber === b.documentNumber &&
    a.phone === b.phone &&
    a.email === b.email &&
    a.address === b.address &&
    a.locationLink === b.locationLink &&
    a.neighborhood === b.neighborhood &&
    a.status === b.status &&
    a.priority === b.priority &&
    a.support === b.support &&
    a.visits === b.visits &&
    a.lat === b.lat &&
    a.lng === b.lng &&
    a.notes === b.notes;

  const requestCloseModal = useCallback(() => {
    if (isFormDirty) {
      setShowDiscardWarning(true);
      return;
    }
    setIsModalOpen(false);
    setPickMode(false);
  }, [isFormDirty]);

  const parseLatLngFromMapsLink = (link: string) => {
    const trimmed = link.trim();
    if (!trimmed) return null;
    const urlText = /^https?:\/\//i.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;
    try {
      const url = new URL(urlText);
      const query = url.searchParams.get("q") || url.searchParams.get("query");
      const ll = url.searchParams.get("ll") || url.searchParams.get("center");
      const candidate = query || ll || "";
      if (candidate) {
        const match = candidate.match(
          /(-?\d+(?:\.\d+)?)[,\s]+(-?\d+(?:\.\d+)?)/i,
        );
        if (match) return [Number(match[1]), Number(match[2])] as const;
      }
      const atMatch = url.pathname.match(
        /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/i,
      );
      if (atMatch) return [Number(atMatch[1]), Number(atMatch[2])] as const;
    } catch {
      return null;
    }
    return null;
  };

  const routeStopVoters = useMemo(
    () =>
      routeStops
        .map((id) => voters.find((voter) => voter.id === id))
        .filter((voter): voter is Voter => Boolean(voter)),
    [routeStops, voters],
  );

  const routePositions = useMemo(
    () =>
      routeStopVoters.map(
        (voter) => [voter.lat, voter.lng] as [number, number],
      ),
    [routeStopVoters],
  );

  const addRouteStop = (id: string) => {
    if (!id || routeStops.includes(id)) return;
    setRouteStops((prev) => [...prev, id]);
  };

  const routeSuggestions = useMemo(() => {
    const term = routeCandidate.trim().toLowerCase();
    if (!term) return [];
    return voters
      .filter(
        (voter) =>
          !routeStops.includes(voter.id) &&
          (voter.name.toLowerCase().includes(term) ||
            voter.neighborhood.toLowerCase().includes(term)),
      )
      .slice(0, 5);
  }, [routeCandidate, voters, routeStops]);

  const handleDropOnRoute = (targetId: string) => {
    if (!draggingId || draggingId === targetId) return;
    setRouteStops((prev) => {
      const sourceIndex = prev.indexOf(draggingId);
      const targetIndex = prev.indexOf(targetId);
      if (sourceIndex === -1 || targetIndex === -1) return prev;
      const next = [...prev];
      next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, draggingId);
      return next;
    });
  };

  const saveCurrentRoute = () => {
    if (routeStops.length === 0) return;
    const next = {
      id: crypto.randomUUID(),
      name: routeName || `Ruta ${routeStops.length} puntos`,
      date: routeDate || undefined,
      time: routeTime || undefined,
      stops: routeStops,
    };
    setSavedRoutes((prev) => {
      const nextList = [next, ...prev];
      persistRoutes(nextList);
      return nextList;
    });
  };

  const loadSavedRoute = (routeId: string) => {
    const route = savedRoutes.find((item) => item.id === routeId);
    if (!route) return;
    setRouteStops(route.stops);
    setRouteName(route.name);
    setRouteDate(route.date ?? "");
    setRouteTime(route.time ?? "");
  };

  const deleteSavedRoute = (routeId: string) => {
    setSavedRoutes((prev) => {
      const nextList = prev.filter((item) => item.id !== routeId);
      persistRoutes(nextList);
      return nextList;
    });
  };

  const removeRouteStop = (id: string) => {
    setRouteStops((prev) => prev.filter((stop) => stop !== id));
  };

  const moveRouteStop = (id: string, direction: "up" | "down") => {
    setRouteStops((prev) => {
      const index = prev.indexOf(id);
      if (index === -1) return prev;
      const targetIndex =
        direction === "up"
          ? Math.max(index - 1, 0)
          : Math.min(index + 1, prev.length - 1);
      const next = [...prev];
      const tmp = next[targetIndex];
      next[targetIndex] = next[index];
      next[index] = tmp;
      return next;
    });
  };

  const clearRoute = () => setRouteStops([]);

  useEffect(() => {
    const raw = window.localStorage.getItem(votersStorageKey);
    if (raw) {
      try {
        const stored = JSON.parse(raw) as Voter[];
        setVoters(stored);
      } catch {
        setVoters([]);
      }
    } else {
      setVoters([]);
    }
    setSelectedId(null);
    setManualClear(true);
    setLoading(false);
  }, []);

  const persistVoters = (next: Voter[]) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(votersStorageKey, JSON.stringify(next));
  };

  useEffect(() => {
    const raw = window.localStorage.getItem(routesStorageKey);
    if (!raw) {
      setSavedRoutes([]);
      return;
    }
    try {
      setSavedRoutes(JSON.parse(raw));
    } catch {
      setSavedRoutes([]);
    }
  }, []);

  const persistRoutes = (next: typeof savedRoutes) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(routesStorageKey, JSON.stringify(next));
  };

  const persistMapState = (nextLayerId?: string) => {
    if (!storageLoaded) return;
    if (typeof window === "undefined") return;
    const map = mapRef.current;
    const center = map
      ? map.getCenter()
      : { lat: mapCenter[0], lng: mapCenter[1] };
    const zoom = map ? map.getZoom() : mapZoom;
    const payload = {
      center: { lat: center.lat, lng: center.lng },
      zoom,
      layerId: nextLayerId ?? mapLayers[mapLayerIndex].id,
    };
    window.localStorage.setItem(storageKey, JSON.stringify(payload));
  };

  const handleZoomIn = () => mapRef.current?.zoomIn();
  const handleZoomOut = () => mapRef.current?.zoomOut();
  const handleNextMapLayer = () => {
    setMapLayerIndex((prev) => (prev + 1) % mapLayers.length);
  };
  const handleLocate = () => {
    if (!navigator.geolocation) {
      setSearchError("Geolocalización no disponible.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        mapRef.current?.setView(
          [latitude, longitude],
          Math.max(mapRef.current?.getZoom() ?? 12, 14),
          { animate: true },
        );
        setLocating(false);
      },
      () => {
        setSearchError("No pudimos obtener la ubicación.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleSearch = async (term: string) => {
    const normalized = term.trim();
    if (!normalized) {
      setSearchResults([]);
      setSearchError("");
      return;
    }
    if (normalized.length < 3) {
      setSearchResults([]);
      setSearchError("Escribe al menos 3 caracteres.");
      return;
    }
    const now = Date.now();
    if (now - lastSearchAtRef.current < 800) {
      setSearchError("Espera un momento e intenta de nuevo.");
      return;
    }
    lastSearchAtRef.current = now;
    const cached = searchCacheRef.current.get(normalized);
    if (cached && now - cached.ts < 5 * 60 * 1000) {
      setSearchResults(cached.results);
      setSearchError(cached.results.length === 0 ? "Sin resultados." : "");
      return;
    }
    const nominatimEmail = process.env.NEXT_PUBLIC_NOMINATIM_EMAIL;
    setSearching(true);
    setSearchError("");
    searchControllerRef.current?.abort();
    const controller = new AbortController();
    searchControllerRef.current = controller;
    try {
      const nominatimUrl = new URL(
        "https://nominatim.openstreetmap.org/search",
      );
      nominatimUrl.searchParams.set("format", "jsonv2");
      nominatimUrl.searchParams.set("q", normalized);
      nominatimUrl.searchParams.set("limit", "6");
      nominatimUrl.searchParams.set("accept-language", "es");
      if (nominatimEmail) {
        nominatimUrl.searchParams.set("email", nominatimEmail);
      }

      const response = await fetch(nominatimUrl.toString(), {
        signal: controller.signal,
      });
      if (!response.ok) throw new Error("search failed");
      const data = (await response.json()) as {
        display_name: string;
        lat: string;
        lon: string;
      }[];
      setSearchResults(data);
      searchCacheRef.current.set(normalized, { ts: now, results: data });
      if (data.length === 0) {
        setSearchError("Sin resultados.");
      }
    } catch (err) {
      if ((err as { name?: string }).name !== "AbortError") {
        try {
          const fallback = await fetch(
            `https://photon.komoot.io/api/?q=${encodeURIComponent(
              normalized,
            )}&limit=6&lang=es`,
            { signal: controller.signal },
          );
          if (!fallback.ok) throw new Error("fallback failed");
          const data = (await fallback.json()) as {
            features?: {
              geometry?: { coordinates?: [number, number] };
              properties?: {
                name?: string;
                city?: string;
                state?: string;
                country?: string;
              };
            }[];
          };
          const results =
            data.features?.map((feature) => {
              const [lon, lat] = feature.geometry?.coordinates ?? [0, 0];
              const props = feature.properties ?? {};
              const label = [props.name, props.city, props.state, props.country]
                .filter(Boolean)
                .join(", ");
              return {
                display_name: label || "Ubicación",
                lat: String(lat),
                lon: String(lon),
              };
            }) ?? [];
          setSearchResults(results);
          searchCacheRef.current.set(normalized, { ts: now, results });
          if (results.length === 0) {
            setSearchError("Sin resultados.");
          }
        } catch {
          setSearchError("Error buscando el lugar.");
        }
      }
    } finally {
      setSearching(false);
    }
  };

  const handleSelectResult = (result: {
    display_name: string;
    lat: string;
    lon: string;
  }) => {
    mapRef.current?.setView([Number(result.lat), Number(result.lon)], 13, {
      animate: true,
    });
    setIsSearchOpen(false);
    setSearchResults([]);
  };

  const applyLocationLink = (link: string) => {
    if (!link.trim()) {
      setLocationLinkError("");
      return;
    }
    const coords = parseLatLngFromMapsLink(link);
    if (!coords) {
      setLocationLinkError("No pudimos leer las coordenadas del enlace.");
      return;
    }
    setForm((prev) => ({ ...prev, lat: coords[0], lng: coords[1] }));
    setLocationLinkError("");
  };

  const handlePickLocation = (lat: number, lng: number) => {
    setForm((prev) => ({ ...prev, lat, lng }));
    setPickMode(false);
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (isSearchOpen) return;
    setSearchResults([]);
    setSearchError("");
  }, [isSearchOpen]);

  useEffect(() => {
    if (!isModalOpen) return;
    setIsFormDirty(!isSameForm(form, initialFormRef.current));
  }, [form, isModalOpen]);

  useEffect(() => {
    if (!isModalOpen) {
      setShowDiscardWarning(false);
    }
  }, [isModalOpen]);

  useEffect(() => {
    const saved = readStoredMapState();
    if (saved?.layerId) {
      const idx = mapLayers.findIndex((layer) => layer.id === saved.layerId);
      if (idx >= 0) setMapLayerIndex(idx);
    }
    if (
      typeof saved?.center?.lat === "number" &&
      typeof saved?.center?.lng === "number"
    ) {
      setMapCenter([saved.center.lat, saved.center.lng]);
    }
    if (typeof saved?.zoom === "number") {
      setMapZoom(saved.zoom);
    }
    setStorageLoaded(true);
  }, []);

  useEffect(() => {
    if (!mapReady || !storageLoaded) return;
    if (appliedStoredViewRef.current) return;
    mapRef.current?.setView(mapCenter, mapZoom, { animate: false });
    appliedStoredViewRef.current = true;
  }, [mapReady, storageLoaded, mapCenter, mapZoom]);

  useEffect(() => {
    if (!mapReady) return;
    const map = mapRef.current;
    if (!map) return;
    const handleMove = () => {
      const center = map.getCenter();
      setMapCenter([center.lat, center.lng]);
      setMapZoom(map.getZoom());
      persistMapState();
    };
    map.on("moveend", handleMove);
    map.on("zoomend", handleMove);
    persistMapState();
    return () => {
      map.off("moveend", handleMove);
      map.off("zoomend", handleMove);
    };
  }, [mapReady, storageLoaded]);

  useEffect(() => {
    persistMapState(mapLayers[mapLayerIndex].id);
  }, [mapLayerIndex]);

  useEffect(() => {
    const isTypingTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      return (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      );
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return;
      if (event.key === "n" || event.key === "N") {
        setInteractionEnabled((prev) => !prev);
      }
      if (event.key === "l" || event.key === "L") {
        handleLocate();
      }
      if (event.key === "s" || event.key === "S") {
        event.preventDefault();
        setIsSearchOpen(true);
        setSearchQuery("");
        setSearchResults([]);
        setSearchError("");
      }
      if (event.key === "Escape") {
        if (showDiscardWarning) {
          setShowDiscardWarning(false);
          return;
        }
        setIsSearchOpen(false);
        setIsMapMenuOpen(false);
        setPickMode(false);
        if (isModalOpen) {
          requestCloseModal();
        }
      }
      if (event.key === "m" || event.key === "M") {
        setIsMapMenuOpen((prev) => !prev);
      }
      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        handleZoomIn();
      }
      if (event.key === "-") {
        event.preventDefault();
        handleZoomOut();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen, requestCloseModal, showDiscardWarning]);

  const selected = voters.find((voter) => voter.id === selectedId) ?? null;

  const filteredVoters = useMemo(() => {
    const term = search.trim().toLowerCase();
    return voters.filter((voter) => {
      const matchesStatus =
        statusFilter === "Todas" || voter.status === statusFilter;
      const matchesTerm =
        !term ||
        voter.name.toLowerCase().includes(term) ||
        voter.neighborhood.toLowerCase().includes(term) ||
        voter.id.toLowerCase().includes(term) ||
        voter.documentNumber.toLowerCase().includes(term) ||
        voter.phone.toLowerCase().includes(term) ||
        (voter.email ?? "").toLowerCase().includes(term);
      return matchesStatus && matchesTerm;
    });
  }, [voters, search, statusFilter]);

  useEffect(() => {
    if (selectedId === null) return;
    const exists = filteredVoters.some((voter) => voter.id === selectedId);
    if (!exists && !manualClear) {
      setSelectedId(filteredVoters[0]?.id ?? null);
    }
  }, [filteredVoters, selectedId, manualClear]);

  const stats = useMemo(() => {
    const total = voters.length;
    const confirmed = voters.filter((v) => v.status === "Confirmado").length;
    const pending = voters.filter((v) => v.status === "Pendiente").length;
    const review = voters.filter((v) => v.status === "En revisión").length;
    return { total, confirmed, pending, review };
  }, [voters]);

  const openCreate = () => {
    setMode("create");
    setForm(emptyForm);
    initialFormRef.current = emptyForm;
    setIsFormDirty(false);
    setLocationLinkError("");
    setIsModalOpen(true);
  };

  const openEdit = (voter: Voter) => {
    setMode("edit");
    const nextForm = {
      name: voter.name,
      documentType: voter.documentType,
      documentNumber: voter.documentNumber,
      phone: voter.phone,
      email: voter.email ?? "",
      address: voter.address,
      locationLink: voter.locationLink ?? "",
      neighborhood: voter.neighborhood,
      status: voter.status,
      priority: voter.priority,
      support: voter.support,
      visits: voter.visits,
      lat: voter.lat,
      lng: voter.lng,
      notes: voter.notes,
    };
    setForm(nextForm);
    initialFormRef.current = nextForm;
    setIsFormDirty(false);
    setLocationLinkError("");
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const nextVoter: Voter = {
        id: mode === "create" ? crypto.randomUUID() : selected!.id,
        name: form.name,
        documentType: form.documentType,
        documentNumber: form.documentNumber,
        phone: form.phone,
        email: form.email || undefined,
        address: form.address,
        locationLink: form.locationLink || undefined,
        neighborhood: form.neighborhood,
        status: form.status,
        priority: form.priority,
        support: form.support,
        visits: form.visits,
        lat: form.lat,
        lng: form.lng,
        notes: form.notes,
      };
      if (mode === "create") {
        setVoters((prev) => {
          const nextList = [nextVoter, ...prev];
          persistVoters(nextList);
          return nextList;
        });
        setSelectedId(nextVoter.id);
        setManualClear(false);
      } else if (selected) {
        setVoters((prev) => {
          const nextList = prev.map((item) =>
            item.id === selected.id ? nextVoter : item,
          );
          persistVoters(nextList);
          return nextList;
        });
        setSelectedId(nextVoter.id);
        setManualClear(false);
      }
      setIsModalOpen(false);
      setIsFormDirty(false);
      setShowDiscardWarning(false);
    } catch (error) {
      setIsModalOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    setVoters((prev) => {
      const nextList = prev.filter((item) => item.id !== id);
      persistVoters(nextList);
      return nextList;
    });
    setSelectedId((prev) => (prev === id ? null : prev));
  };

  return (
    <div className="relative min-h-screen bg-[#0f1115] text-foreground">
      <div className="absolute inset-0 z-0">
        <MapView
          voters={filteredVoters}
          selectedId={selectedId}
          onSelect={handleSelect}
          onLocationChange={(label, detail) => {
            setLocationLabel(label);
            setLocationDetail(detail);
          }}
          interactionEnabled={interactionEnabled}
          onMapReady={(map) => {
            mapRef.current = map;
            setMapReady(true);
          }}
          onClearSelected={() => {
            setSelectedId(null);
            setManualClear(true);
          }}
          onEdit={openEdit}
          onDelete={handleDelete}
          tileUrl={activeMapLayer.url}
          tileAttribution={activeMapLayer.attribution}
          initialCenter={mapCenter}
          initialZoom={mapZoom}
          pickMode={pickMode}
          onPickLocation={handlePickLocation}
          routePositions={routePositions}
        />
      </div>
      <RoutesPanel
        isOpen={showRoutePanel}
        onShow={() => setShowRoutePanel(true)}
        onHide={() => setShowRoutePanel(false)}
        routeStopVoters={routeStopVoters}
        routeStops={routeStops}
        selectedId={selectedId}
        routeCandidate={routeCandidate}
        setRouteCandidate={setRouteCandidate}
        routeSuggestions={routeSuggestions}
        routeName={routeName}
        setRouteName={setRouteName}
        routeDate={routeDate}
        setRouteDate={setRouteDate}
        routeTime={routeTime}
        setRouteTime={setRouteTime}
        savedRoutes={savedRoutes}
        addRouteStop={addRouteStop}
        moveRouteStop={moveRouteStop}
        removeRouteStop={removeRouteStop}
        clearRoute={clearRoute}
        saveCurrentRoute={saveCurrentRoute}
        loadSavedRoute={loadSavedRoute}
        deleteSavedRoute={deleteSavedRoute}
        onDragStart={(id) => setDraggingId(id)}
        onDragEnd={() => setDraggingId(null)}
        onDropOnRoute={handleDropOnRoute}
      />

      <div className="relative z-10 flex min-h-screen flex-col lg:flex-row pointer-events-none">
        <VotersPanel
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          stats={stats}
          loading={loading}
          voters={filteredVoters}
          selectedId={selectedId}
          onSelect={handleSelect}
          onCreate={openCreate}
          statusStyles={statusStyles}
          priorityStyles={priorityStyles}
        />

        <main className="relative flex-1 pointer-events-none">
          <div className="relative h-full min-h-[620px]">
            <MapOverlays
              selectedId={selectedId}
              stats={[
                { label: "Total activos", value: stats.total },
                { label: "Confirmados", value: stats.confirmed },
              ]}
              locationLabel={locationLabel}
              locationDetail={locationDetail}
              pickMode={pickMode}
            />

            <MapControls
              interactionEnabled={interactionEnabled}
              onToggleInteraction={() => setInteractionEnabled((prev) => !prev)}
              onSearchOpen={() => {
                setIsSearchOpen(true);
                setSearchQuery("");
                setSearchResults([]);
                setSearchError("");
              }}
              onLocate={handleLocate}
              locating={locating}
              isMapMenuOpen={isMapMenuOpen}
              onToggleMapMenu={() => setIsMapMenuOpen((prev) => !prev)}
              mapLayers={mapLayers}
              mapLayerIndex={mapLayerIndex}
              onSelectMapLayer={(index) => {
                setMapLayerIndex(index);
                setIsMapMenuOpen(false);
              }}
              onZoomOut={handleZoomOut}
              onZoomIn={handleZoomIn}
            />
          </div>
        </main>
      </div>

      <SearchModal
        isOpen={isSearchOpen}
        query={searchQuery}
        onQueryChange={setSearchQuery}
        onSearch={handleSearch}
        searching={searching}
        error={searchError}
        results={searchResults}
        onSelectResult={handleSelectResult}
        onClose={() => setIsSearchOpen(false)}
      />

      <VoterModal
        isOpen={isModalOpen}
        mode={mode}
        form={form}
        setForm={setForm}
        requestCloseModal={requestCloseModal}
        applyLocationLink={applyLocationLink}
        locationLinkError={locationLinkError}
        onPickLocationMode={() => {
          setIsModalOpen(false);
          setPickMode(true);
        }}
        onSubmit={handleSubmit}
        saving={saving}
      />

      <DiscardModal
        isOpen={showDiscardWarning}
        onKeepEditing={() => setShowDiscardWarning(false)}
        onDiscard={() => {
          setShowDiscardWarning(false);
          setIsModalOpen(false);
          setPickMode(false);
          setIsFormDirty(false);
        }}
      />
    </div>
  );
}
