import React from 'react';
import styles from './DocumentationPage.module.css';
import { symlink } from 'fs';

interface DocsContentProps {
  activeTab: string;
}

interface Props {
  activeTab: string;
  setActiveSection: (section: string) => void;
}


const IntroContent = () => (
  <div className={styles.article}>
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
        <strong>Admin Panel</strong>: Fine-tune the training parameters and manually trigger model updates to ensure accuracy.
      </li>
    </ul>
  </div>
);

const ItemUploadContent = () => (
  <div className={styles.article}>
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
  <div className={styles.article}>
    <h1>Tracking Rules Guide</h1>
    <h2>Identify current user</h2>
    <p>
      This configuration determines how the system recognizes users when recording behavioral events. 
      Linking actions (clicks, plays, ratings, favorites, etc.) to a specific user is essential for 
      accurate behavioral analysis and personalized recommendations.
    </p>

    <ol className={styles.plainBulletList}>
      <li><strong>Define Identification Goal</strong>: Configure how the system maps interaction data to a specific identity. If no user is identified, the system automatically defaults to an <strong>anonymous user</strong>.</li>
      <li><strong>Select Identification Type</strong>: Choose between <code>UserId</code> (for known/logged-in users) or <code>AnonymousId</code> (for guest tracking).</li>
      <li><strong>Choose Data Source</strong>: Specify where the SDK should retrieve the user ID:
        <ul className={styles.plainBulletList} style={{ marginTop: '0.5rem', listStyleType: 'circle', paddingLeft: '1.5rem' }}>
          <li><strong>Request Body</strong>: Declare the endpoint, method, and JSON path.</li>
          <li><strong>UI Element</strong>: Provide a CSS Selector to extract text from the page.</li>
          <li><strong>Storage</strong>: Point to a specific key in Cookies, <code>local_storage</code>, or <code>session_storage</code>.</li>
        </ul>
      </li>
      <li><strong>Save Configuration</strong>: Click the <strong>Save Configuration</strong> button to apply the logic. The system prioritizes <code>UserId</code>; if it fails to find a value, it will automatically assign an <code>AnonymousId</code>.</li>
    </ol>


    <h2>Tracking Rules Configuration</h2>
    <p>
      The Tracking Rules section serves as the central hub for managing all behavioral data collection logic. 
      It allows you to oversee how user interactions are recorded across your domains.
    </p>
    <ol className={styles.plainBulletList}>
      <li><strong>Centralized Overview</strong>: View a comprehensive list of all configured tracking rules for your selected domain in one place.</li>
      <li><strong>Key Rule Attributes</strong>: Each rule in the list displays essential information, including:
        <ul className = {styles.plainBulletList} style={{ marginTop: '0.5rem', listStyleType: 'circle', paddingLeft: '1.5rem' }}>
          <li><strong>Event Type</strong>: The category of action being tracked (e.g., Click, Play, View).</li>
          <li><strong>Rule Name</strong>: The unique label assigned to identify the rule.</li>
          <li><strong>Tracking Target</strong>: The specific CSS Selector being monitored on your website.</li>
        </ul>
      </li>
      <li><strong>Administrative Actions</strong>: Efficiently manage your rules by viewing full details, editing existing configurations, or deleting rules that are no longer needed.</li>
      <li><strong>Expand Data Collection</strong>: Use the <strong>Add Rule</strong> button to initiate the creation of new tracking logic and integrate more behavioral triggers into your system.</li>
    </ol>
    <h2>Tracking rule management</h2>
    <h3>Define a rule</h3>
    <ol className={styles.plainNumberList}>
      <li>
        Identify the rule with name and interaction type. There will be a variety of interactions designed specifically for each type of domain.
        For example, music domain will track these following behaviors:
        <ol className={styles.plainBulletList}>
          <li>Play song</li>
          <li>Add song to favorite</li>
          <li>Add song to playlist</li>
          <li>Download song</li>
          <li>Buy/Unlock song</li>
          <li>Rating song</li>
          <li>Review song</li>
        </ol>
      </li>
      <li>
        Define <strong>Target element: </strong>Declare the target for data collection by using CSS Selectors to identify the specific 
        UI element that triggers the event.
      </li>
      <li>
        <strong>Payload mapping</strong> allows you to capture specific data from your website and link it to the interaction 
        events, ensuring the module receives full context for each action. You <strong>do not have to</strong> configure this section. 
        However, if your website's structure is not the same as default mode, you can expand the section and adjust the parameters below :
        <ol className={styles.plainBulletList}>
          <li>
            <strong>Source:</strong> The specific address of the data. 
            <ol className={styles.plainBulletList} style={{ marginTop: '0.5rem', listStyleType: 'circle', paddingLeft: '1.5rem' }}>
              <li>
                <strong>request_url</strong> (default): Used specifically when the Value Source is set to <strong>Request Body</strong>. 
                It defines the exact API endpoint the SDK should monitor. By providing a Request URL, you tell the system to only 
                intercept and "scrape" data from the body of network calls made to that specific address.
              </li>
              <li>
                <strong>request/response body</strong>: Capture data from the JSON body of outgoing requests or incoming responses.
              </li>
              <li>
                <strong>page_url</strong>: Captures the full web address of the page where the interaction occurs. This is used 
                to provide geographical context to an event, allowing the Tracking SDK to differentiate between a "View" on your homepage 
                versus a "View" on a specific product category page.
              </li>
              <li>
                <strong>element</strong>: Scrapes text directly from within an HTML tag. 
                For example, if you target a <code>&lt;span&gt;</code>, the SDK will capture the text displayed inside that span.
              </li>
            </ol>
          </li>
        </ol>
      </li>
      <li>
        Once saved, rules are pushed to the Tracking SDK in real-time, allowing for instant behavioral data collection.
      </li>
    </ol>
  </div>
);


