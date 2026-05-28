import React from 'react';
import { motion } from 'framer-motion';

export default function DashboardTabs({ tabs, activeTab, onChange }) {
    return (
        <div className="dashboard-tabs glass-panel">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    type="button"
                    className={`dashboard-tab ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => onChange(tab.id)}
                >
                    {activeTab === tab.id ? (
                        <motion.span
                            layoutId="activeDashboardTab"
                            className="dashboard-tab-bg"
                            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                        />
                    ) : null}
                    <span style={{ position: 'relative', zIndex: 1 }}>{tab.label}</span>
                </button>
            ))}
        </div>
    );
}
