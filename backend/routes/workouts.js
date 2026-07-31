const router = require('express').Router();
const Workout = require('../models/workout.model');
const auth = require('../middleware/auth');

function parseLocalDate(str) {
  const [y, m, d] = String(str).split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

router.use(auth);

router.route('/').get((req, res) => {
  Workout.find({ user: req.userId })
    .sort({ date: -1 })
    .then(workouts => res.json(workouts))
    .catch(err => res.status(400).json({ error: 'Error: ' + err }));
});

router.route('/range').get((req, res) => {
  const days = Number(req.query.days) || 7;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));

  Workout.find({ user: req.userId, date: { $gte: start } })
    .sort({ date: 1 })
    .then(workouts => res.json(workouts))
    .catch(err => res.status(400).json({ error: 'Error: ' + err }));
});

router.route('/add').post((req, res) => {
  const { name, duration, caloriesBurned, type, date } = req.body;
  const workout = new Workout({
    user: req.userId,
    name,
    duration: Number(duration) || 0,
    caloriesBurned: Number(caloriesBurned) || 0,
    type: type || 'other',
    date: date ? parseLocalDate(date) || new Date() : new Date()
  });

  workout.save()
    .then(() => res.json({ message: 'Workout added!', workout }))
    .catch(err => res.status(400).json({ error: 'Error: ' + err }));
});

router.route('/:id').delete((req, res) => {
  Workout.findOneAndDelete({ _id: req.params.id, user: req.userId })
    .then(workout => {
      if (!workout) return res.status(404).json({ error: 'Workout not found' });
      res.json({ message: 'Workout deleted.' });
    })
    .catch(err => res.status(400).json({ error: 'Error: ' + err }));
});

module.exports = router;
