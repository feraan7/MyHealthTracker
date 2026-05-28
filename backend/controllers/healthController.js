const { Parser } = require('json2csv');
const HealthData = require('../models/HealthData');
const User = require('../models/User');
const {
    normalizeDate,
    getDateKey,
    getUserGoals,
    calculateBMI,
    calculateStreakStats,
    buildDailySeries,
    buildWeeklyInsights,
    evaluateBadges,
    buildHeatmap,
    buildBadgeCollection,
    buildMoodDistribution,
    buildMoodTrend,
    enrichHealthEntry,
    safeNumber
} = require('../utils/healthAnalytics');
const { emitUserEvent, emitAdminEvent } = require('../utils/socket');

const parseOptionalNumber = (value) => {
    if (value === undefined || value === null || value === '') return undefined;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
};

const validateBodyMetrics = ({ height, weight }) => {
    if (height !== undefined && (height < 50 || height > 250)) {
        return 'Height must be between 50 and 250 cm';
    }

    if (weight !== undefined && (weight < 10 || weight > 300)) {
        return 'Weight must be between 10 and 300 kg';
    }

    return null;
};

const syncUserHealthState = async (userId) => {
    const user = await User.findById(userId);
    if (!user) {
        throw new Error('User not found');
    }

    const entries = await HealthData.find({ user: userId }).sort({ date: 1 });
    const enrichedEntries = entries.map((entry) => enrichHealthEntry(entry.toObject(), user));

    const bulkOperations = enrichedEntries
        .map((entry) => ({
            updateOne: {
                filter: { _id: entry._id },
                update: {
                    $set: {
                        sleepDuration: entry.sleepDuration,
                        deepSleep: entry.deepSleep,
                        remSleep: entry.remSleep,
                        lightSleep: entry.lightSleep,
                        sleepScore: entry.sleepScore,
                        healthPoints: entry.healthPoints,
                        wellnessRating: entry.wellnessRating,
                        bmi: entry.bmi
                    }
                }
            }
        }));

    if (bulkOperations.length) {
        await HealthData.bulkWrite(bulkOperations);
    }

    const streaks = calculateStreakStats(enrichedEntries);
    const earnedBadges = evaluateBadges(enrichedEntries, user, streaks);
    const previousBadges = user.badges || [];
    const unlockedBadges = earnedBadges.filter((badge) => !previousBadges.includes(badge));
    const lastEntry = enrichedEntries[enrichedEntries.length - 1];

    if (lastEntry?.weight) {
        user.weight = lastEntry.weight;
    }

    user.badges = earnedBadges;
    user.streakCount = streaks.currentStreak;
    user.totalPoints = enrichedEntries.reduce((sum, entry) => sum + safeNumber(entry.healthPoints), 0);
    await user.save();

    return {
        user,
        goals: getUserGoals(user),
        entries: enrichedEntries,
        streaks,
        earnedBadges,
        unlockedBadges,
        today: lastEntry || null
    };
};

const buildDashboardPayload = ({ entries, user, streaks, earnedBadges }) => {
    const weeklyInsights = buildWeeklyInsights(entries, user, streaks);
    const weeklyTrend = buildDailySeries(entries, 7);
    const todayKey = new Date().toISOString().slice(0, 10);
    const todayEntry = entries.find((entry) => getDateKey(entry.date) === todayKey) || null;
    const sleepAnalytics = weeklyTrend.map((entry) => ({
        date: entry.date,
        sleepDuration: entry.sleepDuration,
        deepSleep: entry.deepSleep,
        remSleep: entry.remSleep,
        lightSleep: entry.lightSleep,
        sleepScore: entry.sleepScore,
        wellnessRating: entry.wellnessRating
    }));

    return {
        today: todayEntry,
        trend: weeklyTrend,
        sleepAnalytics,
        moodTrend: buildMoodTrend(entries, 7),
        moodDistribution: buildMoodDistribution(entries.slice(-30)),
        streaks,
        goals: getUserGoals(user),
        badges: buildBadgeCollection(earnedBadges, streaks.currentStreak),
        weeklySummary: weeklyInsights,
        bmi: calculateBMI(user.weight, user.height)
    };
};

