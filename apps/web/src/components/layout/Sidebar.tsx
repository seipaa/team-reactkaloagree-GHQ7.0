"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    Leaf,
    BarChart3,
    LogOut,
    ChevronRight,
} from "lucide-react";
import { useAuth } from "@/lib/auth";

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const menuItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, desc: "Peta & overview" },
    { href: "/farms", label: "Daftar Lahan", icon: Leaf, desc: "Kelola lahan" },
    { href: "/analytics", label: "Analytics", icon: BarChart3, desc: "Tren & statistik" },
];

const roleLabels: Record<string, string> = {
    FARMER: "Petani",
    COOPERATIVE: "Koperasi",
    FOOD_AUTHORITY: "Dinas Pertanian",
};

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const router = useRouter();

    const handleLogout = () => {
        logout();
        onClose();
        router.push("/login");
    };

    return (
        <>
            {/* Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            <div className={`
                fixed lg:static inset-y-0 left-0 z-50
                bg-white border-r shadow-xl
                transform transition-all duration-300 ease-in-out
                flex flex-col
                ${isOpen
                    ? "translate-x-0 w-72 opacity-100 lg:translate-x-0 lg:w-72 lg:opacity-100"
                    : "-translate-x-full w-72 lg:w-0 lg:opacity-0 lg:overflow-hidden lg:border-r-0 lg:shadow-none"
                }
            `}>
                {/* Mobile Close Header */}
                <div className="lg:hidden p-3 border-b flex justify-end flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded-lg text-gray-500 transition"
                    >
                        <span className="text-lg font-medium">X</span>
                    </button>
                </div>

                {/* User Info */}
                {user && (
                    <div className="px-4 py-3 bg-gray-50 border-b">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center text-sm font-bold text-green-700 flex-shrink-0">
                                {user.name?.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                                <p className="text-xs text-gray-500">{roleLabels[user.role] || user.role}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Menu */}
                <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-2">Menu Utama</p>
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={onClose}
                                className={`
                                    flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group
                                    ${isActive
                                        ? "bg-green-600 text-white shadow-sm"
                                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                    }
                                `}
                            >
                                <Icon size={18} className={isActive ? "text-white" : "text-gray-500 group-hover:text-gray-700"} />
                                <div className="flex-1 min-w-0">
                                    <span className="text-sm font-medium block">{item.label}</span>
                                    <span className={`text-[10px] ${isActive ? "text-green-100" : "text-gray-400"}`}>
                                        {item.desc}
                                    </span>
                                </div>
                                {isActive && <ChevronRight size={16} className="text-green-200" />}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="p-3 border-t bg-gray-50 flex-shrink-0 space-y-2">
                    {/* Logout Button */}
                    <button
                        onClick={handleLogout}
                        id="logout-btn"
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 transition-all text-sm font-medium"
                    >
                        <LogOut size={18} />
                        Keluar
                    </button>

                    <div className="text-xs text-gray-400 text-center pt-1">
                        TitikPanen v1.0
                        <br />
                        <span className="text-blue-500">Data: BMKG Indonesia</span>
                    </div>
                </div>
            </div>
        </>
    );
}