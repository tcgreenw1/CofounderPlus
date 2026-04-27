import * as XLSX from 'xlsx';

export interface ExportData {
  transactions: any[];
  budgets?: any[];
  summaryData: {
    totalIncome: number;
    totalExpenses: number;
    netIncome: number;
    activeBudgets: number;
    pendingInvoices: number;
  };
  bankBalance: number;
  businessName: string;
}

export function exportFinanceToExcel(data: ExportData) {
  try {
    // Prepare transactions data for Excel
    const exportData = data.transactions.map(t => ({
      'Date': t.date,
      'Type': t.type === 'income' ? 'Income' : 'Expense',
      'Amount': Number(t.amount) || 0,
      'Description': t.description || '',
      'Category': t.category || '',
      'Subcategory': t.subcategory || '',
      'Status': t.status || 'completed',
      'Payment Method': t.payment_method || '',
      'Reference': t.reference || '',
      'Product Name': t.product_name || '',
      'Quantity': t.quantity || '',
      'Tags': t.tags ? t.tags.join(', ') : '',
      'Notes': t.notes || '',
      'Recurrence': t.recurrence_type || 'one-time',
      'Scheduled Date': t.scheduled_date || '',
      'Due Date': t.due_date || '',
      'Created': t.created_at || ''
    }));

    // Create workbook
    const wb = XLSX.utils.book_new();
    
    // Add transactions sheet
    const ws = XLSX.utils.json_to_sheet(exportData);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 12 }, // Date
      { wch: 10 }, // Type
      { wch: 12 }, // Amount
      { wch: 30 }, // Description
      { wch: 15 }, // Category
      { wch: 15 }, // Subcategory
      { wch: 12 }, // Status
      { wch: 15 }, // Payment Method
      { wch: 15 }, // Reference
      { wch: 20 }, // Product Name
      { wch: 10 }, // Quantity
      { wch: 20 }, // Tags
      { wch: 30 }, // Notes
      { wch: 12 }, // Recurrence
      { wch: 12 }, // Scheduled Date
      { wch: 12 }, // Due Date
      { wch: 20 }  // Created
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Transactions');

    // Add summary sheet
    const summarySheetData = [
      { 'Metric': 'Total Income', 'Value': data.summaryData.totalIncome },
      { 'Metric': 'Total Expenses', 'Value': data.summaryData.totalExpenses },
      { 'Metric': 'Net Income', 'Value': data.summaryData.netIncome },
      { 'Metric': 'Current Bank Balance', 'Value': data.bankBalance },
      { 'Metric': 'Total Transactions', 'Value': data.transactions.length },
      { 'Metric': 'Active Budgets', 'Value': data.summaryData.activeBudgets },
      { 'Metric': 'Pending Invoices', 'Value': data.summaryData.pendingInvoices }
    ];
    
    const wsSummary = XLSX.utils.json_to_sheet(summarySheetData);
    wsSummary['!cols'] = [{ wch: 25 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

    // Add budgets sheet if available
    if (data.budgets && data.budgets.length > 0) {
      const budgetData = data.budgets.map(b => ({
        'Budget Name': b.name || '',
        'Category': b.category || '',
        'Amount': b.budget_amount || 0,
        'Spent': b.spent_amount || 0,
        'Remaining': (b.budget_amount || 0) - (b.spent_amount || 0),
        'Period': b.period || '',
        'Status': b.status || '',
        'Start Date': b.start_date || '',
        'End Date': b.end_date || ''
      }));
      
      const wsBudgets = XLSX.utils.json_to_sheet(budgetData);
      wsBudgets['!cols'] = [
        { wch: 25 }, // Budget Name
        { wch: 15 }, // Category
        { wch: 12 }, // Amount
        { wch: 12 }, // Spent
        { wch: 12 }, // Remaining
        { wch: 12 }, // Period
        { wch: 12 }, // Status
        { wch: 12 }, // Start Date
        { wch: 12 }  // End Date
      ];
      XLSX.utils.book_append_sheet(wb, wsBudgets, 'Budgets');
    }

    // Generate filename with business name and date
    const fileName = `${data.businessName}_Transactions_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    // Write file
    XLSX.writeFile(wb, fileName);
    
    return { success: true, fileName };
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    return { success: false, error };
  }
}