const getAllHealthData = async (req, res) => {
    try {
        const records = await HealthData.find({ user: req.user._id }).sort({ date: -1 });
        const user = await User.findById(req.user._id);
        const enriched = records.map((record) => enrichHealthEntry(record.toObject(), user));
        return res.json(enriched);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const getHealthDataByDate = async (req, res) => {
    try {
        const targetDate = normalizeDate(req.params.date);
        const data = await HealthData.findOne({
            user: req.user._id,
            date: targetDate
        });

        if (!data) {
            return res.json({});
        }

        const user = await User.findById(req.user._id);
        return res.json(enrichHealthEntry(data.toObject(), user));
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const upsertHealthData = async (req, res) => {
    try {
        const {
            date,
            waterIntake,
            sleepDuration,
            steps,
            calories,
            weight,
            bmi,
            mood,
            deepSleep,
            remSleep,
            caloriesBurned
        } = req.body;

        const targetDate = normalizeDate(date || new Date());
        let data = await HealthData.findOne({
            user: req.user._id,
            date: targetDate
        });

        const updates = {
            waterIntake: parseOptionalNumber(waterIntake),
            sleepDuration: parseOptionalNumber(sleepDuration),
            steps: parseOptionalNumber(steps),
            calories: parseOptionalNumber(calories),
            weight: parseOptionalNumber(weight),
            bmi: parseOptionalNumber(bmi),
            deepSleep: parseOptionalNumber(deepSleep),
            remSleep: parseOptionalNumber(remSleep),
            caloriesBurned: parseOptionalNumber(caloriesBurned)
        };

        if (data) {
            Object.entries(updates).forEach(([key, value]) => {
                if (value !== undefined) {
                    data[key] = value;
                }
            });

            if (mood !== undefined) {
                data.mood = mood;
            }

            await data.save();
        } else {
            data = await HealthData.create({
                user: req.user._id,
                date: targetDate,
                ...updates,
                mood: mood || ''
            });
        }

        const synced = await syncUserHealthState(req.user._id);
        const savedRecord = synced.entries.find((entry) => getDateKey(entry.date) === getDateKey(targetDate));

        const notification = {
            type: 'wellness',
            title: 'Health log updated',
            message: synced.unlockedBadges.length
                ? `New badge unlocked: ${synced.unlockedBadges.join(', ')}`
                : `You earned ${savedRecord?.healthPoints || 0} HP for this entry.`,
            timestamp: new Date().toISOString()
        };

        emitUserEvent(req.user._id, 'dashboard:update', {
            today: savedRecord,
            profile: {
                streakCount: synced.user.streakCount,
                totalPoints: synced.user.totalPoints,
                badges: synced.user.badges
            },
            unlockedBadges: synced.unlockedBadges
        });
        emitUserEvent(req.user._id, 'notification', notification);
        emitAdminEvent('admin:activity', {
            userId: String(req.user._id),
            type: 'health-log',
            date: targetDate.toISOString()
        });

        return res.json({
            ...savedRecord,
            unlockedBadges: synced.unlockedBadges,
            notification
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const exportHealthData = async (req, res) => {
    try {
        const records = await HealthData.find({ user: req.user._id }).sort({ date: 1 }).lean();
        if (!records.length) {
            return res.status(404).json({ message: 'No data to export' });
        }

        const user = await User.findById(req.user._id);
        const enriched = records.map((record) => enrichHealthEntry(record, user));
        const fields = [
            'date',
            'steps',
            'waterIntake',
            'sleepDuration',
            'deepSleep',
            'remSleep',
            'lightSleep',
            'sleepScore',
            'calories',
            'caloriesBurned',
            'healthPoints',
            'weight',
            'bmi',
            'mood',
            'wellnessRating'
        ];
        const parser = new Parser({ fields });
        const csv = parser.parse(enriched);

        res.header('Content-Type', 'text/csv');
        res.attachment('health_data.csv');
        return res.send(csv);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const getTips = async (req, res) => {
    try {
        const synced = await syncUserHealthState(req.user._id);
        const weeklyInsights = buildWeeklyInsights(synced.entries, synced.user, synced.streaks);
        const tips = [
            ...weeklyInsights.recommendations,
            ...weeklyInsights.praise.map((item) => `Keep it going: ${item}`)
        ].slice(0, 3);

        return res.json({
            tips: tips.length ? tips : ['Stay consistent with your water, sleep, and movement today.']
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const getWeeklyAnalytics = async (req, res) => {
    try {
        const synced = await syncUserHealthState(req.user._id);
        return res.json(buildDashboardPayload(synced));
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const getHeatmapAnalytics = async (req, res) => {
    try {
        const synced = await syncUserHealthState(req.user._id);
        return res.json(buildHeatmap(synced.entries, synced.user));
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const getBadges = async (req, res) => {
    try {
        const synced = await syncUserHealthState(req.user._id);
        return res.json(buildBadgeCollection(synced.earnedBadges, synced.streaks.currentStreak));
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const updateBadges = async (req, res) => {
    try {
        const { badges } = req.body;
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (Array.isArray(badges)) {
            user.badges = [...new Set(badges.filter(Boolean))];
            await user.save();
        }

        return res.json(buildBadgeCollection(user.badges, user.streakCount));
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const getGoals = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('goals height weight streakCount totalPoints badges');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.json({
            goals: getUserGoals(user),
            height: user.height,
            weight: user.weight,
            streakCount: user.streakCount,
            totalPoints: user.totalPoints,
            badges: user.badges
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const updateGoals = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const nextGoals = {
            ...getUserGoals(user),
            ...(req.body.goals || {})
        };

        Object.keys(nextGoals).forEach((key) => {
            nextGoals[key] = safeNumber(nextGoals[key], getUserGoals(user)[key]);
        });

        user.goals = nextGoals;

        const height = parseOptionalNumber(req.body.height);
        const weight = parseOptionalNumber(req.body.weight);
        const metricsError = validateBodyMetrics({ height, weight });
        if (metricsError) {
            return res.status(400).json({ message: metricsError });
        }

        if (height !== undefined) user.height = height;
        if (weight !== undefined) {
            user.weight = weight;
            const todayDate = normalizeDate(new Date());
            let todayEntry = await HealthData.findOne({ user: req.user._id, date: todayDate });
            if (todayEntry) {
                todayEntry.weight = weight;
                await todayEntry.save();
            } else {
                await HealthData.create({
                    user: req.user._id,
                    date: todayDate,
                    weight
                });
            }
        }

        await user.save();

        const synced = await syncUserHealthState(req.user._id);
        emitUserEvent(req.user._id, 'dashboard:update', {
            goals: synced.goals,
            profile: {
                streakCount: synced.user.streakCount,
                totalPoints: synced.user.totalPoints,
                badges: synced.user.badges
            }
        });

        return res.json({
            goals: synced.goals,
            height: synced.user.height,
            weight: synced.user.weight,
            bmi: calculateBMI(synced.user.weight, synced.user.height)
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const updateHydration = async (req, res) => {
    try {
        const targetDate = normalizeDate(req.body.date || new Date());
        let data = await HealthData.findOne({ user: req.user._id, date: targetDate });

        if (!data) {
            data = await HealthData.create({ user: req.user._id, date: targetDate, waterIntake: 0 });
        }

        if (req.body.waterIntake !== undefined) {
            data.waterIntake = Math.max(safeNumber(req.body.waterIntake), 0);
        } else {
            data.waterIntake = Math.max(safeNumber(data.waterIntake) + safeNumber(req.body.delta, 1), 0);
        }

        await data.save();
        const synced = await syncUserHealthState(req.user._id);
        const savedRecord = synced.entries.find((entry) => getDateKey(entry.date) === getDateKey(targetDate));

        emitUserEvent(req.user._id, 'dashboard:update', { today: savedRecord });

        return res.json(savedRecord);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const updateMood = async (req, res) => {
    try {
        const targetDate = normalizeDate(req.body.date || new Date());
        let data = await HealthData.findOne({ user: req.user._id, date: targetDate });

        if (!data) {
            data = await HealthData.create({ user: req.user._id, date: targetDate, mood: req.body.mood || '' });
        } else {
            data.mood = req.body.mood || '';
            await data.save();
        }

        const synced = await syncUserHealthState(req.user._id);
        const savedRecord = synced.entries.find((entry) => getDateKey(entry.date) === getDateKey(targetDate));

        emitUserEvent(req.user._id, 'dashboard:update', { today: savedRecord });

        return res.json(savedRecord);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

module.exports = {
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
    updateMood,
    syncUserHealthState,
    buildDashboardPayload
};
