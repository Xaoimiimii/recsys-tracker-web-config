import React from 'react';
import styles from './DocumentationPage.module.css';

interface DocsContentProps {
  activeTab: string;
}

interface Props {
  activeTab: string;
  setActiveSection: (section: string) => void;
}


const IntroContent = () => (
  <div>
    <h1>Introduction to RecoTrack</h1>
    <p>
      <b style={{ color:'#14B8A6' }}>Reco</b><b>Track</b> is a powerful, pluggable recommendation module designed to seamlessly integrate behavior tracking 
      and personalized suggestions into any web platform. Built with a focus on flexibility and scalability, RecoTrack
        empowers businesses to understand user intent and deliver relevant content in real-time without the complexity 
        of building a recommendation engine from scratch.
    </p>
    <h2>Core Architecture</h2>
    <p>
        <b style={{ color:'#14B8A6' }}>Reco</b><b>Track</b> is composed of three primary subsystems that work in harmony:
            <ul className={styles.plainBulletList}>
                <li>
                    <strong>Web Configuration Platform</strong>: A centralized dashboard where partners can manage tracking rules, configure recommendation display methods, and monitor system performance.
                </li>
                <li>
                    <strong>Tracking SDK</strong>: A lightweight JavaScript module that can be easily embedded into any website to capture user interactions and display personalized recommendations.
                </li>
                <li>
                    <strong>Recommendation AI Engine</strong>: An advanced backend service that processes behavioral data using sophisticated Latent Factor Models to generate high-accuracy suggestions.
                </li>
            </ul>
    </p>
    <h2>Key Features</h2>
        <ul className={styles.plainBulletList}>
            <li>
                <strong>Dynamic Behavior Tracking</strong>: Effortlessly track views, clicks, searches, and other custom interactions through a rule-based configuration system that requires minimal code changes.
            </li>
            <li>
                <strong>Advanced AI Models</strong>: Leverages state-of-the-art machine learning, including sentiment analysis from user reviews and semantic processing of item descriptions, to enhance recommendation precision.
            </li>
            <li>
                <strong>Flexible Display Methods</strong>: Showcase recommendations through customizable Popup Overlays or Inline Injections that are designed to match your website’s aesthetic.
            </li>
            <li>
                <strong>Multi-Tenant Security</strong>: Ensures robust data isolation and security, allowing multiple domains to be managed independently within a single platform.
            </li>
            <li>
                <strong>Low-Cost Integration</strong>: Designed for rapid deployment with a "plug-and-play" philosophy, significantly reducing the technical overhead and cost of implementing a recommendation system.
            </li>
        </ul>
    <h2>Getting started with <b style={{ color:'#14B8A6' }}>Reco</b><b>Track</b></h2>
    <h3>1. Account Setup</h3>
    <p>
        <strong>Sign Up & Login</strong>: Create a new account by providing your full name, username, and password. 
    </p>

    <h3>2. Domain Configuration</h3>
    <ul className={styles.plainBulletList}>
      <li>
        <strong>Add Your Website</strong>: Register your website by entering its URL to generate a unique domain key.
      </li>
      <li>
        <strong>Select Domain Type</strong>: Choose from four specialized industry types to optimize behavior tracking.
        <ul style={{ marginTop: '1rem', listStyleType: 'circle', marginLeft: '1rem', }}>
          <li>Music Streaming</li>
          <li>Movies & Video</li>
          <li>E-Commerce</li>
          <li>News & Media</li>
        </ul>
      </li>
    </ul>
    <h3>3. Website Integration</h3>
    <p>
        To intergrate <b style={{ color:'#14B8A6' }}>Reco</b><b>Track</b> to your application, copy the generated script 
        snippet either in <b>Domain Details</b> by clicking <b>Domain?</b> button on your dashboard or choose <b>Loader Script"</b> on sidebar, in <b>Manual</b>
        tab and paste it into the <code>&lt;head&gt;</code> section of your website’s HTML.
    </p>
    <p>
        Alternatively, use the provided JSON configuration file to integrate via Google Tag Manager in <b>Loader Script</b> on sidebar, in <b>Google Tag Manager</b> tab for a no-code setup.
    </p>

    <h3>4. Explore Your Dashboard</h3>
    <ul className={styles.plainBulletList}>
      <li>
        <strong>Overview</strong>: Monitor real-time user activity and event statistics through interactive timeline charts.
      </li>
      <li>
        <strong>Item Upload</strong>: Import your product or content metadata using Excel/CSV files to feed the recommendation engine.
      </li>
      <li>
        <strong>Tracking Rules</strong>: Define custom behavior triggers like clicks or ratings using simple CSS selectors.
      </li>
      <li>
        <strong>Recommendation Display</strong>: Design and preview how suggestions appear on your site, choosing between Popup Overlays or Inline Injections.
      </li>
      <li>
        <strong>Admin Panel</strong>: Fine-tune AI training parameters and manually trigger model updates to ensure accuracy.
      </li>
    </ul>
  </div>
);

