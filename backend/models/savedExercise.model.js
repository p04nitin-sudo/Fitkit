const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const savedExerciseSchema = new Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: { type: String, required: true, trim: true },
  type: {
    type: String,
    enum: ['cardio', 'strength', 'flexibility', 'sports', 'other'],
    default: 'other'
  },
  caloriesPerMin: { type: Number, default: 0, min: 0 }
}, {
  timestamps: true,
});

const SavedExercise = mongoose.model('SavedExercise', savedExerciseSchema);

module.exports = SavedExercise;
