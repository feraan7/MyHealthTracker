import React from 'react';
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import { formatChartDate, getMetricMeta, metricOptions } from '../../utils/health';

export default function WeeklyActivityCard({ data = [], metric, onMetricChange }) {
    const metricMeta = getMetricMeta(metric);
    const chartData = data.map((entry) => ({
        ...entry,
        label: formatChartDate(entry.date)
    }));

    return (
        <div className="glass-panel section-card">
            <div className="section-header">
                <div>
                    <h2 className="text-h2" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <TrendingUp color="var(--primary-color)" /> Activity Overview
                    </h2>
                    <p className="text-body">Switch between your core wellness metrics for the last 7 days.</p>
                </div>
                <div className="metric-switcher">
                    {metricOptions.map((option) => (
                        <button
                            key={option.key}
                            type="button"
                            className={`metric-button ${metric === option.key ? 'active' : ''}`}
                            onClick={() => onMetricChange(option.key)}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ height: 300, marginTop: '1rem' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="metricFill" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={metricMeta.color} stopOpacity={0.85} />
                                <stop offset="95%" stopColor={metricMeta.color} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                        <XAxis dataKey="label" stroke="var(--text-secondary)" />
                        <YAxis stroke="var(--text-secondary)" />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                borderColor: 'var(--border-color)',
                                color: 'var(--text-primary)',
                                borderRadius: '16px'
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey={metric}
                            stroke={metricMeta.color}
                            fillOpacity={1}
                            fill="url(#metricFill)"
                            strokeWidth={3}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
