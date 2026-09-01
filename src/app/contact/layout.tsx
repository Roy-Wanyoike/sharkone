import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us',
  description:
    'Get in touch with the SHARKONE team. We\'re here to help with orders, partnerships, seller onboarding, and general inquiries.',
  openGraph: {
    title: 'Contact SHARKONE',
    description:
      'Get in touch with the SHARKONE team. We\'re here to help with orders, partnerships, seller onboarding, and general inquiries.',
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
