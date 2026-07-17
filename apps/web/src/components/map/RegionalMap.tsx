"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { MapMarker as MapMarkerType } from "@/types";
import { getMarkerColor } from "@/lib/utils";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface RegionalMapProps {
    markers: MapMarkerType[];
    onMarkerClick?: (marker: MapMarkerType) => void;
    center?: [number, number];
    zoom?: number;
}

function createCustomIcon(color: string) {
    return L.divIcon({
        className: "custom-marker",
        html: `<div style="
            background-color: ${color};
            width: 24px;
            height: 24px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        "></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12],
    });
}

function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, zoom);
    }, [center, zoom, map]);
    return null;
}

export function RegionalMap({
    markers,
    onMarkerClick,
    center = [-6.2, 106.8],
    zoom = 10,
}: RegionalMapProps) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return (
            <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">Loading map...</p>
            </div>
        );
    }

    return (
        <div className="h-96 rounded-lg overflow-hidden shadow">
            <MapContainer
                center={center}
                zoom={zoom}
                zoomControl={false}
                style={{ height: "100%", width: "100%" }}
                className="z-0"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapController center={center} zoom={zoom} />
                {markers.map((marker) => (
                    <Marker
                        key={marker.farm_id}
                        position={[marker.latitude, marker.longitude]}
                        icon={createCustomIcon(getMarkerColor(marker.status))}
                        eventHandlers={{
                            click: () => onMarkerClick?.(marker),
                        }}
                    >
                        <Popup>
                            <div className="min-w-[200px]">
                                <h3 className="font-semibold text-gray-900">{marker.name}</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    Readiness:{" "}
                                    {marker.latest_prediction?.harvest_readiness?.toFixed(1) || "N/A"}%
                                </p>
                                <p className="text-sm text-gray-500">
                                    Fruit Count: {marker.latest_prediction?.fruit_count || "N/A"}
                                </p>
                                <p className="text-sm text-gray-500">
                                    Status: {marker.status}
                                </p>
                                {marker.priority && (
                                    <p className="text-sm font-medium mt-1">
                                        Priority: {marker.priority}
                                    </p>
                                )}
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}