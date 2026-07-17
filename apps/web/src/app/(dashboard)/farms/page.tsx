"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Farm, MapMarker } from "@/types";
import { Search, MapPin, ChevronRight, Leaf } from "lucide-react";
import Link from "next/link";

export default function FarmsPage() {
    const [farms, setFarms] = useState<Farm[]>([]);
    const [markers, setMarkers] = useState<MapMarker[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        const fetchFarms = async () => {
            try {
                const [farmsRes, markersRes] = await Promise.all([
                    api.get<Farm[]>("/farms"),
                    api.get<MapMarker[]>("/map"),
                ]);
                setFarms(farmsRes.data);
                setMarkers(markersRes.data);
            } catch (error) {
                console.error("Failed to fetch farms:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchFarms();
    }, []);

    const getMarkerForFarm = (farmId: number) =>
        markers.find((m) => m.farm_id === farmId);

    const getStatusInfo = (status: string) => {
        const map: Record<string, { label: string; color: string; bg: string; dot: string }> = {
            ready: { label: "Siap Panen", color: "text-red-700", bg: "bg-red-100", dot: "bg-red-500" },
            near: { label: "Mendekati Panen", color: "text-yellow-700", bg: "bg-yellow-100", dot: "bg-yellow-500" },
            disease: { label: "Alert Hama", color: "text-gray-700", bg: "bg-gray-200", dot: "bg-gray-800" },
            healthy: { label: "Sehat", color: "text-green-700", bg: "bg-green-100", dot: "bg-green-500" },
        };
        return map[status] || map.healthy;
    };

    const getPriorityColor = (priority: string) => {
        if (priority === "HIGH" || priority === "CRITICAL") return "text-red-600 font-bold";
        if (priority === "MEDIUM") return "text-yellow-600 font-semibold";
        return "text-green-600";
    };

    const filteredFarms = farms.filter(
        (f) =>
            f.name.toLowerCase().includes(search.toLowerCase()) ||
            f.variety?.toLowerCase().includes(search.toLowerCase()) ||
            f.owner?.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900">Daftar Lahan</h1>
                    <p className="text-gray-500 text-sm">Kelola dan pantau lahan cabai Anda</p>
                </div>
                <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-bold">
                    {farms.length} Lahan
                </span>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                    type="text"
                    placeholder="Cari lahan, varietas, atau pemilik..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
                />
            </div>

            {/* Farms List */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                {filteredFarms.length === 0 ? (
                    <div className="p-12 text-center">
                        <Leaf className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">
                            {search ? `Tidak ada lahan yang cocok dengan \"${search}\"` : "Belum ada data lahan"}
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {filteredFarms.map((farm) => {
                            const marker = getMarkerForFarm(farm.id);
                            const status = marker?.status || "healthy";
                            const statusInfo = getStatusInfo(status);
                            const priority = marker?.priority || "LOW";
                            const readiness = marker?.latest_prediction?.harvest_readiness;

                            return (
                                <Link
                                    key={farm.id}
                                    href={`/farms/${farm.id}`}
                                    className="block hover:bg-gray-50 transition-colors"
                                >
                                    <div className="p-4 md:p-5 flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-3 md:gap-4">
                                            {/* Status dot indicator */}
                                            <div className="flex-shrink-0 relative">
                                                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl ${statusInfo.bg} flex items-center justify-center`}>
                                                    <Leaf className={`w-5 h-5 md:w-6 md:h-6 ${statusInfo.color}`} />
                                                </div>
                                                <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 md:w-3.5 md:h-3.5 rounded-full border-2 border-white ${statusInfo.dot}`} />
                                            </div>

                                            <div className="min-w-0">
                                                <h3 className="font-semibold text-gray-900 text-sm md:text-base">{farm.name}</h3>
                                                <div className="flex items-center gap-2 md:gap-3 mt-1 text-xs md:text-sm text-gray-500">
                                                    <span>{farm.variety}</span>
                                                    <span className="text-gray-300 hidden sm:inline">-</span>
                                                    <span className="hidden sm:inline">{farm.owner}</span>
                                                </div>
                                                <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                                                    <MapPin className="w-3 h-3" />
                                                    <span>{farm.latitude?.toFixed(4)}, {farm.longitude?.toFixed(4)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 flex-shrink-0">
                                            {/* Status & Priority */}
                                            <div className="text-right hidden sm:block">
                                                <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.color}`}>
                                                    {statusInfo.label}
                                                </span>
                                                {readiness !== undefined && readiness !== null && (
                                                    <div className="mt-1.5">
                                                        <div className="flex items-center gap-1.5 justify-end">
                                                            <div className="w-16 bg-gray-200 rounded-full h-1.5">
                                                                <div
                                                                    className={`h-1.5 rounded-full ${readiness > 70 ? "bg-red-500" : readiness > 50 ? "bg-yellow-500" : "bg-green-500"}`}
                                                                    style={{ width: `${Math.min(readiness, 100)}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-xs text-gray-500">{readiness.toFixed(0)}%</span>
                                                        </div>
                                                    </div>
                                                )}
                                                {priority && (
                                                    <p className={`text-xs mt-1 ${getPriorityColor(priority)}`}>
                                                        {priority}
                                                    </p>
                                                )}
                                            </div>

                                            <ChevronRight className="w-5 h-5 text-gray-400" />
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}