const RecommendationContent = () => (
  <div className={styles.article}>
    <h1>Recommendation Method Display Guide</h1>
    <p>
      This feature allows for flexible and centralized management of how recommendations are presented on your website. 
      Administrators can define display styles, set trigger conditions, and manage configurations to ensure a seamless user experience.
    </p>
    <ol className={styles.plainBulletList}>
      <li><strong>Centralized Configuration Management</strong>: Create, track, and control all recommendation display settings in one place, allowing the system to adapt to various display scenarios and scale easily.</li>
      <li><strong>Display Types</strong>: Choose between two primary methods to return recommendations:
        <ul className={styles.plainBulletList} style={{ marginTop: '0.5rem', listStyleType: 'circle', paddingLeft: '1.5rem' }}>
          <li><strong>Popup Overlay</strong>: Floating windows that appear over the current content.</li>
          <li><strong>Inline Injection</strong>: Recommendations embedded directly into the website's existing layout.</li>
        </ul>
      </li>
      <li><strong>Trigger Conditions (Target Condition)</strong>: Define exactly when and where a recommendation should appear using <strong>URL patterns</strong> or <strong>CSS selectors</strong>.</li>
      <li><strong>Administrative Controls</strong>: Manage your configurations efficiently through the dashboard list, which displays the configuration name, type, and target conditions. You can also:
        <ul className={styles.plainBulletList} style={{ marginTop: '0.5rem', listStyleType: 'circle', paddingLeft: '1.5rem' }}>
          <li>Use the <strong>Type Filter</strong> to sort configurations by display format.</li>
          <li>Perform actions such as <strong>View</strong>, <strong>Edit</strong>, or <strong>Delete</strong>.</li>
        </ul>
      </li>
      <li><strong>Create New Configuration</strong>: Use the <strong>Create New Configuration</strong> button to select a display type and set up detailed parameters for new recommendation modules.</li>
    </ol>
    <h2>Detailed Display Configuration</h2>
    <p>
      This section allows you to fine-tune how recommendation content appears on the user interface. 
      Advanced configuration ensures that recommendations are not only functional but also aesthetically consistent with your website's design.
    </p>
    
    <ol className={styles.plainBulletList}>
      <li><strong>Basic Configuration</strong>: Start by selecting your display type (Popup Overlay or Inline Injection) and providing a unique Configuration Name for easy identification.</li>
      <li><strong>Set Activation Triggers</strong>: Define where the recommendation appears by entering a <strong>Trigger URL</strong> (for Popups) or a <strong>Target Selector</strong> (for Inline Injections).</li>
      <li><strong>Data Field Management</strong>: Customize the specific information displayed for each item:
        <ul className = {styles.plainBulletList} style={{ marginTop: '0.5rem', listStyleType: 'circle', paddingLeft: '1.5rem' }}>
          <li>Toggle individual data fields on or off.</li>
          <li>Reorder fields to prioritize important information.</li>
          <li>Apply unique styles to each field to match your brand (if necessary).</li>
        </ul>
      </li>
      <li><strong>Advanced UI Settings</strong>: Access professional tools to polish the display:
        <ul className = {styles.plainBulletList} style={{ marginTop: '0.5rem', listStyleType: 'circle', paddingLeft: '1.5rem' }}>
          <li><strong>Layout Selection</strong>: Choose layouts such as Grid Layout for a modern look.</li>
          <li><strong>Item Limits</strong>: Set the maximum number of recommendations shown at once.</li>
          <li><strong>Navigation</strong>: Configure the target URL when a user clicks on a recommended item.</li>
          <li><strong>Visual Styling</strong>: Customize typography, colors, spacing, and more.</li>
        </ul>
      </li>
      <li><strong>Preview and Finalize</strong>: Use the <strong>Live Preview</strong> feature to visualize changes in real-time. Once satisfied, click <strong>Save Configuration</strong> to apply the settings or <strong>Cancel</strong> to discard changes.</li>
    </ol>
    
  </div>
);

