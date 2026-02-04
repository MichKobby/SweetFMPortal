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
import { DollarSign, TrendingUp, Wallet, CreditCard, Download, Calendar, Database, Upload, Users, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
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
    clients: [] as any[],
  });

  const fetchFinancialData = async () => {
    const supabase = createClient();
    
    const [invoicesRes, expensesRes, clientsRes] = await Promise.all([
      supabase.from('invoices').select('*, clients(name, company)').order('issue_date', { ascending: false }),
      supabase.from('expenses').select('*').order('date', { ascending: false }),
      supabase.from('clients').select('id, name, company, balance'),
    ]);

    const invoices = invoicesRes.data || [];
    const expenses = expensesRes.data || [];
    const clients = clientsRes.data || [];

    const totalRevenue = invoices.reduce((sum: number, inv: any) => sum + (parseFloat(inv.amount_paid) || 0), 0);
    const totalExpenses = expenses.reduce((sum: number, exp: any) => sum + (parseFloat(exp.amount) || 0), 0);
    const totalAR = clients.reduce((sum: number, c: any) => sum + (parseFloat(c.balance) || 0), 0);

    // Fetch payroll records
    const { data: payrollRes } = await supabase.from('payroll_records').select('*, employees(name)').order('pay_date', { ascending: false });
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
      clients,
    });
    setLoading(false);
  };

  useEffect(() => {
    fetchFinancialData();
  }, [refreshKey]);

  const handleUploadComplete = () => {
    setRefreshKey(prev => prev + 1);
  };

  const { totalRevenue, totalExpenses, totalAR, totalPayroll, invoices, expenses, payrollRecords, clients } = financialData;
  const totalNetIncome = totalRevenue - totalExpenses - totalPayroll;
  const cashBalance = totalRevenue - totalExpenses - totalPayroll;

  // Calculate expense breakdown by category
  const expensesByCategory = expenses.reduce((acc: any, exp: any) => {
    const category = exp.category || 'Other';
    acc[category] = (acc[category] || 0) + (parseFloat(exp.amount) || 0);
    return acc;
  }, {});

  // Calculate AR aging
  const calculateARaging = () => {
    const today = new Date();
    const aging = { current: 0, days30: 0, days60: 0, days90: 0, over90: 0 };
    
    invoices.forEach((inv: any) => {
      if (inv.status === 'paid') return;
      const balance = parseFloat(inv.balance) || 0;
      if (balance <= 0) return;
      
      const dueDate = new Date(inv.due_date);
      const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysOverdue <= 0) aging.current += balance;
      else if (daysOverdue <= 30) aging.days30 += balance;
      else if (daysOverdue <= 60) aging.days60 += balance;
      else if (daysOverdue <= 90) aging.days90 += balance;
      else aging.over90 += balance;
    });
    
    return aging;
  };

  const arAging = calculateARaging();

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

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <KPICard title="Total Revenue" value={formatCurrency(totalRevenue)} change={0} trend="neutral" icon={<DollarSign className="h-4 w-4" />} />
          <KPICard title="Total Expenses" value={formatCurrency(totalExpenses)} change={0} trend="neutral" icon={<ArrowDownRight className="h-4 w-4" />} />
          <KPICard title="Payroll" value={formatCurrency(totalPayroll)} change={0} trend="neutral" icon={<Users className="h-4 w-4" />} />
          <KPICard title="Net Income" value={formatCurrency(totalNetIncome)} change={0} trend={totalNetIncome >= 0 ? 'up' : 'down'} icon={<TrendingUp className="h-4 w-4" />} />
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
              <CardHeader>
                <CardTitle>Profit & Loss Statement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Revenue Section */}
                  <div>
                    <h4 className="font-semibold text-green-700 mb-2">Revenue</h4>
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <span>Total Revenue (Payments Received)</span>
                        <span className="font-bold text-green-700">{formatCurrency(totalRevenue)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Expenses Section */}
                  <div>
                    <h4 className="font-semibold text-red-700 mb-2">Operating Expenses</h4>
                    <div className="bg-red-50 rounded-lg p-4 space-y-2">
                      {Object.keys(expensesByCategory).length > 0 ? (
                        <>
                          {Object.entries(expensesByCategory).map(([category, amount]) => (
                            <div key={category} className="flex justify-between items-center text-sm">
                              <span>{category}</span>
                              <span>{formatCurrency(amount as number)}</span>
                            </div>
                          ))}
                          <div className="border-t pt-2 mt-2 flex justify-between items-center font-semibold">
                            <span>Total Expenses</span>
                            <span className="text-red-700">{formatCurrency(totalExpenses)}</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex justify-between items-center">
                          <span>Total Expenses</span>
                          <span className="font-bold text-red-700">{formatCurrency(totalExpenses)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Payroll Section */}
                  <div>
                    <h4 className="font-semibold text-orange-700 mb-2">Payroll Expenses</h4>
                    <div className="bg-orange-50 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <span>Total Payroll (Net Pay)</span>
                        <span className="font-bold text-orange-700">{formatCurrency(totalPayroll)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Net Income */}
                  <div className="border-t-2 pt-4">
                    <div className={`rounded-lg p-4 ${totalNetIncome >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-lg">Net Income</span>
                        <span className={`font-bold text-xl ${totalNetIncome >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                          {formatCurrency(totalNetIncome)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Revenue - Expenses - Payroll</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cashflow" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Cash Flow Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Cash Inflows */}
                  <div>
                    <h4 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
                      <ArrowUpRight className="h-4 w-4" />
                      Cash Inflows
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                        <span>Client Payments Received</span>
                        <span className="font-semibold text-green-700">{formatCurrency(totalRevenue)}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-3 mt-2 bg-green-100 rounded-lg font-semibold">
                      <span>Total Inflows</span>
                      <span className="text-green-700">{formatCurrency(totalRevenue)}</span>
                    </div>
                  </div>

                  {/* Cash Outflows */}
                  <div>
                    <h4 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
                      <ArrowDownRight className="h-4 w-4" />
                      Cash Outflows
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                        <span>Operating Expenses</span>
                        <span className="font-semibold text-red-700">{formatCurrency(totalExpenses)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                        <span>Payroll Payments</span>
                        <span className="font-semibold text-red-700">{formatCurrency(totalPayroll)}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-3 mt-2 bg-red-100 rounded-lg font-semibold">
                      <span>Total Outflows</span>
                      <span className="text-red-700">{formatCurrency(totalExpenses + totalPayroll)}</span>
                    </div>
                  </div>

                  {/* Net Cash Flow */}
                  <div className="border-t-2 pt-4">
                    <div className={`rounded-lg p-4 ${cashBalance >= 0 ? 'bg-blue-100' : 'bg-red-100'}`}>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-lg">Net Cash Flow</span>
                        <span className={`font-bold text-xl ${cashBalance >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                          {formatCurrency(cashBalance)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Outstanding Receivables */}
                  <div className="border-t pt-4">
                    <div className="bg-yellow-50 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-semibold">Outstanding Receivables</span>
                          <p className="text-xs text-gray-500">Amounts still owed by clients</p>
                        </div>
                        <span className="font-bold text-yellow-700">{formatCurrency(totalAR)}</span>
                      </div>
                    </div>
                  </div>
                </div>
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
            {/* AR Aging Summary */}
            <div className="grid gap-4 md:grid-cols-5">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Current</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-green-600">{formatCurrency(arAging.current)}</div>
                  <p className="text-xs text-gray-500">Not yet due</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">1-30 Days</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-yellow-600">{formatCurrency(arAging.days30)}</div>
                  <p className="text-xs text-gray-500">Overdue</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">31-60 Days</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-orange-600">{formatCurrency(arAging.days60)}</div>
                  <p className="text-xs text-gray-500">Overdue</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">61-90 Days</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-red-500">{formatCurrency(arAging.days90)}</div>
                  <p className="text-xs text-gray-500">Overdue</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">90+ Days</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-red-700">{formatCurrency(arAging.over90)}</div>
                  <p className="text-xs text-gray-500">Severely overdue</p>
                </CardContent>
              </Card>
            </div>

            {/* Client AR Details */}
            <Card>
              <CardHeader>
                <CardTitle>Accounts Receivable by Client</CardTitle>
              </CardHeader>
              <CardContent>
                {clients.filter((c: any) => parseFloat(c.balance) > 0).length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Database className="h-12 w-12 text-gray-300 mb-4" />
                    <p className="text-gray-500">No outstanding receivables</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Client</TableHead>
                          <TableHead>Company</TableHead>
                          <TableHead className="text-right">Outstanding Balance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {clients
                          .filter((c: any) => parseFloat(c.balance) > 0)
                          .sort((a: any, b: any) => parseFloat(b.balance) - parseFloat(a.balance))
                          .map((client: any) => (
                            <TableRow key={client.id}>
                              <TableCell className="font-medium">{client.name}</TableCell>
                              <TableCell>{client.company || '-'}</TableCell>
                              <TableCell className="text-right font-semibold text-red-600">
                                {formatCurrency(client.balance)}
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Overdue Invoices */}
            <Card>
              <CardHeader>
                <CardTitle>Overdue Invoices</CardTitle>
              </CardHeader>
              <CardContent>
                {invoices.filter((inv: any) => inv.status === 'overdue' || (inv.status !== 'paid' && new Date(inv.due_date) < new Date())).length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Database className="h-12 w-12 text-gray-300 mb-4" />
                    <p className="text-gray-500">No overdue invoices</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Invoice #</TableHead>
                          <TableHead>Client</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead>Days Overdue</TableHead>
                          <TableHead className="text-right">Balance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoices
                          .filter((inv: any) => inv.status !== 'paid' && parseFloat(inv.balance) > 0)
                          .map((inv: any) => {
                            const daysOverdue = Math.floor((new Date().getTime() - new Date(inv.due_date).getTime()) / (1000 * 60 * 60 * 24));
                            return (
                              <TableRow key={inv.id}>
                                <TableCell className="font-medium">{inv.invoice_number}</TableCell>
                                <TableCell>{inv.clients?.name || 'N/A'}</TableCell>
                                <TableCell>{inv.due_date}</TableCell>
                                <TableCell>
                                  <Badge variant={daysOverdue > 60 ? 'destructive' : daysOverdue > 30 ? 'default' : 'secondary'}>
                                    {daysOverdue > 0 ? `${daysOverdue} days` : 'Current'}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right font-semibold text-red-600">
                                  {formatCurrency(inv.balance)}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
