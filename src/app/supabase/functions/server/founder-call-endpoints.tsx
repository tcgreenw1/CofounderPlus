/**
 * Founder Call Booking Endpoints
 * Manages $99 Founder Setup Call bookings with admin portal integration
 */

import { Hono } from 'npm:hono';
import * as kv from './kv_cache.tsx';
import { createClient } from 'npm:@supabase/supabase-js@2.39.3';
import { sendBookingConfirmation, sendCallReminder, sendPreCheckoutEmail, sendPaymentCancelledEmail, sendNewBookingNotification } from './email-utils.tsx';
import { createTeamsMeeting } from './microsoft-graph.tsx';
import { toDate } from 'npm:date-fns-tz@2.0.0';

const app = new Hono();

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');

// Helper to generate booking ID
function generateBookingId(): string {
  return `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// GET /make-server-373d8b09/founder-calls/availability - Get available dates and times
app.get('/make-server-373d8b09/founder-calls/availability', async (c) => {
  try {
    const month = parseInt(c.req.query('month') || String(new Date().getMonth()));
    const year = parseInt(c.req.query('year') || String(new Date().getFullYear()));

    console.log(`📅 Fetching availability for ${year}-${month + 1}`);

    // Get admin's availability settings from KV store with sensible defaults
    const storedSettings = await kv.get('founder_call_availability');
    
    // Support both old and new format
    let availabilitySettings;
    if (storedSettings && storedSettings.weeklySchedule) {
      // New format with per-day schedules
      availabilitySettings = storedSettings;
    } else if (storedSettings && storedSettings.daysOfWeek) {
      // Old format - migrate to new format
      const weeklySchedule: { [key: number]: string[] } = {};
      storedSettings.daysOfWeek.forEach((day: number) => {
        weeklySchedule[day] = storedSettings.timeSlots;
      });
      availabilitySettings = {
        weeklySchedule,
        dateOverrides: {},
        timezone: storedSettings.timezone || 'America/Los_Angeles',
      };
      // Save migrated settings
      await kv.set('founder_call_availability', availabilitySettings);
    } else {
      // Default settings
      availabilitySettings = {
        weeklySchedule: {
          1: ['9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'],
          2: ['9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'],
          3: ['9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'],
          4: ['9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'],
          5: ['9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'],
        },
        dateOverrides: {},
        timezone: 'America/Chicago',
      };
      console.log('📅 Initializing default availability settings');
      await kv.set('founder_call_availability', availabilitySettings);
    }

    // Get all existing bookings for this month
    const bookingsPrefix = `founder_call_booking:${year}-${String(month + 1).padStart(2, '0')}`;
    const existingBookings = await kv.getByPrefix(bookingsPrefix);

    console.log(`📅 Found ${existingBookings.length} existing bookings for ${year}-${month + 1}`);

    // Generate available dates for the month
    const availableDates = [];
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      // Skip if date is in the past
      if (date < today) continue;
      
      // Check if there's a date-specific override
      let timeSlots;
      if (availabilitySettings.dateOverrides && availabilitySettings.dateOverrides[dateStr] !== undefined) {
        // Use date override (empty array means blocked)
        timeSlots = availabilitySettings.dateOverrides[dateStr];
      } else {
        // Use weekly schedule for this day of week
        const dayOfWeek = date.getDay();
        timeSlots = availabilitySettings.weeklySchedule[dayOfWeek] || [];
      }

      // Skip if no time slots (blocked day)
      if (timeSlots.length === 0) continue;

      // Check which time slots are available
      const slots = timeSlots.map(time => {
        const isBooked = existingBookings.some(
          booking => booking.date === dateStr && booking.time === time && booking.status !== 'cancelled'
        );
        
        return {
          time,
          available: !isBooked,
        };
      });

      // Only include dates that have at least one available slot
      if (slots.some(slot => slot.available)) {
        availableDates.push({
          date: dateStr,
          slots,
        });
      }
    }

    console.log(`📅 Generated ${availableDates.length} available dates for ${year}-${month + 1}`);

    return c.json({
      success: true,
      availableDates,
      settings: {
        timezone: availabilitySettings.timezone,
      },
    });
  } catch (error: any) {
    console.error('❌ Error fetching availability:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// POST /make-server-373d8b09/founder-calls/create-checkout - Create Stripe checkout session
app.post('/make-server-373d8b09/founder-calls/create-checkout', async (c) => {
  try {
    const body = await c.req.json();
    const { bookingId } = body;

    if (!bookingId) {
      return c.json({ success: false, error: 'Missing booking ID' }, 400);
    }

    // Get booking details
    const booking = await kv.get(`founder_call_booking_by_id:${bookingId}`);
    
    if (!booking) {
      return c.json({ success: false, error: 'Booking not found' }, 404);
    }

    if (!STRIPE_SECRET_KEY) {
      return c.json({ success: false, error: 'Stripe not configured' }, 500);
    }

    // Create Stripe Checkout Session
    const checkoutResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'mode': 'payment',
        'success_url': `${c.req.header('origin') || 'https://cofounderplus.com'}/booking-confirmation/${bookingId}?session_id={CHECKOUT_SESSION_ID}`,
        'cancel_url': `${c.req.header('origin') || 'https://cofounderplus.com'}/book-founder-call?cancelled=true`,
        'customer_email': booking.email,
        'line_items[0][price_data][currency]': 'usd',
        'line_items[0][price_data][product_data][name]': 'Founder Setup Call',
        'line_items[0][price_data][product_data][description]': `60-minute working session on ${booking.date} at ${booking.time}`,
        'line_items[0][price_data][unit_amount]': '9900', // $99.00
        'line_items[0][quantity]': '1',
        'metadata[booking_id]': bookingId,
        'metadata[booking_date]': booking.date,
        'metadata[booking_time]': booking.time,
        'metadata[user_timezone]': booking.userTimezone,
        'metadata[user_time]': booking.userTime,
        'metadata[customer_name]': booking.name,
        'payment_intent_data[metadata][booking_id]': bookingId,
      }).toString(),
    });

    if (!checkoutResponse.ok) {
      const error = await checkoutResponse.text();
      console.error('Stripe checkout error:', error);
      return c.json({ success: false, error: 'Failed to create checkout session' }, 500);
    }

    const session = await checkoutResponse.json();

    // Store checkout session ID with booking
    const updatedBooking = {
      ...booking,
      stripeCheckoutSessionId: session.id,
      updatedAt: new Date().toISOString(),
    };

    const bookingKey = `founder_call_booking:${booking.date}:${booking.time.replace(/[:\s]/g, '_')}`;
    await kv.set(bookingKey, updatedBooking);
    await kv.set(`founder_call_booking_by_id:${bookingId}`, updatedBooking);

    console.log(`💳 Stripe checkout session created for booking ${bookingId}: ${session.id}`);

    // Send pre-checkout email asynchronously (don't block the response)
    /* 
    // Disabled per user request to avoid duplicate emails
    (async () => {
      try {
        console.log(`📧 Sending pre-checkout email to ${booking.email}...`);
        const preCheckoutSent = await sendPreCheckoutEmail({
          name: booking.name,
          email: booking.email,
          date: booking.date,
          time: booking.time,
          bookingId: bookingId,
        });
        
        if (preCheckoutSent) {
          console.log(`✅ Pre-checkout email sent to ${booking.email}`);
          
          // Mark email as sent
          updatedBooking.preCheckoutEmailSent = true;
          updatedBooking.preCheckoutEmailSentAt = new Date().toISOString();
          await kv.set(bookingKey, updatedBooking);
          await kv.set(`founder_call_booking_by_id:${bookingId}`, updatedBooking);
        }
      } catch (emailError) {
        console.error(`❌ Failed to send pre-checkout email:`, emailError);
        // Continue even if email fails
      }
    })();
    */

    return c.json({
      success: true,
      checkoutUrl: session.url,
      sessionId: session.id,
    });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// GET /make-server-373d8b09/founder-calls/booking/:bookingId - Get booking details
app.get('/make-server-373d8b09/founder-calls/booking/:bookingId', async (c) => {
  try {
    const bookingId = c.req.param('bookingId');
    const booking = await kv.get(`founder_call_booking_by_id:${bookingId}`);

    if (!booking) {
      return c.json({ success: false, error: 'Booking not found' }, 404);
    }

    return c.json({
      success: true,
      booking,
    });
  } catch (error: any) {
    console.error('Error fetching booking:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// POST /make-server-373d8b09/founder-calls/book - Create a new booking (user-facing)
app.post('/make-server-373d8b09/founder-calls/book', async (c) => {
  try {
    const body = await c.req.json();
    const { date, time, name, email, phone, businessStage, mainChallenge, userTimezone, userDate, userTime, bookingType, notes } = body;

    // Validate required fields
    if (!date || !time || !name || !email) {
      return c.json({ success: false, error: 'Missing required fields' }, 400);
    }

    // Check if slot is still available
    const bookingKey = `founder_call_booking:${date}:${time.replace(/[:\s]/g, '_')}`;
    const existingBooking = await kv.get(bookingKey);

    if (existingBooking) {
      return c.json({ success: false, error: 'This time slot is no longer available' }, 409);
    }

    // Generate booking ID
    const bookingId = generateBookingId();

    // Create booking object
    const booking = {
      id: bookingId,
      date, // Admin Date (CST)
      time, // Admin Time (CST)
      userTimezone: userTimezone || 'America/Chicago',
      userDate: userDate || date,
      userTime: userTime || time,
      name,
      email,
      phone: phone || '',
      businessStage: businessStage || '',
      mainChallenge: mainChallenge || '',
      bookingType: bookingType || 'founder_call', // Default to founder_call
      notes: notes || '',
      status: 'pending_payment',
      calendarInviteSent: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save booking (it's pending until payment)
    await kv.set(bookingKey, booking);
    await kv.set(`founder_call_booking_by_id:${bookingId}`, booking);

    console.log(`📅 New booking created: ${bookingId} for ${date} at ${time}`);

    return c.json({
      success: true,
      bookingId,
      booking,
    });
  } catch (error: any) {
    console.error('Error creating booking:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// PATCH /make-server-373d8b09/founder-calls/booking/:bookingId/payment - Update payment status
app.patch('/make-server-373d8b09/founder-calls/booking/:bookingId/payment', async (c) => {
  try {
    const bookingId = c.req.param('bookingId');
    const body = await c.req.json();
    const { paymentIntentId, status } = body;

    const booking = await kv.get(`founder_call_booking_by_id:${bookingId}`);
    
    if (!booking) {
      return c.json({ success: false, error: 'Booking not found' }, 404);
    }

    // Update booking
    const updatedBooking = {
      ...booking,
      status: status === 'succeeded' ? 'confirmed' : booking.status,
      paymentIntentId,
      paymentStatus: status,
      updatedAt: new Date().toISOString(),
    };

    // Save updated booking
    const bookingKey = `founder_call_booking:${booking.date}:${booking.time.replace(/[:\s]/g, '_')}`;
    await kv.set(bookingKey, updatedBooking);
    await kv.set(`founder_call_booking_by_id:${bookingId}`, updatedBooking);

    console.log(`💳 Payment updated for booking ${bookingId}: ${status}`);

    // Send confirmation email if payment succeeded
    if (status === 'succeeded') {
      console.log(`📧 Sending confirmation email to ${booking.email}...`);
      
      // Retrieve meeting link (Statically configured or dynamically generated via Microsoft Graph)
      let meetingLink = booking.zoomLink;
      
      if (!meetingLink) {
        // Try creating a dynamic Teams meeting first
        try {
          const settings = await kv.get('founder_call_availability');
          const timeZone = settings?.timezone || 'America/Chicago';
          
          // Parse "YYYY-MM-DD" and "H:MM AM"
          const [y, m, d] = booking.date.split('-').map(Number);
          const [timePart, meridiem] = booking.time.split(' ');
          let [h, min] = timePart.split(':').map(Number);
          if (meridiem === 'PM' && h !== 12) h += 12;
          if (meridiem === 'AM' && h === 12) h = 0;
          
          // Construct ISO string "2023-10-27T09:00:00"
          const isoLocal = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}T${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}:00`;
          
          // Convert to UTC Date object using the admin's timezone
          const utcDate = toDate(isoLocal, { timeZone });
          const utcEndDate = new Date(utcDate.getTime() + 60 * 60 * 1000); // 1 hour duration
          
          // Generate the meeting
          const meeting = await createTeamsMeeting({
            subject: `${booking.bookingType === 'task_automation' ? 'Task Automation Setup' : 'Founder Setup Call'} with ${booking.name}`,
            startTime: utcDate.toISOString(),
            endTime: utcEndDate.toISOString(),
            description: `Booked via Cofounder+. Focus: ${booking.mainChallenge || 'General Setup'}`
          });
          
          if (meeting) {
            meetingLink = meeting.joinUrl;
            updatedBooking.zoomLink = meetingLink;
            updatedBooking.teamsMeetingId = meeting.id;
          }
        } catch (e) {
          console.error('Failed to create Teams meeting:', e);
          // Fallback to static link continues below
        }
      }

      // Fallback to default link if dynamic creation failed
      if (!meetingLink) {
        const settings = await kv.get('founder_call_availability');
        if (settings && settings.defaultMeetingLink) {
          meetingLink = settings.defaultMeetingLink;
          updatedBooking.zoomLink = meetingLink; // Update the booking object with the default link
        }
      }

      const emailSent = await sendBookingConfirmation({
        name: booking.name,
        email: booking.email,
        date: booking.date, // Admin Date (CST)
        time: booking.time, // Admin Time (CST)
        userDate: booking.userDate,
        userTime: booking.userTime,
        userTimezone: booking.userTimezone,
        bookingId: bookingId,
        zoomLink: meetingLink,
        bookingType: booking.bookingType, // Pass booking type for correct email content
      });

      if (emailSent) {
        console.log(`✅ Confirmation email sent to ${booking.email}`);
        
        // Update booking to mark email as sent
        updatedBooking.confirmationEmailSent = true;
        updatedBooking.confirmationEmailSentAt = new Date().toISOString();
        
        await kv.set(bookingKey, updatedBooking);
        await kv.set(`founder_call_booking_by_id:${bookingId}`, updatedBooking);
      } else {
        console.error(`❌ Failed to send confirmation email to ${booking.email}`);
      }

      // Notify admin about new booking
      try {
        await sendNewBookingNotification({
          name: booking.name,
          email: booking.email,
          date: booking.date,
          time: booking.time,
          bookingType: booking.bookingType || 'founder_call',
          bookingId: bookingId,
        });
        console.log('✅ Admin notification sent');
      } catch (adminEmailError) {
        console.error('❌ Failed to send admin notification:', adminEmailError);
      }
    }

    return c.json({
      success: true,
      booking: updatedBooking,
    });
  } catch (error: any) {
    console.error('Error updating payment:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ADMIN ENDPOINTS

// GET /make-server-373d8b09/admin/founder-calls/bookings - Get all bookings (admin only)
app.get('/make-server-373d8b09/admin/founder-calls/bookings', async (c) => {
  try {
    // TODO: Add admin auth check
    
    const allBookings = await kv.getByPrefix('founder_call_booking_by_id:');
    
    // Sort by date descending
    const sortedBookings = allBookings.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return c.json({
      success: true,
      bookings: sortedBookings,
      total: sortedBookings.length,
    });
  } catch (error: any) {
    console.error('Error fetching admin bookings:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// PUT /make-server-373d8b09/admin/founder-calls/availability - Update availability settings (admin only)
app.put('/make-server-373d8b09/admin/founder-calls/availability', async (c) => {
  try {
    // TODO: Add admin auth check
    
    const body = await c.req.json();

    // Support both old and new format
    let settings;
    if (body.weeklySchedule) {
      // New format
      settings = {
        weeklySchedule: body.weeklySchedule,
        dateOverrides: body.dateOverrides || {},
        timezone: body.timezone || 'America/Chicago',
        defaultMeetingLink: body.defaultMeetingLink,
        updatedAt: new Date().toISOString(),
      };
    } else {
      // Old format - convert to new format
      const { daysOfWeek, timeSlots, blockedDates, timezone } = body;
      const weeklySchedule: { [key: number]: string[] } = {};
      (daysOfWeek || [1, 2, 3, 4, 5]).forEach((day: number) => {
        weeklySchedule[day] = timeSlots || ['9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'];
      });
      
      settings = {
        weeklySchedule,
        dateOverrides: {},
        timezone: timezone || 'America/Chicago',
        defaultMeetingLink: body.defaultMeetingLink,
        updatedAt: new Date().toISOString(),
      };
      
      // If blockedDates provided, add them as dateOverrides with empty arrays
      if (blockedDates && Array.isArray(blockedDates)) {
        blockedDates.forEach((date: string) => {
          settings.dateOverrides[date] = [];
        });
      }
    }

    await kv.set('founder_call_availability', settings);

    console.log('⚙️ Founder call availability settings updated');

    return c.json({
      success: true,
      settings,
    });
  } catch (error: any) {
    console.error('Error updating availability:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// GET /make-server-373d8b09/admin/founder-calls/availability-settings - Get availability settings (admin only)
app.get('/make-server-373d8b09/admin/founder-calls/availability-settings', async (c) => {
  try {
    // TODO: Add admin auth check
    
    const settings = await kv.get('founder_call_availability') || {
      daysOfWeek: [1, 2, 3, 4, 5],
      timeSlots: ['9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'],
      blockedDates: [],
      timezone: 'America/Los_Angeles',
    };

    return c.json({
      success: true,
      settings,
    });
  } catch (error: any) {
    console.error('Error fetching availability settings:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// PATCH /make-server-373d8b09/admin/founder-calls/booking/:bookingId - Update booking (admin only)
app.patch('/make-server-373d8b09/admin/founder-calls/booking/:bookingId', async (c) => {
  try {
    // TODO: Add admin auth check
    
    const bookingId = c.req.param('bookingId');
    const body = await c.req.json();

    const booking = await kv.get(`founder_call_booking_by_id:${bookingId}`);
    
    if (!booking) {
      return c.json({ success: false, error: 'Booking not found' }, 404);
    }

    // Update booking
    const updatedBooking = {
      ...booking,
      ...body,
      updatedAt: new Date().toISOString(),
    };

    // Save updated booking
    const bookingKey = `founder_call_booking:${updatedBooking.date}:${updatedBooking.time.replace(/[:\s]/g, '_')}`;
    await kv.set(bookingKey, updatedBooking);
    await kv.set(`founder_call_booking_by_id:${bookingId}`, updatedBooking);

    console.log(`📝 Admin updated booking ${bookingId}`);

    return c.json({
      success: true,
      booking: updatedBooking,
    });
  } catch (error: any) {
    console.error('Error updating booking:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// DELETE /make-server-373d8b09/admin/founder-calls/booking/:bookingId - Cancel booking (admin only)
app.delete('/make-server-373d8b09/admin/founder-calls/booking/:bookingId', async (c) => {
  try {
    // TODO: Add admin auth check
    
    const bookingId = c.req.param('bookingId');
    const booking = await kv.get(`founder_call_booking_by_id:${bookingId}`);
    
    if (!booking) {
      return c.json({ success: false, error: 'Booking not found' }, 404);
    }

    // Mark as cancelled instead of deleting
    const cancelledBooking = {
      ...booking,
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const bookingKey = `founder_call_booking:${booking.date}:${booking.time.replace(/[:\s]/g, '_')}`;
    await kv.set(bookingKey, cancelledBooking);
    await kv.set(`founder_call_booking_by_id:${bookingId}`, cancelledBooking);

    console.log(`❌ Booking ${bookingId} cancelled`);

    return c.json({
      success: true,
      message: 'Booking cancelled',
    });
  } catch (error: any) {
    console.error('Error cancelling booking:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// POST /make-server-373d8b09/admin/founder-calls/booking/:bookingId/send-reminder - Send reminder email (admin only)
app.post('/make-server-373d8b09/admin/founder-calls/booking/:bookingId/send-reminder', async (c) => {
  try {
    // TODO: Add admin auth check
    
    const bookingId = c.req.param('bookingId');
    const booking = await kv.get(`founder_call_booking_by_id:${bookingId}`);
    
    if (!booking) {
      return c.json({ success: false, error: 'Booking not found' }, 404);
    }

    if (booking.status !== 'confirmed') {
      return c.json({ success: false, error: 'Can only send reminders for confirmed bookings' }, 400);
    }

    if (!booking.zoomLink) {
      return c.json({ success: false, error: 'No Zoom link set for this booking' }, 400);
    }

    console.log(`📧 Sending reminder email to ${booking.email}...`);
    
    const emailSent = await sendCallReminder({
      name: booking.name,
      email: booking.email,
      date: booking.date,
      time: booking.time,
      zoomLink: booking.zoomLink,
    });

    if (emailSent) {
      console.log(`✅ Reminder email sent to ${booking.email}`);
      
      // Update booking to mark reminder as sent
      const updatedBooking = {
        ...booking,
        reminderEmailSent: true,
        reminderEmailSentAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      const bookingKey = `founder_call_booking:${booking.date}:${booking.time.replace(/[:\s]/g, '_')}`;
      await kv.set(bookingKey, updatedBooking);
      await kv.set(`founder_call_booking_by_id:${bookingId}`, updatedBooking);

      return c.json({
        success: true,
        message: 'Reminder email sent',
      });
    } else {
      return c.json({ success: false, error: 'Failed to send reminder email' }, 500);
    }
  } catch (error: any) {
    console.error('Error sending reminder:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// POST /make-server-373d8b09/admin/founder-calls/booking/:bookingId/send-confirmation - Resend confirmation email (admin only)
app.post('/make-server-373d8b09/admin/founder-calls/booking/:bookingId/send-confirmation', async (c) => {
  try {
    // TODO: Add admin auth check
    
    const bookingId = c.req.param('bookingId');
    const body = await c.req.json().catch(() => ({}));
    const { zoomLink, employeeId } = body;

    let booking = await kv.get(`founder_call_booking_by_id:${bookingId}`);
    
    if (!booking) {
      return c.json({ success: false, error: 'Booking not found' }, 404);
    }

    // Update booking if new info provided
    if (zoomLink || employeeId) {
      const updates: any = {};
      if (zoomLink) updates.zoomLink = zoomLink;
      if (employeeId) updates.assignedEmployeeId = employeeId;
      
      booking = { ...booking, ...updates, updatedAt: new Date().toISOString() };
      
      const bookingKey = `founder_call_booking:${booking.date}:${booking.time.replace(/[:\s]/g, '_')}`;
      await kv.set(bookingKey, booking);
      await kv.set(`founder_call_booking_by_id:${bookingId}`, booking);
    }

    console.log(`📧 Resending confirmation email to ${booking.email}...`);
    
    // Get employee details if assigned
    let hostName = undefined;
    if (booking.assignedEmployeeId) {
      const employee = await kv.get(`employee:${booking.assignedEmployeeId}`);
      if (employee) hostName = employee.name;
    }

    const emailSent = await sendBookingConfirmation({
      name: booking.name,
      email: booking.email,
      date: booking.date,
      time: booking.time,
      bookingId: bookingId,
      zoomLink: booking.zoomLink,
      bookingType: booking.bookingType,
      hostName: hostName,
    });

    if (emailSent) {
      console.log(`✅ Confirmation email resent to ${booking.email}`);

      return c.json({
        success: true,
        message: 'Confirmation email sent',
        booking,
      });
    } else {
      return c.json({ success: false, error: 'Failed to send confirmation email' }, 500);
    }
  } catch (error: any) {
    console.error('Error sending confirmation:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// EMPLOYEES ENDPOINTS

// GET /make-server-373d8b09/admin/employees - Get all employees
app.get('/make-server-373d8b09/admin/employees', async (c) => {
  try {
    const employees = await kv.getByPrefix('employee:');
    return c.json({ success: true, employees });
  } catch (error: any) {
    console.error('Error fetching employees:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// POST /make-server-373d8b09/admin/employees - Create employee
app.post('/make-server-373d8b09/admin/employees', async (c) => {
  try {
    const body = await c.req.json();
    const { name, email, role, avatar } = body;
    
    if (!name || !email || !role) {
      return c.json({ success: false, error: 'Missing required fields' }, 400);
    }

    const id = `emp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const employee = {
      id,
      name,
      email,
      role, // 'sales', 'support', 'admin'
      avatar,
      createdAt: new Date().toISOString(),
    };

    await kv.set(`employee:${id}`, employee);
    
    return c.json({ success: true, employee });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// PUT /make-server-373d8b09/admin/employees/:id - Update employee
app.put('/make-server-373d8b09/admin/employees/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    
    const existing = await kv.get(`employee:${id}`);
    if (!existing) return c.json({ success: false, error: 'Employee not found' }, 404);

    const updated = { ...existing, ...body, updatedAt: new Date().toISOString() };
    await kv.set(`employee:${id}`, updated);
    
    return c.json({ success: true, employee: updated });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// DELETE /make-server-373d8b09/admin/employees/:id - Delete employee
app.delete('/make-server-373d8b09/admin/employees/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await kv.del(`employee:${id}`);
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// POST /make-server-373d8b09/founder-calls/booking/:bookingId/reschedule - Reschedule booking (24h rule)
app.post('/make-server-373d8b09/founder-calls/booking/:bookingId/reschedule', async (c) => {
  try {
    const bookingId = c.req.param('bookingId');
    const body = await c.req.json();
    const { newDate, newTime } = body;

    if (!newDate || !newTime) {
      return c.json({ success: false, error: 'Missing date or time' }, 400);
    }

    // Get the existing booking
    const booking = await kv.get(`founder_call_booking_by_id:${bookingId}`);
    
    if (!booking) {
      return c.json({ success: false, error: 'Booking not found' }, 404);
    }

    if (booking.status === 'cancelled') {
      return c.json({ success: false, error: 'Cannot reschedule a cancelled booking' }, 400);
    }

    // Validate 24-hour rule - must be at least 24 hours before original booking
    const originalDateTime = new Date(`${booking.date} ${booking.time}`);
    const now = new Date();
    const hoursUntilBooking = (originalDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilBooking < 24) {
      return c.json({ 
        success: false, 
        error: 'Cannot reschedule within 24 hours of your booking. Please contact support@cofounderplus.com',
        hoursUntilBooking: Math.round(hoursUntilBooking * 10) / 10
      }, 400);
    }

    // Check if new slot is available
    const newSlotKey = `founder_call_booking:${newDate}:${newTime.replace(/[:\s]/g, '_')}`;
    const existingBooking = await kv.get(newSlotKey);
    
    if (existingBooking && existingBooking.id !== bookingId) {
      return c.json({ success: false, error: 'New time slot is already booked' }, 409);
    }

    // Remove old booking slot
    const oldSlotKey = `founder_call_booking:${booking.date}:${booking.time.replace(/[:\s]/g, '_')}`;
    await kv.del(oldSlotKey);

    // Create updated booking
    const updatedBooking = {
      ...booking,
      originalDate: booking.date,
      originalTime: booking.time,
      date: newDate,
      time: newTime,
      rescheduled: true,
      rescheduledAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save to new slot and update by-id index
    await kv.set(newSlotKey, updatedBooking);
    await kv.set(`founder_call_booking_by_id:${bookingId}`, updatedBooking);

    console.log(`📅 Booking ${bookingId} rescheduled from ${booking.date} ${booking.time} to ${newDate} ${newTime}`);

    // Send updated confirmation email with new calendar invite
    if (booking.status === 'confirmed') {
      console.log(`📧 Sending updated confirmation email to ${booking.email}...`);
      
      const emailSent = await sendBookingConfirmation({
        name: booking.name,
        email: booking.email,
        date: newDate,
        time: newTime,
        bookingId: bookingId,
        zoomLink: booking.zoomLink,
        bookingType: booking.bookingType,
        isReschedule: true,
      });

      if (emailSent) {
        console.log(`✅ Updated confirmation sent to ${booking.email}`);
      }

      // Notify admin about reschedule
      try {
        await sendNewBookingNotification({
          name: booking.name,
          email: booking.email,
          date: newDate,
          time: newTime,
          bookingType: `Rescheduled: ${booking.bookingType || 'founder_call'}`,
          bookingId: bookingId,
        });
        console.log('✅ Admin notification sent for reschedule');
      } catch (adminEmailError) {
        console.error('❌ Failed to send admin notification for reschedule:', adminEmailError);
      }
    }

    return c.json({
      success: true,
      booking: updatedBooking,
      message: 'Booking rescheduled successfully',
    });
  } catch (error: any) {
    console.error('Error rescheduling booking:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// EMPLOYEES ENDPOINTS

// GET /make-server-373d8b09/admin/employees - Get all employees
app.get('/make-server-373d8b09/admin/employees', async (c) => {
  try {
    const employees = await kv.getByPrefix('employee:');
    return c.json({ success: true, employees });
  } catch (error: any) {
    console.error('Error fetching employees:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// POST /make-server-373d8b09/admin/employees - Create employee
app.post('/make-server-373d8b09/admin/employees', async (c) => {
  try {
    const body = await c.req.json();
    const { name, email, role, phone, avatar } = body;
    
    if (!name || !email || !role) {
      return c.json({ success: false, error: 'Missing required fields' }, 400);
    }

    const id = `emp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const employee = {
      id,
      name,
      email,
      role, // 'admin', 'sales', 'support'
      phone: phone || '',
      avatar: avatar || '',
      createdAt: new Date().toISOString(),
    };

    await kv.set(`employee:${id}`, employee);
    
    return c.json({ success: true, employee });
  } catch (error: any) {
    console.error('Error creating employee:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// PUT /make-server-373d8b09/admin/employees/:id - Update employee
app.put('/make-server-373d8b09/admin/employees/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    
    const existing = await kv.get(`employee:${id}`);
    if (!existing) return c.json({ success: false, error: 'Employee not found' }, 404);

    const updated = { ...existing, ...body, updatedAt: new Date().toISOString() };
    await kv.set(`employee:${id}`, updated);
    
    return c.json({ success: true, employee: updated });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// DELETE /make-server-373d8b09/admin/employees/:id - Delete employee
app.delete('/make-server-373d8b09/admin/employees/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await kv.del(`employee:${id}`);
    return c.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting employee:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// POST /make-server-373d8b09/founder-calls/booking/:bookingId/payment-cancelled - Handle payment cancellation
app.post('/make-server-373d8b09/founder-calls/booking/:bookingId/payment-cancelled', async (c) => {
  try {
    const bookingId = c.req.param('bookingId');
    
    const booking = await kv.get(`founder_call_booking_by_id:${bookingId}`);
    
    if (!booking) {
      return c.json({ success: false, error: 'Booking not found' }, 404);
    }

    console.log(`📧 Sending payment cancelled email to ${booking.email}...`);
    
    try {
      const emailSent = await sendPaymentCancelledEmail({
        name: booking.name,
        email: booking.email,
        date: booking.date,
        time: booking.time,
        bookingId: bookingId,
      });
      
      if (emailSent) {
        console.log(`✅ Payment cancelled email sent to ${booking.email}`);
        
        // Mark email as sent
        const updatedBooking = {
          ...booking,
          paymentCancelledEmailSent: true,
          paymentCancelledEmailSentAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        const bookingKey = `founder_call_booking:${booking.date}:${booking.time.replace(/[:\s]/g, '_')}`;
        await kv.set(bookingKey, updatedBooking);
        await kv.set(`founder_call_booking_by_id:${bookingId}`, updatedBooking);
        
        return c.json({
          success: true,
          message: 'Payment cancelled email sent',
        });
      }
    } catch (emailError) {
      console.error(`❌ Failed to send payment cancelled email:`, emailError);
      return c.json({ success: false, error: 'Failed to send email' }, 500);
    }

    return c.json({ success: false, error: 'Failed to send email' }, 500);
  } catch (error: any) {
    console.error('Error handling payment cancellation:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// POST /make-server-373d8b09/admin/test-email - Send test email (admin only)
app.post('/make-server-373d8b09/admin/test-email', async (c) => {
  try {
    // TODO: Add admin auth check
    
    const body = await c.req.json();
    const { email, testType = 'simple' } = body;

    if (!email) {
      return c.json({ success: false, error: 'Email address is required' }, 400);
    }

    // Check if SendGrid API key is configured
    const sendGridApiKey = Deno.env.get('SENDGRID_API_KEY');
    if (!sendGridApiKey) {
      console.error('❌ SENDGRID_API_KEY environment variable is not set');
      return c.json({ 
        success: false, 
        error: 'SendGrid API key not configured',
        details: 'Please add your SENDGRID_API_KEY in the environment variables. You can get an API key from https://app.sendgrid.com/settings/api_keys'
      }, 500);
    }

    console.log(`📧 Sending test email (${testType}) to ${email}...`);
    
    const { sendTestEmail } = await import('./email-utils.tsx');
    
    const result = await sendTestEmail({
      to: email,
      testType: testType as 'simple' | 'confirmation' | 'cancelled' | 'reminder',
    });

    if (result) {
      console.log(`✅ Test email sent successfully to ${email}`);
      return c.json({
        success: true,
        message: `Test email sent to ${email}`,
        testType,
        timestamp: new Date().toISOString(),
      });
    } else {
      console.error(`❌ Failed to send test email to ${email}`);
      
      // Try to get the detailed error from the sendEmail result
      // The sendTestEmail function returns boolean, but logs errors
      return c.json({ 
        success: false, 
        error: 'Failed to send email',
        details: 'Check the server logs above for detailed error information from SendGrid'
      }, 500);
    }
  } catch (error: any) {
    console.error('Error sending test email:', error);
    return c.json({ 
      success: false, 
      error: error.message || 'Unknown error occurred',
      details: error.stack
    }, 500);
  }
});

// GET /make-server-373d8b09/admin/email-system-status - Check email system configuration (admin only)
app.get('/make-server-373d8b09/admin/email-system-status', async (c) => {
  try {
    // TODO: Add admin auth check
    
    const sendGridApiKey = Deno.env.get('SENDGRID_API_KEY');
    const fromEmail = Deno.env.get('SENDGRID_FROM_EMAIL') || 'noreply@yourdomain.com';
    const fromName = Deno.env.get('SENDGRID_FROM_NAME') || 'Cofounder+';
    
    if (!sendGridApiKey) {
      return c.json({
        success: true,
        configured: false,
        error: 'SENDGRID_API_KEY not set',
        message: 'Please configure your SendGrid API key in environment variables',
      });
    }

    // Check if the key looks valid (starts with 'SG.')
    const isValidFormat = sendGridApiKey.startsWith('SG.');
    
    // Check if FROM_EMAIL is still the default
    const isDefaultFromEmail = fromEmail === 'noreply@yourdomain.com';
    
    return c.json({
      success: true,
      configured: true,
      validFormat: isValidFormat,
      fromEmail,
      fromName,
      isDefaultFromEmail,
      message: isValidFormat 
        ? (isDefaultFromEmail 
          ? 'SendGrid API key is configured, but you need to set SENDGRID_FROM_EMAIL to a verified sender' 
          : 'SendGrid API key is configured')
        : 'SendGrid API key is set but may be invalid (should start with "SG.")',
      warning: isDefaultFromEmail ? 'You must verify your sender email in SendGrid before sending emails' : null,
    });
  } catch (error: any) {
    console.error('Error checking email system status:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

export default app;