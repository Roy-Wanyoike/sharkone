export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice: number | null;
  image: string;
  images: string | null;
  rating: number;
  reviewCount: number;
  stock: number;
  featured: boolean;
  categoryId: string;
  sellerId?: string;
  sellerName?: string;
  category?: Category;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  description: string | null;
}

export interface HeroSlide {
  id: string;
  title: string;
  subtitle: string | null;
  ctaText: string;
  ctaLink: string | null;
  image: string;
  order: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type Role = 'buyer' | 'seller' | 'delivery';

export interface Seller {
  id: string;
  userId: string;
  storeName: string;
  storeSlug: string;
  storeDescription: string | null;
  storeLogo: string | null;
  rating: number;
  totalSales: number;
  isVerified: boolean;
  commissionRate: number;
  user?: {
    email: string;
    name: string;
  };
  wallet?: {
    balance: number;
    totalEarnings: number;
    pendingClearance: number;
    totalWithdrawn: number;
  };
  _count?: {
    products: number;
  };
}

export interface Order {
  id: string;
  orderNumber: string;
  buyerId: string;
  status: string;
  totalAmount: number;
  platformFee: number;
  sellerEarnings: number;
  deliveryFee: number;
  shippingAddress: string;
  paymentStatus: string;
  paidAt: string | null;
  createdAt: string;
  buyer?: {
    name: string;
    email: string;
  };
}

export interface Delivery {
  id: string;
  orderId: string;
  deliveryPersonId: string | null;
  status: string;
  pickupOtp: string | null;
  deliveryOtp: string | null;
  deliveredAt: string | null;
  notes: string | null;
  createdAt: string;
  order?: {
    orderNumber: string;
    totalAmount: number;
    shippingAddress: string;
    buyer?: {
      name: string;
    };
  };
}

export interface Transaction {
  id: string;
  userId: string;
  type: string;
  amount: number;
  status: string;
  orderId: string | null;
  description: string | null;
  createdAt: string;
}

export interface Wallet {
  id: string;
  sellerId: string;
  balance: number;
  totalEarnings: number;
  totalWithdrawn: number;
  pendingClearance: number;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  data: string | null;
  createdAt: string;
}
