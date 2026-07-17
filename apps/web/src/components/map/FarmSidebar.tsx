"use client";

import { X, MapPin, Sprout, AlertTriangle } from "lucide-react";
import { MapMarker } from "@/types";
import Link from "next/link";

interface FarmSidebarProps {
    marker: MapMarker | null;
    onClose: () => void;
}

export function FarmSidebar({ marker, onClose }: FarmSidebarProps) {
    if (!marker) return null;

    return (
        <>
            {/* Backdrop - clicking outside closes the panel */}
            <div
                className="fixed inset-0 z-30 bg-black/20"
                onClick={onClose}
            />

            {/* Slide-in panel — starts below the top navbar (60px) */}
            <div className="fixed right-0 top-[60px] h-[calc(100%-60px)] w-80 bg-white shadow-2xl z-40 flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
                    <h2 className="text-base font-semibold text-gray-900">Detail Lahan</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4 overflow-y-auto flex-1">
                    {/* Farm Name */}
                    <div className="flex items-center gap-3">
                        <div className="bg-green-50 p-2 rounded-lg">
                            <Sprout className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400">Nama Lahan</p>
                            <p className="font-semibold text-gray-900">{marker.name}</p>
                        </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-50 p-2 rounded-lg">
                            <MapPin className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400">Koordinat</p>
                            <p className="font-medium text-gray-900 text-sm">
                                {marker.latitude.toFixed(4)}, {marker.longitude.toFixed(4)}
                            </p>
                        </div>
                    </div>

                    {/* Status */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-xs text-gray-400 mb-2">Status</p>
                        <div className="flex items-center justify-between">
                            <span className="text-base font-semibold text-gray-900 capitalize">
                                {marker.status === "near"
                                    ? "Mendekati Panen"
                                    : marker.status === "ready"
                                        ? "Siap Panen"
                                        : marker.status === "disease"
                                            ? "Alert Hama"
                                            : "Sehat"}
                            </span>
                            <div
                                className="w-4 h-4 rounded-full"
                                style={{
                                    backgroundColor:
                                        marker.status === "healthy"
                                            ? "#22c55e"
                                            : marker.status === "near"
                                                ? "#eab308"
                                                : marker.status === "ready"
                                                    ? "#ef4444"
                                                    : "#1f2937",
                                }}
                            />
                        </div>
                    </div>

                    {/* Priority */}
                    {marker.priority && (
                        <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-xs text-gray-400 mb-2">Prioritas</p>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${marker.priority === "HIGH" || marker.priority === "CRITICAL"
                                    ? "bg-red-100 text-red-700"
                                    : marker.priority === "MEDIUM"
                                        ? "bg-yellow-100 text-yellow-700"
                                        : "bg-green-100 text-green-700"
                                }`}>
                                {marker.priority}
                            </span>
                        </div>
                    )}

                    {/* Latest Prediction */}
                    {marker.latest_prediction && (
                        <div className="space-y-3">
                            <h3 className="font-medium text-gray-900 text-sm">Prediksi Terkini</h3>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-green-50 rounded-lg p-3">
                                    <p className="text-xs text-gray-500">Kesiapan Panen</p>
                                    <p className="text-lg font-bold text-green-700">
                                        {marker.latest_prediction.harvest_readiness?.toFixed(1) ?? "N/A"}%
                                    </p>
                                </div>

                                <div className="bg-blue-50 rounded-lg p-3">
                                    <p className="text-xs text-gray-500">Jumlah Buah</p>
                                    <p className="text-lg font-bold text-blue-700">
                                        {marker.latest_prediction.fruit_count ?? "N/A"}
                                    </p>
                                </div>
                            </div>

                            {marker.latest_prediction.disease_risk && (
                                <div className={`rounded-lg p-3 ${marker.latest_prediction.disease_risk === "HIGH" ? "bg-red-50" : "bg-green-50"}`}>
                                    <div className="flex items-center gap-2">
                                        {marker.latest_prediction.disease_risk === "HIGH" && (
                                            <AlertTriangle className="w-4 h-4 text-red-600" />
                                        )}
                                        <p className={`text-sm font-medium ${marker.latest_prediction.disease_risk === "HIGH" ? "text-red-700" : "text-green-700"}`}>
                                            Risiko Hama: {marker.latest_prediction.disease_risk === "HIGH" ? "Tinggi" : "Rendah"}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {marker.latest_prediction.ripeness != null && (
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-xs text-gray-500">Kematangan</p>
                                    <p className="text-lg font-bold text-gray-900">
                                        {marker.latest_prediction.ripeness?.toFixed(1) ?? "N/A"}%
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="pt-2">
                        <Link
                            href={`/farms/${marker.farm_id}`}
                            onClick={onClose}
                            className="block w-full bg-green-600 text-white text-center py-2.5 rounded-lg hover:bg-green-700 transition font-semibold text-sm"
                        >
                            Lihat Detail Lengkap
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}