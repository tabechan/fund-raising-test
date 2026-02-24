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
    // Probed result: "gemini-3-flash-preview" is available for this API key.
    // For stable use, "gemini-flash-latest" is also a good option.
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
        finalPrompt += "\n\n(注意: サポートされていない形式のファイルが含まれていたため、一部のファイルはスキップされました。現在はPDF、画像、プレーンテキストのみを解析可能です。)";
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
