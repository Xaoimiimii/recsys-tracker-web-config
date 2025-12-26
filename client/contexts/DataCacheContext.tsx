import React, { createContext, useContext, ReactNode, useState } from 'react';
import { Pattern, Operator, RuleListItem, ReturnMethodResponse } from '../lib/api/types';

export interface TriggerEvent {
    Id: number;
    Name: string;
}

interface DataCacheContextType {
    triggerEvents: TriggerEvent[];
    patterns: Pattern[];
    operators: Operator[];
    rulesByDomain: Record<string, RuleListItem[]>;
    returnMethodsByDomain: Record<string, ReturnMethodResponse[]>;
    setTriggerEvents: (data: TriggerEvent[]) => void;
    setPatterns: (data: Pattern[]) => void;
    setOperators: (data: Operator[]) => void;
    setRulesByDomain: (domainKey: string, data: RuleListItem[]) => void;
    setReturnMethodsByDomain: (domainKey: string, data: ReturnMethodResponse[]) => void;
    getRulesByDomain: (domainKey: string) => RuleListItem[] | null;
    getReturnMethodsByDomain: (domainKey: string) => ReturnMethodResponse[] | null;
    clearRulesByDomain: (domainKey: string) => void;
    clearReturnMethodsByDomain: (domainKey: string) => void;
}

export const DataCacheContext = createContext<DataCacheContextType | undefined>(undefined);

export const DataCacheProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [triggerEvents, setTriggerEvents] = useState<TriggerEvent[]>([]);
    const [patterns, setPatterns] = useState<Pattern[]>([]);
    const [operators, setOperators] = useState<Operator[]>([]);
    const [rulesByDomain, setRulesByDomainState] = useState<Record<string, RuleListItem[]>>({});
    const [returnMethodsByDomain, setReturnMethodsByDomainState] = useState<Record<string, ReturnMethodResponse[]>>({});

    const setRulesByDomain = (domainKey: string, data: RuleListItem[]) => {
        setRulesByDomainState(prev => ({ ...prev, [domainKey]: data }));
    };

    const setReturnMethodsByDomain = (domainKey: string, data: ReturnMethodResponse[]) => {
        setReturnMethodsByDomainState(prev => ({ ...prev, [domainKey]: data }));
    };

    const getRulesByDomain = (domainKey: string): RuleListItem[] | null => {
        return rulesByDomain[domainKey] || null;
    };

    const getReturnMethodsByDomain = (domainKey: string): ReturnMethodResponse[] | null => {
        return returnMethodsByDomain[domainKey] || null;
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

    return (
        <DataCacheContext.Provider value={{
            triggerEvents,
            patterns,
            operators,
            rulesByDomain,
            returnMethodsByDomain,
            setTriggerEvents,
            setPatterns,
            setOperators,
            setRulesByDomain,
            setReturnMethodsByDomain,
            getRulesByDomain,
            getReturnMethodsByDomain,
            clearRulesByDomain,
            clearReturnMethodsByDomain,
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
