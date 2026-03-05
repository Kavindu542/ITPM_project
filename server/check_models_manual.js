const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function testModel(modelName) {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Hello, identifying yourself.");
        console.log(`Model ${modelName}: SUCCESS`);
        return true;
    } catch (err) {
        console.log(`Model ${modelName}: FAILED - ${err.message}`);
        return false;
    }
}

async function runTests() {
    const models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro", "gemini-1.0-pro"];
    for (const m of models) {
        await testModel(m);
    }
}

runTests();
