'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { KPICard } from '@/components/ui/kpi-card';
import { DollarSign, TrendingUp, Wallet, CreditCard, Download, Calendar, Database, Upload } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import { toast } from 'sonner';
import SpreadsheetUpload from '@/components/finance/SpreadsheetUpload';

export default function FinancePage() {
  const [selectedPeriod] = useState('current-month');
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [financialData, setFinancialData] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    totalAR: 0,
    totalPayroll: 0,
    invoices: [] as any[],
    expenses: [] as any[],
    payrollRecords: [] as any[],
  });

  const fetchFinancialData = async () => {
      const supabase = createClient();
      
      const [invoicesRes, expensesRes, clientsRes] = await Promise.all([
        supabase.from('invoices').select('*, clients(name, company)'),
        supabase.from('expenses').select('*'),
        supabase.from('clients').select('balance'),
      ]);

      const invoices = invoicesRes.data || [];
      const expenses = expensesRes.data || [];
      const clients = clientsRes.data || [];

      const totalRevenue = invoices.reduce((sum: number, inv: any) => sum + (parseFloat(inv.amount_paid) || 0), 0);
      const totalExpenses = expenses.reduce((sum: number, exp: any) => sum + (parseFloat(exp.amount) || 0), 0);
      const totalAR = clients.reduce((sum: number, c: any) => sum + (parseFloat(c.balance) || 0), 0);

    // Fetch payroll records
    const { data: payrollRes } = await supabase.from('payroll_records').select('*, employees(name)');
    const payrollRecords = payrollRes || [];
    const totalPayroll = payrollRecords.reduce((sum: number, p: any) => sum + (parseFloat(p.net_pay) || 0), 0);

    setFinancialData({
      totalRevenue,
      totalExpenses,
      totalAR,
      totalPayroll,
      invoices,
      expenses,
      payrollRecords,
    });
    setLoading(false);
  };

  useEffect(() => {
    fetchFinancialData();
  }, [refreshKey]);

  const handleUploadComplete = () => {
    setRefreshKey(prev => prev + 1);
  };

  const { totalRevenue, totalExpenses, totalAR, totalPayroll, invoices, expenses, payrollRecords } = financialData;
  const totalNetIncome = totalRevenue - totalExpenses;
  const cashBalance = totalRevenue - totalExpenses;

  const handleExportReport = () => {
    toast.info('Connect to database to generate reports');
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Financial Management</h1>
            <p className="text-gray-500 mt-1">Comprehensive financial tracking and reporting</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              {selectedPeriod === 'current-month' ? 'Current Month' : 'YTD'}
            </Button>
            <SpreadsheetUpload onUploadComplete={handleUploadComplete} />
            <Button 
              variant="outline"
              onClick={handleExportReport}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KPICard title="Total Revenue (YTD)" value={formatCurrency(totalRevenue)} change={0} trend="neutral" icon={<DollarSign className="h-4 w-4" />} />
          <KPICard title="Net Income (YTD)" value={formatCurrency(totalNetIncome)} change={0} trend="neutral" icon={<TrendingUp className="h-4 w-4" />} />
          <KPICard title="Cash Balance" value={formatCurrency(cashBalance)} change={0} trend="neutral" icon={<Wallet className="h-4 w-4" />} />
          <KPICard title="Accounts Receivable" value={formatCurrency(totalAR)} change={0} trend="neutral" icon={<CreditCard className="h-4 w-4" />} />
        </div>

        <Tabs defaultValue="revenue" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="revenue">Revenue Recognition</TabsTrigger>
            <TabsTrigger value="profitloss">P&L Statement</TabsTrigger>
            <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="ar">Accounts Receivable</TabsTrigger>
          </TabsList>

          <TabsContent value="revenue" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Revenue / Invoices</CardTitle>
              </CardHeader>
              <CardContent>
                {invoices.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Database className="h-12 w-12 text-gray-300 mb-4" />
                    <p className="text-gray-500">No invoice data. Upload a spreadsheet to get started.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Invoice #</TableHead>
                          <TableHead>Client</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Paid</TableHead>
                          <TableHead>Balance</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Due Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoices.slice(0, 20).map((inv: any) => (
                          <TableRow key={inv.id}>
                            <TableCell className="font-medium">{inv.invoice_number}</TableCell>
                            <TableCell>{inv.clients?.name || 'N/A'}</TableCell>
                            <TableCell>{formatCurrency(inv.amount)}</TableCell>
                            <TableCell>{formatCurrency(inv.amount_paid)}</TableCell>
                            <TableCell>{formatCurrency(inv.balance)}</TableCell>
                            <TableCell>
                              <Badge variant={inv.status === 'paid' ? 'default' : inv.status === 'overdue' ? 'destructive' : 'secondary'}>
                                {inv.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{inv.due_date}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {invoices.length > 20 && (
                      <p className="text-sm text-gray-500 mt-2 text-center">Showing 20 of {invoices.length} invoices</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profitloss" className="space-y-4">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Database className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600">No P&L Data</h3>
                <p className="text-gray-500 text-center mt-2">Connect to Supabase to view profit & loss statements</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cashflow" className="space-y-4">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Database className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600">No Cash Flow Data</h3>
                <p className="text-gray-500 text-center mt-2">Connect to Supabase to view cash flow statements</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="expenses" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                {expenses.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Database className="h-12 w-12 text-gray-300 mb-4" />
                    <p className="text-gray-500">No expense data. Upload a spreadsheet to get started.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {expenses.slice(0, 20).map((exp: any) => (
                          <TableRow key={exp.id}>
                            <TableCell>{exp.date}</TableCell>
                            <TableCell>{exp.category}</TableCell>
                            <TableCell>{exp.description}</TableCell>
                            <TableCell>{formatCurrency(exp.amount)}</TableCell>
                            <TableCell>
                              <Badge variant={exp.status === 'approved' ? 'default' : exp.status === 'rejected' ? 'destructive' : 'secondary'}>
                                {exp.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {expenses.length > 20 && (
                      <p className="text-sm text-gray-500 mt-2 text-center">Showing 20 of {expenses.length} expenses</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ar" className="space-y-4">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Database className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600">No AR Data</h3>
                <p className="text-gray-500 text-center mt-2">Connect to Supabase to view accounts receivable aging</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
