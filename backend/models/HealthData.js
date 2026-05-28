const mongoose = require('mongoose');

const healthDataSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    waterIntake: { type: Number, default: 0 }, // in glasses or ml
    sleepDuration: { type: Number, default: 0 }, // in hours
    steps: { type: Number, default: 0 },
    calories: { type: Number, default: 0 },
    weight: { type: Number }, // in kg/lbs
    bmi: { type: Number },
    mood: {
        type: String,
        enum: [
            'Happy',
            'Neutral',
            'Sad',
            'Stressed',
            'Energetic',
            'Excellent',
            'Good',
            'Okay',
            'Low',
            'Calm',
            'Tired',
            ''
        ],
        default: ''
    },
    deepSleep: { type: Number, default: 0 },
    remSleep: { type: Number, default: 0 },
    healthPoints: { type: Number, default: 0 },
    sleepScore: { type: Number, default: 0 },
    lightSleep: { type: Number, default: 0 },
    caloriesBurned: { type: Number, default: 0 },
    wellnessRating: { type: String, default: 'Poor' },
}, { timestamps: true });

// Ensure one entry per user per day
healthDataSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('HealthData', healthDataSchema);
