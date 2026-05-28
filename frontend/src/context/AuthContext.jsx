import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const userRef = useRef(null);
    const authCycleRef = useRef(0);

    const persistUser = useCallback((nextUser) => {
        userRef.current = nextUser;
        setUser(nextUser);

        if (nextUser) {
            localStorage.setItem('userInfo', JSON.stringify(nextUser));
        } else {
            localStorage.removeItem('userInfo');
        }
    }, []);

    const isValidStoredUser = (candidate) => {
        if (!candidate || typeof candidate !== 'object') return false;
        if (typeof candidate.token !== 'string') return false;

        const token = candidate.token.trim();
        if (!token || token === 'undefined' || token === 'null') return false;

        return true;
    };

    useEffect(() => {
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
            try {
                const parsedUser = JSON.parse(userInfo);
                if (isValidStoredUser(parsedUser)) {
                    persistUser(parsedUser);
                } else {
                    localStorage.removeItem('userInfo');
                }
            } catch (error) {
                localStorage.removeItem('userInfo');
            }
        }

        setLoading(false);
    }, [persistUser]);

    useEffect(() => {
        const interceptorId = axios.interceptors.response.use(
            (response) => response,
            (error) => {
                const status = error?.response?.status;
                const message = error?.response?.data?.message || '';

                if (
                    status === 401 &&
                    /token failed|token expired|no token|user not found/i.test(message)
                ) {
                    authCycleRef.current += 1;
                    persistUser(null);
                }

                return Promise.reject(error);
            }
        );

        return () => axios.interceptors.response.eject(interceptorId);
    }, [persistUser]);

    const refreshProfile = useCallback(async (tokenOverride) => {
        const activeToken = tokenOverride || userRef.current?.token;
        if (!activeToken) return null;

        const requestCycle = ++authCycleRef.current;

        try {
            const { data } = await axios.get('/api/auth/me', {
                headers: { Authorization: `Bearer ${activeToken}` }
            });

            const currentUser = userRef.current;
            if (!currentUser?.token || currentUser.token !== activeToken || requestCycle !== authCycleRef.current) {
                return null;
            }

            const nextUser = { ...currentUser, ...data, token: activeToken };
            persistUser(nextUser);
            return nextUser;
        } catch (error) {
            const currentUser = userRef.current;
            const sameSession = currentUser?.token && currentUser.token === activeToken && requestCycle === authCycleRef.current;

            if (sameSession && error?.response?.status === 401) {
                authCycleRef.current += 1;
                persistUser(null);
            }

            return null;
        }
    }, [persistUser]);

    useEffect(() => {
        if (user?.token) {
            refreshProfile(user.token);
        }
    }, [refreshProfile, user?.token]);

    const login = async (email, password) => {
        try {
            const { data } = await axios.post('/api/auth/login', { email, password });
            if (!isValidStoredUser(data)) {
                return { success: false, message: 'Login response is missing a valid token' };
            }

            authCycleRef.current += 1;
            persistUser(data);
            return { success: true };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Login failed' };
        }
    };

    const register = async (name, email, password, profile = {}) => {
        try {
            const { data } = await axios.post('/api/auth/register', { name, email, password, ...profile });
            if (!isValidStoredUser(data)) {
                return { success: false, message: 'Registration response is missing a valid token' };
            }

            authCycleRef.current += 1;
            persistUser(data);
            return { success: true };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Registration failed' };
        }
    };

    const logout = useCallback(() => {
        authCycleRef.current += 1;
        persistUser(null);
    }, [persistUser]);

    const updateUser = useCallback((partialUser) => {
        const currentUser = userRef.current;
        if (!currentUser) return;
        persistUser({ ...currentUser, ...partialUser });
    }, [persistUser]);

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading, refreshProfile, updateUser }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
