const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");

const profileRoutes = require("./routes/profileRoutes");
const suggestionRoutes = require("./routes/suggestionRoutes");

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

// Separate route prefixes for better clarity
app.use("/api", profileRoutes);  // Profile routes will now start with /api/profile
app.use("/api", suggestionRoutes);  // Suggestion routes will now start with /api/suggestions

app.get("/", (req, res) => {
  res.send("Fitness App Backend is Running!");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
