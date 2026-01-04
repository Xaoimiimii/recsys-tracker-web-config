import * as XLSX from 'xlsx';

const REQUIRED_HEADERS = ['SKU', 'Item Name', 'Category', 'Description', 'Image'];
const REQUIRED_REVIEW_HEADERS = ['ItemId', 'UserId', 'Rating', 'Review'];

export interface ProductImportData {
  sku: string;
  name: string;
  categories: string[];
  description: string;
  imageUrl?: string;
}

export interface ReviewImportData {
  itemId: string;
  userId: string;
  rating: number;
  review: string;
}

export const parseItemImportExcelFile = async (file: File): Promise<ProductImportData[]> => {
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

        const missingHeaders = REQUIRED_HEADERS.filter(reqHeader => {
          return !fileHeaders.includes(reqHeader.toLowerCase());
        });

        if (missingHeaders.length > 0) {
          throw new Error(
            `File Excel sai mẫu! Đang thiếu các cột: [ ${missingHeaders.join(', ')} ].\nVui lòng đảm bảo file có đủ 5 cột: SKU, Item Name, Category, Description, Image`
          );
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

          if (!name || !name.toString().trim()) {
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

          processedData.push({
            sku: sku.toString().trim(),
            name: name.toString().trim(),
            categories: categoriesList,
            description: description,
            imageUrl: imageUrl,
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