'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { useStore } from '@/store/useStore';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Search, Eye, Edit, Mail, Phone, Calendar, DollarSign } from 'lucide-react';
import { formatCurrency, formatDate, getStatusColor } from '@/utils/formatters';
import { Employee } from '@/types';
import { PayrollRecord } from '@/types';

export default function EmployeesPage() {
  const router = useRouter();
  const { user } = useStore();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  
  // Fetch employees from Supabase
  useEffect(() => {
    const fetchEmployees = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        const mappedEmployees = data.map((e: any) => ({
          id: e.id,
          employeeId: e.employee_id,
          name: e.name,
          email: e.email,
          phone: e.phone,
          role: e.role,
          department: e.department,
          hireDate: e.hire_date,
          salary: parseFloat(e.salary) || 0,
          deductions: parseFloat(e.deductions) || 0,
          netPay: parseFloat(e.net_pay) || 0,
          avatar: e.avatar,
          status: e.status,
          address: e.address,
          emergencyContact: e.emergency_contact,
          emergencyPhone: e.emergency_phone,
          dateOfBirth: e.date_of_birth,
          employmentType: e.employment_type,
          bankAccount: e.bank_account,
          bankName: e.bank_name,
          taxId: e.tax_id,
          socialSecurityNumber: e.social_security_number,
          contractEndDate: e.contract_end_date,
          notes: e.notes,
          createdAt: e.created_at,
        }));
        setEmployees(mappedEmployees);
      }
      setLoading(false);
    };

    fetchEmployees();
  }, []);

  // Check if user is admin or manager
  const canAddEmployee = user?.role === 'admin' || user?.role === 'manager';

  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="flex justify-between">
            <div className="h-10 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="h-12 bg-gray-200 rounded animate-pulse" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  const filteredEmployees = employees.filter((employee) =>
    employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    employee.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
    employee.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Payroll data will be fetched from database
  const employeePayroll: PayrollRecord[] = [];

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Employee Management</h1>
            <p className="text-gray-500 mt-1 text-sm md:text-base">
              Manage your team and payroll
            </p>
          </div>
          {canAddEmployee && (
            <Button
              onClick={() => router.push('/employees/new')}
              className="bg-[#c81f25] hover:bg-[#a01820] w-full sm:w-auto"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Employee
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search employees..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Employee Cards Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredEmployees.map((employee) => (
            <Card key={employee.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#c81f25] text-white text-lg font-semibold">
                      {employee.name.charAt(0)}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{employee.name}</CardTitle>
                      <p className="text-sm text-gray-500">{employee.role}</p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(employee.status)}>
                    {employee.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{employee.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="h-4 w-4" />
                  <span>{employee.phone}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm text-gray-600">Department:</span>
                  <Badge variant="outline">{employee.department}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Net Pay:</span>
                  <span className="font-semibold text-[#c81f25]">
                    {formatCurrency(employee.netPay)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setSelectedEmployee(employee)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => router.push(`/employees/${employee.id}/edit`)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Payroll Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Payroll Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Gross Pay</TableHead>
                  <TableHead>Deductions</TableHead>
                  <TableHead>Net Pay</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">{employee.name}</TableCell>
                    <TableCell>{employee.department}</TableCell>
                    <TableCell>{formatCurrency(employee.salary)}</TableCell>
                    <TableCell>{formatCurrency(employee.deductions)}</TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(employee.netPay)}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Employee Details Dialog */}
      <Dialog open={!!selectedEmployee} onOpenChange={() => setSelectedEmployee(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#c81f25] text-white text-lg font-semibold">
                {selectedEmployee?.name.charAt(0)}
              </div>
              <div>
                <div>{selectedEmployee?.name}</div>
                <div className="text-sm font-normal text-gray-500">
                  {selectedEmployee?.role}
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>

          {selectedEmployee && (
            <div className="space-y-6">
              {/* Employee Info */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span>{selectedEmployee.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{selectedEmployee.phone}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Employment Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Department:</span>
                      <span className="font-medium">{selectedEmployee.department}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Hire Date:</span>
                      <span className="font-medium">
                        {formatDate(selectedEmployee.hireDate)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Status:</span>
                      <Badge className={getStatusColor(selectedEmployee.status)}>
                        {selectedEmployee.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Compensation */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Compensation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Gross Salary</p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(selectedEmployee.salary)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Deductions</p>
                      <p className="text-2xl font-bold text-red-600">
                        -{formatCurrency(selectedEmployee.deductions)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Net Pay</p>
                      <p className="text-2xl font-bold text-[#c81f25]">
                        {formatCurrency(selectedEmployee.netPay)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tabs */}
              <Tabs defaultValue="payroll">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="payroll">Payroll History</TabsTrigger>
                  <TabsTrigger value="attendance">Attendance</TabsTrigger>
                </TabsList>

                <TabsContent value="payroll" className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pay Date</TableHead>
                        <TableHead>Gross</TableHead>
                        <TableHead>Deductions</TableHead>
                        <TableHead>Net Pay</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employeePayroll.map((pay) => (
                        <TableRow key={pay.id}>
                          <TableCell>{formatDate(pay.payDate)}</TableCell>
                          <TableCell>{formatCurrency(pay.grossPay)}</TableCell>
                          <TableCell>{formatCurrency(pay.deductions)}</TableCell>
                          <TableCell className="font-semibold">
                            {formatCurrency(pay.netPay)}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(pay.status)}>
                              {pay.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TabsContent>

                <TabsContent value="attendance">
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>Attendance records will be displayed here</p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
