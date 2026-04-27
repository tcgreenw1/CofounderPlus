import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../ui/card';
import { Button } from '../../ui/button';
import { Scissors, Clock, AlertCircle, Users, Plus, DollarSign } from 'lucide-react';
import { MOCK_SERVICES } from './mockData';

export function FrontDeskKnowledge() {
  return (
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
  );
}
