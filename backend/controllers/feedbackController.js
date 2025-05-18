const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { ensureCSV, readCSV, appendCSV, writeCSV } = require("../utils/csvUtils");

const feedbackCSV = path.join(__dirname, "../ml_model/data/feedback_logs.csv");

ensureCSV(feedbackCSV, [
  "username", "date", "exercise_name", "category", "actual_reps", "actual_weight", "number_of_sets",
  "pain_level", "intensity", "fitness_level", "gender", "bicep_cm", "chest_cm", "shoulder_cm",
  "lat_cm", "waist_cm", "abs_cm", "thigh_cm", "calf_cm", "blood_sugar_mg_dl", "cholesterol_mg_dl",
  "height_cm", "weight_kg"
]);

// Save feedback entry
exports.saveFeedback = (req, res) => {
  const {
    username, date, exercise_name, category,
    actual_reps, actual_weight, number_of_sets,
    pain_level, intensity, fitness_level, gender,
    bicep_cm, chest_cm, shoulder_cm, lat_cm, waist_cm,
    abs_cm, thigh_cm, calf_cm, blood_sugar_mg_dl,
    cholesterol_mg_dl, height_cm, weight_kg
  } = req.body;

  // Basic validation
  if (!username || !date || !exercise_name || !category) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  // Prepare entry with rounded numbers where appropriate
  const entry = {
    username,
    date,
    exercise_name,
    category,
    actual_reps: Math.round(actual_reps || 0),
    actual_weight: Math.round(actual_weight || 0),
    number_of_sets: Math.round(number_of_sets || 0),
    pain_level: Math.round(pain_level || 0),
    intensity: Math.round(intensity || 0),
    fitness_level: fitness_level || "",
    gender: gender || "",
    bicep_cm: Math.round(bicep_cm || 0),
    chest_cm: Math.round(chest_cm || 0),
    shoulder_cm: Math.round(shoulder_cm || 0),
    lat_cm: Math.round(lat_cm || 0),
    waist_cm: Math.round(waist_cm || 0),
    abs_cm: Math.round(abs_cm || 0),
    thigh_cm: Math.round(thigh_cm || 0),
    calf_cm: Math.round(calf_cm || 0),
    blood_sugar_mg_dl: Math.round(blood_sugar_mg_dl || 0),
    cholesterol_mg_dl: Math.round(cholesterol_mg_dl || 0),
    height_cm: Math.round(height_cm || 0),
    weight_kg: Math.round(weight_kg || 0)
  };

  // Optionally check for duplicates if needed (omitted for brevity)

  appendCSV(feedbackCSV, entry);

  res.status(200).json({ message: "Feedback saved successfully." });
};

// Get all feedback entries for a user
exports.getFeedback = (req, res) => {
  const username = req.params.username.toLowerCase();
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format

  const data = readCSV(feedbackCSV);

  // Filter feedback for this user and today's date
  const todayFeedback = data.filter(row => 
    row.username.toLowerCase() === username &&
    row.date === today
  );

  if (todayFeedback.length === 0) {
    return res.status(404).json({ error: "No feedback found for this user today." });
  }

  // Map to only return category and exercise_name
  const result = todayFeedback.map(entry => ({
    category: entry.category,
    exercise_name: entry.exercise_name,
  }));

  res.status(200).json(result);
};
