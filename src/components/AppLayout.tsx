"use client";

import { BlueprintBackground } from "@/components/Navigation";
import { useProject } from "@/context/ProjectContext";
import { ChevronDown, User, LogOut, Settings, LayoutDashboard, Upload, Search, MessageSquare } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { useSession } from "next-auth/react";

export default function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { data: session } = useSession();
    const { projects, activeProject, setActiveProjectId, logout } = useProject();
    const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);
    const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
    const pathname = usePathname();

    const user = session?.user as any;
    const isAdmin = user?.role === "admin";

    const TABS = [
        { name: "Document Upload", href: "/upload", icon: <Upload size={14} /> },
        { name: "Document Checker", href: "/checker", icon: <Search size={14} /> },
        { name: "Review Simulator", href: "/simulator", icon: <MessageSquare size={14} /> },
    ];

    return (
        <div className="min-h-screen flex flex-col text-ink selection:bg-ink selection:text-surface">
            <BlueprintBackground />

            <header className="flex items-center justify-between px-6 py-3 bg-surface border-b border-line sticky top-0 z-50">
                <div className="flex items-center gap-8">
                    <Link href="/" className="text-xl font-bold tracking-tighter hover:opacity-80 transition-opacity">
                        融資支援AI（仮）
                    </Link>

                    <div className="relative">
                        <button
                            onClick={() => setIsProjectMenuOpen(!isProjectMenuOpen)}
                            className="flex items-center gap-2 px-3 py-1.5 rounded border border-line bg-accent-surface hover:border-ink transition-colors text-[11px] font-bold"
                        >
                            <LayoutDashboard size={14} />
                            <span>Project: {activeProject?.name || "選択なし"}</span>
                            <ChevronDown size={12} className={clsx("transition-transform", isProjectMenuOpen && "rotate-180")} />
                        </button>

                        {isProjectMenuOpen && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setIsProjectMenuOpen(false)} />
                                <div className="absolute top-full left-0 mt-1 w-64 bg-surface border border-line rounded-lg shadow-lg z-20 py-1 overflow-hidden">
                                    <div className="blueprint-label px-3 py-2 border-b border-line bg-accent-surface">Switch Project</div>
                                    {projects.map((p) => (
                                        <button
                                            key={p.id}
                                            onClick={() => {
                                                setActiveProjectId(p.id);
                                                setIsProjectMenuOpen(false);
                                            }}
                                            className={clsx(
                                                "w-full text-left px-3 py-2 text-[11px] hover:bg-accent-surface transition-colors flex items-center justify-between",
                                                p.id === activeProject?.id && "font-bold text-ink"
                                            )}
                                        >
                                            <span>{p.name}</span>
                                            <span className="text-[9px] text-muted">{p.source}</span>
                                        </button>
                                    ))}
                                    <Link
                                        href="/"
                                        className="block w-full text-left px-3 py-2 text-[11px] text-muted hover:bg-accent-surface border-t border-line"
                                        onClick={() => setIsProjectMenuOpen(false)}
                                    >
                                        + 新規プロジェクト作成...
                                    </Link>
                                </div>
                            </>
                        )}
                    </div>

                    <nav className="flex items-center gap-1 ml-4">
                        {TABS.map((tab) => {
                            const isActive = pathname.startsWith(tab.href);
                            return (
                                <Link
                                    key={tab.href}
                                    href={tab.href}
                                    className={clsx(
                                        "flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-bold transition-all",
                                        isActive
                                            ? "bg-ink text-surface shadow-sm"
                                            : "text-muted hover:text-ink hover:bg-accent-surface"
                                    )}
                                >
                                    {tab.icon}
                                    <span>{tab.name}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="relative">
                    <button
                        onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                        className="w-9 h-9 rounded-full bg-accent-surface border border-line flex items-center justify-center hover:border-ink transition-colors group"
                    >
                        <User size={18} className="group-hover:scale-110 transition-transform" />
                    </button>

                    {isAccountMenuOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setIsAccountMenuOpen(false)} />
                            <div className="absolute top-full right-0 mt-1 w-48 bg-surface border border-line rounded-lg shadow-lg z-20 py-1 overflow-hidden">
                                <div className="px-3 py-2 border-b border-line mb-1">
                                    <div className="font-bold text-[11px] truncate">{user?.email || "GUEST"}</div>
                                    <div className="text-[9px] text-muted">{isAdmin ? "Administrator" : "User"}</div>
                                </div>
                                <button className="w-full text-left px-3 py-2 text-[11px] hover:bg-accent-surface flex items-center gap-2">
                                    <Settings size={14} /> 設定
                                </button>
                                {isAdmin && (
                                    <Link href="/admin" className="w-full text-left px-3 py-2 text-[11px] hover:bg-accent-surface flex items-center gap-2">
                                        <LayoutDashboard size={14} /> 管理画面
                                    </Link>
                                )}
                                <div className="border-t border-line mt-1 pt-1">
                                    <button
                                        onClick={logout}
                                        className="w-full text-left px-3 py-2 text-[11px] hover:bg-accent-surface flex items-center gap-2 text-ink"
                                    >
                                        <LogOut size={14} /> ログアウト
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </header>

            <main className="flex-1 p-6 overflow-auto scrollbar-thin scrollbar-thumb-line">
                {children}
            </main>
        </div>
    );
}
