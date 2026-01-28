import * as XLSX from 'xlsx';

const REQUIRED_HEADERS = ['SKU', 'Item Name', 'Category', 'Description', 'Image'];
const REQUIRED_REVIEW_HEADERS = ['ItemId', 'UserId', 'Rating', 'Review'];

export interface ProductImportData {
  sku: string;
  name: string;
  categories: string[];
  description: string;
  imageUrl?: string;
  customAttributes?: Record<string, any>;
}

export interface ReviewImportData {
  itemId: string;
  userId: string;
  rating: number;
  review: string;
}

export interface FilePreview {
  headers: string[];
  previewData: any[][];
  totalRows: number;
}

export interface ColumnMapping {
  [columnName: string]: string; // columnName -> fieldName mapping
}

export const parseItemImportExcelFile = async (file: File, customFieldNames: string[] = [], mode: 'create' | 'update' = 'create'): Promise<ProductImportData[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });

        if (workbook.SheetNames.length === 0) {
            throw new Error("File Excel không có Sheet nào.");
        }

        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        const headerRow = XLSX.utils.sheet_to_json(sheet, { header: 1 })[0] as string[];

        if (!headerRow || headerRow.length === 0) {
          throw new Error("File Excel rỗng hoặc không có tiêu đề.");
        }

        const fileHeaders = headerRow.map(h => h?.toString().trim().toLowerCase());

        const requiredHeaders = mode === 'update' ? ['SKU'] : REQUIRED_HEADERS;
        
        const missingHeaders = requiredHeaders.filter(reqHeader => {
          return !fileHeaders.includes(reqHeader.toLowerCase());
        });

        if (missingHeaders.length > 0) {
          const errorMsg = mode === 'update' 
            ? `File Excel sai mẫu! Đang thiếu cột: [ ${missingHeaders.join(', ')} ].\nĐể update item, file cần có ít nhất cột SKU và các cột bạn muốn cập nhật (ví dụ: Image, Artist)`
            : `File Excel sai mẫu! Đang thiếu các cột: [ ${missingHeaders.join(', ')} ].\nVui lòng đảm bảo file có đủ 5 cột: SKU, Item Name, Category, Description, Image`;
          throw new Error(errorMsg);
        }

        const rawData = XLSX.utils.sheet_to_json(sheet);
        const processedData: ProductImportData[] = [];
        const errors: string[] = [];

        rawData.forEach((row: any, index) => {
          const rowIndex = index + 2; 

          const getValue = (keyName: string) => {
            const realKey = Object.keys(row).find(k => k.trim().toLowerCase() === keyName.toLowerCase());
            return realKey ? row[realKey] : null;
          };

          const sku = getValue('SKU');
          const name = getValue('Item Name');
          
          if (!sku || !sku.toString().trim()) {
            errors.push(`Dòng ${rowIndex}: Thiếu dữ liệu 'SKU'`);
            return;
          }

          // Khi update, name không bắt buộc
          if (mode === 'create' && (!name || !name.toString().trim())) {
            errors.push(`Dòng ${rowIndex}: Thiếu dữ liệu 'Item Name'`);
            return;
          }

          const categoryRaw = getValue('Category');
          let categoriesList: string[] = [];

          if (categoryRaw) {
             const catString = categoryRaw.toString();
             if (catString.trim() !== "") {
                categoriesList = catString.split(';').map((c: string) => c.trim()).filter((c: string) => c !== '');
             }
          }

          const descRaw = getValue('Description');
          const description = descRaw ? descRaw.toString().trim() : '';

          const imageRaw = getValue('Image');
          const imageUrl = imageRaw ? imageRaw.toString().trim() : '';

          // Parse custom fields
          const customAttributes: Record<string, any> = {};
          customFieldNames.forEach(fieldName => {
            const fieldValue = getValue(fieldName);
            if (fieldValue !== null && fieldValue !== undefined) {
              const valueStr = fieldValue.toString().trim();
              if (valueStr !== '') {
                customAttributes[fieldName] = valueStr;
              }
            }
          });

          processedData.push({
            sku: sku.toString().trim(),
            name: name ? name.toString().trim() : (mode === 'update' ? '' : 'No Title'),
            categories: categoriesList,
            description: description,
            imageUrl: imageUrl,
            customAttributes: Object.keys(customAttributes).length > 0 ? customAttributes : undefined,
          });
        });

        if (errors.length > 0) {
            const errorMsg = `Lỗi dữ liệu:\n- ${errors.slice(0, 5).join('\n- ')}${errors.length > 5 ? '\n...' : ''}`;
            throw new Error(errorMsg);
        }

        resolve(processedData);

      } catch (error: any) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error("Lỗi đọc file."));
    reader.readAsBinaryString(file);
  });
};

