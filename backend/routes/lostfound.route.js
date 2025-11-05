const express = require("express");
const router = express.Router();
const upload = require("../middlewares/multer.middleware");
const auth = require("../middlewares/auth.middleware");
const { listItems, createItem, claimItem, deleteItem } = require("../controllers/lostfound.controller");

// Public read
router.get("/", listItems);

// Authenticated actions
router.post("/", auth, upload.single("photo"), createItem);
router.post("/:id/claim", auth, claimItem);
router.delete("/:id", auth, deleteItem);

module.exports = router;
