import { NextRequest, NextResponse } from "next/server";
import { getGeminiResponse } from "@/lib/gemini";

export async function POST(req: NextRequest) {
    try {
        const { prompt, files } = await req.json();

        if (!prompt) {
            return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
        }

        console.log("Gemini Request: sending prompt to model...");
        const text = await getGeminiResponse(prompt, files);
        console.log("Gemini Success: response received.");
        return NextResponse.json({ text });
    } catch (error: any) {
        console.error("Gemini API Route Error Details:", {
            message: error.message,
            stack: error.stack,
            cause: error.cause
        });
        return NextResponse.json({
            error: error.message || "AI response failed",
            details: error.toString()
        }, { status: 500 });
    }
}
