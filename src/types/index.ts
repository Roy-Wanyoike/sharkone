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
