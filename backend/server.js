// backend/server.js
import express from "express";
import dotenv from "dotenv";
import path from "path";
import cors from "cors";
import { fileURLToPath } from "url";

try {
  dotenv.config();
} catch (e) {
  console.error('Startup error:', e);
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3001;
const API_KEY = process.env.API_KEY; // set this in .env or container env
const PROVIDER_URL = process.env.PROVIDER_URL || process.env.GEMINI_ENDPOINT;

// Basic safety check
if (!API_KEY) {
  console.warn("Warning: API_KEY not set. Please set API_KEY in environment.");
}

app.use(cors());


app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self' data: blob:; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:3001; " + 
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.mathpix.com; " +
    "connect-src 'self' http://localhost:3001 ws://localhost:3001; " +
    "img-src 'self' data: blob: https:; " +
    "font-src 'self' data: https://fonts.gstatic.com https://cdn.mathpix.com;"
  );
  next();
});

// Serve frontend static files (assumes frontend is copied into container)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.json({ limit: "5mb" }));
app.use(express.static(path.join(__dirname, "frontend")));

/**
 * POST /api/generate
 * body: { prompt: string }
 *
 * This now uses the Gemini text generation API. Set PROVIDER_URL in .env to something like:
 * https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent
 */
app.post("/api/generate", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return res.status(400).json({ error: "prompt is required" });
    }

    const requestBody = {
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt }
          ]
        }
      ]
    };

    // Example Gemini text endpoint: https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent
    const url = `${PROVIDER_URL}?key=${API_KEY}`;
    const apiResponse = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody),
    });

    if (!apiResponse.ok) {
      const text = await apiResponse.text();
      console.error("Text API error:", apiResponse.status, text);
      return res.status(502).json({
        error: "Upstream text API error",
        details: text,
      });
    }

    const payload = await apiResponse.json();

    // Gemini text responses usually have candidates[0].content.parts[0].text
    let generatedText = null;
    if (payload?.candidates?.[0]?.content?.parts?.[0]?.text) {
      generatedText = payload.candidates[0].content.parts[0].text;
    } else if (payload?.candidates?.[0]?.content?.text) {
      generatedText = payload.candidates[0].content.text;
    }

    if (!generatedText) {
      return res.json({ raw: payload });
    }

    return res.json({ text: generatedText });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Internal server error", details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
