// import React, { useState } from 'react';
// import { UserState } from '../types';

// export const useAuth = () => {
//     const [user, setUser] = useState<UserState>({
//         isAuthenticated: false,
//         currentUser: null
//     });

//     const handleLogin = (e: React.FormEvent) => {
//         e.preventDefault();
//         setUser({
//             isAuthenticated: true,
//             currentUser: { name: 'Demo User', email: 'user@example.com' }
//         });
//     };

//     const handleLogout = () => {
//         setUser({
//             isAuthenticated: false,
//             currentUser: null
//         });
//     };

//     return {
//         user,
//         handleLogin,
//         handleLogout,
//     };
// };

import { useContext } from "react";
import { AuthContext } from "@/contexts/AuthContext";

export function useAuth()
{
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}