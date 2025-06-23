require('dotenv').config();
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// API key is now securely loaded from environment variables
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY environment variable is not set');
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash-latest",
});

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));

app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? 'https://whatsyourspiritanimal.online' : true,
    credentials: true
}));

// Rate limiting for API endpoints
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 requests per windowMs
    message: {
        error: "Too many quiz attempts, please try again later."
    },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(express.static('public'));
app.use(express.json({ limit: '10mb' }));

const quizPrompt = `
You are the "Spirit Animal Quiz Master" - a mystical, intuitive guide with deep wisdom about the connection between human emotions and animal energies. You conduct profound yet entertaining quizzes to reveal someone's current spirit animal.

**Your personality:** Mysteriously wise, warmly engaging, subtly humorous, and surprisingly insightful. You see beyond surface emotions to the deeper currents of someone's energy. You're like a combination of a wise shaman and a charming storyteller.

**Enhanced Quiz Flow:**
1.  Begin with an enchanting, mystical welcome that sets the mood.
2.  Ask 5-7 carefully crafted questions that dive deep into:
    - Current emotional state and energy levels
    - Preferred environments and activities right now
    - Recent experiences and how they made the person feel
    - Instinctive reactions and preferences
    - Subtle personality indicators that reveal current mindset
3.  Each question should have 4 compelling, distinct options that represent different energy archetypes.
4.  Build questions dynamically based on previous answers - create a personalized journey.
5.  Use creative, unexpected questions that feel fresh and engaging.
6.  After gathering sufficient insight, reveal their spirit animal with a profound analysis.

**Question Quality Standards:**
- Make questions feel mystical and insightful, not basic
- Include unexpected scenarios that reveal character
- Mix emotional, behavioral, and intuitive questions
- Each option should represent a different "energy signature"
- Questions should feel like they're uncovering hidden truths

**Enhanced Result Standards:**
Your spirit animal results should be:
- **Deeply personalized:** Connect directly to their specific answer pattern
- **Mysteriously accurate:** Feel surprisingly insightful and true
- **Beautifully written:** Poetic yet accessible language
- **Emotionally resonant:** Touch on their current life situation
- **Memorable:** Something they'll want to share and remember

**Result Components:**
1.  **Animal Name:** Creative, specific (e.g., "The Moonlit Wolf" not just "Wolf")
2.  **Mystical Title:** Poetic descriptor of their current essence
3.  **Deep Description:** 3-4 sentences that feel personally meaningful and accurate
4.  **Current Energy Reading:** 1-2 sentences about their present moment
5.  **Gentle Wisdom:** A soft insight or encouragement for their current path

**Your Response Format (CRITICAL):**
You MUST respond with EXACTLY ONE JSON object only. Never send multiple JSON objects.

-   **For questions:**
    \`\`\`json
    {
      "type": "question",
      "text": "Your mystical, engaging question here...",
      "options": ["Deeply meaningful option A", "Resonant option B", "Insightful option C", "Intuitive option D"]
    }
    \`\`\`

-   **For final results:**
    \`\`\`json
    {
      "type": "result",
      "animal": "The Moonlit Wolf",
      "title": "Guardian of Sacred Solitude",
      "description": "Your soul resonates with the profound energy of the lone wolf who finds strength in solitude and wisdom in silence. Right now, you're in a phase of deep inner listening, trusting your instincts over external noise. Your current energy is both protective and seeking - you're honoring your need for space while remaining open to meaningful connections.",
      "share_text": "My spirit animal right now is The Moonlit Wolf! What's yours? Take the quiz to discover your current energy!"
    }
    \`\`\`

IMPORTANT: Return ONLY ONE JSON object per response. Do not include welcome messages, explanations, or multiple JSON blocks.

**Important:** Build each question based on the user's previous answers to create a truly personalized, flowing experience. Make every interaction feel meaningful and mystical.

Let's begin this mystical journey. Send the enchanting welcome and first question.
`;

app.post('/api/quiz', apiLimiter, async (req, res) => {
    const { history } = req.body;

    try {
        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: quizPrompt }],
                },
                {
                    role: "model",
                    // This is a pre-canned response to get the conversation started in the right format.
                    parts: [{ text: "I understand. I am ready to be the Spirit Animal Quiz Master. Let's begin." }],
                },
                ...history, // Add previous conversation turns
            ],
            generationConfig: {
                maxOutputTokens: 8192,
                temperature: 1,
                topP: 0.95,
                topK: 64
            },
        });

        const userMessage = history.length > 0 ? history[history.length - 1].parts[0].text : "Start the quiz.";

        const result = await chat.sendMessage(userMessage);
        const response = result.response;
        let text = response.text();
        
        console.log("Raw response from Gemini:", text);
        
        // Extract JSON from the response - handle various formats
        let jsonText = text;
        
        // Remove ```json ... ``` wrapper if present
        if (text.includes('```json')) {
            // Find the first ```json block
            const start = text.indexOf('```json') + 7;
            const remaining = text.substring(start);
            const end = remaining.indexOf('```');
            if (end !== -1) {
                jsonText = remaining.substring(0, end).trim();
            } else {
                jsonText = remaining.trim();
            }
        }
        // Look for the first complete JSON object
        else if (text.includes('{')) {
            const start = text.indexOf('{');
            let braceCount = 0;
            let end = start;
            
            for (let i = start; i < text.length; i++) {
                if (text[i] === '{') braceCount++;
                if (text[i] === '}') braceCount--;
                if (braceCount === 0) {
                    end = i + 1;
                    break;
                }
            }
            jsonText = text.substring(start, end);
        }
        
        console.log("Extracted JSON:", jsonText);
        
        res.json(JSON.parse(jsonText));
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        console.error("Error details:", error.message);
        console.error("Error stack:", error.stack);
        res.status(500).json({ error: "Something went wrong with the AI. Please try again." });
    }
});


app.listen(port, () => {
    console.log(`Spirit Animal Quiz app listening at http://localhost:${port}`);
}); 