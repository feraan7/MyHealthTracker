import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../components/ui/ToastProvider';
import axios from 'axios';
import { Activity, Calendar as CalIcon, Download, Flame, Moon, Plus, Droplets } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import StatCard from '../components/dashboard/StatCard';
import DashboardTabs from '../components/dashboard/DashboardTabs';
import HealthLogModal from '../components/dashboard/HealthLogModal';
import WeeklyActivityCard from '../components/dashboard/WeeklyActivityCard';
import HPProgressCard from '../components/dashboard/HPProgressCard';
import HydrationTrackerCard from '../components/dashboard/HydrationTrackerCard';
import MoodTrackerCard from '../components/dashboard/MoodTrackerCard';
import BMIAnalyticsCard from '../components/dashboard/BMIAnalyticsCard';
import GoalProgressCard from '../components/dashboard/GoalProgressCard';
import WeeklyHPTrendCard from '../components/dashboard/WeeklyHPTrendCard';
import SleepMonitorCard from '../components/dashboard/SleepMonitorCard';
import HeatmapCard from '../components/dashboard/HeatmapCard';
import BadgesCard from '../components/dashboard/BadgesCard';
import InsightsCard from '../components/dashboard/InsightsCard';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import { formatLongDate } from '../utils/health';

export default function Dashboard() {
    const { user, refreshProfile, updateUser } = useAuth();
    const { socket } = useSocket();
    const { pushToast } = useToast();
    const [healthData, setHealthData] = useState([]);
    const [dashboard, setDashboard] = useState(null);
    const [heatmap, setHeatmap] = useState({ days: [], summary: {} });
    const [tips, setTips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [activeMetric, setActiveMetric] = useState('steps');
    const [savingHydration, setSavingHydration] = useState(false);
    const [savingGoals, setSavingGoals] = useState(false);
    const [isModalOpen, setModalOpen] = useState(false);

    const headers = useMemo(() => ({
        Authorization: `Bearer ${user.token}`
    }), [user.token]);

    const loadDashboard = async () => {
        try {
            setLoading(true);
            const [
                recordsResponse,
                dashboardResponse,
                heatmapResponse,
                tipsResponse
            ] = await Promise.all([
                axios.get('/api/health', { headers }),
                axios.get('/api/health/weekly', { headers }),
                axios.get('/api/health/heatmap', { headers }),
                axios.get('/api/health/tips', { headers })
            ]);

            const records = Array.isArray(recordsResponse.data) ? [...recordsResponse.data].reverse() : [];
            setHealthData(records);
            setDashboard(dashboardResponse.data);
            setHeatmap(heatmapResponse.data);
            setTips(tipsResponse.data?.tips || []);

            const totalPoints = records.reduce((sum, entry) => sum + (entry.healthPoints || 0), 0);
            updateUser({
                streakCount: dashboardResponse.data?.streaks?.currentStreak || 0,
                badges: dashboardResponse.data?.badges?.badges?.filter((badge) => badge.earned).map((badge) => badge.name) || [],
                totalPoints
            });
        } catch (err) {
            console.error(err);
            pushToast('Could not load dashboard analytics.', 'error', 'Dashboard Error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboard();
    }, [headers]);

    useEffect(() => {
        if (!socket) return undefined;

        const refreshFromSocket = async () => {
            await loadDashboard();
            await refreshProfile();
        };

        socket.on('dashboard:update', refreshFromSocket);

        return () => {
            socket.off('dashboard:update', refreshFromSocket);
        };
    }, [refreshProfile, socket]);

    const handleSubmit = async (formData) => {
        try {
            const asNumber = (value) => {
                if (value === '' || value === null || value === undefined) return undefined;
                const parsed = Number(value);
                return Number.isNaN(parsed) ? undefined : parsed;
            };

            const weight = asNumber(formData.weight);
            const heightCm = user?.height;
            const heightMeters = heightCm ? heightCm / 100 : undefined;
            const bmi = weight !== undefined && heightMeters ? Number((weight / (heightMeters * heightMeters)).toFixed(1)) : undefined;

            const payload = {
                waterIntake: asNumber(formData.waterIntake),
                sleepDuration: asNumber(formData.sleepDuration),
                deepSleep: asNumber(formData.deepSleep),
                remSleep: asNumber(formData.remSleep),
                steps: asNumber(formData.steps),
                calories: asNumber(formData.calories),
                caloriesBurned: asNumber(formData.caloriesBurned),
                weight,
                mood: formData.mood || undefined,
                bmi
            };
            Object.keys(payload).forEach((key) => payload[key] === undefined && delete payload[key]);

            const { data: savedData } = await axios.post('/api/health', payload, {
                headers
            });

            setModalOpen(false);
            await loadDashboard();
            await refreshProfile();

            if (savedData?.unlockedBadges?.length) {
                pushToast(`Unlocked ${savedData.unlockedBadges.join(', ')}`, 'success', 'Badge Earned');
            } else {
                pushToast('Today’s health data has been saved.', 'success', 'Log Updated');
            }
        } catch (err) {
            console.error(err);
            pushToast(err.response?.data?.message || 'Could not save health details. Please try again.', 'error', 'Save Failed');
        }
    };

    const handleExport = () => {
        try {
            const doc = new jsPDF();
            doc.setFontSize(20);
            doc.setTextColor(30, 41, 59);
            doc.text('Health & Wellness Report', 14, 22);

            const tableColumn = ["Date", "Steps", "Water", "Sleep (hrs)", "Calories", "Weight(kg)", "Mood"];
            const tableRows = [];

            const sortedData = [...healthData].sort((a, b) => new Date(a.date) - new Date(b.date));
            sortedData.forEach((entry) => {
                tableRows.push([
                    new Date(entry.date).toLocaleDateString(),
                    entry.steps || 0,
                    entry.waterIntake || 0,
                    entry.sleepDuration || 0,
                    entry.calories || 0,
                    entry.weight || '-',
                    entry.mood || '-'
                ]);
            });

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 30,
                theme: 'striped',
                headStyles: { fillColor: [59, 130, 246] },
                styles: { fontSize: 10, cellPadding: 3 }
            });

            doc.save('health_report.pdf');
        } catch (err) {
            console.error('Export failed', err);
        }
    };

    const updateHydration = async (nextValue) => {
        try {
            setSavingHydration(true);
            await axios.put('/api/health/hydration', { waterIntake: nextValue }, { headers });
            await loadDashboard();
            await refreshProfile();
        } catch (error) {
            pushToast('Could not update hydration right now.', 'error', 'Hydration Update');
        } finally {
            setSavingHydration(false);
        }
    };

    const updateMood = async (mood) => {
        try {
            await axios.put('/api/health/mood', { mood }, { headers });
            await loadDashboard();
        } catch (error) {
            pushToast('Could not save mood right now.', 'error', 'Mood Update');
        }
    };

    const saveGoals = async (form) => {
        try {
            setSavingGoals(true);
            const asNumber = (value) => {
                if (value === '' || value === null || value === undefined) return undefined;
                const parsed = Number(value);
                return Number.isNaN(parsed) ? undefined : parsed;
            };

            const parsedHeight = asNumber(form.height);
            const parsedWeight = asNumber(form.weight);

            if (parsedHeight !== undefined && (parsedHeight < 50 || parsedHeight > 250)) {
                pushToast('Height must be between 50 and 250 cm.', 'error', 'Validation Error');
                return;
            }

            if (parsedWeight !== undefined && (parsedWeight < 10 || parsedWeight > 300)) {
                pushToast('Weight must be between 10 and 300 kg.', 'error', 'Validation Error');
                return;
            }

            await axios.put('/api/health/goals', {
                goals: {
                    steps: asNumber(form.steps),
                    water: asNumber(form.water),
                    sleep: asNumber(form.sleep),
                    calories: asNumber(form.calories)
                },
                height: parsedHeight,
                weight: parsedWeight
            }, { headers });
            await loadDashboard();
            await refreshProfile();
            pushToast('Goals updated successfully.', 'success', 'Goals Saved');
        } catch (error) {
            pushToast('Could not save goals right now.', 'error', 'Goals Update');
        } finally {
            setSavingGoals(false);
        }
    };

    const todayData = dashboard?.today || null;
    const statCards = [
        { label: 'Daily Steps', value: todayData?.steps || 0, icon: <Activity size={22} color="white" />, goal: dashboard?.goals?.steps || 10000, suffix: ' steps', accent: '#f59e0b' },
        { label: 'Water Intake', value: todayData?.waterIntake || 0, icon: <Droplets size={22} color="white" />, goal: dashboard?.goals?.water || 8, suffix: ' glasses', accent: '#3b82f6' },
        { label: 'Sleep Duration', value: todayData?.sleepDuration || 0, icon: <Moon size={22} color="white" />, goal: dashboard?.goals?.sleep || 8, suffix: ' hrs', accent: '#8b5cf6' },
        { label: 'Calories Burned', value: todayData?.caloriesBurned || 0, icon: <Flame size={22} color="white" />, goal: dashboard?.goals?.calories || 500, suffix: ' kcal', accent: '#ef4444' }
    ];
    const tabs = [
        { id: 'overview', label: 'Overview' },
        { id: 'sleep', label: 'Sleep Monitor' },
        { id: 'activity', label: 'Activity Heatmap' },
        { id: 'achievements', label: 'Achievements' }
    ];

    if (loading || !dashboard) {
        return (
            <div>
                <div style={{ marginBottom: '2rem' }}>
                    <h1 className="text-h1">Dashboard</h1>
                    <LoadingSkeleton lines={2} />
                </div>
                <div className="grid grid-cols-4 md-grid-cols-2 sm-grid-cols-1">
                    {Array.from({ length: 4 }, (_, index) => (
                        <div key={index} className="glass-panel stat-card">
                            <LoadingSkeleton lines={4} />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 className="text-h1" style={{ marginBottom: '0.25rem' }}>Dashboard</h1>
                    <p className="text-body"><CalIcon size={16} style={{ display: 'inline', verticalAlign: 'text-bottom' }} /> {formatLongDate(new Date())}</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button onClick={handleExport} className="btn btn-outline" style={{ padding: '0.75rem 1.5rem', fontSize: '1.1rem' }}>
                        <Download size={20} /> Export Report
                    </button>
                    <button onClick={() => setModalOpen(true)} className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', fontSize: '1.1rem' }}>
                        <Plus size={20} /> Log Health Data
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-4 md-grid-cols-2 sm-grid-cols-1" style={{ marginBottom: '2rem' }}>
                {statCards.map((stat) => (
                    <StatCard key={stat.label} {...stat} />
                ))}
            </div>

            <DashboardTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

            {activeTab === 'overview' ? (
                <>
                    <div className="grid grid-cols-3 md-grid-cols-1" style={{ marginBottom: '1.5rem' }}>
                        <div style={{ gridColumn: 'span 2' }}>
                            <WeeklyActivityCard data={dashboard.trend} metric={activeMetric} onMetricChange={setActiveMetric} />
                        </div>
                        <HPProgressCard
                            today={todayData}
                            totalPoints={user?.totalPoints}
                            streakCount={dashboard.streaks.currentStreak}
                            wellnessLabel={todayData?.wellnessRating}
                        />
                    </div>

                    <div className="grid grid-cols-3 md-grid-cols-1" style={{ marginBottom: '1.5rem' }}>
                        <HydrationTrackerCard
                            value={todayData?.waterIntake}
                            goal={dashboard.goals.water}
                            onChange={updateHydration}
                            saving={savingHydration}
                        />
                        <MoodTrackerCard
                            selectedMood={todayData?.mood}
                            onSelectMood={updateMood}
                            trend={dashboard.moodTrend}
                        />
                        <BMIAnalyticsCard bmi={dashboard.bmi} height={user?.height} weight={user?.weight} />
                    </div>

                    <div className="grid grid-cols-2 md-grid-cols-1" style={{ marginBottom: '1.5rem' }}>
                        <GoalProgressCard
                            goals={dashboard.goals}
                            today={todayData}
                            profile={user}
                            onSave={saveGoals}
                            saving={savingGoals}
                        />
                        <WeeklyHPTrendCard data={dashboard.trend} />
                    </div>

                    <InsightsCard summary={dashboard.weeklySummary} tips={tips} />
                </>
            ) : null}

            {activeTab === 'sleep' ? (
                <SleepMonitorCard data={dashboard.sleepAnalytics} today={todayData} />
            ) : null}

            {activeTab === 'activity' ? (
                <div className="grid grid-cols-1">
                    <HeatmapCard heatmap={heatmap} />
                </div>
            ) : null}

            {activeTab === 'achievements' ? (
                <div className="grid grid-cols-1">
                    <BadgesCard badges={dashboard.badges} />
                </div>
            ) : null}

            <HealthLogModal
                open={isModalOpen}
                initialValues={todayData}
                onClose={() => setModalOpen(false)}
                onSubmit={handleSubmit}
            />
        </div>
    );
}
