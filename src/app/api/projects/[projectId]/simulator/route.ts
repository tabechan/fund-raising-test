import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]/route";

export async function POST(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
    const session: any = await getServerSession(authOptions as any);
    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;

    try {
        const body = await req.json();
        const { date, focus, status, score, summary, reportDetails, messages } = body;

        const newSession = await prisma.simulatorSession.create({
            data: {
                date,
                focus,
                status,
                score,
                summary,
                report: reportDetails,
                messages: messages,
                projectId: projectId
            }
        });

        return NextResponse.json(newSession);
    } catch (error: any) {
        console.error("Simulator Session Save Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
