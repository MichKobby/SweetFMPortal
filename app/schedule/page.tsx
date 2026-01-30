'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';
import { Plus, Calendar, Radio, Edit, Trash2, Clock, Users } from 'lucide-react';
import ShowForm from '@/components/schedule/ShowForm';
import AdSlotForm from '@/components/schedule/AdSlotForm';
import { Show, AdSlot } from '@/types';
import { cn } from '@/lib/utils';

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const daysOfWeekFull = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function SchedulePage() {
  const { user } = useStore();
  const [shows, setShows] = useState<any[]>([]);
  const [adSlots, setAdSlots] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState<'week' | 'list'>('week');
  const [selectedDay, setSelectedDay] = useState(new Date().getDay());
  
  // Dialog states
  const [isShowDialogOpen, setIsShowDialogOpen] = useState(false);
  const [isAdDialogOpen, setIsAdDialogOpen] = useState(false);
  const [editingShow, setEditingShow] = useState<Show | undefined>();
  const [editingAd, setEditingAd] = useState<AdSlot | undefined>();

  // Fetch data from Supabase
  const fetchData = async () => {
    const supabase = createClient();
    
    const [showsRes, adSlotsRes, clientsRes] = await Promise.all([
      supabase.from('shows').select('*').order('start_time'),
      supabase.from('ad_slots').select('*, clients(name, company)').order('time'),
      supabase.from('clients').select('id, name, company'),
    ]);

    if (showsRes.data) {
      setShows(showsRes.data.map((s: any) => ({
        id: s.id,
        name: s.name,
        presenter: s.presenter,
        description: s.description,
        category: s.category,
        recurrence: s.recurrence,
        daysOfWeek: s.days_of_week,
        startTime: s.start_time,
        endTime: s.end_time,
        startDate: s.start_date,
        endDate: s.end_date,
        color: s.color,
        status: s.status,
      })));
    }

    if (adSlotsRes.data) {
      setAdSlots(adSlotsRes.data.map((a: any) => ({
        id: a.id,
        clientId: a.client_id,
        clientName: a.clients?.name,
        adTitle: a.ad_title,
        adType: a.ad_type,
        recurrence: a.recurrence,
        daysOfWeek: a.days_of_week,
        time: a.time,
        duration: a.duration,
        startDate: a.start_date,
        endDate: a.end_date,
        showId: a.show_id,
        frequency: a.frequency,
        status: a.status,
        cost: parseFloat(a.cost) || 0,
        notes: a.notes,
      })));
    }

    if (clientsRes.data) {
      setClients(clientsRes.data);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddShow = async (show: Show) => {
    const supabase = createClient();
    
    if (editingShow) {
      const { error } = await supabase.from('shows').update({
        name: show.name,
        presenter: show.presenter,
        description: show.description,
        category: show.category,
        recurrence: show.recurrence,
        days_of_week: show.daysOfWeek,
        start_time: show.startTime,
        end_time: show.endTime,
        start_date: show.startDate,
        end_date: show.endDate,
        color: show.color,
        status: show.status,
      }).eq('id', show.id);
      
      if (!error) {
        toast.success('Show updated successfully');
        fetchData();
      } else {
        toast.error('Failed to update show');
      }
    } else {
      const { error } = await supabase.from('shows').insert({
        name: show.name,
        presenter: show.presenter,
        description: show.description,
        category: show.category,
        recurrence: show.recurrence,
        days_of_week: show.daysOfWeek,
        start_time: show.startTime,
        end_time: show.endTime,
        start_date: show.startDate,
        end_date: show.endDate,
        color: show.color,
        status: show.status,
      });
      
      if (!error) {
        toast.success('Show added successfully');
        fetchData();
      } else {
        toast.error('Failed to add show');
      }
    }
    setIsShowDialogOpen(false);
    setEditingShow(undefined);
  };

  const handleEditShow = (show: Show) => {
    setEditingShow(show);
    setIsShowDialogOpen(true);
  };

  const handleDeleteShow = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      const supabase = createClient();
      const { error } = await supabase.from('shows').delete().eq('id', id);
      if (!error) {
        toast.success('Show deleted successfully');
        fetchData();
      } else {
        toast.error('Failed to delete show');
      }
    }
  };

  const handleAddAdSlot = async (adSlot: AdSlot) => {
    const supabase = createClient();
    
    if (editingAd) {
      const { error } = await supabase.from('ad_slots').update({
        client_id: adSlot.clientId,
        ad_title: adSlot.adTitle,
        ad_type: adSlot.adType,
        recurrence: adSlot.recurrence,
        days_of_week: adSlot.daysOfWeek,
        time: adSlot.time,
        duration: adSlot.duration,
        start_date: adSlot.startDate,
        end_date: adSlot.endDate,
        show_id: adSlot.showId || null,
        frequency: adSlot.frequency,
        status: adSlot.status,
        cost: adSlot.cost,
        notes: adSlot.notes || null,
      }).eq('id', adSlot.id);
      
      if (!error) {
        toast.success('Ad slot updated successfully');
        fetchData();
      } else {
        toast.error('Failed to update ad slot');
      }
    } else {
      const { error } = await supabase.from('ad_slots').insert({
        client_id: adSlot.clientId,
        ad_title: adSlot.adTitle,
        ad_type: adSlot.adType,
        recurrence: adSlot.recurrence,
        days_of_week: adSlot.daysOfWeek,
        time: adSlot.time,
        duration: adSlot.duration,
        start_date: adSlot.startDate,
        end_date: adSlot.endDate,
        show_id: adSlot.showId || null,
        frequency: adSlot.frequency,
        status: adSlot.status,
        cost: adSlot.cost,
        notes: adSlot.notes || null,
      });
      
      if (!error) {
        toast.success('Ad slot added successfully');
        fetchData();
      } else {
        toast.error('Failed to add ad slot');
      }
    }
    setIsAdDialogOpen(false);
    setEditingAd(undefined);
  };

  const handleEditAdSlot = (adSlot: AdSlot) => {
    setEditingAd(adSlot);
    setIsAdDialogOpen(true);
  };

  const handleDeleteAdSlot = async (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      const supabase = createClient();
      const { error } = await supabase.from('ad_slots').delete().eq('id', id);
      if (!error) {
        toast.success('Ad slot deleted successfully');
        fetchData();
      } else {
        toast.error('Failed to delete ad slot');
      }
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="flex justify-between">
            <div className="h-10 w-64 bg-gray-200 rounded animate-pulse" />
            <div className="flex gap-2">
              <div className="h-10 w-28 bg-gray-200 rounded animate-pulse" />
              <div className="h-10 w-28 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
          <div className="h-12 bg-gray-200 rounded animate-pulse" />
          <div className="grid grid-cols-7 gap-2">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="h-64 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  const getShowsForDay = (day: number) => {
    return shows.filter(show => 
      show.status === 'active' && show.daysOfWeek.includes(day)
    ).sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const getAdsForDay = (day: number) => {
    return adSlots.filter(ad => 
      ad.status !== 'cancelled' && ad.daysOfWeek.includes(day)
    ).sort((a, b) => a.time.localeCompare(b.time));
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      archived: 'bg-yellow-100 text-yellow-800',
      scheduled: 'bg-blue-100 text-blue-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getDayLabel = (days: number[]) => {
    if (days.length === 7) return 'Every day';
    if (days.length === 5 && !days.includes(0) && !days.includes(6)) return 'Weekdays';
    if (days.length === 2 && days.includes(0) && days.includes(6)) return 'Weekends';
    return days.map(d => daysOfWeek[d]).join(', ');
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Broadcast Schedule</h1>
            <p className="text-gray-500 mt-1">
              Manage shows, programs, and advertising slots
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => setSelectedView(selectedView === 'week' ? 'list' : 'week')}
            >
              <Calendar className="h-4 w-4 mr-2" />
              {selectedView === 'week' ? 'List View' : 'Week View'}
            </Button>
            <Button 
              className="bg-[#c81f25] hover:bg-[#a01820]"
              onClick={() => {
                setEditingShow(undefined);
                setIsShowDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Show
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                setEditingAd(undefined);
                setIsAdDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Ad Slot
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Active Shows</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{shows.filter(s => s.status === 'active').length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Active Ads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{adSlots.filter(a => a.status === 'active').length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Ad Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                GHS {adSlots.filter(a => a.status !== 'cancelled').reduce((sum, a) => sum + a.cost, 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Scheduled Ads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{adSlots.filter(a => a.status === 'scheduled').length}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="shows" className="space-y-4">
          <TabsList>
            <TabsTrigger value="shows">Shows & Programs</TabsTrigger>
            <TabsTrigger value="ads">Advertising Slots</TabsTrigger>
            <TabsTrigger value="calendar">Weekly Calendar</TabsTrigger>
          </TabsList>

          {/* Shows Tab */}
          <TabsContent value="shows" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Radio className="h-5 w-5 text-[#c81f25]" />
                  All Shows
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Show Name</TableHead>
                      <TableHead>Presenter</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Schedule</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shows.map((show) => (
                      <TableRow key={show.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: show.color }}
                              title={show.color}
                            />
                            {show.name}
                          </div>
                        </TableCell>
                        <TableCell>{show.presenter}</TableCell>
                        <TableCell className="capitalize">{show.category}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{getDayLabel(show.daysOfWeek)}</div>
                            <div className="text-gray-500 text-xs">{show.recurrence}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Clock className="h-3 w-3" />
                            {show.startTime} - {show.endTime}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadge(show.status)}>
                            {show.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditShow(show)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteShow(show.id, show.name)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Ads Tab */}
          <TabsContent value="ads" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-[#c81f25]" />
                  Advertising Slots
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ad Title</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Schedule</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Campaign Period</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adSlots.map((ad) => (
                      <TableRow key={ad.id}>
                        <TableCell className="font-medium">{ad.adTitle}</TableCell>
                        <TableCell>{ad.clientName}</TableCell>
                        <TableCell className="capitalize">{ad.adType}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{getDayLabel(ad.daysOfWeek)}</div>
                            <div className="text-gray-500 text-xs">{ad.frequency}x per day</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Clock className="h-3 w-3" />
                            {ad.time} ({ad.duration}s)
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(ad.startDate).toLocaleDateString()} - {new Date(ad.endDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="font-medium">GHS {ad.cost.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge className={getStatusBadge(ad.status)}>
                            {ad.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditAdSlot(ad)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteAdSlot(ad.id, ad.adTitle)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar" className="space-y-4">
            {/* Day Selector */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {daysOfWeekFull.map((day, index) => (
                <Button
                  key={day}
                  variant={selectedDay === index ? 'default' : 'outline'}
                  className={cn(
                    'whitespace-nowrap',
                    selectedDay === index && 'bg-[#c81f25] hover:bg-[#a01820]'
                  )}
                  onClick={() => setSelectedDay(index)}
                >
                  {day}
                </Button>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Shows for Selected Day */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Shows on {daysOfWeekFull[selectedDay]}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {getShowsForDay(selectedDay).length === 0 ? (
                      <p className="text-gray-500 text-sm">No shows scheduled for this day</p>
                    ) : (
                      getShowsForDay(selectedDay).map((show) => (
                        <div
                          key={show.id}
                          className="p-3 rounded-lg border"
                          style={{ borderLeftWidth: '4px', borderLeftColor: show.color }}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-semibold">{show.name}</div>
                              <div className="text-sm text-gray-600">{show.presenter}</div>
                              <div className="text-xs text-gray-500 mt-1">
                                {show.startTime} - {show.endTime}
                              </div>
                            </div>
                            <Badge className={getStatusBadge(show.status)}>
                              {show.status}
                            </Badge>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Ads for Selected Day */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Ads on {daysOfWeekFull[selectedDay]}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {getAdsForDay(selectedDay).length === 0 ? (
                      <p className="text-gray-500 text-sm">No ads scheduled for this day</p>
                    ) : (
                      getAdsForDay(selectedDay).map((ad) => (
                        <div
                          key={ad.id}
                          className="p-3 rounded-lg border border-blue-200 bg-blue-50"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-semibold text-sm">{ad.adTitle}</div>
                              <div className="text-xs text-gray-600">{ad.clientName}</div>
                              <div className="text-xs text-gray-500 mt-1">
                                {ad.time} • {ad.duration}s • {ad.frequency}x/day
                              </div>
                            </div>
                            <Badge className={getStatusBadge(ad.status)}>
                              {ad.status}
                            </Badge>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Show Dialog */}
        <Dialog open={isShowDialogOpen} onOpenChange={(open) => {
          setIsShowDialogOpen(open);
          if (!open) setEditingShow(undefined);
        }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingShow ? 'Edit Show' : 'Add New Show'}</DialogTitle>
            </DialogHeader>
            <ShowForm
              show={editingShow}
              onSubmit={handleAddShow}
              onCancel={() => {
                setIsShowDialogOpen(false);
                setEditingShow(undefined);
              }}
            />
          </DialogContent>
        </Dialog>

        {/* Ad Slot Dialog */}
        <Dialog open={isAdDialogOpen} onOpenChange={(open) => {
          setIsAdDialogOpen(open);
          if (!open) setEditingAd(undefined);
        }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingAd ? 'Edit Ad Slot' : 'Add New Ad Slot'}</DialogTitle>
            </DialogHeader>
            <AdSlotForm
              adSlot={editingAd}
              clients={clients}
              shows={shows}
              onSubmit={handleAddAdSlot}
              onCancel={() => {
                setIsAdDialogOpen(false);
                setEditingAd(undefined);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
