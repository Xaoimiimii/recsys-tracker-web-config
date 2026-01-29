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
    // Khôi phục container từ localStorage khi khởi tạo
    try {
      const stored = localStorage.getItem(CONTAINER_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      //console.error('Error loading container from localStorage:', error);
      return null;
    }
  });

  const [domains, setDomainsState] = useState<DomainResponse[]>(() => {
    // Khôi phục domains từ localStorage khi khởi tạo
    try {
      const stored = localStorage.getItem(DOMAINS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      //console.error('Error loading domains from localStorage:', error);
      return [];
    }
  });

  const setContainer = (newContainer: Container | null) => {
    setContainerState(newContainer);
    
    // Lưu vào localStorage mỗi khi container thay đổi
    try {
      if (newContainer) {
        localStorage.setItem(CONTAINER_STORAGE_KEY, JSON.stringify(newContainer));
      } else {
        localStorage.removeItem(CONTAINER_STORAGE_KEY);
      }
    } catch (error) {
      //console.error('Error saving container to localStorage:', error);
    }
  };

  const setDomains = (newDomains: DomainResponse[]) => {
    setDomainsState(newDomains);
    
    // Lưu vào localStorage mỗi khi domains thay đổi
    try {
      localStorage.setItem(DOMAINS_STORAGE_KEY, JSON.stringify(newDomains));
    } catch (error) {
      //console.error('Error saving domains to localStorage:', error);
    }
  };

  const clearAll = () => {
    setContainerState(null);
    setDomainsState([]);
    localStorage.removeItem(CONTAINER_STORAGE_KEY);
    localStorage.removeItem(DOMAINS_STORAGE_KEY);
    localStorage.removeItem('selectedDomainKey');
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
