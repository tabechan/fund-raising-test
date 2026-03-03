import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../auth/[...nextauth]/route";

export async function PATCH(req: Request, { params }: { params: { projectId: string; documentId: string } }) {
    const session: any = await getServerSession(authOptions as any);
    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { status, type, message, todoId, completed, file } = body;

        // Find the specific document
        const document = await prisma.document.findFirst({
            where: {
                projectId: params.projectId,
                templateId: params.documentId,
                project: { userId: session.user.id }
            }
        });

        if (!document) {
            return NextResponse.json({ error: "Document not found" }, { status: 404 });
        }

        // Handle Status update
        if (status) {
            await prisma.document.update({
                where: { id: document.id },
                data: { status }
            });
        }

        // Handle Add Message
        if (message) {
            await prisma.message.create({
                data: {
                    role: message.role,
                    text: message.text,
                    documentId: document.id
                }
            });
        }

        // Handle Todo Update
        if (todoId !== undefined && completed !== undefined) {
            // If todoId is a DB ID
            await prisma.todoItem.update({
                where: { id: todoId },
                data: { completed }
            });
        }

        // Handle Add Todo
        if (body.newTodos) {
            await prisma.todoItem.createMany({
                data: body.newTodos.map((text: string) => ({
                    text,
                    completed: false,
                    documentId: document.id
                }))
            });
        }

        // Handle File Metadata Update
        if (file) {
            await prisma.documentFile.create({
                data: {
                    name: file.name,
                    date: file.date,
                    mimeType: file.mimeType,
                    base64Data: file.base64Data,
                    r2Url: file.r2Url,
                    csvContent: file.csvContent,
                    documentId: document.id
                }
            });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Document Update Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
