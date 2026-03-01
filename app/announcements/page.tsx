'use client';

import { useState, useEffect, useCallback } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStore } from '@/store/useStore';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Plus, AlertCircle, Calendar as CalendarIcon, Info, Trash2, Loader2 } from 'lucide-react';
import { Announcement } from '@/types';

interface AnnouncementRow {
  id: string;
  title: string;
  content: string;
  category: Announcement['category'];
  priority: Announcement['priority'];
  published_by: string;
  published_at: string;
  expires_at: string | null;
  target_roles: string[] | null;
}

export default function AnnouncementsPage() {
  const { user, currentOutlet } = useStore();
  const [announcements, setAnnouncements] = useState<AnnouncementRow[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<AnnouncementRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general' as Announcement['category'],
    priority: 'medium' as Announcement['priority'],
    expiresAt: '',
  });

  const canManageAnnouncements = user?.role === 'admin' || user?.role === 'manager';

  const fetchData = useCallback(async () => {
    if (!user) return;
    const supabase = createClient();
    setLoading(true);

    let announcementsQuery = supabase
      .from('announcements')
      .select('id, title, content, category, priority, published_by, published_at, expires_at, target_roles')
      .order('published_at', { ascending: false });
    if (currentOutlet?.id) announcementsQuery = announcementsQuery.eq('outlet_id', currentOutlet.id);

    const [{ data: rows }, { data: reads }] = await Promise.all([
      announcementsQuery,
      supabase
        .from('announcement_reads')
        .select('announcement_id')
        .eq('user_id', user.id),
    ]);

    if (rows) setAnnouncements(rows as AnnouncementRow[]);
    if (reads) setReadIds(new Set(reads.map((r: { announcement_id: string }) => r.announcement_id)));
    setLoading(false);
  }, [user, currentOutlet?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const visibleAnnouncements = announcements.filter(a => {
    if (a.expires_at && new Date(a.expires_at) < new Date()) return false;
    if (a.target_roles && a.target_roles.length > 0) {
      return a.target_roles.includes(user?.role || '');
    }
    return true;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsPublishing(true);

    const supabase = createClient();
    const { error } = await supabase.from('announcements').insert({
      title: formData.title,
      content: formData.content,
      category: formData.category,
      priority: formData.priority,
      published_by: user.id,
      published_at: new Date().toISOString(),
      expires_at: formData.expiresAt || null,
      target_roles: [],
      ...(currentOutlet?.id ? { outlet_id: currentOutlet.id } : {}),
    });

    setIsPublishing(false);

    if (error) {
      toast.error('Failed to publish announcement');
      return;
    }

    toast.success('Announcement published successfully');
    setIsDialogOpen(false);
    setFormData({ title: '', content: '', category: 'general', priority: 'medium', expiresAt: '' });
    fetchData();
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    const supabase = createClient();
    const { error } = await supabase.from('announcements').delete().eq('id', id);
    setIsDeleting(false);
    setDeleteTarget(null);

    if (error) {
      toast.error('Failed to delete announcement');
      return;
    }

    toast.success('Announcement deleted');
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  };

  const handleViewAnnouncement = async (announcement: AnnouncementRow) => {
    setSelectedAnnouncement(announcement);

    if (!readIds.has(announcement.id) && user) {
      const supabase = createClient();
      const { error } = await supabase.from('announcement_reads').upsert(
        { announcement_id: announcement.id, user_id: user.id, read_at: new Date().toISOString() },
        { onConflict: 'announcement_id,user_id' }
      );
      if (!error) {
        setReadIds(prev => new Set([...prev, announcement.id]));
      }
    }
  };

  const getPriorityBadge = (priority: Announcement['priority']) => {
    const colors: Record<string, string> = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800',
    };
    return colors[priority];
  };

  const getCategoryIcon = (category: Announcement['category']) => {
    const icons: Record<string, React.ReactNode> = {
      general: <Info className="h-4 w-4" />,
      urgent: <AlertCircle className="h-4 w-4" />,
      event: <CalendarIcon className="h-4 w-4" />,
      policy: <Info className="h-4 w-4" />,
      schedule: <CalendarIcon className="h-4 w-4" />,
    };
    return icons[category];
  };

  const unreadCount = visibleAnnouncements.filter(a => !readIds.has(a.id)).length;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Announcements</h1>
            <p className="text-gray-500 mt-1">
              Stay updated with important news and information
            </p>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Badge className="bg-red-100 text-red-800">
                {unreadCount} unread
              </Badge>
            )}
            {canManageAnnouncements && (
              <Button
                className="bg-brand hover:bg-brand-hover"
                onClick={() => setIsDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Announcement
              </Button>
            )}
          </div>
        </div>

        {/* Announcements Grid */}
        <div className="grid gap-4">
          {loading ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                Loading announcements…
              </CardContent>
            </Card>
          ) : visibleAnnouncements.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                No announcements at this time
              </CardContent>
            </Card>
          ) : (
            visibleAnnouncements.map((announcement) => {
              const isRead = readIds.has(announcement.id);
              return (
                <Card
                  key={announcement.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    !isRead ? 'border-l-4 border-l-brand' : ''
                  }`}
                  onClick={() => handleViewAnnouncement(announcement)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="mt-1">
                          {getCategoryIcon(announcement.category)}
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg flex items-center gap-2">
                            {announcement.title}
                            {!isRead && (
                              <Badge className="bg-blue-100 text-blue-800 text-xs">New</Badge>
                            )}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className={getPriorityBadge(announcement.priority)}>
                              {announcement.priority}
                            </Badge>
                            <Badge variant="outline" className="capitalize">
                              {announcement.category}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {new Date(announcement.published_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      {canManageAnnouncements && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(announcement.id);
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 line-clamp-2">{announcement.content}</p>
                    {announcement.expires_at && (
                      <p className="text-xs text-gray-500 mt-2">
                        Expires: {new Date(announcement.expires_at).toLocaleDateString()}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Create Announcement Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Announcement</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={5}
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value as Announcement['category'] })}
                  >
                    <SelectTrigger id="category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="event">Event</SelectItem>
                      <SelectItem value="policy">Policy</SelectItem>
                      <SelectItem value="schedule">Schedule</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority *</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value as Announcement['priority'] })}
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
                <Label htmlFor="expiresAt">Expiration Date (Optional)</Label>
                <Input
                  id="expiresAt"
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-brand hover:bg-brand-hover" disabled={isPublishing}>
                  {isPublishing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Publish Announcement
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Delete Announcement</DialogTitle>
            </DialogHeader>
            <p className="text-gray-600">Are you sure you want to delete this announcement? This cannot be undone.</p>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={isDeleting}
                onClick={() => deleteTarget && handleDelete(deleteTarget)}
              >
                {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Announcement Dialog */}
        <Dialog open={!!selectedAnnouncement} onOpenChange={() => setSelectedAnnouncement(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedAnnouncement && getCategoryIcon(selectedAnnouncement.category)}
                {selectedAnnouncement?.title}
              </DialogTitle>
            </DialogHeader>
            {selectedAnnouncement && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge className={getPriorityBadge(selectedAnnouncement.priority)}>
                    {selectedAnnouncement.priority}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {selectedAnnouncement.category}
                  </Badge>
                </div>
                <div className="text-sm text-gray-500">
                  <p>{new Date(selectedAnnouncement.published_at).toLocaleString()}</p>
                  {selectedAnnouncement.expires_at && (
                    <p>Expires: {new Date(selectedAnnouncement.expires_at).toLocaleString()}</p>
                  )}
                </div>
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedAnnouncement.content}</p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
