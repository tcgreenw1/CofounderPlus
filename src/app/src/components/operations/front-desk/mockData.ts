export interface LogEntry {
  id: string;
  type: 'Call' | 'SMS' | 'Chat';
  customer: string;
  time: string;
  duration?: string;
  outcome: 'Booked' | 'Inquiry Solved' | 'Escalated' | 'Missed';
  summary: string;
}

export interface Service {
  id: string;
  name: string;
  duration: string;
  price: string;
}

export const MOCK_LOGS: LogEntry[] = [
  { id: '1', type: 'Call', customer: 'Sarah Johnson', time: '10:42 AM', duration: '3m 12s', outcome: 'Booked', summary: 'Booked Balayage & Cut for Friday 2pm' },
  { id: '2', type: 'SMS', customer: 'Mike Peters', time: '09:15 AM', outcome: 'Inquiry Solved', summary: 'Asked about parking availability' },
  { id: '3', type: 'Call', customer: 'Unknown', time: 'Yesterday', duration: '45s', outcome: 'Escalated', summary: 'Complex complaint about previous service - Forwarded to Owner' },
  { id: '4', type: 'Chat', customer: 'Emily Chen', time: 'Yesterday', outcome: 'Booked', summary: 'Scheduled trim for Saturday morning' },
];

export const MOCK_SERVICES: Service[] = [
  { id: '1', name: 'Women\'s Cut & Blow Dry', duration: '60 min', price: '$85' },
  { id: '2', name: 'Men\'s Cut', duration: '30 min', price: '$45' },
  { id: '3', name: 'Full Balayage', duration: '180 min', price: '$220+' },
  { id: '4', name: 'Root Touch Up', duration: '90 min', price: '$95' },
];
