export const getWorkoutPlan = (muscleGroup) => {
  const exercises = {
    shoulder: [
      { name: "Shoulder Press", reps: 12, weight: 20 },
      { name: "Lateral Raise", reps: 15, weight: 10 },
      { name: "Front Raise", reps: 12, weight: 10 },
      { name: "Reverse Fly", reps: 10, weight: 15 },
    ]
  };
  return exercises[muscleGroup] || [];
};

export const getDietPlan = () => {
  return ["Oats with milk", "Chicken salad", "Grilled paneer wrap"];
};