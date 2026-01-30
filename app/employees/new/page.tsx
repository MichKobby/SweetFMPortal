'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Save, X, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { generateEmployeeId } from '@/utils/idGenerator';
import { createClient } from '@/lib/supabase/client';

export default function NewEmployeePage() {
  const router = useRouter();
  const { user } = useStore();
  const [loading, setLoading] = useState(false);
  const [existingEmployees, setExistingEmployees] = useState<any[]>([]);

  // Fetch existing employees for ID generation
  useEffect(() => {
    const fetchEmployees = async () => {
      const supabase = createClient();
      const { data } = await supabase.from('employees').select('employee_id');
      if (data) setExistingEmployees(data);
    };
    fetchEmployees();
  }, []);

  // Check if user has permission
  const canAddEmployee = user?.role === 'admin' || user?.role === 'manager';

  // Form state
  const [formData, setFormData] = useState({
    // Basic Information
    name: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    // Employment Details
    role: '',
    department: '',
    employmentType: 'full-time' as 'full-time' | 'part-time' | 'contract' | 'intern',
    hireDate: '',
    contractEndDate: '',
    status: 'active' as 'active' | 'inactive',
    // Compensation
    salary: '',
    deductions: '',
    // Banking & Tax
    bankName: '',
    bankAccount: '',
    taxId: '',
    socialSecurityNumber: '',
    // Emergency Contact
    emergencyContact: '',
    emergencyPhone: '',
    // Additional
    notes: '',
  });

  const [sendInvite, setSendInvite] = useState(true); // Default to sending invite
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Redirect if no permission
  if (!user) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div>Loading...</div>
        </div>
      </MainLayout>
    );
  }

  if (!canAddEmployee) {
    router.push('/employees');
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div>Redirecting...</div>
        </div>
      </MainLayout>
    );
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Basic Information
    if (!formData.name.trim()) {
      newErrors.name = 'Employee name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    // Employment Details
    if (!formData.role.trim()) {
      newErrors.role = 'Job role is required';
    }

    if (!formData.department.trim()) {
      newErrors.department = 'Department is required';
    }

    if (!formData.hireDate) {
      newErrors.hireDate = 'Hire date is required';
    }

    // Contract validation
    if (formData.employmentType === 'contract' && !formData.contractEndDate) {
      newErrors.contractEndDate = 'Contract end date is required for contract employees';
    }

    if (formData.contractEndDate && formData.hireDate) {
      if (new Date(formData.contractEndDate) <= new Date(formData.hireDate)) {
        newErrors.contractEndDate = 'Contract end date must be after hire date';
      }
    }

    // Compensation
    if (!formData.salary || parseFloat(formData.salary) <= 0) {
      newErrors.salary = 'Salary is required and must be greater than 0';
    }

    if (formData.deductions && parseFloat(formData.deductions) < 0) {
      newErrors.deductions = 'Deductions cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);

    try {
      const salary = parseFloat(formData.salary);
      const deductions = parseFloat(formData.deductions) || 0;
      const netPay = salary - deductions;

      // Generate employee ID (e.g., S23006)
      const employeeId = generateEmployeeId(existingEmployees.map(e => ({ employeeId: e.employee_id })) as any, formData.hireDate);

      // Insert employee into Supabase
      const supabase = createClient();
      const { error: insertError } = await supabase.from('employees').insert({
        employee_id: employeeId,
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        role: formData.role,
        department: formData.department,
        hire_date: formData.hireDate,
        salary,
        deductions,
        net_pay: netPay,
        status: formData.status,
        address: formData.address || null,
        date_of_birth: formData.dateOfBirth || null,
        employment_type: formData.employmentType,
        contract_end_date: formData.contractEndDate || null,
        bank_name: formData.bankName || null,
        bank_account: formData.bankAccount || null,
        tax_id: formData.taxId || null,
        social_security_number: formData.socialSecurityNumber || null,
        emergency_contact: formData.emergencyContact || null,
        emergency_phone: formData.emergencyPhone || null,
        notes: formData.notes || null,
      });

      if (insertError) {
        throw new Error(insertError.message);
      }

      // Send invite email if checkbox is checked
      if (sendInvite && formData.email) {
        try {
          const supabase = createClient();
          const token = uuidv4();
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

          // Create invitation in database
          const { error: inviteError } = await supabase
            .from('invitations')
            .insert({
              email: formData.email,
              role: 'employee',
              department: formData.department,
              token,
              expires_at: expiresAt.toISOString(),
              invited_by: user?.id,
            });

          if (!inviteError) {
            // Send invite email via Edge Function
            await supabase.functions.invoke('send-invite', {
              body: {
                email: formData.email,
                token,
                role: 'employee',
                inviterName: user?.name || 'Admin',
                appUrl: window.location.origin,
              },
            });
            toast.success(`Employee added and invitation sent to ${formData.email}!`);
          } else {
            toast.success(`Employee added! (Invite failed: ${inviteError.message})`);
          }
        } catch (inviteErr) {
          console.error('Invite error:', inviteErr);
          toast.success('Employee added! (Invite email could not be sent)');
        }
      } else {
        toast.success(`Employee added successfully! ID: ${employeeId}`);
      }
      
      // Redirect to employees page
      setTimeout(() => {
        router.push('/employees');
      }, 1000);
    } catch (error) {
      toast.error('Failed to add employee');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/employees');
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCancel}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Add New Employee</h1>
            <p className="text-gray-500 mt-1">
              Create a new employee profile
            </p>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Employee Information</CardTitle>
            <CardDescription>
              Complete all sections to create a comprehensive employee profile
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Full Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      className={errors.name ? 'border-red-500' : ''}
                    />
                    {errors.name && (
                      <p className="text-sm text-red-500">{errors.name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">
                      Email Address <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@sweetfm.com"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      className={errors.email ? 'border-red-500' : ''}
                    />
                    {errors.email && (
                      <p className="text-sm text-red-500">{errors.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">
                      Phone Number <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="phone"
                      placeholder="+233 24 123 4567"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      className={errors.phone ? 'border-red-500' : ''}
                    />
                    {errors.phone && (
                      <p className="text-sm text-red-500">{errors.phone}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    placeholder="123 Main Street, Accra, Ghana"
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                  />
                </div>
              </div>

              {/* Employment Details Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Employment Details</h3>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="role">
                      Job Role <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="role"
                      placeholder="e.g., Radio Host, Sales Executive"
                      value={formData.role}
                      onChange={(e) => handleChange('role', e.target.value)}
                      className={errors.role ? 'border-red-500' : ''}
                    />
                    {errors.role && (
                      <p className="text-sm text-red-500">{errors.role}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department">
                      Department <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.department}
                      onValueChange={(value) => handleChange('department', value)}
                    >
                      <SelectTrigger id="department" className={errors.department ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Broadcasting">Broadcasting</SelectItem>
                        <SelectItem value="Sales">Sales</SelectItem>
                        <SelectItem value="Marketing">Marketing</SelectItem>
                        <SelectItem value="Finance">Finance</SelectItem>
                        <SelectItem value="Technical">Technical</SelectItem>
                        <SelectItem value="Management">Management</SelectItem>
                        <SelectItem value="Human Resources">Human Resources</SelectItem>
                        <SelectItem value="Administration">Administration</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.department && (
                      <p className="text-sm text-red-500">{errors.department}</p>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="employmentType">Employment Type</Label>
                    <Select
                      value={formData.employmentType}
                      onValueChange={(value) => handleChange('employmentType', value)}
                    >
                      <SelectTrigger id="employmentType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full-time">Full-Time</SelectItem>
                        <SelectItem value="part-time">Part-Time</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="intern">Intern</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => handleChange('status', value as any)}
                    >
                      <SelectTrigger id="status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="hireDate">
                      Hire Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="hireDate"
                      type="date"
                      value={formData.hireDate}
                      onChange={(e) => handleChange('hireDate', e.target.value)}
                      className={errors.hireDate ? 'border-red-500' : ''}
                    />
                    {errors.hireDate && (
                      <p className="text-sm text-red-500">{errors.hireDate}</p>
                    )}
                  </div>

                  {formData.employmentType === 'contract' && (
                    <div className="space-y-2">
                      <Label htmlFor="contractEndDate">
                        Contract End Date {formData.employmentType === 'contract' && <span className="text-red-500">*</span>}
                      </Label>
                      <Input
                        id="contractEndDate"
                        type="date"
                        value={formData.contractEndDate}
                        onChange={(e) => handleChange('contractEndDate', e.target.value)}
                        className={errors.contractEndDate ? 'border-red-500' : ''}
                      />
                      {errors.contractEndDate && (
                        <p className="text-sm text-red-500">{errors.contractEndDate}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Compensation Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Compensation</h3>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="salary">
                      Monthly Salary (GHS) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="salary"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="5000.00"
                      value={formData.salary}
                      onChange={(e) => handleChange('salary', e.target.value)}
                      className={errors.salary ? 'border-red-500' : ''}
                    />
                    {errors.salary && (
                      <p className="text-sm text-red-500">{errors.salary}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deductions">Monthly Deductions (GHS)</Label>
                    <Input
                      id="deductions"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="500.00"
                      value={formData.deductions}
                      onChange={(e) => handleChange('deductions', e.target.value)}
                      className={errors.deductions ? 'border-red-500' : ''}
                    />
                    {errors.deductions && (
                      <p className="text-sm text-red-500">{errors.deductions}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      Includes taxes, insurance, pension, etc.
                    </p>
                  </div>
                </div>

                {formData.salary && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm font-semibold text-blue-900">
                      Net Pay: GHS {(parseFloat(formData.salary) - (parseFloat(formData.deductions) || 0)).toFixed(2)}
                    </p>
                  </div>
                )}
              </div>

              {/* Banking & Tax Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Banking & Tax Information</h3>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="bankName">Bank Name</Label>
                    <Input
                      id="bankName"
                      placeholder="e.g., GCB Bank"
                      value={formData.bankName}
                      onChange={(e) => handleChange('bankName', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bankAccount">Bank Account Number</Label>
                    <Input
                      id="bankAccount"
                      placeholder="1234567890"
                      value={formData.bankAccount}
                      onChange={(e) => handleChange('bankAccount', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="taxId">Tax ID / TIN</Label>
                    <Input
                      id="taxId"
                      placeholder="Tax Identification Number"
                      value={formData.taxId}
                      onChange={(e) => handleChange('taxId', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="socialSecurityNumber">Social Security Number</Label>
                    <Input
                      id="socialSecurityNumber"
                      placeholder="SSNIT Number"
                      value={formData.socialSecurityNumber}
                      onChange={(e) => handleChange('socialSecurityNumber', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Emergency Contact Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Emergency Contact</h3>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContact">Emergency Contact Name</Label>
                    <Input
                      id="emergencyContact"
                      placeholder="Jane Doe"
                      value={formData.emergencyContact}
                      onChange={(e) => handleChange('emergencyContact', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emergencyPhone">Emergency Contact Phone</Label>
                    <Input
                      id="emergencyPhone"
                      placeholder="+233 24 987 6543"
                      value={formData.emergencyPhone}
                      onChange={(e) => handleChange('emergencyPhone', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Additional Notes Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Additional Information</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <textarea
                    id="notes"
                    rows={4}
                    placeholder="Any additional information about the employee..."
                    value={formData.notes}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              {/* System Access Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">System Access</h3>
                
                <div className="flex items-center space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <Checkbox
                    id="sendInvite"
                    checked={sendInvite}
                    onCheckedChange={(checked) => setSendInvite(checked as boolean)}
                  />
                  <div className="flex-1">
                    <Label htmlFor="sendInvite" className="text-sm font-medium cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-blue-600" />
                        Send login invitation email
                      </div>
                    </Label>
                    <p className="text-xs text-gray-500 mt-1">
                      The employee will receive an email to create their account and access the system
                    </p>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  type="submit"
                  className="bg-[#c81f25] hover:bg-[#a01820]"
                  disabled={loading}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Saving...' : 'Save Employee'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Help Text */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                  i
                </div>
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-blue-900">Quick Tips</h4>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>All fields marked with <span className="text-red-500">*</span> are required</li>
                  <li>Net pay is automatically calculated from salary minus deductions</li>
                  <li>Contract employees must have a contract end date</li>
                  <li>Banking information is needed for payroll processing</li>
                  <li>Emergency contact is important for workplace safety</li>
                  <li>You can update employee information anytime from the employee list</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
