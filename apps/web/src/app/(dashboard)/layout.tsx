"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Menu } from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { isAuthenticated, loading, user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push("/login");
        }
    }, [loading, isAuthenticated, router]);

    // Show loading spinner while checking auth
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent mx-auto mb-4"></div>
                    <p className="text-gray-500 text-sm">Memeriksa autentikasi...</p>
                </div>
            </div>
        );
    }

    // Don't render dashboard if not authenticated (redirect happening)
    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="h-screen flex flex-col overflow-hidden bg-gray-50">
            {/* Top Navbar */}
            <div className="bg-white border-b shadow-sm flex-shrink-0">
                <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition"
                            id="sidebar-toggle"
                        >
                            <Menu size={24} />
                        </button>
                        <div className="flex items-center gap-2">
                            <div>
                                <h1 className="font-bold text-gray-900 text-lg leading-tight">TitikPanen</h1>
                                <p className="text-xs text-gray-500">Regional Harvest Intelligence</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                    </div>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

                {/* Main Content */}
                <main className="flex-1 min-w-0 w-full overflow-y-auto relative">
                    {children}
                </main>
            </div>
        </div>
    );
}