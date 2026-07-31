const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const auth = require('../middleware/auth');

const ACTIVITY_FACTORS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  veryActive: 1.9
};

function calculateBMR(user) {
  const { weightKg, heightCm, age, gender } = user;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return gender === 'male' ? base + 5 : base - 161;
}

function calculateCalorieGoal(user) {
  const bmr = calculateBMR(user);
  return Math.round(bmr * (ACTIVITY_FACTORS[user.activityLevel] || 1.55));
}

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
}

router.route('/register').post(async (req, res) => {
  try {
    const { username, email, password, name } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      return res.status(400).json({ error: 'User with this email or username already exists' });
    }

    const user = new User({
      username,
      email,
      password,
      name: name || username
    });

    user.dailyCalorieGoal = calculateCalorieGoal(user);
    await user.save();

    const token = signToken(user._id);
    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.name
      }
    });
  } catch (err) {
    res.status(400).json({ error: 'Error: ' + err.message });
  }
});

router.route('/login').post(async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = signToken(user._id);
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.name
      }
    });
  } catch (err) {
    res.status(400).json({ error: 'Error: ' + err.message });
  }
});

router.route('/me').get(auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (err) {
    res.status(400).json({ error: 'Error: ' + err.message });
  }
});

router.route('/profile').put(auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { name, age, heightCm, weightKg, gender, activityLevel } = req.body;
    if (name !== undefined) user.name = name;
    if (age !== undefined) user.age = Number(age);
    if (heightCm !== undefined) user.heightCm = Number(heightCm);
    if (weightKg !== undefined) user.weightKg = Number(weightKg);
    if (gender !== undefined) user.gender = gender;
    if (activityLevel !== undefined) user.activityLevel = activityLevel;

    user.dailyCalorieGoal = calculateCalorieGoal(user);
    await user.save();

    const updated = await User.findById(req.userId).select('-password');
    res.json({ user: updated });
  } catch (err) {
    res.status(400).json({ error: 'Error: ' + err.message });
  }
});

router.route('/:id').get((req, res) => {
  User.findById(req.params.id)
    .then(users => res.json(users))
    .catch(err => res.status(400).json('Error: ' + err));
});

router.route('/').get((req, res) => {
  User.find().select('-password')
    .then(users => res.json(users))
    .catch(err => res.status(400).json('Error: ' + err));
});

router.route('/add').post((req, res) => {
  const username = req.body.username;
  const newUser = new User({ username, email: `${username}@fitkit.local`, password: 'fitkit123' });
  newUser.save()
    .then(() => res.json('User added!'))
    .catch(err => res.status(400).json('Error: ' + err));
});

module.exports = router;
