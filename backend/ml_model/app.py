# app.py
from flask import Flask, request, jsonify
from model.recommender import recommend_meals
from model.workout import recommend_workout, load_model_and_scalers, train_workout_model
import logging
import os

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MODEL_DIR = "models"
MODEL_PATH = os.path.join(MODEL_DIR, "workout_model.h5")
SCALER_X_PATH = os.path.join(MODEL_DIR, "scaler_X.pkl")
SCALER_Y_PATH = os.path.join(MODEL_DIR, "scaler_y.pkl")
FEEDBACK_CSV = "data/feedback_logs.csv"

# Ensure model and scalers are available
def ensure_model_and_scalers():
    if not (os.path.exists(MODEL_PATH) and os.path.exists(SCALER_X_PATH) and os.path.exists(SCALER_Y_PATH)):
        logger.warning("Model or scaler files not found. Training new model...")
        train_workout_model(csv_path=FEEDBACK_CSV, save_dir=MODEL_DIR)
        logger.info("Workout model and scalers trained and saved.")

    return load_model_and_scalers()

# Load workout model and scalers once at startup
workout_model, scaler_X, scaler_y = ensure_model_and_scalers()

@app.route("/recommend-diet", methods=["POST"])
def recommend_diet():
    data = request.get_json()
    username = data.get("username")

    if not username:
        return jsonify({"error": "Username is required"}), 400

    result = recommend_meals(username)

    if result is None:
        return jsonify({"error": "No recommendation generated"}), 500

    return jsonify(result)

@app.route('/recommend-workout', methods=['POST'])
def recommend_workout_route():
    data = request.get_json()
    username = data.get('username')
    if not username:
        return jsonify({'error': 'Username is required'}), 400

    try:
        result = recommend_workout(username, model=workout_model, scaler_X=scaler_X, scaler_y=scaler_y)
        return jsonify(result), 200
    except Exception as e:
        logger.error(f"Workout recommendation failed: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    logger.info("Starting the Flask server...")
    app.run(debug=True, host='0.0.0.0', port=5001)
    logger.info("Server running successfully on http://127.0.0.1:5001/")
