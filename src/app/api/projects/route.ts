import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET(req: Request) {
    const session: any = await getServerSession(authOptions as any);
    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const projects = await prisma.project.findMany({
            where: { userId: session.user.id },
            include: {
                documents: {
                    include: {
                        files: true,
                        messages: true,
                        todoItems: true
                    }
                },
                simulatorSessions: true
            },
            orderBy: { createdAt: "desc" }
        });

        return NextResponse.json(projects);
    } catch (error: any) {
        console.error("Fetch Projects Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session: any = await getServerSession(authOptions as any);
    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { name, source, jfcLoanProgramId, amount, documents } = body;

        const newProject = await prisma.project.create({
            data: {
                name,
                source,
                jfcLoanProgramId,
                amount,
                userId: session.user.id,
                documents: {
                    create: (documents || []).map((doc: any) => ({
                        templateId: doc.id,
                        category: doc.category,
                        status: doc.status || "missing",
                        type: doc.type || "required",
                        requiredCount: doc.requiredCount || 1,
                        // Messages and Todos are initially empty for a new project
                    }))
                }
            },
            include: {
                documents: true
            }
        });

        return NextResponse.json(newProject);
    } catch (error: any) {
        console.error("Project Creation Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
