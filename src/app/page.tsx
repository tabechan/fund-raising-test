"use client";

import AppLayout from "@/components/AppLayout";
import { Plus, X } from "lucide-react";
import Link from "next/link";
import { useProject } from "@/context/ProjectContext";
import { useState } from "react";

export default function ProjectsPage() {
  const { projects, setActiveProjectId, addProject } = useProject();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", source: "日本政策金融公庫", amount: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addProject({ ...formData, status: "進行中" });
    setIsModalOpen(false);
    setFormData({ name: "", source: "日本政策金融公庫", amount: "" });
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-end mb-8">
          <div>
            <div className="blueprint-label mb-1">Overview</div>
            <h2 className="text-2xl font-bold">プロジェクト一覧</h2>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="blueprint-btn-primary flex items-center gap-2 text-xs"
          >
            <Plus size={14} />
            新規プロジェクト作成
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((project) => (
            <Link
              key={project.id}
              href="/upload"
              onClick={() => setActiveProjectId(project.id)}
              className="blueprint-card p-6 group cursor-pointer block relative transition-all active:scale-[0.98]"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="blueprint-label">{project.source}</div>
                <div className="px-2 py-0.5 rounded border border-line bg-accent-surface text-[10px] font-bold">
                  {project.status}
                </div>
              </div>
              <h3 className="text-lg font-bold mb-2 group-hover:underline">{project.name}</h3>
              <div className="flex gap-4 items-center">
                <div>
                  <div className="blueprint-label">目標金額</div>
                  <div className="text-sm font-bold">{project.amount}</div>
                </div>
              </div>
            </Link>
          ))}

          <button
            onClick={() => setIsModalOpen(true)}
            className="blueprint-card p-6 border-dashed border-2 flex flex-col items-center justify-center gap-3 text-muted hover:text-ink hover:border-ink transition-all min-h-[160px]"
          >
            <Plus size={24} />
            <span className="text-xs font-bold">新しいプロジェクトを追加</span>
          </button>
        </div>
      </div>

      {/* Create Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-ink/20 backdrop-blur-sm">
          <div className="blueprint-card p-8 w-full max-w-md relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-muted hover:text-ink"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-bold mb-6">新規プロジェクト作成</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="blueprint-label block mb-1.5">Project Name</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-accent-surface border border-line rounded-lg py-2.5 px-4 text-xs focus:outline-none focus:border-ink transition-colors"
                  placeholder="例: 新規事業調達A"
                />
              </div>

              <div>
                <label className="blueprint-label block mb-1.5">Funding Source</label>
                <select
                  value={formData.source}
                  onChange={e => setFormData({ ...formData, source: e.target.value })}
                  className="w-full bg-accent-surface border border-line rounded-lg py-2.5 px-4 text-xs focus:outline-none focus:border-ink transition-colors appearance-none"
                >
                  <option>日本政策金融公庫</option>
                  <option>銀行</option>
                  <option>信用金庫</option>
                  <option>補助金</option>
                </select>
              </div>

              <div>
                <label className="blueprint-label block mb-1.5">Target Amount</label>
                <input
                  required
                  type="text"
                  value={formData.amount}
                  onChange={e => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full bg-accent-surface border border-line rounded-lg py-2.5 px-4 text-xs focus:outline-none focus:border-ink transition-colors"
                  placeholder="例: 1,000万円"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 blueprint-btn-outline"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="flex-1 blueprint-btn-primary"
                >
                  作成する
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
