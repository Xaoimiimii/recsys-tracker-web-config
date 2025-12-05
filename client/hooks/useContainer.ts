import { useState } from 'react';
import { Container, DomainType, TrackingRule, UserState } from '../types';
import { DOMAIN_PRESETS } from '../lib/constants';
import { generateUUID } from '../lib/utils';
import { domainApi } from '../lib/api/';

export const useContainer = (user: UserState) => {
  const [container, setContainer] = useState<Container | null>(null);
  const [onboardingStep, setOnboardingStep] = useState(0);

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
  };
};
