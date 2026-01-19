import React, { useState } from 'react';
import { Container } from '../../types';
import { MOCK_SCRIPT_TEMPLATE } from '../../lib/constants';
import { Copy, Check, Download } from 'lucide-react';
import styles from './LoaderScriptPage.module.css';

interface LoaderScriptPageProps {
  container: Container | null;
}

export const LoaderScriptPage: React.FC<LoaderScriptPageProps> = ({ container }) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'manual' | 'gtm'>('manual');
  const [gtmMethod, setGtmMethod] = useState('import'); 
  const gtmManualScript = 
`<script>window.__RECSYS_DOMAIN_KEY__ = "${container.uuid}";</script>
<script src="https://tracking-sdk.s3-ap-southeast-2.amazonaws.com/dist/loader.js"></script>`;

  const loaderScript = MOCK_SCRIPT_TEMPLATE(container);

  if (!container) {
    return (
      <div className={styles.container}>
        <div className={styles.scriptCard}>
          <div className={styles.emptyState}>
            <h2>No Container Found</h2>
            <p>Please create a container first</p>
          </div>
        </div>
      </div>
    );
  }

  const handleCopy = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const handleDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // GTM Container JSON
  const gtmContainerJSON = JSON.stringify({
    exportFormatVersion: 2,
    exportTime: new Date().toISOString(),
    containerVersion: {
      tag: [{
        name: 'RecSys Tracker - Loader Script',
        type: 'html',
        html: loaderScript,
        firingTriggerId: ['2147479553'], // All Pages trigger
        tagFiringOption: 'oncePerEvent',
        monitoringMetadata: {
          type: 'map'
        }
      }]
    }
  }, null, 2);

  return (
    <div className={styles.container}>
      <div className={styles.scriptCard}>
        <div className={styles.header}>
          <h2 className={styles.title}>Loader Script</h2>
        </div>

        <div className={styles.tabContainer}>
        <button
          className={`${styles.tab} ${activeTab === 'manual' ? styles.active : ''}`}
          onClick={() => setActiveTab('manual')}
        >
          Manual
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'gtm' ? styles.active : ''}`}
          onClick={() => setActiveTab('gtm')}
        >
          Google Tag Manager
        </button>
      </div>

      <div className={styles.content}>
        {/* Manual Integration */}
        {activeTab === 'manual' && (
          <div className={styles.section}>
            <h2>Manual Integration</h2>
            <div className={styles.instructions}>
              <ol>
                <li>1. Copy the script code below</li>
                <li>2. Paste it before the <code>&lt;/head&gt;</code> tag in your HTML</li>
                <li>3. Save and deploy your changes</li>
              </ol>
            </div>

            <div className={styles.section}>
              <div className={styles.headerGroup}>
                <h2>Loader Script</h2>
                <div className={styles.buttonGroup}>
                  <button
                    onClick={() => handleCopy(loaderScript, 'manual')}
                    className={styles.copyButton}
                  >
                    {copiedSection === 'manual' ? (
                      <>
                        <Check size={16} /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={16} /> Copy
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleDownload(loaderScript, 'recsys-tracker.html')}
                    className={styles.downloadButton}
                  >
                    <Download size={16} /> Download
                  </button>
                </div>
              </div>
              <pre className={styles.code}>{loaderScript}</pre>
            </div>

            <div>
              <h2>Example</h2>
              <pre className={styles.code}>
{`<!DOCTYPE html>
<html>
<head>
  <title>Your Website</title>
  
  <!-- RecSys Tracker Script -->
  <script>window.__RECSYS_DOMAIN_KEY__ = "${container.uuid}";</script>
  <script src="https://tracking-sdk.s3-ap-southeast-2.amazonaws.com/dist/loader.js"></script>
  
</head>
<body>
  <!-- Your content -->
</body>
</html>`}</pre>
            </div>
          </div>
        )}

        {/* Google Tag Manager */}
        {activeTab === 'gtm' && (
          <div className={styles.section}>
            <div className={styles.subTabs}>
              <button
                className={`${styles.subTab} ${gtmMethod === 'import' ? styles.active : ''}`}
                onClick={() => setGtmMethod('import')}
              >
                Import JSON
              </button>

              <button
                className={`${styles.subTab} ${gtmMethod === 'manual' ? styles.active : ''}`}
                onClick={() => setGtmMethod('manual')}
              >
                Manual Setup
              </button>
            </div>
            {gtmMethod === 'import' && (
              <>
                <h2>Installation Steps:</h2>
                <div className={styles.instructions}>
                  <ol>
                    <li>1. Download the JSON file below</li>
                    <li>2. In GTM, go to <strong>Admin → Import Container</strong></li>
                    <li>3. Upload the JSON file</li>
                    <li>4. Choose <strong>Merge</strong> option</li>
                    <li>5. Preview and publish the changes</li>
                  </ol>
                </div>

                <div className={styles.section}>
                  <div className={styles.headerGroup}>
                    <h2>GTM Container JSON</h2>
                    <div className={styles.buttonGroup}>
                      <button
                        onClick={() => handleCopy(gtmContainerJSON, 'gtm')}
                        className={styles.copyButton}
                      >
                        {copiedSection === 'gtm' ? (
                          <>
                            <Check size={16} /> Copied!
                          </>
                        ) : (
                          <>
                            <Copy size={16} /> Copy
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleDownload(gtmContainerJSON, 'GTM-RecSysTracker-Import.json')}
                        className={styles.downloadButton}
                      >
                        <Download size={16} /> Download
                      </button>
                    </div>
                  </div>
                  <pre className={styles.code}>{gtmContainerJSON}</pre>
                </div>
              </>
            )}

            {gtmMethod === 'manual' && (
              <>
                <h2>Manual Steps:</h2>
                <div className={styles.instructions}>
                  <ol>
                    <li>1. In GTM, go to <strong>Tags → New</strong></li>
                    <li>2. Choose <strong>Custom HTML</strong></li>
                    <li>3. Paste the script below</li>
                    <li>4. Set trigger to <strong>All Pages</strong></li>
                    <li>5. Save, preview, and publish</li>
                  </ol>
                </div>

                <div className={styles.section}>
                  <div className={styles.headerGroup}>
                    <h2>Custom HTML Tag</h2>
                    <div className={styles.buttonGroup}>
                      <button
                        onClick={() => handleCopy(gtmManualScript, 'gtm-manual')}
                        className={styles.copyButton}
                      >
                        {copiedSection === 'gtm-manual' ? (
                          <>
                            <Check size={16} /> Copied!
                          </>
                        ) : (
                          <>
                            <Copy size={16} /> Copy
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleDownload(loaderScript, 'recsys-tracker.html')}
                        className={styles.downloadButton}
                      >
                        <Download size={16} /> Download
                      </button>
                    </div>
                  </div>
                  <pre className={styles.code}>
                    {gtmManualScript}
                  </pre>
                </div>
              </>
            )}


          </div>
        )}
      </div>
    </div>
  </div>
);
};
