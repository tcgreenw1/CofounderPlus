/**
 * Founder Calls Admin Panel
 * Manage $99 Founder Setup Call bookings and availability
 */

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Mail, Phone, DollarSign, Video, Settings, X, Edit2, Trash2, Check, AlertCircle, Send, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { AvailabilityEditor } from './AvailabilityEditor';

import { TeamManagement } from './TeamManagement';

interface Booking {
  id: string;
  date: string;
  time: string;
  name: string;
  email: string;
  phone: string;
  businessStage: string;
  mainChallenge: string;
  status: 'pending_payment' | 'confirmed' | 'cancelled' | 'completed';
  paymentIntentId?: string;
  paymentStatus?: string;
  zoomLink?: string;
  calendarInviteSent: boolean;
  createdAt: string;
  updatedAt: string;
  cancelledAt?: string;
  bookingType?: 'founder_call' | 'task_automation';
  assignedEmployeeId?: string;
}

interface AvailabilitySettings {
  weeklySchedule: {
    [key: number]: string[]; // 0 = Sunday, 1 = Monday, etc.
  };
  dateOverrides: {
    [date: string]: string[]; // YYYY-MM-DD -> time slots (empty array = blocked)
  };
  timezone: string;
}

export function FounderCallsAdmin() {
  const [activeTab, setActiveTab] = useState<'bookings' | 'availability' | 'team'>('bookings');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [availabilityTab, setAvailabilityTab] = useState<'weekly' | 'calendar'>('weekly');

  // Confirmation Modal State
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [confirmationData, setConfirmationData] = useState({
    bookingId: '',
    zoomLink: '',
    employeeId: '',
  });
  const [employees, setEmployees] = useState<any[]>([]);
  const [sendingConfirmation, setSendingConfirmation] = useState(false);
  
  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  
  // Availability settings
  const [availabilitySettings, setAvailabilitySettings] = useState<AvailabilitySettings>({
    weeklySchedule: {
      1: ['9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'],
      2: ['9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'],
      3: ['9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'],
      4: ['9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'],
      5: ['9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'],
    },
    dateOverrides: {},
    timezone: 'America/Chicago',
    // @ts-ignore - dynamic field
    defaultMeetingLink: '',
  });

  const [editForm, setEditForm] = useState<Partial<Booking>>({});

  useEffect(() => {
    fetchBookings();
    fetchAvailabilitySettings();
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/admin/employees`,
        { headers: { 'Authorization': `Bearer ${publicAnonKey}` } }
      );
      if (response.ok) {
        const data = await response.json();
        setEmployees(data.employees || []);
      }
    } catch (e) {
      console.error('Failed to fetch employees');
    }
  };

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/admin/founder-calls/bookings`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings || []);
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailabilitySettings = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/founder-calls/availability?month=${currentMonth}&year=${currentYear}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        // The backend returns settings in the response
        const settings = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/admin/founder-calls/availability-settings`,
          {
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
            },
          }
        );
        
        if (settings.ok) {
          const settingsData = await settings.json();
          if (settingsData.settings) {
            setAvailabilitySettings(settingsData.settings);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch availability settings:', error);
    }
  };

  const handleEditBooking = async () => {
    if (!selectedBooking) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/admin/founder-calls/booking/${selectedBooking.id}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(editForm),
        }
      );

      if (response.ok) {
        toast.success('Booking updated successfully');
        setShowEditModal(false);
        setSelectedBooking(null);
        setEditForm({});
        fetchBookings();
      } else {
        toast.error('Failed to update booking');
      }
    } catch (error) {
      console.error('Error updating booking:', error);
      toast.error('Failed to update booking');
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/admin/founder-calls/booking/${bookingId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        toast.success('Booking cancelled');
        fetchBookings();
      } else {
        toast.error('Failed to cancel booking');
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error('Failed to cancel booking');
    }
  };

  const handleUpdateAvailability = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/admin/founder-calls/availability`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(availabilitySettings),
        }
      );

      if (response.ok) {
        toast.success('Availability settings updated');
        setShowAvailabilityModal(false);
      } else {
        toast.error('Failed to update availability');
      }
    } catch (error) {
      console.error('Error updating availability:', error);
      toast.error('Failed to update availability');
    }
  };

  const handleSendReminder = async (bookingId: string) => {
    try {
      toast.info('Sending reminder...');
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/admin/founder-calls/booking/${bookingId}/send-reminder`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        }
      );
      if (response.ok) {
        toast.success('Reminder sent');
      } else {
        const err = await response.json();
        toast.error(err.error || 'Failed to send reminder');
      }
    } catch (e) {
      toast.error('Failed to send reminder');
    }
  };

  const openConfirmationModal = (booking: Booking) => {
    setConfirmationData({
      bookingId: booking.id,
      zoomLink: booking.zoomLink || availabilitySettings.defaultMeetingLink || '',
      employeeId: booking.assignedEmployeeId || '',
    });
    setShowConfirmationModal(true);
  };

  const handleSendConfirmation = async () => {
    try {
      setSendingConfirmation(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/admin/founder-calls/booking/${confirmationData.bookingId}/send-confirmation`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            zoomLink: confirmationData.zoomLink,
            employeeId: confirmationData.employeeId,
          }),
        }
      );
      if (response.ok) {
        toast.success('Confirmation email sent');
        setShowConfirmationModal(false);
        fetchBookings(); // Refresh to show updated assignment
      } else {
        const err = await response.json();
        toast.error(err.error || 'Failed to send confirmation');
      }
    } catch (e) {
      toast.error('Failed to send confirmation');
    } finally {
      setSendingConfirmation(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'var(--success)';
      case 'pending_payment':
        return '#f59e0b';
      case 'cancelled':
        return 'var(--destructive)';
      case 'completed':
        return '#6c5ce7';
      default:
        return 'var(--muted-foreground)';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'var(--success-soft)';
      case 'pending_payment':
        return 'rgba(245, 158, 11, 0.1)';
      case 'cancelled':
        return 'var(--destructive-soft)';
      case 'completed':
        return 'rgba(108, 92, 231, 0.1)';
      default:
        return 'var(--muted)';
    }
  };

  const upcomingBookings = bookings.filter(b => 
    b.status === 'confirmed' && new Date(b.date) >= new Date()
  );
  const pendingBookings = bookings.filter(b => b.status === 'pending_payment');
  const completedBookings = bookings.filter(b => b.status === 'completed' || b.status === 'cancelled');

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Calendar helper functions
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const formatDateString = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days = [];

    // Add empty cells for days before the first day
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const toggleBlockedDate = (dateStr: string) => {
    const dayOfWeek = new Date(dateStr + 'T00:00:00').getDay();
    const defaultSlots = availabilitySettings.weeklySchedule[dayOfWeek] || [];
    
    setAvailabilitySettings({
      ...availabilitySettings,
      dateOverrides: {
        ...availabilitySettings.dateOverrides,
        [dateStr]: availabilitySettings.dateOverrides[dateStr] !== undefined 
          ? (availabilitySettings.dateOverrides[dateStr].length === 0 ? defaultSlots : [])
          : [],
      },
    });
  };

  const isDateBooked = (dateStr: string) => {
    return bookings.some(b => 
      b.date === dateStr && (b.status === 'confirmed' || b.status === 'pending_payment')
    );
  };

  const isPastDate = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div 
        className="border-b border-border"
        style={{ padding: 'var(--spacing-6)' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 
              className="text-foreground"
              style={{ 
                fontSize: '1.5rem',
                fontWeight: 'var(--font-weight-bold)',
                marginBottom: 'var(--spacing-1)',
              }}
            >
              Founder Calls
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage $99 Founder Setup Call bookings and availability (All times in CST/America/Chicago)
            </p>
          </div>

          <button
            onClick={() => setShowAvailabilityModal(true)}
            className="flex items-center gap-[var(--spacing-2)] px-[var(--spacing-4)] py-[var(--spacing-2)] bg-primary text-white rounded-[var(--radius-lg)] hover:opacity-90 transition-opacity"
          >
            <Settings className="size-4" />
            Availability Settings
          </button>
        </div>

        {/* Tabs */}
        <div 
          className="flex items-center gap-[var(--spacing-2)] mt-[var(--spacing-4)]"
        >
          <button
            onClick={() => setActiveTab('bookings')}
            className="px-[var(--spacing-4)] py-[var(--spacing-2)] rounded-[var(--radius-lg)] transition-colors"
            style={{
              background: activeTab === 'bookings' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'bookings' ? 'white' : 'var(--muted-foreground)',
            }}
          >
            All Bookings ({bookings.length})
          </button>
          <button
            onClick={() => setActiveTab('availability')}
            className="px-[var(--spacing-4)] py-[var(--spacing-2)] rounded-[var(--radius-lg)] transition-colors"
            style={{
              background: activeTab === 'availability' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'availability' ? 'white' : 'var(--muted-foreground)',
            }}
          >
            Upcoming ({upcomingBookings.length})
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className="px-[var(--spacing-4)] py-[var(--spacing-2)] rounded-[var(--radius-lg)] transition-colors"
            style={{
              background: activeTab === 'team' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'team' ? 'white' : 'var(--muted-foreground)',
            }}
          >
            Team Management
          </button>
        </div>
      </div>

      {/* Stats */}
      <div 
        className="border-b border-border"
        style={{ padding: 'var(--spacing-6)' }}
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-[var(--spacing-4)]">
          <div
            style={{
              padding: 'var(--spacing-4)',
              borderRadius: 'var(--radius-xl)',
              background: 'var(--card)',
              border: '1px solid var(--border)',
            }}
          >
            <div className="flex items-center justify-between mb-[var(--spacing-2)]">
              <span className="text-sm text-muted-foreground">Upcoming</span>
              <Calendar className="size-4 text-primary" />
            </div>
            <p 
              className="text-foreground"
              style={{ 
                fontSize: '1.75rem',
                fontWeight: 'var(--font-weight-bold)',
              }}
            >
              {upcomingBookings.length}
            </p>
          </div>

          <div
            style={{
              padding: 'var(--spacing-4)',
              borderRadius: 'var(--radius-xl)',
              background: 'var(--card)',
              border: '1px solid var(--border)',
            }}
          >
            <div className="flex items-center justify-between mb-[var(--spacing-2)]">
              <span className="text-sm text-muted-foreground">Pending Payment</span>
              <AlertCircle className="size-4" style={{ color: '#f59e0b' }} />
            </div>
            <p 
              className="text-foreground"
              style={{ 
                fontSize: '1.75rem',
                fontWeight: 'var(--font-weight-bold)',
              }}
            >
              {pendingBookings.length}
            </p>
          </div>

          <div
            style={{
              padding: 'var(--spacing-4)',
              borderRadius: 'var(--radius-xl)',
              background: 'var(--card)',
              border: '1px solid var(--border)',
            }}
          >
            <div className="flex items-center justify-between mb-[var(--spacing-2)]">
              <span className="text-sm text-muted-foreground">Completed</span>
              <Check className="size-4 text-success" />
            </div>
            <p 
              className="text-foreground"
              style={{ 
                fontSize: '1.75rem',
                fontWeight: 'var(--font-weight-bold)',
              }}
            >
              {completedBookings.length}
            </p>
          </div>

          <div
            style={{
              padding: 'var(--spacing-4)',
              borderRadius: 'var(--radius-xl)',
              background: 'var(--card)',
              border: '1px solid var(--border)',
            }}
          >
            <div className="flex items-center justify-between mb-[var(--spacing-2)]">
              <span className="text-sm text-muted-foreground">Revenue</span>
              <DollarSign className="size-4 text-success" />
            </div>
            <p 
              className="text-foreground"
              style={{ 
                fontSize: '1.75rem',
                fontWeight: 'var(--font-weight-bold)',
              }}
            >
              ${bookings.filter(b => b.status === 'confirmed' || b.status === 'completed').length * 99}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div 
        className="flex-1 overflow-auto"
        style={{ padding: 'var(--spacing-6)' }}
      >
        {activeTab === 'team' ? (
          <TeamManagement onUpdate={fetchEmployees} />
        ) : (
          loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading bookings...</div>
          </div>
        ) : bookings.length === 0 ? (
          <div 
            className="flex flex-col items-center justify-center h-64"
            style={{
              borderRadius: 'var(--radius-xl)',
              background: 'var(--muted)',
            }}
          >
            <Calendar className="size-12 text-muted-foreground mb-[var(--spacing-4)]" />
            <p className="text-muted-foreground">No bookings yet</p>
          </div>
        ) : (
          <div className="space-y-[var(--spacing-3)]">
            {(activeTab === 'bookings' ? bookings : upcomingBookings).map((booking) => (
              <div
                key={booking.id}
                style={{
                  padding: 'var(--spacing-4)',
                  borderRadius: 'var(--radius-xl)',
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-[var(--spacing-3)] mb-[var(--spacing-2)]">
                      <h3 className="text-foreground" style={{ fontWeight: 'var(--font-weight-semibold)' }}>
                        {booking.name}
                      </h3>
                      <div
                        className="px-[var(--spacing-2)] py-[var(--spacing-1)] rounded-[var(--radius-full)] text-xs"
                        style={{
                          background: getStatusBg(booking.status),
                          color: getStatusColor(booking.status),
                        }}
                      >
                        {booking.status.replace('_', ' ')}
                      </div>
                      <div
                        className="px-[var(--spacing-2)] py-[var(--spacing-1)] rounded-[var(--radius-full)] text-xs border border-border"
                        style={{
                          background: 'var(--muted)',
                          color: 'var(--muted-foreground)',
                        }}
                      >
                        {booking.bookingType === 'task_automation' ? 'Task Automation' : 'Founder Call'}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-[var(--spacing-2)] text-sm text-muted-foreground mb-[var(--spacing-3)]">
                      <div className="flex items-center gap-[var(--spacing-2)]">
                        <Calendar className="size-4" />
                        {new Date(booking.date).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          month: 'long', 
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                      <div className="flex items-center gap-[var(--spacing-2)]">
                        <Clock className="size-4" />
                        {booking.time}
                      </div>
                      <div className="flex items-center gap-[var(--spacing-2)]">
                        <Mail className="size-4" />
                        {booking.email}
                      </div>
                      {booking.phone && (
                        <div className="flex items-center gap-[var(--spacing-2)]">
                          <Phone className="size-4" />
                          {booking.phone}
                        </div>
                      )}
                    </div>

                    {booking.businessStage && (
                      <div className="text-sm text-muted-foreground mb-[var(--spacing-2)]">
                        <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>Stage:</span> {booking.businessStage}
                      </div>
                    )}

                    {booking.mainChallenge && (
                      <div 
                        className="text-sm text-muted-foreground"
                        style={{
                          padding: 'var(--spacing-3)',
                          borderRadius: 'var(--radius-lg)',
                          background: 'var(--muted)',
                          marginTop: 'var(--spacing-2)',
                        }}
                      >
                        <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>Challenge:</span> {booking.mainChallenge}
                      </div>
                    )}

                    {booking.zoomLink && (
                      <div className="flex items-center gap-[var(--spacing-2)] mt-[var(--spacing-3)]">
                        <Video className="size-4 text-primary" />
                        <a 
                          href={booking.zoomLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline"
                        >
                          Join Meeting
                        </a>
                      </div>
                    )}
                  </div>

                    <div className="flex items-center gap-[var(--spacing-2)]">
                      <button
                        onClick={() => openConfirmationModal(booking)}
                        className="p-[var(--spacing-2)] hover:bg-muted rounded-[var(--radius-md)] transition-colors"
                        title="Resend Confirmation Email"
                      >
                        <Send className="size-4 text-primary" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedBooking(booking);
                          setEditForm(booking);
                          setShowEditModal(true);
                        }}
                        className="p-[var(--spacing-2)] hover:bg-muted rounded-[var(--radius-md)] transition-colors"
                      >
                        <Edit2 className="size-4 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => handleCancelBooking(booking.id)}
                        className="p-[var(--spacing-2)] hover:bg-destructive-soft rounded-[var(--radius-md)] transition-colors"
                        disabled={booking.status === 'cancelled'}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </button>
                    </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Edit Booking Modal */}
      {showEditModal && selectedBooking && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: 'rgba(0, 0, 0, 0.5)' }}
          onClick={() => setShowEditModal(false)}
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] overflow-auto"
            style={{
              margin: 'var(--spacing-4)',
              padding: 'var(--spacing-6)',
              borderRadius: 'var(--radius-xl)',
              background: 'var(--background)',
              border: '1px solid var(--border)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-[var(--spacing-6)]">
              <h2 
                className="text-foreground"
                style={{ 
                  fontSize: '1.25rem',
                  fontWeight: 'var(--font-weight-bold)',
                }}
              >
                Edit Booking
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-[var(--spacing-2)] hover:bg-muted rounded-[var(--radius-md)] transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-[var(--spacing-4)]">
              <div>
                <label className="block text-sm text-foreground mb-[var(--spacing-2)]">
                  Status
                </label>
                <select
                  value={editForm.status || selectedBooking.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                  className="w-full px-[var(--spacing-3)] py-[var(--spacing-2)] bg-background border border-border rounded-[var(--radius-lg)] text-foreground"
                >
                  <option value="pending_payment">Pending Payment</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-foreground mb-[var(--spacing-2)]">
                  Meeting Link (Teams/Zoom)
                </label>
                <input
                  type="url"
                  value={editForm.zoomLink || selectedBooking.zoomLink || ''}
                  onChange={(e) => setEditForm({ ...editForm, zoomLink: e.target.value })}
                  className="w-full px-[var(--spacing-3)] py-[var(--spacing-2)] bg-background border border-border rounded-[var(--radius-lg)] text-foreground"
                  placeholder="https://teams.microsoft.com/..."
                />
              </div>

              <div>
                <label className="block text-sm text-foreground mb-[var(--spacing-2)]">
                  Name
                </label>
                <input
                  type="text"
                  value={editForm.name || selectedBooking.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-[var(--spacing-3)] py-[var(--spacing-2)] bg-background border border-border rounded-[var(--radius-lg)] text-foreground"
                />
              </div>

              <div>
                <label className="block text-sm text-foreground mb-[var(--spacing-2)]">
                  Email
                </label>
                <input
                  type="email"
                  value={editForm.email || selectedBooking.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-[var(--spacing-3)] py-[var(--spacing-2)] bg-background border border-border rounded-[var(--radius-lg)] text-foreground"
                />
              </div>

              <div>
                <label className="block text-sm text-foreground mb-[var(--spacing-2)]">
                  Phone
                </label>
                <input
                  type="tel"
                  value={editForm.phone || selectedBooking.phone || ''}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-[var(--spacing-3)] py-[var(--spacing-2)] bg-background border border-border rounded-[var(--radius-lg)] text-foreground"
                />
              </div>

              <div className="flex items-center gap-[var(--spacing-3)] pt-[var(--spacing-4)] border-t border-border">
                <button
                  onClick={handleEditBooking}
                  className="flex-1 px-[var(--spacing-4)] py-[var(--spacing-3)] bg-primary text-white rounded-[var(--radius-lg)] hover:opacity-90 transition-opacity"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-[var(--spacing-4)] py-[var(--spacing-3)] bg-muted text-foreground rounded-[var(--radius-lg)] hover:bg-muted/80 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmationModal && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: 'rgba(0, 0, 0, 0.5)' }}
          onClick={() => setShowConfirmationModal(false)}
        >
          <div
            className="w-full max-w-lg"
            style={{
              margin: 'var(--spacing-4)',
              padding: 'var(--spacing-6)',
              borderRadius: 'var(--radius-xl)',
              background: 'var(--background)',
              border: '1px solid var(--border)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-[var(--spacing-6)]">
              <h2 className="text-xl font-bold text-foreground">Send Confirmation</h2>
              <button onClick={() => setShowConfirmationModal(false)} className="p-2 hover:bg-muted rounded-md">
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-[var(--spacing-4)]">
              <div>
                <label className="block text-sm font-medium mb-[var(--spacing-2)] text-foreground">
                  Meeting Link
                </label>
                <input
                  type="url"
                  value={confirmationData.zoomLink}
                  onChange={(e) => setConfirmationData({ ...confirmationData, zoomLink: e.target.value })}
                  className="w-full px-[var(--spacing-3)] py-[var(--spacing-2)] bg-background border border-border rounded-[var(--radius-lg)] text-foreground"
                  placeholder="https://teams.microsoft.com/..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-[var(--spacing-2)] text-foreground">
                  Assigned Host/Salesperson
                </label>
                <select
                  value={confirmationData.employeeId}
                  onChange={(e) => setConfirmationData({ ...confirmationData, employeeId: e.target.value })}
                  className="w-full px-[var(--spacing-3)] py-[var(--spacing-2)] bg-background border border-border rounded-[var(--radius-lg)] text-foreground"
                >
                  <option value="">Select a team member...</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.role})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  The email will be personalized with this host's name if selected.
                </p>
              </div>

              <div className="flex gap-[var(--spacing-3)] pt-[var(--spacing-4)]">
                <button
                  onClick={() => setShowConfirmationModal(false)}
                  className="flex-1 px-[var(--spacing-4)] py-[var(--spacing-3)] bg-muted text-foreground rounded-[var(--radius-lg)] hover:bg-muted/80"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendConfirmation}
                  disabled={sendingConfirmation}
                  className="flex-1 flex items-center justify-center gap-[var(--spacing-2)] px-[var(--spacing-4)] py-[var(--spacing-3)] bg-primary text-white rounded-[var(--radius-lg)] hover:opacity-90 disabled:opacity-50"
                >
                  {sendingConfirmation ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="size-4" />
                      Send Email
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Availability Settings Modal */}
      {showAvailabilityModal && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: 'rgba(0, 0, 0, 0.5)' }}
          onClick={() => setShowAvailabilityModal(false)}
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] overflow-auto"
            style={{
              margin: 'var(--spacing-4)',
              padding: 'var(--spacing-6)',
              borderRadius: 'var(--radius-xl)',
              background: 'var(--background)',
              border: '1px solid var(--border)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-[var(--spacing-6)]">
              <h2 
                className="text-foreground"
                style={{ 
                  fontSize: '1.25rem',
                  fontWeight: 'var(--font-weight-bold)',
                }}
              >
                Availability Settings
              </h2>
              <button
                onClick={() => setShowAvailabilityModal(false)}
                className="p-[var(--spacing-2)] hover:bg-muted rounded-[var(--radius-md)] transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-[var(--spacing-6)]">
              {/* Microsoft Teams / Meeting Configuration */}
              <div>
                <label className="block text-sm font-medium mb-[var(--spacing-2)] text-foreground">Microsoft Teams / Default Meeting Link</label>
                <input
                  type="url"
                  // @ts-ignore
                  value={availabilitySettings.defaultMeetingLink || ''}
                  onChange={(e) => setAvailabilitySettings({ ...availabilitySettings, defaultMeetingLink: e.target.value })}
                  className="w-full px-[var(--spacing-3)] py-[var(--spacing-2)] bg-background border border-border rounded-[var(--radius-lg)] text-foreground"
                  placeholder="e.g. https://teams.microsoft.com/..."
                />
                <p className="text-xs text-muted-foreground mt-1">This link will be automatically included in confirmation emails and calendar invites.</p>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-[var(--spacing-2)] mb-[var(--spacing-4)] border-b border-border pb-[var(--spacing-4)]">
                <button
                  onClick={() => setAvailabilityTab('weekly')}
                  className="px-[var(--spacing-4)] py-[var(--spacing-2)] rounded-[var(--radius-lg)] transition-colors text-sm"
                  style={{
                    background: availabilityTab === 'weekly' ? 'var(--primary)' : 'var(--muted)',
                    color: availabilityTab === 'weekly' ? 'white' : 'var(--muted-foreground)',
                  }}
                >
                  Weekly Schedule
                </button>
                <button
                  onClick={() => setAvailabilityTab('calendar')}
                  className="px-[var(--spacing-4)] py-[var(--spacing-2)] rounded-[var(--radius-lg)] transition-colors text-sm"
                  style={{
                    background: availabilityTab === 'calendar' ? 'var(--primary)' : 'var(--muted)',
                    color: availabilityTab === 'calendar' ? 'white' : 'var(--muted-foreground)',
                  }}
                >
                  Calendar & Overrides
                </button>
              </div>

              {/* Weekly Schedule Tab */}
              {availabilityTab === 'weekly' && (
                <>
                  <AvailabilityEditor 
                    availabilitySettings={availabilitySettings}
                    onUpdate={setAvailabilitySettings}
                  />

                  {/* Timezone */}
                  <div>
                    <label className="block text-sm text-foreground mb-[var(--spacing-2)]">
                      Timezone
                    </label>
                    <select
                      value={availabilitySettings.timezone}
                      onChange={(e) => setAvailabilitySettings({ ...availabilitySettings, timezone: e.target.value })}
                      className="w-full px-[var(--spacing-3)] py-[var(--spacing-2)] bg-background border border-border rounded-[var(--radius-lg)] text-foreground"
                    >
                      <option value="America/Los_Angeles">Pacific Time (PT)</option>
                      <option value="America/Denver">Mountain Time (MT)</option>
                      <option value="America/Chicago">Central Time (CT)</option>
                      <option value="America/New_York">Eastern Time (ET)</option>
                      <option value="UTC">UTC</option>
                    </select>
                  </div>
                </>
              )}

              {/* Calendar Tab */}
              {availabilityTab === 'calendar' && (
                <div>
                  {/* Month Navigation */}
                  <div 
                    className="flex items-center justify-between mb-[var(--spacing-3)]"
                    style={{
                      padding: 'var(--spacing-3)',
                      borderRadius: 'var(--radius-lg)',
                      background: 'var(--muted)',
                    }}
                  >
                    <button
                      onClick={() => navigateMonth('prev')}
                      className="p-[var(--spacing-2)] hover:bg-background rounded-[var(--radius-md)] transition-colors"
                    >
                      <ChevronLeft className="size-5 text-foreground" />
                    </button>
                    <span 
                      className="text-foreground"
                      style={{ fontWeight: 'var(--font-weight-semibold)' }}
                    >
                      {monthNames[currentMonth]} {currentYear}
                    </span>
                    <button
                      onClick={() => navigateMonth('next')}
                      className="p-[var(--spacing-2)] hover:bg-background rounded-[var(--radius-md)] transition-colors"
                    >
                      <ChevronRight className="size-5 text-foreground" />
                    </button>
                  </div>

                  {/* Calendar Grid */}
                  <div
                    style={{
                      padding: 'var(--spacing-3)',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--border)',
                      background: 'var(--card)',
                    }}
                  >
                    {/* Day Headers */}
                    <div className="grid grid-cols-7 gap-[var(--spacing-1)] mb-[var(--spacing-2)]">
                      {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                        <div
                          key={day}
                          className="text-center text-xs text-muted-foreground"
                          style={{ 
                            padding: 'var(--spacing-2)',
                            fontWeight: 'var(--font-weight-semibold)',
                          }}
                        >
                          {day}
                        </div>
                      ))}
                    </div>

                    {/* Calendar Days */}
                    <div className="grid grid-cols-7 gap-[var(--spacing-1)]">
                      {generateCalendarDays().map((day, index) => {
                        if (day === null) {
                          return <div key={`empty-${index}`} />;
                        }

                        const dateStr = formatDateString(currentYear, currentMonth, day);
                        const isBlocked = availabilitySettings.dateOverrides[dateStr] ? availabilitySettings.dateOverrides[dateStr].length === 0 : false;
                        const isBooked = isDateBooked(dateStr);
                        const isPast = isPastDate(day);
                        const dayOfWeek = new Date(currentYear, currentMonth, day).getDay();
                        const isAvailableDay = availabilitySettings.weeklySchedule[dayOfWeek]?.length > 0;

                        return (
                          <button
                            key={day}
                            onClick={() => {
                              if (!isPast && !isBooked) {
                                toggleBlockedDate(dateStr);
                              }
                            }}
                            disabled={isPast || isBooked}
                            className="text-center text-sm transition-all hover:scale-105"
                            style={{
                              padding: 'var(--spacing-2)',
                              borderRadius: 'var(--radius-md)',
                              background: isBooked
                                ? 'var(--destructive-soft)'
                                : isBlocked
                                ? 'var(--muted)'
                                : isAvailableDay
                                ? 'var(--success-soft)'
                                : 'var(--background)',
                              color: isBooked
                                ? 'var(--destructive)'
                                : isBlocked
                                ? 'var(--muted-foreground)'
                                : isAvailableDay
                                ? 'var(--success)'
                                : 'var(--muted-foreground)',
                              opacity: isPast ? '0.3' : '1',
                              cursor: isPast || isBooked ? 'not-allowed' : 'pointer',
                              border: isBlocked ? '2px solid var(--border)' : isBooked ? '2px solid var(--destructive)' : 'none',
                              fontWeight: isBlocked || isBooked ? 'var(--font-weight-bold)' : 'normal',
                            }}
                            title={
                              isBooked
                                ? 'Has bookings'
                                : isBlocked
                                ? 'Blocked - click to unblock'
                                : isPast
                                ? 'Past date'
                                : isAvailableDay
                                ? 'Available - click to block'
                                : 'Not in available days'
                            }
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>

                    {/* Legend */}
                    <div 
                      className="grid grid-cols-2 gap-[var(--spacing-2)] mt-[var(--spacing-4)] pt-[var(--spacing-3)]"
                      style={{ borderTop: '1px solid var(--border)' }}
                    >
                      <div className="flex items-center gap-[var(--spacing-2)] text-xs">
                        <div
                          style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--success-soft)',
                            border: '1px solid var(--success)',
                          }}
                        />
                        <span className="text-muted-foreground">Available</span>
                      </div>
                      <div className="flex items-center gap-[var(--spacing-2)] text-xs">
                        <div
                          style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--muted)',
                            border: '2px solid var(--border)',
                          }}
                        />
                        <span className="text-muted-foreground">Blocked</span>
                      </div>
                      <div className="flex items-center gap-[var(--spacing-2)] text-xs">
                        <div
                          style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--destructive-soft)',
                            border: '2px solid var(--destructive)',
                          }}
                        />
                        <span className="text-muted-foreground">Has Bookings</span>
                      </div>
                      <div className="flex items-center gap-[var(--spacing-2)] text-xs">
                        <div
                          style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--background)',
                            opacity: '0.5',
                          }}
                        />
                        <span className="text-muted-foreground">Unavailable Day</span>
                      </div>
                    </div>
                  </div>

                  {/* Blocked Dates Summary */}
                  {Object.keys(availabilitySettings.dateOverrides || {}).filter(date => availabilitySettings.dateOverrides[date].length === 0).length > 0 && (
                    <div
                      className="mt-[var(--spacing-3)]"
                      style={{
                        padding: 'var(--spacing-3)',
                        borderRadius: 'var(--radius-lg)',
                        background: 'var(--muted)',
                      }}
                    >
                      <p className="text-xs text-muted-foreground mb-[var(--spacing-2)]">
                        Blocked Dates ({Object.keys(availabilitySettings.dateOverrides || {}).filter(date => availabilitySettings.dateOverrides[date].length === 0).length}):
                      </p>
                      <div className="flex flex-wrap gap-[var(--spacing-2)]">
                        {Object.keys(availabilitySettings.dateOverrides || {}).filter(date => availabilitySettings.dateOverrides[date].length === 0).slice(0, 10).map((date) => (
                          <div
                            key={date}
                            className="flex items-center gap-[var(--spacing-2)] px-[var(--spacing-2)] py-[var(--spacing-1)] text-xs rounded-[var(--radius-md)]"
                            style={{
                              background: 'var(--background)',
                              border: '1px solid var(--border)',
                            }}
                          >
                            <span className="text-foreground">
                              {new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                            <button
                              onClick={() => toggleBlockedDate(date)}
                              className="text-muted-foreground hover:text-destructive transition-colors"
                            >
                              <X className="size-3" />
                            </button>
                          </div>
                        ))}
                        {Object.keys(availabilitySettings.dateOverrides || {}).filter(date => availabilitySettings.dateOverrides[date].length === 0).length > 10 && (
                          <span className="text-xs text-muted-foreground px-[var(--spacing-2)]">
                            +{Object.keys(availabilitySettings.dateOverrides || {}).filter(date => availabilitySettings.dateOverrides[date].length === 0).length - 10} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-[var(--spacing-3)] pt-[var(--spacing-4)] border-t border-border">
              <button
                onClick={handleUpdateAvailability}
                className="flex-1 px-[var(--spacing-4)] py-[var(--spacing-3)] bg-primary text-white rounded-[var(--radius-lg)] hover:opacity-90 transition-opacity"
              >
                Save Settings
              </button>
              <button
                onClick={() => setShowAvailabilityModal(false)}
                className="px-[var(--spacing-4)] py-[var(--spacing-3)] bg-muted text-foreground rounded-[var(--radius-lg)] hover:bg-muted/80 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}