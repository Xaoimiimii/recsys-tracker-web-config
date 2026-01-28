import { authApi, AuthDto, SignUpDto } from "@/lib/api";
import { s } from "motion/react-client";
import React, { createContext, useState, useEffect } from "react";

interface AuthContextType {
    user: { username: string; name: string; id: number } | null;
    accessToken: string | null;
    loading: boolean;
    signin: (dto: AuthDto) => Promise<void>;
    signup: (dto: SignUpDto) => Promise<void>;
    signout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({children}: {children: React.ReactNode}) {
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [user, setUser] = useState<{ username: string; name: string; id: number } | null>(null);

    useEffect(() => {
        const init = async () => {
            try {
                const res = await authApi.refresh();
                if (res?.accessToken) {
                    setAccessToken(res.accessToken);
                    setUser({ username: res.user.username, name: res.user.name, id: res.user.id });
                } else {
                    setAccessToken(null);
                    setUser(null);
                }
            } catch {
                setAccessToken(null);
                localStorage.removeItem('accessToken');
                setUser(null);
            }
            setLoading(false);
        };
        init();
    }, []);

    const signin = async (dto: AuthDto) => {
        const res = await authApi.signin(dto);
        setAccessToken(res.accessToken);
        setUser({ username: dto.username, name: res.user.name, id: res.user.id });
    };

    const signup = async (dto: SignUpDto) => {
        await authApi.signup(dto);
    };

    const signout = async () => {
        await authApi.signout();
        setAccessToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, accessToken, loading, signin: signin, signup, signout: signout }}>
            {children}
        </AuthContext.Provider>
    );
}