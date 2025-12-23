import React, { createContext, useContext, ReactNode, useState } from 'react';
import { Pattern, Operator } from '../lib/api/types';

export interface TriggerEvent {
    Id: number;
    Name: string;
}

interface DataCacheContextType {
    triggerEvents: TriggerEvent[];
    patterns: Pattern[];
    operators: Operator[];
    setTriggerEvents: (data: TriggerEvent[]) => void;
    setPatterns: (data: Pattern[]) => void;
    setOperators: (data: Operator[]) => void;
}

export const DataCacheContext = createContext<DataCacheContextType | undefined>(undefined);

export const DataCacheProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [triggerEvents, setTriggerEvents] = useState<TriggerEvent[]>([]);
    const [patterns, setPatterns] = useState<Pattern[]>([]);
    const [operators, setOperators] = useState<Operator[]>([]);

    return (
        <DataCacheContext.Provider value={{
            triggerEvents,
            patterns,
            operators,
            setTriggerEvents,
            setPatterns,
            setOperators
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
