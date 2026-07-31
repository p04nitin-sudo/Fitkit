const router = require('express').Router();
const auth = require('../middleware/auth');
const User = require('../models/user.model');
const SavedExercise = require('../models/savedExercise.model');
const Workout = require('../models/workout.model');
const { chatJSON, resolveProvider } = require('../services/ai.service');
const { mealPlanFallback, workoutPlanFallback } = require('../services/aiFallback');

router.use(auth);

function calcCalorieGoal(user) {
  const base = 10 * (user.weightKg || 0) + 6.25 * (user.heightCm || 0) - 5 * (user.age || 0);
  const bmr = user.gender === 'female' ? base - 161 : base + 5;
  const factors = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, veryActive: 1.9 };
  return Math.round(((bmr * (factors[user.activityLevel] || 1.55)) - 500) / 50) * 50;
}

function clampDays(days) {
  return Math.min(Math.max(Number(days) || 1, 1), 7);
}

const VALID_MEAL_TYPES = ['breakfast', 'lunch', 'snack', 'dinner'];
const VALID_EXERCISE_TYPES = ['cardio', 'strength', 'flexibility', 'sports', 'other'];

function sanitizeMealPlan(data, days) {
  if (!Array.isArray(data?.days)) return null;
  const out = [];
  for (const d of data.days.slice(0, days)) {
    if (!Array.isArray(d.meals) || d.meals.length === 0) continue;
    const meals = d.meals
      .filter((m) => m && typeof m.name === 'string' && m.name.trim())
      .map((m) => ({
        mealType: VALID_MEAL_TYPES.includes(m.mealType) ? m.mealType : 'snack',
        name: String(m.name).trim().slice(0, 60),
        calories: Math.max(0, Math.round(Number(m.calories) || 0)),
        protein: Math.max(0, Math.round(Number(m.protein) || 0)),
        carbs: Math.max(0, Math.round(Number(m.carbs) || 0)),
        fat: Math.max(0, Math.round(Number(m.fat) || 0)),
      }));
    if (meals.length === 0) continue;
    out.push({ day: String(d.day || `Day ${out.length + 1}`), meals });
  }
  return out.length ? out : null;
}

function sanitizeWorkoutPlan(data, days) {
  if (!Array.isArray(data?.days)) return null;
  const out = [];
  for (const d of data.days.slice(0, days)) {
    if (!Array.isArray(d.sessions) || d.sessions.length === 0) continue;
    const sessions = d.sessions
      .filter((s) => s && typeof s.name === 'string' && s.name.trim())
      .map((s) => ({
        name: String(s.name).trim().slice(0, 60),
        type: VALID_EXERCISE_TYPES.includes(s.type) ? s.type : 'other',
        duration: Math.max(0, Math.round(Number(s.duration) || 0)),
        caloriesBurned: Math.max(0, Math.round(Number(s.caloriesBurned) || 0)),
      }));
    if (sessions.length === 0) continue;
    out.push({ day: String(d.day || `Day ${out.length + 1}`), focus: String(d.focus || ''), sessions });
  }
  return out.length ? out : null;
}

const MEAL_SYSTEM = `You are a nutrition planner for an Indian fitness app. Create realistic meal plans.
Return ONLY strict JSON matching this schema:
{"days":[{"day":"Day 1","meals":[{"mealType":"breakfast|lunch|snack|dinner","name":"dish name","calories":0,"protein":0,"carbs":0,"fat":0}]}]}
Rules:
- dietaryPreference "veg" means pure vegetarian Indian dishes (no egg/meat/fish); "nonveg" may include egg/chicken/fish.
- Exactly 4 meals per day: breakfast, lunch, snack, dinner.
- Realistic Indian portion sizes and macro values in grams.
- Daily calories should land close to calorieTarget.
- Vary dishes across days; do not repeat a dish on consecutive days.
- Keep meal names simple and recognizable.`;

const WORKOUT_SYSTEM = `You are a personal fitness coach. Create workout plans.
Return ONLY strict JSON matching this schema:
{"days":[{"day":"Day 1","focus":"short focus label","sessions":[{"name":"exercise","type":"cardio|strength|flexibility|sports|other","duration":30,"caloriesBurned":200}]}]}
Rules:
- 4 to 6 sessions per day, always end with a short cool-down/stretch.
- Respect the requested focus: balanced/cardio/strength/flexibility.
- Estimate caloriesBurned with the MET formula using the user's weightKg and duration.
- Keep exercises varied and realistic, mostly no equipment needed.
- Session types must be one of: cardio, strength, flexibility, sports, other.`;

router.route('/meal-plan').post(async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const days = clampDays(req.body.days);
    const calorieTarget = Number(req.body.calorieTarget) || calcCalorieGoal(user);
    const dietaryPreference = req.body.dietaryPreference === 'nonveg' ? 'nonveg' : 'veg';

    const context = {
      age: user.age,
      gender: user.gender,
      weightKg: user.weightKg,
      heightCm: user.heightCm,
      activityLevel: user.activityLevel,
      calorieTarget,
      dietaryPreference,
    };

    const { data } = await chatJSON(MEAL_SYSTEM, JSON.stringify(context));
    const aiPlan = sanitizeMealPlan(data, days);

    if (aiPlan) {
      return res.json({ source: 'ai', provider: resolveProvider(), days: aiPlan, calorieTarget });
    }
    return res.json({
      source: 'fallback',
      provider: resolveProvider(),
      days: mealPlanFallback({ days, calorieTarget, dietaryPreference }),
      calorieTarget,
    });
  } catch (err) {
    res.status(400).json({ error: 'Error: ' + err.message });
  }
});

router.route('/workout-plan').post(async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const days = clampDays(req.body.days);
    const focus = ['cardio', 'strength', 'flexibility'].includes(req.body.focus) ? req.body.focus : 'balanced';

    const savedExercises = await SavedExercise.find({ user: req.userId }).sort({ type: 1 });
    const recentWorkouts = await Workout.find({ user: req.userId }).sort({ date: -1 }).limit(14);

    const context = {
      age: user.age,
      gender: user.gender,
      weightKg: user.weightKg,
      activityLevel: user.activityLevel,
      focus,
      days,
      savedExercises: savedExercises.map((e) => ({ name: e.name, type: e.type, caloriesPerMin: e.caloriesPerMin })),
      recentWorkouts: recentWorkouts.map((w) => ({ name: w.name, type: w.type, duration: w.duration })),
    };

    const { data } = await chatJSON(WORKOUT_SYSTEM, JSON.stringify(context));
    const aiPlan = sanitizeWorkoutPlan(data, days);

    if (aiPlan) {
      return res.json({ source: 'ai', provider: resolveProvider(), days: aiPlan });
    }
    return res.json({
      source: 'fallback',
      provider: resolveProvider(),
      days: workoutPlanFallback({
        days,
        focus,
        weightKg: user.weightKg,
        activityLevel: user.activityLevel,
        savedExercises,
      }),
    });
  } catch (err) {
    res.status(400).json({ error: 'Error: ' + err.message });
  }
});

module.exports = router;
