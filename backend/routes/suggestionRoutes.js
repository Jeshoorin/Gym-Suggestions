const express = require("express");
const axios = require("axios");
const router = express.Router();
const { saveDiet } = require("../controllers/dietController");

// Save diet route
router.post("/save-diet", saveDiet);

// Get diet recommendation from Flask service
router.post("/get-diet", async (req, res) => {
try {
const { username } = req.body;
const response = await axios.post("http://127.0.0.1:5001/recommend-diet", { username });
res.json(response.data);
} catch (error) {
console.error("Error getting diet recommendation:", error.message);
res.status(500).json({ error: "Failed to fetch diet recommendation." });
}
});

// Get workout recommendation from Flask ML
router.post("/get-workout", async (req, res) => {
try {
const { username } = req.body;
const response = await axios.post("http://127.0.0.1:5001/recommend-workout", { username });
res.json(response.data);
} catch (error) {
console.error("Error getting workout recommendation:", error.message);
res.status(500).json({ error: "Failed to fetch workout recommendation." });
}
});

module.exports = router;