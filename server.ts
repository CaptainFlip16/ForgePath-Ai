import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

const app = express();
app.use(express.json());

const PORT = 3000;

// Lazy initialization of GoogleGenAI
let aiInstance: GoogleGenAI | null = null;
function getAI() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required.");
    }
    aiInstance = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiInstance;
}

// Resilient helper to call Gemini with automatic retries and fallback to gemini-3.1-flash-lite
async function generateContentWithRetry(params: {
  contents: any;
  config?: any;
  primaryModel?: string;
  fallbackModel?: string;
  maxRetries?: number;
}): Promise<any> {
  const primary = params.primaryModel || "gemini-3.5-flash";
  const fallback = params.fallbackModel || "gemini-3.1-flash-lite";
  const maxRetries = params.maxRetries ?? 3;

  let lastError: any = null;

  // Try primary model with retries
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[AI] Attempt ${attempt} generating with primary model ${primary}...`);
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: primary,
        contents: params.contents,
        config: params.config,
      });
      return response;
    } catch (err: any) {
      lastError = err;
      const status = err.status || (err.error && err.error.code);
      const isTransient = status === 503 || status === 429 || String(err).includes("503") || String(err).includes("429");
      
      console.warn(
        `[AI] Attempt ${attempt} failed with ${primary}. Status: ${status}. Transient: ${isTransient}. Error: ${err.message || err}`
      );

      if (!isTransient) {
        // Break early if it's not a temporary/network error (e.g. invalid arguments or bad auth)
        break;
      }

      if (attempt < maxRetries) {
        const delay = attempt * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // Fallback if primary fails
  console.log(`[AI] Primary model ${primary} failed or experienced high demand. Trying fallback model ${fallback}...`);
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      console.log(`[AI] Fallback attempt ${attempt} with ${fallback}...`);
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: fallback,
        contents: params.contents,
        config: params.config,
      });
      return response;
    } catch (err: any) {
      lastError = err;
      console.warn(`[AI] Fallback attempt ${attempt} failed with ${fallback}:`, err.message || err);
      if (attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  throw lastError || new Error("Failed to generate content after retries and model fallback.");
}

// 1. API Endpoint: Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// 2. API Endpoint: Generate Custom Roadmap using Gemini
app.post("/api/generate-roadmap", async (req, res) => {
  try {
    const { become, build, skills, time, methodologies } = req.body;

    const prompt = `
Generate a highly personalized learning roadmap for a student aiming to become a "${become || "AI Automation Developer"}".
Their target project to build is: "${build || "Build a practical portfolio project"}".
Their current known skills: [${(skills || []).join(", ")}].
Their time commitment: "${time || "5-10 hours per week"}".
Their preferred learning methodologies: [${(methodologies || []).join(", ")}].

Create exactly 6 sequential modules (nodes) that constitute their learning path.
For each module, define:
1. Title (e.g. "Programming Fundamentals", "JavaScript", "React", "APIs", "Webhooks", "AI Agents", "Large Language Models")
2. Description
3. Why it matters in the context of becoming a "${become}"
4. Prerequisites (list of prior modules or basic skills)
5. Recommended project description (a concrete, practical mini-project they can build for this module)
6. Status: Set the first 3 modules as "Mastered" (to represent their existing skills or completed work), the 4th module as "In Progress", and the 5th and 6th modules as "Locked".

Ensure the roadmap is completely customized to the goal of becoming a "${become}" and building "${build}".
`;

    const response = await generateContentWithRetry({
      primaryModel: "gemini-3.5-flash",
      fallbackModel: "gemini-3.1-flash-lite",
      contents: prompt,
      config: {
        systemInstruction: "You are ForgePath AI, an expert career counselor and curriculum designer for top-tier software engineering and AI career paths. Generate roadmaps in precise JSON format.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["pathName", "overallProgress", "modules"],
          properties: {
            pathName: {
              type: Type.STRING,
              description: "The name of the generated career path, e.g. AI Automation Developer",
            },
            overallProgress: {
              type: Type.INTEGER,
              description: "The initial progress percentage (should be 25 or 50)",
            },
            modules: {
              type: Type.ARRAY,
              description: "The list of 6 sequential learning modules",
              items: {
                type: Type.OBJECT,
                required: ["id", "title", "description", "whyItMatters", "prerequisites", "recommendedProject", "status"],
                properties: {
                  id: { type: Type.STRING, description: "Short key, e.g. fundamentals, js, react, apis, webhooks, ai_agents" },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  whyItMatters: { type: Type.STRING },
                  prerequisites: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  recommendedProject: {
                    type: Type.OBJECT,
                    required: ["title", "description"],
                    properties: {
                      title: { type: Type.STRING },
                      description: { type: Type.STRING }
                    }
                  },
                  status: {
                    type: Type.STRING,
                    description: "Must be 'Mastered' for the first 3, 'In Progress' for the 4th, and 'Locked' for the last 2"
                  }
                }
              }
            }
          }
        }
      }
    });

    const roadmapData = JSON.parse(response.text || "{}");
    res.json(roadmapData);
  } catch (err: any) {
    console.error("Error generating roadmap:", err);
    res.status(500).json({ error: err.message || "Failed to generate customized roadmap." });
  }
});

// 3. API Endpoint: AI Mentor Chat (n8n Webhook Integration)
app.post("/api/chat", async (req, res) => {
  try {
    const { uid, question, messages, context } = req.body;
    const userQuestion = question || (messages && messages[messages.length - 1]?.text) || "";
    const userUid = uid || "guest_user";

    // Forward request to n8n webhook
    try {
      const webhookRes = await fetch("https://ahmadontech.app.n8n.cloud/webhook/forgepath/ai-mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: userUid,
          question: userQuestion
        }),
      });

      if (webhookRes.ok) {
        const webhookData = await webhookRes.json();
        const output = Array.isArray(webhookData)
          ? (webhookData[0]?.output || webhookData[0]?.text)
          : (webhookData?.output || webhookData?.text);

        if (output) {
          return res.json({ output, text: output });
        }
      }
    } catch (n8nErr) {
      console.warn("Server-side n8n webhook forward warning:", n8nErr);
    }

    // Fallback to Gemini if n8n webhook does not respond
    const systemPrompt = `
You are Forge Mentor, an advanced, elite AI career advisor and engineering mentor integrated inside the ForgePath AI platform.
You are helping a student currently pursuing the path: "${context?.pathName || "AI Automation Developer"}".

CRITICAL FORMATTING RULES FOR CHAT DISPLAY:
- Do NOT output Markdown tables using pipe characters (|) or dashed separators.
- Do NOT output multi-column raw markdown grids.
- Present all structured information, weekly plans, and dependency maps as clean, readable bullet points or numbered lists.
- Use simple bolding (**like this**) for headers and emphasis instead of Markdown headings (# or ##).
- Ensure line breaks are clear between sections so the user interface renders the response as clean, styled text.
`;

    const chatContents = messages ? messages.map((m: any) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.text }],
    })) : [{ role: "user", parts: [{ text: userQuestion }] }];

    const response = await generateContentWithRetry({
      primaryModel: "gemini-3.5-flash",
      fallbackModel: "gemini-3.1-flash-lite",
      contents: chatContents,
      config: {
        systemInstruction: systemPrompt,
      },
    });

    res.json({ output: response.text, text: response.text });
  } catch (err: any) {
    console.error("Error in AI Mentor chat:", err);
    res.status(500).json({ error: err.message || "AI Mentor is currently offline." });
  }
});

// 4. Vite Dev Server Integration & Static files
async function initServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

initServer().catch((err) => {
  console.error("Failed to start server:", err);
});
