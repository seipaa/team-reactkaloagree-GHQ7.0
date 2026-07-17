"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Recommendation } from "@/types";
import { formatPercentage, getPriorityColor } from "@/lib/utils";
import { AlertTriangle, Sprout, CloudRain, Clock } from "lucide-react";

export default function RecommendationsPage() {
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRecommendations = async () => {
            try {
                const response = await api.get<Recommendation[]>("/recommendation");
                setRecommendations(response.data);
            } catch (error) {
                console.error("Failed to fetch recommendations:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchRecommendations();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
        );
    }

    const sortedRecommendations = [...recommendations].sort((a, b) => {
        const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Rekomendasi Panen</h1>
                <p className="text-gray-500">Prioritas aksi berdasarkan Harvest Intelligence Engine</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        <span className="font-medium text-red-900">Critical & High</span>
                    </div>
                    <p className="text-2xl font-bold text-red-700">
                        {recommendations.filter(r => r.priority === "CRITICAL" || r.priority === "HIGH").length}
                    </p>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                        <CloudRain className="w-5 h-5 text-yellow-600" />
                        <span className="font-medium text-yellow-900">Medium</span>
                    </div>
                    <p className="text-2xl font-bold text-yellow-700">
                        {recommendations.filter(r => r.priority === "MEDIUM").length}
                    </p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                        <Clock className="w-5 h-5 text-green-600" />
                        <span className="font-medium text-green-900">Low</span>
                    </div>
                    <p className="text-2xl font-bold text-green-700">
                        {recommendations.filter(r => r.priority === "LOW").length}
                    </p>
                </div>
            </div>

            <div className="space-y-4">
                {sortedRecommendations.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-8 text-center">
                        <Sprout className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">Belum ada rekomendasi</p>
                    </div>
                ) : (
                    sortedRecommendations.map((rec, idx) => (
                        <div key={idx} className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                    <Sprout className="w-6 h-6 text-green-600" />
                                    <div>
                                        <h3 className="font-medium text-gray-900">{rec.farm_name}</h3>
                                        <p className="text-sm text-gray-500">Harvest Readiness: {formatPercentage(rec.harvest_readiness)}</p>
                                    </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(rec.priority)}`}>
                                    {rec.priority}
                                </span>
                            </div>
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                                <p className="font-medium text-green-800 text-lg">{rec.recommendation}</p>
                                <p className="text-sm text-green-600 mt-1">{rec.reason}</p>
                            </div>
                            <div className="flex items-center justify-between text-sm text-gray-500">
                                <span>Disease Risk: {rec.disease_risk || "N/A"}</span>
                                <span>{new Date(rec.created_at).toLocaleDateString("id-ID")}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}