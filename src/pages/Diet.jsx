import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/PageStyles.css";
import "../styles/diet-meal-styles.css";
import { useAuth } from "../AuthContext";

function Diet() {
  const { user, profile } = useAuth();
  const [dietData, setDietData] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  const username = user?.email || localStorage.getItem("username");
  const storageKey = `dietData-${username}`;

  useEffect(() => {
    if (!username) return;

    // Check if diet data exists in sessionStorage
    const cachedData = sessionStorage.getItem(storageKey);
    if (cachedData) {
      setDietData(JSON.parse(cachedData));
      setLoading(false);
      return;
    }

    // Fetch diet data from backend
    axios
      .post("http://localhost:5000/api/get-diet", { username })
      .then((res) => {
        setDietData(res.data);
        sessionStorage.setItem(storageKey, JSON.stringify(res.data)); // Cache in sessionStorage
      })
      .catch((err) => {
        console.error("Error fetching diet:", err);
      })
      .finally(() => setLoading(false));
  }, [username, storageKey]);

  const handleSave = async (mealType) => {
    if (!profile?.weight_kg) return alert("Please update your weight in profile.");
    const meal = dietData[mealType];
    if (!meal) return;

    const payload = {
      username,
      date: new Date().toISOString().split("T")[0],
      weight_kg: profile.weight_kg,
      meal_type: mealType,
      calories: meal.macros?.calories || 0,
      protein_g: meal.macros?.protein || 0,
      carbs_g: meal.macros?.carbs || 0,
      fat_g: meal.macros?.fat || 0,
      fooditem: meal.items || [],
    };

    try {
      setSaving(true);
      await axios.post("http://localhost:5000/api/save-diet", payload);
      alert(`Saved ${mealType} meal successfully!`);
    } catch (err) {
      alert("Error saving meal!");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const toggleExpand = (mealType) => {
    setExpanded(expanded === mealType ? null : mealType);
  };

  const targets = {
    calories: 2000,
    protein: 180,
    carbs: 300,
    fat: 70,
  };

  return (
    <div className="page-container">
      <div className="page-card wide">
        <h1>Diet Plan</h1>
        <p>Fuel your body right. Track your meals and stay aligned with your fitness goals.</p>

        {loading ? (
          <div className="spinner-container">
            <div className="loader"></div>
          </div>
        ) : (
          <div className="diet-flex-row">
            {["breakfast", "lunch", "dinner"].map((mealType) => {
              const meal = dietData[mealType];
              const macros = meal?.macros;
              if (!meal) return null;

              const progress = (value, target) => (value / target) * 100;

              return (
                <div key={mealType} className="diet-meal-card collapsible">
                  <h2 onClick={() => toggleExpand(mealType)} style={{ cursor: "pointer" }}>
                    {mealType.toUpperCase()}
                  </h2>
                  {expanded === mealType && (
                    <>
                      <div>
                        <strong>Items:</strong>
                        <ul className="food-list">
                          {Array.isArray(meal.items) && meal.items.length > 0 ? (
                            meal.items.map((item, idx) => <li key={idx}>{item}</li>)
                          ) : (
                            <li>No items listed</li>
                          )}
                        </ul>
                      </div>
                      <div className="macro-info">
                        <strong>Macros:</strong>
                        {macros ? (
                          <>
                            <div className="macro-bar">
                              <label>Calories: {macros.calories?.toFixed(2)}</label>
                              <progress value={progress(macros.calories, targets.calories)} max={100}></progress>
                            </div>
                            <div className="macro-bar">
                              <label>Protein: {macros.protein?.toFixed(2)}g</label>
                              <progress value={progress(macros.protein, targets.protein)} max={100}></progress>
                            </div>
                            <div className="macro-bar">
                              <label>Carbs: {macros.carbs?.toFixed(2)}g</label>
                              <progress value={progress(macros.carbs, targets.carbs)} max={100}></progress>
                            </div>
                            <div className="macro-bar">
                              <label>Fat: {macros.fat?.toFixed(2)}g</label>
                              <progress value={progress(macros.fat, targets.fat)} max={100}></progress>
                            </div>
                          </>
                        ) : (
                          <p>Macro info not available</p>
                        )}
                      </div>
                      <button onClick={() => handleSave(mealType)} disabled={saving}>
                        {saving ? "Saving..." : "Mark as Done"}
                      </button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Diet;
