const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function testModel(modelName) {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Say 'Ready'");
        console.log(`- ${modelName}: SUCCESS`);
        return true;
    } catch (err) {
        console.log(`- ${modelName}: FAILED - ${err.message}`);
        return false;
    }
}

async function run() {
    const models = [
        "gemini-2.0-flash",
        "gemini-1.5-flash",
        "gemini-1.5-pro",
        "gemini-pro",
        "gemini-1.0-pro"
    ];
    console.log("Testing models for generateContent...");
    for (const m of models) {
        await testModel(m);
    }
}

run();
