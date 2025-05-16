import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import '../styles/PageStyles.css';

const Feedback = () => {
  const location = useLocation();
  const workoutExercises = location.state?.exercises || [];

  const [feedbackData, setFeedbackData] = useState(
    workoutExercises.map((name) => ({
      name,
      painLevel: '',
      intensity: '',
      sets: '',
      reps: '',
      weight: '',
      bloating: '',
      notes: '',
    }))
  );

  const [showSuccess, setShowSuccess] = useState(false);

  const handleChange = (index, e) => {
    const { name, value } = e.target;
    const updated = [...feedbackData];
    updated[index][name] = value;
    setFeedbackData(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Send feedbackData to backend here
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="page-container">
      <div className="page-card wide">
        <h1>Today's Workout Feedback</h1>
        {workoutExercises.length === 0 ? (
          <p>No exercises found for today. Please complete a workout first.</p>
        ) : (
          <form onSubmit={handleSubmit} className="feedback-form">
            {feedbackData.map((exercise, idx) => (
              <div key={idx} className="exercise-section">
                <h3>{exercise.name}</h3>

                <div className="input-group">
                  <label>Pain Level (1-10)</label>
                  <input
                    type="number"
                    name="painLevel"
                    min="1"
                    max="10"
                    value={exercise.painLevel}
                    onChange={(e) => handleChange(idx, e)}
                  />
                </div>

                <div className="input-group">
                  <label>Intensity</label>
                  <select
                    name="intensity"
                    value={exercise.intensity}
                    onChange={(e) => handleChange(idx, e)}
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
                    value={exercise.sets}
                    onChange={(e) => handleChange(idx, e)}
                  />
                </div>

                <div className="input-group">
                  <label>Reps</label>
                  <input
                    type="number"
                    name="reps"
                    value={exercise.reps}
                    onChange={(e) => handleChange(idx, e)}
                  />
                </div>

                <div className="input-group">
                  <label>Weight (kg)</label>
                  <input
                    type="number"
                    name="weight"
                    value={exercise.weight}
                    onChange={(e) => handleChange(idx, e)}
                  />
                </div>

                <div className="input-group">
                  <label>Bloating</label>
                  <select
                    name="bloating"
                    value={exercise.bloating}
                    onChange={(e) => handleChange(idx, e)}
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
                    rows="2"
                    value={exercise.notes}
                    onChange={(e) => handleChange(idx, e)}
                    placeholder="Any extra comments..."
                  />
                </div>
                <hr />
              </div>
            ))}

            <button type="submit">Save Feedback</button>

            {showSuccess && (
              <div className="save-success-popout">✅ Feedback saved successfully!</div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

export default Feedback;
