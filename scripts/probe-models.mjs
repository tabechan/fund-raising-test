
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = "AIzaSyCfA_l32DMFKO6eAzO9ZovxiPMQrBajN3c";
const genAI = new GoogleGenerativeAI(apiKey);

async function run() {
    try {
        console.log("Fetching models...");
        // The listModels method is on the client instance in newer versions or requires a different approach.
        // However, we can try to use the REST API directly or check available models through the SDK if possible.
        // In @google/generative-ai version 0.24.x, listing models might be different.

        // Let's try to probe common model names and see which ones don't throw 404
        const modelsToTry = [
            "gemini-1.5-flash",
            "gemini-1.5-flash-latest",
            "gemini-1.5-pro",
            "gemini-pro",
            "gemini-1.0-pro"
        ];

        for (const modelName of modelsToTry) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                await model.generateContent("Hello");
                console.log(`✅ ${modelName} is AVAILABLE`);
            } catch (err) {
                if (err.message.includes("404")) {
                    console.log(`❌ ${modelName} is NOT FOUND (404)`);
                } else {
                    console.log(`⚠️  ${modelName} error: ${err.message}`);
                }
            }
        }
    } catch (error) {
        console.error("General error:", error);
    }
}

run();
