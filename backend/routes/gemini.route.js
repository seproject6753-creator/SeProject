const express = require("express");
const router = express.Router();
const { askGemini } = require("../controllers/gemini.controller");

// Public endpoint for Q&A; do NOT expose API key to client
router.post("/ask", askGemini);

module.exports = router;
