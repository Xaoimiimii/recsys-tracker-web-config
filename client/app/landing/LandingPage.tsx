import React from 'react';
import { 
  Activity, 
  Database, 
  Settings, 
  Zap, 
  ChevronRight, 
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
          <Activity size={28} strokeWidth={3} />
          <span>RecoTrack</span>
        </div>
        <div className={styles.navLinks}>
          <a href="#features">Tính năng</a>
          <a href="#docs">Tài liệu</a>
          <a href="#pricing">Bảng giá</a>
          <button className={`${styles.btnPrimary} ${styles.navCta}`}>Bắt đầu ngay</button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className={styles.hero}>
        <h1>
          Cấu hình hệ thống gợi ý <br />
          <span className={styles.highlight}>chỉ trong vài giây</span>
        </h1>
        <p>
          RecoTrack cung cấp bộ công cụ mạnh mẽ để theo dõi hành vi người dùng, 
          quản lý domain và tối ưu hóa thuật toán RecSys mà không cần viết lại mã nguồn.
        </p>
        <div className={styles.ctaGroup}>
          <button className={styles.btnPrimary}>
            Thử nghiệm miễn phí
          </button>
          <button className={styles.btnSecondary}>
            Xem tài liệu 
            <span className={styles.chevronIcon}>
              <ChevronRight size={18} />
            </span>
          </button>
        </div>
      </header>

      {/* Features Section */}
      <section id="features" className={styles.featuresSection}>
        <div className={styles.featureGrid}>
          <div className={styles.featureCard}>
            <div className={styles.iconBox}>
              <Database size={24} />
            </div>
            <h3>Quản lý Đa Domain</h3>
            <p>Dễ dàng chuyển đổi và cấu hình các quy tắc theo dõi cho nhiều website khác nhau trên một giao diện duy nhất.</p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.iconBox}>
              <Zap size={24} />
            </div>
            <h3>Phân tích Real-time</h3>
            <p>Theo dõi các sự kiện (click, view, purchase) ngay lập tức thông qua biểu đồ trực quan hóa dữ liệu cực nhanh.</p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.iconBox}>
              <Settings size={24} />
            </div>
            <h3>Quy tắc Linh hoạt</h3>
            <p>Thiết lập các Tracking Rules tùy chỉnh mà không cần can thiệp sâu vào code frontend của ứng dụng.</p>
          </div>
          
          <div className={styles.featureCard}>
            <div className={styles.iconBox}>
              <ShieldCheck size={24} />
            </div>
            <h3>An toàn & Bảo mật</h3>
            <p>Quản lý quyền truy cập thông qua Domain Key và bộ lọc Origin để đảm bảo dữ liệu của bạn luôn an toàn.</p>
          </div>
        </div>
      </section>

      {/* Integration Section */}
      <section className={styles.integrationSection}>
        <div className={`${styles.iconBox} ${styles.iconBoxCenter}`}>
          <Code size={24} />
        </div>
        <h2 className={styles.integrationTitle}>Tích hợp chỉ với một dòng mã</h2>
        <p className={styles.integrationText}>Dán mã script này vào thẻ head của bạn để bắt đầu thu thập dữ liệu.</p>
        
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
        <p>&copy; 2026 RecoTrack. Hệ thống quản lý RecSys chuyên nghiệp.</p>
      </footer>
    </div>
  );
};