"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import * as XLSX from "xlsx";

export type ProjectStatus = "進行中" | "完了";
export type DocumentStatus = "ok" | "needs_fix" | "missing";

export interface TodoItem {
    id: string;
    text: string;
    completed: boolean;
}

export interface DocumentFile {
    id: string;
    name: string;
    date: string;
    mimeType?: string;
    base64Data?: string;
    r2Url?: string;
    csvContent?: string;
    fileUrl?: string; // runtime only
}

export interface Document {
    id: string;
    name: string;         // For backwards compatibility/convenience (primary file)
    category: string;
    status: DocumentStatus;
    date: string;
    type: "required" | "reference";
    requiredCount: number; // e.g. 2 for tax returns
    files: DocumentFile[];
    messages: { role: "user" | "ai"; text: string }[];
    todoItems: TodoItem[];
}

export interface SimulatorSession {
    id: string;
    date: string;
    focus: string;
    messages: { role: "user" | "ai"; text: string }[];
    status: "ongoing" | "completed";
    score?: string;
    summary?: string;
}

export interface Project {
    id: string;
    name: string;
    source: string;
    amount: string;
    status: ProjectStatus;
    documents: Document[];
    simulatorSessions: SimulatorSession[];
}

interface ProjectContextType {
    projects: Project[];
    activeProjectId: string | null;
    activeProject: Project | null;
    setActiveProjectId: (id: string) => void;
    addProject: (project: Omit<Project, "id" | "documents">) => void;
    updateDocumentStatus: (docId: string, status: DocumentStatus) => void;
    uploadDocument: (docId: string, file: File) => void;
    updateDocTodo: (docId: string, todoId: string, completed: boolean) => void;
    setDocTodos: (docId: string, todoTexts: string[]) => void;
    addDocMessage: (docId: string, role: "user" | "ai", text: string) => void;
    removeDocumentFile: (docId: string, fileId: string) => void;
    saveSimulatorSession: (session: SimulatorSession) => void;
    deleteSimulatorSession: (sessionId: string) => void;
    logout: () => void;
}

// All docs start as "missing" — no pretend data
const DEFAULT_DOCS: Document[] = [
    { id: "bs", name: "", category: "貸借対照表 (BS)", status: "missing", date: "-", type: "required", requiredCount: 1, files: [], todoItems: [], messages: [] },
    { id: "pl", name: "", category: "損益計算書 (PL)", status: "missing", date: "-", type: "required", requiredCount: 1, files: [], todoItems: [], messages: [] },
    { id: "tax", name: "", category: "確定申告書", status: "missing", date: "-", type: "required", requiredCount: 2, files: [], todoItems: [], messages: [] },
    { id: "trial", name: "", category: "試算表", status: "missing", date: "-", type: "required", requiredCount: 1, files: [], todoItems: [], messages: [] },
    { id: "plan", name: "", category: "事業計画書", status: "missing", date: "-", type: "reference", requiredCount: 0, files: [], todoItems: [], messages: [] },
    { id: "other", name: "", category: "その他", status: "missing", date: "-", type: "reference", requiredCount: 0, files: [], todoItems: [], messages: [] },
];

