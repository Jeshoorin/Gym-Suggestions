const fs = require("fs");
const path = require("path");
const { ensureCSV, readCSV, writeCSV } = require("../utils/csvUtils");

const csvPath = path.join(__dirname, "../profile.csv");
ensureCSV(csvPath, [
  "username", "name", "age", "height_cm", "weight_kg", "email",
  "fitness_level", "gender",
  "bicep_cm", "chest_cm", "shoulder_cm", "lat_cm", "waist_cm", "abs_cm", "thigh_cm", "calf_cm",
  "blood_sugar_mg_dl", "cholesterol_mg_dl",
  "medical_history", "dietary_restrictions"
]);


exports.saveProfile = (req, res) => {
  const input = req.body;
  const username = input.username;

  if (!username) {
    return res.status(400).json({ error: "Username is required." });
  }

  const data = readCSV(csvPath);
  const index = data.findIndex(row => row.username === username);
  let message = "";

  if (index !== -1) {
    // Existing user — update only provided fields
    const existingProfile = data[index];
    const updatedProfile = { ...existingProfile };

    for (let key in existingProfile) {
      if (key === "dietary_restrictions") {
        if (Array.isArray(input[key])) {
          updatedProfile[key] = input[key].join("|");
        }
      } else if (input[key] !== undefined && input[key] !== "") {
        updatedProfile[key] = input[key];
      }
    }

    data[index] = updatedProfile;
    message = "Profile updated successfully.";
  } else {
    // New user — create full profile, fill missing fields with empty string
    const headers = Object.keys(readCSV(csvPath)[0] || {});
    const newProfile = {};
    headers.forEach(header => {
      if (header === "dietary_restrictions" && Array.isArray(input[header])) {
        newProfile[header] = input[header].join("|");
      } else {
        newProfile[header] = input[header] || "";
      }
    });
    data.push(newProfile);
    message = "Profile saved successfully.";
  }

  writeCSV(csvPath, data);
  return res.status(200).json({ message });
};

exports.getProfile = (req, res) => {
  const username = req.params.username.toLowerCase();
  const data = readCSV(csvPath);
  const profile = data.find(row => row.username.toLowerCase() === username);

  if (profile) {
    if (profile.dietary_restrictions) {
      profile.dietary_restrictions = profile.dietary_restrictions.split("|");
    }
    return res.status(200).json(profile);
  }
  res.status(404).json({ error: "User not found." });
};
