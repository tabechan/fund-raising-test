"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { JFC_LOAN_DOC_MAPPING, JFC_DOC_TEMPLATES, JFC_SOURCE_NAME } from "@/lib/jfc-data";
import { excelToCsv, isExcelFile } from "@/lib/excel";
import { useSession } from "next-auth/react";

export type ProjectStatus = "進行中" | "完了";
export type DocumentStatus = "ok" | "needs_fix" | "missing";

export interface TodoItem {
    id: string; // DB ID
    text: string;
    completed: boolean;
}

export interface DocumentFile {
    id: string; // DB ID
    name: string;
    date: string;
    mimeType?: string;
    base64Data?: string;
    r2Url?: string;
    csvContent?: string;
    fileUrl?: string; // runtime only
}

export interface Document {
    dbId?: string;        // Database Primary Key
    id: string;            // Template ID (e.g. "bs", "pl")
    name: string;
    category: string;
    status: DocumentStatus;
    date: string;
    type: "required" | "reference";
    requiredCount: number;
    files: DocumentFile[];
    messages: { role: "user" | "ai"; text: string }[];
    todoItems: TodoItem[];
}

export interface SimulatorSession {
    id: string; // DB ID
    date: string;
    focus: string;
    messages: { role: "user" | "ai"; text: string }[];
    status: "ongoing" | "completed";
    score?: string;
    summary?: string;
    reportDetails?: {
        good: string[];
        bad: string[];
        docs: string[];
        criteria: string[];
    };
}

export interface Project {
    id: string; // DB ID
    name: string;
    source: string;
    jfcLoanProgramId?: string;
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
    addProject: (project: Omit<Project, "id" | "documents" | "simulatorSessions">) => Promise<void>;
    updateDocumentStatus: (docId: string, status: DocumentStatus) => Promise<void>;
    uploadDocument: (docId: string, file: File) => Promise<void>;
    updateDocTodo: (docId: string, todoId: string, completed: boolean) => Promise<void>;
    setDocTodos: (docId: string, todoTexts: string[]) => Promise<void>;
    addDocMessage: (docId: string, role: "user" | "ai", text: string) => Promise<void>;
    removeDocumentFile: (docId: string, fileId: string) => void; // Not implemented for DB yet
    saveSimulatorSession: (session: SimulatorSession) => void; // Not implemented for DB yet
    deleteSimulatorSession: (sessionId: string) => void;
    logout: () => void;
    isLoading: boolean;
}

const DEFAULT_DOCS: Document[] = [
    { id: "bs", name: "", category: "貸借対照表 (BS)", status: "missing", date: "-", type: "required", requiredCount: 1, files: [], todoItems: [], messages: [] },
    { id: "pl", name: "", category: "損益計算書 (PL)", status: "missing", date: "-", type: "required", requiredCount: 1, files: [], todoItems: [], messages: [] },
    { id: "tax", name: "", category: "確定申告書", status: "missing", date: "-", type: "required", requiredCount: 2, files: [], todoItems: [], messages: [] },
    { id: "trial", name: "", category: "試算表", status: "missing", date: "-", type: "required", requiredCount: 1, files: [], todoItems: [], messages: [] },
    { id: "plan", name: "", category: "事業計画書", status: "missing", date: "-", type: "reference", requiredCount: 0, files: [], todoItems: [], messages: [] },
    { id: "other", name: "", category: "その他", status: "missing", date: "-", type: "reference", requiredCount: 0, files: [], todoItems: [], messages: [] },
];

