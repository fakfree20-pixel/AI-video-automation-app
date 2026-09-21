import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Google Gen AI client server-side
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Endpoint to fetch the Python script source code
app.get("/api/python-script", (req, res) => {
  try {
    const scriptPath = path.join(process.cwd(), "python_script.py");
    if (fs.existsSync(scriptPath)) {
      const code = fs.readFileSync(scriptPath, "utf-8");
      res.json({ code });
    } else {
      res.status(404).json({ error: "python_script.py not found" });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to read python script" });
  }
});

// Endpoint for Gemini Script Rewriting & B-Roll Generation
app.post("/api/generate-script", async (req, res) => {
  try {
    const { promptText } = req.body;
    if (!promptText) {
      return res.status(400).json({ error: "promptText is required" });
    }

    const systemInstruction = "You are an expert viral video producer and scriptwriter. Rewrite input prompts into 100% original, copyright-free video scripts and provide scene-by-scene B-Roll keywords.";
    
    const prompt = `
    Input idea, script, or song name:
    """
    ${promptText}
    """
    
    Generate a JSON response containing:
    1. "rewritten_script": A professional, engaging, copyright-free script ready for voiceover.
    2. "scenes": An array of objects, each with "scene_number" (integer), "narration" (string), and "broll_keyword" (string for stock video search).
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            rewritten_script: { type: Type.STRING },
            scenes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  scene_number: { type: Type.INTEGER },
                  narration: { type: Type.STRING },
                  broll_keyword: { type: Type.STRING }
                },
                required: ["scene_number", "narration", "broll_keyword"]
              }
            }
          },
          required: ["rewritten_script", "scenes"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("Empty response from Gemini");
    }

    const data = JSON.parse(text);
    res.json(data);

  } catch (error: any) {
    console.error("Gemini Script Generation Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate script" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
