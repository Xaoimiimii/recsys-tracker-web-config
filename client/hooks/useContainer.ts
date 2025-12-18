import { useState } from 'react';
import { Container } from '../types';

export const useContainer = () => {
  const [container, setContainer] = useState<Container | null>(null);

  return {
    container,
    setContainer,
  };
};