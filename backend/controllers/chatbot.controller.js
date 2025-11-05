const path = require("path");
const fs = require("fs");
const Fuse = require("fuse.js");

let kb = null; // cached knowledge base
let fuse = null; // cached search index
let kbMtime = 0; // last modified timestamp to detect changes

const KB_PATH = path.join(__dirname, "..", "knowledgebase", "college-faq.json");

function loadKBIfNeeded() {
  try {
    const stat = fs.statSync(KB_PATH);
    if (!kb || stat.mtimeMs !== kbMtime) {
      const raw = fs.readFileSync(KB_PATH, "utf8");
      const data = JSON.parse(raw);
      if (!Array.isArray(data)) throw new Error("Knowledge base JSON must be an array");
      kb = data.map((item, idx) => ({
        id: idx,
        question: String(item.question || "").trim(),
        answer: String(item.answer || "").trim(),
        tags: Array.isArray(item.tags) ? item.tags : [],
        category: item.category || "general",
        source: item.source || null,
      }));

      const options = {
        includeScore: true,
        shouldSort: true,
        threshold: 0.4, // lower is stricter; 0.4 is a decent middle ground
        keys: [
          { name: "question", weight: 0.6 },
          { name: "answer", weight: 0.3 },
          { name: "tags", weight: 0.1 },
        ],
        ignoreLocation: true,
        minMatchCharLength: 2,
      };
      fuse = new Fuse(kb, options);
      kbMtime = stat.mtimeMs;
      console.log(`[chatbot] Knowledge base loaded (${kb.length} entries)`);
    }
  } catch (err) {
    console.error("[chatbot] Failed to load KB:", err.message);
    kb = [];
    fuse = new Fuse([], { keys: ["question", "answer", "tags"] });
  }
}

function formatAnswerEntry(entry, score) {
  return {
    question: entry.question,
    answer: entry.answer,
    category: entry.category,
    source: entry.source,
    score: score != null ? Number(score.toFixed(3)) : null,
  };
}

async function ask(req, res) {
  const { question } = req.body || {};
  if (!question || !String(question).trim()) {
    return res.status(400).json({ success: false, message: "Question is required", data: null });
  }

  loadKBIfNeeded();

  // If KB is empty
  if (!kb || kb.length === 0) {
    return res.json({
      success: true,
      message: "KB empty",
      data: {
        answer: "The college chatbot isn't configured yet. Please add FAQs in backend/knowledgebase/college-faq.json and reload the server.",
        suggestions: [],
      },
    });
  }

  // Search best answers
  const results = fuse.search(String(question).trim()).slice(0, 3);

  if (!results.length || results[0].score > 0.6) {
    // Not confident
    return res.json({
      success: true,
      message: "no-confident-match",
      data: {
        answer: "Sorry, I couldn't find an exact answer. Try rephrasing your question, or check the Notice and Timetable sections.",
        suggestions: kb.slice(0, Math.min(5, kb.length)).map((e) => formatAnswerEntry(e, null)),
      },
    });
  }

  const top = results[0];
  const topEntry = top.item;
  const alternatives = results.slice(1).map((r) => formatAnswerEntry(r.item, r.score || null));

  return res.json({
    success: true,
    message: "ok",
    data: {
      answer: topEntry.answer,
      questionMatched: topEntry.question,
      alternatives,
    },
  });
}

module.exports = {
  ask,
};
