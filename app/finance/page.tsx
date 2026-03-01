'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { createClient } from '@/lib/supabase/client';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { KPICard } from '@/components/ui/kpi-card';
import { DollarSign, TrendingUp, CreditCard, Download, Calendar, Database, Users, ArrowUpRight, ArrowDownRight, Plus, Loader2, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import { toast } from 'sonner';
import SpreadsheetUpload from '@/components/finance/SpreadsheetUpload';

interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
}

const EXPENSE_CATEGORIES = ['Utilities', 'Marketing', 'Equipment', 'Software', 'Rent', 'Travel', 'Supplies', 'Other'];
const PAYMENT_METHODS = ['bank_transfer', 'check', 'cash', 'credit_card', 'other'];

export default function FinancePage() {
  const { currentOutlet } = useStore();
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

  // --- New Invoice dialog ---
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({
    client_id: '',
    invoice_number: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: '',
    payment_terms: 'Net 30',
    status: 'sent' as 'draft' | 'sent',
    notes: '',
  });
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: '', quantity: 1, unit_price: 0 },
  ]);

  // --- Record Payment dialog ---
  const [paymentTarget, setPaymentTarget] = useState<any | null>(null);
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'bank_transfer',
    reference: '',
  });

  // --- New Expense dialog ---
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [isCreatingExpense, setIsCreatingExpense] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'Other',
    description: '',
    amount: '',
    payment_method: 'bank_transfer',
  });

  const fetchFinancialData = async () => {
    const supabase = createClient();
    const outletId = currentOutlet?.id;

    let invoicesQuery = supabase.from('invoices').select('*, clients(name, company)').order('issue_date', { ascending: false });
    let expensesQuery = supabase.from('expenses').select('*').order('date', { ascending: false });
    let payrollQuery = supabase.from('payroll_records').select('*, employees(name)').order('pay_date', { ascending: false });

    if (outletId) {
      invoicesQuery = invoicesQuery.eq('outlet_id', outletId);
      expensesQuery = expensesQuery.eq('outlet_id', outletId);
      payrollQuery = payrollQuery.eq('outlet_id', outletId);
    }

    const [invoicesRes, expensesRes, clientsRes] = await Promise.all([
      invoicesQuery,
      expensesQuery,
      supabase.from('clients').select('id, name, company, balance'),
    ]);

    const invoices = invoicesRes.data || [];
    const expenses = expensesRes.data || [];
    const clients = clientsRes.data || [];

    const totalRevenue = invoices.reduce((sum: number, inv: any) => sum + (parseFloat(inv.amount_paid) || 0), 0);
    const totalExpenses = expenses.reduce((sum: number, exp: any) => sum + (parseFloat(exp.amount) || 0), 0);
    const totalAR = clients.reduce((sum: number, c: any) => sum + (parseFloat(c.balance) || 0), 0);

    const { data: payrollRes } = await payrollQuery;
    const payrollRecords = payrollRes || [];
    const totalPayroll = payrollRecords.reduce((sum: number, p: any) => sum + (parseFloat(p.net_pay) || 0), 0);

    setFinancialData({ totalRevenue, totalExpenses, totalAR, totalPayroll, invoices, expenses, payrollRecords, clients });
    setLoading(false);
  };

  useEffect(() => {
    fetchFinancialData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey, currentOutlet?.id]);

  const handleUploadComplete = () => setRefreshKey(prev => prev + 1);

  const openNewInvoiceDialog = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const seq = String(financialData.invoices.length + 1).padStart(3, '0');
    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() + 30);

    setInvoiceForm({
      client_id: '',
      invoice_number: `INV-${year}${month}-${seq}`,
      issue_date: now.toISOString().split('T')[0],
      due_date: dueDate.toISOString().split('T')[0],
      payment_terms: 'Net 30',
      status: 'sent',
      notes: '',
    });
    setLineItems([{ description: '', quantity: 1, unit_price: 0 }]);
    setIsInvoiceDialogOpen(true);
  };

  const invoiceTotal = lineItems.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceForm.client_id) {
      toast.error('Please select a client');
      return;
    }
    if (lineItems.some(item => !item.description || item.unit_price <= 0)) {
      toast.error('All line items must have a description and a price greater than 0');
      return;
    }

    setIsCreatingInvoice(true);
    const supabase = createClient();

    const { data: invoice, error } = await supabase
      .from('invoices')
      .insert({
        invoice_number: invoiceForm.invoice_number,
        client_id: invoiceForm.client_id,
        amount: invoiceTotal,
        amount_paid: 0,
        balance: invoiceTotal,
        status: invoiceForm.status,
        issue_date: invoiceForm.issue_date,
        due_date: invoiceForm.due_date,
        payment_terms: invoiceForm.payment_terms,
        notes: invoiceForm.notes || null,
        description: lineItems.map(i => i.description).join('; '),
        ...(currentOutlet?.id ? { outlet_id: currentOutlet.id } : {}),
      })
      .select()
      .single();

    if (error) {
      setIsCreatingInvoice(false);
      toast.error('Failed to create invoice');
      return;
    }

    // Insert line items
    if (invoice) {
      await supabase.from('invoice_items').insert(
        lineItems.map(item => ({
          invoice_id: invoice.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          amount: item.quantity * item.unit_price,
        }))
      );

      // Update client total_billed
      try {
        await supabase.rpc('increment_client_total_billed', {
          p_client_id: invoiceForm.client_id,
          p_amount: invoiceTotal,
        });
      } catch {
        // RPC may not exist; silently skip — the invoice is still created
      }
    }

    setIsCreatingInvoice(false);
    setIsInvoiceDialogOpen(false);
    toast.success(`Invoice ${invoiceForm.invoice_number} created`);
    setRefreshKey(prev => prev + 1);
  };

  const openPaymentDialog = (invoice: any) => {
    setPaymentTarget(invoice);
    setPaymentForm({
      amount: String(parseFloat(invoice.balance) || ''),
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: 'bank_transfer',
      reference: '',
    });
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentTarget) return;

    const amount = parseFloat(paymentForm.amount);
    if (!amount || amount <= 0) {
      toast.error('Enter a valid payment amount');
      return;
    }

    setIsRecordingPayment(true);
    const supabase = createClient();

    const { error: historyError } = await supabase.from('payment_history').insert({
      invoice_id: paymentTarget.id,
      invoice_number: paymentTarget.invoice_number,
      amount,
      payment_date: paymentForm.payment_date,
      payment_method: paymentForm.payment_method,
      reference: paymentForm.reference || null,
      status: 'completed',
    });

    if (historyError) {
      setIsRecordingPayment(false);
      toast.error('Failed to record payment');
      return;
    }

    const prevPaid = parseFloat(paymentTarget.amount_paid) || 0;
    const totalAmount = parseFloat(paymentTarget.amount) || 0;
    const newPaid = prevPaid + amount;
    const newBalance = Math.max(0, totalAmount - newPaid);
    const newStatus = newBalance <= 0 ? 'paid' : paymentTarget.status === 'overdue' ? 'overdue' : 'pending';

    await supabase
      .from('invoices')
      .update({ amount_paid: newPaid, balance: newBalance, status: newStatus })
      .eq('id', paymentTarget.id);

    // Update client balance
    if (paymentTarget.client_id) {
      try {
        await supabase.rpc('decrement_client_balance', {
          p_client_id: paymentTarget.client_id,
          p_amount: amount,
        });
      } catch {
        // RPC may not exist; silently skip
      }
    }

    setIsRecordingPayment(false);
    setPaymentTarget(null);
    toast.success('Payment recorded successfully');
    setRefreshKey(prev => prev + 1);
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(expenseForm.amount);
    if (!amount || amount <= 0) {
      toast.error('Enter a valid amount');
      return;
    }

    setIsCreatingExpense(true);
    const supabase = createClient();

    const { error } = await supabase.from('expenses').insert({
      date: expenseForm.date,
      category: expenseForm.category,
      description: expenseForm.description,
      amount,
      payment_method: expenseForm.payment_method,
      status: 'pending',
      ...(currentOutlet?.id ? { outlet_id: currentOutlet.id } : {}),
    });

    setIsCreatingExpense(false);

    if (error) {
      toast.error('Failed to create expense');
      return;
    }

    setIsExpenseDialogOpen(false);
    setExpenseForm({ date: new Date().toISOString().split('T')[0], category: 'Other', description: '', amount: '', payment_method: 'bank_transfer' });
    toast.success('Expense recorded');
    setRefreshKey(prev => prev + 1);
  };

  const { totalRevenue, totalExpenses, totalAR, totalPayroll, invoices, expenses, payrollRecords, clients } = financialData;
  const totalNetIncome = totalRevenue - totalExpenses - totalPayroll;
  const cashBalance = totalRevenue - totalExpenses - totalPayroll;

  const expensesByCategory = expenses.reduce((acc: any, exp: any) => {
    const category = exp.category || 'Other';
    acc[category] = (acc[category] || 0) + (parseFloat(exp.amount) || 0);
    return acc;
  }, {});

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
            <Button variant="outline" onClick={handleExportReport}>
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

          {/* ── Revenue / Invoices ── */}
          <TabsContent value="revenue" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Revenue / Invoices</CardTitle>
                  <Button className="bg-brand hover:bg-brand-hover" onClick={openNewInvoiceDialog}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Invoice
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {invoices.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Database className="h-12 w-12 text-gray-300 mb-4" />
                    <p className="text-gray-500">No invoices yet. Create your first invoice above.</p>
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
                          <TableHead>Actions</TableHead>
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
                            <TableCell>
                              {inv.status !== 'paid' && parseFloat(inv.balance) > 0 && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openPaymentDialog(inv)}
                                >
                                  Record Payment
                                </Button>
                              )}
                            </TableCell>
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

          {/* ── P&L ── */}
          <TabsContent value="profitloss" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Profit & Loss Statement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-green-700 mb-2">Revenue</h4>
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <span>Total Revenue (Payments Received)</span>
                        <span className="font-bold text-green-700">{formatCurrency(totalRevenue)}</span>
                      </div>
                    </div>
                  </div>

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

                  <div>
                    <h4 className="font-semibold text-orange-700 mb-2">Payroll Expenses</h4>
                    <div className="bg-orange-50 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <span>Total Payroll (Net Pay)</span>
                        <span className="font-bold text-orange-700">{formatCurrency(totalPayroll)}</span>
                      </div>
                    </div>
                  </div>

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

          {/* ── Cash Flow ── */}
          <TabsContent value="cashflow" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Cash Flow Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
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

          {/* ── Expenses ── */}
          <TabsContent value="expenses" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Expenses</CardTitle>
                  <Button className="bg-brand hover:bg-brand-hover" onClick={() => setIsExpenseDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Expense
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {expenses.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Database className="h-12 w-12 text-gray-300 mb-4" />
                    <p className="text-gray-500">No expenses yet. Record your first expense above.</p>
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

          {/* ── Accounts Receivable ── */}
          <TabsContent value="ar" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-5">
              {[
                { label: 'Current', value: arAging.current, color: 'text-green-600', sub: 'Not yet due' },
                { label: '1-30 Days', value: arAging.days30, color: 'text-yellow-600', sub: 'Overdue' },
                { label: '31-60 Days', value: arAging.days60, color: 'text-orange-600', sub: 'Overdue' },
                { label: '61-90 Days', value: arAging.days90, color: 'text-red-500', sub: 'Overdue' },
                { label: '90+ Days', value: arAging.over90, color: 'text-red-700', sub: 'Severely overdue' },
              ].map(({ label, value, color, sub }) => (
                <Card key={label}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">{label}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-xl font-bold ${color}`}>{formatCurrency(value)}</div>
                    <p className="text-xs text-gray-500">{sub}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

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

            <Card>
              <CardHeader>
                <CardTitle>Overdue Invoices</CardTitle>
              </CardHeader>
              <CardContent>
                {invoices.filter((inv: any) => inv.status !== 'paid' && parseFloat(inv.balance) > 0).length === 0 ? (
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
                            const daysOverdue = Math.floor(
                              (new Date().getTime() - new Date(inv.due_date).getTime()) / (1000 * 60 * 60 * 24)
                            );
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

        {/* ── New Invoice Dialog ── */}
        <Dialog open={isInvoiceDialogOpen} onOpenChange={setIsInvoiceDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Invoice</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateInvoice} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="inv-client">Client *</Label>
                  <Select
                    value={invoiceForm.client_id}
                    onValueChange={(v) => setInvoiceForm({ ...invoiceForm, client_id: v })}
                  >
                    <SelectTrigger id="inv-client">
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}{c.company ? ` — ${c.company}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inv-number">Invoice Number</Label>
                  <Input
                    id="inv-number"
                    value={invoiceForm.invoice_number}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, invoice_number: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inv-issue">Issue Date</Label>
                  <Input
                    id="inv-issue"
                    type="date"
                    value={invoiceForm.issue_date}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, issue_date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inv-due">Due Date</Label>
                  <Input
                    id="inv-due"
                    type="date"
                    value={invoiceForm.due_date}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, due_date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inv-terms">Payment Terms</Label>
                  <Select
                    value={invoiceForm.payment_terms}
                    onValueChange={(v) => setInvoiceForm({ ...invoiceForm, payment_terms: v })}
                  >
                    <SelectTrigger id="inv-terms">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Net 15">Net 15</SelectItem>
                      <SelectItem value="Net 30">Net 30</SelectItem>
                      <SelectItem value="Net 45">Net 45</SelectItem>
                      <SelectItem value="Net 60">Net 60</SelectItem>
                      <SelectItem value="Due on Receipt">Due on Receipt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inv-status">Status</Label>
                  <Select
                    value={invoiceForm.status}
                    onValueChange={(v) => setInvoiceForm({ ...invoiceForm, status: v as 'draft' | 'sent' })}
                  >
                    <SelectTrigger id="inv-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Line Items */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Line Items *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setLineItems([...lineItems, { description: '', quantity: 1, unit_price: 0 }])}
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add Line
                  </Button>
                </div>
                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-2 text-xs text-gray-500 px-1">
                    <span className="col-span-6">Description</span>
                    <span className="col-span-2 text-center">Qty</span>
                    <span className="col-span-2 text-right">Unit Price</span>
                    <span className="col-span-1 text-right">Total</span>
                    <span className="col-span-1" />
                  </div>
                  {lineItems.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                      <Input
                        className="col-span-6"
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) => {
                          const updated = [...lineItems];
                          updated[idx] = { ...updated[idx], description: e.target.value };
                          setLineItems(updated);
                        }}
                        required
                      />
                      <Input
                        className="col-span-2"
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => {
                          const updated = [...lineItems];
                          updated[idx] = { ...updated[idx], quantity: parseFloat(e.target.value) || 1 };
                          setLineItems(updated);
                        }}
                      />
                      <Input
                        className="col-span-2"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={item.unit_price || ''}
                        onChange={(e) => {
                          const updated = [...lineItems];
                          updated[idx] = { ...updated[idx], unit_price: parseFloat(e.target.value) || 0 };
                          setLineItems(updated);
                        }}
                      />
                      <span className="col-span-1 text-right text-sm font-medium">
                        {formatCurrency(item.quantity * item.unit_price)}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="col-span-1 text-red-500 hover:text-red-700"
                        onClick={() => setLineItems(lineItems.filter((_, i) => i !== idx))}
                        disabled={lineItems.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex justify-end pt-1 border-t">
                    <span className="text-sm font-semibold">Total: {formatCurrency(invoiceTotal)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="inv-notes">Notes (Optional)</Label>
                <Input
                  id="inv-notes"
                  value={invoiceForm.notes}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
                  placeholder="Additional notes for the client"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsInvoiceDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-brand hover:bg-brand-hover" disabled={isCreatingInvoice}>
                  {isCreatingInvoice && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create Invoice
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* ── Record Payment Dialog ── */}
        <Dialog open={!!paymentTarget} onOpenChange={() => setPaymentTarget(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Record Payment</DialogTitle>
            </DialogHeader>
            {paymentTarget && (
              <form onSubmit={handleRecordPayment} className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-3 text-sm">
                  <p><span className="text-gray-500">Invoice:</span> <strong>{paymentTarget.invoice_number}</strong></p>
                  <p><span className="text-gray-500">Client:</span> {paymentTarget.clients?.name || 'N/A'}</p>
                  <p><span className="text-gray-500">Balance due:</span> <strong>{formatCurrency(paymentTarget.balance)}</strong></p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pay-amount">Amount *</Label>
                  <Input
                    id="pay-amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    max={parseFloat(paymentTarget.balance)}
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pay-date">Payment Date</Label>
                  <Input
                    id="pay-date"
                    type="date"
                    value={paymentForm.payment_date}
                    onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pay-method">Payment Method</Label>
                  <Select
                    value={paymentForm.payment_method}
                    onValueChange={(v) => setPaymentForm({ ...paymentForm, payment_method: v })}
                  >
                    <SelectTrigger id="pay-method">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map(m => (
                        <SelectItem key={m} value={m} className="capitalize">{m.replace('_', ' ')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pay-ref">Reference Number (Optional)</Label>
                  <Input
                    id="pay-ref"
                    value={paymentForm.reference}
                    onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                    placeholder="Check #, wire reference, etc."
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setPaymentTarget(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-brand hover:bg-brand-hover" disabled={isRecordingPayment}>
                    {isRecordingPayment && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Record Payment
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* ── New Expense Dialog ── */}
        <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Record Expense</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateExpense} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="exp-date">Date</Label>
                <Input
                  id="exp-date"
                  type="date"
                  value={expenseForm.date}
                  onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="exp-category">Category</Label>
                <Select
                  value={expenseForm.category}
                  onValueChange={(v) => setExpenseForm({ ...expenseForm, category: v })}
                >
                  <SelectTrigger id="exp-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="exp-description">Description *</Label>
                <Input
                  id="exp-description"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  placeholder="What was this expense for?"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="exp-amount">Amount *</Label>
                <Input
                  id="exp-amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="exp-method">Payment Method</Label>
                <Select
                  value={expenseForm.payment_method}
                  onValueChange={(v) => setExpenseForm({ ...expenseForm, payment_method: v })}
                >
                  <SelectTrigger id="exp-method">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map(m => (
                      <SelectItem key={m} value={m} className="capitalize">{m.replace('_', ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsExpenseDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-brand hover:bg-brand-hover" disabled={isCreatingExpense}>
                  {isCreatingExpense && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Record Expense
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
