"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { MapMarker as MapMarkerType } from "@/types";
import { DynamicMap } from "@/components/map/DynamicMap";
import { FarmSidebar } from "@/components/map/FarmSidebar";

export default function MapPage() {
    const [markers, setMarkers] = useState<MapMarkerType[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMarker, setSelectedMarker] = useState<MapMarkerType | null>(null);

    useEffect(() => {
        const fetchMarkers = async () => {
            try {
                const response = await api.get<MapMarkerType[]>("/map");
                setMarkers(response.data);
            } catch (error) {
                console.error("Failed to fetch map markers:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchMarkers();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Peta Regional</h1>
                <p className="text-gray-500">Monitoring lahan cabai seluruh wilayah</p>
            </div>

            {/* Legend */}
            <div className="bg-white rounded-lg shadow p-4 flex flex-wrap gap-4">
                <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded-full bg-green-500"></div>
                    <span className="text-sm text-gray-600">Healthy</span>
                </div>
                <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                    <span className="text-sm text-gray-600">Near Harvest</span>
                </div>
                <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded-full bg-red-500"></div>
                    <span className="text-sm text-gray-600">Ready Harvest</span>
                </div>
                <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded-full bg-gray-800"></div>
                    <span className="text-sm text-gray-600">Disease Alert</span>
                </div>
            </div>

            {/* Interactive Map */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <DynamicMap
                    markers={markers}
                    onMarkerClick={(marker) => setSelectedMarker(marker)}
                    center={markers.length > 0 ? [markers[0].latitude, markers[0].longitude] : [-6.2, 106.8]}
                    zoom={11}
                />
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-sm text-gray-500">Total Farms</div>
                    <div className="text-2xl font-bold text-gray-900">{markers.length}</div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-sm text-gray-500">Ready Harvest</div>
                    <div className="text-2xl font-bold text-red-600">
                        {markers.filter((m) => m.status === "ready").length}
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-sm text-gray-500">Near Harvest</div>
                    <div className="text-2xl font-bold text-yellow-600">
                        {markers.filter((m) => m.status === "near").length}
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-sm text-gray-500">Healthy</div>
                    <div className="text-2xl font-bold text-green-600">
                        {markers.filter((m) => m.status === "healthy").length}
                    </div>
                </div>
            </div>

            {/* Farm Sidebar */}
            <FarmSidebar marker={selectedMarker} onClose={() => setSelectedMarker(null)} />
        </div>
    );
}