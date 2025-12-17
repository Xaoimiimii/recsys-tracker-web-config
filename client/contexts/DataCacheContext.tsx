import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ruleApi, returnMethodApi, domainApi, RuleListItem, ReturnMethodResponse, DomainResponse } from '../lib/api';

interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

interface DataCacheContextType {
    getRules: (domainKey: string, forceRefresh?: boolean) => Promise<RuleListItem[]>;
    getReturnMethods: (domainKey: string, forceRefresh?: boolean) => Promise<ReturnMethodResponse[]>;
    getDomain: (domainKey: string, forceRefresh?: boolean) => Promise<DomainResponse>;
    clearCache: () => void;
    clearRulesCache: (domainKey?: string) => void;
    clearReturnMethodsCache: (domainKey?: string) => void;
    clearDomainCache: (domainKey?: string) => void;
}

export const DataCacheContext = createContext<DataCacheContextType | undefined>(undefined);

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const DataCacheProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [rulesCache, setRulesCache] = useState<Map<string, CacheEntry<RuleListItem[]>>>(new Map());
    const [returnMethodsCache, setReturnMethodsCache] = useState<Map<string, CacheEntry<ReturnMethodResponse[]>>>(new Map());
    const [domainCache, setDomainCache] = useState<Map<string, CacheEntry<DomainResponse>>>(new Map());

    const isCacheValid = (timestamp: number): boolean => {
        return Date.now() - timestamp < CACHE_DURATION;
    };

    const getRules = useCallback(async (domainKey: string, forceRefresh = false): Promise<RuleListItem[]> => {
        const cachedEntry = rulesCache.get(domainKey);
        
        if (!forceRefresh && cachedEntry && isCacheValid(cachedEntry.timestamp)) {
            console.log(`Using cached rules for domain: ${domainKey}`);
            return cachedEntry.data;
        }

        console.log(`Fetching rules from API for domain: ${domainKey}`);
        const rules = await ruleApi.getRulesByDomain(domainKey);
        
        setRulesCache(prev => {
            const newCache = new Map(prev);
            newCache.set(domainKey, {
                data: rules,
                timestamp: Date.now()
            });
            return newCache;
        });

        return rules;
    }, [rulesCache]);

    const getReturnMethods = useCallback(async (domainKey: string, forceRefresh = false): Promise<ReturnMethodResponse[]> => {
        const cachedEntry = returnMethodsCache.get(domainKey);
        
        if (!forceRefresh && cachedEntry && isCacheValid(cachedEntry.timestamp)) {
            console.log(`Using cached return methods for domain: ${domainKey}`);
            return cachedEntry.data;
        }

        console.log(`Fetching return methods from API for domain: ${domainKey}`);
        const methods = await returnMethodApi.getByDomainKey(domainKey);
        
        setReturnMethodsCache(prev => {
            const newCache = new Map(prev);
            newCache.set(domainKey, {
                data: methods,
                timestamp: Date.now()
            });
            return newCache;
        });

        return methods;
    }, [returnMethodsCache]);

    const getDomain = useCallback(async (domainKey: string, forceRefresh = false): Promise<DomainResponse> => {
        const cachedEntry = domainCache.get(domainKey);
        
        if (!forceRefresh && cachedEntry && isCacheValid(cachedEntry.timestamp)) {
            return cachedEntry.data;
        }

        const domain = await domainApi.getByKey(domainKey);
        
        setDomainCache(prev => {
            const newCache = new Map(prev);
            newCache.set(domainKey, {
                data: domain,
                timestamp: Date.now()
            });
            return newCache;
        });

        return domain;
    }, [domainCache]);

    const clearCache = useCallback(() => {
        setRulesCache(new Map());
        setReturnMethodsCache(new Map());
        setDomainCache(new Map());
        console.log('All cache cleared');
    }, []);

    const clearRulesCache = useCallback((domainId?: string) => {
        if (domainId) {
            setRulesCache(prev => {
                const newCache = new Map(prev);
                newCache.delete(domainId);
                return newCache;
            });
            console.log(`Rules cache cleared for domain: ${domainId}`);
        } else {
            setRulesCache(new Map());
            console.log('All rules cache cleared');
        }
    }, []);

    const clearReturnMethodsCache = useCallback((domainKey?: string) => {
        if (domainKey) {
            setReturnMethodsCache(prev => {
                const newCache = new Map(prev);
                newCache.delete(domainKey);
                return newCache;
            });
            console.log(`Return methods cache cleared for domain: ${domainKey}`);
        } else {
            setReturnMethodsCache(new Map());
            console.log('All return methods cache cleared');
        }
    }, []);

    return (
        <DataCacheContext.Provider
            value={{
                getRules,
                getReturnMethods,
                clearCache,
                clearRulesCache,
                clearReturnMethodsCache,
            }}
        >
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
