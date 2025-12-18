import React, { ReactNode } from 'react';
import { User, LogOut, HelpCircle } from 'lucide-react';
import styles from './OnboardingLayout.module.css';

interface OnboardingLayoutProps {
  children: ReactNode;
  onLogout?: () => void;
  showHelp?: boolean;
  onHelp?: () => void;
}

export const OnboardingLayout: React.FC<OnboardingLayoutProps> = ({ 
  children, 
  onLogout,
  showHelp = false,
  onHelp
}) => {
  return (
    <div className={styles.container}>
      <header className={styles.headerBar}>
        <div className={styles.logo}>
          <span className={styles.logoReco}>Reco</span>
          <span className={styles.logoTrack}>Track</span>
        </div>
        <div className={styles.headerRight}>
          {showHelp && onHelp && (
            <button onClick={onHelp} className={styles.helpButton} title="Help">
              <HelpCircle size={20} />
            </button>
          )}
          {onLogout && (
            <button onClick={onLogout} className={styles.logoutButton} title="Logout">
              <LogOut size={20} />
            </button>
          )}
          <div className={styles.userAvatar}>
            <User size={20} />
          </div>
        </div>
      </header>
      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  );
};
