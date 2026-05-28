import React, { useMemo, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { heatmapColor } from '../../utils/health';

export default function HeatmapCard({ heatmap }) {
    const [hovered, setHovered] = useState(null);

    const weeks = useMemo(() => {
        const chunks = [];
        for (let index = 0; index < heatmap.days.length; index += 7) {
            chunks.push(heatmap.days.slice(index, index + 7));
        }
        return chunks;
    }, [heatmap.days]);

    return (
        <div className="glass-panel section-card">
            <div className="section-header">
                <div>
                    <h2 className="text-h2" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <CalendarDays color="var(--primary-color)" /> Activity Heatmap
                    </h2>
                    <p className="text-body">A GitHub-style view of the last 12 weeks based on logged steps and HP.</p>
                </div>
            </div>

            <div className="heatmap-scroll">
                <div className="heatmap-grid">
                    {weeks.map((week, weekIndex) => (
                        <div key={weekIndex} className="heatmap-week">
                            {week.map((day) => (
                                <button
                                    key={day.date}
                                    type="button"
                                    className={`heatmap-cell ${heatmapColor(day.intensity)}`}
                                    onMouseEnter={() => setHovered(day)}
                                    onMouseLeave={() => setHovered(null)}
                                    title={`${day.date} | ${day.steps} steps | ${day.healthPoints} HP`}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            <div className="heatmap-tooltip glass-panel">
                {hovered ? (
                    <>
                        <strong>{hovered.date}</strong>
                        <span>{hovered.steps} steps</span>
                        <span>{hovered.healthPoints} HP earned</span>
                    </>
                ) : (
                    <span>Hover a day to inspect steps and HP earned.</span>
                )}
            </div>

            <div className="grid grid-cols-4 md-grid-cols-2 sm-grid-cols-1" style={{ marginTop: '1rem' }}>
                <div className="summary-chip">Active Days: <strong>{heatmap.summary.activeDays}</strong></div>
                <div className="summary-chip">Best Streak: <strong>{heatmap.summary.bestStreak}</strong></div>
                <div className="summary-chip">Average HP: <strong>{heatmap.summary.averageHP}</strong></div>
                <div className="summary-chip">Total Points: <strong>{heatmap.summary.totalPointsEarned}</strong></div>
            </div>
        </div>
    );
}
