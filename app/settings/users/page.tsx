'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useStore } from '@/store/useStore';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  UserPlus, 
  Mail, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Copy, 
  Trash2,
  Users,
  Send,
  RefreshCw
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface Invitation {
  id: string;
  email: string;
  role: string;
  department: string | null;
  invited_by: string;
  token: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
  inviter?: {
    name: string;
  };
}

interface Profile {
  id: string;
  email: string;
  name: string;
  role: string;
  department: string | null;
  created_at: string;
}

export default function UserManagementPage() {
  const { user } = useStore();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [createdInviteLink, setCreatedInviteLink] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    role: 'employee' as 'admin' | 'manager' | 'employee' | 'client',
    department: '',
  });
  const [error, setError] = useState<string | null>(null);

  const isAdmin = user?.role === 'admin';
  const canInvite = user?.role === 'admin' || user?.role === 'manager';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const supabase = createClient();

    try {
      // Fetch invitations
      const { data: invitationsData, error: invError } = await supabase
        .from('invitations')
        .select(`
          *,
          inviter:invited_by(name)
        `)
        .order('created_at', { ascending: false });

      if (!invError && invitationsData) {
        setInvitations(invitationsData);
      } else if (invError) {
        console.error('Invitations error:', invError);
      }

      // Fetch users from profiles table
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (!usersError && usersData) {
        setUsers(usersData);
      } else if (usersError) {
        console.error('Users error:', usersError);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.email.trim()) {
      setError('Please enter an email address');
      return;
    }

    // Check if email already has a pending invitation
    const existingInvite = invitations.find(
      inv => inv.email === formData.email && !inv.accepted_at
    );
    if (existingInvite) {
      setError('An invitation has already been sent to this email');
      return;
    }

    // Check if user already exists
    const existingUser = users.find(u => u.email === formData.email);
    if (existingUser) {
      setError('A user with this email already exists');
      return;
    }

    setIsSending(true);

    try {
      const supabase = createClient();
      const token = uuidv4();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

      const { data: insertData, error: insertError } = await supabase
        .from('invitations')
        .insert({
          email: formData.email,
          role: formData.role,
          department: formData.department || null,
          invited_by: user?.id,
          token,
          expires_at: expiresAt.toISOString(),
        })
        .select();

      if (insertError) {
        setError(insertError.message);
        setIsSending(false);
        return;
      }

      // Generate invite link
      const inviteLink = `${window.location.origin}/invite/${token}`;
      
      // Try to send invitation email via Edge Function
      let emailSent = false;
      try {
        const { data: emailData, error: emailError } = await supabase.functions.invoke('send-invite', {
          body: {
            email: formData.email,
            token,
            role: formData.role,
            inviterName: user?.name || 'Admin',
            appUrl: window.location.origin,
          },
        });

        if (!emailError && !emailData?.error) {
          emailSent = true;
        }
      } catch (emailErr: any) {
        // Email sending failed silently
      }
      
      setIsDialogOpen(false);
      setFormData({ email: '', role: 'employee', department: '' });
      
      // Show success dialog with invite link
      setCreatedInviteLink(inviteLink);
      setIsSuccessDialogOpen(true);
      
      if (emailSent) {
        toast.success('Invitation email sent!');
      }
      
      fetchData();
    } catch (err) {
      setError('Failed to send invitation');
    } finally {
      setIsSending(false);
    }
  };

  const copyInviteLink = (token: string) => {
    const link = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(link);
    toast.success('Invitation link copied to clipboard!');
  };

  const deleteInvitation = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('invitations')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete invitation');
    } else {
      toast.success('Invitation deleted');
      fetchData();
    }
  };

  const resendInvitation = async (invitation: Invitation) => {
    const supabase = createClient();
    const newToken = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { error } = await supabase
      .from('invitations')
      .update({
        token: newToken,
        expires_at: expiresAt.toISOString(),
      })
      .eq('id', invitation.id);

    if (error) {
      toast.error('Failed to resend invitation');
    } else {
      toast.success('Invitation link renewed!');
      fetchData();
    }
  };

  const getStatusBadge = (invitation: Invitation) => {
    if (invitation.accepted_at) {
      return <Badge className="bg-green-100 text-green-800">Accepted</Badge>;
    }
    if (new Date(invitation.expires_at) < new Date()) {
      return <Badge className="bg-red-100 text-red-800">Expired</Badge>;
    }
    return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-purple-100 text-purple-800',
      manager: 'bg-blue-100 text-blue-800',
      employee: 'bg-gray-100 text-gray-800',
      client: 'bg-orange-100 text-orange-800',
    };
    return <Badge className={colors[role] || 'bg-gray-100 text-gray-800'}>{role}</Badge>;
  };

  if (!canInvite) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6 text-center">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
              <p className="text-gray-500">You don't have permission to manage users.</p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-500 mt-1">Invite and manage team members</p>
          </div>
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="bg-[#c81f25] hover:bg-[#a01820]"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Invite User
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Pending Invitations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {invitations.filter(i => !i.accepted_at && new Date(i.expires_at) > new Date()).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Accepted Invitations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {invitations.filter(i => i.accepted_at).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">Active Users</TabsTrigger>
            <TabsTrigger value="invitations">Invitations</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Active Users</CardTitle>
                <CardDescription>All registered users in the system</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No users yet. Send an invitation to get started.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Joined</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((profile) => (
                        <TableRow key={profile.id}>
                          <TableCell className="font-medium">{profile.name}</TableCell>
                          <TableCell>{profile.email}</TableCell>
                          <TableCell>{getRoleBadge(profile.role)}</TableCell>
                          <TableCell>{profile.department || '-'}</TableCell>
                          <TableCell>
                            {new Date(profile.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invitations">
            <Card>
              <CardHeader>
                <CardTitle>Invitations</CardTitle>
                <CardDescription>Manage pending and past invitations</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  </div>
                ) : invitations.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Mail className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No invitations sent yet.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Invited By</TableHead>
                        <TableHead>Expires</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invitations.map((invitation) => (
                        <TableRow key={invitation.id}>
                          <TableCell className="font-medium">{invitation.email}</TableCell>
                          <TableCell>{getRoleBadge(invitation.role)}</TableCell>
                          <TableCell>{getStatusBadge(invitation)}</TableCell>
                          <TableCell>{invitation.inviter?.name || 'Unknown'}</TableCell>
                          <TableCell>
                            {new Date(invitation.expires_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {!invitation.accepted_at && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => copyInviteLink(invitation.token)}
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => resendInvitation(invitation)}
                                  >
                                    <RefreshCw className="h-3 w-3" />
                                  </Button>
                                </>
                              )}
                              {isAdmin && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => deleteInvitation(invitation.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Invite Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite New User</DialogTitle>
            <DialogDescription>
              Send an invitation to add a new team member
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSendInvite}>
            <div className="space-y-4 py-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="colleague@sweetfm.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: typeof formData.role) => 
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Employee</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    {isAdmin && <SelectItem value="admin">Admin</SelectItem>}
                    <SelectItem value="client">Client</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(formData.role === 'employee' || formData.role === 'manager') && (
                <div className="space-y-2">
                  <Label htmlFor="department">Department (Optional)</Label>
                  <Select
                    value={formData.department}
                    onValueChange={(value) => setFormData({ ...formData, department: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Broadcasting">Broadcasting</SelectItem>
                      <SelectItem value="Sales">Sales & Marketing</SelectItem>
                      <SelectItem value="Technical">Technical</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="Management">Management</SelectItem>
                      <SelectItem value="HR">Human Resources</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#c81f25] hover:bg-[#a01820]"
                disabled={isSending}
              >
                {isSending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Invitation
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Success Dialog with Invite Link */}
      <Dialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Invitation Created!
            </DialogTitle>
            <DialogDescription>
              Share this link with the invited user to let them create their account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Invitation Link</Label>
              <div className="flex gap-2">
                <Input
                  value={createdInviteLink}
                  readOnly
                  className="bg-gray-50 font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(createdInviteLink);
                    toast.success('Link copied to clipboard!');
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                Send this link to the user via email, Slack, or any other messaging platform. 
                The link expires in 7 days.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setIsSuccessDialogOpen(false)}
              className="bg-[#c81f25] hover:bg-[#a01820]"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
