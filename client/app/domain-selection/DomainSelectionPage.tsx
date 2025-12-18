import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { domainApi } from '../../lib/api';
import type { DomainResponse } from '../../lib/api/types';
import { OnboardingLayout } from '../../components/layout/OnboardingLayout';
import styles from './DomainSelectionPage.module.css';

interface DomainSelectionPageProps {
  onSelectDomain: (domainKey: string) => void;
  onLogout?: () => void;
}

export const DomainSelectionPage: React.FC<DomainSelectionPageProps> = ({ 
  onSelectDomain,
  onLogout
}) => {
  const navigate = useNavigate();
  const [domains, setDomains] = useState<DomainResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDomains = async () => {
      try {
        setLoading(true);
        const data = await domainApi.getByTernantId();
        setDomains(data);
      } catch (err) {
        console.error('Failed to fetch domains:', err);
        setError('Failed to load domains. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchDomains();
  }, []);

  const handleDomainClick = (domain: DomainResponse) => {
    onSelectDomain(domain.Key);
    navigate('/dashboard');
  };

  const handleCreateNew = () => {
    navigate('/onboarding');
  };

  if (loading) {
    return (
      <OnboardingLayout onLogout={onLogout}>
        <div className={styles.loading}>Loading domains...</div>
      </OnboardingLayout>
    );
  }

  return (
    <OnboardingLayout onLogout={onLogout}>
      <div className={styles.content}>
        <div className={styles.header}>
          <h2 className={styles.title}>Select a Domain</h2>
          <p className={styles.subtitle}>
            Choose a domain to manage or create a new one
          </p>
        </div>

        {/* Add New Domain Card */}
        <button 
          onClick={handleCreateNew}
          className={styles.createCard}
        >
          <div className={styles.createCardIcon}>
            <Plus size={48} />
          </div>
          <div className={styles.createCardContent}>
            <h3 className={styles.cardTitle}>Create New Domain</h3>
            <p className={styles.cardDescription}>
              Create and configure a new domain for your website
            </p>
          </div>
        </button>

        {(domains.length > 0 && !error) && (
          <div className={styles.sectionTitle}>Your Domains:
          </div>
        )}

        <div className={styles.grid}>
          {/* Existing Domain Cards */}
          {domains.map((domain) => {
            const domainUrl = new URL(domain.Url);
            const hostname = domainUrl.hostname;
            
            return (
              <button
                key={domain.Id}
                onClick={() => handleDomainClick(domain)}
                className={styles.card}
              >
                <div className={styles.domainIcon}>
                  {hostname.charAt(0).toUpperCase()}
                </div>
                <div className={styles.cardContent}>
                  <h3 className={styles.cardTitle}>{hostname}</h3>
                  <p className={styles.cardUrl}>{domain.Url}</p>
                  <div className={styles.cardFooter}>
                    <span className={styles.cardKey}>Key: {domain.Key.substring(0, 8)}...</span>
                    <span className={styles.cardDate}>
                      {new Date(domain.CreatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {(domains.length === 0 && !error) && (
          <div className={styles.spaceholder}></div>
        )}


      </div>
    </OnboardingLayout>
  );
};