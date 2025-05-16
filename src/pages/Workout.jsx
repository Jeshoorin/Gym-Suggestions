import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // ✅ Import navigate
import "../styles/PageStyles.css";
import "../styles/diet-meal-styles.css";
import { useAuth } from "../AuthContext";

const Workout = () => {
  const { profile } = useAuth();
  const [expanded, setExpanded] = useState(null);
  const navigate = useNavigate(); // ✅ Navigation hook

  const workoutPlan = {
    upper: {
      title: "Upper Body",
      exercises: ["Push-ups", "Pull-ups", "Bench Press", "Shoulder Press", "Bicep Curls"],
    },
    lower: {
      title: "Lower Body",
      exercises: ["Squats", "Lunges", "Deadlifts", "Calf Raises"],
    },
    core: {
      title: "Core",
      exercises: ["Planks", "Crunches", "Leg Raises", "Russian Twists"],
    },
  };

  const toggleExpand = (type) => {
    setExpanded(expanded === type ? null : type);
  };

  const handleMarkAsDone = (section) => {
    // ✅ Navigate to Feedback with this section's exercises
    navigate("/feedback", { state: { exercises: section.exercises } });
  };

  return (
    <div className="page-container">
      <div className="page-card wide">
        <h1>Workout Plan</h1>
        <p>Here’s where your customized training lives. Push your limits and stay consistent!</p>

        <div className="diet-flex-row">
          {Object.entries(workoutPlan).map(([key, section]) => (
            <div key={key} className="diet-meal-card collapsible">
              <h2 onClick={() => toggleExpand(key)} style={{ cursor: "pointer" }}>
                {section.title}
              </h2>

              {expanded === key && (
                <>
                  <strong>Exercises:</strong>
                  <ul className="food-list">
                    {section.exercises.map((exercise, idx) => (
                      <li key={idx}>{exercise}</li>
                    ))}
                  </ul>
                  <button onClick={() => handleMarkAsDone(section)}>
                    Mark as Done & Give Feedback
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Workout;
