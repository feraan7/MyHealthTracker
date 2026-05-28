const BADGE_DEFINITIONS = [
    '7-Day Streak',
    'Step Master',
    'Hydro Hero',
    'Sleep King',
    'Cal Crusher',
    'Perfect Day',
    'Energy God',
    'Zen Master'
];

const DEFAULT_GOALS = {
    steps: 10000,
    water: 8,
    sleep: 8,
    calories: 500
};

const MOOD_OPTIONS = [
    'Excellent',
    'Good',
    'Okay',
    'Low',
    'Stressed',
    'Happy',
    'Neutral',
    'Sad',
    'Energetic',
    'Calm',
    'Tired',
    ''
];

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const roundTo = (value, digits = 1) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return 0;
    const factor = 10 ** digits;
    return Math.round(numeric * factor) / factor;
};

const safeNumber = (value, fallback = 0) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
};

const normalizeDate = (value = new Date()) => {
    const parsed = value instanceof Date ? new Date(value) : new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        throw new Error('Invalid date format');
    }

    parsed.setUTCHours(0, 0, 0, 0);
    return parsed;
};

const getDateKey = (value) => normalizeDate(value).toISOString().slice(0, 10);

const listDateKeysBetween = (start, end) => {
    const keys = [];
    const cursor = normalizeDate(start);
    const endDate = normalizeDate(end);

    while (cursor <= endDate) {
        keys.push(getDateKey(cursor));
        cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    return keys;
};

const getUserGoals = (user = {}) => ({
    steps: safeNumber(user?.goals?.steps, DEFAULT_GOALS.steps),
    water: safeNumber(user?.goals?.water, DEFAULT_GOALS.water),
    sleep: safeNumber(user?.goals?.sleep, DEFAULT_GOALS.sleep),
    calories: safeNumber(user?.goals?.calories, DEFAULT_GOALS.calories)
});

const calculateBMI = (weight, heightCm) => {
    const safeWeight = safeNumber(weight);
    const safeHeightCm = safeNumber(heightCm);
    if (!safeWeight || !safeHeightCm) {
        return { bmi: 0, category: 'Unknown', suggestion: 'Add your height and weight to unlock BMI insights.' };
    }

    const heightInMeters = safeHeightCm / 100;
    const bmi = safeWeight / (heightInMeters * heightInMeters);

    if (bmi < 18.5) {
        return { bmi: roundTo(bmi), category: 'Underweight', suggestion: 'A balanced calorie surplus and strength work may help you reach a healthier range.' };
    }

    if (bmi < 25) {
        return { bmi: roundTo(bmi), category: 'Normal', suggestion: 'You are in a healthy BMI range. Maintain the balance with sleep, hydration, and consistent activity.' };
    }

    if (bmi < 30) {
        return { bmi: roundTo(bmi), category: 'Overweight', suggestion: 'A steady activity routine and mindful nutrition can help you move toward a healthier range.' };
    }

    return { bmi: roundTo(bmi), category: 'Obese', suggestion: 'Focus on gradual, sustainable lifestyle changes and consider checking in with a healthcare professional.' };
};

const calculateSleepAnalytics = (payload = {}) => {
    const deepSleep = Math.max(safeNumber(payload.deepSleep), 0);
    const remSleep = Math.max(safeNumber(payload.remSleep), 0);
    const baseSleep = Math.max(safeNumber(payload.sleepDuration), 0);
    const resolvedSleepDuration = Math.max(baseSleep, roundTo(deepSleep + remSleep));
    const lightSleep = roundTo(Math.max(resolvedSleepDuration - deepSleep - remSleep, 0));
    const deepPct = resolvedSleepDuration ? (deepSleep / resolvedSleepDuration) * 100 : 0;
    const remPct = resolvedSleepDuration ? (remSleep / resolvedSleepDuration) * 100 : 0;

    let durationScore = 0;
    if (resolvedSleepDuration >= 8) durationScore = 55;
    else if (resolvedSleepDuration >= 7) durationScore = 48;
    else if (resolvedSleepDuration >= 6) durationScore = 40;
    else if (resolvedSleepDuration >= 4) durationScore = 25;
    else if (resolvedSleepDuration > 0) durationScore = roundTo((resolvedSleepDuration / 4) * 25, 0);

    let deepScore = 0;
    if (deepPct >= 18 && deepPct <= 25) deepScore = 30;
    else if (deepPct >= 15 && deepPct <= 30) deepScore = 24;
    else if (deepPct >= 10 && deepPct <= 35) deepScore = 16;
    else if (deepPct > 0) deepScore = 8;

    let remScore = 0;
    if (remPct >= 20 && remPct <= 30) remScore = 15;
    else if (remPct >= 15 && remPct <= 35) remScore = 10;
    else if (remPct > 0) remScore = 6;

    const sleepScore = clamp(Math.round(durationScore + deepScore + remScore), 0, 100);
    let quality = 'Poor';
    if (sleepScore >= 85) quality = 'Excellent';
    else if (sleepScore >= 70) quality = 'Good';
    else if (sleepScore >= 50) quality = 'Average';

    const insights = [];
    if (resolvedSleepDuration < 7) insights.push('Total sleep is below the recommended recovery range.');
    if (deepPct < 15 && resolvedSleepDuration > 0) insights.push('Deep sleep is on the low side, so recovery may feel lighter.');
    if (remPct < 18 && resolvedSleepDuration > 0) insights.push('REM balance is slightly low, which can affect mental freshness.');
    if (!insights.length && resolvedSleepDuration > 0) insights.push('Your sleep composition looks balanced for recovery and focus.');

    const recommendations = [];
    if (resolvedSleepDuration < 7) recommendations.push('Try winding down 30 minutes earlier tonight to extend total sleep.');
    if (deepPct < 15) recommendations.push('Reduce late caffeine and keep your room cool to support deeper sleep.');
    if (remPct < 18) recommendations.push('A consistent bedtime can improve REM balance over the week.');
    if (!recommendations.length) recommendations.push('Keep your bedtime consistent to preserve the strong sleep pattern.');

    return {
        sleepDuration: roundTo(resolvedSleepDuration),
        deepSleep: roundTo(deepSleep),
        remSleep: roundTo(remSleep),
        lightSleep,
        sleepScore,
        sleepQuality: quality,
        insights,
        recommendations
    };
};

const calculateHealthPoints = (payload = {}, goals = DEFAULT_GOALS) => {
    const steps = Math.max(safeNumber(payload.steps), 0);
    const waterIntake = Math.max(safeNumber(payload.waterIntake), 0);
    const sleepDuration = Math.max(safeNumber(payload.sleepDuration), 0);
    const caloriesBurned = Math.max(safeNumber(payload.caloriesBurned), 0);
    const calorieGoal = safeNumber(goals.calories, DEFAULT_GOALS.calories);

    let stepPoints = 0;
    if (steps >= 10000) stepPoints = 40;
    else if (steps >= 7500) stepPoints = 30;
    else if (steps >= 5000) stepPoints = 20;
    else if (steps >= 2500) stepPoints = 10;

    let waterPoints = 0;
    if (waterIntake >= 8) waterPoints = 20;
    else if (waterIntake >= 6) waterPoints = 15;
    else if (waterIntake >= 4) waterPoints = 10;
    else if (waterIntake >= 2) waterPoints = 5;

    let sleepPoints = 0;
    if (sleepDuration >= 8) sleepPoints = 25;
    else if (sleepDuration >= 6) sleepPoints = 18;
    else if (sleepDuration >= 4) sleepPoints = 10;
    else if (sleepDuration > 0) sleepPoints = 5;

    let caloriePoints = 0;
    if (caloriesBurned >= calorieGoal) caloriePoints = 15;
    else if (caloriesBurned >= calorieGoal * 0.75) caloriePoints = 12;
    else if (caloriesBurned >= calorieGoal * 0.5) caloriePoints = 8;
    else if (caloriesBurned > 0) caloriePoints = 4;

    return {
        steps: stepPoints,
        water: waterPoints,
        sleep: sleepPoints,
        calories: caloriePoints,
        total: clamp(stepPoints + waterPoints + sleepPoints + caloriePoints, 0, 100)
    };
};

const getMoodScore = (mood = '') => {
    const scoreMap = {
        Excellent: 12,
        Energetic: 10,
        Happy: 9,
        Good: 8,
        Calm: 8,
        Neutral: 5,
        Okay: 5,
        Tired: 3,
        Low: 2,
        Sad: 2,
        Stressed: 1
    };

    return scoreMap[mood] ?? 0;
};

const calculateWellnessRating = ({ healthPoints = 0, sleepScore = 0, mood = '' } = {}) => {
    const composite = clamp(Math.round((safeNumber(healthPoints) * 0.7) + (safeNumber(sleepScore) * 0.2) + getMoodScore(mood)), 0, 100);

    if (composite >= 85) return { score: composite, label: 'Excellent' };
    if (composite >= 65) return { score: composite, label: 'Good' };
    if (composite >= 45) return { score: composite, label: 'Average' };
    return { score: composite, label: 'Poor' };
};

const enrichHealthEntry = (entry, user = {}) => {
    const goals = getUserGoals(user);
    const sleepAnalytics = calculateSleepAnalytics(entry);
    const pointBreakdown = calculateHealthPoints({
        ...entry,
        sleepDuration: sleepAnalytics.sleepDuration
    }, goals);
    const bmiDetails = calculateBMI(entry.weight ?? user.weight, user.height);
    const wellness = calculateWellnessRating({
        healthPoints: pointBreakdown.total,
        sleepScore: sleepAnalytics.sleepScore,
        mood: entry.mood
    });

    return {
        ...entry,
        sleepDuration: sleepAnalytics.sleepDuration,
        deepSleep: sleepAnalytics.deepSleep,
        remSleep: sleepAnalytics.remSleep,
        lightSleep: sleepAnalytics.lightSleep,
        sleepScore: sleepAnalytics.sleepScore,
        sleepQuality: sleepAnalytics.sleepQuality,
        sleepInsights: sleepAnalytics.insights,
        sleepRecommendations: sleepAnalytics.recommendations,
        healthPoints: pointBreakdown.total,
        hpBreakdown: pointBreakdown,
        wellnessRating: wellness.label,
        wellnessScore: wellness.score,
        bmi: bmiDetails.bmi,
        bmiCategory: bmiDetails.category,
        bmiSuggestion: bmiDetails.suggestion
    };
};

const calculateStreakStats = (entries = []) => {
    const uniqueKeys = [...new Set(entries.map((entry) => getDateKey(entry.date)))].sort();
    if (!uniqueKeys.length) {
        return { currentStreak: 0, bestStreak: 0, activeDays: 0 };
    }

    let bestStreak = 1;
    let rolling = 1;
    for (let index = 1; index < uniqueKeys.length; index += 1) {
        const previous = normalizeDate(uniqueKeys[index - 1]);
        const current = normalizeDate(uniqueKeys[index]);
        const diffDays = Math.round((current - previous) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            rolling += 1;
            bestStreak = Math.max(bestStreak, rolling);
        } else {
            rolling = 1;
        }
    }

    const today = normalizeDate(new Date());
    const latest = normalizeDate(uniqueKeys[uniqueKeys.length - 1]);
    const gapFromToday = Math.round((today - latest) / (1000 * 60 * 60 * 24));

    let currentStreak = 0;
    if (gapFromToday <= 1) {
        currentStreak = 1;
        for (let index = uniqueKeys.length - 1; index > 0; index -= 1) {
            const current = normalizeDate(uniqueKeys[index]);
            const previous = normalizeDate(uniqueKeys[index - 1]);
            const diffDays = Math.round((current - previous) / (1000 * 60 * 60 * 24));
            if (diffDays === 1) currentStreak += 1;
            else break;
        }
    }

    return {
        currentStreak,
        bestStreak,
        activeDays: uniqueKeys.length
    };
};

const buildMoodTrend = (entries = [], days = 7) => {
    const end = normalizeDate(new Date());
    const start = normalizeDate(new Date(end));
    start.setUTCDate(start.getUTCDate() - (days - 1));
    const keys = listDateKeysBetween(start, end);
    const entryMap = new Map(entries.map((entry) => [getDateKey(entry.date), entry]));

    return keys.map((key) => {
        const entry = entryMap.get(key);
        return {
            date: key,
            mood: entry?.mood || 'No log',
            moodScore: getMoodScore(entry?.mood || '')
        };
    });
};

const buildDailySeries = (entries = [], days = 7) => {
    const end = normalizeDate(new Date());
    const start = normalizeDate(new Date(end));
    start.setUTCDate(start.getUTCDate() - (days - 1));
    const keys = listDateKeysBetween(start, end);
    const entryMap = new Map(entries.map((entry) => [getDateKey(entry.date), entry]));

    return keys.map((key) => {
        const entry = entryMap.get(key);
        return {
            date: key,
            steps: entry?.steps || 0,
            waterIntake: entry?.waterIntake || 0,
            sleepDuration: entry?.sleepDuration || 0,
            calories: entry?.calories || 0,
            caloriesBurned: entry?.caloriesBurned || 0,
            healthPoints: entry?.healthPoints || 0,
            deepSleep: entry?.deepSleep || 0,
            remSleep: entry?.remSleep || 0,
            lightSleep: entry?.lightSleep || 0,
            sleepScore: entry?.sleepScore || 0,
            mood: entry?.mood || '',
            wellnessRating: entry?.wellnessRating || 'Poor'
        };
    });
};

const calculateAverage = (items = [], selector) => {
    if (!items.length) return 0;
    return roundTo(items.reduce((sum, item) => sum + safeNumber(selector(item)), 0) / items.length, 1);
};

const calculatePercentageChange = (current, previous) => {
    const safePrevious = safeNumber(previous);
    if (!safePrevious) return current > 0 ? 100 : 0;
    return roundTo(((current - safePrevious) / safePrevious) * 100, 0);
};

const buildWeeklyInsights = (entries = [], user = {}, streaks = { currentStreak: 0, bestStreak: 0 }) => {
    const dailySeries = buildDailySeries(entries, 14);
    const currentWeek = dailySeries.slice(-7);
    const previousWeek = dailySeries.slice(0, 7);

    const currentWater = calculateAverage(currentWeek, (item) => item.waterIntake);
    const previousWater = calculateAverage(previousWeek, (item) => item.waterIntake);
    const currentSleep = calculateAverage(currentWeek, (item) => item.sleepDuration);
    const previousSleep = calculateAverage(previousWeek, (item) => item.sleepDuration);
    const currentHp = calculateAverage(currentWeek, (item) => item.healthPoints);
    const previousHp = calculateAverage(previousWeek, (item) => item.healthPoints);
    const currentCalories = calculateAverage(currentWeek, (item) => item.calories);
    const calorieTarget = safeNumber(user?.goals?.calories, DEFAULT_GOALS.calories);

    const insights = [];
    const alerts = [];
    const praise = [];
    const recommendations = [];

    const hydrationChange = calculatePercentageChange(currentWater, previousWater);
    if (hydrationChange <= -1) alerts.push(`Hydration dropped ${Math.abs(hydrationChange)}% this week.`);
    else if (hydrationChange >= 1) praise.push(`Hydration improved ${hydrationChange}% this week.`);

    const sleepChange = calculatePercentageChange(currentSleep, previousSleep);
    if (sleepChange >= 1) insights.push('Sleep consistency improved over the last 7 days.');
    else if (sleepChange <= -1) alerts.push('Sleep duration has slipped compared with the previous week.');

    const hpChange = calculatePercentageChange(currentHp, previousHp);
    if (hpChange >= 5) praise.push('Your overall wellness score is trending upward.');
    else if (hpChange <= -5) alerts.push('Health points are trending lower than last week.');

    if (streaks.currentStreak >= 5) praise.push('Excellent activity streak detected.');
    if (currentCalories > calorieTarget * 4) alerts.push('Calories exceeded your recommended daily target on average.');

    if (currentWater < safeNumber(user?.goals?.water, DEFAULT_GOALS.water)) {
        recommendations.push('Aim for one extra glass of water earlier in the day to close your hydration gap.');
    }
    if (currentSleep < safeNumber(user?.goals?.sleep, DEFAULT_GOALS.sleep)) {
        recommendations.push('Try protecting a consistent bedtime to improve your sleep score and recovery.');
    }
    if (calculateAverage(currentWeek, (item) => item.steps) < safeNumber(user?.goals?.steps, DEFAULT_GOALS.steps) * 0.75) {
        recommendations.push('A short evening walk can help lift both your step count and daily points.');
    }
    if (!recommendations.length) {
        recommendations.push('You are on a strong routine. Focus on consistency to keep the momentum going.');
    }

    const summaryParts = [...alerts, ...praise, ...insights].slice(0, 2);

    return {
        alerts,
        praise,
        insights,
        recommendations,
        summary: summaryParts.join(' ') || 'Your wellness trends are stable this week.',
        currentWeekAverages: {
            water: currentWater,
            sleep: currentSleep,
            healthPoints: currentHp
        }
    };
};

const evaluateBadges = (entries = [], user = {}, streaks = { currentStreak: 0 }) => {
    const goals = getUserGoals(user);
    const hasPositiveMoodWeek = entries
        .slice(-7)
        .filter((entry) => ['Excellent', 'Good', 'Happy', 'Energetic', 'Calm'].includes(entry.mood))
        .length >= 4;

    const badges = [];
    if (streaks.currentStreak >= 7) badges.push('7-Day Streak');
    if (entries.some((entry) => safeNumber(entry.steps) >= 10000)) badges.push('Step Master');
    if (entries.some((entry) => safeNumber(entry.waterIntake) >= goals.water)) badges.push('Hydro Hero');
    if (entries.some((entry) => safeNumber(entry.sleepScore) >= 85)) badges.push('Sleep King');
    if (entries.some((entry) => safeNumber(entry.caloriesBurned) >= goals.calories)) badges.push('Cal Crusher');
    if (entries.some((entry) => safeNumber(entry.healthPoints) >= 95 && safeNumber(entry.sleepScore) >= 80)) badges.push('Perfect Day');
    if (entries.some((entry) => safeNumber(entry.healthPoints) >= 100)) badges.push('Energy God');
    if (hasPositiveMoodWeek && entries.slice(-7).every((entry) => safeNumber(entry.sleepDuration) >= 6)) badges.push('Zen Master');

    return BADGE_DEFINITIONS.filter((badge) => badges.includes(badge));
};

const buildHeatmap = (entries = [], user = {}) => {
    const end = normalizeDate(new Date());
    const start = normalizeDate(new Date(end));
    start.setUTCDate(start.getUTCDate() - 83);

    const keys = listDateKeysBetween(start, end);
    const entryMap = new Map(entries.map((entry) => [getDateKey(entry.date), entry]));
    const streaks = calculateStreakStats(entries);
    const goals = getUserGoals(user);

    const days = keys.map((key) => {
        const entry = entryMap.get(key);
        const steps = safeNumber(entry?.steps);
        let intensity = 0;
        if (steps >= goals.steps) intensity = 4;
        else if (steps >= 7500) intensity = 3;
        else if (steps >= 5000) intensity = 2;
        else if (steps >= 2500) intensity = 1;

        return {
            date: key,
            steps,
            healthPoints: safeNumber(entry?.healthPoints),
            intensity
        };
    });

    return {
        days,
        summary: {
            activeDays: streaks.activeDays,
            bestStreak: streaks.bestStreak,
            averageHP: calculateAverage(entries, (entry) => entry.healthPoints),
            totalPointsEarned: entries.reduce((sum, entry) => sum + safeNumber(entry.healthPoints), 0)
        }
    };
};

const buildBadgeCollection = (earnedBadges = [], streakCount = 0) => ({
    badges: BADGE_DEFINITIONS.map((badge) => ({
        name: badge,
        earned: earnedBadges.includes(badge)
    })),
    streakMilestones: [7, 14, 21, 30, 60, 90].map((milestone) => ({
        milestone,
        reached: streakCount >= milestone,
        progress: clamp(Math.round((streakCount / milestone) * 100), 0, 100)
    }))
});

const buildMoodDistribution = (entries = []) => {
    return entries.reduce((accumulator, entry) => {
        const key = entry.mood || 'No log';
        accumulator[key] = (accumulator[key] || 0) + 1;
        return accumulator;
    }, {});
};

module.exports = {
    BADGE_DEFINITIONS,
    DEFAULT_GOALS,
    MOOD_OPTIONS,
    normalizeDate,
    getDateKey,
    getUserGoals,
    calculateBMI,
    calculateSleepAnalytics,
    calculateHealthPoints,
    calculateWellnessRating,
    calculateStreakStats,
    buildDailySeries,
    buildWeeklyInsights,
    evaluateBadges,
    buildHeatmap,
    buildBadgeCollection,
    buildMoodDistribution,
    buildMoodTrend,
    enrichHealthEntry,
    safeNumber,
    roundTo
};
