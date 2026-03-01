'use client';

import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useStore } from '@/store/useStore';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Shield, Trash2, UserPlus, Loader2, Radio, Edit2, Check, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import type { UserRole } from '@/types';

interface Profile {
  id: string;
  email: string;
  name: string;
  role: string;
  department: string | null;
}

export default function SettingsPage() {
  const { user, setUser } = useStore();
  const router = useRouter();

  // User management state
  const [users, setUsers] = useState<Profile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  // Profile state
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password state
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Outlets state
  const [outlets, setOutlets] = useState<{ id: string; name: string; code: string; description: string | null; status: string }[]>([]);
  const [loadingOutlets, setLoadingOutlets] = useState(true);
  const [editingOutlet, setEditingOutlet] = useState<string | null>(null);
  const [outletEditForm, setOutletEditForm] = useState({ name: '', description: '' });
  const [isSavingOutlet, setIsSavingOutlet] = useState(false);

  useEffect(() => {
    const fetchOutlets = async () => {
      const supabase = createClient();
      const { data } = await supabase.from('outlets').select('id, name, code, description, status').order('name');
      if (data) setOutlets(data);
      setLoadingOutlets(false);
    };
    fetchOutlets();
  }, []);

  const startEditOutlet = (outlet: typeof outlets[0]) => {
    setEditingOutlet(outlet.id);
    setOutletEditForm({ name: outlet.name, description: outlet.description ?? '' });
  };

  const cancelEditOutlet = () => {
    setEditingOutlet(null);
    setOutletEditForm({ name: '', description: '' });
  };

  const saveOutlet = async (id: string) => {
    if (!outletEditForm.name.trim()) { return; }
    setIsSavingOutlet(true);
    const supabase = createClient();
    const { error } = await supabase
      .from('outlets')
      .update({ name: outletEditForm.name.trim(), description: outletEditForm.description.trim() || null })
      .eq('id', id);
    setIsSavingOutlet(false);
    if (error) { toast.error('Failed to update outlet'); return; }
    setOutlets(prev => prev.map(o => o.id === id ? { ...o, name: outletEditForm.name.trim(), description: outletEditForm.description.trim() || null } : o));
    toast.success('Outlet updated');
    setEditingOutlet(null);
  };

  // Notification preferences state
  const [notifPrefs, setNotifPrefs] = useState({
    email: true,
    invoiceReminders: true,
    paymentConfirmations: true,
    systemUpdates: false,
  });

  // Fetch users from Supabase
  useEffect(() => {
    const fetchUsers = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setUsers(data);
      } else {
        console.error('Error fetching users:', error);
      }
      setLoadingUsers(false);
    };

    fetchUsers();
  }, []);

  // Redirect non-admins
  useEffect(() => {
    if (user && user.role !== 'admin') {
      toast.error('Access denied. Only administrators can access settings.');
      router.push('/dashboard');
    }
  }, [user, router]);

  if (!user || user.role !== 'admin') {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="rounded-full bg-red-100 p-3">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Access Denied</h3>
                  <p className="text-sm text-gray-500 mt-2">
                    Only administrators can access the settings page.
                  </p>
                </div>
                <Button
                  onClick={() => router.push('/dashboard')}
                  className="bg-[#c81f25] hover:bg-[#a01820]"
                >
                  Return to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('profiles')
        .update({ name: profileData.name })
        .eq('id', user.id);

      if (error) {
        toast.error('Failed to update profile');
        return;
      }

      // Keep local store in sync
      setUser({ ...user, name: profileData.name });
      toast.success('Profile updated successfully');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.new !== passwordData.confirm) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordData.new.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setIsChangingPassword(true);
    try {
      const supabase = createClient();

      // Re-authenticate with the current password to confirm identity
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwordData.current,
      });
      if (signInError) {
        toast.error('Current password is incorrect');
        return;
      }

      const { error } = await supabase.auth.updateUser({ password: passwordData.new });
      if (error) {
        toast.error('Failed to update password: ' + error.message);
        return;
      }

      setPasswordData({ current: '', new: '', confirm: '' });
      toast.success('Password updated successfully');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    const res = await fetch('/api/admin/update-role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role: newRole }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast.error(body.error ?? 'Failed to update user role');
      return;
    }

    setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    toast.success('User role updated successfully');
  };

  const confirmDeleteUser = async () => {
    if (!deleteTarget) return;
    setIsDeletingUser(true);
    try {
      const res = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: deleteTarget.id }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error ?? 'Failed to delete user');
        return;
      }

      setUsers(users.filter(u => u.id !== deleteTarget.id));
      toast.success('User deleted successfully');
    } finally {
      setIsDeletingUser(false);
      setDeleteTarget(null);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'manager': return 'bg-blue-100 text-blue-800';
      case 'employee': return 'bg-green-100 text-green-800';
      case 'client': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 mt-1">
            Manage your account settings and preferences
          </p>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="outlets">Outlets</TabsTrigger>
          </TabsList>

          {/* User Management Tab */}
          <TabsContent value="users" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm font-medium text-gray-500">Total Users</div>
                  <div className="text-3xl font-bold text-gray-900">
                    {loadingUsers ? <Loader2 className="h-6 w-6 animate-spin" /> : users.length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm font-medium text-gray-500">Admins</div>
                  <div className="text-3xl font-bold text-red-600">
                    {loadingUsers ? <Loader2 className="h-6 w-6 animate-spin" /> : users.filter(u => u.role === 'admin').length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm font-medium text-gray-500">Managers</div>
                  <div className="text-3xl font-bold text-blue-600">
                    {loadingUsers ? <Loader2 className="h-6 w-6 animate-spin" /> : users.filter(u => u.role === 'manager').length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm font-medium text-gray-500">Employees</div>
                  <div className="text-3xl font-bold text-green-600">
                    {loadingUsers ? <Loader2 className="h-6 w-6 animate-spin" /> : users.filter(u => u.role === 'employee').length}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>User Management</CardTitle>
                  <Button
                    className="bg-[#c81f25] hover:bg-[#a01820]"
                    onClick={() => router.push('/settings/users')}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Manage Users & Invitations
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingUsers ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium">{u.name}</TableCell>
                          <TableCell>{u.email}</TableCell>
                          <TableCell>{u.department || '-'}</TableCell>
                          <TableCell>
                            <Select
                              value={u.role}
                              onValueChange={(value) => handleRoleChange(u.id, value)}
                              disabled={u.id === user?.id}
                            >
                              <SelectTrigger className="w-[130px]">
                                <SelectValue>
                                  <Badge className={getRoleBadgeColor(u.role)}>
                                    {u.role}
                                  </Badge>
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {(['admin', 'manager', 'employee', 'client'] as UserRole[]).map((role) => (
                                  <SelectItem key={role} value={role}>
                                    <div className="flex items-center gap-2">
                                      <Shield className="h-4 w-4" />
                                      {role.charAt(0).toUpperCase() + role.slice(1)}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (u.id === user?.id) {
                                  toast.error('You cannot delete your own account');
                                  return;
                                }
                                setDeleteTarget({ id: u.id, name: u.name });
                              }}
                              disabled={u.id === user?.id}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#c81f25] text-white text-2xl font-semibold">
                      {user?.name.charAt(0)}
                    </div>
                    <div>
                      <Button type="button" variant="outline" size="sm">
                        Change Avatar
                      </Button>
                      <p className="text-xs text-gray-500 mt-1">
                        JPG, PNG or GIF. Max size 2MB
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        disabled
                        className="bg-gray-50"
                      />
                      <p className="text-xs text-gray-500">Email cannot be changed here.</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Input
                        id="role"
                        value={user?.role}
                        disabled
                        className="capitalize bg-gray-50"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="bg-[#c81f25] hover:bg-[#a01820]"
                    disabled={isSavingProfile}
                  >
                    {isSavingProfile ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={passwordData.current}
                      onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwordData.new}
                      onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordData.confirm}
                      onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="bg-[#c81f25] hover:bg-[#a01820]"
                    disabled={isChangingPassword}
                  >
                    {isChangingPassword ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Updating...</>
                    ) : (
                      'Update Password'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-gray-500">
                      Receive email updates about your account
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    aria-label="Email notifications"
                    checked={notifPrefs.email}
                    onChange={(e) => setNotifPrefs({ ...notifPrefs, email: e.target.checked })}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Invoice Reminders</p>
                    <p className="text-sm text-gray-500">
                      Get notified about upcoming invoice due dates
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    aria-label="Invoice reminders"
                    checked={notifPrefs.invoiceReminders}
                    onChange={(e) => setNotifPrefs({ ...notifPrefs, invoiceReminders: e.target.checked })}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Payment Confirmations</p>
                    <p className="text-sm text-gray-500">
                      Receive confirmation when payments are processed
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    aria-label="Payment confirmations"
                    checked={notifPrefs.paymentConfirmations}
                    onChange={(e) => setNotifPrefs({ ...notifPrefs, paymentConfirmations: e.target.checked })}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">System Updates</p>
                    <p className="text-sm text-gray-500">
                      Get notified about platform updates and maintenance
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    aria-label="System updates"
                    checked={notifPrefs.systemUpdates}
                    onChange={(e) => setNotifPrefs({ ...notifPrefs, systemUpdates: e.target.checked })}
                  />
                </div>
                <Button
                  className="bg-[#c81f25] hover:bg-[#a01820]"
                  onClick={() => toast.success('Notification preferences saved')}
                >
                  Save Preferences
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences">
            <Card>
              <CardHeader>
                <CardTitle>Display Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <select id="language" title="Select language" className="w-full p-2 border rounded-md">
                    <option value="en">English</option>
                    <option value="tw">Twi</option>
                    <option value="ga">Ga</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <select id="timezone" title="Select timezone" className="w-full p-2 border rounded-md">
                    <option value="GMT">GMT (Ghana)</option>
                    <option value="WAT">WAT (West Africa Time)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <select id="dateFormat" title="Select date format" className="w-full p-2 border rounded-md">
                    <option value="MMM dd, yyyy">MMM dd, yyyy</option>
                    <option value="dd/MM/yyyy">dd/MM/yyyy</option>
                    <option value="MM/dd/yyyy">MM/dd/yyyy</option>
                  </select>
                </div>
                <Button className="bg-[#c81f25] hover:bg-[#a01820]">
                  Save Preferences
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Outlets Tab */}
          <TabsContent value="outlets" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Radio className="h-5 w-5 text-brand" />
                  <CardTitle>Outlet Management</CardTitle>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Manage the business outlets served by this platform. Each outlet has its own employees, finances, and schedule.
                </p>
              </CardHeader>
              <CardContent>
                {loadingOutlets ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {outlets.map((outlet) => (
                      <div key={outlet.id} className="border rounded-lg p-4">
                        {editingOutlet === outlet.id ? (
                          <div className="space-y-3">
                            <div className="space-y-1">
                              <Label>Name</Label>
                              <Input
                                value={outletEditForm.name}
                                onChange={(e) => setOutletEditForm(f => ({ ...f, name: e.target.value }))}
                                placeholder="Outlet name"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label>Description</Label>
                              <Input
                                value={outletEditForm.description}
                                onChange={(e) => setOutletEditForm(f => ({ ...f, description: e.target.value }))}
                                placeholder="Short description (optional)"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="bg-brand hover:bg-brand-hover"
                                onClick={() => saveOutlet(outlet.id)}
                                disabled={isSavingOutlet}
                              >
                                {isSavingOutlet ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                Save
                              </Button>
                              <Button size="sm" variant="outline" onClick={cancelEditOutlet}>
                                <X className="h-4 w-4" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <Radio className="h-5 w-5 text-brand mt-0.5 shrink-0" />
                              <div>
                                <div className="font-semibold text-gray-900">{outlet.name}</div>
                                <div className="text-xs text-gray-500 font-mono mt-0.5">code: {outlet.code}</div>
                                {outlet.description && (
                                  <div className="text-sm text-gray-600 mt-1">{outlet.description}</div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={outlet.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}>
                                {outlet.status}
                              </Badge>
                              <Button size="sm" variant="outline" onClick={() => startEditOutlet(outlet)}>
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Delete User Confirmation Dialog */}
        <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete User</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-gray-600">
              Are you sure you want to delete{' '}
              <strong>{deleteTarget?.name}</strong>? This will permanently remove their
              account and cannot be undone.
            </p>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeletingUser}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteUser}
                disabled={isDeletingUser}
              >
                {isDeletingUser ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Deleting...</>
                ) : (
                  'Delete User'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
