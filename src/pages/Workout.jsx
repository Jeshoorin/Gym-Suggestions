import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/PageStyles.css";
import "../styles/diet-meal-styles.css";
import { useAuth } from "../AuthContext";

const getRandomReps = () => Math.floor(Math.random() * 5 + 8); // 8–12 reps
const getRandomWeight = () => Math.floor(Math.random() * 20 + 20); // 20–40 kg

const pickRandomExercises = (exercises) => {
  const shuffled = exercises.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 3).map((name) => ({
    name,
    reps: getRandomReps(),
    weight: getRandomWeight(),
  }));
};

const Workout = () => {
  const { profile } = useAuth();
  const [expanded, setExpanded] = useState(null);
  const navigate = useNavigate();

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

  const [sessionExercises, setSessionExercises] = useState(() => {
    const randomized = {};
    for (let key in workoutPlan) {
      randomized[key] = pickRandomExercises(workoutPlan[key].exercises);
    }
    return randomized;
  });

  const toggleExpand = (type) => {
    setExpanded(expanded === type ? null : type);
  };

  const handleMarkAsDone = (key) => {
    const exercises = sessionExercises[key];
    navigate("/feedback", { state: { exercises } });
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
                    {sessionExercises[key].map((exercise, idx) => (
                      <li key={idx}>
                        {exercise.name} — {exercise.reps} reps × {exercise.weight} kg
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => handleMarkAsDone(key)}>
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
