const fs = require('fs');
require('dotenv').config();

fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + process.env.GEMINI_API_KEY)
    .then(r => r.json())
    .then(j => {
        const models = j.models.map(m => m.name);
        console.log(models);
        fs.writeFileSync('models.json', JSON.stringify(models, null, 2));
    });
