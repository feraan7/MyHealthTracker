import React from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';
import { SmilePlus } from 'lucide-react';
import { moodOptions } from '../../utils/health';

export default function MoodTrackerCard({ selectedMood, onSelectMood, trend = [] }) {
    const chartData = trend.map((item) => ({
        date: item.date.slice(5),
        moodScore: item.moodScore,
        mood: item.mood
    }));

    return (
        <div className="glass-panel section-card">
            <div className="section-header">
                <div>
                    <h2 className="text-h2" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <SmilePlus color="var(--secondary-color)" /> Mood Tracking
                    </h2>
                    <p className="text-body">Choose your mood for today and watch the trend over the week.</p>
                </div>
            </div>

            <div className="mood-grid" style={{ marginBottom: '1rem' }}>
                {moodOptions.map((option) => (
                    <button
                        key={option.value}
                        type="button"
                        className={`mood-button ${selectedMood === option.value ? 'active' : ''}`}
                        onClick={() => onSelectMood(option.value)}
                    >
                        <span style={{ fontSize: '1.2rem' }}>{option.emoji}</span>
                        {option.label}
                    </button>
                ))}
            </div>

            <div style={{ height: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                        <XAxis dataKey="date" stroke="var(--text-secondary)" />
                        <YAxis stroke="var(--text-secondary)" />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                borderColor: 'var(--border-color)',
                                borderRadius: '16px'
                            }}
                        />
                        <Bar dataKey="moodScore" fill="#ec4899" radius={[8, 8, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
