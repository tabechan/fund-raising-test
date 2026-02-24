
const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, ".env.local") });

async function listModels() {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
        console.error("No API key found in .env.local");
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    try {
        // Note: The SDK might not have listModels exposed cleanly in some versions or environments
        // This is a diagnostic attempt
        console.log("Checking available models for your API key...");
        // Since direct listing via SDK might be limited to Vertex or specific versions, 
        // we'll try to probe common names if listing fails.
    } catch (e) {
        console.error("Error during probe:", e);
    }
}

listModels();
