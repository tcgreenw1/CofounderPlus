/**
 * Booking Confirmation Page
 * Shows after successful Stripe payment for founder call booking
 */

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Calendar, Clock, Mail, Video, ArrowRight, Loader2, RefreshCw, X } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface Booking {
  id: string;
  date: string;
  time: string;
  name: string;
  email: string;
  phone: string;
  businessStage: string;
  mainChallenge: string;
  status: string;
  zoomLink?: string;
  stripeCheckoutSessionId?: string;
  rescheduled?: boolean;
  rescheduledAt?: string;
}

interface AvailabilityDate {
  date: string;
  slots: Array<{ time: string; available: boolean }>;
}

export function BookingConfirmation() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
  const [availability, setAvailability] = useState<AvailabilityDate[]>([]);
  const [selectedNewDate, setSelectedNewDate] = useState('');
  const [selectedNewTime, setSelectedNewTime] = useState('');
  const [canReschedule, setCanReschedule] = useState(false);
  const [hoursUntilCall, setHoursUntilCall] = useState(0);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (bookingId) {
      fetchBookingAndVerifyPayment();
    }
  }, [bookingId, sessionId]);

  const fetchBookingAndVerifyPayment = async () => {
    try {
      setLoading(true);

      // Fetch booking details
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/founder-calls/booking/${bookingId}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setBooking(data.booking);

        // If payment is still pending and we have a session ID, update it
        if (data.booking.status === 'pending_payment' && sessionId) {
          // Payment was successful (user was redirected here), mark as confirmed
          await updatePaymentStatus('confirmed');
        }
      } else {
        toast.error('Failed to load booking details');
      }
    } catch (error) {
      console.error('Failed to fetch booking:', error);
      toast.error('Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };

  const updatePaymentStatus = async (status: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/founder-calls/booking/${bookingId}/payment`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentIntentId: sessionId,
            status: 'succeeded',
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setBooking(data.booking);
      }
    } catch (error) {
      console.error('Failed to update payment status:', error);
    }
  };

  const fetchAvailability = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/founder-calls/availability`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAvailability(data.availability);
      } else {
        toast.error('Failed to load availability');
      }
    } catch (error) {
      console.error('Failed to fetch availability:', error);
      toast.error('Failed to load availability');
    }
  };

  const rescheduleBooking = async () => {
    try {
      setRescheduling(true);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/founder-calls/booking/${bookingId}/reschedule`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            newDate: selectedNewDate,
            newTime: selectedNewTime,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setBooking(data.booking);
        setShowRescheduleModal(false);
        toast.success('Booking rescheduled successfully! Check your email for updated calendar invite.');
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to reschedule booking');
      }
    } catch (error) {
      console.error('Failed to reschedule booking:', error);
      toast.error('Failed to reschedule booking');
    } finally {
      setRescheduling(false);
    }
  };

  const checkRescheduleEligibility = () => {
    if (booking) {
      const callDate = new Date(booking.date);
      const now = new Date();
      const hoursDifference = (callDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      setHoursUntilCall(hoursDifference);

      if (hoursDifference > 24) {
        setCanReschedule(true);
      } else {
        setCanReschedule(false);
      }
    }
  };

  useEffect(() => {
    if (booking) {
      checkRescheduleEligibility();
    }
  }, [booking]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-[var(--spacing-4)]">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your booking...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div 
          className="max-w-md w-full mx-auto text-center"
          style={{ padding: 'var(--spacing-6)' }}
        >
          <h1 className="text-foreground mb-[var(--spacing-4)]" style={{ fontSize: '1.5rem' }}>
            Booking Not Found
          </h1>
          <p className="text-muted-foreground mb-[var(--spacing-6)]">
            We couldn't find this booking. Please check your email for confirmation details.
          </p>
          <button
            onClick={() => navigate('/founder-setup-call')}
            className="px-[var(--spacing-6)] py-[var(--spacing-3)] bg-primary text-white rounded-[var(--radius-lg)] hover:opacity-90 transition-opacity"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const isConfirmed = booking.status === 'confirmed' || sessionId;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header 
        className="px-[var(--spacing-4)] py-[var(--spacing-4)] border-b border-border"
        style={{ background: 'var(--background)' }}
      >
        <div className="max-w-7xl mx-auto">
          <span 
            className="text-foreground"
            style={{ 
              fontSize: '1.25rem',
              fontWeight: 'var(--font-weight-bold)',
            }}
          >
            Cofounder+
          </span>
        </div>
      </header>

      <div 
        className="max-w-3xl mx-auto"
        style={{ padding: 'var(--spacing-8) var(--spacing-4)' }}
      >
        {/* Success Icon */}
        <div className="text-center mb-[var(--spacing-8)]">
          <div 
            className="inline-flex items-center justify-center mb-[var(--spacing-4)]"
            style={{
              width: '80px',
              height: '80px',
              borderRadius: 'var(--radius-full)',
              background: isConfirmed ? 'var(--success-soft)' : 'var(--muted)',
            }}
          >
            <CheckCircle 
              className="size-10"
              style={{ color: isConfirmed ? 'var(--success)' : 'var(--muted-foreground)' }}
            />
          </div>
          <h1 
            className="text-foreground mb-[var(--spacing-2)]"
            style={{ 
              fontSize: '2rem',
              fontWeight: 'var(--font-weight-bold)',
            }}
          >
            {isConfirmed ? 'Booking Confirmed!' : 'Booking Created'}
          </h1>
          <p className="text-muted-foreground" style={{ fontSize: '1.125rem' }}>
            {isConfirmed 
              ? 'Your Founder Setup Call has been scheduled'
              : 'Complete payment to confirm your booking'}
          </p>
        </div>

        {/* Booking Details Card */}
        <div
          style={{
            padding: 'var(--spacing-6)',
            borderRadius: 'var(--radius-xl)',
            background: 'var(--card)',
            border: '1px solid var(--border)',
            marginBottom: 'var(--spacing-6)',
          }}
        >
          <h2 
            className="text-foreground mb-[var(--spacing-4)]"
            style={{ 
              fontSize: '1.25rem',
              fontWeight: 'var(--font-weight-semibold)',
            }}
          >
            Booking Details
          </h2>

          <div className="space-y-[var(--spacing-4)]">
            <div className="flex items-start gap-[var(--spacing-3)]">
              <Calendar className="size-5 text-primary mt-1" />
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="text-foreground" style={{ fontWeight: 'var(--font-weight-semibold)' }}>
                  {new Date(booking.date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-[var(--spacing-3)]">
              <Clock className="size-5 text-primary mt-1" />
              <div>
                <p className="text-sm text-muted-foreground">Time</p>
                <p className="text-foreground" style={{ fontWeight: 'var(--font-weight-semibold)' }}>
                  {booking.time}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-[var(--spacing-3)]">
              <Mail className="size-5 text-primary mt-1" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="text-foreground" style={{ fontWeight: 'var(--font-weight-semibold)' }}>
                  {booking.email}
                </p>
              </div>
            </div>

            {booking.zoomLink && (
              <div className="flex items-start gap-[var(--spacing-3)]">
                <Video className="size-5 text-primary mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Zoom Link</p>
                  <a 
                    href={booking.zoomLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                    style={{ fontWeight: 'var(--font-weight-semibold)' }}
                  >
                    Join Call
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Reschedule Section - Only show if confirmed and eligible */}
        {isConfirmed && booking.status !== 'cancelled' && (
          <div
            style={{
              padding: 'var(--spacing-4)',
              borderRadius: 'var(--radius-lg)',
              background: canReschedule ? 'var(--muted)' : 'var(--warning-soft)',
              border: `1px solid ${canReschedule ? 'var(--border)' : 'var(--warning)'}`,
              marginBottom: 'var(--spacing-6)',
            }}
          >
            <div className="flex items-start gap-[var(--spacing-3)]">
              <RefreshCw 
                className="size-5 mt-0.5" 
                style={{ color: canReschedule ? 'var(--muted-foreground)' : 'var(--warning)' }}
              />
              <div className="flex-1">
                <p 
                  className="text-sm mb-[var(--spacing-2)]"
                  style={{ 
                    color: canReschedule ? 'var(--foreground)' : 'var(--warning)',
                    fontWeight: 'var(--font-weight-semibold)',
                  }}
                >
                  {canReschedule ? 'Need to reschedule?' : 'Reschedule not available'}
                </p>
                <p className="text-sm text-muted-foreground mb-[var(--spacing-3)]">
                  {canReschedule 
                    ? 'You can reschedule your call up to 24 hours before the scheduled time.'
                    : `You cannot reschedule within 24 hours of your call (${Math.round(hoursUntilCall)} hours remaining). Please contact support@cofounderplus.com for assistance.`
                  }
                </p>
                {canReschedule && (
                  <button
                    onClick={() => {
                      setShowRescheduleModal(true);
                      fetchAvailability();
                    }}
                    className="flex items-center gap-[var(--spacing-2)] px-[var(--spacing-4)] py-[var(--spacing-2)] bg-foreground text-background rounded-[var(--radius-md)] hover:opacity-90 transition-opacity text-sm"
                    style={{ fontWeight: 'var(--font-weight-semibold)' }}
                  >
                    <RefreshCw className="size-4" />
                    Reschedule Call
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Next Steps */}
        <div
          style={{
            padding: 'var(--spacing-6)',
            borderRadius: 'var(--radius-xl)',
            background: 'linear-gradient(135deg, rgba(43, 127, 255, 0.05) 0%, rgba(108, 92, 231, 0.05) 100%)',
            border: '1px solid rgba(43, 127, 255, 0.2)',
            marginBottom: 'var(--spacing-6)',
          }}
        >
          <h3 
            className="text-foreground mb-[var(--spacing-4)]"
            style={{ 
              fontSize: '1.125rem',
              fontWeight: 'var(--font-weight-semibold)',
            }}
          >
            What's Next?
          </h3>

          <div className="space-y-[var(--spacing-3)]">
            <div className="flex items-start gap-[var(--spacing-3)]">
              <div
                className="flex-shrink-0 flex items-center justify-center"
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--success-soft)',
                }}
              >
                <span className="text-xs" style={{ color: 'var(--success)' }}>✓</span>
              </div>
              <p className="text-foreground">
                Check your email for a confirmation with calendar invite
              </p>
            </div>

            <div className="flex items-start gap-[var(--spacing-3)]">
              <div
                className="flex-shrink-0 flex items-center justify-center"
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--success-soft)',
                }}
              >
                <span className="text-xs" style={{ color: 'var(--success)' }}>✓</span>
              </div>
              <p className="text-foreground">
                Download and install the Cofounder+ app before the call
              </p>
            </div>

            <div className="flex items-start gap-[var(--spacing-3)]">
              <div
                className="flex-shrink-0 flex items-center justify-center"
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--success-soft)',
                }}
              >
                <span className="text-xs" style={{ color: 'var(--success)' }}>✓</span>
              </div>
              <p className="text-foreground">
                We'll send you a Zoom link 24 hours before the call
              </p>
            </div>

            <div className="flex items-start gap-[var(--spacing-3)]">
              <div
                className="flex-shrink-0 flex items-center justify-center"
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--success-soft)',
                }}
              >
                <span className="text-xs" style={{ color: 'var(--success)' }}>✓</span>
              </div>
              <p className="text-foreground">
                Be ready to work live—bring your laptop and questions
              </p>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-[var(--spacing-3)]">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex-1 flex items-center justify-center gap-[var(--spacing-2)] px-[var(--spacing-6)] py-[var(--spacing-3)] text-white rounded-[var(--radius-lg)] transition-opacity hover:opacity-90"
            style={{
              background: 'linear-gradient(135deg, #2b7fff 0%, #1e5dd9 100%)',
              fontWeight: 'var(--font-weight-semibold)',
            }}
          >
            Go to Dashboard
            <ArrowRight className="size-4" />
          </button>

          <button
            onClick={() => navigate('/founder-setup-call')}
            className="flex-1 px-[var(--spacing-6)] py-[var(--spacing-3)] bg-muted text-foreground rounded-[var(--radius-lg)] transition-colors hover:bg-muted/80"
            style={{ fontWeight: 'var(--font-weight-semibold)' }}
          >
            Back to Home
          </button>
        </div>

        {/* Support */}
        <div 
          className="text-center mt-[var(--spacing-8)]"
          style={{
            padding: 'var(--spacing-4)',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--muted)',
          }}
        >
          <p className="text-sm text-muted-foreground">
            Questions? Email us at{' '}
            <a 
              href="mailto:support@cofounderplus.com" 
              className="text-primary hover:underline"
            >
              support@cofounderplus.com
            </a>
          </p>
        </div>
      </div>

      {/* Reschedule Modal */}
      {showRescheduleModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0, 0, 0, 0.5)' }}
          onClick={() => setShowRescheduleModal(false)}
        >
          <div
            className="max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            style={{
              padding: 'var(--spacing-6)',
              borderRadius: 'var(--radius-xl)',
              background: 'var(--background)',
              border: '1px solid var(--border)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-[var(--spacing-6)]">
              <div>
                <h2 
                  className="text-foreground mb-[var(--spacing-1)]"
                  style={{ 
                    fontSize: '1.5rem',
                    fontWeight: 'var(--font-weight-bold)',
                  }}
                >
                  Reschedule Your Call
                </h2>
                <p className="text-sm text-muted-foreground">
                  Choose a new date and time for your Founder Setup Call
                </p>
              </div>
              <button
                onClick={() => setShowRescheduleModal(false)}
                className="p-[var(--spacing-2)] hover:bg-muted rounded-[var(--radius-md)] transition-colors"
              >
                <X className="size-5 text-muted-foreground" />
              </button>
            </div>

            {/* Current Booking Info */}
            <div
              className="mb-[var(--spacing-6)]"
              style={{
                padding: 'var(--spacing-4)',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--muted)',
              }}
            >
              <p className="text-sm text-muted-foreground mb-[var(--spacing-2)]">
                Current Booking
              </p>
              <p className="text-foreground" style={{ fontWeight: 'var(--font-weight-semibold)' }}>
                {new Date(booking.date).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric',
                  year: 'numeric',
                })} at {booking.time}
              </p>
            </div>

            {/* Date Selection */}
            <div className="mb-[var(--spacing-6)]">
              <label 
                className="block text-sm mb-[var(--spacing-2)] text-foreground"
                style={{ fontWeight: 'var(--font-weight-semibold)' }}
              >
                Select New Date
              </label>
              <div className="grid grid-cols-1 gap-[var(--spacing-2)] max-h-[200px] overflow-y-auto"
                style={{
                  padding: 'var(--spacing-2)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border)',
                }}
              >
                {availability.length === 0 ? (
                  <div className="text-center py-[var(--spacing-4)]">
                    <Loader2 className="size-6 animate-spin text-primary mx-auto mb-[var(--spacing-2)]" />
                    <p className="text-sm text-muted-foreground">Loading availability...</p>
                  </div>
                ) : (
                  availability.map((dateOption) => (
                    <button
                      key={dateOption.date}
                      onClick={() => {
                        setSelectedNewDate(dateOption.date);
                        setSelectedNewTime('');
                      }}
                      className="text-left px-[var(--spacing-3)] py-[var(--spacing-2)] rounded-[var(--radius-md)] transition-colors"
                      style={{
                        background: selectedNewDate === dateOption.date ? 'var(--primary)' : 'transparent',
                        color: selectedNewDate === dateOption.date ? 'white' : 'var(--foreground)',
                        border: `1px solid ${selectedNewDate === dateOption.date ? 'var(--primary)' : 'var(--border)'}`,
                      }}
                    >
                      {new Date(dateOption.date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        month: 'long', 
                        day: 'numeric',
                      })}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Time Selection */}
            {selectedNewDate && (
              <div className="mb-[var(--spacing-6)]">
                <label 
                  className="block text-sm mb-[var(--spacing-2)] text-foreground"
                  style={{ fontWeight: 'var(--font-weight-semibold)' }}
                >
                  Select New Time
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-[var(--spacing-2)]">
                  {availability
                    .find((d) => d.date === selectedNewDate)
                    ?.slots.filter((slot) => slot.available)
                    .map((slot) => (
                      <button
                        key={slot.time}
                        onClick={() => setSelectedNewTime(slot.time)}
                        className="px-[var(--spacing-3)] py-[var(--spacing-2)] rounded-[var(--radius-md)] transition-colors text-sm"
                        style={{
                          background: selectedNewTime === slot.time ? 'var(--primary)' : 'transparent',
                          color: selectedNewTime === slot.time ? 'white' : 'var(--foreground)',
                          border: `1px solid ${selectedNewTime === slot.time ? 'var(--primary)' : 'var(--border)'}`,
                          fontWeight: 'var(--font-weight-medium)',
                        }}
                      >
                        {slot.time}
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-[var(--spacing-3)]">
              <button
                onClick={() => setShowRescheduleModal(false)}
                className="flex-1 px-[var(--spacing-4)] py-[var(--spacing-3)] bg-muted text-foreground rounded-[var(--radius-lg)] hover:bg-muted/80 transition-colors"
                style={{ fontWeight: 'var(--font-weight-semibold)' }}
                disabled={rescheduling}
              >
                Cancel
              </button>
              <button
                onClick={rescheduleBooking}
                disabled={!selectedNewDate || !selectedNewTime || rescheduling}
                className="flex-1 flex items-center justify-center gap-[var(--spacing-2)] px-[var(--spacing-4)] py-[var(--spacing-3)] text-white rounded-[var(--radius-lg)] transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(135deg, #2b7fff 0%, #1e5dd9 100%)',
                  fontWeight: 'var(--font-weight-semibold)',
                }}
              >
                {rescheduling ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Rescheduling...
                  </>
                ) : (
                  <>
                    <RefreshCw className="size-4" />
                    Confirm Reschedule
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}