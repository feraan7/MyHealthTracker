import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, Bell, CheckCircle2, Info, XCircle } from 'lucide-react';

const ToastContext = createContext(null);

export const useToast = () => useContext(ToastContext);

const toastMeta = {
    success: { icon: CheckCircle2, accent: 'var(--success)' },
    error: { icon: XCircle, accent: 'var(--danger)' },
    info: { icon: Info, accent: 'var(--primary-color)' },
    warning: { icon: AlertCircle, accent: 'var(--warning)' }
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    const [notifications, setNotifications] = useState([]);

    const removeToast = useCallback((id) => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
    }, []);

    const pushToast = useCallback((message, type = 'info', title = '') => {
        const id = `${Date.now()}-${Math.random()}`;
        const nextToast = { id, message, type, title };
        setToasts((current) => [nextToast, ...current].slice(0, 4));
        window.setTimeout(() => removeToast(id), 3600);
    }, [removeToast]);

    const pushNotification = useCallback((payload = {}) => {
        const id = payload.id || `${Date.now()}-${Math.random()}`;
        const notification = {
            id,
            type: payload.type || 'info',
            title: payload.title || 'Update',
            message: payload.message || '',
            timestamp: payload.timestamp || new Date().toISOString(),
            read: false
        };

        setNotifications((current) => [notification, ...current].slice(0, 12));
        pushToast(notification.message || notification.title, notification.type, notification.title);
    }, [pushToast]);

    const markAllNotificationsRead = useCallback(() => {
        setNotifications((current) => current.map((item) => ({ ...item, read: true })));
    }, []);

    const unreadCount = notifications.filter((item) => !item.read).length;

    const value = useMemo(() => ({
        pushToast,
        pushNotification,
        notifications,
        unreadCount,
        markAllNotificationsRead
    }), [markAllNotificationsRead, notifications, pushNotification, pushToast, unreadCount]);

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div className="toast-stack">
                <AnimatePresence>
                    {toasts.map((toast) => {
                        const meta = toastMeta[toast.type] || toastMeta.info;
                        const Icon = meta.icon;

                        return (
                            <motion.div
                                key={toast.id}
                                className="toast-card glass-panel"
                                initial={{ opacity: 0, y: -12, scale: 0.96 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.96 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className="toast-icon" style={{ background: meta.accent }}>
                                    <Icon size={16} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    {toast.title ? <div className="toast-title">{toast.title}</div> : null}
                                    <div className="toast-message">{toast.message}</div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};

export const NotificationBellEmptyState = () => (
    <div className="notification-empty">
        <Bell size={18} />
        No new notifications yet.
    </div>
);
