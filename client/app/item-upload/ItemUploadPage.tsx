import React, { useState } from 'react';
import styles from './ItemUploadPage.module.css';

interface ItemUploadPageProps {
  onUploadComplete?: () => void;
}

type TabType = 'metadata' | 'review';

export const ItemUploadPage: React.FC<ItemUploadPageProps> = ({ onUploadComplete }) => {
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

  const handleFileSelect = (selectedFile: File) => {
    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!validTypes.includes(selectedFile.type) && 
        !selectedFile.name.endsWith('.csv') && 
        !selectedFile.name.endsWith('.xlsx') && 
        !selectedFile.name.endsWith('.xls')) {
      setError('Vui lòng chọn file CSV hoặc Excel (.csv, .xlsx, .xls)');
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
      setError('Vui lòng chọn file để upload');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      // TODO: Implement API call to upload file
      // const result = await uploadItemMetadata(file);
      
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSuccess(`Upload thành công! File "${file.name}" đã được chọn và sẵn sàng xử lý.`);
      setFile(null);
      
      if (onUploadComplete) {
        onUploadComplete();
      }

      // Reset file input
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (err: any) {
      setError(err.message || 'Upload thất bại. Vui lòng thử lại.');
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
          <h1 className={styles.title}>Upload Item Data</h1>
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
            Item Review
          </button>
        </div>

        {/* Tab Content */}
        <div className={styles.tabContent}>
          {/* Upload Section */}
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
                    Kéo thả file vào đây hoặc
                  </p>
                  <label htmlFor="file-input" className={styles.browseButton}>
                    Chọn file
                  </label>
                  <input
                    id="file-input"
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                  <p className={styles.formatHint}>
                    Hỗ trợ: CSV, Excel (.csv, .xlsx, .xls)
                  </p>
                </>
              ) : (
                <div className={styles.fileInfo}>
                  <div className={styles.fileIcon}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
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
                {uploading ? 'Đang upload...' : 'Upload File'}
              </button>
            </div>
          </div>

          {/* Description Section */}
          <div className={styles.descriptionSection}>
            <h3 className={styles.descriptionTitle}>Yêu cầu định dạng file</h3>
            <p className={styles.descriptionText}>
              File phải có định dạng CSV hoặc Excel (.csv, .xlsx, .xls) với dòng đầu tiên là header chứa các cột sau:
            </p>
            
            {activeTab === 'metadata' ? (
              <div className={styles.fieldsList}>
                <div className={styles.fieldItem}>
                  <span className={styles.fieldName}>ItemId</span>
                  <span className={styles.fieldDescription}>ID của item (bắt buộc)</span>
                </div>
                <div className={styles.fieldItem}>
                  <span className={styles.fieldName}>Title</span>
                  <span className={styles.fieldDescription}>Tiêu đề của item</span>
                </div>
                <div className={styles.fieldItem}>
                  <span className={styles.fieldName}>Category</span>
                  <span className={styles.fieldDescription}>Danh mục của item</span>
                </div>
                <div className={styles.fieldItem}>
                  <span className={styles.fieldName}>Description</span>
                  <span className={styles.fieldDescription}>Mô tả chi tiết của item</span>
                </div>
              </div>
            ) : (
              <div className={styles.fieldsList}>
                <div className={styles.fieldItem}>
                  <span className={styles.fieldName}>ItemId</span>
                  <span className={styles.fieldDescription}>ID của item (bắt buộc)</span>
                </div>
                <div className={styles.fieldItem}>
                  <span className={styles.fieldName}>Rating</span>
                  <span className={styles.fieldDescription}>Đánh giá (số từ 1-5)</span>
                </div>
                <div className={styles.fieldItem}>
                  <span className={styles.fieldName}>Review</span>
                  <span className={styles.fieldDescription}>Nội dung đánh giá</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
