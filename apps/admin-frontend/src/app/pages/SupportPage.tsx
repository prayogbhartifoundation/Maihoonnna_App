import React, { useEffect, useState } from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { StatusChip } from '../components/common/StatusChip';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { supportApi } from '../../services/api';
import type { SupportTicket } from '../../types';
import { AlertCircle, User } from 'lucide-react';
import { toast } from 'sonner';

export default function SupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const data = await supportApi.getAll();
    setTickets(data);
  };

  const handleStatusUpdate = async (ticketId: string, status: SupportTicket['status']) => {
    try {
      await supportApi.updateStatus(ticketId, status);
      await loadData();
      toast.success('Ticket status updated');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-destructive/10 text-destructive';
      case 'high': return 'bg-[#FF7A00]/10 text-[#FF7A00]';
      case 'medium': return 'bg-blue-50 text-blue-700';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  return (
    <div>
      <PageHeader title="Support Team" description="Internal help-desk for issue tickets" />
      
      <div className="space-y-4">
        {tickets.map((ticket) => (
          <div key={ticket.id} className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold">{ticket.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(ticket.priority)}`}>
                    {ticket.priority}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{ticket.description}</p>
              </div>
              <StatusChip status={ticket.status} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Reported By</p>
                  <p className="font-medium">{ticket.reportedBy}</p>
                  <p className="text-xs text-muted-foreground capitalize">{ticket.reporterRole.replace('_', ' ')}</p>
                </div>
              </div>
              
              <div>
                <p className="text-xs text-muted-foreground">Category</p>
                <p className="font-medium">{ticket.category}</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="text-sm">{new Date(ticket.createdAt).toLocaleDateString()}</p>
              </div>

              {ticket.assignedTo && (
                <div>
                  <p className="text-xs text-muted-foreground">Assigned To</p>
                  <p className="font-medium">{ticket.assignedTo}</p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-border">
              <span className="text-sm text-muted-foreground">Update Status:</span>
              <Select
                value={ticket.status}
                onValueChange={(value) => handleStatusUpdate(ticket.id, value as SupportTicket['status'])}
              >
                <SelectTrigger className="w-40 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
