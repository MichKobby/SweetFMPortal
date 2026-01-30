import { create } from 'zustand';
import { User, Client, Employee, Expense, Notification, Show, AdSlot, LeaveRequest, Announcement, Shift, TimeOff } from '@/types';
import { createClient } from '@/lib/supabase/client';

interface AppState {
  // Auth
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
  initializeAuth: () => Promise<void>;
  logout: () => Promise<void>;
  
  // Users (for admin management)
  users: User[];
  updateUserRole: (id: string, role: User['role']) => void;
  resetUserPassword: (id: string, newPassword: string) => void;
  addUser: (user: User) => void;
  deleteUser: (id: string) => void;
  
  // Clients
  clients: Client[];
  addClient: (client: Client) => void;
  updateClient: (id: string, client: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  
  // Employees
  employees: Employee[];
  addEmployee: (employee: Employee) => void;
  updateEmployee: (id: string, employee: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
  
  // Expenses
  expenses: Expense[];
  addExpense: (expense: Expense) => void;
  updateExpense: (id: string, expense: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  
  // Notifications
  notifications: Notification[];
  markNotificationAsRead: (id: string) => void;
  clearNotifications: () => void;
  
  // Schedule
  shows: Show[];
  addShow: (show: Show) => void;
  updateShow: (id: string, show: Partial<Show>) => void;
  deleteShow: (id: string) => void;
  
  adSlots: AdSlot[];
  addAdSlot: (adSlot: AdSlot) => void;
  updateAdSlot: (id: string, adSlot: Partial<AdSlot>) => void;
  deleteAdSlot: (id: string) => void;
  
  // Employee Management
  leaveRequests: LeaveRequest[];
  addLeaveRequest: (request: LeaveRequest) => void;
  updateLeaveRequest: (id: string, request: Partial<LeaveRequest>) => void;
  deleteLeaveRequest: (id: string) => void;
  
  announcements: Announcement[];
  addAnnouncement: (announcement: Announcement) => void;
  updateAnnouncement: (id: string, announcement: Partial<Announcement>) => void;
  deleteAnnouncement: (id: string) => void;
  markAnnouncementAsRead: (id: string) => void;
  
  shifts: Shift[];
  addShift: (shift: Shift) => void;
  updateShift: (id: string, shift: Partial<Shift>) => void;
  deleteShift: (id: string) => void;
  
  timeOff: TimeOff[];
  updateTimeOff: (employeeId: string, timeOff: Partial<TimeOff>) => void;
  
  // UI State
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const useStore = create<AppState>((set) => ({
  // Auth
  user: null,
  isAuthenticated: false,
  isLoading: true,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  initializeAuth: async () => {
    const supabase = createClient();
    
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (authUser) {
        // Fetch profile data
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();
        
        if (profile) {
          const user: User = {
            id: profile.id,
            email: profile.email,
            name: profile.name,
            role: profile.role,
            avatar: profile.avatar,
            department: profile.department,
          };
          set({ user, isAuthenticated: true, isLoading: false });
        } else {
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
  logout: async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    set({ user: null, isAuthenticated: false });
  },
  
  // Users
  users: [],
  updateUserRole: (id, role) => set((state) => ({
    users: state.users.map(u => u.id === id ? { ...u, role } : u)
  })),
  resetUserPassword: (id, newPassword) => {
    // In a real app, this would call an API
    console.log(`Password reset for user ${id}: ${newPassword}`);
  },
  addUser: (user) => set((state) => ({ 
    users: [...state.users, user] 
  })),
  deleteUser: (id) => set((state) => ({
    users: state.users.filter(u => u.id !== id)
  })),
  
  // Clients
  clients: [],
  addClient: (client) => set((state) => ({ 
    clients: [...state.clients, client] 
  })),
  updateClient: (id, updatedClient) => set((state) => ({
    clients: state.clients.map(c => c.id === id ? { ...c, ...updatedClient } : c)
  })),
  deleteClient: (id) => set((state) => ({
    clients: state.clients.filter(c => c.id !== id)
  })),
  
  // Employees
  employees: [],
  addEmployee: (employee) => set((state) => ({ 
    employees: [...state.employees, employee] 
  })),
  updateEmployee: (id, updatedEmployee) => set((state) => ({
    employees: state.employees.map(e => e.id === id ? { ...e, ...updatedEmployee } : e)
  })),
  deleteEmployee: (id) => set((state) => ({
    employees: state.employees.filter(e => e.id !== id)
  })),
  
  // Expenses
  expenses: [],
  addExpense: (expense) => set((state) => ({ 
    expenses: [...state.expenses, expense] 
  })),
  updateExpense: (id, updatedExpense) => set((state) => ({
    expenses: state.expenses.map(e => e.id === id ? { ...e, ...updatedExpense } : e)
  })),
  deleteExpense: (id) => set((state) => ({
    expenses: state.expenses.filter(e => e.id !== id)
  })),
  
  // Notifications
  notifications: [],
  markNotificationAsRead: (id) => set((state) => ({
    notifications: state.notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    )
  })),
  clearNotifications: () => set({ notifications: [] }),
  
  // Schedule
  shows: [],
  addShow: (show) => set((state) => ({ 
    shows: [...state.shows, show] 
  })),
  updateShow: (id, updatedShow) => set((state) => ({
    shows: state.shows.map(s => s.id === id ? { ...s, ...updatedShow, updatedAt: new Date().toISOString() } : s)
  })),
  deleteShow: (id) => set((state) => ({
    shows: state.shows.filter(s => s.id !== id)
  })),
  
  adSlots: [],
  addAdSlot: (adSlot) => set((state) => ({ 
    adSlots: [...state.adSlots, adSlot] 
  })),
  updateAdSlot: (id, updatedAdSlot) => set((state) => ({
    adSlots: state.adSlots.map(a => a.id === id ? { ...a, ...updatedAdSlot, updatedAt: new Date().toISOString() } : a)
  })),
  deleteAdSlot: (id) => set((state) => ({
    adSlots: state.adSlots.filter(a => a.id !== id)
  })),
  
  // Employee Management
  leaveRequests: [],
  addLeaveRequest: (request) => set((state) => ({
    leaveRequests: [...state.leaveRequests, request]
  })),
  updateLeaveRequest: (id, updatedRequest) => set((state) => ({
    leaveRequests: state.leaveRequests.map(r => r.id === id ? { ...r, ...updatedRequest } : r)
  })),
  deleteLeaveRequest: (id) => set((state) => ({
    leaveRequests: state.leaveRequests.filter(r => r.id !== id)
  })),
  
  announcements: [],
  addAnnouncement: (announcement) => set((state) => ({
    announcements: [...state.announcements, announcement]
  })),
  updateAnnouncement: (id, updatedAnnouncement) => set((state) => ({
    announcements: state.announcements.map(a => a.id === id ? { ...a, ...updatedAnnouncement } : a)
  })),
  deleteAnnouncement: (id) => set((state) => ({
    announcements: state.announcements.filter(a => a.id !== id)
  })),
  markAnnouncementAsRead: (id) => set((state) => ({
    announcements: state.announcements.map(a => a.id === id ? { ...a, read: true } : a)
  })),
  
  shifts: [],
  addShift: (shift) => set((state) => ({
    shifts: [...state.shifts, shift]
  })),
  updateShift: (id, updatedShift) => set((state) => ({
    shifts: state.shifts.map(s => s.id === id ? { ...s, ...updatedShift } : s)
  })),
  deleteShift: (id) => set((state) => ({
    shifts: state.shifts.filter(s => s.id !== id)
  })),
  
  timeOff: [],
  updateTimeOff: (employeeId, updatedTimeOff) => set((state) => ({
    timeOff: state.timeOff.map(t => t.employeeId === employeeId ? { ...t, ...updatedTimeOff } : t)
  })),
  
  // UI State
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen }))
}));
