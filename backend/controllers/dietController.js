const fs = require("fs");
const readline = require("readline");
const { appendCSV } = require("../utils/csvUtils");

const path = require("path");
const dietCSV = path.join(__dirname, "../ml_model/data/diet_logs.csv");


exports.saveDiet = async (req, res) => {
  const {
    username, date, weight_kg, meal_type,
    calories, protein_g, carbs_g, fat_g, fooditem
  } = req.body;

  // Check for missing or invalid data
  if (!username || !meal_type || !Array.isArray(fooditem)) {
    return res.status(400).json({ error: "Invalid diet data" });
  }

  // Round numeric fields to remove decimals
  const roundedEntry = {
    username,
    date,
    weight_kg: Math.round(weight_kg),  // Optionally you can round this too if needed
    meal_type,
    calories: Math.round(calories),
    protein_g: Math.round(protein_g),
    carbs_g: Math.round(carbs_g),
    fat_g: Math.round(fat_g),
    fooditem: fooditem.join("|")
  };

  // Check if the entry already exists before saving
  const lineExists = await checkIfEntryExists(roundedEntry);

  if (lineExists) {
    return res.status(200).json({ message: "Entry already exists" });
  }

  // If no duplicate, append the new entry to the CSV
  appendCSV(dietCSV, roundedEntry);
  return res.status(200).json({ message: "Diet saved successfully" });
};

// Function to check if entry already exists in the CSV file
function checkIfEntryExists(entry) {
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(dietCSV);
    const rl = readline.createInterface({ input: stream });

    rl.on("line", (line) => {
      const columns = line.split(",");

      // Check if the date, meal_type, and username match
      if (
        columns[0].trim() === entry.username &&
        columns[1].trim() === entry.date &&
        columns[3].trim() === entry.meal_type
      ) {
        rl.close(); // Stop reading if an identical entry is found
        stream.destroy();
        return resolve(true); // Found a duplicate
      }
    });

    rl.on("close", () => resolve(false)); // If no match found, resolve false
    rl.on("error", (err) => reject(err));  // Error handling
  });
}
