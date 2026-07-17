"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Eye, EyeOff, LogIn } from "lucide-react";

const DEMO_CREDENTIALS = [
    { label: "Koperasi", email: "koperasi@agromesh.ai", password: "koperasi123", role: "Cooperative" },
    { label: "Dinas Pertanian", email: "dinas@agromesh.ai", password: "dinas123", role: "Food Authority" },
    { label: "Petani - Pak Budi", email: "admin@agromesh.ai", password: "admin123", role: "Farmer" },
    { label: "Petani - Siti", email: "petani@agromesh.ai", password: "petani123", role: "Farmer" },
];

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await login(email, password);
            router.push("/dashboard");
        } catch (err) {
            setError("Email atau password salah. Gunakan credential demo di bawah.");
        } finally {
            setLoading(false);
        }
    };

    const fillAndLogin = async (cred: typeof DEMO_CREDENTIALS[0]) => {
        setEmail(cred.email);
        setPassword(cred.password);
        setError("");
        setLoading(true);
        try {
            await login(cred.email, cred.password);
            router.push("/dashboard");
        } catch {
            setError("Login gagal. Pastikan server berjalan.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100 p-4">
            <div className="w-full max-w-md">
                {/* Card */}
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                    {/* Header Banner */}
                    <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-6 text-white text-center">
                        <div className="flex justify-center mb-3">
                            <div className="bg-white/20 backdrop-blur p-3 rounded-xl">
                                <img src="/logo.png" alt="TitikPanen Logo" className="w-8 h-8 object-contain rounded-lg" />
                            </div>
                        </div>
                        <h1 className="text-2xl font-bold">TitikPanen</h1>
                        <p className="text-green-100 text-sm mt-1">Regional Harvest Intelligence</p>
                        <div className="flex items-center justify-center gap-2 mt-3 text-xs text-green-200">
                            <span className="bg-white/20 px-2 py-0.5 rounded-full">AI-Powered</span>
                            <span className="bg-white/20 px-2 py-0.5 rounded-full">BMKG Weather</span>
                        </div>
                    </div>

                    <div className="p-8">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-5 text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                                <input
                                    id="email-input"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition text-sm"
                                    placeholder="email@contoh.com"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                                <div className="relative">
                                    <input
                                        id="password-input"
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition pr-12 text-sm"
                                        placeholder="********"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                        Memuat...
                                    </span>
                                ) : (
                                    <span className="flex items-center justify-center gap-2">
                                        <LogIn size={18} />
                                        Masuk
                                    </span>
                                )}
                            </button>
                        </form>

                        {/* Demo Credentials */}
                        <div className="mt-6">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="flex-1 h-px bg-gray-200" />
                                <span className="text-xs text-gray-400 font-medium">
                                    Demo Login
                                </span>
                                <div className="flex-1 h-px bg-gray-200" />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                {DEMO_CREDENTIALS.map((cred) => (
                                    <button
                                        key={cred.email}
                                        type="button"
                                        onClick={() => fillAndLogin(cred)}
                                        disabled={loading}
                                        className="text-left p-2.5 rounded-lg border border-gray-200 hover:border-green-400 hover:bg-green-50 transition text-xs group disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <div className="font-medium text-gray-700 group-hover:text-green-700 leading-tight">{cred.label}</div>
                                        <div className="text-gray-400 mt-0.5 truncate">{cred.role}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <p className="text-center text-xs text-gray-400 mt-4">
                    TitikPanen - Hackathon Demo 2026
                </p>
            </div>
        </div>
    );
}