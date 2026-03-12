"use client";

import { useEffect, useRef } from "react";
import {
  CircleMarker,
  MapContainer,
  Polyline,
  TileLayer,
  Popup,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";
import type { Voter } from "@/lib/voters-store";
import type { Map as LeafletMap } from "leaflet";
import type L from "leaflet";

const center: [number, number] = [4.6486, -74.0736];

function FlyToSelected({ selected }: { selected: Voter | null }) {
  const map = useMap();

  useEffect(() => {
    if (!selected) return;
    map.flyTo([selected.lat, selected.lng], Math.max(map.getZoom(), 13), {
      duration: 0.8,
    });
  }, [map, selected]);

  return null;
}

function LocationWatcher({
  onLocation,
}: {
  onLocation: (label: string, detail: string) => void;
}) {
  const map = useMap();
  const controllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    let aborted = false;
    const loadLocation = async (lat: number, lng: number) => {
      try {
        controllerRef.current?.abort();
        const controller = new AbortController();
        controllerRef.current = controller;

        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=12&accept-language=es`,
          { signal: controller.signal }
        );
        if (!response.ok) throw new Error("reverse geocode failed");
        const data = (await response.json()) as {
          address?: Record<string, string>;
          display_name?: string;
        };
        const address = data.address ?? {};
        const city =
          address.city ||
          address.town ||
          address.village ||
          address.municipality ||
          address.county ||
          "Sin ciudad";
        const region = address.state || address.region || address.country || "";
        const detail =
          data.display_name?.split(",").slice(0, 2).join(", ") || "";
        if (!aborted) {
          onLocation(city, region || detail);
        }
      } catch (error) {
        if (!aborted) {
          onLocation("Sin ubicación", "");
        }
      }
    };

    const handleMoveEnd = () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = window.setTimeout(() => {
        const center = map.getCenter();
        loadLocation(center.lat, center.lng);
      }, 300);
    };

    handleMoveEnd();
    map.on("moveend", handleMoveEnd);

    return () => {
      aborted = true;
      controllerRef.current?.abort();
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
      map.off("moveend", handleMoveEnd);
    };
  }, [map, onLocation]);

  return null;
}

export function MapView({
  voters,
  selectedId,
  onSelect,
  onLocationChange,
  interactionEnabled,
  onMapReady,
  onClearSelected,
  onEdit,
  onDelete,
  tileUrl,
  tileAttribution,
  initialCenter,
  initialZoom,
  pickMode,
  onPickLocation,
  routePositions,
}: {
  voters: Voter[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onLocationChange: (label: string, detail: string) => void;
  interactionEnabled: boolean;
  onMapReady?: (map: LeafletMap) => void;
  onClearSelected: () => void;
  onEdit: (voter: Voter) => void;
  onDelete: (id: string) => void;
  tileUrl: string;
  tileAttribution: string;
  initialCenter?: [number, number];
  initialZoom?: number;
  pickMode: boolean;
  onPickLocation: (lat: number, lng: number) => void;
  routePositions?: [number, number][];
}) {
  const selected = voters.find((voter) => voter.id === selectedId) ?? null;

  return (
    <MapContainer
      center={initialCenter ?? center}
      zoom={initialZoom ?? 12}
      scrollWheelZoom={interactionEnabled}
      className={`h-full w-full ${pickMode ? "cursor-crosshair" : ""}`}
    >
      <TileLayer attribution={tileAttribution} url={tileUrl} />
      {routePositions && routePositions.length > 1 ? (
        <Polyline
          positions={routePositions}
          pathOptions={{ color: "#38f5b1", weight: 3, opacity: 0.8 }}
        />
      ) : null}
      {voters.map((voter) => {
        const isSelected = voter.id === selectedId;
        return (
          <CircleMarker
            key={voter.id}
            center={[voter.lat, voter.lng]}
            radius={isSelected ? 12 : 9}
            pathOptions={{
              color: isSelected ? "#38f5b1" : "#8bd3ff",
              fillColor: isSelected ? "#38f5b1" : "#1b2333",
              fillOpacity: isSelected ? 0.8 : 0.65,
              weight: isSelected ? 2 : 1.2,
            }}
            eventHandlers={{
              click: () => {
                if (!interactionEnabled || pickMode) return;
                onSelect(voter.id);
              },
            }}
          >
            <Tooltip direction="top" offset={[0, -8]} opacity={1}>
              {voter.name}
            </Tooltip>
          </CircleMarker>
        );
      })}
      <PickLocationHandler enabled={pickMode} onPick={onPickLocation} />
      <SelectedPopup
        selected={selected}
        onClearSelected={onClearSelected}
        onEdit={onEdit}
        onDelete={onDelete}
      />
      <FlyToSelected selected={selected} />
      <LocationWatcher onLocation={onLocationChange} />
      <InteractionToggle enabled={interactionEnabled} />
      <MapReady onReady={onMapReady} />
    </MapContainer>
  );
}

function PickLocationHandler({
  enabled,
  onPick,
}: {
  enabled: boolean;
  onPick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(event) {
      if (!enabled) return;
      onPick(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

function InteractionToggle({ enabled }: { enabled: boolean }) {
  const map = useMap();

  useEffect(() => {
    if (enabled) {
      map.dragging.enable();
      map.scrollWheelZoom.enable();
      map.doubleClickZoom.enable();
      map.boxZoom.enable();
      map.keyboard.enable();
      return;
    }
    map.dragging.disable();
    map.scrollWheelZoom.disable();
    map.doubleClickZoom.disable();
    map.boxZoom.disable();
    map.keyboard.disable();
  }, [enabled, map]);

  return null;
}

function MapReady({ onReady }: { onReady?: (map: LeafletMap) => void }) {
  const map = useMap();

  useEffect(() => {
    onReady?.(map);
  }, [map, onReady]);

  return null;
}

function SelectedPopup({
  selected,
  onClearSelected,
  onEdit,
  onDelete,
}: {
  selected: Voter | null;
  onClearSelected: () => void;
  onEdit: (voter: Voter) => void;
  onDelete: (id: string) => void;
}) {
  const map = useMap();
  const popupRef = useRef<L.Popup | null>(null);

  useEffect(() => {
    if (!selected || !popupRef.current) return;
    map.openPopup(popupRef.current);
  }, [map, selected]);

  useEffect(() => {
    if (!selected) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        map.closePopup();
        onClearSelected();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [map, onClearSelected, selected]);

  if (!selected) return null;

  return (
    <Popup
      ref={popupRef}
      position={[selected.lat, selected.lng]}
      closeButton
      autoClose={false}
      closeOnClick={false}
      autoPan
      eventHandlers={{
        remove: () => onClearSelected(),
      }}
    >
      <div className="w-[240px] space-y-3 text-sm">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-200/70">
            Perfil activo
          </p>
          <h3 className="text-base font-semibold text-white">
            {selected.name}
          </h3>
          <p className="text-xs text-white/60">{selected.neighborhood}</p>
        </div>
        <div className="space-y-1 text-xs text-white/70">
          <p>
            {selected.documentType}: {selected.documentNumber}
          </p>
          <p>{selected.phone}</p>
          {selected.email ? <p>{selected.email}</p> : null}
          <p>{selected.address}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs text-white/70">
          <div className="rounded-lg border border-white/10 bg-white/10 p-2">
            <p className="text-[10px] uppercase text-white/40">Afinidad</p>
            <p className="text-sm font-semibold text-white">
              {selected.support}%
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/10 p-2">
            <p className="text-[10px] uppercase text-white/40">Visitas</p>
            <p className="text-sm font-semibold text-white">
              {selected.visits}
            </p>
          </div>
        </div>
        <p className="text-xs text-white/70">{selected.notes}</p>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(selected)}
            className="flex-1 rounded-full bg-emerald-400/20 py-1.5 text-xs font-semibold text-emerald-100"
          >
            Editar
          </button>
          <button
            onClick={() => onDelete(selected.id)}
            className="flex-1 rounded-full border border-rose-400/40 bg-rose-500/10 py-1.5 text-xs font-semibold text-rose-100"
          >
            Eliminar
          </button>
        </div>
      </div>
    </Popup>
  );
}
