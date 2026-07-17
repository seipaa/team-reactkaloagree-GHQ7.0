"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Prediction, Recommendation, DashboardData, Weather } from "@/types";
import { HarvestReadinessChart } from "@/components/analytics/HarvestReadinessChart";
import { DiseaseTrendChart } from "@/components/analytics/DiseaseTrendChart";
import { WeatherTrendChart } from "@/components/analytics/WeatherTrendChart";
import { HarvestPriorityChart } from "@/components/analytics/HarvestPriorityChart";
import { Thermometer, Droplets, Wind, AlertTriangle, BarChart3 } from "lucide-react";

export default function AnalyticsPage() {
    const [predictions, setPredictions] = useState<Prediction[]>([]);
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [weather, setWeather] = useState<Weather | null>(null);
    const [weatherHistory, setWeatherHistory] = useState<Weather[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const [dashboardRes, recRes, weatherRes, historyRes] = await Promise.all([
                    api.get<DashboardData>("/dashboard"),
                    api.get<Recommendation[]>("/recommendation"),
                    api.get<Weather>("/weather"),
                    api.get<Weather[]>("/weather/history"),
                ]);
                setPredictions(dashboardRes.data.predictions || []);
                setRecommendations(recRes.data);
                setWeather(weatherRes.data);
                setWeatherHistory(historyRes.data || []);
            } catch (error) {
                console.error("Failed to fetch analytics:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
        );
    }

    const avgReadiness = predictions.length > 0
        ? (predictions.reduce((acc, p) => acc + (p.harvest_readiness || 0), 0) / predictions.length).toFixed(1)
        : "0";

    const avgFruitCount = predictions.length > 0
        ? (predictions.reduce((acc, p) => acc + (p.fruit_count || 0), 0) / predictions.length).toFixed(1)
        : "0";

    const diseaseRate = predictions.length > 0
        ? ((predictions.filter((p) => p.disease !== "HEALTHY").length / predictions.length) * 100).toFixed(1)
        : "0";

    const highPriorityCount = recommendations.filter(r => r.priority === "HIGH" || r.priority === "CRITICAL").length;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">Analytics</h1>
                <p className="text-gray-500 text-sm">Analisis tren dan statistik panen cabai</p>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                <div className="bg-white rounded-xl p-4 md:p-5 border-l-4 border-green-500">
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Total Prediksi</p>
                    <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-1">{predictions.length}</p>
                    <p className="text-xs text-gray-400 mt-1">Data dari sistem</p>
                </div>
                <div className="bg-white rounded-xl p-4 md:p-5 border-l-4 border-blue-500">
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Rata-rata Kesiapan</p>
                    <p className="text-2xl md:text-3xl font-bold text-blue-600 mt-1">{avgReadiness}%</p>
                    <p className="text-xs text-gray-400 mt-1">Kesiapan panen rata-rata</p>
                </div>
                <div className="bg-white rounded-xl p-4 md:p-5 border-l-4 border-yellow-500">
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Rata-rata Buah</p>
                    <p className="text-2xl md:text-3xl font-bold text-yellow-600 mt-1">{avgFruitCount}</p>
                    <p className="text-xs text-gray-400 mt-1">Jumlah buah rata-rata</p>
                </div>
                <div className="bg-white rounded-xl p-4 md:p-5 border-l-4 border-red-500">
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Tingkat Penyakit</p>
                    <p className="text-2xl md:text-3xl font-bold text-red-600 mt-1">{diseaseRate}%</p>
                    <p className="text-xs text-gray-400 mt-1">Persentase terdeteksi</p>
                </div>
            </div>

            {/* Current Weather Info - BMKG */}
            {weather && (
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-blue-800">Cuaca Saat Ini - {weather.location || "Cianjur, Jawa Barat"}</h3>
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-bold">BMKG Indonesia</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="flex items-center gap-2 p-3 bg-white/50 rounded-lg">
                            <Thermometer className="text-red-500" size={20} />
                            <div>
                                <p className="text-xl font-bold text-blue-700">{weather.temperature ?? "--"}C</p>
                                <p className="text-xs text-blue-500">Suhu</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 p-3 bg-white/50 rounded-lg">
                            <Droplets className="text-cyan-500" size={20} />
                            <div>
                                <p className="text-xl font-bold text-cyan-700">{weather.humidity ?? "--"}%</p>
                                <p className="text-xs text-blue-500">Kelembaban</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 p-3 bg-white/50 rounded-lg">
                            <Wind className="text-gray-500" size={20} />
                            <div>
                                <p className="text-xl font-bold text-gray-700">{weather.wind ?? "--"} km/h</p>
                                <p className="text-xs text-blue-500">Angin</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 p-3 bg-white/50 rounded-lg">
                            <Droplets className="text-blue-400" size={20} />
                            <div>
                                <p className="text-xl font-bold text-indigo-700">{weather.rain ?? "--"}%</p>
                                <p className="text-xs text-blue-500">Peluang Hujan</p>
                            </div>
                        </div>
                    </div>
                    {weather.warning && (
                        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-300 rounded-lg flex items-center gap-2">
                            <AlertTriangle className="text-yellow-600" size={16} />
                            <span className="text-xs text-yellow-800">{weather.warning}</span>
                        </div>
                    )}
                    <p className="text-[10px] text-blue-500 mt-2">Data diambil realtime dari API BMKG Indonesia</p>
                </div>
            )}

            {/* Priority & Recommendation Summary */}
            <div className="bg-white rounded-xl p-4 md:p-5">
                <h3 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wider">Ringkasan Prioritas Rekomendasi</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                    <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                        <p className="text-2xl md:text-3xl font-bold text-red-700">{highPriorityCount}</p>
                        <p className="text-xs md:text-sm font-medium text-red-600 mt-1">Prioritas Tinggi</p>
                        <p className="text-[10px] text-red-400">Butuh tindakan segera</p>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                        <p className="text-2xl md:text-3xl font-bold text-yellow-700">
                            {recommendations.filter(r => r.priority === "MEDIUM").length}
                        </p>
                        <p className="text-xs md:text-sm font-medium text-yellow-600 mt-1">Prioritas Sedang</p>
                        <p className="text-[10px] text-yellow-400">Perlu diperhatikan</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-2xl md:text-3xl font-bold text-green-700">
                            {recommendations.filter(r => r.priority === "LOW").length}
                        </p>
                        <p className="text-xs md:text-sm font-medium text-green-600 mt-1">Prioritas Rendah</p>
                        <p className="text-[10px] text-green-400">Kondisi aman</p>
                    </div>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                <HarvestReadinessChart predictions={predictions} />
                <DiseaseTrendChart predictions={predictions} />
                <WeatherTrendChart weatherData={weatherHistory} />
                <HarvestPriorityChart recommendations={recommendations} />
            </div>

            {/* Recent Recommendations Table */}
            {recommendations.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="p-4 border-b">
                        <h3 className="font-semibold text-gray-900">Rekomendasi Terbaru</h3>
                        <p className="text-xs text-gray-500 mt-1">Diurutkan dari prioritas tertinggi</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">Lahan</th>
                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">Prioritas</th>
                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">Rekomendasi</th>
                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 hidden md:table-cell">Kesiapan</th>
                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 hidden md:table-cell">Risiko</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {recommendations.slice(0, 5).map((rec, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50">
                                        <td className="px-4 py-2.5 font-medium text-gray-900 text-xs">{rec.farm_name}</td>
                                        <td className="px-4 py-2.5">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${rec.priority === "HIGH" || rec.priority === "CRITICAL"
                                                ? "bg-red-100 text-red-700"
                                                : rec.priority === "MEDIUM"
                                                    ? "bg-yellow-100 text-yellow-700"
                                                    : "bg-green-100 text-green-700"
                                                }`}>
                                                {rec.priority}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2.5 text-xs text-gray-600">{rec.recommendation}</td>
                                        <td className="px-4 py-2.5 hidden md:table-cell">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 bg-gray-200 rounded-full h-1.5 w-16">
                                                    <div
                                                        className="h-1.5 rounded-full bg-green-500"
                                                        style={{ width: `${rec.harvest_readiness}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs text-gray-500">{rec.harvest_readiness.toFixed(0)}%</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2.5 hidden md:table-cell">
                                            <span className={`text-xs font-medium ${rec.disease_risk === "HIGH" ? "text-red-600" :
                                                rec.disease_risk === "MEDIUM" ? "text-yellow-600" : "text-green-600"
                                                }`}>
                                                {rec.disease_risk || "LOW"}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}