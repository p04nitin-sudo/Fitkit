const router = require('express').Router();
const SavedMeal = require('../models/savedMeal.model');
const auth = require('../middleware/auth');

router.use(auth);

router.route('/').get((req, res) => {
  SavedMeal.find({ user: req.userId })
    .sort({ mealType: 1, name: 1 })
    .then(meals => res.json(meals))
    .catch(err => res.status(400).json({ error: 'Error: ' + err }));
});

router.route('/add').post((req, res) => {
  const { name, mealType, calories, protein, carbs, fat } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Meal name is required' });
  }

  const meal = new SavedMeal({
    user: req.userId,
    name: name.trim(),
    mealType: mealType || 'snack',
    calories: Number(calories) || 0,
    protein: Number(protein) || 0,
    carbs: Number(carbs) || 0,
    fat: Number(fat) || 0
  });

  meal.save()
    .then(() => res.json({ message: 'Meal saved!', meal }))
    .catch(err => res.status(400).json({ error: 'Error: ' + err }));
});

router.route('/:id').delete((req, res) => {
  SavedMeal.findOneAndDelete({ _id: req.params.id, user: req.userId })
    .then(meal => {
      if (!meal) return res.status(404).json({ error: 'Meal not found' });
      res.json({ message: 'Meal deleted.' });
    })
    .catch(err => res.status(400).json({ error: 'Error: ' + err }));
});

module.exports = router;
