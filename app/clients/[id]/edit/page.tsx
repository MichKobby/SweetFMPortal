'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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

export default function EditClientPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useStore();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [clientName, setClientName] = useState('');

  const canEditClient = user?.role === 'admin' || user?.role === 'manager';

  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    address: '',
    paymentTerms: 'Net 30',
    status: 'active' as 'active' | 'inactive' | 'overdue',
    contactPerson: '',
    contactPersonPhone: '',
    contactPersonEmail: '',
    contractStartDate: '',
    contractEndDate: '',
    contractAmount: '',
    serviceDescription: '',
    billingFrequency: 'monthly' as 'monthly' | 'quarterly' | 'annually' | 'one-time',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load client directly from Supabase
  useEffect(() => {
    if (!params.id) return;
    const supabase = createClient();
    supabase
      .from('clients')
      .select('*')
      .eq('id', params.id as string)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          toast.error('Client not found');
          router.push('/clients');
          return;
        }
        setClientName(data.name);
        setFormData({
          name: data.name,
          company: data.company,
          email: data.email,
          phone: data.phone,
          address: data.address,
          paymentTerms: data.payment_terms || 'Net 30',
          status: data.status,
          contactPerson: data.contact_person || '',
          contactPersonPhone: data.contact_person_phone || '',
          contactPersonEmail: data.contact_person_email || '',
          contractStartDate: data.contract_start_date || '',
          contractEndDate: data.contract_end_date || '',
          contractAmount: data.contract_amount?.toString() || '',
          serviceDescription: data.service_description || '',
          billingFrequency: data.billing_frequency || 'monthly',
          notes: data.notes || '',
        });
        setFetching(false);
      });
  }, [params.id, router]);

  if (!user || fetching) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div>Loading...</div>
        </div>
      </MainLayout>
    );
  }

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

    if (!formData.name.trim()) newErrors.name = 'Client name is required';
    if (!formData.company.trim()) newErrors.company = 'Company name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
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
      const supabase = createClient();
      const { error } = await supabase
        .from('clients')
        .update({
          name: formData.name,
          company: formData.company,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          payment_terms: formData.paymentTerms,
          status: formData.status,
          contact_person: formData.contactPerson || null,
          contact_person_phone: formData.contactPersonPhone || null,
          contact_person_email: formData.contactPersonEmail || null,
          contract_start_date: formData.contractStartDate || null,
          contract_end_date: formData.contractEndDate || null,
          contract_amount: formData.contractAmount ? parseFloat(formData.contractAmount) : null,
          service_description: formData.serviceDescription || null,
          billing_frequency: formData.billingFrequency,
          notes: formData.notes || null,
        })
        .eq('id', params.id as string);

      if (error) {
        toast.error('Failed to update client');
        console.error(error);
        return;
      }

      toast.success('Client updated successfully!');
      router.push('/clients');
    } catch (error) {
      toast.error('Failed to update client');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/clients')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Client</h1>
            <p className="text-gray-500 mt-1">Update client information for {clientName}</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
            <CardDescription>Update the client profile and contract details</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Client Name <span className="text-red-500">*</span></Label>
                    <Input id="name" placeholder="John Doe" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} className={errors.name ? 'border-red-500' : ''} />
                    {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Company Name <span className="text-red-500">*</span></Label>
                    <Input id="company" placeholder="ABC Corporation" value={formData.company} onChange={(e) => handleChange('company', e.target.value)} className={errors.company ? 'border-red-500' : ''} />
                    {errors.company && <p className="text-sm text-red-500">{errors.company}</p>}
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address <span className="text-red-500">*</span></Label>
                    <Input id="email" type="email" placeholder="john@example.com" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} className={errors.email ? 'border-red-500' : ''} />
                    {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number <span className="text-red-500">*</span></Label>
                    <Input id="phone" placeholder="+233 24 123 4567" value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} className={errors.phone ? 'border-red-500' : ''} />
                    {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address <span className="text-red-500">*</span></Label>
                  <Input id="address" placeholder="123 Main Street, Accra, Ghana" value={formData.address} onChange={(e) => handleChange('address', e.target.value)} className={errors.address ? 'border-red-500' : ''} />
                  {errors.address && <p className="text-sm text-red-500">{errors.address}</p>}
                </div>
              </div>

              {/* Contact Person */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Contact Person</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contactPerson">Contact Person Name</Label>
                    <Input id="contactPerson" placeholder="Jane Smith" value={formData.contactPerson} onChange={(e) => handleChange('contactPerson', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactPersonPhone">Contact Person Phone</Label>
                    <Input id="contactPersonPhone" placeholder="+233 24 987 6543" value={formData.contactPersonPhone} onChange={(e) => handleChange('contactPersonPhone', e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPersonEmail">Contact Person Email</Label>
                  <Input id="contactPersonEmail" type="email" placeholder="jane@company.com" value={formData.contactPersonEmail} onChange={(e) => handleChange('contactPersonEmail', e.target.value)} className={errors.contactPersonEmail ? 'border-red-500' : ''} />
                  {errors.contactPersonEmail && <p className="text-sm text-red-500">{errors.contactPersonEmail}</p>}
                </div>
              </div>

              {/* Contract Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Contract Details</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contractStartDate">Contract Start Date</Label>
                    <Input id="contractStartDate" type="date" value={formData.contractStartDate} onChange={(e) => handleChange('contractStartDate', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contractEndDate">Contract End Date</Label>
                    <Input id="contractEndDate" type="date" value={formData.contractEndDate} onChange={(e) => handleChange('contractEndDate', e.target.value)} className={errors.contractEndDate ? 'border-red-500' : ''} />
                    {errors.contractEndDate && <p className="text-sm text-red-500">{errors.contractEndDate}</p>}
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contractAmount">Contract Amount (GHS)</Label>
                    <Input id="contractAmount" type="number" step="0.01" min="0" placeholder="10000.00" value={formData.contractAmount} onChange={(e) => handleChange('contractAmount', e.target.value)} className={errors.contractAmount ? 'border-red-500' : ''} />
                    {errors.contractAmount && <p className="text-sm text-red-500">{errors.contractAmount}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billingFrequency">Billing Frequency</Label>
                    <Select value={formData.billingFrequency} onValueChange={(v) => handleChange('billingFrequency', v)}>
                      <SelectTrigger id="billingFrequency"><SelectValue /></SelectTrigger>
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
                  <textarea id="serviceDescription" rows={4} placeholder="Describe the advertising services..." value={formData.serviceDescription} onChange={(e) => handleChange('serviceDescription', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes</Label>
                  <textarea id="notes" rows={3} placeholder="Any additional information..." value={formData.notes} onChange={(e) => handleChange('notes', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" />
                </div>
              </div>

              {/* Payment Terms & Status */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Payment Terms & Status</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="paymentTerms">Payment Terms</Label>
                    <Select value={formData.paymentTerms} onValueChange={(v) => handleChange('paymentTerms', v)}>
                      <SelectTrigger id="paymentTerms"><SelectValue /></SelectTrigger>
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
                    <Select value={formData.status} onValueChange={(v) => handleChange('status', v as 'active' | 'inactive' | 'overdue')}>
                      <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <Button type="submit" className="bg-[#c81f25] hover:bg-[#a01820]" disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Saving...' : 'Update Client'}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.push('/clients')} disabled={loading}>
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
