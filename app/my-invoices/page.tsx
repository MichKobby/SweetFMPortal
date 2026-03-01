'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useStore } from '@/store/useStore';
import { createClient } from '@/lib/supabase/client';
import { FileText, Download, Eye, DollarSign, Calendar, CreditCard, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import { toast } from 'sonner';

interface InvoiceRow {
  id: string;
  client_id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  amount: number;
  amount_paid: number;
  balance: number;
  status: 'draft' | 'sent' | 'pending' | 'paid' | 'overdue' | 'cancelled';
  payment_terms: string | null;
  notes: string | null;
  description: string | null;
}

interface PaymentRow {
  id: string;
  invoice_id: string;
  invoice_number: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  reference: string | null;
  status: 'pending' | 'completed';
}

const PAYMENT_METHODS = ['bank_transfer', 'check', 'cash', 'credit_card', 'other'];

export default function MyInvoicesPage() {
  const { user } = useStore();
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRow | null>(null);
  const [payTarget, setPayTarget] = useState<InvoiceRow | null>(null);
  const [clientInvoices, setClientInvoices] = useState<InvoiceRow[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [payForm, setPayForm] = useState({
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'bank_transfer',
    reference: '',
  });

  const fetchInvoices = async () => {
    if (!user?.email) return;

    const supabase = createClient();

    const { data: client } = await supabase
      .from('clients')
      .select('id')
      .eq('email', user.email)
      .single();

    if (client) {
      const { data: invoices } = await supabase
        .from('invoices')
        .select('id, client_id, invoice_number, issue_date, due_date, amount, amount_paid, balance, status, payment_terms, notes, description')
        .eq('client_id', client.id)
        .order('issue_date', { ascending: false });

      const rows = (invoices || []) as InvoiceRow[];
      setClientInvoices(rows);

      if (rows.length > 0) {
        const { data: paymentHistory } = await supabase
          .from('payment_history')
          .select('id, invoice_id, invoice_number, amount, payment_date, payment_method, reference, status')
          .in('invoice_id', rows.map(i => i.id))
          .order('payment_date', { ascending: false });

        if (paymentHistory) setPayments(paymentHistory as PaymentRow[]);
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchInvoices();
  }, [user?.email]);

  const totalBilled = clientInvoices.reduce((sum, inv) => sum + (parseFloat(String(inv.amount)) || 0), 0);
  const totalPaid = clientInvoices.reduce((sum, inv) => sum + (parseFloat(String(inv.amount_paid)) || 0), 0);
  const totalOutstanding = clientInvoices.reduce((sum, inv) => sum + (parseFloat(String(inv.balance)) || 0), 0);
  const overdueInvoices = clientInvoices.filter(inv => inv.status === 'overdue').length;

  const getStatusBadge = (status: InvoiceRow['status']) => {
    const colors: Record<string, string> = {
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      overdue: 'bg-red-100 text-red-800',
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };
    return colors[status] ?? 'bg-gray-100 text-gray-800';
  };

  const openPayDialog = (invoice: InvoiceRow) => {
    setPayTarget(invoice);
    setPayForm({
      amount: String(parseFloat(String(invoice.balance)) || ''),
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: 'bank_transfer',
      reference: '',
    });
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payTarget) return;

    const amount = parseFloat(payForm.amount);
    if (!amount || amount <= 0) {
      toast.error('Enter a valid amount');
      return;
    }

    setIsSubmittingPayment(true);
    const supabase = createClient();

    const { error } = await supabase.from('payment_history').insert({
      invoice_id: payTarget.id,
      invoice_number: payTarget.invoice_number,
      amount,
      payment_date: payForm.payment_date,
      payment_method: payForm.payment_method,
      reference: payForm.reference || null,
      // Client payments are pending — staff must confirm receipt
      status: 'pending',
    });

    setIsSubmittingPayment(false);

    if (error) {
      toast.error('Failed to submit payment');
      return;
    }

    toast.success('Payment submitted — pending staff confirmation');
    setPayTarget(null);
    setSelectedInvoice(null);
    fetchInvoices();
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Invoices & Billing</h1>
          <p className="text-gray-500 mt-1">
            View and manage your invoices and payment history
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Billed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalBilled)}</div>
              <p className="text-xs text-gray-500 mt-1">all time</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Paid</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</div>
              <p className="text-xs text-gray-500 mt-1">completed payments</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Outstanding</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{formatCurrency(totalOutstanding)}</div>
              <p className="text-xs text-gray-500 mt-1">pending payment</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Overdue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{overdueInvoices}</div>
              <p className="text-xs text-gray-500 mt-1">invoices</p>
            </CardContent>
          </Card>
        </div>

        {/* Invoices Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-brand" />
              All Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-12 text-center text-gray-500">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                Loading invoices…
              </div>
            ) : clientInvoices.length === 0 ? (
              <div className="py-12 text-center text-gray-500">No invoices found</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Issue Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                      <TableCell>{new Date(invoice.issue_date).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(invoice.due_date).toLocaleDateString()}</TableCell>
                      <TableCell className="font-semibold">{formatCurrency(invoice.amount)}</TableCell>
                      <TableCell className="text-green-600">{formatCurrency(invoice.amount_paid)}</TableCell>
                      <TableCell className="font-semibold text-orange-600">
                        {formatCurrency(invoice.balance)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(invoice.status)}>
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedInvoice(invoice)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {parseFloat(String(invoice.balance)) > 0 && invoice.status !== 'cancelled' && (
                            <Button
                              size="sm"
                              className="bg-brand hover:bg-brand-hover"
                              onClick={() => openPayDialog(invoice)}
                            >
                              Pay Now
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Payment History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-brand" />
              Payment History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No payment history yet</p>
            ) : (
              <div className="space-y-3">
                {payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="bg-green-100 p-3 rounded-full">
                        <DollarSign className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <div className="font-semibold">{payment.invoice_number}</div>
                        <div className="text-sm text-gray-600">
                          {payment.payment_method.replace('_', ' ').toUpperCase()}
                          {payment.reference ? ` • ${payment.reference}` : ''}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(payment.payment_date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">
                        {formatCurrency(payment.amount)}
                      </div>
                      <Badge className={payment.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                        {payment.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invoice Detail Dialog */}
        <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Invoice {selectedInvoice?.invoice_number}</DialogTitle>
            </DialogHeader>
            {selectedInvoice && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Issue Date</p>
                    <p className="font-semibold">{new Date(selectedInvoice.issue_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Due Date</p>
                    <p className="font-semibold">{new Date(selectedInvoice.due_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Payment Terms</p>
                    <p className="font-semibold">{selectedInvoice.payment_terms || 'Net 30'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <Badge className={getStatusBadge(selectedInvoice.status)}>
                      {selectedInvoice.status}
                    </Badge>
                  </div>
                </div>

                {selectedInvoice.description && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Description</p>
                    <p className="text-gray-700">{selectedInvoice.description}</p>
                  </div>
                )}

                <div className="border-t pt-4">
                  <div className="flex justify-end">
                    <div className="w-64 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total:</span>
                        <span className="font-semibold">{formatCurrency(selectedInvoice.amount)}</span>
                      </div>
                      <div className="flex justify-between text-green-600">
                        <span>Paid:</span>
                        <span className="font-semibold">{formatCurrency(selectedInvoice.amount_paid)}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold border-t pt-2">
                        <span>Balance Due:</span>
                        <span className="text-orange-600">{formatCurrency(selectedInvoice.balance)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedInvoice.notes && (
                  <div className="bg-gray-50 p-4 rounded">
                    <p className="text-sm text-gray-600"><strong>Notes:</strong> {selectedInvoice.notes}</p>
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  {parseFloat(String(selectedInvoice.balance)) > 0 && selectedInvoice.status !== 'cancelled' && (
                    <Button
                      className="bg-brand hover:bg-brand-hover"
                      onClick={() => { setSelectedInvoice(null); openPayDialog(selectedInvoice); }}
                    >
                      Pay {formatCurrency(selectedInvoice.balance)}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Pay Now Dialog */}
        <Dialog open={!!payTarget} onOpenChange={() => setPayTarget(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Submit Payment</DialogTitle>
            </DialogHeader>
            {payTarget && (
              <form onSubmit={handleSubmitPayment} className="space-y-4">
                <div className="bg-blue-50 rounded-lg p-3 text-sm">
                  <p><span className="text-gray-500">Invoice:</span> <strong>{payTarget.invoice_number}</strong></p>
                  <p><span className="text-gray-500">Balance due:</span> <strong>{formatCurrency(payTarget.balance)}</strong></p>
                  <p className="text-xs text-gray-500 mt-1">Your payment will be confirmed by our team within 1–2 business days.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pay-amount">Amount *</Label>
                  <Input
                    id="pay-amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    max={parseFloat(String(payTarget.balance))}
                    value={payForm.amount}
                    onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pay-date">Payment Date</Label>
                  <Input
                    id="pay-date"
                    type="date"
                    value={payForm.payment_date}
                    onChange={(e) => setPayForm({ ...payForm, payment_date: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pay-method">Payment Method</Label>
                  <Select
                    value={payForm.payment_method}
                    onValueChange={(v) => setPayForm({ ...payForm, payment_method: v })}
                  >
                    <SelectTrigger id="pay-method">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map(m => (
                        <SelectItem key={m} value={m} className="capitalize">
                          {m.replace('_', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pay-ref">Reference (Optional)</Label>
                  <Input
                    id="pay-ref"
                    value={payForm.reference}
                    onChange={(e) => setPayForm({ ...payForm, reference: e.target.value })}
                    placeholder="Check #, wire reference, etc."
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setPayTarget(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-brand hover:bg-brand-hover" disabled={isSubmittingPayment}>
                    {isSubmittingPayment && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Submit Payment
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
