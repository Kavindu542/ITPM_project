const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function run() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // Try some names from the list
    const candidates = [
        "gemini-2.0-flash",
        "gemini-flash-latest",
        "gemini-pro-latest",
        "gemini-2.0-flash-lite-001"
    ];

    for (const name of candidates) {
        try {
            console.log(`Testing model: ${name}...`);
            const model = genAI.getGenerativeModel({ model: name });
            const result = await model.generateContent("Hi");
            console.log(`- ${name}: SUCCESS -> ${result.response.text().substring(0, 30)}...`);
            return name; // Found one that works!
        } catch (err) {
            console.log(`- ${name}: FAILED -> ${err.message}`);
        }
    }
}

run();
