import logging
import pandas as pd
import numpy as np
from keras.models import Sequential
from keras.layers import LSTM, Dense
from sklearn.preprocessing import MinMaxScaler
from sklearn.ensemble import RandomForestRegressor
from model.utils import load_user_profile, load_all_logs, load_food_items, filter_food_by_dietary_restrictions

# Set up logging
logger = logging.getLogger(__name__)

# BMI calculation function
def calculate_bmi(weight_kg, height_cm):
    height_m = height_cm / 100
    return weight_kg / (height_m ** 2)

# Calculate BMR based on user data (age, weight, height, gender)
def calculate_bmr(weight_kg, height_cm, age, gender):
    if gender.lower() == 'female':
        bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age + 161
    else:
        bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age + 5
    return bmr

# Adjust calories based on activity level
def calculate_target_calories(bmr, activity_level):
    activity_factors = {
        'beginner': 1.2,
        'intermediate': 1.55,
        'advanced': 1.9
    }
    return bmr * activity_factors.get(activity_level.lower(), 1.2)

# Macros calculation based on total calories
def calculate_macros(calories):
    protein = (calories * 0.30) / 4
    carbs = (calories * 0.40) / 4
    fat = (calories * 0.30) / 9
    return calories, protein, carbs, fat

# Prepare user sequence for LSTM input
def get_user_sequence(logs):
    logs_sorted = logs.sort_values(by='date')
    grouped = logs_sorted.groupby('date').agg({
        'calories': 'sum', 'protein_g': 'sum', 'carbs_g': 'sum', 'fat_g': 'sum'
    }).reset_index()
    data = grouped[['calories', 'protein_g', 'carbs_g', 'fat_g']].values
    return data

# Build LSTM model
def build_lstm_model(input_shape):
    model = Sequential()
    model.add(LSTM(64, input_shape=input_shape))
    model.add(Dense(4))
    model.compile(optimizer='adam', loss='mse')
    return model

# Scoring function for food items
def score_food(food, remaining):
    score = 0
    score += max(0, 1 - abs(food['calories'] - remaining['calories']) / (remaining['calories'] + 1e-6)) * 0.4
    score += max(0, 1 - abs(food['protein_g'] - remaining['protein']) / (remaining['protein'] + 1e-6)) * 0.3
    score += max(0, 1 - abs(food['carbs_g'] - remaining['carbs']) / (remaining['carbs'] + 1e-6)) * 0.2
    score += max(0, 1 - abs(food['fat_g'] - remaining['fat']) / (remaining['fat'] + 1e-6)) * 0.1
    return score

# Select meals based on target macros and avoid previously selected items
def select_meal(food_df, target_macros, used_items=None):
    if used_items is None:
        used_items = []

    selected_items = []
    total = {'calories': 0.0, 'protein': 0.0, 'carbs': 0.0, 'fat': 0.0}
    food_df = food_df.copy()

    # Exclude used items
    food_df = food_df[~food_df['name'].isin(used_items)]

    while True:
        remaining = {
            'calories': target_macros['calories'] - total['calories'],
            'protein': target_macros['protein'] - total['protein'],
            'carbs': target_macros['carbs'] - total['carbs'],
            'fat': target_macros['fat'] - total['fat']
        }

        food_df['score'] = food_df.apply(lambda row: score_food(row, remaining), axis=1)
        food_df_sorted = food_df.sort_values(by='score', ascending=False)

        for _, food in food_df_sorted.iterrows():
            new_total = {
                'calories': total['calories'] + food['calories'],
                'protein': total['protein'] + food['protein_g'],
                'carbs': total['carbs'] + food['carbs_g'],
                'fat': total['fat'] + food['fat_g']
            }

            if all(new_total[key] <= target_macros[key] * 1.05 for key in total):
                total = new_total
                selected_items.append(food['name'])
                break
        else:
            break

    return selected_items

