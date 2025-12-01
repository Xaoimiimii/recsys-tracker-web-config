import React from 'react';
import { User } from 'lucide-react';
import { DomainType } from '../../types';
import { DOMAIN_OPTIONS } from '../../lib/constants';
import styles from './OnboardingPage.module.css';

interface OnboardingPageProps {
  step: number;
  onCreateContainer: (url: string) => void;
  onSelectDomain: (type: DomainType) => void;
}

export const OnboardingPage: React.FC<OnboardingPageProps> = ({ step, onCreateContainer, onSelectDomain }) => {
  if (step === 1) {
    return (
      <div className={styles.container}>
        <header className={styles.headerBar}>
          <div className={styles.logo}>
            <span className={styles.logoReco}>Reco</span>
            <span className={styles.logoTrack}>Track</span>
          </div>
          <div className={styles.userAvatar}>
            <User size={20} />
          </div>
        </header>
        <div className={styles.stepOneContainer}>
            <div className={styles.textCenter}>
                <h2 className={styles.title}>Let's set up your tracker</h2>
                <p className={styles.subtitle}>Enter your website URL to generate a unique domain key.</p>
            </div>
            <div className={styles.card}>
                <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); onCreateContainer(fd.get('url') as string); }}>
                    <div className={styles.urlForm}>
                        <input name="url" type="url" required placeholder="https://www.example.com" className={styles.urlInput} />
                        <button type="submit" className={styles.nextButton}>
                            Next
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
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className={styles.container}>
        <header className={styles.headerBar}>
          <div className={styles.logo}>
            <span className={styles.logoReco}>Reco</span>
            <span className={styles.logoTrack}>Track</span>
          </div>
          <div className={styles.userAvatar}>
            <User size={20} />
          </div>
        </header>
        <div className={styles.stepTwoContainer}>
            <div className={styles.header}>
                <h2 className={styles.title}>What is your website about?</h2>
                <p className={styles.subtitle}>We will optimize the tracking suggestions based on your industry.</p>
            </div>
            <div className={styles.grid}>
                {DOMAIN_OPTIONS.map((opt) => (
                    <button 
                        key={opt.type}
                        onClick={() => onSelectDomain(opt.type)}
                        className={styles.domainCard}
                    >
                        <div className={styles.iconCircle}>
                            {React.createElement(opt.icon, { size: 32 })}
                        </div>
                        <h3 className={styles.cardTitle}>{opt.label}</h3>
                        <p className={styles.cardDescription}>{opt.description}</p>
                    </button>
                ))}
            </div>
            <div className={styles.skipSection}>
                <button onClick={() => onSelectDomain('general')} className={styles.skipButton}>
                    Skip this step
                </button>
            </div>
            <div className={styles.progressContainer}>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: '100%' }}></div>
              </div>
              <p className={styles.progressText}>Step 2 of 2</p>
            </div>
        </div>
      </div>
    );
  }

  return null;
};
