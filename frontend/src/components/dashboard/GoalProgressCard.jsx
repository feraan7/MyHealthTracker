import React, { useMemo, useState } from 'react';
import { Flag } from 'lucide-react';
import { calculateGoalProgress, goalLabels } from '../../utils/health';

const blankForm = { steps: '', water: '', sleep: '', calories: '', height: '', weight: '' };

export default function GoalProgressCard({ goals, today, profile, onSave, saving }) {
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState(blankForm);

    const progressItems = useMemo(() => ([
        { key: 'steps', value: today?.steps || 0, suffix: '' },
        { key: 'water', value: today?.waterIntake || 0, suffix: ' glasses' },
        { key: 'sleep', value: today?.sleepDuration || 0, suffix: ' hrs' },
        { key: 'calories', value: today?.caloriesBurned || 0, suffix: ' kcal' }
    ]), [today]);

    const startEditing = () => {
        setForm({
            steps: goals?.steps ?? '',
            water: goals?.water ?? '',
            sleep: goals?.sleep ?? '',
            calories: goals?.calories ?? '',
            height: profile?.height ?? '',
            weight: profile?.weight ?? ''
        });
        setEditing(true);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        await onSave(form);
        setEditing(false);
    };

    return (
        <div className="glass-panel section-card">
            <div className="section-header">
                <div>
                    <h2 className="text-h2" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Flag color="var(--warning)" /> Goal Tracking
                    </h2>
                    <p className="text-body">Track completion and adjust your goals, height, and weight whenever you need.</p>
                </div>
                <button type="button" className="btn btn-outline" onClick={startEditing}>Edit Goals & Metrics</button>
            </div>

            {!editing ? (
                <div className="goal-stack">
                    <div className="goal-row">
                        <div className="goal-row-head">
                            <span>Height</span>
                            <span>{profile?.height ? `${profile.height} cm` : 'Not set'}</span>
                        </div>
                    </div>
                    <div className="goal-row">
                        <div className="goal-row-head">
                            <span>Weight</span>
                            <span>{profile?.weight ? `${profile.weight} kg` : 'Not set'}</span>
                        </div>
                    </div>
                    {progressItems.map((item) => {
                        const goalValue = goals?.[item.key] || 0;
                        const progress = calculateGoalProgress(item.value, goalValue);

                        return (
                            <div key={item.key} className="goal-row">
                                <div className="goal-row-head">
                                    <span>{goalLabels[item.key]}</span>
                                    <span>{item.value}{item.suffix} / {goalValue}</span>
                                </div>
                                <div className="progress-rail">
                                    <div className="progress-track" style={{ width: `${progress}%` }} />
                                </div>
                                {progress >= 80 ? <span className="goal-alert">Milestone alert: you are close to this goal.</span> : null}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="grid grid-cols-2 sm-grid-cols-1">
                    {Object.keys(goalLabels).map((key) => (
                        <div key={key} className="form-group">
                            <label className="form-label">{goalLabels[key]} Goal</label>
                            <input className="input-field" type="number" value={form[key]} onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))} />
                        </div>
                    ))}
                    <div className="form-group">
                        <label className="form-label">Height (cm)</label>
                        <input className="input-field" type="number" min="50" max="250" value={form.height} onChange={(event) => setForm((current) => ({ ...current, height: event.target.value }))} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Weight (kg)</label>
                        <input className="input-field" type="number" min="10" max="300" step="0.1" value={form.weight} onChange={(event) => setForm((current) => ({ ...current, weight: event.target.value }))} />
                    </div>
                    <div className="modal-actions" style={{ gridColumn: 'span 2', marginTop: '0.5rem' }}>
                        <button type="button" className="btn btn-outline" onClick={() => setEditing(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>Save Goals</button>
                    </div>
                </form>
            )}
        </div>
    );
}
