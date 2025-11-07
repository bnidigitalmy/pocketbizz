// Import/Export utilities for Excel and CSV files
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { saveAs } from 'file-saver';

export interface StockItemExport {
  'Item Name': string;
  'Unit': string;
  'Package Size': string;
  'Purchase Price (RM)': string;
  'Current Quantity': string;
  'Low Stock Threshold': string;
  'Notes': string;
}

export interface StockItemImport {
  name: string;
  unit: string;
  packageSize: string;
  purchasePrice: string;
  currentQuantity: string;
  lowStockThreshold: string;
  notes?: string;
}

/**
 * Export stock items to Excel file
 */
export function exportToExcel(data: StockItemExport[], filename: string) {
  try {
    // Create worksheet from data
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Set column widths for better readability
    const columnWidths = [
      { wch: 30 }, // Item Name
      { wch: 10 }, // Unit
      { wch: 15 }, // Package Size
      { wch: 20 }, // Purchase Price
      { wch: 18 }, // Current Quantity
      { wch: 20 }, // Low Stock Threshold
      { wch: 30 }, // Notes
    ];
    worksheet['!cols'] = columnWidths;

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Stock Items');

    // Generate Excel file and trigger download
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, filename);
    
    return true;
  } catch (error) {
    console.error('Export to Excel failed:', error);
    throw new Error('Failed to export to Excel');
  }
}

/**
 * Export stock items to CSV file
 */
export function exportToCSV(data: StockItemExport[], filename: string) {
  try {
    const csv = Papa.unparse(data, {
      quotes: true,
      delimiter: ',',
      header: true,
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, filename);
    
    return true;
  } catch (error) {
    console.error('Export to CSV failed:', error);
    throw new Error('Failed to export to CSV');
  }
}

/**
 * Parse uploaded Excel file
 */
export async function parseExcelFile(file: File): Promise<StockItemImport[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        // Get first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json<StockItemExport>(worksheet);
        
        // Transform to import format
        const importData: StockItemImport[] = jsonData.map((row, index) => {
          // Validate required fields
          if (!row['Item Name']?.trim()) {
            throw new Error(`Row ${index + 2}: Item Name is required`);
          }
          if (!row['Unit']?.trim()) {
            throw new Error(`Row ${index + 2}: Unit is required`);
          }
          
          return {
            name: row['Item Name'].trim(),
            unit: row['Unit'].trim(),
            packageSize: String(row['Package Size'] || '1'),
            purchasePrice: String(row['Purchase Price (RM)'] || '0'),
            currentQuantity: String(row['Current Quantity'] || '0'),
            lowStockThreshold: String(row['Low Stock Threshold'] || '5'),
            notes: row['Notes']?.trim() || '',
          };
        });
        
        resolve(importData);
      } catch (error: any) {
        reject(new Error(`Excel parse error: ${error.message}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsBinaryString(file);
  });
}

/**
 * Parse uploaded CSV file
 */
export async function parseCSVFile(file: File): Promise<StockItemImport[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<StockItemExport>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          if (results.errors.length > 0) {
            const errorMessages = results.errors.map(err => 
              `Row ${err.row}: ${err.message}`
            ).join(', ');
            throw new Error(`CSV parse errors: ${errorMessages}`);
          }
          
          // Transform to import format
          const importData: StockItemImport[] = results.data.map((row, index) => {
            // Validate required fields
            if (!row['Item Name']?.trim()) {
              throw new Error(`Row ${index + 2}: Item Name is required`);
            }
            if (!row['Unit']?.trim()) {
              throw new Error(`Row ${index + 2}: Unit is required`);
            }
            
            return {
              name: row['Item Name'].trim(),
              unit: row['Unit'].trim(),
              packageSize: String(row['Package Size'] || '1'),
              purchasePrice: String(row['Purchase Price (RM)'] || '0'),
              currentQuantity: String(row['Current Quantity'] || '0'),
              lowStockThreshold: String(row['Low Stock Threshold'] || '5'),
              notes: row['Notes']?.trim() || '',
            };
          });
          
          resolve(importData);
        } catch (error: any) {
          reject(new Error(`CSV parse error: ${error.message}`));
        }
      },
      error: (error) => {
        reject(new Error(`CSV parse error: ${error.message}`));
      },
    });
  });
}

/**
 * Generate sample Excel template for stock items
 */
export function downloadSampleTemplate() {
  const sampleData: StockItemExport[] = [
    {
      'Item Name': 'Tepung Gandum',
      'Unit': 'kg',
      'Package Size': '1',
      'Purchase Price (RM)': '8.50',
      'Current Quantity': '10',
      'Low Stock Threshold': '5',
      'Notes': 'For bread and cakes',
    },
    {
      'Item Name': 'Gula Pasir',
      'Unit': 'kg',
      'Package Size': '1',
      'Purchase Price (RM)': '3.20',
      'Current Quantity': '15',
      'Low Stock Threshold': '5',
      'Notes': 'White sugar',
    },
    {
      'Item Name': 'Telur Grade A',
      'Unit': 'pcs',
      'Package Size': '30',
      'Purchase Price (RM)': '15.00',
      'Current Quantity': '60',
      'Low Stock Threshold': '30',
      'Notes': 'Fresh eggs',
    },
  ];

  exportToExcel(sampleData, 'stock-template.xlsx');
}

/**
 * Validate import data before sending to backend
 */
export function validateImportData(items: StockItemImport[]): { 
  valid: boolean; 
  errors: string[] 
} {
  const errors: string[] = [];
  
  if (items.length === 0) {
    errors.push('No items found in the file');
    return { valid: false, errors };
  }
  
  items.forEach((item, index) => {
    const row = index + 2; // +2 because row 1 is header
    
    // Validate name
    if (!item.name || item.name.trim() === '') {
      errors.push(`Row ${row}: Item name is required`);
    }
    
    // Validate unit
    if (!item.unit || item.unit.trim() === '') {
      errors.push(`Row ${row}: Unit is required`);
    }
    
    // Validate numeric fields
    const packageSize = parseFloat(item.packageSize);
    if (isNaN(packageSize) || packageSize <= 0) {
      errors.push(`Row ${row}: Package size must be a positive number`);
    }
    
    const purchasePrice = parseFloat(item.purchasePrice);
    if (isNaN(purchasePrice) || purchasePrice < 0) {
      errors.push(`Row ${row}: Purchase price must be a non-negative number`);
    }
    
    const currentQuantity = parseFloat(item.currentQuantity);
    if (isNaN(currentQuantity) || currentQuantity < 0) {
      errors.push(`Row ${row}: Current quantity must be a non-negative number`);
    }
    
    const lowStockThreshold = parseFloat(item.lowStockThreshold);
    if (isNaN(lowStockThreshold) || lowStockThreshold < 0) {
      errors.push(`Row ${row}: Low stock threshold must be a non-negative number`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
