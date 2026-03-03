import { KnowledgeEntry } from "./knowledge-types";

export async function getRelevantKnowledge(context: { institution?: string, program?: string, documentId?: string }) {
    const params = new URLSearchParams();
    if (context.institution) params.append("institution", context.institution);
    if (context.program) params.append("program", context.program);
    if (context.documentId) params.append("documentId", context.documentId);

    const res = await fetch(`/api/knowledge?${params.toString()}`);
    if (!res.ok) return [];

    return await res.json() as KnowledgeEntry[];
}

export async function getFormattedKnowledge(context: { institution?: string, program?: string, documentId?: string }) {
    const entries = await getRelevantKnowledge(context);
    if (entries.length === 0) return "";

    return entries.map(e => `【${e.title}】\n${e.content}`).join("\n\n");
}

export async function saveKnowledgeEntry(entry: Omit<KnowledgeEntry, "id" | "updatedAt">) {
    const res = await fetch("/api/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
    });

    if (!res.ok) throw new Error("Failed to save knowledge entry");

    return await res.json() as KnowledgeEntry;
}
