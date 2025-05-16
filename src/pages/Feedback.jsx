import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import '../styles/PageStyles.css';
import '../styles/diet-meal-styles.css';

const STORAGE_KEY = 'feedbackData';

const Feedback = () => {
  const location = useLocation();
  console.log("Feedback page location state:", location.state);

  const workoutExercises = location.state?.exercises || [];
  console.log("Workout exercises:", workoutExercises);

  const getInitialFeedbackData = () =>
    workoutExercises.length > 0
      ? workoutExercises.map((exercise) => ({
          name: exercise.name,
          reps: exercise.reps,
          weight: exercise.weight,
          sets: '',
          painLevel: '',
          intensity: '',
        }))
      : [];

  const [feedbackData, setFeedbackData] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.feedbackData) {
          console.log('Loaded feedbackData from localStorage:', parsed.feedbackData);
          return parsed.feedbackData;
        }
      }
    } catch (error) {
      console.warn('Failed to parse localStorage data:', error);
    }
    const initialData = getInitialFeedbackData();
    console.log('Initialized feedbackData:', initialData);
    return initialData;
  });

  const [overallFeedback, setOverallFeedback] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.overallFeedback) {
          console.log('Loaded overallFeedback from localStorage:', parsed.overallFeedback);
          return parsed.overallFeedback;
        }
      }
    } catch (error) {
      console.warn('Failed to parse overallFeedback:', error);
    }
    return { bloating: '', notes: '' };
  });

  const [currentSlide, setCurrentSlide] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  // Save to localStorage whenever feedbackData or overallFeedback changes
  useEffect(() => {
    console.log('Saving feedbackData and overallFeedback to localStorage...');
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

  const handleSubmit = (e) => {
    e.preventDefault();

    setShowSuccess(true);

    // Clear localStorage immediately
    localStorage.removeItem(STORAGE_KEY);

    // Reset states explicitly to initial empty values
    setFeedbackData(getInitialFeedbackData());
    setOverallFeedback({ bloating: '', notes: '' });
    setCurrentSlide(0);

    setTimeout(() => setShowSuccess(false), 3000);
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
        {feedbackData.length === 0 ? (
          <p>No exercises found. Please complete a workout first.</p>
        ) : (
          <form onSubmit={handleSubmit} className="feedback-form">
            {!isFinalSlide && currentFeedback ? (
              <>
                <h2>{currentFeedback.name}</h2>
                <p>
                  {currentFeedback.reps} reps × {currentFeedback.weight} kg
                </p>

                <div className="input-group">
                  <label>Pain Level (1-10)</label>
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
                  <label>Reps Completed</label>
                  <input
                    type="number"
                    name="reps"
                    value={currentFeedback.reps}
                    onChange={(e) => handleChange(currentSlide, e)}
                  />
                </div>

                <div className="input-group">
                  <label>Weight Used (kg)</label>
                  <input
                    type="number"
                    name="weight"
                    value={currentFeedback.weight}
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

            <div
              className="button-row"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '1.5rem',
              }}
            >
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
        )}
      </div>
    </div>
  );
};

export default Feedback;
