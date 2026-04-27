import { Smartphone, Laptop, Users, Zap, Package, Gift } from 'lucide-react';

export const productTemplates = [
  { 
    id: 'software', 
    name: 'Software & Apps', 
    icon: Smartphone, 
    color: 'from-blue-400 to-purple-400',
    description: 'Digital solutions that solve real problems',
    examples: ['Mobile App', 'Web Platform', 'SaaS Tool', 'Desktop Software'],
    pricing: { low: 9.99, mid: 49.99, high: 199.99 }
  },
  { 
    id: 'hardware', 
    name: 'Hardware & Gadgets', 
    icon: Laptop, 
    color: 'from-gray-400 to-blue-400',
    description: 'Physical products that enhance daily life',
    examples: ['Smart Device', 'Wearable Tech', 'Home Gadget', 'Professional Tool'],
    pricing: { low: 29.99, mid: 149.99, high: 499.99 }
  },
  { 
    id: 'service', 
    name: 'Services & Consulting', 
    icon: Users, 
    color: 'from-green-400 to-blue-400',
    description: 'Professional expertise delivered personally',
    examples: ['Consulting', 'Design Service', 'Coaching', 'Support'],
    pricing: { low: 99, mid: 299, high: 999 }
  },
  { 
    id: 'digital', 
    name: 'Digital Products', 
    icon: Zap, 
    color: 'from-yellow-400 to-orange-400',
    description: 'Creative content and digital experiences',
    examples: ['Online Course', 'E-book', 'Template Pack', 'Digital Art'],
    pricing: { low: 19.99, mid: 97, high: 297 }
  },
  { 
    id: 'physical', 
    name: 'Physical Goods', 
    icon: Package, 
    color: 'from-pink-400 to-red-400',
    description: 'Tangible products people love to own',
    examples: ['Apparel', 'Accessories', 'Home Goods', 'Collectibles'],
    pricing: { low: 24.99, mid: 79.99, high: 199.99 }
  },
  { 
    id: 'subscription', 
    name: 'Subscription Box', 
    icon: Gift, 
    color: 'from-purple-400 to-pink-400',
    description: 'Recurring delight delivered regularly',
    examples: ['Monthly Box', 'Premium Membership', 'Content Access', 'VIP Club'],
    pricing: { low: 9.99, mid: 29.99, high: 99.99 }
  }
];

export const statusOptions = [
  { value: 'development', label: 'In Development', emoji: '🔨', color: 'bg-blue-100 text-blue-700' },
  { value: 'active', label: 'Ready to Launch', emoji: '🚀', color: 'bg-green-100 text-green-700' },
  { value: 'inactive', label: 'On Hold', emoji: '⏸️', color: 'bg-gray-100 text-gray-700' }
];