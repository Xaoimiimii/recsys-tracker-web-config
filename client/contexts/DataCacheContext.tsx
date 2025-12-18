import React, { createContext, useContext, ReactNode } from 'react';

interface DataCacheContextType {
    // Empty for now - will implement caching logic when needed
}

export const DataCacheContext = createContext<DataCacheContextType | undefined>(undefined);

export const DataCacheProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    return (
        <DataCacheContext.Provider value={{}}>
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
