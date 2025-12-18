import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { domainApi } from '../../lib/api';
import type { DomainResponse } from '../../lib/api/types';
import { OnboardingLayout } from '../../components/layout/OnboardingLayout';
import styles from './DomainSelectionPage.module.css';

interface DomainSelectionPageProps {
  onSelectDomain: (domainKey: string) => void;
  onCreateNewDomain: () => void;
  onLogout?: () => void;
}

export const DomainSelectionPage: React.FC<DomainSelectionPageProps> = ({ 
  onSelectDomain,
  onCreateNewDomain,
  onLogout
}) => {
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
  };

  const handleCreateNew = () => {
    onCreateNewDomain();
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

        {error && (
          <div className={styles.error}>{error}</div>
        )}

        <div className={styles.grid}>
          {/* Add New Domain Card */}
          <button 
            onClick={handleCreateNew}
            className={`${styles.card} ${styles.createCard}`}
          >
            <div className={styles.createCardIcon}>
              <Plus size={48} />
            </div>
            <h3 className={styles.cardTitle}>Thêm Domain Mới</h3>
            <p className={styles.cardDescription}>
              Tạo và cấu hình domain mới cho website của bạn
            </p>
          </button>

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
                <div className={styles.cardHeader}>
                  <div className={styles.domainIcon}>
                    {hostname.charAt(0).toUpperCase()}
                  </div>
                </div>
                <h3 className={styles.cardTitle}>{hostname}</h3>
                <p className={styles.cardUrl}>{domain.Url}</p>
                <div className={styles.cardFooter}>
                  <span className={styles.cardKey}>Key: {domain.Key.substring(0, 8)}...</span>
                  <span className={styles.cardDate}>
                    {new Date(domain.CreatedAt).toLocaleDateString()}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {domains.length === 0 && !error && (
          <div className={styles.emptyState}>
            <p>Bạn chưa có domain nào. Hãy tạo domain đầu tiên!</p>
          </div>
        )}
      </div>
    </OnboardingLayout>
  );
};