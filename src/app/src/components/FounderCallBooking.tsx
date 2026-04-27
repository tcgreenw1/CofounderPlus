/**
 * Founder Call Booking Page
 * Custom calendar booking system for $99 Founder Setup Calls
 * Uses design system CSS variables for consistent styling
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, ChevronLeft, ChevronRight, Check, Video, Globe } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { format, parseISO, addMonths, subMonths } from 'date-fns';
import { formatInTimeZone, toDate } from 'date-fns-tz';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { POPULAR_TIMEZONES, getUserTimezone, ADMIN_TIMEZONE } from '../utils/timezones';

interface TimeSlot {
  time: string;
  available: boolean;
}

interface AvailableDate {
  date: string;
  slots: TimeSlot[];
}

export function FounderCallBooking() {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null); // Admin/CST Date string
  const [selectedTime, setSelectedTime] = useState<string | null>(null); // Admin/CST Time string
  const [userSelectedSlot, setUserSelectedSlot] = useState<{ date: string; time: string; fullDate: Date } | null>(null); // User's local time details
  
  const [availableDates, setAvailableDates] = useState<AvailableDate[]>([]); // These are in Admin/CST
  const [loading, setLoading] = useState(true);
  const [bookingStep, setBookingStep] = useState<'date' | 'time' | 'details'>('date');
  const [isProcessing, setIsProcessing] = useState(false);
  const [userTimezone, setUserTimezone] = useState<string>(getUserTimezone());
  
  // Computed state for display
  const [displayDates, setDisplayDates] = useState<{ [date: string]: TimeSlot[] }>({});
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    businessStage: '',
    mainChallenge: '',
  });

  // Fetch available dates from backend
  useEffect(() => {
    fetchAvailableDates();
  }, [currentMonth]);

  // Process available dates when data or timezone changes
  useEffect(() => {
    if (availableDates.length === 0) return;

    // Convert Admin CST slots to User Timezone
    const processed: { [date: string]: TimeSlot[] } = {};

    availableDates.forEach(dateObj => {
      // Admin Date: YYYY-MM-DD (CST)
      dateObj.slots.forEach(slot => {
        if (!slot.available) return;

        // Admin Time: "9:00 AM" (CST)
        // Construct ISO string for Chicago time
        // "2023-10-27" + " " + "9:00 AM"
        const [y, m, d] = dateObj.date.split('-').map(Number);
        const [timePart, meridiem] = slot.time.split(' ');
        let [h, min] = timePart.split(':').map(Number);
        
        if (meridiem === 'PM' && h !== 12) h += 12;
        if (meridiem === 'AM' && h === 12) h = 0;
        
        const isoLocal = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}T${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}:00`;
        
        // Convert to Date object (UTC) knowing it is currently in Admin Zone
        const utcDate = toDate(isoLocal, { timeZone: ADMIN_TIMEZONE });
        
        // Get User's local date string YYYY-MM-DD
        const userDateStr = formatInTimeZone(utcDate, userTimezone, 'yyyy-MM-dd');
        
        // Get User's local time string h:mm a
        const userTimeStr = formatInTimeZone(utcDate, userTimezone, 'h:mm a');

        if (!processed[userDateStr]) {
          processed[userDateStr] = [];
        }

        // Store the slot with BOTH User Display Time AND original Admin Reference (for booking)
        processed[userDateStr].push({
          time: userTimeStr,
          available: true,
          // We attach extra data to the slot object for handling clicks
          // @ts-ignore
          originalDate: dateObj.date,
          // @ts-ignore
          originalTime: slot.time,
          // @ts-ignore
          fullDate: utcDate
        });
      });
    });

    // Sort slots for each day
    Object.keys(processed).forEach(key => {
      processed[key].sort((a: any, b: any) => a.fullDate.getTime() - b.fullDate.getTime());
    });

    setDisplayDates(processed);
  }, [availableDates, userTimezone]);

  const fetchAvailableDates = async () => {
    try {
      setLoading(true);
      console.log('📅 Fetching availability for', currentMonth.getMonth(), currentMonth.getFullYear());
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/founder-calls/availability?month=${currentMonth.getMonth()}&year=${currentMonth.getFullYear()}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        console.log('📅 Received availability data:', data);
        setAvailableDates(data.availableDates || []);
      } else {
        const errorData = await response.json();
        console.error('❌ Failed to fetch availability:', errorData);
        toast.error('Failed to load available dates');
      }
    } catch (error) {
      console.error('❌ Failed to fetch availability:', error);
      toast.error('Failed to load available dates. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (date: string) => {
    // This 'date' is the User's local date string
    // We just select it for the UI state
    // The actual "Admin Date" is determined when a specific TIME slot is clicked
    setSelectedDate(date);
    setSelectedTime(null);
    setUserSelectedSlot(null);
    setBookingStep('time');
  };

  const handleTimeSelect = (slot: any) => {
    // slot contains originalDate and originalTime (Admin CST)
    // and time (User Local)
    setSelectedDate(slot.originalDate);
    setSelectedTime(slot.originalTime);
    
    // Store user's local selection for confirmation display
    setUserSelectedSlot({
      date: formatInTimeZone(slot.fullDate, userTimezone, 'yyyy-MM-dd'),
      time: slot.time,
      fullDate: slot.fullDate
    });
    
    setBookingStep('details');
  };

  const handleBooking = async () => {
    if (!selectedDate || !selectedTime) {
      toast.error('Please select a date and time');
      return;
    }

    if (!formData.name || !formData.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsProcessing(true);
      // Create booking
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/founder-calls/book`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            date: selectedDate, // Admin CST Date
            time: selectedTime, // Admin CST Time
            userTimezone,       // User's Timezone
            userDate: userSelectedSlot?.date, // User's Local Date
            userTime: userSelectedSlot?.time, // User's Local Time
            bookingType: 'founder_call', // Explicit booking type
            ...formData,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.message || 'Booking failed');
        return;
      }

      const data = await response.json();
      const bookingId = data.bookingId;

      // Create Stripe checkout session
      const checkoutResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/founder-calls/create-checkout`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ bookingId }),
        }
      );

      if (!checkoutResponse.ok) {
        const error = await checkoutResponse.json();
        toast.error(error.message || 'Failed to create checkout');
        return;
      }

      const checkoutData = await checkoutResponse.json();

      // Redirect to Stripe Checkout
      if (checkoutData.checkoutUrl) {
        window.location.href = checkoutData.checkoutUrl;
      } else {
        toast.error('Failed to redirect to payment');
      }
    } catch (error) {
      console.error('Booking error:', error);
      toast.error('Failed to complete booking');
    } finally {
      setIsProcessing(false);
    }
  };

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const getAvailableSlotsForDate = (date: string): TimeSlot[] => {
    // Return slots from our processed display dates (User Timezone)
    return displayDates[date] || [];
  };

  const isDateAvailable = (dateStr: string): boolean => {
    const slots = getAvailableSlotsForDate(dateStr);
    return slots.length > 0;
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Check if current view matches selected date (which might be in User Timezone now)
  // When converting timezones, the selected date logic needs to match the user's perspective
  const selectedSlots = selectedDate ? getAvailableSlotsForDate(userSelectedSlot ? userSelectedSlot.date : selectedDate) : [];
  // Note: selectedDate holds Admin Date usually, but for the UI calendar grid we click User Dates.
  // We need to clarify `selectedDate` state usage.
  // Let's refactor: `selectedDate` state in this component should represent the USER'S selected date string from the calendar grid.
  // The `handleTimeSelect` will extract the Admin Date from the slot.
  
  // REFACTOR: `selectedDate` state variable is acting as "Currently Viewing Date" in UI.
  // `handleDateSelect` sets it to the User's clicked date string.
  // `handleTimeSelect` sends the *Admin* date to the backend.
  // So `selectedSlots` should use `selectedDate` directly as it's the User Date key in `displayDates`.

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header 
        className="px-[var(--spacing-4)] py-[var(--spacing-4)] border-b border-border"
        style={{ background: 'var(--background)' }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate('/founder-setup-call')}
            className="flex items-center gap-[var(--spacing-2)] text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="size-4" />
            <span>Back</span>
          </button>
          <span 
            className="text-foreground"
            style={{ 
              fontSize: '1.25rem',
              fontWeight: 'var(--font-weight-bold)',
            }}
          >
            Book Your Call
          </span>
          <div style={{ width: '60px' }} /> {/* Spacer for alignment */}
        </div>
      </header>

      <div 
        className="max-w-5xl mx-auto"
        style={{ padding: 'var(--spacing-8) var(--spacing-4)' }}
      >
        {/* Timezone Selector */}
        <div className="mb-[var(--spacing-6)] flex justify-end">
          <div className="flex items-center gap-[var(--spacing-2)] bg-[var(--card)] border border-[var(--border)] px-[var(--spacing-3)] py-[var(--spacing-2)] rounded-[var(--radius-lg)] shadow-sm">
            <Globe className="size-4 text-muted-foreground" />
            <select
              value={userTimezone}
              onChange={(e) => {
                setUserTimezone(e.target.value);
                // Reset selection if timezone changes to avoid confusion
                setSelectedDate(null);
                setSelectedTime(null);
                setBookingStep('date');
              }}
              className="bg-transparent border-none text-sm text-foreground focus:outline-none cursor-pointer min-w-[200px]"
            >
              {POPULAR_TIMEZONES.map(tz => (
                <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
        </div>
        {/* Progress Steps */}
        <div 
          className="flex items-center justify-center gap-[var(--spacing-2)] mb-[var(--spacing-8)]"
        >
          <div className="flex items-center gap-[var(--spacing-2)]">
            <div
              className="flex items-center justify-center"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-full)',
                background: bookingStep === 'date' ? '#2b7fff' : 'var(--muted)',
                color: bookingStep === 'date' ? 'white' : 'var(--muted-foreground)',
              }}
            >
              {selectedDate ? <Check className="size-4" /> : '1'}
            </div>
            <span className="text-sm text-muted-foreground">Date</span>
          </div>
          
          <div style={{ width: '40px', height: '2px', background: 'var(--border)' }} />
          
          <div className="flex items-center gap-[var(--spacing-2)]">
            <div
              className="flex items-center justify-center"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-full)',
                background: bookingStep === 'time' ? '#2b7fff' : 'var(--muted)',
                color: bookingStep === 'time' ? 'white' : 'var(--muted-foreground)',
              }}
            >
              {selectedTime ? <Check className="size-4" /> : '2'}
            </div>
            <span className="text-sm text-muted-foreground">Time</span>
          </div>
          
          <div style={{ width: '40px', height: '2px', background: 'var(--border)' }} />
          
          <div className="flex items-center gap-[var(--spacing-2)]">
            <div
              className="flex items-center justify-center"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-full)',
                background: bookingStep === 'details' ? '#2b7fff' : 'var(--muted)',
                color: bookingStep === 'details' ? 'white' : 'var(--muted-foreground)',
              }}
            >
              3
            </div>
            <span className="text-sm text-muted-foreground">Details</span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-[var(--spacing-8)]">
          {/* Left Column - Calendar/Time Selection */}
          <div>
            {bookingStep === 'date' && (
              <div
                style={{
                  padding: 'var(--spacing-6)',
                  borderRadius: 'var(--radius-xl)',
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                }}
              >
                <div className="flex items-center justify-between mb-[var(--spacing-4)]">
                  <h2 className="text-foreground" style={{ fontSize: '1.25rem' }}>
                    Select a Date
                  </h2>
                  <div className="flex items-center gap-[var(--spacing-2)]">
                    <button
                      onClick={() => {
                        const newMonth = new Date(currentMonth);
                        newMonth.setMonth(newMonth.getMonth() - 1);
                        setCurrentMonth(newMonth);
                      }}
                      className="p-[var(--spacing-2)] hover:bg-muted rounded-[var(--radius-md)] transition-colors"
                    >
                      <ChevronLeft className="size-5" />
                    </button>
                    <span className="text-foreground min-w-[140px] text-center">
                      {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                    </span>
                    <button
                      onClick={() => {
                        const newMonth = new Date(currentMonth);
                        newMonth.setMonth(newMonth.getMonth() + 1);
                        setCurrentMonth(newMonth);
                      }}
                      className="p-[var(--spacing-2)] hover:bg-muted rounded-[var(--radius-md)] transition-colors"
                    >
                      <ChevronRight className="size-5" />
                    </button>
                  </div>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-[var(--spacing-1)]">
                  {dayNames.map(day => (
                    <div
                      key={day}
                      className="text-center text-xs text-muted-foreground"
                      style={{ padding: 'var(--spacing-2)' }}
                    >
                      {day}
                    </div>
                  ))}
                  
                  {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  
                  {loading ? (
                    <div 
                      className="col-span-7 flex items-center justify-center text-muted-foreground"
                      style={{ padding: 'var(--spacing-8)' }}
                    >
                      <div className="flex flex-col items-center gap-[var(--spacing-2)]">
                        <div 
                          className="animate-spin rounded-full border-4 border-muted border-t-primary"
                          style={{ width: '32px', height: '32px' }}
                        />
                        <span className="text-sm">Loading available dates...</span>
                      </div>
                    </div>
                  ) : (
                    Array.from({ length: daysInMonth }).map((_, i) => {
                      const day = i + 1;
                      const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                      const available = isDateAvailable(dateStr);
                      const isSelected = selectedDate === dateStr;
                      const isPast = new Date(dateStr) < new Date(new Date().setHours(0, 0, 0, 0));

                      return (
                        <button
                          key={day}
                          onClick={() => available && !isPast && handleDateSelect(dateStr)}
                          disabled={!available || isPast}
                          className="aspect-square flex items-center justify-center text-sm rounded-[var(--radius-md)] transition-all hover:scale-105"
                          style={{
                            background: isSelected 
                              ? '#2b7fff' 
                              : available && !isPast 
                              ? 'var(--muted)' 
                              : 'transparent',
                            color: isSelected 
                              ? 'white' 
                              : available && !isPast 
                              ? 'var(--foreground)' 
                              : 'var(--muted-foreground)',
                            cursor: available && !isPast ? 'pointer' : 'not-allowed',
                            opacity: isPast ? 0.4 : 1,
                          }}
                        >
                          {day}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {bookingStep === 'time' && selectedDate && (
              <div
                style={{
                  padding: 'var(--spacing-6)',
                  borderRadius: 'var(--radius-xl)',
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                }}
              >
                <div className="flex items-center gap-[var(--spacing-3)] mb-[var(--spacing-4)]">
                  <button
                    onClick={() => {
                      setBookingStep('date');
                      setSelectedTime(null);
                    }}
                    className="p-[var(--spacing-1)] hover:bg-muted rounded-[var(--radius-md)] transition-colors"
                  >
                    <ChevronLeft className="size-5" />
                  </button>
                  <div>
                    <h2 className="text-foreground" style={{ fontSize: '1.25rem' }}>
                      Select a Time
                    </h2>
                    <p className="text-sm text-muted-foreground">{selectedDate}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-[var(--spacing-2)]">
                  {selectedSlots.map((slot: any, index) => (
                    <button
                      key={`${slot.time}-${index}`}
                      onClick={() => slot.available && handleTimeSelect(slot)}
                      disabled={!slot.available}
                      className="flex items-center justify-center gap-[var(--spacing-2)] py-[var(--spacing-3)] rounded-[var(--radius-lg)] transition-all"
                      style={{
                        background: userSelectedSlot?.time === slot.time 
                          ? '#2b7fff' 
                          : slot.available 
                          ? 'var(--muted)' 
                          : 'transparent',
                        color: userSelectedSlot?.time === slot.time 
                          ? 'white' 
                          : slot.available 
                          ? 'var(--foreground)' 
                          : 'var(--muted-foreground)',
                        border: '1px solid',
                        borderColor: userSelectedSlot?.time === slot.time 
                          ? '#2b7fff' 
                          : slot.available 
                          ? 'var(--border)' 
                          : 'var(--border)',
                        cursor: slot.available ? 'pointer' : 'not-allowed',
                        opacity: slot.available ? 1 : 0.5,
                      }}
                    >
                      <Clock className="size-4" />
                      {slot.time}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {bookingStep === 'details' && (
              <div
                style={{
                  padding: 'var(--spacing-6)',
                  borderRadius: 'var(--radius-xl)',
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                }}
              >
                <div className="flex items-center gap-[var(--spacing-3)] mb-[var(--spacing-4)]">
                  <button
                    onClick={() => setBookingStep('time')}
                    className="p-[var(--spacing-1)] hover:bg-muted rounded-[var(--radius-md)] transition-colors"
                  >
                    <ChevronLeft className="size-5" />
                  </button>
                  <h2 className="text-foreground" style={{ fontSize: '1.25rem' }}>
                    Your Details
                  </h2>
                </div>

                <div className="space-y-[var(--spacing-4)]">
                  <div>
                    <label className="block text-sm text-foreground mb-[var(--spacing-2)]">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-[var(--spacing-3)] py-[var(--spacing-2)] bg-background border border-border rounded-[var(--radius-lg)] text-foreground"
                      placeholder="Your full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-foreground mb-[var(--spacing-2)]">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-[var(--spacing-3)] py-[var(--spacing-2)] bg-background border border-border rounded-[var(--radius-lg)] text-foreground"
                      placeholder="your@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-foreground mb-[var(--spacing-2)]">
                      Phone (optional)
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-[var(--spacing-3)] py-[var(--spacing-2)] bg-background border border-border rounded-[var(--radius-lg)] text-foreground"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-foreground mb-[var(--spacing-2)]">
                      Business Stage
                    </label>
                    <select
                      value={formData.businessStage}
                      onChange={(e) => setFormData({ ...formData, businessStage: e.target.value })}
                      className="w-full px-[var(--spacing-3)] py-[var(--spacing-2)] bg-background border border-border rounded-[var(--radius-lg)] text-foreground"
                    >
                      <option value="">Select stage</option>
                      <option value="idea">Idea Stage</option>
                      <option value="building">Building MVP</option>
                      <option value="launched">Launched</option>
                      <option value="growing">Growing</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-foreground mb-[var(--spacing-2)]">
                      Main Challenge (optional)
                    </label>
                    <textarea
                      value={formData.mainChallenge}
                      onChange={(e) => setFormData({ ...formData, mainChallenge: e.target.value })}
                      className="w-full px-[var(--spacing-3)] py-[var(--spacing-2)] bg-background border border-border rounded-[var(--radius-lg)] text-foreground resize-none"
                      rows={3}
                      placeholder="What's your biggest challenge right now?"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Summary */}
          <div>
            <div
              style={{
                padding: 'var(--spacing-6)',
                borderRadius: 'var(--radius-xl)',
                background: 'linear-gradient(135deg, rgba(43, 127, 255, 0.05) 0%, rgba(108, 92, 231, 0.05) 100%)',
                border: '1px solid rgba(43, 127, 255, 0.2)',
              }}
            >
              <h3 className="text-foreground mb-[var(--spacing-4)]" style={{ fontSize: '1.25rem' }}>
                Booking Summary
              </h3>

              <div className="space-y-[var(--spacing-4)]">
                <div 
                  className="flex items-start gap-[var(--spacing-3)]"
                  style={{
                    padding: 'var(--spacing-3)',
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--card)',
                  }}
                >
                  <Video className="size-5 text-primary mt-1" />
                  <div>
                    <p className="text-foreground" style={{ fontWeight: 'var(--font-weight-semibold)' }}>
                      Founder Setup Call
                    </p>
                    <p className="text-sm text-muted-foreground">60-minute working session</p>
                  </div>
                </div>

                {userSelectedSlot && (
                  <div 
                    className="flex items-start gap-[var(--spacing-3)]"
                    style={{
                      padding: 'var(--spacing-3)',
                      borderRadius: 'var(--radius-lg)',
                      background: 'var(--card)',
                    }}
                  >
                    <Calendar className="size-5 text-primary mt-1" />
                    <div>
                      <p className="text-foreground" style={{ fontWeight: 'var(--font-weight-semibold)' }}>
                        {new Date(userSelectedSlot.date).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {userSelectedSlot.time} ({userTimezone.replace(/_/g, ' ')})
                      </p>
                    </div>
                  </div>
                )}

                <div 
                  className="border-t border-border pt-[var(--spacing-4)] mt-[var(--spacing-4)]"
                >
                  <div className="flex items-center justify-between mb-[var(--spacing-2)]">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="text-foreground">$99.00</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-foreground" style={{ fontWeight: 'var(--font-weight-bold)' }}>
                      Total
                    </span>
                    <span 
                      className="text-foreground" 
                      style={{ 
                        fontSize: '1.5rem',
                        fontWeight: 'var(--font-weight-bold)' 
                      }}
                    >
                      $99
                    </span>
                  </div>
                </div>

                {bookingStep === 'details' && (
                  <button
                    onClick={handleBooking}
                    className="w-full text-white py-[var(--spacing-3)] rounded-[var(--radius-lg)] transition-all hover:opacity-90"
                    style={{
                      background: 'linear-gradient(135deg, #2b7fff 0%, #1e5dd9 100%)',
                      fontSize: '1.125rem',
                      fontWeight: 'var(--font-weight-semibold)',
                    }}
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Processing...' : 'Complete Booking & Pay'}
                  </button>
                )}

                <div 
                  className="text-xs text-muted-foreground"
                  style={{
                    padding: 'var(--spacing-3)',
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--muted)',
                  }}
                >
                  <p className="mb-[var(--spacing-2)]">
                    ✓ You'll receive a Microsoft Teams link via email
                  </p>
                  <p className="mb-[var(--spacing-2)]">
                    ✓ Calendar invite will be sent
                  </p>
                  <p>
                    ✓ Reschedule up to 24h before
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {isProcessing && (
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
          }}
        >
          <div
            className="flex flex-col items-center gap-[var(--spacing-4)]"
            style={{
              padding: 'var(--spacing-8)',
              borderRadius: 'var(--radius-2xl)',
              background: 'var(--card)',
              border: '1px solid var(--border)',
              minWidth: '320px',
            }}
          >
            <div
              className="animate-spin rounded-full border-4"
              style={{ 
                width: '48px', 
                height: '48px', 
                borderColor: 'var(--muted)', 
                borderTopColor: '#2b7fff', 
              }}
            />
            <div className="text-center">
              <p
                className="text-foreground mb-[var(--spacing-1)]"
                style={{ 
                  fontSize: '1.125rem', 
                  fontWeight: 'var(--font-weight-semibold)', 
                }}
              >
                Processing Your Booking
              </p>
              <p className="text-sm text-muted-foreground">
                Preparing your checkout session...
              </p>
            </div>
            <div
              className="w-full bg-muted rounded-full overflow-hidden"
              style={{ height: '4px' }}
            >
              <div
                className="h-full animate-pulse"
                style={{ 
                  background: 'linear-gradient(90deg, #2b7fff 0%, #6c5ce7 100%)', 
                  width: '70%', 
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}