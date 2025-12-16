import React, { useState, useEffect } from 'react';
import styles from './ItemUploadPage.module.css';
import { parseItemImportExcelFile, parseReviewExcelFile } from '@/utils/parseExcel';
import * as XLSX from 'xlsx';
import { Container } from '@/types';

interface ItemUploadPageProps {
  onUploadComplete?: () => void;
  container: Container | null;
}

type TabType = 'metadata' | 'review';

const TEMPLATE_HEADERS = ['SKU', 'Item Name', 'Category', 'Description'];
const REVIEW_TEMPLATE_HEADERS = ['ItemId', 'UserId', 'Rating', 'Review'];
const SAMPLE_ROW = [
  'SP-001', 
  'iPhone 15 Pro', 
  'Điện thoại; Apple', 
  'Titanium, 256GB'
];
const REVIEW_SAMPLE_ROW = ['SP-001', 'nguyenvana', 5, 'Sản phẩm rất tốt, giao hàng nhanh!'];

export const ItemUploadPage: React.FC<ItemUploadPageProps> = ({ onUploadComplete, container }) => {
  const [activeTab, setActiveTab] = useState<TabType>('metadata');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDownloadTemplate = () => {
    const isReviewTab = activeTab === 'review';
    
    const headers = isReviewTab ? REVIEW_TEMPLATE_HEADERS : TEMPLATE_HEADERS;
    const sample = isReviewTab ? REVIEW_SAMPLE_ROW : SAMPLE_ROW;
    const fileName = isReviewTab ? "Review_Import_Template.xlsx" : "Item_Import_Template.xlsx";

    const wsData = [ headers, sample ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    if (isReviewTab) {
        ws['!cols'] = [{ wch: 15 }, { wch: 20 }, { wch: 10 }, { wch: 50 }];
    } else {
        ws['!cols'] = [{ wch: 15 }, { wch: 30 }, { wch: 25 }, { wch: 50 }];
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, fileName);
  };

  const handleFileSelect = (selectedFile: File) => {
    const validExtensions = ['xlsx', 'xls', 'csv'];
    const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();

    if (!fileExtension || !validExtensions.includes(fileExtension)) {
      setError('Unsupported format. Please select an Excel (.xlsx, .xls) or CSV file.');
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
        setError('File is too large. Please select a file smaller than 5MB.');
        return;
    }

    setFile(selectedFile);
    setError(null);
    setSuccess(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    setUploading(true);
    setError(null);
    try {
      let jsonData;

      if (activeTab === 'metadata') {
        jsonData = await parseItemImportExcelFile(file);
      } else {
        jsonData = await parseReviewExcelFile(file);
      }
      
      console.log('Parsed Data:', jsonData);
      setSuccess(`Successfully parsed ${jsonData.length} items from "${file.name}"!`);
      
      if (onUploadComplete) onUploadComplete();

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to parse file. Please check the format.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setError(null);
    setSuccess(null);
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Import Data</h1>
        </div>

        {/* Tab Navigation */}
        <div className={styles.tabContainer}>
          <button
            className={`${styles.tab} ${activeTab === 'metadata' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('metadata')}
          >
            Item Metadata
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'review' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('review')}
          >
            Item Reviews
          </button>
        </div>

        <div className={styles.tabContent}>
          <div className={styles.uploadSection}>
            <div 
              className={`${styles.dropZone} ${dragActive ? styles.dragActive : ''} ${file ? styles.hasFile : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {!file ? (
                <>
                  <div className={styles.uploadIcon}>
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <p className={styles.dropText}>
                    Drag and drop Excel file here or
                  </p>
                  <label htmlFor="file-input" className={styles.browseButton}>
                    Browse Files
                  </label>
                  <input
                    id="file-input"
                    type="file"
                    accept=".csv, .xlsx, .xls"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                  <p className={styles.formatHint}>
                    Support: Excel (.xlsx,.xls) files only.
                  </p>
                </>
              ) : (
                <div className={styles.fileInfo}>
                  <div className={styles.fileIcon}>
                    {/* Excel Icon */}
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#107c41">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className={styles.fileDetails}>
                    <p className={styles.fileName}>{file.name}</p>
                    <p className={styles.fileSize}>
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                  <button 
                    className={styles.removeButton}
                    onClick={handleRemoveFile}
                    disabled={uploading}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {error && (
              <div className={styles.errorMessage}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            {success && (
              <div className={styles.successMessage}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {success}
              </div>
            )}

            <div className={styles.actions}>
              <button
                className={styles.uploadButton}
                onClick={handleUpload}
                disabled={!file || uploading}
              >
                {uploading ? 'Uploading...' : 'Import Data'}
              </button>
            </div>
          </div>

          <div className={styles.descriptionSection}>
            <div className={styles.descriptionHeaderRow} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 className={styles.descriptionTitle} style={{ margin: 0 }}>File Requirements</h3>
                <button 
                  onClick={handleDownloadTemplate}
                  className={styles.downloadTemplateBtn}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    fontSize: '14px',
                    color: '#0078d4',
                    border: '1px solid #0078d4',
                    borderRadius: '4px',
                    background: 'white',
                    cursor: 'pointer',
                    fontWeight: 500
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Template
                </button>
            </div>

            <p className={styles.descriptionText}>
              Please upload an Excel (.xlsx) file with the exact headers below:
            </p>
            
            {activeTab === 'metadata' ? (
              <div className={styles.fieldsList}>
                <div className={styles.fieldItem}>
                  <span className={styles.fieldName}>SKU / Item Code</span>
                  <span className={styles.fieldDescription}>Unique identifier for the item.</span>
                </div>
                <div className={styles.fieldItem}>
                  <span className={styles.fieldName}>Item Name</span>
                  <span className={styles.fieldDescription}>Display name of the product.</span>
                </div>
                <div className={styles.fieldItem}>
                  <span className={styles.fieldName}>Category</span>
                  <span className={styles.fieldDescription}>
                    Enter category name (Text). The system will find or create it automatically.
                    <br/><i>Example: "Smartphones"</i>
                  </span>
                </div>
                <div className={styles.fieldItem}>
                  <span className={styles.fieldName}>Description</span>
                  <span className={styles.fieldDescription}>Detailed information (Supports line breaks).</span>
                </div>
              </div>
            ) : (
              <div className={styles.fieldsList}>
                <div className={styles.fieldItem}>
                  <span className={styles.fieldName}>ItemId / SKU</span>
                  <span className={styles.fieldDescription}>Target item code for the review.</span>
                </div>
                
                <div className={styles.fieldItem}>
                  <span className={styles.fieldName}>UserId</span>
                  <span className={styles.fieldDescription}>Username of the reviewer.</span>
                </div>

                <div className={styles.fieldItem}>
                  <span className={styles.fieldName}>Rating</span>
                  <span className={styles.fieldDescription}>Score value (1 - 5).</span>
                </div>
                <div className={styles.fieldItem}>
                  <span className={styles.fieldName}>Review Content</span>
                  <span className={styles.fieldDescription}>Customer feedback text.</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};