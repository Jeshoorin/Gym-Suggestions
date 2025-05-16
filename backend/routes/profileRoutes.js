const express = require("express");
const router = express.Router();
const { saveProfile, getProfile } = require("../controllers/profileController");

router.post("/save-profile", saveProfile);
router.get("/get-profile/:username", getProfile);

module.exports = router;