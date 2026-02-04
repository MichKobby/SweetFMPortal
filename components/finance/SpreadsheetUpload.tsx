'use client';

import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Upload, FileSpreadsheet, CheckCircle, AlertTriangle, Download, Loader2 } from 'lucide-react';

type DataType = 'expenses' | 'revenue' | 'payments' | 'salaries';

interface UploadResult {
  success: number;
  failed: number;
  errors: string[];
}

const DATA_TYPE_CONFIG = {
  expenses: {
    label: 'Expenses',
    description: 'Upload monthly expense records',
    requiredColumns: ['date', 'category', 'description', 'amount'],
    optionalColumns: ['payment_method', 'status', 'receipt_url'],
    sampleData: [
      { date: '2026-02-01', category: 'Utilities', description: 'Electricity bill', amount: 500, payment_method: 'bank_transfer', status: 'approved' },
      { date: '2026-02-05', category: 'Equipment', description: 'Microphone replacement', amount: 1200, payment_method: 'cash', status: 'pending' },
    ],
  },
  revenue: {
    label: 'Revenue/Invoices',
    description: 'Upload invoice and revenue records',
    requiredColumns: ['invoice_number', 'client_name', 'amount', 'issue_date', 'due_date'],
    optionalColumns: ['amount_paid', 'status', 'description'],
    sampleData: [
      { invoice_number: 'INV-2026-001', client_name: 'ABC Company', amount: 5000, issue_date: '2026-02-01', due_date: '2026-03-01', amount_paid: 5000, status: 'paid' },
      { invoice_number: 'INV-2026-002', client_name: 'XYZ Ltd', amount: 3000, issue_date: '2026-02-10', due_date: '2026-03-10', amount_paid: 0, status: 'pending' },
    ],
  },
  payments: {
    label: 'Payment Records',
    description: 'Upload client payment records',
    requiredColumns: ['invoice_number', 'amount', 'payment_date', 'payment_method'],
    optionalColumns: ['reference', 'status'],
    sampleData: [
      { invoice_number: 'INV-2026-001', amount: 5000, payment_date: '2026-02-15', payment_method: 'bank_transfer', reference: 'TXN123456' },
      { invoice_number: 'INV-2026-002', amount: 1500, payment_date: '2026-02-20', payment_method: 'mobile_money', reference: 'MM789012' },
    ],
  },
  salaries: {
    label: 'Payroll/Salaries',
    description: 'Upload monthly payroll records',
    requiredColumns: ['employee_name', 'gross_pay', 'deductions', 'net_pay', 'pay_date'],
    optionalColumns: ['pay_period_start', 'pay_period_end', 'status'],
    sampleData: [
      { employee_name: 'John Doe', gross_pay: 3000, deductions: 300, net_pay: 2700, pay_date: '2026-02-28', status: 'paid' },
      { employee_name: 'Jane Smith', gross_pay: 2500, deductions: 250, net_pay: 2250, pay_date: '2026-02-28', status: 'paid' },
    ],
  },
};

interface SpreadsheetUploadProps {
  onUploadComplete?: () => void;
}

