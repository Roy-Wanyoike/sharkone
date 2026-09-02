'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  ArrowLeft,
  Send,
  MessageSquare,
  Clock,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Footer } from '@/components/ecommerce/Footer';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface TicketMessage {
  id: string;
  message: string;
  isInternal: boolean;
  createdAt: string;
  user?: { id: string; name: string; email: string; avatar: string | null; role: string } | null;
}

interface Ticket {
  id: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; name: string; email: string; avatar: string | null } | null;
  _count?: { messages: number };
}

/* ------------------------------------------------------------------ */
/*  Status / Priority helpers                                         */
/* ------------------------------------------------------------------ */
const statusColors: Record<string, string> = {
  OPEN: 'bg-green-100 text-green-700 border-green-200',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 border-blue-200',
  WAITING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  RESOLVED: 'bg-purple-100 text-purple-700 border-purple-200',
  CLOSED: 'bg-gray-100 text-gray-500 border-gray-200',
};

const statusLabels: Record<string, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  WAITING: 'Waiting',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
};

const priorityColors: Record<string, string> = {
  LOW: 'text-gray-500',
  MEDIUM: 'text-blue-500',
  HIGH: 'text-orange-500',
  URGENT: 'text-red-500',
};

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString();
}

/* ------------------------------------------------------------------ */
/*  Simple Navbar                                                     */
/* ------------------------------------------------------------------ */
function SimpleNavbar() {
  const [open, setOpen] = useState(false);
  const links = [
    { label: 'Home', href: '/' },
    { label: 'Support', href: '/support' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ];

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-16 lg:px-32 py-3 backdrop-blur-md border-b border-gray-200 bg-white/90 shadow-sm">
      <Link href="/" className="flex items-center gap-2.5 shrink-0">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path d="M16 4C14 4 10 8 8 12C6 16 6 22 8 26C10 28 14 28 16 28C18 28 22 28 24 26C26 22 26 16 24 12C22 8 18 4 16 4Z" fill="#0F172A" />
          <path d="M16 4C15 4 13 6 12 8C11 10 11 14 12 16C13 17 15 17 16 17C17 17 19 17 20 16C21 14 21 10 20 8C19 6 17 4 16 4Z" fill="#F59E0B" />
        </svg>
        <span className="text-xl font-bold tracking-tight">
          <span className="text-[#0F172A]">SHARK</span>
          <span className="text-[#F59E0B]">ONE</span>
        </span>
      </Link>

      <div className="hidden md:flex items-center gap-8">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`text-sm font-medium transition-colors ${l.href === '/support' ? 'text-amber-600' : 'text-gray-700 hover:text-amber-600'}`}
          >
            {l.label}
          </Link>
        ))}
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="md:hidden text-gray-600"
        onClick={() => setOpen(!open)}
        aria-label="Toggle menu"
      >
        {open ? '✕' : '☰'}
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg md:hidden"
          >
            <div className="flex flex-col p-4 gap-1">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className={`py-2.5 text-sm font-medium px-3 rounded-lg hover:bg-gray-50 ${l.href === '/support' ? 'text-amber-600' : 'text-gray-700'}`}
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/*  New Ticket Dialog                                                  */
/* ------------------------------------------------------------------ */
function NewTicketDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, description, priority }),
      });
      if (!res.ok) throw new Error('Failed to create ticket');
      toast.success('Ticket created successfully');
      setSubject('');
      setDescription('');
      setPriority('MEDIUM');
      setOpen(false);
      onCreated();
    } catch {
      toast.error('Failed to create ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-amber-500 hover:bg-amber-600 text-white gap-2">
          <Plus className="h-4 w-4" />
          New Ticket
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-[#0F172A]">Create Support Ticket</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="ticket-subject">Subject</Label>
            <Input
              id="ticket-subject"
              placeholder="Brief description of your issue"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ticket-desc">Description</Label>
            <Textarea
              id="ticket-desc"
              placeholder="Describe your issue in detail..."
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="URGENT">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#0F172A] hover:bg-slate-800 text-white"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </span>
            ) : (
              'Create Ticket'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/*  Ticket Detail View                                                 */
/* ------------------------------------------------------------------ */
function TicketDetail({
  ticketId,
  onBack,
}: {
  ticketId: string;
  onBack: () => void;
}) {
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  const { data: ticket, isLoading } = useQuery({
    queryKey: ['support-ticket', ticketId],
    queryFn: () => fetch(`/api/support/tickets/${ticketId}`).then((r) => r.json()),
    enabled: !!ticketId,
  });

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/support/tickets/${ticketId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newMessage }),
      });
      if (!res.ok) throw new Error();
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['support-ticket', ticketId] });
    } catch {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const closeTicket = async () => {
    try {
      const res = await fetch(`/api/support/tickets/${ticketId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Ticket closed');
      queryClient.invalidateQueries({ queryKey: ['support-ticket', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
    } catch {
      toast.error('Failed to close ticket');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-20 text-gray-500">
        <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
        <p>Ticket not found</p>
      </div>
    );
  }

  const messages: TicketMessage[] = ticket.messages ?? [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1 text-gray-600">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="text-lg text-[#0F172A]">{ticket.subject}</CardTitle>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatTime(ticket.createdAt)}</span>
                <span>#{ticket.id.slice(0, 8)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={statusColors[ticket.status] || ''}>
                {statusLabels[ticket.status] || ticket.status}
              </Badge>
              <span className={`text-xs font-medium ${priorityColors[ticket.priority] || ''}`}>
                {ticket.priority}
              </span>
              {ticket.status !== 'CLOSED' && (
                <Button variant="outline" size="sm" onClick={closeTicket} className="text-xs ml-2">
                  Close Ticket
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Messages */}
          <ScrollArea className="max-h-[420px] pr-2">
            <div className="space-y-4">
              {messages.map((msg: TicketMessage) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.isInternal ? 'bg-amber-50 border border-amber-200 rounded-lg p-3' : ''}`}
                >
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${
                      msg.user?.role === 'ADMIN' ? 'bg-[#0F172A]' : 'bg-amber-500'
                    }`}
                  >
                    {msg.user?.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-[#0F172A]">
                        {msg.user?.name || 'Unknown'}
                      </span>
                      {msg.isInternal && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-700 border-amber-200">
                          Internal
                        </Badge>
                      )}
                      <span className="text-[11px] text-gray-400">{formatTime(msg.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">{msg.message}</p>
                  </div>
                </div>
              ))}
              {messages.length === 0 && (
                <div className="text-center py-10 text-gray-400 text-sm">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  No messages yet
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Message Input */}
          {ticket.status !== 'CLOSED' && (
            <div className="mt-4 flex gap-2">
              <Textarea
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                rows={2}
                className="flex-1 resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    sendMessage();
                  }
                }}
              />
              <Button
                onClick={sendMessage}
                disabled={sending || !newMessage.trim()}
                className="self-end bg-amber-500 hover:bg-amber-600 text-white gap-1"
                size="sm"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Ticket List View                                                   */
/* ------------------------------------------------------------------ */
function TicketList({ onSelectTicket }: { onSelectTicket: (id: string) => void }) {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');

  const { data: tickets, isLoading, refetch } = useQuery({
    queryKey: ['support-tickets', statusFilter, priorityFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (priorityFilter !== 'ALL') params.set('priority', priorityFilter);
      const qs = params.toString();
      return fetch(`/api/support/tickets${qs ? `?${qs}` : ''}`).then((r) => r.json());
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  const ticketList: Ticket[] = tickets ?? [];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Filter className="h-4 w-4 text-gray-400" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px] h-8 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="OPEN">Open</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="WAITING">Waiting</SelectItem>
            <SelectItem value="RESOLVED">Resolved</SelectItem>
            <SelectItem value="CLOSED">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Priority</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="URGENT">Urgent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Ticket Cards */}
      {ticketList.length === 0 ? (
        <div className="text-center py-16">
          <MessageSquare className="h-14 w-14 mx-auto mb-4 text-gray-200" />
          <h3 className="text-lg font-medium text-[#0F172A] mb-1">No tickets found</h3>
          <p className="text-sm text-gray-500">Create a new ticket to get help from our support team.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {ticketList.map((ticket: Ticket) => (
            <Card
              key={ticket.id}
              className="cursor-pointer hover:shadow-md transition-shadow border-gray-200"
              onClick={() => onSelectTicket(ticket.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-[#0F172A] text-sm truncate">{ticket.subject}</h3>
                    <p className="text-xs text-gray-500 mt-1 truncate">{ticket.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-400">
                      <span>#{ticket.id.slice(0, 8)}</span>
                      <span>{formatTime(ticket.createdAt)}</span>
                      <span>{ticket._count?.messages ?? 0} messages</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <Badge variant="outline" className={`text-[10px] ${statusColors[ticket.status] || ''}`}>
                      {statusLabels[ticket.status] || ticket.status}
                    </Badge>
                    <span className={`text-[10px] font-medium ${priorityColors[ticket.priority] || ''}`}>
                      {ticket.priority}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */
export default function SupportPage() {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <SimpleNavbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-[#0F172A] px-6 md:px-16 lg:px-32 py-16 md:py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center gap-3"
          >
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight">
              Support <span className="text-amber-400">Center</span>
            </h1>
            <p className="text-gray-400 max-w-md text-sm">
              Get help with your orders, deliveries, and account. We&apos;re here for you.
            </p>
          </motion.div>
        </section>

        {/* Content */}
        <section className="px-6 md:px-16 lg:px-32 py-10 md:py-14">
          <div className="max-w-3xl mx-auto">
            {/* Top bar */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[#0F172A]">
                {selectedTicketId ? 'Ticket Details' : 'My Tickets'}
              </h2>
              {!selectedTicketId && <NewTicketDialog onCreated={() => queryClient.invalidateQueries({ queryKey: ['support-tickets'] })} />}
            </div>

            {selectedTicketId ? (
              <TicketDetail ticketId={selectedTicketId} onBack={() => setSelectedTicketId(null)} />
            ) : (
              <TicketList onSelectTicket={setSelectedTicketId} />
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
