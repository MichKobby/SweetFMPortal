'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { useStore } from '@/store/useStore';
import { createClient } from '@/lib/supabase/client';
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
import { ArrowLeft, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { generateClientId } from '@/utils/idGenerator';

export default function NewClientPage() {
  const router = useRouter();
  const { user } = useStore();
  const [loading, setLoading] = useState(false);
  const [existingClients, setExistingClients] = useState<any[]>([]);

  // Fetch existing clients for ID generation
  useEffect(() => {
    const fetchClients = async () => {
      const supabase = createClient();
      const { data } = await supabase.from('clients').select('client_id');
      if (data) setExistingClients(data);
    };
    fetchClients();
  }, []);

  // Check if user has permission
  const canAddClient = user?.role === 'admin' || user?.role === 'manager';

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    address: '',
    paymentTerms: 'Net 30',
    status: 'active' as 'active' | 'inactive' | 'overdue',
    // Contact Person
    contactPerson: '',
    contactPersonPhone: '',
    contactPersonEmail: '',
    // Contract Details
    contractStartDate: '',
    contractEndDate: '',
    contractAmount: '',
    serviceDescription: '',
    billingFrequency: 'monthly' as 'monthly' | 'quarterly' | 'annually' | 'one-time',
    notes: '',
  });

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

  if (!canAddClient) {
    router.push('/clients');
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

    if (!formData.name.trim()) {
      newErrors.name = 'Client name is required';
    }

    if (!formData.company.trim()) {
      newErrors.company = 'Company name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    // Contract validations
    if (!formData.contractStartDate) {
      newErrors.contractStartDate = 'Contract start date is required';
    }

    if (!formData.contractEndDate) {
      newErrors.contractEndDate = 'Contract end date is required';
    }

    if (formData.contractStartDate && formData.contractEndDate) {
      if (new Date(formData.contractEndDate) <= new Date(formData.contractStartDate)) {
        newErrors.contractEndDate = 'End date must be after start date';
      }
    }

    if (!formData.contractAmount || parseFloat(formData.contractAmount) <= 0) {
      newErrors.contractAmount = 'Contract amount is required and must be greater than 0';
    }

    if (!formData.serviceDescription.trim()) {
      newErrors.serviceDescription = 'Service description is required';
    }

    if (!formData.contactPerson.trim()) {
      newErrors.contactPerson = 'Contact person name is required';
    }

    if (formData.contactPersonEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactPersonEmail)) {
      newErrors.contactPersonEmail = 'Invalid email format';
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
      const createdAt = new Date().toISOString();
      
      // Generate client ID (e.g., C24001)
      const clientId = generateClientId(existingClients.map(c => ({ clientId: c.client_id })) as any, createdAt);

      // Insert client into Supabase
      const supabase = createClient();
      const { error } = await supabase.from('clients').insert({
        client_id: clientId,
        name: formData.name,
        company: formData.company,
        email: formData.email,
        phone: formData.phone,
        address: formData.address || null,
        total_billed: 0,
        amount_paid: 0,
        balance: 0,
        status: formData.status,
        payment_terms: formData.paymentTerms,
        contact_person: formData.contactPerson,
        contact_person_phone: formData.contactPersonPhone || null,
        contact_person_email: formData.contactPersonEmail || null,
        contract_start_date: formData.contractStartDate || null,
        contract_end_date: formData.contractEndDate || null,
        contract_amount: parseFloat(formData.contractAmount) || null,
        service_description: formData.serviceDescription || null,
        billing_frequency: formData.billingFrequency,
        notes: formData.notes || null,
      });

      if (error) {
        throw new Error(error.message);
      }

      toast.success(`Client added successfully! ID: ${clientId}`);
      
      // Redirect to clients page
      setTimeout(() => {
        router.push('/clients');
      }, 1000);
    } catch (error) {
      toast.error('Failed to add client');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/clients');
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
      <div className="max-w-3xl mx-auto space-y-6">
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
            <h1 className="text-3xl font-bold text-gray-900">Add New Client</h1>
            <p className="text-gray-500 mt-1">
              Create a new client profile
            </p>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Client & Contract Information</CardTitle>
            <CardDescription>
              Complete all sections to create a new client profile with contract details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Client Name <span className="text-red-500">*</span>
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
                    <Label htmlFor="company">
                      Company Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="company"
                      placeholder="ABC Corporation"
                      value={formData.company}
                      onChange={(e) => handleChange('company', e.target.value)}
                      className={errors.company ? 'border-red-500' : ''}
                    />
                    {errors.company && (
                      <p className="text-sm text-red-500">{errors.company}</p>
                    )}
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
                      placeholder="john@example.com"
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
                  <Label htmlFor="address">
                    Address <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="address"
                    placeholder="123 Main Street, Accra, Ghana"
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    className={errors.address ? 'border-red-500' : ''}
                  />
                  {errors.address && (
                    <p className="text-sm text-red-500">{errors.address}</p>
                  )}
                </div>
              </div>

              {/* Contact Person Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Contact Person</h3>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contactPerson">
                      Contact Person Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="contactPerson"
                      placeholder="Jane Smith"
                      value={formData.contactPerson}
                      onChange={(e) => handleChange('contactPerson', e.target.value)}
                      className={errors.contactPerson ? 'border-red-500' : ''}
                    />
                    {errors.contactPerson && (
                      <p className="text-sm text-red-500">{errors.contactPerson}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactPersonPhone">Contact Person Phone</Label>
                    <Input
                      id="contactPersonPhone"
                      placeholder="+233 24 987 6543"
                      value={formData.contactPersonPhone}
                      onChange={(e) => handleChange('contactPersonPhone', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPersonEmail">Contact Person Email</Label>
                  <Input
                    id="contactPersonEmail"
                    type="email"
                    placeholder="jane@company.com"
                    value={formData.contactPersonEmail}
                    onChange={(e) => handleChange('contactPersonEmail', e.target.value)}
                    className={errors.contactPersonEmail ? 'border-red-500' : ''}
                  />
                  {errors.contactPersonEmail && (
                    <p className="text-sm text-red-500">{errors.contactPersonEmail}</p>
                  )}
                </div>
              </div>

              {/* Contract Details Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Contract Details</h3>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contractStartDate">
                      Contract Start Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="contractStartDate"
                      type="date"
                      value={formData.contractStartDate}
                      onChange={(e) => handleChange('contractStartDate', e.target.value)}
                      className={errors.contractStartDate ? 'border-red-500' : ''}
                    />
                    {errors.contractStartDate && (
                      <p className="text-sm text-red-500">{errors.contractStartDate}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contractEndDate">
                      Contract End Date <span className="text-red-500">*</span>
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
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contractAmount">
                      Contract Amount (GHS) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="contractAmount"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="10000.00"
                      value={formData.contractAmount}
                      onChange={(e) => handleChange('contractAmount', e.target.value)}
                      className={errors.contractAmount ? 'border-red-500' : ''}
                    />
                    {errors.contractAmount && (
                      <p className="text-sm text-red-500">{errors.contractAmount}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="billingFrequency">Billing Frequency</Label>
                    <Select
                      value={formData.billingFrequency}
                      onValueChange={(value) => handleChange('billingFrequency', value)}
                    >
                      <SelectTrigger id="billingFrequency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="annually">Annually</SelectItem>
                        <SelectItem value="one-time">One-Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="serviceDescription">
                    Service Description <span className="text-red-500">*</span>
                  </Label>
                  <textarea
                    id="serviceDescription"
                    rows={4}
                    placeholder="Describe the advertising services, radio spots, sponsorships, or other services provided..."
                    value={formData.serviceDescription}
                    onChange={(e) => handleChange('serviceDescription', e.target.value)}
                    className={`w-full p-2 border rounded-md ${errors.serviceDescription ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.serviceDescription && (
                    <p className="text-sm text-red-500">{errors.serviceDescription}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes</Label>
                  <textarea
                    id="notes"
                    rows={3}
                    placeholder="Any additional information or special terms..."
                    value={formData.notes}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              {/* Business Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Payment Terms & Status</h3>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="paymentTerms">Payment Terms</Label>
                    <Select
                      value={formData.paymentTerms}
                      onValueChange={(value) => handleChange('paymentTerms', value)}
                    >
                      <SelectTrigger id="paymentTerms">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Net 15">Net 15 Days</SelectItem>
                        <SelectItem value="Net 30">Net 30 Days</SelectItem>
                        <SelectItem value="Net 45">Net 45 Days</SelectItem>
                        <SelectItem value="Net 60">Net 60 Days</SelectItem>
                        <SelectItem value="Due on Receipt">Due on Receipt</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Initial Status</Label>
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
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  type="submit"
                  className="bg-[#c81f25] hover:bg-[#a01820]"
                  disabled={loading}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Saving...' : 'Save Client'}
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
                  <li>Contract end date must be after the start date</li>
                  <li>Contract amount is the total value of the agreement</li>
                  <li>Billing frequency determines how often invoices are generated</li>
                  <li>Service description should detail all advertising services provided</li>
                  <li>Payment terms determine invoice due dates</li>
                  <li>You can update client information anytime from the client list</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
