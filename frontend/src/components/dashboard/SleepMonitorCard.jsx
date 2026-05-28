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
import { MoonStar } from 'lucide-react';
import { formatChartDate, sleepQualityClass } from '../../utils/health';

export default function SleepMonitorCard({ data = [], today }) {
    const chartData = data.map((item) => ({
        label: formatChartDate(item.date),
        deepSleep: item.deepSleep,
        remSleep: item.remSleep,
        lightSleep: item.lightSleep,
        sleepScore: item.sleepScore
    }));

    return (
        <div className="glass-panel section-card">
            <div className="section-header">
                <div>
                    <h2 className="text-h2" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <MoonStar color="var(--primary-color)" /> Sleep Monitor
                    </h2>
                    <p className="text-body">Deep, REM, and light sleep analytics for the last 7 days.</p>
                </div>
                <span className={`pill ${sleepQualityClass(today?.sleepQuality)}`}>{today?.sleepQuality || 'Poor'}</span>
            </div>

            <div className="sleep-summary">
                <div className="sleep-score-shell">
                    <div className="sleep-score">{today?.sleepScore || 0}</div>
                    <span className="text-body">Sleep Quality Score</span>
                </div>
                <div className="sleep-stage-list">
                    <div className="sleep-stage-item"><span>Deep Sleep</span><strong>{today?.deepSleep || 0} hrs</strong></div>
                    <div className="sleep-stage-item"><span>REM Sleep</span><strong>{today?.remSleep || 0} hrs</strong></div>
                    <div className="sleep-stage-item"><span>Light Sleep</span><strong>{today?.lightSleep || 0} hrs</strong></div>
                </div>
            </div>

            <div style={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
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
                        <Bar dataKey="deepSleep" stackId="sleep" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                        <Bar dataKey="remSleep" stackId="sleep" fill="#a855f7" />
                        <Bar dataKey="lightSleep" stackId="sleep" fill="#64748b" />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 sm-grid-cols-1" style={{ marginTop: '1rem' }}>
                <div className="sleep-insight-panel">
                    <h3 className="text-h3">Insights</h3>
                    {(today?.sleepInsights || []).map((item) => (
                        <p key={item} className="text-body">{item}</p>
                    ))}
                </div>
                <div className="sleep-insight-panel">
                    <h3 className="text-h3">Recommendations</h3>
                    {(today?.sleepRecommendations || []).map((item) => (
                        <p key={item} className="text-body">{item}</p>
                    ))}
                </div>
            </div>
        </div>
    );
}
