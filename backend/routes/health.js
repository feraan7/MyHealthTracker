const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    getAllHealthData,
    getHealthDataByDate,
    upsertHealthData,
    exportHealthData,
    getTips,
    getWeeklyAnalytics,
    getHeatmapAnalytics,
    getBadges,
    updateBadges,
    getGoals,
    updateGoals,
    updateHydration,
    updateMood
} = require('../controllers/healthController');

router.get('/', protect, getAllHealthData);
router.get('/weekly', protect, getWeeklyAnalytics);
router.get('/heatmap', protect, getHeatmapAnalytics);
router.get('/badges', protect, getBadges);
router.put('/badges', protect, updateBadges);
router.get('/goals', protect, getGoals);
router.put('/goals', protect, updateGoals);
router.put('/hydration', protect, updateHydration);
router.put('/mood', protect, updateMood);
router.get('/date/:date', protect, getHealthDataByDate);
router.post('/', protect, upsertHealthData);
router.get('/export', protect, exportHealthData);
router.get('/tips', protect, getTips);

module.exports = router;
