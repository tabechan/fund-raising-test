
const apiKey = "AIzaSyCfA_l32DMFKO6eAzO9ZovxiPMQrBajN3c";
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

async function listAllModels() {
    try {
        console.log("Listing all available models via raw fetch...");
        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            console.error("API Error:", JSON.stringify(data.error, null, 2));
            return;
        }

        if (data.models) {
            console.log("Found models:");
            data.models.forEach(m => {
                console.log(`- ${m.name} (Methods: ${m.supportedGenerationMethods.join(", ")})`);
            });
        } else {
            console.log("No models found in response:", data);
        }
    } catch (error) {
        console.error("Fetch error:", error);
    }
}

listAllModels();
