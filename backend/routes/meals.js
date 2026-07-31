const router = require('express').Router();
const Meal = require('../models/meal.model');
const auth = require('../middleware/auth');

function parseLocalDate(str) {
  const [y, m, d] = String(str).split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

router.use(auth);

router.route('/').get((req, res) => {
  Meal.find({ user: req.userId })
    .sort({ date: -1 })
    .then(meals => res.json(meals))
    .catch(err => res.status(400).json({ error: 'Error: ' + err }));
});

router.route('/date/:date').get((req, res) => {
  const start = parseLocalDate(req.params.date);
  if (!start) return res.status(400).json({ error: 'Invalid date' });
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  Meal.find({ user: req.userId, date: { $gte: start, $lt: end } })
    .sort({ date: 1 })
    .then(meals => res.json(meals))
    .catch(err => res.status(400).json({ error: 'Error: ' + err }));
});

router.route('/range').get((req, res) => {
  const days = Number(req.query.days) || 7;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));

  Meal.find({ user: req.userId, date: { $gte: start } })
    .sort({ date: 1 })
    .then(meals => res.json(meals))
    .catch(err => res.status(400).json({ error: 'Error: ' + err }));
});

router.route('/add').post((req, res) => {
  const { name, mealType, calories, protein, carbs, fat, date } = req.body;
  const meal = new Meal({
    user: req.userId,
    name,
    mealType: mealType || 'snack',
    calories: Number(calories) || 0,
    protein: Number(protein) || 0,
    carbs: Number(carbs) || 0,
    fat: Number(fat) || 0,
    date: date ? parseLocalDate(date) || new Date() : new Date()
  });

  meal.save()
    .then(() => res.json({ message: 'Meal added!', meal }))
    .catch(err => res.status(400).json({ error: 'Error: ' + err }));
});

router.route('/:id').delete((req, res) => {
  Meal.findOneAndDelete({ _id: req.params.id, user: req.userId })
    .then(meal => {
      if (!meal) return res.status(404).json({ error: 'Meal not found' });
      res.json({ message: 'Meal deleted.' });
    })
    .catch(err => res.status(400).json({ error: 'Error: ' + err }));
});

module.exports = router;
