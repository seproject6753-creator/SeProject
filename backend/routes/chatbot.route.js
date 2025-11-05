const express = require("express");
const router = express.Router();
const { ask } = require("../controllers/chatbot.controller");

// Public endpoint; no auth needed for FAQs
router.post("/ask", ask);

module.exports = router;
