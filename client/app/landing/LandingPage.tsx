import React from 'react';
import { 
  Activity, 
  Database, 
  Settings, 
  Zap, 
  User,
  ShieldCheck,
  Code
} from 'lucide-react';
import styles from './LandingPage.module.css';

export const LandingPage: React.FC = () => {
  return (
    <div className={styles.container}>
      {/* Navigation */}
      <nav className={styles.nav}>
        <div className={styles.logo}>
          <Activity size={24} color="#34d399" />
          <span>RecoTrack</span>
        </div>
        <div className={styles.navLinks}>
          <a href="#">Home</a>
          <a href="#features">Features</a>
          <a href="#">Pricing</a>
          <a href="#">About us</a>
          <a href="#">Contact</a>
        </div>
        <button className={styles.navCta}>
          <User size={16} />
          Sign up
        </button>
      </nav>

      {/* Hero Section */}
      <header className={styles.hero}>
        <h1>
          Discover your <br />
          Ultimate RecSys
        </h1>
        <p>
          Streamline your recommendation analytics with our intuitive, 
          scalable SaaS platform designed for modern businesses.
        </p>
        <button className={styles.btnPrimary}>
          Explore now
        </button>
      </header>

      {/* Features Section */}
      <section id="features" className={styles.featuresSection}>
        <div className={styles.featureGrid}>
          <div className={styles.featureCard}>
            <div className={styles.iconBox}>
              <Database size={24} />
            </div>
            <h3>Multi-domain Management</h3>
            <p>Effortlessly switch and configure tracking rules for multiple websites within a single dashboard.</p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.iconBox}>
              <Zap size={24} />
            </div>
            <h3>Real-time Analytics</h3>
            <p>Monitor events like clicks and views instantly through lightning-fast data visualization charts.</p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.iconBox}>
              <Settings size={24} />
            </div>
            <h3>Flexible Tracking Rules</h3>
            <p>Setup custom tracking rules without deep dives into your application's frontend code.</p>
          </div>
          
          <div className={styles.featureCard}>
            <div className={styles.iconBox}>
              <ShieldCheck size={24} />
            </div>
            <h3>Secure & Scalable</h3>
            <p>Manage access via Domain Keys and origin filters to ensure your data is always safe.</p>
          </div>
        </div>
      </section>

      {/* Integration Section */}
      <section className={styles.integrationSection}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 800 }}>Seamless Integration</h2>
        <p style={{ color: '#94a3b8', marginTop: '1rem' }}>One line of code to unlock the full potential of your data.</p>
        
        <div className={styles.codeBlock}>
          <code>
            <span className={styles.codeBlue}>&lt;script</span> <br />
            &nbsp;&nbsp;<span className={styles.codeGreen}>src</span>=<span className={styles.codeYellow}>"https://cdn.recotrack.io/v1/loader.js"</span> <br />
            &nbsp;&nbsp;<span className={styles.codeGreen}>data-container</span>=<span className={styles.codeYellow}>"YOUR_CONTAINER_UUID"</span> <br />
            <span className={styles.codeBlue}>&gt;&lt;/script&gt;</span>
          </code>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>&copy; 2026 RecoTrack. The future of Recommendation Systems.</p>
      </footer>
    </div>
  );
};