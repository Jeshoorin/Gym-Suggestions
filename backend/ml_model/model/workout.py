import pandas as pd
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Dropout
from tensorflow.keras.callbacks import EarlyStopping
from tensorflow.keras.losses import mse
from tensorflow.keras.utils import register_keras_serializable
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
import logging
import joblib
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('model.workout')

INTENSITY_MAP = {'low': 3, 'moderate': 6, 'medium': 6, 'high': 9}
FITNESS_EXERCISE_LIMIT = {'beginner': 4, 'intermediate': 6, 'advanced': 8}

@register_keras_serializable()
def mse_registered(y_true, y_pred):
    return mse(y_true, y_pred)

def load_user_feedback(username, feedback_csv='data/feedback_logs.csv', exercise_csv='data/exercise_items.csv'):
    logger.info(f"Loading feedback logs for user: {username} from {feedback_csv}")
    feedback_df = pd.read_csv(feedback_csv)
    exercise_df = pd.read_csv(exercise_csv)

    merged_df = feedback_df.merge(
        exercise_df[['ExerciseName', 'ExerciseType', 'TargetMuscle']],
        left_on='exercise_name', right_on='ExerciseName', how='left'
    )

    user_df = merged_df[merged_df['username'] == username].sort_values(by='date', ascending=False)
    if user_df.empty:
        logger.error(f"No feedback logs found for user {username}")
        raise ValueError(f"No feedback logs found for user {username}")
    latest = user_df.iloc[0]
    prev = user_df.iloc[1] if len(user_df) > 1 else None
    logger.info(f"Latest feedback date: {latest['date']}, Previous feedback date: {prev['date'] if prev is not None else 'None'}")
    return latest, prev

def compute_progressive_overload(current, previous):
    if previous is None:
        logger.info("No previous feedback available; progressive overload set to 0.0")
        return 0.0
    curr_vol = float(current['actual_reps']) * float(current['actual_weight']) * float(current['number_of_sets'])
    prev_vol = float(previous['actual_reps']) * float(previous['actual_weight']) * float(previous['number_of_sets'])
    if prev_vol == 0:
        logger.warning("Previous volume is zero, progressive overload set to 0.0 to avoid division by zero")
        return 0.0
    overload = (curr_vol - prev_vol) / prev_vol
    logger.info(f"Computed progressive overload: {overload:.4f}")
    return overload

def compute_workload_by_body_part(current_exercise, volume):
    try:
        muscle_group = current_exercise.get('TargetMuscle', 'Unknown')
        return muscle_group, volume
    except Exception as e:
        logger.warning(f"Could not compute workload by body part: {e}")
        return "Unknown", volume

def preprocess_features(current, previous):
    try:
        logger.info(f"Preprocessing features for user exercise data, current date: {current['date']}")
        intensity = INTENSITY_MAP.get(str(current['intensity']).lower(), 6.0)
        gender = 1 if current['gender'].lower() == 'male' else 0
        fitness_level = {'beginner': 0, 'intermediate': 1, 'advanced': 2}.get(current['fitness_level'].lower(), 1)

        features = [
            float(current['pain_level']),
            float(intensity),
            gender,
            fitness_level,
            float(current['bicep_cm']), float(current['chest_cm']), float(current['shoulder_cm']), float(current['lat_cm']),
            float(current['waist_cm']), float(current['abs_cm']), float(current['thigh_cm']), float(current['calf_cm']),
            float(current['blood_sugar_mg_dl']), float(current['cholesterol_mg_dl']),
            float(current['height_cm']), float(current['weight_kg'])
        ]

        bmi = features[-1] / ((features[-2]/100) ** 2)
        waist_to_height = features[8] / features[-2]
        volume = float(current['actual_reps']) * float(current['actual_weight']) * float(current['number_of_sets'])
        est_1rm = float(current['actual_weight']) * (1 + float(current['actual_reps']) / 30)
        overload = compute_progressive_overload(current, previous)
        _, bodypart_volume = compute_workload_by_body_part(current, volume)

        features += [bmi, waist_to_height, volume, est_1rm, overload, bodypart_volume]
        logger.info(f"Feature vector shape: {np.array(features).shape}")
        return np.array(features).reshape(1, -1)
    except Exception as e:
        logger.error(f"Error in preprocessing: {e}")
        raise ValueError(f"Error in preprocessing: {e}")

