const VEG_MEALS = {
  breakfast: [
    { name: 'Idli with Sambar', calories: 300, protein: 9, carbs: 55, fat: 6 },
    { name: 'Masala Oats', calories: 310, protein: 12, carbs: 48, fat: 8 },
    { name: 'Moong Dal Chilla', calories: 280, protein: 14, carbs: 30, fat: 10 },
    { name: 'Veg Poha', calories: 260, protein: 6, carbs: 42, fat: 8 },
    { name: 'Peanut Butter Toast with Banana', calories: 350, protein: 12, carbs: 45, fat: 14 },
    { name: 'Veg Upma', calories: 280, protein: 7, carbs: 44, fat: 9 },
  ],
  lunch: [
    { name: 'Paneer Rice Bowl', calories: 520, protein: 28, carbs: 62, fat: 16 },
    { name: 'Dal Khichdi with Curd', calories: 480, protein: 20, carbs: 70, fat: 12 },
    { name: 'Chole with 2 Rotis', calories: 550, protein: 22, carbs: 78, fat: 15 },
    { name: 'Rajma with Rice', calories: 540, protein: 22, carbs: 74, fat: 13 },
    { name: 'Veg Biryani with Raita', calories: 500, protein: 18, carbs: 72, fat: 14 },
  ],
  snack: [
    { name: 'Mixed Fruit Bowl', calories: 150, protein: 2, carbs: 36, fat: 1 },
    { name: 'Roasted Chana', calories: 160, protein: 8, carbs: 22, fat: 4 },
    { name: 'Sprouts Salad', calories: 140, protein: 9, carbs: 18, fat: 3 },
    { name: 'Greek Yogurt with Honey', calories: 170, protein: 14, carbs: 20, fat: 4 },
    { name: 'Paneer Tikka (2 pcs)', calories: 180, protein: 15, carbs: 6, fat: 11 },
    { name: 'Mixed Nuts (30g)', calories: 180, protein: 6, carbs: 7, fat: 15 },
  ],
  dinner: [
    { name: 'Palak Paneer with 2 Rotis', calories: 500, protein: 24, carbs: 55, fat: 20 },
    { name: 'Veg Soup with Grilled Sandwich', calories: 420, protein: 16, carbs: 60, fat: 12 },
    { name: 'Dal with 2 Rotis and Salad', calories: 460, protein: 20, carbs: 62, fat: 13 },
    { name: 'Tofu Stir Fry with Rice', calories: 470, protein: 22, carbs: 58, fat: 16 },
    { name: 'Veg Pulao with Raita', calories: 430, protein: 14, carbs: 66, fat: 12 },
  ],
};

const NONVEG_MEALS = {
  breakfast: [
    { name: 'Egg Bhurji with Toast', calories: 340, protein: 20, carbs: 30, fat: 14 },
    { name: 'Two Boiled Eggs with Paratha', calories: 380, protein: 22, carbs: 34, fat: 17 },
    { name: 'Chicken Sausage Sandwich', calories: 360, protein: 24, carbs: 32, fat: 13 },
  ],
  lunch: [
    { name: 'Chicken Rice Bowl', calories: 540, protein: 34, carbs: 60, fat: 14 },
    { name: 'Grilled Chicken with 2 Rotis', calories: 480, protein: 36, carbs: 40, fat: 15 },
    { name: 'Egg Curry with Rice', calories: 500, protein: 26, carbs: 62, fat: 16 },
  ],
  snack: [
    { name: 'Tuna Sandwich', calories: 200, protein: 18, carbs: 22, fat: 6 },
    { name: 'Two Boiled Eggs', calories: 156, protein: 13, carbs: 1, fat: 10 },
    { name: 'Chicken Tikka (2 pcs)', calories: 190, protein: 24, carbs: 4, fat: 9 },
  ],
  dinner: [
    { name: 'Chicken Curry with 2 Rotis', calories: 520, protein: 38, carbs: 45, fat: 18 },
    { name: 'Fish Curry with Rice', calories: 500, protein: 34, carbs: 55, fat: 14 },
    { name: 'Egg Fried Rice', calories: 460, protein: 22, carbs: 62, fat: 14 },
  ],
};

const SPLIT = { breakfast: 0.25, lunch: 0.35, snack: 0.15, dinner: 0.25 };
const SLOT_ORDER = ['breakfast', 'lunch', 'snack', 'dinner'];

function pickMeal(pool, target, dayIdx) {
  const sorted = [...pool].sort((a, b) => Math.abs(a.calories - target) - Math.abs(b.calories - target));
  const candidates = sorted.slice(0, Math.min(3, sorted.length));
  return candidates[dayIdx % candidates.length];
}