export default function SpreadsheetUpload({ onUploadComplete }: SpreadsheetUploadProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dataType, setDataType] = useState<DataType>('expenses');
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const config = DATA_TYPE_CONFIG[dataType];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
    ];

    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.endsWith('.csv')) {
      toast.error('Please upload an Excel (.xlsx, .xls) or CSV file');
      return;
    }

    setFile(selectedFile);
    parseFile(selectedFile);
  };

  const parseFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Validate required columns
        if (jsonData.length > 0) {
          const columns = Object.keys(jsonData[0] as object).map(c => c.toLowerCase().replace(/\s+/g, '_'));
          const missingColumns = config.requiredColumns.filter(
            col => !columns.includes(col.toLowerCase())
          );

          if (missingColumns.length > 0) {
            toast.error(`Missing required columns: ${missingColumns.join(', ')}`);
            setFile(null);
            return;
          }
        }

        // Normalize column names
        const normalizedData = jsonData.map((row: any) => {
          const normalized: any = {};
          Object.keys(row).forEach(key => {
            normalized[key.toLowerCase().replace(/\s+/g, '_')] = row[key];
          });
          return normalized;
        });

        setPreviewData(normalizedData.slice(0, 10)); // Preview first 10 rows
        toast.success(`Loaded ${jsonData.length} records from file`);
      } catch (error) {
        toast.error('Failed to parse file. Please check the format.');
        setFile(null);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleUpload = async () => {
    if (!file || previewData.length === 0) return;

    setIsUploading(true);
    setUploadResult(null);

    const supabase = createClient();
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    try {
      // Re-parse full file for upload
      const reader = new FileReader();
      const fullData = await new Promise<any[]>((resolve) => {
        reader.onload = (e) => {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          const normalizedData = jsonData.map((row: any) => {
            const normalized: any = {};
            Object.keys(row).forEach(key => {
              normalized[key.toLowerCase().replace(/\s+/g, '_')] = row[key];
            });
            return normalized;
          });
          resolve(normalizedData);
        };
        reader.readAsBinaryString(file);
      });

      // Process based on data type
      for (const row of fullData) {
        try {
          switch (dataType) {
            case 'expenses':
              await processExpense(supabase, row);
              break;
            case 'revenue':
              await processRevenue(supabase, row);
              break;
            case 'payments':
              await processPayment(supabase, row);
              break;
            case 'salaries':
              await processSalary(supabase, row);
              break;
          }
          success++;
        } catch (error: any) {
          failed++;
          errors.push(`Row ${success + failed}: ${error.message}`);
        }
      }

      setUploadResult({ success, failed, errors });

      if (success > 0) {
        toast.success(`Successfully uploaded ${success} records`);
        onUploadComplete?.();
      }
      if (failed > 0) {
        toast.warning(`${failed} records failed to upload`);
      }
    } catch (error) {
      toast.error('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const processExpense = async (supabase: any, row: any) => {
    const { error } = await supabase.from('expenses').insert({
      date: formatDate(row.date),
      category: row.category,
      description: row.description,
      amount: parseFloat(row.amount),
      payment_method: row.payment_method || 'cash',
      status: row.status || 'pending',
    });
    if (error) throw new Error(error.message);
  };

  const processRevenue = async (supabase: any, row: any) => {
    // Find or create client
    let clientId: string;
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id')
      .ilike('name', row.client_name)
      .single();

    if (existingClient) {
      clientId = existingClient.id;
    } else {
      // Create a basic client record
      const { data: newClient, error: clientError } = await supabase
        .from('clients')
        .insert({
          client_id: `C${Date.now()}`,
          name: row.client_name,
          company: row.client_name,
          email: `${row.client_name.toLowerCase().replace(/\s+/g, '.')}@placeholder.com`,
          phone: 'N/A',
        })
        .select('id')
        .single();

      if (clientError) throw new Error(`Failed to create client: ${clientError.message}`);
      clientId = newClient.id;
    }

    // Create invoice
    const { error } = await supabase.from('invoices').insert({
      invoice_number: row.invoice_number,
      client_id: clientId,
      amount: parseFloat(row.amount),
      amount_paid: parseFloat(row.amount_paid || 0),
      status: row.status || 'pending',
      issue_date: formatDate(row.issue_date),
      due_date: formatDate(row.due_date),
      description: row.description || null,
    });
    if (error) throw new Error(error.message);
  };

  const processPayment = async (supabase: any, row: any) => {
    // Find invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('id')
      .eq('invoice_number', row.invoice_number)
      .single();

    if (invoiceError || !invoice) {
      throw new Error(`Invoice ${row.invoice_number} not found`);
    }

    // Record payment
    const { error } = await supabase.from('payment_history').insert({
      invoice_id: invoice.id,
      amount: parseFloat(row.amount),
      payment_date: formatDate(row.payment_date),
      payment_method: row.payment_method,
      reference: row.reference || null,
      status: row.status || 'completed',
    });
    if (error) throw new Error(error.message);

    // Update invoice amount_paid
    await supabase
      .from('invoices')
      .update({ 
        amount_paid: supabase.raw(`amount_paid + ${parseFloat(row.amount)}`),
      })
      .eq('id', invoice.id);
  };

  const processSalary = async (supabase: any, row: any) => {
    // Find employee
    const { data: employee, error: empError } = await supabase
      .from('employees')
      .select('id')
      .ilike('name', row.employee_name)
      .single();

    if (empError || !employee) {
      throw new Error(`Employee ${row.employee_name} not found`);
    }

    // Create payroll record
    const { error } = await supabase.from('payroll_records').insert({
      employee_id: employee.id,
      gross_pay: parseFloat(row.gross_pay),
      deductions: parseFloat(row.deductions || 0),
      net_pay: parseFloat(row.net_pay),
      pay_date: formatDate(row.pay_date),
      pay_period_start: row.pay_period_start ? formatDate(row.pay_period_start) : formatDate(row.pay_date),
      pay_period_end: row.pay_period_end ? formatDate(row.pay_period_end) : formatDate(row.pay_date),
      status: row.status || 'paid',
    });
    if (error) throw new Error(error.message);
  };

  const formatDate = (value: any): string => {
    if (!value) return new Date().toISOString().split('T')[0];
    
    // Handle Excel date serial numbers
    if (typeof value === 'number') {
      const date = XLSX.SSF.parse_date_code(value);
      return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
    }
    
    // Handle string dates
    const date = new Date(value);
    if (isNaN(date.getTime())) return new Date().toISOString().split('T')[0];
    return date.toISOString().split('T')[0];
  };

  const downloadTemplate = () => {
    const worksheet = XLSX.utils.json_to_sheet(config.sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, config.label);
    XLSX.writeFile(workbook, `${dataType}_template.xlsx`);
    toast.success('Template downloaded');
  };

  const resetUpload = () => {
    setFile(null);
    setPreviewData([]);
    setUploadResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <Button onClick={() => setIsDialogOpen(true)} className="bg-[#c81f25] hover:bg-[#a01820]">
        <Upload className="h-4 w-4 mr-2" />
        Upload Spreadsheet
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetUpload(); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Upload Financial Data
            </DialogTitle>
            <DialogDescription>
              Upload Excel or CSV files to import financial records into the system
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Data Type Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Data Type</label>
              <Select value={dataType} onValueChange={(v) => { setDataType(v as DataType); resetUpload(); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DATA_TYPE_CONFIG).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>
                      {cfg.label} - {cfg.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Required Columns Info */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm">Required Columns for {config.label}</CardTitle>
              </CardHeader>
              <CardContent className="py-2">
                <div className="flex flex-wrap gap-2">
                  {config.requiredColumns.map(col => (
                    <Badge key={col} variant="default">{col}</Badge>
                  ))}
                  {config.optionalColumns.map(col => (
                    <Badge key={col} variant="outline">{col} (optional)</Badge>
                  ))}
                </div>
                <Button variant="link" size="sm" className="mt-2 p-0 h-auto" onClick={downloadTemplate}>
                  <Download className="h-3 w-3 mr-1" />
                  Download Template
                </Button>
              </CardContent>
            </Card>

            {/* File Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Upload File</label>
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <FileSpreadsheet className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">
                    {file ? file.name : 'Click to select or drag and drop'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Supports .xlsx, .xls, .csv
                  </p>
                </label>
              </div>
            </div>

            {/* Preview */}
            {previewData.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Preview (first 10 rows)</label>
                <div className="border rounded-lg overflow-x-auto max-h-64">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {Object.keys(previewData[0]).map(col => (
                          <TableHead key={col} className="whitespace-nowrap text-xs">
                            {col}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.map((row, i) => (
                        <TableRow key={i}>
                          {Object.values(row).map((val: any, j) => (
                            <TableCell key={j} className="text-xs whitespace-nowrap">
                              {String(val)}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Upload Result */}
            {uploadResult && (
              <Alert variant={uploadResult.failed > 0 ? 'destructive' : 'default'}>
                <div className="flex items-start gap-2">
                  {uploadResult.failed > 0 ? (
                    <AlertTriangle className="h-4 w-4 mt-0.5" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mt-0.5 text-green-600" />
                  )}
                  <AlertDescription>
                    <p className="font-medium">
                      {uploadResult.success} records uploaded successfully
                      {uploadResult.failed > 0 && `, ${uploadResult.failed} failed`}
                    </p>
                    {uploadResult.errors.length > 0 && (
                      <ul className="mt-2 text-xs space-y-1">
                        {uploadResult.errors.slice(0, 5).map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                        {uploadResult.errors.length > 5 && (
                          <li>...and {uploadResult.errors.length - 5} more errors</li>
                        )}
                      </ul>
                    )}
                  </AlertDescription>
                </div>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!file || previewData.length === 0 || isUploading}
              className="bg-[#c81f25] hover:bg-[#a01820]"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload {previewData.length > 0 ? `(${previewData.length}+ records)` : ''}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
