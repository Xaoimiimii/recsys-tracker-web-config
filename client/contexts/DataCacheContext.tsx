import React, { createContext, useContext, ReactNode, useState } from 'react';
import { RuleListItem, ReturnMethodResponse, SearchInputResponse } from '../lib/api/types';

export interface TriggerEvent {
    Id: number;
    Name: string;
}

interface DataCacheContextType {
    triggerEvents: TriggerEvent[];
    rulesByDomain: Record<string, RuleListItem[]>;
    returnMethodsByDomain: Record<string, ReturnMethodResponse[]>;
    searchInputsByDomain: Record<string, SearchInputResponse[]>;
    setTriggerEvents: (data: TriggerEvent[]) => void;
    setRulesByDomain: (domainKey: string, data: RuleListItem[]) => void;
    setReturnMethodsByDomain: (domainKey: string, data: ReturnMethodResponse[]) => void;
    setSearchInputsByDomain: (domainKey: string, data: SearchInputResponse[]) => void;
    getRulesByDomain: (domainKey: string) => RuleListItem[] | null;
    getReturnMethodsByDomain: (domainKey: string) => ReturnMethodResponse[] | null;
    getSearchInputsByDomain: (domainKey: string) => SearchInputResponse[] | null;
    clearRulesByDomain: (domainKey: string) => void;
    clearReturnMethodsByDomain: (domainKey: string) => void;
    clearSearchInputsByDomain: (domainKey: string) => void;
}

export const DataCacheContext = createContext<DataCacheContextType | undefined>(undefined);

export const DataCacheProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [triggerEvents, setTriggerEvents] = useState<TriggerEvent[]>([]);
    const [rulesByDomain, setRulesByDomainState] = useState<Record<string, RuleListItem[]>>({});
    const [returnMethodsByDomain, setReturnMethodsByDomainState] = useState<Record<string, ReturnMethodResponse[]>>({});
    const [searchInputsByDomain, setSearchInputsByDomainState] = useState<Record<string, SearchInputResponse[]>>({});

    const setRulesByDomain = (domainKey: string, data: RuleListItem[]) => {
        setRulesByDomainState(prev => ({ ...prev, [domainKey]: data }));
    };

    const setReturnMethodsByDomain = (domainKey: string, data: ReturnMethodResponse[]) => {
        setReturnMethodsByDomainState(prev => ({ ...prev, [domainKey]: data }));
    };

    const setSearchInputsByDomain = (domainKey: string, data: SearchInputResponse[]) => {
        setSearchInputsByDomainState(prev => ({ ...prev, [domainKey]: data }));
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

    return (
        <DataCacheContext.Provider value={{
            triggerEvents,
            rulesByDomain,
            returnMethodsByDomain,
            searchInputsByDomain,
            setTriggerEvents,
            setRulesByDomain,
            setReturnMethodsByDomain,
            setSearchInputsByDomain,
            getRulesByDomain,
            getReturnMethodsByDomain,
            getSearchInputsByDomain,
            clearRulesByDomain,
            clearReturnMethodsByDomain,
            clearSearchInputsByDomain,
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
