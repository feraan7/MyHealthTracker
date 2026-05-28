import React from 'react';
import { motion } from 'framer-motion';
import { Award, Lock } from 'lucide-react';

export default function BadgesCard({ badges }) {
    return (
        <div className="glass-panel section-card">
            <div className="section-header">
                <div>
                    <h2 className="text-h2" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Award color="var(--warning)" /> Achievements & Badges
                    </h2>
                    <p className="text-body">Unlocked achievements persist to MongoDB and update in real time.</p>
                </div>
            </div>

            <div className="badge-grid">
                {badges.badges.map((badge) => (
                    <motion.div
                        key={badge.name}
                        className={`badge-card ${badge.earned ? 'earned' : 'locked'}`}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ y: -4 }}
                    >
                        <div className="badge-icon">{badge.earned ? <Award size={18} /> : <Lock size={18} />}</div>
                        <div>
                            <div className="badge-title">{badge.name}</div>
                            <div className="badge-subtitle">{badge.earned ? 'Earned' : 'Locked'}</div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="streak-ring-grid">
                {badges.streakMilestones.map((milestone) => (
                    <div key={milestone.milestone} className="streak-ring-card">
                        <div
                            className="streak-ring"
                            style={{ background: `conic-gradient(#3b82f6 ${milestone.progress}%, rgba(148, 163, 184, 0.15) 0)` }}
                        >
                            <div className="streak-ring-core">{milestone.milestone}</div>
                        </div>
                        <div className="badge-subtitle">{milestone.reached ? 'Reached' : `${milestone.progress}%`}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
