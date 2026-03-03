"use client";

import AppLayout from "@/components/AppLayout";
import { CheckCircle2, AlertCircle, Clock, Download, Send, Mic, FileText, Eye, ListChecks, CheckCircle, Paperclip, X as CloseIcon } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useProject } from "@/context/ProjectContext";
import { getAICheckerResponse, startVoiceRecognition, fileToBase64, AIFile } from "@/lib/ai";
import { getFormattedKnowledge } from "@/lib/knowledge";
import { clsx } from "clsx";
import { JFC_DOC_TEMPLATES, JFC_SOURCE_NAME, JFC_LOAN_PROGRAMS, JFCLoanProgram } from "@/lib/jfc-data";
import { excelToCsv, isExcelFile, getExcelMimeType, excelToPdfBase64 } from "@/lib/excel";

const STATUS_CONFIG = {
    ok: { icon: <CheckCircle2 size={18} className="text-emerald-700" />, label: "OK", text: "text-emerald-700", bg: "bg-emerald-50/50", border: "border-emerald-200" },
    needs_fix: { icon: <AlertCircle size={18} className="text-amber-700" />, label: "要改善", text: "text-amber-700", bg: "bg-amber-50/50", border: "border-amber-200" },
    missing: { icon: <Clock size={18} className="text-red-700" />, label: "未提出", text: "text-red-700", bg: "bg-red-50/50", border: "border-red-200" },
};

const FormattedText = ({ text }: { text: string }) => {
    if (!text) return null;
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return (
        <div className="whitespace-pre-wrap">
            {parts.map((part, i) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={i} className="font-black text-ink bg-amber-100/30 px-1 rounded">{part.slice(2, -2)}</strong>;
                }
                return part;
            })}
        </div>
    );
};

