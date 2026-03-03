"use client";

import AppLayout from "@/components/AppLayout";
import { Database, FileText, Plus, Save, Search, Settings, Globe, FileUp, Building2, BookOpen, Layers } from "lucide-react";
import { useState, useEffect } from "react";
import { getRelevantKnowledge, saveKnowledgeEntry } from "@/lib/knowledge";
import { KnowledgeEntry } from "@/lib/knowledge-types";

const CATEGORIES = [
    { id: "general", label: "全体・共通", icon: Globe },
    { id: "institution", label: "金融機関別", icon: Building2 },
    { id: "program", label: "融資制度別", icon: BookOpen },
    { id: "document", label: "書類別", icon: FileText },
];

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const user = session?.user as any;
    const isAdmin = user?.role === "admin";

    const [activeCategory, setActiveCategory] = useState("general");
    const [searchQuery, setSearchQuery] = useState("");
    const [isAdding, setIsAdding] = useState(false);
    const [newEntry, setNewEntry] = useState({
        title: "",
        content: "",
        targetId: "",
        sourceType: "text" as "text" | "pdf" | "url",
        sourceUrl: ""
    });

    const [knowledge, setKnowledge] = useState<KnowledgeEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchKnowledge = async () => {
            try {
                const data = await getRelevantKnowledge({});
                setKnowledge(data);
            } catch (err) {
                console.error("Failed to fetch knowledge:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchKnowledge();
    }, []);

    const filteredKnowledge = knowledge.filter(k =>
        (activeCategory === "all" || k.category === activeCategory) &&
        (k.title.toLowerCase().includes(searchQuery.toLowerCase()) || k.content.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const handleAddEntry = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const entry = await saveKnowledgeEntry({
                ...newEntry,
                category: activeCategory as any,
            });
            setKnowledge([entry, ...knowledge]);
            setIsAdding(false);
            setNewEntry({ title: "", content: "", targetId: "", sourceType: "text", sourceUrl: "" });
        } catch (err) {
            alert("保存に失敗しました");
        }
    };

    if (status === "loading") {
        return <AppLayout><div className="flex items-center justify-center min-h-[60vh] text-muted italic">読み込み中...</div></AppLayout>;
    }

    if (!isAdmin) {
        return (
            <AppLayout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
                    <div className="w-16 h-16 rounded-full bg-accent-surface border border-line flex items-center justify-center mb-6">
                        <Settings size={24} className="text-muted" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
                    <p className="text-muted text-sm max-w-md">
                        このページにアクセスする権限がありません。管理者（demo@example.com）としてログインしてください。
                    </p>
                    <button
                        onClick={() => router.push("/")}
                        className="mt-8 blueprint-btn-outline px-8 py-3"
                    >
                        ダッシュボードに戻る
                    </button>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="max-w-6xl mx-auto py-8">
                <header className="flex justify-between items-end mb-10 pb-6 border-b border-line">
                    <div>
                        <div className="blueprint-label mb-2">Internal Administration</div>
                        <h2 className="text-3xl font-bold">RAG Knowledge Management</h2>
                        <p className="text-muted text-xs mt-2 font-bold uppercase tracking-tight">Manage expert knowledge bases for AI guidance & simulation</p>
                    </div>
                    <button
                        onClick={() => setIsAdding(!isAdding)}
                        className="blueprint-btn-primary flex items-center gap-2"
                    >
                        {isAdding ? "キャンセル" : <><Plus size={16} /> 追加する</>}
                    </button>
                </header>

                {isAdding && (
                    <div className="blueprint-card p-8 mb-10 bg-accent-surface border-ink animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="blueprint-label mb-6">New Knowledge Entry</div>
                        <form onSubmit={handleAddEntry} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="blueprint-label block mb-2">Title</label>
                                    <input
                                        type="text"
                                        value={newEntry.title}
                                        onChange={e => setNewEntry({ ...newEntry, title: e.target.value })}
                                        required
                                        className="w-full bg-surface border border-line rounded-lg py-3 px-4 text-xs focus:outline-none focus:border-ink transition-colors"
                                        placeholder="例: プログラム別審査基準"
                                    />
                                </div>
                                <div>
                                    <label className="blueprint-label block mb-2">Target ID (Institution/Program/Doc)</label>
                                    <input
                                        type="text"
                                        value={newEntry.targetId}
                                        onChange={e => setNewEntry({ ...newEntry, targetId: e.target.value })}
                                        className="w-full bg-surface border border-line rounded-lg py-3 px-4 text-xs focus:outline-none focus:border-ink transition-colors"
                                        placeholder="例: jfc, pl, startup-loan"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="blueprint-label block mb-2">Source Type</label>
                                    <div className="flex gap-2">
                                        {(["text", "pdf", "url"] as const).map(type => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => setNewEntry({ ...newEntry, sourceType: type })}
                                                className={`flex-1 py-2 rounded-lg border text-[10px] font-bold uppercase transition-all ${newEntry.sourceType === type ? 'bg-ink text-surface border-ink' : 'bg-surface border-line text-muted hover:border-ink'}`}
                                            >
                                                {type === "text" && "Text"}
                                                {type === "pdf" && <span className="flex items-center justify-center gap-1"><FileUp size={12} /> PDF</span>}
                                                {type === "url" && <span className="flex items-center justify-center gap-1"><Globe size={12} /> Website</span>}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {newEntry.sourceType !== "text" && (
                                    <div>
                                        <label className="blueprint-label block mb-2">{newEntry.sourceType === "pdf" ? "File / Path" : "Website URL"}</label>
                                        <input
                                            type="text"
                                            value={newEntry.sourceUrl}
                                            onChange={e => setNewEntry({ ...newEntry, sourceUrl: e.target.value })}
                                            required
                                            className="w-full bg-surface border border-line rounded-lg py-3 px-4 text-xs focus:outline-none focus:border-ink transition-colors"
                                            placeholder={newEntry.sourceType === "pdf" ? "PDFをアップロード..." : "https://example.com/guideline"}
                                        />
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="blueprint-label block mb-2">Content / Summary</label>
                                <textarea
                                    value={newEntry.content}
                                    onChange={e => setNewEntry({ ...newEntry, content: e.target.value })}
                                    required
                                    className="w-full bg-surface border border-line rounded-lg p-4 text-[11px] leading-relaxed focus:outline-none focus:border-ink resize-none h-40"
                                    placeholder="具体的なナレッジ内容、AIへの指示などを入力してください"
                                />
                            </div>

                            <div className="flex justify-end pt-4">
                                <button type="submit" className="blueprint-btn-primary px-12 py-4">知識データを保存する</button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <aside className="col-span-1 space-y-2">
                        <div className="blueprint-label mb-4 px-2">Knowledge Categories</div>
                        <button
                            onClick={() => setActiveCategory("all")}
                            className={`w-full text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all flex items-center gap-3 ${activeCategory === "all" ? 'bg-ink text-surface shadow-xl translate-x-1' : 'hover:bg-accent-surface text-muted'}`}
                        >
                            <Layers size={14} /> All Knowledge
                        </button>
                        <div className="h-px bg-line my-3" />
                        {CATEGORIES.map((cat) => {
                            const Icon = cat.icon;
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveCategory(cat.id)}
                                    className={`w-full text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all flex items-center gap-3 ${activeCategory === cat.id ? 'bg-ink text-surface shadow-xl translate-x-1' : 'hover:bg-accent-surface text-muted'}`}
                                >
                                    <Icon size={14} /> {cat.label}
                                </button>
                            );
                        })}
                    </aside>

                    <main className="col-span-3 space-y-6">
                        <div className="relative mb-8">
                            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                            <input
                                type="text"
                                placeholder="ナレッジを検索..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full bg-accent-surface border border-line rounded-xl py-4 pl-12 pr-4 text-xs focus:outline-none focus:border-ink transition-colors"
                            />
                        </div>

                        <div className="space-y-4">
                            {isLoading ? (
                                <div className="blueprint-card p-12 text-center text-muted animate-pulse">読み込み中...</div>
                            ) : filteredKnowledge.length === 0 ? (
                                <div className="blueprint-card p-12 text-center text-muted italic">該当する知識データがありません</div>
                            ) : (
                                filteredKnowledge.map(item => (
                                    <div key={item.id} className="blueprint-card p-6 group hover:border-ink transition-colors">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex gap-4 items-center">
                                                <div className="w-10 h-10 rounded border border-line bg-surface flex items-center justify-center text-ink">
                                                    {item.sourceType === "text" ? <Database size={18} /> : item.sourceType === "pdf" ? <FileUp size={18} /> : <Globe size={18} />}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="blueprint-label !mb-0">{item.category.toUpperCase()} | {item.targetId}</div>
                                                        {item.sourceType !== "text" && <span className="text-[8px] bg-ink text-surface px-1.5 py-0.5 rounded uppercase font-black">{item.sourceType}</span>}
                                                    </div>
                                                    <div className="text-sm font-bold mt-0.5">{item.title}</div>
                                                </div>
                                            </div>
                                            <button className="blueprint-btn-outline p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                編集
                                            </button>
                                        </div>
                                        <div className="w-full bg-accent-surface border border-line rounded-lg p-4 text-[11px] leading-relaxed text-muted line-clamp-3">
                                            {item.content}
                                        </div>
                                        <div className="mt-4 flex justify-end gap-3 items-center">
                                            <div className="text-[9px] text-muted flex items-center gap-2 mr-auto">
                                                <Settings size={12} />
                                                Last updated: {item.updatedAt}
                                            </div>
                                            <button className="text-muted hover:text-ink text-[10px] font-bold uppercase transition-colors">
                                                詳細を表示
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </main>
                </div>
            </div>
        </AppLayout>
    );
}
