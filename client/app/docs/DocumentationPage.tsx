import React, { useState } from 'react'; // Thêm useState
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Book, Upload, ListChecks, Sparkles, ArrowLeft, Code, MonitorPlay, Shield} from 'lucide-react';
import styles from './DocumentationPage.module.css';
import { DocumentationContent } from './DocumentationContent'; 

export const DocumentationPage: React.FC = () => {
  const navigate = useNavigate();

  const [searchParams, setSearchParams] = useSearchParams();
  const tabLabels: Record<string, string> = {
    intro: 'Introduction',
    upload: 'Item Upload',
    trackingrule: 'Tracking Rules',
    recommendation: 'Recommendation',
    loaderscript: 'Loader Script',
    admin: 'Admin',
    demo: 'Demostration',
    privacypolicy: 'Privacy Policy'
  };

  const initialTab = searchParams.get('tab') || 'intro';
  const [activeTab, setActiveTab] = useState(initialTab);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  return (
    <div className={styles.docsContainer}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader} onClick={() => navigate('/')}>
          <span style={{ color:'#14B8A6' }}>Reco</span>Track
        </div>

        <nav className={styles.sideNav}>
          <div className={styles.navGroup}>
            <ul>
              {/* Bước 3: Cập nhật class active động và thêm sự kiện onClick */}
              <li 
                className={activeTab === 'intro' ? styles.active : ''} 
                onClick={() => handleTabChange('intro')}
              >
                <Book size={18} /> Introduction
              </li>
              <li 
                className={activeTab === 'upload' ? styles.active : ''} 
                onClick={() => handleTabChange('upload')}
              >
                <Upload className="w-5 h-5" /> Item Upload
              </li>
              <li 
                className={activeTab === 'trackingrule' ? styles.active : ''} 
                onClick={() => handleTabChange('trackingrule')}
              >
                <ListChecks className="w-5 h-5" />
                Tracking Rules
              </li>
              <li 
                className={activeTab === 'recommendation' ? styles.active : ''} 
                onClick={() => handleTabChange('recommendation')}
              >
                <Sparkles className="w-5 h-5" />
                Recommendation
              </li>
              <li 
                className={activeTab === 'loaderscript' ? styles.active : ''} 
                onClick={() => handleTabChange('loaderscript')}
              >
                <Code className="w-5 h-5" />
                Loader Script
              </li>
              <li 
                className={activeTab === 'admin' ? styles.active : ''} 
                onClick={() => handleTabChange('admin')}
              >
                <Sparkles className="w-5 h-5" />
                Admin
              </li>
              <li 
                className={activeTab === 'demo' ? styles.active : ''} 
                onClick={() => handleTabChange('demo')}
              >
                <MonitorPlay className="w-5 h-5" />
                Demostration
              </li>
              <li 
                className={activeTab === 'privacypolicy' ? styles.active : ''} 
                onClick={() => handleTabChange('privacypolicy')}
              >
                <Shield className="w-5 h-5" />
                Privacy Policy
              </li>
            </ul>
          </div>
        </nav>

        <button className={styles.backBtn} onClick={() => navigate('/')}>
          <ArrowLeft size={16} /> 
          <span>Back to Home</span>
        </button>
      </aside>

      {/* Hiển thị nội dung dựa trên tab đang chọn */}
      <main className={styles.mainContent}>
        <div className={styles.contentCard}>
            <div className={styles.breadcrumbContainer}>
                <div className={styles.breadcrumb}>
                    <span className={styles.breadcrumbRoot} onClick={() => navigate('/')}>Docs</span>
                    <span className={styles.separator}>&gt;</span>
                    <span className={styles.breadcrumbActive}>{tabLabels[activeTab]}</span>
                </div>
            </div>
            <div className={styles.article}>
                <DocumentationContent activeTab={activeTab}/>
            </div>
        </div>
      </main>
    </div>
  );
};