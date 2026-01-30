'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { AdSlot, Show } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface AdSlotFormProps {
  adSlot?: AdSlot;
  clients: Array<{ id: string; name: string; company: string }>;
  shows: Show[];
  onSubmit: (adSlot: AdSlot) => void;
  onCancel: () => void;
}

const daysOfWeek = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

export default function AdSlotForm({ adSlot, clients, shows, onSubmit, onCancel }: AdSlotFormProps) {
  const [formData, setFormData] = useState<Partial<AdSlot>>(adSlot || {
    clientId: '',
    clientName: '',
    adTitle: '',
    adType: 'spot',
    recurrence: 'daily',
    daysOfWeek: [],
    time: '',
    duration: 30,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    showId: '',
    frequency: 1,
    status: 'scheduled',
    cost: 0,
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedClient = clients.find(c => c.id === formData.clientId);
    const selectedShow = shows.find(s => s.id === formData.showId);
    
    const newAdSlot: AdSlot = {
      id: adSlot?.id || uuidv4(),
      clientId: formData.clientId!,
      clientName: selectedClient ? `${selectedClient.name} - ${selectedClient.company}` : formData.clientName!,
      adTitle: formData.adTitle!,
      adType: formData.adType!,
      recurrence: formData.recurrence!,
      daysOfWeek: formData.daysOfWeek!,
      time: formData.time!,
      duration: formData.duration!,
      startDate: formData.startDate!,
      endDate: formData.endDate!,
      showId: formData.showId,
      showName: selectedShow?.name,
      frequency: formData.frequency!,
      status: formData.status!,
      cost: formData.cost!,
      notes: formData.notes,
      createdAt: adSlot?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSubmit(newAdSlot);
  };

  const toggleDay = (day: number) => {
    const days = formData.daysOfWeek || [];
    if (days.includes(day)) {
      setFormData({ ...formData, daysOfWeek: days.filter(d => d !== day) });
    } else {
      setFormData({ ...formData, daysOfWeek: [...days, day].sort() });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="client">Client *</Label>
          <Select
            value={formData.clientId}
            onValueChange={(value) => setFormData({ ...formData, clientId: value })}
          >
            <SelectTrigger id="client">
              <SelectValue placeholder="Select client" />
            </SelectTrigger>
            <SelectContent>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name} - {client.company}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="adTitle">Ad Title *</Label>
          <Input
            id="adTitle"
            value={formData.adTitle}
            onChange={(e) => setFormData({ ...formData, adTitle: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="adType">Ad Type *</Label>
          <Select
            value={formData.adType}
            onValueChange={(value: any) => setFormData({ ...formData, adType: value })}
          >
            <SelectTrigger id="adType">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="spot">Spot</SelectItem>
              <SelectItem value="sponsorship">Sponsorship</SelectItem>
              <SelectItem value="promo">Promo</SelectItem>
              <SelectItem value="psa">PSA (Public Service)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="recurrence">Recurrence *</Label>
          <Select
            value={formData.recurrence}
            onValueChange={(value: any) => setFormData({ ...formData, recurrence: value })}
          >
            <SelectTrigger id="recurrence">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="once">Once</SelectItem>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Days of Week *</Label>
        <div className="flex flex-wrap gap-2">
          {daysOfWeek.map((day) => (
            <div key={day.value} className="flex items-center space-x-2">
              <Checkbox
                id={`ad-day-${day.value}`}
                checked={(formData.daysOfWeek || []).includes(day.value)}
                onCheckedChange={(_e: boolean) => toggleDay(day.value)}
              />
              <label
                htmlFor={`ad-day-${day.value}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {day.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="time">Time *</Label>
          <Input
            id="time"
            type="time"
            value={formData.time}
            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="duration">Duration (seconds) *</Label>
          <Input
            id="duration"
            type="number"
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="frequency">Frequency/Day *</Label>
          <Input
            id="frequency"
            type="number"
            value={formData.frequency}
            onChange={(e) => setFormData({ ...formData, frequency: parseInt(e.target.value) })}
            required
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="startDate">Campaign Start *</Label>
          <Input
            id="startDate"
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate">Campaign End *</Label>
          <Input
            id="endDate"
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="show">Link to Show (Optional)</Label>
        <Select
          value={formData.showId || 'none'}
          onValueChange={(value) => setFormData({ ...formData, showId: value === 'none' ? undefined : value })}
        >
          <SelectTrigger id="show">
            <SelectValue placeholder="Select show (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No specific show</SelectItem>
            {shows.map((show) => (
              <SelectItem key={show.id} value={show.id}>
                {show.name} ({show.startTime} - {show.endTime})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="cost">Cost (GHS)</Label>
        <Input
          id="cost"
          type="number"
          value={formData.cost}
          onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={2}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="bg-[#c81f25] hover:bg-[#a01820]">
          {adSlot ? 'Update Ad Slot' : 'Create Ad Slot'}
        </Button>
      </div>
    </form>
  );
}
