import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DOMAIN_TYPE_TO_NUMBER } from '../../lib/constants';
import { OnboardingLayout } from '../../components/layout/OnboardingLayout';
import { domainApi } from '../../lib/api';
import styles from './OnboardingPage.module.css';

interface OnboardingPageProps {
  onLogout?: () => void;
  onDomainCreated?: (domain: any) => void;
}

export const OnboardingPage: React.FC<OnboardingPageProps> = ({ onLogout, onDomainCreated }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateDomain = async (url: string) => {
    try {
      setLoading(true);
      setError(null);
      const typeNumber = DOMAIN_TYPE_TO_NUMBER['general'];
      const domain = await domainApi.create({ 
        url: url,
        type: typeNumber 
      });
      localStorage.setItem('selectedDomainKey', domain.Key);
      if (onDomainCreated) {
        onDomainCreated(domain);
      }
      navigate('/dashboard');
    } catch (err) {
      console.error('Failed to create domain:', err);
      setError('Failed to create domain. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <OnboardingLayout onLogout={onLogout}>
      <div className={styles.stepOneContainer}>
          <div className={styles.textCenter}>
              <h2 className={styles.title}>Let's set up your tracker</h2>
              <p className={styles.subtitle}>Enter your website URL to generate a unique domain key.</p>
          </div>
          {error && (
            <div style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>
              {error}
            </div>
          )}
          <div className={styles.card}>
              <form onSubmit={(e) => { 
                e.preventDefault(); 
                const fd = new FormData(e.currentTarget); 
                handleCreateDomain(fd.get('url') as string); 
              }}>
                  <div className={styles.urlForm}>
                      <input 
                        name="url" 
                        type="url" 
                        required 
                        placeholder="https://www.example.com" 
                        className={styles.urlInput}
                        disabled={loading}
                      />
                      <button type="submit" className={styles.nextButton} disabled={loading}>
                          {loading ? 'Creating...' : 'Create Domain'}
                      </button>
                  </div>
              </form>
          </div>
      </div>
    </OnboardingLayout>
  );
};