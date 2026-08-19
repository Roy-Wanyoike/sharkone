'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  ExternalLink,
  Menu,
  X,
  Send,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { toast } from 'sonner';
import { Footer } from '@/components/ecommerce/Footer';

/* ------------------------------------------------------------------ */
/*  Minimal Navbar                                                     */
/* ------------------------------------------------------------------ */
function SimpleNavbar() {
  const [open, setOpen] = useState(false);
  const links = [
    { label: 'Home', href: '/' },
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
            className={`text-sm font-medium transition-colors ${l.href === '/contact' ? 'text-amber-600' : 'text-gray-700 hover:text-amber-600'}`}
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
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg md:hidden"
        >
          <div className="flex flex-col p-4 gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`py-2.5 text-sm font-medium px-3 rounded-lg hover:bg-gray-50 ${l.href === '/contact' ? 'text-amber-600' : 'text-gray-700'}`}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </motion.div>
      )}
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/*  Fade-in on scroll wrapper                                          */
/* ------------------------------------------------------------------ */
function FadeIn({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  FAQ data                                                           */
/* ------------------------------------------------------------------ */
const faqs = [
  {
    q: 'How does shipping work on SHARKONE?',
    a: 'Once you place an order, the seller confirms it and a delivery partner is assigned. You can track your order in real-time through the SHARKONE platform. Standard delivery takes 1-3 business days within major cities.',
  },
  {
    q: 'What is your return and refund policy?',
    a: 'You can request a return within 7 days of receiving your item if it is damaged, defective, or not as described. Once approved, refunds are processed to your SharkWallet within 3-5 business days.',
  },
  {
    q: 'How do I become a seller on SHARKONE?',
    a: 'Sign up as a seller, complete your profile, and submit your store details for review. Once approved, you can start listing products immediately. We provide tools for inventory management, order tracking, and analytics.',
  },
  {
    q: 'What payment methods are supported?',
    a: 'SHARKONE supports mobile money (M-Pesa, Airtel Money), bank transfers, debit/credit cards (Visa, Mastercard), and our built-in SharkWallet for seamless in-app payments.',
  },
  {
    q: 'Is SHARKONE available outside Kenya?',
    a: 'Yes! While we started in Kenya, SHARKONE is expanding across East Africa and the broader continent. We currently serve customers and sellers in Kenya, Uganda, Tanzania, Nigeria, and Ghana with more countries coming soon.',
  },
];

/* ------------------------------------------------------------------ */
/*  Contact info cards                                                 */
/* ------------------------------------------------------------------ */
const contactCards = [
  { icon: Mail, label: 'Email', value: 'hello@sharkone.com', href: 'mailto:hello@sharkone.com' },
  { icon: Phone, label: 'Phone', value: '+1 555 123-4567', href: 'tel:+15551234567' },
  { icon: MapPin, label: 'Address', value: 'Nairobi, Kenya', href: undefined },
  { icon: Clock, label: 'Business Hours', value: 'Mon-Fri 9AM-6PM EAT', href: undefined },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !subject || !message.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    setSubmitting(true);
    // Simulate submission
    setTimeout(() => {
      toast.success('Message sent!', { description: 'We\'ll get back to you within 24 hours.' });
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
      setSubmitting(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <SimpleNavbar />

      <main className="flex-1">
        {/* ---- 1. Hero ---- */}
        <section className="bg-[#0F172A] px-6 md:px-16 lg:px-32 py-20 md:py-28 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="flex flex-col items-center gap-4"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight">
              Get in <span className="text-amber-400">Touch</span>
            </h1>
            <p className="text-gray-400 max-w-lg">
              Have a question, feedback, or partnership inquiry? We&apos;d love to hear from you.
            </p>
          </motion.div>
        </section>

        {/* ---- 2. Contact Grid ---- */}
        <section className="px-6 md:px-16 lg:px-32 py-16 md:py-24">
          <div className="grid lg:grid-cols-5 gap-10 max-w-6xl mx-auto">
            {/* Left: Form (3 cols) */}
            <FadeIn className="lg:col-span-3">
              <div className="rounded-2xl border border-gray-200 bg-white p-6 md:p-8">
                <h2 className="text-2xl font-bold text-[#0F172A] mb-1">Send Us a Message</h2>
                <p className="text-gray-500 text-sm mb-6">Fill out the form below and we&apos;ll respond promptly.</p>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        placeholder="Your full name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Select value={subject} onValueChange={setSubject}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a subject" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General Inquiry</SelectItem>
                        <SelectItem value="seller">Become a Seller</SelectItem>
                        <SelectItem value="delivery">Delivery Partnership</SelectItem>
                        <SelectItem value="support">Order Support</SelectItem>
                        <SelectItem value="partnership">Business Partnership</SelectItem>
                        <SelectItem value="press">Press & Media</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      placeholder="Tell us how we can help..."
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-[#0F172A] font-semibold rounded-xl py-6"
                  >
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Sending...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Send className="h-4 w-4" />
                        Send Message
                      </span>
                    )}
                  </Button>
                </form>
              </div>
            </FadeIn>

            {/* Right: Contact Info (2 cols) */}
            <FadeIn delay={0.15} className="lg:col-span-2">
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-[#0F172A] mb-1">Contact Information</h2>
                <p className="text-gray-500 text-sm mb-6">Reach us through any of these channels.</p>

                {contactCards.map((c) => (
                  <div
                    key={c.label}
                    className="flex items-start gap-4 rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                      <c.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{c.label}</p>
                      {c.href ? (
                        <a href={c.href} className="text-[#0F172A] font-medium hover:text-amber-600 transition-colors">
                          {c.value}
                        </a>
                      ) : (
                        <p className="text-[#0F172A] font-medium">{c.value}</p>
                      )}
                    </div>
                  </div>
                ))}

                {/* Quick social links card */}
                <div className="mt-6 rounded-xl border border-gray-200 p-4 bg-gradient-to-br from-slate-50 to-white">
                  <p className="text-sm font-medium text-[#0F172A] mb-3">Follow Us</p>
                  <div className="flex gap-2">
                    {['Twitter', 'Facebook', 'Instagram'].map((s) => (
                      <a
                        key={s}
                        href="#"
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white border border-gray-200 text-gray-600 hover:border-amber-300 hover:text-amber-600 transition-colors"
                      >
                        {s}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* ---- 3. FAQ Section ---- */}
        <section className="px-6 md:px-16 lg:px-32 pb-16 md:pb-24">
          <FadeIn className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <p className="text-amber-600 text-xs font-semibold uppercase tracking-wider mb-3">FAQ</p>
              <h2 className="text-3xl md:text-4xl font-bold text-[#0F172A]">Frequently Asked Questions</h2>
            </div>

            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`}>
                  <AccordionTrigger className="text-[#0F172A] font-medium text-left hover:no-underline">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 leading-relaxed">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </FadeIn>
        </section>

        {/* ---- 4. Map Placeholder ---- */}
        <section className="px-6 md:px-16 lg:px-32 pb-16 md:pb-24">
          <FadeIn className="max-w-5xl mx-auto">
            <div className="text-center mb-8">
              <p className="text-amber-600 text-xs font-semibold uppercase tracking-wider mb-3">Location</p>
              <h2 className="text-3xl md:text-4xl font-bold text-[#0F172A]">Find Us in Nairobi</h2>
            </div>

            <div className="relative rounded-2xl border border-gray-200 overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
              {/* Map visual placeholder */}
              <div className="flex flex-col items-center justify-center py-20 md:py-28 px-6 text-center">
                <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                  <MapPin className="h-8 w-8 text-amber-600" />
                </div>
                <p className="text-[#0F172A] font-semibold text-lg">Nairobi, Kenya</p>
                <p className="text-gray-500 text-sm mt-1">SHARKONE Headquarters</p>
                <a
                  href="https://maps.google.com/?q=Nairobi,Kenya"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    variant="outline"
                    className="mt-6 rounded-xl border-gray-300 text-[#0F172A] hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View on Google Maps
                  </Button>
                </a>
              </div>
            </div>
          </FadeIn>
        </section>
      </main>

      <Footer />
    </div>
  );
}
