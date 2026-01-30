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
import { DollarSign, TrendingUp, Wallet, CreditCard, Download, Calendar, Database } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import { toast } from 'sonner';

export default function FinancePage() {
  const [selectedPeriod] = useState('current-month');
  const [loading, setLoading] = useState(true);
  const [financialData, setFinancialData] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    totalAR: 0,
    invoices: [] as any[],
    expenses: [] as any[],
  });

  useEffect(() => {
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

      setFinancialData({
        totalRevenue,
        totalExpenses,
        totalAR,
        invoices,
        expenses,
      });
      setLoading(false);
    };

    fetchFinancialData();
  }, []);

  const { totalRevenue, totalExpenses, totalAR, invoices, expenses } = financialData;
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
            <Button 
              className="bg-[#c81f25] hover:bg-[#a01820]"
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
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Database className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600">No Revenue Data</h3>
                <p className="text-gray-500 text-center mt-2">Connect to Supabase to view revenue recognition data</p>
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
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Database className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600">No Expense Data</h3>
                <p className="text-gray-500 text-center mt-2">Connect to Supabase to view expense breakdowns</p>
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