const LoaderScriptContent = () => (
  <div className={styles.article}>
    <h1>Loader Script Guide</h1>
    <p>
      The Loader Script allows you to embed the system's code into your website to enable behavior tracking 
      ànd display personalized recommendations based on your established configurations.
    </p>
    
    <h3>Key Functions</h3>
    <ol className={styles.plainBulletList}>
      <li><strong>Load Tracking SDK</strong>: Automatically initializes the core tracking module on your website.</li>
      <li><strong>Data Transmission</strong>: Sends behavioral events (such as play, rating, review, favorite, download, etc.) back to the system based on your defined tracking rules.</li>
      <li><strong>Display Recommendations</strong>: Receives and renders recommendation content through your chosen method (Popup Overlay or Inline Injection).</li>
      <li><strong>Automatic Updates</strong>: Ensures that any changes made in the dashboard are applied instantly without requiring manual code modifications to your website.</li>
    </ol>

    <h3>Manual Integration</h3>
    <ol className={styles.plainBulletList}>
      <li><strong>Copy Script</strong>: Copy the unique Loader Script snippet provided in your domain settings.</li>
      <li><strong>Insert into HTML</strong>: Paste the code snippet inside the <code>&lt;head&gt;</code> tag of your website's HTML file.</li>
      <li><strong>Deploy</strong>: Save your changes and deploy the updated code to your production environment.</li>
    </ol>

    <h3>Integration via Google Tag Manager (GTM)</h3>
    <ol className={styles.plainBulletList}>
      <li><strong>Download Configuration</strong>: Download the provided JSON configuration file from the dashboard.</li>
      <li><strong>Import Container</strong>: Navigate to <strong>Google Tag Manager</strong> &gt; <strong>Admin</strong> &gt; <strong>Import Container</strong>.</li>
      <li><strong>Upload File</strong>: Select the downloaded JSON file for upload.</li>
      <li><strong>Merge Configuration</strong>: Choose the <strong>Merge</strong> option to integrate the new settings into your existing container.</li>
      <li><strong>Preview & Publish</strong>: Use the <strong>Preview</strong> mode to verify the setup, then click <strong>Publish</strong> to apply the changes.</li>
    </ol>
  </div>
);

const AdminContent = () => (
  <div className={styles.article}>
    <h1>Modal Training for Admin Guide</h1>
    <p>
      This feature allows administrators to configure training parameters and actively trigger the 
      recommendation engine's training process using Latent Factor Models. This ensures your models 
      are consistently updated and optimized based on the latest user behavioral data.
    </p>
    
    <h3>Purpose & Capabilities</h3>
    <ol className={styles.plainBulletList}>
      <li><strong>Hyperparameter Configuration</strong>: Fine-tune the learning process by setting essential parameters such as <strong>Epochs</strong> (training iterations), <strong>Batch Size</strong>, and <strong>Convergence Tolerance</strong>.</li>
      <li><strong>Submodel Control</strong>: Manage the training of specialized submodels to handle complex recommendation scenarios across different data segments.</li>
      <li><strong>Automated Model Saving</strong>: Enable the system to automatically store the model state upon successful completion of the training cycle.</li>
      <li><strong>Manual Retraining Trigger</strong>: Actively restart the training process whenever new behavioral data is collected or configuration changes are made to ensure peak performance.</li>
    </ol>

    <h3>How to Use</h3>
    <ol className={styles.plainBulletList}>
      <li><strong>Adjust Parameters</strong>: Enter your desired values for the training hyperparameters in the provided input fields.</li>
      <li><strong>Toggle Options</strong>: Use the switches to enable or disable <strong>Save After Train</strong> and <strong>Train Submodels</strong> based on your current requirements.</li>
      <li><strong>Trigger Training</strong>: Click the <strong>Trigger Model Training</strong> button to send a request to the backend AI engine and start the optimization process.</li>
    </ol>
  </div>
);