def build_model(input_dim, output_dim):
    logger.info(f"Building model with input dim {input_dim} and output dim {output_dim}")
    model = Sequential([
        Dense(128, activation='relu', input_shape=(input_dim,)),
        Dropout(0.2),
        Dense(64, activation='relu'),
        Dropout(0.2),
        Dense(output_dim)
    ])
    model.compile(optimizer='adam', loss=mse_registered)
    return model

def load_model_and_scalers(model_path='models/workout_model.h5', scaler_X_path='models/scaler_X.pkl', scaler_y_path='models/scaler_y.pkl'):
    logger.info("Loading model and scalers from disk")
    model = tf.keras.models.load_model(model_path, custom_objects={'mse_registered': mse_registered})
    scaler_X = joblib.load(scaler_X_path)
    scaler_y = joblib.load(scaler_y_path)
    logger.info("Model and scalers loaded successfully")
    return model, scaler_X, scaler_y

def balanced_exercise_selection(candidates, num_per_type=2):
    selected = []

    for target_type in ["Upper", "Lower", "Core"]:
        subset = candidates[candidates["type"] == target_type]
        subset = subset.drop_duplicates(subset=["name"])  # avoid repeats
        if len(subset) == 0:
            continue
        sampled = subset.sample(n=min(num_per_type, len(subset)), random_state=42)
        selected.extend(sampled.to_dict(orient="records"))

    return selected

def recommend_workout(username, model=None, scaler_X=None, scaler_y=None, exercise_csv='data/exercise_items.csv', feedback_csv='data/feedback_logs.csv'):
    logger.info(f"Generating workout recommendation for user: {username}")
    current, previous = load_user_feedback(username, feedback_csv, exercise_csv)
    X_input = preprocess_features(current, previous)
    X_scaled = scaler_X.transform(X_input)

    fitness_level = current['fitness_level'].lower()
    max_exercises = FITNESS_EXERCISE_LIMIT.get(fitness_level, 6)
    logger.info(f"User fitness level: {fitness_level}, max exercises allowed: {max_exercises}")

    exercise_df = pd.read_csv(exercise_csv)
    outputs = []

    # Predict scores for all exercises
    for i, (_, row) in enumerate(exercise_df.iterrows()):
        pred = model.predict(X_scaled, verbose=0)
        y_pred = scaler_y.inverse_transform(pred)[0]
        outputs.append({
            'name': row['ExerciseName'],
            'type': row['ExerciseType'],
            'reps': int(round(y_pred[0])),
            'weight': int(round(y_pred[1])),
            'muscle_group': row.get('TargetMuscle', 'Unknown')
        })

    # Convert to DataFrame for easier filtering and sampling
    outputs_df = pd.DataFrame(outputs)

    # Enforce muscle group balance: pick equal numbers per group (2 each by default)
    balanced_selection = balanced_exercise_selection(outputs_df, num_per_type=2)

    # If less than max_exercises after balancing (due to lack of enough exercises), pad with top scoring remaining
    if len(balanced_selection) < max_exercises:
        balanced_names = [e['name'] for e in balanced_selection]
        remaining = outputs_df[~outputs_df['name'].isin(balanced_names)]
        # Sort remaining by reps+weight sum descending (or any other scoring you want)
        remaining = remaining.copy()
        remaining['score'] = remaining['reps'] + remaining['weight']
        remaining_sorted = remaining.sort_values(by='score', ascending=False)
        to_add = remaining_sorted.head(max_exercises - len(balanced_selection)).to_dict(orient='records')
        balanced_selection.extend(to_add)

    # Trim to max_exercises just in case
    final_recommendations = balanced_selection[:max_exercises]

    logger.info(f"Workout recommendation generated with {len(final_recommendations)} exercises")
    return final_recommendations