// In-memory store for object URLs (cannot be serialised to localStorage)
const fileUrlStore: Record<string, string> = {};

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
    const [projects, setProjects] = useState<Project[]>([]);
    const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

    useEffect(() => {
        const saved = localStorage.getItem("fund_raising_data_v2");
        if (saved) {
            const data = JSON.parse(saved);
            // Migration: Ensure todoItems is initialized for existing data
            const migratedProjects = data.projects.map((p: any) => {
                // Add "Other" if missing
                let docs = [...(p.documents || [])];
                if (!docs.some(doc => doc.id === "other")) {
                    docs.push({
                        id: "other",
                        name: "",
                        category: "その他",
                        status: "missing",
                        date: "-",
                        type: "reference",
                        requiredCount: 0,
                        files: [],
                        todoItems: [],
                        messages: []
                    });
                }

                return {
                    ...p,
                    documents: docs.map((d: any) => {
                        // Migrate single file to files array if needed
                        const files = d.files || (d.base64Data ? [{
                            id: 'legacy',
                            name: d.name,
                            date: d.date,
                            mimeType: d.mimeType,
                            base64Data: d.base64Data,
                            r2Url: d.r2Url,
                            csvContent: d.csvContent
                        }] : []);

                        return {
                            ...d,
                            todoItems: d.todoItems || [],
                            messages: d.messages || [],
                            files: files,
                            requiredCount: d.requiredCount || (d.id === 'tax' ? 2 : (d.id === 'other' ? 0 : (d.type === 'required' ? 1 : 0)))
                        };
                    }),
                    simulatorSessions: p.simulatorSessions || []
                };
            });
            setProjects(migratedProjects);
            setActiveProjectId(data.activeProjectId);
        } else {
            const initialProjects: Project[] = [
                {
                    id: "1",
                    name: "新規事業調達A",
                    source: "日本政策金融公庫",
                    amount: "1,000万円",
                    status: "進行中",
                    documents: DEFAULT_DOCS.map(d => ({ ...d })),
                    simulatorSessions: [],
                },
            ];
            setProjects(initialProjects);
            setActiveProjectId("1");
        }
    }, []);

    useEffect(() => {
        if (projects.length > 0) {
            // Strip fileUrl before persisting (Object URLs are runtime-only), 
            // but KEEP base64Data for small/demo persistence
            const serialisable = projects.map(p => ({
                ...p,
                documents: p.documents.map(d => ({
                    ...d,
                    files: d.files.map(({ fileUrl, ...fRest }) => fRest)
                })),
            }));
            localStorage.setItem(
                "fund_raising_data_v2",
                JSON.stringify({ projects: serialisable, activeProjectId })
            );
        }
    }, [projects, activeProjectId]);

    const activeProject = projects.find(p => p.id === activeProjectId) || null;

    const addProject = (p: Omit<Project, "id" | "documents">) => {
        const newProject: Project = {
            ...p,
            id: Math.random().toString(36).substr(2, 9),
            documents: DEFAULT_DOCS.map(d => ({ ...d })),
            simulatorSessions: [],
        };
        setProjects(prev => [...prev, newProject]);
        setActiveProjectId(newProject.id);
    };

    const updateDocumentStatus = (docId: string, status: DocumentStatus) => {
        if (!activeProjectId) return;
        setProjects(prev =>
            prev.map(p =>
                p.id === activeProjectId
                    ? {
                        ...p,
                        documents: p.documents.map(d =>
                            d.id === docId ? { ...d, status } : d
                        ),
                    }
                    : p
            )
        );
    };

    const uploadDocument = (docId: string, file: File) => {
        if (!activeProjectId) return;

        // Revoke old URL if exists
        const key = `${activeProjectId}_${docId}`;
        if (fileUrlStore[key]) URL.revokeObjectURL(fileUrlStore[key]);

        const url = URL.createObjectURL(file);
        fileUrlStore[key] = url;

        const reader = new FileReader();
        reader.readAsArrayBuffer(file);
        reader.onload = async () => {
            const arrayBuffer = reader.result as ArrayBuffer;
            const base64 = btoa(
                new Uint8Array(arrayBuffer)
                    .reduce((data, byte) => data + String.fromCharCode(byte), "")
            );

            // Excel to CSV conversion (if applicable)
            let csvContent = undefined;
            if (file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
                try {
                    const workbook = XLSX.read(arrayBuffer, { type: "array" });
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    csvContent = XLSX.utils.sheet_to_csv(worksheet);
                } catch (e) {
                    console.error("Excel conversion failed:", e);
                }
            }

            const today = new Date().toLocaleDateString("ja-JP", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
            });

            // Cloudflare R2 Upload (Tier 2) - Try-catch to ensure failure doesn't block local state
            let r2Url = undefined;
            try {
                const formData = new FormData();
                formData.append("file", file);
                const res = await fetch("/api/upload", { method: "POST", body: formData });
                if (res.ok) {
                    const data = await res.json();
                    r2Url = data.url;
                }
            } catch (e) {
                console.warn("R2 Upload skipped or failed:", e);
            }

            setProjects(prev =>
                prev.map(p =>
                    p.id === activeProjectId
                        ? {
                            ...p,
                            documents: p.documents.map(d => {
                                if (d.id !== docId) return d;

                                const newFile: DocumentFile = {
                                    id: Math.random().toString(36).substr(2, 9),
                                    name: file.name,
                                    date: today,
                                    mimeType: file.type,
                                    base64Data: base64,
                                    csvContent: csvContent,
                                    r2Url: r2Url,
                                    fileUrl: url,
                                };

                                const updatedFiles = [...d.files, newFile];
                                // Status is OK if we have enough files
                                const newStatus = (d.requiredCount > 0 && updatedFiles.length >= d.requiredCount) ? "ok" : d.status === "missing" ? "missing" : d.status;

                                return {
                                    ...d,
                                    name: updatedFiles[0]?.name || "",
                                    date: updatedFiles[0]?.date || "-",
                                    status: newStatus as DocumentStatus,
                                    files: updatedFiles,
                                };
                            }),
                        }
                        : p
                )
            );
        };
    };

    const removeDocumentFile = (docId: string, fileId: string) => {
        if (!activeProjectId) return;
        setProjects(prev =>
            prev.map(p =>
                p.id === activeProjectId
                    ? {
                        ...p,
                        documents: p.documents.map(d => {
                            if (d.id !== docId) return d;
                            const updatedFiles = d.files.filter(f => f.id !== fileId);
                            const newStatus = (d.requiredCount > 0 && updatedFiles.length < d.requiredCount) ? "missing" : d.status;
                            return {
                                ...d,
                                files: updatedFiles,
                                name: updatedFiles[0]?.name || "",
                                date: updatedFiles[0]?.date || "-",
                                status: newStatus as DocumentStatus,
                            };
                        }),
                    }
                    : p
            )
        );
    };

    const updateDocTodo = (docId: string, todoId: string, completed: boolean) => {
        if (!activeProjectId) return;
        setProjects(prev =>
            prev.map(p =>
                p.id === activeProjectId
                    ? {
                        ...p,
                        documents: p.documents.map(d =>
                            d.id === docId
                                ? {
                                    ...d,
                                    todoItems: d.todoItems.map(t =>
                                        t.id === todoId ? { ...t, completed } : t
                                    ),
                                }
                                : d
                        ),
                    }
                    : p
            )
        );
    };

    const setDocTodos = (docId: string, todoTexts: string[]) => {
        if (!activeProjectId) return;
        setProjects(prev =>
            prev.map(p =>
                p.id === activeProjectId
                    ? {
                        ...p,
                        documents: p.documents.map(d =>
                            d.id === docId
                                ? {
                                    ...d,
                                    todoItems: todoTexts.map((text, i) => ({
                                        id: `${docId}_${i}_${Date.now()}`,
                                        text,
                                        completed: false,
                                    })),
                                }
                                : d
                        ),
                    }
                    : p
            )
        );
    };

    const addDocMessage = (docId: string, role: "user" | "ai", text: string) => {
        if (!activeProjectId) return;
        setProjects(prev =>
            prev.map(p =>
                p.id === activeProjectId
                    ? {
                        ...p,
                        documents: p.documents.map(d =>
                            d.id === docId
                                ? { ...d, messages: [...(d.messages || []), { role, text }] }
                                : d
                        ),
                    }
                    : p
            )
        );
    };

    const saveSimulatorSession = (session: SimulatorSession) => {
        if (!activeProjectId) return;
        setProjects(prev =>
            prev.map(p =>
                p.id === activeProjectId
                    ? {
                        ...p,
                        simulatorSessions: [
                            ...p.simulatorSessions.filter(s => s.id !== session.id),
                            session
                        ]
                    }
                    : p
            )
        );
    };

    const deleteSimulatorSession = (sessionId: string) => {
        if (!activeProjectId) return;
        setProjects(prev =>
            prev.map(p =>
                p.id === activeProjectId
                    ? {
                        ...p,
                        simulatorSessions: p.simulatorSessions.filter(s => s.id !== sessionId)
                    }
                    : p
            )
        );
    };

    const logout = () => {
        window.location.href = "/login";
    };

    return (
        <ProjectContext.Provider
            value={{
                projects,
                activeProjectId,
                activeProject,
                setActiveProjectId,
                addProject,
                updateDocumentStatus,
                uploadDocument,
                updateDocTodo,
                setDocTodos,
                addDocMessage,
                removeDocumentFile,
                saveSimulatorSession,
                deleteSimulatorSession,
                logout,
            }}
        >
            {children}
        </ProjectContext.Provider>
    );
}

export function useProject() {
    const context = useContext(ProjectContext);
    if (!context) throw new Error("useProject must be used within a ProjectProvider");
    return context;
}
