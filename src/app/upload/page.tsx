"use client";

import AppLayout from "@/components/AppLayout";
import {
    Upload, FileText, CheckCircle2, AlertCircle, Clock,
    X, Download, RefreshCw, Eye,
} from "lucide-react";
import { useState, useRef, useCallback } from "react";
import { clsx } from "clsx";
import { useProject, Document, DocumentStatus, DocumentFile } from "@/context/ProjectContext";
import { suggestDocumentCategory, fileToBase64, AIFile } from "@/lib/ai";
import { JFC_DOC_TEMPLATES, JFC_SOURCE_NAME } from "@/lib/jfc-data";

const STATUS_CONFIG: Record<DocumentStatus, {
    icon: React.ReactNode;
    label: string;
    bgColor: string;
    border: string;
    text: string;
}> = {
    ok: {
        icon: <CheckCircle2 size={20} />,
        label: "OK",
        bgColor: "bg-emerald-50/50",
        border: "border-emerald-200",
        text: "text-emerald-700",
    },
    needs_fix: {
        icon: <AlertCircle size={20} />,
        label: "要改善",
        bgColor: "bg-amber-50/50",
        border: "border-amber-200",
        text: "text-amber-700",
    },
    missing: {
        icon: <Clock size={20} />,
        label: "未提出",
        bgColor: "bg-red-50/50",
        border: "border-red-200",
        text: "text-red-700",
    },
};