# Main function for recommending meals
def recommend_meals(username):
    logger.info(f"Starting diet recommendation for user: {username}")

    # Load user profile
    logger.info("Loading user profile...")
    profile = load_user_profile(username)
    logger.info(f"User profile for {username}: {profile}")

    # Load user logs
    logger.info("Loading user logs...")
    user_logs = load_all_logs('data/diet_logs.csv')
    logger.info(f"User logs loaded successfully for {username}")

    # Load food items
    logger.info("Loading food items...")
    food_df = load_food_items()
    logger.info("Food items loaded successfully")

    # Validate food columns
    if not all(col in food_df.columns for col in ['calories', 'protein_g', 'carbs_g', 'fat_g']):
        logger.error("Missing necessary columns in food data.")
        raise ValueError("Missing necessary columns in food data.")
    food_df[['calories', 'protein_g', 'carbs_g', 'fat_g']] = food_df[['calories', 'protein_g', 'carbs_g', 'fat_g']].apply(pd.to_numeric, errors='coerce')

    # Filter logs for user
    logger.info(f"Retrieving user logs for {username}...")
    user_log_df = user_logs[user_logs['username'] == username]
    logger.info(f"User logs for {username}: {user_log_df.head()}")

    # Calculate BMI
    logger.info(f"Calculating BMI for {username}...")
    bmi = calculate_bmi(profile['weight_kg'], profile['height_cm'])
    logger.info(f"BMI calculated: {bmi}")

    # Calculate BMR and target calories
    logger.info(f"Calculating BMR for {username}...")
    bmr = calculate_bmr(profile['weight_kg'], profile['height_cm'], profile['age'], profile['gender'])
    logger.info(f"BMR calculated: {bmr}")
    target_calories = calculate_target_calories(bmr, profile['fitness_level'])
    logger.info(f"Target calories: {target_calories}")

    # Calculate target macros
    target_macros = dict(zip(['calories', 'protein', 'carbs', 'fat'], calculate_macros(target_calories)))
    logger.info(f"Target macros: {target_macros}")

    # --- Fallback if logs are empty or insufficient ---
    if user_log_df.empty or len(user_log_df) < 10:
        logger.warning(f"Insufficient logs for {username}, using fallback macro estimation.")

        predicted_macros_dict = target_macros
        logger.info(f"Predicted macros (fallback): {predicted_macros_dict}")
    else:
        # Prepare sequence for LSTM
        logger.info("Preparing user sequence for LSTM model...")
        data = get_user_sequence(user_log_df)
        window_size = 7
        X, y = [], []
        for i in range(len(data) - window_size):
            X.append(data[i:i + window_size])
            y.append(data[i + window_size])
        X, y = np.array(X), np.array(y)

        if len(X) == 0:
            logger.warning(f"Not enough data for LSTM after sequence prep. Using fallback.")
            predicted_macros_dict = target_macros
        else:
            scaler = MinMaxScaler()
            X_scaled = scaler.fit_transform(X.reshape(-1, 4)).reshape(X.shape)
            y_scaled = scaler.transform(y)

            logger.info("Training LSTM model...")
            model = build_lstm_model((X.shape[1], X.shape[2]))
            model.fit(X_scaled, y_scaled, epochs=20, verbose=0)
            logger.info("LSTM training complete.")

            pred_scaled = model.predict(X_scaled[-1].reshape(1, window_size, 4))
            predicted_macros = scaler.inverse_transform(pred_scaled)[0]
            predicted_macros_dict = dict(zip(['calories', 'protein', 'carbs', 'fat'], predicted_macros))
            logger.info(f"Predicted macros from LSTM: {predicted_macros_dict}")

    # Filter food for dietary restrictions
    logger.info(f"Filtering food items for {username}...")
    food_df = filter_food_by_dietary_restrictions(food_df, profile.get('dietary_restrictions'))

    # Meal planning
    used_items = []

    logger.info("Selecting breakfast...")
    breakfast_macros = {k: float(predicted_macros_dict[k] * 0.3) for k in predicted_macros_dict}
    try:
        breakfast = select_meal(food_df, breakfast_macros, used_items)
        used_items.extend(breakfast)
        logger.info(f"Breakfast selected: {breakfast}")
    except Exception as e:
        logger.error(f"Error selecting breakfast: {e}")
        breakfast = []

    logger.info("Selecting lunch...")
    lunch_macros = {k: float(predicted_macros_dict[k] * 0.4) for k in predicted_macros_dict}
    try:
        lunch = select_meal(food_df, lunch_macros, used_items)
        used_items.extend(lunch)
        logger.info(f"Lunch selected: {lunch}")
    except Exception as e:
        logger.error(f"Error selecting lunch: {e}")
        lunch = []

    logger.info("Selecting dinner...")
    dinner_macros = {k: float(predicted_macros_dict[k] * 0.3) for k in predicted_macros_dict}
    try:
        dinner = select_meal(food_df, dinner_macros, used_items)
        used_items.extend(dinner)
        logger.info(f"Dinner selected: {dinner}")
    except Exception as e:
        logger.error(f"Error selecting dinner: {e}")
        dinner = []

    return {
        'breakfast': {'items': breakfast, 'macros': breakfast_macros},
        'lunch': {'items': lunch, 'macros': lunch_macros},
        'dinner': {'items': dinner, 'macros': dinner_macros},
    }
