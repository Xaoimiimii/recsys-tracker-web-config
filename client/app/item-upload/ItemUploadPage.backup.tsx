import React, { useState, useEffect } from "react";
import styles from "./ItemUploadPage.module.css";
import {
  parseItemImportExcelFile,
  parseReviewExcelFile,
} from "@/utils/parseExcel";
import * as XLSX from "xlsx";
import { Container } from "@/types";
import {
  CreateItemInput,
  CreateReviewInput,
  UpdateItemInput,
  itemApi,
  reviewApi,
} from "@/lib/api/item";

interface ItemUploadPageProps {
  onUploadComplete?: () => void;
  container: Container | null;
}

type TabType = "metadata" | "review";

interface CustomField {
  id: string;
  name: string;
  sampleValue: string;
}

const DEFAULT_HEADERS = [
  "SKU",
  "Item Name",
  "Category",
  "Description",
  "Image",
];
const REVIEW_TEMPLATE_HEADERS = ["ItemId", "UserId", "Rating", "Review"];
const DEFAULT_SAMPLE = [
  "SP-001",
  "iPhone 15 Pro",
  "Điện thoại; Apple",
  "Titanium, 256GB",
  "https://example.com/images/iphone15.jpg",
];
const REVIEW_SAMPLE_ROW = [
  "SP-001",
  "nguyenvana",
  5,
  "Sản phẩm rất tốt, giao hàng nhanh!",
];