const fileUrlStore: Record<string, string> = {};

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
    const { data: session, status: authStatus } = useSession();
    const [projects, setProjects] = useState<Project[]>([]);
    const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Initial load from DB
    useEffect(() => {
        if (authStatus === "authenticated") {
            const fetchProjects = async () => {
                try {
                    const res = await fetch("/api/projects");
                    const data = await res.json();

                    if (data && Array.isArray(data)) {
                        // Map internal schema to UI schema
                        const mappedProjects = data.map((p: any) => ({
                            ...p,
                            documents: p.documents.map((d: any) => ({
                                ...d,
                                id: d.templateId, // Use templateId as UI id
                                dbId: d.id,
                                files: d.files || [],
                                messages: d.messages || [],
                                todoItems: d.todoItems || [],
                                name: (d.files && d.files[0]) ? d.files[0].name : "",
                                date: (d.files && d.files[0]) ? d.files[0].date : "-"
                            }))
                        }));

                        setProjects(mappedProjects);

                        // Handle Migration if DB is empty but localStorage has data
                        const saved = localStorage.getItem("fund_raising_data_v2");
                        if (mappedProjects.length === 0 && saved) {
                            console.log("Migration: Triggering local data push to server...");
                            const localData = JSON.parse(saved);
                            for (const p of localData.projects) {
                                await postProject(p);
                            }
                            // Refresh
                            const refreshRes = await fetch("/api/projects");
                            const refreshedData = await refreshRes.json();
                            setProjects(refreshedData.map((p: any) => ({
                                ...p,
                                documents: p.documents.map((d: any) => ({
                                    ...d,
                                    id: d.templateId,
                                    dbId: d.id,
                                    name: (d.files && d.files[0]) ? d.files[0].name : "",
                                    date: (d.files && d.files[0]) ? d.files[0].date : "-"
                                }))
                            })));
                        }

                        if (!activeProjectId && mappedProjects.length > 0) {
                            setActiveProjectId(mappedProjects[0].id);
                        }
                    }
                } catch (err) {
                    console.error("Failed to fetch projects:", err);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchProjects();
        } else if (authStatus === "unauthenticated") {
            setIsLoading(false);
        }
    }, [authStatus]);

    const activeProject = projects.find(p => p.id === activeProjectId) || null;

    const postProject = async (p: any) => {
        const res = await fetch("/api/projects", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(p),
        });
        return res.json();
    };

    const addProject = async (p: Omit<Project, "id" | "documents" | "simulatorSessions">) => {
        let initialDocs = DEFAULT_DOCS.map(d => ({ ...d }));

        if (p.source === JFC_SOURCE_NAME && p.jfcLoanProgramId) {
            const mappedDocIds = JFC_LOAN_DOC_MAPPING[p.jfcLoanProgramId];
            if (mappedDocIds && mappedDocIds.length > 0) {
                const jfcDocs = mappedDocIds.map(templateId => {
                    const template = JFC_DOC_TEMPLATES[templateId];
                    if (!template) return null;
                    return {
                        id: template.id,
                        name: "",
                        category: template.category,
                        status: "missing" as DocumentStatus,
                        date: "-",
                        type: template.type,
                        requiredCount: template.requiredCount,
                        files: [],
                        todoItems: [],
                        messages: [],
                    };
                }).filter((d): d is NonNullable<typeof d> => d !== null);

                if (jfcDocs.length > 0) {
                    initialDocs = jfcDocs;
                    if (!initialDocs.some(d => d.id === "other")) {
                        initialDocs.push({ ...DEFAULT_DOCS.find(d => d.id === "other")! });
                    }
                }
            }
        }

        const projectData = { ...p, documents: initialDocs };
        const newDbProject = await postProject(projectData);

        // Map back
        const mappedP = {
            ...newDbProject,
            documents: newDbProject.documents.map((d: any) => ({
                ...d,
                id: d.templateId,
                dbId: d.id,
                name: "",
                date: "-"
            }))
        };

        setProjects(prev => [mappedP, ...prev]);
        setActiveProjectId(mappedP.id);
    };

    const updateDocumentStatus = async (docId: string, status: DocumentStatus) => {
        if (!activeProjectId) return;

        await fetch(`/api/projects/${activeProjectId}/documents/${docId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status })
        });

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

    const uploadDocument = async (docId: string, file: File) => {
        if (!activeProjectId) return;

        const reader = new FileReader();
        reader.readAsArrayBuffer(file);
        reader.onload = async () => {
            const arrayBuffer = reader.result as ArrayBuffer;
            const base64 = btoa(
                new Uint8Array(arrayBuffer)
                    .reduce((data, byte) => data + String.fromCharCode(byte), "")
            );

            let csvContent = undefined;
            if (isExcelFile(file)) {
                csvContent = await excelToCsv(arrayBuffer);
            }

            const today = new Date().toLocaleDateString("ja-JP", {
                year: "numeric", month: "2-digit", day: "2-digit",
            });

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

            const fileData = {
                name: file.name,
                date: today,
                mimeType: file.type,
                base64Data: base64, // Keep for fallback
                csvContent: csvContent,
                r2Url: r2Url
            };

            await fetch(`/api/projects/${activeProjectId}/documents/${docId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ file: fileData })
            });

            setProjects(prev =>
                prev.map(p =>
                    p.id === activeProjectId
                        ? {
                            ...p,
                            documents: p.documents.map(d => {
                                if (d.id !== docId) return d;
                                const newFile: DocumentFile = {
                                    id: Math.random().toString(36).substr(2, 9), // Temp ID
                                    ...fileData
                                };
                                const updatedFiles = [...d.files, newFile];
                                const newStatus = (d.requiredCount > 0 && updatedFiles.length >= d.requiredCount) ? "ok" : d.status;

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

    const updateDocTodo = async (docId: string, todoId: string, completed: boolean) => {
        if (!activeProjectId) return;

        await fetch(`/api/projects/${activeProjectId}/documents/${docId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ todoId, completed })
        });

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

    const setDocTodos = async (docId: string, todoTexts: string[]) => {
        if (!activeProjectId) return;

        await fetch(`/api/projects/${activeProjectId}/documents/${docId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ newTodos: todoTexts })
        });

        // For simplicity, refresh projects or update local state with mock IDs
        setProjects(prev =>
            prev.map(p =>
                p.id === activeProjectId
                    ? {
                        ...p,
                        documents: p.documents.map(d => {
                            if (d.id !== docId) return d;
                            const newTodos = todoTexts.map((text, i) => ({
                                id: `temp_${Date.now()}_${i}`,
                                text,
                                completed: false,
                            }));
                            return {
                                ...d,
                                status: "needs_fix" as DocumentStatus,
                                todoItems: newTodos,
                            };
                        }),
                    }
                    : p
            )
        );
    };

    const addDocMessage = async (docId: string, role: "user" | "ai", text: string) => {
        if (!activeProjectId) return;

        await fetch(`/api/projects/${activeProjectId}/documents/${docId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: { role, text } })
        });

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
        // Implementation for DB coming soon
    };

    const deleteSimulatorSession = (sessionId: string) => {
        // Implementation for DB coming soon
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
                removeDocumentFile: (d, f) => { },
                saveSimulatorSession,
                deleteSimulatorSession,
                logout,
                isLoading
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
