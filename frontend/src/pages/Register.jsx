import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { HeartPulse, Mail, Lock, User, Ruler, Weight } from 'lucide-react';

export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');
    const [error, setError] = useState('');
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        const parsedHeight = height ? Number(height) : undefined;
        const parsedWeight = weight ? Number(weight) : undefined;

        if (parsedHeight !== undefined && (parsedHeight < 50 || parsedHeight > 250)) {
            setError('Height must be between 50 and 250 cm.');
            return;
        }

        if (parsedWeight !== undefined && (parsedWeight < 10 || parsedWeight > 300)) {
            setError('Weight must be between 10 and 300 kg.');
            return;
        }

        const res = await register(name, email, password, {
            height: parsedHeight,
            weight: parsedWeight
        });
        if (!res.success) {
            setError(res.message);
        } else {
            navigate('/');
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '2rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <HeartPulse color="var(--primary-color)" size={48} style={{ margin: '0 auto' }} />
                    <h1 className="text-h2" style={{ marginTop: '1rem' }}>Create Account</h1>
                    <p className="text-body">Join us to start your wellness journey</p>
                </div>

                {error && <div style={{ padding: '0.75rem', background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', marginBottom: '1rem', border: '1px solid var(--danger)' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <div style={{ position: 'relative' }}>
                            <User size={18} style={{ position: 'absolute', top: '12px', left: '12px', color: 'var(--text-secondary)' }} />
                            <input type="text" className="input-field" style={{ paddingLeft: '2.5rem' }} value={name} onChange={e => setName(e.target.value)} required />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', top: '12px', left: '12px', color: 'var(--text-secondary)' }} />
                            <input type="email" className="input-field" style={{ paddingLeft: '2.5rem' }} value={email} onChange={e => setEmail(e.target.value)} required />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', top: '12px', left: '12px', color: 'var(--text-secondary)' }} />
                            <input type="password" className="input-field" style={{ paddingLeft: '2.5rem' }} value={password} onChange={e => setPassword(e.target.value)} minLength="6" required />
                        </div>
                    </div>
                    <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Height (cm)</label>
                            <div style={{ position: 'relative' }}>
                                <Ruler size={18} style={{ position: 'absolute', top: '12px', left: '12px', color: 'var(--text-secondary)' }} />
                                <input type="number" min="50" max="250" className="input-field" style={{ paddingLeft: '2.5rem' }} value={height} onChange={e => setHeight(e.target.value)} placeholder="170" />
                            </div>
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Weight (kg)</label>
                            <div style={{ position: 'relative' }}>
                                <Weight size={18} style={{ position: 'absolute', top: '12px', left: '12px', color: 'var(--text-secondary)' }} />
                                <input type="number" min="10" max="300" step="0.1" className="input-field" style={{ paddingLeft: '2.5rem' }} value={weight} onChange={e => setWeight(e.target.value)} placeholder="70" />
                            </div>
                        </div>
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>Register</button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-secondary)' }}>
                    Already have an account? <Link to="/login" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 600 }}>Sign In</Link>
                </p>
            </div>
        </div>
    );
}