export const ItemUploadPage: React.FC<ItemUploadPageProps> = ({
  onUploadComplete,
  container,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("metadata");
  const [importMode, setImportMode] = useState<"create" | "update">("create");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldSample, setNewFieldSample] = useState("");

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
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
    const isReviewTab = activeTab === "review";

    if (isReviewTab) {
      const headers = REVIEW_TEMPLATE_HEADERS;
      const sample = REVIEW_SAMPLE_ROW;
      const fileName = "Review_Import_Template.xlsx";
      const wsData = [headers, sample];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      ws["!cols"] = [{ wch: 15 }, { wch: 20 }, { wch: 10 }, { wch: 50 }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Template");
      XLSX.writeFile(wb, fileName);
    } else {
      // Item metadata with custom fields
      const headers = [...DEFAULT_HEADERS, ...customFields.map((f) => f.name)];
      const sample = [
        ...DEFAULT_SAMPLE,
        ...customFields.map((f) => f.sampleValue),
      ];
      const fileName = "Item_Import_Template.xlsx";

      const wsData = [headers, sample];
      const ws = XLSX.utils.aoa_to_sheet(wsData);

      const colWidths = [
        { wch: 15 },
        { wch: 30 },
        { wch: 25 },
        { wch: 50 },
        { wch: 40 },
      ];
      customFields.forEach(() => colWidths.push({ wch: 20 }));
      ws["!cols"] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Template");
      XLSX.writeFile(wb, fileName);
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    const validExtensions = ["xlsx", "xls", "csv"];
    const fileExtension = selectedFile.name.split(".").pop()?.toLowerCase();

    if (!fileExtension || !validExtensions.includes(fileExtension)) {
      setError(
        "Unsupported format. Please select an Excel (.xlsx, .xls) or CSV file."
      );
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("File is too large. Please select a file smaller than 5MB.");
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
      setError("Please select a file to upload.");
      return;
    }

    setUploading(true);
    setError(null);
    try {
      let jsonData;
      const currentDomainId = container?.uuid || "";

      if (!currentDomainId) {
        throw new Error("Please select a domain first.");
      }

      if (activeTab === "metadata") {
        const customFieldNames = customFields.map((f) => f.name);
        jsonData = await parseItemImportExcelFile(file, customFieldNames, importMode);
        
        let mappedData: CreateItemInput[] | UpdateItemInput[];
        
        if (importMode === "create") {
          mappedData = jsonData.map((row) => ({
            TernantItemId: row.sku || "",
            Title: row.name || "No Title",
            Description: row.description || "",
            Categories: row.categories || [],
            ImageUrl: row.imageUrl || "",
            DomainKey: currentDomainId,
            Attributes: row.customAttributes || {},
          }));
          
          const validItems = mappedData.filter(
            (item) => item.Title && item.TernantItemId
          );
          if (validItems.length === 0) {
            throw new Error("No valid items found in the file.");
          }
          
          await itemApi.createBulk(validItems as CreateItemInput[]);
        } else {
          mappedData = jsonData.map((row) => {
            const item: any = {
              TernantItemId: row.sku || "",
              DomainKey: currentDomainId,
            };
            
            if (row.name !== undefined && row.name !== null && row.name.trim()) {
              item.Title = row.name.trim();
            }
            if (row.description !== undefined && row.description !== null && row.description.trim()) {
              item.Description = row.description.trim();
            }
            if (row.categories && row.categories.length > 0) item.Categories = row.categories;
            if (row.imageUrl && row.imageUrl.trim()) item.ImageUrl = row.imageUrl.trim();
            if (row.customAttributes && Object.keys(row.customAttributes).length > 0) {
              item.Attributes = row.customAttributes;
            }
            
            return item;
          });
          
          const validItems = mappedData.filter((item) => item.TernantItemId);
          if (validItems.length === 0) {
            throw new Error("No valid items found in the file.");
          }
          
          await itemApi.updateBulk(validItems as UpdateItemInput[]);
        }
      } else {
        jsonData = await parseReviewExcelFile(file);

        const mappedReviews: CreateReviewInput[] = jsonData.map((row) => ({
          itemId: row.itemId,
          userId: row.userId,
          rating: row.rating,
          review: row.review,
          DomainKey: currentDomainId,
        }));

        const validReviews = mappedReviews.filter(
          (r) => r.itemId && r.userId && r.rating
        );

        if (validReviews.length === 0) {
          throw new Error("No valid reviews found in the file.");
        }

        console.log("Sending reviews to API:", validReviews);
        await reviewApi.createBulk(validReviews);
        jsonData = validReviews;
      }

      const action = importMode === "create" ? "imported" : "updated";
      setSuccess(
        `Successfully ${action} ${jsonData.length} ${
          activeTab === "metadata" ? "items" : "reviews"
        } from "${file.name}"!`
      );

      if (onUploadComplete) onUploadComplete();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to parse file. Please check the format.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setError(null);
    setSuccess(null);
    const fileInput = document.getElementById("file-input") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const handleAddCustomField = () => {
    const trimmedName = newFieldName.trim();
    const trimmedSample = newFieldSample.trim();

    if (!trimmedName) {
      setError("Please enter a field name");
      return;
    }

    if (
      customFields.some(
        (f) => f.name.toLowerCase() === trimmedName.toLowerCase()
      )
    ) {
      setError("Field name already exists");
      return;
    }

    const newField: CustomField = {
      id: Date.now().toString(),
      name: trimmedName,
      sampleValue: trimmedSample || "Sample value",
    };

    setCustomFields((prev) => [...prev, newField]);
    setNewFieldName("");
    setNewFieldSample("");
    setError(null);
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
            className={`${styles.tab} ${
              activeTab === "metadata" ? styles.tabActive : ""
            }`}
            onClick={() => setActiveTab("metadata")}
          >
            Item Metadata
          </button>
          <button
            className={`${styles.tab} ${
              activeTab === "review" ? styles.tabActive : ""
            }`}
            onClick={() => setActiveTab("review")}
          >
            Item Rating
          </button>
        </div>

        {/* Import Mode Toggle - Only show for Item Metadata tab */}
        {activeTab === "metadata" && (
          <div style={{
            display: "flex",
            justifyContent: "center",
            gap: "12px",
            padding: "16px 0",
            borderBottom: "1px solid #e0e0e0",
          }}>
            <button
              className={`${styles.modeButton} ${
                importMode === "create" ? styles.modeButtonActive : ""
              }`}
              onClick={() => setImportMode("create")}
              style={{
                padding: "8px 24px",
                borderRadius: "6px",
                border: importMode === "create" ? "2px solid #0078d4" : "1px solid #d0d0d0",
                background: importMode === "create" ? "#e6f2ff" : "white",
                color: importMode === "create" ? "#0078d4" : "#666",
                cursor: "pointer",
                fontWeight: importMode === "create" ? "600" : "normal",
                transition: "all 0.2s",
              }}
            >
              Create New Items
            </button>
            <button
              className={`${styles.modeButton} ${
                importMode === "update" ? styles.modeButtonActive : ""
              }`}
              onClick={() => setImportMode("update")}
              style={{
                padding: "8px 24px",
                borderRadius: "6px",
                border: importMode === "update" ? "2px solid #0078d4" : "1px solid #d0d0d0",
                background: importMode === "update" ? "#e6f2ff" : "white",
                color: importMode === "update" ? "#0078d4" : "#666",
                cursor: "pointer",
                fontWeight: importMode === "update" ? "600" : "normal",
                transition: "all 0.2s",
              }}
            >
              Update Existing Items
            </button>
          </div>
        )}

        <div className={styles.tabContent}>
          <div className={styles.uploadSection}>
            <div
              className={`${styles.dropZone} ${
                dragActive ? styles.dragActive : ""
              } ${file ? styles.hasFile : ""}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {!file ? (
                <>
                  <div className={styles.uploadIcon}>
                    <svg
                      width="64"
                      height="64"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
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
                    style={{ display: "none" }}
                  />
                  <p className={styles.formatHint}>
                    Support: Excel (.xlsx,.xls) files only.
                  </p>
                </>
              ) : (
                <div className={styles.fileInfo}>
                  <div className={styles.fileIcon}>
                    {/* Excel Icon */}
                    <svg
                      width="48"
                      height="48"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#107c41"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
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
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {error && (
              <div className={styles.errorMessage}>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {error}
              </div>
            )}

            {success && (
              <div className={styles.successMessage}>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
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
                {uploading 
                  ? (importMode === "create" ? "Importing..." : "Updating...") 
                  : (importMode === "create" ? "Import Data" : "Update Data")}
              </button>
            </div>
          </div>

          <div className={styles.descriptionSection}>
            <div
              className={styles.descriptionHeaderRow}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1rem",
              }}
            >
              <h3 className={styles.descriptionTitle} style={{ margin: 0 }}>
                File Requirements
              </h3>
              <button
                onClick={handleDownloadTemplate}
                className={styles.downloadTemplateBtn}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 12px",
                  fontSize: "14px",
                  color: "#0078d4",
                  border: "1px solid #0078d4",
                  borderRadius: "4px",
                  background: "white",
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Download Template
              </button>
            </div>

            <p className={styles.descriptionText}>
              {importMode === "create" 
                ? "Please upload an Excel (.xlsx) file with the exact headers below:"
                : "Please upload an Excel (.xlsx) file with item SKUs and fields to update. Only provided fields will be updated."}
            </p>

            {activeTab === "metadata" ? (
              <div className={styles.fieldsList}>
                <div className={styles.fieldItem}>
                  <span className={styles.fieldName}>SKU / Item Code</span>
                  <span className={styles.fieldDescription}>
                    Unique identifier for the item.
                  </span>
                </div>
                <div className={styles.fieldItem}>
                  <span className={styles.fieldName}>Item Name</span>
                  <span className={styles.fieldDescription}>
                    Display name of the product.
                  </span>
                </div>
                <div className={styles.fieldItem}>
                  <span className={styles.fieldName}>Category</span>
                  <span className={styles.fieldDescription}>
                    Enter category name (Text). The system will find or create
                    it automatically.
                    <br />
                    <i>Example: "Smartphones"</i>
                  </span>
                </div>
                <div className={styles.fieldItem}>
                  <span className={styles.fieldName}>Description</span>
                  <span className={styles.fieldDescription}>
                    Detailed information (Supports line breaks).
                  </span>
                </div>
                <div className={styles.fieldItem}>
                  <span className={styles.fieldName}>Image</span>
                  <span className={styles.fieldDescription}>
                    URL of the product image which will be displayed.
                  </span>
                </div>
                {activeTab === "metadata" && (
                  <div className={styles.customFieldsSection}>
                    <h3 className={styles.sectionTitle}>
                      Custom Fields (Optional)
                    </h3>
                    <p className={styles.sectionDescription}>
                      Add additional fields to capture extra product information
                    </p>

                    <div className={styles.customFieldsList}>
                      {customFields.map((field) => (
                        <div key={field.id} className={styles.customFieldItem}>
                          <div className={styles.fieldInfo}>
                            <span className={styles.fieldLabel}>
                              {field.name}
                            </span>
                            <span className={styles.fieldSample}>
                              Example: {field.sampleValue}
                            </span>
                          </div>
                          <button
                            className={styles.removeFieldBtn}
                            onClick={() =>
                              setCustomFields((prev) =>
                                prev.filter((f) => f.id !== field.id)
                              )
                            }
                            title="Remove field"
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className={styles.addFieldForm}>
                      <input
                        type="text"
                        className={styles.fieldInput}
                        placeholder="Field name (e.g., Brand, Color, Size)"
                        value={newFieldName}
                        onChange={(e) => setNewFieldName(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const input = document.getElementById(
                              "field-sample-input"
                            ) as HTMLInputElement;
                            input?.focus();
                          }
                        }}
                      />
                      <input
                        id="field-sample-input"
                        type="text"
                        className={styles.fieldInput}
                        placeholder="Sample value (e.g., Apple, Red, XL)"
                        value={newFieldSample}
                        onChange={(e) => setNewFieldSample(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddCustomField();
                          }
                        }}
                      />
                      <button
                        className={styles.addFieldBtn}
                        onClick={handleAddCustomField}
                        disabled={!newFieldName.trim()}
                      >
                        Add Field
                      </button>
                    </div>
                  </div>
                )}
                {customFields.length > 0 && (
                  <>
                    <div className={styles.fieldDivider}></div>
                    {customFields.map((field) => (
                      <div key={field.id} className={styles.fieldItem}>
                        <span className={styles.fieldName}>{field.name}</span>
                        <span className={styles.fieldDescription}>
                          Custom field - Example: {field.sampleValue}
                        </span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            ) : (
              <div className={styles.fieldsList}>
                <div className={styles.fieldItem}>
                  <span className={styles.fieldName}>ItemId / SKU</span>
                  <span className={styles.fieldDescription}>
                    Target item code for the review.
                  </span>
                </div>

                <div className={styles.fieldItem}>
                  <span className={styles.fieldName}>UserId</span>
                  <span className={styles.fieldDescription}>
                    Username of the reviewer.
                  </span>
                </div>

                <div className={styles.fieldItem}>
                  <span className={styles.fieldName}>Rating</span>
                  <span className={styles.fieldDescription}>
                    Score value (1 - 5).
                  </span>
                </div>
                <div className={styles.fieldItem}>
                  <span className={styles.fieldName}>Review Content</span>
                  <span className={styles.fieldDescription}>
                    Customer feedback text.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
