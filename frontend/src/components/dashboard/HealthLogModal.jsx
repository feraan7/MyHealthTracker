import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { moodOptions } from '../../utils/health';

const initialState = {
    waterIntake: '',
    sleepDuration: '',
    deepSleep: '',
    remSleep: '',
    steps: '',
    calories: '',
    caloriesBurned: '',
    weight: '',
    mood: ''
};

export default function HealthLogModal({ open, initialValues, onClose, onSubmit }) {
    const [formData, setFormData] = useState(initialState);

    useEffect(() => {
        if (!open) return;
        setFormData({
            ...initialState,
            ...Object.fromEntries(
                Object.entries(initialValues || {}).map(([key, value]) => [key, value ?? ''])
            )
        });
    }, [initialValues, open]);

    const updateField = (key, value) => {
        setFormData((current) => ({ ...current, [key]: value }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        onSubmit(formData);
    };

    return (
        <AnimatePresence>
            {open ? (
                <motion.div
                    className="modal-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div
                        className="glass-panel modal-card"
                        initial={{ opacity: 0, y: 16, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.98 }}
                    >
                        <div className="modal-header">
                            <div>
                                <h2 className="text-h2" style={{ marginBottom: '0.25rem' }}>Log Today&apos;s Health</h2>
                                <p className="text-body">Update your core stats, sleep stages, and recovery markers.</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-cols-2 sm-grid-cols-1">
                                <div className="form-group">
                                    <label className="form-label">Water Intake (glasses)</label>
                                    <input type="number" className="input-field" value={formData.waterIntake} onChange={(event) => updateField('waterIntake', event.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Sleep Duration (hours)</label>
                                    <input type="number" step="0.1" className="input-field" value={formData.sleepDuration} onChange={(event) => updateField('sleepDuration', event.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Deep Sleep Hours</label>
                                    <input type="number" step="0.1" className="input-field" value={formData.deepSleep} onChange={(event) => updateField('deepSleep', event.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">REM Sleep Hours</label>
                                    <input type="number" step="0.1" className="input-field" value={formData.remSleep} onChange={(event) => updateField('remSleep', event.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Steps Count</label>
                                    <input type="number" className="input-field" value={formData.steps} onChange={(event) => updateField('steps', event.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Calories Intake</label>
                                    <input type="number" className="input-field" value={formData.calories} onChange={(event) => updateField('calories', event.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Calories Burned</label>
                                    <input type="number" className="input-field" value={formData.caloriesBurned} onChange={(event) => updateField('caloriesBurned', event.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Weight (kg)</label>
                                    <input type="number" step="0.1" className="input-field" value={formData.weight} onChange={(event) => updateField('weight', event.target.value)} />
                                </div>
                                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                    <label className="form-label">Mood</label>
                                    <div className="mood-grid">
                                        {moodOptions.map((option) => (
                                            <button
                                                key={option.value}
                                                type="button"
                                                className={`mood-button ${formData.mood === option.value ? 'active' : ''}`}
                                                onClick={() => updateField('mood', option.value)}
                                            >
                                                <span style={{ fontSize: '1.2rem' }}>{option.emoji}</span>
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={onClose} className="btn btn-outline">Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Data</button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            ) : null}
        </AnimatePresence>
    );
}
