"use client";

import AppLayout from "@/components/AppLayout";
import { Database, FileText, Plus, Save, Search, Settings } from "lucide-react";
import { useState } from "react";

const INITIAL_KNOWLEDGE = [
    { id: "1", source: "日本政策金融公庫", category: "損益計算書 (PL)", content: "創業融資の場合、自己資金とのバランスが重要です..." },
    { id: "2", source: "銀行", category: "貸借対照表 (BS)", content: "流動比率と自己資本比率の推移を注視します..." },
];

export default function AdminPage() {
    const [knowledge, setKnowledge] = useState(INITIAL_KNOWLEDGE);

    return (
        <AppLayout>
            <div className="max-w-6xl mx-auto py-8">
                <header className="flex justify-between items-end mb-10 pb-6 border-b border-line">
                    <div>
                        <div className="blueprint-label mb-2">Internal Administration</div>
                        <h2 className="text-3xl font-bold">RAG Knowledge Management</h2>
                        <p className="text-muted text-xs mt-2 font-bold uppercase tracking-tight">Manage expert knowledge bases for AI guidance & simulation</p>
                    </div>
                    <button className="blueprint-btn-primary flex items-center gap-2">
                        <Plus size={16} /> 追加する
                    </button>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <aside className="col-span-1 space-y-2">
                        <div className="blueprint-label mb-4 px-2">Funding Paths</div>
                        {["All Sources", "日本政策金融公庫", "銀行", "信用金庫", "補助金"].map((s, i) => (
                            <button key={i} className={`w-full text-left px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${i === 0 ? 'bg-ink text-surface' : 'hover:bg-accent-surface'}`}>
                                {s}
                            </button>
                        ))}
                    </aside>

                    <main className="col-span-3 space-y-6">
                        <div className="relative mb-8">
                            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                            <input
                                type="text"
                                placeholder="知識データを検索..."
                                className="w-full bg-accent-surface border border-line rounded-xl py-4 pl-12 pr-4 text-xs focus:outline-none focus:border-ink transition-colors"
                            />
                        </div>

                        <div className="space-y-4">
                            {knowledge.map(item => (
                                <div key={item.id} className="blueprint-card p-6 group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex gap-4 items-center">
                                            <div className="w-10 h-10 rounded border border-line bg-accent-surface flex items-center justify-center">
                                                <Database size={18} />
                                            </div>
                                            <div>
                                                <div className="blueprint-label">{item.source}</div>
                                                <div className="text-sm font-bold">{item.category}</div>
                                            </div>
                                        </div>
                                        <button className="blueprint-btn-outline p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            編集
                                        </button>
                                    </div>
                                    <textarea
                                        defaultValue={item.content}
                                        className="w-full bg-accent-surface border border-line rounded-lg p-4 text-[11px] leading-relaxed text-muted focus:outline-none focus:border-ink resize-none h-24"
                                    />
                                    <div className="mt-4 flex justify-end gap-3">
                                        <div className="text-[9px] text-muted flex items-center gap-2 mr-auto">
                                            <Settings size={12} />
                                            Final update: 2024/02/22 by Admin
                                        </div>
                                        <button className="blueprint-btn-outline py-2 px-6 text-[10px] flex items-center gap-2">
                                            <Save size={14} /> 保存
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </main>
                </div>
            </div>
        </AppLayout>
    );
}
