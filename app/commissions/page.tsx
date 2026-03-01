'use client';

import { useState, useEffect, useCallback } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStore } from '@/store/useStore';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Plus, Loader2, DollarSign, Clock, CheckCircle, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';

interface CommissionRow {
  id: string;
  employee_id: string;
  employee_name: string;
  invoice_id: string | null;
  invoice_number: string;
  client_id: string | null;
  client_name: string | null;
  rate: number;
  base_amount: number;
  commission_amount: number;
  status: 'pending' | 'approved' | 'paid';
  notes: string | null;
  created_at: string;
  approved_at: string | null;
  paid_at: string | null;
}

interface EmployeeOption { id: string; name: string; }
interface InvoiceOption { id: string; invoice_number: string; amount: number; client_name: string | null; client_id: string | null; }

const DEFAULT_RATE = 10;

export default function CommissionsPage() {
  const { user, currentOutlet } = useStore();

  const [commissions, setCommissions] = useState<CommissionRow[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [invoices, setInvoices] = useState<InvoiceOption[]>([]);
  const [loading, setLoading] = useState(true);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    employee_id: '',
    invoice_id: '',       // may be empty if entered manually
    invoice_number: '',
    base_amount: '',
    rate: String(DEFAULT_RATE),
    notes: '',
  });

  // Auto-calculated commission amount
  const commissionAmount = (parseFloat(form.base_amount) || 0) * (parseFloat(form.rate) || 0) / 100;

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    setLoading(true);
    const outletId = currentOutlet?.id;

    let commissionsQuery = supabase
      .from('commissions')
      .select(`
        id, employee_id, invoice_id, invoice_number,
        client_id, rate, base_amount, commission_amount,
        status, notes, created_at, approved_at, paid_at,
        employees ( name ),
        clients ( name )
      `)
      .order('created_at', { ascending: false });
    let employeesQuery = supabase.from('employees').select('id, name').eq('status', 'active').order('name');
    let invoicesQuery = supabase
      .from('invoices')
      .select('id, invoice_number, amount, client_id, clients(name)')
      .order('issue_date', { ascending: false });

    if (outletId) {
      commissionsQuery = commissionsQuery.eq('outlet_id', outletId);
      employeesQuery = employeesQuery.eq('outlet_id', outletId);
      invoicesQuery = invoicesQuery.eq('outlet_id', outletId);
    }

    const [commissionsRes, employeesRes, invoicesRes] = await Promise.all([
      commissionsQuery,
      employeesQuery,
      invoicesQuery,
    ]);

    if (commissionsRes.data) {
      const rows = commissionsRes.data.map((r: any) => ({
        ...r,
        employee_name: r.employees?.name ?? 'Unknown',
        client_name: r.clients?.name ?? null,
      }));
      setCommissions(rows as CommissionRow[]);
    }

    if (employeesRes.data) setEmployees(employeesRes.data as EmployeeOption[]);

    if (invoicesRes.data) {
      setInvoices(
        invoicesRes.data.map((inv: any) => ({
          id: inv.id,
          invoice_number: inv.invoice_number,
          amount: parseFloat(inv.amount) || 0,
          client_name: inv.clients?.name ?? null,
          client_id: inv.client_id,
        }))
      );
    }

    setLoading(false);
  }, [currentOutlet?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // When an invoice is selected, auto-fill invoice number, base amount, client
  const handleInvoiceSelect = (invoiceId: string) => {
    if (invoiceId === '__manual__') {
      setForm(f => ({ ...f, invoice_id: '', invoice_number: '', base_amount: '' }));
      return;
    }
    const inv = invoices.find(i => i.id === invoiceId);
    if (!inv) return;
    setForm(f => ({
      ...f,
      invoice_id: inv.id,
      invoice_number: inv.invoice_number,
      base_amount: String(inv.amount),
    }));
  };

  const openDialog = () => {
    setForm({ employee_id: '', invoice_id: '', invoice_number: '', base_amount: '', rate: String(DEFAULT_RATE), notes: '' });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.employee_id) { toast.error('Select an employee'); return; }
    if (!form.invoice_number.trim()) { toast.error('Enter an invoice number'); return; }
    const baseAmount = parseFloat(form.base_amount);
    if (!baseAmount || baseAmount <= 0) { toast.error('Enter a valid base amount'); return; }
    const rate = parseFloat(form.rate);
    if (!rate || rate <= 0 || rate > 100) { toast.error('Rate must be between 0 and 100'); return; }

    setIsSubmitting(true);
    const supabase = createClient();

    const selectedInvoice = invoices.find(i => i.id === form.invoice_id);

    const { error } = await supabase.from('commissions').insert({
      employee_id: form.employee_id,
      invoice_id: form.invoice_id || null,
      invoice_number: form.invoice_number.trim(),
      client_id: selectedInvoice?.client_id ?? null,
      rate,
      base_amount: baseAmount,
      commission_amount: commissionAmount,
      status: 'pending',
      notes: form.notes.trim() || null,
      created_by: user?.id ?? null,
      ...(currentOutlet?.id ? { outlet_id: currentOutlet.id } : {}),
    });

    setIsSubmitting(false);

    if (error) { toast.error('Failed to create commission record'); return; }

    toast.success('Commission recorded successfully');
    setIsDialogOpen(false);
    fetchData();
  };

  const updateStatus = async (id: string, newStatus: 'approved' | 'paid') => {
    const supabase = createClient();
    const update: Record<string, string> = { status: newStatus };
    if (newStatus === 'approved') update.approved_at = new Date().toISOString();
    if (newStatus === 'paid') update.paid_at = new Date().toISOString();

    const { error } = await supabase.from('commissions').update(update).eq('id', id);
    if (error) { toast.error('Failed to update commission'); return; }

    toast.success(newStatus === 'approved' ? 'Commission approved' : 'Commission marked as paid');
    setCommissions(prev =>
      prev.map(c => c.id === id ? { ...c, status: newStatus, ...update } : c)
    );
  };

  // Summary stats
  const totalPending = commissions.filter(c => c.status === 'pending').reduce((s, c) => s + c.commission_amount, 0);
  const totalApproved = commissions.filter(c => c.status === 'approved').reduce((s, c) => s + c.commission_amount, 0);
  const totalPaid = commissions.filter(c => c.status === 'paid').reduce((s, c) => s + c.commission_amount, 0);
  const totalAll = commissions.reduce((s, c) => s + c.commission_amount, 0);

  const getStatusBadge = (status: CommissionRow['status']) => {
    const map = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
    };
    return map[status];
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Commissions</h1>
            <p className="text-gray-500 mt-1">Track ad sales commissions for your team</p>
          </div>
          <Button className="bg-brand hover:bg-brand-hover" onClick={openDialog}>
            <Plus className="h-4 w-4 mr-2" />
            New Commission
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> Total Commissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalAll)}</div>
              <p className="text-xs text-gray-500 mt-1">{commissions.length} records</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <Clock className="h-4 w-4" /> Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{formatCurrency(totalPending)}</div>
              <p className="text-xs text-gray-500 mt-1">{commissions.filter(c => c.status === 'pending').length} records</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" /> Approved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalApproved)}</div>
              <p className="text-xs text-gray-500 mt-1">{commissions.filter(c => c.status === 'approved').length} records</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <DollarSign className="h-4 w-4" /> Paid Out
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</div>
              <p className="text-xs text-gray-500 mt-1">{commissions.filter(c => c.status === 'paid').length} records</p>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Commission Records</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-12 text-center text-gray-500">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                Loading…
              </div>
            ) : commissions.length === 0 ? (
              <div className="py-12 text-center text-gray-500">
                No commission records yet. Click <strong>New Commission</strong> to get started.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead className="text-right">Base Amount</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                      <TableHead className="text-right">Commission</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {commissions.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.employee_name}</TableCell>
                        <TableCell>{c.invoice_number}</TableCell>
                        <TableCell>{c.client_name ?? '—'}</TableCell>
                        <TableCell className="text-right">{formatCurrency(c.base_amount)}</TableCell>
                        <TableCell className="text-right">{c.rate}%</TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(c.commission_amount)}</TableCell>
                        <TableCell>
                          <Badge className={getStatusBadge(c.status)}>
                            {c.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {new Date(c.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {c.status === 'pending' && (
                              <Button size="sm" variant="outline" onClick={() => updateStatus(c.id, 'approved')}>
                                Approve
                              </Button>
                            )}
                            {c.status === 'approved' && (
                              <Button size="sm" className="bg-brand hover:bg-brand-hover" onClick={() => updateStatus(c.id, 'paid')}>
                                Mark Paid
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* New Commission Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Record Commission</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Employee */}
              <div className="space-y-2">
                <Label htmlFor="emp">Employee *</Label>
                <Select
                  value={form.employee_id}
                  onValueChange={(v) => setForm(f => ({ ...f, employee_id: v }))}
                >
                  <SelectTrigger id="emp">
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map(e => (
                      <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Invoice selector (optional — can enter manually) */}
              <div className="space-y-2">
                <Label htmlFor="inv-sel">Invoice (optional — auto-fills fields)</Label>
                <Select
                  value={form.invoice_id || '__manual__'}
                  onValueChange={handleInvoiceSelect}
                >
                  <SelectTrigger id="inv-sel">
                    <SelectValue placeholder="Select invoice or enter manually" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__manual__">— Enter manually —</SelectItem>
                    {invoices.map(inv => (
                      <SelectItem key={inv.id} value={inv.id}>
                        {inv.invoice_number}{inv.client_name ? ` · ${inv.client_name}` : ''} · {formatCurrency(inv.amount)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Invoice number */}
              <div className="space-y-2">
                <Label htmlFor="inv-num">Invoice Number *</Label>
                <Input
                  id="inv-num"
                  value={form.invoice_number}
                  onChange={(e) => setForm(f => ({ ...f, invoice_number: e.target.value }))}
                  placeholder="e.g. INV-202502-001"
                  required
                />
              </div>

              {/* Base amount + rate side-by-side */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="base">Invoice Amount *</Label>
                  <Input
                    id="base"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    value={form.base_amount}
                    onChange={(e) => setForm(f => ({ ...f, base_amount: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rate">Commission Rate (%) *</Label>
                  <Input
                    id="rate"
                    type="number"
                    min="0.01"
                    max="100"
                    step="0.01"
                    value={form.rate}
                    onChange={(e) => setForm(f => ({ ...f, rate: e.target.value }))}
                    required
                  />
                </div>
              </div>

              {/* Auto-calculated amount */}
              <div className="bg-gray-50 rounded-lg p-3 flex justify-between items-center">
                <span className="text-sm text-gray-600">Commission amount</span>
                <span className="text-lg font-bold text-green-700">{formatCurrency(commissionAmount)}</span>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Input
                  id="notes"
                  value={form.notes}
                  onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Any additional context"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-brand hover:bg-brand-hover" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save Commission
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
