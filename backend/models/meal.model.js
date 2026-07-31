const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const mealSchema = new Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: { type: String, required: true },
  mealType: {
    type: String,
    enum: ['breakfast', 'lunch', 'dinner', 'snack'],
    default: 'snack'
  },
  calories: { type: Number, required: true, min: 0 },
  protein: { type: Number, default: 0, min: 0 },
  carbs: { type: Number, default: 0, min: 0 },
  fat: { type: Number, default: 0, min: 0 },
  date: { type: Date, required: true, default: Date.now }
}, {
  timestamps: true,
});

const Meal = mongoose.model('Meal', mealSchema);

module.exports = Meal;
