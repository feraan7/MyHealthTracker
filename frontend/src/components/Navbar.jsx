import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { HeartPulse, Moon, Sun, LogOut, Shield, Bell, Flame } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useToast, NotificationBellEmptyState } from './ui/ToastProvider';
import { getInitials } from '../utils/health';

export default function Navbar() {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { notifications, unreadCount, markAllNotificationsRead } = useToast();
    const [showNotifications, setShowNotifications] = React.useState(false);

    return (
        <nav className="navbar">
            <div className="nav-brand">
                <HeartPulse color="var(--secondary-color)" size={28} />
                HealthTracker
            </div>
            <div className="nav-links">
                {user?.role === 'admin' && (
                    <Link to="/admin" className="btn btn-outline" style={{ color: 'var(--success)' }}>
                        <Shield size={16} /> Admin Panel
                    </Link>
                )}
                <div className="nav-pill nav-pill-streak">Streak {user?.streakCount || 0}</div>
                <div className="nav-pill nav-pill-hp"><Flame size={14} /> {user?.totalPoints || 0} HP</div>
                <div className="notification-shell">
                    <button
                        type="button"
                        onClick={() => {
                            setShowNotifications((current) => !current);
                            markAllNotificationsRead();
                        }}
                        className="btn btn-outline notification-button"
                    >
                        <Bell size={18} />
                        {unreadCount ? <span className="notification-count">{unreadCount}</span> : null}
                    </button>
                    <AnimatePresence>
                        {showNotifications ? (
                            <motion.div
                                className="notification-panel glass-panel"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                            >
                                <div className="notification-panel-head">
                                    <strong>Notifications</strong>
                                </div>
                                {notifications.length ? notifications.map((item) => (
                                    <div key={item.id} className="notification-item">
                                        <div className={`notification-dot ${item.read ? 'read' : ''}`} />
                                        <div>
                                            <div className="notification-title">{item.title}</div>
                                            <div className="notification-message">{item.message}</div>
                                        </div>
                                    </div>
                                )) : <NotificationBellEmptyState />}
                            </motion.div>
                        ) : null}
                    </AnimatePresence>
                </div>
                <div className="user-avatar">{getInitials(user?.name)}</div>
                <span style={{ fontWeight: 500 }}>Hello, {user?.name}</span>
                <button onClick={toggleTheme} className="btn btn-outline" style={{ padding: '0.4rem', borderRadius: '50%' }}>
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                <button onClick={logout} className="btn btn-primary">
                    <LogOut size={16} /> Logout
                </button>
            </div>
        </nav>
    );
}
