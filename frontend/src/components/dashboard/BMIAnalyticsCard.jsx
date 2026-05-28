import React from 'react';
import { ActivitySquare } from 'lucide-react';

export default function BMIAnalyticsCard({ bmi, height, weight }) {
    const hasMetrics = Boolean(height) && Boolean(weight);

    let statusLabel = 'Height Required';
    if (!height && !weight) {
        statusLabel = 'Metrics Required';
    } else if (!height) {
        statusLabel = 'Height Required';
    } else if (!weight) {
        statusLabel = 'Weight Required';
    }

    return (
        <div className="glass-panel section-card">
            <div className="section-header">
                <div>
                    <h2 className="text-h2" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <ActivitySquare color="var(--success)" /> BMI Analytics
                    </h2>
                    <p className="text-body">Your BMI is calculated from the latest saved weight and profile height.</p>
                </div>
            </div>

            <div className="bmi-highlight">
                <div className="bmi-value">{hasMetrics ? (bmi?.bmi || 0) : '--'}</div>
                <div>
                    <div className="pill pill-primary" style={{ display: 'inline-flex' }}>{hasMetrics ? (bmi?.category || 'Unknown') : statusLabel}</div>
                    <p className="text-body" style={{ marginTop: '0.75rem' }}>
                        {hasMetrics ? bmi?.suggestion : 'Add your height and weight in the Goal Tracking card to unlock accurate BMI analytics.'}
                    </p>
                    <p className="text-body" style={{ marginTop: '0.5rem' }}>
                        Height: {height ? `${height} cm` : 'Not set'} | Weight: {weight ? `${weight} kg` : 'Not set'}
                    </p>
                </div>
            </div>
        </div>
    );
}
