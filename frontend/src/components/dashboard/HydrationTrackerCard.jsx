import React from 'react';
import { Droplets } from 'lucide-react';

export default function HydrationTrackerCard({ value = 0, goal = 8, onChange, saving }) {
    const roundedValue = Math.round(Number(value || 0));

    return (
        <div className="glass-panel section-card">
            <div className="section-header">
                <div>
                    <h2 className="text-h2" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Droplets color="var(--primary-color)" /> Hydration Tracker
                    </h2>
                    <p className="text-body">Tap a glass to instantly update today&apos;s water intake.</p>
                </div>
                <span className="pill pill-primary">{roundedValue}/{goal}</span>
            </div>

            <div className="hydration-grid">
                {Array.from({ length: goal }, (_, index) => {
                    const active = index < roundedValue;
                    return (
                        <button
                            key={index}
                            type="button"
                            className={`hydration-glass ${active ? 'active' : ''}`}
                            onClick={() => onChange(active && index === roundedValue - 1 ? index : index + 1)}
                            disabled={saving}
                        >
                            <Droplets size={18} />
                            <span>{index + 1}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