const ItemUploadContent = () => (
  <div>
    <h1>Item Upload Guide</h1>
    <p>
      The Item Upload feature allows you to provide the necessary metadata about your products or content to feed the Recommendation Model.
    </p>

    <ul className={styles.plainBulletList}>
      <li>
        <strong>Prepare Your Data</strong>: Organize your item information into a <code>.csv</code> or <code>.xlsx</code> file. Ensure each item has a unique ID and relevant attributes such as title, description, or category.
      </li>
      <li>
        <strong>Upload File</strong>: Navigate to the Item Upload section in your dashboard and select your prepared file. The system supports bulk processing for large-scale datasets.
      </li>
      <li>
        <strong>Field Mapping</strong>: Match the columns from your uploaded file to the system's required fields (e.g., mapping your "Product Name" column to the system's "item_name" field). This step is crucial to understand your data structure.
      </li>
      <li>
        <strong>Data Validation</strong>: Review the preview of your data to check for formatting errors or missing values. Correct any issues before final submission.
      </li>
      <li>
        <strong>Sync with Recommendation Engine</strong>: Once submitted, the items are stored in the database and will be automatically included in the next model training cycle to improve recommendation accuracy.
      </li>
    </ul>
  </div>
);

const TrackingRulesContent = () => (
  <div>
    <h1>Quick Start Guide</h1>
    <p>Nhúng đoạn mã loader vào thẻ <code>&lt;head&gt;</code> của trang web bạn muốn theo dõi tương tác.</p>
  </div>
);


const RecommendationContent = () => (
  <div>
    <h1>Quick Start Guide</h1>
    <p>Nhúng đoạn mã loader vào thẻ <code>&lt;head&gt;</code> của trang web bạn muốn theo dõi tương tác.</p>
  </div>
);

const LoaderScriptContent = () => (
  <div>
    <h1>Quick Start Guide</h1>
    <p>Nhúng đoạn mã loader vào thẻ <code>&lt;head&gt;</code> của trang web bạn muốn theo dõi tương tác.</p>
  </div>
);

const AdminContent = () => (
  <div>
    <h1>Quick Start Guide</h1>
    <p>Nhúng đoạn mã loader vào thẻ <code>&lt;head&gt;</code> của trang web bạn muốn theo dõi tương tác.</p>
  </div>
);

// --- COMPONENT CHÍNH ĐIỀU HƯỚNG NỘI DUNG ---


export const DocumentationContent: React.FC<DocsContentProps> = ({ activeTab }) => {
  const contentMap: Record<string, React.ReactNode> = {
    'intro': <IntroContent />,
    'upload': <ItemUploadContent />,
    'trackingrule': <TrackingRulesContent />,
    'recommendation': <RecommendationContent />,
    'loaderscript': <LoaderScriptContent />,
    'admin': <AdminContent />,
  };

  return <>{contentMap[activeTab] || <h1>Select a topic</h1>}</>;
};