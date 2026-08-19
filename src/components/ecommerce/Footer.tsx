'use client';

import { ShoppingBag, Facebook, Instagram, Twitter, Mail, Phone } from 'lucide-react';

export function Footer() {
  return (
    <footer id="footer" className="bg-gray-950 text-gray-400">
      {/* Main Footer */}
      <div className="flex flex-col md:flex-row items-start justify-center px-6 md:px-16 lg:px-32 gap-10 py-14 border-b border-gray-800/50">
        <div className="w-full md:w-1/2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center">
              <ShoppingBag className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">Bazaar</span>
          </div>
          <p className="mt-6 text-sm leading-relaxed max-w-sm">
            Bazaar is a modern eCommerce platform built for seamless shopping
            experiences. Discover premium products across categories with fast
            delivery, secure payments, and exceptional customer service.
          </p>
          <div className="flex items-center gap-4 mt-6">
            <a
              href="#"
              className="p-2 bg-gray-800 rounded-full hover:bg-amber-600 transition"
              aria-label="Facebook"
            >
              <Facebook className="h-4 w-4" />
            </a>
            <a
              href="#"
              className="p-2 bg-gray-800 rounded-full hover:bg-amber-600 transition"
              aria-label="Instagram"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a
              href="#"
              className="p-2 bg-gray-800 rounded-full hover:bg-amber-600 transition"
              aria-label="Twitter"
            >
              <Twitter className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div className="w-full md:w-1/4">
          <h2 className="font-semibold text-white mb-5">Company</h2>
          <ul className="text-sm space-y-3">
            <li><a className="hover:text-amber-400 transition" href="#">Home</a></li>
            <li><a className="hover:text-amber-400 transition" href="#products">Shop</a></li>
            <li><a className="hover:text-amber-400 transition" href="#footer">About Us</a></li>
            <li><a className="hover:text-amber-400 transition" href="#footer">Contact Us</a></li>
            <li><a className="hover:text-amber-400 transition" href="#">Privacy Policy</a></li>
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
              <span>hello@bazaar.store</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="px-6 md:px-16 lg:px-32 py-4 flex flex-col md:flex-row justify-between items-center gap-2 text-xs">
        <p>Copyright 2026 © Bazaar. All rights reserved.</p>
        <p>Built with Next.js, Tailwind CSS & Prisma</p>
      </div>
    </footer>
  );
}
