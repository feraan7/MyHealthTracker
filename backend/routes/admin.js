const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const { getStats, getUsers, getAnalytics } = require('../controllers/adminController');

router.get('/stats', protect, admin, getStats);
router.get('/analytics', protect, admin, getAnalytics);
router.get('/users', protect, admin, getUsers);

module.exports = router;
