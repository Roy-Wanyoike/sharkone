'use client';

import { motion } from 'framer-motion';
import { Truck, Shield, RefreshCw, Headphones } from 'lucide-react';

const badges = [
  {
    icon: <Truck className="h-6 w-6" />,
    title: 'Free Shipping',
    description: 'On orders over $50',
  },
  {
    icon: <Shield className="h-6 w-6" />,
    title: 'Secure Payment',
    description: '100% protected',
  },
  {
    icon: <RefreshCw className="h-6 w-6" />,
    title: 'Easy Returns',
    description: '30-day return policy',
  },
  {
    icon: <Headphones className="h-6 w-6" />,
    title: '24/7 Support',
    description: 'Dedicated support',
  },
];

export function TrustBadges() {
  return (
    <section className="px-6 md:px-16 lg:px-32 py-10">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {badges.map((badge, i) => (
          <motion.div
            key={badge.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-4 p-5 bg-gray-50 rounded-xl"
          >
            <div className="text-amber-600 shrink-0">{badge.icon}</div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">{badge.title}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{badge.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
