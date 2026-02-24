"use client";

import AppLayout from "@/components/AppLayout";
import { PlayCircle, MessageSquare, Award, CheckCircle2, AlertCircle, ChevronRight, LogOut, Mic, Calendar, History, Send, Layers, Paperclip, FileText, X as CloseIcon } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useProject, Document, DocumentFile } from "@/context/ProjectContext";
import { getAISimulatorResponse, startVoiceRecognition, fileToBase64, AIFile } from "@/lib/ai";
import { clsx } from "clsx";
import { Volume2, VolumeX } from "lucide-react";

type Step = "setup" | "interview" | "result" | "history";
type Focus = "通常" | "資金使途・返済計画" | "事業計画" | "経歴等信用確認" | "細かい質問";

const FOCUS_OPTIONS: Focus[] = ["通常", "資金使途・返済計画", "事業計画", "経歴等信用確認", "細かい質問"];

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

export default function SimulatorPage() {
    const { activeProject, saveSimulatorSession, deleteSimulatorSession } = useProject();
    const [step, setStep] = useState<Step>("setup");
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [selectedFocus, setSelectedFocus] = useState<Focus>("通常");
    const [messages, setMessages] = useState<{ role: "user" | "ai", text: string }[]>([]);
    const [inputText, setInputText] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
    const [isSpeaking, setIsSpeaking] = useState<number | null>(null);
    const [progress, setProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (step === "interview") {
            chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, step]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setAttachedFiles(prev => [...prev, ...files]);
        }
    };

    const removeFile = (index: number) => {
        setAttachedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const startSession = async () => {
        const sessionId = Date.now().toString();
        setCurrentSessionId(sessionId);
        setStep("interview");
        setIsTyping(true);

        // Gather all already uploaded files for context
        const contextFiles: AIFile[] = [];
        activeProject?.documents.forEach(doc => {
            doc.files.forEach(f => {
                if (f.base64Data) {
                    contextFiles.push({ data: f.base64Data, mimeType: f.mimeType || "application/pdf" });
                }
            });
        });

        const initialText = await getAISimulatorResponse("__START__", selectedFocus, activeProject?.source || "不明な融資元", activeProject?.documents || [], contextFiles);

        // Parse progress if any
        const progMatch = initialText.match(/\[PROGRESS:\s?(\d+)\]/);
        if (progMatch) setProgress(parseInt(progMatch[1]));

        const cleanInitialText = initialText.replace(/\[PROGRESS:\s?\d+\]/g, "").replace(/\[FINISH\]/g, "").trim();
        const initialMessages: { role: "user" | "ai", text: string }[] = [{ role: "ai", text: cleanInitialText }];
        setMessages(initialMessages);
        setIsTyping(false);

        saveSimulatorSession({
            id: sessionId,
            date: new Date().toLocaleDateString(),
            focus: selectedFocus,
            messages: initialMessages,
            status: "ongoing"
        });
    };

    const suspendSession = () => {
        if (currentSessionId) {
            saveSimulatorSession({
                id: currentSessionId,
                date: new Date().toLocaleDateString(),
                focus: selectedFocus,
                messages,
                status: "ongoing"
            });
        }
        setStep("setup");
        setCurrentSessionId(null);
        setMessages([]);
    };

    const resumeSession = (session: any) => {
        setCurrentSessionId(session.id);
        setMessages(session.messages);
        setSelectedFocus(session.focus);
        setStep("interview");
    };

    const handleSend = async () => {
        if ((!inputText.trim() && attachedFiles.length === 0) || isTyping || !currentSessionId) return;

        const userMsg = inputText;
        const filesToUpload = attachedFiles;

        setInputText("");
        setAttachedFiles([]);
        const updatedMessages: { role: "user" | "ai", text: string }[] = [
            ...messages,
            { role: "user", text: userMsg || (filesToUpload.length > 0 ? "資料に基づき審査を進めてください。" : "") }
        ];
        setMessages(updatedMessages);
        setIsTyping(true);

        try {
            const aiFiles: AIFile[] = await Promise.all(
                filesToUpload.map(async (f) => ({
                    data: await fileToBase64(f),
                    mimeType: f.type,
                }))
            );

            // 2. Include already uploaded files as context if no new files attached
            if (aiFiles.length === 0 && activeProject) {
                activeProject.documents.forEach(doc => {
                    doc.files.forEach(f => {
                        if (f.base64Data) {
                            aiFiles.push({ data: f.base64Data, mimeType: f.mimeType || "application/pdf" });
                        }
                    });
                });
            }

            const response = await getAISimulatorResponse(
                userMsg || "現在の資料で不明点があれば質問してください。",
                selectedFocus,
                activeProject?.source || "不明な融資元",
                activeProject?.documents || [],
                aiFiles,
                messages // Pass history
            );

            // Handle Tags
            const isFinish = response.includes("[FINISH]");
            const progMatch = response.match(/\[PROGRESS:\s?(\d+)\]/);
            if (progMatch) setProgress(parseInt(progMatch[1]));

            const cleanResponse = response.replace(/\[PROGRESS:\s?\d+\]/g, "").replace(/\[FINISH\]/g, "").trim();
            const finalMessages: { role: "user" | "ai", text: string }[] = [...updatedMessages, { role: "ai", text: cleanResponse }];
            setMessages(finalMessages);

            if (isFinish) {
                // Auto-finish
                finishSession();
                return;
            }

            saveSimulatorSession({
                id: currentSessionId,
                date: new Date().toLocaleDateString(),
                focus: selectedFocus,
                messages: finalMessages,
                status: "ongoing"
            });
        } catch (err) {
            setMessages(prev => [...prev, { role: "ai", text: "エラーが発生しました。通信環境やファイルの形式を確認してください。" }]);
        } finally {
            setIsTyping(false);
        }
    };

    const toggleVoice = () => {
        if (isListening) return;
        setIsListening(true);
        startVoiceRecognition((text) => setInputText(text), () => setIsListening(false));
    };

    const speakText = (text: string, idx: number) => {
        if (typeof window === 'undefined' || !window.speechSynthesis) return;

        if (isSpeaking === idx) {
            window.speechSynthesis.cancel();
            setIsSpeaking(null);
            return;
        }

        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ja-JP';
        utterance.onend = () => setIsSpeaking(null);
        setIsSpeaking(idx);
        window.speechSynthesis.speak(utterance);
    };

    const finishSession = () => {
        if (!activeProject || !currentSessionId) return;

        // Extract grade from last AI message if possible
        const lastAiMsg = [...messages].reverse().find(m => m.role === "ai")?.text || "";
        const gradeMatch = lastAiMsg.match(/【最終評価:\s?([A-D])】/i);
        const finalGrade = gradeMatch ? gradeMatch[1].toUpperCase() : "B";

        saveSimulatorSession({
            id: currentSessionId,
            date: new Date().toLocaleDateString(),
            focus: selectedFocus,
            messages,
            status: "completed",
            score: finalGrade,
            summary: lastAiMsg
        });

        setStep("result");
    };

    if (!activeProject) return <AppLayout>Loading...</AppLayout>;

    const renderSetup = () => (
        <div className="max-w-4xl mx-auto py-8">
            <div className="flex flex-col md:flex-row gap-12 items-start">
                <div className="flex-1 space-y-8">
                    <div>
                        <div className="blueprint-label mb-2">Step 03</div>
                        <h2 className="text-3xl font-bold mb-4">審査シミュレーション</h2>
                        <p className="text-muted text-sm leading-relaxed">
                            提出書類に基づき、{activeProject.source}の担当者が想定する核心的な質問を行います。
                            回答を重ねることで、審査通過の確率を高めましょう。
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="blueprint-label">Select Simulation Focus</div>
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                            {FOCUS_OPTIONS.map(f => (
                                <button
                                    key={f}
                                    onClick={() => setSelectedFocus(f)}
                                    className={clsx(
                                        "px-4 py-3 rounded-xl border text-[11px] font-bold transition-all text-left",
                                        selectedFocus === f ? "bg-ink text-surface border-ink shadow-lg" : "bg-surface border-line hover:border-ink"
                                    )}
                                >
                                    <Layers size={14} className="mb-2" />
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button onClick={startSession} className="blueprint-btn-primary px-12 py-3 flex items-center gap-2">
                            <PlayCircle size={18} /> 新しい面談を開始
                        </button>
                        <button onClick={() => setStep("history")} className="blueprint-btn-outline px-8 py-3 flex items-center gap-2">
                            <History size={16} /> 履歴
                        </button>
                    </div>

                    {/* Ongoing Sessions section */}
                    {activeProject.simulatorSessions.filter(s => s.status === "ongoing").length > 0 && (
                        <div className="pt-8">
                            <div className="blueprint-label mb-4">中断したセッション</div>
                            <div className="space-y-3">
                                {activeProject.simulatorSessions.filter(s => s.status === "ongoing").map(s => (
                                    <div key={s.id} className="blueprint-card p-4 flex items-center justify-between hover:border-ink transition-colors group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-accent-surface flex items-center justify-center text-muted">
                                                <MessageSquare size={18} />
                                            </div>
                                            <div>
                                                <div className="font-bold text-sm">{s.focus} 面談</div>
                                                <div className="text-[10px] text-muted flex items-center gap-1 mt-0.5">
                                                    <Calendar size={10} /> {s.date}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => resumeSession(s)} className="blueprint-btn-primary text-[10px] px-4 py-1.5">再開する</button>
                                            <button onClick={() => deleteSimulatorSession(s.id)} className="p-2 text-muted hover:text-red-500 transition-colors">
                                                <CloseIcon size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <aside className="w-full md:w-72 space-y-6">
                    <div className="blueprint-card p-6 bg-accent-surface border-line">
                        <div className="blueprint-label mb-4">Preparation Status</div>
                        <div className="space-y-4">
                            <div>
                                <div className="text-[10px] text-muted mb-1 uppercase font-bold tracking-tighter">Verified Docs</div>
                                <div className="text-lg font-bold">{activeProject.documents.filter(d => d.status === 'ok').length} / {activeProject.documents.length}</div>
                            </div>
                            <div className="h-1.5 w-full bg-line rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-ink"
                                    style={{ width: `${(activeProject.documents.filter(d => d.status === 'ok').length / activeProject.documents.length) * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );

    const renderInterview = () => (
        <div className="flex h-[calc(100vh-180px)] gap-6">
            <div className="flex-1 blueprint-card overflow-hidden flex flex-col bg-white">
                <div className="p-4 border-b border-line bg-accent-surface flex items-center justify-between">
                    <div className="flex items-center gap-6 flex-1">
                        <div className="flex items-center gap-3 shrink-0">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="font-bold text-xs uppercase tracking-widest px-2 py-0.5 bg-ink text-surface rounded">Focus: {selectedFocus}</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="flex-1 max-w-md flex items-center gap-4">
                            <div className="flex-1 h-2 bg-line/30 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-emerald-500 transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <span className="text-[10px] font-black text-ink w-8">{progress}%</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button onClick={suspendSession} className="text-[10px] font-bold text-muted hover:text-ink flex items-center gap-1 group">
                            一時中断して戻る
                        </button>
                        <div className="h-4 w-px bg-line" />
                        <button onClick={finishSession} className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 group">
                            面談を完了して採点へ <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-auto p-8 space-y-8 scrollbar-thin">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={clsx("flex gap-6 animate-in fade-in slide-in-from-bottom-2", msg.role === "user" ? "flex-row-reverse" : "")}>
                            <div className={clsx(
                                "w-12 h-12 rounded-full border-2 border-line flex items-center justify-center flex-shrink-0 text-[10px] font-black tracking-tighter shadow-sm overflow-hidden",
                                msg.role === "ai" ? "bg-ink text-surface border-ink" : "bg-white text-ink"
                            )}>
                                {msg.role === "ai" ? (
                                    <div className="flex flex-col items-center scale-90">
                                        <div className="text-[15px] leading-none mb-1">BANK</div>
                                        <div className="h-0.5 w-full bg-surface/40" />
                                    </div>
                                ) : "YOU"}
                            </div>
                            <div className={clsx(
                                "max-w-[75%] px-8 py-6 rounded-3xl text-[17px] leading-relaxed shadow-sm relative group transition-all",
                                msg.role === "ai" ? "bg-accent-surface border-2 border-line/50 text-ink" : "bg-ink text-surface shadow-xl"
                            )}>
                                <FormattedText text={msg.text} />
                                {msg.role === "ai" && (
                                    <button
                                        onClick={() => speakText(msg.text, idx)}
                                        className="absolute -right-14 top-2 p-3 rounded-xl hover:bg-accent-surface transition-all text-muted hover:text-ink"
                                    >
                                        {isSpeaking === idx ? <VolumeX size={20} /> : <Volume2 size={20} />}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="flex gap-6">
                            <div className="w-10 h-10 rounded-full bg-ink text-surface flex items-center justify-center text-xs font-bold">BANK</div>
                            <div className="bg-accent-surface border border-line p-6 rounded-2xl flex gap-1.5 items-center">
                                <div className="w-2 h-2 bg-muted rounded-full animate-bounce" />
                                <div className="w-2 h-2 bg-muted rounded-full animate-bounce [animation-delay:0.2s]" />
                                <div className="w-2 h-2 bg-muted rounded-full animate-bounce [animation-delay:0.4s]" />
                            </div>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>

                <div className="p-6 border-t border-line bg-surface">
                    {attachedFiles.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                            {attachedFiles.map((file, i) => (
                                <div key={i} className="flex items-center gap-2 px-2 py-1 bg-accent-surface border border-line rounded text-[10px] font-bold">
                                    <FileText size={12} />
                                    <span className="truncate max-w-[150px]">{file.name}</span>
                                    <button onClick={() => removeFile(i)} className="text-muted hover:text-ink">
                                        <CloseIcon size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="flex gap-4">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-12 h-24 border border-line rounded-xl flex items-center justify-center hover:bg-accent-surface transition-colors text-muted hover:text-ink"
                        >
                            <Paperclip size={20} />
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            multiple
                            className="hidden"
                            accept=".pdf,image/*"
                        />
                        <div className="flex-1 relative">
                            <textarea
                                value={inputText}
                                onChange={e => setInputText(e.target.value)}
                                placeholder="回答を詳しく入力してください..."
                                className="w-full bg-accent-surface border border-line rounded-xl p-4 text-base focus:outline-none focus:border-ink transition-colors resize-none h-24 pr-12"
                            />
                            <button
                                onClick={toggleVoice}
                                className={clsx(
                                    "absolute right-4 bottom-4 p-2 rounded-lg transition-all",
                                    isListening ? "bg-red-500 text-white animate-pulse" : "text-muted hover:text-ink"
                                )}
                            >
                                <Mic size={18} />
                            </button>
                        </div>
                        <button
                            onClick={handleSend}
                            disabled={isTyping || (!inputText.trim() && attachedFiles.length === 0)}
                            className="w-24 bg-ink text-surface rounded-xl font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                            送信
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );

    const renderHistory = () => (
        <div className="max-w-4xl mx-auto py-8">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                    <History size={24} /> 過去のシミュレーション履歴
                </h2>
                <button onClick={() => setStep("setup")} className="blueprint-btn-outline">戻る</button>
            </div>

            <div className="space-y-4">
                {activeProject.simulatorSessions.filter(s => s.status === "completed").length === 0 ? (
                    <div className="blueprint-card p-12 text-center text-muted">履歴がありません</div>
                ) : (
                    activeProject.simulatorSessions.filter(s => s.status === "completed").map(s => (
                        <div key={s.id} className="blueprint-card p-6 flex items-center justify-between hover:border-ink transition-colors">
                            <div className="flex items-center gap-6">
                                <div className="w-12 h-12 rounded-full bg-ink text-surface flex items-center justify-center font-black text-xl shadow-lg">
                                    {s.score}
                                </div>
                                <div>
                                    <div className="font-bold text-sm">{s.focus} 面談</div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Calendar size={12} className="text-muted" />
                                        <span className="text-[10px] text-muted">{s.date}</span>
                                    </div>
                                </div>
                            </div>
                            <button className="blueprint-btn-outline text-[10px] px-6 py-2">詳細レポートを表示</button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );

    const renderResult = () => (
        <div className="max-w-4xl mx-auto py-8 space-y-12">
            <div className="text-center">
                <div className="blueprint-label mb-6">Simulation Result</div>
                <div className="inline-flex items-center justify-center w-36 h-36 rounded-full bg-ink text-surface text-6xl font-black mb-8 shadow-2xl animate-in zoom-in duration-500">
                    {activeProject.simulatorSessions
                        .filter(s => s.status === "completed")
                        .sort((a, b) => Number(b.id) - Number(a.id))[0]?.score || "B"}
                </div>
                <h2 className="text-3xl font-bold mb-4">極めて良好な回答内容です</h2>
                <p className="text-muted max-w-lg mx-auto leading-relaxed">
                    {selectedFocus}に焦点を絞った対話の結果、現在の準備状況であれば{activeProject.source}の審査においても説得力のある対応が可能です。
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="blueprint-card p-8 bg-emerald-50/20 border-emerald-200">
                    <div className="flex items-center gap-3 mb-6">
                        <Award size={24} className="text-emerald-700" />
                        <h3 className="text-lg font-bold text-emerald-700">良かったポイント</h3>
                    </div>
                    <ul className="space-y-4">
                        {[
                            "資金使途の明確性が高く、見積書との整合性が完璧です",
                            "事業計画における強み（特許技術）の活用法が具体的でした",
                            "リスク管理体制における代表者の責任範囲が明確化されています"
                        ].map((p, i) => (
                            <li key={i} className="flex gap-4 text-xs leading-relaxed text-emerald-800">
                                <span className="font-black opacity-20 text-xl">0{i + 1}</span>
                                {p}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="blueprint-card p-8 bg-amber-50/20 border-amber-200">
                    <div className="flex items-center gap-3 mb-6">
                        <AlertCircle size={24} className="text-amber-700" />
                        <h3 className="text-lg font-bold text-amber-700">改善ポイント</h3>
                    </div>
                    <ul className="space-y-4">
                        {[
                            "競合他社の参入障壁について、より詳細な分析を求められる可能性があります",
                            "原材料高騰への対策について、具体的な価格転嫁スキームを準備してください",
                            "代表者不在時の代替決済権限について補足しておくと安心です"
                        ].map((p, i) => (
                            <li key={i} className="flex gap-4 text-xs leading-relaxed text-amber-800">
                                <span className="font-black opacity-20 text-xl text-amber-700">0{i + 1}</span>
                                {p}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className="flex justify-center gap-4 pt-10">
                <button onClick={() => setStep("setup")} className="blueprint-btn-primary px-16 py-4">シミュレーションを終了</button>
                <button className="blueprint-btn-outline px-10 py-4">詳細FBをPDFで保存</button>
            </div>
        </div>
    );

    return (
        <AppLayout>
            <div className="animate-in fade-in duration-500">
                {step === "setup" && renderSetup()}
                {step === "interview" && renderInterview()}
                {step === "result" && renderResult()}
                {step === "history" && renderHistory()}
            </div>
        </AppLayout>
    );
}
