'use client';

import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useStore } from '@/store/useStore';
import { Calendar, Clock, Radio, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function MySchedulePage() {
  const { user, shifts, shows } = useStore();
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Get current week dates
  const getWeekDates = (date: Date) => {
    const week = [];
    const first = date.getDate() - date.getDay();
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(date);
      day.setDate(first + i);
      week.push(day);
    }
    return week;
  };

  const weekDates = getWeekDates(selectedDate);

  // Navigate weeks
  const goToPreviousWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 7);
    setSelectedDate(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 7);
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  // Get shifts for a specific date
  const getShiftsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return shifts.filter(s => s.employeeId === user?.id && s.date === dateStr);
  };

  // Get upcoming shifts (next 7 days)
  const getUpcomingShifts = () => {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    return shifts
      .filter(s => {
        if (s.employeeId !== user?.id) return false;
        const shiftDate = new Date(s.date);
        return shiftDate >= today && shiftDate <= nextWeek;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const upcomingShifts = getUpcomingShifts();

  const getStatusBadge = (status: string) => {
    const colors = {
      scheduled: 'bg-blue-100 text-blue-800',
      confirmed: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Schedule</h1>
          <p className="text-gray-500 mt-1">
            View your upcoming shifts and broadcast schedule
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {shifts.filter(s => {
                  if (s.employeeId !== user?.id) return false;
                  const shiftDate = new Date(s.date);
                  return weekDates.some(d => d.toDateString() === shiftDate.toDateString());
                }).length}
              </div>
              <p className="text-xs text-gray-500 mt-1">shifts scheduled</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Next 7 Days</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{upcomingShifts.length}</div>
              <p className="text-xs text-gray-500 mt-1">upcoming shifts</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {shifts
                  .filter(s => {
                    if (s.employeeId !== user?.id) return false;
                    const shiftDate = new Date(s.date);
                    return weekDates.some(d => d.toDateString() === shiftDate.toDateString());
                  })
                  .reduce((total, shift) => {
                    const start = new Date(`2000-01-01T${shift.startTime}`);
                    const end = new Date(`2000-01-01T${shift.endTime}`);
                    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                    return total + hours;
                  }, 0)
                  .toFixed(1)}
              </div>
              <p className="text-xs text-gray-500 mt-1">this week</p>
            </CardContent>
          </Card>
        </div>

        {/* Week Navigation */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-[#c81f25]" />
                Weekly Schedule
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={goToToday}>
                  Today
                </Button>
                <Button variant="outline" size="sm" onClick={goToNextWeek}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {weekDates.map((date, index) => {
                const dayShifts = getShiftsForDate(date);
                const today = isToday(date);
                
                return (
                  <div
                    key={index}
                    className={cn(
                      'border rounded-lg p-3 min-h-[150px]',
                      today && 'border-[#c81f25] border-2 bg-red-50'
                    )}
                  >
                    <div className="text-center mb-2">
                      <div className="text-xs font-medium text-gray-500">
                        {daysOfWeek[date.getDay()]}
                      </div>
                      <div className={cn(
                        'text-lg font-bold',
                        today ? 'text-[#c81f25]' : 'text-gray-900'
                      )}>
                        {date.getDate()}
                      </div>
                    </div>
                    <div className="space-y-2">
                      {dayShifts.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center">No shifts</p>
                      ) : (
                        dayShifts.map((shift) => (
                          <div
                            key={shift.id}
                            className="bg-blue-50 border border-blue-200 rounded p-2 text-xs"
                          >
                            <div className="font-semibold text-blue-900 truncate">
                              {shift.showName || shift.role}
                            </div>
                            <div className="text-blue-700 flex items-center gap-1 mt-1">
                              <Clock className="h-3 w-3" />
                              {shift.startTime} - {shift.endTime}
                            </div>
                            <Badge className={cn('mt-1 text-xs', getStatusBadge(shift.status))}>
                              {shift.status}
                            </Badge>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Shifts List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Radio className="h-5 w-5 text-[#c81f25]" />
              Upcoming Shifts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingShifts.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No upcoming shifts</p>
              ) : (
                upcomingShifts.map((shift) => (
                  <div
                    key={shift.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">
                          {new Date(shift.date).getDate()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {daysOfWeek[new Date(shift.date).getDay()].slice(0, 3)}
                        </div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {shift.showName || 'Shift'}
                        </div>
                        <div className="text-sm text-gray-600">{shift.role}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {shift.startTime} - {shift.endTime}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusBadge(shift.status)}>
                        {shift.status}
                      </Badge>
                      {shift.notes && (
                        <p className="text-xs text-gray-500 mt-2 max-w-xs">{shift.notes}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
