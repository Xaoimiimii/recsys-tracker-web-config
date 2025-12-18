import React, { createContext, useContext, ReactNode, useState } from 'react';
import { EventPattern, Operator } from '../lib/api/types';

export interface TriggerEvent {
    Id: number;
    Name: string;
}

interface DataCacheContextType {
    triggerEvents: TriggerEvent[];
    eventPatterns: EventPattern[];
    operators: Operator[];
    setTriggerEvents: (data: TriggerEvent[]) => void;
    setEventPatterns: (data: EventPattern[]) => void;
    setOperators: (data: Operator[]) => void;
}

export const DataCacheContext = createContext<DataCacheContextType | undefined>(undefined);

export const DataCacheProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [triggerEvents, setTriggerEvents] = useState<TriggerEvent[]>([]);
    const [eventPatterns, setEventPatterns] = useState<EventPattern[]>([]);
    const [operators, setOperators] = useState<Operator[]>([]);

    return (
        <DataCacheContext.Provider value={{
            triggerEvents,
            eventPatterns,
            operators,
            setTriggerEvents,
            setEventPatterns,
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
