import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Users, Activity, BarChart2, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';

export default function AdminDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);

    useEffect(() => {
        if (!user || user.role !== 'admin') {
            navigate('/');
            return;
        }

        const fetchAdminData = async () => {
            try {
                const { data } = await axios.get('/api/admin/analytics', {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
                setStats(data);
            } catch (err) {
                console.error(err);
            }
        };

        fetchAdminData();
    }, [user, navigate]);

    if (!stats) {
        return (
            <div>
                <h1 className="text-h1" style={{ marginBottom: '2rem' }}>Admin Control Panel</h1>
                <div className="glass-panel section-card">
                    <LoadingSkeleton lines={5} />
                </div>
            </div>
        );
    }

    const moodChartData = Object.entries(stats.moodDistribution || {}).map(([name, value]) => ({ name, value }));
    const badgeChartData = Object.entries(stats.badgeDistribution || {}).map(([name, value]) => ({ name, value }));

    return (
        <div>
            <h1 className="text-h1" style={{ marginBottom: '2rem' }}>Admin Control Panel</h1>

            <div className="grid grid-cols-4 md-grid-cols-2 sm-grid-cols-1" style={{ marginBottom: '2rem' }}>
                <div className="glass-panel stat-card">
                    <div className="stat-header">
                        <div>
                            <div className="stat-label">Total Users</div>
                            <div className="stat-value">{stats.totalUsers}</div>
                        </div>
                        <Users style={{ padding: '8px', borderRadius: '8px', color: 'white' }} size={40} className="color-blue" />
                    </div>
                </div>

                <div className="glass-panel stat-card">
                    <div className="stat-header">
                        <div>
                            <div className="stat-label">Daily Active Users</div>
                            <div className="stat-value">{stats.dailyActiveUsers}</div>
                        </div>
                        <Activity style={{ padding: '8px', borderRadius: '8px', color: 'white' }} size={40} className="color-green" />
                    </div>
                </div>

                <div className="glass-panel stat-card">
                    <div className="stat-header">
                        <div>
                            <div className="stat-label">Avg Health Score</div>
                            <div className="stat-value">{stats.averageHealthScore}</div>
                        </div>
                        <BarChart2 style={{ padding: '8px', borderRadius: '8px', color: 'white' }} size={40} className="color-purple" />
                    </div>
                </div>

                <div className="glass-panel stat-card">
                    <div className="stat-header">
                        <div>
                            <div className="stat-label">Top Streak</div>
                            <div className="stat-value">{stats.topStreakLeaderboard?.[0]?.streakCount || 0}</div>
                        </div>
                        <Award style={{ padding: '8px', borderRadius: '8px', color: 'white' }} size={40} className="color-orange" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 md-grid-cols-1" style={{ marginBottom: '2rem' }}>
                <div className="glass-panel section-card">
                    <h2 className="text-h2" style={{ marginBottom: '1rem' }}>Weekly Platform Activity</h2>
                    <div style={{ height: 280 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={stats.weeklyPlatformActivity}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                                <XAxis dataKey="date" stroke="var(--text-secondary)" />
                                <YAxis stroke="var(--text-secondary)" />
                                <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', borderColor: 'var(--border-color)' }} />
                                <Line dataKey="logs" stroke="#3b82f6" strokeWidth={3} />
                                <Line dataKey="avgHealthPoints" stroke="#22c55e" strokeWidth={3} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="glass-panel section-card">
                    <h2 className="text-h2" style={{ marginBottom: '1rem' }}>Mood Distribution</h2>
                    <div style={{ height: 280 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={moodChartData} dataKey="value" nameKey="name" outerRadius={90}>
                                    {moodChartData.map((entry, index) => (
                                        <Cell key={entry.name} fill={['#3b82f6', '#22c55e', '#a855f7', '#f59e0b', '#ef4444'][index % 5]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', borderColor: 'var(--border-color)' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 md-grid-cols-1">
                <div className="glass-panel section-card">
                    <h2 className="text-h2" style={{ marginBottom: '1rem' }}>Badge Distribution</h2>
                    <div style={{ height: 280 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={badgeChartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                                <XAxis dataKey="name" stroke="var(--text-secondary)" interval={0} angle={-12} textAnchor="end" height={70} />
                                <YAxis stroke="var(--text-secondary)" />
                                <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', borderColor: 'var(--border-color)' }} />
                                <Bar dataKey="value" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="glass-panel section-card">
                    <h2 className="text-h2" style={{ marginBottom: '1rem' }}>Top Streak Leaderboard</h2>
                    <div className="leaderboard-list">
                        {stats.topStreakLeaderboard?.map((entry, index) => (
                            <div key={entry._id} className="leaderboard-row">
                                <div className="leaderboard-rank">#{index + 1}</div>
                                <div>
                                    <div style={{ fontWeight: 600 }}>{entry.name}</div>
                                    <div className="text-body">{entry.streakCount} day streak</div>
                                </div>
                                <div className="pill pill-primary">{entry.totalPoints} HP</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
