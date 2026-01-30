'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { createClient } from '@/lib/supabase/client';
import MainLayout from '@/components/layout/MainLayout';
import { KPICard } from '@/components/ui/kpi-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  UserCircle,
  FileText,
  Plus,
  Bell,
} from 'lucide-react';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { formatCurrency } from '@/utils/formatters';
import { RevenueData, ExpenseBreakdown } from '@/types';

const COLORS = ['#c81f25', '#facc15', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b'];

interface DashboardData {
  clients: any[];
  employees: any[];
  invoices: any[];
  expenses: any[];
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useStore();
  const [data, setData] = useState<DashboardData>({
    clients: [],
    employees: [],
    invoices: [],
    expenses: [],
  });
  const [loading, setLoading] = useState(true);

  // Fetch dashboard data from Supabase
  useEffect(() => {
    const fetchDashboardData = async () => {
      const supabase = createClient();
      
      const [clientsRes, employeesRes, invoicesRes, expensesRes] = await Promise.all([
        supabase.from('clients').select('*'),
        supabase.from('employees').select('*'),
        supabase.from('invoices').select('*'),
        supabase.from('expenses').select('*'),
      ]);

      setData({
        clients: clientsRes.data || [],
        employees: employeesRes.data || [],
        invoices: invoicesRes.data || [],
        expenses: expensesRes.data || [],
      });
      setLoading(false);
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const { clients, employees, invoices, expenses } = data;

  // Check if user is admin or manager
  const canManageClientsAndEmployees = user?.role === 'admin' || user?.role === 'manager';

  // Auth is now handled by AuthProvider - show loading skeleton
  if (!user || loading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="h-10 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse" />
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="h-80 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-80 bg-gray-200 rounded-lg animate-pulse" />
          </div>
        </div>
      </MainLayout>
    );
  }

  // Role-based dashboard rendering
  if (user.role === 'employee') {
    return <EmployeeDashboard user={user} />;
  }

  if (user.role === 'client') {
    return <ClientDashboard user={user} />;
  }

  // Calculate KPIs from Supabase data
  const totalRevenue = clients.reduce((sum, client) => sum + (parseFloat(client.total_billed) || 0), 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0);
  const totalPayroll = employees.reduce((sum, employee) => sum + (parseFloat(employee.salary) || 0), 0);
  const netProfit = totalRevenue - totalExpenses - totalPayroll;

  // Placeholder changes until real data is connected
  const revenueChange = 0;
  const expenseChange = 0;
  const profitChange = 0;

  const overdueClients = clients.filter((c: any) => c.status === 'overdue').length;
  const pendingExpenses = expenses.filter((e: any) => e.status === 'pending').length;
  
  // Empty data for charts until connected to database
  const revenueData: RevenueData[] = [];
  const expenseBreakdown: ExpenseBreakdown[] = [];

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 mt-1 text-sm md:text-base">
              Welcome back, {user.name}!
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => router.push('/clients/new')}
              className="bg-[#c81f25] hover:bg-[#a01820] text-xs md:text-sm"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Add</span> Client
            </Button>
            <Button
              onClick={() => router.push('/employees/new')}
              variant="outline"
              size="sm"
              className="text-xs md:text-sm"
            >
              <Plus className="h-4 w-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Add</span> Employee
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Total Revenue"
            value={formatCurrency(totalRevenue)}
            change={parseFloat(revenueChange.toFixed(1))}
            trend={revenueChange >= 0 ? 'up' : 'down'}
            icon={<DollarSign className="h-4 w-4" />}
          />
          <KPICard
            title="Total Expenses"
            value={formatCurrency(totalExpenses + totalPayroll)}
            change={parseFloat(expenseChange.toFixed(1))}
            trend={expenseChange <= 0 ? 'up' : 'down'}
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <KPICard
            title="Monthly Payroll"
            value={formatCurrency(totalPayroll)}
            change={0}
            trend="neutral"
            icon={<UserCircle className="h-4 w-4" />}
          />
          <KPICard
            title="Net Profit"
            value={formatCurrency(netProfit)}
            change={parseFloat(Math.abs(profitChange).toFixed(1))}
            trend={profitChange >= 0 ? 'up' : 'down'}
            icon={<DollarSign className="h-4 w-4" />}
            className="border-[#c81f25]"
          />
        </div>

        {/* Charts Row */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Revenue vs Expenses Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue vs Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#c81f25"
                    strokeWidth={2}
                    name="Revenue"
                  />
                  <Line
                    type="monotone"
                    dataKey="expenses"
                    stroke="#facc15"
                    strokeWidth={2}
                    name="Expenses"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Expense Breakdown Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Expense Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={expenseBreakdown as any}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ category, percentage }: any) => `${category} ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="amount"
                  >
                    {expenseBreakdown.map((entry: ExpenseBreakdown, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Notifications */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {canManageClientsAndEmployees && (
                <>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => router.push('/clients/new')}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Add New Client
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => router.push('/employees/new')}
                  >
                    <UserCircle className="h-4 w-4 mr-2" />
                    Add New Employee
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push('/finance')}
              >
                <FileText className="h-4 w-4 mr-2" />
                Upload Expense
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push('/reports')}
              >
                <FileText className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
            </CardContent>
          </Card>

          {/* Notifications/Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Alerts & Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {overdueClients > 0 && (
                <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                  <Badge variant="destructive">{overdueClients}</Badge>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-900">
                      Overdue Invoices
                    </p>
                    <p className="text-xs text-red-700">
                      {overdueClients} client{overdueClients > 1 ? 's have' : ' has'} overdue payments
                    </p>
                  </div>
                </div>
              )}
              {pendingExpenses > 0 && (
                <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                  <Badge className="bg-yellow-500">{pendingExpenses}</Badge>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-yellow-900">
                      Pending Approvals
                    </p>
                    <p className="text-xs text-yellow-700">
                      {pendingExpenses} expense{pendingExpenses > 1 ? 's' : ''} awaiting approval
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <Badge className="bg-green-500">✓</Badge>
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-900">
                    All Systems Operational
                  </p>
                  <p className="text-xs text-green-700">
                    Broadcasting schedule is up to date
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">
                Active Clients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {clients.filter((c: any) => c.status === 'active').length}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Total: {clients.length} clients
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">
                Active Employees
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {employees.filter((e: any) => e.status === 'active').length}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Across {new Set(employees.map((e: any) => e.department)).size} departments
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">
                AR Aging
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(clients.reduce((sum, c: any) => sum + (parseFloat(c.balance) || 0), 0))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Outstanding receivables
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}

// Employee Dashboard Component
function EmployeeDashboard({ user }: { user: any }) {
  const router = useRouter();
  const { shows, shifts, announcements, leaveRequests, timeOff } = useStore();

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  // Get today's shifts for this employee
  const todayShifts = shifts.filter(s => 
    s.employeeId === user.id && s.date === todayStr
  );

  // Get upcoming shifts (next 7 days)
  const upcomingShifts = shifts.filter(s => {
    if (s.employeeId !== user.id) return false;
    const shiftDate = new Date(s.date);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    return shiftDate > today && shiftDate <= nextWeek;
  }).slice(0, 3);

  // Get unread announcements
  const unreadAnnouncements = announcements.filter(a => !a.read).length;

  // Get pending leave requests
  const pendingLeaves = leaveRequests.filter(r => 
    r.employeeId === user.id && r.status === 'pending'
  ).length;

  // Get time off balance
  const userTimeOff = timeOff.find(t => t.employeeId === user.id);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Employee Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Welcome back, {user.name}! Here's your overview for today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Today's Shifts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayShifts.length}</div>
              <p className="text-xs text-gray-500 mt-1">scheduled</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Upcoming Shifts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{upcomingShifts.length}</div>
              <p className="text-xs text-gray-500 mt-1">next 7 days</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Announcements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{unreadAnnouncements}</div>
              <p className="text-xs text-gray-500 mt-1">unread</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Leave Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingLeaves}</div>
              <p className="text-xs text-gray-500 mt-1">pending</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Overview Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Today's Schedule Summary */}
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/my-schedule')}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Today's Schedule
                <Badge variant="outline">{todayShifts.length} shifts</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {todayShifts.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No shifts scheduled for today</p>
              ) : (
                <div className="space-y-2">
                  {todayShifts.slice(0, 2).map((shift) => (
                    <div key={shift.id} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                      <div>
                        <div className="font-medium text-sm">{shift.showName || shift.role}</div>
                        <div className="text-xs text-gray-600">{shift.startTime} - {shift.endTime}</div>
                      </div>
                    </div>
                  ))}
                  {todayShifts.length > 2 && (
                    <p className="text-xs text-gray-500 text-center pt-2">
                      +{todayShifts.length - 2} more shifts
                    </p>
                  )}
                </div>
              )}
              <Button variant="link" className="w-full mt-3 p-0">
                View Full Schedule →
              </Button>
            </CardContent>
          </Card>

          {/* Time Off Balance Summary */}
          {userTimeOff && (
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/leave')}>
              <CardHeader>
                <CardTitle>Time Off Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Vacation Days</span>
                    <span className="font-semibold">
                      {userTimeOff.vacationDays - userTimeOff.vacationUsed} remaining
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Sick Days</span>
                    <span className="font-semibold">
                      {userTimeOff.sickDays - userTimeOff.sickUsed} remaining
                    </span>
                  </div>
                </div>
                <Button variant="link" className="w-full mt-3 p-0">
                  Request Leave →
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              <Button 
                className="bg-[#c81f25] hover:bg-[#a01820]"
                onClick={() => router.push('/my-schedule')}
              >
                My Schedule
              </Button>
              <Button 
                variant="outline"
                onClick={() => router.push('/leave')}
              >
                Request Leave
              </Button>
              <Button 
                variant="outline"
                onClick={() => router.push('/announcements')}
              >
                Announcements {unreadAnnouncements > 0 && `(${unreadAnnouncements})`}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

// Client Dashboard Component
function ClientDashboard({ user }: { user: any }) {
  const router = useRouter();
  const { clients, adSlots } = useStore();

  // Find client data (in real app, would match by user ID)
  const clientData = clients[0]; // Mock: using first client
  const clientAds = adSlots.filter(ad => ad.clientId === clientData?.id || ad.clientId === '1');
  const activeAds = clientAds.filter(ad => ad.status === 'active');
  const scheduledAds = clientAds.filter(ad => ad.status === 'scheduled');
  const totalSpent = clientAds.reduce((sum, ad) => sum + ad.cost, 0);
  
  // Mock data for invoices
  const pendingInvoices = 2;
  const overdueAmount = 12000;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Client Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Welcome back, {user.name}! Here's your account overview.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Account Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{formatCurrency(clientData?.balance || 0)}</div>
              <p className="text-xs text-gray-500 mt-1">outstanding</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Active Campaigns</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeAds.length}</div>
              <p className="text-xs text-gray-500 mt-1">currently running</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Ad Spend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalSpent)}</div>
              <p className="text-xs text-gray-500 mt-1">all time</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Pending Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingInvoices}</div>
              <p className="text-xs text-gray-500 mt-1">awaiting payment</p>
            </CardContent>
          </Card>
        </div>

        {/* Alert for Overdue */}
        {overdueAmount > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-red-900">Payment Overdue</p>
                  <p className="text-sm text-red-700">
                    You have {formatCurrency(overdueAmount)} in overdue invoices. Please make payment to avoid service interruption.
                  </p>
                </div>
                <Button 
                  className="bg-red-600 hover:bg-red-700"
                  onClick={() => router.push('/my-invoices')}
                >
                  Pay Now
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Overview Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Active Campaigns Summary */}
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/my-campaigns')}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Active Campaigns
                <Badge variant="outline">{activeAds.length} running</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeAds.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No active campaigns</p>
              ) : (
                <div className="space-y-2">
                  {activeAds.slice(0, 2).map((ad) => (
                    <div key={ad.id} className="flex items-center justify-between p-2 bg-green-50 rounded">
                      <div>
                        <div className="font-medium text-sm">{ad.adTitle}</div>
                        <div className="text-xs text-gray-600">{ad.adType} • {ad.frequency}x/day</div>
                      </div>
                      <div className="text-sm font-semibold">{formatCurrency(ad.cost)}</div>
                    </div>
                  ))}
                  {activeAds.length > 2 && (
                    <p className="text-xs text-gray-500 text-center pt-2">
                      +{activeAds.length - 2} more campaigns
                    </p>
                  )}
                </div>
              )}
              <Button variant="link" className="w-full mt-3 p-0">
                View All Campaigns →
              </Button>
            </CardContent>
          </Card>

          {/* Account Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Account Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Account Status:</span>
                <Badge className={
                  clientData?.status === 'active' ? 'bg-green-100 text-green-800' :
                  clientData?.status === 'overdue' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }>
                  {clientData?.status || 'N/A'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Terms:</span>
                <span className="font-medium">{clientData?.paymentTerms || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Spend:</span>
                <span className="font-medium">{formatCurrency(totalSpent)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Scheduled Ads:</span>
                <span className="font-medium">{scheduledAds.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-4">
              <Button 
                className="bg-[#c81f25] hover:bg-[#a01820]"
                onClick={() => router.push('/my-campaigns')}
              >
                My Campaigns
              </Button>
              <Button 
                variant="outline"
                onClick={() => router.push('/my-invoices')}
              >
                Invoices {pendingInvoices > 0 && `(${pendingInvoices})`}
              </Button>
              <Button 
                variant="outline"
                onClick={() => router.push('/support')}
              >
                Support
              </Button>
              <Button 
                variant="outline"
                onClick={() => router.push('/schedule')}
              >
                Broadcast Schedule
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
