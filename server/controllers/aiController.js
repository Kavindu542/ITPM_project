const { GoogleGenerativeAI } = require('@google/generative-ai');
const Book = require('../models/Book');
const DigitalResource = require('../models/DigitalResource');

const MAX_CONTEXT_ITEMS = 30;

const getGenAI = () => {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY is not set in environment");
    return new GoogleGenerativeAI(key);
};

const SYSTEM_PROMPT = `You are Lumina, the Smart Library Assistant for CampusCore. 
Your goal is to help students find books and digital resources from the library catalog.

When recommending items, always format your response like this:
1. Start with a friendly, helpful message.
2. List matching books or resources using this EXACT format:

📖 **[Title]**
- Author: [author]
- Category: [category] | Rating: [rating]
- Summary: [brief summary/description]
- Item ID: [id]

3. If no local matches are found, provide 1-2 external recommendations (e.g., from Google Books or Open Library).
4. End with an encouraging closing statement.

Be professional, helpful, and concise. Use markdown for better readability.`;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const normalize = (s) => String(s || "").toLowerCase();

const tokenize = (q) => {
    const cleaned = normalize(q)
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    return cleaned ? cleaned.split(" ").filter(Boolean) : [];
};

const scoreItem = (item, tokens) => {
    const title = normalize(item.title);
    const author = normalize(item.author || "");
    const category = normalize(item.category || "");
    const description = normalize(item.description || "");
    const tags = (item.tags || []).map(normalize);

    let score = 0;
    for (const t of tokens) {
        if (t.length < 2) continue;
        if (title.includes(t)) score += 10;
        if (author.includes(t)) score += 5;
        if (category.includes(t)) score += 5;
        if (description.includes(t)) score += 2;
        if (tags.some(tag => tag.includes(t))) score += 3;
    }
    return score;
};

const pickTopItems = (items, userMessage, limit) => {
    const tokens = tokenize(userMessage);
    const scored = items
        .map(i => ({ i, s: scoreItem(i, tokens) }))
        .filter(x => x.s > 0)
        .sort((a, b) => b.s - a.s)
        .slice(0, limit)
        .map(x => x.i);

    if (scored.length === 0) return items.slice(0, Math.min(limit, items.length));
    return scored;
};

const callGeminiWithRetry = async (model, prompt, maxRetries = 3) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const result = await model.generateContent(prompt);
            return result.response.text();
        } catch (err) {
            if ((err.message.includes("429") || err.message.includes("503")) && attempt < maxRetries) {
                await sleep(attempt * 2000);
                continue;
            }
            throw err;
        }
    }
};

/**
 * @desc    Chat with Lumina AI
 * @route   POST /api/library/ai/chat
 * @access  Private
 */
exports.chatWithLumina = async (req, res) => {
    try {
        const { message, language = 'English' } = req.body;
        if (!message) {
            return res.status(400).json({ success: false, message: 'Message is required' });
        }

        let books = [];
        let resources = [];

        // Check if DB is connected
        const mongoose = require('mongoose');
        if (mongoose.connection.readyState === 1) {
            try {
                books = await Book.find().lean();
                resources = await DigitalResource.find().lean();
            } catch (err) {
                console.warn('DB query failed, continuing with empty catalog:', err.message);
            }
        } else {
            console.warn('DB not connected, skipping catalog retrieval.');
        }

        const allItems = [
            ...books.map(b => ({ ...b, type: 'Book' })),
            ...resources.map(r => ({ ...r, type: 'Digital' }))
        ];

        const picked = pickTopItems(allItems, message, MAX_CONTEXT_ITEMS);

        const context = picked.map((item, idx) => {
            return `[${idx + 1}] ID: ${item._id} | Title: "${item.title}" | Author: "${item.author || 'N/A'}" | Category: "${item.category || 'N/A'}" | Rating: ${item.rating || 0} | Description: "${item.description || ''}"`;
        }).join('\n');

        const prompt = `${SYSTEM_PROMPT}\n\nLanguage: ${language}\n\nLibrary Catalog Items:\n${context || "No items in catalog."}\n\nUser Question: "${message}"`;

        const genAI = getGenAI();
        const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
        const reply = await callGeminiWithRetry(model, prompt);

        const mentionedIds = [];
        for (const item of picked) {
            if (reply.includes(String(item._id))) mentionedIds.push(String(item._id));
        }

        const matchedItems = mentionedIds.map(id => {
            const item = allItems.find(i => String(i._id) === id);
            return item ? {
                id: item._id,
                title: item.title,
                author: item.author,
                category: item.category,
                image: item.coverImage || item.thumbnailImage,
                type: item.type,
                rating: item.rating,
                description: item.description,
                pdf: item.pdfUrl || item.fileUrl || item.url
            } : null;
        }).filter(Boolean);

        res.status(200).json({
            success: true,
            data: reply,
            matchedItems,
            totalSearched: allItems.length
        });

    } catch (error) {
        console.error('Lumina AI Error:', error);
        res.status(500).json({
            success: false,
            message: 'AI Service currently unavailable',
            error: error.message
        });
    }
};
