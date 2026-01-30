export type UserRole = 'admin' | 'manager' | 'employee' | 'client';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  department?: string;
}

export interface Client {
  id: string; // UUID for internal use
  clientId: string; // Human-readable ID (e.g., C24001)
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  totalBilled: number;
  amountPaid: number;
  balance: number;
  status: 'active' | 'overdue' | 'inactive';
  paymentTerms: string;
  createdAt: string;
  // Contract Details
  contactPerson?: string;
  contactPersonPhone?: string;
  contactPersonEmail?: string;
  contractStartDate?: string;
  contractEndDate?: string;
  contractAmount?: number;
  serviceDescription?: string;
  billingFrequency?: 'monthly' | 'quarterly' | 'annually' | 'one-time';
  notes?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  amount: number;
  amountPaid: number;
  balance: number;
  status: 'paid' | 'pending' | 'overdue' | 'draft' | 'sent' | 'cancelled';
  issueDate: string;
  dueDate: string;
  description: string;
  items?: InvoiceItem[];
  notes?: string;
  paymentTerms?: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  adSlotId?: string;
}

export interface Campaign {
  id: string;
  clientId: string;
  name: string;
  startDate: string;
  endDate: string;
  budget: number;
  status: 'active' | 'completed' | 'scheduled';
  adSlots: number;
}

export interface Employee {
  id: string; // UUID for internal use
  employeeId: string; // Human-readable ID (e.g., S23006)
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  hireDate: string;
  salary: number;
  deductions: number;
  netPay: number;
  avatar?: string;
  status: 'active' | 'inactive';
  // Additional Details
  address?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  dateOfBirth?: string;
  employmentType?: 'full-time' | 'part-time' | 'contract' | 'intern';
  bankAccount?: string;
  bankName?: string;
  taxId?: string;
  socialSecurityNumber?: string;
  contractEndDate?: string;
  notes?: string;
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  grossPay: number;
  deductions: number;
  netPay: number;
  payDate: string;
  status: 'paid' | 'pending';
}

export interface Expense {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  paymentMethod: string;
  receipt?: string;
  status: 'approved' | 'pending' | 'rejected';
}

export interface Show {
  id: string;
  name: string;
  presenter: string;
  description?: string;
  category: 'music' | 'talk' | 'news' | 'sports' | 'entertainment' | 'religious' | 'educational' | 'other';
  recurrence: 'daily' | 'weekly' | 'custom';
  daysOfWeek: number[]; // 0-6 (Sunday-Saturday), multiple days for weekly shows
  startTime: string; // HH:mm format
  endTime: string;
  startDate: string; // When the show schedule starts
  endDate?: string; // Optional end date for limited runs
  color: string;
  status: 'active' | 'inactive' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface AdSlot {
  id: string;
  clientId: string;
  clientName: string;
  adTitle: string;
  adType: 'spot' | 'sponsorship' | 'promo' | 'psa'; // Public Service Announcement
  recurrence: 'once' | 'daily' | 'weekly' | 'custom';
  daysOfWeek: number[]; // Multiple days for recurring ads
  time: string; // HH:mm format
  duration: number; // in seconds
  startDate: string; // Campaign start date
  endDate: string; // Campaign end date
  showId?: string; // Optional: tie ad to specific show
  showName?: string;
  frequency: number; // How many times per day
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  cost: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  date: string;
  read: boolean;
}

// Employee Management Types
export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: 'vacation' | 'sick' | 'personal' | 'unpaid' | 'emergency';
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  requestedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  category: 'general' | 'urgent' | 'event' | 'policy' | 'schedule';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  publishedBy: string;
  publishedAt: string;
  expiresAt?: string;
  targetRoles?: string[]; // If empty, visible to all
  attachments?: string[];
  read?: boolean;
}

export interface Shift {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  startTime: string;
  endTime: string;
  role: string; // DJ, Producer, Engineer, etc.
  showId?: string;
  showName?: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
}

export interface TimeOff {
  employeeId: string;
  year: number;
  vacationDays: number;
  vacationUsed: number;
  sickDays: number;
  sickUsed: number;
  personalDays: number;
  personalUsed: number;
}

// Financial Types
export interface RevenueRecognition {
  id: string;
  clientId: string;
  clientName: string;
  contractAmount: number;
  recognizedRevenue: number;
  unrealizedRevenue: number;
  month: string;
  year: number;
  status: 'realized' | 'expected' | 'partial';
}

export interface CashFlow {
  id: string;
  month: string;
  year: number;
  cashInflow: number;
  cashOutflow: number;
  netCashFlow: number;
  openingBalance: number;
  closingBalance: number;
}

export interface AccountsReceivable {
  id: string;
  clientId: string;
  clientName: string;
  invoiceId: string;
  amount: number;
  dueDate: string;
  daysOverdue: number;
  agingCategory: '0-30' | '31-60' | '61-90' | '90+';
}

export interface ProfitLoss {
  month: string;
  year: number;
  totalRevenue: number;
  costOfRevenue: number;
  grossProfit: number;
  operatingExpenses: number;
  ebitda: number;
  netIncome: number;
  profitMargin: number;
}

export interface DashboardKPI {
  label: string;
  value: number;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
}

export interface RevenueData {
  month: string;
  revenue: number;
  expenses: number;
}

export interface ExpenseBreakdown {
  category: string;
  amount: number;
  percentage: number;
}

// Client Portal Types
export interface CampaignAnalytics {
  id: string;
  campaignId: string;
  campaignName: string;
  startDate: string;
  endDate: string;
  totalSpots: number;
  spotsAired: number;
  totalReach: number;
  estimatedImpressions: number;
  peakListeningTimes: string[];
  performanceScore: number;
  demographics: {
    ageGroup: string;
    percentage: number;
  }[];
}

export interface SupportTicket {
  id: string;
  clientId: string;
  clientName: string;
  subject: string;
  description: string;
  category: 'billing' | 'technical' | 'campaign' | 'general';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  responses: TicketResponse[];
}

export interface TicketResponse {
  id: string;
  ticketId: string;
  author: string;
  authorRole: 'client' | 'staff';
  message: string;
  createdAt: string;
  attachments?: string[];
}

export interface PaymentHistory {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  paymentDate: string;
  paymentMethod: 'bank_transfer' | 'credit_card' | 'cash' | 'check';
  reference: string;
  status: 'completed' | 'pending' | 'failed';
}
