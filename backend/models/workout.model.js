const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const workoutSchema = new Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: { type: String, required: true },
  duration: { type: Number, required: true, min: 0 },
  caloriesBurned: { type: Number, default: 0, min: 0 },
  type: {
    type: String,
    enum: ['cardio', 'strength', 'flexibility', 'sports', 'other'],
    default: 'other'
  },
  date: { type: Date, required: true, default: Date.now }
}, {
  timestamps: true,
});

const Workout = mongoose.model('Workout', workoutSchema);

module.exports = Workout;
