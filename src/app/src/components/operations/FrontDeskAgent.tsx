import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Phone, 
  MessageSquare, 
  Calendar, 
  Clock, 
  Settings, 
  BarChart3, 
  Users, 
  FileText, 
  Mic, 
  Smartphone, 
  CheckCircle2, 
  AlertCircle,
  Scissors,
  DollarSign,
  History,
  ChevronRight,
  Plus,
  Save,
  Play,
  LayoutTemplate,
  Code,
  Headphones,
  Globe,
  Shield,
  UserCog,
  ListVideo,
  Copy,
  ExternalLink,
  Sliders,
  Palette,
  MousePointerClick,
  Eye,
  Terminal
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Separator } from '../ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Textarea } from '../ui/textarea';
import { Slider } from '../ui/slider'; // Assuming Slider exists
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'; // Assuming Select exists
import { useIsMobile } from '../ui/use-mobile';
import { cn } from '../../lib/utils';

// Interfaces
interface LogEntry {
  id: string;
  type: 'Call' | 'SMS' | 'Chat';
  customer: string;
  time: string;
  duration?: string;
  outcome: 'Booked' | 'Inquiry Solved' | 'Escalated' | 'Missed';
  summary: string;
}

interface Service {
  id: string;
  name: string;
  duration: string;
  price: string;
}

// Mock Data
const MOCK_LOGS: LogEntry[] = [
  { id: '1', type: 'Call', customer: 'Sarah Johnson', time: '10:42 AM', duration: '3m 12s', outcome: 'Booked', summary: 'Booked Balayage & Cut for Friday 2pm' },
  { id: '2', type: 'SMS', customer: 'Mike Peters', time: '09:15 AM', outcome: 'Inquiry Solved', summary: 'Asked about parking availability' },
  { id: '3', type: 'Call', customer: 'Unknown', time: 'Yesterday', duration: '45s', outcome: 'Escalated', summary: 'Complex complaint about previous service - Forwarded to Owner' },
  { id: '4', type: 'Chat', customer: 'Emily Chen', time: 'Yesterday', outcome: 'Booked', summary: 'Scheduled trim for Saturday morning' },
];

const MOCK_SERVICES: Service[] = [
  { id: '1', name: 'Women\'s Cut & Blow Dry', duration: '60 min', price: '$85' },
  { id: '2', name: 'Men\'s Cut', duration: '30 min', price: '$45' },
  { id: '3', name: 'Full Balayage', duration: '180 min', price: '$220+' },
  { id: '4', name: 'Root Touch Up', duration: '90 min', price: '$95' },
];

