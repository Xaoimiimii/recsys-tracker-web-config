import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Container } from '../types';
import type { DomainResponse } from '../lib/api/types';

interface ContainerContextType {
  container: Container | null;
  setContainer: (container: Container | null) => void;
  domains: DomainResponse[];
  setDomains: (domains: DomainResponse[]) => void;
  clearAll: () => void;
}

const ContainerContext = createContext<ContainerContextType | undefined>(undefined);

const CONTAINER_STORAGE_KEY = 'recsys_container';
const DOMAINS_STORAGE_KEY = 'recsys_domains';

export const ContainerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [container, setContainerState] = useState<Container | null>(() => {
    // Khôi phục container từ sessionStorage khi khởi tạo
    try {
      const stored = sessionStorage.getItem(CONTAINER_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      //console.error('Error loading container from sessionStorage:', error);
      return null;
    }
  });

  const [domains, setDomainsState] = useState<DomainResponse[]>(() => {
    // Khôi phục domains từ sessionStorage khi khởi tạo
    try {
      const stored = sessionStorage.getItem(DOMAINS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      //console.error('Error loading domains from sessionStorage:', error);
      return [];
    }
  });

  const setContainer = (newContainer: Container | null) => {
    setContainerState(newContainer);
    
    // Lưu vào sessionStorage mỗi khi container thay đổi
    try {
      if (newContainer) {
        sessionStorage.setItem(CONTAINER_STORAGE_KEY, JSON.stringify(newContainer));
      } else {
        sessionStorage.removeItem(CONTAINER_STORAGE_KEY);
      }
    } catch (error) {
      //console.error('Error saving container to sessionStorage:', error);
    }
  };

  const setDomains = (newDomains: DomainResponse[]) => {
    setDomainsState(newDomains);
    
    // Lưu vào sessionStorage mỗi khi domains thay đổi
    try {
      sessionStorage.setItem(DOMAINS_STORAGE_KEY, JSON.stringify(newDomains));
    } catch (error) {
      //console.error('Error saving domains to sessionStorage:', error);
    }
  };

  const clearAll = () => {
    setContainerState(null);
    setDomainsState([]);
    sessionStorage.removeItem(CONTAINER_STORAGE_KEY);
    sessionStorage.removeItem(DOMAINS_STORAGE_KEY);
    sessionStorage.removeItem('selectedDomainKey');
  };

  // Lắng nghe event logout để clear state
  useEffect(() => {
    const handleLogout = () => {
      setContainerState(null);
      setDomainsState([]);
    };

    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  return (
    <ContainerContext.Provider value={{ container, setContainer, domains, setDomains, clearAll }}>
      {children}
    </ContainerContext.Provider>
  );
};

export const useContainer = () => {
  const context = useContext(ContainerContext);
  if (context === undefined) {
    throw new Error('useContainer must be used within ContainerProvider');
  }
  return context;
};
