import { format } from 'date-fns';

export const moodOptions = [
    { value: 'Excellent', label: 'Excellent', emoji: '😁', color: '#22c55e' },
    { value: 'Good', label: 'Good', emoji: '🙂', color: '#3b82f6' },
    { value: 'Okay', label: 'Okay', emoji: '😐', color: '#f59e0b' },
    { value: 'Low', label: 'Low', emoji: '😔', color: '#f97316' },
    { value: 'Stressed', label: 'Stressed', emoji: '😣', color: '#ef4444' }
];

export const metricOptions = [
    { key: 'steps', label: 'Steps', color: '#f59e0b' },
    { key: 'waterIntake', label: 'Water', color: '#3b82f6' },
    { key: 'sleepDuration', label: 'Sleep', color: '#8b5cf6' },
    { key: 'calories', label: 'Calories', color: '#ef4444' },
    { key: 'healthPoints', label: 'HP', color: '#22c55e' }
];

export const goalLabels = {
    steps: 'Steps',
    water: 'Water',
    sleep: 'Sleep',
    calories: 'Calories'
};

export const getInitials = (name = '') => {
    const [first = '', second = ''] = name.trim().split(/\s+/);
    return `${first[0] || ''}${second[0] || ''}`.toUpperCase() || 'HT';
};

export const formatChartDate = (value) => format(new Date(value), 'EEE');

export const formatLongDate = (value) => format(new Date(value), 'EEEE, MMMM do, yyyy');

export const getMetricMeta = (metric) => {
    return metricOptions.find((item) => item.key === metric) || metricOptions[0];
};

export const calculateGoalProgress = (value, goal) => {
    if (!goal) return 0;
    return Math.min(Math.round((Number(value || 0) / Number(goal)) * 100), 100);
};

export const sleepQualityClass = (label = '') => {
    if (label === 'Excellent') return 'pill-success';
    if (label === 'Good') return 'pill-primary';
    if (label === 'Average') return 'pill-warning';
    return 'pill-danger';
};

export const heatmapColor = (intensity) => {
    if (intensity >= 4) return 'heatmap-4';
    if (intensity === 3) return 'heatmap-3';
    if (intensity === 2) return 'heatmap-2';
    if (intensity === 1) return 'heatmap-1';
    return 'heatmap-0';
};