export const parseReviewExcelFile = async (file: File): Promise<ReviewImportData[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });

        if (workbook.SheetNames.length === 0) {
          throw new Error("File Excel không có dữ liệu.");
        }

        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        const headerRow = XLSX.utils.sheet_to_json(sheet, { header: 1 })[0] as string[];

        if (!headerRow || headerRow.length === 0) {
          throw new Error("File Excel rỗng hoặc không có tiêu đề.");
        }

        const fileHeaders = headerRow.map(h => h?.toString().trim().toLowerCase());

        const missingHeaders = REQUIRED_REVIEW_HEADERS.filter(reqHeader => {
          return !fileHeaders.includes(reqHeader.toLowerCase());
        });

        if (missingHeaders.length > 0) {
          throw new Error(
            `File Review sai mẫu! Thiếu các cột: [ ${missingHeaders.join(', ')} ].\nHeader bắt buộc: ItemId, UserId, Rating, Review`
          );
        }

        const rawData = XLSX.utils.sheet_to_json(sheet);
        const processedData: ReviewImportData[] = [];
        const errors: string[] = [];

        rawData.forEach((row: any, index) => {
          const rowIndex = index + 2;

          const getValue = (keyName: string) => {
            const realKey = Object.keys(row).find(k => k.trim().toLowerCase() === keyName.toLowerCase());
            return realKey ? row[realKey] : null;
          };

          const itemId = getValue('ItemId');
          const userId = getValue('UserId');
          const ratingRaw = getValue('Rating');
          const review = getValue('Review');

          if (!itemId || !itemId.toString().trim()) {
            errors.push(`Dòng ${rowIndex}: Thiếu 'ItemId'`);
            return;
          }

          if (!userId || !userId.toString().trim()) {
            errors.push(`Dòng ${rowIndex}: Thiếu 'UserId'`);
            return;
          }

          let ratingNum = 0;
          if (ratingRaw === null || ratingRaw === undefined || ratingRaw.toString().trim() === '') {
            errors.push(`Dòng ${rowIndex}: Thiếu điểm 'Rating'`);
            return;
          } else {
            ratingNum = Number(ratingRaw);
            if (isNaN(ratingNum)) {
              errors.push(`Dòng ${rowIndex}: 'Rating' không phải là số`);
              return;
            }
            if (ratingNum < 1 || ratingNum > 5) {
              errors.push(`Dòng ${rowIndex}: 'Rating' phải từ 1 đến 5 (Giá trị hiện tại: ${ratingNum})`);
              return;
            }
          }

          processedData.push({
            itemId: itemId.toString().trim(),
            userId: userId.toString().trim(),
            rating: ratingNum,
            review: review ? review.toString().trim() : '',
          });
        });

        if (errors.length > 0) {
          const errorMsg = `Lỗi dữ liệu Review:\n- ${errors.slice(0, 5).join('\n- ')}${errors.length > 5 ? '\n...' : ''}`;
          throw new Error(errorMsg);
        }

        resolve(processedData);

      } catch (error: any) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error("Lỗi đọc file."));
    reader.readAsBinaryString(file);
  });
};

