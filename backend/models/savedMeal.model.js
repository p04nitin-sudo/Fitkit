const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const savedMealSchema = new Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: { type: String, required: true, trim: true },
  mealType: {
    type: String,
    enum: ['breakfast', 'lunch', 'dinner', 'snack'],
    default: 'snack'
  },
  calories: { type: Number, required: true, min: 0 },
  protein: { type: Number, default: 0, min: 0 },
  carbs: { type: Number, default: 0, min: 0 },
  fat: { type: Number, default: 0, min: 0 }
}, {
  timestamps: true,
});

const SavedMeal = mongoose.model('SavedMeal', savedMealSchema);

module.exports = SavedMeal;
