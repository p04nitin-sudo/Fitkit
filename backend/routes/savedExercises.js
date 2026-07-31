const router = require('express').Router();
const SavedExercise = require('../models/savedExercise.model');
const auth = require('../middleware/auth');

router.use(auth);

router.route('/').get((req, res) => {
  SavedExercise.find({ user: req.userId })
    .sort({ name: 1 })
    .then(exercises => res.json(exercises))
    .catch(err => res.status(400).json({ error: 'Error: ' + err }));
});

router.route('/add').post((req, res) => {
  const { name, type, caloriesPerMin } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Exercise name is required' });
  }

  const exercise = new SavedExercise({
    user: req.userId,
    name: name.trim(),
    type: type || 'other',
    caloriesPerMin: Number(caloriesPerMin) || 0
  });

  exercise.save()
    .then(() => res.json({ message: 'Exercise saved!', exercise }))
    .catch(err => res.status(400).json({ error: 'Error: ' + err }));
});

router.route('/:id').delete((req, res) => {
  SavedExercise.findOneAndDelete({ _id: req.params.id, user: req.userId })
    .then(exercise => {
      if (!exercise) return res.status(404).json({ error: 'Exercise not found' });
      res.json({ message: 'Exercise deleted.' });
    })
    .catch(err => res.status(400).json({ error: 'Error: ' + err }));
});

module.exports = router;