def train_workout_model(csv_path='data/feedback_logs.csv',
                        exercise_csv='data/exercise_items.csv',
                        save_dir='models',
                        sample_frac=1.0,
                        batch_size=64,
                        epochs=50,
                        verbose=1):
    logger.info("Starting training of workout recommendation model")
    feedback_df = pd.read_csv(csv_path)
    exercise_df = pd.read_csv(exercise_csv)
    df = feedback_df.merge(
        exercise_df[['ExerciseName', 'ExerciseType', 'TargetMuscle']],
        left_on='exercise_name', right_on='ExerciseName', how='left'
    )

    if sample_frac < 1.0:
        df = df.sample(frac=sample_frac, random_state=42).reset_index(drop=True)
        logger.info(f"Sampled {len(df)} rows from feedback logs for training")

    df['intensity'] = df['intensity'].astype(str).str.lower().map(INTENSITY_MAP)
    if df['intensity'].isnull().any():
        missing_vals = df[df['intensity'].isnull()]['intensity']
        logger.error(f"Unmapped intensity values found: {missing_vals.unique()}")
        raise ValueError(f"Unmapped intensity values found: {missing_vals.unique()}")

    df['pain_level'] = pd.to_numeric(df['pain_level'], errors='coerce')
    df['gender'] = LabelEncoder().fit_transform(df['gender'])
    df['fitness_level'] = LabelEncoder().fit_transform(df['fitness_level'])
    df.dropna(inplace=True)
    logger.info(f"Data cleaned, remaining samples: {len(df)}")

    df['bmi'] = df['weight_kg'] / (df['height_cm'] / 100) ** 2
    df['waist_to_height'] = df['waist_cm'] / df['height_cm']
    df['volume'] = df['actual_reps'] * df['actual_weight'] * df['number_of_sets']
    df['est_1rm'] = df['actual_weight'] * (1 + df['actual_reps'] / 30)

    df.sort_values(['username', 'date'], ascending=[True, True], inplace=True)
    df['overload'] = df.groupby('username')['volume'].pct_change().fillna(0)
    logger.info("Computed overload feature")

    df['bodypart_volume'] = df['volume']

    features = ['pain_level', 'intensity', 'gender', 'fitness_level', 'bicep_cm', 'chest_cm', 'shoulder_cm', 'lat_cm',
                'waist_cm', 'abs_cm', 'thigh_cm', 'calf_cm', 'blood_sugar_mg_dl', 'cholesterol_mg_dl', 'height_cm',
                'weight_kg', 'bmi', 'waist_to_height', 'volume', 'est_1rm', 'overload', 'bodypart_volume']
    targets = ['actual_reps', 'actual_weight']

    X = df[features].values
    y = df[targets].values

    scaler_X = StandardScaler()
    scaler_y = StandardScaler()
    X_scaled = scaler_X.fit_transform(X)
    y_scaled = scaler_y.fit_transform(y)

    X_train, X_val, y_train, y_val = train_test_split(X_scaled, y_scaled, test_size=0.2, random_state=42)
    logger.info(f"Split data into train ({len(X_train)}) and val ({len(X_val)})")

    model = build_model(input_dim=X.shape[1], output_dim=y.shape[1])

    early_stop = EarlyStopping(monitor='val_loss', patience=5, restore_best_weights=True)
    history = model.fit(X_train, y_train,
                        validation_data=(X_val, y_val),
                        epochs=epochs,
                        batch_size=batch_size,
                        verbose=verbose,
                        callbacks=[early_stop])
    logger.info(f"Training completed after {len(history.history['loss'])} epochs")

    os.makedirs(save_dir, exist_ok=True)
    model.save(os.path.join(save_dir, 'workout_model.h5'))
    joblib.dump(scaler_X, os.path.join(save_dir, 'scaler_X.pkl'))
    joblib.dump(scaler_y, os.path.join(save_dir, 'scaler_y.pkl'))
    logger.info(f"Model and scalers saved to {save_dir}")

    return model, scaler_X, scaler_y
