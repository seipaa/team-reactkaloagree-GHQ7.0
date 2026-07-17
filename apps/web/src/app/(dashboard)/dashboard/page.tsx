"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { DashboardData, Weather, MapMarker, Farm } from "@/types";
import { DynamicMap } from "@/components/map/DynamicMap";
import Link from "next/link";
import {
    MapPin,
    Thermometer,
    Droplets,
    Wind,
    CloudRain,
    ArrowRight,
    AlertCircle,
    CheckCircle,
    Clock,
    Leaf
} from "lucide-react";

export default function DashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [weather, setWeather] = useState<Weather | null>(null);
    const [farms, setFarms] = useState<Farm[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedFarm, setSelectedFarm] = useState<MapMarker | null>(null);
    const [activeMobileTab, setActiveMobileTab] = useState<"farm" | "weather" | "recommendations">("farm");

    const fetchDashboard = useCallback(async () => {
        try {
            const [dashboardRes, weatherRes, farmsRes] = await Promise.all([
                api.get<DashboardData>("/dashboard"),
                api.get<Weather>("/weather"),
                api.get<Farm[]>("/farms")
            ]);
            setData(dashboardRes.data);
            setWeather(weatherRes.data);
            setFarms(farmsRes.data);

            // Auto-select first farm
            if (!selectedFarm && dashboardRes.data.map_markers.length > 0) {
                setSelectedFarm(dashboardRes.data.map_markers[0]);
            }
        } catch (error) {
            console.error("Failed to fetch dashboard:", error);
        } finally {
            setLoading(false);
        }
    }, [selectedFarm]);

    useEffect(() => {
        fetchDashboard();
        const intervalId = setInterval(() => fetchDashboard(), 5 * 60 * 1000);
        return () => clearInterval(intervalId);
    }, [fetchDashboard]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                    <p className="text-gray-500 font-medium text-sm">Memuat dashboard...</p>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <div className="text-center p-8 bg-white border rounded-xl shadow-sm">
                    <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 font-semibold">Gagal memuat data dashboard.</p>
                </div>
            </div>
        );
    }

    const selectedFarmInfo = selectedFarm ? farms.find(f => f.id === selectedFarm.farm_id) : null;
    const totalFarms = data.total_farms;
    const readyCount = data.ready_harvest_count;
    const nearCount = data.near_harvest_count;
    const diseaseCount = data.disease_alerts;

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            healthy: "bg-green-500",
            near: "bg-yellow-500",
            ready: "bg-red-500",
            disease: "bg-gray-800"
        };
        return colors[status] || colors.healthy;
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            healthy: "Sehat",
            near: "Mendekati Panen",
            ready: "Siap Panen",
            disease: "Alert Hama"
        };
        return labels[status] || labels.healthy;
    };

    const getPriorityColor = (priority: string) => {
        if (priority === "HIGH" || priority === "CRITICAL") return "bg-red-100 text-red-700";
        if (priority === "MEDIUM") return "bg-yellow-100 text-yellow-700";
        return "bg-green-100 text-green-700";
    };

    return (
        <div className="relative w-full h-full overflow-hidden bg-gray-50">
            {/* Mobile: Full Map */}
            <div className="lg:hidden absolute inset-0 z-0">
                <DynamicMap
                    markers={data.map_markers}
                    onMarkerClick={(marker) => {
                        setSelectedFarm(marker);
                        setActiveMobileTab("farm");
                    }}
                    zoom={15}
                    height="h-full"
                    selectedFarmId={selectedFarm?.farm_id}
                />
            </div>

            {/* Desktop: Full Map Background */}
            <div className="hidden lg:block absolute inset-0 z-0">
                <DynamicMap
                    markers={data.map_markers}
                    onMarkerClick={(marker) => setSelectedFarm(marker)}
                    zoom={15}
                    height="h-full"
                    selectedFarmId={selectedFarm?.farm_id}
                />
            </div>

            {/* LEFT PANEL - Desktop: Farm Details */}
            <div className="hidden lg:flex flex-col gap-4 p-4 absolute left-4 top-4 bottom-4 w-80 z-[1001] overflow-y-auto">
                {/* Farm Summary Card */}
                <div className="bg-white rounded-xl shadow-lg p-4">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                        Ringkasan Lahan
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                            <p className="text-2xl font-bold text-gray-900">{totalFarms}</p>
                            <p className="text-xs text-gray-500 mt-1">Total Lahan</p>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                            <p className="text-2xl font-bold text-green-600">{readyCount}</p>
                            <p className="text-xs text-gray-500 mt-1">Siap Panen</p>
                        </div>
                        <div className="text-center p-3 bg-yellow-50 rounded-lg">
                            <p className="text-2xl font-bold text-yellow-600">{nearCount}</p>
                            <p className="text-xs text-gray-500 mt-1">Mendekati</p>
                        </div>
                        <div className="text-center p-3 bg-red-50 rounded-lg">
                            <p className="text-2xl font-bold text-red-600">{diseaseCount}</p>
                            <p className="text-xs text-gray-500 mt-1">Alert Hama</p>
                        </div>
                    </div>
                </div>

                {/* Selected Farm Detail Card */}
                <div className="bg-white rounded-xl shadow-lg p-4">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                        {selectedFarm ? "Detail Lahan" : "Pilih Lahan"}
                    </h3>

                    {selectedFarm ? (
                        <div className="space-y-3">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h4 className="font-bold text-gray-900">{selectedFarm.name}</h4>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {selectedFarmInfo?.owner || "Pemilik lahan"}
                                    </p>
                                </div>
                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold text-white ${getStatusColor(selectedFarm.status)}`}>
                                    {getStatusLabel(selectedFarm.status)}
                                </span>
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2 text-gray-600">
                                    <MapPin size={14} className="text-gray-400" />
                                    <span>{selectedFarm.latitude.toFixed(4)}, {selectedFarm.longitude.toFixed(4)}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Leaf size={14} className="text-gray-400" />
                                    <span>{selectedFarmInfo?.variety || "Cabe Rawit"}</span>
                                </div>
                            </div>

                            {/* Prediction Data */}
                            {selectedFarm.latest_prediction && (
                                <div className="border-t pt-3 mt-3">
                                    <h5 className="text-xs font-bold text-gray-400 uppercase mb-2">Prediksi Panen</h5>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                            <p className="text-xs text-gray-400">Kesiapan</p>
                                            <p className="font-semibold text-gray-900">
                                                {selectedFarm.latest_prediction.harvest_readiness?.toFixed(0) || 0}%
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400">Kematangan</p>
                                            <p className="font-semibold text-gray-900">
                                                {selectedFarm.latest_prediction.ripeness?.toFixed(0) || 0}%
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400">Jumlah Buah</p>
                                            <p className="font-semibold text-gray-900">
                                                {selectedFarm.latest_prediction.fruit_count || 0}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400">Risiko Hama</p>
                                            <p className={`font-semibold ${selectedFarm.latest_prediction.disease_risk === 'HIGH' ? 'text-red-600' : 'text-green-600'}`}>
                                                {selectedFarm.latest_prediction.disease_risk === 'HIGH' ? 'Tinggi' : 'Rendah'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <Link
                                href={`/farms/${selectedFarm.farm_id}`}
                                className="flex items-center justify-center gap-2 w-full py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition mt-3"
                            >
                                Lihat Detail Lengkap
                                <ArrowRight size={16} />
                            </Link>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <MapPin className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm text-gray-400">Klik marker pada peta untuk melihat detail lahan</p>
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT PANEL - Desktop: Weather & Recommendations */}
            <div className="hidden lg:flex flex-col gap-4 p-4 absolute right-4 top-4 bottom-4 w-80 z-[1001] overflow-y-auto">
                {/* Weather Card - BMKG */}
                <div className="bg-white rounded-xl shadow-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                            Cuaca Terkini
                        </h3>
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold">
                            BMKG
                        </span>
                    </div>

                    {weather && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Thermometer size={20} className="text-red-500" />
                                    <span className="text-3xl font-bold text-gray-900">{weather.temperature}°C</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                <div className="text-center p-2 bg-gray-50 rounded-lg">
                                    <Droplets size={16} className="text-blue-500 mx-auto mb-1" />
                                    <p className="text-sm font-semibold text-gray-900">{weather.humidity}%</p>
                                    <p className="text-[10px] text-gray-400">Kelembaban</p>
                                </div>
                                <div className="text-center p-2 bg-gray-50 rounded-lg">
                                    <Wind size={16} className="text-gray-500 mx-auto mb-1" />
                                    <p className="text-sm font-semibold text-gray-900">{weather.wind} km/h</p>
                                    <p className="text-[10px] text-gray-400">Angin</p>
                                </div>
                                <div className="text-center p-2 bg-gray-50 rounded-lg">
                                    <CloudRain size={16} className="text-blue-400 mx-auto mb-1" />
                                    <p className="text-sm font-semibold text-gray-900">{weather.rain || 0}%</p>
                                    <p className="text-[10px] text-gray-400">Hujan</p>
                                </div>
                            </div>

                            <p className="text-[10px] text-gray-400 text-center">
                                Data diambil realtime dari API BMKG Indonesia
                            </p>
                        </div>
                    )}
                </div>

                {/* Recommendations Queue */}
                <div className="bg-white rounded-xl shadow-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                            Antrean Rekomendasi
                        </h3>
                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-[10px] font-bold">
                            {data.recommendations.length}
                        </span>
                    </div>

                    <div className="space-y-2 overflow-y-auto max-h-[290px] no-scrollbar pr-1">
                        {data.recommendations.length > 0 ? (
                            data.recommendations.map((rec, index) => (
                                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-start gap-2">
                                        <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${rec.priority === 'HIGH' || rec.priority === 'CRITICAL'
                                                ? 'bg-red-500'
                                                : rec.priority === 'MEDIUM'
                                                    ? 'bg-yellow-500'
                                                    : 'bg-green-500'
                                            }`} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium text-gray-900 leading-snug">
                                                {rec.recommendation}
                                            </p>
                                            <p className="text-[10px] text-gray-400 mt-1">
                                                {rec.farm_name}
                                            </p>
                                            <span className={`inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-medium ${getPriorityColor(rec.priority)}`}>
                                                {rec.priority}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8">
                                <CheckCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                <p className="text-sm text-gray-400">Semua lahan dalam kondisi baik</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile: Top Quick Stats Bar */}
            <div className="lg:hidden absolute top-4 left-4 right-4 z-20">
                <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-md px-4 py-2.5 border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                        <span className="text-xs font-bold text-slate-800">{totalFarms} Lahan Terpantau</span>
                    </div>
                    {readyCount > 0 && (
                        <span className="px-2 py-0.5 bg-red-50 border border-red-100 text-red-600 rounded text-[9px] font-extrabold uppercase animate-pulse">
                            {readyCount} Siap Panen
                        </span>
                    )}
                </div>
            </div>

            {/* Mobile: Active Tab Overlay Card */}
            {activeMobileTab === "farm" && (
                <div className="lg:hidden absolute bottom-16 left-4 right-4 bg-white rounded-xl shadow-xl border border-slate-100 z-20 transition-all duration-300">
                    <div className="p-4 border-b border-slate-50 flex items-center justify-between">
                        <div>
                            <h4 className="font-bold text-slate-900 text-sm">{selectedFarm ? selectedFarm.name : "Pilih Lahan"}</h4>
                            <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                                {selectedFarm ? (selectedFarmInfo?.variety || "Cabe Rawit") : "Ketuk salah satu marker di peta"}
                            </p>
                        </div>
                        {selectedFarm && (
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white ${getStatusColor(selectedFarm.status)}`}>
                                {getStatusLabel(selectedFarm.status)}
                            </span>
                        )}
                    </div>
                    {selectedFarm ? (
                        <div className="p-4 space-y-3">
                            {selectedFarm.latest_prediction && (
                                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                                        <p className="font-bold text-slate-800">{selectedFarm.latest_prediction.harvest_readiness?.toFixed(0) || 0}%</p>
                                        <p className="text-[9px] text-slate-400 mt-0.5">Kesiapan</p>
                                    </div>
                                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                                        <p className="font-bold text-slate-800">{selectedFarm.latest_prediction.fruit_count || 0}</p>
                                        <p className="text-[9px] text-slate-400 mt-0.5">Buah</p>
                                    </div>
                                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                                        <p className={`font-bold ${selectedFarm.latest_prediction.disease_risk === 'HIGH' ? 'text-red-600' : 'text-green-600'}`}>
                                            {selectedFarm.latest_prediction.disease_risk === 'HIGH' ? 'Tinggi' : 'Rendah'}
                                        </p>
                                        <p className="text-[9px] text-slate-400 mt-0.5">Risiko</p>
                                    </div>
                                </div>
                            )}
                            <Link
                                href={`/farms/${selectedFarm.farm_id}`}
                                className="flex items-center justify-center gap-1.5 w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold transition"
                            >
                                Lihat Detail Lengkap
                                <ArrowRight size={14} />
                            </Link>
                        </div>
                    ) : (
                        <div className="p-6 text-center text-slate-400 text-xs font-medium">
                            <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                            Silakan pilih marker pada peta untuk melihat detail lahan.
                        </div>
                    )}
                </div>
            )}

            {activeMobileTab === "weather" && weather && (
                <div className="lg:hidden absolute bottom-16 left-4 right-4 bg-white rounded-xl shadow-xl border border-slate-100 p-4 z-20">
                    <div className="flex items-center justify-between mb-3 border-b border-slate-50 pb-2">
                        <div className="flex items-center gap-1.5">
                            <Thermometer size={16} className="text-red-500" />
                            <span className="text-xs font-bold text-slate-800">Cuaca Lokal BMKG</span>
                        </div>
                        {weather.location && (
                            <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-0.5">
                                <MapPin size={10} className="text-slate-400" />
                                {weather.location}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-3xl font-black text-slate-800">{weather.temperature}°C</span>
                        <div className="grid grid-cols-3 gap-2 flex-1 ml-4">
                            <div className="text-center p-1.5 bg-slate-50 rounded-lg border border-slate-100">
                                <p className="text-[11px] font-bold text-slate-800">{weather.humidity}%</p>
                                <p className="text-[8px] text-slate-400">Lembab</p>
                            </div>
                            <div className="text-center p-1.5 bg-slate-50 rounded-lg border border-slate-100">
                                <p className="text-[11px] font-bold text-slate-800">{weather.wind} km/h</p>
                                <p className="text-[8px] text-slate-400">Angin</p>
                            </div>
                            <div className="text-center p-1.5 bg-slate-50 rounded-lg border border-slate-100">
                                <p className="text-[11px] font-bold text-slate-800">{weather.rain || 0}%</p>
                                <p className="text-[8px] text-slate-400">Hujan</p>
                            </div>
                        </div>
                    </div>
                    <p className="text-[8px] text-slate-400 text-center mt-2.5">
                        Data diambil secara realtime dari API BMKG Indonesia
                    </p>
                </div>
            )}

            {activeMobileTab === "recommendations" && (
                <div className="lg:hidden absolute bottom-16 left-4 right-4 bg-white rounded-xl shadow-xl border border-slate-100 p-4 z-20 max-h-[35vh] overflow-y-auto no-scrollbar">
                    <div className="flex items-center justify-between mb-3 border-b border-slate-50 pb-2">
                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                            Antrean Rekomendasi
                        </h3>
                        <span className="px-2 py-0.5 bg-yellow-50 text-yellow-700 border border-yellow-100 rounded text-[9px] font-extrabold uppercase">
                            {data.recommendations.length}
                        </span>
                    </div>
                    <div className="space-y-2">
                        {data.recommendations.length > 0 ? (
                            data.recommendations.slice(0, 5).map((rec, index) => (
                                <div key={index} className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                                    <div className="flex items-start gap-2">
                                        <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                                            rec.priority === 'HIGH' || rec.priority === 'CRITICAL' ? 'bg-red-500 animate-pulse' : 'bg-yellow-500'
                                        }`} />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-slate-800 leading-tight">
                                                {rec.recommendation}
                                            </p>
                                            <p className="text-[9px] text-slate-400 mt-0.5">
                                                {rec.farm_name} • <span className="font-semibold text-slate-500">{rec.priority}</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-4 text-slate-400 text-xs font-medium">
                                Semua lahan dalam kondisi baik
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Mobile: Bottom Navigation Bar */}
            <div className="lg:hidden absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 z-30 px-6 py-2.5 flex justify-around items-center shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
                <button
                    onClick={() => setActiveMobileTab("farm")}
                    className={`flex flex-col items-center gap-1 text-[10px] font-bold uppercase tracking-wider transition ${
                        activeMobileTab === "farm" ? "text-green-600 scale-105" : "text-slate-400 hover:text-slate-600"
                    }`}
                >
                    <Leaf size={18} className={activeMobileTab === "farm" ? "text-green-600" : "text-slate-400"} />
                    <span>Lahan</span>
                </button>
                <button
                    onClick={() => setActiveMobileTab("weather")}
                    className={`flex flex-col items-center gap-1 text-[10px] font-bold uppercase tracking-wider transition ${
                        activeMobileTab === "weather" ? "text-green-600 scale-105" : "text-slate-400 hover:text-slate-600"
                    }`}
                >
                    <Thermometer size={18} className={activeMobileTab === "weather" ? "text-green-600" : "text-slate-400"} />
                    <span>Cuaca</span>
                </button>
                <button
                    onClick={() => setActiveMobileTab("recommendations")}
                    className={`flex flex-col items-center gap-1 text-[10px] font-bold uppercase tracking-wider transition ${
                        activeMobileTab === "recommendations" ? "text-green-600 scale-105" : "text-slate-400 hover:text-slate-600"
                    }`}
                >
                    <AlertCircle size={18} className={activeMobileTab === "recommendations" ? "text-green-600" : "text-slate-400"} />
                    <span>Rekomendasi</span>
                </button>
            </div>
        </div>
    );
}