import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Textarea } from '../../ui/textarea';
import { Separator } from '../../ui/separator';

export function FrontDeskScripts() {
  return (
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
  );
}
