import React, { useState } from 'react';
import { Container } from '../../types';
import { MOCK_SCRIPT_TEMPLATE } from '../../lib/constants';
import { Copy, Check, Code, Download, Package, FileCode } from 'lucide-react';
import styles from './LoaderScriptPage.module.css';

interface LoaderScriptPageProps {
  container: Container | null;
}

export const LoaderScriptPage: React.FC<LoaderScriptPageProps> = ({ container }) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'manual' | 'wordpress' | 'shopify' | 'gtm' | 'tealium'>('manual');
  const [gtmMethod, setGtmMethod] = useState('import'); 
  const gtmManualScript = `
    <script>window.__RECSYS_DOMAIN_KEY__ = "${container.uuid}";</script>
    <script src="https://tracking-sdk.s3-ap-southeast-2.amazonaws.com/dist/loader.js"></script>
    `;

  if (!container) {
    return (
      <div className={styles.container}>
        <div className={styles.scriptCard}>
          <div className={styles.emptyState}>
            <Code size={48} />
            <h2>No Container Found</h2>
            <p>Please create a container first to generate loader script.</p>
          </div>
        </div>
      </div>
    );
  }

  const loaderScript = MOCK_SCRIPT_TEMPLATE(container);

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

  // Tealium iQ Tag Template
  const tealiumTagTemplate = `{
  "name": "RecSys Tracker - Loader Script",
  "scope": "All Pages",
  "template_id": "custom_container",
  "template_version": "1.0",
  "html": ${JSON.stringify(loaderScript)},
  "execution": "after_tags"
}`;

  // WordPress Plugin Code
  const wordpressPluginCode = `<?php
/**
 * Plugin Name: RecSys Tracker Integration
 * Description: Automatically adds RecSys Tracker script to your WordPress site
 * Version: 1.0.0
 * Author: Your Company
 */

// Prevent direct access
if (!defined('ABSPATH')) exit;

function recsys_tracker_add_script() {
    $script = <<<EOT
${loaderScript.trim()}
EOT;
    echo $script;
}

// Add script to wp_head (in <head> tag)
add_action('wp_head', 'recsys_tracker_add_script');

// Alternative: Add to wp_footer (before </body> tag)
// add_action('wp_footer', 'recsys_tracker_add_script');
?>`;

  // Shopify Liquid Code
  const shopifyLiquidCode = `<!-- RecSys Tracker - Add this to theme.liquid before </head> tag -->
${loaderScript}`;

  return (
    <div className={styles.container}>
      <div className={styles.scriptCard}>
        <div className={styles.header}>
          <h2 className={styles.title}>Loader Script</h2>
          <p className={styles.subtitle}>Choose your preferred method to integrate RecSys Tracker into your website</p>
        </div>

        <div className={styles.tabContainer}>
        <button
          className={`${styles.tab} ${activeTab === 'manual' ? styles.active : ''}`}
          onClick={() => setActiveTab('manual')}
        >
          <Code size={18} />
          Manual Integration
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'wordpress' ? styles.active : ''}`}
          onClick={() => setActiveTab('wordpress')}
        >
          <Package size={18} />
          WordPress Plugin
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'shopify' ? styles.active : ''}`}
          onClick={() => setActiveTab('shopify')}
        >
          <Package size={18} />
          Shopify Integration
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'gtm' ? styles.active : ''}`}
          onClick={() => setActiveTab('gtm')}
        >
          <FileCode size={18} />
          Google Tag Manager
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'tealium' ? styles.active : ''}`}
          onClick={() => setActiveTab('tealium')}
        >
          <FileCode size={18} />
          Tealium iQ
        </button>
      </div>

      <div className={styles.content}>
        {/* Manual Integration */}
        {activeTab === 'manual' && (
          <div className={styles.section}>
            <h2>Manual Integration</h2>
            <div className={styles.instructions}>
              <h3>📋 Instructions:</h3>
              <ol>
                <li><strong>Step 1:</strong> Copy the script code below</li>
                <li><strong>Step 2:</strong> Open your website's HTML template or layout file</li>
                <li>
                  <strong>Step 3:</strong> Paste the code right before the closing <code>&lt;/head&gt;</code> tag
                  <ul>
                    <li>This ensures the tracker loads early and captures all user interactions</li>
                    <li>Alternative: You can also place it before <code>&lt;/body&gt;</code> tag if you want to prioritize page load speed</li>
                  </ul>
                </li>
                <li><strong>Step 4:</strong> Save the file and deploy your changes</li>
                <li><strong>Step 5:</strong> Verify the integration by checking browser console for RecSys Tracker logs</li>
              </ol>

              <div className={styles.placementExample}>
                <h4>Correct Placement Example:</h4>
                <pre>{`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Your Website</title>
  <link rel="stylesheet" href="styles.css">
  
  <!-- ✅ RecSys Tracker Script - Place here -->
  <script>window.__RECSYS_DOMAIN_KEY__ = "${container.uuid}";</script>
  <script src="https://tracking-sdk.s3-ap-southeast-2.amazonaws.com/dist/loader.js"></script>
  <!-- ✅ End of RecSys Tracker Script -->
  
</head>
<body>
  <!-- Your website content -->
</body>
</html>`}</pre>
              </div>
            </div>

            <div className={styles.codeBlock}>
              <div className={styles.codeHeader}>
                <span>Loader Script</span>
                <div className={styles.codeActions}>
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
          </div>
        )}

        {/* WordPress Plugin */}
        {activeTab === 'wordpress' && (
          <div className={styles.section}>
            <h2>WordPress Plugin Integration</h2>
            <div className={styles.instructions}>
              <h3>📦 Installation Steps:</h3>
              <ol>
                <li><strong>Step 1:</strong> Download the plugin file using the button below</li>
                <li><strong>Step 2:</strong> Go to your WordPress admin dashboard</li>
                <li><strong>Step 3:</strong> Navigate to <strong>Plugins → Add New → Upload Plugin</strong></li>
                <li><strong>Step 4:</strong> Select the downloaded <code>recsys-tracker-wp-plugin.php</code> file</li>
                <li><strong>Step 5:</strong> Click <strong>Install Now</strong> and then <strong>Activate Plugin</strong></li>
                <li><strong>Step 6:</strong> The script will automatically be added to all pages in your WordPress site</li>
              </ol>

              <div className={styles.alert}>
                <strong>⚠️ Alternative Manual Installation:</strong>
                <p>If automatic plugin upload doesn't work, you can manually add the code:</p>
                <ul>
                  <li>1. Go to <strong> Appearance → Theme Editor </strong></li>
                  <li>2. Select <strong>header.php</strong> from the right sidebar</li>
                  <li>3. Find the <code>&lt;/head&gt;</code> tag</li>
                  <li>4. Paste the script code right before <code>&lt;/head&gt;</code></li>
                  <li>5. Click <strong>Update File</strong></li>
                </ul>
              </div>
            </div>

            <div className={styles.codeBlock}>
              <div className={styles.codeHeader}>
                <span>WordPress Plugin Code</span>
                <div className={styles.codeActions}>
                  <button
                    onClick={() => handleCopy(wordpressPluginCode, 'wordpress')}
                    className={styles.copyButton}
                  >
                    {copiedSection === 'wordpress' ? (
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
                    onClick={() => handleDownload(wordpressPluginCode, 'recsys-tracker-wp-plugin.php')}
                    className={styles.downloadButton}
                  >
                    <Download size={16} /> Download Plugin
                  </button>
                </div>
              </div>
              <pre className={styles.code}>{wordpressPluginCode}</pre>
            </div>
          </div>
        )}

        {/* Shopify Integration */}
        {activeTab === 'shopify' && (
          <div className={styles.section}>
            <h2>Shopify Integration</h2>
            <div className={styles.instructions}>
              <h3>🛒 Installation Steps:</h3>
              <ol>
                <li><strong>Step 1:</strong> Log in to your Shopify admin dashboard</li>
                <li><strong>Step 2:</strong> Go to <strong>Online Store → Themes</strong></li>
                <li><strong>Step 3:</strong> Click <strong>Actions → Edit code</strong> on your active theme</li>
                <li><strong>Step 4:</strong> In the left sidebar, find and click on <strong>theme.liquid</strong></li>
                <li><strong>Step 5:</strong> Locate the <code>&lt;/head&gt;</code> tag (usually around line 50-100)</li>
                <li><strong>Step 6:</strong> Paste the script code right before <code>&lt;/head&gt;</code></li>
                <li><strong>Step 7:</strong> Click <strong>Save</strong> in the top right corner</li>
                <li><strong>Step 8:</strong> Test your store to verify the tracker is working</li>
              </ol>

              <div className={styles.alert}>
                <strong>💡 Pro Tip:</strong>
                <p>For multi-language stores, the script will automatically work across all language versions since it's in the main theme.liquid file.</p>
              </div>
            </div>

            <div className={styles.codeBlock}>
              <div className={styles.codeHeader}>
                <span>Shopify Liquid Code</span>
                <div className={styles.codeActions}>
                  <button
                    onClick={() => handleCopy(shopifyLiquidCode, 'shopify')}
                    className={styles.copyButton}
                  >
                    {copiedSection === 'shopify' ? (
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
                    onClick={() => handleDownload(shopifyLiquidCode, 'recsys-tracker-shopify.liquid')}
                    className={styles.downloadButton}
                  >
                    <Download size={16} /> Download
                  </button>
                </div>
              </div>
              <pre className={styles.code}>{shopifyLiquidCode}</pre>
            </div>
          </div>
        )}

        {/* Google Tag Manager */}
        {activeTab === 'gtm' && (
          <div className={styles.section}>
            <h2>Google Tag Manager Integration</h2>
            <div className={styles.subTabs}>
              <button
                className={`${styles.subTab} ${gtmMethod === 'import' ? styles.active : ''}`}
                onClick={() => setGtmMethod('import')}
              >
                📦 Import Container JSON
              </button>

              <button
                className={`${styles.subTab} ${gtmMethod === 'manual' ? styles.active : ''}`}
                onClick={() => setGtmMethod('manual')}
              >
                🏷️ Create Tag Manually
              </button>
            </div>
            {gtmMethod === 'import' && (
              <>
                <div className={styles.instructions}>
                  <h3>🏷️ Installation Steps:</h3>
                  <ol>
                    <li><strong>Step 1:</strong> Download the GTM container JSON file using the button below</li>
                    <li><strong>Step 2:</strong> Log in to your Google Tag Manager account</li>
                    <li><strong>Step 3:</strong> Select your container</li>
                    <li><strong>Step 4:</strong> Go to <strong>Admin → Import Container</strong></li>
                    <li><strong>Step 5:</strong> Click <strong>Choose container file</strong> and select the downloaded JSON file
                    </li>
                    <li><strong>Step 6:</strong> Choose import option:
                      <ul>
                        <li><strong>Merge</strong> - Recommended (adds new tag without affecting existing ones)</li>
                        <li><strong>Overwrite</strong> - Only if you want to replace all existing tags</li>
                      </ul>
                    </li>
                    <li><strong>Step 7:</strong> Click <strong>Confirm</strong></li>
                    <li><strong>Step 8:</strong> Review the imported tag through <strong>Preview</strong> and click <strong>Submit</strong></li>
                    <li><strong>Step 9:</strong> Add a version name and description, then click <strong>Publish</strong></li>
                  </ol>

                  <div className={styles.alert}>
                    <strong>✅ Verification:</strong>
                    <p>After publishing, use GTM Preview mode to test if the RecSys Tracker tag fires correctly on all pages.</p>
                  </div>
                </div>

                <div className={styles.codeBlock}>
                  <div className={styles.codeHeader}>
                    <span>GTM Container JSON</span>
                    <div className={styles.codeActions}>
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
                        <Download size={16} /> Download GTM Import File
                      </button>
                    </div>
                  </div>
                  <pre className={styles.code}>{gtmContainerJSON}</pre>
                </div>
              </>
            )}

            {gtmMethod === 'manual' && (
              <div className={styles.section}>

                <div className={styles.instructions}>
                  <ol>
                    <li>
                      <strong>Step 1:</strong> Log in to your Google Tag Manager account
                    </li>
                    <li>
                      <strong>Step 2:</strong> Select your container
                    </li>
                    <li>
                      <strong>Step 3:</strong> Go to <strong>Tags → New</strong>
                    </li>
                    <li>
                      <strong>Step 4:</strong> Tag Configuration → choose
                      <strong> Custom HTML</strong>
                    </li>
                    <li>
                      <strong>Step 5:</strong> Paste the following script into the HTML field
                    </li>
                    <li>
                      <strong>Step 6:</strong> Triggering → select
                      <strong> All Pages</strong> (or specific pages if needed)
                    </li>
                    <li>
                      <strong>Step 7:</strong> Save → Preview → Submit → Publish
                    </li>
                  </ol>

                  <div className={styles.alert}>
                    <strong>ℹ️ Recommendation:</strong>
                    <p>
                      If you only want recommendations on specific pages,
                      use <strong>Page View triggers</strong> with conditions
                      like <code>Page Path contains /product</code>.
                    </p>
                  </div>
                </div>

                <div className={styles.codeBlock}>
                  <div className={styles.codeHeader}>
                    <span>Custom HTML Tag Script</span>
                    <div className={styles.codeActions}>
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
                    </div>
                  </div>

                  <pre className={styles.code}>
                    {gtmManualScript}
                  </pre>
                </div>
              </div>
            )}


          </div>
        )}

        {/* Tealium iQ */}
        {activeTab === 'tealium' && (
          <div className={styles.section}>
            <h2>Tealium iQ Integration</h2>
            <div className={styles.instructions}>
              <h3>🔷 Installation Steps:</h3>
              <ol>
                <li><strong>Step 1:</strong> Log in to your Tealium iQ Tag Management console</li>
                <li><strong>Step 2:</strong> Select your account and profile</li>
                <li><strong>Step 3:</strong> Go to <strong>Tags → Add Tag</strong></li>
                <li><strong>Step 4:</strong> Choose <strong>Custom Container</strong> as the tag type</li>
                <li><strong>Step 5:</strong> Give your tag a name: "RecSys Tracker - Loader Script"</li>
                <li><strong>Step 6:</strong> In the <strong>Tag Configuration</strong> section:
                  <ul>
                    <li>Set <strong>Scope</strong> to "All Pages"</li>
                    <li>Set <strong>Execution</strong> to "After Tags" or "DOM Ready"</li>
                  </ul>
                </li>
                <li><strong>Step 7:</strong> Copy the loader script from below and paste it into the <strong>Custom HTML</strong> field</li>
                <li><strong>Step 8:</strong> Click <strong>Save</strong></li>
                <li><strong>Step 9:</strong> Click <strong>Save/Publish</strong> in the top menu to make the tag live</li>
              </ol>

              <div className={styles.alert}>
                <strong>🔍 Debugging:</strong>
                <p>Use Tealium's browser extension to verify the tag fires correctly. Look for "RecSys Tracker" in the tag firing sequence.</p>
              </div>
            </div>

            <div className={styles.codeBlock}>
              <div className={styles.codeHeader}>
                <span>Tealium Custom HTML Tag</span>
                <div className={styles.codeActions}>
                  <button
                    onClick={() => handleCopy(loaderScript, 'tealium')}
                    className={styles.copyButton}
                  >
                    {copiedSection === 'tealium' ? (
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
                    onClick={() => handleDownload(tealiumTagTemplate, 'Tealium-RecSysTracker-Tag.json')}
                    className={styles.downloadButton}
                  >
                    <Download size={16} /> Download Tag Template
                  </button>
                </div>
              </div>
              <pre className={styles.code}>{loaderScript}</pre>
            </div>
          </div>
        )}
      </div>
      </div>

      {/* General Information */}
      <div className={styles.footer}>
        <div className={styles.infoCard}>
          <h3>Container Information</h3>
          <div className={styles.infoGrid}>
            <div>
              <strong>Container Name:</strong> {container.name}
            </div>
            <div>
              <strong>Domain Key (UUID):</strong> <code>{container?.uuid.substring(0, 40)}...</code>
            </div>
            <div>
              <strong>Domain Type:</strong> {container.domainType}
            </div>
            <div>
              <strong>Active Rules:</strong> {container.rules.length}
            </div>
          </div>
        </div>

        <div className={styles.infoCard}>
          <h3>Additional Resources</h3>
          <ul>
            <li>
              <a href="#" target="_blank" rel="noopener noreferrer">
                Full Integration Documentation
              </a>
            </li>
            <li>
              <a href="#" target="_blank" rel="noopener noreferrer">
                Troubleshooting Guide
              </a>
            </li>
            <li>
              <a href="#" target="_blank" rel="noopener noreferrer">
                API Reference
              </a>
            </li>
            <li>
              <a href="#" target="_blank" rel="noopener noreferrer">
                Contact Support
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
