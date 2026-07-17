"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { MapMarker } from "@/types";

const MapContainer = dynamic(
    () => import("react-leaflet").then((mod) => mod.MapContainer),
    { ssr: false }
);
const TileLayer = dynamic(
    () => import("react-leaflet").then((mod) => mod.TileLayer),
    { ssr: false }
);
const Marker = dynamic(
    () => import("react-leaflet").then((mod) => mod.Marker),
    { ssr: false }
);
const Tooltip = dynamic(
    () => import("react-leaflet").then((mod) => mod.Tooltip),
    { ssr: false }
);

interface DynamicMapProps {
    markers: MapMarker[];
    center?: [number, number];
    zoom?: number;
    onMarkerClick?: (marker: MapMarker) => void;
    height?: string;
    fullscreen?: boolean;
    selectedFarmId?: number | null;
}

export function DynamicMap({
    markers,
    center = [-6.8100, 107.0250],
    zoom = 16,
    onMarkerClick,
    height = "h-96",
    fullscreen = false,
    selectedFarmId,
}: DynamicMapProps) {
    const [mounted, setMounted] = useState(false);
    const [L, setL] = useState<any>(null);

    useEffect(() => {
        setMounted(true);
        import("leaflet").then((leaflet) => {
            setL(leaflet.default);
        });
    }, []);

    if (!mounted || !L) {
        return (
            <div className={`${height} bg-gray-100 rounded-lg flex items-center justify-center`}>
                <div className="animate-pulse text-gray-400">Loading map...</div>
            </div>
        );
    }

    const createChiliMarkerIcon = (status: string, isSelected: boolean = false) => {
        const colors: Record<string, string> = {
            healthy: "#22c55e",
            near: "#eab308",
            ready: "#ef4444",
            disease: "#1f2937",
        };

        const color = colors[status] || colors.healthy;
        const size = isSelected ? 56 : 44;
        const shadowSize = isSelected ? 18 : 14;

        const svgIcon = `
            <svg width="${size}" height="${size + 8}" viewBox="0 0 ${size} ${size + 8}" xmlns="http://www.w3.org/2000/svg">
                <ellipse cx="${size / 2}" cy="${size + 4}" rx="${shadowSize}" ry="${shadowSize / 3}" fill="rgba(0,0,0,0.25)"/>
                <path d="M${size / 2} ${isSelected ? 6 : 8}C${size / 2 - 12} ${isSelected ? 6 : 8} ${size / 2 - 16} 14 ${size / 2 - 16} 22C${size / 2 - 16} 32 ${size / 2} ${size - 2} ${size / 2} ${size - 2}C${size / 2} ${size - 2} ${size / 2 + 16} 32 ${size / 2 + 16} 22C${size / 2 + 16} 14 ${size / 2 + 12} ${isSelected ? 6 : 8} ${size / 2} ${isSelected ? 6 : 8}Z" 
                      fill="${color}" stroke="white" stroke-width="${isSelected ? 3 : 2}"/>
                <circle cx="${size / 2}" cy="${size / 2 - 4}" r="${size / 4}" fill="white" opacity="0.95"/>
                <text x="${size / 2}" y="${size / 2 + 2}" text-anchor="middle" dominant-baseline="middle" font-size="${isSelected ? 18 : 14}">🌶️</text>
            </svg>
        `;

        return L.divIcon({
            html: svgIcon,
            className: "chili-marker",
            iconSize: [size, size + 8],
            iconAnchor: [size / 2, size + 8],
            popupAnchor: [0, -size],
        });
    };

    const mapCenter = markers.length > 0
        ? [
            markers.reduce((sum, m) => sum + m.latitude, 0) / markers.length,
            markers.reduce((sum, m) => sum + m.longitude, 0) / markers.length
          ] as [number, number]
        : center;

    return (
        <div className={`${height} ${fullscreen ? "w-full" : ""} rounded-lg overflow-hidden relative`}>
            <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossOrigin="" />
            <MapContainer
                center={mapCenter}
                zoom={zoom}
                zoomControl={false}
                style={{ height: "100%", width: "100%" }}
                className="z-0"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {markers.map((marker) => (
                    <Marker
                        key={marker.farm_id}
                        position={[marker.latitude, marker.longitude]}
                        icon={createChiliMarkerIcon(marker.status, selectedFarmId === marker.farm_id)}
                        eventHandlers={{
                            click: () => onMarkerClick?.(marker),
                        }}
                    >
                        <Tooltip direction="top" offset={[0, -50]} opacity={1} permanent>
                            <div className="text-center px-2 py-1">
                                <div className="font-bold text-sm">{marker.name}</div>
                                <div className="text-xs text-gray-500">
                                    {marker.latest_prediction?.harvest_readiness?.toFixed(0) || 0}% Ready
                                </div>
                            </div>
                        </Tooltip>
                    </Marker>
                ))}
            </MapContainer>

            <style jsx global>{`
                .chili-marker {
                    background: none !important;
                    border: none !important;
                }
                .leaflet-tooltip {
                    background: white;
                    border: 2px solid #22c55e;
                    border-radius: 10px;
                    padding: 6px 10px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    font-family: inherit;
                }
                .leaflet-tooltip::before {
                    border-top-color: #22c55e !important;
                }
            `}</style>
        </div>
    );
}