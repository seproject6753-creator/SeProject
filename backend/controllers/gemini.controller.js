const path = require("path");
const fs = require("fs");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const KB_PATH = path.join(__dirname, "..", "knowledgebase", "college-faq.json");

function readKBAsContext(maxChars = 6000) {
  try {
    const raw = fs.readFileSync(KB_PATH, "utf8");
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return "";
    const lines = [];
    for (const it of arr) {
      const q = (it.question || "").toString().trim();
      const a = (it.answer || "").toString().trim();
      if (!q || !a) continue;
      lines.push(`Q: ${q}\nA: ${a}`);
      if (lines.join("\n\n").length > maxChars) break;
    }
    return lines.join("\n\n");
  } catch (e) {
    return "";
  }
}

async function askGemini(req, res) {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ success: false, message: "Server missing GOOGLE_GEMINI_API_KEY", data: null });
  }

  const { question, includeKB = true } = req.body || {};
  if (!question || !String(question).trim()) {
    return res.status(400).json({ success: false, message: "Question is required", data: null });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // Try multiple model aliases to be compatible with different API versions/SDKs
    const candidates = [];
    if (process.env.GEMINI_MODEL) candidates.push(process.env.GEMINI_MODEL);
    candidates.push(
      "gemini-1.5-flash-latest",
      "gemini-1.5-flash-002",
      "gemini-1.5-flash",
      "gemini-pro" // legacy text model fallback
    );

    const kbContext = includeKB ? readKBAsContext(7000) : "";
    const systemPreamble = `You are a helpful assistant for a college portal.\n\nGuidelines:\n- Answer using ONLY the provided college information context if relevant.\n- If the answer is not in context, say you don't have that information and suggest checking the Notice, Timetable, or contacting the admin office.\n- Be concise and student-friendly.\n`;

    const contextBlock = kbContext
      ? `College Information Context (FAQs):\n${kbContext}\n\n`
      : "";

    const fullPrompt = `${systemPreamble}\n${contextBlock}User Question: ${String(question).trim()}`;

    let lastErr = null;
    for (const name of candidates) {
      try {
        const model = genAI.getGenerativeModel({ model: name });
        const result = await model.generateContent(fullPrompt);
        // Try common extraction paths depending on SDK version
        let text = "";
        try {
          if (typeof result?.response?.text === "function") {
            text = result.response.text();
          } else if (Array.isArray(result?.response?.candidates)) {
            const parts = result.response.candidates?.[0]?.content?.parts || [];
            text = parts.map((p) => p.text).filter(Boolean).join("\n");
          }
        } catch (_) {}
        if (text) {
          return res.json({ success: true, message: "ok", data: { answer: text } });
        }
        // If empty, keep trying next candidate
        lastErr = new Error("Empty response");
      } catch (e) {
        lastErr = e;
        const msg = String(e?.message || "");
        // If model not found for this API version, try next candidate
        if (/not found/i.test(msg) || /404/.test(msg)) {
          continue;
        }
        // Otherwise break and report
        break;
      }
    }
    throw lastErr || new Error("No working Gemini model found");
  } catch (err) {
    console.error("[gemini] error:", err?.message || err);
    return res.status(500).json({ success: false, message: "Gemini request failed", data: null });
  }
}

module.exports = { askGemini };
