// CSV/XLSX Parser for Transaction Import
import * as XLSX from 'xlsx';

export interface ParsedTransaction {
  date: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  status?: string;
  recurrence_type?: string;
  scheduled_date?: string;
  next_occurrence?: string;
  recurrence_end_date?: string;
}

export interface ParseResult {
  success: boolean;
  data: ParsedTransaction[];
  errors: string[];
  warnings: string[];
}

// Supported column names (case-insensitive)
const COLUMN_MAPPINGS: Record<string, string[]> = {
  date: ['date', 'transaction date', 'txn date', 'day'],
  type: ['type', 'transaction type', 'category type', 'income/expense'],
  category: ['category', 'subcategory', 'class'],
  amount: ['amount', 'value', 'sum', 'total', 'price'],
  description: ['description', 'memo', 'notes', 'details', 'note'],
  status: ['status', 'state'],
  recurrence_type: ['recurrence', 'recurrence type', 'recurring', 'frequency'],
  scheduled_date: ['scheduled date', 'scheduled', 'future date'],
  next_occurrence: ['next occurrence', 'next date'],
  recurrence_end_date: ['end date', 'recurrence end', 'until']
};

function normalizeHeader(header: string): string {
  const normalized = header.toLowerCase().trim();
  
  for (const [fieldName, aliases] of Object.entries(COLUMN_MAPPINGS)) {
    if (aliases.includes(normalized)) {
      return fieldName;
    }
  }
  
  return normalized;
}

function parseCSV(csvText: string): ParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const data: ParsedTransaction[] = [];

  const lines = csvText.split('\n').filter(line => line.trim());
  
  if (lines.length < 2) {
    return {
      success: false,
      data: [],
      errors: ['CSV file must contain at least a header row and one data row'],
      warnings: []
    };
  }

  // Parse header
  const headers = lines[0].split(',').map(h => normalizeHeader(h));
  
  // Validate required columns
  const requiredColumns = ['date', 'type', 'amount', 'description'];
  const missingColumns = requiredColumns.filter(col => !headers.includes(col));
  
  if (missingColumns.length > 0) {
    return {
      success: false,
      data: [],
      errors: [`Missing required columns: ${missingColumns.join(', ')}`],
      warnings: []
    };
  }

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    try {
      const values = parseCSVLine(line);
      
      if (values.length !== headers.length) {
        warnings.push(`Row ${i + 1}: Column count mismatch (expected ${headers.length}, got ${values.length})`);
        continue;
      }

      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index]?.trim() || '';
      });

      // Validate and convert transaction
      const transaction = validateAndConvertRow(row, i + 1, errors, warnings);
      if (transaction) {
        data.push(transaction);
      }
    } catch (error) {
      errors.push(`Row ${i + 1}: ${error.message}`);
    }
  }

  return {
    success: errors.length === 0 && data.length > 0,
    data,
    errors,
    warnings
  };
}

function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  values.push(current);
  return values.map(v => v.replace(/^"|"$/g, ''));
}

function parseXLSX(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get first sheet
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        
        // Convert to CSV
        const csvText = XLSX.utils.sheet_to_csv(firstSheet);
        
        // Parse as CSV
        const result = parseCSV(csvText);
        resolve(result);
      } catch (error) {
        resolve({
          success: false,
          data: [],
          errors: [`Failed to parse XLSX file: ${error.message}`],
          warnings: []
        });
      }
    };
    
    reader.onerror = () => {
      resolve({
        success: false,
        data: [],
        errors: ['Failed to read file'],
        warnings: []
      });
    };
    
    reader.readAsArrayBuffer(file);
  });
}

