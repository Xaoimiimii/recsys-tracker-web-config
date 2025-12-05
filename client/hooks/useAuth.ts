import React, { useState } from 'react';
import { UserState } from '../types';

export const useAuth = () => {
    const [user, setUser] = useState<UserState>({ 
        isAuthenticated: false, 
        currentUser: null 
    });

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setUser({ 
            isAuthenticated: true, 
            currentUser: { name: 'Demo User', email: 'user@example.com' } 
        });
    };

    const handleLogout = () => {
        setUser({ 
            isAuthenticated: false, 
            currentUser: null 
        });
    };

    return {
        user,
        handleLogin,
        handleLogout,
    };
};
