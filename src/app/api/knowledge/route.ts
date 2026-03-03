import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { KnowledgeEntry } from "@/lib/knowledge-types";

// Hardcoded base knowledge (always available)
const BASE_KNOWLEDGE: KnowledgeEntry[] = [
    {
        id: "base-jfc",
        category: "institution",
        targetId: "日本政策金融公庫",
        title: "公庫審査の基本",
        content: "公庫は『創業計画書』の熱意と『自己資金』の出所を非常に重視します。見せ金は厳禁です。",
        sourceType: "text",
        updatedAt: "2024/02/22"
    },
    {
        id: "base-pl",
        category: "document",
        targetId: "pl",
        title: "損益計算書の要点",
        content: "売上高に占める売上原価率が業界平均と乖離している場合は、その理由（強みや特殊事情）を説明できるようにしてください。",
        sourceType: "text",
        updatedAt: "2024/02/22"
    }
];

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const institution = searchParams.get("institution");
        const program = searchParams.get("program");
        const documentId = searchParams.get("documentId");

        // Fetch from DB
        const dbEntries = await prisma.knowledgeEntry.findMany();

        // Map DB entries to KnowledgeEntry interface
        const persistentKnowledge: KnowledgeEntry[] = dbEntries.map((e: any) => ({
            id: e.id,
            category: e.category as any,
            targetId: e.targetId || "",
            title: e.title,
            content: e.content,
            sourceType: e.sourceType as any,
            sourceUrl: e.sourceUrl || undefined,
            updatedAt: e.updatedAt.toISOString()
        }));

        const allKnowledge = [...BASE_KNOWLEDGE, ...persistentKnowledge];

        const filtered = allKnowledge.filter(e => {
            if (institution && e.targetId === institution) return true;
            if (program && e.targetId === program) return true;
            if (documentId && e.targetId === documentId) return true;
            if (e.category === "general") return true;
            return false;
        });

        return NextResponse.json(filtered);
    } catch (error: any) {
        console.error("Knowledge Fetch Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

import { authOptions } from "../auth/[...nextauth]/route";
import { getServerSession } from "next-auth/next";

export async function POST(req: Request) {
    const session: any = await getServerSession(authOptions as any);
    if (!session || !session.user || (session.user as any).role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const entry = await req.json();

        const newEntry = await prisma.knowledgeEntry.create({
            data: {
                category: entry.category,
                targetId: entry.targetId,
                title: entry.title,
                content: entry.content,
                sourceType: entry.sourceType,
                sourceUrl: entry.sourceUrl
            }
        });

        // Map back to KnowledgeEntry interface
        const result: KnowledgeEntry = {
            id: newEntry.id,
            category: newEntry.category as any,
            targetId: newEntry.targetId || "",
            title: newEntry.title,
            content: newEntry.content,
            sourceType: newEntry.sourceType as any,
            sourceUrl: newEntry.sourceUrl || undefined,
            updatedAt: newEntry.updatedAt.toISOString()
        };

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("Knowledge Save Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
