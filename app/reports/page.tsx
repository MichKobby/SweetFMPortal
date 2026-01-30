'use client';

import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileText, Download, TrendingUp, Users, DollarSign, Database } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import { toast } from 'sonner';
import { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const reportTypes = [
  { id: 'revenue', name: 'Revenue Report', icon: DollarSign },
  { id: 'expense', name: 'Expense Report', icon: TrendingUp },
  { id: 'payroll', name: 'Payroll Report', icon: Users },
  { id: 'ar-aging', name: 'AR Aging Report', icon: FileText },
  { id: 'client', name: 'Client Report', icon: Users },
  { id: 'financial', name: 'Financial Summary', icon: DollarSign },
];

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState('revenue');
  const [reportFormat, setReportFormat] = useState('pdf');

  const generateEmptyPDF = async (reportType: string, reportName: string) => {
    const doc = new jsPDF();
    const brandColor: [number, number, number] = [200, 31, 37];
    const today = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', month: 'long', day: 'numeric' 
    });

    // White header area for logo
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, 220, 25, 'F');

    // Load and add logo on white background
    try {
      const logoImg = new Image();
      logoImg.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        logoImg.onload = () => resolve();
        logoImg.onerror = () => reject();
        logoImg.src = '/logo.png';
      });
      
      const canvas = document.createElement('canvas');
      canvas.width = logoImg.width;
      canvas.height = logoImg.height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(logoImg, 0, 0);
      const logoBase64 = canvas.toDataURL('image/png');
      
      // Add logo on white background
      doc.addImage(logoBase64, 'PNG', 14, 5, 45, 14);
    } catch (e) {
      // Fallback to text
      doc.setTextColor(...brandColor);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Sweet FM 106.5', 14, 16);
    }

    // Red banner for report title
    doc.setFillColor(...brandColor);
    doc.rect(0, 25, 220, 18, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(reportName, 14, 37);

    // Report Info
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${today}`, 14, 52);
    doc.text('Status: Template Preview (No Data)', 14, 59);

    // Table headers based on report type
    let headers: string[] = [];
    let sampleRows: string[][] = [];

    switch (reportType) {
      case 'revenue':
        headers = ['Client', 'Invoice #', 'Amount', 'Status', 'Date'];
        sampleRows = [
          ['[Client Name]', '[INV-001]', '[GH₵ 0.00]', '[Status]', '[Date]'],
          ['[Client Name]', '[INV-002]', '[GH₵ 0.00]', '[Status]', '[Date]'],
          ['[Client Name]', '[INV-003]', '[GH₵ 0.00]', '[Status]', '[Date]'],
        ];
        break;
      case 'expense':
        headers = ['Date', 'Category', 'Description', 'Amount', 'Status'];
        sampleRows = [
          ['[Date]', '[Category]', '[Description]', '[GH₵ 0.00]', '[Status]'],
          ['[Date]', '[Category]', '[Description]', '[GH₵ 0.00]', '[Status]'],
          ['[Date]', '[Category]', '[Description]', '[GH₵ 0.00]', '[Status]'],
        ];
        break;
      case 'payroll':
        headers = ['Employee', 'Department', 'Gross Pay', 'Deductions', 'Net Pay'];
        sampleRows = [
          ['[Employee Name]', '[Department]', '[GH₵ 0.00]', '[GH₵ 0.00]', '[GH₵ 0.00]'],
          ['[Employee Name]', '[Department]', '[GH₵ 0.00]', '[GH₵ 0.00]', '[GH₵ 0.00]'],
          ['[Employee Name]', '[Department]', '[GH₵ 0.00]', '[GH₵ 0.00]', '[GH₵ 0.00]'],
        ];
        break;
      default:
        headers = ['Column 1', 'Column 2', 'Column 3', 'Column 4', 'Column 5'];
        sampleRows = [
          ['[Data]', '[Data]', '[Data]', '[Data]', '[Data]'],
          ['[Data]', '[Data]', '[Data]', '[Data]', '[Data]'],
        ];
    }

    // Generate table
    autoTable(doc, {
      startY: 68,
      head: [headers],
      body: sampleRows,
      theme: 'grid',
      headStyles: {
        fillColor: brandColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 9,
        cellPadding: 4,
      },
      alternateRowStyles: {
        fillColor: [248, 248, 248],
      },
    });

    // Footer note
    const finalY = (doc as any).lastAutoTable?.finalY || 120;
    doc.setFontSize(9);
    doc.setTextColor(128, 128, 128);
    doc.text('This is a template preview. Add data to generate actual reports.', 14, finalY + 15);

    // Footer
    doc.setFillColor(...brandColor);
    doc.rect(0, 280, 220, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text('Sweet FM 106.5 - Your Favorite Radio Station', 14, 290);
    doc.text('www.sweetfmonline.com', 150, 290);

    doc.save(`${reportType}-template.pdf`);
    toast.success(`${reportName} template downloaded!`);
  };

  const generateEmptyCSV = (reportType: string, reportName: string) => {
    let headers: string[] = [];

    switch (reportType) {
      case 'revenue':
        headers = ['Client', 'Invoice Number', 'Amount', 'Status', 'Date'];
        break;
      case 'expense':
        headers = ['Date', 'Category', 'Description', 'Amount', 'Status'];
        break;
      case 'payroll':
        headers = ['Employee', 'Department', 'Gross Pay', 'Deductions', 'Net Pay'];
        break;
      default:
        headers = ['Column 1', 'Column 2', 'Column 3', 'Column 4', 'Column 5'];
    }

    const csvContent = headers.join(',') + '\n';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}-template.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${reportName} CSV template downloaded!`);
  };

  const handleGenerateReport = async () => {
    const report = reportTypes.find(r => r.id === selectedReport);
    if (!report) return;

    if (reportFormat === 'pdf') {
      await generateEmptyPDF(selectedReport, report.name);
    } else if (reportFormat === 'csv') {
      generateEmptyCSV(selectedReport, report.name);
    } else {
      toast.info('Excel export coming soon');
    }
  };

  const handleDownload = async (reportId: string, format: string) => {
    const report = reportTypes.find(r => r.id === reportId);
    if (!report) return;

    if (format === 'pdf') {
      await generateEmptyPDF(reportId, report.name);
    } else if (format === 'csv') {
      generateEmptyCSV(reportId, report.name);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-gray-500 mt-1">
              Generate and download comprehensive business reports
            </p>
          </div>
        </div>

        {/* Report Generator */}
        <Card>
          <CardHeader>
            <CardTitle>Generate Report</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium mb-2 block">Report Type</label>
                <Select value={selectedReport} onValueChange={setSelectedReport}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    {reportTypes.map((report) => (
                      <SelectItem key={report.id} value={report.id}>
                        {report.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-[150px]">
                <label className="text-sm font-medium mb-2 block">Format</label>
                <Select value={reportFormat} onValueChange={setReportFormat}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleGenerateReport}
                className="bg-[#c81f25] hover:bg-[#a01820]"
              >
                <FileText className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Reports */}
        <div className="grid gap-4 md:grid-cols-3">
          {reportTypes.slice(0, 3).map((report) => (
            <Card key={report.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <report.icon className="h-4 w-4" />
                  {report.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-500 mb-3">
                  Quick download for {report.name.toLowerCase()}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload(report.id, 'pdf')}
                  >
                    <Download className="h-3 w-3 mr-1" />
                    PDF
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload(report.id, 'csv')}
                  >
                    <Download className="h-3 w-3 mr-1" />
                    CSV
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Database className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600">No Report Data</h3>
            <p className="text-gray-500 text-center mt-2">Connect to Supabase to generate and view reports</p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