function mealPlanFallback({ days, calorieTarget, dietaryPreference }) {
  const pool = dietaryPreference === 'nonveg' ? NONVEG_MEALS : VEG_MEALS;
  const result = [];
  for (let i = 0; i < days; i++) {
    const picked = SLOT_ORDER.map((slot) => ({
      mealType: slot,
      ...pickMeal(pool[slot], Math.round(calorieTarget * SPLIT[slot]), i),
    }));
    const total = picked.reduce((s, m) => s + m.calories, 0);
    const factor = total > 0 ? calorieTarget / total : 1;
    const meals = picked.map((m) => ({
      mealType: m.mealType,
      name: m.name,
      calories: Math.max(1, Math.round(m.calories * factor)),
      protein: Math.max(1, Math.round(m.protein * factor)),
      carbs: Math.max(1, Math.round(m.carbs * factor)),
      fat: Math.max(1, Math.round(m.fat * factor)),
    }));
    result.push({ day: `Day ${i + 1}`, meals });
  }
  return result;
}

const EXERCISE_POOL = {
  warmup: [{ name: 'Brisk Walking', type: 'cardio', met: 4.3, duration: 5 }],
  cooldown: { name: 'Cool-down Stretching', type: 'flexibility', met: 2.3, duration: 5 },
  balanced: [
    { name: 'Running', type: 'cardio', met: 8.0, duration: 20 },
    { name: 'Push-ups', type: 'strength', met: 3.8, duration: 10 },
    { name: 'Squats', type: 'strength', met: 5.0, duration: 10 },
    { name: 'Plank', type: 'strength', met: 3.2, duration: 6 },
    { name: 'Yoga Flow', type: 'flexibility', met: 2.5, duration: 10 },
  ],
  cardio: [
    { name: 'Cycling', type: 'cardio', met: 7.0, duration: 25 },
    { name: 'Jump Rope', type: 'cardio', met: 11.0, duration: 12 },
    { name: 'Running', type: 'cardio', met: 8.0, duration: 20 },
    { name: 'Brisk Walking', type: 'cardio', met: 4.3, duration: 10 },
  ],
  strength: [
    { name: 'Bench Press', type: 'strength', met: 4.5, duration: 15 },
    { name: 'Deadlift', type: 'strength', met: 6.0, duration: 12 },
    { name: 'Lunges', type: 'strength', met: 4.0, duration: 10 },
    { name: 'Dumbbell Curls', type: 'strength', met: 3.5, duration: 8 },
  ],
  flexibility: [
    { name: 'Full-Body Stretching', type: 'flexibility', met: 2.3, duration: 15 },
    { name: 'Yoga Flow', type: 'flexibility', met: 2.5, duration: 20 },
    { name: 'Pilates', type: 'flexibility', met: 3.0, duration: 15 },
  ],
};

const FOCUS_LABELS = { balanced: 'Balanced', cardio: 'Cardio', strength: 'Strength', flexibility: 'Flexibility' };

function makeSession(ex, kg, factor) {
  const calories = Math.round(ex.met * kg * (ex.duration / 60) * factor);
  return { name: ex.name, type: ex.type, duration: ex.duration, caloriesBurned: calories };
}

function savedToExercise(ex) {
  const met = ex.caloriesPerMin > 0 ? (ex.caloriesPerMin * 60) / 70 : 5.0;
  return { name: ex.name, type: ex.type || 'other', met, duration: 15 };
}

function workoutPlanFallback({ days, focus, weightKg, activityLevel, savedExercises }) {
  const template = EXERCISE_POOL[focus] || EXERCISE_POOL.balanced;
  const kg = weightKg || 70;
  const factor = { sedentary: 0.85, light: 0.95, moderate: 1, active: 1.1, veryActive: 1.2 }[activityLevel] || 1;
  const saved = Array.isArray(savedExercises) ? savedExercises.map(savedToExercise) : [];
  const result = [];

  for (let i = 0; i < days; i++) {
    const sessions = [makeSession(EXERCISE_POOL.warmup[0], kg, factor)];

    const start = i % template.length;
    for (let j = 0; j < Math.min(3, template.length); j++) {
      sessions.push(makeSession(template[(start + j) % template.length], kg, factor));
    }

    if (saved.length) {
      sessions.push(makeSession(saved[i % saved.length], kg, factor));
    }

    sessions.push(makeSession(EXERCISE_POOL.cooldown, kg, factor));

    result.push({
      day: `Day ${i + 1}`,
      focus: FOCUS_LABELS[focus] || 'Balanced',
      sessions,
    });
  }
  return result;
}

module.exports = { mealPlanFallback, workoutPlanFallback };
