export type KnowledgeCategory = "document" | "institution" | "program" | "general";

export interface KnowledgeEntry {
    id: string;
    category: KnowledgeCategory;
    targetId: string; // e.g., "bs", "JFC", "startup-loan"
    title: string;
    content: string;
    sourceType: "text" | "pdf" | "url";
    sourceUrl?: string;
    updatedAt: string;
}
