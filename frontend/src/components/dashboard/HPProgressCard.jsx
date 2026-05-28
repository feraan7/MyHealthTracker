import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Trophy } from 'lucide-react';

export default function HPProgressCard({ today, totalPoints, streakCount, wellnessLabel }) {
    const score = today?.healthPoints || 0;
    const gradient = `conic-gradient(#22c55e ${score}%, rgba(148, 163, 184, 0.18) 0)`;

    return (
        <div className="glass-panel section-card hp-card">
            <div className="section-header" style={{ marginBottom: '1.5rem' }}>
                <div>
                    <h2 className="text-h2">Health Points</h2>
                    <p className="text-body">Your daily HP and wellness rating update automatically.</p>
                </div>
                <span className="pill pill-success">{wellnessLabel || 'Poor'}</span>
            </div>

            <motion.div
                className="hp-ring-shell"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                style={{ background: gradient }}
            >
                <div className="hp-ring-core">
                    <span className="hp-score">{score}</span>
                    <span className="text-body">/ 100 HP</span>
                </div>
            </motion.div>

            <div className="insight-stack">
                <div className="mini-insight">
                    <Sparkles size={16} color="var(--primary-color)" />
                    <span>Total wellness points: <strong>{totalPoints || 0}</strong></span>
                </div>
                <div className="mini-insight">
                    <Trophy size={16} color="var(--warning)" />
                    <span>Current streak: <strong>{streakCount || 0} days</strong></span>
                </div>
            </div>
        </div>
    );
}
