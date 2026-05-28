import React from 'react';
import {
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';
import { Trophy } from 'lucide-react';
import { formatChartDate } from '../../utils/health';

export default function WeeklyHPTrendCard({ data = [] }) {
    const chartData = data.map((item) => ({
        label: formatChartDate(item.date),
        healthPoints: item.healthPoints
    }));

    return (
        <div className="glass-panel section-card">
            <div className="section-header">
                <div>
                    <h2 className="text-h2" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Trophy color="var(--success)" /> Weekly HP Trend
                    </h2>
                    <p className="text-body">Your gamified wellness score across the week.</p>
                </div>
            </div>
            <div style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                        <XAxis dataKey="label" stroke="var(--text-secondary)" />
                        <YAxis stroke="var(--text-secondary)" />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                borderColor: 'var(--border-color)',
                                borderRadius: '16px'
                            }}
                        />
                        <Line type="monotone" dataKey="healthPoints" stroke="#22c55e" strokeWidth={3} dot={{ r: 4 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
