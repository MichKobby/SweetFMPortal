import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Invoice, ProfitLoss } from '@/types';
import { formatCurrency } from './formatters';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: typeof autoTable;
    lastAutoTable: {
      finalY: number;
    };
  }
}

const BRAND_COLOR: [number, number, number] = [200, 31, 37]; // #c81f25
const HEADER_COLOR: [number, number, number] = [240, 240, 240];

/**
 * Generate an invoice PDF
 */
export function generateInvoicePDF(invoice: Invoice): void {
  const doc = new jsPDF();
  
  // Header with brand color
  doc.setFillColor(...BRAND_COLOR);
  doc.rect(0, 0, 220, 40, 'F');
  
  // Company name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Sweet FM', 20, 25);
  
  // Invoice title
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('INVOICE', 170, 25);
  
  // Reset text color
  doc.setTextColor(0, 0, 0);
  
  // Invoice details section
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Invoice Number:', 20, 55);
  doc.text('Issue Date:', 20, 62);
  doc.text('Due Date:', 20, 69);
  doc.text('Status:', 20, 76);
  
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.invoiceNumber, 70, 55);
  doc.text(invoice.issueDate, 70, 62);
  doc.text(invoice.dueDate, 70, 69);
  
  // Status with color
  const statusColor = invoice.status === 'paid' ? [16, 185, 129] : 
                      invoice.status === 'pending' ? [245, 158, 11] : 
                      invoice.status === 'overdue' ? [239, 68, 68] : [107, 114, 128];
  doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.text(invoice.status.toUpperCase(), 70, 76);
  doc.setTextColor(0, 0, 0);
  
  // Bill To section
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', 120, 55);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.clientName, 120, 62);
  
  // Line separator
  doc.setDrawColor(200, 200, 200);
  doc.line(20, 85, 190, 85);
  
  // Invoice items table
  autoTable(doc, {
    startY: 95,
    head: [['Description', 'Amount']],
    body: [
      [invoice.description || 'Radio Advertising Services', formatCurrency(invoice.amount)],
    ],
    headStyles: {
      fillColor: BRAND_COLOR,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250],
    },
    margin: { left: 20, right: 20 },
  });
  
  // Summary section
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  doc.setFont('helvetica', 'bold');
  doc.text('Summary', 120, finalY);
  
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', 120, finalY + 10);
  doc.text(formatCurrency(invoice.amount), 170, finalY + 10);
  
  doc.text('Amount Paid:', 120, finalY + 17);
  doc.setTextColor(16, 185, 129);
  doc.text(formatCurrency(invoice.amountPaid), 170, finalY + 17);
  doc.setTextColor(0, 0, 0);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Balance Due:', 120, finalY + 27);
  if (invoice.balance > 0) {
    doc.setTextColor(...BRAND_COLOR);
  }
  doc.text(formatCurrency(invoice.balance), 170, finalY + 27);
  doc.setTextColor(0, 0, 0);
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text('Thank you for your business!', 105, 270, { align: 'center' });
  doc.text('Sweet FM - Your Favorite Radio Station', 105, 275, { align: 'center' });
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, 105, 280, { align: 'center' });
  
  // Save the PDF
  doc.save(`Invoice_${invoice.invoiceNumber}.pdf`);
}

/**
 * Generate a financial report PDF
 */
