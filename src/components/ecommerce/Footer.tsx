'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Facebook, Instagram, Twitter, Mail, Phone, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function Footer() {
  const [email, setEmail] = useState('');

  const handleSubscribe = async () => {
    if (!email.trim() || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.status === 200) {
        toast.info('Already subscribed!', { description: 'This email is already on our list.' });
      } else if (res.ok) {
        toast.success('Subscribed successfully!', {
          description: `We'll send deals to ${email}`,
        });
        setEmail('');
      } else {
        throw new Error('Subscription failed');
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    }
  };

  return (
    <footer id="footer" role="contentinfo" className="bg-[#0F172A] text-gray-400">
      {/* Newsletter */}
      <div className="px-6 md:px-16 lg:px-32 py-12 border-b border-white/10">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-amber-400 text-xs font-semibold uppercase tracking-wider mb-2">SHARKONE Newsletter</p>
          <h2 className="text-2xl md:text-3xl font-bold text-white">Stay in the Loop</h2>
          <p className="text-gray-400 mt-2 text-sm">
            Subscribe to get exclusive deals, new arrivals, and insider-only discounts.
          </p>
          <div className="flex gap-2 mt-6 max-w-md mx-auto">
            <div className="relative flex-1">
              <label htmlFor="newsletter-email" className="sr-only">Email address</label>
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" aria-hidden="true" />
              <input
                id="newsletter-email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubscribe()}
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-gray-500 outline-none focus:border-amber-500 transition"
              />
            </div>
            <Button
              onClick={handleSubscribe}
              className="bg-[#F59E0B] hover:bg-amber-600 text-[#0F172A] font-semibold rounded-lg px-6 shrink-0"
            >
              <Send className="h-4 w-4 mr-2" />
              Subscribe
            </Button>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="flex flex-col md:flex-row items-start justify-center px-6 md:px-16 lg:px-32 gap-10 py-14 border-b border-white/10">
        <div className="w-full md:w-1/2">
          <div className="flex items-center gap-2.5">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M16 4C14 4 10 8 8 12C6 16 6 22 8 26C10 28 14 28 16 28C18 28 22 28 24 26C26 22 26 16 24 12C22 8 18 4 16 4Z" fill="#F59E0B" />
              <path d="M16 4C15 4 13 6 12 8C11 10 11 14 12 16C13 17 15 17 16 17C17 17 19 17 20 16C21 14 21 10 20 8C19 6 17 4 16 4Z" fill="white" />
            </svg>
            <span className="text-xl font-bold tracking-tight">
              <span className="text-white">SHARK</span>
              <span className="text-amber-400">ONE</span>
            </span>
          </div>
          <p className="mt-6 text-sm leading-relaxed max-w-sm">
            SHARKONE is a multi-vendor marketplace connecting buyers, sellers,
            and delivery riders. Shop. Ship. Smile.
          </p>
          <div className="flex items-center gap-3 mt-6">
            <a
              href="#"
              className="p-2 bg-white/5 rounded-full hover:bg-amber-500/20 transition"
              aria-label="Facebook"
            >
              <Facebook className="h-4 w-4" />
            </a>
            <a
              href="#"
              className="p-2 bg-white/5 rounded-full hover:bg-amber-500/20 transition"
              aria-label="Instagram"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a
              href="#"
              className="p-2 bg-white/5 rounded-full hover:bg-amber-500/20 transition"
              aria-label="Twitter"
            >
              <Twitter className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div className="w-full md:w-1/4">
          <h2 className="font-semibold text-white mb-5">Company</h2>
          <ul className="text-sm space-y-3">
            <li><Link className="hover:text-amber-400 transition" href="/">Home</Link></li>
            <li><Link className="hover:text-amber-400 transition" href="/about">About Us</Link></li>
            <li><Link className="hover:text-amber-400 transition" href="/sell">Become a Seller</Link></li>
            <li><Link className="hover:text-amber-400 transition" href="/contact">Contact</Link></li>
            <li><Link className="hover:text-amber-400 transition" href="/track">Track Order</Link></li>
          </ul>
        </div>

        <div className="w-full md:w-1/4">
          <h2 className="font-semibold text-white mb-5">Get in Touch</h2>
          <div className="text-sm space-y-3">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-amber-500" />
              <span>+1 (555) 123-4567</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-amber-500" />
              <span>hello@sharkone.com</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="px-6 md:px-16 lg:px-32 py-4 flex flex-col md:flex-row justify-between items-center gap-2 text-xs">
        <p>Copyright 2026 &copy; SHARKONE. All rights reserved.</p>
        <p>Shop. Ship. Smile.</p>
      </div>
    </footer>
  );
}