function validateAndConvertRow(
  row: any,
  rowNumber: number,
  errors: string[],
  warnings: string[]
): ParsedTransaction | null {
  // Validate date
  const dateStr = row.date;
  if (!dateStr) {
    errors.push(`Row ${rowNumber}: Date is required`);
    return null;
  }

  // Try to parse date
  let parsedDate: Date;
  try {
    parsedDate = new Date(dateStr);
    if (isNaN(parsedDate.getTime())) {
      throw new Error('Invalid date');
    }
  } catch {
    errors.push(`Row ${rowNumber}: Invalid date format "${dateStr}". Use YYYY-MM-DD or MM/DD/YYYY`);
    return null;
  }

  // Validate type
  const type = row.type.toLowerCase();
  if (type !== 'income' && type !== 'expense') {
    errors.push(`Row ${rowNumber}: Type must be "income" or "expense", got "${row.type}"`);
    return null;
  }

  // Validate amount
  const amount = parseFloat(row.amount);
  if (isNaN(amount) || amount <= 0) {
    errors.push(`Row ${rowNumber}: Amount must be a positive number, got "${row.amount}"`);
    return null;
  }

  // Validate description
  if (!row.description || row.description.trim() === '') {
    errors.push(`Row ${rowNumber}: Description is required`);
    return null;
  }

  // Build transaction object
  const transaction: ParsedTransaction = {
    date: parsedDate.toISOString().split('T')[0],
    type: type as 'income' | 'expense',
    category: row.category || 'other',
    amount: amount,
    description: row.description,
    status: row.status || 'completed'
  };

  // Add optional fields
  if (row.recurrence_type) {
    const recurrenceType = row.recurrence_type.toLowerCase();
    if (['one-time', 'bi-weekly', 'monthly', 'annual'].includes(recurrenceType)) {
      transaction.recurrence_type = recurrenceType;
    } else {
      warnings.push(`Row ${rowNumber}: Invalid recurrence type "${row.recurrence_type}", defaulting to "one-time"`);
      transaction.recurrence_type = 'one-time';
    }
  }

  if (row.scheduled_date) {
    try {
      const scheduledDate = new Date(row.scheduled_date);
      if (!isNaN(scheduledDate.getTime())) {
        transaction.scheduled_date = scheduledDate.toISOString().split('T')[0];
      }
    } catch {
      warnings.push(`Row ${rowNumber}: Invalid scheduled date "${row.scheduled_date}"`);
    }
  }

  if (row.next_occurrence) {
    try {
      const nextOccurrence = new Date(row.next_occurrence);
      if (!isNaN(nextOccurrence.getTime())) {
        transaction.next_occurrence = nextOccurrence.toISOString().split('T')[0];
      }
    } catch {
      warnings.push(`Row ${rowNumber}: Invalid next occurrence date "${row.next_occurrence}"`);
    }
  }

  if (row.recurrence_end_date) {
    try {
      const endDate = new Date(row.recurrence_end_date);
      if (!isNaN(endDate.getTime())) {
        transaction.recurrence_end_date = endDate.toISOString().split('T')[0];
      }
    } catch {
      warnings.push(`Row ${rowNumber}: Invalid recurrence end date "${row.recurrence_end_date}"`);
    }
  }

  return transaction;
}

export async function parseTransactionFile(file: File): Promise<ParseResult> {
  const fileExtension = file.name.split('.').pop()?.toLowerCase();

  if (fileExtension === 'csv') {
    const text = await file.text();
    return parseCSV(text);
  } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
    return parseXLSX(file);
  } else {
    return {
      success: false,
      data: [],
      errors: [`Unsupported file type: ${fileExtension}. Please use CSV or XLSX files.`],
      warnings: []
    };
  }
}

export function generateSampleCSV(): string {
  const headers = 'date,type,category,amount,description,status,recurrence_type';
  const sample1 = '2024-01-15,income,sales,1500.00,Product sales revenue,completed,one-time';
  const sample2 = '2024-01-16,expense,marketing,250.00,Facebook advertising campaign,completed,one-time';
  const sample3 = '2024-01-17,income,consulting,2000.00,Consulting services fee,completed,one-time';
  const sample4 = '2024-01-18,expense,utilities,150.00,Office electricity bill,completed,monthly';
  
  return [headers, sample1, sample2, sample3, sample4].join('\n');
}
