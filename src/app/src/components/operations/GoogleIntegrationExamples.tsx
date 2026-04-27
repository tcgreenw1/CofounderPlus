import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { toast } from 'sonner@2.0.3';
import { 
  Mail, 
  Calendar, 
  Folder, 
  Users, 
  Send, 
  Loader2,
  CheckCircle,
  Clock
} from 'lucide-react';
import {
  getGmailMessages,
  getGmailMessage,
  sendGmailMessage,
  getCalendarEvents,
  createCalendarEvent,
  getDriveFiles,
  getContacts,
  type GmailMessage,
  type CalendarEvent,
  type DriveFile,
  type Contact
} from '../../utils/google-api-helpers';

interface GoogleIntegrationExamplesProps {
  userId: string;
}

/**
 * This component demonstrates how to use Google APIs within Cofounder Sales.
 * Use these examples as a reference for implementing sales automation features.
 */
export function GoogleIntegrationExamples({ userId }: GoogleIntegrationExamplesProps) {
  // State for different sections
  const [activeSection, setActiveSection] = useState<'gmail' | 'calendar' | 'drive' | 'contacts'>('gmail');
  const [loading, setLoading] = useState(false);

  // Gmail State
  const [gmailMessages, setGmailMessages] = useState<GmailMessage[]>([]);
  const [emailForm, setEmailForm] = useState({
    to: '',
    subject: '',
    message: ''
  });

  // Calendar State
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [eventForm, setEventForm] = useState({
    summary: '',
    description: '',
    startDateTime: '',
    endDateTime: '',
    attendeeEmail: '',
    location: ''
  });

  // Drive State
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);

  // Contacts State
  const [contacts, setContacts] = useState<Contact[]>([]);

  // ============================================
  // GMAIL EXAMPLES
  // ============================================

  const handleFetchInbox = async () => {
    setLoading(true);
    try {
      const { messages } = await getGmailMessages(userId, 20, 'is:unread');
      setGmailMessages(messages);
      toast.success(`Fetched ${messages.length} unread messages`);
    } catch (error: any) {
      console.error('Error fetching inbox:', error);
      toast.error(error.message || 'Failed to fetch inbox');
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!emailForm.to || !emailForm.subject || !emailForm.message) {
      toast.error('Please fill in all email fields');
      return;
    }

    setLoading(true);
    try {
      await sendGmailMessage({
        userId,
        to: emailForm.to,
        subject: emailForm.subject,
        message: emailForm.message
      });
      toast.success('Email sent successfully!');
      setEmailForm({ to: '', subject: '', message: '' });
    } catch (error: any) {
      console.error('Error sending email:', error);
      toast.error(error.message || 'Failed to send email');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // CALENDAR EXAMPLES
  // ============================================

  const handleFetchCalendarEvents = async () => {
    setLoading(true);
    try {
      // Get events for the next 7 days
      const timeMin = new Date().toISOString();
      const timeMax = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      
      const { events } = await getCalendarEvents(userId, 'primary', timeMin, timeMax);
      setCalendarEvents(events);
      toast.success(`Fetched ${events.length} upcoming events`);
    } catch (error: any) {
      console.error('Error fetching calendar events:', error);
      toast.error(error.message || 'Failed to fetch calendar events');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async () => {
    if (!eventForm.summary || !eventForm.startDateTime || !eventForm.endDateTime) {
      toast.error('Please fill in required event fields');
      return;
    }

    setLoading(true);
    try {
      await createCalendarEvent({
        userId,
        summary: eventForm.summary,
        description: eventForm.description,
        start: { dateTime: eventForm.startDateTime },
        end: { dateTime: eventForm.endDateTime },
        attendees: eventForm.attendeeEmail ? [{ email: eventForm.attendeeEmail }] : undefined,
        location: eventForm.location
      });
      toast.success('Calendar event created!');
      setEventForm({
        summary: '',
        description: '',
        startDateTime: '',
        endDateTime: '',
        attendeeEmail: '',
        location: ''
      });
      handleFetchCalendarEvents();
    } catch (error: any) {
      console.error('Error creating event:', error);
      toast.error(error.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // DRIVE EXAMPLES
  // ============================================

  const handleFetchDriveFiles = async () => {
    setLoading(true);
    try {
      const { files } = await getDriveFiles(userId, 20);
      setDriveFiles(files);
      toast.success(`Fetched ${files.length} files from Drive`);
    } catch (error: any) {
      console.error('Error fetching Drive files:', error);
      toast.error(error.message || 'Failed to fetch Drive files');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // CONTACTS EXAMPLES
  // ============================================

  const handleFetchContacts = async () => {
    setLoading(true);
    try {
      const { contacts: fetchedContacts, totalPeople } = await getContacts(userId, 50);
      setContacts(fetchedContacts);
      toast.success(`Fetched ${fetchedContacts.length} contacts (${totalPeople} total)`);
    } catch (error: any) {
      console.error('Error fetching contacts:', error);
      toast.error(error.message || 'Failed to fetch contacts');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
      <div>
        <h3>Google Integration Examples</h3>
        <p className="text-muted-foreground">
          Demonstrations of Gmail, Calendar, Drive, and Contacts API usage
        </p>
      </div>

      {/* Section Tabs */}
      <div className="flex flex-wrap" style={{ gap: 'var(--spacing-2)' }}>
        <Button
          variant={activeSection === 'gmail' ? 'default' : 'outline'}
          onClick={() => setActiveSection('gmail')}
          style={{ gap: 'var(--spacing-2)' }}
        >
          <Mail className="size-4" />
          Gmail
        </Button>
        <Button
          variant={activeSection === 'calendar' ? 'default' : 'outline'}
          onClick={() => setActiveSection('calendar')}
          style={{ gap: 'var(--spacing-2)' }}
        >
          <Calendar className="size-4" />
          Calendar
        </Button>
        <Button
          variant={activeSection === 'drive' ? 'default' : 'outline'}
          onClick={() => setActiveSection('drive')}
          style={{ gap: 'var(--spacing-2)' }}
        >
          <Folder className="size-4" />
          Drive
        </Button>
        <Button
          variant={activeSection === 'contacts' ? 'default' : 'outline'}
          onClick={() => setActiveSection('contacts')}
          style={{ gap: 'var(--spacing-2)' }}
        >
          <Users className="size-4" />
          Contacts
        </Button>
      </div>

      {/* Gmail Section */}
      {activeSection === 'gmail' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
          <Card>
            <CardHeader>
              <CardTitle>Send Email</CardTitle>
              <CardDescription>Send emails via Gmail API</CardDescription>
            </CardHeader>
            <CardContent style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
              <div>
                <Label>To</Label>
                <Input
                  type="email"
                  placeholder="recipient@example.com"
                  value={emailForm.to}
                  onChange={(e) => setEmailForm({ ...emailForm, to: e.target.value })}
                />
              </div>
              <div>
                <Label>Subject</Label>
                <Input
                  placeholder="Email subject"
                  value={emailForm.subject}
                  onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                />
              </div>
              <div>
                <Label>Message</Label>
                <Textarea
                  placeholder="Email body"
                  value={emailForm.message}
                  onChange={(e) => setEmailForm({ ...emailForm, message: e.target.value })}
                  rows={6}
                />
              </div>
              <Button onClick={handleSendEmail} disabled={loading}>
                {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                Send Email
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Inbox Messages</CardTitle>
              <CardDescription>View unread messages from Gmail</CardDescription>
            </CardHeader>
            <CardContent style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
              <Button onClick={handleFetchInbox} disabled={loading}>
                {loading ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
                Fetch Unread Messages
              </Button>
              {gmailMessages.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
                  {gmailMessages.slice(0, 5).map((msg) => (
                    <div
                      key={msg.id}
                      style={{
                        padding: 'var(--spacing-3)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border)'
                      }}
                    >
                      <p className="text-muted-foreground">{msg.snippet}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Calendar Section */}
      {activeSection === 'calendar' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
          <Card>
            <CardHeader>
              <CardTitle>Create Event</CardTitle>
              <CardDescription>Schedule a new calendar event</CardDescription>
            </CardHeader>
            <CardContent style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
              <div>
                <Label>Event Title *</Label>
                <Input
                  placeholder="Meeting with client"
                  value={eventForm.summary}
                  onChange={(e) => setEventForm({ ...eventForm, summary: e.target.value })}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  placeholder="Event details"
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 'var(--spacing-4)' }}>
                <div>
                  <Label>Start Date & Time *</Label>
                  <Input
                    type="datetime-local"
                    value={eventForm.startDateTime}
                    onChange={(e) => setEventForm({ ...eventForm, startDateTime: e.target.value })}
                  />
                </div>
                <div>
                  <Label>End Date & Time *</Label>
                  <Input
                    type="datetime-local"
                    value={eventForm.endDateTime}
                    onChange={(e) => setEventForm({ ...eventForm, endDateTime: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Attendee Email</Label>
                <Input
                  type="email"
                  placeholder="attendee@example.com"
                  value={eventForm.attendeeEmail}
                  onChange={(e) => setEventForm({ ...eventForm, attendeeEmail: e.target.value })}
                />
              </div>
              <div>
                <Label>Location</Label>
                <Input
                  placeholder="Meeting room or address"
                  value={eventForm.location}
                  onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                />
              </div>
              <Button onClick={handleCreateEvent} disabled={loading}>
                {loading ? <Loader2 className="size-4 animate-spin" /> : <Calendar className="size-4" />}
                Create Event
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
              <CardDescription>Events for the next 7 days</CardDescription>
            </CardHeader>
            <CardContent style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
              <Button onClick={handleFetchCalendarEvents} disabled={loading}>
                {loading ? <Loader2 className="size-4 animate-spin" /> : <Calendar className="size-4" />}
                Fetch Events
              </Button>
              {calendarEvents.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
                  {calendarEvents.map((event) => (
                    <div
                      key={event.id}
                      style={{
                        padding: 'var(--spacing-3)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border)'
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <h4>{event.summary}</h4>
                        <Badge variant="outline">
                          <Clock className="size-3 mr-1" />
                          {'dateTime' in event.start ? new Date(event.start.dateTime).toLocaleString() : event.start.date}
                        </Badge>
                      </div>
                      {event.description && (
                        <p className="text-muted-foreground" style={{ marginTop: 'var(--spacing-2)' }}>
                          {event.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Drive Section */}
      {activeSection === 'drive' && (
        <Card>
          <CardHeader>
            <CardTitle>Drive Files</CardTitle>
            <CardDescription>Browse files from Google Drive</CardDescription>
          </CardHeader>
          <CardContent style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
            <Button onClick={handleFetchDriveFiles} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Folder className="size-4" />}
              Fetch Drive Files
            </Button>
            {driveFiles.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
                {driveFiles.map((file) => (
                  <div
                    key={file.id}
                    style={{
                      padding: 'var(--spacing-3)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <h4>{file.name}</h4>
                      <p className="text-muted-foreground">
                        {file.mimeType} • {new Date(file.modifiedTime).toLocaleDateString()}
                      </p>
                    </div>
                    {file.webViewLink && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(file.webViewLink, '_blank')}
                      >
                        View
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Contacts Section */}
      {activeSection === 'contacts' && (
        <Card>
          <CardHeader>
            <CardTitle>Google Contacts</CardTitle>
            <CardDescription>View contacts from Google People API</CardDescription>
          </CardHeader>
          <CardContent style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
            <Button onClick={handleFetchContacts} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Users className="size-4" />}
              Fetch Contacts
            </Button>
            {contacts.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
                {contacts.slice(0, 10).map((contact, index) => {
                  const name = contact.names?.[0]?.displayName || 'Unknown';
                  const email = contact.emailAddresses?.[0]?.value || '';
                  const phone = contact.phoneNumbers?.[0]?.value || '';
                  const org = contact.organizations?.[0];

                  return (
                    <div
                      key={contact.resourceName || index}
                      style={{
                        padding: 'var(--spacing-3)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border)'
                      }}
                    >
                      <h4>{name}</h4>
                      {email && <p className="text-muted-foreground">{email}</p>}
                      {phone && <p className="text-muted-foreground">{phone}</p>}
                      {org && (
                        <p className="text-muted-foreground">
                          {org.title} at {org.name}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
