import React from 'react';
import { motion } from 'framer-motion';

export default function StatCard({ label, value, goal, suffix, icon, accent = 'var(--primary-color)' }) {
    const progress = goal ? Math.min((Number(value || 0) / Number(goal)) * 100, 100) : 0;

    return (
        <motion.div
            className="glass-panel stat-card"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
        >
            <div className="stat-header">
                <div>
                    <div className="stat-label">{label}</div>
                    <div className="stat-value">
                        {value}
                        <span className="stat-suffix">{suffix}</span>
                    </div>
                </div>
                <div className="stat-icon-shell" style={{ background: accent }}>
                    {icon}
                </div>
            </div>
            <div className="progress-rail">
                <div className="progress-track" style={{ width: `${progress}%`, background: accent }} />
            </div>
            <div className="card-footnote">Goal: {goal}</div>
        </motion.div>
    );
}
