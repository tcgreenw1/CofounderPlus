import React, { useState, useCallback } from 'react';
import { DollarSign, CheckCircle, Mail } from 'lucide-react';
import { supabase } from '../../../utils/supabase/client';
import { projectId } from '../../../utils/supabase/info';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { Label } from '../../ui/label';
import { toast } from "sonner@2.0.3";

interface Invoice {
  id: string;
  invoice_number: string;
  client_name: string;
  client_email: string;
  amount: number;
  tax_amount: number;
  total_amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  issue_date: string;
  due_date: string;
  items: {
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
  }[];
  notes?: string;
  created_at: string;
}

interface InvoiceFormProps {
  onInvoiceAdded: (invoice: Invoice) => void;
  selectedBusiness: any;
  user: any;
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({ onInvoiceAdded, selectedBusiness, user }) => {
  const [formData, setFormData] = useState({
    client_name: '',
    client_email: '',
    amount: 0,
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  const updateFormData = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!formData.client_name || !formData.amount || !selectedBusiness) return;

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (accessToken && user) {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/finance/invoices?businessId=${selectedBusiness.id}`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
          }
        );

        if (response.ok) {
          const result = await response.json();
          onInvoiceAdded(result.invoice);
          toast.success("Invoice created successfully!");
          return;
        } else {
          const errorText = await response.text();
          toast.error(`Failed to create invoice: ${errorText}`);
        }
      }

      // Fallback to local state
      const taxAmount = formData.amount * 0.1;
      const invoice: Invoice = {
        id: Date.now().toString(),
        invoice_number: `INV-${Date.now()}`,
        client_name: formData.client_name,
        client_email: formData.client_email,
        amount: formData.amount,
        tax_amount: taxAmount,
        total_amount: formData.amount + taxAmount,
        status: 'draft',
        issue_date: new Date().toISOString().split('T')[0],
        due_date: formData.due_date,
        items: [
          {
            description: formData.notes || 'Service provided',
            quantity: 1,
            unit_price: formData.amount,
            total: formData.amount
          }
        ],
        notes: formData.notes,
        created_at: new Date().toISOString()
      };

      onInvoiceAdded(invoice);
    } catch (error) {
      console.error('Error creating invoice:', error);
    } finally {
      setLoading(false);
    }
  }, [formData, selectedBusiness, user, onInvoiceAdded]);

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="client_name" className="text-lg mb-3 block">
            Client Name
          </Label>
          <Input
            id="client_name"
            value={formData.client_name}
            onChange={(e) => updateFormData('client_name', e.target.value)}
            placeholder="e.g., John Smith or ABC Company"
            className="text-lg h-12"
          />
        </div>

        <div>
          <Label htmlFor="client_email" className="text-lg mb-3 block">
            Client Email
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              id="client_email"
              type="email"
              value={formData.client_email}
              onChange={(e) => updateFormData('client_email', e.target.value)}
              placeholder="client@company.com"
              className="pl-10 text-lg h-12"
            />
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="amount" className="text-lg mb-3 block">
            Invoice Amount
          </Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={formData.amount || ''}
              onChange={(e) => updateFormData('amount', Number(e.target.value))}
              placeholder="0.00"
              className="pl-10 text-lg h-12"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="due_date" className="text-lg mb-3 block">
            Due Date
          </Label>
          <Input
            id="due_date"
            type="date"
            value={formData.due_date}
            onChange={(e) => updateFormData('due_date', e.target.value)}
            className="text-lg h-12"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="notes" className="text-lg mb-3 block">
          Description/Notes
        </Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => updateFormData('notes', e.target.value)}
          placeholder="e.g., Web development services for Q4 2023"
          className="min-h-20"
        />
      </div>

      <div className="flex justify-end">
        <Button 
          onClick={handleSubmit}
          disabled={!formData.client_name || !formData.amount || loading}
          className="bg-gradient-to-r from-blue-600 to-purple-600"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Create Invoice
            </>
          )}
        </Button>
      </div>
    </div>
  );
};