export function generateFinancialReportPDF(
  profitLossData: ProfitLoss[],
  reportTitle: string = 'Financial Report'
): void {
  const doc = new jsPDF();
  
  // Header
  doc.setFillColor(...BRAND_COLOR);
  doc.rect(0, 0, 220, 35, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Sweet FM', 20, 20);
  
  doc.setFontSize(12);
  doc.text(reportTitle, 170, 20, { align: 'right' });
  
  doc.setTextColor(0, 0, 0);
  
  // Report date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 45);
  
  // Summary cards
  const totalRevenue = profitLossData.reduce((sum, m) => sum + m.totalRevenue, 0);
  const totalExpenses = profitLossData.reduce((sum, m) => sum + m.operatingExpenses, 0);
  const totalNetIncome = profitLossData.reduce((sum, m) => sum + m.netIncome, 0);
  const avgMargin = profitLossData.reduce((sum, m) => sum + m.profitMargin, 0) / profitLossData.length;
  
  // Summary boxes
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(20, 55, 40, 25, 2, 2, 'F');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Total Revenue', 25, 63);
  doc.setFontSize(10);
  doc.setTextColor(16, 185, 129);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(totalRevenue), 25, 73);
  
  doc.setFillColor(254, 243, 199);
  doc.roundedRect(65, 55, 40, 25, 2, 2, 'F');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  doc.text('Total Expenses', 70, 63);
  doc.setFontSize(10);
  doc.setTextColor(245, 158, 11);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(totalExpenses), 70, 73);
  
  doc.setFillColor(219, 234, 254);
  doc.roundedRect(110, 55, 40, 25, 2, 2, 'F');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  doc.text('Net Income', 115, 63);
  doc.setFontSize(10);
  doc.setTextColor(59, 130, 246);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(totalNetIncome), 115, 73);
  
  doc.setFillColor(243, 232, 255);
  doc.roundedRect(155, 55, 40, 25, 2, 2, 'F');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  doc.text('Avg Margin', 160, 63);
  doc.setFontSize(10);
  doc.setTextColor(139, 92, 246);
  doc.setFont('helvetica', 'bold');
  doc.text(`${avgMargin.toFixed(1)}%`, 160, 73);
  
  // Profit & Loss Table
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Profit & Loss Statement', 20, 95);
  
  autoTable(doc, {
    startY: 100,
    head: [['Month', 'Revenue', 'Cost of Revenue', 'Gross Profit', 'Op. Expenses', 'Net Income', 'Margin']],
    body: profitLossData.map(month => [
      `${month.month} ${month.year}`,
      formatCurrency(month.totalRevenue),
      formatCurrency(month.costOfRevenue),
      formatCurrency(month.grossProfit),
      formatCurrency(month.operatingExpenses),
      formatCurrency(month.netIncome),
      `${month.profitMargin.toFixed(1)}%`
    ]),
    foot: [[
      'TOTAL',
      formatCurrency(totalRevenue),
      formatCurrency(profitLossData.reduce((sum, m) => sum + m.costOfRevenue, 0)),
      formatCurrency(profitLossData.reduce((sum, m) => sum + m.grossProfit, 0)),
      formatCurrency(totalExpenses),
      formatCurrency(totalNetIncome),
      `${avgMargin.toFixed(1)}%`
    ]],
    headStyles: {
      fillColor: BRAND_COLOR,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    footStyles: {
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250],
    },
    margin: { left: 20, right: 20 },
  });
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.setFont('helvetica', 'normal');
  doc.text('Sweet FM Financial Report - Confidential', 105, 285, { align: 'center' });
  
  doc.save(`${reportTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
}

/**
 * Generate a generic report PDF with custom data
 */
export function generateGenericReportPDF(
  title: string,
  headers: string[],
  data: (string | number)[][],
  summary?: { label: string; value: string }[]
): void {
  const doc = new jsPDF();
  
  // Header
  doc.setFillColor(...BRAND_COLOR);
  doc.rect(0, 0, 220, 35, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Sweet FM', 20, 20);
  
  doc.setFontSize(12);
  doc.text(title, 170, 20, { align: 'right' });
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 45);
  
  let startY = 55;
  
  // Summary section if provided
  if (summary && summary.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary', 20, startY);
    startY += 10;
    
    summary.forEach((item, index) => {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`${item.label}:`, 20, startY + (index * 7));
      doc.setFont('helvetica', 'bold');
      doc.text(item.value, 80, startY + (index * 7));
    });
    
    startY += (summary.length * 7) + 10;
  }
  
  // Data table
  autoTable(doc, {
    startY: startY,
    head: [headers],
    body: data.map(row => row.map(cell => String(cell))),
    headStyles: {
      fillColor: BRAND_COLOR,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 9,
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250],
    },
    margin: { left: 20, right: 20 },
  });
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.setFont('helvetica', 'normal');
  doc.text('Sweet FM Report - Confidential', 105, 285, { align: 'center' });
  
  doc.save(`${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
}

/**
 * Generate a schedule/programming report PDF
 */
export function generateScheduleReportPDF(
  shows: { name: string; presenter: string; time: string; days: string }[]
): void {
  const doc = new jsPDF();
  
  // Header
  doc.setFillColor(...BRAND_COLOR);
  doc.rect(0, 0, 220, 35, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Sweet FM', 20, 20);
  
  doc.setFontSize(12);
  doc.text('Programming Schedule', 170, 20, { align: 'right' });
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 45);
  
  // Schedule table
  autoTable(doc, {
    startY: 55,
    head: [['Show Name', 'Presenter', 'Time', 'Days']],
    body: shows.map(show => [show.name, show.presenter, show.time, show.days]),
    headStyles: {
      fillColor: BRAND_COLOR,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250],
    },
    margin: { left: 20, right: 20 },
  });
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text('Sweet FM Programming Schedule', 105, 285, { align: 'center' });
  
  doc.save(`Sweet_FM_Schedule_${new Date().toISOString().split('T')[0]}.pdf`);
}
