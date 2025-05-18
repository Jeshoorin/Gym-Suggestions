const express = require("express");
const router = express.Router();

const { saveProfile, getProfile } = require("../controllers/profileController");
const { saveDiet, getDiet } = require("../controllers/dietController");
const { saveFeedback, getFeedback } = require("../controllers/feedbackController");

// Profile routes
router.post("/save-profile", saveProfile);
router.get("/get-profile/:username", getProfile);


// Feedback routes
router.post("/save-feedback", saveFeedback);
router.get("/get-feedback/:username", getFeedback);

module.exports = router;
