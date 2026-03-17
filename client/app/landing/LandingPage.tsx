import React, { useEffect } from 'react';
import { Activity, Database, Settings, Zap, User, Brain, ArrowRight, LayoutTemplate, Mail, MapPin } from 'lucide-react';
import styles from './LandingPage.module.css';
import dashboardIcon from '../../assets/dashboard.png';
import chartIcon from '../../assets/line-chart.png';
import setupIcon from '../../assets/set-up.png';
import dataIcon from '../../assets/data.png';
import starIcon from '../../assets/star.png';
import teamSvg from '../../assets/team.svg';
import { useNavigate } from 'react-router-dom';
import { color } from 'motion';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const goToDocs = (e: React.MouseEvent) => {
      e.preventDefault(); 
      navigate('/documentation'); 
    };
  const handleLoginClick = () => {
    navigate('/login'); 
  };
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px 0px -50px 0px', 
      threshold: 0.1, 
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        console.log(entry.target.id, entry.isIntersecting); 
        if (entry.isIntersecting) {
          entry.target.classList.add(styles.revealActive);
          observer.unobserve(entry.target); 
        }
      });
    }, observerOptions);

    const hiddenElements = document.querySelectorAll(`.${styles.reveal}`);
    hiddenElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);
  return (
    <div className={styles.container}>
      {/* Navigation */}
      <nav className={styles.nav}>
        <div className={styles.logo}>
          <span style={{ color:'#14B8A6'}}>Reco</span>Track
        </div>
        <div className={styles.navLinks}>
          <a href="#">Home</a>
          <a href="#features">Features</a>
          <span className={styles.navLinkItem} onClick={goToDocs}>
            Docs
          </span>
          <a href="#about">About us</a>
        </div>
        <button className={styles.navCta} onClick={handleLoginClick}>
          <User size={16} />
          Sign up | Log in
        </button>
      </nav>

      {/* Hero Section */}
      <header className={styles.hero}>
        
        <img src={starIcon} className={`${styles.star} ${styles.star1}`} alt="" />
        <img src={starIcon} className={`${styles.star} ${styles.star3}`} alt="" />
        <img src={starIcon} className={`${styles.star} ${styles.star4}`} alt="" />
        <img src={starIcon} className={`${styles.star} ${styles.star5}`} alt="" />
        <img src={starIcon} className={`${styles.star} ${styles.star6}`} alt="" />
        <img src={starIcon} className={`${styles.star} ${styles.star7}`} alt="" />
        <img src={dashboardIcon} className={`${styles.floatingIcon} ${styles.iconDashboard}`} alt="" />
        <img src={chartIcon} className={`${styles.floatingIcon} ${styles.iconChart}`} alt="" />
        <img src={setupIcon} className={`${styles.floatingIcon} ${styles.iconSettings}`} alt="" />
        <img src={dataIcon} className={`${styles.floatingIcon} ${styles.iconData}`} alt="" />
        <h1>
          Real-time Data<br />
          Bespoke Suggestions
        </h1>
        <p>
          Track user behavior, analyze interaction patterns, and drive intelligent models 
          to deliver tailored experiences for every user
        </p>
        <button className={styles.btnPrimary} onClick={handleLoginClick}>
          EXPLORE NOW
        </button>
      </header>

      {/* Features Section */}
      <section id="features" className={`${styles.featuresSection} ${styles.reveal}`}>
        <div className={styles.sectionHeader}>
          <h2>Core Features</h2>
          <p>Everything you need to track, analyze, and optimize your recommendation engine in one place.</p>
        </div>

        <div className={styles.featureGrid}>
          <div className={styles.featureCard}>
            <div className={styles.iconBox}><Database size={50} /></div>
            <h3>Multi-domain</h3>
            <p>Configure tracking for multiple sites in one dashboard</p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.iconBox}><Zap size={50} /></div>
            <h3>Real-time</h3>
            <p>Monitor clicks and views with lightning-fast charts</p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.iconBox}><Settings size={50} /></div>
            <h3>Flexible Rules</h3>
            <p>Setup rules without interfering too much with your frontend code</p>
          </div>
          
          <div className={styles.featureCard}>
            <div className={styles.iconBox}><LayoutTemplate size={50} /></div>
            <h3>Instant Display</h3>
            <p>Facilitate recommendation visualization with customizable pre-built UI components</p>
          </div>
        </div>

        {/* Phần Training Section: Kích hoạt huấn luyện mô hình */}
        <div className={styles.trainingSection}>
          <div className={styles.dotGridTopLeft}></div>
          <div className={styles.trainingContent}>
            <h2>Empower Your Intelligence Engine</h2>
            <p> Retrain your models using collected interaction logs to unlock deeper personalization. High-precision recommendations, delivered at scale</p>
            <ul className={styles.trainingList}>
              <li><ArrowRight size={18} color="#34d399" /> <span><b>Dynamic Weighting:</b> Customizable parameters for experts, fully automated by default</span></li>
              <li><ArrowRight size={18} color="#34d399" /> <span><b>Accuracy Boost:</b> Enhance the precision of suggestions as the model learns from more user interaction data</span></li>
              <li><ArrowRight size={18} color="#34d399" /> <span><b>Behavior-Driven Updates:</b> Directly update model parameters using the raw logs collected by the tracking system</span></li>
            </ul>
            <button className={styles.btnSecondary} onClick={handleLoginClick}>EXPLORE MORE</button>
          </div>
          
          <div className={styles.trainingVisualContainer}>
            <div className={styles.borderBeamCard}>
              <Brain size={80} className={styles.brainIcon} />
              <span style={{ letterSpacing: '2px', fontWeight: '600' }}>MODEL RETRAINING...</span>
              <div className={styles.progressBar}>
                <div className={styles.progressFill}></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className={`${styles.aboutSection} ${styles.reveal}`}>
        <div className={styles.aboutContainer}>
          
          {/* CỘT 1 (BÊN TRÁI): Hình minh họa và Lưới các trụ cột */}
          <div className={styles.aboutVisualCol}>
            <div className={styles.teamIllustration}>
              <img src={teamSvg} alt="RecoTrack Team Collaboration" />
            </div>
          </div>

          {/* CỘT 2 (BÊN PHẢI): Sứ mệnh và Câu chuyện */}
          <div className={styles.aboutTextCol}>
            <h2>BRIDGING THE GAP BETWEEN DATA AND PERSONALIZATION</h2>
            <p>
              <b>RecoTrack</b> was born from an academic quest to democratize personalization. We recognized that the infrastructure required to transform raw behavioral logs into meaningful experiences is often too complex for most developers to implement
            </p>
            
            <p>
              <b>Our solution </b> provides an end-to-end pipeline: from high-accuracy event tracking to a fully integrated Recommendation Display interface. This allows businesses to not only analyze data but also serve personalized content through a sleek, pluggable UI that fits perfectly into any existing design
            </p>

            <p>
              By focusing on actionable insights, the system is designed to process interactions promptly and reflect them in the recommendations that user sees next, allowing it to adapt in near real-time
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContainer}>
          {/* Cột trái: Thương hiệu & Social */}
          <div className={styles.footerBrand}>
            <div className={styles.footerLogo}>
              <Zap size={24} color="#34d399" fill="#34d399" />
              <span>RecoTrack</span>
            </div>
            
            <div className={styles.socialLinks}>
              <a href="https://facebook.com" target="_blank" rel="noreferrer" title="Follow us on Facebook">
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Cột phải: Thông tin liên hệ */}
          <div className={styles.footerContact}>
            <h4>Contact Info</h4>
            <ul>
              <li>
                <Mail size={18} color="#34d399" />
                <a href="mailto:contact@recotrack.com">contact@recotrack.com</a>
              </li>
              <li>
                <MapPin size={18} color="#34d399" />
                <span>Ho Chi Minh City, Vietnam</span>
              </li>
            </ul>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <p>&copy; 2026 RecoTrack - PS Group. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};