// New function to extract headers and preview data without template validation
export const extractFileHeaders = async (file: File): Promise<FilePreview> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });

        if (workbook.SheetNames.length === 0) {
          throw new Error("File Excel không có Sheet nào.");
        }

        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        const allData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

        if (!allData || allData.length === 0) {
          throw new Error("File Excel rỗng.");
        }

        const headers = allData[0].map((h: any) => h?.toString().trim() || '').filter(h => h !== '');
        
        if (headers.length === 0) {
          throw new Error("File Excel không có tiêu đề.");
        }

        // Get preview data (first 5 rows)
        const previewData = allData.slice(1, 6).map(row => 
          headers.map((_, idx) => row[idx]?.toString() || '')
        );

        resolve({
          headers,
          previewData,
          totalRows: allData.length - 1, // Exclude header row
        });
      } catch (error: any) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error("Lỗi đọc file."));
    reader.readAsBinaryString(file);
  });
};

// New function to parse file with custom column mapping
export const parseFileWithMapping = async (
  file: File,
  columnMapping: ColumnMapping,
  mode: 'create' | 'update' = 'create'
): Promise<ProductImportData[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });

        if (workbook.SheetNames.length === 0) {
          throw new Error("File Excel không có Sheet nào.");
        }

        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        const rawData = XLSX.utils.sheet_to_json(sheet);
        const processedData: ProductImportData[] = [];
        const errors: string[] = [];

        // Create reverse mapping: fieldName -> columnName
        const fieldToColumn: Record<string, string> = {};
        Object.entries(columnMapping).forEach(([columnName, fieldName]) => {
          if (fieldName && fieldName !== 'unmapped') {
            fieldToColumn[fieldName] = columnName;
          }
        });

        rawData.forEach((row: any, index) => {
          const rowIndex = index + 2;

          const getValue = (fieldName: string) => {
            const columnName = fieldToColumn[fieldName];
            if (!columnName) return null;
            
            // Find the actual key in the row (case-insensitive match)
            const realKey = Object.keys(row).find(
              k => k.trim().toLowerCase() === columnName.toLowerCase()
            );
            return realKey ? row[realKey] : null;
          };

          // Get required fields
          const sku = getValue('SKU');
          const name = getValue('Item Name');

          if (!sku || !sku.toString().trim()) {
            errors.push(`Dòng ${rowIndex}: Thiếu dữ liệu 'SKU'`);
            return;
          }

          if (mode === 'create' && (!name || !name.toString().trim())) {
            errors.push(`Dòng ${rowIndex}: Thiếu dữ liệu 'Item Name'`);
            return;
          }

          // Get optional standard fields
          const categoryRaw = getValue('Category');
          let categoriesList: string[] = [];
          if (categoryRaw) {
            const catString = categoryRaw.toString();
            if (catString.trim() !== "") {
              categoriesList = catString.split(';').map((c: string) => c.trim()).filter((c: string) => c !== '');
            }
          }

          const descRaw = getValue('Description');
          const description = descRaw ? descRaw.toString().trim() : '';

          const imageRaw = getValue('Image');
          const imageUrl = imageRaw ? imageRaw.toString().trim() : '';

          // Get custom attributes (unmapped or explicitly mapped to Attributes)
          const customAttributes: Record<string, any> = {};
          const standardFields = ['SKU', 'Item Name', 'Category', 'Description', 'Image'];
          
          Object.entries(columnMapping).forEach(([columnName, fieldName]) => {
            // If unmapped or not a standard field, add to attributes
            if (fieldName === 'unmapped' || (fieldName && !standardFields.includes(fieldName))) {
              const realKey = Object.keys(row).find(
                k => k.trim().toLowerCase() === columnName.toLowerCase()
              );
              
              if (realKey) {
                const value = row[realKey];
                if (value !== null && value !== undefined) {
                  const valueStr = value.toString().trim();
                  if (valueStr !== '') {
                    // Use the custom field name if provided, otherwise use column name
                    const attrKey = fieldName && fieldName !== 'unmapped' ? fieldName : columnName;
                    customAttributes[attrKey] = valueStr;
                  }
                }
              }
            }
          });

          processedData.push({
            sku: sku.toString().trim(),
            name: name ? name.toString().trim() : (mode === 'update' ? '' : 'No Title'),
            categories: categoriesList,
            description: description,
            imageUrl: imageUrl,
            customAttributes: Object.keys(customAttributes).length > 0 ? customAttributes : undefined,
          });
        });

        if (errors.length > 0) {
          const errorMsg = `Lỗi dữ liệu:\n- ${errors.slice(0, 5).join('\n- ')}${errors.length > 5 ? '\n...' : ''}`;
          throw new Error(errorMsg);
        }

        resolve(processedData);
      } catch (error: any) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error("Lỗi đọc file."));
    reader.readAsBinaryString(file);
  });
};

