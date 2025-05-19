import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/PageStyles.css";
import "../styles/diet-meal-styles.css";
import { useAuth } from "../AuthContext";
import axios from "axios";

const Workout = () => {
  const { profile } = useAuth();
  const [expanded, setExpanded] = useState(null);
  const [sessionExercises, setSessionExercises] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const EXERCISE_KEY = "workoutExercises";

  // Map internal keys to friendly display names
  const displayNameMap = {
    upper: "Upper Body",
    lower: "Lower Body",
    core: "Core",
  };

  useEffect(() => {
    const fetchWorkout = async () => {
      try {
        const username = profile?.username || "egarcia";

        const response = await axios.post("http://localhost:5000/api/get-workout", { username });

        const data = response.data;

        console.log("Fetched workout data:", data);

        // Group by type lowercase
        const grouped = data.reduce((acc, exercise) => {
          const type = exercise.type.toLowerCase();
          if (!acc[type]) acc[type] = [];
          acc[type].push(exercise);
          return acc;
        }, {});

        console.log("Grouped workout keys:", Object.keys(grouped));

        setSessionExercises(grouped);
        sessionStorage.setItem(EXERCISE_KEY, JSON.stringify(grouped));
      } catch (error) {
        console.error("❌ Failed to fetch workout:", error.message);
        if (error.code === "ERR_NETWORK") {
          console.error("💡 Tip: Is your backend running on port 5000 and accessible?");
        } else if (error.response) {
          console.error("💥 Backend responded with error:", error.response.data);
        }
      } finally {
        setLoading(false);
      }
    };

    const cached = sessionStorage.getItem(EXERCISE_KEY);
    if (cached) {
      setSessionExercises(JSON.parse(cached));
      setLoading(false);
    } else {
      fetchWorkout();
    }
  }, [profile]);

  const toggleExpand = (type) => {
    setExpanded(expanded === type ? null : type);
  };

  const handleMarkAsDone = (key) => {
    const prev = sessionStorage.getItem(EXERCISE_KEY);
    const oldExercises = prev ? JSON.parse(prev) : {};
    const updated = { ...oldExercises, [key]: sessionExercises[key] };
    sessionStorage.setItem(EXERCISE_KEY, JSON.stringify(updated));

    navigate("/feedback", { state: { exercises: sessionExercises[key] } });
  };

  return (
    <div className="page-container">
      <div className="page-card wide">
        <h1>Workout Plan</h1>
        <p>Here’s where your customized training lives. Push your limits and stay consistent!</p>

        {loading ? (
          <div className="spinner-container">
            <div className="loader"></div>
          </div>
        ) : (
          <div className="diet-flex-row">
            {Object.entries(sessionExercises).map(([key, exercises]) => (
              <div key={key} className="diet-meal-card collapsible">
                <h2 onClick={() => toggleExpand(key)} style={{ cursor: "pointer" }}>
                  {displayNameMap[key] || key.charAt(0).toUpperCase() + key.slice(1)} 
                </h2>

                {expanded === key && (
                  <>
                    <strong>Exercises:</strong>
                    <ul className="food-list">
                      {exercises.map((exercise, idx) => (
                        <li key={idx}>
                          <strong>{exercise.name}</strong> — {exercise.reps} reps × {exercise.weight} kg
                          {exercise.score !== undefined ? ` — Score: ${exercise.score}` : ""}
                          <br />
                          <em className="muscle-group-text">Muscle group: {exercise.muscle_group}</em>
                        </li>
                      ))}
                    </ul>
                    <button onClick={() => handleMarkAsDone(key)}>Mark as Done & Give Feedback</button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Workout;
