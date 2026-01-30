'use client';

import { useState } from 'react';
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
import { toast } from 'sonner';
import { Plus, Bell, AlertCircle, Calendar as CalendarIcon, Info, Trash2 } from 'lucide-react';
import { Announcement } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export default function AnnouncementsPage() {
  const { user, announcements, addAnnouncement, deleteAnnouncement, markAnnouncementAsRead } = useStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general' as Announcement['category'],
    priority: 'medium' as Announcement['priority'],
    expiresAt: '',
  });

  const canManageAnnouncements = user?.role === 'admin' || user?.role === 'manager';

  // Filter announcements for current user
  const visibleAnnouncements = announcements.filter(a => {
    // Check if announcement is expired
    if (a.expiresAt && new Date(a.expiresAt) < new Date()) return false;
    
    // Check if announcement is targeted to specific roles
    if (a.targetRoles && a.targetRoles.length > 0) {
      return a.targetRoles.includes(user?.role || '');
    }
    
    return true;
  }).sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    const newAnnouncement: Announcement = {
      id: uuidv4(),
      title: formData.title,
      content: formData.content,
      category: formData.category,
      priority: formData.priority,
      publishedBy: user.name,
      publishedAt: new Date().toISOString(),
      expiresAt: formData.expiresAt || undefined,
      targetRoles: [],
    };

    addAnnouncement(newAnnouncement);
    toast.success('Announcement published successfully');
    setIsDialogOpen(false);
    setFormData({
      title: '',
      content: '',
      category: 'general',
      priority: 'medium',
      expiresAt: '',
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this announcement?')) {
      deleteAnnouncement(id);
      toast.success('Announcement deleted');
    }
  };

  const handleViewAnnouncement = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    if (!announcement.read) {
      markAnnouncementAsRead(announcement.id);
    }
  };

  const getPriorityBadge = (priority: Announcement['priority']) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800',
    };
    return colors[priority];
  };

  const getCategoryIcon = (category: Announcement['category']) => {
    const icons = {
      general: <Info className="h-4 w-4" />,
      urgent: <AlertCircle className="h-4 w-4" />,
      event: <CalendarIcon className="h-4 w-4" />,
      policy: <Info className="h-4 w-4" />,
      schedule: <CalendarIcon className="h-4 w-4" />,
    };
    return icons[category];
  };

  const unreadCount = visibleAnnouncements.filter(a => !a.read).length;

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
                className="bg-[#c81f25] hover:bg-[#a01820]"
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
          {visibleAnnouncements.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                No announcements at this time
              </CardContent>
            </Card>
          ) : (
            visibleAnnouncements.map((announcement) => (
              <Card 
                key={announcement.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  !announcement.read ? 'border-l-4 border-l-[#c81f25]' : ''
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
                          {!announcement.read && (
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
                            by {announcement.publishedBy}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(announcement.publishedAt).toLocaleDateString()}
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
                          handleDelete(announcement.id);
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
                  {announcement.expiresAt && (
                    <p className="text-xs text-gray-500 mt-2">
                      Expires: {new Date(announcement.expiresAt).toLocaleDateString()}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))
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
                    onValueChange={(value: any) => setFormData({ ...formData, category: value })}
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
                    onValueChange={(value: any) => setFormData({ ...formData, priority: value })}
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
                <Button type="submit" className="bg-[#c81f25] hover:bg-[#a01820]">
                  Publish Announcement
                </Button>
              </div>
            </form>
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
                  <p>Published by {selectedAnnouncement.publishedBy}</p>
                  <p>{new Date(selectedAnnouncement.publishedAt).toLocaleString()}</p>
                  {selectedAnnouncement.expiresAt && (
                    <p>Expires: {new Date(selectedAnnouncement.expiresAt).toLocaleString()}</p>
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
