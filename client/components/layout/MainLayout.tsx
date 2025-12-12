import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link, Outlet } from 'react-router-dom';
import { User, ChevronLeft, ChevronRight, LayoutDashboard, Container, ListChecks, Sparkles, FileText, LogOut, Code, Upload } from 'lucide-react';
import styles from './MainLayout.module.css';

interface MainLayoutProps {
  userEmail?: string;
  onLogout: () => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ userEmail, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Extract active tab from URL
  const activeTab = location.pathname.split('/')[2] || 'overview';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const goPrev = () => navigate(-1);
  const goNext = () => navigate(1);

  return (
    <div className={styles.container}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logoContainer}>
            <span className={styles.logoReco}>Reco</span>
            <span className={styles.logoTrack}>Track</span>
          </div>
        </div>

        <nav className={styles.nav}>
          <Link
            to="/dashboard/overview"
            className={`${styles.navButton} ${activeTab === 'overview' ? styles.navButtonActive : ''}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Overview
          </Link>
          {/* <Link
            to="/dashboard/containers"
            className={`${styles.navButton} ${activeTab === 'containers' ? styles.navButtonActive : ''}`}
          >
            <Container className="w-5 h-5" />
            Containers
          </Link> */}
          <Link
            to="/dashboard/tracking-rules"
            className={`${styles.navButton} ${activeTab === 'tracking-rules' ? styles.navButtonActive : ''}`}
          >
            <ListChecks className="w-5 h-5" />
            Tracking Rules
          </Link>
          <Link
            to="/dashboard/recommendation-display"
            className={`${styles.navButton} ${activeTab === 'recommendation-display' ? styles.navButtonActive : ''}`}
          >
            <Sparkles className="w-5 h-5" />
            Recommendation
          </Link>
          <Link
            to="/dashboard/loader-script"
            className={`${styles.navButton} ${activeTab === 'loader-script' ? styles.navButtonActive : ''}`}
          >
            <Code className="w-5 h-5" />
            Loader Script
          </Link>
          <Link
            to="/dashboard/item-upload"
            className={`${styles.navButton} ${activeTab === 'item-upload' ? styles.navButtonActive : ''}`}
          >
            <Upload className="w-5 h-5" />
            Item Upload
          </Link>
          <Link
            to="/dashboard/documentation"
            className={`${styles.navButton} ${activeTab === 'documentation' ? styles.navButtonActive : ''}`}
          >
            <FileText className="w-5 h-5" />
            Documentation
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        <header className={styles.header}>
            <div className={styles['navigation-arrows']}>
              <button 
                className={styles['nav-arrow']} 
                onClick={goPrev}
              >
                <ChevronLeft />
              </button>
              <button 
                className={styles['nav-arrow']} 
                onClick={goNext}
              >
                <ChevronRight />
              </button>

              <h1 className={styles.headerTitle}>
                {activeTab.replace('-', ' ')}
              </h1>
            </div>

            <div className={styles.userSection} ref={dropdownRef}>
              <button 
                className={styles.userAvatar}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <User size={20} />
              </button>
              
              {isDropdownOpen && (
                <div className={styles.dropdownMenu}>
                  {userEmail && (
                    <div className={styles.dropdownHeader}>
                      <div className={styles.userEmail}>{userEmail}</div>
                    </div>
                  )}
                  <button 
                    className={styles.dropdownItem}
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onLogout();
                    }}
                  >
                    <LogOut size={16} />
                    Log Out
                  </button>
                </div>
              )}
            </div>
        </header>
        <div className={styles.content}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};
