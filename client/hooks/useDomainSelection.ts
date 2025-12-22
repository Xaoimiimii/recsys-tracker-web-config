import { useState } from 'react';

export const useDomainSelection = () => {
  const [selectedDomainKey, setSelectedDomainKey] = useState<string | null>(null);
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean>(false);

  const selectDomain = (domainKey: string) => {
    setSelectedDomainKey(domainKey);
    setNeedsOnboarding(false);
  };

  const startNewDomainFlow = () => {
    setSelectedDomainKey(null);
    setNeedsOnboarding(true);
  };

  const completeOnboarding = (newDomainKey: string) => {
    setSelectedDomainKey(newDomainKey);
    setNeedsOnboarding(false);
  };

  const reset = () => {
    setSelectedDomainKey(null);
    setNeedsOnboarding(false);
  };

  return {
    selectedDomainKey,
    needsOnboarding,
    selectDomain,
    startNewDomainFlow,
    completeOnboarding,
    reset,
  };
};
