'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
import { ArrowLeft, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { Client } from '@/types';

export default function EditClientPage() {
  const router = useRouter();
  const params = useParams();
  const { clients, updateClient, user } = useStore();
  const [loading, setLoading] = useState(false);
  const [client, setClient] = useState<Client | null>(null);

  // Check if user has permission
  const canEditClient = user?.role === 'admin' || user?.role === 'manager';

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

  // Load client data
  useEffect(() => {
    if (params.id) {
      const foundClient = clients.find(c => c.id === params.id);
      if (foundClient) {
        setClient(foundClient);
        setFormData({
          name: foundClient.name,
          company: foundClient.company,
          email: foundClient.email,
          phone: foundClient.phone,
          address: foundClient.address,
          paymentTerms: foundClient.paymentTerms,
          status: foundClient.status,
          contactPerson: foundClient.contactPerson || '',
          contactPersonPhone: foundClient.contactPersonPhone || '',
          contactPersonEmail: foundClient.contactPersonEmail || '',
          contractStartDate: foundClient.contractStartDate || '',
          contractEndDate: foundClient.contractEndDate || '',
          contractAmount: foundClient.contractAmount?.toString() || '',
          serviceDescription: foundClient.serviceDescription || '',
          billingFrequency: foundClient.billingFrequency || 'monthly',
          notes: foundClient.notes || '',
        });
      } else {
        toast.error('Client not found');
        router.push('/clients');
      }
    }
  }, [params.id, clients, router]);

  // Show loading or redirect if no permission
  if (!user || !client) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div>Loading...</div>
        </div>
      </MainLayout>
    );
  }

  // Redirect if no permission
  if (!canEditClient) {
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

    if (formData.contractStartDate && formData.contractEndDate) {
      if (new Date(formData.contractEndDate) <= new Date(formData.contractStartDate)) {
        newErrors.contractEndDate = 'End date must be after start date';
      }
    }

    if (formData.contractAmount && parseFloat(formData.contractAmount) <= 0) {
      newErrors.contractAmount = 'Contract amount must be greater than 0';
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
      // Update client object
      const updatedClient: Partial<Client> = {
        name: formData.name,
        company: formData.company,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        paymentTerms: formData.paymentTerms,
        status: formData.status,
        // Contact Person
        contactPerson: formData.contactPerson || undefined,
        contactPersonPhone: formData.contactPersonPhone || undefined,
        contactPersonEmail: formData.contactPersonEmail || undefined,
        // Contract Details
        contractStartDate: formData.contractStartDate || undefined,
        contractEndDate: formData.contractEndDate || undefined,
        contractAmount: formData.contractAmount ? parseFloat(formData.contractAmount) : undefined,
        serviceDescription: formData.serviceDescription || undefined,
        billingFrequency: formData.billingFrequency,
        notes: formData.notes || undefined,
      };

      // Update client in store
      updateClient(client.id, updatedClient);

      toast.success('Client updated successfully!');
      
      // Redirect to clients page
      setTimeout(() => {
        router.push('/clients');
      }, 1000);
    } catch (error) {
      toast.error('Failed to update client');
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
            <h1 className="text-3xl font-bold text-gray-900">Edit Client</h1>
            <p className="text-gray-500 mt-1">
              Update client information for {client.name}
            </p>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
            <CardDescription>
              Update the client profile and contract details
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
                    <Label htmlFor="contactPerson">Contact Person Name</Label>
                    <Input
                      id="contactPerson"
                      placeholder="Jane Smith"
                      value={formData.contactPerson}
                      onChange={(e) => handleChange('contactPerson', e.target.value)}
                    />
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
                    <Label htmlFor="contractStartDate">Contract Start Date</Label>
                    <Input
                      id="contractStartDate"
                      type="date"
                      value={formData.contractStartDate}
                      onChange={(e) => handleChange('contractStartDate', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contractEndDate">Contract End Date</Label>
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
                    <Label htmlFor="contractAmount">Contract Amount (GHS)</Label>
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
                  <Label htmlFor="serviceDescription">Service Description</Label>
                  <textarea
                    id="serviceDescription"
                    rows={4}
                    placeholder="Describe the advertising services, radio spots, sponsorships, or other services provided..."
                    value={formData.serviceDescription}
                    onChange={(e) => handleChange('serviceDescription', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
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
                        <SelectItem value="overdue">Overdue</SelectItem>
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
                  {loading ? 'Saving...' : 'Update Client'}
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
      </div>
    </MainLayout>
  );
}
