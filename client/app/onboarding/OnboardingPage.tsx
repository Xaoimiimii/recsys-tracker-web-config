import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DomainType } from '../../types';
import { DOMAIN_OPTIONS, DOMAIN_TYPE_TO_NUMBER } from '../../lib/constants';
import { OnboardingLayout } from '../../components/layout/OnboardingLayout';
import { domainApi, userIdentityApi } from '../../lib/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import styles from './OnboardingPage.module.css';
import { Domain } from 'domain';

interface OnboardingPageProps {
  step?: number;
  onCreateContainer?: (url: string) => void;
  onSelectDomain?: (type: DomainType) => void;
  onLogout?: () => void;
  onDomainCreated?: (domain: any) => void;
}

export const OnboardingPage: React.FC<OnboardingPageProps> = ({ onLogout, onDomainCreated }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [createdDomainKey, setCreatedDomainKey] = useState<string | null>(null);
  const [enteredUrl, setEnteredUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateContainer = (url: string) => {
    setEnteredUrl(url);
    setStep(2);
  };

  const handleSelectDomainType = async (type: DomainType) => {
    if (!enteredUrl) {
      setError('URL is missing. Please go back and enter a URL.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const typeNumber = DOMAIN_TYPE_TO_NUMBER[type];
      
      const domain = await domainApi.create({ 
        url: enteredUrl,
        type: typeNumber,
        UserIdentity: {
          Source: 'local_storage',
          RequestConfig: undefined,
          Value: 'recsys_anon_id',
          Field: 'AnonymousId'
        }
      });
      
      // await userIdentityApi.create({
      //   Source: 'local_storage',
      //   RequestConfig: null,
      //   Value: 'recsys_anon_id',
      //   Field: 'AnonymousId',
      //   DomainKey: domain.Key
      // });
      
      setCreatedDomainKey(domain.Key);
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
  if (step === 1) {
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
                  handleCreateContainer(fd.get('url') as string); 
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
                            {loading ? 'Creating...' : 'Next'}
                        </button>
                    </div>
                </form>
            </div>
            <div className={styles.progressContainer}>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: '50%' }}></div>
              </div>
              <p className={styles.progressText}>Step 1 of 2</p>
            </div>
        </div>
      </OnboardingLayout>
    );
  }

  if (step === 2) {
    return (
      <OnboardingLayout onLogout={onLogout}>
        <div className={styles.stepTwoContainer}>
            <div className={styles.header}>
                <h2 className={styles.title}>What is your website about?</h2>
                <p className={styles.subtitle}>We will optimize the tracking suggestions based on your industry.</p>
            </div>
            {error && (
              <div style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>
                {error}
              </div>
            )}
            {loading ? (
              <LoadingSpinner />
            ) : (
              <>
                <div className={styles.grid}>
                    {DOMAIN_OPTIONS.map((opt) => (
                        <button 
                            key={opt.type}
                            onClick={() => handleSelectDomainType(opt.type)}
                            className={styles.domainCard}
                            disabled={loading}
                        >
                            <div className={styles.iconCircle}>
                                {React.createElement(opt.icon, { size: 32 })}
                            </div>
                            <h3 className={styles.cardTitle}>{opt.label}</h3>
                            <p className={styles.cardDescription}>{opt.description}</p>
                        </button>
                    ))}
                </div>
                {/* <div className={styles.skipSection}>
                    <button 
                      onClick={() => handleSelectDomainType('General')} 
                      className={styles.skipButton}
                      disabled={loading}
                    >
                        Skip this step
                    </button>
                </div> */}
              </>
            )}
            <div className={styles.progressContainer}>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: '100%' }}></div>
              </div>
              <p className={styles.progressText}>Step 2 of 2</p>
            </div>
        </div>
      </OnboardingLayout>
    );
  }

  return null;
};