import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useToast } from '../components/ui/ToastProvider';

const SocketContext = createContext({ socket: null, connected: false });

export const useSocket = () => useContext(SocketContext);

const resolveSocketUrl = () => {
    if (import.meta.env.VITE_SOCKET_URL) {
        return import.meta.env.VITE_SOCKET_URL;
    }

    const { protocol, hostname } = window.location;
    return `${protocol}//${hostname}:5000`;
};

export const SocketProvider = ({ children }) => {
    const { user } = useAuth();
    const { pushNotification } = useToast();
    const [socket, setSocket] = useState(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        if (!user?.token) {
            setSocket(null);
            setConnected(false);
            return undefined;
        }

        const nextSocket = io(resolveSocketUrl(), {
            auth: { token: user.token },
            transports: ['websocket', 'polling']
        });

        nextSocket.on('connect', () => setConnected(true));
        nextSocket.on('disconnect', () => setConnected(false));
        nextSocket.on('notification', (payload) => {
            pushNotification(payload);
        });

        setSocket(nextSocket);

        return () => {
            nextSocket.disconnect();
            setConnected(false);
            setSocket(null);
        };
    }, [pushNotification, user?.token]);

    const value = useMemo(() => ({ socket, connected }), [connected, socket]);

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};
