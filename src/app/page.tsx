"use client";

import AppLayout from "@/components/AppLayout";
import { Plus, X, Check, ChevronRight, ChevronLeft, Info, Search } from "lucide-react";
import Link from "next/link";
import { useProject } from "@/context/ProjectContext";
import { useState, useMemo } from "react";
import { JFC_BUSINESS_TYPES, JFC_THEMES, JFC_LOAN_PROGRAMS, JFC_SOURCE_NAME } from "@/lib/jfc-data";
import { useRouter } from "next/navigation";

export default function ProjectsPage() {
  const router = useRouter();
  const { projects, setActiveProjectId, addProject } = useProject();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    source: JFC_SOURCE_NAME,
    amount: "",
    jfcLoanProgramId: ""
  });

  const [modalStep, setModalStep] = useState(1);
  const [jfcFilters, setJfcFilters] = useState<{
    businessTypes: string[];
    themes: string[];
    segment: '国民生活' | '中小企業' | '農林水産';
  }>({
    businessTypes: [],
    themes: [],
    segment: '国民生活'
  });

  const filteredPrograms = useMemo(() => {
    return JFC_LOAN_PROGRAMS.filter(p => {
      // Segment filter
      if (p.segment !== jfcFilters.segment) return false;

      // Business Type (OR match)
      if (jfcFilters.businessTypes.length > 0) {
        const hasMatch = jfcFilters.businessTypes.some(tag => p.businessTypeTags.includes(tag));
        if (!hasMatch) return false;
      }

      // Themes (OR match)
      if (jfcFilters.themes.length > 0) {
        const hasMatch = jfcFilters.themes.some(tag => p.themeTags.includes(tag));
        if (!hasMatch) return false;
      }

      return true;
    });
  }, [jfcFilters]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.source === JFC_SOURCE_NAME && modalStep < 5) {
      setModalStep(modalStep + 1);
      return;
    }

    addProject({
      name: formData.name,
      source: formData.source,
      amount: formData.amount,
      jfcLoanProgramId: formData.jfcLoanProgramId || undefined,
      status: "進行中"
    });

    resetModal();
    router.push("/upload");
  };

  const resetModal = () => {
    setIsModalOpen(false);
    setModalStep(1);
    setFormData({ name: "", source: JFC_SOURCE_NAME, amount: "", jfcLoanProgramId: "" });
    setJfcFilters({ businessTypes: [], themes: [], segment: '国民生活' });
  };

  const toggleFilter = (type: 'businessTypes' | 'themes', id: string) => {
    setJfcFilters(prev => ({
      ...prev,
      [type]: prev[type].includes(id)
        ? prev[type].filter(item => item !== id)
        : [...prev[type], id]
    }));
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
          <div className="blueprint-card p-8 w-full max-w-2xl relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={resetModal}
              className="absolute top-4 right-4 text-muted hover:text-ink"
            >
              <X size={20} />
            </button>

            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="blueprint-label">Step {modalStep} / {formData.source === JFC_SOURCE_NAME ? 5 : 1}</div>
              </div>
              <h3 className="text-xl font-bold">新規プロジェクト作成</h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {modalStep === 1 && (
                <div className="space-y-4">
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

                  <div className="grid grid-cols-2 gap-4">
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
                  </div>
                </div>
              )}

              {modalStep === 2 && formData.source === JFC_SOURCE_NAME && (
                <div className="space-y-6">
                  <div>
                    <label className="blueprint-label block mb-3 text-sm">Step 2: 事業者区分（最上位）</label>
                    <div className="grid grid-cols-1 gap-3">
                      {[
                        { id: '国民生活', label: '小規模事業者／個人事業主の方・中小企業の方', sub: '国民生活事業' },
                        { id: '農林水産', label: '農林漁業者・食品加工流通業の方', sub: '農林水産事業' },
                        { id: '中小企業', label: '中堅・中小企業の方', sub: '中小企業事業' },
                      ].map(seg => (
                        <button
                          key={seg.id}
                          type="button"
                          onClick={() => setJfcFilters(p => ({ ...p, segment: seg.id as any }))}
                          className={`w-full text-left p-4 rounded-xl border-2 transition-all ${jfcFilters.segment === seg.id
                            ? 'border-ink bg-accent-surface'
                            : 'border-line hover:border-ink/50 bg-white'
                            }`}
                        >
                          <div className="flex justify-between items-center">
                            <div className="font-bold text-sm tracking-tight">{seg.label}</div>
                            {jfcFilters.segment === seg.id && <Check size={18} className="text-ink" />}
                          </div>
                          <div className="text-[10px] text-muted font-bold mt-1">{seg.sub}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {modalStep === 3 && formData.source === JFC_SOURCE_NAME && (
                <div className="space-y-6">
                  <div>
                    <label className="blueprint-label block mb-3 text-sm">Step 3: 事業内容（複数選択可）</label>
                    <div className="flex flex-wrap gap-2">
                      {JFC_BUSINESS_TYPES.map(bt => (
                        <button
                          key={bt.id}
                          type="button"
                          onClick={() => toggleFilter('businessTypes', bt.id)}
                          className={`px-4 py-2 rounded-full border text-xs font-bold transition-all flex items-center gap-2 ${jfcFilters.businessTypes.includes(bt.id)
                            ? 'bg-ink text-surface border-ink'
                            : 'bg-accent-surface border-line text-muted hover:border-ink'
                            }`}
                        >
                          {jfcFilters.businessTypes.includes(bt.id) && <Check size={12} />}
                          {bt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100 flex gap-3">
                    <Info size={18} className="text-emerald-700 shrink-0" />
                    <p className="text-[11px] text-emerald-800 leading-relaxed font-bold">
                      生活衛生関係営業とは：飲食店、喫茶店、理容店、美容店、クリーニング店、公衆浴場、旅館、食肉・氷雪販売店などが該当します。
                    </p>
                  </div>
                </div>
              )}

              {modalStep === 4 && formData.source === JFC_SOURCE_NAME && (
                <div>
                  <label className="blueprint-label block mb-3 text-sm">Step 4: 利用目的・テーマ（複数選択可）</label>
                  <div className="grid grid-cols-2 gap-2">
                    {JFC_THEMES.map(theme => (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => toggleFilter('themes', theme.id)}
                        className={`px-4 py-2.5 rounded-lg border text-left text-[11px] font-bold transition-all flex items-center justify-between ${jfcFilters.themes.includes(theme.id)
                          ? 'bg-ink text-surface border-ink'
                          : 'bg-accent-surface border-line text-muted hover:border-ink'
                          }`}
                      >
                        <span>{theme.label}</span>
                        {jfcFilters.themes.includes(theme.id) && <Check size={14} />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {modalStep === 5 && formData.source === JFC_SOURCE_NAME && (
                <div className="space-y-4">
                  <label className="blueprint-label block mb-1 text-sm">Step 5: 融資制度の選択</label>
                  <p className="text-[10px] text-muted mb-4 font-bold">ご入力いただいた内容に基づき、おすすめの融資制度を絞り込みました。</p>

                  <div className="max-h-[300px] overflow-y-auto pr-2 space-y-3 scrollbar-thin">
                    {filteredPrograms.length > 0 ? (
                      filteredPrograms.map(program => (
                        <button
                          key={program.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, jfcLoanProgramId: program.id })}
                          className={`w-full text-left p-4 rounded-xl border-2 transition-all ${formData.jfcLoanProgramId === program.id
                            ? 'border-ink bg-accent-surface'
                            : 'border-line hover:border-ink/50 bg-white'
                            }`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="font-bold text-sm tracking-tight">{program.name}</h4>
                            {formData.jfcLoanProgramId === program.id && <Check size={18} className="text-ink" />}
                          </div>
                          <p className="text-[11px] text-muted mb-3 leading-relaxed">{program.summary}</p>
                          <div className="flex gap-2">
                            <span className="text-[9px] px-2 py-0.5 bg-line/50 rounded-full font-bold uppercase">{program.segment}</span>
                            {program.themeTags.map(tag => (
                              <span key={tag} className="text-[9px] px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold">
                                {JFC_THEMES.find(t => t.id === tag)?.label}
                              </span>
                            ))}
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="p-8 text-center border-2 border-dashed border-line rounded-xl">
                        <Search size={24} className="mx-auto mb-2 text-muted" />
                        <p className="text-sm font-bold text-muted">該当する制度が見つかりませんでした。</p>
                        <button
                          type="button"
                          onClick={() => setJfcFilters({ businessTypes: [], themes: [], segment: '国民生活' })}
                          className="text-[11px] text-ink underline mt-2 font-bold"
                        >
                          条件をリセットする
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-6 flex gap-3 border-t border-line">
                {modalStep > 1 && (
                  <button
                    type="button"
                    onClick={() => setModalStep(modalStep - 1)}
                    className="flex-1 blueprint-btn-outline flex items-center justify-center gap-2"
                  >
                    <ChevronLeft size={16} />
                    戻る
                  </button>
                )}
                {modalStep === 1 ? (
                  <button
                    type="button"
                    onClick={resetModal}
                    className="flex-1 blueprint-btn-outline"
                  >
                    キャンセル
                  </button>
                ) : null}

                <button
                  type="submit"
                  disabled={modalStep === 5 && formData.source === JFC_SOURCE_NAME && !formData.jfcLoanProgramId}
                  className="flex-2 blueprint-btn-primary flex items-center justify-center gap-2"
                >
                  {formData.source === JFC_SOURCE_NAME ? (
                    modalStep < 5 ? (
                      <>
                        次へ
                        <ChevronRight size={16} />
                      </>
                    ) : 'プロジェクトを作成する'
                  ) : '作成する'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
