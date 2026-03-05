import React, { createContext, useContext, ReactNode, useState } from 'react';
import { RuleListItem, ReturnMethodResponse, SearchInputResponse, UserIdentityResponse } from '../lib/api/types';

export interface TriggerEvent {
    Id: number;
    Name: string;
}

interface DataCacheContextType {
    triggerEvents: TriggerEvent[];
    rulesByDomain: Record<string, RuleListItem[]>;
    returnMethodsByDomain: Record<string, ReturnMethodResponse[]>;
    searchInputsByDomain: Record<string, SearchInputResponse[]>;
    userIdentitiesByDomain: Record<string, UserIdentityResponse>;
    setTriggerEvents: (data: TriggerEvent[]) => void;
    setRulesByDomain: (domainKey: string, data: RuleListItem[]) => void;
    setReturnMethodsByDomain: (domainKey: string, data: ReturnMethodResponse[]) => void;
    setSearchInputsByDomain: (domainKey: string, data: SearchInputResponse[]) => void;
    setUserIdentityByDomain: (domainKey: string, data: UserIdentityResponse) => void;
    getRulesByDomain: (domainKey: string) => RuleListItem[] | null;
    getReturnMethodsByDomain: (domainKey: string) => ReturnMethodResponse[] | null;
    getSearchInputsByDomain: (domainKey: string) => SearchInputResponse[] | null;
    getUserIdentityByDomain: (domainKey: string) => UserIdentityResponse | null;
    clearRulesByDomain: (domainKey: string) => void;
    clearReturnMethodsByDomain: (domainKey: string) => void;
    clearSearchInputsByDomain: (domainKey: string) => void;
    clearUserIdentityByDomain: (domainKey: string) => void;
}

export const DataCacheContext = createContext<DataCacheContextType | undefined>(undefined);

export const DataCacheProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [triggerEvents, setTriggerEvents] = useState<TriggerEvent[]>([]);
    const [rulesByDomain, setRulesByDomainState] = useState<Record<string, RuleListItem[]>>({});
    const [returnMethodsByDomain, setReturnMethodsByDomainState] = useState<Record<string, ReturnMethodResponse[]>>({});
    const [searchInputsByDomain, setSearchInputsByDomainState] = useState<Record<string, SearchInputResponse[]>>({});
    const [userIdentitiesByDomain, setUserIdentitiesByDomainState] = useState<Record<string, UserIdentityResponse>>({});

    const setRulesByDomain = (domainKey: string, data: RuleListItem[]) => {
        setRulesByDomainState(prev => ({ ...prev, [domainKey]: data }));
    };

    const setReturnMethodsByDomain = (domainKey: string, data: ReturnMethodResponse[]) => {
        setReturnMethodsByDomainState(prev => ({ ...prev, [domainKey]: data }));
    };

    const setSearchInputsByDomain = (domainKey: string, data: SearchInputResponse[]) => {
        setSearchInputsByDomainState(prev => ({ ...prev, [domainKey]: data }));
    };

    const setUserIdentityByDomain = (domainKey: string, data: UserIdentityResponse) => {
        setUserIdentitiesByDomainState(prev => ({ ...prev, [domainKey]: data }));
    };

    const getRulesByDomain = (domainKey: string): RuleListItem[] | null => {
        return rulesByDomain[domainKey] || null;
    };

    const getReturnMethodsByDomain = (domainKey: string): ReturnMethodResponse[] | null => {
        return returnMethodsByDomain[domainKey] || null;
    };

    const getSearchInputsByDomain = (domainKey: string): SearchInputResponse[] | null => {
        return searchInputsByDomain[domainKey] || null;
    };

    const getUserIdentityByDomain = (domainKey: string): UserIdentityResponse | null => {
        return userIdentitiesByDomain[domainKey] || null;
    };

    const clearRulesByDomain = (domainKey: string) => {
        setRulesByDomainState(prev => {
            const newState = { ...prev };
            delete newState[domainKey];
            return newState;
        });
    };

    const clearReturnMethodsByDomain = (domainKey: string) => {
        setReturnMethodsByDomainState(prev => {
            const newState = { ...prev };
            delete newState[domainKey];
            return newState;
        });
    };

    const clearSearchInputsByDomain = (domainKey: string) => {
        setSearchInputsByDomainState(prev => {
            const newState = { ...prev };
            delete newState[domainKey];
            return newState;
        });
    };

    const clearUserIdentityByDomain = (domainKey: string) => {
        setUserIdentitiesByDomainState(prev => {
            const newState = { ...prev };
            delete newState[domainKey];
            return newState;
        });
    };

    // Clear tất cả cache
    const clearAllCache = () => {
        setTriggerEvents([]);
        setRulesByDomainState({});
        setReturnMethodsByDomainState({});
        setSearchInputsByDomainState({});
        setUserIdentitiesByDomainState({});
    };

    // Lắng nghe event logout để clear cache
    React.useEffect(() => {
        const handleLogout = () => {
            clearAllCache();
        };

        window.addEventListener('auth:logout', handleLogout);
        return () => window.removeEventListener('auth:logout', handleLogout);
    }, []);

    return (
        <DataCacheContext.Provider value={{
            triggerEvents,
            rulesByDomain,
            returnMethodsByDomain,
            searchInputsByDomain,
            userIdentitiesByDomain,
            setTriggerEvents,
            setRulesByDomain,
            setReturnMethodsByDomain,
            setSearchInputsByDomain,
            setUserIdentityByDomain,
            getRulesByDomain,
            getReturnMethodsByDomain,
            getSearchInputsByDomain,
            getUserIdentityByDomain,
            clearRulesByDomain,
            clearReturnMethodsByDomain,
            clearSearchInputsByDomain,
            clearUserIdentityByDomain,
        }}>
            {children}
        </DataCacheContext.Provider>
    );
};

export const useDataCache = (): DataCacheContextType => {
    const context = useContext(DataCacheContext);
    if (!context) {
        throw new Error('useDataCache must be used within DataCacheProvider');
    }
    return context;
};