export default function UploadPage() {
    const { activeProject, uploadDocument, removeDocumentFile } = useProject();
    const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
    const [viewingDoc, setViewingDoc] = useState<{ name: string; url: string; mimeType?: string } | null>(null);
    const [dragging, setDragging] = useState(false);
    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const globalFileRef = useRef<HTMLInputElement>(null);
    const modalFileRef = useRef<HTMLInputElement>(null);

    const [suggestedDocId, setSuggestedDocId] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // ── helpers ──────────────────────────────────────────────
    const handleFilesSelected = async (files: FileList | null, docId?: string) => {
        if (!files || files.length === 0) return;
        const file = files[0];

        if (docId) {
            // Direct upload for a specific document slot
            uploadDocument(docId, file);
            setSelectedDocId(null);
        } else {
            // Global drop: perform AI analysis to suggest a slot
            setPendingFile(file);
            setSelectedDocId("__pending__");
            setIsAnalyzing(true);
            setSuggestedDocId(null);

            try {
                const base64 = await fileToBase64(file);
                const aiFile: AIFile = { data: base64, mimeType: file.type };
                const availableCats = activeProject?.documents.map(d => ({ id: d.id, name: d.category })) || [];
                const suggestion = await suggestDocumentCategory(aiFile, availableCats);
                setSuggestedDocId(suggestion);
            } catch (err) {
                console.error("Analysis failed:", err);
            } finally {
                setIsAnalyzing(false);
            }
        }
    };

    const handleModalConfirm = (docId: string) => {
        if (pendingFile) {
            uploadDocument(docId, pendingFile);
        }
        setPendingFile(null);
        setSelectedDocId(null);
    };

    const handleDownload = (doc: { name: string; fileUrl?: string }) => {
        if (!doc.fileUrl) return;
        const a = document.createElement("a");
        a.href = doc.fileUrl;
        a.download = doc.name;
        a.click();
    };

    const onDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragging(true);
    }, []);

    const onDragLeave = useCallback(() => setDragging(false), []);

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        handleFilesSelected(e.dataTransfer.files);
    }, [activeProject]); // eslint-disable-line

    if (!activeProject) return <AppLayout>Loading...</AppLayout>;

    // ── current modal doc ────────────────────────────────────
    const modalDoc = selectedDocId && selectedDocId !== "__pending__"
        ? activeProject.documents.find(d => d.id === selectedDocId)
        : null;

    return (
        <AppLayout>
            <div className="max-w-5xl mx-auto">
                <header className="mb-8">
                    <div className="blueprint-label mb-1">Step 01</div>
                    <h2 className="text-2xl font-bold">書類アップロード</h2>
                    <p className="text-muted mt-2 text-xs">
                        申請に必要な財務書類をアップロードしてください。AIが自動で分類と解析を行います。
                    </p>
                </header>

                {/* ── Global Drop Zone ─────────────────────────────── */}
                <div className="grid grid-cols-1 mb-12">
                    <div
                        onDragOver={onDragOver}
                        onDragLeave={onDragLeave}
                        onDrop={onDrop}
                        onClick={() => globalFileRef.current?.click()}
                        className={clsx(
                            "blueprint-card p-10 border-dashed border-2 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all min-h-[200px] group relative overflow-hidden",
                            dragging ? "border-ink bg-accent-surface" : "hover:bg-accent-surface"
                        )}
                    >
                        <div className="absolute top-0 left-0 w-20 h-20 border-r border-b border-line/10 rounded-br-full" />
                        <div className="absolute bottom-0 right-0 w-20 h-20 border-l border-t border-line/10 rounded-tl-full" />
                        <div className={clsx(
                            "w-14 h-14 rounded-full bg-accent-surface border border-line flex items-center justify-center transition-colors",
                            dragging ? "border-ink" : "group-hover:border-ink"
                        )}>
                            <Upload size={24} className={dragging ? "text-ink" : ""} />
                        </div>
                        <div className="text-center">
                            <div className="font-bold">
                                {dragging ? "ここにドロップ" : "ファイルをドラッグ＆ドロップ"}
                            </div>
                            <div className="blueprint-label mt-2">
                                またはクリックしてファイルを選択 (PDF, PNG, JPG, XLSX)
                            </div>
                        </div>
                    </div>
                    <input
                        type="file"
                        ref={globalFileRef}
                        className="hidden"
                        accept=".pdf,.png,.jpg,.jpeg,.xlsx,.xls"
                        onChange={e => handleFilesSelected(e.target.files)}
                    />
                </div>

                {/* ── Document List ─────────────────────────────────── */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <div className="blueprint-label">Required Documents</div>
                        <div className="flex gap-4">
                            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                                <div key={key} className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-muted">
                                    <div className={clsx("w-2 h-2 rounded-full", config.text.replace("text-", "bg-"))} />
                                    {config.label}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        {activeProject.documents.map((doc: Document) => {
                            const config = STATUS_CONFIG[doc.status];
                            return (
                                <div
                                    key={doc.id}
                                    className={clsx(
                                        "blueprint-card flex flex-col transition-all overflow-hidden",
                                        config.border
                                    )}
                                >
                                    {/* Slot Header */}
                                    <div className="p-5 flex items-center justify-between bg-accent-surface/30 border-b border-line/50">
                                        <div className="flex items-center gap-5">
                                            <div className={clsx(
                                                "w-14 h-14 rounded-lg border flex items-center justify-center shadow-sm",
                                                doc.status === "missing"
                                                    ? "bg-accent-surface border-line text-muted"
                                                    : "bg-surface border-line"
                                            )}>
                                                <FileText size={28} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-bold text-lg">{doc.category}</h4>
                                                    <span className={clsx(
                                                        "px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider",
                                                        config.bgColor, config.text, config.border
                                                    )}>
                                                        {config.label}
                                                    </span>
                                                    {doc.requiredCount > 0 && (
                                                        <span className="text-[10px] font-bold text-muted bg-line/30 px-2 py-0.5 rounded border border-line">
                                                            必要数: {doc.requiredCount}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted font-bold tracking-tight">
                                                    {doc.files.length > 0 ? `${doc.files.length} 個のファイルをアップロード済み` : "未アップロード"}
                                                </p>

                                                {activeProject.source === JFC_SOURCE_NAME && JFC_DOC_TEMPLATES[doc.id] && (
                                                    <div className="flex gap-2 mt-2">
                                                        {JFC_DOC_TEMPLATES[doc.id].downloadUrl && (
                                                            <a
                                                                href={JFC_DOC_TEMPLATES[doc.id].downloadUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-[9px] font-bold text-red-600 hover:underline flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-line"
                                                            >
                                                                <Download size={10} />
                                                                {JFC_DOC_TEMPLATES[doc.id].downloadUrl?.toLowerCase().endsWith('.zip') ? 'ZIP形式' : 'PDF形式'}
                                                            </a>
                                                        )}
                                                        {JFC_DOC_TEMPLATES[doc.id].excelUrl && (
                                                            <a
                                                                href={JFC_DOC_TEMPLATES[doc.id].excelUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-[9px] font-bold text-emerald-700 hover:underline flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-line"
                                                            >
                                                                <Download size={10} />
                                                                {JFC_DOC_TEMPLATES[doc.id].excelUrl?.toLowerCase().endsWith('.xls') || JFC_DOC_TEMPLATES[doc.id].excelUrl?.toLowerCase().endsWith('.xlsx') ? 'Excel形式' : '所定様式'}
                                                            </a>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => setSelectedDocId(doc.id)}
                                            className="blueprint-btn-primary py-2.5 px-8 text-xs flex items-center gap-2"
                                        >
                                            <Upload size={18} />
                                            {doc.files.length > 0 ? "追加アップロード" : "アップロード"}
                                        </button>
                                    </div>

                                    {/* File List */}
                                    {doc.files.length > 0 && (
                                        <div className="p-4 bg-surface space-y-2">
                                            {doc.files.map((file: DocumentFile) => (
                                                <div key={file.id} className="flex items-center justify-between py-2 px-4 rounded-xl border border-line/40 hover:bg-accent-surface/50 transition-colors group">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded bg-accent-surface flex items-center justify-center text-muted">
                                                            <FileText size={16} />
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-bold truncate max-w-[300px]">{file.name}</div>
                                                            <div className="text-[10px] text-muted font-bold">{file.date}</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => setViewingDoc({ name: file.name, url: file.fileUrl!, mimeType: file.mimeType })}
                                                            className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-line text-muted hover:text-ink transition-all"
                                                            title="プレビュー"
                                                        >
                                                            <Eye size={20} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDownload({ name: file.name, fileUrl: file.fileUrl })}
                                                            className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-line text-muted hover:text-ink transition-all"
                                                            title="ダウンロード"
                                                        >
                                                            <Download size={20} />
                                                        </button>
                                                        <button
                                                            onClick={() => removeDocumentFile(doc.id, file.id)}
                                                            className="p-2 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-200 text-muted hover:text-red-600 transition-all"
                                                            title="削除"
                                                        >
                                                            <X size={20} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>
            </div>

            {/* ── Upload / Re-upload Modal ───────────────────────── */}
            {selectedDocId && selectedDocId !== "__pending__" && (
                <UploadModal
                    title={modalDoc?.category ?? "書類アップロード"}
                    onClose={() => setSelectedDocId(null)}
                    onFileSelected={(file) => {
                        uploadDocument(selectedDocId, file);
                        setSelectedDocId(null);
                    }}
                    fileInputRef={modalFileRef}
                />
            )}

            {/* ── Pending File → choose slot modal ─────────────── */}
            {selectedDocId === "__pending__" && pendingFile && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-ink/20 backdrop-blur-sm">
                    <div className="blueprint-card p-8 w-full max-w-md relative animate-in fade-in zoom-in duration-200">
                        <button
                            onClick={() => { setPendingFile(null); setSelectedDocId(null); }}
                            className="absolute top-4 right-4 text-muted hover:text-ink"
                        >
                            <X size={20} />
                        </button>
                        <div className="blueprint-label mb-2">Assign Document</div>
                        <h3 className="text-xl font-bold mb-1">書類スロットを選択</h3>
                        <p className="text-[11px] text-muted mb-6 truncate">選択ファイル: {pendingFile.name}</p>

                        {isAnalyzing && (
                            <div className="mb-6 p-4 bg-accent-surface rounded-xl border border-line flex items-center gap-3">
                                <RefreshCw size={16} className="animate-spin text-ink" />
                                <span className="text-xs font-bold text-ink">AIが最適なカテゴリを分析中...</span>
                            </div>
                        )}

                        <div className="space-y-2">
                            {activeProject.documents.map((d: Document) => (
                                <button
                                    key={d.id}
                                    onClick={() => handleModalConfirm(d.id)}
                                    className={clsx(
                                        "w-full text-left px-4 py-3 rounded-xl border transition-all text-sm font-bold flex items-center justify-between relative overflow-hidden",
                                        suggestedDocId === d.id
                                            ? "border-emerald-500 bg-emerald-50/30 shadow-sm"
                                            : "border-line hover:border-ink hover:bg-accent-surface"
                                    )}
                                >
                                    <div className="flex items-center gap-2">
                                        {suggestedDocId === d.id && <CheckCircle2 size={16} className="text-emerald-600" />}
                                        {d.category}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {suggestedDocId === d.id && (
                                            <span className="text-[8px] bg-emerald-600 text-white px-2 py-0.5 rounded-full uppercase tracking-tighter shadow-sm animate-pulse">
                                                AI Recommended
                                            </span>
                                        )}
                                        <span className={clsx(
                                            "text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border",
                                            STATUS_CONFIG[d.status].text,
                                            STATUS_CONFIG[d.status].border,
                                            STATUS_CONFIG[d.status].bgColor,
                                        )}>
                                            {STATUS_CONFIG[d.status].label}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Preview Modal ─────────────────────────────────── */}
            {viewingDoc && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-ink/40 backdrop-blur-md">
                    <div className="blueprint-card w-full max-w-4xl h-[85vh] flex flex-col relative">
                        <header className="p-4 border-b border-line flex items-center justify-between bg-surface">
                            <div className="flex items-center gap-3">
                                <FileText size={20} />
                                <span className="font-bold text-sm tracking-tight">{viewingDoc.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleDownload({ name: viewingDoc.name, fileUrl: viewingDoc.url })}
                                    className="blueprint-btn-outline p-2 h-8 w-8 flex items-center justify-center"
                                    title="ダウンロード"
                                >
                                    <Download size={14} />
                                </button>
                                <button
                                    onClick={() => setViewingDoc(null)}
                                    className="text-muted hover:text-ink"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </header>
                        <div className="flex-1 overflow-auto bg-accent-surface">
                            {viewingDoc.mimeType?.startsWith("image/") ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={viewingDoc.url}
                                    alt={viewingDoc.name}
                                    className="max-w-full max-h-full mx-auto object-contain p-4"
                                />
                            ) : (
                                <iframe
                                    src={viewingDoc.url}
                                    className="w-full h-full border-0"
                                    title={viewingDoc.name}
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}

// ── Reusable Upload Modal ───────────────────────────────────
function UploadModal({
    title,
    onClose,
    onFileSelected,
    fileInputRef,
}: {
    title: string;
    onClose: () => void;
    onFileSelected: (file: File) => void;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
}) {
    const [selected, setSelected] = useState<File | null>(null);
    const [dragging, setDragging] = useState(false);

    const handleFiles = (files: FileList | null) => {
        if (!files || files.length === 0) return;
        const file = files[0];
        if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
            alert("注意: Excel形式 (.xlsx, .xls) はアップロード可能ですが、AIによる内容解析とアドバイスの対象外となります。解析が必要な場合はPDFまたは画像形式に変換してください。");
        }
        setSelected(file);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-ink/20 backdrop-blur-sm">
            <div className="blueprint-card p-8 w-full max-w-md relative animate-in fade-in zoom-in duration-200">
                <button onClick={onClose} className="absolute top-4 right-4 text-muted hover:text-ink">
                    <X size={20} />
                </button>
                <div className="blueprint-label mb-2">Upload Document</div>
                <h3 className="text-xl font-bold mb-6">{title}</h3>

                <div
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
                    onClick={() => fileInputRef.current?.click()}
                    className={clsx(
                        "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors",
                        dragging ? "border-ink bg-surface" : "border-line bg-accent-surface hover:bg-surface"
                    )}
                >
                    {selected ? (
                        <div className="flex items-center justify-center gap-3">
                            <FileText size={24} className="text-ink" />
                            <div className="text-left">
                                <div className="text-xs font-bold">{selected.name}</div>
                                <div className="blueprint-label mt-0.5">
                                    {(selected.size / 1024).toFixed(1)} KB
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            <Upload size={32} className="mx-auto mb-4 text-muted" />
                            <div className="text-xs font-bold">新しいファイルを選択 / ドロップ</div>
                            <div className="blueprint-label mt-1">PDF / XLSX / PNG / JPG</div>
                        </>
                    )}
                </div>
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".pdf,.png,.jpg,.jpeg,.xlsx,.xls"
                    onChange={(e) => handleFiles(e.target.files)}
                />

                <div className="mt-8 flex gap-3">
                    <button onClick={onClose} className="flex-1 blueprint-btn-outline">
                        キャンセル
                    </button>
                    <button
                        disabled={!selected}
                        onClick={() => selected && onFileSelected(selected)}
                        className="flex-1 blueprint-btn-primary disabled:opacity-50"
                    >
                        確定する
                    </button>
                </div>
            </div>
        </div>
    );
}
