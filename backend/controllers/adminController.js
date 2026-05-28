const User = require('../models/User');
const HealthData = require('../models/HealthData');
const {
    buildMoodDistribution,
    roundTo
} = require('../utils/healthAnalytics');

const getStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalLogs = await HealthData.countDocuments();
        const recentLogs = await HealthData.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('user', 'name email');

        const averages = await HealthData.aggregate([
            {
                $group: {
                    _id: null,
                    avgSteps: { $avg: '$steps' },
                    avgSleep: { $avg: '$sleepDuration' },
                    avgWater: { $avg: '$waterIntake' }
                }
            }
        ]);

        return res.json({
            totalUsers,
            totalLogs,
            recentLogs,
            averages: averages[0] || { avgSteps: 0, avgSleep: 0, avgWater: 0 }
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const getUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        return res.json(users);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const getAnalytics = async (req, res) => {
    try {
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        const [totalUsers, dailyActiveUsers, users, logs] = await Promise.all([
            User.countDocuments(),
            HealthData.distinct('user', { date: { $gte: today } }).then((items) => items.length),
            User.find().select('-password').lean(),
            HealthData.find().sort({ date: 1 }).lean()
        ]);

        const averageHealthScore = logs.length
            ? roundTo(logs.reduce((sum, log) => sum + (log.healthPoints || 0), 0) / logs.length, 1)
            : 0;

        const moodDistribution = buildMoodDistribution(logs.filter((log) => log.mood));

        const userSummaries = users.map((user) => {
            const userLogs = logs.filter((log) => String(log.user) === String(user._id));
            return {
                _id: String(user._id),
                name: user.name,
                totalSteps: userLogs.reduce((sum, log) => sum + (log.steps || 0), 0),
                totalPoints: user.totalPoints || 0,
                streakCount: user.streakCount || 0
            };
        });

        const mostActiveUsers = [...userSummaries]
            .sort((first, second) => (second.totalPoints - first.totalPoints) || (second.totalSteps - first.totalSteps))
            .slice(0, 5);

        const weeklyPlatformActivity = Array.from({ length: 7 }, (_, index) => {
            const day = new Date(today);
            day.setUTCDate(day.getUTCDate() - (6 - index));
            const key = day.toISOString().slice(0, 10);
            const dayLogs = logs.filter((log) => new Date(log.date).toISOString().slice(0, 10) === key);

            return {
                date: key,
                logs: dayLogs.length,
                avgHealthPoints: dayLogs.length
                    ? roundTo(dayLogs.reduce((sum, log) => sum + (log.healthPoints || 0), 0) / dayLogs.length, 1)
                    : 0
            };
        });

        const badgeDistribution = users.reduce((accumulator, user) => {
            (user.badges || []).forEach((badge) => {
                accumulator[badge] = (accumulator[badge] || 0) + 1;
            });
            return accumulator;
        }, {});

        const topStreakLeaderboard = [...userSummaries]
            .sort((first, second) => second.streakCount - first.streakCount)
            .slice(0, 5);

        return res.json({
            totalUsers,
            dailyActiveUsers,
            averageHealthScore,
            moodDistribution,
            mostActiveUsers,
            weeklyPlatformActivity,
            badgeDistribution,
            topStreakLeaderboard
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getStats,
    getUsers,
    getAnalytics
};
