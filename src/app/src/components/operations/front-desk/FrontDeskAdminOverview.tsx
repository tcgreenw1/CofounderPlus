import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { 
  BarChart3, 
  Phone, 
  Calendar, 
  DollarSign, 
  MessageSquare, 
  Clock, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { MOCK_LOGS } from './mockData';

export function FrontDeskAdminOverview({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
  return (
    <div className="space-y-6">
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
            <Button variant="ghost" className="w-full mt-4 text-xs" onClick={() => setActiveTab('logs')}>
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
    </div>
  );
}