// New function to parse review file with custom column mapping
export const parseReviewWithMapping = async (
  file: File,
  columnMapping: ColumnMapping
): Promise<ReviewImportData[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });

        if (workbook.SheetNames.length === 0) {
          throw new Error("File Excel không có Sheet nào.");
        }

        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        const rawData = XLSX.utils.sheet_to_json(sheet);
        const processedData: ReviewImportData[] = [];
        const errors: string[] = [];

        // Create reverse mapping: fieldName -> columnName
        const fieldToColumn: Record<string, string> = {};
        Object.entries(columnMapping).forEach(([columnName, fieldName]) => {
          if (fieldName && fieldName !== 'unmapped') {
            fieldToColumn[fieldName] = columnName;
          }
        });

        rawData.forEach((row: any, index) => {
          const rowIndex = index + 2;

          const getValue = (fieldName: string) => {
            const columnName = fieldToColumn[fieldName];
            if (!columnName) return null;
            
            // Find the actual key in the row (case-insensitive match)
            const realKey = Object.keys(row).find(
              k => k.trim().toLowerCase() === columnName.toLowerCase()
            );
            return realKey ? row[realKey] : null;
          };

          // Get required fields
          const itemId = getValue('ItemId');
          const userId = getValue('UserId');
          const ratingRaw = getValue('Rating');

          if (!itemId || !itemId.toString().trim()) {
            errors.push(`Dòng ${rowIndex}: Thiếu 'ItemId'`);
            return;
          }

          if (!userId || !userId.toString().trim()) {
            errors.push(`Dòng ${rowIndex}: Thiếu 'UserId'`);
            return;
          }

          let ratingNum = 0;
          if (ratingRaw === null || ratingRaw === undefined || ratingRaw.toString().trim() === '') {
            errors.push(`Dòng ${rowIndex}: Thiếu điểm 'Rating'`);
            return;
          } else {
            ratingNum = Number(ratingRaw);
            if (isNaN(ratingNum)) {
              errors.push(`Dòng ${rowIndex}: 'Rating' không phải là số`);
              return;
            }
            if (ratingNum < 1 || ratingNum > 5) {
              errors.push(`Dòng ${rowIndex}: 'Rating' phải từ 1 đến 5 (Giá trị hiện tại: ${ratingNum})`);
              return;
            }
          }

          // Get optional review field
          const review = getValue('Review');

          processedData.push({
            itemId: itemId.toString().trim(),
            userId: userId.toString().trim(),
            rating: ratingNum,
            review: review ? review.toString().trim() : '',
          });
        });

        if (errors.length > 0) {
          const errorMsg = `Lỗi dữ liệu Review:\n- ${errors.slice(0, 5).join('\n- ')}${errors.length > 5 ? '\n...' : ''}`;
          throw new Error(errorMsg);
        }

        resolve(processedData);
      } catch (error: any) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error("Lỗi đọc file."));
    reader.readAsBinaryString(file);
  });
};