export function FrontDeskAgent() {
  const isMobile = useIsMobile();
  const [activeParentTab, setActiveParentTab] = useState('admin');
  const [activeAdminTab, setActiveAdminTab] = useState('overview');
  const [activeClientTab, setActiveClientTab] = useState('overview');
  const [isOnline, setIsOnline] = useState(true);

  return (
    <div className="flex flex-col gap-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-medium tracking-tight text-[var(--foreground)]">Front Desk Agent</h2>
          <p className="text-[var(--muted-foreground)]">Manage your virtual receptionist and website integration.</p>
        </div>
        <div className="flex items-center justify-between md:justify-start gap-3 bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] p-2 shadow-sm w-full md:w-auto">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-orange-500 animate-pulse' : 'bg-gray-300'}`} />
            <span className="font-medium text-sm text-[var(--foreground)]">{isOnline ? 'Agent Active' : 'Agent Paused'}</span>
          </div>
          <Switch checked={isOnline} onCheckedChange={setIsOnline} />
        </div>
      </div>

      <Tabs value={activeParentTab} onValueChange={setActiveParentTab} className="w-full">
        <TabsList 
          className="grid w-full grid-cols-2 bg-white/50 dark:bg-white/10 backdrop-blur-xl border border-white/20 mb-6"
          style={{
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--spacing-1)',
            height: 'auto',
            ...(isMobile && {
              position: 'sticky',
              top: '60px', // Offset for the main tabs which are at 0
              zIndex: 9, // Slightly lower than main tabs if we want them to stack under, or higher if over.
              // Actually, if main tabs are at 0, and these are at 60, they will stack nicely.
              // But I don't know the exact height of main tabs. "Actions" tab might be ~50px.
              // Let's guess 60px or just let them overlap/cover (top:0).
              // If I use top:0, they cover the main tabs.
              top: '0', 
              zIndex: 11 // Cover the main tabs
            })
          }}
        >
          <TabsTrigger 
            value="admin" 
            className="flex items-center justify-center border-none data-[state=active]:bg-white/50 data-[state=active]:text-orange-600 py-2 sm:py-2"
            style={{ borderRadius: 'var(--radius-lg)' }}
          >
            Admin Operations
          </TabsTrigger>
          <TabsTrigger 
            value="client" 
            className="flex items-center justify-center border-none data-[state=active]:bg-white/50 data-[state=active]:text-orange-600 py-2 sm:py-2"
            style={{ borderRadius: 'var(--radius-lg)' }}
          >
            Client Integration
          </TabsTrigger>
        </TabsList>

        {/* ADMIN PARENT TAB */}
        <TabsContent value="admin" className="space-y-6">
          <Tabs value={activeAdminTab} onValueChange={setActiveAdminTab} className="w-full">
          <TabsList 
            className={`${
              isMobile
                ? 'flex w-full overflow-x-auto scrollbar-hide bg-white/50 dark:bg-white/10 backdrop-blur-xl border border-white/20 gap-1'
                : 'grid w-full grid-cols-5 bg-white/50 dark:bg-white/10 backdrop-blur-xl border border-white/20'
            }`}
            style={{
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--spacing-1)',
              height: 'auto',
              ...(isMobile && {
                position: 'sticky',
                top: '0',
                zIndex: 12,
                marginBottom: 'var(--spacing-3)'
              })
            }}
          >
            <TabsTrigger 
              value="overview" 
              className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 border-none data-[state=active]:bg-white/50 data-[state=active]:text-orange-600 py-2 sm:py-2 px-2 sm:px-1 ${isMobile ? 'flex-shrink-0' : ''}`}
              style={{ borderRadius: 'var(--radius-lg)' }}
            >
              <BarChart3 className="w-4 h-4" />
              <span className="text-[10px] sm:text-sm whitespace-nowrap">Overview</span>
            </TabsTrigger>
            <TabsTrigger 
              value="knowledge" 
              className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 border-none data-[state=active]:bg-white/50 data-[state=active]:text-orange-600 py-2 sm:py-2 px-2 sm:px-1 ${isMobile ? 'flex-shrink-0' : ''}`}
              style={{ borderRadius: 'var(--radius-lg)' }}
            >
              <FileText className="w-4 h-4" />
              <span className="text-[10px] sm:text-sm whitespace-nowrap">Knowledge</span>
            </TabsTrigger>
            <TabsTrigger 
              value="scripts" 
              className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 border-none data-[state=active]:bg-white/50 data-[state=active]:text-orange-600 py-2 sm:py-2 px-2 sm:px-1 ${isMobile ? 'flex-shrink-0' : ''}`}
              style={{ borderRadius: 'var(--radius-lg)' }}
            >
              <Mic className="w-4 h-4" />
              <span className="text-[10px] sm:text-sm whitespace-nowrap">Scripts</span>
            </TabsTrigger>
            <TabsTrigger 
              value="integrations" 
              className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 border-none data-[state=active]:bg-white/50 data-[state=active]:text-orange-600 py-2 sm:py-2 px-2 sm:px-1 ${isMobile ? 'flex-shrink-0' : ''}`}
              style={{ borderRadius: 'var(--radius-lg)' }}
            >
              <Smartphone className="w-4 h-4" />
              <span className="text-[10px] sm:text-sm whitespace-nowrap">Connect</span>
            </TabsTrigger>
            <TabsTrigger 
              value="logs" 
              className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 border-none data-[state=active]:bg-white/50 data-[state=active]:text-orange-600 py-2 sm:py-2 px-2 sm:px-1 ${isMobile ? 'flex-shrink-0' : ''}`}
              style={{ borderRadius: 'var(--radius-lg)' }}
            >
              <History className="w-4 h-4" />
              <span className="text-[10px] sm:text-sm whitespace-nowrap">Logs</span>
            </TabsTrigger>
          </TabsList>

            {/* Admin Overview */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-[var(--card)] border-[var(--border)] shadow-sm">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between space-y-0 pb-2">
                      <p className="text-sm font-medium text-[var(--muted-foreground)]">Est. Cost Saved</p>
                      <DollarSign className="h-4 w-4 text-green-500" />
                    </div>
                    <div className="text-2xl font-bold text-[var(--foreground)]">$1,250<span className="text-xs font-normal text-[var(--muted-foreground)] ml-1">/mo</span></div>
                    <p className="text-xs text-[var(--muted-foreground)] mt-1">+12% from last month</p>
                  </CardContent>
                </Card>
                <Card className="bg-[var(--card)] border-[var(--border)] shadow-sm">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between space-y-0 pb-2">
                      <p className="text-sm font-medium text-[var(--muted-foreground)]">Calls Handled</p>
                      <Phone className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="text-2xl font-bold text-[var(--foreground)]">145</div>
                    <p className="text-xs text-[var(--muted-foreground)] mt-1">98% success rate</p>
                  </CardContent>
                </Card>
                <Card className="bg-[var(--card)] border-[var(--border)] shadow-sm">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between space-y-0 pb-2">
                      <p className="text-sm font-medium text-[var(--muted-foreground)]">Bookings Made</p>
                      <Calendar className="h-4 w-4 text-purple-500" />
                    </div>
                    <div className="text-2xl font-bold text-[var(--foreground)]">42</div>
                    <p className="text-xs text-[var(--muted-foreground)] mt-1">Est. value $3,400</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="col-span-1 bg-[var(--card)] border-[var(--border)] shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-[var(--foreground)]">Recent Activity</CardTitle>
                    <CardDescription className="text-[var(--muted-foreground)]">Latest interactions handled by your agent.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {MOCK_LOGS.slice(0, 3).map((log) => (
                        <div key={log.id} className="flex items-start gap-3 pb-3 border-b border-[var(--border)] last:border-0 last:pb-0">
                          <div className={`p-2 rounded-full shrink-0 ${
                            log.type === 'Call' ? 'bg-blue-100 text-blue-600' : 
                            log.type === 'SMS' ? 'bg-green-100 text-green-600' : 'bg-purple-100 text-purple-600'
                          }`}>
                            {log.type === 'Call' ? <Phone className="w-4 h-4" /> : 
                             log.type === 'SMS' ? <MessageSquare className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm font-medium truncate text-[var(--foreground)]">{log.customer}</p>
                              <span className="text-xs text-[var(--muted-foreground)]">{log.time}</span>
                            </div>
                            <p className="text-xs text-[var(--muted-foreground)] line-clamp-1">{log.summary}</p>
                            <div className="mt-1 flex items-center gap-2">
                              <Badge variant={log.outcome === 'Escalated' ? 'destructive' : 'secondary'} className="text-[10px] h-5 px-1.5">
                                {log.outcome}
                              </Badge>
                              {log.duration && <span className="text-[10px] text-[var(--muted-foreground)] flex items-center gap-1"><Clock className="w-3 h-3" /> {log.duration}</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button variant="ghost" className="w-full mt-4 text-xs" onClick={() => setActiveAdminTab('logs')}>
                      View All Logs <ChevronRight className="w-3 h-3 ml-1" />
                    </Button>
                  </CardContent>
                </Card>

                <Card className="col-span-1 bg-[var(--card)] border-[var(--border)] shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-[var(--foreground)]">Agent Status</CardTitle>
                    <CardDescription className="text-[var(--muted-foreground)]">Current operational capability.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-[var(--muted)]/50 rounded-[var(--radius)]">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                        <div>
                          <p className="text-sm font-medium text-[var(--foreground)]">Phone Line Connected</p>
                          <p className="text-xs text-[var(--muted-foreground)]">+1 (555) 012-3456</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" className="h-7 text-xs">Test</Button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-[var(--muted)]/50 rounded-[var(--radius)]">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                        <div>
                          <p className="text-sm font-medium text-[var(--foreground)]">Calendar Sync</p>
                          <p className="text-xs text-[var(--muted-foreground)]">Fresha connected</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" className="h-7 text-xs">Settings</Button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-yellow-500/10 rounded-[var(--radius)] border border-yellow-200 dark:border-yellow-900">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-500" />
                        <div>
                          <p className="text-sm font-medium text-[var(--foreground)]">Knowledge Gap</p>
                          <p className="text-xs text-[var(--muted-foreground)]">Agent unsure about holiday hours</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" className="h-7 text-xs bg-transparent border-yellow-200 hover:bg-yellow-100 dark:border-yellow-800 dark:hover:bg-yellow-900/50">Fix</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Admin Knowledge Base */}
            <TabsContent value="knowledge" className="space-y-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-64 flex-shrink-0 space-y-2">
                  <Button variant="secondary" className="w-full justify-start font-medium bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20 shadow-none">
                    <Scissors className="w-4 h-4 mr-2" /> Services & Pricing
                  </Button>
                  <Button variant="ghost" className="w-full justify-start text-[var(--muted-foreground)]">
                    <Clock className="w-4 h-4 mr-2" /> Hours & Location
                  </Button>
                  <Button variant="ghost" className="w-full justify-start text-[var(--muted-foreground)]">
                    <AlertCircle className="w-4 h-4 mr-2" /> Cancellation Policy
                  </Button>
                  <Button variant="ghost" className="w-full justify-start text-[var(--muted-foreground)]">
                    <Users className="w-4 h-4 mr-2" /> Staff Bios
                  </Button>
                </div>

                <Card className="flex-1 bg-[var(--card)] border-[var(--border)] shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-[var(--foreground)]">Services & Pricing</CardTitle>
                      <CardDescription className="text-[var(--muted-foreground)]">Maintain the list of services your agent can quote and book.</CardDescription>
                    </div>
                    <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Add Service</Button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {MOCK_SERVICES.map((service) => (
                        <div key={service.id} className="flex items-center justify-between p-3 border border-[var(--border)] rounded-[var(--radius)] hover:bg-[var(--muted)]/50 transition-colors">
                          <div>
                            <p className="font-medium text-[var(--foreground)]">{service.name}</p>
                            <div className="flex items-center gap-3 text-sm text-[var(--muted-foreground)] mt-1">
                              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {service.duration}</span>
                              <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> {service.price}</span>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">Edit</Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Admin Scripts */}
            <TabsContent value="scripts" className="space-y-6">
              <Card className="bg-[var(--card)] border-[var(--border)] shadow-sm">
                <CardHeader>
                  <CardTitle className="text-[var(--foreground)]">Agent Persona</CardTitle>
                  <CardDescription className="text-[var(--muted-foreground)]">Define how your front desk agent communicates.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-[var(--foreground)]">Tone of Voice</label>
                      <div className="flex flex-wrap gap-2">
                        {['Professional', 'Friendly', 'Casual', 'Energetic', 'Calm'].map((tone) => (
                          <Badge 
                            key={tone} 
                            variant={tone === 'Friendly' ? 'default' : 'outline'}
                            className="cursor-pointer px-3 py-1"
                          >
                            {tone}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-[var(--muted-foreground)]">Selected: <strong>Friendly</strong> - Warm, welcoming, and helpful.</p>
                    </div>
                    
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-[var(--foreground)]">Greeting Script</label>
                      <Textarea 
                        placeholder="Enter greeting..." 
                        defaultValue="Hi! Thanks for calling Studio Luxe. This is your virtual assistant. How can I help you achieve your hair goals today?"
                        className="h-24 bg-[var(--input-background)] border-[var(--border)]"
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-[var(--foreground)]">Escalation Rules</h3>
                    <div className="grid gap-4">
                      <div className="flex items-center justify-between p-4 border border-[var(--border)] rounded-[var(--radius)] bg-[var(--muted)]/30">
                        <div className="space-y-1">
                          <p className="font-medium text-sm text-[var(--foreground)]">Angry / Upset Client</p>
                          <p className="text-xs text-[var(--muted-foreground)]">Detects high sentiment frustration or keywords like "manager", "ruined".</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-[var(--muted-foreground)] mr-2">Action:</span>
                          <Badge variant="destructive">Transfer to Owner</Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-4 border border-[var(--border)] rounded-[var(--radius)] bg-[var(--muted)]/30">
                        <div className="space-y-1">
                          <p className="font-medium text-sm text-[var(--foreground)]">Complex Color Correction</p>
                          <p className="text-xs text-[var(--muted-foreground)]">Requests involving "correction", "black to blonde", "damaged".</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-[var(--muted-foreground)] mr-2">Action:</span>
                          <Badge variant="outline">Schedule Consultation</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Admin Integrations */}
            <TabsContent value="integrations" className="space-y-6">
              <div className="grid gap-6">
                <Card className="bg-[var(--card)] border-[var(--border)] shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-[var(--foreground)]">Communication Channels</CardTitle>
                    <CardDescription className="text-[var(--muted-foreground)]">Connect the lines your agent monitors.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between pb-4 border-b border-[var(--border)] last:border-0 last:pb-0">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-[var(--radius)]">
                          <Phone className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-medium text-[var(--foreground)]">Phone System (Twilio)</p>
                          <p className="text-sm text-[var(--muted-foreground)]">Forwarding enabled from +1 (555) 012-3456</p>
                        </div>
                      </div>
                      <Switch checked={true} />
                    </div>
                    <div className="flex items-center justify-between pb-4 border-b border-[var(--border)] last:border-0 last:pb-0">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-[var(--radius)]">
                          <MessageSquare className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-medium text-[var(--foreground)]">SMS / Texting</p>
                          <p className="text-sm text-[var(--muted-foreground)]">Handling appointment reminders and inquiries</p>
                        </div>
                      </div>
                      <Switch checked={true} />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[var(--card)] border-[var(--border)] shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-[var(--foreground)]">Booking System</CardTitle>
                    <CardDescription className="text-[var(--muted-foreground)]">Sync availability and create appointments.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-[var(--radius)]">
                          <Calendar className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-medium text-[var(--foreground)]">Fresha / Shedul</p>
                          <p className="text-sm text-[var(--muted-foreground)]">2-way sync active. Last synced 2 mins ago.</p>
                        </div>
                      </div>
                      <Button variant="outline">Configure</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Admin Logs */}
            <TabsContent value="logs" className="space-y-6">
              <Card className="bg-[var(--card)] border-[var(--border)] shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-[var(--foreground)]">Interaction Logs</CardTitle>
                    <CardDescription className="text-[var(--muted-foreground)]">Full history of calls, texts, and chats.</CardDescription>
                  </div>
                  <div className="flex gap-2">
                     <Button variant="outline" size="sm">Export CSV</Button>
                     <Button variant="outline" size="sm">Filter</Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                     {/* Desktop Table Header */}
                     <div className="hidden md:grid grid-cols-12 gap-4 p-3 font-medium text-sm text-[var(--muted-foreground)] border-b border-[var(--border)]">
                        <div className="col-span-1">Type</div>
                        <div className="col-span-3">Customer</div>
                        <div className="col-span-4">Summary</div>
                        <div className="col-span-2">Outcome</div>
                        <div className="col-span-2 text-right">Time</div>
                     </div>
                     
                     {/* Table Body */}
                     {[...MOCK_LOGS, ...MOCK_LOGS].map((log, idx) => (
                       <div key={`${log.id}-${idx}`} className="group p-3 text-sm hover:bg-[var(--muted)]/50 rounded-[var(--radius)] transition-colors cursor-pointer border-b border-[var(--border)] last:border-0 md:border-0">
                          {/* Desktop Grid View */}
                          <div className="hidden md:grid grid-cols-12 gap-4 items-center">
                            <div className="col-span-1">
                              {log.type === 'Call' && <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Call</Badge>}
                              {log.type === 'SMS' && <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">SMS</Badge>}
                              {log.type === 'Chat' && <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Chat</Badge>}
                            </div>
                            <div className="col-span-3 font-medium text-[var(--foreground)]">{log.customer}</div>
                            <div className="col-span-4 text-[var(--muted-foreground)] truncate">{log.summary}</div>
                            <div className="col-span-2">
                              <Badge variant={
                                log.outcome === 'Booked' ? 'default' : 
                                log.outcome === 'Escalated' ? 'destructive' : 'secondary'
                              } className="font-normal text-[10px] px-2">
                                {log.outcome}
                              </Badge>
                            </div>
                            <div className="col-span-2 text-right text-[var(--muted-foreground)]">{log.time}</div>
                          </div>

                          {/* Mobile Card View */}
                          <div className="flex flex-col gap-2 md:hidden">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {log.type === 'Call' && <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 h-5 px-1.5 text-[10px]">Call</Badge>}
                                {log.type === 'SMS' && <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 h-5 px-1.5 text-[10px]">SMS</Badge>}
                                {log.type === 'Chat' && <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 h-5 px-1.5 text-[10px]">Chat</Badge>}
                                <span className="font-medium text-[var(--foreground)]">{log.customer}</span>
                              </div>
                              <span className="text-[var(--muted-foreground)] text-xs">{log.time}</span>
                            </div>
                            <p className="text-[var(--muted-foreground)] text-xs truncate pl-1">{log.summary}</p>
                            <div className="flex items-center justify-between mt-0.5 pl-1">
                              <Badge variant={
                                log.outcome === 'Booked' ? 'default' : 
                                log.outcome === 'Escalated' ? 'destructive' : 'secondary'
                              } className="font-normal text-[10px] px-2 h-5">
                                {log.outcome}
                              </Badge>
                              {log.duration && <span className="text-[10px] text-[var(--muted-foreground)]">{log.duration}</span>}
                            </div>
                          </div>
                       </div>
                     ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* CLIENT PARENT TAB */}
        <TabsContent value="client" className="space-y-6">
          <Tabs value={activeClientTab} onValueChange={setActiveClientTab} className="w-full">
          <TabsList 
            className={`${
              isMobile
                ? 'flex w-full overflow-x-auto scrollbar-hide bg-white/50 dark:bg-white/10 backdrop-blur-xl border border-white/20 gap-1'
                : 'grid w-full grid-cols-7 bg-white/50 dark:bg-white/10 backdrop-blur-xl border border-white/20'
            }`}
            style={{
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--spacing-1)',
              height: 'auto',
              ...(isMobile && {
                position: 'sticky',
                top: '0',
                zIndex: 12,
                marginBottom: 'var(--spacing-3)'
              })
            }}
          >
            <TabsTrigger 
              value="overview" 
              className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 border-none data-[state=active]:bg-white/50 data-[state=active]:text-orange-600 py-2 sm:py-2 px-2 sm:px-1 ${isMobile ? 'flex-shrink-0' : ''}`}
              style={{ borderRadius: 'var(--radius-lg)' }}
            >
              <LayoutTemplate className="w-4 h-4" />
              <span className="text-[9px] sm:text-sm whitespace-nowrap">Overview</span>
            </TabsTrigger>
            <TabsTrigger 
              value="experience" 
              className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 border-none data-[state=active]:bg-white/50 data-[state=active]:text-orange-600 py-2 sm:py-2 px-2 sm:px-1 ${isMobile ? 'flex-shrink-0' : ''}`}
              style={{ borderRadius: 'var(--radius-lg)' }}
            >
              <Palette className="w-4 h-4" />
              <span className="text-[9px] sm:text-sm whitespace-nowrap">Design</span>
            </TabsTrigger>
            <TabsTrigger 
              value="booking" 
              className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 border-none data-[state=active]:bg-white/50 data-[state=active]:text-orange-600 py-2 sm:py-2 px-2 sm:px-1 ${isMobile ? 'flex-shrink-0' : ''}`}
              style={{ borderRadius: 'var(--radius-lg)' }}
            >
              <Calendar className="w-4 h-4" />
              <span className="text-[9px] sm:text-sm whitespace-nowrap">Booking</span>
            </TabsTrigger>
            <TabsTrigger 
              value="staff" 
              className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 border-none data-[state=active]:bg-white/50 data-[state=active]:text-orange-600 py-2 sm:py-2 px-2 sm:px-1 ${isMobile ? 'flex-shrink-0' : ''}`}
              style={{ borderRadius: 'var(--radius-lg)' }}
            >
              <Users className="w-4 h-4" />
              <span className="text-[9px] sm:text-sm whitespace-nowrap">Staff</span>
            </TabsTrigger>
            <TabsTrigger 
              value="voice" 
              className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 border-none data-[state=active]:bg-white/50 data-[state=active]:text-orange-600 py-2 sm:py-2 px-2 sm:px-1 ${isMobile ? 'flex-shrink-0' : ''}`}
              style={{ borderRadius: 'var(--radius-lg)' }}
            >
              <Headphones className="w-4 h-4" />
              <span className="text-[9px] sm:text-sm whitespace-nowrap">Voice</span>
            </TabsTrigger>
            <TabsTrigger 
              value="embed" 
              className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 border-none data-[state=active]:bg-white/50 data-[state=active]:text-orange-600 py-2 sm:py-2 px-2 sm:px-1 ${isMobile ? 'flex-shrink-0' : ''}`}
              style={{ borderRadius: 'var(--radius-lg)' }}
            >
              <Code className="w-4 h-4" />
              <span className="text-[9px] sm:text-sm whitespace-nowrap">Embed</span>
            </TabsTrigger>
            <TabsTrigger 
              value="logs" 
              className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 border-none data-[state=active]:bg-white/50 data-[state=active]:text-orange-600 py-2 sm:py-2 px-2 sm:px-1 ${isMobile ? 'flex-shrink-0' : ''}`}
              style={{ borderRadius: 'var(--radius-lg)' }}
            >
              <Terminal className="w-4 h-4" />
              <span className="text-[9px] sm:text-sm whitespace-nowrap">Logs</span>
            </TabsTrigger>
          </TabsList>

            {/* Client Overview */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-[var(--card)] border-[var(--border)] shadow-sm">
                  <CardContent className="pt-6">
                    <p className="text-sm font-medium text-[var(--muted-foreground)]">Widget Loads</p>
                    <div className="text-2xl font-bold text-[var(--foreground)] mt-2">12,450</div>
                    <p className="text-xs text-green-500 mt-1 flex items-center">
                      <ChevronRight className="w-3 h-3 rotate-[-45deg]" /> +5.2%
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-[var(--card)] border-[var(--border)] shadow-sm">
                  <CardContent className="pt-6">
                    <p className="text-sm font-medium text-[var(--muted-foreground)]">Engagements</p>
                    <div className="text-2xl font-bold text-[var(--foreground)] mt-2">843</div>
                    <p className="text-xs text-green-500 mt-1 flex items-center">
                      <ChevronRight className="w-3 h-3 rotate-[-45deg]" /> +12%
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-[var(--card)] border-[var(--border)] shadow-sm">
                  <CardContent className="pt-6">
                    <p className="text-sm font-medium text-[var(--muted-foreground)]">Appointments</p>
                    <div className="text-2xl font-bold text-[var(--foreground)] mt-2">128</div>
                    <p className="text-xs text-green-500 mt-1 flex items-center">
                      <ChevronRight className="w-3 h-3 rotate-[-45deg]" /> +3%
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-[var(--card)] border-[var(--border)] shadow-sm">
                  <CardContent className="pt-6">
                    <p className="text-sm font-medium text-[var(--muted-foreground)]">Conversion Rate</p>
                    <div className="text-2xl font-bold text-[var(--foreground)] mt-2">15.2%</div>
                    <p className="text-xs text-red-500 mt-1 flex items-center">
                      <ChevronRight className="w-3 h-3 rotate-[45deg]" /> -1.2%
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-[var(--card)] border-[var(--border)] shadow-sm">
                <CardHeader>
                  <CardTitle className="text-[var(--foreground)]">Engagement Trends</CardTitle>
                  <CardDescription className="text-[var(--muted-foreground)]">How users are interacting with the Cofounder widget on your site.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full bg-[var(--muted)]/30 rounded-[var(--radius)] flex items-center justify-center border border-dashed border-[var(--border)]">
                    <div className="text-center text-[var(--muted-foreground)]">
                      <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>Chart Visualization Placeholder</p>
                      <p className="text-xs">Widget usage over the last 30 days</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Client Customer Experience */}
            <TabsContent value="experience" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <Card className="bg-[var(--card)] border-[var(--border)] shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-[var(--foreground)]">Widget Appearance</CardTitle>
                      <CardDescription className="text-[var(--muted-foreground)]">Customize how the tool looks on your website.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-3">
                        <label className="text-sm font-medium text-[var(--foreground)]">Primary Color</label>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#000000] border-2 border-white ring-1 ring-[var(--border)] cursor-pointer" />
                          <div className="w-10 h-10 rounded-full bg-[#3b82f6] border-2 border-transparent cursor-pointer" />
                          <div className="w-10 h-10 rounded-full bg-[#ef4444] border-2 border-transparent cursor-pointer" />
                          <div className="w-10 h-10 rounded-full bg-[#10b981] border-2 border-transparent cursor-pointer" />
                          <div className="w-10 h-10 rounded-full bg-white border border-[var(--border)] flex items-center justify-center cursor-pointer">
                            <Plus className="w-4 h-4 text-[var(--muted-foreground)]" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-sm font-medium text-[var(--foreground)]">Widget Position</label>
                        <div className="flex gap-4">
                          <div className="flex-1 p-4 border border-[var(--primary)] bg-[var(--primary)]/5 rounded-[var(--radius)] flex items-center justify-between cursor-pointer">
                            <span>Bottom Right</span>
                            <div className="w-4 h-4 rounded-full border border-[var(--primary)] bg-[var(--primary)]" />
                          </div>
                          <div className="flex-1 p-4 border border-[var(--border)] rounded-[var(--radius)] flex items-center justify-between cursor-pointer hover:bg-[var(--muted)]/50">
                            <span>Bottom Left</span>
                            <div className="w-4 h-4 rounded-full border border-[var(--border)]" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-sm font-medium text-[var(--foreground)]">Launcher Icon</label>
                        <div className="flex gap-3">
                          <Button variant="outline" className="h-12 w-12 rounded-full p-0"><MessageSquare className="w-5 h-5" /></Button>
                          <Button variant="outline" className="h-12 w-12 rounded-full p-0 bg-[var(--primary)] text-[var(--primary-foreground)]"><Scissors className="w-5 h-5" /></Button>
                          <Button variant="outline" className="h-12 w-12 rounded-full p-0"><Users className="w-5 h-5" /></Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-[var(--card)] border-[var(--border)] shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-[var(--foreground)]">Welcome Message</CardTitle>
                      <CardDescription className="text-[var(--muted-foreground)]">What the tool says when a user opens it.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                         <label className="text-sm font-medium text-[var(--foreground)]">Greeting Text</label>
                         <Input defaultValue="Hi there! 👋 I can help you book an appointment or answer any questions." />
                      </div>
                      <div className="flex items-center justify-between">
                         <div className="space-y-0.5">
                            <label className="text-sm font-medium text-[var(--foreground)]">Auto-open on load</label>
                            <p className="text-xs text-[var(--muted-foreground)]">Open the chat window automatically after a delay.</p>
                         </div>
                         <Switch />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Preview */}
                <div className="lg:col-span-1">
                  <div className="sticky top-6">
                    <div className="bg-white rounded-[20px] border border-[var(--border)] shadow-xl overflow-hidden h-[600px] relative flex flex-col">
                      <div className="bg-[var(--muted)] h-12 flex items-center px-4 border-b border-[var(--border)]">
                        <div className="flex gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                          <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                        </div>
                      </div>
                      <div className="flex-1 bg-gray-50 relative p-4">
                         <div className="absolute top-10 left-8 right-8 h-32 bg-gray-200 rounded-lg opacity-50" />
                         <div className="absolute top-48 left-8 right-8 h-32 bg-gray-200 rounded-lg opacity-50" />
                         <div className="absolute top-[350px] left-8 right-8 h-32 bg-gray-200 rounded-lg opacity-50" />

                         {/* Mock Widget */}
                         <div className="absolute bottom-4 right-4 flex flex-col items-end gap-4">
                            <motion.div 
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="w-64 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
                            >
                              <div className="bg-black text-white p-3 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-green-400" />
                                  <span className="text-xs font-medium">Cofounder Assistant</span>
                                </div>
                                <ChevronRight className="w-4 h-4 rotate-90" />
                              </div>
                              <div className="p-3 space-y-3 h-48 bg-gray-50">
                                <div className="bg-gray-200 rounded-t-xl rounded-br-xl p-2 text-xs max-w-[80%] text-gray-800">
                                  Hi there! 👋 I can help you book an appointment.
                                </div>
                              </div>
                              <div className="p-2 border-t bg-white">
                                <div className="h-8 bg-gray-100 rounded-full w-full" />
                              </div>
                            </motion.div>
                            <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center shadow-lg text-white">
                               <Scissors className="w-6 h-6" />
                            </div>
                         </div>
                      </div>
                    </div>
                    <p className="text-center text-xs text-[var(--muted-foreground)] mt-4">Preview of your website integration</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Client Booking & Scheduling */}
            <TabsContent value="booking" className="space-y-6">
              <Card className="bg-[var(--card)] border-[var(--border)] shadow-sm">
                <CardHeader>
                  <CardTitle className="text-[var(--foreground)]">Booking Configuration</CardTitle>
                  <CardDescription className="text-[var(--muted-foreground)]">Control how the widget handles appointments.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                   <div className="flex items-center justify-between p-4 border border-[var(--border)] rounded-[var(--radius)]">
                      <div className="flex items-center gap-4">
                         <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                            <Calendar className="w-6 h-6" />
                         </div>
                         <div>
                            <p className="font-medium text-[var(--foreground)]">Connected to Fresha</p>
                            <p className="text-xs text-[var(--muted-foreground)]">Syncing real-time availability</p>
                         </div>
                      </div>
                      <Button variant="outline" size="sm">Manage Connection</Button>
                   </div>

                   <Separator />

                   <div className="space-y-4">
                      <div className="flex items-center justify-between">
                         <div className="space-y-0.5">
                            <label className="text-sm font-medium text-[var(--foreground)]">Allow Cancellations</label>
                            <p className="text-xs text-[var(--muted-foreground)]">Customers can cancel via chat up to 24h before.</p>
                         </div>
                         <Switch checked={true} />
                      </div>
                      <div className="flex items-center justify-between">
                         <div className="space-y-0.5">
                            <label className="text-sm font-medium text-[var(--foreground)]">Allow Rescheduling</label>
                            <p className="text-xs text-[var(--muted-foreground)]">Customers can move their appointment time.</p>
                         </div>
                         <Switch checked={true} />
                      </div>
                      <div className="flex items-center justify-between">
                         <div className="space-y-0.5">
                            <label className="text-sm font-medium text-[var(--foreground)]">Collect Deposit</label>
                            <p className="text-xs text-[var(--muted-foreground)]">Require credit card for booking (via Stripe).</p>
                         </div>
                         <Switch />
                      </div>
                   </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Client Staff & Services */}
            <TabsContent value="staff" className="space-y-6">
               <Card className="bg-[var(--card)] border-[var(--border)] shadow-sm">
                  <CardHeader>
                     <CardTitle className="text-[var(--foreground)]">Visible Services</CardTitle>
                     <CardDescription className="text-[var(--muted-foreground)]">Select which services can be booked via the widget.</CardDescription>
                  </CardHeader>
                  <CardContent>
                     <div className="space-y-4">
                        {MOCK_SERVICES.map((service) => (
                           <div key={service.id} className="flex items-center justify-between p-3 border border-[var(--border)] rounded-[var(--radius)]">
                              <div>
                                 <p className="font-medium text-[var(--foreground)]">{service.name}</p>
                                 <p className="text-xs text-[var(--muted-foreground)]">{service.duration} • {service.price}</p>
                              </div>
                              <Switch checked={true} />
                           </div>
                        ))}
                     </div>
                  </CardContent>
               </Card>
            </TabsContent>

            {/* Client Phone & Voice */}
            <TabsContent value="voice" className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-[var(--card)] border-[var(--border)] shadow-sm">
                     <CardHeader>
                        <CardTitle className="text-[var(--foreground)]">Voice Settings</CardTitle>
                        <CardDescription className="text-[var(--muted-foreground)]">Configure the voice for call handling.</CardDescription>
                     </CardHeader>
                     <CardContent className="space-y-6">
                        <div className="space-y-3">
                           <label className="text-sm font-medium text-[var(--foreground)]">Agent Voice</label>
                           <div className="grid grid-cols-2 gap-3">
                              <div className="p-3 border-2 border-[var(--primary)] bg-[var(--primary)]/5 rounded-[var(--radius)] cursor-pointer relative">
                                 <div className="flex items-center gap-2 mb-1">
                                    <Headphones className="w-4 h-4" />
                                    <span className="font-medium text-sm">Sarah</span>
                                 </div>
                                 <p className="text-xs text-[var(--muted-foreground)]">American, Friendly</p>
                                 <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[var(--primary)]" />
                              </div>
                              <div className="p-3 border border-[var(--border)] rounded-[var(--radius)] cursor-pointer hover:bg-[var(--muted)]/50">
                                 <div className="flex items-center gap-2 mb-1">
                                    <Headphones className="w-4 h-4" />
                                    <span className="font-medium text-sm">James</span>
                                 </div>
                                 <p className="text-xs text-[var(--muted-foreground)]">British, Formal</p>
                              </div>
                           </div>
                           <Button variant="ghost" size="sm" className="w-full mt-2"><Play className="w-3 h-3 mr-2" /> Test Voice</Button>
                        </div>
                        
                        <div className="space-y-3">
                           <label className="text-sm font-medium text-[var(--foreground)]">Speech Speed</label>
                           <div className="flex items-center gap-4">
                              <span className="text-xs text-[var(--muted-foreground)]">Slow</span>
                              <div className="flex-1 h-2 bg-[var(--muted)] rounded-full overflow-hidden">
                                 <div className="w-1/2 h-full bg-[var(--primary)] rounded-full" />
                              </div>
                              <span className="text-xs text-[var(--muted-foreground)]">Fast</span>
                           </div>
                        </div>
                     </CardContent>
                  </Card>

                  <Card className="bg-[var(--card)] border-[var(--border)] shadow-sm">
                     <CardHeader>
                        <CardTitle className="text-[var(--foreground)]">Call Handling</CardTitle>
                        <CardDescription className="text-[var(--muted-foreground)]">Rules for incoming calls.</CardDescription>
                     </CardHeader>
                     <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                           <div className="space-y-0.5">
                              <label className="text-sm font-medium text-[var(--foreground)]">Background Noise</label>
                              <p className="text-xs text-[var(--muted-foreground)]">Add subtle salon ambience to the call.</p>
                           </div>
                           <Switch checked={true} />
                        </div>
                        <div className="flex items-center justify-between">
                           <div className="space-y-0.5">
                              <label className="text-sm font-medium text-[var(--foreground)]">After Hours</label>
                              <p className="text-xs text-[var(--muted-foreground)]">Take messages instead of booking.</p>
                           </div>
                           <Switch checked={true} />
                        </div>
                     </CardContent>
                  </Card>
               </div>
            </TabsContent>

            {/* Client Embed & Links */}
            <TabsContent value="embed" className="space-y-6">
               <Card className="bg-[var(--card)] border-[var(--border)] shadow-sm">
                  <CardHeader>
                     <CardTitle className="text-[var(--foreground)]">Embed Code</CardTitle>
                     <CardDescription className="text-[var(--muted-foreground)]">Add this code to your website to install the widget.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                     <div className="relative">
                        <pre className="p-4 rounded-[var(--radius)] bg-slate-950 text-slate-50 text-sm overflow-x-auto">
                           <code>
{`<script>
  window.cofounderConfig = {
    id: "cf_129384728",
    theme: "dark",
    position: "bottom-right"
  };
</script>
<script src="https://cdn.cofounder.plus/widget/v1.js" async></script>`}
                           </code>
                        </pre>
                        <Button size="icon" variant="secondary" className="absolute top-2 right-2 h-8 w-8">
                           <Copy className="w-4 h-4" />
                        </Button>
                     </div>
                     <p className="text-sm text-[var(--muted-foreground)]">
                        Paste this snippet before the closing <code>&lt;/body&gt;</code> tag on every page where you want the widget to appear.
                     </p>
                  </CardContent>
               </Card>

               <Card className="bg-[var(--card)] border-[var(--border)] shadow-sm">
                  <CardHeader>
                     <CardTitle className="text-[var(--foreground)]">Direct Links</CardTitle>
                     <CardDescription className="text-[var(--muted-foreground)]">Shareable links for your customers.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                     <div className="flex gap-2">
                        <Input value="https://booking.cofounder.plus/studio-luxe" readOnly className="bg-[var(--muted)]" />
                        <Button variant="outline"><Copy className="w-4 h-4 mr-2" /> Copy</Button>
                        <Button variant="outline"><ExternalLink className="w-4 h-4" /></Button>
                     </div>
                  </CardContent>
               </Card>
            </TabsContent>

            {/* Client Logs & Transcripts */}
            <TabsContent value="logs" className="space-y-6">
               <Card className="bg-[var(--card)] border-[var(--border)] shadow-sm">
                 <CardHeader>
                   <CardTitle className="text-[var(--foreground)]">Web Widget Transcripts</CardTitle>
                   <CardDescription className="text-[var(--muted-foreground)]">Chats from your website integration.</CardDescription>
                 </CardHeader>
                 <CardContent>
                   <div className="space-y-1">
                      {MOCK_LOGS.filter(l => l.type === 'Chat').map((log, idx) => (
                        <div key={`${log.id}-${idx}-chat`} className="flex items-center justify-between p-3 hover:bg-[var(--muted)]/50 rounded-[var(--radius)] transition-colors cursor-pointer border-b border-[var(--border)] last:border-0">
                           <div className="flex items-center gap-4">
                              <div className="p-2 bg-purple-100 text-purple-600 rounded-full">
                                 <MessageSquare className="w-4 h-4" />
                              </div>
                              <div>
                                 <p className="font-medium text-[var(--foreground)]">{log.customer}</p>
                                 <p className="text-xs text-[var(--muted-foreground)]">{log.summary}</p>
                              </div>
                           </div>
                           <div className="text-right">
                              <p className="text-xs text-[var(--muted-foreground)]">{log.time}</p>
                              <Button variant="link" className="h-auto p-0 text-xs">View Transcript</Button>
                           </div>
                        </div>
                      ))}
                      {MOCK_LOGS.filter(l => l.type === 'Chat').map((log, idx) => (
                        <div key={`${log.id}-${idx}-chat-dup`} className="flex items-center justify-between p-3 hover:bg-[var(--muted)]/50 rounded-[var(--radius)] transition-colors cursor-pointer border-b border-[var(--border)] last:border-0">
                           <div className="flex items-center gap-4">
                              <div className="p-2 bg-purple-100 text-purple-600 rounded-full">
                                 <MessageSquare className="w-4 h-4" />
                              </div>
                              <div>
                                 <p className="font-medium text-[var(--foreground)]">{log.customer}</p>
                                 <p className="text-xs text-[var(--muted-foreground)]">{log.summary}</p>
                              </div>
                           </div>
                           <div className="text-right">
                              <p className="text-xs text-[var(--muted-foreground)]">{log.time}</p>
                              <Button variant="link" className="h-auto p-0 text-xs">View Transcript</Button>
                           </div>
                        </div>
                      ))}
                   </div>
                 </CardContent>
               </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
}
