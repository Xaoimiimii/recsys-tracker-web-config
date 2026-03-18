import React, { useState, useEffect, useCallback } from "react";
import { Trash2, Eye  } from "lucide-react";
import { ConfirmModal } from "../../components/common/ConfirmModal";
import styles from "./ItemUploadPage.module.css";

export interface ListedItem {
  Id: number;
  DomainItemId: string;
  Title: string;
  Description?: string;
  ImageUrl?: string;
  Attributes?: Record<string, any>;
}
import {
  extractFileHeaders,
  parseFileWithMapping,
  parseReviewWithMapping,
  FilePreview,
  ColumnMapping,
} from "@/utils/parseExcel";
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

type TabType = "management" | "metadata" | "review";
type UploadStep = "file-selection" | "column-mapping" | "uploading";

const FIELD_OPTIONS = [
  { value: "unmapped", label: "-- Select Field --", required: false },
  { value: "SKU", label: "SKU (Required)", required: true },
  { value: "Item Name", label: "Item Name (Required)", required: true },
  { value: "Category", label: "Category (Optional)", required: false },
  { value: "Description", label: "Description (Optional)", required: false },
  { value: "Image", label: "Image URL (Optional)", required: false },
];

const REVIEW_FIELD_OPTIONS = [
  { value: "unmapped", label: "-- Select Field --", required: false },
  { value: "ItemId", label: "Item ID (Required)", required: true },
  { value: "UserId", label: "Username (Required)", required: true },
  { value: "Rating", label: "Rating (Required)", required: true },
  { value: "Review", label: "Review Text (Optional)", required: false },
];

