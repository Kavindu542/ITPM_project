const fs = require('fs');
require('dotenv').config();

fetch('https://generativelanguage.googleapis.com/v1/models?key=' + process.env.GEMINI_API_KEY)
    .then(r => r.json())
    .then(j => {
        const models = j.models
            .filter(m => m.supportedMethods.includes('generateContent'))
            .map(m => ({ name: m.name, displayName: m.displayName }));
        console.log(JSON.stringify(models, null, 2));
        fs.writeFileSync('working_models_v1.json', JSON.stringify(models, null, 2));
    });
