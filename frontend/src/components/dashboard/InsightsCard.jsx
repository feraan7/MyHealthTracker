import React from 'react';
import { Brain, ShieldAlert, Sparkles } from 'lucide-react';

const renderList = (items, emptyText) => {
    if (!items?.length) {
        return <p className="text-body">{emptyText}</p>;
    }

    return items.map((item) => (
        <div key={item} className="insight-pill">
            {item}
        </div>
    ));
};

export default function InsightsCard({ summary, tips = [] }) {
    return (
        <div className="glass-panel section-card">
            <div className="section-header">
                <div>
                    <h2 className="text-h2" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Brain color="var(--primary-color)" /> AI Wellness Insights
                    </h2>
                    <p className="text-body">Rule-based recommendations, risk alerts, and positive reinforcement messages.</p>
                </div>
            </div>

            <div className="grid grid-cols-2 sm-grid-cols-1">
                <div className="insight-panel">
                    <div className="insight-panel-title"><Sparkles size={16} color="var(--success)" /> Weekly Summary</div>
                    <p className="text-body">{summary.summary}</p>
                    {renderList(summary.praise, 'Positive reinforcement will appear here as you build momentum.')}
                </div>
                <div className="insight-panel">
                    <div className="insight-panel-title"><ShieldAlert size={16} color="var(--danger)" /> Risk Alerts</div>
                    {renderList(summary.alerts, 'No immediate risk alerts detected this week.')}
                </div>
            </div>

            <div className="grid grid-cols-2 sm-grid-cols-1" style={{ marginTop: '1rem' }}>
                <div className="insight-panel">
                    <div className="insight-panel-title">Recommendations</div>
                    {renderList(summary.recommendations, 'Fresh recommendations will appear after more logs are available.')}
                </div>
                <div className="insight-panel">
                    <div className="insight-panel-title">Daily Recommendations</div>
                    {renderList(tips, 'Daily recommendations will appear here.')}
                </div>
            </div>
        </div>
    );
}