export const ItemUploadPage: React.FC<ItemUploadPageProps> = ({
  onUploadComplete,
  container,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("management");
  const [importMode, setImportMode] = useState<"create" | "update">("create");
  const [step, setStep] = useState<UploadStep>("file-selection");
  
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<FilePreview | null>(null);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [customFieldNames, setCustomFieldNames] = useState<Record<string, string>>({});
  const [enabledFields, setEnabledFields] = useState<Record<string, boolean>>({
    // Item fields - default enabled
    SKU: true,
    "Item Name": true,
    Category: true,
    Description: true,
    Image: true,
    // Review fields - default disabled (user will check manually)
    ItemId: false,
    UserId: false,
    Rating: false,
    Review: false,
  });
  
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [listedItems, setListedItems] = useState<ListedItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState("1");
  const [pageSize] = useState(10);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [expandedItemIds, setExpandedItemIds] = useState<Set<string>>(new Set());
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState<string[]>([]);

  const fetchItems = useCallback(async (page: number, isInitial: boolean = false) => {
    if (!container?.uuid) return;
    setIsLoading(true);
    try {
      const response: any = await itemApi.getItems(container.uuid, page, pageSize);
      const data = Array.isArray(response) ? response : (response?.data || response?.items || []);
      setListedItems(data);
      if (isInitial) {
        if (data && data.length > 0) {
          setActiveTab("management");
        } else {
          setActiveTab("metadata");
        }
      }
    } catch (err) {
      console.error(err);
      if (isInitial) setActiveTab("metadata");
    } finally {
      setIsLoading(false);
    }
  }, [container?.uuid, pageSize]);

  useEffect(() => {
    if (container?.uuid) {
      fetchItems(1, true);
    }
  }, [container?.uuid, fetchItems]);

  useEffect(() => {
    setPageInput(String(currentPage));
  }, [currentPage]);

  const handlePageJump = () => {
    const nextPage = Number(pageInput);
    if (!Number.isFinite(nextPage) || nextPage < 1) {
      setPageInput(String(currentPage));
      return;
    }
    if (nextPage === currentPage) return;
    setCurrentPage(nextPage);
    fetchItems(nextPage, false);
  };

  const handleDelete = async () => {
    if (!container?.uuid || itemsToDelete.length === 0) return;
    try {
      await itemApi.deleteItems(container.uuid, itemsToDelete);
      setIsConfirmModalOpen(false);
      setItemsToDelete([]);
      setSelectedItemIds(new Set());
      fetchItems(currentPage, false);
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const newSelected = new Set(listedItems.map(item => item.DomainItemId));
      setSelectedItemIds(newSelected);
    } else {
      setSelectedItemIds(new Set());
    }
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    const newSet = new Set(selectedItemIds);
    if (checked) newSet.add(id);
    else newSet.delete(id);
    setSelectedItemIds(newSet);
  };

  const toggleExpandItem = (id: string) => {
    const newSet = new Set(expandedItemIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedItemIds(newSet);
  };

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

  const handleFileSelect = async (selectedFile: File) => {
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

    // Extract headers and show mapping UI for both tabs
    try {
      const preview = await extractFileHeaders(selectedFile);
      setFilePreview(preview);
      
      // Initialize all columns as unmapped - user will choose manually
      const initialMapping: ColumnMapping = {};
      preview.headers.forEach((header) => {
        initialMapping[header] = "unmapped";
      });
      
      setColumnMapping(initialMapping);
      setStep("column-mapping");
    } catch (err: any) {
      setError(err.message || "Failed to read file headers.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleMappingChange = (columnName: string, fieldValue: string) => {
    setColumnMapping((prev) => {
      const newMapping = { ...prev };
      
      // If selecting a field that's not "unmapped"
      if (fieldValue !== "unmapped") {
        // Find if this field is already mapped to another column
        const existingColumn = Object.entries(newMapping).find(
          ([col, val]) => col !== columnName && val === fieldValue
        );
        
        if (existingColumn) {
          // Swap: set the old column to unmapped
          newMapping[existingColumn[0]] = "unmapped";
        }
      }
      
      // Set the new mapping for current column
      newMapping[columnName] = fieldValue;
      
      return newMapping;
    });
  };

  const handleFieldToggle = (fieldValue: string) => {
    setEnabledFields((prev) => ({ ...prev, [fieldValue]: !prev[fieldValue] }));
  };

  const handleCustomFieldNameChange = (columnName: string, customName: string) => {
    setCustomFieldNames((prev) => ({
      ...prev,
      [columnName]: customName,
    }));
    
    // Auto-enable checkbox when custom name is entered
    if (customName.trim()) {
      setEnabledFields((prev) => ({ ...prev, [columnName]: true }));
    } else {
      setEnabledFields((prev) => ({ ...prev, [columnName]: false }));
    }
  };

  const validateMapping = (): { valid: boolean; message?: string } => {
    const mappedFields = Object.values(columnMapping);
    
    let requiredFields: string[];
    if (activeTab === "metadata") {
      requiredFields = importMode === "create" 
        ? ["SKU", "Item Name"] 
        : ["SKU"];
    } else {
      // Review tab required fields
      requiredFields = ["ItemId", "UserId", "Rating"];
    }
    
    const missingFields = requiredFields.filter(
      (field) => !mappedFields.includes(field)
    );

    if (missingFields.length > 0) {
      return {
        valid: false,
        message: `Missing required field mapping: ${missingFields.join(", ")}`,
      };
    }

    // Check custom field names for unmapped columns (only for metadata tab)
    if (activeTab === "metadata") {
      const unmappedColumns = Object.entries(columnMapping)
        .filter(([_, value]) => value === "unmapped")
        .map(([key]) => key);
      
      for (const col of unmappedColumns) {
        const customName = customFieldNames[col]?.trim();
        if (!customName) {
          return {
            valid: false,
            message: `Please provide a name for custom attribute: "${col}"`,
          };
        }
      }
    }

    return { valid: true };
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file to upload.");
      return;
    }

    if (!container?.uuid) {
      setError("Please select a domain first.");
      return;
    }

    setUploading(true);
    setError(null);
    setUploadProgress(0);
    setStep("uploading");

    try {
      setUploadProgress(5); // Starting
      
      if (activeTab === "metadata") {
        // Build final column mapping with custom names
        const finalMapping: ColumnMapping = { ...columnMapping };
        Object.entries(customFieldNames).forEach(([col, name]) => {
          if (finalMapping[col] === "unmapped" && typeof name === 'string' && name.trim()) {
            finalMapping[col] = name.trim();
          }
        });

        setUploadProgress(10); // Parsing file
        const jsonData = await parseFileWithMapping(file, finalMapping, importMode);

        setUploadProgress(15); // File parsed
        let mappedData: CreateItemInput[] | UpdateItemInput[];

        if (importMode === "create") {
          mappedData = jsonData.map((row) => {
            const item: any = {
              DomainKey: container.uuid,
            };
            
            // Only include enabled fields
            if (enabledFields["SKU"]) item.TernantItemId = row.sku || "";
            if (enabledFields["Item Name"]) item.Title = row.name || "No Title";
            if (enabledFields["Description"]) item.Description = row.description || "";
            if (enabledFields["Category"]) item.Categories = row.categories || [];
            if (enabledFields["Image"]) item.ImageUrl = row.imageUrl || "";
            
            // Include custom attributes only if enabled
            const customAttrs: Record<string, any> = {};
            if (row.customAttributes) {
              Object.entries(row.customAttributes).forEach(([key, value]) => {
                if (enabledFields[key] !== false) {
                  customAttrs[key] = value;
                }
              });
            }
            item.Attributes = customAttrs;
            
            return item;
          });

          const validItems = mappedData.filter(
            (item) => item.Title && item.TernantItemId
          );
          if (validItems.length === 0) {
            throw new Error("No valid items found in the file.");
          }

          // Upload in batches with progress tracking
          const BATCH_SIZE = 100;
          const totalBatches = Math.ceil(validItems.length / BATCH_SIZE);
          let uploadedCount = 0;
          
          setTotalCount(validItems.length);

          for (let i = 0; i < validItems.length; i += BATCH_SIZE) {
            const batch = validItems.slice(i, i + BATCH_SIZE);
            await itemApi.createBulk(batch as CreateItemInput[]);
            
            uploadedCount += batch.length;
            setUploadedCount(uploadedCount);
            const progress = 15 + Math.round((uploadedCount / validItems.length) * 80);
            setUploadProgress(progress);
          }
          
          setUploadProgress(100);
        } else {
          mappedData = jsonData.map((row) => {
            const item: any = {
              TernantItemId: row.sku || "",
              DomainKey: container.uuid,
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

          // Upload in batches with progress tracking
          const BATCH_SIZE = 100;
          let uploadedCount = 0;
          
          setTotalCount(validItems.length);

          for (let i = 0; i < validItems.length; i += BATCH_SIZE) {
            const batch = validItems.slice(i, i + BATCH_SIZE);
            await itemApi.updateBulk(batch as UpdateItemInput[]);
            
            uploadedCount += batch.length;
            setUploadedCount(uploadedCount);
            const progress = 15 + Math.round((uploadedCount / validItems.length) * 80);
            setUploadProgress(progress);
          }
          
          setUploadProgress(100);
        }

        const action = importMode === "create" ? "imported" : "updated";
        setSuccess(
          `Successfully ${action} ${jsonData.length} items from "${file.name}"!`
        );
      } else {
        // Review upload with column mapping
        setUploadProgress(10); // Parsing file
        const jsonData = await parseReviewWithMapping(file, columnMapping);

        setUploadProgress(15); // File parsed
        const mappedReviews: CreateReviewInput[] = jsonData.map((row) => {
          const review: any = {
            DomainKey: container.uuid,
          };
          
          // Only include enabled fields
          if (enabledFields["ItemId"]) review.itemId = row.itemId;
          if (enabledFields["UserId"]) review.userId = row.userId;
          if (enabledFields["Rating"]) review.rating = row.rating;
          if (enabledFields["Review"]) review.review = row.review;
          
          return review;
        });

        const validReviews = mappedReviews.filter(
          (r) => r.itemId && r.userId && r.rating
        );

        if (validReviews.length === 0) {
          throw new Error("No valid reviews found in the file.");
        }

        // Upload in batches with progress tracking
        const BATCH_SIZE = 100;
        let uploadedCount = 0;
        
        setTotalCount(validReviews.length);

        for (let i = 0; i < validReviews.length; i += BATCH_SIZE) {
          const batch = validReviews.slice(i, i + BATCH_SIZE);
          await reviewApi.createBulk(batch);
          
          uploadedCount += batch.length;
          setUploadedCount(uploadedCount);
          const progress = 15 + Math.round((uploadedCount / validReviews.length) * 80);
          setUploadProgress(progress);
        }
        
        setUploadProgress(100);
        setSuccess(
          `Successfully imported ${validReviews.length} reviews from "${file.name}"!`
        );
      }

      if (onUploadComplete) onUploadComplete();
      
      // Reset to file selection after success
      setTimeout(() => {
        handleReset();
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to upload. Please check the data.");
      setStep("column-mapping");
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setFilePreview(null);
    setColumnMapping({});
    setCustomFieldNames({});
    setEnabledFields({
      // Item fields
      SKU: true,
      "Item Name": true,
      Category: true,
      Description: true,
      Image: true,
      // Review fields
      ItemId: true,
      UserId: true,
      Rating: true,
      Review: true,
    });
    setError(null);
    setSuccess(null);
    setUploadProgress(0);
    setUploadedCount(0);
    setTotalCount(0);
    setStep("file-selection");
    const fileInput = document.getElementById("file-input") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const handleBackToFileSelection = () => {
    handleReset();
  };

  const handleProceedToUpload = () => {
    const validation = validateMapping();
    if (!validation.valid) {
      setError(validation.message || "Invalid mapping");
      return;
    }
    handleUpload();
  };

  // if (isLoading) {
  //   return (
  //     <div className={styles.container}>
  //       <div className={styles.card} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
  //         <LoadingSpinner />
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Item Upload</h1>
        </div>

        {/* Tab Navigation */}
        <div className={styles.tabContainer}>
          <button
            className={`${styles.tab} ${
              activeTab === "management" ? styles.tabActive : ""
            }`}
            onClick={() => {
              setActiveTab("management");
              fetchItems(currentPage, false);
            }}
          >
            Manage Items
          </button>
          <button
            className={`${styles.tab} ${
              activeTab === "metadata" ? styles.tabActive : ""
            }`}
            onClick={() => {
              setActiveTab("metadata");
              handleReset();
            }}
          >
            Item Metadata
          </button>
          <button
            className={`${styles.tab} ${
              activeTab === "review" ? styles.tabActive : ""
            }`}
            onClick={() => {
              setActiveTab("review");
              handleReset();
            }}
          >
            Item Rating
          </button>
        </div>

        {activeTab === "management" ? (
          <div className={styles.managementSection}>
            <div className={styles.managementToolbar} style={{ justifyContent: 'flex-end' }}>
              <button 
                className={styles.deleteButtonHeader}
                disabled={selectedItemIds.size === 0}
                onClick={() => {
                  setItemsToDelete(Array.from(selectedItemIds));
                  setIsConfirmModalOpen(true);
                }}
              >
                Delete Selected ({selectedItemIds.size})
              </button>
            </div>
            <div className={styles.tableWrapper}>
              <table className={styles.itemsTable}>
                <thead>
                  <tr>
                    <th className={styles.checkboxCol}>
                      <input 
                        type="checkbox" 
                        className={styles.fieldCheckbox}
                        onChange={handleSelectAll}
                        checked={listedItems.length > 0 && selectedItemIds.size === listedItems.length}
                      />
                    </th>
                    {/* <th className={styles.expandCol}></th> */}
                    <th>SKU</th>
                    <th>Item Name</th>
                    <th>Modified At</th>
                    <th className={styles.actionsCol}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {listedItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className={styles.emptyRow}>No items found.</td>
                    </tr>
                  ) : (
                    listedItems.map(item => {
                      const isExpanded = expandedItemIds.has(item.DomainItemId);
                      return (
                        <React.Fragment key={item.DomainItemId}>
                          <tr className={styles.itemRow}>
                            <td className={styles.checkboxCol}>
                              <input 
                                type="checkbox" 
                                className={styles.fieldCheckbox}
                                checked={selectedItemIds.has(item.DomainItemId)}
                                onChange={(e) => handleSelectItem(item.DomainItemId, e.target.checked)}
                              />
                            </td>
                            {/* <td className={styles.expandCol}>
                              <button className={styles.iconButton} onClick={() => toggleExpandItem(item.DomainItemId)}>
                                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                              </button>
                            </td> */}
                            <td>{item.DomainItemId}</td>
                            <td>{item.Title}</td>
                            <td>{new Date(item.ModifiedAt).toLocaleString()}</td>
                            <td className={styles.actionsCol}>
                              <div className={styles.actionButtons}>
                                <button className={styles.viewButton} onClick={() => toggleExpandItem(item.DomainItemId)}>
                                  <Eye size={16} />
                                </button>
                                <button className={styles.deleteButtonRow} onClick={() => {
                                  setItemsToDelete([item.DomainItemId]);
                                  setIsConfirmModalOpen(true);
                                }}>
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr className={styles.expandedRow}>
                              <td colSpan={5}>
                                <div className={styles.expandedContent}>
                                  <div className={styles.expandedGrid}>
                                    <div style={{ gridColumn: '1 / -1' }}><strong>Description:</strong> {item.Description || '-'}</div>
                                    <div style={{ gridColumn: '1 / -1' }}><strong>Image URL:</strong> {item.ImageUrl ? <a href={item.ImageUrl} target="_blank" rel="noreferrer">{item.ImageUrl}</a> : '-'}</div>
                                    <div style={{ gridColumn: '1 / -1' }}><strong>Attributes:</strong> 
                                      <pre className={styles.attributesJson}>{JSON.stringify(item.Attributes || {}, null, 2)}</pre>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            
            <div className={styles.pagination}>
              <button 
                className={styles.pageButton} 
                disabled={currentPage === 1}
                onClick={() => {
                  const newPage = currentPage - 1;
                  setCurrentPage(newPage);
                  fetchItems(newPage, false);
                }}
              >
                Previous
              </button>
              <span className={styles.pageInfo}>Page {currentPage}</span>
              <div className={styles.pageJump}>
                <span className={styles.pageJumpLabel}>Go to</span>
                <input
                  className={styles.pageInput}
                  type="number"
                  min={1}
                  value={pageInput}
                  onChange={(e) => setPageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handlePageJump();
                  }}
                  onBlur={handlePageJump}
                />
                <button
                  className={styles.pageGoButton}
                  onClick={handlePageJump}
                >
                  Go
                </button>
              </div>
              <button 
                className={styles.pageButton} 
                disabled={listedItems.length < pageSize}
                onClick={() => {
                  const newPage = currentPage + 1;
                  setCurrentPage(newPage);
                  fetchItems(newPage, false);
                }}
              >
                Next
              </button>
            </div>
          </div>
        ) : (
          <>
        {/* Import Mode Toggle - Only show for Item Metadata tab */}
        {activeTab === "metadata" && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "12px",
              padding: "0 0 32px 0",
              borderBottom: "1px solid #e0e0e0",
            }}
          >
            <button
              className={`${styles.modeButton} ${
                importMode === "create" ? styles.modeButtonActive : ""
              }`}
              onClick={() => {
                setImportMode("create");
                handleReset();
              }}
            >
              Upload New Items
            </button>
            <button
              className={`${styles.modeButton} ${
                importMode === "update" ? styles.modeButtonActive : ""
              }`}
              onClick={() => {
                setImportMode("update");
                handleReset();
              }}
            >
              Update Existing Items
            </button>
          </div>
        )}

        <div className={styles.tabContent}>
          {/* Step 1: File Selection */}
          {step === "file-selection" && (
            <div className={styles.uploadSection}>
              <div
                className={`${styles.dropZone} ${
                  dragActive ? styles.dragActive : ""
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
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
                  Support: Excel (.xlsx, .xls) or CSV files only.
                </p>
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

              <div className={styles.descriptionSection}>
                <h3 className={styles.descriptionTitle}>How it works</h3>
                <div className={styles.stepsList}>
                  <div className={styles.stepItem}>
                    <span className={styles.stepNumber}>1</span>
                    <div>
                      <strong>Upload your file</strong>
                      <p>Upload any Excel file with your data</p>
                    </div>
                  </div>
                  <div className={styles.stepItem}>
                    <span className={styles.stepNumber}>2</span>
                    <div>
                      <strong>Map columns</strong>
                      <p>Match your columns to our fields</p>
                    </div>
                  </div>
                  <div className={styles.stepItem}>
                    <span className={styles.stepNumber}>3</span>
                    <div>
                      <strong>Import data</strong>
                      <p>Review and confirm the import</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Column Mapping */}
          {step === "column-mapping" && filePreview && (
            <div className={styles.mappingSection}>
              <div className={styles.mappingHeader}>
                <div>
                  <h2 className={styles.mappingTitle}>Map Your Columns</h2>
                  <p className={styles.mappingDescription}>
                    Match your file columns to our data fields. Required fields
                    must be mapped.
                  </p>
                </div>
                <button
                  className={styles.backButton}
                  onClick={handleBackToFileSelection}
                >
                  ← Change File
                </button>
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

              <div className={styles.mappingTable}>
                <div className={styles.tableHeader}>
                  {((activeTab === "metadata" && importMode === "create") || activeTab === "review") && (
                    <div className={styles.tableHeaderCell}>Include</div>
                  )}
                  <div className={styles.tableHeaderCell}>Your Column</div>
                  <div className={styles.tableHeaderCell}>Sample Data</div>
                  <div className={styles.tableHeaderCell}>Map To Field</div>
                  {activeTab === "metadata" && (
                    <div className={styles.tableHeaderCell}>Custom Name</div>
                  )}
                </div>

                {filePreview.headers.map((header, idx) => {
                  const fieldOptions = activeTab === "metadata" ? FIELD_OPTIONS : REVIEW_FIELD_OPTIONS;
                  
                  // Get list of already mapped fields (excluding current column and unmapped)
                  const mappedFields = Object.entries(columnMapping)
                    .filter(([col, val]) => col !== header && val !== "unmapped")
                    .map(([_, val]) => val);
                  
                  const currentFieldValue = columnMapping[header];
                  const isMapped = currentFieldValue && currentFieldValue !== "unmapped";
                  const hasCustomName = customFieldNames[header]?.trim();
                  const isCheckable = isMapped || hasCustomName;
                  
                  return (
                    <div key={idx} className={styles.tableRow}>
                      {((activeTab === "metadata" && importMode === "create") || activeTab === "review") && (
                        <div className={styles.tableCell}>
                          <input
                            type="checkbox"
                            className={styles.fieldCheckbox}
                            checked={isMapped 
                              ? enabledFields[currentFieldValue] !== false 
                              : enabledFields[header] === true
                            }
                            disabled={!isCheckable}
                            onChange={() => {
                              if (isMapped) {
                                handleFieldToggle(currentFieldValue);
                              } else if (hasCustomName) {
                                handleFieldToggle(header);
                              }
                            }}
                          />
                        </div>
                      )}
                      <div className={styles.tableCell}>
                        <strong>{header}</strong>
                      </div>
                      <div className={styles.tableCell}>
                        <code className={styles.sampleData}>
                          {filePreview.previewData[0]?.[idx] || "-"}
                        </code>
                      </div>
                      <div className={styles.tableCell}>
                        <select
                          className={styles.mappingSelect}
                          value={columnMapping[header] || "unmapped"}
                          onChange={(e) =>
                            handleMappingChange(header, e.target.value)
                          }
                        >
                          {fieldOptions.map((opt) => {
                            // For update mode in metadata tab, Item Name is not required
                            const isRequired =
                              opt.required &&
                              (activeTab === "review" || 
                               importMode === "create" || 
                               opt.value === "SKU");
                            
                            // Check if this option is already mapped to another column
                            const isAlreadyMapped = mappedFields.includes(opt.value);
                            
                            return (
                              <option 
                                key={opt.value} 
                                value={opt.value}
                                disabled={isAlreadyMapped}
                              >
                                {opt.label}
                                {isRequired ? "" : ""}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                      {activeTab === "metadata" && (
                        <div className={styles.tableCell}>
                          {columnMapping[header] === "unmapped" ? (
                            <input
                              type="text"
                              className={styles.customFieldInput}
                              placeholder="Enter attribute name"
                              value={customFieldNames[header] || ""}
                              onChange={(e) =>
                                handleCustomFieldNameChange(header, e.target.value)
                              }
                            />
                          ) : (
                            <span className={styles.autoMapped}>Auto-mapped</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className={styles.mappingFooter}>
                <div className={styles.mappingInfo}>
                  <p>
                    <strong>Total Rows:</strong> {filePreview.totalRows}
                  </p>
                  <p className={styles.requiredNote}>
                    * Required fields must be mapped to proceed
                  </p>
                </div>
                <button
                  className={styles.proceedButton}
                  onClick={handleProceedToUpload}
                  disabled={uploading}
                >
                  Proceed to Upload
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Uploading */}
          {step === "uploading" && (
            <div className={styles.uploadingSection}>
              {uploading && (
                <div className={styles.loadingIndicator}>
                  <div className={styles.spinner}></div>
                  <p>
                    {activeTab === "review" 
                      ? "Importing reviews..." 
                      : (importMode === "create" ? "Importing items..." : "Updating items...")}
                  </p>
                  
                  {/* Progress Bar */}
                  <div className={styles.progressBarContainer}>
                    <div 
                      className={styles.progressBar} 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className={styles.progressText}>
                    {uploadProgress}% ({uploadedCount}/{totalCount})
                  </p>
                </div>
              )}

              {success && (
                <div className={styles.successMessage}>
                  <svg
                    width="48"
                    height="48"
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
                  <p>{success}</p>
                </div>
              )}

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
                  <button
                    className={styles.retryButton}
                    onClick={() => setStep("column-mapping")}
                  >
                    Go Back
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        </>
        )}
      </div>

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        title="Delete Items"
        message={`Are you sure you want to delete ${itemsToDelete.length} item(s)? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => {
          setIsConfirmModalOpen(false);
          setItemsToDelete([]);
        }}
      />
    </div>
  );
};
