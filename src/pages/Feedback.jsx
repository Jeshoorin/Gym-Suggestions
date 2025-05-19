import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import '../styles/PageStyles.css';
import '../styles/diet-meal-styles.css';

const STORAGE_KEY = 'feedbackData';
const EXERCISE_KEY = 'workoutExercises';

const Feedback = () => {
  const { profile, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const workoutExercises = (() => {
    const fromSession = sessionStorage.getItem(EXERCISE_KEY);
    if (fromSession) {
      try {
        const parsed = JSON.parse(fromSession);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    const fromState = location.state?.exercises;
    if (Array.isArray(fromState)) return fromState;
    return [];
  })();

  if (!Array.isArray(workoutExercises) || workoutExercises.length === 0) {
    return (
      <div className="page-container">
        <div className="page-card wide">
          <h1>Workout Feedback</h1>
          <p>No exercises found. Please complete a workout first.</p>
        </div>
      </div>
    );
  }

  const originalWorkoutRef = useRef(workoutExercises.map((ex) => ({ ...ex })));

  const getInitialFeedbackData = () =>
    originalWorkoutRef.current.map((exercise) => ({
      name: exercise.name,
      reps: exercise.reps,
      weight: exercise.weight,
      actualReps: '',
      actualWeight: '',
      sets: '',
      painLevel: '',
      intensity: '',
    }));

  const [feedbackData, setFeedbackData] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.feedbackData) {
          return parsed.feedbackData;
        }
      }
    } catch {}
    return getInitialFeedbackData();
  });

  const [overallFeedback, setOverallFeedback] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.overallFeedback) {
          return parsed.overallFeedback;
        }
      }
    } catch {}
    return { bloating: '', notes: '' };
  });

  const [currentSlide, setCurrentSlide] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const dataToSave = { feedbackData, overallFeedback };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  }, [feedbackData, overallFeedback]);

  const handleChange = (index, e) => {
    const { name, value } = e.target;
    setFeedbackData((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [name]: value };
      return updated;
    });
  };

  const handleOverallFeedbackChange = (e) => {
    const { name, value } = e.target;
    setOverallFeedback((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const username = user?.email || localStorage.getItem("username") || "testuser";
      const date = new Date().toISOString().split("T")[0];
      const gender = profile?.gender || "Male";
      const fitness_level = profile?.fitness_level || "Intermediate";

      const userStats = {
        bicep_cm: profile?.bicep_cm || 0,
        chest_cm: profile?.chest_cm || 0,
        shoulder_cm: profile?.shoulder_cm || 0,
        lat_cm: profile?.lat_cm || 0,
        waist_cm: profile?.waist_cm || 0,
        abs_cm: profile?.abs_cm || 0,
        thigh_cm: profile?.thigh_cm || 0,
        calf_cm: profile?.calf_cm || 0,
        blood_sugar_mg_dl: profile?.blood_sugar_mg_dl || 0,
        cholesterol_mg_dl: profile?.cholesterol_mg_dl || 0,
        height_cm: profile?.height_cm || 0,
        weight_kg: profile?.weight_kg || 0,
      };

      let savedCount = 0;

      for (const feedback of feedbackData) {
        const payload = {
          username,
          date,
          exercise_name: feedback.name,
          category: "Workout",
          actual_reps: parseInt(feedback.actualReps) || 0,
          actual_weight: parseInt(feedback.actualWeight) || 0,
          number_of_sets: parseInt(feedback.sets) || 0,
          pain_level: parseInt(feedback.painLevel) || 0,
          intensity: feedback.intensity || "",
          fitness_level,
          gender,
          ...userStats,
        };

        const res = await fetch("http://localhost:5000/api/save-feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const result = await res.json();

        if (res.status === 409) {
          console.warn(`⚠️ Duplicate feedback for ${feedback.name} skipped.`);
        } else if (!res.ok) {
          throw new Error(result.error || result.message || "Failed to save feedback.");
        } else {
          savedCount++;
        }
      }

      setShowSuccess(true);
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(EXERCISE_KEY);
      setFeedbackData(getInitialFeedbackData());
      setOverallFeedback({ bloating: '', notes: '' });
      setCurrentSlide(0);

      setTimeout(() => {
        setShowSuccess(false);
        navigate("/workout");
      }, 3000);
    } catch (err) {
      alert("Error submitting feedback: " + err.message);
    }
  };

  const goNext = () => {
    if (currentSlide < feedbackData.length) {
      setCurrentSlide((prev) => prev + 1);
    }
  };

  const goBack = () => {
    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1);
    }
  };

  const isFinalSlide = currentSlide === feedbackData.length;
  const currentFeedback = feedbackData[currentSlide];

  return (
    <div className="page-container">
      <div className="page-card wide">
        <h1>Workout Feedback</h1>

        <form onSubmit={handleSubmit} className="feedback-form">
          {!isFinalSlide && currentFeedback ? (
            <>
              <h2>{currentFeedback.name}</h2>
              <p>
                Target: {currentFeedback.reps} reps × {currentFeedback.weight} kg
              </p>

              <div className="input-group">
                <label>Pain Level (1–10)</label>
                <input
                  type="number"
                  name="painLevel"
                  min="1"
                  max="10"
                  value={currentFeedback.painLevel}
                  onChange={(e) => handleChange(currentSlide, e)}
                />
              </div>

              <div className="input-group">
                <label>Intensity</label>
                <select
                  name="intensity"
                  value={currentFeedback.intensity}
                  onChange={(e) => handleChange(currentSlide, e)}
                >
                  <option value="">Select</option>
                  <option value="Low">Low</option>
                  <option value="Moderate">Moderate</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div className="input-group">
                <label>Sets</label>
                <input
                  type="number"
                  name="sets"
                  value={currentFeedback.sets}
                  onChange={(e) => handleChange(currentSlide, e)}
                />
              </div>

              <div className="input-group">
                <label>Actual Reps Completed</label>
                <input
                  type="number"
                  name="actualReps"
                  value={currentFeedback.actualReps}
                  onChange={(e) => handleChange(currentSlide, e)}
                />
              </div>

              <div className="input-group">
                <label>Actual Weight Used (kg)</label>
                <input
                  type="number"
                  name="actualWeight"
                  value={currentFeedback.actualWeight}
                  onChange={(e) => handleChange(currentSlide, e)}
                />
              </div>
            </>
          ) : (
            <>
              <h2>Overall Feedback</h2>
              <div className="input-group">
                <label>Bloating</label>
                <select
                  name="bloating"
                  value={overallFeedback.bloating}
                  onChange={handleOverallFeedbackChange}
                >
                  <option value="">Select</option>
                  <option value="None">None</option>
                  <option value="Mild">Mild</option>
                  <option value="Severe">Severe</option>
                </select>
              </div>

              <div className="input-group">
                <label>Notes</label>
                <textarea
                  name="notes"
                  rows="3"
                  value={overallFeedback.notes}
                  onChange={handleOverallFeedbackChange}
                  placeholder="Any overall comments..."
                />
              </div>
            </>
          )}

          <div className="button-row" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
            {currentSlide > 0 ? (
              <button type="button" onClick={goBack} style={{ minWidth: '100px' }}>
                ← Back
              </button>
            ) : (
              <div style={{ minWidth: '100px' }} />
            )}

            {!isFinalSlide ? (
              <button type="button" onClick={goNext} style={{ minWidth: '100px' }}>
                Next →
              </button>
            ) : (
              <button type="submit" style={{ minWidth: '150px' }}>
                ✅ Submit Feedback
              </button>
            )}
          </div>

          {showSuccess && (
            <div
              className="save-success-popout"
              style={{
                marginTop: '1rem',
                padding: '10px',
                backgroundColor: '#d4edda',
                border: '1px solid #c3e6cb',
                borderRadius: '4px',
                color: '#155724',
                textAlign: 'center',
                fontWeight: 'bold',
              }}
            >
              ✅ Feedback saved and reset successfully!
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Feedback;
