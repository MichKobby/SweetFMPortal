'use client';

import { useState, useEffect, useCallback } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useStore } from '@/store/useStore';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Plus, MessageSquare, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { SupportTicket } from '@/types';

interface TicketRow {
  id: string;
  client_id: string;
  subject: string;
  description: string;
  category: SupportTicket['category'];
  priority: SupportTicket['priority'];
  status: SupportTicket['status'];
  created_at: string;
  updated_at: string;
  assigned_to: string | null;
}

interface ResponseRow {
  id: string;
  ticket_id: string;
  author_id: string;
  author_role: 'client' | 'staff';
  message: string;
  created_at: string;
}

export default function SupportPage() {
  const { user, currentOutlet } = useStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketRow | null>(null);
  const [responses, setResponses] = useState<ResponseRow[]>([]);
  const [loadingResponses, setLoadingResponses] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [clientId, setClientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    category: 'general' as SupportTicket['category'],
    priority: 'medium' as SupportTicket['priority'],
  });

  const fetchTickets = useCallback(async () => {
    if (!user?.email) return;
    const supabase = createClient();

    const { data: client } = await supabase
      .from('clients')
      .select('id')
      .eq('email', user.email)
      .single();

    if (client) {
      setClientId(client.id);
      const { data: rows } = await supabase
        .from('support_tickets')
        .select('id, client_id, subject, description, category, priority, status, created_at, updated_at, assigned_to')
        .eq('client_id', client.id)
        .order('created_at', { ascending: false });

      if (rows) setTickets(rows as TicketRow[]);
    }

    setLoading(false);
  }, [user?.email]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const loadResponses = async (ticketId: string) => {
    setLoadingResponses(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('ticket_responses')
      .select('id, ticket_id, author_id, author_role, message, created_at')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (data) setResponses(data as ResponseRow[]);
    setLoadingResponses(false);
  };

  const handleViewTicket = (ticket: TicketRow) => {
    setSelectedTicket(ticket);
    setResponses([]);
    loadResponses(ticket.id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !clientId) return;
    setIsSubmitting(true);

    const supabase = createClient();
    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .insert({
        client_id: clientId,
        subject: formData.subject,
        description: formData.description,
        category: formData.category,
        priority: formData.priority,
        status: 'open',
        ...(currentOutlet?.id ? { outlet_id: currentOutlet.id } : {}),
      })
      .select('id, client_id, subject, description, category, priority, status, created_at, updated_at, assigned_to')
      .single();

    setIsSubmitting(false);

    if (error) {
      toast.error('Failed to create ticket');
      return;
    }

    toast.success('Support ticket created successfully');
    setIsDialogOpen(false);
    setFormData({ subject: '', description: '', category: 'general', priority: 'medium' });
    if (ticket) setTickets(prev => [ticket as TicketRow, ...prev]);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket || !user) return;
    setIsSending(true);

    const supabase = createClient();
    const isStaff = user.role === 'admin' || user.role === 'manager' || user.role === 'employee';
    const authorRole: 'client' | 'staff' = isStaff ? 'staff' : 'client';

    const { data: response, error } = await supabase
      .from('ticket_responses')
      .insert({
        ticket_id: selectedTicket.id,
        author_id: user.id,
        author_role: authorRole,
        message: newMessage.trim(),
      })
      .select('id, ticket_id, author_id, author_role, message, created_at')
      .single();

    if (error) {
      setIsSending(false);
      toast.error('Failed to send message');
      return;
    }

    if (response) setResponses(prev => [...prev, response as ResponseRow]);
    setNewMessage('');

    // Auto-update ticket to in-progress on first staff reply
    if (isStaff && selectedTicket.status === 'open') {
      await supabase
        .from('support_tickets')
        .update({ status: 'in-progress', updated_at: new Date().toISOString() })
        .eq('id', selectedTicket.id);

      setSelectedTicket(prev => prev ? { ...prev, status: 'in-progress' } : prev);
      setTickets(prev =>
        prev.map(t => t.id === selectedTicket.id ? { ...t, status: 'in-progress' } : t)
      );
    }

    setIsSending(false);
    toast.success('Message sent');
  };

  const openTickets = tickets.filter(t => t.status === 'open' || t.status === 'in-progress').length;
  const resolvedTickets = tickets.filter(t => t.status === 'resolved').length;

  const getStatusBadge = (status: SupportTicket['status']) => {
    const colors: Record<string, string> = {
      open: 'bg-blue-100 text-blue-800',
      'in-progress': 'bg-yellow-100 text-yellow-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800',
    };
    return colors[status];
  };

  const getPriorityBadge = (priority: SupportTicket['priority']) => {
    const colors: Record<string, string> = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800',
    };
    return colors[priority];
  };

  const getStatusIcon = (status: SupportTicket['status']) => {
    switch (status) {
      case 'open': return <AlertCircle className="h-5 w-5 text-blue-600" />;
      case 'in-progress': return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'resolved': return <CheckCircle className="h-5 w-5 text-green-600" />;
      default: return <MessageSquare className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Support Center</h1>
            <p className="text-gray-500 mt-1">
              Get help with your account, campaigns, or billing
            </p>
          </div>
          <Button
            className="bg-brand hover:bg-brand-hover"
            onClick={() => setIsDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Ticket
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Open Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{openTickets}</div>
              <p className="text-xs text-gray-500 mt-1">awaiting response</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Resolved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{resolvedTickets}</div>
              <p className="text-xs text-gray-500 mt-1">completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tickets.length}</div>
              <p className="text-xs text-gray-500 mt-1">all time</p>
            </CardContent>
          </Card>
        </div>

        {/* Tickets List */}
        <div className="grid gap-4">
          {loading ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                Loading tickets…
              </CardContent>
            </Card>
          ) : tickets.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No support tickets yet</p>
                <p className="text-sm mt-2">Create a ticket if you need assistance</p>
              </CardContent>
            </Card>
          ) : (
            tickets.map((ticket) => (
              <Card
                key={ticket.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleViewTicket(ticket)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="mt-1">
                        {getStatusIcon(ticket.status)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{ticket.subject}</h3>
                          <Badge className={getPriorityBadge(ticket.priority)}>
                            {ticket.priority}
                          </Badge>
                        </div>
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{ticket.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="capitalize">{ticket.category}</span>
                          <span>•</span>
                          <span>Created {new Date(ticket.created_at).toLocaleDateString()}</span>
                          {ticket.assigned_to && (
                            <>
                              <span>•</span>
                              <span>Assigned to {ticket.assigned_to}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <Badge className={getStatusBadge(ticket.status)}>
                      {ticket.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Create Ticket Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Support Ticket</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Brief description of your issue"
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value as SupportTicket['category'] })}
                  >
                    <SelectTrigger id="category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="billing">Billing</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="campaign">Campaign</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority *</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value as SupportTicket['priority'] })}
                  >
                    <SelectTrigger id="priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={5}
                  placeholder="Please provide detailed information about your issue..."
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-brand hover:bg-brand-hover" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create Ticket
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Ticket Detail Dialog */}
        <Dialog open={!!selectedTicket} onOpenChange={() => { setSelectedTicket(null); setResponses([]); }}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle>{selectedTicket?.subject}</DialogTitle>
                <div className="flex items-center gap-2">
                  <Badge className={selectedTicket ? getPriorityBadge(selectedTicket.priority) : ''}>
                    {selectedTicket?.priority}
                  </Badge>
                  <Badge className={selectedTicket ? getStatusBadge(selectedTicket.status) : ''}>
                    {selectedTicket?.status}
                  </Badge>
                </div>
              </div>
            </DialogHeader>
            {selectedTicket && (
              <div className="space-y-6">
                {/* Ticket Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Category:</span>
                      <span className="ml-2 font-medium capitalize">{selectedTicket.category}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Created:</span>
                      <span className="ml-2 font-medium">{new Date(selectedTicket.created_at).toLocaleString()}</span>
                    </div>
                    {selectedTicket.assigned_to && (
                      <div>
                        <span className="text-gray-500">Assigned to:</span>
                        <span className="ml-2 font-medium">{selectedTicket.assigned_to}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-500">Last Updated:</span>
                      <span className="ml-2 font-medium">{new Date(selectedTicket.updated_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Original Message */}
                <div>
                  <h3 className="font-semibold mb-2">Original Message</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedTicket.description}</p>
                </div>

                {/* Responses */}
                {loadingResponses ? (
                  <div className="flex items-center gap-2 text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading conversation…
                  </div>
                ) : responses.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-semibold">Conversation</h3>
                    {responses.map((response) => (
                      <div
                        key={response.id}
                        className={`p-4 rounded-lg ${
                          response.author_role === 'staff'
                            ? 'bg-blue-50 border-l-4 border-blue-500'
                            : 'bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold capitalize">{response.author_role}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(response.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-gray-700 whitespace-pre-wrap">{response.message}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply Form */}
                {selectedTicket.status !== 'closed' && (
                  <div className="space-y-2 border-t pt-4">
                    <Label htmlFor="newMessage">Add Response</Label>
                    <Textarea
                      id="newMessage"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      rows={3}
                      placeholder="Type your message..."
                    />
                    <div className="flex justify-end">
                      <Button
                        onClick={handleSendMessage}
                        className="bg-brand hover:bg-brand-hover"
                        disabled={!newMessage.trim() || isSending}
                      >
                        {isSending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Send Message
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
