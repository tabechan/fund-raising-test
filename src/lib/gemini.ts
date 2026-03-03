import { GoogleGenerativeAI, Part } from "@google/generative-ai";

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
if (!apiKey) {
    console.error("CRITICAL: NEXT_PUBLIC_GEMINI_API_KEY is not set in environment variables.");
}
const genAI = new GoogleGenerativeAI(apiKey);

export async function getGeminiResponse(
    prompt: string,
    files?: { data: string; mimeType: string }[]
) {
    // Use gemini-3-flash-preview as requested
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    const SUPPORTED_MIMES = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/heic",
        "image/heif",
        "text/plain",
        "text/csv",
        "text/markdown",
    ];

    const validFiles = (files || []).filter(f => SUPPORTED_MIMES.includes(f.mimeType));
    const skippedSome = (files || []).length > validFiles.length;

    let finalPrompt = prompt;
    if (skippedSome) {
        finalPrompt += "\n\n(補足: 一部の解析困難な形式のファイルは、システム側でテキストやPDFに変換してプロンプトに含めているか、あるいはスキップされています。提供されている情報の範囲で回答してください。)";
    }

    const parts: (string | Part)[] = [finalPrompt];

    if (validFiles.length > 0) {
        validFiles.forEach((file) => {
            parts.push({
                inlineData: {
                    data: file.data,
                    mimeType: file.mimeType,
                },
            });
        });
    }

    try {
        const result = await model.generateContent(parts);
        const response = await result.response;
        return response.text();
    } catch (error: any) {
        console.error("Gemini Generation Error:", error);
        throw new Error(`Gemini API Error: ${error.message || "Failed to generate content"}`);
    }
}
