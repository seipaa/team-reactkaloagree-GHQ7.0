"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { FarmDetail, Weather } from "@/types";
import { DynamicMap } from "@/components/map/DynamicMap";
import Link from "next/link";
import {
    ArrowLeft,
    Droplets,
    Thermometer,
    Wind,
    AlertTriangle,
    CheckCircle,
    Clock,
    MapPin,
    Upload,
    X,
    Camera,
    RefreshCw,
    Leaf,
    Sparkles,
    Calendar,
    ShieldAlert,
    ShieldCheck,
    CloudRain
} from "lucide-react";

export default function FarmDetailPage() {
    const params = useParams();
    const farmId = params.id as string;
    const [farmDetail, setFarmDetail] = useState<FarmDetail | null>(null);
    const [weather, setWeather] = useState<Weather | null>(null);
    const [loading, setLoading] = useState(true);

    // Upload modal state
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploadPreview, setUploadPreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [predictionResult, setPredictionResult] = useState<{
        ripeness: number;
        fruit_count: number;
        disease: string;
        recommendation: string;
        priority: string;
        reason: string;
        harvest_readiness: number;
        disease_risk: string;
    } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchFarmDetail = async () => {
        try {
            const farmRes = await api.get<FarmDetail>(`/farms/${farmId}`);
            setFarmDetail(farmRes.data);
            
            const { farm } = farmRes.data;
            const weatherRes = await api.get<Weather>(`/weather?lat=${farm.latitude}&lon=${farm.longitude}`);
            setWeather(weatherRes.data);
        } catch (error) {
            console.error("Failed to fetch farm detail:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFarmDetail();
    }, [farmId]);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!["image/jpeg", "image/png", "image/jpg", "image/webp"].includes(file.type)) {
            setUploadError("Format file tidak didukung. Gunakan JPG, PNG, atau WebP.");
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            setUploadError("Ukuran file terlalu besar. Maksimal 10MB.");
            return;
        }

        setUploadFile(file);
        setUploadError(null);
        
        const reader = new FileReader();
        reader.onloadend = () => setUploadPreview(reader.result as string);
        reader.readAsDataURL(file);

        // Auto trigger upload analysis
        await autoUpload(file);
    };

    const autoUpload = async (file: File) => {
        setUploading(true);
        setUploadError(null);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("farm_id", farmId);

        try {
            const res = await api.post("/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setPredictionResult(res.data);
            setUploadSuccess(true);
        } catch (err: any) {
            setUploadError(err.response?.data?.detail || "Gagal menganalisis gambar. Coba lagi.");
        } finally {
            setUploading(false);
        }
    };

    const handleUpload = () => {};

    const closeModal = async () => {
        const hadSuccess = uploadSuccess;
        setShowUploadModal(false);
        setUploadFile(null);
        setUploadPreview(null);
        setUploadError(null);
        setUploadSuccess(false);
        setPredictionResult(null);
        
        if (hadSuccess) {
            setLoading(true);
            await fetchFarmDetail();
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-600 border-t-transparent mx-auto mb-4"></div>
                    <p className="text-gray-500 font-semibold text-sm">Memuat data lahan...</p>
                </div>
            </div>
        );
    }

    if (!farmDetail) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <div className="text-center p-8 bg-white border rounded-2xl shadow-sm max-w-sm">
                    <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-3 animate-pulse" />
                    <h3 className="font-bold text-gray-800 text-lg">Lahan Tidak Ditemukan</h3>
                    <p className="text-gray-500 text-sm mt-1">Data koordinat atau hak akses mungkin salah.</p>
                    <Link href="/farms" className="mt-4 inline-flex items-center gap-1.5 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition font-medium text-sm">
                        <ArrowLeft size={16} />
                        Kembali ke Daftar Lahan
                    </Link>
                </div>
            </div>
        );
    }

    const { farm, latest_prediction, predictions_history, images } = farmDetail;

    const getStatusColors = (status: string) => {
        const colors: Record<string, { bg: string; text: string; dot: string }> = {
            healthy: { bg: "bg-green-50 text-green-700 border-green-200", text: "text-green-700", dot: "bg-green-500" },
            near: { bg: "bg-yellow-50 text-yellow-700 border-yellow-200", text: "text-yellow-700", dot: "bg-yellow-500" },
            ready: { bg: "bg-red-50 text-red-700 border-red-200", text: "text-red-700", dot: "bg-red-500" },
            disease: { bg: "bg-gray-100 text-gray-800 border-gray-300", text: "text-gray-800", dot: "bg-gray-800" }
        };
        return colors[status] || colors.healthy;
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            healthy: "Lahan Sehat",
            near: "Mendekati Panen",
            ready: "Siap Panen",
            disease: "Deteksi Hama"
        };
        return labels[status] || labels.healthy;
    };

    const determineStatus = () => {
        if (!latest_prediction) return "healthy";
        if (latest_prediction.disease_risk === "HIGH") return "disease";
        if (latest_prediction.harvest_readiness && latest_prediction.harvest_readiness > 70) return "ready";
        if (latest_prediction.harvest_readiness && latest_prediction.harvest_readiness >= 50) return "near";
        return "healthy";
    };

    const status = determineStatus();
    const statusTheme = getStatusColors(status);

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-12">
            {/* Header banner */}
            <div className="bg-gradient-to-r from-emerald-800 to-green-700 text-white shadow-lg border-b border-green-900">
                <div className="max-w-7xl mx-auto px-4 py-6 md:py-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <Link href="/farms" className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition text-white/90">
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-xl md:text-2xl font-black tracking-tight">{farm.name}</h1>
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${statusTheme.bg}`}>
                                    {getStatusLabel(status)}
                                </span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-green-100/80 mt-1 flex-wrap">
                                <span className="flex items-center gap-1">
                                    <Leaf size={14} className="text-green-300" />
                                    Varietas: <span className="font-semibold text-white">{farm.variety}</span>
                                </span>
                                <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                                <span className="flex items-center gap-1">
                                    <MapPin size={14} className="text-green-300" />
                                    Pemilik: <span className="font-semibold text-white">{farm.owner}</span>
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 md:self-center">
                        <button
                            onClick={() => { setLoading(true); fetchFarmDetail(); }}
                            className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition text-white/90"
                            title="Refresh data"
                        >
                            <RefreshCw size={18} />
                        </button>
                        <button
                            onClick={() => setShowUploadModal(true)}
                            className="flex items-center gap-2 bg-white border border-green-600 text-green-700 hover:bg-green-50 px-4 py-2.5 rounded-xl transition font-bold text-sm shadow-sm"
                        >
                            <Camera size={16} />
                            Analisis Foto Baru
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 mt-6 space-y-6">
                {/* Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Harvest Readiness Card */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition">
                        <div>
                            <div className="flex justify-between items-start">
                                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Kesiapan Panen</span>
                                <span className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600"><Leaf size={16} /></span>
                            </div>
                            <div className="text-3xl font-black text-slate-800 mt-2">
                                {latest_prediction?.harvest_readiness?.toFixed(0) || 0}%
                            </div>
                        </div>
                        <div className="mt-4">
                            <div className="w-full bg-slate-100 rounded-full h-2">
                                <div
                                    className="h-2 rounded-full bg-emerald-500 transition-all duration-500"
                                    style={{ width: `${latest_prediction?.harvest_readiness || 0}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    {/* Fruit Count Card */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition">
                        <div>
                            <div className="flex justify-between items-start">
                                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Estimasi Buah</span>
                                <span className="p-1.5 bg-blue-50 rounded-lg text-blue-600"><Sparkles size={16} /></span>
                            </div>
                            <div className="text-3xl font-black text-slate-800 mt-2">
                                {latest_prediction?.fruit_count || 0}
                            </div>
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium mt-4">Prediksi model Roboflow count</div>
                    </div>

                    {/* Disease Risk Card */}
                    <div className={`rounded-2xl p-5 border shadow-sm flex flex-col justify-between hover:shadow-md transition ${
                        latest_prediction?.disease_risk === "HIGH"
                            ? "bg-red-50/50 border-red-100"
                            : "bg-green-50/50 border-green-100"
                    }`}>
                        <div>
                            <div className="flex justify-between items-start">
                                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Risiko Hama</span>
                                <span className={`p-1.5 rounded-lg ${
                                    latest_prediction?.disease_risk === "HIGH" ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"
                                }`}>
                                    {latest_prediction?.disease_risk === "HIGH" ? <ShieldAlert size={16} /> : <ShieldCheck size={16} />}
                                </span>
                            </div>
                            <div className={`text-3xl font-black mt-2 ${
                                latest_prediction?.disease_risk === "HIGH" ? "text-red-600" : "text-green-600"
                            }`}>
                                {latest_prediction?.disease_risk === "HIGH" ? "Tinggi" : "Aman"}
                            </div>
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium mt-4">Kondisi kesehatan daun</div>
                    </div>

                    {/* Ripeness Card */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition">
                        <div>
                            <div className="flex justify-between items-start">
                                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Kematangan</span>
                                <span className="p-1.5 bg-amber-50 rounded-lg text-amber-600"><Clock size={16} /></span>
                            </div>
                            <div className="text-3xl font-black text-slate-800 mt-2">
                                {latest_prediction?.ripeness?.toFixed(0) || 0}%
                            </div>
                        </div>
                        <div className="mt-4">
                            <div className="w-full bg-slate-100 rounded-full h-2">
                                <div
                                    className="h-2 rounded-full bg-amber-500 transition-all duration-500"
                                    style={{ width: `${latest_prediction?.ripeness || 0}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Primary Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column (Main Stats, Map, Weather) */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* HIE Recommendation Spotlight */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-green-600 relative overflow-hidden">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl">🌶️</span>
                                        <h3 className="text-xs font-extrabold uppercase tracking-wider text-green-700">Rekomendasi Utama HIE</h3>
                                    </div>
                                    {latest_prediction?.priority && (
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                            latest_prediction.priority === "HIGH" || latest_prediction.priority === "CRITICAL"
                                                ? "bg-red-50 text-red-700 border border-red-200"
                                                : latest_prediction.priority === "MEDIUM"
                                                ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
                                                : "bg-green-50 text-green-700 border border-green-200"
                                        }`}>
                                            Prioritas: {latest_prediction.priority}
                                        </span>
                                    )}
                                </div>

                                {latest_prediction?.recommendation ? (
                                    <div className="space-y-3">
                                        <h4 className="text-lg font-bold text-slate-800 leading-snug">{latest_prediction.recommendation}</h4>
                                        <p className="text-sm text-slate-600 leading-relaxed font-medium">{latest_prediction.reason}</p>
                                        <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
                                            <Clock size={12} />
                                            <span>Analisis dilakukan pada {new Date(latest_prediction.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-6 text-center text-slate-400 space-y-2">
                                        <Leaf className="w-8 h-8 mx-auto text-slate-300 animate-bounce" />
                                        <p className="text-sm">Belum ada analisis data terkini.</p>
                                        <button onClick={() => setShowUploadModal(true)} className="text-xs text-green-600 hover:underline font-bold">
                                            Ambil foto & analisis sekarang
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Interactive Map */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
                                <h3 className="font-bold text-slate-800 text-sm">Pemetaan Area Lahan</h3>
                                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                                    {farm.latitude.toFixed(5)}, {farm.longitude.toFixed(5)}
                                </span>
                            </div>
                            <div className="h-64 relative">
                                <DynamicMap
                                    markers={[{
                                        farm_id: farm.id,
                                        name: farm.name,
                                        latitude: farm.latitude,
                                        longitude: farm.longitude,
                                        status: status,
                                        priority: latest_prediction?.priority || "LOW",
                                        latest_prediction: latest_prediction ? {
                                            ripeness: latest_prediction.ripeness,
                                            fruit_count: latest_prediction.fruit_count,
                                            harvest_readiness: latest_prediction.harvest_readiness,
                                            disease_risk: latest_prediction.disease_risk
                                        } : null
                                    }]}
                                    center={[farm.latitude, farm.longitude]}
                                    zoom={16}
                                    height="h-full"
                                />
                            </div>
                        </div>

                        {/* Weather - BMKG */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
                                <h3 className="font-bold text-slate-800 text-sm">Parameter Cuaca Lokal</h3>
                                <div className="flex items-center gap-2">
                                    {weather?.location && (
                                        <span className="text-xs font-semibold text-slate-500 flex items-center gap-0.5">
                                            <MapPin size={12} className="text-slate-400" />
                                            {weather.location}
                                        </span>
                                    )}
                                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded text-[9px] font-extrabold uppercase">
                                        BMKG
                                    </span>
                                </div>
                            </div>
                            <div className="p-5">
                                {weather ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                <Thermometer className="text-red-500" size={24} />
                                                <span className="text-3xl font-black text-slate-800">{weather.temperature}°C</span>
                                                <span className="text-xs text-slate-400">Suhu Rata-rata</span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                                            <div className="flex items-center gap-2.5 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                                                <Droplets className="text-blue-500" size={20} />
                                                <div>
                                                    <div className="text-base font-bold text-slate-800 leading-tight">{weather.humidity}%</div>
                                                    <div className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold mt-0.5">Kelembaban</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2.5 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                                                <Wind className="text-slate-500" size={20} />
                                                <div>
                                                    <div className="text-base font-bold text-slate-800 leading-tight">{weather.wind} km/h</div>
                                                    <div className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold mt-0.5">Kec. Angin</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2.5 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                                                <CloudRain className="text-blue-400" size={20} />
                                                <div>
                                                    <div className="text-base font-bold text-slate-800 leading-tight">{weather.rain || 0}%</div>
                                                    <div className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold mt-0.5">Peluang Hujan</div>
                                                </div>
                                            </div>
                                        </div>
                                        {weather.warning && (
                                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2">
                                                <AlertTriangle className="text-amber-600 mt-0.5 flex-shrink-0" size={16} />
                                                <span className="text-xs text-amber-800 font-medium leading-relaxed">{weather.warning}</span>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center text-slate-400 py-6 text-sm">Tidak ada data cuaca aktif.</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column (Recent Photos & Upload) */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full min-h-[400px]">
                            <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
                                <h3 className="font-bold text-slate-800 text-sm">Galeri Foto Analisis</h3>
                                <button
                                    onClick={() => setShowUploadModal(true)}
                                    className="flex items-center gap-1 bg-white border border-green-600 text-green-700 hover:bg-green-50 px-3 py-1.5 rounded-lg transition font-bold text-xs shadow-sm"
                                >
                                    <Upload size={12} />
                                    Upload
                                </button>
                            </div>
                            
                            <div className="p-4 flex-1 space-y-4 overflow-y-auto">
                                {images.length > 0 ? (
                                    images.slice(0, 4).map((img, idx) => (
                                        <div key={img.id || idx} className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 group shadow-sm border border-slate-100">
                                            <img
                                                src={img.image_url}
                                                alt={`Lahan ${farm.name} Foto ${idx + 1}`}
                                                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                }}
                                            />
                                            {img.captured_at && (
                                                <div className="absolute bottom-2 right-2 bg-slate-900/80 backdrop-blur text-white text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                                    <Calendar size={10} />
                                                    {new Date(img.captured_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center gap-3 border-2 border-dashed border-slate-200 rounded-2xl p-6 bg-slate-50/50">
                                        <div className="p-4 bg-white rounded-full shadow-sm">
                                            <Camera className="text-slate-400 w-6 h-6" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-slate-700 text-xs font-bold">Belum Ada Foto Lahan</p>
                                            <p className="text-slate-400 text-[10px] mt-0.5">Unggah foto tanaman cabai Anda</p>
                                        </div>
                                        <button
                                            onClick={() => setShowUploadModal(true)}
                                            className="text-xs text-green-600 hover:text-green-700 font-bold underline"
                                        >
                                            Mulai Unggah
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Disease alert popup */}
                {latest_prediction?.disease && latest_prediction.disease !== "HEALTHY" && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-5 shadow-sm flex items-start gap-4">
                        <div className="p-2 bg-red-100 rounded-xl text-red-600 flex-shrink-0">
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <h3 className="font-extrabold text-red-800 text-sm">HAMA TERDETEKSI OLEH AI</h3>
                            <p className="text-xs text-red-700 font-bold mt-0.5">{latest_prediction.disease}</p>
                            <p className="text-xs text-red-600 mt-2 leading-relaxed font-medium">
                                Sistem mendeteksi adanya gejala serangan penyakit pada daun tanaman cabai. Lakukan penyemprotan fungisida atau pisahkan tanaman terinfeksi segera untuk menghindari penularan massal.
                            </p>
                        </div>
                    </div>
                )}

                {/* Prediction History Table */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
                        <h3 className="font-bold text-slate-800 text-sm">Riwayat Prediksi Lahan</h3>
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                            10 Analisis Terkini
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-5 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">Tanggal</th>
                                    <th className="px-5 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">Kesiapan Panen</th>
                                    <th className="px-5 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">Jumlah Buah</th>
                                    <th className="px-5 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">Kematangan</th>
                                    <th className="px-5 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">Status Kesehatan</th>
                                    <th className="px-5 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">Prioritas HIE</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {predictions_history.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-5 py-8 text-center text-slate-400 font-medium">
                                            Belum ada riwayat analisis. Silakan unggah foto di atas untuk mulai memprediksi.
                                        </td>
                                    </tr>
                                ) : (
                                    predictions_history.slice(0, 10).map((pred, idx) => (
                                        <tr key={pred.id || idx} className={`hover:bg-slate-50/50 transition ${idx === 0 ? "bg-green-50/20" : ""}`}>
                                            <td className="px-5 py-3.5 font-bold text-slate-700">
                                                {idx === 0 && <span className="mr-2 text-green-500 animate-pulse">●</span>}
                                                {new Date(pred.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="px-5 py-3.5 font-extrabold text-slate-800">{pred.harvest_readiness?.toFixed(1)}%</td>
                                            <td className="px-5 py-3.5 text-slate-600 font-semibold">{pred.fruit_count} buah</td>
                                            <td className="px-5 py-3.5 text-slate-600 font-semibold">{pred.ripeness?.toFixed(1)}%</td>
                                            <td className="px-5 py-3.5">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                    pred.disease === "HEALTHY" 
                                                        ? "bg-green-50 text-green-700 border border-green-200" 
                                                        : "bg-red-50 text-red-700 border border-red-200"
                                                }`}>
                                                    {pred.disease === "HEALTHY" ? "SEHAT ✓" : pred.disease}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                    pred.priority === "HIGH" || pred.priority === "CRITICAL"
                                                        ? "bg-red-50 text-red-700 border border-red-200"
                                                        : pred.priority === "MEDIUM"
                                                        ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
                                                        : "bg-green-50 text-green-700 border border-green-200"
                                                }`}>
                                                    {pred.priority}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Upload Modal (Premium styling) */}
            {showUploadModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={closeModal} />
                    
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative z-10 border border-slate-100 overflow-hidden flex flex-col">
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-bold text-slate-800">Analisis Kamera AI</h3>
                                <p className="text-xs text-slate-400 mt-0.5">Unggah gambar untuk dianalisis oleh Roboflow</p>
                            </div>
                            <button onClick={closeModal} className="p-2 hover:bg-slate-50 rounded-xl transition text-slate-400 hover:text-slate-600">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                            {uploading ? (
                                <div className="text-center py-12">
                                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent mx-auto mb-4"></div>
                                    <h4 className="text-sm font-bold text-slate-800">Sedang Menganalisis...</h4>
                                    <p className="text-slate-400 text-[10px] mt-1 font-medium leading-normal max-w-xs mx-auto">AI sedang memproses gambar untuk mendeteksi hama daun dan menghitung jumlah buah cabai</p>
                                </div>
                            ) : uploadSuccess && predictionResult ? (
                                <div className="space-y-4">
                                    <div className="text-center py-2">
                                        <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-2 border border-green-100">
                                            <CheckCircle className="w-6 h-6 text-green-500 animate-bounce" />
                                        </div>
                                        <h4 className="text-base font-bold text-slate-800">Analisis AI Selesai!</h4>
                                        <p className="text-slate-400 text-xs mt-0.5 font-medium">Berikut adalah hasil pemrosesan model Roboflow & HIE</p>
                                    </div>

                                    {/* Preview image */}
                                    {uploadPreview && (
                                        <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-100 shadow-sm max-h-36">
                                            <img
                                                src={uploadPreview}
                                                alt="Uploaded cabai"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )}

                                    {/* Results Grid */}
                                    <div className="grid grid-cols-2 gap-2.5 text-xs">
                                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                            <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Kesiapan Panen</span>
                                            <span className="text-base font-black text-slate-800 mt-1 block">
                                                {predictionResult.harvest_readiness?.toFixed(1)}%
                                            </span>
                                        </div>
                                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                            <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Estimasi Buah</span>
                                            <span className="text-base font-black text-slate-800 mt-1 block">
                                                {predictionResult.fruit_count} buah
                                            </span>
                                        </div>
                                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                            <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Kematangan</span>
                                            <span className="text-base font-black text-slate-800 mt-1 block">
                                                {predictionResult.ripeness?.toFixed(1)}%
                                            </span>
                                        </div>
                                        <div className={`p-2.5 rounded-xl border ${
                                            predictionResult.disease_risk === "HIGH" 
                                                ? "bg-red-50/50 border-red-100 text-red-700" 
                                                : "bg-green-50/50 border-green-100 text-green-700"
                                        }`}>
                                            <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Risiko Hama</span>
                                            <span className="text-base font-black mt-1 block">
                                                {predictionResult.disease_risk === "HIGH" ? "Tinggi" : "Aman"}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Disease details if not healthy */}
                                    {predictionResult.disease && predictionResult.disease !== "HEALTHY" && (
                                        <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-700 font-medium">
                                            <p className="font-bold uppercase tracking-wider text-[9px] text-red-800">Deteksi Penyakit:</p>
                                            <p className="mt-1 font-semibold">{predictionResult.disease}</p>
                                        </div>
                                    )}

                                    {/* HIE Recommendation Spotlight */}
                                    <div className="bg-white rounded-xl p-4 border-2 border-green-600 space-y-2">
                                        <div className="flex items-center gap-1.5 border-b border-slate-50 pb-1.5">
                                            <span className="text-sm">🌶️</span>
                                            <h5 className="text-[10px] font-extrabold text-green-700 uppercase tracking-wider">Rekomendasi Utama HIE</h5>
                                        </div>
                                        <h6 className="text-sm font-bold text-slate-800 leading-tight">{predictionResult.recommendation}</h6>
                                        <p className="text-[11px] text-slate-500 leading-normal font-medium">{predictionResult.reason}</p>
                                    </div>

                                    {/* Action Button */}
                                    <button
                                        onClick={closeModal}
                                        className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl transition font-bold text-xs shadow-md shadow-green-600/10 mt-2"
                                    >
                                        Selesai & Tutup
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {/* Upload dropzone box */}
                                    <div
                                        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center min-h-[160px] ${
                                            uploadPreview 
                                                ? "border-green-300 bg-green-50/20" 
                                                : "border-slate-300 hover:border-green-400 hover:bg-slate-50"
                                        }`}
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        {uploadPreview ? (
                                            <div className="space-y-3 w-full">
                                                <img
                                                    src={uploadPreview}
                                                    alt="Preview"
                                                    className="max-h-40 mx-auto rounded-xl object-cover shadow-sm border border-slate-200"
                                                />
                                                <p className="text-[10px] text-green-700 font-extrabold truncate max-w-full px-4">
                                                    {uploadFile?.name} ({(uploadFile!.size / 1024).toFixed(0)} KB)
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <div className="p-3 bg-slate-50 rounded-full shadow-inner inline-block">
                                                    <Camera className="w-6 h-6 text-slate-400" />
                                                </div>
                                                <p className="text-slate-700 text-xs font-bold">Pilih File Foto Lahan</p>
                                                <p className="text-slate-400 text-[10px]">Format: JPG, PNG, WebP (Maks 10MB)</p>
                                            </div>
                                        )}
                                    </div>

                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/jpg,image/webp"
                                        className="hidden"
                                        onChange={handleFileSelect}
                                    />

                                    {uploadError && (
                                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-[11px] text-red-600 font-semibold">
                                            ⚠️ {uploadError}
                                        </div>
                                    )}

                                    <div className="bg-slate-50 rounded-2xl p-4 text-[10px] text-slate-500 font-medium space-y-1.5 border border-slate-100 shadow-inner">
                                        <p className="font-extrabold text-slate-700 uppercase tracking-wider mb-2">Prosedur Analisis AI:</p>
                                        <p className="flex items-center gap-1.5"><span className="w-1 h-1 bg-green-500 rounded-full" /> Unggah file foto ke S3 MinIO storage</p>
                                        <p className="flex items-center gap-1.5"><span className="w-1 h-1 bg-green-500 rounded-full" /> Klasifikasi kondisi daun & deteksi penyakit</p>
                                        <p className="flex items-center gap-1.5"><span className="w-1 h-1 bg-green-500 rounded-full" /> Deteksi buah cabai & perhitungan kuantitas</p>
                                        <p className="flex items-center gap-1.5"><span className="w-1 h-1 bg-green-500 rounded-full" /> Pemrosesan rule engine HIE</p>
                                    </div>
                                </>
                            )}
                        </div>

                        {!uploadSuccess && !uploading && (
                            <div className="p-4 border-t border-slate-100 flex gap-3">
                                <button
                                    onClick={closeModal}
                                    className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition font-bold text-xs"
                                >
                                    Batal
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}