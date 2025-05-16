from flask import Flask, request, jsonify
from model.recommender import recommend_meals
import logging

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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
    # Placeholder for workout recommendation logic
    data = request.get_json()
    username = data.get('username')
    return jsonify({'message': f'Workout recommendation for {username} coming soon!'}), 200

if __name__ == '__main__':
    logger.info("Starting the Flask server...")
    app.run(debug=True, host='0.0.0.0', port=5001)
    logger.info("Server running successfully on http://127.0.0.1:5001/")