const DemoContent = () => (
  <div className={styles.article}>
    <h1>RecoTrack Field Demonstrations</h1>
    <p>
      To validate the flexibility and robustness of the <b style={{ color:'#14B8A6' }}>Reco</b><b>Track</b> system, 
      we have conducted extensive experiments across four 
      distinct digital environments. Each demo showcases how the 
      system adapts its tracking logic and recommendation algorithms to different industry needs.
    </p>

    <div className={styles.videoGrid}>
      <section className={styles.demoSection}>
        <h2>1. Music Streaming (PSMusic)</h2>
        <p>
          Focuses on capturing <i>Play</i>, <i>Like</i>, and <i>Skip</i> behaviors to curate personalized 
          playlists for audiophiles.
        </p>
        <div className={styles.videoWrapper}>
          <iframe width="560" height="315" 
            src="https://www.youtube.com/embed/IYMu-Z1qFfw?si=uNMYIxAMrFynvohp" 
            title="YouTube video player" 
            frameborder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen" 
            referrerpolicy="strict-origin-when-cross-origin" 
            allowfullscreen>
          </iframe>
        </div>
      </section>

      <section className={styles.demoSection}>
        <h2>2. Movies & Video (Phimgaygo)</h2>
        <p>
          Demonstrates real-time tracking of viewing history and genre preferences to suggest 
          relevant cinematic content.
        </p>
        <div className={styles.videoWrapper}>
          <iframe width="560" height="315" 
            src="https://www.youtube.com/embed/s16Q2iHZT_c?si=-VCEAZ7qo_Amgpcy" 
            title="YouTube video player" 
            frameborder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen" 
            referrerpolicy="strict-origin-when-cross-origin" 
            allowfullscreen>
          </iframe>
        </div>
      </section>

      <section className={styles.demoSection}>
        <h2>3. E-Commerce (Whey Shop)</h2>
        <p>
          Optimizes the shopping journey by analyzing product interactions, cart additions, 
          and purchase intent.
        </p>
        <div className={styles.videoWrapper}>
          <iframe width="560" height="315" 
            src="https://www.youtube.com/embed/vgwLLLl-xRQ?si=X1Za9DahCVqdBWGW" 
            title="YouTube video player" 
            frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen" 
            referrerpolicy="strict-origin-when-cross-origin" 
            allowfullscreen>
          </iframe>
        </div>
      </section>

      <section className={styles.demoSection}>
        <h2>4. News & Media (Newsland)</h2>
        <p>
          Delivers personalized news feeds to informed readers by monitoring article engagement 
          and reading habits.
        </p>
        <div className={styles.videoWrapper}>
          <iframe width="560" height="315" 
            src="https://www.youtube.com/embed/0XTctsRJ5pc?si=P8kd3WnL6ju_f2Pm" 
            title="YouTube video player" 
            frameborder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen" 
            referrerpolicy="strict-origin-when-cross-origin" 
            allowfullscreen>
          </iframe>
        </div>
      </section>
    </div>
  </div>
);


export const DocumentationContent: React.FC<DocsContentProps> = ({ activeTab }) => {
  const contentMap: Record<string, React.ReactNode> = {
    'intro': <IntroContent />,
    'upload': <ItemUploadContent />,
    'trackingrule': <TrackingRulesContent />,
    'recommendation': <RecommendationContent />,
    'loaderscript': <LoaderScriptContent />,
    'admin': <AdminContent />,
    'demo': <DemoContent />,
  };

  return <>{contentMap[activeTab] || <h1>Select a topic</h1>}</>;
};