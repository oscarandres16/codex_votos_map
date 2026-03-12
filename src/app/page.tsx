"use client";

import type { Voter, VoterPriority, VoterStatus } from "@/lib/voters-store";
import type { Map as LeafletMap } from "leaflet";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const MapView = dynamic(
  () => import("@/components/MapView").then((mod) => mod.MapView),
  { ssr: false }
);

type FormState = {
  name: string;
  documentType: string;
  documentNumber: string;
  phone: string;
  email: string;
  address: string;
  locationLink: string;
  neighborhood: string;
  status: VoterStatus;
  priority: VoterPriority;
  support: number;
  visits: number;
  lat: number;
  lng: number;
  notes: string;
};

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
        'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye',
    },
    {
      id: "oscuro",
      label: "Oscuro",
      url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    },
  ] as const;
const storageKey = "votantes-map-state";
const votersStorageKey = "votantes-data";
const routesStorageKey = "votantes-routes";

  const [voters, setVoters] = useState<Voter[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "Todas" | VoterStatus
  >("Todas");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showDiscardWarning, setShowDiscardWarning] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
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
          /(-?\d+(?:\.\d+)?)[,\s]+(-?\d+(?:\.\d+)?)/i
        );
        if (match) return [Number(match[1]), Number(match[2])] as const;
      }
      const atMatch = url.pathname.match(
        /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/i
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
    [routeStops, voters]
  );

  const routePositions = useMemo(
    () => routeStopVoters.map((voter) => [voter.lat, voter.lng] as [number, number]),
    [routeStopVoters]
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
            voter.neighborhood.toLowerCase().includes(term))
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
        direction === "up" ? Math.max(index - 1, 0) : Math.min(index + 1, prev.length - 1);
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
    const center = map ? map.getCenter() : { lat: mapCenter[0], lng: mapCenter[1] };
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
          { animate: true }
        );
        setLocating(false);
      },
      () => {
        setSearchError("No pudimos obtener la ubicación.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSearch = async (term: string) => {
    const normalized = term.trim();
    if (!normalized) {
      setSearchResults([]);
      setSearchError("");
      return;
    }
    setSearching(true);
    setSearchError("");
    searchControllerRef.current?.abort();
    const controller = new AbortController();
    searchControllerRef.current = controller;
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
          normalized
        )}&limit=6&accept-language=es`,
        { signal: controller.signal }
      );
      if (!response.ok) throw new Error("search failed");
      const data = (await response.json()) as {
        display_name: string;
        lat: string;
        lon: string;
      }[];
      setSearchResults(data);
      if (data.length === 0) {
        setSearchError("Sin resultados.");
      }
    } catch (err) {
      if ((err as { name?: string }).name !== "AbortError") {
        setSearchError("Error buscando el lugar.");
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
    if (!isSearchOpen) return;
    const term = searchQuery.trim();
    if (!term) {
      setSearchResults([]);
      setSearchError("");
      return;
    }
    const timeout = window.setTimeout(() => {
      handleSearch(term);
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [isSearchOpen, searchQuery]);

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
            item.id === selected.id ? nextVoter : item
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
      {showRoutePanel ? (
        <div className="pointer-events-auto absolute top-6 right-6 z-40 w-[320px] rounded-3xl border border-white/10 bg-[var(--panel-strong)]/95 p-4 text-sm text-white shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase text-white/40 tracking-[0.35em]">
                Rutas de visita
              </p>
              <p className="text-lg font-semibold">Orden actual</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={clearRoute}
                className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-white/70 hover:border-white/40"
              >
                Limpiar
              </button>
              <button
                onClick={() => setShowRoutePanel(false)}
                className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-white/70 hover:border-white/40"
              >
                Ocultar
              </button>
            </div>
          </div>
          <div className="mt-3 max-h-[60vh] space-y-2 overflow-y-auto pr-1">
            {routeStopVoters.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-white/20 bg-white/5 px-3 py-2 text-xs text-white/50">
                Agrega votantes para trazar la ruta
              </p>
            ) : (
              routeStopVoters.map((voter, index) => (
                <div
                  key={voter.id}
                  draggable
                  onDragStart={() => setDraggingId(voter.id)}
                  onDragEnd={() => setDraggingId(null)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => handleDropOnRoute(voter.id)}
                  className="flex items-start justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-2 hover:cursor-grab"
                >
                  <div className="mr-3 flex h-8 w-2 items-center justify-center">
                    <div className="h-2 w-full rounded-full bg-white/50" />
                    <div className="mt-1 h-2 w-full rounded-full bg-white/50" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-[12px] font-semibold">
                      {index + 1}. {voter.name}
                    </p>
                    <p className="text-[11px] text-white/60">
                      {voter.neighborhood}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex gap-1">
                      <button
                        onClick={() => moveRouteStop(voter.id, "up")}
                        disabled={index === 0}
                        className="rounded-full border border-white/10 px-2 text-[10px] text-white/50 disabled:text-white/20"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveRouteStop(voter.id, "down")}
                        disabled={index === routeStopVoters.length - 1}
                        className="rounded-full border border-white/10 px-2 text-[10px] text-white/50 disabled:text-white/20"
                      >
                        ↓
                      </button>
                    </div>
                    <button
                      onClick={() => removeRouteStop(voter.id)}
                      className="rounded-full border border-rose-400/40 px-2 text-[10px] text-rose-200"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="mt-4 space-y-2">
            <button
              onClick={() => addRouteStop(selectedId ?? "")}
              disabled={!selectedId || routeStops.includes(selectedId)}
              className="w-full rounded-full border border-white/10 bg-emerald-500/10 px-3 py-2 text-[11px] font-semibold text-emerald-100 transition hover:bg-emerald-500/20 disabled:opacity-50"
            >
              Agregar votante seleccionado
            </button>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <input
                  value={routeCandidate}
                  onChange={(event) => setRouteCandidate(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      if (routeCandidate && !routeStops.includes(routeCandidate)) {
                        addRouteStop(routeCandidate);
                        setRouteCandidate("");
                      }
                    }
                  }}
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white focus:border-emerald-400/60 focus:outline-none"
                  placeholder="Busca por nombre o barrio"
                />
                <button
                  onClick={() => {
                    if (routeCandidate && !routeStops.includes(routeCandidate)) {
                      addRouteStop(routeCandidate);
                      setRouteCandidate("");
                    }
                  }}
                  disabled={!routeCandidate || routeStops.includes(routeCandidate)}
                  className="rounded-full border border-white/10 px-3 py-2 text-[11px] text-white/70 hover:border-white/40 disabled:opacity-50"
                >
                  Agregar
                </button>
              </div>
              {routeSuggestions.length > 0 ? (
                <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] text-white/70">
                  {routeSuggestions.map((voter) => (
                    <button
                      key={voter.id}
                      onClick={() => {
                        addRouteStop(voter.id);
                        setRouteCandidate("");
                      }}
                      className="w-full text-left hover:text-white"
                    >
                      {voter.name} · {voter.neighborhood}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <input
                value={routeName}
                onChange={(event) => setRouteName(event.target.value)}
                placeholder="Nombre de la ruta"
                className="col-span-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white focus:border-emerald-400/60 focus:outline-none"
              />
              <input
                type="date"
                value={routeDate}
                onChange={(event) => setRouteDate(event.target.value)}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white focus:border-emerald-400/60 focus:outline-none"
              />
              <input
                type="time"
                value={routeTime}
                onChange={(event) => setRouteTime(event.target.value)}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white focus:border-emerald-400/60 focus:outline-none"
              />
              <button
                onClick={saveCurrentRoute}
                disabled={routeStops.length === 0}
                className="rounded-full border border-white/10 bg-emerald-500/10 px-3 py-2 text-[11px] font-semibold text-emerald-100 transition hover:bg-emerald-500/20 disabled:opacity-50"
              >
                Guardar ruta
              </button>
            </div>
            {savedRoutes.length > 0 ? (
              <div className="space-y-2">
                <p className="text-[11px] uppercase text-white/40 tracking-[0.3em]">
                  Rutas guardadas
                </p>
                {savedRoutes.map((route) => (
                  <div
                    key={route.id}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] text-white"
                  >
                    <div>
                      <p className="font-semibold">{route.name}</p>
                      <p className="text-white/60">
                        {route.date ?? "Fecha sin asignar"} ·{" "}
                        {route.time ?? "Hora sin asignar"}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 text-white/50">
                      <button
                        onClick={() => loadSavedRoute(route.id)}
                        className="text-[10px] hover:text-white"
                      >
                        Cargar
                      </button>
                      <button
                        onClick={() => deleteSavedRoute(route.id)}
                        className="text-[10px] text-rose-200 hover:text-white"
                      >
                        Borrar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowRoutePanel(true)}
          className="pointer-events-auto absolute top-6 right-6 z-40 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[11px] text-white shadow-xl backdrop-blur"
        >
          Mostrar rutas
        </button>
      )}

      <div className="relative z-10 flex min-h-screen flex-col lg:flex-row pointer-events-none">
        <aside className="panel-scroll pointer-events-auto w-full max-w-full shrink-0 border-b border-white/10 bg-[var(--panel)]/95 p-6 backdrop-blur-xl lg:w-[360px] lg:border-b-0 lg:border-r lg:rounded-r-[28px]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/70">
                Panel de campo
              </p>
              <h1 className="font-[var(--font-display)] text-2xl text-white">
                Votantes activos
              </h1>
            </div>
            <button
              onClick={openCreate}
              className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-500/20"
            >
              Nuevo votante
            </button>
          </div>

          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70">
              <span className="text-emerald-200">⌕</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
                placeholder="Buscar votante, barrio o ID"
              />
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              {(
                [
                  { label: `Todos ${stats.total}`, value: "Todas" },
                  { label: `Confirmados ${stats.confirmed}`, value: "Confirmado" },
                  { label: `Pendientes ${stats.pending}`, value: "Pendiente" },
                  { label: `En revisión ${stats.review}`, value: "En revisión" },
                ] as const
              ).map((tag) => (
                <button
                  key={tag.value}
                  onClick={() => setStatusFilter(tag.value)}
                  className={`rounded-full border px-3 py-1 transition ${
                    statusFilter === tag.value
                      ? "border-emerald-400/70 bg-emerald-500/20 text-emerald-100"
                      : "border-white/10 bg-white/5 text-white/60 hover:border-white/30"
                  }`}
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {loading ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
                Cargando votantes...
              </div>
            ) : filteredVoters.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
                No hay votantes para este filtro.
              </div>
            ) : (
              filteredVoters.map((voter) => {
                const isSelected = voter.id === selectedId;
                return (
                  <button
                    key={voter.id}
                    onClick={() => handleSelect(voter.id)}
                    className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                      isSelected
                        ? "border-emerald-400/70 bg-emerald-500/10"
                        : "border-white/10 bg-white/5 hover:border-white/30"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {voter.name}
                        </p>
                        <p className="text-xs text-white/50">
                          {voter.neighborhood}
                        </p>
                      </div>
                      <span
                        className={`rounded-full border px-2 py-1 text-[10px] ${
                          statusStyles[voter.status]
                        }`}
                      >
                        {voter.status}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-white/60">
                      <span className={priorityStyles[voter.priority]}>
                        Prioridad {voter.priority}
                      </span>
                      <span>{voter.support}% afinidad</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <main className="relative flex-1 pointer-events-none">
          <div className="relative h-full min-h-[620px]">
            {!selected ? (
              <div className="absolute left-6 top-6 rounded-2xl border border-white/10 bg-[var(--panel-strong)]/95 p-5 text-sm text-white/70 pointer-events-auto">
                Selecciona un votante en la lista o en el mapa.
              </div>
            ) : null}

            <div className="absolute bottom-6 right-6 flex flex-col gap-3 pointer-events-auto">
              {[
                { label: "Total activos", value: stats.total },
                { label: "Confirmados", value: stats.confirmed },
              ].map((stat) => (
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
              <p className="text-xs uppercase text-white/40">
                Ubicación actual
              </p>
              <p className="text-lg font-semibold text-white">
                {locationLabel}
              </p>
              {locationDetail ? (
                <p className="text-xs text-white/50">{locationDetail}</p>
              ) : null}
            </div>

            {pickMode ? (
              <div className="absolute left-1/2 top-6 -translate-x-1/2 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-4 py-2 text-xs text-emerald-100 backdrop-blur pointer-events-auto">
                Haz click en el mapa para seleccionar la ubicación. Esc para salir.
              </div>
            ) : null}

            <div className="pointer-events-auto absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-[var(--panel-strong)]/90 px-3 py-2 text-xs text-white/70 shadow-xl backdrop-blur">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleLocate}
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
                  onClick={() => {
                    setIsSearchOpen(true);
                    setSearchQuery("");
                    setSearchResults([]);
                    setSearchError("");
                  }}
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
                  onClick={() => setInteractionEnabled((prev) => !prev)}
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
                    onClick={() => setIsMapMenuOpen((prev) => !prev)}
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
                          onClick={() => {
                            setMapLayerIndex(index);
                            setIsMapMenuOpen(false);
                          }}
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
                  onClick={handleZoomOut}
                  className="h-7 w-7 rounded-full border border-white/10 text-sm text-white/70 hover:border-white/40"
                  title="Alejar (−)"
                >
                  −
                </button>
                <button
                  onClick={handleZoomIn}
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
          </div>
        </main>
      </div>

      {showRoutePanel ? (
      <div className="pointer-events-auto absolute top-6 right-6 z-40 w-[320px] rounded-3xl border border-white/10 bg-[var(--panel-strong)]/95 p-4 text-sm text-white shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase text-white/40 tracking-[0.35em]">
                Rutas de visita
              </p>
              <p className="text-lg font-semibold">Orden actual</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={clearRoute}
                className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-white/70 hover:border-white/40"
              >
                Limpiar
              </button>
              <button
                onClick={() => setShowRoutePanel(false)}
                className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-white/70 hover:border-white/40"
              >
                Ocultar
              </button>
            </div>
          </div>
        <div className="mt-3 max-h-[60vh] space-y-2 overflow-y-auto pr-1">
          {routeStopVoters.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-white/20 bg-white/5 px-3 py-2 text-xs text-white/50">
              Agrega votantes para trazar la ruta
            </p>
          ) : (
              routeStopVoters.map((voter, index) => (
                <div
                  key={voter.id}
                  draggable
                  onDragStart={() => setDraggingId(voter.id)}
                  onDragEnd={() => setDraggingId(null)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => handleDropOnRoute(voter.id)}
                  className="flex items-start justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-2 hover:cursor-grab"
                >
                  <div className="mr-3 flex h-8 w-2 items-center justify-center">
                    <div className="h-2 w-full rounded-full bg-white/50" />
                    <div className="mt-1 h-2 w-full rounded-full bg-white/50" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-[12px] font-semibold">
                      {index + 1}. {voter.name}
                    </p>
                    <p className="text-[11px] text-white/60">
                      {voter.neighborhood}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                  <div className="flex gap-1">
                    <button
                      onClick={() => moveRouteStop(voter.id, "up")}
                      disabled={index === 0}
                      className="rounded-full border border-white/10 px-2 text-[10px] text-white/50 disabled:text-white/20"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => moveRouteStop(voter.id, "down")}
                      disabled={index === routeStopVoters.length - 1}
                      className="rounded-full border border-white/10 px-2 text-[10px] text-white/50 disabled:text-white/20"
                    >
                      ↓
                    </button>
                  </div>
                  <button
                    onClick={() => removeRouteStop(voter.id)}
                    className="rounded-full border border-rose-400/40 px-2 text-[10px] text-rose-200"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="mt-4 space-y-2">
          <button
            onClick={() => addRouteStop(selectedId ?? "")}
            disabled={!selectedId || routeStops.includes(selectedId)}
            className="w-full rounded-full border border-white/10 bg-emerald-500/10 px-3 py-2 text-[11px] font-semibold text-emerald-100 transition hover:bg-emerald-500/20 disabled:opacity-50"
          >
            Agregar votante seleccionado
          </button>
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <input
                value={routeCandidate}
                onChange={(event) => setRouteCandidate(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    if (routeCandidate && !routeStops.includes(routeCandidate)) {
                      addRouteStop(routeCandidate);
                      setRouteCandidate("");
                    }
                  }
                }}
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white focus:border-emerald-400/60 focus:outline-none"
                placeholder="Busca por nombre o barrio"
              />
              <button
                onClick={() => {
                  if (routeCandidate && !routeStops.includes(routeCandidate)) {
                    addRouteStop(routeCandidate);
                    setRouteCandidate("");
                  }
                }}
                disabled={!routeCandidate || routeStops.includes(routeCandidate)}
                className="rounded-full border border-white/10 px-3 py-2 text-[11px] text-white/70 hover:border-white/40 disabled:opacity-50"
              >
                Agregar
              </button>
            </div>
            {routeSuggestions.length > 0 ? (
              <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] text-white/70">
                {routeSuggestions.map((voter) => (
                  <button
                    key={voter.id}
                    onClick={() => {
                      addRouteStop(voter.id);
                      setRouteCandidate("");
                    }}
                    className="w-full text-left hover:text-white"
                  >
                    {voter.name} · {voter.neighborhood}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <input
              value={routeName}
              onChange={(event) => setRouteName(event.target.value)}
              placeholder="Nombre de la ruta"
              className="col-span-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white focus:border-emerald-400/60 focus:outline-none"
            />
            <input
              type="date"
              value={routeDate}
              onChange={(event) => setRouteDate(event.target.value)}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white focus:border-emerald-400/60 focus:outline-none"
            />
            <input
              type="time"
              value={routeTime}
              onChange={(event) => setRouteTime(event.target.value)}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white focus:border-emerald-400/60 focus:outline-none"
            />
            <button
              onClick={saveCurrentRoute}
              disabled={routeStops.length === 0}
              className="rounded-full border border-white/10 bg-emerald-500/10 px-3 py-2 text-[11px] font-semibold text-emerald-100 transition hover:bg-emerald-500/20 disabled:opacity-50"
            >
              Guardar ruta
            </button>
          </div>
          {savedRoutes.length > 0 ? (
            <div className="space-y-2">
              <p className="text-[11px] uppercase text-white/40 tracking-[0.3em]">
                Rutas guardadas
              </p>
              {savedRoutes.map((route) => (
                <div
                  key={route.id}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] text-white"
                >
                  <div>
                    <p className="font-semibold">{route.name}</p>
                    <p className="text-white/60">
                      {route.date ?? "Fecha sin asignar"} ·{" "}
                      {route.time ?? "Hora sin asignar"}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 text-white/50">
                    <button
                      onClick={() => loadSavedRoute(route.id)}
                      className="text-[10px] hover:text-white"
                    >
                      Cargar
                    </button>
                    <button
                      onClick={() => deleteSavedRoute(route.id)}
                      className="text-[10px] text-rose-200 hover:text-white"
                    >
                      Borrar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
      ) : null}
      {isSearchOpen ? (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-black/70 backdrop-blur"
          onClick={() => setIsSearchOpen(false)}
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
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleSearch(searchQuery);
                    }
                    if (event.key === "Escape") {
                      setIsSearchOpen(false);
                    }
                  }}
                  className="w-full bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
                  placeholder="Buscar municipio o ciudad"
                />
                <button
                  onClick={() => handleSearch(searchQuery)}
                  disabled={searching}
                  className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-white/70 hover:border-white/30 disabled:opacity-60"
                >
                  {searching ? "..." : "Buscar"}
                </button>
              </div>
              {searchError ? (
                <p className="mt-3 text-xs text-rose-200">{searchError}</p>
              ) : null}
              {searchResults.length > 0 ? (
                <div className="mt-3 max-h-64 overflow-auto rounded-2xl border border-white/10 bg-white/5">
                  {searchResults.map((result) => (
                    <button
                      key={`${result.lat}-${result.lon}-${result.display_name}`}
                      onClick={() => handleSelectResult(result)}
                    className="w-full px-4 py-3 text-left text-xs text-white/70 hover:bg-white/10"
                    >
                      {result.display_name}
                    </button>
                  ))}
                </div>
              ) : null}
              <div className="mt-3 flex justify-end">
                <button
                  onClick={() => setIsSearchOpen(false)}
                  className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-white/60 hover:border-white/30"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {isModalOpen ? (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/60 p-6">
          <div className="w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-3xl border border-white/10 bg-[var(--panel-strong)]/95 p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/70">
                  {mode === "create" ? "Nuevo votante" : "Editar votante"}
                </p>
                <h3 className="font-[var(--font-display)] text-xl text-white">
                  Información principal
                </h3>
              </div>
              <button
                onClick={requestCloseModal}
                className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70"
              >
                Cerrar
              </button>
            </div>

            <div className="modal-scroll mt-5 max-h-[calc(85vh-190px)] overflow-y-auto pr-3">
              <div className="space-y-5">
              <div className="space-y-3">
                <p className="text-[11px] uppercase tracking-[0.35em] text-white/40">
                  Identificación
                </p>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label className="text-xs text-white/60 md:col-span-2">
                    Nombre completo
                    <input
                      value={form.name}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          name: event.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-emerald-400/60 focus:outline-none"
                    />
                  </label>
                  <label className="text-xs text-white/60">
                    Tipo de documento
                    <select
                      value={form.documentType}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          documentType: event.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-emerald-400/60 focus:outline-none"
                    >
                      <option className="text-black" value="Cédula de ciudadanía">
                        Cédula de ciudadanía
                      </option>
                      <option className="text-black" value="Cédula de extranjería">
                        Cédula de extranjería
                      </option>
                      <option className="text-black" value="Pasaporte">
                        Pasaporte
                      </option>
                      <option className="text-black" value="Tarjeta de identidad">
                        Tarjeta de identidad
                      </option>
                    </select>
                  </label>
                  <label className="text-xs text-white/60">
                    Número de documento
                    <input
                      value={form.documentNumber}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          documentNumber: event.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-emerald-400/60 focus:outline-none"
                    />
                  </label>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[11px] uppercase tracking-[0.35em] text-white/40">
                  Contacto
                </p>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label className="text-xs text-white/60">
                    Teléfono
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          phone: event.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-emerald-400/60 focus:outline-none"
                    />
                  </label>
                  <label className="text-xs text-white/60">
                    Correo (opcional)
                    <input
                      type="email"
                      value={form.email}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          email: event.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-emerald-400/60 focus:outline-none"
                    />
                  </label>
                  <label className="text-xs text-white/60 md:col-span-2">
                    Dirección
                    <input
                      value={form.address}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          address: event.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-emerald-400/60 focus:outline-none"
                    />
                  </label>
                  <label className="text-xs text-white/60">
                    Barrio
                    <input
                      value={form.neighborhood}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          neighborhood: event.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-emerald-400/60 focus:outline-none"
                    />
                  </label>
                  <label className="text-xs text-white/60 md:col-span-2">
                    Enlace de Google Maps (opcional)
                    <div className="mt-2 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                      <input
                        value={form.locationLink}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            locationLink: event.target.value,
                          }))
                        }
                        onBlur={(event) => applyLocationLink(event.target.value)}
                        className="w-full bg-transparent text-sm text-white focus:outline-none"
                        placeholder="https://maps.google.com/..."
                      />
                      <button
                        type="button"
                        onClick={() => applyLocationLink(form.locationLink)}
                        className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-white/70 hover:border-white/30"
                      >
                        Usar
                      </button>
                    </div>
                    {locationLinkError ? (
                      <p className="mt-2 text-[11px] text-rose-200">
                        {locationLinkError}
                      </p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-white/50">
                      <span>
                        Coordenadas actuales: {form.lat.toFixed(4)},{" "}
                        {form.lng.toFixed(4)}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsModalOpen(false);
                          setPickMode(true);
                        }}
                        className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-[11px] text-emerald-100 hover:bg-emerald-500/20"
                      >
                        Seleccionar en mapa
                      </button>
                    </div>
                  </label>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[11px] uppercase tracking-[0.35em] text-white/40">
                  Gestión
                </p>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label className="text-xs text-white/60">
                    Estado
                    <select
                      value={form.status}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          status: event.target.value as VoterStatus,
                        }))
                      }
                      className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-emerald-400/60 focus:outline-none"
                    >
                      <option className="text-black" value="Confirmado">
                        Confirmado
                      </option>
                      <option className="text-black" value="Pendiente">
                        Pendiente
                      </option>
                      <option className="text-black" value="En revisión">
                        En revisión
                      </option>
                    </select>
                  </label>
                  <label className="text-xs text-white/60">
                    Prioridad
                    <select
                      value={form.priority}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          priority: event.target.value as VoterPriority,
                        }))
                      }
                      className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-emerald-400/60 focus:outline-none"
                    >
                      <option className="text-black" value="Alta">
                        Alta
                      </option>
                      <option className="text-black" value="Media">
                        Media
                      </option>
                      <option className="text-black" value="Baja">
                        Baja
                      </option>
                    </select>
                  </label>
                  <label className="text-xs text-white/60">
                    Afinidad (%)
                    <input
                      type="number"
                      value={form.support}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          support: Number(event.target.value),
                        }))
                      }
                      className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-emerald-400/60 focus:outline-none"
                    />
                  </label>
                  <label className="text-xs text-white/60">
                    Visitas
                    <input
                      type="number"
                      value={form.visits}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          visits: Number(event.target.value),
                        }))
                      }
                      className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-emerald-400/60 focus:outline-none"
                    />
                  </label>
                  <label className="text-xs text-white/60 md:col-span-2">
                    Notas
                    <textarea
                      value={form.notes}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          notes: event.target.value,
                        }))
                      }
                      rows={3}
                      className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-emerald-400/60 focus:outline-none"
                    />
                  </label>
                </div>
              </div>
              </div>
            </div>

            <div className="-mx-6 mt-5 flex justify-end gap-2 border-t border-white/10 bg-[var(--panel-strong)]/95 px-6 py-4">
              <button
                onClick={requestCloseModal}
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/70"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="rounded-full bg-emerald-400/20 px-5 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-400/30 disabled:opacity-60"
              >
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showDiscardWarning ? (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/70 p-6">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[var(--panel-strong)]/95 p-5 text-white shadow-2xl">
            <h4 className="text-lg font-semibold">¿Descartar cambios?</h4>
            <p className="mt-2 text-sm text-white/70">
              Tienes cambios sin guardar. Si cierras ahora, se perderán.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setShowDiscardWarning(false)}
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/70"
              >
                Seguir editando
              </button>
              <button
                onClick={() => {
                  setShowDiscardWarning(false);
                  setIsModalOpen(false);
                  setPickMode(false);
                  setIsFormDirty(false);
                }}
                className="rounded-full bg-rose-500/20 px-4 py-2 text-sm font-semibold text-rose-100"
              >
                Descartar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
