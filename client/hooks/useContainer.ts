import { useState, useEffect } from 'react';
import { Container, DomainType, TrackingRule, UserState } from '../types';
import { DOMAIN_PRESETS } from '../lib/constants';
import { generateUUID } from '../lib/utils';
import { domainApi } from '../lib/api/';
import { useDataCache } from './useDataCache';

export const useContainer = (user: UserState, userDomainKey?: string) => {
  const [container, setContainer] = useState<Container | null>(null);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [isLoadingDomain, setIsLoadingDomain] = useState(false);
  const { getDomain } = useDataCache();

  // Fetch domain info khi user đăng nhập
  useEffect(() => {
    const fetchDomainInfo = async () => {
      if (user && userDomainKey && !container) {
        setIsLoadingDomain(true);
        try {
          const domainInfo = await getDomain(userDomainKey);
          
          // Kiểm tra domainUrl và domainType để quyết định onboarding step
          if (!domainInfo.domainUrl) {
            // Chưa có domainUrl -> onboarding step 1
            setOnboardingStep(1);
          } else if (!domainInfo.domainType) {
            // Có domainUrl nhưng chưa có domainType -> onboarding step 2
            setOnboardingStep(2);
            setContainer({
              id: '1',
              uuid: domainInfo.domainKey,
              name: new URL(domainInfo.domainUrl).hostname,
              url: domainInfo.domainUrl,
              domainType: 'general',
              rules: [],
              outputConfig: { displayMethods: [] }
            });
          } else {
            // Có cả domainUrl và domainType -> skip onboarding
            setOnboardingStep(0);
            setContainer({
              id: '1',
              uuid: domainInfo.domainKey,
              name: new URL(domainInfo.domainUrl).hostname,
              url: domainInfo.domainUrl,
              domainType: domainInfo.domainType as DomainType,
              rules: [],
              outputConfig: { displayMethods: [] }
            });
          }
        } catch (error) {
          console.error('Failed to fetch domain info:', error);
          // Nếu lỗi, bắt đầu onboarding từ đầu
          setOnboardingStep(1);
        } finally {
          setIsLoadingDomain(false);
        }
      }
    };

    fetchDomainInfo();
  }, [user, userDomainKey, container, getDomain]);

  const createContainer = async (url: string) => {
    try {
      // Call API to create domain
      // const domainResponse = await domainApi.create({
      //   name: new URL(url).hostname,
      //   url: url,
      //   userId: user.currentUser?.email || 'demo-user',
      // });

      // Temporary mock response for testing
      const domainResponse = {
        id: "1",
        key: "079251187f351b700844164bf0ac5fddebaa305af8732fe06ae631b921eaf9e7",
        name: new URL(url).hostname,
        url: url,
      };

      const newContainer: Container = {
        id: domainResponse.id,
        uuid: domainResponse.key,
        name: domainResponse.name,
        url: domainResponse.url,
        domainType: 'general',
        rules: [],
        outputConfig: { displayMethods: [] }
      };
      
      setContainer(newContainer);
      setOnboardingStep(2);
    } catch (error) {
      console.error('Failed to create domain:', error);
      alert('Failed to create domain. Please try again.');
    }
  };

  const selectDomainType = (type: DomainType) => {
    if (!container) return;
    
    // Apply presets
    const presets = DOMAIN_PRESETS[type].map(p => ({
      id: generateUUID(),
      name: p.name!,
      trigger: p.trigger!,
      selector: p.selector!,
      extraction: [
        { field: 'itemId', method: 'static', value: '{{auto_detect}}' },
        { field: 'event', method: 'static', value: p.name?.toLowerCase().replace(' ', '_') },
        { field: 'category', method: 'static', value: type },
        { field: 'userId', method: 'js_variable', value: 'window.USER_ID' },
      ]
    } as TrackingRule));

    setContainer({ ...container, domainType: type, rules: presets });
    setOnboardingStep(0);
  };

  const startOnboarding = () => {
    setOnboardingStep(1);
  };

  return {
    container,
    setContainer,
    onboardingStep,
    createContainer,
    selectDomainType,
    startOnboarding,
    isLoadingDomain,
  };
};