export default function CheckerPage() {
    const { activeProject, updateDocTodo, setDocTodos, addDocMessage, uploadDocument } = useProject();
    const [selectedDocId, setSelectedDocId] = useState("bs");
    const [inputText, setInputText] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isTodoOpen, setIsTodoOpen] = useState(false);
    const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const selectedDoc = activeProject?.documents.find(d => d.id === selectedDocId) || activeProject?.documents[0];

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [selectedDoc?.messages, selectedDocId]);

    // Initial Analysis Trigger
    useEffect(() => {
        if (!selectedDoc || !activeProject) return;

        const docId = selectedDoc.id;
        if (selectedDoc.messages && selectedDoc.messages.length > 0) return;

        const runInitialAnalysis = async () => {
            setIsTyping(true);
            let initialMsg = "";
            let filesToProvide: AIFile[] = [];

            // 1. Prepare data from all files in category
            for (const fileItem of selectedDoc.files) {
                if (fileItem.base64Data) {
                    filesToProvide.push({
                        data: fileItem.base64Data,
                        mimeType: fileItem.mimeType || "application/pdf"
                    });
                }
            }

            // Aggregate CSV content
            const aggregatedCsv = selectedDoc.files
                .filter(f => f.csvContent)
                .map(f => `--- 書類: ${f.name} ---\n${f.csvContent}`)
                .join("\n\n");

            // 2. Compose initial prompt based on status
            let prompt = "";
            if (selectedDoc.status === "missing") {
                prompt = "この書類はまだ提出されていません。書類の役割と、作成のポイントについて教えてください。また、作成をサポートできるか提案してください。";
            } else if (selectedDoc.status === "needs_fix" || selectedDoc.status === "ok") {
                prompt = "この書類の解析を開始してください。改善点があれば具体的にリストアップし、なければ「大丈夫そうです」と伝えた上で質問を促してください。";
            }

            try {
                // Prepare project and cross-doc context
                const projectInfo = {
                    name: activeProject.name,
                    amount: activeProject.amount,
                    jfcLoanProgram: activeProject.jfcLoanProgramId ? JFC_LOAN_PROGRAMS.find((p: JFCLoanProgram) => p.id === activeProject.jfcLoanProgramId)?.name : undefined
                };

                const crossDocContext = activeProject.documents
                    .filter(d => d.id !== selectedDoc.id && d.messages && d.messages.length > 0)
                    .map(d => `--- ${d.category} ---\n${d.messages[d.messages.length - 1].text.slice(0, 200)}...`)
                    .join("\n\n");

                const aiResponse = await getAICheckerResponse(
                    prompt,
                    activeProject.source,
                    selectedDoc.category,
                    filesToProvide,
                    [], // No history for initial analysis
                    aggregatedCsv || undefined,
                    projectInfo,
                    crossDocContext
                );

                addDocMessage(docId, "ai", aiResponse);

                // Extract Todo items if found
                extractAndSetTodos(docId, aiResponse);

            } catch (err) {
                addDocMessage(docId, "ai", "解析の準備中にエラーが発生しました。");
            } finally {
                setIsTyping(false);
            }
        };

        runInitialAnalysis();
    }, [selectedDocId, activeProject]);

    const extractAndSetTodos = (docId: string, text: string) => {
        if (text.includes("[ACTION]")) {
            const lines = text.split('\n');
            const tasks = lines.filter(l => l.includes("[ACTION]"));
            if (tasks.length > 0) {
                const todoTexts = tasks.map(t => t.replace(/.*\[ACTION\]\s?/, '').trim());
                setDocTodos(docId, todoTexts);
            }
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            // Excel is now supported via CSV conversion in ProjectContext
            setAttachedFiles(prev => [...prev, ...files]);
        }
    };

    const removeFile = (index: number) => {
        setAttachedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleReupload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && selectedDoc && activeProject) {
            const file = e.target.files[0];
            uploadDocument(selectedDoc.id, file);

            const autoMsg = `書類「${file.name}」を修正したので再度確認をお願いします。`;
            setInputText("");
            setAttachedFiles([]);

            addDocMessage(selectedDoc.id, "user", autoMsg);
            setIsTyping(true);

            try {
                // If it's Excel, convert to PDF for Gemini, otherwise use raw
                let aiFiles: AIFile[] = [];
                if (isExcelFile(file)) {
                    const pdfData = await excelToPdfBase64(await file.arrayBuffer());
                    if (pdfData) {
                        aiFiles.push({ data: pdfData, mimeType: "application/pdf" });
                    } else {
                        // Fallback to raw if PDF fails (though it might error in Gemini)
                        aiFiles.push({ data: await fileToBase64(file), mimeType: getExcelMimeType(file) });
                    }
                } else {
                    aiFiles.push({ data: await fileToBase64(file), mimeType: file.type });
                }

                // Include already uploaded files in analysis
                for (const fItem of selectedDoc.files) {
                    if (fItem.base64Data) {
                        aiFiles.push({ data: fItem.base64Data, mimeType: fItem.mimeType || "application/pdf" });
                    }
                }

                // Aggregate CSV content from existing files + newly added excel file
                let aggregatedCsv = selectedDoc.files
                    .filter(f => f.csvContent)
                    .map(f => `--- 書類: ${f.name} ---\n${f.csvContent}`)
                    .join("\n\n");

                if (isExcelFile(file)) {
                    const newCsv = await excelToCsv(await file.arrayBuffer());
                    if (newCsv) {
                        aggregatedCsv = (aggregatedCsv ? aggregatedCsv + "\n\n" : "") + `--- 書類: ${file.name} (新規アップロード) ---\n${newCsv}`;
                    }
                }

                // Prepare project and cross-doc context
                const projectInfo = {
                    name: activeProject.name,
                    amount: activeProject.amount,
                    jfcLoanProgram: activeProject.jfcLoanProgramId ? JFC_LOAN_PROGRAMS.find((p: JFCLoanProgram) => p.id === activeProject.jfcLoanProgramId)?.name : undefined
                };

                const crossDocContext = activeProject.documents
                    .filter(d => d.id !== selectedDoc.id && d.messages && d.messages.length > 0)
                    .map(d => `--- ${d.category} ---\n${d.messages[d.messages.length - 1].text.slice(0, 200)}...`)
                    .join("\n\n");

                const expertKnowledge = await getFormattedKnowledge({
                    institution: activeProject.source,
                    documentId: selectedDoc.id
                });

                const response = await getAICheckerResponse(
                    autoMsg,
                    activeProject.source,
                    selectedDoc.category,
                    aiFiles,
                    selectedDoc.messages,
                    aggregatedCsv || undefined,
                    projectInfo,
                    crossDocContext,
                    expertKnowledge
                );
                addDocMessage(selectedDoc.id, "ai", response);
                extractAndSetTodos(selectedDoc.id, response);
            } catch (err) {
                addDocMessage(selectedDoc.id, "ai", "再解析中にエラーが発生しました。");
            } finally {
                setIsTyping(false);
            }
        }
    };

    const handleSend = async () => {
        if ((!inputText.trim() && attachedFiles.length === 0) || isTyping || !activeProject || !selectedDoc) return;

        const fileNames = attachedFiles.map(f => `「${f.name}」`).join(", ");
        const userMsg = inputText.trim()
            ? (attachedFiles.length > 0 ? `${inputText}\n(添付: ${fileNames})` : inputText)
            : (attachedFiles.length > 0 ? `${fileNames} を解析してください。` : "");

        const filesToUpload = attachedFiles;
        const docId = selectedDoc.id;

        setInputText("");
        setAttachedFiles([]);

        addDocMessage(docId, "user", userMsg);

        setIsTyping(true);

        try {
            // 1. Chat attachments - convert Excel to PDF on the fly
            let aiFiles: AIFile[] = await Promise.all(
                filesToUpload.map(async (f) => {
                    if (isExcelFile(f)) {
                        const pdfData = await excelToPdfBase64(await f.arrayBuffer());
                        if (pdfData) return { data: pdfData, mimeType: "application/pdf" };
                        return { data: await fileToBase64(f), mimeType: getExcelMimeType(f) };
                    }
                    return { data: await fileToBase64(f), mimeType: f.type };
                })
            );

            // SPECIAL LOGIC: Check for "はい" and pending update
            const lastAiMsg = selectedDoc.messages && selectedDoc.messages[selectedDoc.messages.length - 1];
            if (inputText.trim() === "はい" && lastAiMsg && lastAiMsg.role === "ai" && lastAiMsg.text.includes("[SUGGEST_UPDATE:")) {
                const match = lastAiMsg.text.match(/\[SUGGEST_UPDATE:\s*(\w+)\]/);
                if (match && match[1] && filesToUpload.length > 0) {
                    const targetDocId = match[1];
                    uploadDocument(targetDocId, filesToUpload[0]);
                    addDocMessage(docId, "ai", `${activeProject.documents.find(d => d.id === targetDocId)?.category} を更新しました。`);
                    setIsTyping(false);
                    return;
                }
            }

            // 2. If no files attached to chat but document is uploaded, provide context from ALL files
            if (aiFiles.length === 0 && selectedDoc) {
                selectedDoc.files.forEach(f => {
                    if (f.base64Data) {
                        aiFiles.push({
                            data: f.base64Data,
                            mimeType: f.mimeType || "application/pdf"
                        });
                    }
                });
            }

            // Aggregate CSV content from existing files + newly attached Excel files
            let aggregatedCsv = selectedDoc?.files
                .filter(f => f.csvContent)
                .map(f => `--- 書類: ${f.name} ---\n${f.csvContent}`)
                .join("\n\n");

            for (const f of filesToUpload) {
                if (isExcelFile(f)) {
                    const newCsv = await excelToCsv(await f.arrayBuffer());
                    if (newCsv) {
                        aggregatedCsv = (aggregatedCsv ? aggregatedCsv + "\n\n" : "") + `--- 書類: ${f.name} (添付) ---\n${newCsv}`;
                    }
                }
            }

            // Prepare project and cross-doc context
            const projectInfo = {
                name: activeProject.name,
                amount: activeProject.amount,
                jfcLoanProgram: activeProject.jfcLoanProgramId ? JFC_LOAN_PROGRAMS.find((p: JFCLoanProgram) => p.id === activeProject.jfcLoanProgramId)?.name : undefined
            };

            const crossDocContext = activeProject.documents
                .filter(d => d.id !== selectedDoc.id && d.messages && d.messages.length > 0)
                .map(d => `--- ${d.category} ---\n${d.messages[d.messages.length - 1].text.slice(0, 200)}...`)
                .join("\n\n");

            const expertKnowledge = await getFormattedKnowledge({
                institution: activeProject.source,
                documentId: selectedDoc?.id
            });

            const response = await getAICheckerResponse(
                userMsg,
                activeProject.source,
                selectedDoc?.category || "不明な書類",
                aiFiles,
                selectedDoc?.messages || [],
                aggregatedCsv || undefined,
                projectInfo,
                crossDocContext,
                expertKnowledge
            );

            addDocMessage(docId, "ai", response);
            extractAndSetTodos(docId, response);

        } catch (err) {
            addDocMessage(docId, "ai", "エラーが発生しました。");
        } finally {
            setIsTyping(false);
        }
    };

    const toggleVoice = () => {
        if (isListening) return;
        setIsListening(true);
        startVoiceRecognition(
            (text) => setInputText(prev => (prev ? prev + " " + text : text)),
            () => setIsListening(false)
        );
    };

    if (!activeProject || !selectedDoc) return <AppLayout>Loading...</AppLayout>;

    return (
        <AppLayout>
            <div className="flex h-[calc(100vh-120px)] gap-6 relative">
                {/* Left Sidebar */}
                <aside className="w-64 flex flex-col gap-6">
                    <div className="blueprint-card flex-1 overflow-auto p-4 flex flex-col">
                        <div className="blueprint-label mb-4 px-2">Essential</div>
                        <div className="space-y-1 mb-6">
                            {activeProject.documents.filter(i => i.type === "required").map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setSelectedDocId(item.id)}
                                    className={clsx(
                                        "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-left border",
                                        selectedDocId === item.id ? "bg-accent-surface border-line shadow-sm" : "border-transparent hover:bg-accent-surface/50"
                                    )}
                                >
                                    <div className="scale-75 origin-left">{STATUS_CONFIG[item.status].icon}</div>
                                    <div className="flex-1 overflow-hidden">
                                        <div className="text-[10px] font-bold truncate">{item.name && item.name !== "-" ? item.name : item.category}</div>
                                        <div className={clsx("text-[8px] font-bold uppercase", STATUS_CONFIG[item.status].text)}>
                                            {STATUS_CONFIG[item.status].label}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>

                        <div className="blueprint-label mb-4 px-2">Reference</div>
                        <div className="space-y-1">
                            {activeProject.documents.filter(i => i.type === "reference").map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setSelectedDocId(item.id)}
                                    className={clsx(
                                        "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-left border",
                                        selectedDocId === item.id ? "bg-accent-surface border-line shadow-sm" : "border-transparent hover:bg-accent-surface/50"
                                    )}
                                >
                                    <div className="scale-75 origin-left">{STATUS_CONFIG[item.status].icon}</div>
                                    <div className="flex-1 overflow-hidden">
                                        <div className="text-[10px] font-bold truncate">{item.name && item.name !== "-" ? item.name : item.category}</div>
                                        <div className={clsx("text-[8px] font-bold uppercase", STATUS_CONFIG[item.status].text)}>
                                            {STATUS_CONFIG[item.status].label}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </aside>

                {/* Main Pane */}
                <main className="flex-1 flex gap-6 overflow-hidden">
                    <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                        <div className={clsx("blueprint-card px-6 py-4 border-l-4 transition-all duration-500", STATUS_CONFIG[selectedDoc.status].border.replace('border-', 'border-l-'))}>
                            <div className="flex justify-between items-center gap-6">
                                <div className="flex items-center gap-6 flex-1 min-w-0">
                                    <div className="flex-shrink-0">
                                        <div className="blueprint-label mb-0.5">Checking Target</div>
                                        <h2 className="text-lg font-bold truncate max-w-[200px]">{selectedDoc.category}</h2>
                                    </div>

                                    <div className="h-8 w-px bg-line flex-shrink-0" />

                                    <div className="flex flex-col">
                                        <div className="blueprint-label mb-0.5">Status & Info</div>
                                        <div className="text-[11px] font-bold flex items-center gap-2">
                                            <span className={STATUS_CONFIG[selectedDoc.status].text}>{STATUS_CONFIG[selectedDoc.status].label}</span>
                                            <span className="text-line">|</span>
                                            <span className="text-muted truncate">{selectedDoc.name || "未提出"}</span>
                                        </div>
                                    </div>

                                    <div className="h-8 w-px bg-line flex-shrink-0" />

                                    {/* JFC Format Download Links (Inline) */}
                                    {activeProject.source === JFC_SOURCE_NAME && JFC_DOC_TEMPLATES[selectedDoc.id] && (
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <div className="blueprint-label mr-1 whitespace-nowrap">Template:</div>
                                            {JFC_DOC_TEMPLATES[selectedDoc.id].downloadUrl && (
                                                <a
                                                    href={JFC_DOC_TEMPLATES[selectedDoc.id].downloadUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1.5 px-2 py-1 bg-white border border-line rounded text-[9px] font-bold hover:border-ink transition-colors whitespace-nowrap"
                                                >
                                                    <Download size={10} className="text-red-600" />
                                                    {JFC_DOC_TEMPLATES[selectedDoc.id].downloadUrl?.toLowerCase().endsWith('.zip') ? 'ZIP' : 'PDF'}
                                                </a>
                                            )}
                                            {JFC_DOC_TEMPLATES[selectedDoc.id].excelUrl && (
                                                <a
                                                    href={JFC_DOC_TEMPLATES[selectedDoc.id].excelUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1.5 px-2 py-1 bg-white border border-line rounded text-[9px] font-bold hover:border-ink transition-colors whitespace-nowrap"
                                                >
                                                    <Download size={10} className="text-emerald-700" />
                                                    {JFC_DOC_TEMPLATES[selectedDoc.id].excelUrl?.toLowerCase().endsWith('.xls') || JFC_DOC_TEMPLATES[selectedDoc.id].excelUrl?.toLowerCase().endsWith('.xlsx') ? 'EXCEL' : '所定'}
                                                </a>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-2 flex-shrink-0">
                                    <button className="blueprint-btn-outline p-1.5"><Eye size={14} /></button>
                                    <button className="blueprint-btn-outline p-1.5"><Download size={14} /></button>
                                </div>
                            </div>
                        </div>

                        <div className="blueprint-card flex-1 flex flex-col overflow-hidden bg-white/50 backdrop-blur-sm relative">
                            <div className="p-4 border-b border-line flex items-center justify-between bg-accent-surface">
                                <div className="flex items-center gap-2">
                                    <div className={clsx("w-2 h-2 rounded-full", isTyping ? "bg-amber-500 animate-pulse" : "bg-emerald-500")} />
                                    <span className="blueprint-label">AI RAG Advisor - {selectedDoc.category}</span>
                                </div>
                            </div>

                            <div className="flex-1 overflow-auto p-6 space-y-6 scrollbar-thin">
                                {(selectedDoc?.messages || []).map((msg: { role: string; text: string }, idx: number) => (
                                    <div key={idx} className={clsx("flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300", msg.role === "user" ? "flex-row-reverse" : "")}>
                                        <div className={clsx(
                                            "w-10 h-10 rounded-full border-2 border-line flex items-center justify-center flex-shrink-0 text-[9px] font-black shadow-sm",
                                            msg.role === "ai" ? "bg-ink text-surface border-ink" : "bg-white text-ink"
                                        )}>
                                            {msg.role === "ai" ? "BANK" : "YOU"}
                                        </div>
                                        <div className={clsx(
                                            "max-w-[85%] px-6 py-5 rounded-2xl text-[16px] leading-relaxed transition-all shadow-sm",
                                            msg.role === "ai" ? "bg-accent-surface border-2 border-line/50 text-ink" : "bg-ink text-surface shadow-md"
                                        )}>
                                            <FormattedText text={msg.text} />
                                        </div>
                                    </div>
                                ))}
                                {isTyping && (
                                    <div className="flex gap-4">
                                        <div className="w-8 h-8 rounded-full bg-ink text-surface flex items-center justify-center text-[10px] font-bold">AI</div>
                                        <div className="bg-accent-surface border border-line p-4 rounded-2xl flex gap-1 items-center">
                                            <div className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce" />
                                            <div className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce [animation-delay:0.2s]" />
                                            <div className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce [animation-delay:0.4s]" />
                                        </div>
                                    </div>
                                )}
                                <div ref={chatEndRef} />
                            </div>

                            <div className="p-4 border-t border-line bg-surface">
                                {attachedFiles.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {attachedFiles.map((file, i) => (
                                            <div key={i} className="flex items-center gap-2 px-2 py-1 bg-accent-surface border border-line rounded text-[10px] font-bold">
                                                <FileText size={12} />
                                                <span className="truncate max-w-[100px]">{file.name}</span>
                                                <button onClick={() => removeFile(i)} className="text-muted hover:text-ink">
                                                    <CloseIcon size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="relative flex gap-2">
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-12 h-12 border border-line rounded-xl flex items-center justify-center hover:bg-accent-surface transition-colors text-muted hover:text-ink"
                                    >
                                        <Paperclip size={18} />
                                    </button>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        multiple
                                        className="hidden"
                                        accept=".pdf,image/*,.xlsx,.xls"
                                    />
                                    <div className="relative flex-1">
                                        <textarea
                                            value={inputText}
                                            onChange={e => setInputText(e.target.value)}
                                            placeholder="AIに質問・相談する..."
                                            className="w-full bg-accent-surface border border-line rounded-xl p-4 text-base focus:outline-none focus:border-ink transition-all resize-none h-24 pr-24"
                                        ></textarea>
                                        <button
                                            onClick={toggleVoice}
                                            className={clsx(
                                                "absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md transition-all",
                                                isListening ? "bg-red-500 text-white animate-pulse" : "text-muted hover:text-ink"
                                            )}
                                        >
                                            <Mic size={16} />
                                        </button>
                                    </div>
                                    <button
                                        onClick={handleSend}
                                        disabled={isTyping || (!inputText.trim() && attachedFiles.length === 0)}
                                        className="w-12 h-12 bg-ink text-surface rounded-xl flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg"
                                    >
                                        <Send size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>

                {/* Floating ToDo Toggle Button */}
                <button
                    onClick={() => setIsTodoOpen(!isTodoOpen)}
                    className={clsx(
                        "fixed bottom-8 right-8 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all z-50 border-4 border-surface",
                        isTodoOpen ? "bg-surface text-ink scale-90" : "bg-ink text-surface hover:scale-110"
                    )}
                >
                    {isTodoOpen ? <CloseIcon size={24} /> : <ListChecks size={24} />}
                </button>

                {/* Floating ToDo Pane */}
                <div className={clsx(
                    "fixed bottom-24 right-8 w-80 bg-ink text-surface rounded-3xl shadow-2xl transition-all duration-300 transform origin-bottom-right z-40 overflow-hidden border border-line",
                    isTodoOpen ? "scale-100 opacity-100 translate-y-0" : "scale-50 opacity-0 translate-y-10 pointer-events-none"
                )}>
                    <div className="p-5 border-b border-surface/10 flex items-center justify-between bg-surface/5">
                        <div className="flex items-center gap-2">
                            <ListChecks size={18} className="text-emerald-400" />
                            <span className="text-[11px] font-bold uppercase tracking-widest italic">Action Items</span>
                        </div>
                        <div className="text-[10px] font-bold text-surface/50">
                            {(selectedDoc.todoItems || []).filter(t => t.completed).length} / {(selectedDoc.todoItems || []).length}
                        </div>
                    </div>

                    <div className="p-5 max-h-[400px] overflow-auto scrollbar-thin scrollbar-white">
                        {(!selectedDoc.todoItems || selectedDoc.todoItems.length === 0) ? (
                            <div className="py-8 text-center text-surface/40 flex flex-col items-center gap-3">
                                <ListChecks size={32} strokeWidth={1} />
                                <span className="text-[10px] font-medium leading-relaxed">
                                    改善事項はまだありません。
                                    <br />書類をアップロードして解析を開始してください。
                                </span>
                            </div>
                        ) : (
                            <ul className="space-y-3">
                                {(selectedDoc.todoItems || []).map((todo) => (
                                    <li key={todo.id} className="flex items-start gap-3 group">
                                        <button
                                            onClick={() => updateDocTodo(selectedDoc.id, todo.id, !todo.completed)}
                                            className={clsx(
                                                "mt-0.5 w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all",
                                                todo.completed ? "bg-emerald-500 border-emerald-500" : "border-surface/30 group-hover:border-surface/60"
                                            )}
                                        >
                                            {todo.completed && <CheckCircle size={12} className="text-ink" />}
                                        </button>
                                        <span className={clsx(
                                            "text-[11px] leading-relaxed transition-all",
                                            todo.completed ? "text-surface/40 line-through" : "text-surface/90"
                                        )}>
                                            {todo.text}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="p-4 bg-surface/5 border-t border-surface/10">
                        <input
                            type="file"
                            id="reupload-input"
                            className="hidden"
                            accept=".pdf,image/*,.xlsx,.xls"
                            onChange={handleReupload}
                        />
                        <button
                            className="w-full bg-surface text-ink py-2.5 rounded-xl text-[10px] font-bold hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2"
                            onClick={() => document.getElementById('reupload-input')?.click()}
                        >
                            <Paperclip size={14} /> 修正した書類を再アップロード
                        </button>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

