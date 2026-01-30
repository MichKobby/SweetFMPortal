'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';
import { Plus, Calendar, CheckCircle, XCircle, Clock, Trash2 } from 'lucide-react';
import { LeaveRequest } from '@/types';

export default function LeavePage() {
  const { user } = useStore();
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [timeOffBalance, setTimeOffBalance] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    leaveType: 'vacation' as LeaveRequest['leaveType'],
    startDate: '',
    endDate: '',
    reason: '',
  });

  // Fetch data from Supabase
  const fetchData = async () => {
    const supabase = createClient();
    
    // Fetch leave requests with employee names
    const { data: requestsData } = await supabase
      .from('leave_requests')
      .select('*, employees(name, employee_id)')
      .order('requested_at', { ascending: false });
    
    if (requestsData) {
      setLeaveRequests(requestsData.map((r: any) => ({
        id: r.id,
        employeeId: r.employee_id,
        employeeName: r.employees?.name || 'Unknown',
        leaveType: r.leave_type,
        startDate: r.start_date,
        endDate: r.end_date,
        days: r.days,
        reason: r.reason,
        status: r.status,
        requestedAt: r.requested_at,
        reviewedBy: r.reviewed_by,
        reviewedAt: r.reviewed_at,
        reviewNotes: r.review_notes,
      })));
    }

    // Fetch employees for linking
    const { data: employeesData } = await supabase.from('employees').select('id, name');
    if (employeesData) setEmployees(employeesData);

    // Fetch time off balance for current user
    const { data: timeOffData } = await supabase
      .from('time_off_balances')
      .select('*')
      .eq('year', new Date().getFullYear())
      .single();
    
    if (timeOffData) {
      setTimeOffBalance({
        vacationDays: timeOffData.vacation_days,
        vacationUsed: timeOffData.vacation_used,
        sickDays: timeOffData.sick_days,
        sickUsed: timeOffData.sick_used,
        personalDays: timeOffData.personal_days,
        personalUsed: timeOffData.personal_used,
      });
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Get user's leave requests
  const userLeaveRequests = user?.role === 'admin' || user?.role === 'manager' 
    ? leaveRequests 
    : leaveRequests.filter(r => r.employeeId === user?.id);

  // Get user's time off balance
  const userTimeOff = timeOffBalance;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Find employee record for current user
    const employee = employees.find(e => e.name === user.name);
    if (!employee) {
      toast.error('Employee record not found');
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.from('leave_requests').insert({
      employee_id: employee.id,
      leave_type: formData.leaveType,
      start_date: formData.startDate,
      end_date: formData.endDate,
      days,
      reason: formData.reason,
      status: 'pending',
    });

    if (!error) {
      toast.success('Leave request submitted successfully');
      fetchData();
      setIsDialogOpen(false);
      setFormData({
        leaveType: 'vacation',
        startDate: '',
        endDate: '',
        reason: '',
      });
    } else {
      toast.error('Failed to submit leave request');
    }
  };

  const handleApprove = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from('leave_requests').update({
      status: 'approved',
      reviewed_by: user?.id,
      reviewed_at: new Date().toISOString(),
      review_notes: 'Approved',
    }).eq('id', id);
    
    if (!error) {
      toast.success('Leave request approved');
      fetchData();
    } else {
      toast.error('Failed to approve request');
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (reason) {
      const supabase = createClient();
      const { error } = await supabase.from('leave_requests').update({
        status: 'rejected',
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
        review_notes: reason,
      }).eq('id', id);
      
      if (!error) {
        toast.success('Leave request rejected');
        fetchData();
      } else {
        toast.error('Failed to reject request');
      }
    }
  };

  const handleCancel = async (id: string) => {
    if (confirm('Are you sure you want to cancel this leave request?')) {
      const supabase = createClient();
      const { error } = await supabase.from('leave_requests').update({
        status: 'cancelled',
      }).eq('id', id);
      
      if (!error) {
        toast.success('Leave request cancelled');
        fetchData();
      } else {
        toast.error('Failed to cancel request');
      }
    }
  };

  const getStatusBadge = (status: LeaveRequest['status']) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };
    return colors[status];
  };

  const getLeaveTypeLabel = (type: LeaveRequest['leaveType']) => {
    const labels = {
      vacation: 'Vacation',
      sick: 'Sick Leave',
      personal: 'Personal',
      unpaid: 'Unpaid',
      emergency: 'Emergency',
    };
    return labels[type];
  };

  const canManageLeave = user?.role === 'admin' || user?.role === 'manager';

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Leave Management</h1>
            <p className="text-gray-500 mt-1">
              Request time off and manage your leave balance
            </p>
          </div>
          <Button 
            className="bg-[#c81f25] hover:bg-[#a01820]"
            onClick={() => setIsDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Request Leave
          </Button>
        </div>

        {/* Time Off Balance */}
        {userTimeOff && (
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Vacation Days</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {userTimeOff.vacationDays - userTimeOff.vacationUsed} / {userTimeOff.vacationDays}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {userTimeOff.vacationUsed} days used
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Sick Days</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {userTimeOff.sickDays - userTimeOff.sickUsed} / {userTimeOff.sickDays}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {userTimeOff.sickUsed} days used
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Personal Days</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {userTimeOff.personalDays - userTimeOff.personalUsed} / {userTimeOff.personalDays}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {userTimeOff.personalUsed} days used
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Leave Requests Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#c81f25]" />
              {canManageLeave ? 'All Leave Requests' : 'My Leave Requests'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  {canManageLeave && <TableHead>Employee</TableHead>}
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userLeaveRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={canManageLeave ? 8 : 7} className="text-center text-gray-500">
                      No leave requests found
                    </TableCell>
                  </TableRow>
                ) : (
                  userLeaveRequests.map((request) => (
                    <TableRow key={request.id}>
                      {canManageLeave && <TableCell className="font-medium">{request.employeeName}</TableCell>}
                      <TableCell>{getLeaveTypeLabel(request.leaveType)}</TableCell>
                      <TableCell>{new Date(request.startDate).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(request.endDate).toLocaleDateString()}</TableCell>
                      <TableCell>{request.days}</TableCell>
                      <TableCell className="max-w-xs truncate">{request.reason}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(request.status)}>
                          {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {canManageLeave && request.status === 'pending' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleApprove(request.id)}
                                className="text-green-600 hover:text-green-700"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleReject(request.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {!canManageLeave && request.status === 'pending' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancel(request.id)}
                              className="text-gray-600 hover:text-gray-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                          {request.status === 'pending' && (
                            <Badge className="bg-blue-100 text-blue-800">
                              <Clock className="h-3 w-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Request Leave Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Leave</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="leaveType">Leave Type *</Label>
                <Select
                  value={formData.leaveType}
                  onValueChange={(value: any) => setFormData({ ...formData, leaveType: value })}
                >
                  <SelectTrigger id="leaveType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vacation">Vacation</SelectItem>
                    <SelectItem value="sick">Sick Leave</SelectItem>
                    <SelectItem value="personal">Personal</SelectItem>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason *</Label>
                <Textarea
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  rows={3}
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#c81f25] hover:bg-[#a01820]">
                  Submit Request
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
